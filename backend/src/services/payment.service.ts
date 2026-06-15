import { PaymentRepository } from '../repositories/payment.repository';
import { createVNPayUrl, verifyVNPayReturn, VNPAY_RESPONSE_CODES } from '../gateways/vnpay.adapter';
import { createMoMoPayment, verifyMoMoIPN, MOMO_RESULT_CODES } from '../gateways/momo.adapter';
import { cancelPaymentTimeout, scheduleShippingTimeout } from '../queues/payment.queue';
import prisma from '../config/prisma';
import { PaymentMethod } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { NotificationService } from './notification.service';

/**
 * Service Layer:
 * Contains ALL business logic for payment processing.
 * Orchestrates gateways, database, and notifications.
 */
export class PaymentService {
  private paymentRepo = new PaymentRepository();

  // ── Initiate Payment (choose method → get redirect URL) ────────────────
  async initiatePayment(paymentId: string, userId: string, method: PaymentMethod, ipAddress: string, shippingInfo?: { addressLine: string; phone: string }): Promise<{
    paymentUrl?: string;
    bankingInfo?: { bankName: string; accountNumber: string; accountName: string; content: string };
    message: string;
  }> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error('Không tìm thấy yêu cầu thanh toán');
    if (payment.buyerId !== userId) throw new Error('Không có quyền truy cập thanh toán này');
    if (payment.status !== 'pending' && payment.status !== 'processing') {
      throw new Error('Thanh toán đã được xử lý hoặc hết hạn');
    }

    // Check deadline
    if (payment.paymentDeadline && new Date() > payment.paymentDeadline) {
      throw new Error('Đã hết hạn thanh toán. Vui lòng liên hệ hỗ trợ.');
    }

    const amount = Number(payment.amount);
    const itemTitle = payment.auction?.item?.title || 'Sản phẩm đấu giá';
    const orderInfo = `CocoFly - Thanh toan ${itemTitle}`;

    let note = payment.note || '';
    if (shippingInfo && shippingInfo.addressLine) {
      const shippingText = `\n[Giao hàng] SĐT: ${shippingInfo.phone || 'N/A'} | Đ/C: ${shippingInfo.addressLine}`;
      note += shippingText;
    }

    // Update payment method
    await this.paymentRepo.updateStatus(paymentId, {
      status: 'processing',
      paymentMethod: method,
      note: note.trim() || undefined,
    });

