import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getSubjectGroupForSubject, getSubjectsForSubjectGroup } from '../utils/subjectClassifier.js';
import { extractTextFromFile } from '../utils/rag.js';
import path from 'path';

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

async function syncLessonDocumentAndRAG(lessonId: number, content: string, teacherId: number) {
  if (!content) return content;

  // Check if content is an uploaded document URL
  if (content.includes('/uploads/')) {
    try {
      const filename = content.substring(content.lastIndexOf('/') + 1);
      const resolvedUploadsDir = path.resolve(process.cwd(), 'uploads');
      const localFilePath = path.join(resolvedUploadsDir, filename);
      const ext = filename.split('.').pop()?.toLowerCase() || '';

      console.log(`[RAG Sync] Detected document file: ${filename}. Extracting text content...`);
      const extractedText = await extractTextFromFile(localFilePath, ext);

      if (extractedText) {
        // Sync document to database if not already linked
        const existingDoc = await prisma.document.findFirst({
          where: { lessonId, fileUrl: content }
        });

        if (!existingDoc) {
          await prisma.document.create({
            data: {
              title: filename,
              fileUrl: content,
              fileType: ext.toUpperCase(),
              lessonId,
              uploadedBy: teacherId
            }
          });
          console.log(`[RAG Sync] Document ${filename} linked to Lesson ${lessonId}`);
        }

        // Return extracted text as new content value to store as context in Lesson
        return extractedText;
      }
    } catch (err: any) {
      console.error('[RAG Sync Error] Failed to sync and parse file:', err.message);
    }
  }
  return content;
}

