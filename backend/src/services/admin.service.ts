import prisma from '../config/prisma';
import redis from '../config/redis';
import { Decimal } from '@prisma/client/runtime/library';

export class AdminService {
  // ── Dashboard: Stats with 5-minute Redis Cache ─────────────────────────────────────
  async getDashboardStats() {
    const cacheKey = 'admin:dashboard:stats';
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Users count and growth
    const totalUsers = await prisma.user.count();
    const usersBeforeThisMonth = await prisma.user.count({
      where: { createdAt: { lt: startOfThisMonth } },
    });
    const usersBeforeLastMonth = await prisma.user.count({
      where: { createdAt: { lt: startOfLastMonth } },
    });
    const usersThisMonth = totalUsers - usersBeforeThisMonth;
    const usersLastMonth = usersBeforeThisMonth - usersBeforeLastMonth;
    let totalUsersGrowth = 0;
    if (usersLastMonth > 0) {
      totalUsersGrowth = Number((((usersThisMonth - usersLastMonth) / usersLastMonth) * 100).toFixed(1));
    }

    // 2. Active auctions count and growth
    const activeAuctions = await prisma.auction.count({
      where: { status: 'active' },
    });
    const activeAuctionsThisMonth = await prisma.auction.count({
      where: { status: 'active', createdAt: { gte: startOfThisMonth } },
    });
    const activeAuctionsLastMonth = await prisma.auction.count({
      where: {
        status: 'active',
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
      },
    });
    let activeAuctionsGrowth = 0;
    if (activeAuctionsLastMonth > 0) {
      activeAuctionsGrowth = Number((((activeAuctionsThisMonth - activeAuctionsLastMonth) / activeAuctionsLastMonth) * 100).toFixed(1));
    }

    // 3. Monthly revenue (sum of platformFee) and growth
    const revenueThisMonthAgg = await prisma.payment.aggregate({
      _sum: { platformFee: true },
      where: {
        status: { in: ['paid', 'escrow_released'] },
        createdAt: { gte: startOfThisMonth },
      },
    });
    const revenueLastMonthAgg = await prisma.payment.aggregate({
      _sum: { platformFee: true },
      where: {
        status: { in: ['paid', 'escrow_released'] },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    const monthlyRevenue = Number(revenueThisMonthAgg._sum.platformFee || 0);
    const revenueLastMonth = Number(revenueLastMonthAgg._sum.platformFee || 0);
    let monthlyRevenueGrowth = 0;
    if (revenueLastMonth > 0) {
      monthlyRevenueGrowth = Number((((monthlyRevenue - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1));
    }

    // 4. Pending disputes and growth
    const pendingDisputes = await prisma.dispute.count({
      where: { status: 'pending' },
    });
    const disputesThisMonth = await prisma.dispute.count({
      where: { status: 'pending', createdAt: { gte: startOfThisMonth } },
    });
    const disputesLastMonth = await prisma.dispute.count({
      where: {
        status: 'pending',
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
      },
    });
    let pendingDisputesGrowth = 0;
    if (disputesLastMonth > 0) {
      pendingDisputesGrowth = Number((((disputesThisMonth - disputesLastMonth) / disputesLastMonth) * 100).toFixed(1));
    }

    const stats = {
      totalUsers,
      totalUsersGrowth,
      activeAuctions,
      activeAuctionsGrowth,
      monthlyRevenue,
      monthlyRevenueGrowth,
      pendingDisputes,
      pendingDisputesGrowth,
    };

    // Cache in Redis for 5 minutes
    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 300);

    return stats;
  }

  // ── Dashboard: Revenue Chart Data (aggregated daily platformFee) ─────────────────
  async getDashboardRevenue(period: 'day' | 'week' | 'month' = 'day') {
    const cacheKey = `admin:dashboard:revenue:${period}`;
    const cachedRevenue = await redis.get(cacheKey);
    if (cachedRevenue) {
      return JSON.parse(cachedRevenue);
    }

    const now = new Date();
    let startDate = new Date();

    if (period === 'day') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 84); // 12 weeks
    } else {
      startDate.setMonth(now.getMonth() - 12); // 12 months
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: { in: ['paid', 'escrow_released'] },
        createdAt: { gte: startDate },
      },
      select: {
        platformFee: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    let data: { date: string; revenue: number }[] = [];

    if (period === 'day') {
      // Group by "YYYY-MM-DD"
      const grouped: Record<string, number> = {};
      // Initialize all 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        grouped[dateStr] = 0;
      }

      payments.forEach((p) => {
        const dateStr = p.createdAt.toISOString().split('T')[0];
        if (grouped[dateStr] !== undefined) {
          grouped[dateStr] += Number(p.platformFee);
        }
      });

      data = Object.keys(grouped).map((k) => ({
        date: k.substring(5), // "MM-DD" format for chart label
        revenue: Math.round(grouped[k]),
      }));
    } else if (period === 'week') {
      // Group by week of year
      const grouped: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i * 7);
        // Get start of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const weekStr = `Tuần ${monday.getDate()}/${monday.getMonth() + 1}`;
        grouped[weekStr] = 0;
      }

      payments.forEach((p) => {
        const d = p.createdAt;
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const weekStr = `Tuần ${monday.getDate()}/${monday.getMonth() + 1}`;
        if (grouped[weekStr] !== undefined) {
          grouped[weekStr] += Number(p.platformFee);
        }
      });

      data = Object.keys(grouped).map((k) => ({
        date: k,
        revenue: Math.round(grouped[k]),
      }));
    } else {
      // Group by Month (12 months)
      const grouped: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthStr = `Tháng ${d.getMonth() + 1}/${d.getFullYear().toString().substring(2)}`;
        grouped[monthStr] = 0;
      }

      payments.forEach((p) => {
        const d = p.createdAt;
        const monthStr = `Tháng ${d.getMonth() + 1}/${d.getFullYear().toString().substring(2)}`;
        if (grouped[monthStr] !== undefined) {
          grouped[monthStr] += Number(p.platformFee);
        }
      });

      data = Object.keys(grouped).map((k) => ({
        date: k,
        revenue: Math.round(grouped[k]),
      }));
    }