    switch (method) {
      case 'vnpay': {
        const uniqueOrderId = `${paymentId}_${Date.now()}`;
        const url = createVNPayUrl({
          orderId: uniqueOrderId,
          amount,
          orderInfo,
          ipAddress,
        });
        return { paymentUrl: url, message: 'Chuyển hướng đến VNPay' };
      }

      case 'momo': {
        const uniqueOrderId = `${paymentId}_${Date.now()}`;
        const result = await createMoMoPayment({
          orderId: uniqueOrderId,
          amount,
          orderInfo,
        });

        if (result.resultCode !== 0) {
          // Revert to pending if MoMo rejects
          await this.paymentRepo.updateStatus(paymentId, { status: 'pending' });
          const errorMsg = MOMO_RESULT_CODES[result.resultCode] || result.message;
          throw new Error(`MoMo: ${errorMsg}`);
        }

        return { paymentUrl: result.payUrl, message: 'Chuyển hướng đến MoMo' };
      }

      case 'banking': {
        // Manual banking: show bank info + buyer uploads proof later
        await this.paymentRepo.updateStatus(paymentId, { status: 'pending', paymentMethod: 'banking' });
        return {
          bankingInfo: {
            bankName: 'Ngân hàng TMCP Ngoại Thương (Vietcombank)',
            accountNumber: '1234567890',
            accountName: 'COCOFLY PLATFORM',
            content: `COCOFLY ${paymentId.slice(0, 8).toUpperCase()}`,
          },
          message: 'Vui lòng chuyển khoản theo thông tin bên dưới',
        };
      }

      default:
        throw new Error('Phương thức thanh toán không hợp lệ');
    }
  }

  // ── VNPay IPN Handler ──────────────────────────────────────────────────
  async handleVNPayReturn(query: Record<string, string>): Promise<{
    success: boolean;
    paymentId: string;
    message: string;
  }> {
    const result = verifyVNPayReturn(query);

    if (!result.isValid) {
      return { success: false, paymentId: result.orderId.split('_')[0], message: 'Chữ ký không hợp lệ' };
    }

    const paymentId = result.orderId.split('_')[0];
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      return { success: false, paymentId, message: 'Không tìm thấy thanh toán' };
    }

    // Already paid (idempotency)
    if (payment.status === 'paid' || payment.status === 'escrow_released') {
      return { success: true, paymentId, message: 'Đã thanh toán' };
    }

    if (result.responseCode === '00') {
      await this.markAsPaid(payment.id, result.transactionId);
      return { success: true, paymentId, message: 'Thanh toán thành công' };
    }

    // Payment failed — revert to pending so buyer can retry
    await this.paymentRepo.updateStatus(payment.id, { status: 'pending' });
    const errorMsg = VNPAY_RESPONSE_CODES[result.responseCode] || 'Giao dịch thất bại';
    return { success: false, paymentId, message: errorMsg };
  }

  // ── MoMo IPN Handler ───────────────────────────────────────────────────
  async handleMoMoIPN(data: any): Promise<{ success: boolean; paymentId: string; message: string }> {
    const result = verifyMoMoIPN(data);
    const originalPaymentId = result.orderId ? result.orderId.split('_')[0] : '';

    if (!result.isValid) {
      return { success: false, paymentId: originalPaymentId, message: 'Chữ ký không hợp lệ' };
    }

    const paymentId = result.orderId.split('_')[0];
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      return { success: false, paymentId, message: 'Không tìm thấy thanh toán' };
    }

    if (payment.status === 'paid' || payment.status === 'escrow_released') {
      return { success: true, paymentId, message: 'Đã thanh toán' };
    }

    if (result.resultCode == 0 || result.resultCode == 9000) {
      try {
        await this.markAsPaid(payment.id, result.transactionId);
        return { success: true, paymentId, message: 'Thanh toán thành công' };
      } catch (err: any) {
        console.error('MoMo markAsPaid Error:', err);
        return { success: false, paymentId, message: err.message };
      }
    }

    await this.paymentRepo.updateStatus(payment.id, { status: 'pending' });
    const code = Number(result.resultCode);
    const errorMsg = MOMO_RESULT_CODES[code] || result.message || 'Lỗi giao dịch';
    return { success: false, paymentId, message: errorMsg };
  }

  // ── Admin: Confirm Banking Payment ─────────────────────────────────────
  async confirmBankingPayment(paymentId: string, adminId: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error('Không tìm thấy thanh toán');
    if (payment.paymentMethod !== 'banking') throw new Error('Chỉ xác nhận chuyển khoản ngân hàng');
    if (payment.status !== 'pending') throw new Error('Thanh toán không ở trạng thái chờ');

    await this.markAsPaid(paymentId, `BANKING_CONFIRMED_BY_${adminId}`);
  }

  // ── Admin: Refund ──────────────────────────────────────────────────────
  async processRefund(paymentId: string, amount: number, reason: string, adminId: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error('Không tìm thấy thanh toán');
    if (payment.status !== 'paid') throw new Error('Chỉ hoàn tiền thanh toán đã xác nhận');

    if (amount > Number(payment.amount)) {
      throw new Error('Số tiền hoàn không được vượt quá số tiền thanh toán');
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
          note: `Hoàn tiền ${amount.toLocaleString()}₫ | Lý do: ${reason} | Admin: ${adminId}`,
        },
      }),
      prisma.user.update({
        where: { id: payment.buyerId },
        data: {
          balance: { increment: amount },
        },
      }),
    ]);

    const notificationService = new NotificationService();
    // Notify buyer
    await notificationService.send({
      userId: payment.buyerId,
      auctionId: payment.auctionId,
      type: 'payment_confirmed',
      title: 'Hoàn tiền thành công',
      message: `Bạn đã được hoàn ${amount.toLocaleString()}₫. Lý do: ${reason}`,
    });
  }

  // ── Get Payment Info ───────────────────────────────────────────────────
  async getPaymentByAuction(auctionId: string) {
    return this.paymentRepo.findByAuctionId(auctionId);
  }

  async getPaymentById(paymentId: string) {
    return this.paymentRepo.findById(paymentId);
  }

  async getMyPayments(userId: string, role: 'buyer' | 'seller') {
    return role === 'buyer'
      ? this.paymentRepo.findPaymentsByBuyer(userId)
      : this.paymentRepo.findPaymentsBySeller(userId);
  }

  // ── Seller: Confirm Shipping ──────────────────────────────────────────────
  async confirmShipping(paymentId: string, sellerId: string): Promise<void> {
    const payment = await this.paymentRepo.findForShipping(paymentId);

    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);
    if (payment.sellerId !== sellerId) throw new AppError('Bạn không có quyền xác nhận giao hàng này', 403);
    if (payment.status !== 'paid') throw new AppError('Thanh toán chưa được xác nhận', 400);
    if (payment.shippingStatus !== 'pending') throw new AppError('Đã xác nhận giao hàng trước đó', 400);

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        shippingStatus: 'shipped',
        shippedAt: new Date(),
      },
    });

    const notificationService = new NotificationService();
    const itemTitle = payment.auction?.item?.title || 'Sản phẩm';

    await notificationService.send({
      userId: payment.buyerId,
      auctionId: payment.auctionId,
      type: 'shipping_update',
      title: 'Người bán đã gửi hàng!',
      message: `Sản phẩm "${itemTitle}" đã được gửi đi. Vui lòng xác nhận khi nhận được hàng.`,
    });
  }

  // ── Buyer: Confirm Delivery ──────────────────────────────────────────────
  async confirmDelivery(paymentId: string, buyerId: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);

    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);
    if (payment.buyerId !== buyerId) throw new AppError('Bạn không có quyền thực hiện thao tác này', 403);
    if (payment.status !== 'paid') throw new AppError('Thanh toán chưa hoàn tất', 400);
    if (payment.shippingStatus !== 'shipped') throw new AppError('Đơn hàng chưa được giao, không thể xác nhận', 400);

    // Update payment to delivered, release escrow, and update seller balance
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          shippingStatus: 'delivered',
          deliveredAt: new Date(),
          status: 'escrow_released',
        },
      }),
      prisma.user.update({
        where: { id: payment.sellerId },
        data: {
          balance: { increment: payment.sellerAmount }
        }
      })
    ]);

    const notificationService = new NotificationService();
    // Notify seller
    await notificationService.send({
      userId: payment.sellerId,
      auctionId: payment.auctionId,
      type: 'payment_confirmed',
      title: 'Người mua đã nhận hàng!',
      message: `${Number(payment.sellerAmount).toLocaleString()}₫ đã được chuyển vào tài khoản của bạn.`,
    });

    // Notify buyer
    await notificationService.send({
      userId: payment.buyerId,
      auctionId: payment.auctionId,
      type: 'system',
      title: 'Xác nhận nhận hàng thành công',
      message: 'Cảm ơn bạn đã sử dụng CocoFly. Đừng quên đánh giá sản phẩm nhé!',
    });
  }

  // ── Private: Mark as paid + cancel timeout + schedule shipping ─────────
  private async markAsPaid(paymentId: string, transactionId: string): Promise<void> {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        transactionId,
      },
      include: {
        auction: { select: { id: true, sellerId: true, item: { select: { title: true } } } },
      },
    });

    // Cancel payment timeout + reminders (buyer paid in time)
    await cancelPaymentTimeout(payment.auctionId, payment.buyerId);

    // Schedule shipping timeout (seller has 5 days to ship)
    await scheduleShippingTimeout(paymentId, payment.sellerId);

    const notificationService = new NotificationService();

    // Notify buyer: payment confirmed
    await notificationService.send({
      userId: payment.buyerId,
      auctionId: payment.auctionId,
      type: 'payment_confirmed',
      title: 'Thanh toán thành công!',
      message: `Thanh toán ${Number(payment.amount).toLocaleString()}₫ cho "${payment.auction.item.title}" đã được xác nhận.`,
    });

    // Notify seller: buyer has paid, ship within 5 days
    await notificationService.send({
      userId: payment.sellerId,
      auctionId: payment.auctionId,
      type: 'payment_confirmed',
      title: 'Người mua đã thanh toán!',
      message: `Vui lòng gửi hàng trong vòng 5 ngày.`,
    });
  }

  // ── Buyer: Open Dispute ────────────────────────────────────────────────
  async openDispute(paymentId: string, userId: string, reason: string): Promise<void> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);
    if (payment.buyerId !== userId) {
      throw new AppError('Bạn không có quyền thực hiện khiếu nại này', 403);
    }

    if (payment.status !== 'paid' && payment.status !== 'escrow_released') {
      throw new AppError('Chỉ có thể khiếu nại đơn hàng đã thanh toán hoặc đã nhận hàng', 400);
    }

    // Check if a dispute already exists for this payment
    const existingDispute = await prisma.dispute.findFirst({
      where: { paymentId },
    });
    if (existingDispute) {
      throw new AppError('Đơn hàng này đã có khiếu nại đang được xử lý', 400);
    }

    // Create dispute in transaction
    const dispute = await prisma.$transaction(async (tx) => {
      return await tx.dispute.create({
        data: {
          paymentId,
          openedById: userId,
          reason,
          status: 'pending',
        },
      });
    });

    const itemTitle = payment.auction?.item?.title || 'Sản phẩm';
    const notificationService = new NotificationService();

    // 1. Notify Seller
    await notificationService.send({
      userId: payment.sellerId,
      auctionId: payment.auctionId,
      type: 'dispute_opened',
      title: 'Đơn hàng của bạn bị khiếu nại!',
      message: `Người mua đã mở khiếu nại cho sản phẩm "${itemTitle}" với lý do: "${reason}". Vui lòng phản hồi hoặc liên hệ ban quản trị để giải quyết.`,
      metadata: { disputeId: dispute.id },
    });

    // 2. Notify Buyer
    await notificationService.send({
      userId: payment.buyerId,
      auctionId: payment.auctionId,
      type: 'dispute_opened',
      title: 'Gửi khiếu nại thành công',
      message: `Yêu cầu khiếu nại của bạn cho sản phẩm "${itemTitle}" đã được gửi lên hệ thống. Ban quản trị sẽ tiến hành xác minh và xử lý sớm nhất.`,
      metadata: { disputeId: dispute.id },
    });
  }

  // ── Get Dispute by ID ──────────────────────────────────────────────────
  async getDisputeById(disputeId: string, userId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        payment: {
          include: {
            buyer: { select: { id: true, fullName: true, email: true, rating: true } },
            seller: { select: { id: true, fullName: true, email: true, rating: true } },
            auction: {
              include: {
                item: {
                  include: {
                    media: { select: { id: true, cdnUrl: true, type: true } },
                  },
                },
              },
            },
          },
        },
        openedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!dispute) throw new AppError('Không tìm thấy khiếu nại', 404);

    if (dispute.payment.buyerId !== userId && dispute.payment.sellerId !== userId) {
      throw new AppError('Bạn không có quyền xem khiếu nại này', 403);
    }

    return dispute;
  }

  // ── Seller: Respond to Dispute ──────────────────────────────────────────
  async respondDispute(disputeId: string, userId: string, responseText: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        payment: {
          include: {
            auction: {
              include: {
                item: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) throw new AppError('Không tìm thấy khiếu nại', 404);

    if (dispute.payment.sellerId !== userId) {
      throw new AppError('Chỉ người bán của đơn hàng mới có thể phản hồi khiếu nại', 403);
    }

    if (dispute.status !== 'pending') {
      throw new AppError('Khiếu nại này đã được phân xử hoặc đóng', 400);
    }

    if (dispute.sellerResponse) {
      throw new AppError('Bạn đã gửi phản hồi cho khiếu nại này rồi', 400);
    }

    // Update dispute response
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        sellerResponse: responseText,
      },
    });

    // Send notification to buyer
    const notificationService = new NotificationService();
    const itemTitle = dispute.payment.auction?.item?.title || 'Sản phẩm';
    await notificationService.send({
      userId: dispute.payment.buyerId,
      auctionId: dispute.payment.auctionId,
      type: 'system',
      title: 'Người bán đã phản hồi khiếu nại',
      message: `Người bán đã phản hồi yêu cầu khiếu nại của bạn cho sản phẩm "${itemTitle}".`,
      metadata: { disputeId },
    });

    return updatedDispute;
  }

  // ── Get Dispute by Auction ID ──────────────────────────────────────────
  async getDisputeByAuction(auctionId: string, userId: string) {
    const dispute = await prisma.dispute.findFirst({
      where: {
        payment: {
          auctionId,
        },
      },
      include: {
        payment: {
          include: {
            buyer: { select: { id: true, fullName: true, email: true, rating: true } },
            seller: { select: { id: true, fullName: true, email: true, rating: true } },
            auction: {
              include: {
                item: {
                  include: {
                    media: { select: { id: true, cdnUrl: true, type: true } },
                  },
                },
              },
            },
          },
        },
        openedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!dispute) throw new AppError('Không tìm thấy khiếu nại cho phiên đấu giá này', 404);

    if (dispute.payment.buyerId !== userId && dispute.payment.sellerId !== userId) {
      throw new AppError('Bạn không có quyền xem khiếu nại này', 403);
    }

    return dispute;
  }
}
