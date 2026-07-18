import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export class ExamManagementRepository {
  // --- EXAM QUERIES ---
  static async getExams(createdBy: number, filters: { search?: string; subject?: string; status?: string }, skip = 0, take = 10) {
    const where: Prisma.ExamWhereInput = { createdBy };
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.subject) {
      where.subject = filters.subject;
    }
    if (filters.status) {
      where.status = { equals: filters.status, mode: 'insensitive' };
    }
    return prisma.exam.findMany({
      where,
      include: {
        examQuestions: {
          include: {
            question: true
          }
        },
        attempts: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }

  static async countExams(createdBy: number, filters: { search?: string; subject?: string; status?: string }) {
    const where: Prisma.ExamWhereInput = { createdBy };
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.subject) {
      where.subject = filters.subject;
    }
    if (filters.status) {
      where.status = { equals: filters.status, mode: 'insensitive' };
    }
    return prisma.exam.count({ where });
  }

  static async getExamById(id: number) {
    return prisma.exam.findUnique({
      where: { id },
      include: {
        examQuestions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                optionsRel: true,
                mediaRel: true
              }
            }
          }
        },
        attempts: true
      }
    });
  }

  static async createExam(data: Prisma.ExamUncheckedCreateInput) {
    return prisma.exam.create({ data });
  }

  static async updateExam(id: number, data: Prisma.ExamUpdateInput) {
    return prisma.exam.update({
      where: { id },
      data
    });
  }

  static async deleteExam(id: number) {
    return prisma.exam.delete({
      where: { id }
    });
  }

  static async createExamQuestions(examId: number, questionIds: number[]) {
    // Clear old exam questions
    await prisma.examQuestion.deleteMany({
      where: { examId }
    });

    // Create new exam questions
    const examQuestionsData = questionIds.map((questionId, idx) => ({
      examId,
      questionId,
      order: idx + 1
    }));

    return prisma.examQuestion.createMany({
      data: examQuestionsData
    });
  }

  // --- QUESTION BANK QUERIES ---
  static async getQuestions(filters: { search?: string; subject?: string; topic?: string; difficulty?: string; createdBy?: number }, skip = 0, take = 10) {
    const where: Prisma.QuestionWhereInput = {};
    if (filters.search) {
      where.content = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.subject) {
      where.subject = { equals: filters.subject, mode: 'insensitive' };
    }
    if (filters.topic) {
      where.topic = { contains: filters.topic, mode: 'insensitive' };
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty as any;
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    return prisma.question.findMany({
      where,
      include: {
        optionsRel: true,
        mediaRel: true,
        creator: {
          select: { id: true, fullName: true }
        },
        _count: {
          select: { examQuestions: true, reports: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
  }

  static async countQuestions(filters: { search?: string; subject?: string; topic?: string; difficulty?: string; createdBy?: number }) {
    const where: Prisma.QuestionWhereInput = {};
    if (filters.search) {
      where.content = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.subject) {
      where.subject = { equals: filters.subject, mode: 'insensitive' };
    }
    if (filters.topic) {
      where.topic = { contains: filters.topic, mode: 'insensitive' };
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty as any;
    }
    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }
    return prisma.question.count({ where });
  }

  static async getQuestionById(id: number) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        optionsRel: true,
        mediaRel: true,
        creator: {
          select: { id: true, fullName: true }
        }
      }
    });
  }

  static async createQuestion(data: any) {
    const { options, media, ...questionData } = data;
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: questionData
      });

      if (options && options.length > 0) {
        await tx.questionOption.createMany({
          data: options.map((opt: any) => ({
            questionId: question.id,
            optionLabel: opt.label,
            optionText: opt.text,
            isCorrect: opt.isCorrect
          }))
        });
      }

      if (media && media.length > 0) {
        await tx.questionMedia.createMany({
          data: media.map((med: any) => ({
            questionId: question.id,
            url: med.url,
            mediaType: med.mediaType
          }))
        });
      }

      return question;
    });
  }

  static async updateQuestion(id: number, data: any) {
    const { options, media, ...questionData } = data;
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.update({
        where: { id },
        data: questionData
      });

      if (options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        if (options.length > 0) {
          await tx.questionOption.createMany({
            data: options.map((opt: any) => ({
              questionId: id,
              optionLabel: opt.label,
              optionText: opt.text,
              isCorrect: opt.isCorrect
            }))
          });
        }
      }

      if (media) {
        await tx.questionMedia.deleteMany({ where: { questionId: id } });
        if (media.length > 0) {
          await tx.questionMedia.createMany({
            data: media.map((med: any) => ({
              questionId: id,
              url: med.url,
              mediaType: med.mediaType
            }))
          });
        }
      }

      return question;
    });
  }

  // --- IMPORT SESSION QUERIES ---
  static async createImportSession(userId: number, fileName: string, fileSize: number, filePath: string) {
    return prisma.importSession.create({
      data: {
        userId,
        fileName,
        fileSize,
        filePath,
        status: 'PROCESSING'
      }
    });
  }

  static async getImportSessions(userId: number) {
    return prisma.importSession.findMany({
      where: { userId },
      include: {
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getImportSessionById(id: number) {
    return prisma.importSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: 'asc' }
        }
      }
    });
  }

  static async updateImportSession(id: number, data: Prisma.ImportSessionUpdateInput) {
    return prisma.importSession.update({
      where: { id },
      data
    });
  }

  static async createImportQuestions(sessionId: number, questions: any[]) {
    return prisma.importQuestion.createMany({
      data: questions.map((q) => ({
        sessionId,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'MEDIUM',
        status: q.status || 'OK',
        statusDetails: q.statusDetails || null,
        similarityScore: q.similarityScore || null,
        duplicateOfId: q.duplicateOfId || null,
        media: q.media && q.media.length > 0 ? q.media : undefined
      }))
    });
  }

  static async getImportQuestionById(id: number) {
    return prisma.importQuestion.findUnique({
      where: { id }
    });
  }

  static async updateImportQuestion(id: number, data: Prisma.ImportQuestionUpdateInput) {
    return prisma.importQuestion.update({
      where: { id },
      data
    });
  }

  static async deleteImportSession(id: number) {
    return prisma.importSession.delete({
      where: { id }
    });
  }

  // --- REPORT QUERIES ---
  static async getReportsByOwner(ownerId: number) {
    return prisma.questionReport.findMany({
      where: {
        question: {
          createdBy: ownerId
        }
      },
      include: {
        question: true,
        reporter: {
          select: { id: true, fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createReport(data: Prisma.QuestionReportUncheckedCreateInput) {
    return prisma.questionReport.create({ data });
  }

  static async updateReport(id: number, data: Prisma.QuestionReportUpdateInput) {
    return prisma.questionReport.update({
      where: { id },
      data
    });
  }

  // --- METRICS QUERIES ---
  static async getTeacherMetrics(createdBy: number) {
    const totalExams = await prisma.exam.count({ where: { createdBy } });
    const publishedExams = await prisma.exam.count({ where: { createdBy, status: { equals: 'published', mode: 'insensitive' } } });
    const draftExams = await prisma.exam.count({ where: { createdBy, status: { equals: 'draft', mode: 'insensitive' } } });
    const pendingExams = await prisma.exam.count({ where: { createdBy, status: { equals: 'pending', mode: 'insensitive' } } });

    const totalQuestions = await prisma.question.count({ where: { createdBy } });
    const processingImports = await prisma.importSession.count({ where: { userId: createdBy, status: 'PROCESSING' } });

    return {
      totalExams,
      publishedExams,
      draftExams,
      pendingExams,
      totalQuestions,
      processingImports
    };
  }
}
