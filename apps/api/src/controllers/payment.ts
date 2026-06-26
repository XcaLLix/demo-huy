import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { addBothRevenue } from '../lib/monthlyStats.js';
import { logSystemEvent } from '../utils/logger.js';


const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || 'EDUPATH123';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'SECRET_VNPAY_HASH_KEY_2026';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Generate VNPay Payment Checkout URL
export async function createVNPayPayment(req: AuthRequest, res: Response) {
  const { courseId } = req.body;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });

    const orderId = `EDUPATH_${Date.now()}`;
    const basePrice = course.price < 10000 ? course.price * 1000 : course.price;
    const salePrice = basePrice * (1 - (course.discount || 0) / 100);
    const amount = Math.round(salePrice) * 100; // VNPay uses cents (x100)
    
    // Compile standard VNPay queries parameters
    const vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amount),
      vnp_CreateDate: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan khoa hoc: ${course.title}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: `${CLIENT_URL}/dashboard/student`,
      vnp_TxnRef: orderId
    };

    // Sort parameters alphabetically as required by VNPay
    const sortedKeys = Object.keys(vnpParams).sort();
    const signData = sortedKeys
      .map(key => `${key}=${encodeURIComponent(vnpParams[key])}`)
      .join('&');

    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const vnpayUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${signData}&vnp_SecureHash=${secureHash}`;

    return res.status(200).json({ success: true, data: { paymentUrl: vnpayUrl } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// VNPay Instant Payment Notification (IPN) webhook
export async function vnpayWebhook(req: AuthRequest, res: Response) {
  const vnp_Params = req.query as any;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  // Sort parameter keys
  const sortedKeys = Object.keys(vnp_Params).sort();
  const signData = sortedKeys
    .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
  const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  // Verify HMAC signature
  if (secureHash !== calculatedHash) {
    await logSystemEvent(null, {
      type: 'SYSTEM',
      action: 'PAYMENT_ERROR',
      module: 'PAYMENT_SERVICE',
      description: `Sai chữ ký bảo mật webhook VNPay (calculated !== secure)`,
      metadata: { secureHash, calculatedHash, query: req.query },
      level: 'CRITICAL'
    });
    return res.status(400).json({ success: false, error: 'Mã chữ ký bảo mật VNPay không khớp!' });
  }

  const responseCode = vnp_Params['vnp_ResponseCode'];
  const txnRef = vnp_Params['vnp_TxnRef'];
  const amount = Number(vnp_Params['vnp_Amount']) / 100;

  if (responseCode === '00') {
    // Payment success!
    try {
      // Find course based on transaction info (simulated parsing)
      // Unlock student enrollment
      console.log(`[VNPay] Thanh toán thành công cho đơn hàng: ${txnRef}, Số tiền: ${amount}`);
      return res.status(200).json({ success: true, data: 'Giao dịch thành công!' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  await logSystemEvent(null, {
    type: 'SYSTEM',
    action: 'PAYMENT_FAILED',
    module: 'PAYMENT_SERVICE',
    description: `Thanh toán qua VNPay thất bại. Giao dịch: ${txnRef}, responseCode: ${responseCode}`,
    metadata: { txnRef, responseCode, amount },
    level: 'ERROR'
  });

  return res.status(400).json({ success: false, error: 'Giao dịch thất bại tại cổng VNPay!' });
}

// SePay Webhook Token for security verification
const SEPAY_WEBHOOK_KEY = process.env.SEPAY_WEBHOOK_KEY || 'edupath_sepay_secret_token_2026';

// SePay webhook endpoint (POST /enrollments/sepay-webhook)
export async function sepayWebhook(req: any, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    
    // Verify SePay authentication if configured
    if (SEPAY_WEBHOOK_KEY) {
      const expectedAuth = `Apikey ${SEPAY_WEBHOOK_KEY}`;
      const expectedBearer = `Bearer ${SEPAY_WEBHOOK_KEY}`;
      if (!authHeader || (authHeader !== expectedAuth && authHeader !== expectedBearer && authHeader !== SEPAY_WEBHOOK_KEY)) {
        console.warn('[SePay Webhook] Cảnh báo: Chữ ký xác thực SePay không trùng khớp hoặc bị thiếu!', authHeader);
        await logSystemEvent(null, {
          type: 'SYSTEM',
          action: 'PAYMENT_ERROR',
          module: 'PAYMENT_SERVICE',
          description: `Lỗi webhook Sepay: Sai mã Token xác thực webhook`,
          metadata: { authHeader },
          level: 'CRITICAL'
        });
        return res.status(401).json({ success: false, error: 'Chữ ký xác thực SePay không hợp lệ!' });
      }
    }

    const { transferAmount, transactionContent, id, gateway, transferType } = req.body;

    console.log(`[SePay Webhook] Nhận request POST: Giao dịch ${id}, Số tiền: ${transferAmount}, Loại: ${transferType}, Nội dung: "${transactionContent}"`);

    // Only process incoming transfers (inflow)
    if (transferType && transferType.toLowerCase() !== 'in') {
      return res.status(200).json({ success: true, message: 'Bỏ qua giao dịch không phải chiều nạp tiền.' });
    }

    if (!transactionContent) {
      return res.status(400).json({ success: false, error: 'Nội dung giao dịch trống!' });
    }

    const cleanContent = transactionContent.replace(/[\s\-_]/g, '');

    // 1. Check if it matches the UPGRADE PRO pattern: UP[studentId]P[planId]
    const upgradeMatch = cleanContent.match(/UP(\d+)P(\d+)/i);
    if (upgradeMatch) {
      const studentId = parseInt(upgradeMatch[1], 10);
      const planId = parseInt(upgradeMatch[2], 10);

      console.log(`[SePay Webhook] Phát hiện mã nâng cấp PRO: Học sinh ID: ${studentId}, Gói đăng ký: ${planId}`);

      const user = await prisma.user.findUnique({
        where: { id: studentId }
      });

      if (!user) {
        const errMsg = `Không tìm thấy học sinh nâng cấp PRO có ID: ${studentId}`;
        console.error(`[SePay Webhook] ${errMsg}`);
        await logSystemEvent(null, {
          type: 'SYSTEM',
          action: 'PAYMENT_FAILED',
          module: 'PAYMENT_SERVICE',
          description: `Thanh toán qua Sepay thất bại. Lỗi: ${errMsg}`,
          metadata: { body: req.body },
          level: 'ERROR'
        });
        return res.status(404).json({ success: false, error: errMsg });
      }

      // Upgrade to PRO in DB (cast to any to bypass local prisma generator locked EPERM compile errors on windows)
      await (prisma.user as any).update({
        where: { id: studentId },
        data: { isPro: true }
      });

      console.log(`[SePay Webhook] Đã nâng cấp PRO thành công cho học sinh "${user.fullName}"!`);

      return res.status(200).json({
        success: true,
        message: 'Nâng cấp tài khoản PRO thành công!',
        data: { studentId, isPro: true }
      });
    }

    // 2. Check if it matches the COURSE purchase pattern: EP[studentId]C[courseId]
    const match = cleanContent.match(/EP(\d+)C(\d+)/i);

    if (!match) {
      console.warn(`[SePay Webhook] Không tìm thấy mã định danh EP... hoặc UP... hợp lệ trong nội dung: "${transactionContent}"`);
      await logSystemEvent(null, {
        type: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        module: 'PAYMENT_SERVICE',
        description: `Thanh toán qua Sepay thất bại. Lỗi: Nội dung chuyển khoản không hợp lệ ("${transactionContent}")`,
        metadata: { body: req.body },
        level: 'ERROR'
      });
      return res.status(400).json({ success: false, error: 'Nội dung chuyển khoản không hợp lệ!' });
    }

    const studentId = parseInt(match[1], 10);
    const courseId = parseInt(match[2], 10);

    // Verify student user in DB
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: { student: true }
    });

    if (!studentUser) {
      const errMsg = `Không tìm thấy học sinh mua khóa học có ID: ${studentId}`;
      console.error(`[SePay Webhook] ${errMsg}`);
      await logSystemEvent(null, {
        type: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        module: 'PAYMENT_SERVICE',
        description: `Thanh toán qua Sepay thất bại. Lỗi: ${errMsg}`,
        metadata: { body: req.body },
        level: 'ERROR'
      });
      return res.status(404).json({ success: false, error: errMsg });
    }

    // Ensure student record exists
    if (!studentUser.student) {
      // Create student sub-record if missing
      await prisma.student.create({
        data: {
          userId: studentId,
          subjectGroup: 'A01' // Default group
        }
      });
    }

    // Verify course in DB
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      const errMsg = `Không tìm thấy khóa học có ID: ${courseId}`;
      console.error(`[SePay Webhook] ${errMsg}`);
      await logSystemEvent(null, {
        type: 'SYSTEM',
        action: 'PAYMENT_FAILED',
        module: 'PAYMENT_SERVICE',
        description: `Thanh toán qua Sepay thất bại. Lỗi: ${errMsg}`,
        metadata: { body: req.body },
        level: 'ERROR'
      });
      return res.status(404).json({ success: false, error: errMsg });
    }

    // Parse the amounts to verify payment validity
    const basePrice = course.price < 10000 ? course.price * 1000 : course.price;
    const expectedAmount = basePrice * (1 - (course.discount || 0) / 100);
    const paidAmount = Number(transferAmount);

    if (paidAmount < expectedAmount) {
      console.warn(`[SePay Webhook] Cảnh báo: Số tiền thanh toán (${paidAmount}đ) ít hơn số tiền khóa học đã giảm giá (${expectedAmount}đ).`);
      // We will still process it but log a warning.
    }

    // Check if enrollment already exists to avoid duplication
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId, courseId }
    });

    if (existingEnrollment) {
      console.log(`[SePay Webhook] Học sinh ${studentId} đã được đăng ký học khóa ${courseId} từ trước.`);
      return res.status(200).json({ success: true, message: 'Đăng ký đã tồn tại.' });
    }

    // Create the enrollment!
    const txnId = id ? String(id) : `SEPAY_${Date.now()}`;
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        transactionId: txnId,
        paidAt: new Date()
      }
    });

    // Create notification for the teacher
    try {
      await prisma.notification.create({
        data: {
          userId: course.teacherId,
          title: 'Đăng ký khóa học mới',
          message: `Học sinh ${studentUser.fullName} đã đăng ký khóa học "${course.title}".`
        }
      });
    } catch (notifErr) {
      console.error('[Notification Error] Failed to create teacher notification (SePay):', notifErr);
    }

    console.log(`[SePay Webhook] Đã kích hoạt thành công khóa học "${course.title}" cho học sinh "${studentUser.fullName}".`);

    // Cập nhật doanh thu hàng tháng
    try {
      const now = new Date();
      await addBothRevenue(paidAmount, now);
    } catch (e) {
      console.error('[MonthlyStats] Lỗi cập nhật revenue (SePay):', e);
    }

    return res.status(200).json({
      success: true,
      message: 'Kích hoạt khóa học thành công!',
      data: { enrollmentId: enrollment.id }
    });

  } catch (err: any) {
    console.error('[SePay Webhook Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Check enrollment status (GET /enrollments/status?courseId=X)
export async function checkEnrollmentStatus(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  const { courseId } = req.query;

  if (!studentId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  if (!courseId) {
    return res.status(400).json({ success: false, error: 'Thiếu mã khóa học courseId!' });
  }

  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: Number(studentId),
        courseId: Number(courseId)
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        isEnrolled: !!enrollment,
        enrollment: enrollment
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Demo Enrollment — create a real DB enrollment without payment (POST /enrollments/demo)
export async function createDemoEnrollment(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  const { courseId } = req.body;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  if (!courseId) return res.status(400).json({ success: false, error: 'Thiếu courseId!' });

  try {
    // Ensure student sub-record exists
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: { student: true }
    });

    if (!studentUser) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng!' });
    }

    if (!studentUser.student) {
      await prisma.student.create({
        data: { userId: studentId, subjectGroup: 'A01' }
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    // Check if already enrolled (idempotent)
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, courseId: Number(courseId) }
    });

    if (existing) {
      console.log(`[Demo Enrollment] Học sinh ${studentId} đã đăng ký khóa ${courseId} từ trước.`);
      return res.status(200).json({
        success: true,
        data: { enrollmentId: existing.id, courseId: Number(courseId), alreadyEnrolled: true }
      });
    }

    // Create real enrollment with demo transactionId
    const txnId = `DEMO_${studentId}_${courseId}_${Date.now()}`;
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId: Number(courseId),
        transactionId: txnId,
        paidAt: new Date()
      }
    });

    // Create notification for the teacher
    try {
      await prisma.notification.create({
        data: {
          userId: course.teacherId,
          title: 'Đăng ký khóa học mới',
          message: `Học sinh ${studentUser.fullName} đã đăng ký khóa học "${course.title}".`
        }
      });
    } catch (notifErr) {
      console.error('[Notification Error] Failed to create teacher notification (Demo):', notifErr);
    }

    console.log(`[Demo Enrollment] Đã kích hoạt khóa học ID=${courseId} cho học sinh ID=${studentId} (Demo Mode).`);

    // Cập nhật doanh thu hàng tháng (Demo)
    try {
      const basePrice = course.price < 10000 ? course.price * 1000 : course.price;
      const salePrice = basePrice * (1 - (course.discount || 0) / 100);
      const now = new Date();
      await addBothRevenue(salePrice, now);
    } catch (e) {
      console.error('[MonthlyStats] Lỗi cập nhật revenue (Demo):', e);
    }

    return res.status(200).json({
      success: true,
      data: { enrollmentId: enrollment.id, courseId: Number(courseId), transactionId: txnId }
    });
  } catch (err: any) {
    console.error('[Demo Enrollment Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Check if the current logged-in user is PRO (GET /users/pro-status)
export async function checkUserProStatus(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;

  if (!studentId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(studentId) }
    });

    return res.status(200).json({
      success: true,
      data: {
        isPro: user?.isPro || false
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

