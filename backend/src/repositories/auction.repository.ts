import prisma from '../config/prisma';
import { AuctionStatus, Prisma } from '@prisma/client';
import { CreateAuctionInput } from '../validators/auction.validator';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CreateAuctionResult {
  auctionId: string;
  itemId: string;
}

interface ListOptions {
  page: number;
  limit: number;
  categoryId?: number;
}

interface ActiveAuctionOptions extends ListOptions {
  sort?: string;
  search?: string;
}

interface UpcomingAuctionOptions extends ListOptions {
  period?: string;
  search?: string;
  sort?: string;
}

// ─── Shared Prisma Include ────────────────────────────────────────────────────

const AUCTION_INCLUDE = {
  item: {
    include: {
      media: { where: { sortOrder: 0 }, take: 1 },
      category: { select: { id: true, name: true } },
    },
  },
  seller: {
    select: { id: true, fullName: true, avatarUrl: true, rating: true },
  },
} satisfies Prisma.AuctionInclude;

// ─── Sort/Filter Helpers ──────────────────────────────────────────────────────

function buildSortOrder(sort?: string): Prisma.AuctionOrderByWithRelationInput {
  switch (sort) {
    case 'newest':
      return { scheduledStart: 'desc' };
    case 'most_bids':
      return { totalBids: 'desc' };
    case 'price_asc':
      return { currentPrice: 'asc' };
    case 'price_desc':
      return { currentPrice: 'desc' };
    case 'starts_soon':
      return { scheduledStart: 'asc' };
    case 'ending_soon':
    default:
      return { endTime: 'asc' };
  }
}

