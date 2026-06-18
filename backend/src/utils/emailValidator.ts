import dns from 'dns';
import { promisify } from 'util';
import { AppError } from './AppError';

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
    throw new AppError('Định dạng email không hợp lệ', 400);
  }

  const domain = parts[1].toLowerCase();

  // 1. Chặn các nhà cung cấp email rác/tạm thời
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw new AppError('Hệ thống không hỗ trợ đăng ký bằng email tạm thời/email rác', 400);
  }

  // 2. Xác thực tên miền email có bản ghi MX (để đảm bảo có nhận mail thực sự)
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new AppError('Tên miền email không tồn tại hoặc không thể nhận thư', 400);
    }
  } catch (error: any) {
    // dns.resolveMx sẽ ném lỗi nếu không tìm thấy bản ghi MX hoặc tên miền không tồn tại
    throw new AppError('Email không tồn tại hoặc tên miền không hỗ trợ nhận thư', 400);
  }
}
