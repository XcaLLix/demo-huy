import type { Request, Response, NextFunction } from 'express';

export function validateCreateExam(req: Request, res: Response, next: NextFunction) {
  const { title, subject, duration, grade, creationMethod, questionIds, aiConfig } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Tiêu đề đề thi bắt buộc và phải có ít nhất 5 ký tự!' });
  }
  if (!subject || typeof subject !== 'string') {
    return res.status(400).json({ success: false, error: 'Môn học bắt buộc!' });
  }
  if (!duration || typeof duration !== 'number' || duration <= 0) {
    return res.status(400).json({ success: false, error: 'Thời lượng thi bắt buộc và phải là số dương!' });
  }
  if (grade === undefined || typeof grade !== 'number') {
    return res.status(400).json({ success: false, error: 'Khối lớp học bắt buộc!' });
  }
  if (!creationMethod || !['MANUAL', 'AI'].includes(creationMethod)) {
    return res.status(400).json({ success: false, error: 'Phương thức tạo đề thi (creationMethod) phải là MANUAL hoặc AI!' });
  }

  if (creationMethod === 'MANUAL' && (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0)) {
    return res.status(400).json({ success: false, error: 'Vui lòng chọn ít nhất 1 câu hỏi cho đề thi tạo thủ công!' });
  }

  if (creationMethod === 'AI' && (!aiConfig || typeof aiConfig !== 'object')) {
    return res.status(400).json({ success: false, error: 'Thiếu thông số AI cấu hình tự động chọn câu hỏi!' });
  }

  next();
}

export function validateCreateQuestion(req: Request, res: Response, next: NextFunction) {
  const { content, options, correctAnswer, subject, topic, difficulty } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Nội dung câu hỏi bắt buộc!' });
  }
  if (!options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ success: false, error: 'Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án lựa chọn!' });
  }
  if (!correctAnswer || typeof correctAnswer !== 'string') {
    return res.status(400).json({ success: false, error: 'Đáp án đúng bắt buộc!' });
  }
  if (!subject || typeof subject !== 'string') {
    return res.status(400).json({ success: false, error: 'Môn học bắt buộc!' });
  }
  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ success: false, error: 'Chuyên đề bắt buộc!' });
  }
  if (difficulty && !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    return res.status(400).json({ success: false, error: 'Mức độ khó không hợp lệ!' });
  }

  next();
}

export function validateUpdateExam(req: Request, res: Response, next: NextFunction) {
  const { title, subject, duration, grade, questionIds } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 5)) {
    return res.status(400).json({ success: false, error: 'Tiêu đề đề thi phải có ít nhất 5 ký tự!' });
  }
  if (subject !== undefined && typeof subject !== 'string') {
    return res.status(400).json({ success: false, error: 'Môn học không hợp lệ!' });
  }
  if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
    return res.status(400).json({ success: false, error: 'Thời lượng thi phải là số dương!' });
  }
  if (grade !== undefined && typeof grade !== 'number') {
    return res.status(400).json({ success: false, error: 'Khối lớp không hợp lệ!' });
  }
  if (questionIds !== undefined && (!Array.isArray(questionIds) || questionIds.length === 0)) {
    return res.status(400).json({ success: false, error: 'Vui lòng chọn ít nhất 1 câu hỏi cho đề thi!' });
  }

  next();
}
