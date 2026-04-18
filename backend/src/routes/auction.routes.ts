import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validate';
import { createAuctionSchema } from '../validators/auction.validator';

export const auctionRoutes = Router();
const auctionController = new AuctionController();

// Create auction (Seller only — authGuard verifies JWT, service verifies role)
auctionRoutes.post(
  '/',
  authGuard,
  validate(createAuctionSchema),
  auctionController.createAuction.bind(auctionController),
);

// Get auction details (public)
auctionRoutes.get(
  '/:auctionId',
  auctionController.getAuction.bind(auctionController),
);
