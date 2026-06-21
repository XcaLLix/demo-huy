import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';

// Helper to sync material to public DocumentResource catalog
async function syncMaterialToPublic(material: any) {
  if (material.isPublic && material.isApproved) {
    const existing = await prisma.documentResource.findFirst({
      where: { driveUrl: material.fileUrl }
    });

    const docData = {
      title: material.title,
      description: material.description || null,
      subject: material.subject,
      level: material.grade || '12',
      price: Math.round(material.price || 0),
      isFree: !material.price || material.price === 0,
      isActive: true,
      isDeleted: false
    };

    if (existing) {
      await prisma.documentResource.update({
        where: { id: existing.id },
        data: docData
      });
    } else {
      await prisma.documentResource.create({
        data: {
          ...docData,
          driveUrl: material.fileUrl
        }
      });
    }
  } else {
    // If not public or not approved, ensure it does not exist in the public library
    await prisma.documentResource.deleteMany({
      where: { driveUrl: material.fileUrl }
    });
  }
}


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

    return res.status(200).json({ success: true, data: materials });
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

  const { title, description, subject, grade, tags, price, isPublic } = req.body;

  if (!title || !subject) {
    // Cleanup file
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({ success: false, error: 'Vui lòng nhập tên tài liệu và môn học!' });
  }

  try {
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const parsedTags = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : []);

    const material = await prisma.teacherMaterial.create({
      data: {
        teacherId,
        title,
        description: description || null,
        subject,
        grade: grade || null,
        fileUrl,
        fileType: path.extname(req.file.originalname).substring(1).toLowerCase(),
        fileSize: req.file.size,
        tags: parsedTags,
        price: price ? Number(price) : 0,
        isPublic: isPublic === 'true' || isPublic === true,
        isApproved: isPublic === 'true' || isPublic === true // Auto-approve if public
      }
    });

    // Sync to public library
    await syncMaterialToPublic(material);

    return res.status(201).json({ success: true, data: material });
  } catch (err: any) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /teacher/materials/:id
export async function updateTeacherMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const teacherId = req.user?.id;

  const { title, description, subject, grade, tags, price, isPublic } = req.body;

  try {
    const material = await prisma.teacherMaterial.findFirst({
      where: { id, teacherId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu hoặc bạn không có quyền sửa!' });
    }

    const parsedTags = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : undefined);

    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(subject ? { subject } : {}),
        ...(grade !== undefined ? { grade } : {}),
        ...(parsedTags ? { tags: parsedTags } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(isPublic !== undefined ? { isPublic: isPublic === 'true' || isPublic === true } : {}),
        isApproved: isPublic !== undefined ? (isPublic === 'true' || isPublic === true) : material.isApproved
      }
    });

    // Sync changes to public library
    await syncMaterialToPublic(updated);

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /teacher/materials/:id
export async function deleteTeacherMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const teacherId = req.user?.id;

  try {
    const material = await prisma.teacherMaterial.findFirst({
      where: { id, teacherId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu hoặc bạn không có quyền xóa!' });
    }

    // Try deleting file from local disk
    try {
      const filename = path.basename(material.fileUrl);
      const filePath = path.resolve(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    // Remove from public library before deleting record
    await prisma.documentResource.deleteMany({
      where: { driveUrl: material.fileUrl }
    });

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

  try {
    const material = await prisma.teacherMaterial.findFirst({
      where: { id, teacherId }
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu!' });
    }

    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: { isApproved: false } // Trigger review flag
    });

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
        isPublic: true,
        isApproved: true,
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

    if (!material || !material.isPublic || !material.isApproved) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu!' });
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

    // In a real vercel blob environment, we might sign URL. In local disk uploads, we just return the direct URL.
    return res.status(200).json({ success: true, data: { fileUrl: material.fileUrl } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 3. ADMIN ENDPOINTS
// ==========================================

// GET /admin/materials/pending
export async function getAdminPendingMaterials(req: AuthRequest, res: Response) {
  try {
    const pending = await prisma.teacherMaterial.findMany({
      where: { isApproved: false },
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

// POST /admin/materials/:id/approve
export async function approveMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);

  try {
    const updated = await prisma.teacherMaterial.update({
      where: { id },
      data: { isApproved: true }
    });

    // Sync to public library
    await syncMaterialToPublic(updated);

    return res.status(200).json({ success: true, data: { message: 'Duyệt tài liệu thành công!', data: updated } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /admin/materials/:id/reject
export async function rejectMaterial(req: AuthRequest, res: Response) {
  const id = parseInt(req.params.id);
  const { reason } = req.body;

  try {
    // Delete or just keep as disapproved with admin notes. The specs say "reject material". We delete it or set status.
    // Let's delete it or mark isApproved = false to avoid listing. Let's delete the file and the record.
    const material = await prisma.teacherMaterial.findUnique({ where: { id } });
    if (!material) return res.status(404).json({ success: false, error: 'Không tìm thấy tài liệu!' });

    try {
      const filename = path.basename(material.fileUrl);
      const filePath = path.resolve(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}

    // Remove from public library as well
    await prisma.documentResource.deleteMany({
      where: { driveUrl: material.fileUrl }
    });

    await prisma.teacherMaterial.delete({ where: { id } });

    return res.status(200).json({ success: true, data: { message: 'Đã từ chối và xóa tài liệu không phù hợp.' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
