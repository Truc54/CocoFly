import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { loginRateLimit } from '../middlewares/rateLimiter';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const authController = new AuthController();
export const authRoutes = Router();

// POST /auth/register
authRoutes.post(
  '/register',
  validate(registerSchema),
  authController.register.bind(authController),
);

// POST /auth/verify-otp
authRoutes.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  authController.verifyOtp.bind(authController),
);

// POST /auth/resend-otp
authRoutes.post(
  '/resend-otp',
  validate(resendOtpSchema),
  authController.resendOtp.bind(authController),
);

// POST /auth/login
authRoutes.post(
  '/login',
  loginRateLimit,
  validate(loginSchema),
  authController.login.bind(authController),
);

// POST /auth/refresh
authRoutes.post(
  '/refresh',
  authController.refreshToken.bind(authController),
);

// POST /auth/logout
authRoutes.post(
  '/logout',
  authController.logout.bind(authController),
);

// POST /auth/forgot-password
authRoutes.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
);

// POST /auth/verify-reset-otp
authRoutes.post(
  '/verify-reset-otp',
  validate(verifyResetOtpSchema),
  authController.verifyResetOtp.bind(authController),
);

// POST /auth/reset-password
authRoutes.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);
