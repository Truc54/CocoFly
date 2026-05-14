import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../services/token.service';
import { BiddingService } from '../services/bidding.service';
import { env } from './env';
import redis from './redis';

let io: Server | null = null;
const tokenService = new TokenService();
const biddingService = new BiddingService();

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

    // ── Join auction room ─────────────────────────────────────────────────
    socket.on('auction:join', ({ auctionId }: { auctionId: string }) => {
      if (!auctionId) return;
      socket.join(`auction:${auctionId}`);
    });

    // ── Leave auction room ────────────────────────────────────────────────
    socket.on('auction:leave', ({ auctionId }: { auctionId: string }) => {
      if (!auctionId) return;
      socket.leave(`auction:${auctionId}`);
    });

    // ── Place bid ─────────────────────────────────────────────────────────
    socket.on('bid:place', async (data: { auctionId: string; amount: number; maxAutoBid?: number; requestId?: string }) => {
      try {
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

        // Notify outbid user(s) via their personal sockets
        if (result.outbidUserId) {
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
            extendCount: result.extendCount,
            maxExtendCount: result.maxExtendCount,
          });
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

        io!.to(`auction:${data.auctionId}`).emit('auction:buyout', {
          auctionId: data.auctionId,
          buyerId: userId,
          price: result.finalPrice,
        });
        io!.to(`auction:${data.auctionId}`).emit('auction:ended', {
          auctionId: data.auctionId,
          winnerId: userId,
          finalPrice: result.finalPrice,
        });
      } catch (err: any) {
        socket.emit('bid:error', {
          message: err.message || 'Mua ngay thất bại',
          code: err.statusCode || 500,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userId} (${socket.id})`);
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
}
