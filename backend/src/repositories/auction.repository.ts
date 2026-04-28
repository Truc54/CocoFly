import prisma from '../config/prisma';
import { AuctionStatus, Prisma } from '@prisma/client';

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

  switch (period) {
    case 'today':
      return { scheduledStart: { gte: startOfToday, lt: startOfTomorrow } };
    case 'tomorrow':
      return { scheduledStart: { gte: startOfTomorrow, lt: endOfTomorrow } };
    case 'this_week':
      return { scheduledStart: { gte: startOfToday, lt: endOfWeek } };
    case 'all':
    default:
      return { scheduledStart: { gt: now } };
  }
}

export class AuctionRepository {
  async create(data: any): Promise<string> {
    return 'new-auction-id';
  }

  async saveBid(auctionId: string, bidData: any): Promise<void> {
    // prisma.bid.create({ data: { ... }})
  }

  async findById(id: string): Promise<any> {
    return null;
  }

  async findActiveAuctions(options: ActiveAuctionOptions) {
    const { page, limit, categoryId, sort } = options;

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
}
