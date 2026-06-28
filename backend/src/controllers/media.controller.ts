import { Request, Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary.config';
import { env } from '../config/env';
import { HttpStatus } from '../utils/HttpStatus';

export class MediaController {
  async getUploadSignature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'cocofly/temp';

      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        env.CLOUDINARY_API_SECRET,
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          signature,
          timestamp,
          apiKey: env.CLOUDINARY_API_KEY,
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          folder,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
