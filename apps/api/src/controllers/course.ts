import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSubjectGroupForSubject, getSubjectsForSubjectGroup } from '../utils/subjectClassifier.js';

export async function getCourses(req: AuthRequest, res: Response) {
  const { subject, subjectGroup, price } = req.query;

  try {
    const filters: any = { isApproved: true };
    if (subject) {
      filters.subject = String(subject);
    } else if (subjectGroup) {
      const subjectsForGroup = getSubjectsForSubjectGroup(String(subjectGroup));
      filters.subject = { in: subjectsForGroup };
    }
    if (price === 'free') filters.price = 0;
    else if (price === 'paid') filters.price = { gt: 0 };

    const list = await prisma.course.findMany({
      where: filters,
      include: {
        teacher: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } }
          }
        },
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            videoUrl: true
          }
        },
        reviews: true,
        enrollments: true
      }
    });

    const mappedList = list.map(c => ({
      ...c,
      subjectGroup: getSubjectGroupForSubject(c.subject)
    }));

    return res.status(200).json({ success: true, data: mappedList });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCourseById(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const courseObj = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        teacher: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
        reviews: { include: { student: { include: { user: { select: { fullName: true } } } } } },
        enrollments: true
      }
    });

    if (!courseObj) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khóa học này!' });
    }

    const mappedCourse = {
      ...courseObj,
      subjectGroup: getSubjectGroupForSubject(courseObj.subject)
    };

    return res.status(200).json({ success: true, data: mappedCourse });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCourse(req: AuthRequest, res: Response) {
  const { title, description, subject, price, discount, thumbnailUrl } = req.body;
  const teacherId = req.user?.id;

  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    // Check if TeacherProfile is approved
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId }
    });

    if (!profile || profile.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: 'Hồ sơ Giáo viên của bạn chưa được duyệt! Bạn chỉ có thể tạo khóa học sau khi được Admin phê duyệt.'
      });
    }

    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        subject,
        price: Number(price),
        discount: discount !== undefined ? Number(discount) : 0,
        thumbnailUrl,
        isPublished: false,
        isApproved: false, // Pending Admin review approval!
        teacherId
      }
    });

    return res.status(201).json({ success: true, data: newCourse });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCourseStats(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const enrollmentsCount = await prisma.enrollment.count({
      where: { courseId: Number(id) }
    });

    const reviewsAvg = await prisma.review.aggregate({
      where: { courseId: Number(id) },
      _avg: { rating: true }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalEnrollments: enrollmentsCount,
        averageRating: reviewsAvg._avg.rating || 5.0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
