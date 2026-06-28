import { ErrorCode } from './ErrorCode';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // If errorCode is provided, use it; otherwise, derive it from the statusCode
    this.errorCode = errorCode || AppError.deriveErrorCode(statusCode);
    
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private static deriveErrorCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return ErrorCode.BAD_REQUEST;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      case 429:
        return ErrorCode.TOO_MANY_REQUESTS;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}

