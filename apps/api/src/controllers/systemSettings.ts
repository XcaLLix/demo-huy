import type { Request, Response } from 'express';
import { SystemSettingService } from '../services/systemSetting.service.js';
import { logSystemEvent } from '../utils/logger.js';
import { NotificationService } from '../services/notification.service.js';

/**
 * GET /admin/system-settings
 * Trả về danh sách toàn bộ cấu hình hệ thống.
 */
export async function getSettings(req: Request, res: Response) {
  try {
    const settings = SystemSettingService.getAll();
    return res.status(200).json({ success: true, data: settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * PUT /admin/system-settings
 * Cập nhật đồng thời nhiều cấu hình hệ thống.
 */
export async function updateSettings(req: Request, res: Response) {
  const adminId = (req as any).user?.id;
  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin cấu hình cập nhật!' });
  }

  try {
    let updates: { key: string; value: string }[] = [];
    if (Array.isArray(settings)) {
      updates = settings;
    } else if (typeof settings === 'object') {
      updates = Object.keys(settings).map(key => ({ key, value: String(settings[key]) }));
    } else {
      return res.status(400).json({ success: false, error: 'Định dạng dữ liệu cấu hình không hợp lệ!' });
    }

    // Thực hiện kiểm tra tính hợp lệ (Validation)
    for (const update of updates) {
      const { key, value } = update;
      
      if (key === 'FREE_AI_QUESTION_LIMIT') {
        const val = Number(value);
        if (isNaN(val) || val < 0) {
          return res.status(400).json({ success: false, error: 'Số câu hỏi AI miễn phí mỗi ngày phải lớn hơn hoặc bằng 0!' });
        }
      }
      
      if (key === 'MAX_UPLOAD_SIZE_MB') {
        const val = Number(value);
        if (isNaN(val) || val < 1 || val > 500) {
          return res.status(400).json({ success: false, error: 'Giới hạn dung lượng upload phải nằm trong khoảng từ 1 đến 500MB!' });
        }
      }

      if (key === 'PREMIUM_MONTHLY_PRICE') {
        const val = Number(value);
        if (isNaN(val) || val <= 0) {
          return res.status(400).json({ success: false, error: 'Giá gói Premium theo tháng phải lớn hơn 0!' });
        }
      }

      if (key === 'PREMIUM_YEARLY_PRICE') {
        const val = Number(value);
        if (isNaN(val) || val <= 0) {
          return res.status(400).json({ success: false, error: 'Giá gói Premium theo năm phải lớn hơn 0!' });
        }
      }

      if (key === 'LOG_RETENTION_DAYS') {
        const val = Number(value);
        if (isNaN(val) || val < 1) {
          return res.status(400).json({ success: false, error: 'Số ngày lưu System Log phải lớn hơn hoặc bằng 1!' });
        }
      }

      if (key === 'LOG_SYNC_INTERVAL_MINUTES') {
        const val = Number(value);
        if (isNaN(val) || val < 1 || val > 60) {
          return res.status(400).json({ success: false, error: 'Chu kỳ đồng bộ Google Sheet phải nằm trong khoảng từ 1 đến 60 phút!' });
        }
      }
    }

    // Lưu các cấu hình hợp lệ
    const updatedSettings = [];
    for (const update of updates) {
      const { key, value } = update;
      const updated = await SystemSettingService.set(key, String(value));
      updatedSettings.push(updated);

      // Phát thông báo bảo trì hệ thống hoặc AI nếu được bật
      if (key === 'MAINTENANCE_MODE' && value === 'true') {
        try {
          await NotificationService.sendTemplate('SYSTEM_MAINTENANCE', null, {
            startTime: 'ngay bây giờ',
            endTime: 'khi hoàn tất nâng cấp'
          });
        } catch (notifErr) {
          console.error('[Notification Error] Failed to send maintenance notification:', notifErr);
        }
      }

      if (key === 'AI_MAINTENANCE_MODE' && value === 'true') {
        try {
          await NotificationService.sendTemplate('AI_MAINTENANCE', null, {});
        } catch (notifErr) {
          console.error('[Notification Error] Failed to send AI maintenance notification:', notifErr);
        }
      }

      // Lưu log kiểm toán hệ thống
      await logSystemEvent(req, {
        type: 'ADMIN',
        action: 'UPDATE_SYSTEM_SETTING',
        module: 'SYSTEM_SETTINGS',
        userId: adminId,
        description: `Cập nhật cấu hình hệ thống: ${key} = ${value}`,
        metadata: { key, value },
        level: 'INFO'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cấu hình hệ thống thành công!',
      data: updatedSettings
    });

  } catch (err: any) {
    console.error('[UpdateSettings Error]', err);
    return res.status(500).json({ success: false, error: 'Không thể cập nhật cấu hình hệ thống.' });
  }
}
