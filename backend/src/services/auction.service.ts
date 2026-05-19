import { AuctionRepository, CreateAuctionResult } from '../repositories/auction.repository';
import { CreateAuctionInput } from '../validators/auction.validator';
import { scheduleAuctionActivation } from '../queues/auction.queue';
import { AuctionStatus } from '@prisma/client';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary.config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginatedResult {
  auctions: any[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AuctionService {
  private auctionRepository = new AuctionRepository();

  // ── Create Auction ─────────────────────────────────────────────────────────

  public async createAuction(sellerId: string, input: CreateAuctionInput): Promise<CreateAuctionResult> {
    // Verify seller account status
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { accountStatus: true, role: true },
    });

    if (!seller) {
      throw new AppError('Không tìm thấy tài khoản', 404);
    }

    if (seller.role !== 'seller') {
      throw new AppError('Chỉ tài khoản Seller mới được tạo đấu giá', 403);
    }

    if (seller.accountStatus !== 'active') {
      throw new AppError('Tài khoản chưa được kích hoạt hoặc đã bị khóa', 403);
    }

    // Verify category exists and is active
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { isActive: true },
    });

    if (!category || !category.isActive) {
      throw new AppError('Danh mục không tồn tại hoặc đã bị vô hiệu hóa', 400);
    }

    // Move images from temp to permanent folder on Cloudinary
    if (input.media && input.media.length > 0) {
      const movePromises = input.media.map(async (m) => {
        try {
          await cloudinary.api.update(m.storageKey, {
            asset_folder: 'cocofly/auctions',
          });
        } catch (error) {
          console.error(`[AuctionService] Failed to move image ${m.storageKey}:`, error);
        }
      });
      await Promise.all(movePromises);
    }

    // Create Item + Media + Auction + ChatRoom in one transaction
    const result = await this.auctionRepository.createAuctionWithItem(sellerId, input);

    // Schedule activation via BullMQ (outside transaction — non-blocking)
    try {
      const scheduledStart = new Date(input.scheduledStart);
      await scheduleAuctionActivation(result.auctionId, scheduledStart);
    } catch (scheduleErr) {
      console.error(`[AuctionService] Lên lịch thất bại cho auction ${result.auctionId}:`, scheduleErr);
    }

    return result;
  }

  // ── Get Single Auction ─────────────────────────────────────────────────────

  public async getAuctionById(auctionId: string) {
    const auction = await this.auctionRepository.findById(auctionId);

    if (!auction) {
      throw new AppError('Phiên đấu giá không tồn tại', 404);
    }

    return this.formatAuctionDetail(auction);
  }

  // ── Get Bid History ────────────────────────────────────────────────────────

  public async getBidHistory(auctionId: string, page: number, limit: number) {
    // Verify auction exists
    const exists = await this.auctionRepository.findById(auctionId);
    if (!exists) throw new AppError('Phiên đấu giá không tồn tại', 404);

    const { bids, total } = await this.auctionRepository.getBidHistory(auctionId, page, limit);

    return {
      bids: bids.map((b: any) => ({
        id: b.id,
        amount: Number(b.amount),
        createdAt: b.createdAt,
        isAutoBid: b.isAutoBid || b.maxAutoBid !== null,
        bidder: {
          id: b.bidder.id,
          fullName: b.bidder.fullName,
          avatarUrl: b.bidder.avatarUrl,
        },
      })),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Get User's Bid Status ─────────────────────────────────────────────────

  public async getUserBidStatus(auctionId: string, userId: string) {
    const highestBid = await this.auctionRepository.findHighestBid(auctionId);
    const isLeading = highestBid ? highestBid.bidderId === userId : false;
    
    const hasBid = await this.auctionRepository.hasUserBid(auctionId, userId);

    // Find user's active proxy bid
    const allProxies = await this.auctionRepository.findActiveProxyBids(auctionId);
    const userProxy = allProxies.find((p: any) => p.bidderId === userId);
    const proxyMaxBid = userProxy?.maxAutoBid ? Number(userProxy.maxAutoBid) : null;

    return {
      isLeading,
      proxyMaxBid,
      hasBid,
    };
  }

  // ── Bidding is handled via Socket.IO → BiddingService ───────────────────

  // ── Listing pages ──────────────────────────────────────────────────────────

  async getLiveAuctions(options: {
    page: number;
    limit: number;
    categoryId?: number;
    sort?: string;
    search?: string;
  }): Promise<PaginatedResult> {
    const { auctions, total } = await this.auctionRepository.findActiveAuctions(options);

    return {
      auctions: auctions.map(this.formatAuctionResponse),
      pagination: {
        page: options.page,
        limit: options.limit,
        totalItems: total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getUpcomingAuctions(options: {
    page: number;
    limit: number;
    categoryId?: number;
    period?: string;
    search?: string;
    sort?: string;
  }): Promise<PaginatedResult> {
    const { auctions, total } = await this.auctionRepository.findUpcomingAuctions(options);

    return {
      auctions: auctions.map(this.formatAuctionResponse),
      pagination: {
        page: options.page,
        limit: options.limit,
        totalItems: total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  // ── Search Suggestions ─────────────────────────────────────────────────

  async getSuggestions(query: string, limit: number, status: string) {
    const auctionStatus = status === 'scheduled' ? AuctionStatus.scheduled : AuctionStatus.active;
    const results = await this.auctionRepository.searchSuggestions(query, limit, auctionStatus);

    return results.map((auction) => ({
      id: auction.id,
      title: auction.item.title,
      thumbnailUrl: auction.item.media?.[0]?.cdnUrl ?? null,
      currentPrice: auctionStatus === AuctionStatus.active ? Number(auction.currentPrice) : undefined,
      scheduledStart: auctionStatus === AuctionStatus.scheduled ? auction.scheduledStart : undefined,
    }));
  }

  // ── Format helpers ─────────────────────────────────────────────────────────

  // Used for listing pages (thumbnail only)
  private formatAuctionResponse(auction: any) {
    const thumbnail = auction.item?.media?.[0];

    return {
      id: auction.id,
      title: auction.item?.title,
      thumbnailUrl: thumbnail?.cdnUrl ?? null,
      category: auction.item?.category ?? null,
      condition: auction.item?.condition,
      location: auction.item?.location,
      currentPrice: Number(auction.currentPrice),
      startingPrice: Number(auction.startingPrice),
      bidIncrement: Number(auction.bidIncrement),
      scheduledStart: auction.scheduledStart,
      endTime: auction.endTime,
      totalBids: auction.totalBids,
      totalWatchers: auction.totalWatchers,
      seller: auction.seller
        ? {
            id: auction.seller.id,
            fullName: auction.seller.fullName,
            avatarUrl: auction.seller.avatarUrl,
            rating: Number(auction.seller.rating),
          }
        : null,
    };
  }

  // Used for detail page (full media[], bids, chatRoomId)
  private formatAuctionDetail(auction: any) {
    return {
      id: auction.id,
      status: auction.status,
      auctionType: auction.auctionType,
      title: auction.item?.title,
      description: auction.item?.description,
      condition: auction.item?.condition,
      brand: auction.item?.brand,
      location: auction.item?.location,
      category: auction.item?.category ?? null,
      media: (auction.item?.media ?? []).map((m: any) => ({
        id: m.id,
        cdnUrl: m.cdnUrl,
        storageKey: m.storageKey,
        mimeType: m.mimeType,
        fileSize: m.fileSize ? Number(m.fileSize) : null,
        width: m.width,
        height: m.height,
        sortOrder: m.sortOrder,
        type: m.type,
      })),
      currentPrice: Number(auction.currentPrice),
      startingPrice: Number(auction.startingPrice),
      buyoutPrice: auction.buyoutPrice ? Number(auction.buyoutPrice) : null,
      bidIncrement: Number(auction.bidIncrement),
      scheduledStart: auction.scheduledStart,
      endTime: auction.endTime,
      actualEndTime: auction.actualEndTime ?? null,
      autoExtend: auction.autoExtend,
      autoExtendMinutes: auction.autoExtendMinutes,
      autoExtendThreshold: auction.autoExtendThreshold,
      totalBids: auction.totalBids,
      totalWatchers: auction.totalWatchers,
      chatRoomId: auction.chatRoom?.id ?? null,
      winnerId: auction.winnerId ?? null,
      winnerName: auction.winner?.fullName ?? null,
      finalPrice: auction.finalPrice ? Number(auction.finalPrice) : null,
      seller: auction.seller
        ? {
            id: auction.seller.id,
            fullName: auction.seller.fullName,
            avatarUrl: auction.seller.avatarUrl,
            rating: Number(auction.seller.rating),
          }
        : null,
      recentBids: (auction.bids ?? []).map((b: any) => ({
        id: b.id,
        amount: Number(b.amount),
        createdAt: b.createdAt,
        isAutoBid: b.isAutoBid || b.maxAutoBid !== null,
        bidder: {
          id: b.bidder.id,
          fullName: b.bidder.fullName,
          avatarUrl: b.bidder.avatarUrl,
        },
      })),
    };
  }

  // ── Seller Auction Management ──────────────────────────────────────────────

  async getSellerAuctions(sellerId: string, tab: string = 'ongoing', page: number = 1, limit: number = 10): Promise<PaginatedResult> {
    const statusMap: Record<string, AuctionStatus[]> = {
      ongoing: [AuctionStatus.active],
      upcoming: [AuctionStatus.scheduled],
      ended: [AuctionStatus.ended, AuctionStatus.failed],
    };

    const statuses = statusMap[tab] || statusMap.ongoing;
    const { auctions, total } = await this.auctionRepository.findSellerAuctions(sellerId, statuses, page, limit);

    return {
      auctions: auctions.map((auction: any) => {
        const thumbnail = auction.item?.media?.[0];
        const payment = auction.payments?.[0] ?? null;

        return {
          id: auction.id,
          status: auction.status,
          title: auction.item?.title,
          thumbnailUrl: thumbnail?.cdnUrl ?? null,
          category: auction.item?.category ?? null,
          currentPrice: Number(auction.currentPrice),
          startingPrice: Number(auction.startingPrice),
          finalPrice: auction.finalPrice ? Number(auction.finalPrice) : null,
          bidIncrement: Number(auction.bidIncrement),
          scheduledStart: auction.scheduledStart,
          endTime: auction.endTime,
          actualEndTime: auction.actualEndTime ?? null,
          totalBids: auction.totalBids,
          totalWatchers: auction.totalWatchers,
          viewCount: auction.viewCount,
          winner: auction.winner
            ? { id: auction.winner.id, fullName: auction.winner.fullName, avatarUrl: auction.winner.avatarUrl }
            : null,
          payment: payment
            ? { id: payment.id, status: payment.status, shippingStatus: payment.shippingStatus }
            : null,
        };
      }),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteAuction(auctionId: string, sellerId: string): Promise<void> {
    const result = await this.auctionRepository.deleteScheduledAuction(auctionId, sellerId);

    // Cancel scheduled BullMQ activation job
    try {
      const { auctionQueue } = require('../queues/auction.queue');
      const job = await auctionQueue.getJob(`activate-${auctionId}`);
      if (job) await job.remove();
    } catch (err) {
      console.error(`[AuctionService] Failed to cancel scheduled job for ${auctionId}:`, err);
    }

    // Cleanup Cloudinary images (non-blocking)
    try {
      const mediaRecords = await prisma.itemMedia.findMany({
        where: { itemId: result.itemId },
        select: { storageKey: true },
      });
      if (mediaRecords.length > 0) {
        const deletePromises = mediaRecords.map((m) =>
          cloudinary.uploader.destroy(m.storageKey).catch(() => null),
        );
        Promise.all(deletePromises).catch(() => null);
      }
    } catch {
      // Media already deleted by transaction, skip
    }
  }

  async updateAuction(auctionId: string, sellerId: string, data: any): Promise<{ auctionId: string; itemId: string }> {
    // Move any new images to permanent folder on Cloudinary
    if (data.media && data.media.length > 0) {
      const movePromises = data.media.map(async (m: any) => {
        try {
          await cloudinary.api.update(m.storageKey, {
            asset_folder: 'cocofly/auctions',
          });
        } catch (error) {
          console.error(`[AuctionService] Failed to move image ${m.storageKey}:`, error);
        }
      });
      await Promise.all(movePromises);
    }

    const result = await this.auctionRepository.updateScheduledAuction(auctionId, sellerId, data);
    const { removedMediaKeys } = result as any;

    // Reschedule BullMQ job if scheduledStart changed
    if (data.scheduledStart) {
      try {
        const { auctionQueue } = require('../queues/auction.queue');
        const oldJob = await auctionQueue.getJob(`activate-${auctionId}`);
        if (oldJob) await oldJob.remove();
        await scheduleAuctionActivation(auctionId, new Date(data.scheduledStart));
      } catch (err) {
        console.error(`[AuctionService] Failed to reschedule job for ${auctionId}:`, err);
      }
    }

    // Cleanup removed Cloudinary images (non-blocking)
    if (removedMediaKeys && removedMediaKeys.length > 0) {
      try {
        const deletePromises = removedMediaKeys.map((storageKey: string) =>
          cloudinary.uploader.destroy(storageKey).catch(() => null),
        );
        Promise.all(deletePromises).catch(() => null);
      } catch {
        // Skip on error
      }
    }

    return result;
  }
}
