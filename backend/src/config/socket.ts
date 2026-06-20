import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../services/token.service';
import { BiddingService } from '../services/bidding.service';
import { ChatService } from '../services/chat.service';
import { env } from './env';
import redis from './redis';

let io: Server | null = null;
const tokenService = new TokenService();
import { NotificationService } from '../services/notification.service';
import { MessageService } from '../services/message.service';
import prisma from './prisma';

const biddingService = new BiddingService();
const chatService = new ChatService();
const notificationService = new NotificationService();
const messageService = new MessageService();

// Helper to rate limit socket events using Redis
async function isSocketRateLimited(userId: string, event: string, limit: number, ttlSeconds: number): Promise<boolean> {
  const key = `ratelimit:socket:${event}:${userId}`;
  const current = await redis.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limit) {
    return true;
  }

  const multi = redis.multi();
  multi.incr(key);
  if (!current) {
    multi.expire(key, ttlSeconds);
  }
  await multi.exec();
  return false;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ── JWT Authentication Middleware ─────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        return next(new Error('Token không được cung cấp'));
      }

      const payload = tokenService.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('Token không hợp lệ hoặc đã hết hạn'));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    // Auto-join personal room for notifications
    socket.join(`user:${userId}`);

    // ── Join auction room ─────────────────────────────────────────────────
    socket.on('auction:join', async ({ auctionId }: { auctionId: string }) => {
      if (!auctionId) return;
      socket.join(`auction:${auctionId}`);

      // Viewer tracking
      await redis.sadd(`viewers:auction:${auctionId}`, userId);
      const count = await redis.scard(`viewers:auction:${auctionId}`);
      io!.to(`auction:${auctionId}`).emit('auction:viewer_count', { auctionId, count });
    });

    // ── Leave auction room ────────────────────────────────────────────────
    socket.on('auction:leave', async ({ auctionId }: { auctionId: string }) => {
      if (!auctionId) return;
      socket.leave(`auction:${auctionId}`);

      // Viewer tracking cleanup
      // Use a slight delay to allow any immediately following "join" events to process first
      setTimeout(async () => {
        try {
          if (!io) return;
          const socketsInRoom = await io.in(`auction:${auctionId}`).fetchSockets();
          // Here the socket has already left, so if we find any socket with this userId, 
          // it means the user has another tab open OR they re-joined instantly.
          const userStillInRoom = socketsInRoom.some(s => s.data.userId === userId);

          if (!userStillInRoom) {
            await redis.srem(`viewers:auction:${auctionId}`, userId);
            const count = await redis.scard(`viewers:auction:${auctionId}`);
            io.to(`auction:${auctionId}`).emit('auction:viewer_count', { auctionId, count });
          }
        } catch (e) {
          console.error('Error in auction:leave timeout', e);
        }
      }, 300);
    });

    // ── Place bid ─────────────────────────────────────────────────────────
    socket.on('bid:place', async (data: { auctionId: string; amount: number; maxAutoBid?: number; requestId?: string }) => {
      try {
        // Rate limit: 5 bids per 10 seconds per user
        const isLimited = await isSocketRateLimited(userId, 'bid', 5, 5);
        if (isLimited) {
          socket.emit('bid:error', {
            message: 'Bạn đang đặt giá quá nhanh. Vui lòng đợi vài giây.',
            code: 429,
          });
          return;
        }

        // Idempotency guard: reject duplicate requests within 10s
        if (data.requestId) {
          const idempotencyKey = `bid_idem:${userId}:${data.requestId}`;
          const isNew = await redis.set(idempotencyKey, '1', 'EX', 10, 'NX');
          if (!isNew) {
            console.log(`⚠️ Duplicate bid request rejected: ${data.requestId} from ${userId}`);
            return; // Silently ignore duplicate — client already got success from first request
          }
        }

        const ipAddress =
          (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          socket.handshake.address;

        const result = await biddingService.placeBid({
          auctionId: data.auctionId,
          bidderId: userId,
          amount: data.amount,
          maxAutoBid: data.maxAutoBid,
          ipAddress,
        });

        // Success confirmation to the bidder
        socket.emit('bid:success', { bid: result.bid });

        // When proxy competition occurred, broadcast BOTH bids (manual first, then auto)
        if (result.manualBid) {
          io!.to(`auction:${data.auctionId}`).emit('auction:bid_placed', {
            bid: result.manualBid,
            currentPrice: result.manualBid.amount,
            totalBids: result.totalBids - 1, // manual bid count (before auto)
          });
        }

        // Broadcast the winning bid to auction room
        io!.to(`auction:${data.auctionId}`).emit('auction:bid_placed', {
          bid: result.bid,
          currentPrice: result.currentPrice,
          totalBids: result.totalBids,
        });

        // (Chat integration: bid_alert emission removed to save resources since frontend no longer renders them)

        // Notify outbid user(s) via NotificationService
        if (result.outbidUserId) {
          notificationService.send({
            userId: result.outbidUserId,
            auctionId: data.auctionId,
            type: 'outbid',
            title: 'Bạn đã bị vượt giá!',
            message: `Sản phẩm vừa được trả giá cao hơn: ${new Intl.NumberFormat('vi-VN').format(Number(result.currentPrice))}₫`,
            metadata: { currentPrice: result.currentPrice }
          }).catch(err => console.error('Failed to send outbid notification', err));

          // Backward compatibility: frontend still subscribes to auction:outbid
          const outbidSockets = await io!.fetchSockets();
          for (const s of outbidSockets) {
            if (s.data.userId === result.outbidUserId) {
              s.emit('auction:outbid', {
                auctionId: data.auctionId,
                currentPrice: result.currentPrice,
              });
            }
          }
        }

        // Notify proxy owner if proxy auto-bid triggered
        if (result.proxyTriggered && result.proxyOwnerId) {
          const proxySockets = await io!.fetchSockets();
          for (const s of proxySockets) {
            if (s.data.userId === result.proxyOwnerId) {
              s.emit('auction:proxy_active', {
                auctionId: data.auctionId,
                message: 'Đặt giá tự động đã được kích hoạt',
              });
            }
          }
        }

        // Anti-sniping extension
        if (result.extended) {
          io!.to(`auction:${data.auctionId}`).emit('auction:extended', {
            auctionId: data.auctionId,
            newEndTime: result.newEndTime,
            extendCount: result.extendCount ?? 0,
            maxExtendCount: result.maxExtendCount ?? 0,
          });

          // Chat integration
          try {
            const room = await chatService.getOrCreateRoom(data.auctionId);
            const alertMsg = await chatService.sendSystemMessage({
              roomId: room.id,
              message: `Phiên đấu giá được gia hạn thêm ${(result.extendCount || 0) > 0 ? 'do có người trả giá phút chót' : ''}`,
              type: 'system',
            });
            io!.to(`auction:${data.auctionId}`).emit('chat:message', alertMsg);
          } catch (e) { }
        }
      } catch (err: any) {
        socket.emit('bid:error', {
          message: err.message || 'Đặt giá thất bại',
          code: err.statusCode || 500,
        });
      }
    });

    // ── Buyout ─────────────────────────────────────────────────────────────
    socket.on('bid:buyout', async (data: { auctionId: string }) => {
      try {
        const ipAddress =
          (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          socket.handshake.address;

        const result = await biddingService.buyout({
          auctionId: data.auctionId,
          buyerId: userId,
          ipAddress,
        });

        // Broadcast the bid so clients update their history list
        io!.to(`auction:${data.auctionId}`).emit('auction:bid_placed', {
          bid: result.bid,
          currentPrice: result.finalPrice,
          totalBids: result.totalBids,
        });

        io!.to(`auction:${data.auctionId}`).emit('auction:buyout', {
          auctionId: data.auctionId,
          buyerId: userId,
          buyerName: result.buyerName,
          price: result.finalPrice,
          actualEndTime: new Date().toISOString(),
        });
        io!.to(`auction:${data.auctionId}`).emit('auction:ended', {
          auctionId: data.auctionId,
          winnerId: userId,
          winnerName: result.buyerName,
          finalPrice: result.finalPrice,
          actualEndTime: new Date().toISOString(),
        });

        // Chat integration
        try {
          const room = await chatService.getOrCreateRoom(data.auctionId);
          const alertMsg = await chatService.sendSystemMessage({
            roomId: room.id,
            message: `Phiên đấu giá đã kết thúc bằng Mua Ngay với giá ${new Intl.NumberFormat('vi-VN').format(Number(result.finalPrice))}₫`,
            type: 'system',
          });
          io!.to(`auction:${data.auctionId}`).emit('chat:message', alertMsg);
        } catch (e) { }
      } catch (err: any) {
        socket.emit('bid:error', {
          message: err.message || 'Mua ngay thất bại',
          code: err.statusCode || 500,
        });
      }
    });

    // ── Chat Events ────────────────────────────────────────────────────────
    socket.on('chat:send', async (data: { auctionId: string; message: string; parentId?: string }) => {
      try {

        const room = await chatService.getOrCreateRoom(data.auctionId);
        const msg = await chatService.sendMessage({
          roomId: room.id,
          senderId: userId,
          message: data.message,
          type: 'text',
          parentId: data.parentId,
        });
        io!.to(`auction:${data.auctionId}`).emit('chat:message', msg);
      } catch (err: any) {
        socket.emit('chat:error', { message: err.message || 'Lỗi gửi tin nhắn' });
      }
    });

    socket.on('chat:load_history', async (data: { auctionId: string; cursor?: string; limit?: number }) => {
      try {
        const room = await chatService.getOrCreateRoom(data.auctionId);
        const history = await chatService.getMessages({
          roomId: room.id,
          cursor: data.cursor,
          limit: data.limit,
          userId,
        });
        socket.emit('chat:history', history);
      } catch (err) { }
    });

    socket.on('chat:like', async (data: { auctionId: string; messageId: string }) => {
      try {
        const result = await chatService.toggleLike(data.messageId, userId);

        // Broadcast to everyone (they just get the count)
        io!.to(`auction:${data.auctionId}`).emit('chat:like_updated', {
          messageId: data.messageId,
          likeCount: result.likeCount,
        });

        // Tell the user who liked it about their specific state
        socket.emit('chat:like_updated', {
          messageId: data.messageId,
          likeCount: result.likeCount,
          likedByUser: result.liked,
        });
      } catch (err: any) {
        socket.emit('chat:error', { message: 'Lỗi thả tim' });
      }
    });

    // ── Direct Message Events ──────────────────────────────────────────────
    socket.on('dm:send', async (data: { conversationId: string; content?: string; parentId?: string; media?: any[] }) => {
      try {
        // Rate limit: 10 messages per 10 seconds per user
        const isLimited = await isSocketRateLimited(userId, 'dm', 10, 1);
        if (isLimited) {
          socket.emit('dm:error', { message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau.' });
          return;
        }

        const message = await messageService.sendMessage({
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
          parentId: data.parentId,
          media: data.media
        });

        // Find receiver to emit message and updated unread count
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: data.conversationId },
          select: { userId: true }
        });
        const receiverId = participants.find(p => p.userId !== userId)?.userId;

        socket.emit('dm:message', message);
        if (receiverId) {
          io!.to(`user:${receiverId}`).emit('dm:message', message);

          const unreadCount = await messageService.getUnreadCount(receiverId);
          io!.to(`user:${receiverId}`).emit('dm:unread_update', { count: unreadCount });
        }
      } catch (err: any) {
        socket.emit('dm:error', { message: err.message || 'Lỗi gửi tin nhắn' });
      }
    });

    socket.on('dm:recall', async (data: { messageId: string }) => {
      try {
        const result = await messageService.recallMessage(data.messageId, userId);

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: result.conversationId },
          select: { userId: true }
        });

        participants.forEach((p) => {
          io!.to(`user:${p.userId}`).emit('dm:message_recalled', {
            messageId: result.id,
            conversationId: result.conversationId
          });
        });
      } catch (err: any) {
        socket.emit('dm:error', { message: err.message || 'Lỗi thu hồi tin nhắn' });
      }
    });

    socket.on('dm:react', async (data: { messageId: string; emoji: string }) => {
      try {
        const result = await messageService.toggleReaction(data.messageId, userId, data.emoji);

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: result.conversationId },
          select: { userId: true }
        });

        // Send reaction updates specifically for each participant to handle 'reacted' field accurately
        socket.emit('dm:reaction_updated', {
          messageId: result.messageId,
          conversationId: result.conversationId,
          reactions: result.reactions
        });

        const otherParticipant = participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          const allReactions = await prisma.messageReaction.findMany({
            where: { messageId: data.messageId }
          });
          const reactionGroupsMap: Record<string, { emoji: string; count: number; reacted: boolean }> = {};
          allReactions.forEach((r) => {
            if (!reactionGroupsMap[r.emoji]) {
              reactionGroupsMap[r.emoji] = { emoji: r.emoji, count: 0, reacted: false };
            }
            reactionGroupsMap[r.emoji].count += 1;
            if (r.userId === otherParticipant.userId) {
              reactionGroupsMap[r.emoji].reacted = true;
            }
          });
          io!.to(`user:${otherParticipant.userId}`).emit('dm:reaction_updated', {
            messageId: result.messageId,
            conversationId: result.conversationId,
            reactions: Object.values(reactionGroupsMap)
          });
        }
      } catch (err: any) {
        socket.emit('dm:error', { message: err.message || 'Lỗi thả react' });
      }
    });

    socket.on('dm:read', async (data: { conversationId: string }) => {
      try {
        const result = await messageService.markAsRead(data.conversationId, userId);

        const unreadCount = await messageService.getUnreadCount(userId);
        socket.emit('dm:unread_update', { count: unreadCount });

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: data.conversationId },
          select: { userId: true }
        });
        const otherParticipant = participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          io!.to(`user:${otherParticipant.userId}`).emit('dm:read_receipt', {
            conversationId: data.conversationId,
            readAt: result.readAt
          });
        }
      } catch (err) { }
    });

    socket.on('dm:typing', async (data: { conversationId: string }) => {
      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: data.conversationId },
          select: { userId: true }
        });
        const otherParticipant = participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          io!.to(`user:${otherParticipant.userId}`).emit('dm:user_typing', {
            conversationId: data.conversationId,
            userId
          });
        }
      } catch (err) { }
    });

    socket.on('dm:stop_typing', async (data: { conversationId: string }) => {
      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId: data.conversationId },
          select: { userId: true }
        });
        const otherParticipant = participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          io!.to(`user:${otherParticipant.userId}`).emit('dm:user_stop_typing', {
            conversationId: data.conversationId,
            userId
          });
        }
      } catch (err) { }
    });

    socket.on('disconnecting', async () => {
      for (const room of socket.rooms) {
        if (room.startsWith('auction:')) {
          const auctionId = room.split(':')[1];
          // Delay cleanup slightly to allow socketsInRoom to reflect the disconnect correctly
          setTimeout(async () => {
            try {
              if (!io) return;
              const socketsInRoom = await io.in(room).fetchSockets();
              const userStillInRoom = socketsInRoom.some(s => s.data.userId === userId && s.id !== socket.id);
              if (!userStillInRoom) {
                await redis.srem(`viewers:auction:${auctionId}`, userId);
                const count = await redis.scard(`viewers:auction:${auctionId}`);
                io.to(room).emit('auction:viewer_count', { auctionId, count });
              }
            } catch (e) {
              console.error('Error in disconnect timeout', e);
            }
          }, 500);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userId} (${socket.id})`);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
}
