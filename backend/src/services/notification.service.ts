import { NotificationType } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';

const repo = new NotificationRepository();

interface SendNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  auctionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Central orchestrator for the notification system.
 * 1. Creates DB record (source of truth)
 * 2. Pushes real-time event via Socket.IO to user's personal room
 *
 * All workers/services should call this instead of prisma.notification.create() directly.
 */
export class NotificationService {
  /**
   * Send a single notification: persist to DB + push via Socket.IO
   */
  async send(payload: SendNotificationPayload) {
    const notification = await repo.create(payload);

    this.pushToSocket(payload.userId, notification);

    return notification;
  }

  /**
   * Send notifications to multiple users at once.
   * Uses createMany for DB efficiency, then pushes individually via Socket.IO.
   */
  async sendMany(payloads: SendNotificationPayload[]) {
    if (payloads.length === 0) return;

    // For Socket.IO push, we need individual records with IDs,
    // so we create them one-by-one (createMany doesn't return records in Prisma)
    const results = await Promise.all(
      payloads.map(async (payload) => {
        const notification = await repo.create(payload);
        this.pushToSocket(payload.userId, notification);
        return notification;
      }),
    );

    return results;
  }

  async getNotifications(userId: string, options: { cursor?: string; limit?: number; unreadOnly?: boolean } = {}) {
    return repo.findByUserId(userId, options);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return repo.getUnreadCount(userId);
  }

  async markAsRead(id: string, userId: string) {
    await repo.markAsRead(id, userId);
    this.pushUnreadCount(userId);
  }

  async markAllAsRead(userId: string) {
    await repo.markAllAsRead(userId);
    this.pushUnreadCount(userId);
  }

  async deleteNotification(id: string, userId: string) {
    await repo.deleteById(id, userId);
  }

  async cleanupExpired(): Promise<number> {
    return repo.deleteExpired();
  }

  // ── Socket.IO helpers ──────────────────────────────────────────────────

  private pushToSocket(userId: string, notification: Record<string, unknown>) {
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', notification);
    } catch {
      // Socket.IO not initialized yet (startup) — DB record is the source of truth
    }
  }

  private async pushUnreadCount(userId: string) {
    try {
      const count = await repo.getUnreadCount(userId);
      const { getIO } = require('../config/socket');
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:unread_count', { count });
    } catch {
      // Silent fail — non-critical
    }
  }
}
