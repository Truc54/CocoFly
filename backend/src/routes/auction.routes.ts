import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validate';
import { createAuctionSchema } from '../validators/auction.validator';

/**
 * Route Mapping:
 * Only connects an HTTP verb + path to a specific Controller method.
 * Optionally injects global/route-specific Middleware (Validate, Auth).
 *
 * NOTE: Bidding (place bid, buyout) is handled via Socket.IO, not REST.
 */
export const auctionRoutes = Router();
const auctionController = new AuctionController();

// ── Static routes — MUST be before /:auctionId to avoid Express treating
//    "live" / "upcoming" as a UUID param
auctionRoutes.get('/live', auctionController.getLiveAuctions.bind(auctionController));
auctionRoutes.get('/upcoming', auctionController.getUpcomingAuctions.bind(auctionController));
auctionRoutes.get('/suggestions', auctionController.getSuggestions.bind(auctionController));
auctionRoutes.get('/my-listings', authGuard, auctionController.getMyListings.bind(auctionController));

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

// ── Update auction (Seller only — scheduled auctions)
auctionRoutes.put(
  '/:auctionId',
  authGuard,
  auctionController.updateAuction.bind(auctionController),
);

// ── Delete auction (Seller only — scheduled auctions)
auctionRoutes.delete(
  '/:auctionId',
  authGuard,
  auctionController.deleteAuction.bind(auctionController),
);

// ── Get bid history for an auction (public)
auctionRoutes.get(
  '/:auctionId/bids',
  auctionController.getBidHistory.bind(auctionController),
);

// ── Get user's bid status for an auction (authenticated)
auctionRoutes.get(
  '/:auctionId/my-status',
  authGuard,
  auctionController.getMyBidStatus.bind(auctionController),
);

// ── Payment routes ──────────────────────────────────────────────────────────

// Runner-up declines purchase (no penalty)
auctionRoutes.post(
  '/payments/:paymentId/decline',
  authGuard,
  auctionController.declinePayment.bind(auctionController),
);

