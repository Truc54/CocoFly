import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

/**
 * Controller Layer:
 * Handles HTTP requests for payment operations.
 * Extracts data from req, calls Service, formats response.
 */
export class PaymentController {
  private paymentService = new PaymentService();

  // POST /api/payments/:id/initiate — Buyer starts payment
  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { method, shippingInfo } = req.body; // 'vnpay' | 'momo' | 'banking', shippingInfo: { addressLine, phone }
      const userId = (req as any).user?.userId;
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.socket.remoteAddress as string) ||
        '127.0.0.1';

      const result = await this.paymentService.initiatePayment(id, userId, method, ipAddress, shippingInfo);

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/payments/vnpay/return — VNPay redirects buyer back here
  async vnpayReturn(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.paymentService.handleVNPayReturn(
        req.query as Record<string, string>,
      );
      // Redirect to frontend with result
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const params = new URLSearchParams({
        success: result.success.toString(),
        paymentId: result.paymentId,
        message: result.message,
      });
      res.redirect(`${frontendUrl}/payments/result?${params.toString()}`);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/payments/vnpay/ipn — VNPay server-to-server callback
  async vnpayIPN(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.paymentService.handleVNPayReturn(
        req.query as Record<string, string>,
      );
      // VNPay expects specific response format
      res.status(200).json({
        RspCode: result.success ? '00' : '99',
        Message: result.success ? 'Confirm Success' : 'Confirm Fail',
      });
    } catch {
      res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  // POST /api/payments/momo/ipn — MoMo server-to-server callback
  async momoIPN(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.paymentService.handleMoMoIPN(req.body);
      // MoMo expects 204 for success
      res.status(204).send();
    } catch {
      res.status(204).send();
    }
  }

  // GET /api/payments/momo/return — MoMo redirects buyer back
  async momoReturn(req: Request, res: Response): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resultCode = req.query.resultCode as string;
    const orderId = req.query.orderId as string;
    const success = resultCode === '0';
    const params = new URLSearchParams({
      success: success.toString(),
      paymentId: orderId || '',
      message: success ? 'Thanh toán thành công' : 'Thanh toán thất bại',
    });
    res.redirect(`${frontendUrl}/payments/result?${params.toString()}`);
  }

  // POST /api/payments/:id/confirm — Admin confirms banking transfer
  async confirmBanking(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminId = (req as any).user?.userId as string;
      await this.paymentService.confirmBankingPayment(id, adminId);
      res.status(200).json({ success: true, message: 'Đã xác nhận thanh toán' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/payments/:id/refund — Admin refunds payment
  async refund(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { amount, reason } = req.body;
      const adminId = (req as any).user?.userId as string;
      await this.paymentService.processRefund(id, amount, reason, adminId);
      res.status(200).json({ success: true, message: 'Hoàn tiền thành công' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/payments/auction/:auctionId — Get payment by auction
  async getByAuction(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const payment = await this.paymentService.getPaymentByAuction(auctionId);
      if (!payment) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
        return;
      }
      res.status(200).json({ success: true, data: payment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/payments/:id — Get payment by ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await this.paymentService.getPaymentById(id);
      if (!payment) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
        return;
      }
      res.status(200).json({ success: true, data: payment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/payments/my/:role — Get user's payments (buyer/seller)
  async getMyPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const role = req.params.role as 'buyer' | 'seller';
      if (role !== 'buyer' && role !== 'seller') {
        res.status(400).json({ success: false, message: 'Role phải là buyer hoặc seller' });
        return;
      }
      const payments = await this.paymentService.getMyPayments(userId, role);
      res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
