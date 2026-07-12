import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { Difficulty } from '@prisma/client';
import { importExamFromObject } from '../utils/examImporter.js';
import { logUserActivity, logAttendanceInternal } from './gamification.js';
import { incrementBothStats } from '../lib/monthlyStats.js';
import { LeaderboardService } from '../services/leaderboard.service.js';


export async function getExams(req: AuthRequest, res: Response) {
  const { subject, year, source, difficulty, grade, status, teacherId } = req.query;
  const userRole = req.user?.role;

  try {
    const where: any = {};
    if (subject && subject !== 'All') where.subject = String(subject);
    if (year && year !== 'All') where.year = Number(year);
    if (source && source !== 'All') where.source = String(source);
    if (difficulty && difficulty !== 'All') where.difficulty = difficulty as Difficulty;

    if (grade && grade !== 'All') {
      where.grade = Number(grade);
    }

    if (teacherId) {
      where.createdBy = Number(teacherId);
    }

    if (userRole === 'STUDENT' || !userRole) {
      where.status = 'published';
    } else if (status && status !== 'All') {
      where.status = String(status);
    }

    const list = await prisma.exam.findMany({
      where,
      include: { examQuestions: { select: { questionId: true } } },
      orderBy: [{ year: 'desc' }, { title: 'asc' }]
    });

    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getExamById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) },
      include: {
        examQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!exam) return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });

    const reqAuth = req as AuthRequest;
    const userRole = reqAuth.user?.role;
    const userId = reqAuth.user?.id;
    if (exam.status !== 'published') {
      if (userRole === 'STUDENT' || !userRole || (userRole === 'TEACHER' && exam.createdBy !== userId)) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập đề thi này!' });
      }
    }

    const questions = exam.examQuestions.map(eq => {
      const q = eq.question;
      return {
        id: q.id,
        content: q.content,
        options: q.options,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        question_number: eq.order
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
        year: exam.year,
        source: exam.source,
        totalQuestions: exam.totalQuestions,
        difficulty: exam.difficulty,
        status: exam.status,
        questions
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function startAttempt(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { retakeMode, questionIds } = req.body;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.create({
      data: {
        studentId,
        examId: Number(id),
        score: 0.0,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        aiFeedback: retakeMode ? { retakeMode, questionIds: questionIds || [] } : undefined
      }
    });

    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: Number(id) },
      include: { question: true },
      orderBy: { order: 'asc' }
    });

    const questions = examQuestions.map(eq => {
      const q = eq.question;
      return {
        id: q.id,
        content: q.content,
        options: q.options,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        question_number: eq.order
      };
    });

    return res.status(201).json({ success: true, data: { attempt, questions } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function saveAnswer(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const { questionId, selectedAnswer } = req.body;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findUnique({ where: { id: Number(attemptId) } });

    if (!attempt) return res.status(404).json({ success: false, error: 'Không tìm thấy lượt thi!' });
    if (attempt.studentId !== studentId) return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ success: false, error: 'Lượt thi đã được nộp!' });

    const question = await prisma.question.findUnique({ where: { id: Number(questionId) } });
    if (!question) return res.status(404).json({ success: false, error: 'Không tìm thấy câu hỏi!' });

    const isCorrect = selectedAnswer === question.correctAnswer;

    const attemptAnswer = await prisma.testAttemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId: Number(attemptId), questionId: Number(questionId) } },
      update: { selectedAnswer, isCorrect },
      create: { attemptId: Number(attemptId), questionId: Number(questionId), selectedAnswer, isCorrect }
    });

    return res.status(200).json({ success: true, data: attemptAnswer });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitAttempt(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const { answers } = req.body;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: Number(attemptId) },
      include: { exam: true }
    });

    if (!attempt) return res.status(404).json({ success: false, error: 'Không tìm thấy lượt thi!' });
    if (attempt.studentId !== studentId) return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
    if (attempt.status !== 'IN_PROGRESS') return res.status(400).json({ success: false, error: 'Lượt thi đã được nộp trước đó!' });

    if (Array.isArray(answers) && answers.length > 0) {
      for (const ans of answers) {
        const q = await prisma.question.findUnique({ where: { id: Number(ans.questionId) } });
        if (q) {
          const isCorrect = ans.selectedAnswer === q.correctAnswer;
          await prisma.testAttemptAnswer.upsert({
            where: { attemptId_questionId: { attemptId: Number(attemptId), questionId: Number(ans.questionId) } },
            update: { selectedAnswer: ans.selectedAnswer, isCorrect },
            create: { attemptId: Number(attemptId), questionId: Number(ans.questionId), selectedAnswer: ans.selectedAnswer, isCorrect }
          });
        }
      }
    }

    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: attempt.examId },
      include: { question: true }
    });

    const savedAnswers = await prisma.testAttemptAnswer.findMany({
      where: { attemptId: Number(attemptId) }
    });

    // Check if attempt is a smart retake
    const feedbackData = (attempt.aiFeedback as any) || {};
    const isRetake = !!feedbackData.retakeMode;
    const retakeQuestionIds: number[] = Array.isArray(feedbackData.questionIds)
      ? feedbackData.questionIds.map(Number)
      : [];

    const filteredExamQuestions = isRetake
      ? examQuestions.filter(eq => retakeQuestionIds.includes(eq.questionId))
      : examQuestions;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const topicStats: Record<string, { total: number; correct: number; accuracy: number }> = {};
    const difficultyStats: Record<string, { total: number; correct: number; accuracy: number }> = {
      EASY: { total: 0, correct: 0, accuracy: 0 },
      MEDIUM: { total: 0, correct: 0, accuracy: 0 },
      HARD: { total: 0, correct: 0, accuracy: 0 }
    };

    filteredExamQuestions.forEach((eq) => {
      const q = eq.question;
      const userAns = savedAnswers.find(a => a.questionId === q.id);
      const selected = userAns ? userAns.selectedAnswer : '';

      const topic = q.topic || 'Kiến thức cốt lõi';
      if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0, accuracy: 0 };
      topicStats[topic].total++;

      const diff = (q.difficulty as string) || 'MEDIUM';
      if (!difficultyStats[diff]) difficultyStats[diff] = { total: 0, correct: 0, accuracy: 0 };
      difficultyStats[diff].total++;

      let isCorrect = false;
      if (!selected) {
        skippedCount++;
      } else {
        isCorrect = selected === q.correctAnswer;
        if (isCorrect) {
          correctCount++;
          topicStats[topic].correct++;
          difficultyStats[diff].correct++;
        } else {
          wrongCount++;
        }
      }
    });

    // Compute per-topic and per-difficulty accuracy
    Object.keys(topicStats).forEach(t => {
      topicStats[t].accuracy = topicStats[t].total > 0 ? topicStats[t].correct / topicStats[t].total : 0;
    });
    Object.keys(difficultyStats).forEach(d => {
      difficultyStats[d].accuracy = difficultyStats[d].total > 0 ? difficultyStats[d].correct / difficultyStats[d].total : 0;
    });

    const totalQuestions = filteredExamQuestions.length || 1;
    const score = (correctCount / totalQuestions) * 10;
    const durationUsed = Math.max(0, Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000));

    // Compute exam trust score from violation counters
    const examTrustScore = Math.max(0, 100
      - (attempt.tabSwitchCount * 15)
      - (attempt.copyPasteCount * 10)
      - (attempt.fullscreenExitCount * 8)
    );

    const weakTopics = Object.keys(topicStats).filter(t => topicStats[t].accuracy < 0.6);
    const strongTopics = Object.keys(topicStats).filter(t => topicStats[t].accuracy >= 0.8);

    let advice = 'Bạn nên ôn luyện lại các câu hỏi đã làm sai để củng cố lý thuyết.';
    if (weakTopics.length > 0) {
      advice = `Bạn làm tốt phần ${strongTopics.join(', ') || 'kiến thức cơ bản'} nhưng còn yếu phần ${weakTopics.join(', ')}. Hãy làm thêm 20-30 bài tập tự luyện và đọc kỹ đáp án chi tiết của các chủ đề này.`;
    } else if (score >= 8) {
      advice = 'Kết quả rất xuất sắc! Bạn đã nắm vững toàn bộ kiến thức của đề thi này. Hãy thử thách với các đề có độ khó cao hơn.';
    }

    const aiFeedback = {
      assessment: `Bạn đạt ${score.toFixed(2)}/10 điểm trong lần thi này.`,
      knowledgeGaps: weakTopics,
      strongAreas: strongTopics,
      advice: [advice],
      encouragement: 'Hãy cố gắng ôn luyện đều đặn để bứt phá điểm số cao nhất trong kỳ thi chính thức!',
      retakeMode: feedbackData.retakeMode || null,
      questionIds: feedbackData.questionIds || []
    };

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: Number(attemptId) },
      data: {
        score,
        submittedAt: new Date(),
        durationUsed,
        correctCount,
        wrongCount,
        skippedCount,
        examTrustScore,
        topicStats,
        difficultyStats,
        status: 'SUBMITTED',
        aiFeedback
      },
      include: { attemptAnswers: true }
    });

    // Log daily user activity and calculate streaks
    try {
      const subject = attempt.exam?.subject || 'Chung';
      const studyMinutes = Math.max(1, Math.round(durationUsed / 60));
      await logUserActivity(studentId, 'exam', subject, 100, studyMinutes);
      await logAttendanceInternal(studentId, 'TEST');
    } catch (err) {
      console.error('[submitAttempt Activity Log Error]', err);
    }

    // Cập nhật thống kê hàng tháng
    try {
      const now = new Date();
      await incrementBothStats('totalAttempts', now);
    } catch (err) {
      console.error('[MonthlyStats] Lỗi cập nhật totalAttempts:', err);
    }

    // Invalidate leaderboard cache for score updates
    try {
      LeaderboardService.invalidateCache();
    } catch (cacheErr: any) {
      console.error('[submitAttempt Cache Invalidation Error]', cacheErr.message);
    }

    return res.status(200).json({ success: true, data: updatedAttempt });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAttempts(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const list = await prisma.testAttempt.findMany({
      where: { studentId },
      include: {
        exam: { select: { title: true, subject: true, duration: true } }
      },
      orderBy: { startedAt: 'desc' }
    });

    const modeLabel: Record<string, string> = {
      wrong_only: 'Làm lại câu sai',
      weak_topic: 'Luyện chủ đề yếu',
      bookmarked: 'Làm lại câu đánh dấu',
      full: 'Thi lại full đề'
    };

    const mappedList = list.map(a => {
      const fb = (a.aiFeedback as any) || {};
      if (fb.retakeMode && a.exam) {
        const suffix = modeLabel[fb.retakeMode] || 'Ôn luyện';
        return {
          ...a,
          exam: {
            ...a.exam,
            title: `${a.exam.title} — ${suffix}`
          }
        };
      }
      return a;
    });

    return res.status(200).json({ success: true, data: mappedList });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getExamQuestionsPublic(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const exam = await prisma.exam.findUnique({ where: { id: Number(id) } });
    if (!exam) return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });

    const reqAuth = req as AuthRequest;
    const userRole = reqAuth.user?.role;
    const userId = reqAuth.user?.id;
    if (exam.status !== 'published') {
      if (userRole === 'STUDENT' || !userRole || (userRole === 'TEACHER' && exam.createdBy !== userId)) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập câu hỏi của đề thi này!' });
      }
    }

    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: Number(id) },
      include: { question: true },
      orderBy: { order: 'asc' }
    });

    const questions = examQuestions.map(eq => {
      const q = eq.question;
      return {
        id: q.id,
        content: q.content,
        options: q.options,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        question_number: eq.order
      };
    });

    return res.status(200).json({ success: true, data: questions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAttemptById(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: Number(attemptId), studentId },
      include: {
        attemptAnswers: { include: { question: true } },
        exam: {
          include: {
            examQuestions: {
              include: { question: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) return res.status(404).json({ success: false, error: 'Không tìm thấy lượt thi!' });

    const fb = (attempt.aiFeedback as any) || {};
    const modeLabel: Record<string, string> = {
      wrong_only: 'Làm lại câu sai',
      weak_topic: 'Luyện chủ đề yếu',
      bookmarked: 'Làm lại câu đánh dấu',
      full: 'Thi lại full đề'
    };

    if (fb.retakeMode && attempt.exam) {
      const suffix = modeLabel[fb.retakeMode] || 'Ôn luyện';
      (attempt.exam as any).title = `${attempt.exam.title} — ${suffix}`;
    }

    return res.status(200).json({ success: true, data: attempt });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAttemptResult(req: AuthRequest, res: Response) {
  return getAttemptById(req, res);
}

export async function getExamHistory(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const history = await prisma.testAttempt.findMany({
      where: { studentId, status: 'SUBMITTED' },
      include: {
        exam: {
          select: { title: true, subject: true, duration: true, year: true, source: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const modeLabel: Record<string, string> = {
      wrong_only: 'Làm lại câu sai',
      weak_topic: 'Luyện chủ đề yếu',
      bookmarked: 'Làm lại câu đánh dấu',
      full: 'Thi lại full đề'
    };

    const mappedHistory = history.map(h => {
      const fb = (h.aiFeedback as any) || {};
      if (fb.retakeMode && h.exam) {
        const suffix = modeLabel[fb.retakeMode] || 'Ôn luyện';
        return {
          ...h,
          exam: {
            ...h.exam,
            title: `${h.exam.title} — ${suffix}`
          }
        };
      }
      return h;
    });

    return res.status(200).json({ success: true, data: mappedHistory });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordViolation(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findUnique({ where: { id: Number(attemptId) } });
    if (!attempt) return res.status(404).json({ success: false, error: 'Không tìm thấy lượt thi!' });
    if (attempt.studentId !== studentId) return res.status(403).json({ success: false, error: 'Không có quyền!' });

    const updated = await prisma.testAttempt.update({
      where: { id: Number(attemptId) },
      data: { tabSwitchCount: { increment: 1 } }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── NEW: Record detailed exam event for replay ──
export async function recordExamEvent(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const { eventType, questionId, payload } = req.body;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findUnique({ where: { id: Number(attemptId) } });
    if (!attempt || attempt.studentId !== studentId) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
    }

    const event = await prisma.examEvent.create({
      data: {
        attemptId: Number(attemptId),
        eventType: String(eventType),
        questionId: questionId ? Number(questionId) : null,
        payload: payload || null
      }
    });

    return res.status(201).json({ success: true, data: event });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── NEW: Get exam replay events ──
export async function getExamEvents(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findUnique({ where: { id: Number(attemptId) } });
    if (!attempt || attempt.studentId !== studentId) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập!' });
    }

    const events = await prisma.examEvent.findMany({
      where: { attemptId: Number(attemptId) },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json({ success: true, data: events });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── NEW: Record specific violation type + recalculate trust score ──
export async function recordViolationDetail(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const { violationType } = req.body; // 'TAB_SWITCH' | 'COPY_PASTE' | 'FULLSCREEN_EXIT'
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.findUnique({ where: { id: Number(attemptId) } });
    if (!attempt || attempt.studentId !== studentId) {
      return res.status(403).json({ success: false, error: 'Không có quyền!' });
    }

    const updateData: any = {};
    if (violationType === 'TAB_SWITCH') {
      updateData.tabSwitchCount = { increment: 1 };
    } else if (violationType === 'COPY_PASTE') {
      updateData.copyPasteCount = { increment: 1 };
    } else if (violationType === 'FULLSCREEN_EXIT') {
      updateData.fullscreenExitCount = { increment: 1 };
    }

    await prisma.examEvent.create({
      data: {
        attemptId: Number(attemptId),
        eventType: violationType,
        payload: { timestamp: new Date().toISOString() }
      }
    });

    const updated = await prisma.testAttempt.update({
      where: { id: Number(attemptId) },
      data: updateData
    });

    const trustScore = Math.max(0, 100
      - (updated.tabSwitchCount * 15)
      - (updated.copyPasteCount * 10)
      - (updated.fullscreenExitCount * 8)
    );

    const withTrust = await prisma.testAttempt.update({
      where: { id: Number(attemptId) },
      data: { examTrustScore: trustScore }
    });

    const autoSubmit =
      updated.tabSwitchCount >= 3 ||
      updated.copyPasteCount >= 5 ||
      updated.fullscreenExitCount >= 3;

    return res.status(200).json({ success: true, data: { ...withTrust, autoSubmit } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── NEW: Generate AI Coach study plan ──
export async function generateAiCoach(req: AuthRequest, res: Response) {
  const { attemptId } = req.params;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const isLocal = isNaN(Number(attemptId)) || String(attemptId).startsWith('attempt-');
    let attempt: any = null;
    let topicStats: any = {};
    let difficultyStats: any = {};
    let weakTopics: string[] = [];
    let strongTopics: string[] = [];
    let incorrectAnswers: any[] = [];
    let examTitle = '';
    let examSubject = '';
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    if (isLocal) {
      const { score: bodyScore, examTitle: bodyTitle, subject: bodySubject, topicStats: bodyTopics, difficultyStats: bodyDifficulty, incorrectAnswers: bodyIncorrect } = req.body;
      score = bodyScore || 0;
      examTitle = bodyTitle || 'Đề luyện thi';
      examSubject = bodySubject || 'Toán học';
      topicStats = bodyTopics || {};
      difficultyStats = bodyDifficulty || {};
      incorrectAnswers = bodyIncorrect || [];
      
      weakTopics = Object.keys(topicStats).filter(t => (topicStats[t].accuracy || 0) < 0.6);
      strongTopics = Object.keys(topicStats).filter(t => (topicStats[t].accuracy || 0) >= 0.8);
      
      correctCount = Object.values(topicStats).reduce((acc: number, cur: any) => acc + (cur.correct || 0), 0);
      wrongCount = incorrectAnswers.length;
      skippedCount = Math.max(0, Object.values(topicStats).reduce((acc: number, cur: any) => acc + (cur.total || 0), 0) - correctCount - wrongCount);
    } else {
      attempt = await prisma.testAttempt.findFirst({
        where: { id: Number(attemptId), studentId },
        include: {
          exam: true,
          attemptAnswers: {
            include: {
              question: true
            }
          }
        }
      });

      if (!attempt) return res.status(404).json({ success: false, error: 'Không tìm thấy lượt thi!' });

      topicStats = (attempt.topicStats as any) || {};
      difficultyStats = (attempt.difficultyStats as any) || {};
      weakTopics = Object.keys(topicStats).filter(t => (topicStats[t].accuracy || 0) < 0.6);
      strongTopics = Object.keys(topicStats).filter(t => (topicStats[t].accuracy || 0) >= 0.8);
      incorrectAnswers = attempt.attemptAnswers.filter((ans: any) => !ans.isCorrect);
      examTitle = attempt.exam.title;
      examSubject = attempt.exam.subject;
      score = attempt.score || 0;
      correctCount = attempt.correctCount || 0;
      wrongCount = attempt.wrongCount || 0;
      skippedCount = attempt.skippedCount || 0;
    }

    let coachPlan: any = null;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

    if (apiKey) {
      const sampleIncorrect = incorrectAnswers.slice(0, 10).map((ans, idx) => {
        const q = isLocal ? ans : ans.question;
        const studentAns = isLocal ? ans.selectedAnswer : ans.selectedAnswer;
        const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        const formattedOpts = Array.isArray(opts)
          ? opts.map((o: any) => `${o.label}. ${o.text}`).join(', ')
          : '';
        return `Câu hỏi ${idx + 1} (Chủ đề: ${q.topic || 'Chung'}, Độ khó: ${q.difficulty}):
   Nội dung: "${q.content || q.question_text}"
   Các lựa chọn: [${formattedOpts}]
   Đáp án đúng: ${q.correctAnswer || q.correct_answer}
   Học sinh đã chọn: ${studentAns || 'Bỏ qua'}
   Giải thích: ${q.explanation || 'Không có giải thích'}`;
      }).join('\n\n');

      const topicLines = Object.entries(topicStats)
        .map(([t, s]: [string, any]) => `- ${t}: ${Math.round((s.accuracy || 0) * 100)}% (${s.correct}/${s.total} câu)`)
        .join('\n') || 'Chưa có dữ liệu';

      const diffLines = Object.entries(difficultyStats)
        .filter(([, s]: [string, any]) => s.total > 0)
        .map(([d, s]: [string, any]) => `- ${d === 'EASY' ? 'Dễ (Nhận biết)' : d === 'HARD' ? 'Khó (Vận dụng cao)' : 'Trung bình (Thông hiểu/Vận dụng thấp)'}: ${Math.round((s.accuracy || 0) * 100)}% (${s.correct}/${s.total} câu)`)
        .join('\n') || 'Chưa có dữ liệu';

      const prompt = `Bạn là một AI Coach, chuyên gia cố vấn học tập và luyện thi THPT Quốc gia hàng đầu. Nhiệm vụ của bạn là phân tích chi tiết kết quả bài thi thử của học sinh và xây dựng kế hoạch ôn tập cá nhân hóa 7 ngày tối ưu nhất bằng tiếng Việt.

Thông tin kết quả bài thi thử:
- Đề thi: "${examTitle}"
- Môn học: "${examSubject}"
- Điểm số: ${score?.toFixed(2)}/10
- Số câu đúng: ${correctCount} | Số câu sai: ${wrongCount} | Số câu bỏ qua: ${skippedCount}

Thống kê chi tiết theo chủ đề:
${topicLines}

Thống kê chi tiết theo độ khó & cấp độ nhận thức:
${diffLines}
* Ghi chú: Dễ tương đương Nhận biết, Trung bình tương đương Thông hiểu/Vận dụng thấp, Khó tương đương Vận dụng cao.

Dưới đây là danh sách chi tiết tối đa 10 câu hỏi học sinh đã làm sai để phân tích lỗ hổng kiến thức cụ thể:
${sampleIncorrect || 'Không có câu hỏi sai.'}

Yêu cầu phản hồi:
Bạn chỉ được phép phản hồi dưới dạng một đối tượng JSON duy nhất, KHÔNG chứa bất kỳ văn bản giải thích nào trước hoặc sau khối JSON đó. Khối JSON phải tuân thủ chính xác cấu trúc sau:
{
  "summary": "Phân tích sư phạm cực kỳ chuyên sâu và chi tiết (từ 250-400 từ) về kết quả thi. Hãy chỉ rõ học sinh đang hổng kiến thức ở phân môn nào, lỗi sai là do hiểu sai khái niệm (Thông hiểu) hay do chưa biết cách giải toán/áp dụng công thức nâng cao (Vận dụng/Vận dụng cao). Đồng thời phân tích sâu sắc nguyên nhân cụ thể dẫn đến các câu trả lời sai của học sinh từ danh sách câu hỏi sai ở trên (ví dụ: nhầm lẫn lý thuyết, tính toán sai số, hay chưa nắm vững phương pháp giải chuyên đề).",
  "strengths": ["Điểm mạnh cụ thể 1 kèm ví dụ chủ đề", "Điểm mạnh cụ thể 2"],
  "weaknesses": ["Lỗ hổng kiến thức cụ thể 1 kèm mức độ nhận thức", "Lỗ hổng cụ thể 2"],
  "priority_topics": ["Chủ đề ưu tiên số 1 phải học ngay", "Chủ đề ưu tiên số 2"],
  "study_plan": [
    {
      "day": 1,
      "focus": "Chủ đề học cụ thể ngày 1...",
      "tasks": [
        "Nhiệm vụ cụ thể 1: Đọc tài liệu trang/chủ đề nào...",
        "Nhiệm vụ cụ thể 2: Luyện bao nhiêu câu bài tập tự luyện/trắc nghiệm...",
        "Nhiệm vụ cụ thể 3: Ghi chép sổ tay hoặc sơ đồ tư duy..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    },
    {
      "day": 2,
      "focus": "Chủ đề học cụ thể ngày 2...",
      "tasks": [
        "Nhiệm vụ cụ thể 1...",
        "Nhiệm vụ cụ thể 2..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    },
    {
      "day": 3,
      "focus": "Chủ đề học cụ thể ngày 3...",
      "tasks": [
        "Nhiệm vụ cụ thể 1...",
        "Nhiệm vụ cụ thể 2..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    },
    {
      "day": 4,
      "focus": "Chủ đề học cụ thể ngày 4...",
      "tasks": [
        "Nhiệm vụ cụ thể 1...",
        "Nhiệm vụ cụ thể 2..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    },
    {
      "day": 5,
      "focus": "Chủ đề học cụ thể ngày 5...",
      "tasks": [
        "Nhiệm vụ cụ thể 1...",
        "Nhiệm vụ cụ thể 2..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    },
    {
      "day": 6,
      "focus": "Chủ đề học cụ thể ngày 6...",
      "tasks": [
        "Nhiệm vụ cụ thể 1...",
        "Nhiệm vụ cụ thể 2..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    },
    {
      "day": 7,
      "focus": "Chủ đề ôn tập tổng hợp ngày 7...",
      "tasks": [
        "Nhiệm vụ cụ thể 1...",
        "Nhiệm vụ cụ thể 2..."
      ],
      "goal": "Mục tiêu cụ thể đạt được..."
    }
  ],
  "motivational_message": "Lời khuyên sư phạm và thông điệp truyền cảm hứng học tập mạnh mẽ..."
}`;

      try {
        console.log(`[AI Coach] Generating study plan with model: ${model}`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://edupath.vn',
            'X-Title': 'EduPath AI Coach'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 3000
          })
        });

        if (response.ok) {
          const aiData = await response.json() as any;
          const rawText = aiData?.choices?.[0]?.message?.content || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            coachPlan = JSON.parse(jsonMatch[0]);
          }
        } else {
          const errText = await response.text();
          console.error(`[AI Coach Error] OpenRouter status ${response.status}: ${errText}`);
        }
      } catch (aiErr) {
        console.warn('[generateAiCoach] AI API error, using rule-based fallback', aiErr);
      }
    }

    if (!coachPlan) {
      coachPlan = buildRuleBasedCoachPlan(
        score,
        weakTopics,
        strongTopics,
        topicStats,
        difficultyStats,
        examTitle,
        examSubject
      );
    }

    if (!isLocal && attempt) {
      const existingFeedback = (attempt.aiFeedback as any) || {};
      await prisma.testAttempt.update({
        where: { id: Number(attemptId) },
        data: { aiFeedback: { ...existingFeedback, coachPlan } }
      });
    }

    return res.status(200).json({ success: true, data: coachPlan });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function buildRuleBasedCoachPlan(
  score: number,
  weakTopics: string[],
  strongTopics: string[],
  topicStats: any,
  difficultyStats: any,
  examTitle: string,
  subject: string
) {
  let summary = '';
  let motivationalMessage = '';

  const subjectLower = (subject || '').toLowerCase();
  
  if (score >= 9) {
    summary = `Kết quả xuất sắc! Bạn đạt ${score.toFixed(1)}/10 điểm trong đề thi "${examTitle}". Bạn đã làm chủ hầu hết các chủ đề chính. Điểm mạnh lớn nhất nằm ở khả năng tư duy và phản xạ câu hỏi tốt. Hãy duy trì nhịp độ và tập trung tối đa vào các câu hỏi phân hóa mức độ Vận dụng cao để đạt điểm số tuyệt đối.`;
    motivationalMessage = 'Tuyệt vời! Bạn đang rất gần với điểm số tối đa. Hãy tiếp tục thử thách bản thân với các đề thi nâng cao!';
  } else if (score >= 7) {
    summary = `Kết quả Giỏi! Bạn đạt ${score.toFixed(1)}/10 điểm. Kiến thức nền tảng của bạn rất vững vàng, tuy nhiên bạn gặp một số lỗi sai ở các câu hỏi Thông hiểu nâng cao và Vận dụng, tiêu biểu là các chủ đề: ${weakTopics.slice(0, 2).join(', ') || 'các dạng bài phức tạp'}. Cần ôn kỹ phương pháp giải nhanh để bứt phá.`;
    motivationalMessage = 'Điểm 9-10 đang nằm trong tầm tay của bạn. Tập trung khắc phục những lỗi sai nhỏ này nhé!';
  } else if (score >= 5) {
    summary = `Kết quả Khá/Trung bình. Bạn đạt ${score.toFixed(1)}/10 điểm. Bạn nắm được kiến thức căn bản ở mức Nhận biết, nhưng các phần Thông hiểu và Vận dụng còn thiếu sót nhiều, đặc biệt là ở chủ đề: ${weakTopics.slice(0, 3).join(', ') || 'các lý thuyết cốt lõi'}. Bạn cần một kế hoạch lấp lỗ hổng bài bản trong tuần tới.`;
    motivationalMessage = 'Không sao cả! Hãy đi từ lý thuyết căn bản trước, luyện tập đều đặn và bạn sẽ thấy điểm số cải thiện rõ rệt.';
  } else {
    summary = `Kết quả chưa đạt kỳ vọng. Bạn đạt ${score.toFixed(1)}/10 điểm. Lỗ hổng kiến thức xuất hiện diện rộng từ lý thuyết Nhận biết đến bài tập Thông hiểu ở các chủ đề: ${weakTopics.slice(0, 3).join(', ') || 'các nội dung cốt lõi'}. Khuyến nghị bạn hãy tạm ngưng giải đề khó và quay về học kỹ sách giáo khoa, ghi nhớ công thức trước.`;
    motivationalMessage = 'Đường dài mới biết ngựa hay. Hãy bắt đầu từ những bước nhỏ nhất một cách kiên trì nhé!';
  }

  const allTopics = Object.keys(topicStats);
  const midTopics = allTopics.filter(t => !weakTopics.includes(t) && !strongTopics.includes(t));
  const studyOrder = [...weakTopics, ...midTopics, ...strongTopics];

  // Tailored tasks depending on subject
  let isMath = subjectLower.includes('toán');
  let isChemistry = subjectLower.includes('hóa');
  let isPhysics = subjectLower.includes('lý');

  const getDayConfigs = () => {
    if (isMath) {
      return [
        {
          focus: `Củng cố lý thuyết & Công thức: ${studyOrder[0] || 'Giải tích'}`,
          tasks: [
            `Xem lại định nghĩa, định lý và các công thức tính nhanh của chủ đề ${studyOrder[0] || 'Trọng tâm'}.`,
            'Hệ thống hóa kiến thức bằng sơ đồ tư duy (Mindmap) để tránh nhầm lẫn.',
            'Làm 15 câu trắc nghiệm mức độ Nhận biết - Thông hiểu để kiểm tra độ hiểu sâu lý thuyết.'
          ],
          goal: 'Nắm chắc 100% công thức cốt lõi và các bẫy lý thuyết thường gặp'
        },
        {
          focus: `Luyện tập chuyên đề Vận dụng thấp: ${studyOrder[1] || studyOrder[0] || 'Hình học'}`,
          tasks: [
            `Luyện tập 25 bài toán liên quan đến chủ đề ${studyOrder[1] || studyOrder[0] || 'Hình học'} mức độ Thông hiểu.`,
            'Rèn luyện kỹ năng sử dụng máy tính Casio để tối ưu hóa thời gian tính toán và thử đáp án.',
            'Ghi chép lại các mẹo loại trừ phương án sai nhanh.'
          ],
          goal: 'Tăng tốc độ làm bài toán mức độ Trung bình dưới 1.5 phút/câu'
        },
        {
          focus: `Chinh phục câu hỏi phân hóa: ${studyOrder[0] || 'Chủ đề yếu nhất'}`,
          tasks: [
            `Tập trung giải 10 bài tập tự luận/trắc nghiệm Vận dụng cao của chủ đề ${studyOrder[0] || 'Hình học/Giải tích'}.`,
            'Nghiên cứu kỹ lời giải chi tiết, ghi chú lại phương pháp tiếp cận và hướng tư duy hình học/đại số.',
            'Tự giải lại các câu sai mà không nhìn tài liệu hướng dẫn.'
          ],
          goal: 'Hình thành phản xạ tư duy với các bài toán vận dụng phức tạp'
        },
        {
          focus: 'Đánh giá năng lực giữa chặng (Mini-Test)',
          tasks: [
            'Thực hiện mini-test gồm 25 câu hỏi tổng hợp các chủ đề đã học trong điều kiện bấm giờ 45 phút.',
            'Chấm điểm nghiêm túc, khoanh vùng những lỗi sai do tính toán ẩu hoặc hiểu sai đề.',
            'Luyện tập bù 5 câu cho mỗi dạng câu làm sai.'
          ],
          goal: 'Rèn luyện tâm lý phòng thi và khắc phục triệt để lỗi tính toán sai số'
        },
        {
          focus: `Tối ưu phương pháp giải nhanh: ${studyOrder[2] || 'Tổ hợp & Xác suất'}`,
          tasks: [
            `Ôn tập kỹ năng và phương pháp giải nhanh cho chủ đề ${studyOrder[2] || 'Tổ hợp/Hình không gian'}.`,
            'Tổng hợp các dạng đồ thị, bảng biến thiên và các đường tiệm cận đặc trưng.',
            'Làm 20 bài tập rèn luyện kỹ năng phân tích hình ảnh và đồ thị hàm số.'
          ],
          goal: 'Thành thạo kỹ năng đọc đồ thị và nhận diện nhanh dạng toán biểu diễn'
        },
        {
          focus: 'Tổng ôn toàn bộ kiến thức và lý thuyết bổ trợ',
          tasks: [
            'Xem lại toàn bộ sổ tay ghi chép công thức toán học và mẹo bấm máy Casio tích lũy từ đầu tuần.',
            'Luyện 30 câu hỏi trắc nghiệm lý thuyết thuần túy (đúng/sai, số mệnh đề đúng).',
            'Nghỉ ngơi hợp lý để chuẩn bị tinh thần tốt nhất cho bài test toàn diện ngày mai.'
          ],
          goal: 'Đạt trạng thái tự tin nhất về mặt lý thuyết nền tảng'
        },
        {
          focus: 'Thi thử Full đề chuẩn cấu trúc Bộ GD&ĐT',
          tasks: [
            'Giải 1 đề thi thử trọn vẹn 50 câu (90 phút) nghiêm túc như thi thật.',
            'Phân tích phổ điểm đạt được và so sánh với lần thi trước để đánh giá mức độ tiến bộ.',
            'Ghi nhận các chủ đề còn yếu để tiếp tục đưa vào kế hoạch tuần tiếp theo.'
          ],
          goal: 'Đạt phản xạ phòng thi tốt nhất và phân bổ thời gian hợp lý (30 câu đầu làm trong 30 phút)'
        }
      ];
    } else if (isChemistry) {
      return [
        {
          focus: `Lý thuyết chất & Phản ứng đặc trưng: ${studyOrder[0] || 'Este - Lipit'}`,
          tasks: [
            `Ôn lại danh pháp, tính chất vật lý và phương trình hóa học đặc trưng của chủ đề ${studyOrder[0]}.`,
            'Viết lại các phản ứng thủy phân, phản ứng tráng bạc và phản ứng đốt cháy.',
            'Làm 20 câu trắc nghiệm lý thuyết Nhận biết để củng cố.'
          ],
          goal: 'Nắm vững lý thuyết cơ bản và các hiện tượng thí nghiệm'
        },
        {
          focus: `Bài tập tính toán căn bản & Phương pháp bảo toàn: ${studyOrder[1] || studyOrder[0] || 'Kim loại'}`,
          tasks: [
            `Luyện tập 20 bài toán hóa học liên quan đến ${studyOrder[1] || studyOrder[0]} áp dụng Bảo toàn khối lượng, Bảo toàn electron.`,
            'Ghi chép công thức tính nhanh muối sunfat, muối clorua và muối nitrat.',
            'Xem lại đáp án chi tiết các câu tính toán sai trong bài thi trước.'
          ],
          goal: 'Áp dụng thuần thục các định luật bảo toàn để rút ngắn thời gian giải bài'
        },
        {
          focus: `Chinh phục bài tập phân hóa cao: ${studyOrder[0] || 'Peptit/Hỗn hợp phức tạp'}`,
          tasks: [
            `Giải 10 bài toán hỗn hợp hữu cơ/vô cơ nâng cao sử dụng phương pháp Quy đổi, Dồn chất.`,
            'Đọc kỹ phân tích sơ đồ phản ứng hóa học nâng cao.',
            'Tự viết lại các bước biến đổi hóa học phức tạp để nhớ hướng tư duy.'
          ],
          goal: 'Hiểu bản chất phương pháp dồn chất và biết cách chia nhỏ bài toán lớn'
        },
        {
          focus: 'Đánh giá năng lực - Mini-Test Hóa học',
          tasks: [
            'Làm mini-test 20 câu (30 phút) gồm cả lý thuyết và bài tập hỗn hợp.',
            'Chấm điểm và khoanh vùng các lỗi đếm chất, đếm phát biểu sai.',
            'Luyện lại 5 câu đếm mệnh đề cho mỗi lỗi sai.'
          ],
          goal: 'Khắc phục hoàn toàn lỗi mất điểm ở các câu hỏi đếm phát biểu lý thuyết'
        },
        {
          focus: `Ôn tập phần Lý thuyết Thực hành & Thí nghiệm: ${studyOrder[2] || 'Vô cơ nâng cao'}`,
          tasks: [
            `Xem lại các bước tiến hành các thí nghiệm hóa học đặc trưng (Ví dụ: xà phòng hóa, điều chế este).`,
            'Học thuộc màu sắc các chất kết tủa, khí thoát ra và các hiện tượng đặc trưng.',
            'Làm 15 câu trắc nghiệm thực hành thí nghiệm tốt nghiệp.'
          ],
          goal: 'Nắm chắc điểm của các câu hỏi liên quan đến thí nghiệm thực hành'
        },
        {
          focus: 'Hệ thống hóa toàn bộ kiến thức hóa học hữu cơ & vô cơ',
          tasks: [
            'Hệ thống hóa các dãy chuyển hóa hóa học và bảng tính tan bằng sơ đồ tóm tắt.',
            'Xem lại toàn bộ công thức tính nhanh và ghi chú bẫy lý thuyết tích lũy.',
            'Chuẩn bị tâm lý thoải mái, ngủ đủ giấc cho ngày thi thử ngày mai.'
          ],
          goal: 'Hệ thống hóa kiến thức hóa học toàn diện, sẵn sàng thi thử'
        },
        {
          focus: 'Thi thử Full đề Hóa học tốt nghiệp THPT Quốc gia',
          tasks: [
            'Làm đề thi thử Hóa học 40 câu (50 phút) nghiêm túc không sử dụng tài liệu.',
            'Đối chiếu đáp án, tự chấm điểm và phân tích các câu làm sai.',
            'Lập danh mục các câu lý thuyết bị lừa để tránh lặp lại sai lầm.'
          ],
          goal: 'Tự tin làm chủ thời gian làm bài thi hóa học trong vòng 50 phút'
        }
      ];
    } else if (isPhysics) {
      return [
        {
          focus: `Lý thuyết & Công thức căn bản: ${studyOrder[0] || 'Dao động cơ'}`,
          tasks: [
            `Xem lại các định nghĩa, phương trình li độ, vận tốc, gia tốc của chủ đề ${studyOrder[0]}.`,
            'Học thuộc các biểu thức tính chu kỳ, tần số của con lắc lò xo và con lắc đơn.',
            'Làm 20 câu hỏi lý thuyết mức độ Nhận biết.'
          ],
          goal: 'Thuộc lòng các phương trình dao động và các đại lượng đặc trưng'
        },
        {
          focus: `Bài tập tính toán & Biểu diễn vector quay: ${studyOrder[1] || studyOrder[0] || 'Sóng cơ'}`,
          tasks: [
            `Luyện tập 20 câu hỏi trắc nghiệm chủ đề ${studyOrder[1] || studyOrder[0]} có sử dụng giản đồ vector hoặc vòng tròn lượng giác.`,
            'Rèn luyện kỹ năng tính độ lệch pha và khoảng cách giữa các phần tử.',
            'Xem lại cách giải các câu sai trong bài thi cũ.'
          ],
          goal: 'Thành thạo phương pháp vòng tròn lượng giác để giải nhanh bài toán thời gian'
        },
        {
          focus: `Bài tập đồ thị & Vận dụng nâng cao: ${studyOrder[0] || 'Dòng điện xoay chiều'}`,
          tasks: [
            `Giải quyết 10 bài toán đồ thị dao động hoặc đồ thị dòng điện xoay chiều nâng cao.`,
            'Học phương pháp chuẩn hóa số liệu và giản đồ vector trượt trong mạch điện RLC.',
            'Tự chứng minh lại các công thức cực trị điện xoay chiều.'
          ],
          goal: 'Làm chủ các bài toán đồ thị vật lý và bài toán cực trị công suất'
        },
        {
          focus: 'Mini-Test Đánh giá năng lực Vật lý',
          tasks: [
            'Làm đề mini-test 20 câu (25 phút) tổng hợp kiến thức cơ và điện.',
            'Phân tích lỗi sai do nhầm lẫn đơn vị (đổi cm sang m, Hz sang rad/s) hoặc tính toán sai.',
            'Làm 5 bài tập cùng dạng cho mỗi câu làm sai.'
          ],
          goal: 'Hình thành thói quen đổi đơn vị và kiểm tra kỹ lưỡng các đại lượng trước khi tính'
        },
        {
          focus: `Phương pháp thực hành thí nghiệm & Sai số: ${studyOrder[2] || 'Sóng ánh sáng'}`,
          tasks: [
            `Ôn lại các công thức tính sai số phép đo vật lý.`,
            'Xem lại cấu tạo và hoạt động của các thiết bị thí nghiệm (Ví dụ: máy quang phổ, ống phát tia X).',
            'Làm 15 câu trắc nghiệm thực hành vật lý tốt nghiệp.'
          ],
          goal: 'Ăn trọn điểm câu hỏi thực hành thí nghiệm vật lý thường gặp'
        },
        {
          focus: 'Hệ thống hóa toàn bộ công thức & Đồ thị Vật lý 12',
          tasks: [
            'Xem lại toàn bộ sổ tay công thức Vật lý 12 tóm tắt.',
            'Nhận diện nhanh hình dạng đồ thị dao động, sóng và dòng điện xoay chiều.',
            'Nghỉ ngơi sớm để có thể trạng tốt nhất cho buổi thi thử ngày mai.'
          ],
          goal: 'Đạt sự tự tin tuyệt đối về kiến thức Vật lý toàn phần'
        },
        {
          focus: 'Thi thử tốt nghiệp THPT Môn Vật lý',
          tasks: [
            'Giải đề thi thử Vật lý 40 câu (50 phút) chuẩn cấu trúc đề thi chính thức.',
            'Tự chấm điểm, phân tích kỹ nguyên nhân các lỗi sai.',
            'Ghi chép lại các dạng bài mới, lạ để tìm hiểu thêm phương pháp giải.'
          ],
          goal: 'Đạt phản xạ phòng thi tốt nhất và tối ưu hóa thời gian phân bổ'
        }
      ];
    } else {
      // Default / Tiếng Anh / Sinh học
      return [
        {
          focus: `Hệ thống hóa lý thuyết & Kiến thức nền tảng: ${studyOrder[0] || 'Ngữ pháp cơ bản'}`,
          tasks: [
            `Xem lại lý thuyết ngữ pháp/khái niệm cốt lõi của chủ đề ${studyOrder[0]}.`,
            'Ghi chép lại các quy tắc chính và các trường hợp đặc biệt (ngoại lệ).',
            'Làm 20 bài tập áp dụng trực tiếp mức độ Nhận biết.'
          ],
          goal: 'Nắm chắc kiến thức nền tảng và nhận diện nhanh các dạng bài cơ bản'
        },
        {
          focus: `Rèn luyện kỹ năng phân tích & Giải bài tập cơ bản: ${studyOrder[1] || studyOrder[0] || 'Bài tập chuyên đề'}`,
          tasks: [
            `Làm 30 bài tập luyện tập chuyên sâu cho chủ đề ${studyOrder[1] || studyOrder[0]}.`,
            'Tập trung phân tích các dấu hiệu nhận biết để lựa chọn phương án đúng.',
            'Xem lại đáp án chi tiết và giải thích các câu làm sai để rút kinh nghiệm.'
          ],
          goal: 'Quen dạng bài, nâng cao tốc độ giải quyết bài tập cơ bản'
        },
        {
          focus: `Nâng cao năng lực và Chinh phục câu hỏi khó: ${studyOrder[0] || 'Chuyên đề nâng cao'}`,
          tasks: [
            `Thử sức với 15 câu hỏi nâng cao (Vận dụng/Vận dụng cao) thuộc chủ đề ${studyOrder[0]}.`,
            'Nghiên cứu kỹ các bài giải mẫu và học hỏi phương pháp tư duy giải nhanh.',
            'Tự làm lại các câu khó mà không nhìn tài liệu tham khảo.'
          ],
          goal: 'Hiểu rõ các phương pháp suy luận logic và biết cách giải câu hỏi phân hóa'
        },
        {
          focus: 'Đánh giá năng lực định kỳ - Mini Test',
          tasks: [
            'Làm mini-test ngắn gồm các câu hỏi trắc nghiệm tổng hợp trong điều kiện giới hạn thời gian.',
            'Tự chấm điểm và lập danh sách chi tiết các lỗi sai thường gặp.',
            'Ôn tập bổ sung ngay lập tức các câu hỏi thuộc phần kiến thức bị sai.'
          ],
          goal: 'Đánh giá chính xác mức độ tiến bộ và rèn luyện kỹ năng phân bổ thời gian'
        },
        {
          focus: `Mở rộng kiến thức & Tối ưu phương pháp làm bài: ${studyOrder[2] || 'Dạng bài tổng hợp'}`,
          tasks: [
            `Luyện tập các bài toán/đọc hiểu tổng hợp thuộc chủ đề ${studyOrder[2] || 'kiến thức tổng hợp'}.`,
            'Áp dụng các kỹ thuật giải nhanh (Ví dụ: phương pháp loại trừ, nhận diện từ khóa).',
            'Ghi chú lại các cụm từ/công thức quan trọng vào sổ tay học tập.'
          ],
          goal: 'Làm chủ các dạng bài tổng hợp và tối ưu hóa quy trình suy luận'
        },
        {
          focus: 'Hệ thống hóa toàn bộ kiến thức trong tuần',
          tasks: [
            'Đọc lại toàn bộ sơ đồ tư duy và ghi chép đã tích lũy từ đầu tuần.',
            'Luyện nhanh 25 câu hỏi trắc nghiệm lý thuyết để rà soát lần cuối.',
            'Chuẩn bị đầy đủ dụng cụ học tập và tinh thần thoải mái cho bài thi thử ngày mai.'
          ],
          goal: 'Hệ thống hóa kiến thức toàn diện và sẵn sàng cho bài thi lớn'
        },
        {
          focus: 'Thi thử toàn diện Full đề chuẩn cấu trúc',
          tasks: [
            'Thực hiện giải đề thi thử full đề trong thời gian quy định nghiêm túc.',
            'Phân tích kết quả thi, so sánh điểm số với bài thi đầu tuần để thấy sự tiến bộ.',
            'Lập kế hoạch điều chỉnh phương pháp học tập cho các tuần tiếp theo.'
          ],
          goal: 'Đạt phản xạ phòng thi tốt nhất và tự tin tuyệt đối trước kỳ thi thật'
        }
      ];
    }
  };

  const study_plan = getDayConfigs().map((cfg, i) => ({ day: i + 1, ...cfg }));

  return {
    summary,
    strengths: strongTopics.slice(0, 3).map(t => `${t} (Nắm vững)`),
    weaknesses: weakTopics.slice(0, 4).map(t => `${t} (Cần củng cố)`),
    priority_topics: weakTopics.slice(0, 3),
    study_plan,
    motivational_message: motivationalMessage
  };
}

// ── NEW: Create smart retake session with filtered questions ──
export async function createSmartRetake(req: AuthRequest, res: Response) {
  const { id } = req.params; // examId
  const { mode, attemptId } = req.body; // mode: 'wrong_only' | 'weak_topic' | 'full'
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: Number(id) },
      include: {
        examQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!exam) return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });

    if (mode === 'ai_similar' || mode === 'wrong_similar') {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
      
      let baseQuestions = exam.examQuestions;
      if (attemptId) {
        const prevAttempt = await prisma.testAttempt.findFirst({
          where: { id: Number(attemptId), studentId, status: 'SUBMITTED' },
          include: { attemptAnswers: { include: { question: true } } }
        });
        if (prevAttempt) {
          const wrongAnswers = prevAttempt.attemptAnswers.filter(a => !a.isCorrect);
          if (mode === 'wrong_similar') {
            baseQuestions = wrongAnswers.map(a => exam.examQuestions.find(eq => eq.questionId === a.questionId)).filter(Boolean) as any;
          } else {
            const rightAnswers = prevAttempt.attemptAnswers.filter(a => a.isCorrect);
            const selectedWrong = wrongAnswers.slice(0, 7).map(a => exam.examQuestions.find(eq => eq.questionId === a.questionId)).filter(Boolean);
            const selectedRight = rightAnswers.slice(0, 10 - selectedWrong.length).map(a => exam.examQuestions.find(eq => eq.questionId === a.questionId)).filter(Boolean);
            baseQuestions = [...selectedWrong, ...selectedRight] as any;
          }
        }
      }

      if (baseQuestions.length === 0) {
        baseQuestions = exam.examQuestions.filter(eq => eq.question.difficulty === 'HARD');
        if (baseQuestions.length === 0) {
          baseQuestions = exam.examQuestions;
        }
      }
      if (baseQuestions.length > 10) {
        baseQuestions = baseQuestions.slice(0, 10);
      }

      const questionsDataPrompt = baseQuestions.map((eq, idx) => {
        const q = eq.question;
        const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        const formattedOpts = Array.isArray(opts)
          ? opts.map((o: any) => `${o.label}. ${o.text}`).join(', ')
          : '';
        return `Câu hỏi tham chiếu ${idx + 1}:
- Nội dung: "${q.content}"
- Chủ đề: "${q.topic || 'Chung'}"
- Độ khó: "${q.difficulty}"
- Các lựa chọn: [${formattedOpts}]
- Đáp án đúng: "${q.correctAnswer}"
- Giải thích chi tiết: "${q.explanation || ''}"`;
      }).join('\n\n');

      const systemPrompt = `Bạn là một AI chuyên gia biên soạn đề thi THPT Quốc gia hàng đầu Việt Nam. Nhiệm vụ của bạn là tạo ra ${baseQuestions.length} câu hỏi MỚI hoàn toàn TƯƠNG TỰ các câu hỏi tham chiếu được cung cấp.
Với mỗi câu hỏi tham chiếu, hãy tạo một câu hỏi mới:
1. Kiểm tra cùng một khái niệm, kiến thức, công thức toán học/vật lý/hóa học hoặc chủ đề ngữ pháp tiếng Anh.
2. Có độ khó (EASY/MEDIUM/HARD) tương ứng.
3. Sử dụng các con số mới, tình huống mới hoặc cách diễn đạt khác để học sinh không thể làm theo trí nhớ mà phải hiểu bản chất.
4. Có 4 đáp án lựa chọn A, B, C, D rõ ràng, chỉ duy nhất một đáp án đúng.
5. Giải thích pedagogical chi tiết từng bước.
6. Các ký tự toán học, công thức vật lý, hóa học PHẢI sử dụng định dạng LaTeX chuẩn (ví dụ: $x^2 + 2x = 0$, $\\frac{a}{b}$) để trình duyệt render đẹp mắt.

Bạn chỉ được phép trả về một mảng JSON duy nhất chứa ${baseQuestions.length} câu hỏi, KHÔNG có văn bản giải thích nào khác trước hoặc sau JSON.
Cấu trúc mỗi câu hỏi trong JSON phải chính xác như sau:
[
  {
    "content": "Nội dung câu hỏi mới chứa công thức LaTeX...",
    "options": [
      {"label": "A", "text": "Phương án A..."},
      {"label": "B", "text": "Phương án B..."},
      {"label": "C", "text": "Phương án C..."},
      {"label": "D", "text": "Phương án D..."}
    ],
    "correctAnswer": "A", // hoặc B, C, D
    "topic": "Tên chủ đề tương ứng câu hỏi tham chiếu",
    "difficulty": "EASY", // EASY hoặc MEDIUM hoặc HARD
    "explanation": "Lời giải chi tiết từng bước..."
  }
]`;

      let generatedQuestions: any[] = [];
      if (apiKey) {
        try {
          console.log(`[AI Similar Exam] Generating ${baseQuestions.length} similar questions with model: ${model}`);
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://edupath.vn',
              'X-Title': 'EduPath AI Similar Exam Generator'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: questionsDataPrompt }
              ],
              temperature: 0.7,
              max_tokens: 3000
            })
          });

          if (response.ok) {
            const aiData = await response.json() as any;
            const rawText = aiData?.choices?.[0]?.message?.content || '';
            const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsed) && parsed.length > 0) {
                generatedQuestions = parsed;
              }
            }
          } else {
            const errText = await response.text();
            console.error(`[AI Similar Exam Error] OpenRouter status ${response.status}: ${errText}`);
          }
        } catch (aiErr) {
          console.error('[AI Similar Exam] API call failed:', aiErr);
        }
      }

      if (generatedQuestions.length === 0) {
        generatedQuestions = baseQuestions.map(eq => {
          const q = eq.question;
          const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          return {
            content: `[Tương tự] ${q.content}`,
            options: opts,
            correctAnswer: q.correctAnswer,
            topic: q.topic,
            difficulty: q.difficulty,
            explanation: q.explanation
          };
        });
      }

      const mappedQuestions = generatedQuestions.map((q, idx) => {
        return {
          id: -100 - idx,
          content: q.content,
          options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
          subject: exam.subject,
          topic: q.topic || 'Kiến thức cốt lõi',
          difficulty: q.difficulty || 'MEDIUM',
          imageUrl: null,
          question_number: idx + 1
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          exam: {
            id: exam.id,
            title: `${exam.title} — ${mode === 'wrong_similar' ? 'Đề tương tự câu sai AI 🔮' : 'Đề tương tự AI 🤖'}`,
            subject: exam.subject,
            duration: Math.max(15, Math.ceil(mappedQuestions.length * 1.5)),
            totalQuestions: mappedQuestions.length,
            retakeMode: mode,
            sourceExamId: exam.id,
            sourceAttemptId: attemptId || null
          },
          questions: mappedQuestions
        }
      });
    }

    let filteredQuestions = exam.examQuestions;

    if (mode === 'wrong_only' && attemptId) {
      const prevAttempt = await prisma.testAttempt.findFirst({
        where: { id: Number(attemptId), studentId, status: 'SUBMITTED' },
        include: { attemptAnswers: true }
      });
      if (prevAttempt) {
        const wrongIds = prevAttempt.attemptAnswers
          .filter(a => !a.isCorrect)
          .map(a => a.questionId);
        
        if (wrongIds.length > 0) {
          filteredQuestions = exam.examQuestions.filter(eq => wrongIds.includes(eq.questionId));
        } else {
          // Adaptive fallback: if 100% correct, challenge them with HARD questions
          filteredQuestions = exam.examQuestions.filter(eq => eq.question.difficulty === 'HARD');
          if (filteredQuestions.length === 0) {
            filteredQuestions = exam.examQuestions; // standard fallback
          }
        }
      }
    } else if (mode === 'weak_topic' && attemptId) {
      const prevAttempt = await prisma.testAttempt.findFirst({
        where: { id: Number(attemptId), studentId, status: 'SUBMITTED' }
      });
      const tStats = (prevAttempt?.topicStats as any) || {};
      const sortedTopics = Object.entries(tStats)
        .map(([topic, stat]: [string, any]) => ({ topic, accuracy: stat.accuracy || 0 }))
        .sort((a, b) => a.accuracy - b.accuracy);
      
      const weakTopics = sortedTopics.filter(t => t.accuracy < 0.6).map(t => t.topic);
      if (weakTopics.length > 0) {
        filteredQuestions = exam.examQuestions.filter(eq => weakTopics.includes(eq.question.topic));
      } else if (sortedTopics.length > 0) {
        // Fallback: pick the lowest accuracy topic if none are under 60%
        const lowestTopic = sortedTopics[0].topic;
        filteredQuestions = exam.examQuestions.filter(eq => eq.question.topic === lowestTopic);
      }
    }

    const questions = filteredQuestions.map((eq, idx) => {
      const q = eq.question;
      return {
        id: q.id,
        content: q.content,
        options: q.options,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        question_number: idx + 1
      };
    });

    const modeLabel: Record<string, string> = {
      wrong_only: 'Làm lại câu sai',
      weak_topic: 'Luyện chủ đề yếu',
      wrong_similar: 'Đề tương tự câu sai AI 🔮',
      full: 'Thi lại full đề'
    };

    return res.status(200).json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: `${exam.title} — ${modeLabel[mode] || 'Ôn luyện'}`,
          subject: exam.subject,
          duration: mode === 'full' ? exam.duration : Math.max(15, Math.ceil(questions.length * 1.5)),
          totalQuestions: questions.length,
          retakeMode: mode,
          sourceExamId: exam.id,
          sourceAttemptId: attemptId || null
        },
        questions
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function importExam(req: AuthRequest, res: Response) {
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  const userRole = req.user?.role;
  if (userRole === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: adminId }
    });

    if (!teacher || teacher.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: 'Hồ sơ Giáo viên của bạn chưa được duyệt! Bạn chỉ có thể tạo hoặc nhập đề thi sau khi được Admin phê duyệt.'
      });
    }
  }

  try {
    const examData = req.body;
    const examId = await importExamFromObject(examData, adminId);
    return res.status(201).json({ success: true, data: { examId, message: 'Nhập đề thi thành công!' } });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function generateSimilarQuestion(req: AuthRequest, res: Response) {
  const { content, topic, difficulty, options, explanation, subject } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'OpenRouter API key is not configured!' });
  }

  const opts = typeof options === 'string' ? JSON.parse(options) : options;
  const formattedOpts = Array.isArray(opts)
    ? opts.map((o: any) => `${o.label}. ${o.text}`).join(', ')
    : '';

  const questionPrompt = `Câu hỏi gốc:
- Nội dung: "${content}"
- Chủ đề: "${topic || 'Chung'}"
- Môn học: "${subject || 'Toán học'}"
- Độ khó: "${difficulty || 'MEDIUM'}"
- Các lựa chọn: [${formattedOpts}]
- Lời giải thích gốc: "${explanation || ''}"`;

  const systemPrompt = `Bạn là một AI chuyên gia biên soạn đề thi tốt nghiệp THPT Quốc gia hàng đầu. Hãy tạo ra MỘT câu hỏi trắc nghiệm mới hoàn toàn TƯƠNG TỰ câu hỏi gốc được cung cấp.
Yêu cầu câu hỏi mới:
1. Kiểm tra cùng một khái niệm kiến thức, định lý, công thức hoặc điểm ngữ pháp với câu gốc.
2. Thay đổi số liệu, thông số, tên nhân vật hoặc tình huống cụ thể (để học sinh không thể giải bằng cách nhớ đáp án).
3. Sử dụng định dạng LaTeX chuẩn cho tất cả các ký tự toán học, vật lý, hóa học (ví dụ: $x = 2$, $\\Delta$, $\\frac{a}{b}$) để trình duyệt render đẹp mắt.
4. Có 4 lựa chọn A, B, C, D rõ ràng, chỉ duy nhất một đáp án đúng.
5. Có lời giải pedagogical chi tiết từng bước bằng tiếng Việt.

Chỉ trả về duy nhất một đối tượng JSON đại diện cho câu hỏi mới, tuyệt đối không giải thích thêm trước hoặc sau khối JSON.
Định dạng JSON:
{
  "content": "Nội dung câu hỏi mới chứa công thức LaTeX...",
  "options": [
    {"label": "A", "text": "Phương án A..."},
    {"label": "B", "text": "Phương án B..."},
    {"label": "C", "text": "Phương án C..."},
    {"label": "D", "text": "Phương án D..."}
  ],
  "correctAnswer": "A", // Đáp án đúng A, B, C hoặc D
  "explanation": "Hướng dẫn giải chi tiết từng bước bằng tiếng Việt...",
  "topic": "Tên chủ đề tương ứng câu hỏi gốc",
  "difficulty": "Độ khó tương ứng (EASY, MEDIUM, hoặc HARD)"
}`;

  try {
    console.log(`[AI Similar Question] Generating single question with model: ${model}`);
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edupath.vn',
        'X-Title': 'EduPath AI Similar Question Generator'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: questionPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (response.ok) {
      const aiData = await response.json() as any;
      const rawText = aiData?.choices?.[0]?.message?.content || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ success: true, data: parsed });
      }
    }
    
    const errText = await response.text();
    return res.status(400).json({ success: false, error: `OpenRouter error: ${errText}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateExamStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  if (userRole === 'TEACHER' && status === 'published') {
    return res.status(403).json({ success: false, error: 'Giáo viên không có quyền phê duyệt đề thi!' });
  }

  try {
    const exam = await prisma.exam.findUnique({ where: { id: Number(id) } });
    if (!exam) return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi!' });

    const updated = await prisma.exam.update({
      where: { id: Number(id) },
      data: { status }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getWrongQuestions(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const wrongAnswers = await prisma.testAttemptAnswer.findMany({
      where: {
        attempt: {
          studentId,
          status: 'SUBMITTED'
        },
        isCorrect: false
      },
      include: {
        question: true,
        attempt: {
          include: {
            exam: {
              select: {
                id: true,
                title: true,
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        attempt: {
          submittedAt: 'desc'
        }
      }
    });

    const data = wrongAnswers.map(wa => {
      const q = wa.question;
      return {
        id: wa.id,
        questionId: q.id,
        content: q.content,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        audioUrl: q.audioUrl,
        selectedAnswer: wa.selectedAnswer,
        examId: wa.attempt.exam.id,
        examTitle: wa.attempt.exam.title,
        attemptId: wa.attempt.id,
        submittedAt: wa.attempt.submittedAt
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

