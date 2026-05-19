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

  async getParticipatedAuctions(userId: string) {
    const rawAuctions = await this.userRepository.getParticipatedAuctions(userId);

    const formattedAuctions = rawAuctions.map(auction => {
      const myMaxBid = auction.bids.length > 0 ? auction.bids[0].amount : null;
      const latestPayment = auction.payments.length > 0 ? auction.payments[0] : null;

      let status: 'bidding' | 'won' | 'delivering' | 'received' = 'bidding';

      // Determine status
      if (auction.status === 'active' || auction.status === 'scheduled') {
        status = 'bidding';
      } else if (auction.winnerId === userId) {
        if (latestPayment?.shippingStatus === 'delivered' || latestPayment?.shippingStatus === 'returned' || latestPayment?.status === 'escrow_released') {
          status = 'received';
        } else if (latestPayment?.shippingStatus === 'shipped') {
          status = 'delivering';
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
        myBid: myMaxBid ? formatCurrency(myMaxBid) : undefined,
        isPaid: latestPayment?.status === 'paid' || latestPayment?.status === 'escrow_released',
      };
    });

    return formattedAuctions;
  }
}
