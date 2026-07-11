import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export class NotificationRepository {
  static async createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  }

  static async getNotificationById(id: number) {
    return prisma.notification.findUnique({
      where: { id },
      include: { user: { select: { id: true, fullName: true, email: true } } }
    });
  }

  static async getUserNotifications(
    userId: number,
    filters: { category?: any; type?: any; isRead?: boolean; search?: string },
    skip = 0,
    take = 10
  ) {
    const where: Prisma.NotificationWhereInput = { userId };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }

  static async countUserNotifications(
    userId: number,
    filters: { category?: any; type?: any; isRead?: boolean; search?: string }
  ) {
    const where: Prisma.NotificationWhereInput = { userId };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.notification.count({ where });
  }

  static async countUnreadNotifications(userId: number) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  static async markAsRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  static async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  static async deleteNotification(id: number, userId: number) {
    return prisma.notification.deleteMany({
      where: { id, userId }
    });
  }

  static async deleteAllRead(userId: number) {
    return prisma.notification.deleteMany({
      where: { userId, isRead: true }
    });
  }

  // Template Repository methods
  static async getTemplateByCode(code: string) {
    return prisma.notificationTemplate.findUnique({
      where: { code }
    });
  }

  static async getAllTemplates() {
    return prisma.notificationTemplate.findMany({
      orderBy: { code: 'asc' }
    });
  }

  static async createTemplate(data: Prisma.NotificationTemplateCreateInput) {
    return prisma.notificationTemplate.create({ data });
  }

  static async updateTemplate(id: number, data: Prisma.NotificationTemplateUpdateInput) {
    return prisma.notificationTemplate.update({
      where: { id },
      data
    });
  }

  static async deleteTemplate(id: number) {
    return prisma.notificationTemplate.delete({
      where: { id }
    });
  }

  // Admin query to get history of notifications sent
  static async getAdminNotificationHistory(skip = 0, take = 20) {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  static async countAdminNotificationHistory() {
    return prisma.notification.count();
  }
}
