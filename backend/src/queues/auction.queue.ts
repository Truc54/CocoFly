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
    { delay: Math.max(delay, 0), jobId: `activate:${auctionId}` },
  );

  console.log(`📅 Scheduled auction ${auctionId} activation in ${Math.round(delay / 1000)}s`);
}
