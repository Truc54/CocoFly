import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { authGuard } from '../middlewares/authGuard';
import { uploadRateLimit } from '../middlewares/rateLimiter';

export const mediaRoutes = Router();
const mediaController = new MediaController();

// Get Cloudinary upload signature (authenticated users only)
mediaRoutes.post(
  '/sign',
  authGuard,
  uploadRateLimit,
  mediaController.getUploadSignature.bind(mediaController),
);
