import prisma from '../config/prisma';
import { CreateAuctionInput } from '../validators/auction.validator';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateAuctionResult {
  auctionId: string;
  itemId: string;
}

export class AuctionRepository {

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
}
