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
