import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import redis from '../config/redis';
import { env } from '../config/env';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_TTL = 2592000; // 30 days in seconds

interface AccessTokenPayload {
  userId: string;
  role: string;
  email: string;
}

export class TokenService {
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload & { iat: number; exp: number } {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as AccessTokenPayload & { iat: number; exp: number };
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async saveRefreshToken(token: string, userId: string): Promise<void> {
    await redis.set(`refresh:${token}`, userId, 'EX', REFRESH_TOKEN_TTL);
  }

  async verifyRefreshToken(token: string): Promise<string | null> {
    return redis.get(`refresh:${token}`);
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await redis.del(`refresh:${token}`);
  }
}
