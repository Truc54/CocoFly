import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';

/**
 * Route Mapping:
 * Only connects an HTTP verb + path to a specific Controller method.
 * Optionally injects global/route-specific Middleware (Validate, Auth).
 */
export const auctionRoutes = Router();
const auctionController = new AuctionController();

// FUTURE MIDDLEWARE INTEGRATION:
// auctionRoutes.post('/:auctionId/bids', authMiddleware, validateMiddleware(BidSchema), auctionController.placeBid.bind(auctionController));

auctionRoutes.post('/:auctionId/bids', auctionController.placeBid.bind(auctionController));
auctionRoutes.get('/:auctionId', auctionController.getAuction.bind(auctionController));
