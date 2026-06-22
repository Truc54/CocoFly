import { env } from './env';
import type { ConnectionOptions } from 'bullmq';

/**
 * Shared Redis connection config for BullMQ queues & workers.
 * Handles TLS (Upstash rediss://) and password authentication.
 */
export function getBullMQConnection(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);
  const useTls = env.REDIS_URL.startsWith('rediss://');

  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    username: url.username || undefined,
    tls: useTls ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}
