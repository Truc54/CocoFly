import crypto from 'crypto';
import redis from '../config/redis';
import prisma from '../config/prisma';
import { AuctionRepository } from '../repositories/auction.repository';
import { AppError } from '../utils/AppError';
import { scheduleAuctionEnd, auctionQueue } from '../queues/auction.queue';
import { schedulePaymentTimeout } from '../queues/payment.queue';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaceBidParams {
  auctionId: string;
  bidderId: string;
  amount: number;
  maxAutoBid?: number;
  ipAddress?: string;
}

interface BuyoutParams {
  auctionId: string;
  buyerId: string;
  ipAddress?: string;
}

type BidEntry = {
  id: string;
  amount: number;
  isAutoBid: boolean;
  createdAt: Date;
  bidder: { id: string; fullName: string | null; avatarUrl: string | null };
};

interface BidResult {
  bid: BidEntry;
  manualBid?: BidEntry; // Present when proxy competition created a separate manual bid
  currentPrice: number;
  totalBids: number;
  outbidUserId?: string;
  proxyTriggered: boolean;
  proxyOwnerId?: string;
  extended: boolean;
  newEndTime?: string;
  extendCount?: number;
  maxExtendCount?: number;
}

interface BuyoutResult {
  finalPrice: number;
  bidId: string;
}

// Lua script: release lock only if we still own it (atomic check+delete)
const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

const LOCK_TTL = 5; // seconds
const RATE_LIMIT_SECONDS = 3;
const HIGH_VALUE_THRESHOLD = 5_000_000; // VND
const MIN_ACCOUNT_AGE_DAYS = 7;

// ─── Service ──────────────────────────────────────────────────────────────────

export class BiddingService {
  private repo = new AuctionRepository();

  // ── Place Bid (Manual or with Proxy) ──────────────────────────────────────

