import { PrismaClient, LogType, LogLevel } from '@prisma/client';

const prisma = new PrismaClient();

const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
const oss = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
const devices = ['Desktop', 'Mobile', 'Tablet'];
const ips = ['192.168.1.10', '115.79.138.45', '42.113.15.22', '127.0.0.1', '14.161.42.23'];
const countries = ['Vietnam', 'Vietnam', 'Singapore', 'United States', 'Vietnam'];

const failureReasons = [
  'Sai mật khẩu',
  'Không tồn tại tài khoản',
  'Tài khoản bị khóa',
  'Token hết hạn'
];

function getRandomDateInLastDays(days: number) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Seeding System Logs...');

  // 1. Clean existing logs
  await prisma.systemLog.deleteMany();
  console.log('Cleared existing system logs.');

  // 2. Fetch some users
  const allUsers = await prisma.user.findMany({ take: 20 });
  if (allUsers.length === 0) {
    console.error('No users found in database. Run main seeder first.');
    return;
  }

  const admins = allUsers.filter(u => u.role === 'ADMIN');
  const teachers = allUsers.filter(u => u.role === 'TEACHER');
  const students = allUsers.filter(u => u.role === 'STUDENT');

  const adminUser = admins[0] || allUsers[0];
  const teacherUser = teachers[0] || allUsers[0];
  const studentUser = students[0] || allUsers[0];

  const logData: any[] = [];

  // --- 1. Login Logs (30 records) ---
  console.log('Generating 30 Login logs...');
  for (let i = 0; i < 30; i++) {
    const isSuccess = Math.random() > 0.3; // 70% success, 30% fail
    const logUser = getRandomItem(allUsers);
    const date = getRandomDateInLastDays(30);

    const browser = getRandomItem(browsers);
    const operatingSystem = getRandomItem(oss);
    const device = getRandomItem(devices);
    const ipAddress = getRandomItem(ips);
    const country = getRandomItem(countries);

    const reason = getRandomItem(failureReasons);
    const description = isSuccess 
      ? `Đăng nhập thành công (${logUser.email})`
      : `Đăng nhập thất bại: ${reason} (${logUser.email})`;

    logData.push({
      type: LogType.LOGIN,
      action: isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      module: 'AUTH',
      userId: isSuccess ? logUser.id : null,
      ipAddress,
      device,
      browser,
      operatingSystem,
      description,
      metadata: {
        email: logUser.email,
        country,
        userAgent: `Mozilla/5.0 (${operatingSystem}; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) ${browser}/126.0.0.0`,
        ...(isSuccess ? {} : { failureReason: reason })
      },
      level: isSuccess ? LogLevel.INFO : LogLevel.WARNING,
      createdAt: date
    });
  }

  // --- 2. Admin Operations Logs (15 records) ---
  console.log('Generating 15 Admin logs...');
  const adminActions = [
    { action: 'BLOCK_USER', desc: (t: any) => `Khóa tài khoản người dùng: ${t.fullName} (${t.email}). Lý do: Vi phạm tiêu chuẩn cộng đồng.`, module: 'USER_MANAGEMENT', level: LogLevel.WARNING },
    { action: 'UNBLOCK_USER', desc: (t: any) => `Mở khóa tài khoản người dùng: ${t.fullName} (${t.email})`, module: 'USER_MANAGEMENT', level: LogLevel.INFO },
    { action: 'APPROVE_TEACHER', desc: (t: any) => `Duyệt hồ sơ đăng ký giáo viên: ${t.fullName} (${t.email})`, module: 'TEACHER_MANAGEMENT', level: LogLevel.INFO },
    { action: 'REJECT_TEACHER', desc: (t: any) => `Từ chối hồ sơ đăng ký giáo viên: ${t.fullName} (${t.email}). Lý do: Chứng chỉ không hợp lệ.`, module: 'TEACHER_MANAGEMENT', level: LogLevel.WARNING },
    { action: 'APPROVE_COURSE', desc: (t: any) => `Duyệt phát hành khóa học: "Luyện thi THPTQG môn Toán chuyên đề Tích phân"`, module: 'COURSE_MANAGEMENT', level: LogLevel.INFO },
    { action: 'REJECT_COURSE', desc: (t: any) => `Từ chối phát hành khóa học: "Hóa học hữu cơ mất gốc cấp tốc". Lý do: Video chất lượng thấp.`, module: 'COURSE_MANAGEMENT', level: LogLevel.WARNING },
    { action: 'HIDE_COURSE', desc: (t: any) => `Ẩn khóa học: "Học nhanh Tiếng Anh 12". Lý do: Nhận phản hồi tiêu cực từ học sinh.`, module: 'COURSE_MANAGEMENT', level: LogLevel.WARNING },
    { action: 'SHOW_COURSE', desc: (t: any) => `Hiển thị khóa học: "Học nhanh Tiếng Anh 12"`, module: 'COURSE_MANAGEMENT', level: LogLevel.INFO },
    { action: 'APPROVE_REPORT', desc: (t: any) => `Duyệt báo cáo vi phạm bình luận bài viết #${Math.floor(Math.random() * 1000)}`, module: 'MODERATION', level: LogLevel.INFO },
    { action: 'CLOSE_REPORT', desc: (t: any) => `Đóng báo cáo vi phạm khóa học #${Math.floor(Math.random() * 1000)}`, module: 'MODERATION', level: LogLevel.INFO },
    { action: 'SEND_WARNING', desc: (t: any) => `Gửi cảnh báo đến người dùng: ${t.fullName} (${t.email}) vì spam tin nhắn.`, module: 'MODERATION', level: LogLevel.WARNING },
    { action: 'ENABLE_FEATURE', desc: (t: any) => `Bật chức năng hệ thống: Chatbot AI tư vấn lộ trình`, module: 'SYSTEM_SETTINGS', level: LogLevel.INFO },
    { action: 'DISABLE_FEATURE', desc: (t: any) => `Tắt chức năng hệ thống: Cho phép thanh toán qua Sepay`, module: 'SYSTEM_SETTINGS', level: LogLevel.INFO }
  ];

  for (let i = 0; i < 15; i++) {
    const act = getRandomItem(adminActions);
    const date = getRandomDateInLastDays(30);
    const target = Math.random() > 0.5 ? studentUser : teacherUser;
    
    logData.push({
      type: LogType.ADMIN,
      action: act.action,
      module: act.module,
      userId: adminUser.id,
      ipAddress: getRandomItem(ips),
      device: getRandomItem(devices),
      browser: getRandomItem(browsers),
      operatingSystem: getRandomItem(oss),
      description: act.desc(target),
      metadata: {
        adminEmail: adminUser.email,
        targetUser: { id: target.id, email: target.email, fullName: target.fullName }
      },
      level: act.level,
      createdAt: date
    });
  }

  // --- 3. System Logs (10 records) ---
  console.log('Generating 10 System logs...');
  const systemErrors = [
    { action: 'AI_TIMEOUT', module: 'AI_SERVICE', desc: 'AI timeout: OpenRouter API không phản hồi trong 15000ms', level: LogLevel.ERROR, meta: { endpoint: '/ai/mindmap', model: 'gemini-pro', timeoutMs: 15000 } },
    { action: 'AI_NO_RESPONSE', module: 'AI_SERVICE', desc: 'AI không phản hồi: Response body rỗng từ OpenRouter', level: LogLevel.ERROR, meta: { endpoint: '/ai/chat', model: 'free-model' } },
    { action: 'PAYMENT_FAILED', module: 'PAYMENT_SERVICE', desc: 'Thanh toán thất bại: Giao dịch VNPay bị hủy bởi người dùng', level: LogLevel.WARNING, meta: { txnRef: `EDUPATH_${Date.now()}`, code: '24' } },
    { action: 'PAYMENT_ERROR', module: 'PAYMENT_SERVICE', desc: 'Sai chữ ký bảo mật webhook VNPay (calculated !== secure)', level: LogLevel.CRITICAL, meta: { txnRef: `EDUPATH_${Date.now()}` } },
    { action: 'DATABASE_ERROR', module: 'DATABASE', desc: 'Database Error: PostgreSQL connection timed out.', level: LogLevel.CRITICAL, meta: { code: 'P1001', db: 'Supabase Postgres' } },
    { action: 'SERVER_ERROR', module: 'SERVER', desc: 'Exception Backend: Cannot read property "id" of undefined at authController.ts:50', level: LogLevel.ERROR, meta: { stack: 'TypeError: Cannot read property "id" of undefined\n    at login (authController.ts:50:23)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)' } }
  ];

  for (let i = 0; i < 10; i++) {
    const err = getRandomItem(systemErrors);
    const date = getRandomDateInLastDays(30);

    logData.push({
      type: LogType.SYSTEM,
      action: err.action,
      module: err.module,
      userId: null,
      ipAddress: null,
      device: null,
      browser: null,
      operatingSystem: null,
      description: err.desc,
      metadata: err.meta,
      level: err.level,
      createdAt: date
    });
  }

  // Write all logs to database
  console.log('Writing system logs to database...');
  await prisma.systemLog.createMany({
    data: logData
  });

  console.log(`Successfully seeded ${logData.length} system logs.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
