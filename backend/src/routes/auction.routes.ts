import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validate';
import { createAuctionSchema } from '../validators/auction.validator';

/**
 * Route Mapping:
 * Only connects an HTTP verb + path to a specific Controller method.
 * Optionally injects global/route-specific Middleware (Validate, Auth).
 */
export const auctionRoutes = Router();
const auctionController = new AuctionController();

// ── Static routes — MUST be before /:auctionId to avoid Express treating
//    "live" / "upcoming" as a UUID param
auctionRoutes.get('/live', auctionController.getLiveAuctions.bind(auctionController));
auctionRoutes.get('/upcoming', auctionController.getUpcomingAuctions.bind(auctionController));

// ── Create auction (Seller only — authGuard verifies JWT, service verifies role)
auctionRoutes.post(
  '/',
  authGuard,
  validate(createAuctionSchema),
  auctionController.createAuction.bind(auctionController),
);

// ── Get auction details (public)
auctionRoutes.get(
  '/:auctionId',
  auctionController.getAuction.bind(auctionController),
);

// ── Place bid on an auction (temporarily unavailable until fully implemented)
auctionRoutes.post(
  '/:auctionId/bids',
  authGuard,
  auctionController.placeBid.bind(auctionController),
);
