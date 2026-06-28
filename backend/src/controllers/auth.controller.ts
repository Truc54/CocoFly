import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';
import { AppError } from '../utils/AppError';

const authService = new AuthService();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body;
      const result = await authService.register(email, password, fullName);
      res.status(HttpStatus.CREATED).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyOtp(email, code);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.resendOtp(email);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const result = await authService.login(email, password, ip);

      // Set refresh token as HttpOnly cookie (fallback)
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(HttpStatus.OK).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];
      if (!token) {
        throw new AppError('Refresh token không được cung cấp', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const result = await authService.refreshToken(token);

      // Rotation — set new cookie (fallback)
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(HttpStatus.OK).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.body.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];
      if (token) {
        await authService.logout(token);
      }

      // Clear cookie (fallback)
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      res.status(HttpStatus.OK).json({ success: true, message: 'Đăng xuất thành công' });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async verifyResetOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyResetOtp(email, code);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, token, newPassword, oldPassword } = req.body;
      const result = await authService.resetPassword(email, token, newPassword, oldPassword);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
