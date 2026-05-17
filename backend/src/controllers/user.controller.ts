import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../utils/AppError';

export class UserController {
  private userService = new UserService();

  async upgradeToSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { phoneNumber } = req.body;
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new AppError('Số điện thoại là bắt buộc', 400);
      }

      const result = await this.userService.upgradeToSeller(req.user.userId, phoneNumber);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const address = await this.userService.getAddress(req.user.userId);
      res.status(200).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  }

  async saveAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { addressLine, phone } = req.body;
      const address = await this.userService.saveAddress(req.user.userId, addressLine, phone);
      res.status(200).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  }
}
