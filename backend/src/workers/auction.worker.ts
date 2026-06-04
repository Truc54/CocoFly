import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { AuctionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/prisma';
import { scheduleAuctionActivation, scheduleAuctionEnd, scheduleHealthCheck } from '../queues/auction.queue';
import { schedulePaymentTimeout } from '../queues/payment.queue';
import { AuctionRepository } from '../repositories/auction.repository';
import { NotificationService } from '../services/notification.service';

const auctionRepo = new AuctionRepository();
const notificationService = new NotificationService();

// Helper: safely emit via Socket.IO if initialized
function tryBroadcast(auctionId: string, event: string, data: any): void {
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.to(`auction:${auctionId}`).emit(event, data);
  } catch {
    // Socket.IO not yet initialized (during startup recovery) — skip
  }
}

interface AuctionJobPayload {
  auctionId: string;
}

const REDIS_CONNECTION = {
  host: new URL(env.REDIS_URL).hostname || 'localhost',
  port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
};

let auctionWorker: Worker | null = null;

// ── Startup Recovery (full) ──────────────────────────────────────────────────
// Runs ONCE on server start. Fixes stale statuses AND re-registers all missing
// Redis jobs in case Redis was wiped between restarts.
async function recoverAuctions(): Promise<void> {
  const now = new Date();

  // 1. Activate overdue scheduled auctions (scheduledStart has passed)
  const overdueScheduled = await prisma.auction.findMany({
    where: { status: AuctionStatus.scheduled, scheduledStart: { lte: now } },
    select: { id: true, endTime: true },
  });

  if (overdueScheduled.length > 0) {
    console.log(`🔁 Recovering ${overdueScheduled.length} overdue scheduled auction(s)...`);
    for (const auction of overdueScheduled) {
      if (auction.endTime <= now) {
        await handleEndAuction({ auctionId: auction.id });
      } else {
        await handleActivateAuction({ auctionId: auction.id });
      }
    }
  }

  // 2. Close active auctions whose endTime has already passed
  const expiredActive = await prisma.auction.findMany({
    where: { status: AuctionStatus.active, endTime: { lte: now } },
    select: { id: true },
  });

  if (expiredActive.length > 0) {
    console.log(`🔁 Closing ${expiredActive.length} expired active auction(s)...`);
    for (const auction of expiredActive) {
      await handleEndAuction({ auctionId: auction.id });
    }
  }

  // 3 & 4. Re-register ALL future jobs in Redis (in case Redis was wiped)
  // This is intentionally thorough — only runs on startup, not in health-check.
  const futureScheduled = await prisma.auction.findMany({
    where: { status: AuctionStatus.scheduled, scheduledStart: { gt: now } },
    select: { id: true, scheduledStart: true },
  });
  for (const auction of futureScheduled) {
    await scheduleAuctionActivation(auction.id, auction.scheduledStart);
  }
  if (futureScheduled.length > 0) {
    console.log(`📅 Re-registered ${futureScheduled.length} future activation job(s)`);
  }

  const runningAuctions = await prisma.auction.findMany({
    where: { status: AuctionStatus.active, endTime: { gt: now } },
    select: { id: true, endTime: true },
  });
  for (const auction of runningAuctions) {
    await scheduleAuctionEnd(auction.id, auction.endTime);
  }
  if (runningAuctions.length > 0) {
    console.log(`⏰ Re-registered ${runningAuctions.length} end job(s)`);
  }
}

// ── Periodic Health-Check (lightweight) ──────────────────────────────────────
// Runs every 5 minutes in production. Only fixes auctions with WRONG status
// (time already passed but status not updated). Does NOT re-schedule future
// jobs — those are already in Redis and don't need to be touched.
async function fixStaleAuctions(): Promise<void> {
  const now = new Date();

  const overdueScheduled = await prisma.auction.findMany({
    where: { status: AuctionStatus.scheduled, scheduledStart: { lte: now } },
    select: { id: true, endTime: true },
  });

  for (const auction of overdueScheduled) {
    if (auction.endTime <= now) {
      await handleEndAuction({ auctionId: auction.id });
    } else {
      await handleActivateAuction({ auctionId: auction.id });
    }
  }

  const expiredActive = await prisma.auction.findMany({
    where: { status: AuctionStatus.active, endTime: { lte: now } },
    select: { id: true },
  });

  for (const auction of expiredActive) {
    await handleEndAuction({ auctionId: auction.id });
  }

  const total = overdueScheduled.length + expiredActive.length;
  if (total > 0) {
    console.log(`💓 Health-check fixed ${total} stale auction(s)`);
  }
}

// ── Worker setup ──────────────────────────────────────────────────────────────

