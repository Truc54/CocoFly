import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authGuard } from '../middlewares/authGuard';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  banUserSchema,
  changeRoleSchema,
  refundPaymentSchema,
  resolveDisputeSchema,
  createCategorySchema,
  updateCategorySchema,
  updateConfigSchema,
} from '../validators/admin.validator';

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

// ── Phase 3: Payment Management ──
adminRoutes.get('/payments', adminController.getPayments.bind(adminController));
adminRoutes.post('/payments/:id/refund', validate(refundPaymentSchema), adminController.refundPayment.bind(adminController));

// ── Phase 3: Dispute Resolution ──
adminRoutes.get('/disputes', adminController.getDisputes.bind(adminController));
adminRoutes.get('/disputes/:id', adminController.getDisputeById.bind(adminController));
adminRoutes.patch('/disputes/:id/resolve', validate(resolveDisputeSchema), adminController.resolveDispute.bind(adminController));

// ── Phase 4: Category Management ──
adminRoutes.get('/categories', adminController.getAllCategories.bind(adminController));
adminRoutes.post('/categories', validate(createCategorySchema), adminController.createCategory.bind(adminController));
adminRoutes.put('/categories/:id', validate(updateCategorySchema), adminController.updateCategory.bind(adminController));
adminRoutes.delete('/categories/:id', adminController.deleteCategory.bind(adminController));

// ── Phase 4: System Configuration ──
adminRoutes.get('/config', adminController.getConfigs.bind(adminController));
adminRoutes.put('/config/:key', validate(updateConfigSchema), adminController.updateConfig.bind(adminController));

// ── Phase 4: Audit Logs ──
adminRoutes.get('/audit-logs', adminController.getAuditLogs.bind(adminController));
