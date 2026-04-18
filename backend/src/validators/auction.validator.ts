import { z } from 'zod';

const mediaItemSchema = z.object({
  cdnUrl: z.string().url('URL ảnh không hợp lệ'),
  storageKey: z.string().min(1, 'Storage key là bắt buộc'),
  mimeType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  width: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().min(0, 'sortOrder phải >= 0'),
});

export const createAuctionSchema = z.object({
  // Item fields
  title: z
    .string({ message: 'Tiêu đề sản phẩm là bắt buộc' })
    .min(1, 'Tiêu đề không được rỗng')
    .max(255, 'Tiêu đề không được vượt quá 255 ký tự'),
  categoryId: z
    .number({ message: 'Danh mục là bắt buộc' })
    .int('Danh mục không hợp lệ')
    .positive('Danh mục không hợp lệ'),
  condition: z.enum(['new_item', 'like_new', 'good', 'fair', 'poor'], {
    message: 'Tình trạng sản phẩm không hợp lệ',
  }),
  description: z.string().optional(),
  brand: z.string().max(100, 'Thương hiệu không được vượt quá 100 ký tự').optional(),
  location: z.string().max(255, 'Địa chỉ không được vượt quá 255 ký tự').optional(),

  // Media
  media: z
    .array(mediaItemSchema)
    .min(1, 'Cần ít nhất 1 hình ảnh sản phẩm')
    .max(10, 'Tối đa 10 hình ảnh'),

  // Auction fields
  auctionType: z.enum(['english'], {
    message: 'Loại đấu giá không hợp lệ',
  }).default('english'),
  startingPrice: z
    .number({ message: 'Giá khởi điểm là bắt buộc' })
    .min(0, 'Giá khởi điểm phải >= 0'),
  bidIncrement: z
    .number({ message: 'Bước giá là bắt buộc' })
    .positive('Bước giá phải lớn hơn 0')
    .default(1000),
  buyoutPrice: z
    .number()
    .positive('Giá mua ngay phải lớn hơn 0')
    .optional(),
  scheduledStart: z
    .string({ message: 'Thời gian bắt đầu là bắt buộc' })
    .datetime('Thời gian bắt đầu không đúng định dạng ISO'),
  endTime: z
    .string({ message: 'Thời gian kết thúc là bắt buộc' })
    .datetime('Thời gian kết thúc không đúng định dạng ISO'),

  // Anti-sniping
  autoExtend: z.boolean().default(true),
  autoExtendMinutes: z.number().int().min(1).max(30).default(5),
  autoExtendThreshold: z.number().int().min(1).max(30).default(5),
}).superRefine((data, ctx) => {
  const now = new Date();
  const scheduledStart = new Date(data.scheduledStart);
  const endTime = new Date(data.endTime);

  if (scheduledStart < now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Thời gian bắt đầu phải ở tương lai',
      path: ['scheduledStart'],
    });
  }

  if (endTime <= scheduledStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endTime'],
    });
  } else {
    const minDuration = 60 * 60 * 1000; // 1 hour in ms
    if (endTime.getTime() - scheduledStart.getTime() < minDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phiên đấu giá phải kéo dài ít nhất 1 giờ',
        path: ['endTime'],
      });
    }
  }

  if (data.buyoutPrice !== undefined && data.buyoutPrice <= data.startingPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Giá mua ngay phải lớn hơn giá khởi điểm',
      path: ['buyoutPrice'],
    });
  }
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
