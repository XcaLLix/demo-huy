import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Helper interface
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ────────────────────────────────────────────────────────────
// 1. Get Course Statistics for Admin Dashboard
// ────────────────────────────────────────────────────────────
export const getAdminCoursesStats = async (req: Request, res: Response) => {
  try {
    const [
      totalCourses,
      pendingCourses,
      approvedCourses,
      rejectedCourses,
      hiddenCourses,
      enrollmentStats
    ] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PENDING' } }),
      prisma.course.count({ where: { status: 'APPROVED' } }),
      prisma.course.count({ where: { status: 'REJECTED' } }),
      prisma.course.count({ where: { visibility: 'HIDDEN', status: 'APPROVED' } }),
      prisma.enrollment.aggregate({
        _sum: {
          amount: true
        },
        _count: {
          id: true,
          studentId: true // Note: count of records, not unique students. 
        }
      })
    ]);

    // Count unique enrolled students
    const uniqueStudentsObj = await prisma.enrollment.groupBy({
      by: ['studentId'],
      _count: {
        studentId: true
      }
    });
    const totalStudentsEnrolled = uniqueStudentsObj.length;

    return res.status(200).json({
      success: true,
      data: {
        totalCourses,
        pendingCourses,
        approvedCourses,
        rejectedCourses,
        hiddenCourses,
        totalStudentsEnrolled,
        totalRevenue: enrollmentStats._sum.amount || 0,
        totalEnrollments: enrollmentStats._count.id || 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 2. Get Admin Courses List (with filters, search, metrics)
// ────────────────────────────────────────────────────────────
export const getAdminCourses = async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const subject = req.query.subject ? String(req.query.subject).trim() : '';
    const status = req.query.status ? String(req.query.status) : '';
    const visibility = req.query.visibility ? String(req.query.visibility) : '';
    const priceFrom = req.query.priceFrom ? Number(req.query.priceFrom) : NaN;
    const priceTo = req.query.priceTo ? Number(req.query.priceTo) : NaN;
    const fromDate = req.query.fromDate ? String(req.query.fromDate) : '';
    const toDate = req.query.toDate ? String(req.query.toDate) : '';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 10));
    const skip = (page - 1) * limit;

    const courseWhere: any = {};

    // 1. Search filter: Title or Teacher name
    if (search) {
      courseWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { teacher: { user: { fullName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // 2. Subject filter
    if (subject && subject !== 'all') {
      courseWhere.subject = { contains: subject, mode: 'insensitive' };
    }

    // 3. Status filter
    if (status && status !== 'all') {
      courseWhere.status = status.toUpperCase();
    }

    // 4. Visibility filter
    if (visibility && visibility !== 'all') {
      courseWhere.visibility = visibility.toUpperCase();
    }

    // 5. Price filter
    if (!isNaN(priceFrom) || !isNaN(priceTo)) {
      courseWhere.price = {};
      if (!isNaN(priceFrom)) {
        courseWhere.price.gte = priceFrom;
      }
      if (!isNaN(priceTo)) {
        courseWhere.price.lte = priceTo;
      }
    }

    // 6. Created Date filter (fromDate/toDate)
    if (fromDate || toDate) {
      courseWhere.createdAt = {};
      if (fromDate) {
        courseWhere.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        // Set to end of day to include the day
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        courseWhere.createdAt.lte = endOfDay;
      }
    }

    // Query count
    const totalFiltered = await prisma.course.count({ where: courseWhere });

    // Query courses list
    const courses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        enrollments: true
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit
    });

    // Map through courses to calculate statistics
    const mappedCourses = courses.map(course => {
      const enrollments = course.enrollments || [];
      const enrolledCount = enrollments.length;
      const completedCount = enrollments.filter(e => e.progress >= 80).length;
      const completionRate = enrolledCount > 0 ? Number(((completedCount / enrolledCount) * 100).toFixed(1)) : 0;
      const revenue = enrollments.reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        subject: course.subject,
        level: course.level,
        price: course.price,
        discount: course.discount,
        thumbnailUrl: course.thumbnailUrl,
        teacherName: course.teacher?.user?.fullName || 'Giáo viên',
        teacherEmail: course.teacher?.user?.email || '',
        status: course.status,
        visibility: course.visibility,
        createdAt: course.approvedAt ? course.approvedAt.toISOString() : null, // for submitted date showing or createdAt
        courseCreatedAt: (course as any).createdAt || null,
        submittedAt: course.submittedAt ? course.submittedAt.toISOString() : null,
        enrolledCount,
        completedCount,
        completionRate,
        revenue
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        courses: mappedCourses,
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
// 3. Get Course Detail for Admin Panel
// ────────────────────────────────────────────────────────────
export const getAdminCourseDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        lessons: {
          orderBy: { order: 'asc' }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học này!' });
    }

    // Stats calculations
    const enrollments = course.enrollments || [];
    const enrolledCount = enrollments.length;
    const completedCount = enrollments.filter(e => e.progress >= 80).length;
    const completionRate = enrolledCount > 0 ? Number(((completedCount / enrolledCount) * 100).toFixed(1)) : 0;
    const activeCount = enrollments.filter(e => e.progress < 80).length;
    const revenue = enrollments.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Fetch approvedBy / rejectedBy / hiddenBy admin details
    const adminIds = [course.approvedBy, course.rejectedBy, course.hiddenBy].filter(Boolean) as number[];
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, fullName: true, email: true }
    });
    
    const adminMap = admins.reduce((map: any, admin) => {
      map[admin.id] = admin;
      return map;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        subject: course.subject,
        level: course.level,
        price: course.price,
        discount: course.discount,
        thumbnailUrl: course.thumbnailUrl,
        teacher: {
          id: course.teacherId,
          name: course.teacher?.user?.fullName || 'Giáo viên',
          email: course.teacher?.user?.email || '',
          avatarUrl: course.teacher?.user?.avatarUrl || ''
        },
        status: course.status,
        visibility: course.visibility,
        submittedAt: course.submittedAt ? course.submittedAt.toISOString() : null,
        approvedAt: course.approvedAt ? course.approvedAt.toISOString() : null,
        approvedBy: course.approvedBy ? adminMap[course.approvedBy] : null,
        rejectedAt: course.rejectedAt ? course.rejectedAt.toISOString() : null,
        rejectedBy: course.rejectedBy ? adminMap[course.rejectedBy] : null,
        rejectedReason: course.rejectedReason,
        hiddenAt: course.hiddenAt ? course.hiddenAt.toISOString() : null,
        hiddenBy: course.hiddenBy ? adminMap[course.hiddenBy] : null,
        hiddenReason: course.hiddenReason,
        lessons: course.lessons,
        stats: {
          enrolledCount,
          activeCount,
          completedCount,
          completionRate,
          revenue
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 4. Approve Course
// ────────────────────────────────────────────────────────────
export const approveCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 1;

    const course = await prisma.course.findUnique({
      where: { id: Number(id) }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    if (course.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể phê duyệt khóa học đang ở trạng thái Chờ duyệt (PENDING)!' });
    }

    await prisma.course.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        visibility: 'VISIBLE',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectedAt: null,
        rejectedBy: null,
        rejectedReason: null,
        hiddenAt: null,
        hiddenBy: null,
        hiddenReason: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Phê duyệt khóa học và phát hành lên trang học viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 5. Reject Course (with reason)
// ────────────────────────────────────────────────────────────
export const rejectCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lý do từ chối phê duyệt khóa học!' });
    }

    const course = await prisma.course.findUnique({
      where: { id: Number(id) }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    if (course.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể từ chối khóa học đang ở trạng thái Chờ duyệt (PENDING)!' });
    }

    await prisma.course.update({
      where: { id: Number(id) },
      data: {
        status: 'REJECTED',
        visibility: 'HIDDEN',
        isApproved: false,
        isPublished: false,
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectedReason: reason.trim(),
        approvedAt: null,
        approvedBy: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối phê duyệt khóa học thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 6. Hide Approved Course (with reason)
// ────────────────────────────────────────────────────────────
export const hideCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập lý do ẩn khóa học!' });
    }

    const course = await prisma.course.findUnique({
      where: { id: Number(id) }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    if (course.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể ẩn các khóa học đã được duyệt (APPROVED)!' });
    }

    await prisma.course.update({
      where: { id: Number(id) },
      data: {
        visibility: 'HIDDEN',
        isPublished: false,
        hiddenAt: new Date(),
        hiddenBy: adminId,
        hiddenReason: reason.trim()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã ẩn khóa học thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 7. Show / Unhide Approved Course
// ────────────────────────────────────────────────────────────
export const showCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: Number(id) }
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học!' });
    }

    if (course.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể hiển thị các khóa học đã được duyệt (APPROVED)!' });
    }

    await prisma.course.update({
      where: { id: Number(id) },
      data: {
        visibility: 'VISIBLE',
        isPublished: true,
        hiddenAt: null,
        hiddenBy: null,
        hiddenReason: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã hiện lại khóa học lên giao diện học viên thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
