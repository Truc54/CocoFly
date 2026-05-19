import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { AuctionRepository } from '../repositories/auction.repository';
import { schedulePaymentTimeout } from '../queues/payment.queue';
import { Decimal } from '@prisma/client/runtime/library';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

interface PaymentTimeoutPayload {
  auctionId: string;
  buyerId: string;
}

interface PaymentReminderPayload {
  auctionId: string;
  buyerId: string;
  hoursLeft: number;
}

interface ShippingTimeoutPayload {
  paymentId: string;
  sellerId: string;
}

interface AutoConfirmPayload {
  paymentId: string;
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
        case 'payment-reminder':
          await handlePaymentReminder(job.data as PaymentReminderPayload);
          break;
        case 'shipping-timeout':
          await handleShippingTimeout(job.data as ShippingTimeoutPayload);
          break;
        case 'auto-confirm-delivery':
          await handleAutoConfirmDelivery(job.data as AutoConfirmPayload);
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
    where: { auctionId, buyerId, status: { in: ['pending', 'processing'] } },
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
  await notificationService.send({
    userId: buyerId,
    auctionId,
    type: 'payment_due',
    title: 'Thanh toán thất bại!',
    message: 'Bạn đã không thanh toán trong thời gian quy định.',
  });

  // Find runner-up
  const runnerUp = await repo.findRunnerUpBid(auctionId, buyerId);

  if (runnerUp) {
    // Transfer to runner-up


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
    await notificationService.send({
      userId: runnerUp.bidderId,
      auctionId,
      type: 'auction_won',
      title: 'Cơ hội mua sản phẩm!',
      message: 'Người thắng trước đã không thanh toán. Bạn có cơ hội mua sản phẩm này.',
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
      await notificationService.send({
        userId: auction.sellerId,
        auctionId,
        type: 'auction_failed',
        title: 'Đấu giá thất bại!',
        message: 'Không có người mua thanh toán. Sản phẩm đã được mở khóa.',
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

// ── Payment Reminder Handler ─────────────────────────────────────────────
async function handlePaymentReminder(data: PaymentReminderPayload): Promise<void> {
  const { auctionId, buyerId, hoursLeft } = data;

  // Check if payment is still pending (buyer might have already paid)
  const payment = await prisma.payment.findFirst({
    where: { auctionId, buyerId, status: { in: ['pending', 'processing'] } },
  });

  if (!payment) {
    console.log(`💳 Payment already resolved for auction ${auctionId}, skipping reminder`);
    return;
  }

  await notificationService.send({
    userId: buyerId,
    auctionId,
    type: 'payment_due',
    title: `⏰ Còn ${hoursLeft} giờ để thanh toán!`,
    message: `Bạn cần thanh toán ${Number(payment.amount).toLocaleString()}₫ trong ${hoursLeft} giờ tới, nếu không quyền mua sẽ bị hủy.`,
  });

  console.log(`💳 Sent ${hoursLeft}h payment reminder for auction ${auctionId}`);
}

// ── Shipping Timeout Handler (5 days) ────────────────────────────────────
async function handleShippingTimeout(data: ShippingTimeoutPayload): Promise<void> {
  const { paymentId, sellerId } = data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, shippingStatus: true, buyerId: true, auctionId: true, amount: true },
  });

  if (!payment || payment.status !== 'paid' || payment.shippingStatus !== 'pending') {
    console.log(`📦 Shipping already handled for payment ${paymentId}, skipping`);
    return;
  }

  // Auto-refund buyer
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'refunded',
      refundedAt: new Date(),
      note: 'Tự động hoàn tiền: Seller không gửi hàng trong 5 ngày',
    },
  });

  // Notify buyer
  await notificationService.send({
    userId: payment.buyerId,
    auctionId: payment.auctionId,
    type: 'payment_confirmed',
    title: 'Hoàn tiền tự động!',
    message: 'Người bán không gửi hàng đúng hạn. Bạn đã được hoàn tiền.',
  });

  // Notify seller
  await notificationService.send({
    userId: sellerId,
    auctionId: payment.auctionId,
    type: 'system',
    title: 'Cảnh báo: Không gửi hàng đúng hạn!',
    message: 'Bạn đã không gửi hàng trong 5 ngày. Tiền đã được hoàn cho người mua.',
  });

  console.log(`📦 Auto-refunded payment ${paymentId} — seller ${sellerId} did not ship`);
}

// ── Auto Confirm Delivery Handler (7 days after shipped) ─────────────────
async function handleAutoConfirmDelivery(data: AutoConfirmPayload): Promise<void> {
  const { paymentId } = data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, shippingStatus: true, buyerId: true, sellerId: true, auctionId: true, sellerAmount: true },
  });

  if (!payment || payment.status !== 'paid' || payment.shippingStatus !== 'shipped') {
    console.log(`📦 Delivery already confirmed for payment ${paymentId}, skipping`);
    return;
  }

  // Auto-confirm: mark as delivered + release escrow
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      shippingStatus: 'delivered',
      deliveredAt: new Date(),
      status: 'escrow_released',
    },
  });

  // Notify buyer
  await notificationService.send({
    userId: payment.buyerId,
    auctionId: payment.auctionId,
    type: 'system',
    title: 'Tự động xác nhận nhận hàng!',
    message: 'Đã quá 7 ngày kể từ khi gửi hàng. Giao dịch được tự động hoàn tất.',
  });

  // Notify seller: escrow released
  await notificationService.send({
    userId: payment.sellerId,
    auctionId: payment.auctionId,
    type: 'payment_confirmed',
    title: 'Tiền đã được giải phóng!',
    message: `${Number(payment.sellerAmount).toLocaleString()}₫ đã được chuyển vào tài khoản của bạn.`,
  });

  console.log(`📦 Auto-confirmed delivery for payment ${paymentId}, escrow released`);
}
