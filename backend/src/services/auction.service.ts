import { AuctionRepository, CreateAuctionResult } from '../repositories/auction.repository';
import { CreateAuctionInput } from '../validators/auction.validator';
import { scheduleAuctionActivation } from '../queues/auction.queue';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary.config';

export class AuctionService {
  private auctionRepository = new AuctionRepository();

  public async createAuction(sellerId: string, input: CreateAuctionInput): Promise<CreateAuctionResult> {
    // Verify seller account status
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { accountStatus: true, role: true },
    });

    if (!seller) {
      throw new AppError('Không tìm thấy tài khoản', 404);
    }

    if (seller.role !== 'seller') {
      throw new AppError('Chỉ tài khoản Seller mới được tạo đấu giá', 403);
    }

    if (seller.accountStatus !== 'active') {
      throw new AppError('Tài khoản chưa được kích hoạt hoặc đã bị khóa', 403);
    }

    // Verify category exists and is active
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { isActive: true },
    });

    if (!category || !category.isActive) {
      throw new AppError('Danh mục không tồn tại hoặc đã bị vô hiệu hóa', 400);
    }

    // Move images from temp to permanent folder on Cloudinary
    if (input.media && input.media.length > 0) {
      const movePromises = input.media.map(async (m) => {
        try {
          await cloudinary.api.update(m.storageKey, {
            asset_folder: 'cocofly/auctions',
          });
        } catch (error) {
          console.error(`[AuctionService] Failed to move image ${m.storageKey}:`, error);
        }
      });
      await Promise.all(movePromises);
    }

    // Create Item + Media + Auction + ChatRoom in one transaction
    const result = await this.auctionRepository.createAuctionWithItem(sellerId, input);

    // Schedule activation via BullMQ (outside transaction — non-blocking)
    try {
      const scheduledStart = new Date(input.scheduledStart);
      await scheduleAuctionActivation(result.auctionId, scheduledStart);
    } catch (scheduleErr) {
      console.error(`[AuctionService] Lên lịch thất bại cho auction ${result.auctionId}:`, scheduleErr);
    }

    return result;
  }

  public async getAuctionById(auctionId: string) {
    const auction = await this.auctionRepository.findById(auctionId);

    if (!auction) {
      throw new AppError('Phiên đấu giá không tồn tại', 404);
    }

    return auction;
  }
}