    // Cache in Redis for 5 minutes
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);

    return data;
  }

  // ── Dashboard: Recent Activity Feed ────────────────────────────────────────────────
  async getDashboardActivity() {
    const cacheKey = 'admin:dashboard:activity';
    const cachedActivity = await redis.get(cacheKey);
    if (cachedActivity) {
      return JSON.parse(cachedActivity);
    }

    // Fetch new users, new bids, disputes, and payments, combine them, sort by time.
    const [users, bids, disputes, payments] = await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, createdAt: true },
      }),
      prisma.bid.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          bidder: { select: { fullName: true } },
          auction: { select: { item: { select: { title: true } } } },
        },
      }),
      prisma.dispute.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          createdAt: true,
          openedBy: { select: { fullName: true } },
        },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          buyer: { select: { fullName: true } },
          auction: { select: { item: { select: { title: true } } } },
        },
      }),
    ]);

    const activities: any[] = [];

    users.forEach((u) => {
      activities.push({
        id: `user-${u.id}`,
        type: 'USER_REGISTERED',
        title: 'Người dùng mới đăng ký',
        description: `${u.fullName || 'Khách'} (${u.email}) đã tạo tài khoản`,
        time: u.createdAt.toISOString(),
      });
    });

    bids.forEach((b) => {
      activities.push({
        id: `bid-${b.id}`,
        type: 'BID_PLACED',
        title: 'Lượt đặt giá mới',
        description: `${b.bidder.fullName || 'Người dùng'} đã trả ${Number(b.amount).toLocaleString()}₫ cho "${b.auction.item.title}"`,
        time: b.createdAt.toISOString(),
      });
    });

    disputes.forEach((d) => {
      activities.push({
        id: `dispute-${d.id}`,
        type: 'DISPUTE_OPENED',
        title: 'Tranh chấp được mở',
        description: `${d.openedBy.fullName || 'Người dùng'} đã mở khiếu nại: "${d.reason.substring(0, 50)}..."`,
        time: d.createdAt.toISOString(),
      });
    });

    payments.forEach((p) => {
      activities.push({
        id: `payment-${p.id}`,
        type: 'PAYMENT_RECEIVED',
        title: 'Thanh toán mới',
        description: `${p.buyer.fullName || 'Người mua'} đã thanh toán ${Number(p.amount).toLocaleString()}₫ cho "${p.auction.item.title}"`,
        time: p.createdAt.toISOString(),
      });
    });

    // Sort descending by time
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const result = activities.slice(0, 10);

    // Cache in Redis for 1 minute
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);

    return result;
  }

  // ── Phase 2: User Management ──────────────────────────────────────────────────────
  async getUsers(params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.role) {
      where.role = params.role;
    }
    if (params.status) {
      where.accountStatus = params.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          role: true,
          accountStatus: true,
          nonPaymentStrikes: true,
          rating: true,
          balance: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        accountStatus: true,
        nonPaymentStrikes: true,
        rating: true,
        createdAt: true,
        sellerAuctions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            startingPrice: true,
            currentPrice: true,
            status: true,
            createdAt: true,
            item: {
              select: { title: true },
            },
          },
        },
        wonAuctions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            startingPrice: true,
            currentPrice: true,
            status: true,
            createdAt: true,
            item: {
              select: { title: true },
            },
          },
        },
        bids: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            auction: {
              select: {
                id: true,
                item: { select: { title: true } },
              },
            },
          },
        },
        buyerPayments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            auction: {
              select: {
                id: true,
                item: { select: { title: true } },
              },
            },
          },
        },
        sellerPayments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            auction: {
              select: {
                id: true,
                item: { select: { title: true } },
              },
            },
          },
        },
        reviewsReceived: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: { select: { fullName: true } },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    return user;
  }

  async banUser(actorId: string, targetId: string, reason: string) {
    if (actorId === targetId) {
      throw new Error('Bạn không thể tự khóa tài khoản của chính mình');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      throw new Error('Không tìm thấy người dùng');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: {
        accountStatus: 'banned',
        banReason: reason,
      },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'BAN_USER',
        actorId,
        targetId,
        reason,
        metadata: {
          email: targetUser.email,
          fullName: targetUser.fullName,
        },
      },
    });

    return updatedUser;
  }

  async unbanUser(actorId: string, targetId: string) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      throw new Error('Không tìm thấy người dùng');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: {
        accountStatus: 'active',
        banReason: null,
      },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'UNBAN_USER',
        actorId,
        targetId,
        reason: 'Admin kích hoạt lại tài khoản',
        metadata: {
          email: targetUser.email,
          fullName: targetUser.fullName,
        },
      },
    });

    return updatedUser;
  }

  async changeUserRole(actorId: string, targetId: string, role: 'buyer' | 'seller' | 'admin') {
    if (actorId === targetId) {
      throw new Error('Bạn không thể tự thay đổi vai trò của chính mình');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      throw new Error('Không tìm thấy người dùng');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { role },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'CHANGE_ROLE',
        actorId,
        targetId,
        reason: `Thay đổi vai trò từ ${targetUser.role} sang ${role}`,
        metadata: {
          oldRole: targetUser.role,
          newRole: role,
        },
      },
    });

    return updatedUser;
  }

  async resetUserStrikes(actorId: string, targetId: string) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      throw new Error('Không tìm thấy người dùng');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { nonPaymentStrikes: 0 },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'RESET_STRIKES',
        actorId,
        targetId,
        reason: 'Reset số gậy vi phạm thanh toán về 0',
        metadata: {
          oldStrikes: targetUser.nonPaymentStrikes,
          newStrikes: 0,
        },
      },
    });

    return updatedUser;
  }

  // ── Phase 2: Auction Management ──────────────────────────────────────────────────
  async getAuctions(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.search) {
      where.OR = [
        {
          item: {
            title: { contains: params.search, mode: 'insensitive' },
          },
        },
        {
          seller: {
            fullName: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          },
          item: {
            select: {
              title: true,
              media: {
                take: 1,
                select: { cdnUrl: true },
              },
            },
          },
        },
      }),
      prisma.auction.count({ where }),
    ]);

    return {
      auctions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAuctionById(id: string) {
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        item: {
          include: {
            category: { select: { name: true } },
            media: {
              select: { id: true, cdnUrl: true, type: true },
            },
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            bidder: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
        winner: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!auction) {
      throw new Error('Không tìm thấy phiên đấu giá');
    }

    return auction;
  }

  async forceEndAuction(actorId: string, auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { status: true, sellerId: true, itemId: true },
    });

    if (!auction) {
      throw new Error('Không tìm thấy phiên đấu giá');
    }

    if (auction.status !== 'active') {
      throw new Error('Chỉ có thể kết thúc phiên đấu giá đang hoạt động');
    }

    // Find highest valid bid
    const highestBid = await prisma.bid.findFirst({
      where: { auctionId, isValid: true },
      orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
    });

    const now = new Date();

    if (highestBid) {
      const finalPrice = Number(highestBid.amount);

      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'ended',
          winnerId: highestBid.bidderId,
          winningBidId: highestBid.id,
          finalPrice: new Decimal(finalPrice),
          actualEndTime: now,
        },
      });

      // Create Payment record (pending, 48h timeout)
      const platformFee = finalPrice * 0.05;
      await prisma.payment.create({
        data: {
          auctionId,
          buyerId: highestBid.bidderId,
          sellerId: auction.sellerId,
          amount: new Decimal(finalPrice),
          platformFee: new Decimal(platformFee),
          sellerAmount: new Decimal(finalPrice - platformFee),
          paymentMethod: 'banking',
          status: 'pending',
          paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      try {
        const { schedulePaymentTimeout } = require('../queues/payment.queue');
        await schedulePaymentTimeout(auctionId, highestBid.bidderId);
      } catch (e) {
        console.warn('Could not schedule payment timeout:', e);
      }
    } else {
      // End auction failed
      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: 'failed',
          actualEndTime: now,
        },
      });

      await prisma.item.update({
        where: { id: auction.itemId },
        data: { status: 'active' },
      });
    }

    // Close chat room
    await prisma.chatRoom.updateMany({
      where: { auctionId },
      data: { isActive: false },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'FORCE_END_AUCTION',
        actorId,
        targetId: auctionId,
        reason: 'Admin buộc kết thúc phiên đấu giá sớm',
        metadata: {
          sellerId: auction.sellerId,
          hasWinner: !!highestBid,
          winnerId: highestBid?.bidderId || null,
          price: highestBid ? Number(highestBid.amount) : null,
        },
      },
    });

    return { success: true };
  }

  async cancelAuction(actorId: string, auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { status: true, sellerId: true, itemId: true },
    });

    if (!auction) {
      throw new Error('Không tìm thấy phiên đấu giá');
    }

    if (auction.status !== 'scheduled' && auction.status !== 'active') {
      throw new Error('Chỉ có thể hủy phiên đấu giá chưa bắt đầu hoặc đang hoạt động');
    }

    const now = new Date();

    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: 'cancelled',
        actualEndTime: now,
      },
    });

    await prisma.item.update({
      where: { id: auction.itemId },
      data: { status: 'active' },
    });

    // Close chat room
    await prisma.chatRoom.updateMany({
      where: { auctionId },
      data: { isActive: false },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        actionType: 'CANCEL_AUCTION',
        actorId,
        targetId: auctionId,
        reason: 'Admin hủy phiên đấu giá',
        metadata: {
          sellerId: auction.sellerId,
          oldStatus: auction.status,
        },
      },
    });

    return { success: true };
  }

  // ── Phase 3: Payment Management Services ───────────────────────────────────────────
  async getPayments(params: { page?: number; limit?: number; status?: string; method?: string; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status as any;
    }
    if (params.method) {
      where.paymentMethod = params.method as any;
    }
    if (params.search) {
      where.OR = [
        { buyer: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { buyer: { email: { contains: params.search, mode: 'insensitive' } } },
        { seller: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { seller: { email: { contains: params.search, mode: 'insensitive' } } },
        { auction: { item: { title: { contains: params.search, mode: 'insensitive' } } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          buyer: { select: { id: true, fullName: true, email: true } },
          seller: { select: { id: true, fullName: true, email: true } },
          auction: {
            include: {
              item: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async refundPayment(actorId: string, paymentId: string, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        auction: {
          include: {
            item: { select: { title: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Không tìm thấy giao dịch thanh toán');
    }

    if (payment.status !== 'paid') {
      throw new Error('Chỉ có thể hoàn tiền cho các giao dịch đã thanh toán');
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Update payment status to refunded
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'refunded',
          refundedAt: now,
        },
      });

      // 2. Increment buyer's balance by payment.amount (exactly the original principal amount)
      await tx.user.update({
        where: { id: payment.buyerId },
        data: {
          balance: { increment: payment.amount },
        },
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          actionType: 'REFUND_PAYMENT',
          actorId,
          targetId: paymentId,
          reason,
          metadata: {
            amount: Number(payment.amount),
            auctionId: payment.auctionId,
            buyerId: payment.buyerId,
            sellerId: payment.sellerId,
          },
        },
      });
    });

    // Send notification to buyer
    try {
      const { NotificationService } = require('./notification.service');
      const notificationService = new NotificationService();
      await notificationService.send({
        userId: payment.buyerId,
        type: 'system',
        title: 'Hoàn tiền giao dịch',
        message: `Giao dịch thanh toán số tiền ${Number(payment.amount).toLocaleString()}₫ cho phiên đấu giá "${payment.auction.item.title}" đã được hoàn trả. Lý do: ${reason}`,
        auctionId: payment.auctionId,
      });
    } catch (e) {
      console.warn('Could not send refund notification:', e);
    }

    return { success: true };
  }

  // ── Phase 3: Dispute Resolution Services ──────────────────────────────────────────
  async getDisputes(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status as any;
    }
    if (params.search) {
      where.OR = [
        {
          payment: {
            auction: {
              item: {
                title: { contains: params.search, mode: 'insensitive' },
              },
            },
          },
        },
        {
          openedBy: {
            fullName: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          openedBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          payment: {
            include: {
              auction: {
                include: {
                  item: { select: { id: true, title: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDisputeById(id: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true, rating: true, createdAt: true, nonPaymentStrikes: true, avatarUrl: true } },
        resolvedBy: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        payment: {
          include: {
            auction: {
              include: {
                item: {
                  include: {
                    media: { select: { id: true, cdnUrl: true, type: true } },
                  },
                },
                seller: { select: { id: true, fullName: true, email: true, rating: true, nonPaymentStrikes: true, avatarUrl: true } },
                bids: {
                  orderBy: { createdAt: 'desc' },
                  include: { bidder: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
                },
              },
            },
            buyer: { select: { id: true, fullName: true, email: true, rating: true, avatarUrl: true } },
            seller: { select: { id: true, fullName: true, email: true, rating: true, nonPaymentStrikes: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!dispute) {
      throw new Error('Không tìm thấy thông tin tranh chấp');
    }

    return dispute;
  }

  async resolveDispute(
    actorId: string,
    id: string,
    options: { refundBuyer: boolean; strikeSeller: boolean; strikeBuyer: boolean; note: string }
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            auction: {
              include: {
                item: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      throw new Error('Không tìm thấy thông tin tranh chấp');
    }

    if (dispute.status !== 'pending') {
      throw new Error('Chỉ có thể phân xử tranh chấp chưa được giải quyết');
    }

    const MAX_NON_PAYMENT_STRIKES = 3;

    await prisma.$transaction(async (tx) => {
      // 1. Update dispute details to resolved
      await tx.dispute.update({
        where: { id },
        data: {
          status: 'resolved',
          resolutionNote: options.note,
          resolvedById: actorId,
          updatedAt: new Date(),
        },
      });

      // 2. Handle refund or release
      if (options.refundBuyer) {
        // Refund payment
        if (dispute.payment.status === 'paid') {
          await tx.payment.update({
            where: { id: dispute.paymentId },
            data: {
              status: 'refunded',
              refundedAt: new Date(),
            },
          });
          // Decrement seller's balance by payment.amount
          await tx.user.update({
            where: { id: dispute.payment.sellerId },
            data: {
              balance: { decrement: dispute.payment.amount },
            },
          });
          // Increment buyer's balance by payment.amount
          await tx.user.update({
            where: { id: dispute.payment.buyerId },
            data: {
              balance: { increment: dispute.payment.amount },
            },
          });
        }
      } else {
        // Release escrow to seller
        if (dispute.payment.status === 'paid') {
          await tx.payment.update({
            where: { id: dispute.paymentId },
            data: {
              status: 'escrow_released',
            },
          });
        }
      }

      // 3. Handle strikes for seller
      if (options.strikeSeller) {
        const updatedSeller = await tx.user.update({
          where: { id: dispute.payment.sellerId },
          data: { nonPaymentStrikes: { increment: 1 } },
          select: { nonPaymentStrikes: true },
        });

        if (updatedSeller.nonPaymentStrikes >= MAX_NON_PAYMENT_STRIKES) {
          await tx.user.update({
            where: { id: dispute.payment.sellerId },
            data: {
              accountStatus: 'suspended',
              banReason: `Nhận quá ${MAX_NON_PAYMENT_STRIKES} gậy vi phạm từ phân xử tranh chấp`,
            },
          });
        }
      }

      // 4. Handle strikes for buyer (complainant)
      if (options.strikeBuyer) {
        const updatedBuyer = await tx.user.update({
          where: { id: dispute.openedById },
          data: { nonPaymentStrikes: { increment: 1 } },
          select: { nonPaymentStrikes: true },
        });

        if (updatedBuyer.nonPaymentStrikes >= MAX_NON_PAYMENT_STRIKES) {
          await tx.user.update({
            where: { id: dispute.openedById },
            data: {
              accountStatus: 'suspended',
              banReason: `Nhận quá ${MAX_NON_PAYMENT_STRIKES} gậy vi phạm từ phân xử tranh chấp`,
            },
          });
        }
      }

      // 5. Write Audit Log
      await tx.auditLog.create({
        data: {
          actionType: 'RESOLVE_DISPUTE',
          actorId,
          targetId: id,
          reason: `Giải quyết tranh chấp: ${options.refundBuyer ? '[Hoàn tiền người mua]' : '[Không hoàn tiền]'} ${options.strikeSeller ? '[Phạt gậy người bán]' : ''} ${options.strikeBuyer ? '[Phạt gậy người mua]' : ''}. Ghi chú: ${options.note}`,
          metadata: {
            refundBuyer: options.refundBuyer,
            strikeSeller: options.strikeSeller,
            strikeBuyer: options.strikeBuyer,
            paymentId: dispute.paymentId,
            paymentStatusBefore: dispute.payment.status,
          },
        },
      });
    });

    // Send notifications to buyer and seller
    try {
      const { NotificationService } = require('./notification.service');
      const notificationService = new NotificationService();
      const title = 'Kết quả giải quyết tranh chấp';
      
      const buyerMsg = `Tranh chấp liên quan đến sản phẩm "${dispute.payment.auction.item.title}" đã được phân xử. Kết quả: ${options.refundBuyer ? 'Bạn thắng cuộc và số tiền đã được hoàn trả.' : 'Yêu cầu của bạn bị bác bỏ, giao dịch hoàn thành cho người bán.'}${options.strikeBuyer ? ' Bạn nhận 1 gậy vi phạm vì khiếu nại không hợp lệ.' : ''} Ghi chú của admin: ${options.note}`;
      const sellerMsg = `Tranh chấp liên quan đến sản phẩm "${dispute.payment.auction.item.title}" đã được phân xử. Kết quả: ${options.refundBuyer ? 'Giao dịch bị hoàn tiền cho người mua.' : 'Giao dịch hoàn thành và số tiền đã được giải ngân cho bạn.'}${options.strikeSeller ? ' Bạn nhận 1 gậy vi phạm vì vi phạm quy định đấu giá.' : ''} Ghi chú của admin: ${options.note}`;

      await Promise.all([
        notificationService.send({
          userId: dispute.payment.buyerId,
          type: 'dispute_resolved',
          title,
          message: buyerMsg,
          auctionId: dispute.payment.auctionId,
        }),
        notificationService.send({
          userId: dispute.payment.sellerId,
          type: 'dispute_resolved',
          title,
          message: sellerMsg,
          auctionId: dispute.payment.auctionId,
        }),
      ]);
    } catch (e) {
      console.warn('Could not send dispute resolution notifications:', e);
    }

    return { success: true };
  }
}
