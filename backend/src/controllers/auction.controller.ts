import { Request, Response } from 'express';
import { AuctionService } from '../services/auction.service';

/**
 * Controller Layer:
 * Responsible ONLY for handling HTTP requests (req, res).
 * Extracts data from body/params/query, calls the Service layer,
 * and formats the final HTTP response. DO NOT put business logic here.
 */
export class AuctionController {
  private auctionService = new AuctionService();

  public async placeBid(req: Request, res: Response): Promise<void> {
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

  public async getAuction(req: Request, res: Response): Promise<void> {
    // Basic signature
  }
}
