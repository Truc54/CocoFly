import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  family: 4, // Force IPv4 to prevent 2-minute ENETUNREACH timeouts on Railway
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
} as any);

export class EmailService {
  async sendOtpEmail(to: string, code: string): Promise<void> {
    try {
      const result = await transporter.sendMail({
        from: `"CocoFly" <${env.SMTP_USER}>`,
        to,
        subject: 'CocoFly - Mã xác minh tài khoản',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a; margin-bottom: 8px;">Xác minh tài khoản CocoFly</h2>
            <p style="color: #555; font-size: 15px;">Mã OTP của bạn là:</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
          </div>
        `,
      });

      console.log(`[EmailService] OTP email sent to ${to}, messageId: ${result.messageId}`);
    } catch (err: any) {
      console.error('[EmailService] Failed to send OTP email:', err.message || err);
      throw err;
    }
  }

  async sendPasswordResetOtpEmail(to: string, code: string): Promise<void> {
    try {
      const result = await transporter.sendMail({
        from: `"CocoFly" <${env.SMTP_USER}>`,
        to,
        subject: 'CocoFly - Đặt lại mật khẩu',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a; margin-bottom: 8px;">Đặt lại mật khẩu CocoFly</h2>
            <p style="color: #555; font-size: 15px;">Mã OTP để đặt lại mật khẩu của bạn là:</p>
            <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
          </div>
        `,
      });

      console.log(`[EmailService] Password reset OTP email sent to ${to}, messageId: ${result.messageId}`);
    } catch (err: any) {
      console.error('[EmailService] Failed to send password reset OTP email:', err.message || err);
      throw err;
    }
  }

  async sendSecurityAlertEmail(to: string, ip: string): Promise<void> {
    try {
      const result = await transporter.sendMail({
        from: `"CocoFly" <${env.SMTP_USER}>`,
        to,
        subject: 'CocoFly - Cảnh báo đăng nhập bất thường',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #d32f2f;">⚠️ Đăng nhập từ IP lạ</h2>
            <p style="color: #555;">Tài khoản CocoFly của bạn vừa được đăng nhập từ địa chỉ IP: <strong>${ip}</strong></p>
            <p style="color: #888; font-size: 13px;">Nếu đây không phải bạn, hãy đổi mật khẩu ngay lập tức.</p>
          </div>
        `,
      });
      console.log(`[EmailService] Security alert email sent to ${to}, messageId: ${result.messageId}`);
    } catch (err: any) {
      console.error('[EmailService] Failed to send security alert email:', err.message || err);
      throw err;
    }
  }
}
