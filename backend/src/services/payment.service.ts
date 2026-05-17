import { PaymentRepository } from '../repositories/payment.repository';
import { createVNPayUrl, verifyVNPayReturn, VNPAY_RESPONSE_CODES } from '../gateways/vnpay.adapter';
import { createMoMoPayment, verifyMoMoIPN, MOMO_RESULT_CODES } from '../gateways/momo.adapter';
import { cancelPaymentTimeout, scheduleShippingTimeout } from '../queues/payment.queue';
import prisma from '../config/prisma';
import { PaymentMethod } from '@prisma/client';

/**
 * Service Layer:
 * Contains ALL business logic for payment processing.
 * Orchestrates gateways, database, and notifications.
 */
export class PaymentService {
  private paymentRepo = new PaymentRepository();

  // ── Initiate Payment (choose method → get redirect URL) ────────────────
  async initiatePayment(paymentId: string, method: PaymentMethod, ipAddress: string): Promise<{
    paymentUrl?: string;
    bankingInfo?: { bankName: string; accountNumber: string; accountName: string; content: string };
    message: string;
  }> {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) throw new Error('Không tìm thấy yêu cầu thanh toán');
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

    // Update payment method
    await this.paymentRepo.updateStatus(paymentId, {
      status: 'processing',
      paymentMethod: method,
    });

    switch (method) {
      case 'vnpay': {
        const url = createVNPayUrl({
          orderId: paymentId,
          amount,
          orderInfo,
          ipAddress,
        });
        return { paymentUrl: url, message: 'Chuyển hướng đến VNPay' };
      }

      case 'momo': {
        const result = await createMoMoPayment({
          orderId: paymentId,
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
      return { success: false, paymentId: result.orderId, message: 'Chữ ký không hợp lệ' };
    }

    const payment = await this.paymentRepo.findById(result.orderId);
    if (!payment) {
      return { success: false, paymentId: result.orderId, message: 'Không tìm thấy thanh toán' };
    }

    // Already paid (idempotency)
    if (payment.status === 'paid' || payment.status === 'escrow_released') {
      return { success: true, paymentId: result.orderId, message: 'Đã thanh toán' };
    }

    if (result.responseCode === '00') {
      await this.markAsPaid(payment.id, result.transactionId);
      return { success: true, paymentId: result.orderId, message: 'Thanh toán thành công' };
    }

    // Payment failed — revert to pending so buyer can retry
    await this.paymentRepo.updateStatus(payment.id, { status: 'pending' });
    const errorMsg = VNPAY_RESPONSE_CODES[result.responseCode] || 'Giao dịch thất bại';
    return { success: false, paymentId: result.orderId, message: errorMsg };
  }

  // ── MoMo IPN Handler ───────────────────────────────────────────────────
  async handleMoMoIPN(data: any): Promise<{ success: boolean; message: string }> {
    const result = verifyMoMoIPN(data);

    if (!result.isValid) {
      return { success: false, message: 'Chữ ký không hợp lệ' };
    }

    const payment = await this.paymentRepo.findById(result.orderId);
    if (!payment) {
      return { success: false, message: 'Không tìm thấy thanh toán' };
    }

    if (payment.status === 'paid' || payment.status === 'escrow_released') {
      return { success: true, message: 'Đã thanh toán' };
    }

    if (result.resultCode === 0) {
      await this.markAsPaid(payment.id, result.transactionId);
      return { success: true, message: 'Thanh toán thành công' };
    }

    await this.paymentRepo.updateStatus(payment.id, { status: 'pending' });
    const errorMsg = MOMO_RESULT_CODES[result.resultCode] || result.message;
    return { success: false, message: errorMsg };
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

    await this.paymentRepo.updateStatus(paymentId, {
      status: 'refunded',
      refundedAt: new Date(),
      note: `Hoàn tiền ${amount.toLocaleString()}₫ | Lý do: ${reason} | Admin: ${adminId}`,
    });

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: payment.buyerId,
        auctionId: payment.auctionId,
        type: 'payment_confirmed',
        title: 'Hoàn tiền thành công',
        message: `Bạn đã được hoàn ${amount.toLocaleString()}₫. Lý do: ${reason}`,
      },
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

    // Notify buyer: payment confirmed
    await prisma.notification.create({
      data: {
        userId: payment.buyerId,
        auctionId: payment.auctionId,
        type: 'payment_confirmed',
        title: 'Thanh toán thành công!',
        message: `Thanh toán ${Number(payment.amount).toLocaleString()}₫ cho "${payment.auction.item.title}" đã được xác nhận.`,
      },
    });

    // Notify seller: buyer has paid, ship within 5 days
    await prisma.notification.create({
      data: {
        userId: payment.sellerId,
        auctionId: payment.auctionId,
        type: 'payment_confirmed',
        title: 'Người mua đã thanh toán!',
        message: `Vui lòng gửi hàng trong vòng 5 ngày.`,
      },
    });
  }
}
