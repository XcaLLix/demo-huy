import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export async function getExams(req: AuthRequest, res: Response) {
  const { subject } = req.query;

  try {
    const list = await prisma.exam.findMany({
      where: subject ? { subject: String(subject) } : {},
      include: {
        examQuestions: { select: { questionId: true } }
      }
    });

    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function startAttempt(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const attempt = await prisma.testAttempt.create({
      data: {
        studentId,
        examId: Number(id),
        score: 0.0,
        startedAt: new Date()
      }
    });

    return res.status(201).json({ success: true, data: attempt });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitAttempt(req: AuthRequest, res: Response) {
  const { id: examId, attemptId } = req.params;
  const { answers } = req.body; // Array of { questionId: number, selectedAnswer: string }
  const studentId = req.user?.id;

  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: Number(examId) },
      include: { question: true }
    });

    let correctCount = 0;
    const recordsToInsert: any[] = [];
    const topicStats: any = {};

    examQuestions.forEach((eq) => {
      const q = eq.question;
      const userAns = answers.find((a: any) => a.questionId === q.id);
      const isCorrect = userAns ? userAns.selectedAnswer === q.correctAnswer : false;

      if (isCorrect) correctCount++;

      // Track weak topic ratios
      if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0 };
      topicStats[q.topic].total++;
      if (isCorrect) topicStats[q.topic].correct++;

      recordsToInsert.push({
        attemptId: Number(attemptId),
        questionId: q.id,
        selectedAnswer: userAns ? userAns.selectedAnswer : '',
        isCorrect
      });
    });

    const totalQuestions = examQuestions.length || 1;
    const finalScore = (correctCount / totalQuestions) * 10;

    // Transact attempt answer records
    await prisma.$transaction([
      prisma.testAttemptAnswer.createMany({ data: recordsToInsert }),
      prisma.testAttempt.update({
        where: { id: Number(attemptId) },
        data: {
          score: finalScore,
          submittedAt: new Date(),
          // Pre-populate standard feedback if AI fails
          aiFeedback: {
            assessment: `Bạn đạt ${finalScore.toFixed(1)}/10 điểm thi.`,
            knowledgeGaps: Object.keys(topicStats).filter(t => (topicStats[t].correct / topicStats[t].total) < 0.6),
            advice: ["Xem lại bảng đạo hàm và củng cố phương pháp đặt ẩn phụ."],
            encouragement: "Cố lên! Bạn đang từng bước tiến gần hơn tới giảng đường mơ ước!"
          }
        }
      })
    ]);

    const updatedAttempt = await prisma.testAttempt.findUnique({
      where: { id: Number(attemptId) },
      include: { attemptAnswers: true }
    });

    return res.status(200).json({ success: true, data: updatedAttempt });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
