import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export class EmailService {
  async sendOtpEmail(to: string, code: string): Promise<void> {
    try {
      const result = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
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

      if (result.error) {
        console.error('[EmailService] Resend API error:', result.error);
        throw new Error(`Không thể gửi email đến ${to}: ${result.error.message}`);
      }

      console.log(`[EmailService] OTP email sent to ${to}, id: ${result.data?.id}`);
    } catch (err: any) {
      console.error('[EmailService] Failed to send OTP email:', err.message || err);
      throw err;
    }
  }

  async sendPasswordResetOtpEmail(to: string, code: string): Promise<void> {
    try {
      const result = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
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

      if (result.error) {
        console.error('[EmailService] Resend API error:', result.error);
        throw new Error(`Không thể gửi email đến ${to}: ${result.error.message}`);
      }

      console.log(`[EmailService] Password reset OTP email sent to ${to}, id: ${result.data?.id}`);
    } catch (err: any) {
      console.error('[EmailService] Failed to send password reset OTP email:', err.message || err);
      throw err;
    }
  }

  async sendSecurityAlertEmail(to: string, ip: string): Promise<void> {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
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
  }
}
