import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';

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

      res.status(HttpStatus.CREATED).json({
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

      res.status(HttpStatus.OK).json({
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

      res.status(HttpStatus.OK).json({ success: true, data: result });
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

      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ── Search Suggestions ──────────────────────────────────────────────────

  async getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = (req.query.q as string || '').trim();
      if (q.length < 2) {
        res.status(HttpStatus.OK).json({ success: true, data: [] });
        return;
      }

      const limit = Math.min(10, Math.max(1, parseInt(req.query.limit as string) || 8));
      const status = (req.query.status as string) || 'active';
      const suggestions = await this.auctionService.getSuggestions(q, limit, status);

      res.status(HttpStatus.OK).json({ success: true, data: suggestions });
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
      res.status(HttpStatus.OK).json({ success: true, data: result });
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
      res.status(HttpStatus.OK).json({ success: true, data: result });
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

      if (!payment) {
        throw new AppError('Thanh toán không tồn tại', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
      }
      if (payment.buyerId !== userId) {
        throw new AppError('Bạn không có quyền thực hiện hành động này', HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
      }
      if (payment.status !== 'pending') {
        throw new AppError('Thanh toán không ở trạng thái chờ', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }

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

      res.status(HttpStatus.OK).json({ success: true, message: 'Đã từ chối mua sản phẩm' });
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
      const counts = await this.auctionService.getSellerAuctionCounts(sellerId);
      res.status(HttpStatus.OK).json({ success: true, data: { ...result, counts } });
    } catch (err) {
      next(err);
    }
  }

  async updateAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const auctionId = req.params.auctionId as string;

      const result = await this.auctionService.updateAuction(auctionId, sellerId, req.body);
      res.status(HttpStatus.OK).json({ success: true, message: 'Cập nhật thành công', data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const auctionId = req.params.auctionId as string;

      await this.auctionService.deleteAuction(auctionId, sellerId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Đã xóa phiên đấu giá' });
    } catch (err) {
      next(err);
    }
  }

  // ── Watchlist (Favorites) ──────────────────────────────────────────────────

  async toggleWatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const auctionId = req.params.auctionId as string;

      const result = await this.auctionService.toggleWatchAuction(auctionId, userId);
      res.status(HttpStatus.OK).json({
        success: true,
        message: result.watching ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await this.auctionService.getWatchlist(userId, page, limit);
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getWatchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const auctionId = req.params.auctionId as string;

      const watching = await this.auctionService.isWatching(auctionId, userId);
      res.status(HttpStatus.OK).json({ success: true, data: { watching } });
    } catch (err) {
      next(err);
    }
  }

  // ── Review Seller ────────────────────────────────────────────────────────

  async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const auctionId = req.params.auctionId as string;
      const { rating, comment } = req.body;

      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new AppError('Rating phải từ 1 đến 5', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }

      const review = await this.auctionService.addReview(auctionId, userId, rating, comment);
      res.status(HttpStatus.OK).json({ success: true, message: 'Đánh giá thành công', data: review });
    } catch (err) {
      next(err);
    }
  }
}
