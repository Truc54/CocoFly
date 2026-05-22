import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authGuard } from '../middlewares/authGuard';

const userController = new UserController();
export const userRoutes = Router();

// POST /api/users/upgrade-role
// Requires authenticated user + Firebase ID Token in body
userRoutes.post(
  '/upgrade-role',
  authGuard,
  userController.upgradeToSeller.bind(userController),
);

// GET /api/users/me/address
userRoutes.get(
  '/me/address',
  authGuard,
  userController.getAddress.bind(userController),
);

// POST /api/users/me/address
userRoutes.post(
  '/me/address',
  authGuard,
  userController.saveAddress.bind(userController),
);

// GET /api/users/me/participated-auctions
userRoutes.get(
  '/me/participated-auctions',
  authGuard,
  userController.getParticipatedAuctions.bind(userController),
);

// GET /api/users/me/profile
userRoutes.get(
  '/me/profile',
  authGuard,
  userController.getMyProfile.bind(userController),
);

// PUT /api/users/me/profile
userRoutes.put(
  '/me/profile',
  authGuard,
  userController.updateProfile.bind(userController),
);

// PUT /api/users/me/notifications
userRoutes.put(
  '/me/notifications',
  authGuard,
  userController.updateNotificationSettings.bind(userController),
);

// POST /api/users/me/pin/:auctionId — toggle pin/unpin (max 3)
userRoutes.post(
  '/me/pin/:auctionId',
  authGuard,
  userController.togglePinAuction.bind(userController),
);

// GET /api/users/me/related-auctions
userRoutes.get(
  '/me/related-auctions',
  authGuard,
  userController.getMyRelatedAuctions.bind(userController),
);

// GET /api/users/me/reviews
userRoutes.get(
  '/me/reviews',
  authGuard,
  userController.getMyReviews.bind(userController),
);

// GET /api/users/me/transactions
userRoutes.get(
  '/me/transactions',
  authGuard,
  userController.getMyTransactions.bind(userController),
);

