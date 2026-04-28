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

  async placeBid(req: Request, res: Response): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const bidData = req.body;

      const result = await this.auctionService.processBid(auctionId, bidData);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      // Pass to global error middleware in a real app
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  async getAuction(req: Request, res: Response): Promise<void> {
    // Basic signature
  }

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
}
