import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { sendOTPEmail, sendRoleChangeNotification, isRealSmtpActive } from '../lib/mailer.js';
import { isDisposableEmail, isValidEmailFormat } from '../lib/disposable-domains.js';
import { checkOtpSendRateLimit, recordOtpSend, checkResendCooldown, recordResendCooldown } from '../lib/rate-limiter.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edupath_jwt_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'edupath_jwt_refresh_secret_key_2026';
const JWT_TEMP_SECRET = process.env.JWT_TEMP_SECRET || 'edupath_jwt_temp_secret_2026';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─────────────────────────────────────────────────────────
// Helper: Sign Access + Refresh JWT Tokens
// ─────────────────────────────────────────────────────────
function signTokens(user: { id: number; email: string; fullName: string; role: string }) {
  const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// ─────────────────────────────────────────────────────────
// Helper: Generate 6-digit OTP
// ─────────────────────────────────────────────────────────
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────────────────
// Helper: Build standard user response payload
// ─────────────────────────────────────────────────────────
function buildUserPayload(user: any) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isPro: user.isPro,
    emailVerified: user.emailVerified,
    subjectGroup: user.student?.subjectGroup || null
  };
}

// ═════════════════════════════════════════════════════════
// LOGIN (email + password)
// ═════════════════════════════════════════════════════════
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Tài khoản của bạn đã bị khóa!' });
    }

    // If teacher, verify approved status
    if (user.role === 'TEACHER' && user.teacher && !user.teacher.isApproved) {
      return res.status(403).json({ success: false, error: 'Tài khoản Giáo viên đang chờ Quản trị viên duyệt hồ sơ!' });
    }

    const tokens = signTokens({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });

    return res.status(200).json({
      success: true,
      data: {
        ...tokens,
        user: buildUserPayload(user)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════
export async function logout(req: Request, res: Response) {
  return res.status(200).json({ success: true, data: 'Đăng xuất thành công!' });
}

// ═════════════════════════════════════════════════════════
// SEND OTP (DB-persisted, bcrypt-hashed, rate-limited)
// ═════════════════════════════════════════════════════════
export async function sendOtp(req: Request, res: Response) {
  const { email, fullName, password, role, subjectGroup, bio, phone } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin.' });
  }

  // Validate password strength
  const passwordErrors: string[] = [];
  if (password.length < 6) passwordErrors.push('tối thiểu 6 ký tự');
  if (!/[A-Z]/.test(password)) passwordErrors.push('ít nhất 1 chữ viết hoa');
  if (!/[a-z]/.test(password)) passwordErrors.push('ít nhất 1 chữ viết thường');
  if (!/[0-9]/.test(password)) passwordErrors.push('ít nhất 1 chữ số (0-9)');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) passwordErrors.push('ít nhất 1 ký tự đặc biệt');
  if (passwordErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Mật khẩu chưa đáp ứng yêu cầu: ${passwordErrors.join(', ')}.`
    });
  }

  // Validate email format
  if (!isValidEmailFormat(email)) {
    return res.status(400).json({ success: false, error: 'Địa chỉ email không hợp lệ.' });
  }

  // Check disposable email
  if (isDisposableEmail(email)) {
    return res.status(400).json({ success: false, error: 'Không hỗ trợ địa chỉ email tạm thời. Vui lòng sử dụng email thật.' });
  }

  // Check rate limit (max 3 per hour)
  const rateCheck = checkOtpSendRateLimit(email);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau ${Math.ceil((rateCheck.remainingSeconds || 3600) / 60)} phút.`
    });
  }

  // Check resend cooldown (60 seconds)
  const cooldownCheck = checkResendCooldown(email);
  if (!cooldownCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Vui lòng chờ ${cooldownCheck.remainingSeconds} giây trước khi yêu cầu mã OTP mới.`,
      data: { cooldownSeconds: cooldownCheck.remainingSeconds }
    });
  }

  try {
    // Check email not already registered
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Email này đã được đăng ký!' });
    }

    // Generate OTP and hash it
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Invalidate any previous unused OTPs for this email
    await prisma.otpVerification.updateMany({
      where: { email: email.toLowerCase(), purpose: 'REGISTRATION', isUsed: false },
      data: { isUsed: true }
    });

    // Store hashed OTP in database
    await prisma.otpVerification.create({
      data: {
        email: email.toLowerCase(),
        otpHash,
        purpose: 'REGISTRATION',
        payload: { email, fullName, password, role, subjectGroup, bio, phone },
        expiresAt: new Date(Date.now() + OTP_TTL_MS)
      }
    });

    // Record rate limit and cooldown
    recordOtpSend(email);
    recordResendCooldown(email);

    // Send email via SMTP
    const emailSent = await sendOTPEmail(email, fullName, otp);

    if (emailSent) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'Đã gửi mã OTP đến email của bạn. Hãy kiểm tra hộp thư (bao gồm cả mục Spam)!',
          expiresInMinutes: 10,
          cooldownSeconds: 60,
          devOtp: !isRealSmtpActive ? otp : undefined
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Không thể gửi email OTP. Hệ thống SMTP chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// RESEND OTP (with cooldown check)
// ═════════════════════════════════════════════════════════
export async function resendOtp(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Thiếu email.' });
  }

  // Check rate limit
  const rateCheck = checkOtpSendRateLimit(email);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau ${Math.ceil((rateCheck.remainingSeconds || 3600) / 60)} phút.`
    });
  }

  // Check cooldown
  const cooldownCheck = checkResendCooldown(email);
  if (!cooldownCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: `Vui lòng chờ ${cooldownCheck.remainingSeconds} giây trước khi yêu cầu mã mới.`,
      data: { cooldownSeconds: cooldownCheck.remainingSeconds }
    });
  }

  try {
    // Find the latest unused OTP record for this email to get the payload
    const latestRecord = await prisma.otpVerification.findFirst({
      where: { email: email.toLowerCase(), purpose: 'REGISTRATION', isUsed: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRecord || !latestRecord.payload) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy yêu cầu đăng ký nào. Vui lòng bắt đầu lại.' });
    }

    const payload = latestRecord.payload as any;

    // Invalidate old OTP
    await prisma.otpVerification.update({
      where: { id: latestRecord.id },
      data: { isUsed: true }
    });

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Store new OTP
    await prisma.otpVerification.create({
      data: {
        email: email.toLowerCase(),
        otpHash,
        purpose: 'REGISTRATION',
        payload: payload,
        expiresAt: new Date(Date.now() + OTP_TTL_MS)
      }
    });

    // Record
    recordOtpSend(email);
    recordResendCooldown(email);

    // Send email
    const emailSent = await sendOTPEmail(email, payload.fullName || email, otp);

    if (emailSent) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'Đã gửi lại mã OTP mới. Hãy kiểm tra hộp thư (bao gồm cả mục Spam)!',
          expiresInMinutes: 10,
          cooldownSeconds: 60,
          devOtp: !isRealSmtpActive ? otp : undefined
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Không thể gửi email OTP. Hệ thống SMTP chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// VERIFY OTP + REGISTER (DB lookup, attempt tracking, hash comparison)
// ═════════════════════════════════════════════════════════
export async function verifyOtpRegister(req: Request, res: Response) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Thiếu email hoặc mã OTP.' });
  }

  try {
    // Find the latest unused, non-expired OTP for this email
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: email.toLowerCase(),
        purpose: 'REGISTRATION',
        isUsed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return res.status(400).json({ success: false, error: 'Vui lòng yêu cầu mã OTP trước.' });
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true }
      });
      return res.status(400).json({ success: false, error: 'Mã OTP đã hết hạn. Hãy yêu cầu mã mới.' });
    }

    // Check max attempts
    if (record.attempts >= record.maxAttempts) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true }
      });
      return res.status(429).json({
        success: false,
        error: 'Đã vượt quá số lần thử. Vui lòng yêu cầu mã OTP mới.'
      });
    }

    // Compare OTP hash
    const isMatch = await bcrypt.compare(otp, record.otpHash);

    if (!isMatch) {
      // Increment attempt counter
      const updatedRecord = await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } }
      });
      const remaining = record.maxAttempts - updatedRecord.attempts;
      return res.status(400).json({
        success: false,
        error: `Mã OTP không chính xác. Còn ${remaining} lần thử.`,
        data: { remainingAttempts: remaining }
      });
    }

    // OTP is correct — create user account
    const payload = record.payload as any;
    const { fullName, password, role, subjectGroup, bio } = payload || {};

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedRole = role && ['STUDENT', 'TEACHER'].includes(role.toUpperCase())
      ? role.toUpperCase()
      : 'STUDENT';

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: assignedRole as any,
          isActive: true,
          emailVerified: true,
          onboardingComplete: true
        }
      });
      if (assignedRole === 'STUDENT') {
        await tx.student.create({ data: { userId: u.id, subjectGroup: subjectGroup || 'A01' } });
      } else if (assignedRole === 'TEACHER') {
        await tx.teacher.create({ data: { userId: u.id, isApproved: false, bio: bio || '' } });
      }

      // Mark OTP as used
      await tx.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true }
      });

      return tx.user.findUnique({
        where: { id: u.id },
        include: { student: true, teacher: true }
      });
    });

    if (!user) return res.status(500).json({ success: false, error: 'Không tạo được tài khoản.' });

    const tokens = signTokens({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        ...tokens,
        user: buildUserPayload(user)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// GOOGLE AUTH (detect new vs existing user)
// ═════════════════════════════════════════════════════════
export async function googleAuth(req: Request, res: Response) {
  const { email, fullName, googleId, avatarUrl } = req.body;

  if (!email || !googleId) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin Google profile.' });
  }

  try {
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      include: { student: true, teacher: true }
    });

    if (user) {
      // ── EXISTING USER ──
      // Link Google ID if not yet linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl || user.avatarUrl },
          include: { student: true, teacher: true }
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Tài khoản đã bị khóa!' });
      }
      if (user.role === 'TEACHER' && user.teacher && !user.teacher.isApproved) {
        return res.status(403).json({ success: false, error: 'Tài khoản Giáo viên đang chờ duyệt!' });
      }

      const tokens = signTokens({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });

      return res.status(200).json({
        success: true,
        data: {
          isNewUser: false,
          ...tokens,
          user: buildUserPayload(user)
        }
      });
    }

    // ── NEW USER — issue temp token for role selection ──
    const tempToken = jwt.sign(
      {
        type: 'google_onboarding',
        email,
        fullName: fullName || email.split('@')[0],
        googleId,
        avatarUrl: avatarUrl || null
      },
      JWT_TEMP_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      success: true,
      data: {
        isNewUser: true,
        needsRoleSelection: true,
        tempToken,
        googleProfile: {
          email,
          fullName: fullName || email.split('@')[0],
          avatarUrl: avatarUrl || null
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// GOOGLE COMPLETE ONBOARDING (role selection + account creation)
// ═════════════════════════════════════════════════════════
export async function googleCompleteOnboarding(req: Request, res: Response) {
  const { tempToken, role, subjectGroup } = req.body;

  if (!tempToken || !role) {
    return res.status(400).json({ success: false, error: 'Thiếu token hoặc vai trò.' });
  }

  if (!['STUDENT', 'TEACHER'].includes(role.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Vai trò không hợp lệ. Chọn STUDENT hoặc TEACHER.' });
  }

  try {
    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_TEMP_SECRET);
    } catch (jwtErr) {
      return res.status(400).json({ success: false, error: 'Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại bằng Google.' });
    }

    if (decoded.type !== 'google_onboarding') {
      return res.status(400).json({ success: false, error: 'Token không hợp lệ.' });
    }

    const { email, fullName, googleId, avatarUrl } = decoded;

    // Double-check user doesn't already exist (race condition protection)
    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Tài khoản đã tồn tại. Vui lòng đăng nhập.' });
    }

    const assignedRole = role.toUpperCase();
    const randomHash = await bcrypt.hash(googleId + Date.now(), 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash: randomHash,
          fullName: fullName || email.split('@')[0],
          avatarUrl: avatarUrl || null,
          googleId,
          role: assignedRole as any,
          isActive: true,
          emailVerified: true,
          onboardingComplete: true
        }
      });

      if (assignedRole === 'STUDENT') {
        await tx.student.create({
          data: { userId: u.id, subjectGroup: subjectGroup || 'A01' }
        });
      } else if (assignedRole === 'TEACHER') {
        await tx.teacher.create({
          data: { userId: u.id, isApproved: false, bio: '' }
        });
      }

      return tx.user.findUnique({
        where: { id: u.id },
        include: { student: true, teacher: true }
      });
    });

    if (!user) return res.status(500).json({ success: false, error: 'Không tạo được tài khoản.' });

    const tokens = signTokens({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        ...tokens,
        user: buildUserPayload(user)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═════════════════════════════════════════════════════════
export async function changePassword(req: Request, res: Response) {
  const { oldPassword, newPassword } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa được xác thực!' });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Mật khẩu cũ không chính xác!' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return res.status(200).json({ success: true, data: 'Đổi mật khẩu thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// REQUEST ROLE CHANGE (user submits request)
// ═════════════════════════════════════════════════════════
export async function requestRoleChange(req: Request, res: Response) {
  const { requestedRole, reason } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa được xác thực!' });
  }

  if (!requestedRole || !['STUDENT', 'TEACHER'].includes(requestedRole.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Vai trò yêu cầu không hợp lệ.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng.' });
    }

    if (user.role === requestedRole.toUpperCase()) {
      return res.status(400).json({ success: false, error: 'Bạn đã có vai trò này rồi.' });
    }

    // Check for existing pending request
    const pendingRequest = await prisma.roleChangeRequest.findFirst({
      where: { userId, status: 'PENDING' }
    });
    if (pendingRequest) {
      return res.status(400).json({ success: false, error: 'Bạn đã có một yêu cầu đang chờ duyệt.' });
    }

    const request = await prisma.roleChangeRequest.create({
      data: {
        userId,
        currentRole: user.role,
        requestedRole: requestedRole.toUpperCase() as any,
        reason: reason || null
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        requestId: request.id,
        message: 'Yêu cầu thay đổi vai trò đã được gửi. Quản trị viên sẽ xem xét.'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// GET ROLE CHANGE REQUESTS (admin only)
// ═════════════════════════════════════════════════════════
export async function getRoleChangeRequests(req: Request, res: Response) {
  try {
    const requests = await prisma.roleChangeRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, email: true, fullName: true, avatarUrl: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: requests });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ═════════════════════════════════════════════════════════
// REVIEW ROLE CHANGE (admin approves/rejects)
// ═════════════════════════════════════════════════════════
export async function reviewRoleChange(req: Request, res: Response) {
  const requestId = parseInt(req.params.id);
  const { action } = req.body; // 'approve' or 'reject'
  const adminId = (req as any).user?.id;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Action phải là "approve" hoặc "reject".' });
  }

  try {
    const changeReq = await prisma.roleChangeRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!changeReq) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu.' });
    }

    if (changeReq.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Yêu cầu này đã được xử lý.' });
    }

    if (action === 'approve') {
      await prisma.$transaction(async (tx) => {
        // Update user role
        await tx.user.update({
          where: { id: changeReq.userId },
          data: { role: changeReq.requestedRole }
        });

        // Create new role profile and delete old one
        if (changeReq.requestedRole === 'TEACHER') {
          // Delete student profile if exists
          await tx.student.deleteMany({ where: { userId: changeReq.userId } });
          // Create teacher profile
          const existingTeacher = await tx.teacher.findUnique({ where: { userId: changeReq.userId } });
          if (!existingTeacher) {
            await tx.teacher.create({ data: { userId: changeReq.userId, isApproved: true, bio: '' } });
          }
        } else if (changeReq.requestedRole === 'STUDENT') {
          // Delete teacher profile if exists
          await tx.teacher.deleteMany({ where: { userId: changeReq.userId } });
          // Create student profile
          const existingStudent = await tx.student.findUnique({ where: { userId: changeReq.userId } });
          if (!existingStudent) {
            await tx.student.create({ data: { userId: changeReq.userId, subjectGroup: 'A01' } });
          }
        }

        // Update request status
        await tx.roleChangeRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedBy: adminId,
            reviewedAt: new Date()
          }
        });
      });

      // Send notification email (non-blocking)
      sendRoleChangeNotification(changeReq.user.email, changeReq.user.fullName, 'APPROVED', changeReq.requestedRole).catch(() => {});
    } else {
      // Reject
      await prisma.roleChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      });

      sendRoleChangeNotification(changeReq.user.email, changeReq.user.fullName, 'REJECTED').catch(() => {});
    }

    return res.status(200).json({
      success: true,
      data: { message: action === 'approve' ? 'Đã duyệt yêu cầu thay đổi vai trò.' : 'Đã từ chối yêu cầu thay đổi vai trò.' }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
