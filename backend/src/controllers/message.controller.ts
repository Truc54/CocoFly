import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';

const service = new MessageService();

export class MessageController {
  /**
   * GET /api/messages/conversations?cursor=xxx&limit=20
   */
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const cursor = req.query.cursor as string | undefined;
      const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));

      const result = await service.getConversations(userId, cursor, limit);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/messages/conversations
   * Body: { targetUserId: string }
   */
  async getOrCreateConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ message: 'targetUserId is required' });
      }

      const conversation = await service.getOrCreateConversation(userId, targetUserId);
      return res.json(conversation);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/messages/conversations/:id?cursor=xxx&limit=50
   */
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const conversationId = req.params.id as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 100));

      const result = await service.getMessages(conversationId, userId, cursor, limit);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/messages/unread-count
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
   * PATCH /api/messages/conversations/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const conversationId = req.params.id as string;
      const result = await service.markAsRead(conversationId, userId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
