import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { ExamManagementService } from '../services/examManagement.service.js';

// Standard error mapper helper
function handleError(res: Response, err: any) {
  const msg = err.message || 'Internal Server Error';
  if (msg.startsWith('NOT_FOUND:')) {
    return res.status(404).json({ success: false, errorCode: 'NOT_FOUND', error: msg.replace('NOT_FOUND: ', '') });
  }
  if (msg.startsWith('FORBIDDEN:')) {
    return res.status(403).json({ success: false, errorCode: 'FORBIDDEN_OWNER', error: msg.replace('FORBIDDEN: ', '') });
  }
  if (msg.startsWith('VALIDATION_ERROR:')) {
    return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', error: msg.replace('VALIDATION_ERROR: ', '') });
  }
  return res.status(500).json({ success: false, errorCode: 'SERVER_ERROR', error: msg });
}

// --- EXAM CONTROLLERS ---
export async function getExams(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { search, subject, status, page, limit } = req.query;
  try {
    const filters = {
      search: search ? String(search) : undefined,
      subject: subject ? String(subject) : undefined,
      status: status ? String(status) : undefined
    };
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;

    const result = await ExamManagementService.getExams(userId, filters, p, l);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function getExamById(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const exam = await ExamManagementService.getExamById(Number(id), userId);
    return res.status(200).json({ success: true, data: exam });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function createExam(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const exam = await ExamManagementService.createExam(userId, req.body);
    return res.status(201).json({ success: true, message: 'Đề thi đã được khởi tạo thành công dưới dạng Bản nháp', data: exam });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function updateExam(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const updated = await ExamManagementService.updateExam(Number(id), userId, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật đề thi thành công', data: updated });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function cloneExam(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const cloned = await ExamManagementService.cloneExam(Number(id), userId);
    return res.status(201).json({ success: true, message: 'Nhân bản đề thi thành công', data: cloned });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function deleteExam(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    await ExamManagementService.deleteExam(Number(id), userId);
    return res.status(200).json({ success: true, message: 'Đã xóa đề thi nháp thành công' });
  } catch (err: any) {
    return handleError(res, err);
  }
}

// --- QUESTION CONTROLLERS ---
export async function getQuestions(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const { search, subject, topic, difficulty, ownerOnly, page, limit } = req.query;
  try {
    const filters: any = {
      search: search ? String(search) : undefined,
      subject: subject ? String(subject) : undefined,
      topic: topic ? String(topic) : undefined,
      difficulty: difficulty ? String(difficulty) : undefined
    };
    if (ownerOnly === 'true') {
      filters.createdBy = userId;
    }

    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 10;

    const result = await ExamManagementService.getQuestions(filters, p, l);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function createQuestion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const question = await ExamManagementService.createQuestion(userId, req.body);
    return res.status(201).json({ success: true, data: question });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function getQuestionById(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const question = await ExamManagementService.getQuestionById(Number(id));
    return res.status(200).json({ success: true, data: question });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function updateQuestion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const updated = await ExamManagementService.updateQuestion(Number(id), userId, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật câu hỏi thành công', data: updated });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function reportQuestion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { reason } = req.body;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    if (!reason) throw new Error('VALIDATION_ERROR: Thiếu lý do báo cáo lỗi');
    const report = await ExamManagementService.reportQuestion(Number(id), userId, reason);
    return res.status(201).json({ success: true, message: 'Báo cáo lỗi câu hỏi đã được gửi đi', data: report });
  } catch (err: any) {
    return handleError(res, err);
  }
}

// --- IMPORT CONTROLLERS ---
export async function uploadDocument(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'Vui lòng đính kèm tệp tài liệu để upload!' });

  try {
    const session = await ExamManagementService.createImportSession(userId, file.originalname, file.size, file.path);
    return res.status(202).json({
      success: true,
      message: 'File đang được phân tích bởi AI',
      data: session
    });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function updateImportQuestion(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const updated = await ExamManagementService.updateImportQuestion(Number(id), userId, req.body);
    return res.status(200).json({ success: true, message: 'Cập nhật câu hỏi import thành công', data: updated });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function getImportSessions(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const sessions = await ExamManagementService.getImportSessions(userId);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function getImportSessionById(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const session = await ExamManagementService.getImportSessionById(Number(id), userId);
    return res.status(200).json({ success: true, data: session });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function confirmImport(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { decisions } = req.body;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const result = await ExamManagementService.confirmImport(Number(id), userId, decisions);
    return res.status(200).json(result);
  } catch (err: any) {
    return handleError(res, err);
  }
}

// --- REPORT MODERATION CONTROLLERS ---
export async function getReports(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const reports = await ExamManagementService.getReportsForOwner(userId);
    return res.status(200).json({ success: true, data: reports });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function resolveReport(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { status, explanation } = req.body;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    if (!status) throw new Error('VALIDATION_ERROR: Thiếu trạng thái cập nhật báo cáo');
    const result = await ExamManagementService.resolveReport(Number(id), userId, status, explanation);
    return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái báo cáo', data: result });
  } catch (err: any) {
    return handleError(res, err);
  }
}

// --- STATS CONTROLLERS ---
export async function getStats(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const stats = await ExamManagementService.getTeacherStats(userId);
    return res.status(200).json({ success: true, ...stats });
  } catch (err: any) {
    return handleError(res, err);
  }
}

export async function deleteImportSession(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    await ExamManagementService.deleteImportSession(Number(id), userId);
    return res.status(200).json({ success: true, message: 'Đã từ chối và xóa phiên nhập đề cùng toàn bộ tệp liên quan thành công!' });
  } catch (err: any) {
    return handleError(res, err);
  }
}
