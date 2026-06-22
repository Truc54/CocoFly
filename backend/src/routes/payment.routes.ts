import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authGuard } from '../middlewares/authGuard';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { openDisputeSchema } from '../validators/payment.validator';
import { respondDisputeSchema } from '../validators/dispute.validator';

/**
 * Payment Routes:
 * Maps HTTP endpoints to PaymentController methods.
 *
 * Public routes (gateway callbacks): no auth needed
 * Protected routes: require authMiddleware
 * Admin routes: require authMiddleware + admin role
 */
export const paymentRoutes = Router();
const controller = new PaymentController();

// ── Gateway Callbacks (PUBLIC — called by VNPay/MoMo servers) ────────────
paymentRoutes.get('/vnpay/return', controller.vnpayReturn.bind(controller));
paymentRoutes.get('/vnpay/ipn', controller.vnpayIPN.bind(controller));
paymentRoutes.post('/momo/ipn', controller.momoIPN.bind(controller));
paymentRoutes.get('/momo/return', controller.momoReturn.bind(controller));

// ── Buyer & Seller Routes (PROTECTED — need auth) ───────────────────────
paymentRoutes.use(authGuard); // Apply authGuard to all routes below this line for buyers, sellers and admins
paymentRoutes.post('/:id/initiate', controller.initiatePayment.bind(controller));
paymentRoutes.patch('/:id/confirm-shipping', controller.confirmShipping.bind(controller));
paymentRoutes.patch('/:id/confirm-delivery', controller.confirmDelivery.bind(controller));
paymentRoutes.post('/:id/dispute', validate(openDisputeSchema), controller.openDispute.bind(controller));
paymentRoutes.get('/dispute/by-auction/:auctionId', controller.getDisputeByAuction.bind(controller));
paymentRoutes.get('/dispute/:id', controller.getDisputeById.bind(controller));
paymentRoutes.post('/dispute/:id/respond', validate(respondDisputeSchema), controller.respondDispute.bind(controller));
paymentRoutes.get('/auction/:auctionId', controller.getByAuction.bind(controller));
paymentRoutes.get('/my/:role', controller.getMyPayments.bind(controller));
paymentRoutes.get('/:id', controller.getById.bind(controller));

// ── Admin Routes (PROTECTED — need auth + admin role) ────────────────────
paymentRoutes.post('/:id/confirm', requireAdmin, controller.confirmBanking.bind(controller));
paymentRoutes.post('/:id/refund', requireAdmin, controller.refund.bind(controller));
