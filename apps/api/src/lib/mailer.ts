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
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const confirmLink = `${clientUrl}/confirm-email?token=${otp}&email=${encodeURIComponent(toEmail)}`;

  if (!transporter) {
    console.warn(
      `\n============================================================\n` +
      `[DEVELOPMENT OTP FALLBACK] (No SMTP Configured)\n` +
      `Gửi tới: ${toEmail}\n` +
      `Tên học sinh: ${studentName}\n` +
      `Mã OTP: ${otp}\n` +
      `Link xác thực nhanh: ${confirmLink}\n` +
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
          
          <!-- Quick Verification Link -->
          <div style="text-align: center; margin: 28px 0; padding: 10px; background: #fafafa; border-radius: 12px; border: 1px solid #eee;">
            <p style="font-size: 13.5px; color: #475569; margin: 0 0 14px 0; font-weight: 600;">Hoặc kích hoạt nhanh tài khoản bằng cách nhấn nút dưới đây:</p>
            <a href="${confirmLink}" target="_blank" style="background: linear-gradient(135deg, #6c5ce7, #8e2de2); color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 800; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(108,92,231,0.2); border: 1.5px solid #000000; text-transform: uppercase; letter-spacing: 0.5px;">
              Kích hoạt tài khoản ngay
            </a>
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

export async function sendResetPasswordEmail(toEmail: string, studentName: string, resetLink: string): Promise<boolean> {
  if (!transporter) {
    console.error(`[Mailer Error] Cannot send reset password email to ${toEmail}. SMTP credentials missing.`);
    return false;
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; padding: 30px 20px; color: #2d3436; line-height: 1.6;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(108,92,231,0.08); border: 1px solid #e8ecf1;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e17055, #d63031); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px;">EduPath AI</div>
          <div style="font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Khôi phục mật khẩu tài khoản</div>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 30px 24px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1e293b;">YÊU CẦU ĐẶT LẠI MẬT KHẨU</h2>
          <p style="font-size: 14px; color: #636e72; margin: 0 0 20px 0;">
            Chào <strong>${studentName}</strong>,<br/>
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của em tại hệ thống học tập EduPath AI. Em vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu mới:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" target="_blank" style="background: linear-gradient(135deg, #e17055, #d63031); color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 15px; font-weight: 700; border-radius: 10px; display: inline-block; box-shadow: 0 5px 15px rgba(214,48,49,0.3); transition: all 0.3s ease;">
              ĐẶT LẠI MẬT KHẨU NGAY
            </a>
          </div>

          <p style="font-size: 13.5px; color: #636e72; margin: 20px 0 0 0;">
            Hoặc em có thể copy đường dẫn dưới đây và dán vào trình duyệt:
            <br/>
            <a href="${resetLink}" target="_blank" style="color: #d63031; word-break: break-all; font-size: 12.5px;">${resetLink}</a>
          </p>
          
          <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0 0; line-height: 1.5; font-style: italic;">
            Đường dẫn đặt lại mật khẩu này chỉ có hiệu lực trong vòng 15 phút. Nếu em không gửi yêu cầu này, em có thể bỏ qua email này một cách an sau.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e8ecf1; font-size: 11.5px; color: #94a3b8;">
          <div>Đội ngũ hỗ trợ học tập EduPath AI</div>
          <div style="margin-top: 4px; font-weight: 500; color: #e17055;">Học đúng hướng · Thi đúng đích</div>
        </div>
      </div>
    </div>
  `;

  try {
    console.log(`[Mailer] Sending reset password email to: ${toEmail}...`);
    await transporter.sendMail({
      from: `"EduPath Support" <${smtpUser}>`,
      to: toEmail,
      subject: `[EduPath AI] Đường dẫn đặt lại mật khẩu tài khoản`,
      html: htmlContent
    });
    console.log(`[Mailer] Reset password email successfully delivered to: ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer Error] Failed to send reset password email to ${toEmail}:`, err);
    return false;
  }
}

export async function sendResetPasswordOTPEmail(toEmail: string, userName: string, otp: string): Promise<boolean> {
  if (!transporter) {
    console.warn(
      `\n============================================================\n` +
      `[DEVELOPMENT PASSWORD RESET OTP FALLBACK] (No SMTP Configured)\n` +
      `Gửi tới: ${toEmail}\n` +
      `Tên người dùng: ${userName}\n` +
      `Mã OTP khôi phục: ${otp}\n` +
      `============================================================\n`
    );
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; padding: 30px 20px; color: #2d3436; line-height: 1.6;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(108,92,231,0.08); border: 1px solid #e8ecf1;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e17055, #d63031); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px;">EduPath AI</div>
          <div style="font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Khôi phục mật khẩu tài khoản</div>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 30px 24px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #1e293b;">MÃ XÁC THỰC KHÔI PHỤC MẬT KHẨU</h2>
          <p style="font-size: 14px; color: #636e72; margin: 0 0 20px 0;">
            Chào <strong>${userName}</strong>,<br/>
            Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của em tại hệ thống học tập EduPath AI. Để tiến hành đặt lại mật khẩu mới, em vui lòng sử dụng mã xác thực OTP dưới đây:
          </p>
          
          <!-- OTP Display Block -->
          <div style="background: #fff5f5; border: 1.5px dashed #d63031; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #d63031; letter-spacing: 1px; margin-bottom: 8px;">Mã xác thực khôi phục của em</div>
            <div style="font-size: 36px; font-weight: 800; color: #d63031; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">${otp}</div>
            <div style="font-size: 11.5px; color: #636e72; margin-top: 10px; font-style: italic;">Mã có hiệu lực trong vòng 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai!</div>
          </div>
          
          <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0 0; line-height: 1.5;">
            Nếu em không thực hiện yêu cầu khôi phục mật khẩu này tại EduPath, em có thể bỏ qua email này một cách an toàn.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e8ecf1; font-size: 11.5px; color: #94a3b8;">
          <div>Đội ngũ hỗ trợ học tập EduPath AI</div>
          <div style="margin-top: 4px; font-weight: 500; color: #e17055;">Học đúng hướng · Thi đúng đích</div>
        </div>
      </div>
    </div>
  `;

  try {
    console.log(`[Mailer] Sending reset password OTP email to: ${toEmail}...`);
    await transporter.sendMail({
      from: `"EduPath Support" <${smtpUser}>`,
      to: toEmail,
      subject: `[EduPath AI] Mã xác thực khôi phục mật khẩu: ${otp}`,
      html: htmlContent
    });
    console.log(`[Mailer] Reset password OTP email successfully delivered to: ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer Error] Failed to send reset password OTP email to ${toEmail}:`, err);
    return false;
  }
}


export async function sendRoleChangeNotification(
  toEmail: string,
  userName: string,
  status: 'APPROVED' | 'REJECTED',
  newRole?: string
): Promise<boolean> {
  const isApproved = status === 'APPROVED';
  const statusText = isApproved ? 'ĐÃ ĐƯỢC DUYỆT ✅' : 'ĐÃ BỊ TỪ CHỐI ❌';
  const statusColor = isApproved ? '#00b894' : '#e17055';

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

export async function sendWeeklyPraiseEmail(
  toEmail: string,
  studentName: string,
  rankType: string,
  metricValue: string | number
): Promise<boolean> {
  const displayRankType = rankType === 'xp' 
    ? 'Điểm tích lũy học tập (XP)' 
    : (rankType === 'streak' ? 'Chuỗi ngày học liên tục (Streaks)' : 'Số lượng khóa học hoàn thành');
  const unitLabel = rankType === 'xp' ? 'XP' : (rankType === 'streak' ? 'ngày' : 'khóa học');

  if (!transporter) {
    console.warn(
      `\n============================================================\n` +
      `[DEVELOPMENT WEEKLY PRAISE EMAIL FALLBACK] (No SMTP Configured)\n` +
      `Gửi tới: ${toEmail}\n` +
      `Tên học sinh: ${studentName}\n` +
      `Hạng mục: Thủ khoa tuần - ${displayRankType}\n` +
      `Thành tích đạt được: ${metricValue} ${unitLabel}\n` +
      `============================================================\n`
    );
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; padding: 30px 20px; color: #2d3436; line-height: 1.6;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(108,92,231,0.08); border: 1px solid #e8ecf1;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f1c40f, #f39c12); padding: 32px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 28px; margin-bottom: 8px;">🏆👑🏅</div>
          <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px;">THƯ VINH DANH THỦ KHOA TUẦN</div>
          <div style="font-size: 13px; opacity: 0.9; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Bảng xếp hạng thành tích EduPath AI</div>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 30px 24px; text-align: center;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #d35400;">CHÚC MỪNG THÀNH TÍCH XUẤT SẮC CỦA EM!</h2>
          <p style="font-size: 14.5px; color: #2c3e50; text-align: left; margin: 0 0 20px 0;">
            Chào <strong>${studentName}</strong>,<br/><br/>
            Đội ngũ học thuật EduPath AI vô cùng tự hào được thông báo rằng em đã xuất sắc dẫn đầu bảng xếp hạng tuần qua tại hệ thống học tập thông minh EduPath AI.
          </p>
          
          <div style="background: #fffdf0; border: 2px solid #f1c40f; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; box-shadow: 0 4px 15px rgba(241,196,15,0.1);">
            <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #d35400; letter-spacing: 1px; margin-bottom: 8px;">Hạng mục dẫn đầu</div>
            <div style="font-size: 17px; font-weight: 800; color: #2c3e50; margin-bottom: 12px;">🌟 ${displayRankType} 🌟</div>
            <div style="font-size: 13.5px; color: #7f8c8d; margin-bottom: 4px;">Thành tích ghi nhận trong tuần qua:</div>
            <div style="font-size: 32px; font-weight: 900; color: #e67e22;">${metricValue} ${unitLabel}</div>
          </div>
          
          <p style="font-size: 14.5px; color: #2d3436; text-align: left; margin: 20px 0 0 0; line-height: 1.6;">
            Sự nỗ lực, kiên trì và tinh thần hiếu học phi thường của em chính là tấm gương sáng cho tất cả các bạn học sinh khác tại EduPath. Hy vọng em sẽ tiếp tục duy trì ngọn lửa đam mê và gặt hái thêm nhiều thành tựu rực rỡ hơn nữa trong chặng đường sắp tới!
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e8ecf1; font-size: 11.5px; color: #94a3b8;">
          <div>Đội ngũ hỗ trợ học tập EduPath AI</div>
          <div style="margin-top: 4px; font-weight: 500; color: #f39c12;">Học đúng hướng · Thi đúng đích</div>
        </div>
      </div>
    </div>
  `;

  try {
    console.log(`[Mailer] Sending weekly praise email to: ${toEmail}...`);
    await transporter.sendMail({
      from: `"EduPath Support" <${smtpUser}>`,
      to: toEmail,
      subject: `[EduPath Tuyên Dương] Tuyên dương thủ khoa tuần học tập: ${studentName}`,
      html: htmlContent
    });
    console.log(`[Mailer] Weekly praise email successfully delivered to: ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer Error] Failed to send weekly praise email to ${toEmail}:`, err);
    return false;
  }
}
