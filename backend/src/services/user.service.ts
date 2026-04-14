import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { AppError } from '../utils/AppError';

export class UserService {
  private userRepository = new UserRepository();
  private tokenService = new TokenService();

  async upgradeToSeller(userId: string, phoneNumber: string) {
    if (!phoneNumber) {
      throw new AppError('Số điện thoại là bắt buộc', 400);
    }

    // 2. Find current user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    if (user.role === 'seller') {
      throw new AppError('Tài khoản đã là người bán', 409);
    }

    // 3. Update role and phone
    await this.userRepository.upgradeToSeller(userId, phoneNumber);

    // 4. Generate new tokens with updated role
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: 'seller',
      email: user.email,
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    await this.tokenService.saveRefreshToken(refreshToken, user.id);

    return {
      message: 'Nâng cấp tài khoản thành công! Bạn đã trở thành người bán.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: 'seller',
        phone: phoneNumber,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
