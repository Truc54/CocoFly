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

// Rate limit: 3 registrations per hour per IP
export const registerRateLimit = createRateLimiter({
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return [`register:ip:${ip}`];
  },
  limits: [{ key: 'register:ip', max: 3, ttl: 3600 }],
  message: 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau',
});

// Increment register counter (called after successful registration in service)
export async function incrementRegisterCounter(ip: string): Promise<void> {
  const key = `register:ip:${ip}`;
  await redis.incr(key);
  await redis.expire(key, 3600);
}

// Rate limit: 5 login fails per 15min per email + 20 per hour per IP
export const loginRateLimit = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email;

    if (email) {
      const emailCount = await redis.get(`login:fail:email:${email}`);
      if (emailCount && parseInt(emailCount, 10) >= 5) {
        throw new AppError('Tài khoản tạm bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút', 429);
      }
    }

    const ipCount = await redis.get(`login:fail:ip:${ip}`);
    if (ipCount && parseInt(ipCount, 10) >= 20) {
      throw new AppError('Quá nhiều lần đăng nhập thất bại từ IP này. Vui lòng thử lại sau', 429);
    }

    next();
  } catch (err) {
    next(err);
  }
};
