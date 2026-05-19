import prisma from '../config/prisma';
import { NotificationType, Prisma } from '@prisma/client';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  auctionId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

const NOTIFICATION_EXPIRY_DAYS = 30;

export class NotificationRepository {
  async create(data: CreateNotificationData) {
    const expiresAt = data.expiresAt ?? new Date(Date.now() + NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    return prisma.notification.create({
      data: {
        userId: data.userId,
        auctionId: data.auctionId ?? null,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        expiresAt,
      },
      include: {
        auction: {
          select: {
            item: {
              select: {
                title: true,
                media: {
                  select: { cdnUrl: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  async createMany(items: CreateNotificationData[]) {
    const expiresAt = new Date(Date.now() + NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    return prisma.notification.createMany({
      data: items.map((item) => ({
        userId: item.userId,
        auctionId: item.auctionId ?? null,
        type: item.type,
        title: item.title,
        message: item.message,
        metadata: item.metadata ? (item.metadata as Prisma.InputJsonValue) : undefined,
        expiresAt: item.expiresAt ?? expiresAt,
      })),
    });
  }

  async findByUserId(userId: string, options: { cursor?: string; limit?: number; unreadOnly?: boolean } = {}) {
    const { cursor, limit = 20, unreadOnly = false } = options;

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        auctionId: true,
        metadata: true,
        isRead: true,
        createdAt: true,
        auction: {
          select: {
            item: {
              select: {
                title: true,
                media: {
                  select: { cdnUrl: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    return {
      data: notifications,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteById(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async deleteExpired() {
    const result = await prisma.notification.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return result.count;
  }
}
