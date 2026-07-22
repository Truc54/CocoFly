import dns from 'dns';
import { promisify } from 'util';
import { AppError } from './AppError';
import { HttpStatus } from './HttpStatus';
import { ErrorCode } from './ErrorCode';

const resolveMx = promisify(dns.resolveMx);

// Danh sách các tên miền email tạm thời/email rác phổ biến để chặn
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  '10minutemail.com',
  'dispostable.com',
  'guerrillamail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'grr.la',
  'guerrillamailde.com',
  'pokemail.net',
  'trashmail.com',
  'getairmail.com',
  'temp-mail.org',
  'dropmail.me',
  'generator.email',
  'moakt.cc',
  'smailpro.com',
  'fakemailgenerator.com',
  'emailfake.com',
  'tempmailo.com',
  'temp-mail.io',
  '10minutemail.co',
  'temporary-mail.net',
  'crazymailing.com'
]);

/**
 * Kiểm tra tính hợp lệ thực tế của email (tên miền tồn tại, có MX record và không thuộc danh sách mail rác)
 */
export async function validateEmailRealness(email: string): Promise<void> {
  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new AppError('Định dạng email không hợp lệ', HttpStatus.BAD_REQUEST, ErrorCode.EMAIL_INVALID);
  }

  const domain = parts[1].toLowerCase();

  // 1. Chặn các nhà cung cấp email rác/tạm thời
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new AppError('Hệ thống không hỗ trợ đăng ký bằng email tạm thời/email rác', HttpStatus.BAD_REQUEST, ErrorCode.EMAIL_INVALID);
  }

  // 2. Xác thực tên miền email có bản ghi MX (có timeout 2.5s để tránh nghẽn DNS trên Cloud)
  try {
    const mxPromise = resolveMx(domain);
    const timeoutPromise = new Promise<dns.MxRecord[]>((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500)
    );
    const mxRecords = await Promise.race([mxPromise, timeoutPromise]);
    if (!mxRecords || mxRecords.length === 0) {
      throw new AppError('Tên miền email không tồn tại hoặc không thể nhận thư', HttpStatus.BAD_REQUEST, ErrorCode.EMAIL_INVALID);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error.message === 'DNS_TIMEOUT') {
      console.warn(`[validateEmailRealness] DNS MX lookup timed out for ${domain}, proceeding with registration.`);
      return;
    }
    throw new AppError('Email không tồn tại hoặc tên miền không hỗ trợ nhận thư', HttpStatus.BAD_REQUEST, ErrorCode.EMAIL_INVALID);
  }
}