export async function updateLesson(req: AuthRequest, res: Response) {
  const lessonId = Number(req.params.id);
  const { title, order, videoUrl, content, duration } = req.body;
  const teacherId = req.user?.id || 0;

  try {
    let finalContent = content;
    if (content !== undefined) {
      finalContent = await syncLessonDocumentAndRAG(lessonId, content, teacherId);
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title ? { title } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
        ...(videoUrl !== undefined ? { videoUrl } : {}),
        ...(content !== undefined ? { content: finalContent } : {}),
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
  const teacherId = req.user?.id || 0;

  try {
    let tempLesson = await prisma.lesson.create({
      data: {
        courseId: Number(courseId),
        title,
        order: Number(order),
        videoUrl: videoUrl || null,
        content: '', // temporary
        duration: duration || '15m'
      }
    });

    let finalContent = content;
    if (content) {
      finalContent = await syncLessonDocumentAndRAG(tempLesson.id, content, teacherId);
    }

    const newLesson = await prisma.lesson.update({
      where: { id: tempLesson.id },
      data: {
        content: finalContent || null
      }
    });

    return res.status(201).json({ success: true, data: newLesson });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createCourseReview(req: AuthRequest, res: Response) {
  const courseId = Number(req.params.id);
  const userId = req.user?.id || 0;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Đánh giá phải từ 1 đến 5 sao.' });
  }

  try {
    const existing = await prisma.review.findFirst({
      where: { courseId, studentId: userId }
    });

    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating: Number(rating), comment: comment || null }
      });
    } else {
      review = await prisma.review.create({
        data: {
          courseId,
          studentId: userId,
          rating: Number(rating),
          comment: comment || null
        }
      });
    }

    return res.status(200).json({ success: true, data: review });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function aiSearchCourses(req: AuthRequest, res: Response) {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Thiếu câu hỏi tìm kiếm!' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Chưa cấu hình API Key OpenRouter!' });
  }

  try {
    const systemPrompt = `You are a helper that extracts filter conditions from THPT student questions into a clean JSON structure.
DO NOT write any explanations. Output ONLY the JSON block. No comments inside the JSON.

Standard subjects: "Toán học", "Vật lý", "Hóa học", "Sinh học", "Tiếng Anh", "Ngữ văn"
Standard levels: "Cơ bản", "Nâng cao", "Cấp tốc", "Mất gốc"
Standard exam blocks: "A00", "A01", "B00", "C00", "D01"

Required JSON format:
{
  "subjects": [],
  "level": null,
  "examBlock": null,
  "budgetMax": null,
  "durationMaxHours": null,
  "durationMinHours": null,
  "learningGoal": null,
  "keywords": []
}

Example Input: "Tôi thi khối A00, còn 3 tháng, ngân sách dưới 500.000đ."
Example Output:
{
  "subjects": [],
  "level": "Cấp tốc",
  "examBlock": "A00",
  "budgetMax": 500000,
  "durationMaxHours": null,
  "durationMinHours": null,
  "learningGoal": "Ôn thi khối A00",
  "keywords": ["khối A00", "cấp tốc"]
}

Example Input: "Tôi mất gốc Toán lớp 12, nên học khóa nào?"
Example Output:
{
  "subjects": ["Toán học"],
  "level": "Mất gốc",
  "examBlock": null,
  "budgetMax": null,
  "durationMaxHours": null,
  "durationMinHours": null,
  "learningGoal": "Lấy lại gốc Toán",
  "keywords": ["mất gốc", "Toán 12"]
}

Output ONLY the JSON object. Do not output anything else.`;

    const openRouterModel = process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edupath.vn',
        'X-Title': 'EduPath AI Course Search'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`OpenRouter API error: ${errText}`);
    }

    const data = (await aiResponse.json()) as any;
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('AI returned empty response');
    }

    let parsedCriteria: any = {};
    try {
      const startIdx = content.indexOf('{');
      const endIdx = content.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
        throw new Error('Could not find JSON object in response');
      }
      const jsonStr = content.substring(startIdx, endIdx + 1);
      parsedCriteria = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse AI output:', content);
      throw new Error('Không thể phân tích phản hồi từ AI thành cấu trúc điều kiện lọc!');
    }

    // 2. Query database using criteria
    const allCourses = await prisma.course.findMany({
      where: {
        isApproved: true,
        status: 'APPROVED',
        visibility: 'VISIBLE'
      },
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
            duration: true
          }
        },
        reviews: true,
        enrollments: true
      }
    });

    let filtered = allCourses;

    // Subjects and Exam Block
    let targetSubjects = parsedCriteria.subjects || [];
    if (targetSubjects.length === 0 && parsedCriteria.examBlock) {
      targetSubjects = getSubjectsForSubjectGroup(parsedCriteria.examBlock);
    }

    if (targetSubjects.length > 0) {
      const targetLower = targetSubjects.map((s: string) => s.toLowerCase().replace(' học', ''));
      filtered = filtered.filter(c => {
        const cSubLower = c.subject.toLowerCase().replace(' học', '');
        return targetLower.some((t: string) => cSubLower.includes(t) || t.includes(cSubLower));
      });
    }

    // BudgetMax
    if (typeof parsedCriteria.budgetMax === 'number' && parsedCriteria.budgetMax !== null) {
      filtered = filtered.filter(c => {
        const finalPrice = c.price * (1 - (c.discount || 0) / 100);
        return finalPrice <= parsedCriteria.budgetMax;
      });
    }

    // Level
    if (parsedCriteria.level) {
      const searchLevel = parsedCriteria.level.toLowerCase();
      filtered = filtered.filter(c => {
        const dbLevel = (c.level || '').toLowerCase();
        if (dbLevel.includes(searchLevel)) return true;

        const cTitle = c.title.toLowerCase();
        const cDesc = c.description.toLowerCase();
        
        if (searchLevel === 'mất gốc') {
          return cTitle.includes('mất gốc') || cTitle.includes('căn bản') || cTitle.includes('cơ bản') ||
                 cDesc.includes('mất gốc') || cDesc.includes('căn bản') || cDesc.includes('cơ bản') ||
                 cTitle.includes('lấy lại');
        }
        
        return cTitle.includes(searchLevel) || cDesc.includes(searchLevel);
      });
    }

    // Duration max/min in hours
    filtered = filtered.filter(c => {
      let totalMin = 0;
      c.lessons.forEach(l => {
        const m = parseInt(l.duration?.split(':')[0] || '0', 10);
        if (!isNaN(m)) totalMin += m;
      });
      const durationHours = totalMin > 0 ? Math.ceil(totalMin / 60) : 12;

      if (typeof parsedCriteria.durationMaxHours === 'number' && parsedCriteria.durationMaxHours !== null) {
        if (durationHours > parsedCriteria.durationMaxHours) return false;
      }
      if (typeof parsedCriteria.durationMinHours === 'number' && parsedCriteria.durationMinHours !== null) {
        if (durationHours < parsedCriteria.durationMinHours) return false;
      }
      return true;
    });

    // Score and filter based on keywords
    if (parsedCriteria.keywords && parsedCriteria.keywords.length > 0) {
      const kws = parsedCriteria.keywords.map((k: string) => k.toLowerCase());
      const scored = filtered.map(c => {
        let score = 0;
        const text = `${c.title} ${c.description} ${c.subject}`.toLowerCase();
        kws.forEach((k: string) => {
          if (text.includes(k)) score += 2;
        });
        return { course: c, score };
      });
      
      if (targetSubjects.length === 0) {
        filtered = scored.filter(s => s.score > 0).map(s => s.course);
      } else {
        scored.sort((a, b) => b.score - a.score);
        filtered = scored.map(s => s.course);
      }
    }

    const mappedList = filtered.map(c => ({
      ...c,
      subjectGroup: getSubjectGroupForSubject(c.subject)
    }));

    return res.status(200).json({ 
      success: true, 
      data: mappedList,
      criteria: parsedCriteria 
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


