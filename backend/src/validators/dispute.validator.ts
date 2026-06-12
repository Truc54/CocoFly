import { z } from 'zod';

export const respondDisputeSchema = z.object({
  response: z.string().min(10, 'Phản hồi phải dài ít nhất 10 ký tự'),
});
