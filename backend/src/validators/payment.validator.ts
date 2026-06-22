import { z } from 'zod';

export const openDisputeSchema = z.object({
  reason: z.string().min(10, 'Lý do khiếu nại phải dài ít nhất 10 ký tự'),
});
