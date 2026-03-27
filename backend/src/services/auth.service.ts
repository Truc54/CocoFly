import bcrypt from 'bcrypt';
import crypto from 'crypto';
import redis from '../config/redis';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { AppError } from '../utils/AppError';

const BCRYPT_COST = 12;
const OTP_TTL = 600;        // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_TTL = 60; // 60 seconds

export class AuthService {
  private userRepository = new UserRepository();
  private tokenService = new TokenService();
  private emailService = new EmailService();

  // ──────────────────────────────────────────
  // 1. REGISTER
  // ──────────────────────────────────────────
  async register(email: string, password: string, fullName: string) {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      if (existingUser.isVerified) {
        throw new AppError('Email đã được sử dụng', 409);
      }
      // Unverified user — delete and re-create
      await this.userRepository.deleteById(existingUser.id);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    await this.userRepository.create({ email, passwordHash, fullName });

    // Generate OTP
    const otpCode = this.generateOtp();
    await redis.set(`otp:${email}`, otpCode, 'EX', OTP_TTL);
    await redis.del(`otp:attempts:${email}`);

    // Send email
    await this.emailService.sendOtpEmail(email, otpCode);

    return { message: 'Mã OTP đã được gửi đến email của bạn' };
  }

  // ──────────────────────────────────────────
  // 2. VERIFY OTP
  // ──────────────────────────────────────────
  async verifyOtp(email: string, code: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    // Check attempts
    const attemptsStr = await redis.get(`otp:attempts:${email}`);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới', 429);
    }

    // Check OTP exists
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp) {
      throw new AppError('Mã OTP đã hết hạn', 410);
    }

    // Compare OTP
    if (storedOtp !== code) {
      await redis.incr(`otp:attempts:${email}`);
      await redis.expire(`otp:attempts:${email}`, OTP_TTL);
      const remaining = OTP_MAX_ATTEMPTS - 1 - attempts;
      throw new AppError(`Mã không đúng. Còn ${remaining} lần thử`, 400);
    }

    // Success
    await redis.del(`otp:${email}`);
    await redis.del(`otp:attempts:${email}`);
    await this.userRepository.updateIsVerified(user.id, true);

    return { message: 'Xác minh thành công' };
  }

  // ──────────────────────────────────────────
  // 2.1 RESEND OTP
  // ──────────────────────────────────────────
  async resendOtp(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    // Check cooldown
    const cooldownTtl = await redis.ttl(`otp:cooldown:${email}`);
    if (cooldownTtl > 0) {
      throw new AppError(`Vui lòng chờ ${cooldownTtl} giây trước khi gửi lại`, 429);
    }

    // Generate new OTP — overwrites old key (old code invalidated)
    const otpCode = this.generateOtp();
    await redis.set(`otp:${email}`, otpCode, 'EX', OTP_TTL);
    await redis.del(`otp:attempts:${email}`);
    await redis.set(`otp:cooldown:${email}`, '1', 'EX', OTP_COOLDOWN_TTL);

    await this.emailService.sendOtpEmail(email, otpCode);

    return { message: 'Mã OTP mới đã được gửi' };
  }

  // ──────────────────────────────────────────
  // 3. LOGIN
  // ──────────────────────────────────────────
  async login(email: string, password: string, ip: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Tài khoản chưa xác minh. Kiểm tra email của bạn', 403);
    }

    if (user.isBanned) {
      throw new AppError(`Tài khoản đã bị khóa: ${user.banReason || 'Vi phạm chính sách'}`, 403);
    }

    if (!user.passwordHash) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment fail counters
      await redis.incr(`login:fail:email:${email}`);
      await redis.expire(`login:fail:email:${email}`, 900);
      await redis.incr(`login:fail:ip:${ip}`);
      await redis.expire(`login:fail:ip:${ip}`, 3600);

      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // Success — clear fail counters
    await redis.del(`login:fail:email:${email}`);
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens (no passwordHash in payload)
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    await this.tokenService.saveRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ──────────────────────────────────────────
  // 5. REFRESH TOKEN
  // ──────────────────────────────────────────
  async refreshToken(token: string) {
    const userId = await this.tokenService.verifyRefreshToken(token);
    if (!userId) {
      throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 401);
    }

    // Rotation: delete old, create new
    await this.tokenService.deleteRefreshToken(token);

    const newAccessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const newRefreshToken = this.tokenService.generateRefreshToken();
    await this.tokenService.saveRefreshToken(newRefreshToken, user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ──────────────────────────────────────────
  // 6. LOGOUT
  // ──────────────────────────────────────────
  async logout(token: string) {
    await this.tokenService.deleteRefreshToken(token);
    return { message: 'Đăng xuất thành công' };
  }

  // ──────────────────────────────────────────
  // 7. FORGOT PASSWORD — Send OTP
  // ──────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.isVerified) {
      throw new AppError('Email không tồn tại hoặc chưa được xác minh', 404);
    }

    // Check cooldown
    const cooldownTtl = await redis.ttl(`otp:cooldown:reset:${email}`);
    if (cooldownTtl > 0) {
      throw new AppError(`Vui lòng chờ ${cooldownTtl} giây trước khi gửi lại`, 429);
    }

    const otpCode = this.generateOtp();
    await redis.set(`otp:reset:${email}`, otpCode, 'EX', OTP_TTL);
    await redis.del(`otp:attempts:reset:${email}`);
    await redis.set(`otp:cooldown:reset:${email}`, '1', 'EX', OTP_COOLDOWN_TTL);

    await this.emailService.sendPasswordResetOtpEmail(email, otpCode);

    return { message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn' };
  }

  // ──────────────────────────────────────────
  // 8. VERIFY RESET OTP
  // ──────────────────────────────────────────
  async verifyResetOtp(email: string, code: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    // Check attempts
    const attemptsStr = await redis.get(`otp:attempts:reset:${email}`);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới', 429);
    }

    const storedOtp = await redis.get(`otp:reset:${email}`);
    if (!storedOtp) {
      throw new AppError('Mã OTP đã hết hạn', 410);
    }

    if (storedOtp !== code) {
      await redis.incr(`otp:attempts:reset:${email}`);
      await redis.expire(`otp:attempts:reset:${email}`, OTP_TTL);
      const remaining = OTP_MAX_ATTEMPTS - 1 - attempts;
      throw new AppError(`Mã không đúng. Còn ${remaining} lần thử`, 400);
    }

    // OTP correct — clean up and issue a reset token
    await redis.del(`otp:reset:${email}`);
    await redis.del(`otp:attempts:reset:${email}`);

    const resetToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`reset:token:${email}`, resetToken, 'EX', OTP_TTL);

    return { message: 'Xác thực OTP thành công', resetToken };
  }

  // ──────────────────────────────────────────
  // 9. RESET PASSWORD
  // ──────────────────────────────────────────
  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Email không tồn tại', 404);
    }

    const storedToken = await redis.get(`reset:token:${email}`);
    if (!storedToken || storedToken !== token) {
      throw new AppError('Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await this.userRepository.updatePassword(user.id, passwordHash);
    await redis.del(`reset:token:${email}`);

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}
