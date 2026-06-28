import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';

/**
 * Controller Layer:
 * Handles HTTP requests for payment operations.
 * Extracts data from req, calls Service, formats response.
 */
export class PaymentController {
  private paymentService = new PaymentService();

  // POST /api/payments/:id/initiate — Buyer starts payment
  async initiatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { method, shippingInfo } = req.body; // 'vnpay' | 'momo' | 'banking', shippingInfo: { addressLine, phone }
      const userId = (req as any).user?.userId;
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.socket.remoteAddress as string) ||
        '127.0.0.1';

      const result = await this.paymentService.initiatePayment(id, userId, method, ipAddress, shippingInfo);

      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/vnpay/return — VNPay redirects buyer back here
  async vnpayReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/vnpay/ipn — VNPay server-to-server callback
  async vnpayIPN(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.paymentService.handleVNPayReturn(
        req.query as Record<string, string>,
      );
      // VNPay expects specific response format
      res.status(HttpStatus.OK).json({
        RspCode: result.success ? '00' : '99',
        Message: result.success ? 'Confirm Success' : 'Confirm Fail',
      });
    } catch {
      res.status(HttpStatus.OK).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  // POST /api/payments/momo/ipn — MoMo server-to-server callback
  async momoIPN(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.paymentService.handleMoMoIPN(req.body);
      // MoMo expects 204 for success
      res.status(HttpStatus.NO_CONTENT).send();
    } catch {
      res.status(HttpStatus.NO_CONTENT).send();
    }
  }

  // GET /api/payments/momo/return — MoMo redirects buyer back
  async momoReturn(req: Request, res: Response): Promise<void> {
    try {
      // Process MoMo return exactly like IPN to update DB synchronously during localhost dev
      const result = await this.paymentService.handleMoMoIPN(req.query);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const params = new URLSearchParams({
        success: result.success.toString(),
        paymentId: result.paymentId,
        message: result.message,
      });
      res.redirect(`${frontendUrl}/payments/result?${params.toString()}`);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/payments/result?success=false&message=${encodeURIComponent(error.message)}`);
    }
  }

  // POST /api/payments/:id/confirm — Admin confirms banking transfer
  async confirmBanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminId = (req as any).user?.userId as string;
      await this.paymentService.confirmBankingPayment(id, adminId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Đã xác nhận thanh toán' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/:id/refund — Admin refunds payment
  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { amount, reason } = req.body;
      const adminId = (req as any).user?.userId as string;
      await this.paymentService.processRefund(id, amount, reason, adminId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Hoàn tiền thành công' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/auction/:auctionId — Get payment by auction
  async getByAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const payment = await this.paymentService.getPaymentByAuction(auctionId);
      if (!payment) {
        throw new AppError('Không tìm thấy thanh toán', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/:id — Get payment by ID
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await this.paymentService.getPaymentById(id);
      if (!payment) {
        throw new AppError('Không tìm thấy thanh toán', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/my/:role — Get user's payments (buyer/seller)
  async getMyPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const role = req.params.role as 'buyer' | 'seller';
      if (role !== 'buyer' && role !== 'seller') {
        throw new AppError('Role phải là buyer hoặc seller', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }
      const payments = await this.paymentService.getMyPayments(userId, role);
      res.status(HttpStatus.OK).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/payments/:id/confirm-shipping — Seller confirms shipment
  async confirmShipping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id as string;
      const sellerId = (req as any).user?.userId;

      await this.paymentService.confirmShipping(paymentId, sellerId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Đã xác nhận giao hàng' });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/payments/:id/confirm-delivery — Buyer confirms receipt
  async confirmDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id as string;
      const buyerId = (req as any).user?.userId;

      await this.paymentService.confirmDelivery(paymentId, buyerId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Đã xác nhận nhận hàng' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/:id/dispute — Buyer opens a dispute
  async openDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id as string;
      const { reason } = req.body;
      const userId = (req as any).user?.userId;

      await this.paymentService.openDispute(paymentId, userId, reason);
      res.status(HttpStatus.CREATED).json({ success: true, message: 'Gửi khiếu nại thành công' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/dispute/:id — Get dispute details (buyer/seller)
  async getDisputeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputeId = req.params.id as string;
      const userId = (req as any).user?.userId;

      const dispute = await this.paymentService.getDisputeById(disputeId, userId);
      res.status(HttpStatus.OK).json({ success: true, data: dispute });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/payments/dispute/:id/respond — Seller responds/appeals dispute
  async respondDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputeId = req.params.id as string;
      const { response } = req.body;
      const userId = (req as any).user?.userId;

      const dispute = await this.paymentService.respondDispute(disputeId, userId, response);
      res.status(HttpStatus.OK).json({ success: true, message: 'Gửi phản hồi khiếu nại thành công', data: dispute });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments/dispute/by-auction/:auctionId — Get dispute details by auction ID
  async getDisputeByAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const userId = (req as any).user?.userId;

      const dispute = await this.paymentService.getDisputeByAuction(auctionId, userId);
      res.status(HttpStatus.OK).json({ success: true, data: dispute });
    } catch (error) {
      next(error);
    }
  }
}
