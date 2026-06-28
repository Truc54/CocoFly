import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { ErrorCode } from '../utils/ErrorCode';
import { HttpStatus } from '../utils/HttpStatus';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed.',
        details,
      },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Lỗi hệ thống. Vui lòng thử lại sau',
      debug: {
        message: err.message,
        stack: err.stack,
      },
    },
  });
}

