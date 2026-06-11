import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authGuard } from '../middlewares/authGuard';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { banUserSchema, changeRoleSchema } from '../validators/admin.validator';

const adminController = new AdminController();
export const adminRoutes = Router();

// Apply authentication and admin role requirement to all admin routes
adminRoutes.use(authGuard, requireAdmin);

// ── Dashboard ──
adminRoutes.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));
adminRoutes.get('/dashboard/revenue', adminController.getDashboardRevenue.bind(adminController));
adminRoutes.get('/dashboard/activity', adminController.getDashboardActivity.bind(adminController));

// ── Phase 2: User Management ──
adminRoutes.get('/users', adminController.getUsers.bind(adminController));
adminRoutes.get('/users/:id', adminController.getUserById.bind(adminController));
adminRoutes.patch('/users/:id/ban', validate(banUserSchema), adminController.banUser.bind(adminController));
adminRoutes.patch('/users/:id/unban', adminController.unbanUser.bind(adminController));
adminRoutes.patch('/users/:id/role', validate(changeRoleSchema), adminController.changeRole.bind(adminController));
adminRoutes.patch('/users/:id/reset-strikes', adminController.resetStrikes.bind(adminController));

// ── Phase 2: Auction Management ──
adminRoutes.get('/auctions', adminController.getAuctions.bind(adminController));
adminRoutes.get('/auctions/:id', adminController.getAuctionById.bind(adminController));
adminRoutes.post('/auctions/:id/force-end', adminController.forceEnd.bind(adminController));
adminRoutes.post('/auctions/:id/cancel', adminController.cancel.bind(adminController));
