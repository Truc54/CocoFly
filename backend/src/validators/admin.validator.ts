import { z } from 'zod';

export const banUserSchema = z.object({
  reason: z
    .string({ message: 'Lý do ban là bắt buộc' })
    .min(1, 'Lý do ban không được để trống')
    .max(500, 'Lý do ban không được vượt quá 500 ký tự'),
});

export const changeRoleSchema = z.object({
  role: z.enum(['buyer', 'seller', 'admin'], {
    message: 'Vai trò không hợp lệ',
  }),
});

export const refundPaymentSchema = z.object({
  reason: z
    .string({ message: 'Lý do hoàn tiền là bắt buộc' })
    .min(1, 'Lý do hoàn tiền không được để trống')
    .max(500, 'Lý do hoàn tiền không được vượt quá 500 ký tự'),
});

export const resolveDisputeSchema = z.object({
  refundBuyer: z.boolean().optional().default(false),
  strikeSeller: z.boolean().optional().default(false),
  strikeBuyer: z.boolean().optional().default(false),
  note: z
    .string({ message: 'Ghi chú phân xử là bắt buộc' })
    .min(1, 'Ghi chú phân xử không được để trống')
    .max(1000, 'Ghi chú phân xử không được vượt quá 1000 ký tự'),
});
