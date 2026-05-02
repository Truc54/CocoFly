import { Queue } from 'bullmq';
import { env } from '../config/env';

export const auctionQueue = new Queue('auction-lifecycle', {
  connection: {
    host: new URL(env.REDIS_URL).hostname || 'localhost',
    port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

auctionQueue.on('error', (err) => {
  console.error('❌ Auction Queue error:', err.message);
});

export async function scheduleAuctionActivation(auctionId: string, scheduledStart: Date): Promise<void> {
  const delay = scheduledStart.getTime() - Date.now();

  await auctionQueue.add(
    'activate-auction',
    { auctionId },
    { delay: Math.max(delay, 0), jobId: `activate-${auctionId}` },
  );

  console.log(`📅 Scheduled auction ${auctionId} activation in ${Math.round(delay / 1000)}s`);
}

export async function scheduleAuctionEnd(auctionId: string, endTime: Date): Promise<void> {
  const delay = endTime.getTime() - Date.now();

  await auctionQueue.add(
    'end-auction',
    { auctionId },
    { delay: Math.max(delay, 0), jobId: `end-${auctionId}` },
  );

  console.log(`⏰ Scheduled auction ${auctionId} end in ${Math.round(delay / 1000)}s`);
}

// Repeatable health-check: runs every 5 minutes in production to catch auctions
// whose BullMQ jobs were lost (e.g. Redis wiped without server restart).
export async function scheduleHealthCheck(): Promise<void> {
  await auctionQueue.add(
    'health-check',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
      jobId: 'auction-health-check',
    },
  );

  console.log('💓 Auction health-check scheduled (every 5 min)');
}
