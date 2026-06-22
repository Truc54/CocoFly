import crypto from 'crypto';
import { env } from '../config/env';

/**
 * VNPay Payment Gateway Adapter
 *
 * Handles creating payment URLs and verifying IPN callbacks
 * from VNPay sandbox/production environment.
 *
 * References: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */

interface VNPayCreateParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
  locale?: 'vn' | 'en';
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }
  return sorted;
}

function sortObjectVerify(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key])
      .replace(/%20/g, '+')
      .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }
  return sorted;
}

function formatVNPayDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function createVNPayUrl(params: VNPayCreateParams): string {
  const createDate = new Date();
  const expireDate = new Date(createDate.getTime() + 15 * 60 * 1000);

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: env.VNPAY_TMN_CODE,
    vnp_Locale: params.locale || 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(params.amount * 100).toString(),
    vnp_ReturnUrl: env.VNPAY_RETURN_URL,
    vnp_IpAddr: params.ipAddress === '::1' ? '127.0.0.1' : params.ipAddress,
    vnp_CreateDate: formatVNPayDate(createDate),
    vnp_ExpireDate: formatVNPayDate(expireDate),
  };

  const sorted = sortObject(vnpParams);
  const signData = Object.entries(sorted)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
    
  const hmac = crypto.createHmac('sha512', env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const finalUrl = `${env.VNPAY_URL}?${signData}&vnp_SecureHash=${signed}`;

  return finalUrl;
}

export function verifyVNPayReturn(query: Record<string, string>): {
  isValid: boolean;
  orderId: string;
  amount: number;
  responseCode: string;
  transactionId: string;
} {
  const secureHash = query['vnp_SecureHash'];
  const params = { ...query };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sorted = sortObjectVerify(params);
  const signData = Object.entries(sorted)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
    
  const hmac = crypto.createHmac('sha512', env.VNPAY_HASH_SECRET);
  const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    isValid: secureHash === checkSum,
    orderId: query['vnp_TxnRef'] || '',
    amount: parseInt(query['vnp_Amount'] || '0', 10) / 100,
    responseCode: query['vnp_ResponseCode'] || '',
    transactionId: query['vnp_TransactionNo'] || '',
  };
}

export const VNPAY_RESPONSE_CODES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ.',
  '09': 'Thẻ/Tài khoản chưa đăng ký InternetBanking.',
  '10': 'Xác thực thông tin thẻ không đúng quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '13': 'Sai mật khẩu xác thực (OTP).',
  '24': 'Khách hàng hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Nhập sai mật khẩu quá số lần quy định.',
  '99': 'Lỗi không xác định.',
};
