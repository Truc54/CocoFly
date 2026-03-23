import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { AppError } from '../utils/AppError';

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
          throw new AppError(config.message, 429);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Registration rate limit removed — validation errors should not count against the user

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
        throw new AppError(`Tài khoản tạm bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutes} phút`, 429);
      }
    }

    const ipKey = `login:fail:ip:${ip}`;
    const ipCount = await redis.get(ipKey);
    if (ipCount && parseInt(ipCount, 10) >= 20) {
      const ttl = await redis.ttl(ipKey);
      const minutes = Math.max(1, Math.ceil(ttl / 60));
      throw new AppError(`Quá nhiều lần đăng nhập thất bại từ IP này. Vui lòng thử lại sau ${minutes} phút`, 429);
    }

    next();
  } catch (err) {
    next(err);
  }
};
