import prisma from '../config/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

/**
 * Repository Layer:
 * Pure database queries for Payment operations.
 */
export class PaymentRepository {

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        auction: {
          select: {
            id: true, finalPrice: true, status: true,
            item: { select: { id: true, title: true, media: { select: { cdnUrl: true } } } },
          },
        },
        buyer: { select: { id: true, fullName: true, email: true } },
        seller: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async findByAuctionId(auctionId: string) {
    return prisma.payment.findFirst({
      where: { auctionId, status: { not: 'failed' } },
      include: {
        auction: {
          select: {
            id: true, finalPrice: true, status: true,
            item: { select: { id: true, title: true, media: { select: { cdnUrl: true } } } },
          },
        },
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingByAuctionAndBuyer(auctionId: string, buyerId: string) {
    return prisma.payment.findFirst({
      where: { auctionId, buyerId, status: 'pending' },
    });
  }

  async updateStatus(id: string, data: {
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: Date;
    refundedAt?: Date;
    paymentMethod?: PaymentMethod;
    note?: string;
  }) {
    return prisma.payment.update({ where: { id }, data });
  }

  async findPaymentsByBuyer(buyerId: string) {
    return prisma.payment.findMany({
      where: { buyerId },
      include: {
        auction: {
          select: { id: true, finalPrice: true, item: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPaymentsBySeller(sellerId: string) {
    return prisma.payment.findMany({
      where: { sellerId },
      include: {
        auction: {
          select: { id: true, finalPrice: true, item: { select: { title: true } } },
        },
        buyer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async hasActivePaidPayment(auctionId: string): Promise<boolean> {
    const count = await prisma.payment.count({
      where: { auctionId, status: { in: ['paid', 'escrow_released'] } },
    });
    return count > 0;
  }

  async findForShipping(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        sellerId: true,
        buyerId: true,
        auctionId: true,
        status: true,
        shippingStatus: true,
        auction: { select: { item: { select: { title: true } } } },
      },
    });
  }
}
