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

export const createCategorySchema = z.object({
  name: z
    .string({ message: 'Tên danh mục là bắt buộc' })
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục không được vượt quá 100 ký tự'),
  slug: z
    .string({ message: 'Slug danh mục là bắt buộc' })
    .min(1, 'Slug không được để trống')
    .max(100, 'Slug không được vượt quá 100 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang'),
  description: z.string().max(500, 'Mô tả không được vượt quá 500 ký tự').optional().nullable(),
  parentId: z.number().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
  iconUrl: z.string().max(100, 'Icon URL không được vượt quá 100 ký tự').optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
    .optional(),
  slug: z
    .string()
    .min(1, 'Slug không được để trống')
    .max(100, 'Slug không được vượt quá 100 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang')
    .optional(),
  description: z.string().max(500, 'Mô tả không được vượt quá 500 ký tự').optional().nullable(),
  parentId: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
  iconUrl: z.string().max(100, 'Icon URL không được vượt quá 100 ký tự').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateConfigSchema = z.object({
  value: z
    .string({ message: 'Giá trị cấu hình là bắt buộc' })
    .min(1, 'Giá trị cấu hình không được để trống')
    .max(2000, 'Giá trị cấu hình không được vượt quá 2000 ký tự'),
});
