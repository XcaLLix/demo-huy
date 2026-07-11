import type { Response } from 'express';
import type { Request } from 'express';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationService } from '../services/notification.service.js';
import { NotificationTemplateService } from '../services/notificationTemplate.service.js';
import { logSystemEvent } from '../utils/logger.js';
import { NotificationType, NotificationCategory } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export async function getNotifications(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    const { category, type, isRead, search, page = 1, limit = 10 } = req.query;

    const filters: any = {};
    if (category && category !== 'ALL') filters.category = category as NotificationCategory;
    if (type && type !== 'ALL') filters.type = type as NotificationType;
    if (isRead !== undefined && isRead !== '') filters.isRead = isRead === 'true';
    if (search) filters.search = String(search).trim();

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      NotificationRepository.getUserNotifications(userId, filters, skip, limitNum),
      NotificationRepository.countUserNotifications(userId, filters)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          category: n.category,
          icon: n.icon,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString()
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    const count = await NotificationRepository.countUnreadNotifications(userId);
    return res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    await NotificationRepository.markAsRead(Number(id), userId);
    return res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc thông báo!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    await NotificationRepository.markAllAsRead(userId);
    return res.status(200).json({ success: true, message: 'Đã đánh dấu đã đọc tất cả thông báo!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    await NotificationRepository.deleteNotification(Number(id), userId);
    return res.status(200).json({ success: true, message: 'Đã xóa thông báo thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteAllRead(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    await NotificationRepository.deleteAllRead(userId);
    return res.status(200).json({ success: true, message: 'Đã xóa toàn bộ thông báo đã đọc!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// ADMIN CONTROLLERS
// =========================================================================

export async function adminSendNotification(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const adminEmail = req.user?.email || 'Admin';

  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Chỉ Admin mới có quyền gửi thông báo!' });
  }

  const {
    target, // 'all' | 'role' | 'user'
    userId,
    role,
    title,
    message,
    type,
    category,
    templateCode,
    variables,
    link,
    metadata
  } = req.body;

  try {
    if (templateCode) {
      // 1. Send via Template
      if (target === 'user' && userId) {
        const ids = String(userId).split(',').map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0);
        for (const uId of ids) {
          await NotificationService.sendTemplate(templateCode, uId, variables || {}, link, metadata);
        }
      } else if (target === 'role' && role) {
        const template = await NotificationTemplateService.getTemplate(templateCode);
        if (!template) return res.status(404).json({ success: false, error: 'Không tìm thấy template mẫu!' });
        
        let templatedTitle = template.title;
        let templatedMsg = template.message;
        Object.entries(variables || {}).forEach(([k, v]) => {
          templatedTitle = templatedTitle.replace(new RegExp(`{${k}}`, 'g'), String(v));
          templatedMsg = templatedMsg.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });

        await NotificationService.sendToRole(role, {
          title: templatedTitle,
          message: templatedMsg,
          type: template.type,
          category: template.category,
          icon: template.icon || undefined,
          link: link || template.defaultLink || undefined,
          metadata
        });
      } else {
        // Broadcast template
        await NotificationService.sendTemplate(templateCode, null, variables || {}, link, metadata);
      }
    } else {
      // 2. Send custom raw notification
      if (!title || !message) {
        return res.status(400).json({ success: false, error: 'Vui lòng điền tiêu đề và nội dung thông báo!' });
      }

      const params = {
        title,
        message,
        type: type || NotificationType.INFO,
        category: category || NotificationCategory.SYSTEM,
        link,
        metadata
      };

      if (target === 'user' && userId) {
        const ids = String(userId).split(',').map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0);
        for (const uId of ids) {
          await NotificationService.send({ userId: uId, ...params });
        }
      } else if (target === 'role' && role) {
        await NotificationService.sendToRole(role, params);
      } else {
        // Broadcast to all
        const activeUsers = await NotificationService.sendToRole('STUDENT', params);
        await NotificationService.sendToRole('TEACHER', params);
        await NotificationService.sendToRole('ADMIN', params);
      }
    }

    // Ghi log kiểm toán hệ thống cho sự kiện Admin gửi thông báo
    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'SEND_NOTIFICATION',
      module: 'NOTIFICATION_CENTER',
      userId: adminId,
      description: `Admin (${adminEmail}) gửi thông báo. Loại đối tượng: ${target}`,
      metadata: { target, role, userId, templateCode, title },
      level: 'INFO'
    });

    return res.status(200).json({ success: true, message: 'Đã gửi thông báo thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adminGetSentNotifications(req: AuthRequest, res: Response) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
  }

  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [history, total] = await Promise.all([
      NotificationRepository.getAdminNotificationHistory(skip, limitNum),
      NotificationRepository.countAdminNotificationHistory()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        history: history.map(h => ({
          id: h.id,
          title: h.title,
          message: h.message,
          type: h.type,
          category: h.category,
          isRead: h.isRead,
          createdAt: h.createdAt.toISOString(),
          recipient: h.user ? {
            id: h.user.id,
            name: h.user.fullName,
            email: h.user.email,
            role: h.user.role
          } : null
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adminGetTemplates(req: AuthRequest, res: Response) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
  }

  try {
    const templates = await NotificationTemplateService.getAllTemplates();
    return res.status(200).json({ success: true, data: templates });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adminCreateTemplate(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
  }

  const { code, title, message, type, category, icon, defaultLink, isActive } = req.body;

  if (!code || !title || !message) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc!' });
  }

  try {
    const exists = await NotificationTemplateService.getTemplate(code);
    if (exists) {
      return res.status(400).json({ success: false, error: `Mã template "${code}" đã tồn tại!` });
    }

    const template = await NotificationTemplateService.createTemplate({
      code: code.toUpperCase().trim(),
      title,
      message,
      type: type || NotificationType.INFO,
      category: category || NotificationCategory.SYSTEM,
      icon: icon || null,
      defaultLink: defaultLink || null,
      isActive: isActive !== undefined ? isActive : true
    });

    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'CREATE_TEMPLATE',
      module: 'NOTIFICATION_CENTER',
      userId: adminId,
      description: `Tạo mới template thông báo: ${template.code}`,
      metadata: { code: template.code, title: template.title },
      level: 'INFO'
    });

    return res.status(201).json({ success: true, data: template });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adminUpdateTemplate(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
  }

  const { id } = req.params;
  const { title, message, type, category, icon, defaultLink, isActive } = req.body;

  try {
    const template = await NotificationTemplateService.updateTemplate(Number(id), {
      title,
      message,
      type: type as NotificationType,
      category: category as NotificationCategory,
      icon,
      defaultLink,
      isActive
    });

    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'UPDATE_TEMPLATE',
      module: 'NOTIFICATION_CENTER',
      userId: adminId,
      description: `Cập nhật template thông báo: ${template.code}`,
      metadata: { code: template.code },
      level: 'INFO'
    });

    return res.status(200).json({ success: true, data: template });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function adminDeleteTemplate(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
  }

  const { id } = req.params;

  try {
    await NotificationTemplateService.deleteTemplate(Number(id));

    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'DELETE_TEMPLATE',
      module: 'NOTIFICATION_CENTER',
      userId: adminId,
      description: `Xóa template thông báo ID: ${id}`,
      metadata: { id },
      level: 'WARNING'
    });

    return res.status(200).json({ success: true, message: 'Đã xóa template thông báo thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
