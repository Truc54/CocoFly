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