export async function startAuctionWorker(): Promise<void> {
  auctionWorker = new Worker(
    'auction-lifecycle',
    async (job: Job) => {
      switch (job.name) {
        case 'activate-auction':
          await handleActivateAuction(job.data as AuctionJobPayload);
          break;
        case 'end-auction':
          await handleEndAuction(job.data as AuctionJobPayload);
          break;
        case 'health-check':
          // Lightweight: only fixes genuinely stale statuses (time passed, status wrong).
          // Does NOT re-schedule future jobs — they already exist in Redis.
          await fixStaleAuctions();
          break;
        default:
          console.warn(`⚠️ Unknown job type: ${job.name}`);
      }
    },
    {
      connection: REDIS_CONNECTION,
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

  // Fix any stale auctions from before this startup
  await recoverAuctions();

  // Register the repeatable health-check job for continuous production monitoring
  await scheduleHealthCheck();
}

// ── Job Handlers ──────────────────────────────────────────────────────────────

async function handleActivateAuction(data: AuctionJobPayload): Promise<void> {
  const { auctionId } = data;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { status: true, endTime: true },
  });

  if (!auction) {
    console.warn(`⚠️ Auction ${auctionId} not found, skipping activation`);
    return;
  }

  if (auction.status !== AuctionStatus.scheduled) {
    console.warn(`⚠️ Auction ${auctionId} is '${auction.status}', skipping activation`);
    return;
  }

  await prisma.auction.update({
    where: { id: auctionId },
    data: { status: AuctionStatus.active, startTime: new Date() },
  });

  console.log(`🔔 Auction ${auctionId} is now ACTIVE`);

  // Schedule the end job (idempotent: BullMQ deduplicates via jobId)
  await scheduleAuctionEnd(auctionId, auction.endTime);
}

async function handleEndAuction(data: AuctionJobPayload): Promise<void> {
  const { auctionId } = data;

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { status: true, sellerId: true, itemId: true },
  });

  if (!auction) {
    console.warn(`⚠️ Auction ${auctionId} not found, skipping end`);
    return;
  }

  if (auction.status === AuctionStatus.ended || auction.status === AuctionStatus.cancelled) {
    console.warn(`⚠️ Auction ${auctionId} already '${auction.status}', skipping`);
    return;
  }

  // Find highest valid bid
  const highestBid = await auctionRepo.findHighestBid(auctionId);

  if (highestBid) {
    // ── Auction has bids → determine winner ──────────────────────────────
    const finalPrice = Number(highestBid.amount);

    await auctionRepo.endAuctionWithWinner(
      auctionId,
      highestBid.bidderId,
      highestBid.id,
      finalPrice,
    );

    // Create Payment record (pending, 48h timeout)
    const platformFee = finalPrice * 0.05;
    await prisma.payment.create({
      data: {
        auctionId,
        buyerId: highestBid.bidderId,
        sellerId: auction.sellerId,
        amount: new Decimal(finalPrice),
        platformFee: new Decimal(platformFee),
        sellerAmount: new Decimal(finalPrice - platformFee),
        paymentMethod: 'banking',
        status: 'pending',
        paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await schedulePaymentTimeout(auctionId, highestBid.bidderId);

    // Notifications
    await notificationService.sendMany([
      {
        userId: highestBid.bidderId,
        auctionId,
        type: 'auction_won',
        title: 'Chúc mừng! Bạn đã thắng đấu giá',
        message: `Vui lòng thanh toán ${finalPrice.toLocaleString()} VNĐ trong 48 giờ.`,
      },
      {
        userId: auction.sellerId,
        auctionId,
        type: 'auction_ending',
        title: 'Đấu giá đã kết thúc!',
        message: `Sản phẩm đã được bán với giá ${finalPrice.toLocaleString()} VNĐ.`,
      },
    ]);

    // Broadcast via Socket.IO
    tryBroadcast(auctionId, 'auction:ended', {
      auctionId,
      winnerId: highestBid.bidderId,
      finalPrice,
    });

    console.log(`🏁 Auction ${auctionId} ENDED — winner: ${highestBid.bidderId}, price: ${finalPrice}`);
  } else {
    // ── No bids → auction failed ─────────────────────────────────────────
    await auctionRepo.endAuctionFailed(auctionId);

    await notificationService.send({
      userId: auction.sellerId,
      auctionId,
      type: 'auction_failed',
      title: 'Đấu giá thất bại!',
      message: 'Không có lượt đặt giá nào. Sản phẩm đã được mở khóa.',
    });

    tryBroadcast(auctionId, 'auction:ended', {
      auctionId,
      winnerId: null,
      finalPrice: null,
    });

    console.log(`🏁 Auction ${auctionId} FAILED — no bids`);
  }

  // Close chat room
  await prisma.chatRoom.updateMany({
    where: { auctionId },
    data: { isActive: false },
  });
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

export async function stopAuctionWorker(): Promise<void> {
  if (auctionWorker) {
    await auctionWorker.close();
    auctionWorker = null;
    console.log('🛑 Auction worker stopped');
  }
}
