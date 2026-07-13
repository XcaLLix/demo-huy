import { AnnouncementRepository } from '../repositories/announcement.repository.js';
import { logSystemEvent } from '../utils/logger.js';

export class AnnouncementService {
  // Sync status of active/scheduled/expired announcements based on time
  static async syncAnnouncementStatus(announcement: any) {
    if (announcement.status === 'PAUSED' || announcement.status === 'DRAFT') {
      return announcement;
    }

    const now = new Date();
    const start = new Date(announcement.startAt);
    const end = new Date(announcement.endAt);
    let newStatus = announcement.status;

    if (now < start) {
      newStatus = 'SCHEDULED';
    } else if (now >= start && now <= end) {
      newStatus = 'ACTIVE';
    } else {
      newStatus = 'EXPIRED';
    }

    if (newStatus !== announcement.status) {
      const updated = await AnnouncementRepository.updateAnnouncement(announcement.id, { status: newStatus });
      return updated;
    }

    return announcement;
  }

  static async getAnnouncements(filters: any, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const list = await AnnouncementRepository.getAnnouncements(filters, skip, limit);
    
    // Sync statuses on fetch
    const syncedList = await Promise.all(list.map(ann => this.syncAnnouncementStatus(ann)));
    
    const total = await AnnouncementRepository.countAnnouncements(filters);
    return {
      announcements: syncedList,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAnnouncementDetail(id: number) {
    const announcement = await AnnouncementRepository.getAnnouncementById(id);
    if (!announcement) return null;
    return this.syncAnnouncementStatus(announcement);
  }

  static async createAnnouncement(data: any, creatorId: number) {
    const now = new Date();
    const start = new Date(data.startAt);
    const end = new Date(data.endAt);

    let status = data.status || 'DRAFT';
    if (status !== 'DRAFT' && status !== 'PAUSED') {
      if (now < start) {
        status = 'SCHEDULED';
      } else if (now >= start && now <= end) {
        status = 'ACTIVE';
      } else {
        status = 'EXPIRED';
      }
    }

    const payload = {
      ...data,
      status,
      createdBy: creatorId,
      startAt: start,
      endAt: end,
      priority: data.priority ? Number(data.priority) : 0,
      hideDurationHours: data.hideDurationHours ? Number(data.hideDurationHours) : 24
    };

    const announcement = await AnnouncementRepository.createAnnouncement(payload);

    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'ANNOUNCEMENT_CREATE',
      module: 'ANNOUNCEMENT_SERVICE',
      description: `Admin ID ${creatorId} đã tạo mới thông báo popup "${announcement.title}" (Loại: ${announcement.type})`,
      metadata: announcement,
      level: 'INFO'
    });

    return announcement;
  }

  static async updateAnnouncement(id: number, data: any, adminId: number) {
    const existing = await AnnouncementRepository.getAnnouncementById(id);
    if (!existing) {
      throw new Error('Thông báo không tồn tại!');
    }

    const payload: any = { ...data };
    if (data.startAt) payload.startAt = new Date(data.startAt);
    if (data.endAt) payload.endAt = new Date(data.endAt);
    if (data.priority !== undefined) payload.priority = Number(data.priority);
    if (data.hideDurationHours !== undefined) payload.hideDurationHours = Number(data.hideDurationHours);

    // Sync status if dates or base status is updated
    const targetStatus = payload.status || existing.status;
    const targetStart = payload.startAt || existing.startAt;
    const targetEnd = payload.endAt || existing.endAt;
    const now = new Date();

    if (targetStatus !== 'DRAFT' && targetStatus !== 'PAUSED') {
      if (now < targetStart) {
        payload.status = 'SCHEDULED';
      } else if (now >= targetStart && now <= targetEnd) {
        payload.status = 'ACTIVE';
      } else {
        payload.status = 'EXPIRED';
      }
    }

    const announcement = await AnnouncementRepository.updateAnnouncement(id, payload);

    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'ANNOUNCEMENT_UPDATE',
      module: 'ANNOUNCEMENT_SERVICE',
      description: `Admin ID ${adminId} đã cập nhật thông báo popup "${announcement.title}"`,
      metadata: announcement,
      level: 'INFO'
    });

    return announcement;
  }

  static async deleteAnnouncement(id: number, adminId: number) {
    const existing = await AnnouncementRepository.getAnnouncementById(id);
    if (!existing) {
      throw new Error('Thông báo không tồn tại!');
    }

    await AnnouncementRepository.deleteAnnouncement(id);

    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'ANNOUNCEMENT_DELETE',
      module: 'ANNOUNCEMENT_SERVICE',
      description: `Admin ID ${adminId} đã xóa thông báo popup "${existing.title}"`,
      metadata: { id, title: existing.title },
      level: 'INFO'
    });

    return existing;
  }

  static async getActiveAnnouncements(role?: string, page?: string) {
    const list = await AnnouncementRepository.getActiveAnnouncements();
    
    // Sync statuses of active list
    const syncedList = await Promise.all(list.map(ann => this.syncAnnouncementStatus(ann)));
    
    // Filter out any that became expired after sync
    const activeList = syncedList.filter(ann => ann.status === 'ACTIVE');

    if (!role && !page) {
      return activeList;
    }

    // Optional filtering at backend level
    return activeList.filter(ann => {
      // Role matching
      let roleMatch = true;
      if (role && ann.targetRoles && ann.targetRoles.length > 0) {
        const uRole = role.toUpperCase();
        roleMatch = ann.targetRoles.includes('EVERYONE') || ann.targetRoles.includes(uRole);
      }

      // Page matching
      let pageMatch = true;
      if (page && ann.targetPages && ann.targetPages.length > 0) {
        pageMatch = ann.targetPages.includes('All Pages') || ann.targetPages.includes(page);
      }

      return roleMatch && pageMatch;
    });
  }
}
