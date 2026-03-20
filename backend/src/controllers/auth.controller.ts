import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { incrementRegisterCounter } from '../middlewares/rateLimiter';

const authService = new AuthService();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName } = req.body;
      const result = await authService.register(email, password, fullName);

      // Increment rate limit counter after successful registration
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      await incrementRegisterCounter(ip);

      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyOtp(email, code);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.resendOtp(email);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const result = await authService.login(email, password, ip);

      // Set refresh token as HttpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      if (!token) {
        res.status(401).json({ success: false, message: 'Refresh token không được cung cấp' });
        return;
      }

      const result = await authService.refreshToken(token);

      // Rotation — set new cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME];
      if (token) {
        await authService.logout(token);
      }

      // Clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
    } catch (err) {
      next(err);
    }
  }
}