  async placeBid(params: PlaceBidParams): Promise<BidResult> {
    let { amount } = params;
    const { auctionId, bidderId, maxAutoBid, ipAddress } = params;

    // 1. Acquire distributed lock
    const lockKey = `lock:auction:${auctionId}`;
    const lockValue = crypto.randomUUID();
    const acquired = await redis.set(lockKey, lockValue, 'EX', LOCK_TTL, 'NX');

    if (!acquired) {
      throw new AppError('Hệ thống đang xử lý bid khác, vui lòng thử lại', 409);
    }

    try {
      // 2. Rate limiting
      const rateKey = `bid_rate:${auctionId}:${bidderId}`;
      const rateAllowed = await redis.set(rateKey, '1', 'EX', RATE_LIMIT_SECONDS, 'NX');
      if (!rateAllowed) {
        throw new AppError('Bạn đang đặt giá quá nhanh, đợi 3 giây', 429);
      }

      // 3. Fetch auction
      const auction = await this.repo.getAuctionForBidding(auctionId);
      if (!auction) throw new AppError('Phiên đấu giá không tồn tại', 404);
      if (auction.status !== 'active') throw new AppError('Phiên đấu giá không hoạt động', 400);
      if (new Date() >= auction.endTime) throw new AppError('Phiên đấu giá đã kết thúc', 400);
      if (bidderId === auction.sellerId) throw new AppError('Bạn không thể đặt giá cho đấu giá của chính mình', 403);

      // 4. Verify bidder account
      const bidder = await prisma.user.findUnique({
        where: { id: bidderId },
        select: { accountStatus: true, createdAt: true },
      });
      if (!bidder || bidder.accountStatus !== 'active') {
        throw new AppError('Tài khoản không hợp lệ hoặc đã bị khóa', 403);
      }

      // FR-07: High-value bid requires account age >= 7 days
      if (amount > HIGH_VALUE_THRESHOLD) {
        const accountAgeDays = (Date.now() - bidder.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS) {
          throw new AppError(
            `Tài khoản cần tồn tại ít nhất ${MIN_ACCOUNT_AGE_DAYS} ngày để đặt giá trên ${HIGH_VALUE_THRESHOLD.toLocaleString()}đ`,
            403,
          );
        }
      }

      // 5. Validate amount
      const currentPrice = Number(auction.currentPrice);
      const bidIncrement = Number(auction.bidIncrement);
      const minBid = currentPrice + bidIncrement;

      if (amount < minBid) {
        throw new AppError(`Giá đặt tối thiểu là ${minBid.toLocaleString()} VNĐ`, 400);
      }

      const buyoutPrice = auction.buyoutPrice ? Number(auction.buyoutPrice) : null;
      if (buyoutPrice) {
        if (amount >= buyoutPrice) {
          throw new AppError(`Mức giá bạn đặt đã chạm mức Mua Ngay (${buyoutPrice.toLocaleString()} VNĐ). Vui lòng sử dụng chức năng Mua Ngay để sở hữu vật phẩm.`, 400);
        }
        if (maxAutoBid !== undefined && maxAutoBid >= buyoutPrice) {
          throw new AppError(`Giá uỷ quyền tối đa không được vượt quá hoặc bằng giá Mua Ngay (${buyoutPrice.toLocaleString()} VNĐ). Vui lòng sử dụng chức năng Mua Ngay.`, 400);
        }
      }

      // Validate proxy
      if (maxAutoBid !== undefined) {
        if (maxAutoBid < amount) {
          throw new AppError('Giá tối đa tự động phải >= giá đặt', 400);
        }
        if (maxAutoBid < minBid) {
          throw new AppError(`Giá tối đa tự động tối thiểu là ${minBid.toLocaleString()} VNĐ`, 400);
        }
        
        // Force the starting amount of a proxy bid to be the absolute minimum required to lead.
        // This ensures the backend always takes the "giá trị tối ưu" (optimal value) 
        // even if the frontend passes the max value as the starting amount.
        amount = minBid;
      }

      // 6. Get previous highest bidder for outbid notification
      const previousHighest = await this.repo.findHighestBid(auctionId);
      const previousLeaderId = previousHighest?.bidderId;

      // 7. Check competing proxy bids
      const proxyResult = await this.resolveProxyCompetition(
        auctionId,
        bidderId,
        amount,
        maxAutoBid,
        bidIncrement,
        Number(auction.currentPrice),
        ipAddress,
      );

      if (proxyResult) {
        if (proxyResult.type === 'proxy_outbid') {
          // A proxy outbid the manual bidder — return proxy result
          const antiSnipe = await this.checkAntiSniping(auctionId, auction);

          return {
            bid: proxyResult.bid,
            manualBid: proxyResult.manualBid,
            currentPrice: proxyResult.currentPrice,
            totalBids: auction.totalBids + proxyResult.bidsCreated,
            outbidUserId: bidderId, // The manual bidder was outbid
            proxyTriggered: true,
            proxyOwnerId: proxyResult.proxyOwnerId,
            extended: antiSnipe.extended,
            newEndTime: antiSnipe.newEndTime,
            extendCount: antiSnipe.extendCount,
            maxExtendCount: antiSnipe.maxExtendCount,
          };
        }

        // type === 'manual_wins' — manual bid already saved inside resolveProxyCompetition
        const antiSnipe = await this.checkAntiSniping(auctionId, auction);

        return {
          bid: proxyResult.bid,
          manualBid: proxyResult.manualBid,
          currentPrice: proxyResult.currentPrice,
          totalBids: auction.totalBids + proxyResult.bidsCreated,
          outbidUserId: previousLeaderId && previousLeaderId !== bidderId ? previousLeaderId : undefined,
          proxyTriggered: false,
          extended: antiSnipe.extended,
          newEndTime: antiSnipe.newEndTime,
          extendCount: antiSnipe.extendCount,
          maxExtendCount: antiSnipe.maxExtendCount,
        };
      }

      // 8. No proxies exist — save the manual bid
      const bid = await this.repo.saveBidTransaction({
        auctionId,
        bidderId,
        amount,
        maxAutoBid: maxAutoBid ?? null,
        isAutoBid: false,
        ipAddress,
        newCurrentPrice: amount,
      });

      // 9. Check anti-sniping
      const antiSnipe = await this.checkAntiSniping(auctionId, auction);

      return {
        bid,
        currentPrice: amount,
        totalBids: auction.totalBids + 1,
        outbidUserId: previousLeaderId && previousLeaderId !== bidderId ? previousLeaderId : undefined,
        proxyTriggered: false,
        extended: antiSnipe.extended,
        newEndTime: antiSnipe.newEndTime,
        extendCount: antiSnipe.extendCount,
        maxExtendCount: antiSnipe.maxExtendCount,
      };
    } finally {
      // Release lock atomically
      await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockValue);
    }
  }

  // ── Buyout Flow ───────────────────────────────────────────────────────────

  async buyout(params: BuyoutParams): Promise<BuyoutResult> {
    const { auctionId, buyerId, ipAddress } = params;

    const lockKey = `lock:auction:${auctionId}`;
    const lockValue = crypto.randomUUID();
    const acquired = await redis.set(lockKey, lockValue, 'EX', LOCK_TTL, 'NX');

    if (!acquired) {
      throw new AppError('Hệ thống đang xử lý, vui lòng thử lại', 409);
    }

    try {
      const auction = await this.repo.getAuctionForBidding(auctionId);
      if (!auction) throw new AppError('Phiên đấu giá không tồn tại', 404);
      if (auction.status !== 'active') throw new AppError('Phiên đấu giá không hoạt động', 400);
      if (!auction.buyoutPrice) throw new AppError('Phiên đấu giá không hỗ trợ mua ngay', 400);
      if (buyerId === auction.sellerId) throw new AppError('Bạn không thể mua sản phẩm của chính mình', 403);

      const buyoutPrice = Number(auction.buyoutPrice);

      const bid = await this.repo.saveBidTransaction({
        auctionId,
        bidderId: buyerId,
        amount: buyoutPrice,
        isAutoBid: false,
        ipAddress,
        newCurrentPrice: buyoutPrice,
        auctionUpdates: {
          status: 'ended',
          actualEndTime: new Date(),
        },
      });

      await this.handleBuyoutEnd(auctionId, buyerId, bid.id, buyoutPrice);

      return { finalPrice: buyoutPrice, bidId: bid.id };
    } finally {
      await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockValue);
    }
  }

  // ── Proxy Competition Resolution ──────────────────────────────────────────

  private async resolveProxyCompetition(
    auctionId: string,
    manualBidderId: string,
    manualAmount: number,
    manualMaxAutoBid: number | undefined,
    bidIncrement: number,
    currentPrice: number,
    ipAddress?: string,
  ): Promise<{
    type: 'proxy_outbid' | 'manual_wins';
    bid: BidEntry;
    manualBid?: BidEntry;
    currentPrice: number;
    proxyOwnerId?: string;
    bidsCreated: number;
  } | null> {
    // Find all active proxy bids from OTHER users
    const allProxies = await this.repo.findActiveProxyBids(auctionId);
    const competingProxies = allProxies.filter((p) => p.bidderId !== manualBidderId);

    if (competingProxies.length === 0) {
      // No competing proxies → let the caller save the manual bid
      return null;
    }

    const bestProxy = competingProxies[0];
    const bestProxyMax = Number(bestProxy.maxAutoBid);

    // Determine effective manual max (manual bid amount or maxAutoBid if set)
    const effectiveManualMax = manualMaxAutoBid ?? manualAmount;

    // SCENARIO 1: MANUAL BIDDER WINS
    // The manual bidder (or their new proxy) overpowers the existing proxy.
    if (bestProxyMax < effectiveManualMax) {
      let bidsCreated = 1;
      let dyingBreathAutoBid: BidEntry | undefined;

      // 1. The existing proxy fights to its death at its maximum capacity
      // Only create if its max is higher than the current price
      if (bestProxyMax > currentPrice) {
        dyingBreathAutoBid = await this.repo.saveBidTransaction({
          auctionId,
          bidderId: bestProxy.bidderId,
          amount: bestProxyMax,
          isAutoBid: true,
          newCurrentPrice: bestProxyMax,
        });
        bidsCreated = 2;
      }

      // 2. The manual bidder wins by 1 increment above the proxy's death, 
      // OR by their explicitly typed flat amount, whichever is higher.
      const winningAmount = Math.max(manualAmount, bestProxyMax + bidIncrement);

      const winningBid = await this.repo.saveBidTransaction({
        auctionId,
        bidderId: manualBidderId,
        amount: winningAmount,
        maxAutoBid: manualMaxAutoBid ?? null,
        isAutoBid: false,
        ipAddress,
        newCurrentPrice: winningAmount,
      });

      return {
        type: 'manual_wins',
        bid: winningBid,               // The winning bid
        manualBid: dyingBreathAutoBid, // The losing proxy's dying breath
        currentPrice: winningAmount,
        bidsCreated,
      };
    } 
    
    // SCENARIO 2: EXISTING PROXY WINS (OR TIES)
    // The manual bidder's max is lower than or equal to the existing proxy.
    else {
      // 1. The manual bidder fights to their death
      const manualRecordAmount = effectiveManualMax;
      
      const manualBid = await this.repo.saveBidTransaction({
        auctionId,
        bidderId: manualBidderId,
        amount: manualRecordAmount,
        maxAutoBid: manualMaxAutoBid ?? null,
        isAutoBid: false,
        ipAddress,
        newCurrentPrice: manualRecordAmount,
      });

      // 2. The existing proxy auto-bids just enough to beat them
      // (If it was a tie, the proxy still wins because it was placed earlier)
      let proxyBidAmount = manualRecordAmount + bidIncrement;

      // Cap at proxy's own max
      if (proxyBidAmount > bestProxyMax) {
        proxyBidAmount = bestProxyMax;
      }

      const autoBid = await this.repo.saveBidTransaction({
        auctionId,
        bidderId: bestProxy.bidderId,
        amount: proxyBidAmount,
        isAutoBid: true,
        newCurrentPrice: proxyBidAmount,
      });

      return {
        type: 'proxy_outbid',
        bid: autoBid,            // The winning auto-bid
        manualBid: manualBid,    // The losing manual/proxy bid
        currentPrice: proxyBidAmount,
        proxyOwnerId: bestProxy.bidderId,
        bidsCreated: 2,
      };
    }
  }

  // ── Anti-Sniping ──────────────────────────────────────────────────────────

  private async checkAntiSniping(
    auctionId: string,
    auction: {
      endTime: Date;
      autoExtend: boolean;
      autoExtendMinutes: number;
      autoExtendThreshold: number;
      extendCount: number;
      maxExtendCount: number;
    },
  ): Promise<{
    extended: boolean;
    newEndTime?: string;
    extendCount?: number;
    maxExtendCount?: number;
  }> {
    if (!auction.autoExtend) return { extended: false };
    if (auction.extendCount >= auction.maxExtendCount) return { extended: false };

    const now = Date.now();
    const endTimeMs = auction.endTime.getTime();
    const remainingMs = endTimeMs - now;
    const thresholdMs = auction.autoExtendThreshold * 60 * 1000;

    if (remainingMs > thresholdMs) return { extended: false };

    const extensionMs = auction.autoExtendMinutes * 60 * 1000;
    const newEndTime = new Date(endTimeMs + extensionMs);
    const newExtendCount = auction.extendCount + 1;

    // Update auction endTime and extendCount
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        endTime: newEndTime,
        extendCount: newExtendCount,
      },
    });

    // Reschedule BullMQ end job
    try {
      const oldJobId = `end-${auctionId}`;
      const existingJob = await auctionQueue.getJob(oldJobId);
      if (existingJob) await existingJob.remove();
    } catch {
      // Job may not exist — safe to ignore
    }
    await scheduleAuctionEnd(auctionId, newEndTime);

    return {
      extended: true,
      newEndTime: newEndTime.toISOString(),
      extendCount: newExtendCount,
      maxExtendCount: auction.maxExtendCount,
    };
  }

  // ── Buyout End Helper ─────────────────────────────────────────────────────

  private async handleBuyoutEnd(
    auctionId: string,
    buyerId: string,
    bidId: string,
    finalPrice: number,
  ): Promise<void> {
    // Update auction winner
    await this.repo.endAuctionWithWinner(auctionId, buyerId, bidId, finalPrice);

    // Cancel the scheduled end job
    try {
      const job = await auctionQueue.getJob(`end-${auctionId}`);
      if (job) await job.remove();
    } catch {
      // Safe to ignore
    }

    // Create payment record
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { sellerId: true },
    });

    if (auction) {
      const platformFee = finalPrice * 0.05; // 5% platform fee
      await prisma.payment.create({
        data: {
          auctionId,
          buyerId,
          sellerId: auction.sellerId,
          amount: new Decimal(finalPrice),
          platformFee: new Decimal(platformFee),
          sellerAmount: new Decimal(finalPrice - platformFee),
          paymentMethod: 'banking',
          status: 'pending',
        },
      });

      // Schedule payment timeout (48h)
      await schedulePaymentTimeout(auctionId, buyerId);
    }

    // Close chat room
    await prisma.chatRoom.updateMany({
      where: { auctionId },
      data: { isActive: false },
    });
  }
}
