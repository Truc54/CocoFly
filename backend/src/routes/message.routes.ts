import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authGuard } from '../middlewares/authGuard';

export const messageRoutes = Router();
const controller = new MessageController();

// All message routes require authentication
messageRoutes.use(authGuard);

messageRoutes.get('/conversations', controller.getConversations.bind(controller));
messageRoutes.post('/conversations', controller.getOrCreateConversation.bind(controller));
messageRoutes.get('/conversations/:id', controller.getMessages.bind(controller));
messageRoutes.patch('/conversations/:id/read', controller.markAsRead.bind(controller));
messageRoutes.get('/unread-count', controller.getUnreadCount.bind(controller));
