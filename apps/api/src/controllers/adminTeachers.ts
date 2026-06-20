import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// ────────────────────────────────────────────────────────────
// Get Teacher Stats (KPI cards)
// ────────────────────────────────────────────────────────────
export const getTeacherStats = async (req: Request, res: Response) => {
  try {
    const [totalTeachers, pendingProfiles, approvedProfiles, blockedTeachers] = await Promise.all([
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.teacherProfile.count({ where: { status: 'PENDING' } }),
      prisma.teacherProfile.count({ where: { status: 'APPROVED' } }),
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

    // TeacherProfile status & subjects filters
    const profileConditions: any = {};
    if (status && status !== 'all') {
      profileConditions.status = status.toUpperCase();
    }
    if (subject && subject !== 'all') {
      profileConditions.subjects = { contains: subject, mode: 'insensitive' };
    }

    // Combine filters
    if (Object.keys(profileConditions).length > 0) {
      userWhere.teacherProfile = profileConditions;
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
        teacherProfile: true
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
          profile: t.teacherProfile ? {
            subjects: t.teacherProfile.subjects,
            education: t.teacherProfile.education,
            university: t.teacherProfile.university,
            experienceYears: t.teacherProfile.experienceYears,
            bio: t.teacherProfile.bio || '',
            dob: t.teacherProfile.dob ? t.teacherProfile.dob.toISOString().split('T')[0] : '',
            cvUrl: t.teacherProfile.cvUrl || '',
            degreeUrl: t.teacherProfile.degreeUrl || '',
            certificateUrl: t.teacherProfile.certificateUrl || '',
            status: t.teacherProfile.status,
            rejectedReason: t.teacherProfile.rejectedReason || ''
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
        teacherProfile: true,
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
        profile: teacherObj.teacherProfile ? {
          subjects: teacherObj.teacherProfile.subjects,
          education: teacherObj.teacherProfile.education,
          university: teacherObj.teacherProfile.university,
          experienceYears: teacherObj.teacherProfile.experienceYears,
          bio: teacherObj.teacherProfile.bio || '',
          dob: teacherObj.teacherProfile.dob ? teacherObj.teacherProfile.dob.toISOString().split('T')[0] : '',
          cvUrl: teacherObj.teacherProfile.cvUrl || '',
          degreeUrl: teacherObj.teacherProfile.degreeUrl || '',
          certificateUrl: teacherObj.teacherProfile.certificateUrl || '',
          status: teacherObj.teacherProfile.status,
          approvedAt: teacherObj.teacherProfile.approvedAt ? teacherObj.teacherProfile.approvedAt.toISOString() : null,
          approvedBy: teacherObj.teacherProfile.approvedBy,
          rejectedAt: teacherObj.teacherProfile.rejectedAt ? teacherObj.teacherProfile.rejectedAt.toISOString() : null,
          rejectedBy: teacherObj.teacherProfile.rejectedBy,
          rejectedReason: teacherObj.teacherProfile.rejectedReason || ''
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

      // 2. Create Teacher role relation
      await tx.teacher.create({
        data: {
          userId: u.id,
          isApproved: isApproved,
          bio: bio || ''
        }
      });

      // 3. Create TeacherProfile
      await tx.teacherProfile.create({
        data: {
          userId: u.id,
          subjects,
          education,
          university,
          experienceYears: Number(experienceYears || 0),
          bio: bio || '',
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
      include: { teacherProfile: true }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên!' });
    }

    await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { userId: Number(id) },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId,
          rejectedAt: null,
          rejectedBy: null,
          rejectedReason: null
        }
      }),
      prisma.teacher.update({
        where: { userId: Number(id) },
        data: {
          isApproved: true
        }
      })
    ]);

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
      include: { teacherProfile: true }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
      return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên!' });
    }

    await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { userId: Number(id) },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: adminId,
          rejectedReason: reason.trim(),
          approvedAt: null,
          approvedBy: null
        }
      }),
      prisma.teacher.update({
        where: { userId: Number(id) },
        data: {
          isApproved: false
        }
      })
    ]);

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

    return res.status(200).json({
      success: true,
      message: 'Mở khóa tài khoản giáo viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
