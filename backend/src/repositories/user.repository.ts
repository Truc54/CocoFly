import prisma from '../config/prisma';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: { email: string; passwordHash: string | null; fullName: string; isVerified?: boolean }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        isVerified: data.isVerified ?? false,
      },
    });
  }

  async deleteById(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async updateIsVerified(id: string, isVerified: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isVerified },
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
}
