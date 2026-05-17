import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  FACEBOOK_APP_ID: z.string().min(1),
  FACEBOOK_APP_SECRET: z.string().min(1),
  FACEBOOK_CALLBACK_URL: z.string().url(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // VNPay Sandbox
  VNPAY_TMN_CODE: z.string().min(1),
  VNPAY_HASH_SECRET: z.string().min(1),
  VNPAY_URL: z.string().url().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNPAY_API_URL: z.string().url().default('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'),
  VNPAY_RETURN_URL: z.string().url().default('http://localhost:3000/payments/vnpay-return'),

  // MoMo Sandbox
  MOMO_PARTNER_CODE: z.string().default('MOMO'),
  MOMO_ACCESS_KEY: z.string().default('F8BBA842ECF85'),
  MOMO_SECRET_KEY: z.string().default('K951B6PE1waDMi640xX08PD3vg6EkVlz'),
  MOMO_API_URL: z.string().url().default('https://test-payment.momo.vn/v2/gateway/api/create'),
  MOMO_RETURN_URL: z.string().url().default('http://localhost:3000/payments/momo-return'),
  MOMO_NOTIFY_URL: z.string().url().default('http://localhost:8000/api/payments/momo/ipn'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
