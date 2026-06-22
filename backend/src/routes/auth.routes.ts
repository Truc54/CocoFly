import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { loginRateLimit, authRateLimit, otpRateLimit } from '../middlewares/rateLimiter';
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
  authRateLimit,
  validate(registerSchema),
  authController.register.bind(authController),
);

// POST /auth/verify-otp
authRoutes.post(
  '/verify-otp',
  otpRateLimit,
  validate(verifyOtpSchema),
  authController.verifyOtp.bind(authController),
);

// POST /auth/resend-otp
authRoutes.post(
  '/resend-otp',
  otpRateLimit,
  validate(resendOtpSchema),
  authController.resendOtp.bind(authController),
);

// POST /auth/login
authRoutes.post(
  '/login',
  authRateLimit,
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
  authRateLimit,
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
);

// POST /auth/verify-reset-otp
authRoutes.post(
  '/verify-reset-otp',
  otpRateLimit,
  validate(verifyResetOtpSchema),
  authController.verifyResetOtp.bind(authController),
);

// POST /auth/reset-password
authRoutes.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);
