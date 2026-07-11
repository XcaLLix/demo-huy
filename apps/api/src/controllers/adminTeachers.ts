import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { logSystemEvent } from '../utils/logger.js';
import { NotificationService } from '../services/notification.service.js';

// ────────────────────────────────────────────────────────────
// Get Teacher Stats (KPI cards)
// ────────────────────────────────────────────────────────────
export const getTeacherStats = async (req: Request, res: Response) => {
  try {
    const [totalTeachers, pendingProfiles, approvedProfiles, blockedTeachers] = await Promise.all([
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.teacher.count({ where: { status: 'PENDING' } }),
      prisma.teacher.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'TEACHER', status: 'BLOCKED' } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        pendingProfiles,
        approvedProfiles,
        blockedTeachers
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Get Teacher List (with search, filter, pagination)
// ────────────────────────────────────────────────────────────
export const getAdminTeachers = async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status) : ''; // PENDING, APPROVED, REJECTED
    const accountStatus = req.query.accountStatus ? String(req.query.accountStatus) : ''; // ACTIVE, BLOCKED
    const subject = req.query.subject ? String(req.query.subject).trim() : ''; // Toán học, Vật lý...
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 10));
    const skip = (page - 1) * limit;

    const userWhere: any = { role: 'TEACHER' };

    // Search filter
    if (search) {
      userWhere.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Account status filter
    if (accountStatus && accountStatus !== 'all') {
      userWhere.status = accountStatus.toUpperCase();
    }

    // Teacher status & subjects filters
    const profileConditions: any = {};
    if (status && status !== 'all') {
      profileConditions.status = status.toUpperCase();
    }
    if (subject && subject !== 'all') {
      profileConditions.subjects = { contains: subject, mode: 'insensitive' };
    }

    // Combine filters
    if (Object.keys(profileConditions).length > 0) {
      userWhere.teacher = profileConditions;
    }

    // Query counts and data
    const totalFiltered = await prisma.user.count({ where: userWhere });
    const teachers = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        isActive: true,
        createdAt: true,
        teacher: true
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit
    });

    return res.status(200).json({
      success: true,
      data: {
        teachers: teachers.map(t => ({
          id: t.id,
          name: t.fullName,
          email: t.email,
          phone: t.phone || '',
          avatarUrl: t.avatarUrl,
          accountStatus: t.status,
          isActive: t.isActive,
          registeredDate: t.createdAt.toISOString().split('T')[0],
          profile: t.teacher ? {
            subjects: t.teacher.subjects,
            education: t.teacher.education,
            university: t.teacher.university,
            experienceYears: t.teacher.experienceYears,
            bio: t.teacher.bio || '',
            dob: t.teacher.dob ? t.teacher.dob.toISOString().split('T')[0] : '',
            cvUrl: t.teacher.cvUrl || '',
            degreeUrl: t.teacher.degreeUrl || '',
            certificateUrl: t.teacher.certificateUrl || '',
            status: t.teacher.status,
            rejectedReason: t.teacher.rejectedReason || ''
          } : null
        })),
        pagination: {
          total: totalFiltered,
          page,
          limit,
          totalPages: Math.ceil(totalFiltered / limit)
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Get Teacher Detail
// ────────────────────────────────────────────────────────────
export const getTeacherDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const teacherObj = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        teacher: {
          include: {
            courses: true
          }
        }
      }
    });

    if (!teacherObj || teacherObj.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên này!' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: teacherObj.id,
        name: teacherObj.fullName,
        email: teacherObj.email,
        phone: teacherObj.phone || '',
        avatarUrl: teacherObj.avatarUrl,
        accountStatus: teacherObj.status,
        isActive: teacherObj.isActive,
        createdAt: teacherObj.createdAt.toISOString(),
        blockedAt: teacherObj.blockedAt ? teacherObj.blockedAt.toISOString() : null,
        blockedReason: teacherObj.blockedReason,
        blockedBy: teacherObj.blockedBy,
        profile: teacherObj.teacher ? {
          subjects: teacherObj.teacher.subjects,
          education: teacherObj.teacher.education,
          university: teacherObj.teacher.university,
          experienceYears: teacherObj.teacher.experienceYears,
          bio: teacherObj.teacher.bio || '',
          dob: teacherObj.teacher.dob ? teacherObj.teacher.dob.toISOString().split('T')[0] : '',
          cvUrl: teacherObj.teacher.cvUrl || '',
          degreeUrl: teacherObj.teacher.degreeUrl || '',
          certificateUrl: teacherObj.teacher.certificateUrl || '',
          status: teacherObj.teacher.status,
          approvedAt: teacherObj.teacher.approvedAt ? teacherObj.teacher.approvedAt.toISOString() : null,
          approvedBy: teacherObj.teacher.approvedBy,
          rejectedAt: teacherObj.teacher.rejectedAt ? teacherObj.teacher.rejectedAt.toISOString() : null,
          rejectedBy: teacherObj.teacher.rejectedBy,
          rejectedReason: teacherObj.teacher.rejectedReason || ''
        } : null,
        courses: teacherObj.teacher?.courses || []
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Create Teacher Account (by Admin)
// ────────────────────────────────────────────────────────────
export const createTeacherAccount = async (req: Request, res: Response) => {
  try {
    const {
      email,
      fullName,
      password,
      phone,
      dob,
      avatarUrl,
      subjects,
      education,
      university,
      experienceYears,
      bio,
      cvUrl,
      degreeUrl,
      certificateUrl,
      status // OPTIONAL: defaults to PENDING
    } = req.body;

    if (!email || !fullName || !password || !subjects || !education || !university) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email này đã tồn tại trong hệ thống!' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedStatus = status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? status : 'PENDING';
    const isApproved = assignedStatus === 'APPROVED';

    const newTeacher = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const u = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          role: 'TEACHER',
          isActive: true,
          status: 'ACTIVE',
          phone: phone || null,
          emailVerified: true,
          onboardingComplete: true,
          avatarUrl: avatarUrl || null
        }
      });

      // 2. Create Teacher role relation with profile fields
      await tx.teacher.create({
        data: {
          userId: u.id,
          isApproved: isApproved,
          bio: bio || '',
          subjects,
          education,
          university,
          experienceYears: Number(experienceYears || 0),
          dob: dob ? new Date(dob) : null,
          cvUrl: cvUrl || null,
          degreeUrl: degreeUrl || null,
          certificateUrl: certificateUrl || null,
          status: assignedStatus,
          approvedAt: isApproved ? new Date() : null,
          approvedBy: isApproved ? (req as any).user?.id : null
        }
      });

      return u;
    });

    await logSystemEvent(req, {
      type: 'ADMIN',
      action: 'CREATE_TEACHER',
      module: 'TEACHER_MANAGEMENT',
      userId: (req as any).user?.id,
      description: `Tạo tài khoản giáo viên: ${newTeacher.fullName} (${newTeacher.email})`,
      metadata: { teacherId: newTeacher.id, email: newTeacher.email },
      level: 'INFO'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản Giáo viên thành công!',
      data: {
        id: newTeacher.id,
        email: newTeacher.email,
        name: newTeacher.fullName
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Approve Teacher Profile
// ────────────────────────────────────────────────────────────
export const approveTeacherProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const teacher = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { teacher: true }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên!' });
    }

    await prisma.teacher.update({
      where: { userId: Number(id) },
      data: {
        status: 'APPROVED',
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectedAt: null,
        rejectedBy: null,
        rejectedReason: null
      }
    });

    await logSystemEvent(req, {
      type: 'ADMIN',
      action: 'APPROVE_TEACHER',
      module: 'TEACHER_MANAGEMENT',
      userId: adminId,
      description: `Duyệt hồ sơ giáo viên: ${teacher.fullName} (${teacher.email})`,
      metadata: { teacherId: teacher.id, email: teacher.email },
      level: 'INFO'
    });

    try {
      await NotificationService.sendTemplate('TEACHER_APPROVED', teacher.id, { fullName: teacher.fullName });
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send TEACHER_APPROVED notification:', notifErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Duyệt hồ sơ giáo viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Reject Teacher Profile
// ────────────────────────────────────────────────────────────
export const rejectTeacherProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lý do từ chối hồ sơ!' });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { teacher: true }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên!' });
    }

    await prisma.teacher.update({
      where: { userId: Number(id) },
      data: {
        status: 'REJECTED',
        isApproved: false,
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectedReason: reason.trim(),
        approvedAt: null,
        approvedBy: null
      }
    });

    await logSystemEvent(req, {
      type: 'ADMIN',
      action: 'REJECT_TEACHER',
      module: 'TEACHER_MANAGEMENT',
      userId: adminId,
      description: `Từ chối hồ sơ giáo viên: ${teacher.fullName} (${teacher.email}). Lý do: ${reason.trim()}`,
      metadata: { teacherId: teacher.id, email: teacher.email, reason: reason.trim() },
      level: 'WARNING'
    });

    try {
      await NotificationService.sendTemplate('TEACHER_REJECTED', teacher.id, { reason: reason.trim() });
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send TEACHER_REJECTED notification:', notifErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Từ chối hồ sơ giáo viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Block Teacher
// ────────────────────────────────────────────────────────────
export const blockTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminEmail = (req as any).user?.email || 'Admin';

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lý do khóa giáo viên!' });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên!' });
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: {
        status: 'BLOCKED',
        isActive: false,
        blockedAt: new Date(),
        blockedReason: reason.trim(),
        blockedBy: adminEmail
      }
    });

    await logSystemEvent(req, {
      type: 'ADMIN',
      action: 'BLOCK_TEACHER',
      module: 'TEACHER_MANAGEMENT',
      userId: (req as any).user?.id,
      description: `Khóa tài khoản giáo viên: ${teacher.fullName} (${teacher.email}). Lý do: ${reason.trim()}`,
      metadata: { teacherId: teacher.id, email: teacher.email, reason: reason.trim() },
      level: 'WARNING'
    });

    return res.status(200).json({
      success: true,
      message: 'Khóa tài khoản giáo viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// Unblock Teacher
// ────────────────────────────────────────────────────────────
export const unblockTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const teacher = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên!' });
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: {
        status: 'ACTIVE',
        isActive: true,
        blockedAt: null,
        blockedReason: null,
        blockedBy: null
      }
    });

    await logSystemEvent(req, {
      type: 'ADMIN',
      action: 'UNBLOCK_TEACHER',
      module: 'TEACHER_MANAGEMENT',
      userId: adminId,
      description: `Mở khóa tài khoản giáo viên: ${teacher.fullName} (${teacher.email})`,
      metadata: { teacherId: teacher.id, email: teacher.email },
      level: 'INFO'
    });

    return res.status(200).json({
      success: true,
      message: 'Mở khóa tài khoản giáo viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
