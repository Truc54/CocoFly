import { NotificationType } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import prisma from '../config/prisma';

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
    // Check user's notification settings before sending
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { notificationSettings: true }
    });

    if (user && user.notificationSettings) {
      let settings: Record<string, boolean> = {};
      if (typeof user.notificationSettings === 'string') {
        try {
          settings = JSON.parse(user.notificationSettings);
        } catch (e) {
          settings = {};
        }
      } else {
        settings = user.notificationSettings as Record<string, boolean>;
      }
      
      console.log(`[NotificationService] Check user ${payload.userId} setting for ${payload.type}:`, settings[payload.type]);
      // If the setting exists and is explicitly false or 'false' (string), skip notification
      if (settings[payload.type] === false || String(settings[payload.type]) === 'false') {
        console.log(`[NotificationService] Skipped notification ${payload.type} for user ${payload.userId}`);
        return null;
      }
    }

    const notification = await repo.create(payload);

    this.pushToSocket(payload.userId, notification);

    return notification;
  }

  /**
   * Send notifications to multiple users at once.
   * Uses Promise.all to create one-by-one, then pushes individually via Socket.IO.
   */
  async sendMany(payloads: SendNotificationPayload[]) {
    if (payloads.length === 0) return [];

    // Fetch settings for all users involved to avoid N+1 queries
    const userIds = [...new Set(payloads.map(p => p.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, notificationSettings: true }
    });

    const userSettingsMap = new Map<string, Record<string, boolean>>();
    users.forEach(u => {
      if (u.notificationSettings) {
        let parsed: Record<string, boolean> = {};
        if (typeof u.notificationSettings === 'string') {
          try { parsed = JSON.parse(u.notificationSettings); } catch (e) {}
        } else {
          parsed = u.notificationSettings as Record<string, boolean>;
        }
        userSettingsMap.set(u.id, parsed);
      }
    });

    // Filter payloads based on individual user settings
    const filteredPayloads = payloads.filter(payload => {
      const settings = userSettingsMap.get(payload.userId);
      if (settings && (settings[payload.type] === false || String(settings[payload.type]) === 'false')) {
        return false; // Skip if explicitly disabled
      }
      return true;
    });

    if (filteredPayloads.length === 0) return [];

    // For Socket.IO push, we need individual records with IDs,
    // so we create them one-by-one (createMany doesn't return records in Prisma)
    const results = await Promise.all(
      filteredPayloads.map(async (payload) => {
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
    this.pushUnreadCount(userId);
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
