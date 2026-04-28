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

      const result = await this.auctionService.getLiveAuctions({ page, limit, categoryId, sort });

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

      const result = await this.auctionService.getUpcomingAuctions({ page, limit, categoryId, period, search });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ── Place Bid (placeholder) ────────────────────────────────────────────────

  async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const bidData = req.body;

      const result = await this.auctionService.processBid(auctionId, bidData);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }
}
