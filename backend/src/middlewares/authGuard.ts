import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { AppError } from '../utils/AppError';

const tokenService = new TokenService();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
      };
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token không được cung cấp', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = tokenService.verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401));
  }
}
