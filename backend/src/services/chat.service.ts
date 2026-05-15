import prisma from '../config/prisma';
import redis from '../config/redis';

export class ChatService {
  async getOrCreateRoom(auctionId: string) {
    let room = await prisma.chatRoom.findUnique({
      where: { auctionId },
    });
    
    if (!room) {
      room = await prisma.chatRoom.create({
        data: { auctionId, isActive: true },
      });
    }
    
    return room;
  }

  async toggleLike(messageId: string, userId: string) {
    const existingLike = await prisma.chatMessageLike.findUnique({
      where: {
        messageId_userId: { messageId, userId }
      }
    });

    let liked = false;
    if (existingLike) {
      await prisma.chatMessageLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.chatMessageLike.create({
        data: { messageId, userId }
      });
      liked = true;
    }

    const likeCount = await prisma.chatMessageLike.count({
      where: { messageId }
    });

    return { liked, likeCount };
  }

  async sendMessage(params: { roomId: string; senderId?: string; message: string; type?: 'text' | 'system' | 'bid_alert'; parentId?: string }) {
    const { roomId, senderId, message, type = 'text', parentId } = params;
    
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
    
    if (message.length > 500) {
      throw new Error('Message too long');
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
      throw new Error('Chat room is not active');
    }

    // Rate limiting for text messages
    if (type === 'text' && senderId) {
      const rateLimitKey = `chat_rate:${senderId}:${roomId}`;
      const isRateLimited = await redis.set(rateLimitKey, '1', 'EX', 2, 'NX');
      if (!isRateLimited) {
        throw new Error('Vui lòng đợi 2 giây trước khi gửi tin nhắn tiếp theo');
      }
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: type === 'text' && senderId ? senderId : null,
        message: message.trim(),
        type,
        parentId,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          }
        },
        parent: {
          include: {
            sender: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    return {
      id: chatMessage.id,
      senderId: chatMessage.sender?.id || null,
      senderName: chatMessage.sender?.fullName || 'Hệ thống',
      senderAvatar: chatMessage.sender?.avatarUrl || null,
      message: chatMessage.message,
      type: chatMessage.type,
      createdAt: chatMessage.createdAt.toISOString(),
      likeCount: 0,
      isLikedByMe: false,
      parentId: chatMessage.parentId,
      parentSenderName: chatMessage.parent?.sender?.fullName || null,
      parentMessage: chatMessage.parent?.message ? chatMessage.parent.message.substring(0, 50) : null,
    };
  }

  async sendSystemMessage(params: { roomId: string; message: string; type: 'system' | 'bid_alert' }) {
    return this.sendMessage({
      roomId: params.roomId,
      message: params.message,
      type: params.type,
    });
  }

  async getMessages(params: { roomId: string; cursor?: string; limit?: number; userId?: string }) {
    const { roomId, cursor, limit = 50, userId } = params;

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        isDeleted: false,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // Skip the cursor itself
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          }
        },
        _count: {
          select: { likes: true }
        },
        likes: userId ? {
          where: { userId },
          take: 1
        } : false,
        parent: {
          include: {
            sender: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender?.id || null,
      senderName: msg.sender?.fullName || 'Hệ thống',
      senderAvatar: msg.sender?.avatarUrl || null,
      message: msg.message,
      type: msg.type,
      createdAt: msg.createdAt.toISOString(),
      likeCount: msg._count?.likes || 0,
      isLikedByMe: msg.likes && msg.likes.length > 0,
      parentId: msg.parentId,
      parentSenderName: msg.parent?.sender?.fullName || null,
      parentMessage: msg.parent?.message ? msg.parent.message.substring(0, 50) : null,
    }));

    return {
      messages: formattedMessages,
      nextCursor,
    };
  }
}
