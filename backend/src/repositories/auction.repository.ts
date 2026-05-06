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
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            createdAt: true,
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

  // ── Bid (placeholder for future) ──────────────────────────────────────────

  async saveBid(auctionId: string, bidData: any): Promise<void> {
    // prisma.bid.create({ data: { ... }})
  }
}
