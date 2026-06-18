import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { AppError } from '../utils/AppError';

export class UserService {
  private userRepository = new UserRepository();
  private tokenService = new TokenService();

  async upgradeToSeller(userId: string, phoneNumber: string) {
    if (!phoneNumber) {
      throw new AppError('Số điện thoại là bắt buộc', 400);
    }

    // 2. Find current user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    if (user.role === 'seller') {
      throw new AppError('Tài khoản đã là người bán', 409);
    }

    // 3. Update role and phone
    await this.userRepository.upgradeToSeller(userId, phoneNumber);

    // 4. Generate new tokens with updated role
    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      role: 'seller',
      email: user.email,
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    await this.tokenService.saveRefreshToken(refreshToken, user.id);

    return {
      message: 'Nâng cấp tài khoản thành công! Bạn đã trở thành người bán.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: 'seller',
        phone: phoneNumber,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async getAddress(userId: string) {
    const address = await this.userRepository.getFirstAddress(userId);
    if (!address) {
      return null;
    }
    return {
      addressLine: address.addressLine,
      phone: address.phone,
      fullName: address.fullName,
    };
  }

  async saveAddress(userId: string, addressLine: string, phone: string) {
    if (!addressLine || !phone) {
      throw new AppError('Địa chỉ và số điện thoại là bắt buộc', 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    const fullName = user.fullName || 'User';

    const updatedAddress = await this.userRepository.upsertAddress(userId, {
      addressLine,
      phone,
      fullName,
    });

    return {
      addressLine: updatedAddress.addressLine,
      phone: updatedAddress.phone,
      fullName: updatedAddress.fullName,
    };
  }

  async getParticipatedAuctions(userId: string, tab?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const [rawAuctions, counts] = await Promise.all([
      this.userRepository.getParticipatedAuctions(userId, tab, skip, take),
      this.userRepository.getParticipatedAuctionCounts(userId)
    ]);

    const formattedAuctions = rawAuctions.map(auction => {
      const myMaxBid = auction.bids.length > 0 ? auction.bids[0].amount : null;
      const latestPayment = auction.payments.length > 0 ? auction.payments[0] : null;

      let status: 'bidding' | 'won' | 'delivering' | 'received' = 'bidding';
      let deliveryCountdown: string | undefined;

      // Determine status
      if (auction.status === 'active' || auction.status === 'scheduled') {
        status = 'bidding';
      } else if (auction.winnerId === userId) {
        if (latestPayment?.shippingStatus === 'delivered' || latestPayment?.shippingStatus === 'returned' || latestPayment?.status === 'escrow_released') {
          status = 'received';
        } else if (latestPayment?.shippingStatus === 'shipped') {
          status = 'delivering';
          if (latestPayment.shippedAt) {
            const deliveryTime = new Date(latestPayment.shippedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            deliveryCountdown = deliveryTime.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            });
          }
        } else {
          status = 'won'; // encompasses unpaid, paid but pending shipping
        }
      }

      // Format currency
      const formatCurrency = (amount: any) => {
        if (!amount) return '0đ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
      };

      const thumbnail = auction.item.media.find(m => m.purpose === 'thumbnail') || auction.item.media[0];

      return {
        id: auction.id,
        name: auction.item.title,
        image: thumbnail?.cdnUrl || 'https://placehold.co/300x300',
        currentPrice: formatCurrency(auction.currentPrice),
        finalPrice: formatCurrency(auction.finalPrice),
        seller: auction.seller.fullName || 'Unknown Seller',
        date: auction.endTime.toISOString(),
        status,
        deliveryCountdown,
        myBid: myMaxBid ? formatCurrency(myMaxBid) : undefined,
        isPaid: latestPayment?.status === 'paid' || latestPayment?.status === 'escrow_released',
        paymentStatus: latestPayment?.status,
        paymentDeadline: latestPayment?.paymentDeadline ? latestPayment.paymentDeadline.toISOString() : null,
        paymentId: latestPayment?.id,
        hasReviewed: auction.reviews && auction.reviews.length > 0,
        dispute: latestPayment?.disputes && latestPayment.disputes.length > 0 ? {
          id: latestPayment.disputes[0].id,
          status: latestPayment.disputes[0].status,
          reason: latestPayment.disputes[0].reason,
        } : null,
      };
    });
    const currentTabTotal = tab ? counts[tab as keyof typeof counts] || 0 : Object.values(counts).reduce((a, b) => a + b, 0);

    return {
      data: formattedAuctions,
      meta: {
        page,
        limit,
        total: currentTabTotal,
        totalPages: Math.ceil(currentTabTotal / limit)
      },
      counts
    };
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  async getMyProfile(userId: string) {
    const user = await this.userRepository.getProfileData(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    const pinnedCount = await this.userRepository.countPinnedAuctions(userId);

    const { default: prismaClient } = await import('../config/prisma');

    // 1. Fetch transaction count
    const totalTransactions = await prismaClient.payment.count({
      where: {
        OR: [
          { buyerId: userId, status: { in: ['paid', 'escrow_released'] } },
          { sellerId: userId, status: 'escrow_released' }
        ]
      }
    });

    // 2. Read balance from DB
    const finalBalance = Number((user as any).balance || 0);

    // 3. Fetch address
    const address = await this.userRepository.getFirstAddress(userId);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone || '',
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      notificationSettings: user.notificationSettings || {},
      address: address ? address.addressLine : '',
      rating: Number(user.rating),
      totalReviews: user._count.reviewsReceived,
      role: user.role,
      phoneVerified: !!user.phone,
      joinDate: user.createdAt.toISOString(),
      pinnedCount,
      balance: finalBalance,
      totalTransactions,
    };
  }

  async updateProfile(userId: string, data: { fullName?: string; bio?: string; address?: string; avatarUrl?: string }) {
    const { address, ...profileData } = data;

    // Update user basic info
    const updateData: any = profileData;

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.updateProfile(userId, updateData);
    }

    // Update address if provided
    if (address !== undefined && address.trim() !== '') {
      // Find current user to get their phone number or just use a default
      const user = await this.userRepository.findById(userId);
      const phone = user?.phone || ''; // Fallback if no phone
      await this.saveAddress(userId, address, phone);
    }

    return this.getMyProfile(userId);
  }

  async updateNotificationSettings(userId: string, settings: any) {
    await this.userRepository.updateNotificationSettings(userId, settings);
    return { success: true, notificationSettings: settings };
  }

  // ── Pin Auction ───────────────────────────────────────────────────────────

  private static MAX_PINS = 4;

  async togglePinAuction(userId: string, auctionId: string) {
    const alreadyPinned = await this.userRepository.isPinned(userId, auctionId);

    if (alreadyPinned) {
      await this.userRepository.unpinAuction(userId, auctionId);
      return { pinned: false };
    }

    // Verify auction exists
    const { default: prismaClient } = await import('../config/prisma');
    const auction = await prismaClient.auction.findUnique({
      where: { id: auctionId },
      select: { id: true }
    });
    if (!auction) throw new AppError('Phiên đấu giá không tồn tại', 404);

    // Enforce max 3
    const currentCount = await this.userRepository.countPinnedAuctions(userId);
    if (currentCount >= UserService.MAX_PINS) {
      throw new AppError(`Bạn chỉ có thể ghim tối đa ${UserService.MAX_PINS} đấu giá`, 400);
    }

    await this.userRepository.pinAuction(userId, auctionId, currentCount);
    return { pinned: true };
  }

  // ── Related Auctions ──────────────────────────────────────────────────────

  async getMyRelatedAuctions(userId: string, page: number = 1, limit: number = 8) {
    // 1. Fetch pinned auctions
    const pinnedRows = await this.userRepository.getPinnedAuctions(userId);
    const pinnedAuctions = pinnedRows.map(pr => pr.auction);
    const pinnedIds = pinnedAuctions.map(a => a.id);
    const pinnedCount = pinnedIds.length;

    let auctions: any[] = [];
    let unpinnedTotal = 0;

    if (page === 1) {
      const remainingLimit = Math.max(0, limit - pinnedCount);
      const res = await this.userRepository.getRelatedAuctions(userId, 0, remainingLimit, pinnedIds);
      auctions = [...pinnedAuctions, ...res.auctions].slice(0, limit);
      unpinnedTotal = res.total;
    } else {
      const skip = (page - 1) * limit - pinnedCount;
      const res = await this.userRepository.getRelatedAuctions(userId, skip, limit, pinnedIds);
      auctions = res.auctions;
      unpinnedTotal = res.total;
    }

    const total = unpinnedTotal + pinnedCount;

    const formatCurrency = (amount: any) => {
      if (!amount) return '0 đ';
      return new Intl.NumberFormat('vi-VN').format(Number(amount)) + ' đ';
    };

    const data = auctions.map(auction => {
      const thumbnail = auction.item.media[0];
      const isPinned = pinnedIds.includes(auction.id);

      let role: string = '';
      if (auction.sellerId === userId) {
        role = 'Chủ đấu giá';
      } else if (auction.winnerId === userId) {
        role = 'Người chiến thắng';
      }

      return {
        id: auction.id,
        category: auction.item.category?.name?.toUpperCase() || '',
        name: auction.item.title,
        image: thumbnail?.cdnUrl || null,
        currentPrice: formatCurrency(auction.currentPrice),
        endDate: auction.endTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        bids: auction.totalBids,
        role,
        isPinned,
        status: auction.status,
      };
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  async getMyReviews(userId: string, page: number = 1, limit: number = 10) {
    const { reviews, total } = await this.userRepository.getReceivedReviews(userId, page, limit);

    const data = reviews.map(review => ({
      id: review.id,
      author: review.author.fullName || 'Người dùng',
      authorAvatar: review.author.avatarUrl,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt.toISOString(),
      type: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
      auctionTitle: review.auction?.item?.title || null,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Transactions ────────────────────────────────────────────────────────
  async getMyTransactions(userId: string, page: number, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { default: prismaClient } = await import('../config/prisma');

    const [payments, total] = await Promise.all([
      prismaClient.payment.findMany({
        where: {
          OR: [
            { buyerId: userId, status: { in: ['paid', 'escrow_released'] } },
            { sellerId: userId, status: 'escrow_released' }
          ]
        },
        include: {
          auction: { select: { item: { select: { title: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prismaClient.payment.count({
        where: {
          OR: [
            { buyerId: userId, status: { in: ['paid', 'escrow_released'] } },
            { sellerId: userId, status: 'escrow_released' }
          ]
        }
      })
    ]);

    const transactions = payments.map(p => {
      const isSender = p.buyerId === userId;
      return {
        id: p.id,
        type: isSender ? 'SEND' : 'RECEIVE',
        amount: isSender ? Number(p.amount) : Number(p.sellerAmount),
        date: (isSender ? (p.paidAt || p.createdAt) : (p.deliveredAt || p.paidAt || p.createdAt)).toISOString(),
        description: isSender
          ? `Thanh toán cho "${p.auction.item.title}"`
          : `Nhận tiền từ "${p.auction.item.title}"`,
      };
    });

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.getProfileData(userId);
    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    const pinnedCount = await this.userRepository.countPinnedAuctions(userId);

    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      rating: Number(user.rating),
      totalReviews: user._count.reviewsReceived,
      role: user.role,
      joinDate: user.createdAt.toISOString(),
      pinnedCount,
    };
  }

  async getUserRelatedAuctions(userId: string, page: number = 1, limit: number = 8) {
    return this.getMyRelatedAuctions(userId, page, limit);
  }

  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    return this.getMyReviews(userId, page, limit);
  }
}

