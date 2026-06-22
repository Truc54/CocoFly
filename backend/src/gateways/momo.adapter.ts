import crypto from 'crypto';
import https from 'https';
import { env } from '../config/env';

/**
 * MoMo Payment Gateway Adapter
 *
 * Test card info (ATM nội địa on UAT):
 * - Thẻ: 9704 0000 0000 0018
 * - Tên: NGUYEN VAN A
 * - Ngày phát hành: 03/07
 * - OTP: nhập chữ "OTP"
 *
 * References: https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime
 */

interface MoMoCreateParams {
  orderId: string;
  amount: number;
  orderInfo: string;
}

interface MoMoCreateResponse {
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
  requestId: string;
  orderId: string;
  resultCode: number;
  message: string;
}

interface MoMoIPNData {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

function createSignature(rawData: string): string {
  return crypto
    .createHmac('sha256', env.MOMO_SECRET_KEY)
    .update(rawData)
    .digest('hex');
}

export async function createMoMoPayment(params: MoMoCreateParams): Promise<MoMoCreateResponse> {
  const requestId = `${env.MOMO_PARTNER_CODE}${Date.now()}`;
  const requestType = 'payWithMethod';
  const extraData = '';

  const rawSignature =
    `accessKey=${env.MOMO_ACCESS_KEY}` +
    `&amount=${params.amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${env.MOMO_NOTIFY_URL}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&partnerCode=${env.MOMO_PARTNER_CODE}` +
    `&redirectUrl=${env.MOMO_RETURN_URL}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  const signature = createSignature(rawSignature);

  const requestBody = JSON.stringify({
    partnerCode: env.MOMO_PARTNER_CODE,
    partnerName: 'CocoFly Auction',
    storeId: 'CocoFlyStore',
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl: env.MOMO_RETURN_URL,
    ipnUrl: env.MOMO_NOTIFY_URL,
    lang: 'vi',
    requestType,
    autoCapture: true,
    extraData,
    signature,
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(env.MOMO_API_URL);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body) as MoMoCreateResponse);
        } catch {
          reject(new Error(`MoMo response parse error: ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`MoMo request failed: ${err.message}`)));
    req.write(requestBody);
    req.end();
  });
}

export function verifyMoMoIPN(data: MoMoIPNData): {
  isValid: boolean;
  orderId: string;
  amount: number;
  resultCode: number;
  transactionId: string;
  message: string;
} {
  const getSafe = (val: any) => (val === undefined || val === null ? '' : String(val));

  const rawSignature =
    `accessKey=${env.MOMO_ACCESS_KEY}` +
    `&amount=${getSafe(data.amount)}` +
    `&extraData=${getSafe(data.extraData)}` +
    `&message=${getSafe(data.message)}` +
    `&orderId=${getSafe(data.orderId)}` +
    `&orderInfo=${getSafe(data.orderInfo)}` +
    `&orderType=${getSafe(data.orderType)}` +
    `&partnerCode=${getSafe(data.partnerCode)}` +
    `&payType=${getSafe(data.payType)}` +
    `&requestId=${getSafe(data.requestId)}` +
    `&responseTime=${getSafe(data.responseTime)}` +
    `&resultCode=${getSafe(data.resultCode)}` +
    `&transId=${getSafe(data.transId)}`;

  const checkSignature = createSignature(rawSignature);

  return {
    isValid: checkSignature === data.signature,
    orderId: data.orderId,
    amount: data.amount,
    resultCode: data.resultCode,
    transactionId: data.transId ? data.transId.toString() : '',
    message: data.message,
  };
}

export const MOMO_RESULT_CODES: Record<number, string> = {
  0: 'Giao dịch thành công',
  9000: 'Giao dịch đã được xác nhận thành công',
  1000: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận',
  11: 'Truy cập bị từ chối',
  13: 'Xác thực Merchant thất bại',
  20: 'Yêu cầu sai định dạng',
  21: 'Số tiền giao dịch không hợp lệ',
  40: 'RequestId bị trùng',
  41: 'OrderId bị trùng',
  42: 'OrderId không hợp lệ',
  1001: 'Tài khoản người dùng không đủ tiền',
  1003: 'Giao dịch đã bị hủy',
  1005: 'URL hoặc QR code hết hạn',
  1006: 'Người dùng từ chối xác nhận thanh toán',
};
