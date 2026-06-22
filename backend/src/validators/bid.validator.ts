import { z } from 'zod';

export const placeBidSchema = z.object({
  auctionId: z.string().uuid('ID phiên đấu giá không hợp lệ'),
  amount: z
    .number({ message: 'Số tiền đặt giá là bắt buộc' })
    .positive('Số tiền phải lớn hơn 0'),
  maxAutoBid: z
    .number()
    .positive('Giá tối đa tự động phải lớn hơn 0')
    .optional(),
}).refine(
  (data) => !data.maxAutoBid || data.maxAutoBid >= data.amount,
  { message: 'Giá tối đa tự động phải >= giá đặt', path: ['maxAutoBid'] },
);

export const buyoutSchema = z.object({
  auctionId: z.string().uuid('ID phiên đấu giá không hợp lệ'),
});

export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export type BuyoutInput = z.infer<typeof buyoutSchema>;
