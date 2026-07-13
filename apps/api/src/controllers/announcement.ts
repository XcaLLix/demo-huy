import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { AnnouncementService } from '../services/announcement.service.js';

export async function getAnnouncements(req: AuthRequest, res: Response) {
  const { title, status, type, page, limit } = req.query;
  try {
    const filters = {
      title: title ? String(title) : undefined,
      status: status ? String(status) : undefined,
      type: type ? String(type) : undefined
    };

    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;

    const result = await AnnouncementService.getAnnouncements(filters, p, l);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getActiveAnnouncement(req: AuthRequest, res: Response) {
  const { role, page } = req.query;
  try {
    const list = await AnnouncementService.getActiveAnnouncements(
      role ? String(role) : undefined,
      page ? String(page) : undefined
    );
    
    // Return all or return the highest priority one
    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAnnouncementById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const detail = await AnnouncementService.getAnnouncementDetail(Number(id));
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thông tin popup!' });
    }
    return res.status(200).json({ success: true, data: detail });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const {
    title,
    type,
    content,
    bannerUrl,
    voucherCode,
    showCopyButton,
    buttonText,
    buttonUrl,
    buttonTarget,
    targetRoles,
    targetPages,
    allowHide,
    hideDurationHours,
    priority,
    animation,
    status,
    startAt,
    endAt
  } = req.body;

  if (!title || !type || !content || !startAt || !endAt) {
    return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
  }

  if (new Date(startAt) >= new Date(endAt)) {
    return res.status(400).json({ success: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu!' });
  }

  try {
    const data = {
      title,
      type,
      content,
      bannerUrl: bannerUrl || null,
      voucherCode: voucherCode || null,
      showCopyButton: showCopyButton !== undefined ? Boolean(showCopyButton) : true,
      buttonText: buttonText || null,
      buttonUrl: buttonUrl || null,
      buttonTarget: buttonTarget || '_blank',
      targetRoles: targetRoles || ['EVERYONE'],
      targetPages: targetPages || ['All Pages'],
      allowHide: allowHide !== undefined ? Boolean(allowHide) : true,
      hideDurationHours: hideDurationHours ? Number(hideDurationHours) : 24,
      priority: priority ? Number(priority) : 0,
      animation: animation || 'fade',
      status: status || 'DRAFT',
      startAt: new Date(startAt),
      endAt: new Date(endAt)
    };

    const created = await AnnouncementService.createAnnouncement(data, adminId);
    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateAnnouncement(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const {
    title,
    type,
    content,
    bannerUrl,
    voucherCode,
    showCopyButton,
    buttonText,
    buttonUrl,
    buttonTarget,
    targetRoles,
    targetPages,
    allowHide,
    hideDurationHours,
    priority,
    animation,
    status,
    startAt,
    endAt
  } = req.body;

  try {
    const payload: any = {};
    if (title !== undefined) payload.title = title;
    if (type !== undefined) payload.type = type;
    if (content !== undefined) payload.content = content;
    if (bannerUrl !== undefined) payload.bannerUrl = bannerUrl || null;
    if (voucherCode !== undefined) payload.voucherCode = voucherCode || null;
    if (showCopyButton !== undefined) payload.showCopyButton = Boolean(showCopyButton);
    if (buttonText !== undefined) payload.buttonText = buttonText || null;
    if (buttonUrl !== undefined) payload.buttonUrl = buttonUrl || null;
    if (buttonTarget !== undefined) payload.buttonTarget = buttonTarget || '_blank';
    if (targetRoles !== undefined) payload.targetRoles = targetRoles;
    if (targetPages !== undefined) payload.targetPages = targetPages;
    if (allowHide !== undefined) payload.allowHide = Boolean(allowHide);
    if (hideDurationHours !== undefined) payload.hideDurationHours = Number(hideDurationHours);
    if (priority !== undefined) payload.priority = Number(priority);
    if (animation !== undefined) payload.animation = animation;
    if (status !== undefined) payload.status = status;
    if (startAt !== undefined) payload.startAt = new Date(startAt);
    if (endAt !== undefined) payload.endAt = new Date(endAt);

    if (payload.startAt && payload.endAt && payload.startAt >= payload.endAt) {
      return res.status(400).json({ success: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu!' });
    }

    const updated = await AnnouncementService.updateAnnouncement(Number(id), payload, adminId);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteAnnouncement(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    await AnnouncementService.deleteAnnouncement(Number(id), adminId);
    return res.status(200).json({ success: true, message: 'Đã xóa thông báo popup thành công!' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateAnnouncementStatus(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  const { status } = req.body;

  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  if (!status) {
    return res.status(400).json({ success: false, error: 'Thiếu trạng thái cập nhật!' });
  }

  try {
    const updated = await AnnouncementService.updateAnnouncement(Number(id), { status }, adminId);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
