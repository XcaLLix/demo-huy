import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Difficulty } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// Helper to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawOption {
  option_label: string;
  option_text: string;
  is_correct: boolean;
}

interface RawQuestion {
  question_number: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  explanation?: string;
  topic?: string;
  options: RawOption[];
}

interface RawExam {
  title: string;
  subject_slug: string;
  subject_name: string;
  year: number;
  exam_code: string;
  exam_type: string;
  source: string;
  duration_minutes: number;
  total_questions: number;
  description?: string;
  pdf_url?: string;
  official_answer_key_url?: string;
  questions: RawQuestion[];
}

/**
 * Validates the parsed exam JSON structure.
 * Returns true if valid, throws an error if invalid.
 */
export function validateExamData(examData: any): examData is RawExam {
  if (!examData.title || typeof examData.title !== 'string') {
    throw new Error('Thiếu hoặc sai định dạng trường "title"');
  }
  if (!examData.subject_name || typeof examData.subject_name !== 'string') {
    throw new Error('Thiếu hoặc sai định dạng trường "subject_name"');
  }
  if (typeof examData.year !== 'number') {
    throw new Error('Thiếu hoặc sai định dạng trường "year"');
  }
  if (typeof examData.duration_minutes !== 'number') {
    throw new Error('Thiếu hoặc sai định dạng trường "duration_minutes"');
  }
  if (!Array.isArray(examData.questions) || examData.questions.length === 0) {
    throw new Error('Trường "questions" phải là mảng và không được trống');
  }

  // Validate questions
  for (let i = 0; i < examData.questions.length; i++) {
    const q = examData.questions[i];
    const prefix = `Câu ${i + 1}: `;
    if (!q.question_text || typeof q.question_text !== 'string') {
      throw new Error(`${prefix}Thiếu hoặc sai định dạng trường "question_text"`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`${prefix}Mảng "options" phải có ít nhất 2 phương án lựa chọn`);
    }

    let correctCount = 0;
    for (const opt of q.options) {
      if (!opt.option_label || typeof opt.option_label !== 'string') {
        throw new Error(`${prefix}Mỗi option phải có "option_label" (A, B, C, D)`);
      }
      if (opt.is_correct === true) {
        correctCount++;
      }
    }

    if (correctCount === 0) {
      throw new Error(`${prefix}Chưa cấu hình đáp án đúng (is_correct = true)`);
    }
  }

  return true;
}

/**
 * Maps Vietnamese difficulty levels to Database enum values.
 */
function mapDifficulty(diff: string): Difficulty {
  const clean = diff.trim().toLowerCase();
  if (clean === 'dễ' || clean === 'easy') return Difficulty.EASY;
  if (clean === 'khó' || clean === 'hard') return Difficulty.HARD;
  return Difficulty.MEDIUM;
}

/**
 * Imports an exam from a JS object directly (e.g. from an API request).
 */
export async function importExamFromObject(examData: any, creatorId: number): Promise<number> {
  // Validate schema
  validateExamData(examData);

  // 1. Check if exam already exists (avoid duplicates)
  let dbExam = await prisma.exam.findFirst({
    where: {
      title: examData.title,
      subject: examData.subject_name,
      year: examData.year
    }
  });

  if (dbExam) {
    console.log(`[Importer] Đề thi "${examData.title}" đã tồn tại. Đang xóa bản ghi cũ để import mới...`);
    await prisma.exam.delete({ where: { id: dbExam.id } });
  }

  // 2. Map group combo based on subject
  let subjectGroup = 'A01';
  if (examData.subject_slug === 'tieng-anh' || examData.subject_slug === 'anh') {
    subjectGroup = 'D01';
  } else if (examData.subject_slug === 'hoa-hoc' || examData.subject_slug === 'sinh-hoc') {
    subjectGroup = 'B00';
  }

  const user = await prisma.user.findUnique({ where: { id: creatorId } });
  const examStatus = user?.role === 'TEACHER' ? 'pending' : 'published';

  // 3. Create new Exam
  dbExam = await prisma.exam.create({
    data: {
      title: examData.title,
      subject: examData.subject_name,
      subjectGroup: subjectGroup,
      duration: examData.duration_minutes,
      isPublic: true,
      createdBy: creatorId,
      year: examData.year,
      source: examData.source || 'Bộ GD&ĐT',
      totalQuestions: examData.total_questions || examData.questions.length,
      difficulty: mapDifficulty(examData.questions[0]?.difficulty || 'Trung bình'),
      status: examStatus,
      grade: examData.grade ? Number(examData.grade) : null
    }
  });

  console.log(`[Importer] Đã tạo đề thi ID: ${dbExam.id} - ${dbExam.title}`);

  // 4. Create and map questions
  for (let i = 0; i < examData.questions.length; i++) {
    const q = examData.questions[i];
    const correctOpt = q.options.find((o: any) => o.is_correct);
    const correctAnswer = correctOpt ? correctOpt.option_label : 'A';

    // Format options to match DB Question Json options format
    const formattedOptions = q.options.map((o: any) => ({
      label: o.option_label,
      text: o.option_text
    }));

    // Create the Question
    const dbQuestion = await prisma.question.create({
      data: {
        content: q.question_text,
        options: formattedOptions,
        correctAnswer: correctAnswer,
        explanation: q.explanation || '',
        subject: examData.subject_name,
        topic: q.topic || 'Chuyên đề ôn thi',
        difficulty: mapDifficulty(q.difficulty),
        createdBy: creatorId,
        imageUrl: q.imageUrl || q.question_image_url || null,
        audioUrl: q.audioUrl || q.audio_url || null
      }
    });

    // Link Question to Exam
    await prisma.examQuestion.create({
      data: {
        examId: dbExam.id,
        questionId: dbQuestion.id,
        order: q.question_number || (i + 1)
      }
    });
  }

  console.log(`[Importer] Nhập thành công ${examData.questions.length} câu hỏi cho đề "${examData.title}".`);
  return dbExam.id;
}

/**
 * Imports a single exam from a JSON file.
 */
export async function importExamsFromJson(filePath: string): Promise<number> {
  console.log(`[Importer] Đang đọc file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const examData = JSON.parse(content);

  // Check if admin user exists to link createdBy
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  if (!adminUser) {
    // Fallback if no admin, get first user
    adminUser = await prisma.user.findFirst();
  }
  const creatorId = adminUser ? adminUser.id : 1;

  return importExamFromObject(examData, creatorId);
}

/**
 * Scans directories and seeds all mock exams from the JSON folders.
 */
export async function seedRealExamData() {
  console.log('[Importer] Khởi động tiến trình quét thư mục chứa đề thi thật...');
  
  // Resolve path to /data/exams
  const rootDataDir = path.resolve(__dirname, '../../../../data/exams');
  
  if (!fs.existsSync(rootDataDir)) {
    console.warn(`[Importer Warning] Thư mục ${rootDataDir} không tồn tại. Bỏ qua seeding.`);
    return;
  }

  const subjects = fs.readdirSync(rootDataDir);
  let importedCount = 0;

  for (const subjFolder of subjects) {
    const subjPath = path.join(rootDataDir, subjFolder);
    if (!fs.statSync(subjPath).isDirectory()) continue;

    const files = fs.readdirSync(subjPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(subjPath, file);
      try {
        await importExamsFromJson(filePath);
        importedCount++;
      } catch (err: any) {
        console.error(`[Importer Error] Lỗi khi import file ${file}:`, err.message);
      }
    }
  }

  console.log(`[Importer] Hoàn tất tiến trình! Đã nhập thành công ${importedCount} đề thi thật vào database.`);
}
