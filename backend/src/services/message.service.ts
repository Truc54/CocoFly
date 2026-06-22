import prisma from '../config/prisma';
import redis from '../config/redis';
import cloudinary from '../config/cloudinary.config';

function getMediaPreviewText(media: any[]): string {
  if (!media || media.length === 0) return '';
  const imageCount = media.filter(m => m.type === 'image' || m.type === 'IMAGE').length;
  const videoCount = media.filter(m => m.type === 'video' || m.type === 'VIDEO').length;
  
  if (imageCount > 0 && videoCount > 0) {
    return `Đã gửi ${imageCount} ảnh và ${videoCount} video`;
  }
  if (imageCount > 0) {
    return `Đã gửi ${imageCount} ảnh`;
  }
  if (videoCount > 0) {
    return `Đã gửi ${videoCount} video`;
  }
  return 'Đã gửi tệp đính kèm';
}

export class MessageService {
  /**
   * Finds or creates a 1-1 conversation between userA and userB.
   */
  async getOrCreateConversation(userAId: string, userBId: string) {
    if (userAId === userBId) {
      throw new Error('Bạn không thể nhắn tin với chính mình');
    }

    // Verify both users exist
    const users = await prisma.user.findMany({
      where: { id: { in: [userAId, userBId] } },
      select: { id: true }
    });
    if (users.length !== 2) {
      throw new Error('Một trong hai người dùng không tồn tại');
    }

    // Find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Create new if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: userAId },
              { userId: userBId }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      });
    }

    return conversation;
  }

  /**
   * Retrieves conversation list for a user, sorted by last message time, including unread count.
   */
  async getConversations(userId: string, cursor?: string, limit = 20) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { conversationId_userId: { conversationId: cursor, userId } } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        conversation: {
          updatedAt: 'desc'
        }
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true
                  }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { fullName: true }
                },
                media: true
              }
            }
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (participants.length > limit) {
      const nextItem = participants.pop();
      nextCursor = nextItem!.conversationId;
    }

    const conversationIds = participants.map((p) => p.conversationId);
    let unreadCounts: { conversation_id: string; count: number }[] = [];

    if (conversationIds.length > 0) {
      unreadCounts = await prisma.$queryRaw<{ conversation_id: string; count: number }[]>`
        SELECT cp.conversation_id, COUNT(dm.id)::int as count
        FROM conversation_participants cp
        JOIN direct_messages dm ON cp.conversation_id = dm.conversation_id
        WHERE cp.user_id = ${userId}::uuid
          AND cp.conversation_id = ANY(${conversationIds}::uuid[])
          AND dm.sender_id != ${userId}::uuid
          AND dm.created_at > cp.last_read_at
        GROUP BY cp.conversation_id
      `;
    }

    const unreadMap = new Map<string, number>();
    unreadCounts.forEach((row) => {
      unreadMap.set(row.conversation_id, Number(row.count));
    });

    const conversationsList = participants.map((p) => {
      const otherParticipant = p.conversation.participants[0];
      const lastMsg = p.conversation.messages[0] || null;
      const unreadCount = unreadMap.get(p.conversationId) || 0;

      return {
        id: p.conversationId,
        participant: otherParticipant
          ? {
              id: otherParticipant.user.id,
              fullName: otherParticipant.user.fullName || 'Người dùng CocoFly',
              avatarUrl: otherParticipant.user.avatarUrl
            }
          : {
              id: '',
              fullName: 'Người dùng cũ',
              avatarUrl: null
            },
        lastMessage: lastMsg
          ? {
              content: lastMsg.status === 'recalled' 
                ? 'Tin nhắn đã bị thu hồi' 
                : (lastMsg.content || getMediaPreviewText(lastMsg.media)),
              senderName: lastMsg.senderId === userId ? 'Bạn' : (lastMsg.sender?.fullName || 'Người dùng'),
              createdAt: lastMsg.createdAt.toISOString(),
              status: lastMsg.status
            }
          : null,
        unreadCount,
        isMuted: p.isMuted
      };
    });

    return {
      conversations: conversationsList,
      nextCursor
    };
  }

  /**
   * Sends a 1-1 direct message with media attachments, enforcing validation rules and rate-limiting.
   */
  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    content?: string;
    parentId?: string;
    media?: Array<{
      type: 'image' | 'video';
      cdnUrl: string;
      storageKey: string;
      originalName?: string;
      mimeType?: string;
      fileSize?: number;
      width?: number;
      height?: number;
      duration?: number;
      thumbnailUrl?: string;
    }>;
  }) {
    const { conversationId, senderId, content, parentId, media } = params;

    // Validation
    const hasContent = content && content.trim() !== '';
    const hasMedia = media && media.length > 0;

    if (!hasContent && !hasMedia) {
      throw new Error('Nội dung tin nhắn hoặc tệp đính kèm không được để trống');
    }

    if (content && content.length > 2000) {
      throw new Error('Nội dung tin nhắn không được vượt quá 2000 ký tự');
    }

    if (media && media.length > 5) {
      throw new Error('Tối đa chỉ được gửi 5 tệp tin đính kèm mỗi tin nhắn');
    }

    // Verify sender is participant of the conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } }
    });

    if (!participant) {
      throw new Error('Bạn không thuộc cuộc trò chuyện này');
    }

    // Rate Limiting (1 message per 0.1s per user)
    const rateLimitKey = `dm_rate:${senderId}`;
    const isRateLimited = await redis.set(rateLimitKey, '1', 'PX', 100, 'NX');
    if (!isRateLimited) {
      throw new Error('Vui lòng đợi 0.1 giây trước khi gửi tin nhắn tiếp theo');
    }

    // Validate parent message if replying
    if (parentId) {
      const parentMsg = await prisma.directMessage.findUnique({
        where: { id: parentId }
      });
      if (!parentMsg || parentMsg.conversationId !== conversationId) {
        throw new Error('Tin nhắn phản hồi không hợp lệ');
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      // Create message
      const createdMessage = await tx.directMessage.create({
        data: {
          conversationId,
          senderId,
          content: content?.trim() || null,
          parentId,
          media: media
            ? {
                create: media.map((item, index) => ({
                  type: item.type,
                  cdnUrl: item.cdnUrl,
                  storageKey: item.storageKey,
                  originalName: item.originalName || null,
                  mimeType: item.mimeType || null,
                  fileSize: item.fileSize ? BigInt(item.fileSize) : null,
                  width: item.width || null,
                  height: item.height || null,
                  duration: item.duration || null,
                  thumbnailUrl: item.thumbnailUrl || null,
                  sortOrder: index
                }))
              }
            : undefined
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true
            }
          },
          media: true,
          parent: {
            include: {
              sender: {
                select: { fullName: true }
              },
              media: true
            }
          }
        }
      });

      // Update Conversation updated_at for sorting
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // Update sender's lastReadAt
      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: senderId } },
        data: { lastReadAt: new Date() }
      });

      return createdMessage;
    });

    // Map BigInt in media back to Number for JSON response safety
    const formattedMedia = message.media.map((m) => ({
      id: m.id,
      type: m.type,
      cdnUrl: m.cdnUrl,
      thumbnailUrl: m.thumbnailUrl,
      width: m.width,
      height: m.height
    }));

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender?.fullName || 'Người dùng',
      senderAvatar: message.sender?.avatarUrl || null,
      content: message.content,
      status: message.status,
      parentId: message.parentId,
      parentSenderName: message.parent?.sender?.fullName || null,
      parentContent: message.parent?.status === 'recalled' 
        ? 'Tin nhắn đã bị thu hồi' 
        : (message.parent?.content || (message.parent?.media && message.parent.media.length > 0 ? '[Hình ảnh/Video]' : null)),
      media: formattedMedia,
      reactions: [],
      createdAt: message.createdAt.toISOString()
    };
  }

  /**
   * Retrieves paginated messages in a conversation.
   */
  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });

    if (!participant) {
      throw new Error('Bạn không thuộc cuộc trò chuyện này');
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        },
        media: {
          orderBy: { sortOrder: 'asc' }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        parent: {
          include: {
            sender: {
              select: { fullName: true }
            },
            media: true
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    const formattedMessages = messages.map((msg) => {
      const isRecalled = msg.status === 'recalled';

      // Group reactions by emoji
      const reactionGroupsMap: Record<string, { emoji: string; count: number; reacted: boolean }> = {};
      msg.reactions.forEach((r) => {
        if (!reactionGroupsMap[r.emoji]) {
          reactionGroupsMap[r.emoji] = { emoji: r.emoji, count: 0, reacted: false };
        }
        reactionGroupsMap[r.emoji].count += 1;
        if (r.userId === userId) {
          reactionGroupsMap[r.emoji].reacted = true;
        }
      });

      const reactions = Object.values(reactionGroupsMap);

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.sender?.fullName || 'Người dùng',
        senderAvatar: msg.sender?.avatarUrl || null,
        content: isRecalled ? null : msg.content,
        status: msg.status,
        parentId: msg.parentId,
        parentSenderName: msg.parent?.sender?.fullName || null,
        parentContent: msg.parent?.status === 'recalled'
          ? 'Tin nhắn đã bị thu hồi'
          : (msg.parent?.content || (msg.parent?.media && msg.parent.media.length > 0 ? '[Hình ảnh/Video]' : null)),
        media: isRecalled
          ? []
          : msg.media.map((m) => ({
              id: m.id,
              type: m.type,
              cdnUrl: m.cdnUrl,
              thumbnailUrl: m.thumbnailUrl,
              width: m.width,
              height: m.height
            })),
        reactions,
        createdAt: msg.createdAt.toISOString()
      };
    });

    return {
      messages: formattedMessages,
      nextCursor
    };
  }

  /**
   * Recalls a message (sender only). Deletes DB media mappings and triggers async Cloudinary deletion.
   */
  async recallMessage(messageId: string, userId: string) {
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      include: { media: true }
    });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại');
    }

    if (message.senderId !== userId) {
      throw new Error('Bạn không có quyền thu hồi tin nhắn này');
    }

    if (message.status === 'recalled') {
      return { id: message.id, conversationId: message.conversationId };
    }

    await prisma.$transaction(async (tx) => {
      // Update message status and clear content
      await tx.directMessage.update({
        where: { id: messageId },
        data: {
          status: 'recalled',
          content: null,
          recalledAt: new Date()
        }
      });

      // Clear DB media entries
      if (message.media.length > 0) {
        await tx.messageMedia.deleteMany({
          where: { messageId }
        });
      }
    });

    // Delete physically from Cloudinary asynchronously
    if (message.media.length > 0) {
      message.media.forEach((m) => {
        cloudinary.uploader.destroy(m.storageKey).catch((err) => {
          console.error(`Failed to delete Cloudinary file: ${m.storageKey}`, err);
        });
      });
    }

    return {
      id: message.id,
      conversationId: message.conversationId
    };
  }

  /**
   * Toggles emoji reaction on message (1 reaction per user per message max).
   */
  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const allowedEmojis = ['😀', '❤️', '👍', '😢', '😡', '🔥'];
    if (!allowedEmojis.includes(emoji)) {
      throw new Error('Emoji không hợp lệ');
    }

    // Verify message exists and user is participant of its conversation
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại');
    }

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: message.conversationId, userId } }
    });

    if (!participant) {
      throw new Error('Bạn không thể tương tác với cuộc trò chuyện này');
    }

    const existingReaction = await prisma.messageReaction.findUnique({
      where: { messageId_userId: { messageId, userId } }
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Toggle off if same emoji
        await prisma.messageReaction.delete({
          where: { id: existingReaction.id }
        });
      } else {
        // Update to new emoji if different
        await prisma.messageReaction.update({
          where: { id: existingReaction.id },
          data: { emoji }
        });
      }
    } else {
      // Create new reaction
      await prisma.messageReaction.create({
        data: { messageId, userId, emoji }
      });
    }

    // Fetch updated reactions
    const allReactions = await prisma.messageReaction.findMany({
      where: { messageId }
    });

    // Group reactions for socket emission
    const reactionGroupsMap: Record<string, { emoji: string; count: number; reacted: boolean }> = {};
    allReactions.forEach((r) => {
      if (!reactionGroupsMap[r.emoji]) {
        reactionGroupsMap[r.emoji] = { emoji: r.emoji, count: 0, reacted: false };
      }
      reactionGroupsMap[r.emoji].count += 1;
      if (r.userId === userId) {
        reactionGroupsMap[r.emoji].reacted = true;
      }
    });

    return {
      messageId,
      conversationId: message.conversationId,
      reactions: Object.values(reactionGroupsMap)
    };
  }

  /**
   * Marks a conversation as read by the user.
   */
  async markAsRead(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });

    if (!participant) {
      throw new Error('Bạn không thuộc cuộc trò chuyện này');
    }

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() }
    });

    return { conversationId, readAt: new Date().toISOString() };
  }

  /**
   * Gets total unread count for a user across all active conversations.
   */
  async getUnreadCount(userId: string) {
    const result = await prisma.$queryRaw<[{ count: bigint | number }]>`
      SELECT COUNT(dm.id) as count
      FROM conversation_participants cp
      JOIN direct_messages dm ON cp.conversation_id = dm.conversation_id
      WHERE cp.user_id = ${userId}::uuid
        AND dm.sender_id != ${userId}::uuid
        AND dm.created_at > cp.last_read_at
    `;
    const count = result[0]?.count ? Number(result[0].count) : 0;
    return count;
  }

  /**
   * Retrieves simple conversation info by user IDs
   */
  async getConversationByUsers(userAId: string, userBId: string) {
    return prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } }
        ]
      }
    });
  }
}