function buildPeriodFilter(period?: string): Prisma.AuctionWhereInput {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfTomorrow = new Date(startOfTomorrow);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  // status is the single source of truth — worker manages transitions.
  // Period filter only adds time-range narrowing for user-selected filters.
  // 'all' adds no extra constraint: status: 'scheduled' already covers it.
  switch (period) {
    case 'today':
      return { scheduledStart: { gte: startOfToday, lt: startOfTomorrow } };
    case 'tomorrow':
      return { scheduledStart: { gte: startOfTomorrow, lt: endOfTomorrow } };
    case 'this_week':
      return { scheduledStart: { gte: startOfToday, lt: endOfWeek } };
    case 'all':
    default:
      return {}; // No time constraint — rely solely on status: 'scheduled'
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class AuctionRepository {
  // ── Create ─────────────────────────────────────────────────────────────────

  public async createAuctionWithItem(
    sellerId: string,
    input: CreateAuctionInput,
  ): Promise<CreateAuctionResult> {
    const result = await prisma.$transaction(async (tx) => {
      // a. Create Item
      const item = await tx.item.create({
        data: {
          sellerId,
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          condition: input.condition,
          brand: input.brand,
          location: input.location,
          status: 'in_auction',
        },
      });

      // b. Create ItemMedia (bulk)
      await tx.itemMedia.createMany({
        data: input.media.map((m) => ({
          itemId: item.id,
          uploaderId: sellerId,
          type: 'image' as const,
          purpose: m.sortOrder === 0 ? 'thumbnail' as const : 'gallery' as const,
          storageKey: m.storageKey,
          cdnUrl: m.cdnUrl,
          mimeType: m.mimeType,
          fileSize: m.fileSize ? BigInt(m.fileSize) : null,
          width: m.width,
          height: m.height,
          sortOrder: m.sortOrder,
          processStatus: 'ready' as const,
        })),
      });

      // c. Create Auction
      const auction = await tx.auction.create({
        data: {
          itemId: item.id,
          sellerId,
          startingPrice: new Decimal(input.startingPrice),
          currentPrice: new Decimal(input.startingPrice),
          buyoutPrice: input.buyoutPrice ? new Decimal(input.buyoutPrice) : null,
          bidIncrement: new Decimal(input.bidIncrement),
          auctionType: input.auctionType,
          status: 'scheduled',
          scheduledStart: new Date(input.scheduledStart),
          endTime: new Date(input.endTime),
          autoExtend: input.autoExtend,
          autoExtendMinutes: input.autoExtendMinutes,
          autoExtendThreshold: input.autoExtendThreshold,
        },
      });

      // d. Create ChatRoom
      await tx.chatRoom.create({
        data: {
          auctionId: auction.id,
        },
      });

      return { auctionId: auction.id, itemId: item.id };
    });

    return result;
  }

  // ── Read Single ────────────────────────────────────────────────────────────

  public async findById(id: string) {
    return prisma.auction.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            media: { orderBy: { sortOrder: 'asc' } },
            category: { select: { id: true, name: true } },
          },
        },
        seller: {
          select: { id: true, fullName: true, avatarUrl: true, rating: true },
        },
        winner: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            createdAt: true,
            isAutoBid: true,
            maxAutoBid: true,
            bidder: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
        chatRoom: { select: { id: true } },
      },
    });
  }

  // ── Bid History (paginated) ────────────────────────────────────────────────

  public async getBidHistory(auctionId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where: { auctionId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          createdAt: true,
          isAutoBid: true,
          maxAutoBid: true,
          bidder: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.bid.count({ where: { auctionId } }),
    ]);

    return { bids, total };
  }

  // ── Read List (Listing pages) ──────────────────────────────────────────────

  async findActiveAuctions(options: ActiveAuctionOptions) {
    const { page, limit, categoryId, sort, search } = options;

    // status: 'active' is the single source of truth.
    // The worker sets status → 'ended' when endTime arrives,
    // so no endTime filter needed here.
    const where: Prisma.AuctionWhereInput = {
      status: AuctionStatus.active,
      ...(categoryId ? { item: { categoryId } } : {}),
      ...(search
        ? {
            item: {
              ...(categoryId ? { categoryId } : {}),
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: AUCTION_INCLUDE,
        orderBy: buildSortOrder(sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auction.count({ where }),
    ]);

    return { auctions, total };
  }

  async findUpcomingAuctions(options: UpcomingAuctionOptions) {
    const { page, limit, categoryId, period, search } = options;

    const where: Prisma.AuctionWhereInput = {
      status: AuctionStatus.scheduled,
      ...buildPeriodFilter(period),
      ...(categoryId ? { item: { categoryId } } : {}),
      ...(search
        ? { item: { title: { contains: search, mode: 'insensitive' as const } } }
        : {}),
    };

    const orderBy = buildSortOrder(options.sort || 'starts_soon');

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: AUCTION_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auction.count({ where }),
    ]);

    return { auctions, total };
  }

  // ── Search Suggestions ──────────────────────────────────────────────────

  async searchSuggestions(query: string, limit: number, status: AuctionStatus) {
    const suggestionSelect = {
      id: true,
      currentPrice: true,
      scheduledStart: true,
      status: true,
      item: {
        select: {
          title: true,
          media: { where: { sortOrder: 0 }, take: 1, select: { cdnUrl: true } },
        },
      },
    } satisfies Prisma.AuctionSelect;

    // Priority 1: title STARTS WITH keyword (most relevant)
    const startsWithResults = await prisma.auction.findMany({
      where: {
        status,
        item: { title: { startsWith: query, mode: 'insensitive' } },
      },
      select: suggestionSelect,
      orderBy: { totalBids: 'desc' },
      take: limit,
    });

    const remaining = limit - startsWithResults.length;
    if (remaining <= 0) return startsWithResults;

    const excludeIds = startsWithResults.map((a) => a.id);

    // Priority 2: title OR description CONTAINS keyword
    const containsResults = await prisma.auction.findMany({
      where: {
        status,
        id: { notIn: excludeIds },
        item: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      select: suggestionSelect,
      orderBy: { totalBids: 'desc' },
      take: remaining,
    });

    return [...startsWithResults, ...containsResults];
  }

  // ── Bidding Methods ─────────────────────────────────────────────────────────

  async getAuctionForBidding(auctionId: string) {
    return prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        currentPrice: true,
        startingPrice: true,
        buyoutPrice: true,
        bidIncrement: true,
        endTime: true,
        autoExtend: true,
        autoExtendMinutes: true,
        autoExtendThreshold: true,
        extendCount: true,
        maxExtendCount: true,
        totalBids: true,
      },
    });
  }

  async saveBidTransaction(data: {
    auctionId: string;
    bidderId: string;
    amount: number;
    maxAutoBid?: number | null;
    isAutoBid: boolean;
    ipAddress?: string | null;
    newCurrentPrice: number;
    auctionUpdates?: Record<string, any>;
  }) {
    return prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          auctionId: data.auctionId,
          bidderId: data.bidderId,
          amount: new Decimal(data.amount),
          maxAutoBid: data.maxAutoBid != null ? new Decimal(data.maxAutoBid) : null,
          isAutoBid: data.isAutoBid,
          ipAddress: data.ipAddress ?? null,
        },
        select: {
          id: true,
          amount: true,
          isAutoBid: true,
          maxAutoBid: true,
          createdAt: true,
          bidder: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      });

      await tx.auction.update({
        where: { id: data.auctionId },
        data: {
          currentPrice: new Decimal(data.newCurrentPrice),
          totalBids: { increment: 1 },
          ...data.auctionUpdates,
        },
      });

      const result = {
        id: bid.id,
        amount: Number(bid.amount),
        isAutoBid: bid.isAutoBid || bid.maxAutoBid !== null,
        createdAt: bid.createdAt,
        bidder: bid.bidder,
      };
      console.log(`[saveBidTransaction] Returning bid:`, JSON.stringify(result, null, 2));
      return result;
    });
  }

  async findHighestBid(auctionId: string) {
    return prisma.bid.findFirst({
      where: { auctionId, isValid: true },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        bidderId: true,
        amount: true,
        createdAt: true,
      },
    });
  }

  async findRunnerUpBid(auctionId: string, winnerId: string) {
    return prisma.bid.findFirst({
      where: { auctionId, isValid: true, bidderId: { not: winnerId } },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        bidderId: true,
        amount: true,
      },
    });
  }

  async hasUserBid(auctionId: string, userId: string) {
    const count = await prisma.bid.count({
      where: { auctionId, bidderId: userId, isValid: true },
    });
    return count > 0;
  }

  async findActiveProxyBids(auctionId: string) {
    return prisma.bid.findMany({
      where: {
        auctionId,
        maxAutoBid: { not: null },
        isValid: true,
      },
      orderBy: [{ maxAutoBid: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        bidderId: true,
        amount: true,
        maxAutoBid: true,
        createdAt: true,
      },
    });
  }

  async endAuctionWithWinner(auctionId: string, winnerId: string, winningBidId: string, finalPrice: number) {
    return prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: AuctionStatus.ended,
        winnerId,
        winningBidId,
        finalPrice: new Decimal(finalPrice),
        actualEndTime: new Date(),
      },
    });
  }

  async endAuctionFailed(auctionId: string) {
    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.failed,
          actualEndTime: new Date(),
        },
        select: { itemId: true },
      });

      await tx.item.update({
        where: { id: auction.itemId },
        data: { status: 'active' },
      });
    });
  }

  // ── Seller Auction Management ──────────────────────────────────────────────

  async findSellerAuctions(sellerId: string, statuses: AuctionStatus[], page: number, limit: number) {
    const where: Prisma.AuctionWhereInput = {
      sellerId,
      status: { in: statuses },
    };

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          item: {
            include: {
              media: { where: { sortOrder: 0 }, take: 1 },
              category: { select: { id: true, name: true } },
            },
          },
          winner: { select: { id: true, fullName: true, avatarUrl: true } },
          payments: {
            where: { status: { in: ['pending', 'processing', 'paid', 'escrow_released'] } },
            select: { id: true, status: true, shippingStatus: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auction.count({ where }),
    ]);

    return { auctions, total };
  }

  async deleteScheduledAuction(auctionId: string, sellerId: string) {
    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        select: { id: true, sellerId: true, status: true, itemId: true },
      });

      if (!auction) throw new Error('Phiên đấu giá không tồn tại');
      if (auction.sellerId !== sellerId) throw new Error('Bạn không có quyền xóa phiên đấu giá này');
      if (auction.status !== AuctionStatus.scheduled) throw new Error('Chỉ có thể xóa phiên đấu giá chưa bắt đầu');

      // Delete chatRoom, auction, media, item (cascade order)
      await tx.chatRoom.deleteMany({ where: { auctionId } });
      await tx.auction.delete({ where: { id: auctionId } });
      await tx.itemMedia.deleteMany({ where: { itemId: auction.itemId } });
      await tx.item.delete({ where: { id: auction.itemId } });

      return { itemId: auction.itemId };
    });
  }

  async updateScheduledAuction(auctionId: string, sellerId: string, data: {
    title?: string;
    description?: string;
    condition?: string;
    brand?: string;
    location?: string;
    categoryId?: number;
    startingPrice?: number;
    buyoutPrice?: number | null;
    bidIncrement?: number;
    scheduledStart?: string;
    endTime?: string;
    media?: any[];
  }) {
    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        select: { id: true, sellerId: true, status: true, itemId: true },
      });

      if (!auction) throw new Error('Phiên đấu giá không tồn tại');
      if (auction.sellerId !== sellerId) throw new Error('Bạn không có quyền chỉnh sửa phiên đấu giá này');
      if (auction.status !== AuctionStatus.scheduled) throw new Error('Chỉ có thể chỉnh sửa phiên đấu giá chưa bắt đầu');

      // Update Item fields
      const itemUpdate: Record<string, any> = {};
      if (data.title !== undefined) itemUpdate.title = data.title;
      if (data.description !== undefined) itemUpdate.description = data.description;
      if (data.condition !== undefined) itemUpdate.condition = data.condition;
      if (data.brand !== undefined) itemUpdate.brand = data.brand;
      if (data.location !== undefined) itemUpdate.location = data.location;
      if (data.categoryId !== undefined) itemUpdate.categoryId = data.categoryId;

      if (Object.keys(itemUpdate).length > 0) {
        await tx.item.update({ where: { id: auction.itemId }, data: itemUpdate });
      }

      // Update Auction fields
      const auctionUpdate: Record<string, any> = {};
      if (data.startingPrice !== undefined) {
        auctionUpdate.startingPrice = new Decimal(data.startingPrice);
        auctionUpdate.currentPrice = new Decimal(data.startingPrice);
      }
      if (data.buyoutPrice !== undefined) {
        auctionUpdate.buyoutPrice = data.buyoutPrice !== null ? new Decimal(data.buyoutPrice) : null;
      }
      if (data.bidIncrement !== undefined) auctionUpdate.bidIncrement = new Decimal(data.bidIncrement);
      if (data.scheduledStart !== undefined) auctionUpdate.scheduledStart = new Date(data.scheduledStart);
      if (data.endTime !== undefined) auctionUpdate.endTime = new Date(data.endTime);

      if (Object.keys(auctionUpdate).length > 0) {
        await tx.auction.update({ where: { id: auctionId }, data: auctionUpdate });
      }

      let removedMediaKeys: string[] = [];

      // Update Media
      if (data.media) {
        // Fetch existing media to determine what was removed
        const existingMedia = await tx.itemMedia.findMany({
          where: { itemId: auction.itemId },
          select: { storageKey: true },
        });

        const newMediaKeys = data.media.map((m: any) => m.storageKey);
        removedMediaKeys = existingMedia
          .map(m => m.storageKey)
          .filter(key => !newMediaKeys.includes(key));

        // Delete all old media for this item
        await tx.itemMedia.deleteMany({ where: { itemId: auction.itemId } });

        // Insert new media
        await tx.itemMedia.createMany({
          data: data.media.map((m: any, index: number) => ({
            itemId: auction.itemId,
            uploaderId: sellerId,
            type: 'image' as const,
            purpose: m.sortOrder === 0 ? 'thumbnail' as const : 'gallery' as const,
            storageKey: m.storageKey,
            cdnUrl: m.cdnUrl,
            mimeType: m.mimeType || 'image/jpeg',
            fileSize: m.fileSize ? BigInt(m.fileSize) : null,
            width: m.width || 0,
            height: m.height || 0,
            sortOrder: m.sortOrder !== undefined ? m.sortOrder : index,
            processStatus: 'ready' as const,
          })),
        });
      }

      return { auctionId, itemId: auction.itemId, removedMediaKeys };
    });
  }

  // ── Watchlist (Favorites) ─────────────────────────────────────────────────

  async toggleWatch(auctionId: string, userId: string): Promise<boolean> {
    const existing = await prisma.auctionWatcher.findUnique({
      where: { auctionId_userId: { auctionId, userId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.auctionWatcher.delete({
          where: { auctionId_userId: { auctionId, userId } },
        }),
        prisma.auction.update({
          where: { id: auctionId },
          data: { totalWatchers: { decrement: 1 } },
        }),
      ]);
      return false; // unwatched
    }

    await prisma.$transaction([
      prisma.auctionWatcher.create({
        data: { auctionId, userId },
      }),
      prisma.auction.update({
        where: { id: auctionId },
        data: { totalWatchers: { increment: 1 } },
      }),
    ]);
    return true; // watched
  }

  async isWatching(auctionId: string, userId: string): Promise<boolean> {
    const record = await prisma.auctionWatcher.findUnique({
      where: { auctionId_userId: { auctionId, userId } },
    });
    return !!record;
  }

  async getWatchlist(userId: string, page: number, limit: number) {
    const where = { userId };
    const skip = (page - 1) * limit;

    const [watchers, total] = await Promise.all([
      prisma.auctionWatcher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          auction: {
            include: {
              item: {
                include: {
                  media: { where: { sortOrder: 0 }, take: 1 },
                  category: { select: { id: true, name: true } },
                },
              },
              seller: {
                select: { id: true, fullName: true, avatarUrl: true, rating: true },
              },
            },
          },
        },
      }),
      prisma.auctionWatcher.count({ where }),
    ]);

    return { watchers, total };
  }

  async getWatchedAuctionIds(userId: string, auctionIds: string[]): Promise<string[]> {
    const records = await prisma.auctionWatcher.findMany({
      where: { userId, auctionId: { in: auctionIds } },
      select: { auctionId: true },
    });
    return records.map((r) => r.auctionId);
  }
}
