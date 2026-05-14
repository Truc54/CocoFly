import { Queue } from 'bullmq';
import { env } from '../config/env';

export const paymentQueue = new Queue('payment-lifecycle', {
  connection: {
    host: new URL(env.REDIS_URL).hostname || 'localhost',
    port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

paymentQueue.on('error', (err) => {
  console.error('❌ Payment Queue error:', err.message);
});

const PAYMENT_TIMEOUT_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function schedulePaymentTimeout(auctionId: string, buyerId: string): Promise<void> {
  await paymentQueue.add(
    'payment-timeout',
    { auctionId, buyerId },
    {
      delay: PAYMENT_TIMEOUT_MS,
      jobId: `payment-timeout-${auctionId}-${buyerId}`,
    },
  );

  console.log(`💳 Scheduled payment timeout for auction ${auctionId} (48h)`);
}
