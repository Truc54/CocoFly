import prisma from '../config/prisma';
import redis from '../config/redis';

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
      where: { status: { in: ['opened', 'under_review'] } },
    });
    const disputesThisMonth = await prisma.dispute.count({
      where: { status: { in: ['opened', 'under_review'] }, createdAt: { gte: startOfThisMonth } },
    });
    const disputesLastMonth = await prisma.dispute.count({
      where: {
        status: { in: ['opened', 'under_review'] },
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
}
