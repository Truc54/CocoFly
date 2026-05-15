import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { AuctionRepository } from '../repositories/auction.repository';
import { schedulePaymentTimeout } from '../queues/payment.queue';
import { Decimal } from '@prisma/client/runtime/library';

interface PaymentTimeoutPayload {
  auctionId: string;
  buyerId: string;
}

const REDIS_CONNECTION = {
  host: new URL(env.REDIS_URL).hostname || 'localhost',
  port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
};

const MAX_NON_PAYMENT_STRIKES = 3;
const repo = new AuctionRepository();

let paymentWorker: Worker | null = null;

export async function startPaymentWorker(): Promise<void> {
  paymentWorker = new Worker(
    'payment-lifecycle',
    async (job: Job) => {
      switch (job.name) {
        case 'payment-timeout':
          await handlePaymentTimeout(job.data as PaymentTimeoutPayload);
          break;
        default:
          console.warn(`⚠️ Unknown payment job type: ${job.name}`);
      }
    },
    {
      connection: REDIS_CONNECTION,
      concurrency: 5,
    },
  );

  paymentWorker.on('completed', (job) => {
    console.log(`✅ Payment job ${job.id} (${job.name}) completed`);
  });

  paymentWorker.on('failed', (job, err) => {
    console.error(`❌ Payment job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  console.log('💳 Payment worker started');
}

async function handlePaymentTimeout(data: PaymentTimeoutPayload): Promise<void> {
  const { auctionId, buyerId } = data;

  // Find the pending payment for this auction+buyer
  const payment = await prisma.payment.findFirst({
    where: { auctionId, buyerId, status: 'pending' },
    select: { id: true, status: true, amount: true, sellerId: true },
  });

  if (!payment) {
    console.log(`💳 No pending payment found for auction ${auctionId}, buyer ${buyerId}`);
    return;
  }

  // Mark payment as failed
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'failed' },
  });

  // Increment non-payment strikes
  const updatedUser = await prisma.user.update({
    where: { id: buyerId },
    data: { nonPaymentStrikes: { increment: 1 } },
    select: { nonPaymentStrikes: true },
  });

  // Auto-ban if too many strikes
  if (updatedUser.nonPaymentStrikes >= MAX_NON_PAYMENT_STRIKES) {
    await prisma.user.update({
      where: { id: buyerId },
      data: {
        accountStatus: 'banned',
        banReason: `Tự động khóa: ${MAX_NON_PAYMENT_STRIKES} lần không thanh toán`,
      },
    });
    console.log(`🚫 User ${buyerId} auto-banned for non-payment`);
  }

  // Notify buyer about failed payment
  await prisma.notification.create({
    data: {
      userId: buyerId,
      auctionId,
      type: 'payment_due',
      title: 'Thanh toán thất bại',
      message: 'Bạn đã không thanh toán trong thời gian quy định.',
    },
  });

  // Find runner-up
  const runnerUp = await repo.findRunnerUpBid(auctionId, buyerId);

  if (runnerUp) {
    // Transfer to runner-up
    const platformFee = Number(payment.amount) * 0.05;
    const amount = Number(payment.amount);

    // Create new payment for runner-up
    await prisma.payment.create({
      data: {
        auctionId,
        buyerId: runnerUp.bidderId,
        sellerId: payment.sellerId,
        amount: new Decimal(Number(runnerUp.amount)),
        platformFee: new Decimal(Number(runnerUp.amount) * 0.05),
        sellerAmount: new Decimal(Number(runnerUp.amount) * 0.95),
        paymentMethod: 'banking',
        status: 'pending',
      },
    });

    // Update auction winner
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        winnerId: runnerUp.bidderId,
        winningBidId: runnerUp.id,
        finalPrice: runnerUp.amount,
      },
    });

    // Notify runner-up
    await prisma.notification.create({
      data: {
        userId: runnerUp.bidderId,
        auctionId,
        type: 'auction_won',
        title: 'Cơ hội mua sản phẩm!',
        message: 'Người thắng trước đã không thanh toán. Bạn có cơ hội mua sản phẩm này.',
      },
    });

    // Schedule new timeout for runner-up
    await schedulePaymentTimeout(auctionId, runnerUp.bidderId);

    console.log(`💳 Payment transferred to runner-up ${runnerUp.bidderId} for auction ${auctionId}`);
  } else {
    // No runner-up — auction truly failed
    await prisma.auction.update({
      where: { id: auctionId },
      data: { winnerId: null, winningBidId: null },
    });

    // Free the item
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { itemId: true, sellerId: true },
    });

    if (auction) {
      await prisma.item.update({
        where: { id: auction.itemId },
        data: { status: 'active' },
      });

      // Notify seller
      await prisma.notification.create({
        data: {
          userId: auction.sellerId,
          auctionId,
          type: 'auction_failed',
          title: 'Đấu giá thất bại',
          message: 'Không có người mua thanh toán. Sản phẩm đã được mở khóa.',
        },
      });
    }

    console.log(`💳 No runner-up for auction ${auctionId}, marking as failed`);
  }
}

export async function stopPaymentWorker(): Promise<void> {
  if (paymentWorker) {
    await paymentWorker.close();
    paymentWorker = null;
    console.log('🛑 Payment worker stopped');
  }
}
