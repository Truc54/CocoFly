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
