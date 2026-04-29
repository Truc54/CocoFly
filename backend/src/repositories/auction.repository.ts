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
}

interface UpcomingAuctionOptions extends ListOptions {
  period?: string;
  search?: string;
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
      return { createdAt: 'desc' };
    case 'most_bids':
      return { totalBids: 'desc' };
    case 'price_asc':
      return { currentPrice: 'asc' };
    case 'price_desc':
      return { currentPrice: 'desc' };
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
          include: { media: { orderBy: { sortOrder: 'asc' } } },
        },
        seller: {
          select: { id: true, fullName: true, avatarUrl: true, rating: true },
        },
      },
    });
  }

  // ── Read List (Listing pages) ──────────────────────────────────────────────

  async findActiveAuctions(options: ActiveAuctionOptions) {
    const { page, limit, categoryId, sort } = options;

    // status: 'active' is the single source of truth.
    // The worker sets status → 'ended' when endTime arrives,
    // so no endTime filter needed here.
    const where: Prisma.AuctionWhereInput = {
      status: AuctionStatus.active,
      ...(categoryId ? { item: { categoryId } } : {}),
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

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: AUCTION_INCLUDE,
        orderBy: { scheduledStart: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auction.count({ where }),
    ]);

    return { auctions, total };
  }

  // ── Bid (placeholder for future) ──────────────────────────────────────────

  async saveBid(auctionId: string, bidData: any): Promise<void> {
    // prisma.bid.create({ data: { ... }})
  }
}
