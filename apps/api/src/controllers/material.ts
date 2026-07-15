import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { MaterialService } from '../services/material.service.js';

// ==========================================
// 1. TEACHER ENDPOINTS
// ==========================================

// GET /teacher/materials (own materials)
export async function getTeacherMaterials(req: AuthRequest, res: Response) {
  const teacherId = req.user?.id;
  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const materials = await prisma.teacherMaterial.findMany({
      where: { teacherId },
      orderBy: { uploadedAt: 'desc' }
    });

    // Tìm DocumentResource tương ứng để lấy ID phục vụ lấy đánh giá
    const fileUrls = materials.map(m => m.fileUrl);
    const docResources = await prisma.documentResource.findMany({
      where: { driveUrl: { in: fileUrls } }
    });

    const data = materials.map(m => {
      const doc = docResources.find(d => d.driveUrl === m.fileUrl);
      return {
        ...m,
        documentResourceId: doc ? doc.id : null
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /teacher/materials (upload)
export async function createTeacherMaterial(req: AuthRequest, res: Response) {
  const teacherId = req.user?.id;
  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Vui lòng chọn tệp tài liệu để tải lên!' });
  }

  const { title, description, subject, grade, tags, price, status } = req.body;

  if (!title || !subject) {
    // Cleanup file
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ success: false, error: 'Vui lòng nhập tên tài liệu và môn học!' });
  }

  try {
    // Lưu trữ tệp tin theo ID giáo viên
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/documents/teacher-${teacherId}/${req.file.filename}`;
    const parsedTags = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : []);
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Hỗ trợ xem trực tuyến đối với PDF
    let previewUrl: string | null = null;
    let previewStatus: 'READY' | 'PROCESSING' | 'FAILED' | null = null;
    let pageCount: number | null = null;

    if (ext === '.pdf') {
      previewUrl = fileUrl;
      previewStatus = 'READY';
      pageCount = await MaterialService.getPdfPageCount(req.file.path);
    }

    // Trạng thái tải lên ban đầu phải là DRAFT hoặc PENDING_REVIEW
    let initialStatus = status || 'DRAFT';
    if (initialStatus !== 'DRAFT' && initialStatus !== 'PENDING_REVIEW') {
      initialStatus = 'DRAFT';
    }

    const material = await prisma.teacherMaterial.create({
      data: {
        teacherId,
        title,
        description: description || null,
        subject,
        grade: grade || null,
        fileUrl,
        fileType: ext.substring(1),
        fileSize: req.file.size,
        tags: parsedTags,
        price: price ? Number(price) : 0,
        status: initialStatus as any,
        previewUrl,
        previewStatus,
        pageCount
      }
    });

    // Đồng bộ sang thư viện công cộng (chỉ tạo nếu APPROVED, trường hợp này chưa tạo)
    await MaterialService.syncMaterialToPublic(material.id);

    return res.status(201).json({ success: true, data: material });
  } catch (err: any) {
    try { fs.unlinkSync(req.file!.path); } catch (e) {}
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /teacher/materials/:id
export async function updateTeacherMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const teacherId = req.user?.id;
  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { title, description, subject, grade, tags, price, status } = req.body;

  try {
    const material = await prisma.teacherMaterial.findFirst({
      where: { id, teacherId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu hoặc bạn không có quyền sửa!' });
    }

    const parsedTags = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : undefined);

    // Xác định trạng thái mới
    const isApprovedBefore = material.status === 'APPROVED';
    const isUpdatingFields = title || description !== undefined || subject || grade !== undefined || parsedTags || price !== undefined;
    
    let newStatus = status || material.status;
    
    // Nếu sửa đổi tệp tin đã duyệt, quay về trạng thái PENDING_REVIEW để duyệt lại
    if (isApprovedBefore && isUpdatingFields) {
      newStatus = 'PENDING_REVIEW';
    }

    // Giáo viên không được tự ý duyệt tài liệu
    if (newStatus === 'APPROVED' || newStatus === 'REJECTED' || newStatus === 'HIDDEN') {
      newStatus = 'PENDING_REVIEW';
    }

    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(subject ? { subject } : {}),
        ...(grade !== undefined ? { grade } : {}),
        ...(parsedTags ? { tags: parsedTags } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        status: newStatus as any,
        // Nếu phải gửi duyệt lại, xóa lịch sử duyệt cũ
        ...(newStatus === 'PENDING_REVIEW' ? {
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          rejectionReason: null
        } : {})
      }
    });

    // Đồng bộ lại vào DocumentResource
    await MaterialService.syncMaterialToPublic(updated.id);

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /teacher/materials/:id
export async function deleteTeacherMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const teacherId = req.user?.id;
  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const material = await prisma.teacherMaterial.findFirst({
      where: { id, teacherId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu hoặc bạn không có quyền xóa!' });
    }

    // Xóa tệp tin trên đĩa cứng
    try {
      const filename = path.basename(material.fileUrl);
      const filePath = path.resolve(process.cwd(), 'uploads', 'documents', `teacher-${teacherId}`, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    // Gỡ tài liệu khỏi thư viện công cộng
    await prisma.documentResource.deleteMany({
      where: { driveUrl: material.fileUrl }
    });

    // Xóa khỏi DB
    await prisma.teacherMaterial.delete({ where: { id } });

    return res.status(200).json({ success: true, data: 'Xóa tài liệu thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /teacher/materials/:id/submit
export async function submitTeacherMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const teacherId = req.user?.id;
  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const material = await prisma.teacherMaterial.findFirst({
      where: { id, teacherId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu!' });
    }

    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      }
    });

    await MaterialService.syncMaterialToPublic(updated.id);

    return res.status(200).json({ success: true, data: { message: 'Đã gửi tài liệu phê duyệt!', data: updated } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 2. PUBLIC ENDPOINTS
// ==========================================

// GET /materials (list approved public materials)
export async function getPublicMaterials(req: Request, res: Response) {
  const { subject, grade, tag, query } = req.query;

  try {
    const materials = await prisma.teacherMaterial.findMany({
      where: {
        status: 'APPROVED',
        ...(subject ? { subject: String(subject) } : {}),
        ...(grade ? { grade: String(grade) } : {}),
        ...(tag ? { tags: { has: String(tag) } } : {}),
        ...(query ? {
          OR: [
            { title: { contains: String(query), mode: 'insensitive' } },
            { description: { contains: String(query), mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    const result = materials.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      subject: m.subject,
      grade: m.grade,
      fileType: m.fileType,
      fileSize: m.fileSize,
      tags: m.tags,
      price: m.price,
      previewUrl: m.previewUrl,
      downloadCount: m.downloadCount,
      viewCount: m.viewCount,
      uploadedAt: m.uploadedAt,
      teacherName: m.teacher.user.fullName,
      teacherAvatar: m.teacher.user.avatarUrl
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /materials/:id (detail + increment views)
export async function getMaterialDetail(req: Request, res: Response) {
  const id = parseInt(req.params.id);

  try {
    const material = await prisma.teacherMaterial.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } }
          }
        }
      }
    });

    if (!material || material.status !== 'APPROVED') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu hoặc chưa được duyệt!' });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...material,
        teacherName: material.teacher.user.fullName,
        teacherAvatar: material.teacher.user.avatarUrl
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /materials/:id/download
export async function downloadMaterial(req: Request, res: Response) {
  const id = parseInt(req.params.id);

  try {
    const material = await prisma.teacherMaterial.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu!' });
    }

    return res.status(200).json({ success: true, data: { fileUrl: material.fileUrl } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 3. ADMIN ENDPOINTS
// ==========================================

// GET /admin/materials (Xem toàn bộ tài liệu)
export async function getAdminMaterials(req: AuthRequest, res: Response) {
  try {
    const materials = await prisma.teacherMaterial.findMany({
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true, email: true } }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    const result = materials.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      subject: m.subject,
      grade: m.grade,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileSize: m.fileSize,
      tags: m.tags,
      price: m.price,
      status: m.status,
      previewUrl: m.previewUrl,
      pageCount: m.pageCount,
      rejectionReason: m.rejectionReason,
      approvedBy: m.approvedBy,
      approvedAt: m.approvedAt,
      rejectedBy: m.rejectedBy,
      rejectedAt: m.rejectedAt,
      hiddenBy: m.hiddenBy,
      hiddenAt: m.hiddenAt,
      uploadedAt: m.uploadedAt,
      teacherName: m.teacher.user.fullName,
      teacherEmail: m.teacher.user.email
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /admin/materials/pending (Giữ để tương thích ngược nếu cần)
export async function getAdminPendingMaterials(req: AuthRequest, res: Response) {
  try {
    const pending = await prisma.teacherMaterial.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true, email: true } }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    const result = pending.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      subject: m.subject,
      grade: m.grade,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileSize: m.fileSize,
      tags: m.tags,
      price: m.price,
      uploadedAt: m.uploadedAt,
      teacherName: m.teacher.user.fullName,
      teacherEmail: m.teacher.user.email
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /admin/materials/:id/approve
export async function approveMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        hiddenBy: null,
        hiddenAt: null
      }
    });

    // Đồng bộ sang bảng DocumentResource công khai
    await MaterialService.syncMaterialToPublic(updated.id);

    return res.status(200).json({ success: true, data: { message: 'Phê duyệt tài liệu thành công!', data: updated } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /admin/materials/:id/reject
export async function rejectMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lý do từ chối!' });
  }

  try {
    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedBy: adminId,
        rejectedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        hiddenBy: null,
        hiddenAt: null
      }
    });

    // Gỡ tài liệu khỏi thư viện công cộng
    await MaterialService.syncMaterialToPublic(updated.id);

    return res.status(200).json({ success: true, data: { message: 'Từ chối phê duyệt tài liệu thành công!', data: updated } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /admin/materials/:id/hide
export async function hideMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: {
        status: 'HIDDEN',
        hiddenBy: adminId,
        hiddenAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      }
    });

    // Đồng bộ trạng thái ẩn sang DocumentResource (set isActive = false)
    await MaterialService.syncMaterialToPublic(updated.id);

    return res.status(200).json({ success: true, data: { message: 'Đã ẩn tài liệu thành công!', data: updated } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
