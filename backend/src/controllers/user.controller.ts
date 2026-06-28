import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';

export class UserController {
  private userService = new UserService();

  async upgradeToSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const { phoneNumber } = req.body;
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new AppError('Số điện thoại là bắt buộc', HttpStatus.BAD_REQUEST, ErrorCode.PHONE_REQUIRED);
      }

      const result = await this.userService.upgradeToSeller(req.user.userId, phoneNumber);

      res.status(HttpStatus.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const address = await this.userService.getAddress(req.user.userId);
      res.status(HttpStatus.OK).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  }

  async saveAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const { addressLine, phone } = req.body;
      const address = await this.userService.saveAddress(req.user.userId, addressLine, phone);
      res.status(HttpStatus.OK).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  }

  async getParticipatedAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }
      
      const tab = req.query.tab as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await this.userService.getParticipatedAuctions(req.user.userId, tab, page, limit);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const profile = await this.userService.getMyProfile(req.user.userId);
      res.status(HttpStatus.OK).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const profile = await this.userService.updateProfile(req.user.userId, req.body);
      res.status(HttpStatus.OK).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateNotificationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const result = await this.userService.updateNotificationSettings(req.user.userId, req.body);
      res.status(HttpStatus.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  async togglePinAuction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const auctionId = req.params.auctionId as string;
      const result = await this.userService.togglePinAuction(req.user.userId, auctionId);

      res.status(HttpStatus.OK).json({
        success: true,
        message: result.pinned ? 'Đã ghim đấu giá' : 'Đã bỏ ghim',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyRelatedAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 8));

      const result = await this.userService.getMyRelatedAuctions(req.user.userId, page, limit);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await this.userService.getMyReviews(req.user.userId, page, limit);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getMyTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await this.userService.getMyTransactions(req.user.userId, page, limit);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const profile = await this.userService.getUserProfile(id);
      res.status(HttpStatus.OK).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getUserRelatedAuctions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 8));

      const result = await this.userService.getUserRelatedAuctions(id, page, limit);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getUserReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

      const result = await this.userService.getUserReviews(id, page, limit);
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
