import { VoucherRepository } from '../repositories/voucher.repository.js';
import { VoucherStatus, VoucherDiscountType, VoucherApplicableType } from '@prisma/client';
import { logSystemEvent } from '../utils/logger.js';

export class VoucherService {
  static async validateVoucher(
    code: string,
    userId: number,
    type: 'COURSE' | 'PREMIUM',
    courseId?: number,
    originalPrice = 0
  ) {
    const voucher = await VoucherRepository.getVoucherByCode(code);
    if (!voucher) {
      return { isValid: false, error: 'Mã giảm giá không tồn tại!' };
    }

    // Auto check and update expired status
    const now = new Date();
    if (voucher.status === VoucherStatus.ACTIVE && voucher.endDate && now > new Date(voucher.endDate)) {
      await VoucherRepository.updateVoucher(voucher.id, { status: VoucherStatus.EXPIRED });
      voucher.status = VoucherStatus.EXPIRED;
    }

    if (voucher.status !== VoucherStatus.ACTIVE) {
      return { isValid: false, error: 'Mã giảm giá đã bị khóa hoặc hết hạn sử dụng!' };
    }

    if (voucher.startDate && now < new Date(voucher.startDate)) {
      return { isValid: false, error: 'Mã giảm giá chưa đến thời gian áp dụng!' };
    }

    // Check quantity limit
    if (voucher.totalQuantity !== null && voucher.usedQuantity >= voucher.totalQuantity) {
      return { isValid: false, error: 'Mã giảm giá đã hết lượt sử dụng!' };
    }

    // Check minimum order value
    if (originalPrice < voucher.minimumOrderValue) {
      return {
        isValid: false,
        error: `Đơn hàng tối thiểu ${voucher.minimumOrderValue.toLocaleString('vi-VN')}đ mới được áp dụng mã này!`
      };
    }

    // Check user limit
    const userUsages = await VoucherRepository.countUsagesByUser(userId, voucher.id);
    if (userUsages >= voucher.limitPerUser) {
      return { isValid: false, error: 'Mỗi tài khoản chỉ được sử dụng mã này tối đa ' + voucher.limitPerUser + ' lần!' };
    }

    // Check applicability
    if (voucher.applicableType === VoucherApplicableType.PREMIUM && type !== 'PREMIUM') {
      return { isValid: false, error: 'Mã này chỉ áp dụng khi nâng cấp tài khoản Premium!' };
    }

    if (voucher.applicableType === VoucherApplicableType.COURSE && type !== 'COURSE') {
      return { isValid: false, error: 'Mã này chỉ áp dụng khi mua khóa học!' };
    }

    if (voucher.applicableType === VoucherApplicableType.SPECIFIC_COURSES) {
      if (type !== 'COURSE' || !courseId || !voucher.applicableCourseIds.includes(courseId)) {
        return { isValid: false, error: 'Mã giảm giá không áp dụng cho sản phẩm này!' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === VoucherDiscountType.PERCENT) {
      discountAmount = originalPrice * (voucher.discountValue / 100);
      if (voucher.maximumDiscount !== null && voucher.maximumDiscount !== undefined) {
        discountAmount = Math.min(discountAmount, voucher.maximumDiscount);
      }
    } else if (voucher.discountType === VoucherDiscountType.FIXED) {
      discountAmount = voucher.discountValue;
    }

    discountAmount = Math.min(discountAmount, originalPrice); // Cannot exceed original price
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      isValid: true,
      voucher,
      discountAmount,
      finalPrice
    };
  }

  static async reserveVoucher(code: string, userId: number, type: 'COURSE' | 'PREMIUM', courseId?: number) {
    const valResult = await this.validateVoucher(code, userId, type, courseId, 999999999); // bypass price limit for reservation check
    if (!valResult.isValid) {
      return valResult;
    }

    const reservation = await VoucherRepository.createReservation({
      userId,
      voucherId: valResult.voucher!.id,
      courseId: type === 'COURSE' ? courseId : null,
      isPremium: type === 'PREMIUM'
    });

    return { isValid: true, reservation };
  }

  static async recordUsage(userId: number, courseId?: number, isPremium?: boolean, paymentId?: string, actualPaidAmount?: number) {
    const reservation = await VoucherRepository.getReservation(userId, courseId, isPremium);
    if (!reservation) {
      return null;
    }

    const voucher = reservation.voucher;
    
    // Calculate actual discount
    let originalPrice = actualPaidAmount || 0;
    let discountAmount = 0;
    if (voucher.discountType === VoucherDiscountType.PERCENT) {
      discountAmount = originalPrice * (voucher.discountValue / 100);
      if (voucher.maximumDiscount !== null && voucher.maximumDiscount !== undefined) {
        discountAmount = Math.min(discountAmount, voucher.maximumDiscount);
      }
    } else if (voucher.discountType === VoucherDiscountType.FIXED) {
      discountAmount = voucher.discountValue;
    }
    
    discountAmount = Math.min(discountAmount, originalPrice);

    // Record usage
    const usage = await VoucherRepository.createUsage({
      userId,
      voucherId: voucher.id,
      paymentId,
      discountAmount
    });

    // Update usedQuantity
    const newUsedQty = voucher.usedQuantity + 1;
    const updateData: any = { usedQuantity: newUsedQty };
    
    // Auto-expire if limit reached
    if (voucher.totalQuantity !== null && newUsedQty >= voucher.totalQuantity) {
      updateData.status = VoucherStatus.EXPIRED;
    }

    await VoucherRepository.updateVoucher(voucher.id, updateData);

    // Delete reservation
    await VoucherRepository.deleteReservation(reservation.id);

    // System log
    await logSystemEvent(null, {
      type: 'SYSTEM',
      action: 'VOUCHER_USED',
      module: 'PAYMENT_SERVICE',
      description: `Học sinh ID ${userId} đã sử dụng mã voucher ${voucher.code} trong giao dịch ${paymentId || 'N/A'}. Số tiền giảm: ${discountAmount.toLocaleString()}đ`,
      metadata: { userId, voucherId: voucher.id, code: voucher.code, discountAmount, paymentId },
      level: 'INFO'
    });

    return usage;
  }

  static async seedDefaultVouchers() {
    console.log('[VoucherService] Seeding default vouchers...');
    
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);

    const defaultVouchers = [
      {
        code: 'WELCOME20',
        name: 'Chào mừng thành viên mới',
        description: 'Giảm 20% học phí khi đăng ký khóa học bất kỳ.',
        discountType: VoucherDiscountType.PERCENT,
        discountValue: 20,
        minimumOrderValue: 0,
        maximumDiscount: 100000, // Tối đa 100k
        totalQuantity: 1000,
        limitPerUser: 1,
        applicableType: VoucherApplicableType.COURSE,
        applicableCourseIds: [],
        status: VoucherStatus.ACTIVE,
        startDate: now,
        endDate: nextYear,
        createdBy: 1
      },
      {
        code: 'VIP100',
        name: 'Ưu đãi Premium nâng cấp tài khoản',
        description: 'Giảm trực tiếp 100.000 VNĐ khi nâng cấp tài khoản Premium PRO.',
        discountType: VoucherDiscountType.FIXED,
        discountValue: 100000,
        minimumOrderValue: 200000,
        maximumDiscount: null,
        totalQuantity: 100,
        limitPerUser: 1,
        applicableType: VoucherApplicableType.PREMIUM,
        applicableCourseIds: [],
        status: VoucherStatus.ACTIVE,
        startDate: now,
        endDate: nextYear,
        createdBy: 1
      }
    ];

    let count = 0;
    for (const v of defaultVouchers) {
      const exists = await VoucherRepository.getVoucherByCode(v.code);
      if (!exists) {
        await VoucherRepository.createVoucher(v);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[VoucherService] Seeded ${count} default vouchers.`);
    } else {
      console.log('[VoucherService] Default vouchers are already seeded.');
    }
  }

  // CRUD wraps
  static async getVouchers(filters: any, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const list = await VoucherRepository.getVouchers(filters, skip, limit);
    const total = await VoucherRepository.countVouchers(filters);
    return {
      vouchers: list,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getVoucherDetail(id: number) {
    const voucher = await VoucherRepository.getVoucherById(id);
    if (!voucher) return null;

    const totalDiscount = await VoucherRepository.getTotalDiscountAmount(id);
    const uniqueUsersCount = new Set(voucher.usages.map(u => u.userId)).size;

    return {
      ...voucher,
      totalDiscountAmount: totalDiscount,
      uniqueUsersCount
    };
  }

  static async createVoucher(data: any, creatorId: number) {
    const existing = await VoucherRepository.getVoucherByCode(data.code);
    if (existing) {
      throw new Error(`Mã voucher "${data.code}" đã tồn tại!`);
    }

    const payload = {
      ...data,
      code: data.code.toUpperCase().trim(),
      createdBy: creatorId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null
    };

    const voucher = await VoucherRepository.createVoucher(payload);

    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'VOUCHER_CREATE',
      module: 'VOUCHER_SERVICE',
      description: `Admin ID ${creatorId} đã tạo mới voucher ${voucher.code} (${voucher.name})`,
      metadata: voucher,
      level: 'INFO'
    });

    return voucher;
  }

  static async updateVoucher(id: number, data: any, adminId: number) {
    const existing = await VoucherRepository.getVoucherById(id);
    if (!existing) {
      throw new Error('Voucher không tồn tại!');
    }

    const payload = {
      ...data,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined
    };

    // Auto reactivate if it was EXPIRED but is now valid
    if (existing.status === VoucherStatus.EXPIRED) {
      const targetEndDate = payload.endDate !== undefined ? payload.endDate : existing.endDate;
      const targetStartDate = payload.startDate !== undefined ? payload.startDate : existing.startDate;
      const now = new Date();
      
      const isStillExpired = targetEndDate && now > new Date(targetEndDate);
      const isNotYetActive = targetStartDate && now < new Date(targetStartDate);
      
      if (!isStillExpired && !isNotYetActive) {
        payload.status = VoucherStatus.ACTIVE;
      }
    }

    const voucher = await VoucherRepository.updateVoucher(id, payload);

    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'VOUCHER_UPDATE',
      module: 'VOUCHER_SERVICE',
      description: `Admin ID ${adminId} đã cập nhật voucher ${voucher.code}`,
      metadata: voucher,
      level: 'INFO'
    });

    return voucher;
  }

  static async deleteVoucher(id: number, adminId: number) {
    const voucher = await VoucherRepository.getVoucherById(id);
    if (!voucher) {
      throw new Error('Voucher không tồn tại!');
    }

    if (voucher.usedQuantity > 0) {
      throw new Error('Không thể xóa voucher đã được sử dụng!');
    }

    await VoucherRepository.deleteVoucher(id);

    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'VOUCHER_DELETE',
      module: 'VOUCHER_SERVICE',
      description: `Admin ID ${adminId} đã xóa voucher ${voucher.code}`,
      metadata: { code: voucher.code, id },
      level: 'INFO'
    });

    return voucher;
  }
}
