import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logSystemEvent } from '../utils/logger.js';
import { NotificationService } from '../services/notification.service.js';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ────────────────────────────────────────────────────────────
// 1. Get Mock Exams List for Admin
// ────────────────────────────────────────────────────────────
export const getAdminTests = async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const subject = req.query.subject ? String(req.query.subject).trim() : '';
    const status = req.query.status ? String(req.query.status).trim() : '';
    const difficulty = req.query.difficulty ? String(req.query.difficulty).trim() : '';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 10));
    const skip = (page - 1) * limit;

    const examWhere: any = {};

    // Filter search by title or creator's name
    if (search) {
      const matchingUsers = await prisma.user.findMany({
        where: { fullName: { contains: search, mode: 'insensitive' } },
        select: { id: true }
      });
      const userIds = matchingUsers.map(u => u.id);
      examWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { createdBy: { in: userIds } }
      ];
    }

    if (subject && subject !== 'all' && subject !== 'All') {
      examWhere.subject = { contains: subject, mode: 'insensitive' };
    }

    if (status && status !== 'all' && status !== 'All') {
      examWhere.status = status;
    }

    if (difficulty && difficulty !== 'all' && difficulty !== 'All') {
      examWhere.difficulty = difficulty.toUpperCase();
    }
    
    const totalFiltered = await prisma.exam.count({ where: examWhere });

    const exams = await prisma.exam.findMany({
      where: examWhere,
      orderBy: { id: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { examQuestions: true }
        }
      }
    });

    // Fetch creators
    const creatorIds = Array.from(new Set(exams.map(e => e.createdBy).filter(Boolean)));
    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, fullName: true, email: true }
    });
    const creatorMap = creators.reduce((map: any, c) => {
      map[c.id] = c;
      return map;
    }, {});

    // Fetch attempts count and avg score
    const examIds = exams.map(e => e.id);
    const attemptsStats = await prisma.testAttempt.groupBy({
      by: ['examId'],
      _count: {
        id: true
      },
      _avg: {
        score: true
      },
      where: {
        examId: { in: examIds }
      }
    });

    const statsMap = attemptsStats.reduce((map: any, stat) => {
      map[stat.examId] = {
        count: stat._count.id,
        avgScore: stat._avg.score ? Number(stat._avg.score.toFixed(2)) : 0
      };
      return map;
    }, {});

    const mappedExams = exams.map(e => {
      const stats = statsMap[e.id] || { count: 0, avgScore: 0 };
      const creator = creatorMap[e.createdBy] || { fullName: 'Giáo viên', email: '' };
      return {
        id: e.id,
        title: e.title,
        subject: e.subject,
        subjectGroup: e.subjectGroup,
        duration: e.duration,
        isPublic: e.isPublic,
        createdBy: e.createdBy,
        creatorName: creator.fullName,
        creatorEmail: creator.email,
        year: e.year,
        source: e.source,
        totalQuestions: e._count?.examQuestions ?? e.totalQuestions,
        difficulty: e.difficulty,
        status: e.status,
        grade: e.grade,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        attemptsCount: stats.count,
        avgScore: stats.avgScore,
        approvedAt: e.approvedAt ? e.approvedAt.toISOString() : null,
        approvedBy: e.approvedBy,
        rejectedAt: e.rejectedAt ? e.rejectedAt.toISOString() : null,
        rejectedBy: e.rejectedBy,
        rejectedReason: e.rejectedReason,
        hiddenAt: e.hiddenAt ? e.hiddenAt.toISOString() : null,
        hiddenBy: e.hiddenBy,
        hiddenReason: e.hiddenReason
      };
    });

    const totalAll = await prisma.exam.count();
    const totalPending = await prisma.exam.count({ where: { status: 'pending' } });
    const totalPublished = await prisma.exam.count({ where: { status: 'published' } });
    const totalHidden = await prisma.exam.count({ where: { status: 'hidden' } });

    return res.status(200).json({
      success: true,
      data: {
        exams: mappedExams,
        pagination: {
          total: totalFiltered,
          page,
          limit,
          totalPages: Math.ceil(totalFiltered / limit)
        },
        stats: {
          total: totalAll,
          pending: totalPending,
          published: totalPublished,
          hidden: totalHidden
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 2. Get Mock Exam Detail with Questions for Review
// ────────────────────────────────────────────────────────────
export const getAdminTestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) },
      include: {
        examQuestions: {
          include: {
            question: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi này!' });
    }

    // Fetch creator details
    const creator = await prisma.user.findUnique({
      where: { id: exam.createdBy },
      select: { fullName: true, email: true }
    });

    // Fetch stats
    const attempts = await prisma.testAttempt.findMany({
      where: { examId: exam.id },
      select: { score: true }
    });

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const avgScore = totalAttempts > 0 ? Number((totalScore / totalAttempts).toFixed(2)) : 0;
    const passedCount = attempts.filter(a => a.score >= 5.0).length;
    const passRate = totalAttempts > 0 ? Number(((passedCount / totalAttempts) * 100).toFixed(1)) : 0;

    // Fetch admins
    const adminIds = [exam.approvedBy, exam.rejectedBy, exam.hiddenBy].filter(Boolean) as number[];
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, fullName: true, email: true }
    });

    const adminMap = admins.reduce((map: any, admin) => {
      map[admin.id] = admin;
      return map;
    }, {});

    // Mapped questions structure
    const questions = exam.examQuestions.map(eq => {
      const q = eq.question;
      return {
        id: q.id,
        order: eq.order,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        audioUrl: q.audioUrl
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        subjectGroup: exam.subjectGroup,
        duration: exam.duration,
        isPublic: exam.isPublic,
        creatorName: creator?.fullName || 'Giáo viên',
        creatorEmail: creator?.email || '',
        year: exam.year,
        source: exam.source,
        totalQuestions: exam.totalQuestions,
        difficulty: exam.difficulty,
        status: exam.status,
        grade: exam.grade,
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
        approvedAt: exam.approvedAt ? exam.approvedAt.toISOString() : null,
        approvedBy: exam.approvedBy ? adminMap[exam.approvedBy] : null,
        rejectedAt: exam.rejectedAt ? exam.rejectedAt.toISOString() : null,
        rejectedBy: exam.rejectedBy ? adminMap[exam.rejectedBy] : null,
        rejectedReason: exam.rejectedReason,
        hiddenAt: exam.hiddenAt ? exam.hiddenAt.toISOString() : null,
        hiddenBy: exam.hiddenBy ? adminMap[exam.hiddenBy] : null,
        hiddenReason: exam.hiddenReason,
        questions,
        stats: {
          totalAttempts,
          avgScore,
          passedCount,
          passRate
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 3. Approve Mock Exam
// ────────────────────────────────────────────────────────────
export const approveTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 1;

    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });
    }

    if (exam.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể phê duyệt đề thi đang ở trạng thái Chờ duyệt!' });
    }

    await prisma.exam.update({
      where: { id: Number(id) },
      data: {
        status: 'published',
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

    // Create notification for creator
    try {
      await NotificationService.sendTemplate('EXAM_APPROVED', exam.createdBy, { examTitle: exam.title });
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send EXAM_APPROVED notification:', notifErr);
    }

    // Log admin event
    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'APPROVE_EXAM',
      module: 'EXAM_MANAGEMENT',
      userId: adminId,
      description: `Phê duyệt đề thi thử: ${exam.title} (ID: ${exam.id})`,
      metadata: { examId: exam.id, title: exam.title },
      level: 'INFO'
    });

    return res.status(200).json({
      success: true,
      message: 'Phê duyệt đề thi thử thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 4. Reject Mock Exam
// ────────────────────────────────────────────────────────────
export const rejectTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp lý do từ chối phê duyệt!' });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });
    }

    if (exam.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể từ chối đề thi đang ở trạng thái Chờ duyệt!' });
    }

    await prisma.exam.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectedReason: reason.trim(),
        approvedAt: null,
        approvedBy: null
      }
    });

    // Create notification for creator
    try {
      await NotificationService.sendTemplate('EXAM_REJECTED', exam.createdBy, { examTitle: exam.title, reason: reason.trim() });
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send EXAM_REJECTED notification:', notifErr);
    }

    // Log admin event
    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'REJECT_EXAM',
      module: 'EXAM_MANAGEMENT',
      userId: adminId,
      description: `Từ chối đề thi thử: ${exam.title} (ID: ${exam.id}). Lý do: ${reason.trim()}`,
      metadata: { examId: exam.id, title: exam.title, reason: reason.trim() },
      level: 'WARNING'
    });

    return res.status(200).json({
      success: true,
      message: 'Đã từ chối phê duyệt đề thi thử thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 5. Hide Approved Mock Exam
// ────────────────────────────────────────────────────────────
export const hideTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });
    }

    if (exam.status !== 'published') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể ẩn đề thi đang hiển thị (published)!' });
    }

    await prisma.exam.update({
      where: { id: Number(id) },
      data: {
        status: 'hidden',
        hiddenAt: new Date(),
        hiddenBy: adminId,
        hiddenReason: reason ? reason.trim() : null
      }
    });

    // Log admin event
    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'HIDE_EXAM',
      module: 'EXAM_MANAGEMENT',
      userId: adminId,
      description: `Ẩn đề thi thử: ${exam.title} (ID: ${exam.id})${reason ? `. Lý do: ${reason.trim()}` : ''}`,
      metadata: { examId: exam.id, title: exam.title, reason: reason ? reason.trim() : null },
      level: 'WARNING'
    });

    return res.status(200).json({
      success: true,
      message: 'Đã ẩn đề thi thử thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ────────────────────────────────────────────────────────────
// 6. Show / Unhide Mock Exam
// ────────────────────────────────────────────────────────────
export const showTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || 1;

    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) }
    });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });
    }

    if (exam.status !== 'hidden') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể hiển thị lại đề thi đang ở trạng thái ẩn (hidden)!' });
    }

    await prisma.exam.update({
      where: { id: Number(id) },
      data: {
        status: 'published',
        hiddenAt: null,
        hiddenBy: null,
        hiddenReason: null
      }
    });

    // Log admin event
    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'SHOW_EXAM',
      module: 'EXAM_MANAGEMENT',
      userId: adminId,
      description: `Hiển thị lại đề thi thử: ${exam.title} (ID: ${exam.id})`,
      metadata: { examId: exam.id, title: exam.title },
      level: 'INFO'
    });

    return res.status(200).json({
      success: true,
      message: 'Đã hiển thị lại đề thi thử thành công!'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
