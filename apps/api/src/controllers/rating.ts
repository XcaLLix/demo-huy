import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

/**
 * Lấy danh sách đánh giá & thống kê của tài liệu
 */
export async function getRatings(req: any, res: Response) {
  const documentId = parseInt(req.params.id);
  const user = req.user;
  const role = user?.role;

  try {
    const ratings = await prisma.documentRating.findMany({
      where: {
        documentId,
        ...(role === 'ADMIN' || role === 'TEACHER' ? {} : { isHidden: false })
      },
      include: {
        student: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Thống kê điểm trung bình và tổng số lượng
    const allRatings = await prisma.documentRating.findMany({
      where: { documentId, isHidden: false }
    });
    
    const totalCount = allRatings.length;
    const avgRating = totalCount > 0 
      ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)) 
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        ratings,
        average: avgRating,
        count: totalCount
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Tạo mới hoặc cập nhật đánh giá (một học sinh chỉ được đánh giá 1 lần mỗi tài liệu)
 */
export async function submitOrUpdateRating(req: AuthRequest, res: Response) {
  const documentId = parseInt(req.params.id);
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Số sao đánh giá phải từ 1 đến 5!' });
  }

  try {
    const ratingRecord = await prisma.documentRating.upsert({
      where: {
        documentId_studentId: { documentId, studentId }
      },
      update: {
        rating: Number(rating),
        comment: comment || null,
        isHidden: false, // Reset trạng thái ẩn nếu học sinh cập nhật lại
        hiddenReason: null,
        hiddenBy: null,
        updatedAt: new Date()
      },
      create: {
        documentId,
        studentId,
        rating: Number(rating),
        comment: comment || null
      }
    });

    return res.status(200).json({ success: true, data: ratingRecord });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Ẩn hoặc hiển thị lại đánh giá (dành cho Giáo viên của tài liệu hoặc Admin)
 */
export async function hideRating(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const userId = req.user?.id;
  const userRole = req.user?.role;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { reason, isHidden } = req.body;
  const shouldHide = isHidden !== undefined ? (isHidden === 'true' || isHidden === true) : true;

  try {
    const rating = await prisma.documentRating.findUnique({
      where: { id },
      include: { document: true }
    });

    if (!rating) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đánh giá!' });
    }

    // Kiểm tra quyền: Chỉ Admin hoặc Giáo viên tạo ra tài liệu này mới được phép ẩn nhận xét
    let isAuthorized = userRole === 'ADMIN';
    if (!isAuthorized && userRole === 'TEACHER') {
      const material = await prisma.teacherMaterial.findFirst({
        where: { fileUrl: rating.document.driveUrl || '' }
      });
      if (material && material.teacherId === userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền quản lý đánh giá này!' });
    }

    const updated = await prisma.documentRating.update({
      where: { id },
      data: {
        isHidden: shouldHide,
        hiddenReason: shouldHide ? (reason || 'Ẩn bởi giáo viên/admin') : null,
        hiddenBy: shouldHide ? userId : null
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        message: shouldHide ? 'Đã ẩn nhận xét thành công!' : 'Đã hiển thị lại nhận xét thành công!',
        data: updated
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
