import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import prisma from '../config/prisma';

interface ActivateAuctionPayload {
  auctionId: string;
}

let auctionWorker: Worker | null = null;

export function startAuctionWorker(): void {
  auctionWorker = new Worker(
    'auction-lifecycle',
    async (job: Job) => {
      switch (job.name) {
        case 'activate-auction':
          await handleActivateAuction(job.data as ActivateAuctionPayload);
          break;
        default:
          console.warn(`⚠️ Unknown job type: ${job.name}`);
      }
    },
    {
      connection: {
        host: new URL(env.REDIS_URL).hostname || 'localhost',
        port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
      },
      concurrency: 10,
    },
  );

  auctionWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} (${job.name}) completed`);
  });

  auctionWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  console.log('🔄 Auction worker started');
}

async function handleActivateAuction(data: ActivateAuctionPayload): Promise<void> {
  const { auctionId } = data;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { status: true },
  });

  if (!auction) {
    console.warn(`⚠️ Auction ${auctionId} not found, skipping activation`);
    return;
  }

  if (auction.status !== 'scheduled') {
    console.warn(`⚠️ Auction ${auctionId} status is '${auction.status}', skipping activation`);
    return;
  }

  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      status: 'active',
      startTime: new Date(),
    },
  });

  console.log(`🔔 Auction ${auctionId} is now ACTIVE`);
}

export async function stopAuctionWorker(): Promise<void> {
  if (auctionWorker) {
    await auctionWorker.close();
    auctionWorker = null;
    console.log('🛑 Auction worker stopped');
  }
}
