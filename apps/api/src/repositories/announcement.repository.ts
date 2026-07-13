import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export class AnnouncementRepository {
  static async createAnnouncement(data: Prisma.AnnouncementUncheckedCreateInput) {
    return prisma.announcement.create({ data });
  }

  static async getAnnouncementById(id: number) {
    return prisma.announcement.findUnique({
      where: { id }
    });
  }

  static async updateAnnouncement(id: number, data: Prisma.AnnouncementUpdateInput) {
    return prisma.announcement.update({
      where: { id },
      data
    });
  }

  static async deleteAnnouncement(id: number) {
    return prisma.announcement.delete({
      where: { id }
    });
  }

  static async getAnnouncements(
    filters: { title?: string; status?: string; type?: string },
    skip = 0,
    take = 10
  ) {
    const where: Prisma.AnnouncementWhereInput = {};

    if (filters.title) {
      where.title = { contains: filters.title, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    return prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ],
      skip,
      take
    });
  }

  static async countAnnouncements(filters: { title?: string; status?: string; type?: string }) {
    const where: Prisma.AnnouncementWhereInput = {};

    if (filters.title) {
      where.title = { contains: filters.title, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    return prisma.announcement.count({ where });
  }

  static async getActiveAnnouncements() {
    const now = new Date();
    return prisma.announcement.findMany({
      where: {
        status: 'ACTIVE',
        startAt: { lte: now },
        endAt: { gte: now }
      },
      orderBy: {
        priority: 'desc'
      }
    });
  }
}
