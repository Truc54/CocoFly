import prisma from '../config/prisma';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: { email: string; passwordHash: string | null; fullName: string; avatarUrl?: string | null; accountStatus?: 'unverified' | 'active' | 'suspended' | 'banned' }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        accountStatus: data.accountStatus ?? 'unverified',
      },
    });
  }

  async deleteById(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async updateAccountStatus(id: string, accountStatus: 'unverified' | 'active' | 'suspended' | 'banned') {
    return prisma.user.update({
      where: { id },
      data: { accountStatus },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateAvatarUrl(id: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });
  }

  async findOAuthByProviderAndId(provider: string, providerId: string) {
    return prisma.userOAuth.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });
  }

  async findOAuthByUserAndProvider(userId: string, provider: string) {
    return prisma.userOAuth.findFirst({
      where: { userId, provider },
    });
  }

  async createOAuth(data: { userId: string; provider: string; providerId: string; rawData?: object }) {
    return prisma.userOAuth.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerId: data.providerId,
        rawData: data.rawData ?? undefined,
      },
    });
  }

  async upgradeToSeller(id: string, phone: string) {
    return prisma.user.update({
      where: { id },
      data: { role: 'seller', phone },
    });
  }

  async getFirstAddress(userId: string) {
    return prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertAddress(userId: string, data: { addressLine: string; phone: string; fullName: string }) {
    const existing = await this.getFirstAddress(userId);
    if (existing) {
      return prisma.address.update({
        where: { id: existing.id },
        data: {
          addressLine: data.addressLine,
          phone: data.phone,
          fullName: data.fullName,
        },
      });
    } else {
      return prisma.address.create({
        data: {
          userId,
          addressLine: data.addressLine,
          phone: data.phone,
          fullName: data.fullName,
          district: 'N/A', // Placeholder as per requirement
          city: 'N/A', // Placeholder as per requirement
        },
      });
    }
  }
  async getParticipatedAuctions(userId: string) {
    return prisma.auction.findMany({
      where: {
        OR: [
          { winnerId: userId },
          { bids: { some: { bidderId: userId } } }
        ]
      },
      include: {
        item: {
          include: { media: true }
        },
        seller: {
          select: { fullName: true }
        },
        bids: {
          where: { bidderId: userId },
          orderBy: { amount: 'desc' },
          take: 1
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
