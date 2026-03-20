import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { registerRateLimit, loginRateLimit } from '../middlewares/rateLimiter';
import { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema } from '../validators/auth.validator';

const authController = new AuthController();
export const authRoutes = Router();

// POST /auth/register
authRoutes.post(
  '/register',
  registerRateLimit,
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
