import type { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logSystemEvent } from '../utils/logger.js';

// GET /api/admin/reports/statistics
export async function getAdminReportStatistics(req: AuthRequest, res: Response) {
  try {
    const totalReports = await prisma.report.count();
    const pendingReports = await prisma.report.count({ where: { status: 'PENDING' } });
    const approvedReports = await prisma.report.count({ where: { status: 'APPROVED' } });
    const closedReports = await prisma.report.count({ where: { status: 'CLOSED' } });
    
    // Count distinct warned users
    const warnedUsersGroup = await prisma.warning.groupBy({
      by: ['userId'],
    });
    const warnedUsers = warnedUsersGroup.length;

    return res.status(200).json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        approvedReports,
        closedReports,
        warnedUsers
      }
    });
  } catch (err: any) {
    console.error('[Moderation Stats Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/admin/reports
export async function getAdminReports(req: AuthRequest, res: Response) {
  try {
    const status = req.query.status ? String(req.query.status).toUpperCase() : 'ALL';
    const targetType = req.query.targetType ? String(req.query.targetType).toUpperCase() : 'ALL';
    const search = req.query.search ? String(req.query.search).trim() : '';

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }
    if (targetType !== 'ALL') {
      where.targetType = targetType;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Resolve polymorphic targets in parallel to optimize latency
    const resolvedReports = await Promise.all(
      reports.map(async (report) => {
        let targetName = 'Không tìm thấy nội dung';
        let targetCreator = 'Hệ thống';
        let targetCreatorId = null;
        let targetCreatorEmail = '';
        let targetInfo: any = null;

        if (report.targetType === 'COURSE') {
          const course = await prisma.course.findUnique({
            where: { id: report.targetId },
            include: {
              teacher: {
                include: {
                  user: {
                    select: { id: true, fullName: true, email: true }
                  }
                }
              }
            }
          });
          if (course) {
            targetName = course.title;
            targetCreator = course.teacher.user.fullName;
            targetCreatorId = course.teacher.user.id;
            targetCreatorEmail = course.teacher.user.email;
            targetInfo = {
              id: course.id,
              title: course.title,
              description: course.description,
              subject: course.subject,
              price: course.price,
              isPublished: course.isPublished,
              isApproved: course.isApproved,
              status: course.status,
              visibility: course.visibility
            };
          }
        } else if (report.targetType === 'COMMENT') {
          // Try ForumComment first
          const forumComment = await prisma.forumComment.findUnique({
            where: { id: report.targetId },
            include: {
              author: {
                select: { id: true, fullName: true, email: true }
              }
            }
          });
          if (forumComment) {
            targetName = forumComment.content;
            targetCreator = forumComment.author.fullName;
            targetCreatorId = forumComment.author.id;
            targetCreatorEmail = forumComment.author.email;
            targetInfo = {
              id: forumComment.id,
              content: forumComment.content,
              createdAt: forumComment.createdAt,
              type: 'FORUM'
            };
          } else {
            // Try DocumentComment
            const docComment = await prisma.documentComment.findUnique({
              where: { id: report.targetId },
              include: {
                user: {
                  select: { id: true, fullName: true, email: true }
                }
              }
            });
            if (docComment) {
              targetName = docComment.content;
              targetCreator = docComment.user.fullName;
              targetCreatorId = docComment.user.id;
              targetCreatorEmail = docComment.user.email;
              targetInfo = {
                id: docComment.id,
                content: docComment.content,
                createdAt: docComment.createdAt,
                type: 'DOCUMENT'
              };
            }
          }
        }

        return {
          ...report,
          targetName,
          targetCreator,
          targetCreatorId,
          targetCreatorEmail,
          targetInfo
        };
      })
    );

    // Filter in memory for search
    let filteredReports = resolvedReports;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = resolvedReports.filter(r => {
        const matchesId = String(r.id) === search;
        const matchesReporter = r.reporter?.fullName?.toLowerCase().includes(searchLower) || r.reporter?.email?.toLowerCase().includes(searchLower);
        const matchesReason = r.reason?.toLowerCase().includes(searchLower) || r.description?.toLowerCase().includes(searchLower);
        const matchesTargetName = r.targetName?.toLowerCase().includes(searchLower);
        const matchesTargetCreator = r.targetCreator?.toLowerCase().includes(searchLower) || r.targetCreatorEmail?.toLowerCase().includes(searchLower);
        return matchesId || matchesReporter || matchesReason || matchesTargetName || matchesTargetCreator;
      });
    }

    return res.status(200).json({ success: true, data: filteredReports });
  } catch (err: any) {
    console.error('[Get Admin Reports Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/admin/reports/:id
export async function getAdminReportById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: {
        reporter: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy báo cáo vi phạm!' });
    }

    let targetName = 'Không tìm thấy nội dung';
    let targetCreator = 'Hệ thống';
    let targetCreatorId = null;
    let targetCreatorEmail = '';
    let targetInfo: any = null;

    if (report.targetType === 'COURSE') {
      const course = await prisma.course.findUnique({
        where: { id: report.targetId },
        include: {
          teacher: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true }
              }
            }
          }
        }
      });
      if (course) {
        targetName = course.title;
        targetCreator = course.teacher.user.fullName;
        targetCreatorId = course.teacher.user.id;
        targetCreatorEmail = course.teacher.user.email;
        targetInfo = {
          id: course.id,
          title: course.title,
          description: course.description,
          subject: course.subject,
          price: course.price,
          isPublished: course.isPublished,
          isApproved: course.isApproved,
          status: course.status,
          visibility: course.visibility
        };
      }
    } else if (report.targetType === 'COMMENT') {
      const forumComment = await prisma.forumComment.findUnique({
        where: { id: report.targetId },
        include: {
          author: {
            select: { id: true, fullName: true, email: true }
          }
        }
      });
      if (forumComment) {
        targetName = forumComment.content;
        targetCreator = forumComment.author.fullName;
        targetCreatorId = forumComment.author.id;
        targetCreatorEmail = forumComment.author.email;
        targetInfo = {
          id: forumComment.id,
          content: forumComment.content,
          createdAt: forumComment.createdAt,
          type: 'FORUM'
        };
      } else {
        const docComment = await prisma.documentComment.findUnique({
          where: { id: report.targetId },
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        });
        if (docComment) {
          targetName = docComment.content;
          targetCreator = docComment.user.fullName;
          targetCreatorId = docComment.user.id;
          targetCreatorEmail = docComment.user.email;
          targetInfo = {
            id: docComment.id,
            content: docComment.content,
            createdAt: docComment.createdAt,
            type: 'DOCUMENT'
          };
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...report,
        targetName,
        targetCreator,
        targetCreatorId,
        targetCreatorEmail,
        targetInfo
      }
    });
  } catch (err: any) {
    console.error('[Get Admin Report Detail Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/admin/reports/:id/approve
export async function approveAdminReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) }
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy báo cáo vi phạm!' });
    }

    const updated = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    });

    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'APPROVE_REPORT',
      module: 'MODERATION',
      userId: adminId,
      description: `Duyệt báo cáo vi phạm #${report.id} (${report.targetType} ID: ${report.targetId})`,
      metadata: { reportId: report.id, targetType: report.targetType, targetId: report.targetId },
      level: 'INFO'
    });

    return res.status(200).json({
      success: true,
      message: 'Duyệt báo cáo thành công',
      data: updated
    });
  } catch (err: any) {
    console.error('[Approve Report Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/admin/reports/:id/reject
export async function rejectAdminReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Lý do từ chối là bắt buộc!' });
    }

    const report = await prisma.report.findUnique({
      where: { id: Number(id) }
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy báo cáo vi phạm!' });
    }

    const updated = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status: 'REJECTED',
        resolutionNote: reason.trim(),
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    });

    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'REJECT_REPORT',
      module: 'MODERATION',
      userId: adminId,
      description: `Từ chối báo cáo vi phạm #${report.id}. Lý do: ${reason.trim()}`,
      metadata: { reportId: report.id, reason: reason.trim() },
      level: 'INFO'
    });

    return res.status(200).json({
      success: true,
      message: 'Từ chối báo cáo thành công',
      data: updated
    });
  } catch (err: any) {
    console.error('[Reject Report Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/admin/reports/:id/close
export async function closeAdminReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user?.id;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) }
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy báo cáo vi phạm!' });
    }

    const updated = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status: 'CLOSED',
        resolutionNote: notes ? notes.trim() : 'Đóng báo cáo xử lý xong.',
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    });

    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'CLOSE_REPORT',
      module: 'MODERATION',
      userId: adminId,
      description: `Đóng báo cáo vi phạm #${report.id}. Ghi chú: ${notes ? notes.trim() : 'Đóng báo cáo xử lý xong.'}`,
      metadata: { reportId: report.id, notes },
      level: 'INFO'
    });

    return res.status(200).json({
      success: true,
      message: 'Đóng báo cáo thành công',
      data: updated
    });
  } catch (err: any) {
    console.error('[Close Report Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/admin/reports/:id/warning
export async function createAdminReportWarning(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung cảnh báo không được để trống!' });
    }

    const report = await prisma.report.findUnique({
      where: { id: Number(id) }
    });
    if (!report) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy báo cáo vi phạm!' });
    }

    // Determine target user to warn
    let targetUserId = null;

    if (report.targetType === 'COURSE') {
      const course = await prisma.course.findUnique({
        where: { id: report.targetId },
        select: { teacherId: true }
      });
      if (course) {
        targetUserId = course.teacherId;
      }
    } else if (report.targetType === 'COMMENT') {
      const forumComment = await prisma.forumComment.findUnique({
        where: { id: report.targetId },
        select: { authorId: true }
      });
      if (forumComment) {
        targetUserId = forumComment.authorId;
      } else {
        const docComment = await prisma.documentComment.findUnique({
          where: { id: report.targetId },
          select: { userId: true }
        });
        if (docComment) {
          targetUserId = docComment.userId;
        }
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'Không thể xác định người dùng vi phạm của nội dung này!' });
    }

    // Save Warning record
    const warning = await prisma.warning.create({
      data: {
        userId: targetUserId,
        reportId: report.id,
        message: message.trim()
      }
    });

    // Send Notification to user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: 'Cảnh báo từ Quản trị viên ⚠️',
        message: `Tài khoản của bạn nhận được cảnh báo: "${message.trim()}" liên quan đến nội dung bị báo cáo #${report.id}.`
      }
    });

    const adminId = req.user?.id;
    await logSystemEvent(req as any, {
      type: 'ADMIN',
      action: 'SEND_WARNING',
      module: 'MODERATION',
      userId: adminId,
      description: `Gửi cảnh báo tới người dùng ID: ${targetUserId} liên quan đến báo cáo #${report.id}. Nội dung: ${message.trim()}`,
      metadata: { reportId: report.id, targetUserId, message: message.trim() },
      level: 'WARNING'
    });

    return res.status(201).json({
      success: true,
      message: 'Gửi cảnh báo và thông báo hệ thống thành công',
      data: warning
    });
  } catch (err: any) {
    console.error('[Create Report Warning Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
