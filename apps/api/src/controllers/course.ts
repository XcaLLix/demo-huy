import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSubjectGroupForSubject, getSubjectsForSubjectGroup } from '../utils/subjectClassifier.js';

export async function getCourses(req: AuthRequest, res: Response) {
  const { subject, subjectGroup, price, grade, teacherId } = req.query;

  try {
    const filters: any = {};
    if (teacherId) {
      filters.teacherId = Number(teacherId);
    } else {
      filters.isApproved = true;
      filters.status = 'APPROVED';
      filters.visibility = 'VISIBLE';
    }

    if (subject) {
      filters.subject = String(subject);
    } else if (subjectGroup) {
      const subjectsForGroup = getSubjectsForSubjectGroup(String(subjectGroup));
      filters.subject = { in: subjectsForGroup };
    }
    if (price === 'free') filters.price = 0;
    else if (price === 'paid') filters.price = { gt: 0 };

    if (grade && grade !== 'All') {
      filters.grade = Number(grade);
    }

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
            videoUrl: true,
            content: true
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
        lessons: { 
          orderBy: { order: 'asc' },
          include: { documents: true }
        },
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

import { SystemSettingService } from '../services/systemSetting.service.js';

export async function createCourse(req: AuthRequest, res: Response) {
  const { title, description, subject, price, discount, thumbnailUrl, grade, level } = req.body;
  const teacherId = req.user?.id;

  if (!teacherId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  if (!SystemSettingService.getBoolean('COURSE_CREATION_ENABLED')) {
    return res.status(403).json({ success: false, error: 'Tính năng tạo khóa học mới hiện đang tạm khóa.' });
  }

  try {
    // Check if Teacher is approved
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId }
    });

    if (!teacher || teacher.status !== 'APPROVED') {
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
        grade: grade ? Number(grade) : null,
        level: level || null,
        isPublished: false,
        isApproved: false,
        status: 'PENDING',
        submittedAt: new Date(),
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

export async function updateCourse(req: AuthRequest, res: Response) {
  const courseId = Number(req.params.id);
  const { title, description, subject, price, discount, thumbnailUrl, grade, isPublished, level } = req.body;

  try {
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(subject ? { subject } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(discount !== undefined ? { discount: Number(discount) } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(grade !== undefined ? { grade: grade ? Number(grade) : null } : {}),
        ...(level !== undefined ? { level } : {})
        // Không thay đổi isApproved/status khi giáo viên update — chỉ admin mới được duyệt
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteCourse(req: AuthRequest, res: Response) {
  const courseId = Number(req.params.id);

  try {
    await prisma.course.delete({
      where: { id: courseId }
    });

    return res.status(200).json({ success: true, data: 'Đã xóa khóa học thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateLesson(req: AuthRequest, res: Response) {
  const lessonId = Number(req.params.id);
  const { title, order, videoUrl, content, duration } = req.body;

  try {
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title ? { title } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(duration !== undefined ? { duration } : {})
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteLesson(req: AuthRequest, res: Response) {
  const lessonId = Number(req.params.id);

  try {
    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    return res.status(200).json({ success: true, data: 'Đã xóa bài học thành công!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createLesson(req: AuthRequest, res: Response) {
  const { courseId, title, order, videoUrl, content, duration } = req.body;

  try {
    const newLesson = await prisma.lesson.create({
      data: {
        courseId: Number(courseId),
        title,
        order: Number(order),
        videoUrl: videoUrl || null,
        content: content || null,
        duration: duration || '15m'
      }
    });

    return res.status(201).json({ success: true, data: newLesson });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

