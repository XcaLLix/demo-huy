import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationType, NotificationCategory } from '@prisma/client';

export class NotificationTemplateService {
  private static cache: Map<string, any> = new Map();

  static async getTemplate(code: string) {
    if (this.cache.has(code)) {
      return this.cache.get(code);
    }
    const template = await NotificationRepository.getTemplateByCode(code);
    if (template) {
      this.cache.set(code, template);
    }
    return template;
  }

  static clearCache() {
    this.cache.clear();
  }

  static async getAllTemplates() {
    return NotificationRepository.getAllTemplates();
  }

  static async createTemplate(data: any) {
    const template = await NotificationRepository.createTemplate(data);
    this.cache.set(template.code, template);
    return template;
  }

  static async updateTemplate(id: number, data: any) {
    const template = await NotificationRepository.updateTemplate(id, data);
    this.cache.set(template.code, template);
    return template;
  }

  static async deleteTemplate(id: number) {
    const template = await NotificationRepository.getTemplateByCode(
      (await NotificationRepository.getAllTemplates()).find(t => t.id === id)?.code || ''
    );
    if (template) {
      this.cache.delete(template.code);
    }
    return NotificationRepository.deleteTemplate(id);
  }

  static async seedDefaultTemplates() {
    console.log('[NotificationTemplateService] Seeding default templates...');
    const defaultTemplates = [
      {
        code: 'WELCOME',
        title: 'Chào mừng bạn đến với EduPath! 🎉',
        message: 'Chào mừng {fullName} đã tham gia cộng đồng ôn luyện THPT Quốc Gia của EduPath. Hãy bắt đầu hành trình học tập và chinh phục điểm cao ngay nhé!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.ACCOUNT,
        icon: '👋',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'EMAIL_VERIFIED',
        title: 'Xác minh email thành công 📧',
        message: 'Tài khoản của bạn ({email}) đã được xác minh thành công. Bạn đã có toàn quyền truy cập các tính năng cơ bản của hệ thống.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.ACCOUNT,
        icon: '✅',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'ACCOUNT_LOCKED',
        title: 'Tài khoản của bạn đã bị khóa 🔒',
        message: 'Tài khoản đã bị tạm khóa bởi Ban quản trị do vi phạm quy chế hoặc hoạt động bất thường. Lý do: {reason}',
        type: NotificationType.ERROR,
        category: NotificationCategory.ACCOUNT,
        icon: '🚫',
        defaultLink: '/'
      },
      {
        code: 'ACCOUNT_UNLOCKED',
        title: 'Tài khoản của bạn đã được mở khóa 🔓',
        message: 'Tài khoản của bạn đã được mở khóa thành công. Chào mừng bạn quay trở lại với EduPath!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.ACCOUNT,
        icon: '🔓',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'COURSE_APPROVED',
        title: 'Khóa học của bạn đã được phê duyệt! 📚',
        message: 'Chúc mừng thầy/cô! Khóa học "{courseName}" đã được kiểm duyệt và phát hành chính thức.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.COURSE,
        icon: '📖',
        defaultLink: '/teacher/courses'
      },
      {
        code: 'COURSE_REJECTED',
        title: 'Khóa học không được phê duyệt ❌',
        message: 'Rất tiếc, khóa học "{courseName}" của thầy/cô không được phê duyệt. Lý do: {reason}. Thầy/cô vui lòng cập nhật lại nội dung và gửi duyệt lại.',
        type: NotificationType.WARNING,
        category: NotificationCategory.COURSE,
        icon: '⚠️',
        defaultLink: '/teacher/courses'
      },
      {
        code: 'COURSE_HIDDEN',
        title: 'Khóa học đã bị ẩn khỏi hệ thống 👁️‍🗨️',
        message: 'Khóa học "{courseName}" của thầy/cô đã bị ẩn khỏi giao diện học sinh. Lý do: {reason}. Vui lòng liên hệ Admin để được hỗ trợ.',
        type: NotificationType.WARNING,
        category: NotificationCategory.COURSE,
        icon: '👁️',
        defaultLink: '/teacher/courses'
      },
      {
        code: 'COURSE_PUBLISHED',
        title: 'Khóa học mới xuất hiện! 🌟',
        message: 'Khóa học mới "{courseName}" giảng dạy bởi thầy/cô {teacherName} đã chính thức được phát hành. Khám phá ngay!',
        type: NotificationType.INFO,
        category: NotificationCategory.COURSE,
        icon: '🎓',
        defaultLink: '/courses'
      },
      {
        code: 'TEACHER_APPROVED',
        title: 'Hồ sơ Giáo viên được phê duyệt! 👩‍🏫',
        message: 'Chúc mừng {fullName}, hồ sơ đăng ký giảng dạy của thầy/cô đã được phê duyệt. Thầy/cô có thể tạo khóa học mới ngay bây giờ!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.TEACHER,
        icon: '🎉',
        defaultLink: '/teacher/home'
      },
      {
        code: 'TEACHER_REJECTED',
        title: 'Hồ sơ Giáo viên bị từ chối ❌',
        message: 'Hồ sơ giảng dạy của thầy/cô bị từ chối. Lý do: {reason}. Thầy/cô vui lòng bổ sung thông tin hồ sơ và gửi yêu cầu lại.',
        type: NotificationType.WARNING,
        category: NotificationCategory.TEACHER,
        icon: '⚠️',
        defaultLink: '/'
      },
      {
        code: 'EXAM_APPROVED',
        title: 'Đề thi của bạn đã được duyệt 📝',
        message: 'Đề thi thử "{examTitle}" do bạn tạo đã được duyệt và chuyển sang chế độ công khai cho cộng đồng luyện tập.',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.EXAM,
        icon: '✍️',
        defaultLink: '/dashboard/exam-bank'
      },
      {
        code: 'EXAM_REJECTED',
        title: 'Đề thi bị từ chối phê duyệt ❌',
        message: 'Đề thi thử "{examTitle}" bị từ chối phê duyệt. Lý do: {reason}. Vui lòng sửa lại đề và gửi duyệt lại.',
        type: NotificationType.WARNING,
        category: NotificationCategory.EXAM,
        icon: '📝',
        defaultLink: '/dashboard/exam-bank'
      },
      {
        code: 'PAYMENT_SUCCESS',
        title: 'Thanh toán khóa học thành công 💳',
        message: 'Giao dịch thanh toán mua khóa học "{courseName}" (Mã GD: {transactionId}) trị giá {amount}đ đã thành công. Bạn có thể bắt đầu học ngay!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.PAYMENT,
        icon: '💰',
        defaultLink: '/dashboard/courses'
      },
      {
        code: 'PAYMENT_FAILED',
        title: 'Giao dịch thanh toán thất bại ❌',
        message: 'Thanh toán cho khóa học "{courseName}" của bạn không thành công hoặc đã bị hủy. Hãy thử lại hoặc liên hệ ban hỗ trợ.',
        type: NotificationType.ERROR,
        category: NotificationCategory.PAYMENT,
        icon: '⚠️',
        defaultLink: '/dashboard/courses'
      },
      {
        code: 'REPORT_RESOLVED',
        title: 'Báo cáo vi phạm của bạn đã được xử lý 🛡️',
        message: 'Báo cáo về nội dung vi phạm đã được Admin phê duyệt và xử lý. Trạng thái: {status}. Cảm ơn bạn đã chung tay xây dựng cộng đồng!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.REPORT,
        icon: '🛡️',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'AI_MAINTENANCE',
        title: 'Bảo trì tính năng AI Coach 🤖',
        message: 'Tính năng Trợ lý ảo AI Coach đang tạm thời được bảo trì để nâng cấp thuật toán thông minh hơn. Rất mong bạn thông cảm!',
        type: NotificationType.WARNING,
        category: NotificationCategory.AI,
        icon: '🤖',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'SYSTEM_MAINTENANCE',
        title: 'Thông báo bảo trì hệ thống ⚙️',
        message: 'Hệ thống EduPath sẽ tiến hành bảo trì nâng cấp định kỳ từ {startTime} đến {endTime}. Một số dịch vụ có thể gián đoạn.',
        type: NotificationType.WARNING,
        category: NotificationCategory.SYSTEM,
        icon: '⚙️',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'SYSTEM_ANNOUNCEMENT',
        title: 'Thông báo mới từ EduPath 📢',
        message: '{announcementText}',
        type: NotificationType.INFO,
        category: NotificationCategory.SYSTEM,
        icon: '📢',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'PREMIUM_ACTIVATED',
        title: 'Nâng cấp Premium PRO thành công! 🌟',
        message: 'Chúc mừng {fullName}, tài khoản của bạn đã được nâng cấp lên PRO Premium. Bắt đầu trải nghiệm các tính năng AI Coach và Sơ đồ tư duy không giới hạn!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.PAYMENT,
        icon: '👑',
        defaultLink: '/dashboard/home'
      },
      {
        code: 'AI_STREAK',
        title: 'AI Lộ trình: Duy trì Streak học tập 🏆',
        message: 'Tuyệt vời! Bạn đã duy trì chuỗi học 3 ngày liên tiếp. Luyện tập thêm 15 phút hôm nay để không ngắt quãng lộ trình nhé!',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.AI,
        icon: '🏆',
        defaultLink: '/dashboard/ai-tutor'
      },
      {
        code: 'AI_KNOWLEDGE_GAP',
        title: 'AI Lộ trình: Gợi ý ôn tập đề thi 📚',
        message: 'Hệ thống nhận thấy bạn cần củng cố kiến thức phần \'Hàm số Mũ & Lôgarit\'. Hãy luyện tập với bài thi gợi ý dưới đây.',
        type: NotificationType.WARNING,
        category: NotificationCategory.AI,
        icon: '📚',
        defaultLink: '/dashboard/mock-exams'
      }
    ];

    let count = 0;
    for (const t of defaultTemplates) {
      const exists = await NotificationRepository.getTemplateByCode(t.code);
      if (!exists) {
        await NotificationRepository.createTemplate(t);
        count++;
      }
    }
    console.log(`[NotificationTemplateService] Seeded ${count} new default templates.`);
  }
}
