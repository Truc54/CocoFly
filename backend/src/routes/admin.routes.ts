import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authGuard } from '../middlewares/authGuard';
import { requireAdmin } from '../middlewares/requireAdmin';

const adminController = new AdminController();
export const adminRoutes = Router();

// Apply authentication and admin role requirement to all admin routes
adminRoutes.use(authGuard, requireAdmin);

// ── Dashboard ──
adminRoutes.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));
adminRoutes.get('/dashboard/revenue', adminController.getDashboardRevenue.bind(adminController));
adminRoutes.get('/dashboard/activity', adminController.getDashboardActivity.bind(adminController));
