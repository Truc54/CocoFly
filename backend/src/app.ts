import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { oauthRoutes } from './routes/oauth.routes';
import { auctionRoutes } from './routes/auction.routes';
import { categoryRoutes } from './routes/category.routes';
import { userRoutes } from './routes/user.routes';
import { mediaRoutes } from './routes/media.routes';
import { paymentRoutes } from './routes/payment.routes';
import { notificationRoutes } from './routes/notification.routes';
import { messageRoutes } from './routes/message.routes';
import { adminRoutes } from './routes/admin.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Cookie parsing (for refresh token)
app.use(cookieParser());

// Trust proxy for accurate IP (behind nginx/reverse proxy)
app.set('trust proxy', 1);

// ── Routes ──
app.use('/auth', authRoutes);
app.use('/auth', oauthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;
