import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    next(new AppError('Không có quyền truy cập, yêu cầu quyền quản trị viên', HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN));
    return;
  }
  next();
}
