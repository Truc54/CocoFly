import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { AppError } from '../utils/AppError';
import { HttpStatus } from '../utils/HttpStatus';
import { ErrorCode } from '../utils/ErrorCode';

const service = new MessageService();

export class MessageController {
  /**
   * GET /api/messages/conversations?cursor=xxx&limit=20
   */
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const cursor = req.query.cursor as string | undefined;
      const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));

      const result = await service.getConversations(userId, cursor, limit);
      res.status(HttpStatus.OK).json(result);
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
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const { targetUserId } = req.body;
      if (!targetUserId) {
        throw new AppError('targetUserId is required', HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }

      const conversation = await service.getOrCreateConversation(userId, targetUserId);
      res.status(HttpStatus.OK).json(conversation);
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
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const conversationId = req.params.id as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 100));

      const result = await service.getMessages(conversationId, userId, cursor, limit);
      res.status(HttpStatus.OK).json(result);
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
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const count = await service.getUnreadCount(userId);
      res.status(HttpStatus.OK).json({ count });
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
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      const conversationId = req.params.id as string;
      const result = await service.markAsRead(conversationId, userId);
      res.status(HttpStatus.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}
