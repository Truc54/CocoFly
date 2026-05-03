import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';

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

  // ── Place Bid (placeholder) ────────────────────────────────────────────────

  async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Return 501 Not Implemented until bidding is fully implemented
    res.status(501).json({
      success: false,
      message: 'Tính năng đặt giá hiện chưa được hỗ trợ.',
    });
  }
}
