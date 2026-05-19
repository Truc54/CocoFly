import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

const service = new NotificationService();

export class NotificationController {
  /**
   * GET /api/notifications?cursor=xxx&limit=20&unreadOnly=false
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const cursor = req.query.cursor as string | undefined;
      const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await service.getNotifications(userId, { cursor, limit, unreadOnly });
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const count = await service.getUnreadCount(userId);
      return res.json({ count });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      await service.markAsRead(req.params.id as string, userId);
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      await service.markAllAsRead(userId);
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      await service.deleteNotification(req.params.id as string, userId);
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
}
