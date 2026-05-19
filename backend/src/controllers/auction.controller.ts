import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';

/**
 * Controller Layer:
 * Responsible ONLY for handling HTTP requests (req, res).
 * Extracts data from body/params/query, calls the Service layer,
 * and formats the final HTTP response. DO NOT put business logic here.
 */
export class AuctionController {
  private auctionService = new AuctionService();

  // ── Create Auction ─────────────────────────────────────────────────────────

  async createAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const result = await this.auctionService.createAuction(sellerId, req.body);

      res.status(201).json({
        success: true,
        message: 'Đấu giá đã được tạo và lên lịch thành công',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Get Single Auction ─────────────────────────────────────────────────────

  async getAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const auction = await this.auctionService.getAuctionById(auctionId);

      res.status(200).json({
        success: true,
        data: auction,
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Listing pages ──────────────────────────────────────────────────────────

  async getLiveAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const sort = (req.query.sort as string) || 'ending_soon';
      const search = (req.query.search as string) || undefined;

      const result = await this.auctionService.getLiveAuctions({ page, limit, categoryId, sort, search });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const period = (req.query.period as string) || 'all';
      const search = (req.query.search as string) || undefined;
      const sort = (req.query.sort as string) || 'starts_soon';

      const result = await this.auctionService.getUpcomingAuctions({ page, limit, categoryId, period, search, sort });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ── Search Suggestions ──────────────────────────────────────────────────

  async getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = (req.query.q as string || '').trim();
      if (q.length < 2) {
        res.json({ success: true, data: [] });
        return;
      }

      const limit = Math.min(10, Math.max(1, parseInt(req.query.limit as string) || 8));
      const status = (req.query.status as string) || 'active';
      const suggestions = await this.auctionService.getSuggestions(q, limit, status);

      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }

  // ── Get Bid History ────────────────────────────────────────────────────────

  async getBidHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

      const result = await this.auctionService.getBidHistory(auctionId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Get User's Bid Status ──────────────────────────────────────────────────

  async getMyBidStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const userId = req.user!.userId;

      const result = await this.auctionService.getUserBidStatus(auctionId, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Decline Payment (Runner-up) ────────────────────────────────────────────

  async declinePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.paymentId as string;
      const userId = req.user!.userId;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, buyerId: true, auctionId: true, status: true },
      });

      if (!payment) throw new AppError('Thanh toán không tồn tại', 404);
      if (payment.buyerId !== userId) throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
      if (payment.status !== 'pending') throw new AppError('Thanh toán không ở trạng thái chờ', 400);

      // Mark payment as failed (runner-up decline — no strike penalty)
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'failed' },
      });

      // Set auction to no winner, free item
      const auction = await prisma.auction.findUnique({
        where: { id: payment.auctionId },
        select: { itemId: true, sellerId: true },
      });

      await prisma.auction.update({
        where: { id: payment.auctionId },
        data: { winnerId: null, winningBidId: null },
      });

      if (auction) {
        await prisma.item.update({
          where: { id: auction.itemId },
          data: { status: 'active' },
        });

        const { NotificationService } = require('../services/notification.service');
        const notificationService = new NotificationService();

        await notificationService.send({
          userId: auction.sellerId,
          auctionId: payment.auctionId,
          type: 'auction_failed',
          title: 'Người mua đã từ chối',
          message: 'Người mua đã từ chối mua sản phẩm. Phiên đấu giá thất bại.',
        });
      }

      res.json({ success: true, message: 'Đã từ chối mua sản phẩm' });
    } catch (err) {
      next(err);
    }
  }

  // ── Seller Auction Management ──────────────────────────────────────────────

  async getMyListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const tab = (req.query.tab as string) || 'ongoing';
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await this.auctionService.getSellerAuctions(sellerId, tab, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const auctionId = req.params.auctionId as string;

      const result = await this.auctionService.updateAuction(auctionId, sellerId, req.body);
      res.json({ success: true, message: 'Cập nhật thành công', data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const auctionId = req.params.auctionId as string;

      await this.auctionService.deleteAuction(auctionId, sellerId);
      res.json({ success: true, message: 'Đã xóa phiên đấu giá' });
    } catch (err) {
      next(err);
    }
  }
}

