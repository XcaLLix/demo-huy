import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

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
    const amount = Math.round(course.price * 1000) * 100; // VNPay uses cents (x100)
    
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

  return res.status(400).json({ success: false, error: 'Giao dịch thất bại tại cổng VNPay!' });
}
