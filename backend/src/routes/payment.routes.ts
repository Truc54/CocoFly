import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

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

// ── Buyer Routes (PROTECTED — need auth) ─────────────────────────────────
// FUTURE: add authMiddleware before these routes
paymentRoutes.post('/:id/initiate', controller.initiatePayment.bind(controller));
paymentRoutes.get('/auction/:auctionId', controller.getByAuction.bind(controller));
paymentRoutes.get('/my/:role', controller.getMyPayments.bind(controller));
paymentRoutes.get('/:id', controller.getById.bind(controller));

// ── Admin Routes (PROTECTED — need auth + admin role) ────────────────────
// FUTURE: add authMiddleware + requireAdmin before these routes
paymentRoutes.post('/:id/confirm', controller.confirmBanking.bind(controller));
paymentRoutes.post('/:id/refund', controller.refund.bind(controller));
