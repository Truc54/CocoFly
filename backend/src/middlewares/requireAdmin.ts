import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    next(new AppError('Không có quyền truy cập, yêu cầu quyền quản trị viên', 403));
    return;
  }
  next();
}
