import nodemailer from 'nodemailer';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const isPlaceholder = !smtpUser || !smtpPass ||
  smtpUser.includes('dia_chi_gmail_cua_ban') ||
  smtpPass.includes('mat_khau_ung_dung');

let transporter: nodemailer.Transporter | null = null;

if (smtpUser && smtpPass && !isPlaceholder) {
  console.log(`[Mailer] Initializing real Gmail SMTP transporter for: ${smtpUser}`);
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
} else {
  console.warn('[Mailer Warning] SMTP_USER and SMTP_PASS are not configured or are placeholders in your apps/api/.env file! Printing OTPs to console fallback.');
}

export async function sendOTPEmail(toEmail: string, studentName: string, otp: string): Promise<boolean> {
  if (!transporter) {
    console.warn(
      `\n============================================================\n` +
      `[DEVELOPMENT OTP FALLBACK] (No SMTP Configured)\n` +
      `Gửi tới: ${toEmail}\n` +
      `Tên học sinh: ${studentName}\n` +
      `Mã OTP: ${otp}\n` +
      `============================================================\n`
    );
    return true; // Return true to allow registration testing in development
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; padding: 30px 20px; color: #2d3436; line-height: 1.6;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(108,92,231,0.08); border: 1px solid #e8ecf1;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6c5ce7, #8e2de2); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px;">EduPath AI</div>
          <div style="font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Hệ thống giáo dục thông minh</div>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 30px 24px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1e293b;">MÃ XÁC THỰC ĐĂNG KÝ TÀI KHOẢN</h2>
          <p style="font-size: 14px; color: #636e72; margin: 0 0 20px 0;">
            Chào <strong>${studentName}</strong>,<br/>
            Cảm ơn em đã lựa chọn đồng hành cùng EduPath AI trên con đường chinh phục giảng đường Đại học mơ ước. Để hoàn tất đăng ký tài khoản, em vui lòng sử dụng mã xác thực OTP dưới đây:
          </p>
          
          <!-- OTP Display Block -->
          <div style="background: #f0edff; border: 1.5px dashed #6c5ce7; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6c5ce7; letter-spacing: 1px; margin-bottom: 8px;">Mã xác thực của em</div>
            <div style="font-size: 36px; font-weight: 800; color: #5a4bd1; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">${otp}</div>
            <div style="font-size: 11.5px; color: #636e72; margin-top: 10px; font-style: italic;">Mã có hiệu lực trong vòng 10 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!</div>
          </div>
          
          <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0 0; line-height: 1.5;">
            Nếu em không thực hiện yêu cầu đăng ký này tại EduPath, em có thể bỏ qua email này một cách an toàn.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e8ecf1; font-size: 11.5px; color: #94a3b8;">
          <div>Đội ngũ hỗ trợ học tập EduPath AI</div>
          <div style="margin-top: 4px; font-weight: 500; color: #6c5ce7;">Học đúng hướng · Thi đúng đích</div>
        </div>
      </div>
    </div>
  `;

  try {
    console.log(`[Mailer] Sending OTP email to: ${toEmail}...`);
    await transporter.sendMail({
      from: `"EduPath Support" <${smtpUser}>`,
      to: toEmail,
      subject: `[EduPath AI] Mã xác thực OTP tài khoản của em: ${otp}`,
      html: htmlContent
    });
    console.log(`[Mailer] Real OTP email successfully delivered to: ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer Error] Failed to send real OTP email to ${toEmail}:`, err);
    return false;
  }
}

export async function sendRoleChangeNotification(
  toEmail: string,
  userName: string,
  status: 'APPROVED' | 'REJECTED',
  newRole?: string
): Promise<boolean> {
  if (!transporter) {
    console.warn(
      `\n============================================================\n` +
      `[DEVELOPMENT ROLE CHANGE NOTIFICATION FALLBACK] (No SMTP Configured)\n` +
      `Gửi tới: ${toEmail}\n` +
      `Tên người dùng: ${userName}\n` +
      `Trạng thái thay đổi vai trò: ${statusText}\n` +
      `============================================================\n`
    );
    return true;
  }

  const isApproved = status === 'APPROVED';
  const statusText = isApproved ? 'ĐÃ ĐƯỢC DUYỆT ✅' : 'ĐÃ BỊ TỪ CHỐI ❌';
  const statusColor = isApproved ? '#00b894' : '#e17055';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; padding: 30px 20px; color: #2d3436; line-height: 1.6;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(108,92,231,0.08); border: 1px solid #e8ecf1;">
        <div style="background: linear-gradient(135deg, #6c5ce7, #8e2de2); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px;">EduPath AI</div>
          <div style="font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Thông báo thay đổi vai trò</div>
        </div>
        <div style="padding: 30px 24px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1e293b;">KẾT QUẢ YÊU CẦU THAY ĐỔI VAI TRÒ</h2>
          <p style="font-size: 14px; color: #636e72; margin: 0 0 20px 0;">
            Chào <strong>${userName}</strong>,<br/>
            Yêu cầu thay đổi vai trò của bạn trên EduPath AI đã được quản trị viên xem xét.
          </p>
          <div style="background: #f0edff; border: 1.5px solid ${statusColor}; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${statusColor}; letter-spacing: 1px; margin-bottom: 8px;">Trạng thái</div>
            <div style="font-size: 20px; font-weight: 800; color: ${statusColor};">${statusText}</div>
            ${isApproved && newRole ? `<div style="font-size: 13px; color: #636e72; margin-top: 8px;">Vai trò mới: <strong>${newRole}</strong></div>` : ''}
          </div>
          ${isApproved
            ? '<p style="font-size: 13px; color: #636e72;">Bạn có thể đăng nhập lại để sử dụng các chức năng với vai trò mới.</p>'
            : '<p style="font-size: 13px; color: #636e72;">Nếu bạn cho rằng đây là sai sót, vui lòng liên hệ quản trị viên.</p>'
          }
        </div>
        <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e8ecf1; font-size: 11.5px; color: #94a3b8;">
          <div>Đội ngũ hỗ trợ học tập EduPath AI</div>
          <div style="margin-top: 4px; font-weight: 500; color: #6c5ce7;">Học đúng hướng · Thi đúng đích</div>
        </div>
      </div>
    </div>
  `;

  try {
    console.log(`[Mailer] Sending role change notification to: ${toEmail}...`);
    await transporter.sendMail({
      from: `"EduPath Support" <${smtpUser}>`,
      to: toEmail,
      subject: `[EduPath AI] Kết quả yêu cầu thay đổi vai trò: ${statusText}`,
      html: htmlContent
    });
    console.log(`[Mailer] Role change notification sent to: ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer Error] Failed to send role change notification to ${toEmail}:`, err);
    return false;
  }
}

export const isRealSmtpActive = transporter !== null;

