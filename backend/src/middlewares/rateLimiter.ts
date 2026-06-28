import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';

interface RateLimitConfig {
  keyGenerator: (req: Request) => string[];
  limits: { key: string; max: number; ttl: number }[];
  message: string;
}

function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const keys = config.keyGenerator(req);

      for (let i = 0; i < config.limits.length; i++) {
        const limit = config.limits[i];
        const fullKey = keys[i];
        const current = await redis.get(fullKey);
        const count = current ? parseInt(current, 10) : 0;

        if (count >= limit.max) {
          throw new AppError(config.message, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Reusable Redis-based rate limiter generator
function createRedisRateLimiter(prefix: string, max: number, ttlSeconds: number, message: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      // For authenticated routes (like upload), we can key by userId, otherwise IP
      const userId = (req as any).user?.id;
      const keySuffix = userId ? `user:${userId}` : `ip:${ip}`;
      const key = `ratelimit:${prefix}:${keySuffix}`;

      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= max) {
        throw new AppError(message, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS);
      }

      const multi = redis.multi();
      multi.incr(key);
      if (!current) {
        multi.expire(key, ttlSeconds);
      }
      await multi.exec();

      next();
    } catch (err) {
      next(err);
    }
  };
}

// Global rate limit: 1000 requests per 15 minutes per IP (safe for heavy users, prevents bot spam)
export const globalRateLimit = createRedisRateLimiter(
  'global',
  1000,
  900, // 15 minutes
  'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút'
);

// Auth routes rate limit: 20 requests per 15 minutes per IP
export const authRateLimit = createRedisRateLimiter(
  'auth',
  20,
  900, // 15 minutes
  'Quá nhiều yêu cầu xác thực từ IP này. Vui lòng thử lại sau 15 phút'
);

// OTP routes rate limit: 3 requests per 3 minutes per IP
export const otpRateLimit = createRedisRateLimiter(
  'otp',
  3,
  180, // 3 minutes
  'Vui lòng đợi 3 phút trước khi yêu cầu hoặc xác thực mã OTP mới'
);

// Upload routes rate limit: 20 uploads per 15 minutes per user/IP
export const uploadRateLimit = createRedisRateLimiter(
  'upload',
  20,
  900, // 15 minutes
  'Bạn đã vượt quá giới hạn tải lên ảnh (tối đa 20 ảnh mỗi 15 phút). Vui lòng thử lại sau.'
);

// Rate limit: 5 login fails per 15min per email + 20 per hour per IP
export const loginRateLimit = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email;

    if (email) {
      const emailKey = `login:fail:email:${email}`;
      const emailCount = await redis.get(emailKey);
      if (emailCount && parseInt(emailCount, 10) >= 5) {
        const ttl = await redis.ttl(emailKey);
        const minutes = Math.max(1, Math.ceil(ttl / 60));
        throw new AppError(`Tài khoản tạm bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutes} phút`, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS);
      }
    }

    const ipKey = `login:fail:ip:${ip}`;
    const ipCount = await redis.get(ipKey);
    if (ipCount && parseInt(ipCount, 10) >= 20) {
      const ttl = await redis.ttl(ipKey);
      const minutes = Math.max(1, Math.ceil(ttl / 60));
      throw new AppError(`Quá nhiều lần đăng nhập thất bại từ IP này. Vui lòng thử lại sau ${minutes} phút`, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS);
    }

    next();
  } catch (err) {
    next(err);
  }
};
