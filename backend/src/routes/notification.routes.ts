import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authGuard } from '../middlewares/authGuard';

/**
 * Notification Routes — all require authentication.
 */
export const notificationRoutes = Router();
const controller = new NotificationController();

notificationRoutes.use(authGuard);

notificationRoutes.get('/', controller.getNotifications.bind(controller));
notificationRoutes.get('/unread-count', controller.getUnreadCount.bind(controller));
notificationRoutes.patch('/read-all', controller.markAllAsRead.bind(controller));
notificationRoutes.patch('/:id/read', controller.markAsRead.bind(controller));
notificationRoutes.delete('/:id', controller.deleteNotification.bind(controller));
