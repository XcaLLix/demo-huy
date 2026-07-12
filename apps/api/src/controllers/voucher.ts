import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { VoucherService } from '../services/voucher.service.js';
import { VoucherRepository } from '../repositories/voucher.repository.js';
import { VoucherStatus } from '@prisma/client';
import { logSystemEvent } from '../utils/logger.js';

export async function getVouchers(req: AuthRequest, res: Response) {
  const { code, name, status, discountType, page, limit } = req.query;
  try {
    const filters = {
      code: code ? String(code) : undefined,
      name: name ? String(name) : undefined,
      status: status ? (status as any) : undefined,
      discountType: discountType ? (discountType as any) : undefined
    };

    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;

    const result = await VoucherService.getVouchers(filters, p, l);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getVoucherById(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const detail = await VoucherService.getVoucherDetail(Number(id));
    if (!detail) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy mã giảm giá!' });
    }
    return res.status(200).json({ success: true, data: detail });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createVoucher(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const {
    code,
    name,
    description,
    discountType,
    discountValue,
    minimumOrderValue,
    maximumDiscount,
    totalQuantity,
    limitPerUser,
    applicableType,
    applicableCourseIds,
    startDate,
    endDate
  } = req.body;

  if (!code || !name || !discountType || discountValue === undefined) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ success: false, error: 'Ngày kết thúc phải sau ngày bắt đầu!' });
  }

  if (discountValue <= 0) {
    return res.status(400).json({ success: false, error: 'Giá trị giảm phải lớn hơn 0!' });
  }

  if (totalQuantity !== undefined && totalQuantity !== null && totalQuantity !== '') {
    if (Number(totalQuantity) < 1) {
      return res.status(400).json({ success: false, error: 'Tổng số lượt sử dụng tối thiểu phải bằng 1!' });
    }
  }

  try {
    const data = {
      code: code.trim().toUpperCase(),
      name,
      description,
      discountType,
      discountValue: Number(discountValue),
      minimumOrderValue: minimumOrderValue ? Number(minimumOrderValue) : 0,
      maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
      totalQuantity: (totalQuantity !== undefined && totalQuantity !== null && totalQuantity !== '') ? Number(totalQuantity) : null,
      limitPerUser: limitPerUser ? Number(limitPerUser) : 1,
      applicableType,
      applicableCourseIds: applicableCourseIds ? applicableCourseIds.map(Number) : [],
      status: VoucherStatus.ACTIVE,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    const voucher = await VoucherService.createVoucher(data, adminId);
    return res.status(201).json({ success: true, data: voucher });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateVoucher(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const {
    name,
    description,
    discountType,
    discountValue,
    minimumOrderValue,
    maximumDiscount,
    totalQuantity,
    limitPerUser,
    applicableType,
    applicableCourseIds,
    startDate,
    endDate
  } = req.body;

  try {
    const payload: any = {};
    if (name) payload.name = name;
    if (description !== undefined) payload.description = description;
    if (discountType) payload.discountType = discountType;
    if (discountValue !== undefined) payload.discountValue = Number(discountValue);
    if (minimumOrderValue !== undefined) payload.minimumOrderValue = Number(minimumOrderValue);
    if (maximumDiscount !== undefined) payload.maximumDiscount = maximumDiscount ? Number(maximumDiscount) : null;
    if (totalQuantity !== undefined) payload.totalQuantity = (totalQuantity !== null && totalQuantity !== '') ? Number(totalQuantity) : null;
    if (limitPerUser !== undefined) payload.limitPerUser = Number(limitPerUser);
    if (applicableType) payload.applicableType = applicableType;
    if (applicableCourseIds) payload.applicableCourseIds = applicableCourseIds.map(Number);
    if (startDate !== undefined) payload.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) payload.endDate = endDate ? new Date(endDate) : null;

    if (payload.startDate && payload.endDate && payload.startDate >= payload.endDate) {
      return res.status(400).json({ success: false, error: 'Ngày kết thúc phải sau ngày bắt đầu!' });
    }

    const voucher = await VoucherService.updateVoucher(Number(id), payload, adminId);
    return res.status(200).json({ success: true, data: voucher });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteVoucher(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    await VoucherService.deleteVoucher(Number(id), adminId);
    return res.status(200).json({ success: true, message: 'Đã xóa voucher thành công!' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function enableVoucher(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    const voucher = await VoucherService.updateVoucher(Number(id), { status: VoucherStatus.ACTIVE }, adminId);
    
    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'VOUCHER_ENABLE',
      module: 'VOUCHER_SERVICE',
      description: `Admin ID ${adminId} đã kích hoạt voucher ${voucher.code}`,
      metadata: { id, code: voucher.code },
      level: 'INFO'
    });

    return res.status(200).json({ success: true, data: voucher });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function disableVoucher(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  const { id } = req.params;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    const voucher = await VoucherService.updateVoucher(Number(id), { status: VoucherStatus.INACTIVE }, adminId);
    
    await logSystemEvent(null, {
      type: 'ADMIN',
      action: 'VOUCHER_DISABLE',
      module: 'VOUCHER_SERVICE',
      description: `Admin ID ${adminId} đã khóa voucher ${voucher.code}`,
      metadata: { id, code: voucher.code },
      level: 'INFO'
    });

    return res.status(200).json({ success: true, data: voucher });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function validateVoucher(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const { code, type, courseId, originalPrice } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Thiếu mã voucher!' });
  }

  try {
    const valResult = await VoucherService.validateVoucher(
      code,
      userId,
      type,
      courseId ? Number(courseId) : undefined,
      originalPrice ? Number(originalPrice) : 0
    );

    if (!valResult.isValid) {
      return res.status(400).json({ success: false, error: valResult.error });
    }

    return res.status(200).json({
      success: true,
      data: {
        discountAmount: valResult.discountAmount,
        finalPrice: valResult.finalPrice,
        voucherCode: valResult.voucher!.code,
        discountType: valResult.voucher!.discountType,
        discountValue: valResult.voucher!.discountValue
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function reserveVoucher(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const { code, type, courseId } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Thiếu mã voucher!' });
  }

  try {
    const reserveResult = await VoucherService.reserveVoucher(
      code,
      userId,
      type,
      courseId ? Number(courseId) : undefined
    );

    if (!reserveResult.isValid) {
      return res.status(400).json({ success: false, error: (reserveResult as any).error });
    }

    return res.status(200).json({ success: true, message: 'Đã giữ chỗ voucher thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
