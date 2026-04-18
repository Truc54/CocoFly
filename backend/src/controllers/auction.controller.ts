import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../services/auction.service';

const auctionService = new AuctionService();

export class AuctionController {
  async createAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const result = await auctionService.createAuction(sellerId, req.body);

      res.status(201).json({
        success: true,
        message: 'Đấu giá đã được tạo và lên lịch thành công',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auctionId = req.params.auctionId as string;
      const auction = await auctionService.getAuctionById(auctionId);

      res.status(200).json({
        success: true,
        data: auction,
      });
    } catch (err) {
      next(err);
    }
  }
}
