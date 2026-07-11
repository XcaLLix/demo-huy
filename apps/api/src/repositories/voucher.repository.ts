import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export class VoucherRepository {
  static async createVoucher(data: Prisma.VoucherUncheckedCreateInput) {
    return prisma.voucher.create({ data });
  }

  static async getVoucherById(id: number) {
    return prisma.voucher.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          },
          orderBy: { usedAt: 'desc' }
        }
      }
    });
  }

  static async getVoucherByCode(code: string) {
    return prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });
  }

  static async updateVoucher(id: number, data: Prisma.VoucherUpdateInput) {
    return prisma.voucher.update({
      where: { id },
      data
    });
  }

  static async deleteVoucher(id: number) {
    return prisma.voucher.delete({
      where: { id }
    });
  }

  static async getVouchers(
    filters: { code?: string; name?: string; status?: any; discountType?: any },
    skip = 0,
    take = 10
  ) {
    const where: Prisma.VoucherWhereInput = {};

    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.discountType) {
      where.discountType = filters.discountType;
    }

    return prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }

  static async countVouchers(filters: { code?: string; name?: string; status?: any; discountType?: any }) {
    const where: Prisma.VoucherWhereInput = {};

    if (filters.code) {
      where.code = { contains: filters.code, mode: 'insensitive' };
    }
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.discountType) {
      where.discountType = filters.discountType;
    }

    return prisma.voucher.count({ where });
  }

  static async createUsage(data: Prisma.VoucherUsageUncheckedCreateInput) {
    return prisma.voucherUsage.create({ data });
  }

  static async countUsagesByUser(userId: number, voucherId: number) {
    return prisma.voucherUsage.count({
      where: { userId, voucherId }
    });
  }

  static async getTotalDiscountAmount(voucherId: number) {
    const agg = await prisma.voucherUsage.aggregate({
      where: { voucherId },
      _sum: {
        discountAmount: true
      }
    });
    return agg._sum.discountAmount || 0;
  }

  // Reservation methods
  static async createReservation(data: Prisma.VoucherReservationUncheckedCreateInput) {
    // Delete any existing reservation for the same user and course/premium to avoid conflicts
    await prisma.voucherReservation.deleteMany({
      where: {
        userId: data.userId,
        courseId: data.courseId,
        isPremium: data.isPremium
      }
    });

    return prisma.voucherReservation.create({ data });
  }

  static async getReservation(userId: number, courseId?: number, isPremium?: boolean) {
    return prisma.voucherReservation.findFirst({
      where: {
        userId,
        courseId: courseId ?? null,
        isPremium: isPremium ?? false
      },
      include: {
        voucher: true
      }
    });
  }

  static async deleteReservation(id: number) {
    return prisma.voucherReservation.delete({
      where: { id }
    });
  }

  static async deleteReservationByUserAndCourse(userId: number, courseId?: number, isPremium?: boolean) {
    return prisma.voucherReservation.deleteMany({
      where: {
        userId,
        courseId: courseId ?? null,
        isPremium: isPremium ?? false
      }
    });
  }
}
