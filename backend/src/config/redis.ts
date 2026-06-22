import Redis from 'ioredis';
import { env } from './env';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requires null (no retry limit)
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined, // TLS for Upstash
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

export default redis;
