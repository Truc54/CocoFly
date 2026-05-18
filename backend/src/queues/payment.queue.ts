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
const REMINDER_24H_MS = 24 * 60 * 60 * 1000;     // 24 hours before deadline
const REMINDER_6H_MS = 42 * 60 * 60 * 1000;      // 6 hours before deadline (48h - 6h = 42h after creation)
const SHIPPING_TIMEOUT_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const AUTO_CONFIRM_MS = 7 * 24 * 60 * 60 * 1000;     // 7 days after shipped

export async function schedulePaymentTimeout(auctionId: string, buyerId: string): Promise<void> {
  await paymentQueue.add(
    'payment-timeout',
    { auctionId, buyerId },
    {
      delay: PAYMENT_TIMEOUT_MS,
      jobId: `payment-timeout-${auctionId}-${buyerId}`,
    },
  );

  // Schedule reminders
  await paymentQueue.add(
    'payment-reminder',
    { auctionId, buyerId, hoursLeft: 24 },
    {
      delay: REMINDER_24H_MS,
      jobId: `payment-reminder-24h-${auctionId}-${buyerId}`,
    },
  );

  await paymentQueue.add(
    'payment-reminder',
    { auctionId, buyerId, hoursLeft: 6 },
    {
      delay: REMINDER_6H_MS,
      jobId: `payment-reminder-6h-${auctionId}-${buyerId}`,
    },
  );

  console.log(`💳 Scheduled payment timeout + reminders for auction ${auctionId} (48h)`);
}

export async function cancelPaymentTimeout(auctionId: string, buyerId: string): Promise<void> {
  const jobIds = [
    `payment-timeout-${auctionId}-${buyerId}`,
    `payment-reminder-24h-${auctionId}-${buyerId}`,
    `payment-reminder-6h-${auctionId}-${buyerId}`,
  ];

  for (const jobId of jobIds) {
    const job = await paymentQueue.getJob(jobId);
    if (job) await job.remove();
  }

  console.log(`💳 Cancelled payment timeout for auction ${auctionId}`);
}

export async function scheduleShippingTimeout(paymentId: string, sellerId: string): Promise<void> {
  await paymentQueue.add(
    'shipping-timeout',
    { paymentId, sellerId },
    {
      delay: SHIPPING_TIMEOUT_MS,
      jobId: `shipping-timeout-${paymentId}`,
    },
  );
  console.log(`📦 Scheduled shipping timeout for payment ${paymentId} (5 days)`);
}

export async function scheduleAutoConfirmDelivery(paymentId: string): Promise<void> {
  await paymentQueue.add(
    'auto-confirm-delivery',
    { paymentId },
    {
      delay: AUTO_CONFIRM_MS,
      jobId: `auto-confirm-${paymentId}`,
    },
  );
  console.log(`📦 Scheduled auto-confirm delivery for payment ${paymentId} (7 days)`);
}
