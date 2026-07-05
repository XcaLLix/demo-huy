import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { incrementBothStats } from '../lib/monthlyStats.js';
import { logSystemEvent } from '../utils/logger.js';
import { SystemSettingService } from '../services/systemSetting.service.js';
import fs from 'fs';

// Bộ đếm lượt hỏi AI trong ngày của học sinh (Reset hàng ngày)
const dailyQuestionCounter = new Map<number, { count: number; date: string }>();
import path from 'path';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse;


// Helper to process SSE lines from OpenRouter
function processLines(buffer: string, res: Response): string {
  const lines = buffer.split('\n');
  const lastLine = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === 'data: [DONE]') continue;
    if (trimmed.startsWith('data: ')) {
      try {
        const jsonStr = trimmed.slice(6);
        const parsed = JSON.parse(jsonStr);
        const text = parsed.choices?.[0]?.delta?.content || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } catch (e) {
        // Ignored, might be incomplete JSON chunk
      }
    }
  }
  return lastLine;
}

// Server-Sent Events (SSE) AI Streaming Chat
export async function streamAIChat(req: AuthRequest, res: Response) {
  const { message } = req.body;
  const studentId = req.user?.id;
  const role = req.user?.role?.toUpperCase();

  // Kiểm tra giới hạn câu hỏi AI miễn phí của học sinh
  if (studentId && role === 'STUDENT') {
    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (user && !user.isPro) {
      const todayStr = new Date().toISOString().split('T')[0];
      const maxLimit = SystemSettingService.getNumber('FREE_AI_QUESTION_LIMIT') || 20;

      const record = dailyQuestionCounter.get(studentId) || { count: 0, date: todayStr };
      if (record.date !== todayStr) {
        record.count = 0;
        record.date = todayStr;
      }

      if (record.count >= maxLimit) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        res.write(`data: ${JSON.stringify({ text: `Bạn đã đạt giới hạn ${maxLimit} câu hỏi AI miễn phí trong ngày hôm nay. Hãy nâng cấp tài khoản Premium để hỏi không giới hạn!` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      record.count++;
      dailyQuestionCounter.set(studentId, record);
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ text: "Hệ thống AI Gia sư đang bảo trì (thiếu cấu hình API Key)." })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const systemPrompt = {
    role: 'system',
    content: 'Bạn là EduBot. Trả lời cực ngắn gọn (dưới 10 từ) bằng tiếng Việt.'
  };

  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
    res.end();
  });

  const slicedMessage = message ? String(message).substring(0, 60) : '';

  try {
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edupath.vn',
        'X-Title': 'EduPath AI Tutor'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          systemPrompt,
          { role: 'user', content: slicedMessage }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 40
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 402 || response.status === 404 || errText.includes('credits') || errText.includes('402') || errText.includes('unavailable')) {
        console.warn(`[AI Tutor Fallback] Out of credits or model unavailable. Retrying with free model router...`);
        const fallbackModel = 'openrouter/free';
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://edupath.vn',
            'X-Title': 'EduPath AI Tutor'
          },
          body: JSON.stringify({
            model: fallbackModel,
            messages: [
              systemPrompt,
              { role: 'user', content: slicedMessage }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 40
          }),
          signal: abortController.signal
        });
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI Tutor SSE Error] OpenRouter status ${response.status}: ${errText}`);
      res.write(`data: ${JSON.stringify({ text: `Lỗi kết nối AI (${response.status}). Vui lòng thử lại.` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    if (!response.body) {
      res.write(`data: ${JSON.stringify({ text: "Không nhận được phản hồi từ AI." })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (typeof (response.body as any).getReader === 'function') {
      const reader = (response.body as any).getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = processLines(buffer, res);
      }
    } else {
      for await (const chunk of response.body as any) {
        buffer += decoder.decode(chunk, { stream: true });
        buffer = processLines(buffer, res);
      }
    }

    if (buffer.trim()) {
      processLines(buffer + '\n', res);
    }

    res.write('data: [DONE]\n\n');

    // Cập nhật thống kê hàng tháng
    try {
      const now = new Date();
      await incrementBothStats('totalAiQuestions', now);
    } catch (statErr) {
      console.error('[MonthlyStats] Lỗi cập nhật totalAiQuestions:', statErr);
    }

    res.end();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('[AI Tutor SSE] Request aborted by client.');
      return;
    }
    console.error('[AI Tutor SSE Exception]', err);
    res.write(`data: ${JSON.stringify({ text: "Đã xảy ra sự cố khi kết nối với máy chủ AI. Vui lòng thử lại sau." })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// Refresh Adaptive Study Roadmap based on recent performance
export async function refreshRoadmap(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    // Scan attempts
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId },
      include: {
        exam: true,
        attemptAnswers: {
          include: {
            question: true
          }
        }
      }
    });

    // 1. Group performance by subject
    const subjectStats: Record<string, { total: number; correct: number; topics: Record<string, { total: number; correct: number }> }> = {
      'Toán học': { total: 0, correct: 0, topics: {} },
      'Vật lý': { total: 0, correct: 0, topics: {} },
      'Hóa học': { total: 0, correct: 0, topics: {} },
      'Tiếng Anh': { total: 0, correct: 0, topics: {} },
    };

    attempts.forEach(attempt => {
      const subject = attempt.exam.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0, topics: {} };
      }

      attempt.attemptAnswers.forEach(ans => {
        const q = ans.question;
        const topic = q.topic || 'Chung';

        // Overall subject stats
        subjectStats[subject].total++;
        if (ans.isCorrect) {
          subjectStats[subject].correct++;
        }

        // Topic specific stats
        if (!subjectStats[subject].topics[topic]) {
          subjectStats[subject].topics[topic] = { total: 0, correct: 0 };
        }
        subjectStats[subject].topics[topic].total++;
        if (ans.isCorrect) {
          subjectStats[subject].topics[topic].correct++;
        }
      });
    });

    // 2. Generate roadmap content for each key subject
    const subjectsList = ['Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh'];
    const roadmapSubjects: Record<string, any> = {};

    subjectsList.forEach(subject => {
      const stats = subjectStats[subject];
      let confidence = 60; // default baseline when no attempts
      const weakTopics: string[] = [];
      const strongTopics: string[] = [];

      if (stats && stats.total > 0) {
        confidence = Math.round((stats.correct / stats.total) * 100);
        
        Object.keys(stats.topics).forEach(topic => {
          const tStats = stats.topics[topic];
          const acc = tStats.correct / tStats.total;
          if (acc < 0.6) {
            weakTopics.push(topic);
          } else if (acc > 0.8) {
            strongTopics.push(topic);
          }
        });
      }

      // Populate default priority topics if none found
      if (weakTopics.length === 0) {
        if (subject === 'Toán học') weakTopics.push('Khảo sát & cực trị hàm số');
        else if (subject === 'Vật lý') weakTopics.push('Dao động điều hòa & con lắc lò xo');
        else if (subject === 'Hóa học') weakTopics.push('Lý thuyết Este & phản ứng thủy phân');
        else if (subject === 'Tiếng Anh') weakTopics.push('Chia thì & câu hỏi đuôi');
      }

      // Build personalized weekly plans per subject
      let weeklyPlan = [];
      if (subject === 'Toán học') {
        weeklyPlan = [
          {
            week: "Tuần 1",
            focus: "Vá lỗ hổng: Khảo sát hàm số & Cực đại cực tiểu",
            status: "active",
            targetScore: "Bứt phá điểm 8+",
            concepts: [
              "Quy tắc xét tính đơn điệu bằng đạo hàm y'",
              "Cách xác định điểm cực trị qua bảng biến thiên",
              "Giải nhanh tiệm cận đứng và tiệm cận ngang"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Học lý thuyết tính đơn điệu hàm số", estimatedMinutes: 30, courseId: 1, lessonId: 1 },
              { day: "Thứ 4", task: "Luyện 15 câu trắc nghiệm cực trị nâng cao", estimatedMinutes: 45, courseId: 1, lessonId: 2 },
              { day: "Thứ 6", task: "Giải đề mini khảo sát hàm số, xem AI giải thích lỗi sai", estimatedMinutes: 25 }
            ]
          },
          {
            week: "Tuần 2",
            focus: "Chuyên đề Hàm số mũ & Lôgarit có chứa tham số m",
            status: "locked",
            targetScore: "Vươn tới điểm 9.0+",
            concepts: [
              "Công thức đổi cơ số logarit và biến đổi mũ",
              "Đặt ẩn phụ giải phương trình mũ bậc hai",
              "Biện luận nghiệm logarit bằng phương pháp cô lập m"
            ],
            dailyTasks: [
              { day: "Thứ 3", task: "Xem lý thuyết Hàm số mũ và lôgarit", estimatedMinutes: 40 },
              { day: "Thứ 5", task: "Hoàn thành bài tập tự luyện trắc nghiệm mức 8+", estimatedMinutes: 50 }
            ]
          },
          {
            week: "Tuần 3",
            focus: "Tổng ôn Nguyên hàm & Tích phân và Ứng dụng hình học",
            status: "locked",
            targetScore: "Giữ vững điểm 9.2+",
            concepts: [
              "Phương pháp nguyên hàm từng phần và đổi biến số",
              "Tính diện tích hình phẳng giới hạn bởi đồ thị",
              "Tính thể tích vật thể tròn xoay"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Học công thức tích phân cơ bản", estimatedMinutes: 35 },
              { day: "Thứ 4", task: "Ứng dụng hình học của tích phân để giải đề THPTQG", estimatedMinutes: 45 }
            ]
          }
        ];
      } else if (subject === 'Vật lý') {
        weeklyPlan = [
          {
            week: "Tuần 1",
            focus: "Tổng ôn Dao động cơ học và Con lắc lò xo",
            status: "active",
            targetScore: "Bứt phá điểm 8.0+",
            concepts: [
              "Phương trình dao động điều hòa li độ x, vận tốc v, gia tốc a",
              "Tính chu kỳ, tần số góc của con lắc lò xo nằm ngang và treo đứng",
              "Biểu thức năng lượng: Động năng, Thế năng và Cơ năng bảo toàn"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Xem video bài giảng Dao động điều hòa căn bản", estimatedMinutes: 30, courseId: 3, lessonId: 11 },
              { day: "Thứ 4", task: "Giải đề trắc nghiệm con lắc lò xo và con lắc đơn", estimatedMinutes: 40, courseId: 3, lessonId: 12 },
              { day: "Thứ 6", task: "Thi thử mini-test kiểm tra mức độ ghi nhớ công thức", estimatedMinutes: 20 }
            ]
          },
          {
            week: "Tuần 2",
            focus: "Chuyên đề Sóng cơ học & Giao thoa sóng",
            status: "locked",
            targetScore: "Đạt 8.5+",
            concepts: [
              "Định nghĩa bước sóng, độ lệch pha giữa hai điểm trên phương truyền",
              "Điều kiện cực đại, cực tiểu giao thoa của hai nguồn cùng pha",
              "Đặc trưng sinh lí và vật lí của sóng âm"
            ],
            dailyTasks: [
              { day: "Thứ 3", task: "Học lý thuyết sự truyền sóng cơ", estimatedMinutes: 35 },
              { day: "Thứ 5", task: "Bài tập tìm số điểm dao động cực đại trên đoạn thẳng nối 2 nguồn", estimatedMinutes: 45 }
            ]
          },
          {
            week: "Tuần 3",
            focus: "Dòng điện xoay chiều RLC nối tiếp và cực trị điện xoay chiều",
            status: "locked",
            targetScore: "Chinh phục điểm 9.0+",
            concepts: [
              "Vẽ giản đồ vectơ trượt để giải mạch điện xoay chiều",
              "Hiện tượng cộng hưởng điện và điều kiện cộng hưởng",
              "Hệ số công suất tiêu thụ của đoạn mạch RLC"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Nắm vững công thức cảm kháng, dung kháng và tổng trở Z", estimatedMinutes: 40 },
              { day: "Thứ 4", task: "Bài tập hệ số công suất và công suất cực đại", estimatedMinutes: 50 }
            ]
          }
        ];
      } else if (subject === 'Hóa học') {
        weeklyPlan = [
          {
            week: "Tuần 1",
            focus: "Vá lý thuyết trọng tâm Este - Lipit & Phản ứng xà phòng hóa",
            status: "active",
            targetScore: "Bứt phá điểm 8.5+",
            concepts: [
              "Khái niệm, danh pháp và tính chất vật lý của Este",
              "Phản ứng thủy phân este trong môi trường axit và kiềm",
              "Cấu tạo chất béo, công thức tính nhanh muối khi xà phòng hóa"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Xem bài giảng lý thuyết Este căn bản", estimatedMinutes: 25, courseId: 2, lessonId: 6 },
              { day: "Thứ 4", task: "Luyện bài tập xà phòng hóa và hiệu suất phản ứng", estimatedMinutes: 45, courseId: 2, lessonId: 8 },
              { day: "Thứ 6", task: "Làm 20 câu hỏi lý thuyết Este đếm mệnh đề đúng sai", estimatedMinutes: 30 }
            ]
          },
          {
            week: "Tuần 2",
            focus: "Chuyên đề Cacbohiđrat & Polime",
            status: "locked",
            targetScore: "Đạt 9.0+",
            concepts: [
              "Phân biệt Glucozơ, Fructozơ, Saccarozơ, Tinh bột và Xenlulozơ",
              "Phản ứng tráng gương của Glucozơ và thủy phân Saccarozơ",
              "Phân loại tơ thiên nhiên, tơ nhân tạo và polime trùng hợp/trùng ngưng"
            ],
            dailyTasks: [
              { day: "Thứ 3", task: "Học sơ đồ tư duy Cacbohiđrat", estimatedMinutes: 30 },
              { day: "Thứ 5", task: "Hoàn thành 30 câu trắc nghiệm tổng ôn Polime lý thuyết", estimatedMinutes: 35 }
            ]
          },
          {
            week: "Tuần 3",
            focus: "Tổng ôn Amin, Amino Axit, Protein & Chuỗi phản ứng hữu cơ",
            status: "locked",
            targetScore: "Đạt 9.5+",
            concepts: [
              "Tính bazơ của các amin và ảnh hưởng của gốc hiđrocacbon",
              "Tính lưỡng tính của amino axit (tác dụng axit và kiềm)",
              "Phản ứng màu biure đặc trưng của peptit và protein"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Học tính chất amino axit và phương pháp peptit hóa", estimatedMinutes: 45 },
              { day: "Thứ 4", task: "Giải bài toán đốt cháy amin, amino axit", estimatedMinutes: 50 }
            ]
          }
        ];
      } else {
        // Tiếng Anh
        weeklyPlan = [
          {
            week: "Tuần 1",
            focus: "Hệ thống Ngữ pháp trọng tâm & Câu hỏi đuôi (Tag Questions)",
            status: "active",
            targetScore: "Bứt phá điểm 8.0+",
            concepts: [
              "Quy tắc cấu tạo câu hỏi đuôi theo các thì trong tiếng Anh",
              "Các trường hợp đặc biệt của câu hỏi đuôi (Let's, I am, Wish...)",
              "Phân biệt cách chia các thì hoàn thành và thì tiếp diễn"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Xem lý thuyết và các ví dụ câu hỏi đuôi đặc biệt", estimatedMinutes: 20 },
              { day: "Thứ 4", task: "Giải 50 câu trắc nghiệm ngữ pháp chọn lọc đề THPTQG", estimatedMinutes: 35 },
              { day: "Thứ 6", task: "Luyện bài tập điền từ và sửa lỗi sai ngữ pháp", estimatedMinutes: 25 }
            ]
          },
          {
            week: "Tuần 2",
            focus: "Phương pháp giải bài đọc điền từ & Đọc hiểu (Reading Comprehension)",
            status: "locked",
            targetScore: "Đạt 8.5+",
            concepts: [
              "Kỹ thuật đọc lướt (Skimming) để tìm ý chính toàn đoạn",
              "Kỹ thuật đọc quét (Scanning) tìm từ khóa và chi tiết số liệu",
              "Phân tích ngữ cảnh tìm từ đồng nghĩa/trái nghĩa trong văn bản"
            ],
            dailyTasks: [
              { day: "Thứ 3", task: "Luyện 3 bài đọc hiểu mức độ Thông hiểu", estimatedMinutes: 35 },
              { day: "Thứ 5", task: "Phân tích chiến thuật làm bài đọc điền từ vào đoạn văn", estimatedMinutes: 40 }
            ]
          },
          {
            week: "Tuần 3",
            focus: "Ngữ âm & Trọng âm cùng Chuyên đề Từ vựng (Vocabulary)",
            status: "locked",
            targetScore: "Chinh phục điểm 9.0+",
            concepts: [
              "Quy tắc phát âm đuôi -s/-es và phát âm đuôi -ed chuẩn xác",
              "Quy tắc nhấn trọng âm của từ có 2 âm tiết và từ có 3 âm tiết trở lên",
              "Học các cụm từ cố định (Collocations) phổ biến trong đề thi"
            ],
            dailyTasks: [
              { day: "Thứ 2", task: "Học quy tắc phát âm và trọng âm cơ bản", estimatedMinutes: 30 },
              { day: "Thứ 4", task: "Luyện tập 100 từ collocations thông dụng nhất", estimatedMinutes: 45 }
            ]
          }
        ];
      }

      roadmapSubjects[subject] = {
        confidence,
        priorityTopics: weakTopics,
        weeklyPlan,
        motivationalMessage: getMotivationalMessage(subject, confidence)
      };
    });

    const adaptiveRoadmapContent = {
      subjects: roadmapSubjects,
      overallWeaknesses: getOverallWeaknesses(roadmapSubjects),
      generatedAt: new Date().toISOString()
    };

    const roadmap = await prisma.roadmap.upsert({
      where: { studentId },
      update: {
        content: adaptiveRoadmapContent,
        generatedAt: new Date()
      },
      create: {
        studentId,
        content: adaptiveRoadmapContent,
        generatedAt: new Date()
      }
    });

    return res.status(200).json({ success: true, data: roadmap });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Helpers
function getMotivationalMessage(subject: string, confidence: number): string {
  if (confidence >= 80) {
    return `Phong độ môn ${subject} của em cực kỳ xuất sắc! Hãy tiếp tục duy trì và bứt phá các chủ đề nâng cao để đạt điểm số tuyệt đối nhé.`;
  }
  if (confidence >= 60) {
    return `Nền tảng môn ${subject} của em khá vững vàng. Cố gắng củng cố thêm các phần lý thuyết còn yếu để nâng cao điểm số lên mức giỏi nhé!`;
  }
  return `Môn ${subject} cần được chú trọng ôn luyện nhiều hơn em nhé. Hãy làm theo đúng lộ trình gợi ý của thầy cô để vá các lỗ hổng kiến thức kịp thời!`;
}

function getOverallWeaknesses(subjects: Record<string, any>): string[] {
  const list: string[] = [];
  Object.keys(subjects).forEach(subj => {
    const sObj = subjects[subj];
    if (sObj.confidence < 70 && sObj.priorityTopics) {
      sObj.priorityTopics.forEach((t: string) => {
        if (!list.includes(t)) list.push(`${subj}: ${t}`);
      });
    }
  });
  if (list.length === 0) {
    list.push("Chưa phát hiện điểm yếu lớn. Phong độ rất ổn định!");
  }
  return list;
}


// AI Question Generator for target study topics
export async function generateAIQuestions(req: AuthRequest, res: Response) {
  const { subject, topic, difficulty, count } = req.body;

  try {
    // Return sample AI questions mock (acting as Claude Sonnet output)
    const mockQuestions = [
      {
        content: `[AI generated question] Tìm tập xác định D của hàm số y = (x^2 - 1)^(-3)?`,
        options: [
          { label: 'A', text: "D = R" },
          { label: 'B', text: "D = R \\ { -1; 1 }" },
          { label: 'C', text: "D = (-1; 1)" },
          { label: 'D', text: "D = (-oo; -1) U (1; +oo)" }
        ],
        correctAnswer: 'B',
        explanation: "Hàm số mũ với số mũ nguyên âm xác định khi cơ số khác 0. Do đó x^2 - 1 != 0 <=> x != 1 và x != -1.",
        topic: topic || "Hàm số",
        difficulty: difficulty || "EASY"
      }
    ];

    return res.status(200).json({ success: true, data: mockQuestions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// AI MINDMAP CONTROLLERS
// =========================================================================

function repairTruncatedJson(str: string): string {
  str = str.trim();

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;
  let lastValidIndex = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        openBraces++;
      } else if (char === '}') {
        openBraces--;
        if (openBraces >= 0) lastValidIndex = i + 1;
      } else if (char === '[') {
        openBrackets++;
      } else if (char === ']') {
        openBrackets--;
        if (openBrackets >= 0) lastValidIndex = i + 1;
      } else if (char === ',') {
        lastValidIndex = i;
      }
    }
  }

  if (openBraces > 0 || openBrackets > 0) {
    if (lastValidIndex > 0) {
      let sub = str.substring(0, lastValidIndex).trim();
      if (sub.endsWith(',')) {
        sub = sub.substring(0, sub.length - 1).trim();
      }

      let subBraces = 0;
      let subBrackets = 0;
      let subInString = false;
      let subEscaped = false;

      for (let i = 0; i < sub.length; i++) {
        const char = sub[i];
        if (subEscaped) {
          subEscaped = false;
          continue;
        }
        if (char === '\\') {
          subEscaped = true;
          continue;
        }
        if (char === '"') {
          subInString = !subInString;
          continue;
        }
        if (!subInString) {
          if (char === '{') subBraces++;
          else if (char === '}') subBraces--;
          else if (char === '[') subBrackets++;
          else if (char === ']') subBrackets--;
        }
      }

      while (subBrackets > 0) {
        sub += ']';
        subBrackets--;
      }
      while (subBraces > 0) {
        sub += '}';
        subBraces--;
      }
      return sub;
    }
  }
  return str;
}

function cleanJsonString(str: string): string {
  // Remove markdown code blocks if present (e.g. ```json ... ```)
  str = str.replace(/```json/gi, '').replace(/```/g, '');

  // Strip single-line comments //... or #...
  str = str.split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        return '';
      }
      return line;
    })
    .join('\n');

  // Try to repair truncated JSON structure
  str = repairTruncatedJson(str);

  // Fix trailing semicolons outside quotes:
  // e.g. "key": "value"; -> "key": "value"
  str = str.replace(/;(\s*[\n,\]\}])/g, '$1');

  // Remove trailing commas before a closing bracket or brace
  str = str.replace(/,\s*([\]\}])/g, '$1');

  return str.trim();
}

export async function generateMindmap(req: AuthRequest, res: Response) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Nội dung văn bản để lập sơ đồ tư duy không được để trống.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Hệ thống AI chưa được cấu hình API Key.' });
  }

  try {
    const prompt = `Bạn là một chuyên gia hỗ trợ học sinh ôn thi THPT Quốc Gia. 
Hãy phân tích tài liệu/văn bản sau và tạo một sơ đồ tư duy có cấu trúc phân cấp chi tiết (từ 2 đến 3 cấp độ), chứa các khái niệm trọng tâm, công thức (nếu có), định nghĩa hoặc ví dụ cần nhớ để phục vụ ôn thi.

Nội dung tài liệu/văn bản cần lập sơ đồ:
"""
${text.substring(0, 10000)}
"""

Yêu cầu định dạng và nội dung:
1. Bạn BẮT BUỘC phải trả về cấu trúc sơ đồ dưới dạng JSON hợp lệ duy nhất.
2. JSON phải khớp hoàn toàn với Schema sau:
{
  "name": "Tên chủ đề chính/tiêu đề của sơ đồ (ngắn gọn, dưới 6 từ)",
  "description": "Mô tả khái quát hoặc lưu ý tổng quan cho chủ đề chính này",
  "children": [
    {
      "name": "Tên nhánh chính 1 (ngắn gọn, dưới 6 từ)",
      "description": "Nội dung chi tiết, định nghĩa, công thức hoặc lưu ý quan trọng",
      "children": [
        {
          "name": "Tên nhánh con 1.1 (ngắn gọn, dưới 6 từ)",
          "description": "Công thức cụ thể, ví dụ hoặc tính chất chi tiết"
        }
      ]
    }
  ]
}
3. Hãy tạo từ 3 đến 4 nhánh chính lớn ở cấp 1, mỗi nhánh lớn nên có 2-3 nhánh con ở cấp 2 để đảm bảo sơ đồ đầy đủ, trực quan và hữu ích cho học sinh ôn tập THPT Quốc Gia.
4. Mỗi trường "name" (tên nhánh) phải cực kỳ ngắn gọn, súc tích (dưới 6 từ). Mỗi trường "description" (mô tả/công thức/ví dụ) phải ngắn gọn, súc tích (dưới 15 từ, tối đa 20 từ) để đảm bảo tốc độ phản hồi nhanh và tránh bị cắt cụt dung lượng.
5. Trả về đúng mã JSON. Không bao gồm bất cứ lời giải thích hay ký tự nào khác bên ngoài khối JSON.`;

    const content = await callOpenRouter(prompt, 1500, 0.5);
    console.log("[AI Mindmap Raw Output]:", content);

    // Parse the JSON structure robustly using regex to locate { ... } block
    let parsedMindmap: any = null;
    const jsonRegex = /\{[\s\S]*\}/;
    const match = content.match(jsonRegex);
    if (match) {
      try {
        const cleaned = cleanJsonString(match[0]);
        parsedMindmap = JSON.parse(cleaned);
      } catch (e) {
        console.error("Failed to parse matched JSON from AI content:", e);
      }
    }

    if (!parsedMindmap || typeof parsedMindmap !== 'object' || !parsedMindmap.name) {
      try {
        const cleaned = cleanJsonString(content);
        parsedMindmap = JSON.parse(cleaned);
      } catch (e) {
        // Fallback structures if JSON parsing failed completely
        parsedMindmap = {
          name: "Sơ đồ ôn tập THPTQG",
          description: "Lỗi định dạng cấu trúc tự động từ AI. Nội dung thô được đính kèm bên dưới.",
          children: [
            {
              name: "Nội dung AI",
              description: content.substring(0, 1000)
            }
          ]
        };
      }
    }

    return res.status(200).json({ success: true, data: parsedMindmap });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
export async function syncMindmapNodes(mindmapId: number, content: any) {
  const nodesToSync: { nodeKey: string; name: string; description: string }[] = [];

  function traverse(node: any, path = '0') {
    if (!node) return;
    nodesToSync.push({
      nodeKey: path,
      name: node.name || 'Nút không tên',
      description: node.description || ''
    });
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any, idx: number) => {
        traverse(child, `${path}-${idx}`);
      });
    }
  }

  traverse(content);

  // Fetch all existing mindmap nodes in a single query
  const existingNodes = await prisma.mindmapNode.findMany({
    where: { mindmapId },
    select: { nodeKey: true, name: true, description: true }
  });

  const existingMap = new Map<string, typeof existingNodes[0]>();
  for (const item of existingNodes) {
    existingMap.set(item.nodeKey, item);
  }

  const nodesToCreate: typeof nodesToSync = [];
  const nodesToUpdate: typeof nodesToSync = [];

  for (const n of nodesToSync) {
    const existing = existingMap.get(n.nodeKey);
    if (!existing) {
      nodesToCreate.push(n);
    } else {
      if (existing.name !== n.name || existing.description !== n.description) {
        nodesToUpdate.push(n);
      }
    }
  }

  const operations: any[] = [];

  if (nodesToCreate.length > 0) {
    operations.push(
      prisma.mindmapNode.createMany({
        data: nodesToCreate.map(n => ({
          mindmapId,
          nodeKey: n.nodeKey,
          name: n.name,
          description: n.description
        }))
      })
    );
  }

  if (nodesToUpdate.length > 0) {
    operations.push(
      ...nodesToUpdate.map(n =>
        prisma.mindmapNode.update({
          where: {
            mindmapId_nodeKey: {
              mindmapId,
              nodeKey: n.nodeKey
            }
          },
          data: {
            name: n.name,
            description: n.description
          }
        })
      )
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }
}

export async function saveMindmap(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { title, content, id } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Bạn cần đăng nhập để lưu sơ đồ tư duy.' });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Tiêu đề sơ đồ tư duy không được để trống.' });
  }
  if (!content) {
    return res.status(400).json({ success: false, error: 'Nội dung sơ đồ tư duy không được để trống.' });
  }

  try {
    let mindmap;
    const numericId = id && !isNaN(Number(id)) ? Number(id) : null;

    if (numericId !== null) {
      const existing = await prisma.mindmap.findFirst({
        where: { id: numericId, userId }
      });

      if (existing) {
        mindmap = await prisma.mindmap.update({
          where: { id: numericId },
          data: {
            title: title.trim(),
            content: content,
            updatedAt: new Date()
          }
        });
        await syncMindmapNodes(mindmap.id, content);
        return res.status(200).json({ success: true, data: mindmap });
      }
    }

    mindmap = await prisma.mindmap.create({
      data: {
        userId,
        title: title.trim(),
        content: content,
      }
    });
    await syncMindmapNodes(mindmap.id, content);

    return res.status(201).json({ success: true, data: mindmap });
  } catch (err: any) {
    console.error('[saveMindmap Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
export async function getMindmaps(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    const mindmaps = await prisma.mindmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: mindmaps });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getMindmapById(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const id = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }
  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Mã sơ đồ tư duy không hợp lệ.' });
  }

  try {
    const mindmap = await prisma.mindmap.findFirst({
      where: { id, userId }
    });

    if (!mindmap) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sơ đồ tư duy này.' });
    }

    return res.status(200).json({ success: true, data: mindmap });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPublicMindmapById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Mã sơ đồ tư duy không hợp lệ.' });
  }

  try {
    const mindmap = await prisma.mindmap.findFirst({
      where: { id }
    });

    if (!mindmap) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sơ đồ tư duy này.' });
    }

    return res.status(200).json({ success: true, data: mindmap });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}


export async function deleteMindmap(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const id = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }
  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Mã sơ đồ tư duy không hợp lệ.' });
  }

  try {
    const mindmap = await prisma.mindmap.findFirst({
      where: { id, userId }
    });

    if (!mindmap) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sơ đồ tư duy này hoặc bạn không có quyền xóa.' });
    }

    await prisma.mindmap.delete({
      where: { id }
    });

    return res.status(200).json({ success: true, message: 'Đã xóa sơ đồ tư duy thành công.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function generateFlashcards(req: AuthRequest, res: Response) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Nội dung văn bản để tạo flashcard không được để trống.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Hệ thống AI chưa được cấu hình API Key.' });
  }

  try {
    const prompt = `Bạn là chuyên gia thiết kế tài liệu học tập và thẻ ghi nhớ (flashcard). Hãy tạo đúng 5 flashcards ngắn gọn từ yêu cầu hoặc văn bản sau: "${text}"

Yêu cầu cực kỳ quan trọng:
- Mặt trước (Front) của mỗi flashcard PHẢI là khái niệm, thuật ngữ, công thức hoặc từ vựng cụ thể (ví dụ: "Flo (F)", "Halogen", "Tính oxi hóa" hoặc "HCl"). TUYỆT ĐỐI KHÔNG ĐƯỢC để mặt trước là các từ chung chung như "Flashcard 1", "Khái niệm 1", v.v.
- Mặt sau (Back) PHẢI là định nghĩa, ý nghĩa, tính chất, hoặc giải thích tương ứng ngắn gọn của khái niệm/thuật ngữ đó.
- Định dạng trả về CHÍNH XÁC theo cấu trúc sau (mỗi thẻ cách nhau bằng dấu chấm phẩy ";", không kèm thêm bất cứ giải thích, lời chào hay lời dẫn nào khác):
Mặt trước 1 = Mặt sau 1; Mặt trước 2 = Mặt sau 2; Mặt trước 3 = Mặt sau 3; Mặt trước 4 = Mặt sau 4; Mặt trước 5 = Mặt sau 5`;

    const content = await callOpenRouter(prompt, 500, 0.5);

    // Parse outline string to expected flashcards JSON array
    const rawParts = content.split(/[;\n]+/).map((p: string) => p.trim());
    const cards: any[] = [];

    for (const rawPart of rawParts) {
      if (!rawPart) continue;
      
      // Clean prefixes like "1. ", "Thẻ 1: ", etc.
      let cleanedPart = rawPart.replace(/^\d+[\.\s:]+/, '').replace(/^Thẻ\s+\d+[\.\s:]*/i, '').trim();
      
      const eqIdx = cleanedPart.indexOf('=');
      if (eqIdx !== -1) {
        let front = cleanedPart.substring(0, eqIdx).trim();
        let back = cleanedPart.substring(eqIdx + 1).trim();
        
        // Remove prefixes like "Mặt trước:", "Mặt sau:"
        front = front.replace(/^(mặt trước|front)[:\s-]*/i, '').trim();
        back = back.replace(/^(mặt sau|back)[:\s-]*/i, '').trim();
        
        if (front && back) {
          cards.push({ front, back });
        }
      }
    }

    // Secondary parsing fallback: try using colon as separator if no equal signs parsed
    if (cards.length === 0) {
      for (const rawPart of rawParts) {
        if (!rawPart) continue;
        let cleanedPart = rawPart.replace(/^\d+[\.\s:]+/, '').replace(/^Thẻ\s+\d+[\.\s:]*/i, '').trim();
        const colonIdx = cleanedPart.indexOf(':');
        if (colonIdx !== -1) {
          let front = cleanedPart.substring(0, colonIdx).trim();
          let back = cleanedPart.substring(colonIdx + 1).trim();
          front = front.replace(/^(mặt trước|front)[:\s-]*/i, '').trim();
          back = back.replace(/^(mặt sau|back)[:\s-]*/i, '').trim();
          if (front && back) {
            cards.push({ front, back });
          }
        }
      }
    }

    const parsedFlashcards = cards.length > 0 ? cards : [
      { front: 'Thuật ngữ 1', back: 'Ý nghĩa định nghĩa 1' },
      { front: 'Thuật ngữ 2', back: 'Ý nghĩa định nghĩa 2' },
      { front: 'Thuật ngữ 3', back: 'Ý nghĩa định nghĩa 3' }
    ];

    return res.status(200).json({ success: true, data: parsedFlashcards });
    return res.status(200).json({ success: true, data: parsedFlashcards });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// MINDMAP SYSTEM UPGRADES - CONTROLLERS
// =========================================================================

async function callOpenRouter(prompt: string, maxTokens = 1500, temp = 0.5) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const primaryModel = process.env.OPENROUTER_MODEL || 'openrouter/free';
  if (!apiKey) {
    throw new Error('API Key OpenRouter chưa được cấu hình.');
  }

  const candidateModels = [
    primaryModel,
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3-8b-instruct:free',
    'google/gemma-4-31b-it:free',
    'qwen/qwen3-coder:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openrouter/free'
  ];

  // De-duplicate candidate models while preserving order
  const modelsToTry = Array.from(new Set(candidateModels));

  let lastError = '';
  for (const currentModel of modelsToTry) {
    try {
      console.log(`[OpenRouter] Attempting request using model: ${currentModel}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://edupath.vn',
          'X-Title': 'EduPath AI Mindmap'
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: temp,
          max_tokens: maxTokens
        })
      });

      const responseText = await response.text();

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          const content = (data.choices?.[0]?.message?.content || '').trim();
          if (content) {
            console.log(`[OpenRouter] Success with model: ${currentModel}`);
            return content;
          }
        } catch (jsonErr) {
          console.warn(`[OpenRouter] Failed to parse JSON from model ${currentModel}:`, jsonErr);
        }
      } else {
        lastError = responseText;
        console.warn(`[OpenRouter] Model ${currentModel} returned status ${response.status}: ${responseText}`);
      }
    } catch (fetchErr: any) {
      lastError = fetchErr.message || String(fetchErr);
      console.warn(`[OpenRouter] Network error with model ${currentModel}:`, fetchErr);
    }
  }

  // If all models failed, log event and throw
  await logSystemEvent(null, {
    type: 'SYSTEM',
    action: 'AI_NO_RESPONSE',
    module: 'AI_SERVICE',
    description: `Tất cả các model AI đều thất bại. Lỗi cuối cùng: ${lastError.substring(0, 300)}`,
    metadata: { lastError },
    level: 'ERROR'
  }).catch(logErr => console.error('Failed to log AI error:', logErr));

  throw new Error(`Tất cả các mô hình AI trên OpenRouter đều đang bận hoặc quá tải. Vui lòng thử lại sau giây lát. Chi tiết lỗi: ${lastError.substring(0, 200)}`);
}

function findNodeAndParentContext(node: any, targetKey: string, currentPath = '0', parentNames: string[] = []): any {
  if (currentPath === targetKey) {
    return { node, parentContext: parentNames.join(' > ') };
  }
  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      const res = findNodeAndParentContext(node.children[i], targetKey, `${currentPath}-${i}`, [...parentNames, node.name]);
      if (res) return res;
    }
  }
  return null;
}

export async function generateNodeQuiz(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { mindmapId, nodeKey } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }
  if (!mindmapId || !nodeKey) {
    return res.status(400).json({ success: false, error: 'Thiếu mindmapId hoặc nodeKey.' });
  }

  try {
    const mindmap = await prisma.mindmap.findFirst({
      where: { id: Number(mindmapId) }
    });
    if (!mindmap) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sơ đồ tư duy.' });
    }

    let node = await prisma.mindmapNode.findUnique({
      where: {
        mindmapId_nodeKey: {
          mindmapId: Number(mindmapId),
          nodeKey: String(nodeKey)
        }
      }
    });

    if (!node) {
      await syncMindmapNodes(Number(mindmapId), mindmap.content);
      node = await prisma.mindmapNode.findUnique({
        where: {
          mindmapId_nodeKey: {
            mindmapId: Number(mindmapId),
            nodeKey: String(nodeKey)
          }
        }
      });
    }

    if (!node) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nút kiến thức.' });
    }

    const existingQuestions = await prisma.quizQuestion.findMany({
      where: { mindmapNodeId: node.id }
    });

    let questions = existingQuestions;

    if (existingQuestions.length === 0) {
      const parsedInfo = findNodeAndParentContext(mindmap.content, String(nodeKey));
      const parentContextText = parsedInfo ? parsedInfo.parentContext : 'Không có';
      const nodeName = node.name;
      const nodeDescription = node.description;

      const prompt = `Bạn là chuyên gia ôn thi tốt nghiệp THPT Quốc Gia hàng đầu.
Dựa trên thông tin của nút kiến thức sau:
- Tên chủ đề/nút: "${nodeName}"
- Nội dung chi tiết: "${nodeDescription}"
- Ngữ cảnh các nhánh cha: "${parentContextText}"

Hãy thiết kế đúng 10 câu hỏi trắc nghiệm khách quan dạng 4 lựa chọn (A, B, C, D) kiểm tra mức độ ghi nhớ và tư duy logic.
Yêu cầu phân bổ câu hỏi:
- 4 câu nhận biết (khái niệm cơ bản, công thức cốt lõi)
- 3 câu thông hiểu (giải thích hiện tượng, lý do công thức)
- 2 câu vận dụng thấp (bài tập tính toán cơ bản)
- 1 câu vận dụng cao (bài toán thực tế tổng hợp nâng cao)

Các câu hỏi và câu trả lời phải được thiết kế khoa học, có đáp án đúng duy nhất.

Bạn BẮT BUỘC phải phản hồi ở định dạng JSON duy nhất khớp với cấu trúc sau:
[
  {
    "questionText": "Nội dung câu hỏi...",
    "options": ["Đáp án A...", "Đáp án B...", "Đáp án C...", "Đáp án D..."],
    "correctOption": 0, // Chỉ số đáp án đúng (0 cho A, 1 cho B, 2 cho C, 3 cho D)
    "explanation": "Lời giải thích khoa học cặn kẽ vì sao chọn đáp án này..."
  }
]
TUYỆT ĐỐI không bao gồm bất kỳ lời dẫn, giải thích hay thẻ markdown nào bên ngoài khối JSON. Hãy trả về JSON thô.`;

      const aiResponse = await callOpenRouter(prompt, 2000, 0.4);
      let parsedResponse: any[] = [];
      
      const jsonRegex = /\[[\s\S]*\]/;
      const match = aiResponse.match(jsonRegex);
      if (match) {
        try {
          const cleaned = cleanJsonString(match[0]);
          parsedResponse = JSON.parse(cleaned);
        } catch (e) {
          console.error("Quiz JSON Parsing error", e);
        }
      }

      if (!Array.isArray(parsedResponse) || parsedResponse.length === 0) {
        parsedResponse = Array.from({ length: 10 }, (_, i) => ({
          questionText: `Câu hỏi ôn tập ${i + 1} về chủ đề: ${nodeName}`,
          options: ["Đáp án A (Đúng)", "Đáp án B", "Đáp án C", "Đáp án D"],
          correctOption: 0,
          explanation: `Lời giải thích mặc định của hệ thống ôn thi cho câu hỏi thứ ${i + 1}.`
        }));
      }

      await prisma.quizQuestion.createMany({
        data: parsedResponse.map(q => ({
          mindmapNodeId: node!.id,
          questionText: q.questionText,
          options: q.options,
          correctOption: Number(q.correctOption),
          explanation: q.explanation || 'Không có giải thích.'
        }))
      });

      questions = await prisma.quizQuestion.findMany({
        where: { mindmapNodeId: node.id }
      });
    }

    // Hide correctOption and explanation to prevent inspect-element cheating
    const secureQuestions = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options
    }));

    return res.status(200).json({ success: true, data: secureQuestions });
  } catch (err: any) {
    console.error('[generateNodeQuiz Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function submitNodeQuiz(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { mindmapId, nodeKey, answers, completionTime } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }
  if (!mindmapId || !nodeKey || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, error: 'Thiếu dữ liệu nộp bài.' });
  }

  try {
    const node = await prisma.mindmapNode.findUnique({
      where: {
        mindmapId_nodeKey: {
          mindmapId: Number(mindmapId),
          nodeKey: String(nodeKey)
        }
      }
    });

    if (!node) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nút kiến thức.' });
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { mindmapNodeId: node.id }
    });

    if (questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy câu hỏi cho bài kiểm tra này.' });
    }

    let score = 0;
    const answerData = answers.map((ans: any) => {
      const q = questions.find(question => question.id === Number(ans.questionId));
      const isCorrect = q ? q.correctOption === Number(ans.selectedOption) : false;
      if (isCorrect) score++;
      
      return {
        questionId: Number(ans.questionId),
        selectedOption: Number(ans.selectedOption),
        isCorrect
      };
    });

    const totalQuestions = questions.length;
    const masteryRatio = score / totalQuestions;

    // Create attempt and user answers
    const attempt = await prisma.nodeQuizAttempt.create({
      data: {
        userId,
        mindmapNodeId: node.id,
        score,
        totalQuestions,
        completionTime: Number(completionTime) || 30,
        answers: {
          create: answerData
        }
      }
    });

    // Update NodeProgress
    const existingProgress = await prisma.nodeProgress.findUnique({
      where: {
        userId_mindmapNodeId: {
          userId,
          mindmapNodeId: node.id
        }
      }
    });

    let nodeProgress;
    if (existingProgress) {
      nodeProgress = await prisma.nodeProgress.update({
        where: { id: existingProgress.id },
        data: {
          attempts: existingProgress.attempts + 1,
          bestScore: Math.max(existingProgress.bestScore, score),
          mastery: Math.max(existingProgress.mastery, masteryRatio),
          lastPracticed: new Date()
        }
      });
    } else {
      nodeProgress = await prisma.nodeProgress.create({
        data: {
          userId,
          mindmapNodeId: node.id,
          attempts: 1,
          bestScore: score,
          mastery: masteryRatio,
          lastPracticed: new Date()
        }
      });
    }

    // Prepare correction report with correct answers and explanations
    const corrections = questions.map(q => {
      const userAns = answers.find((a: any) => Number(a.questionId) === q.id);
      return {
        questionId: q.id,
        questionText: q.questionText,
        options: q.options,
        selectedOption: userAns ? Number(userAns.selectedOption) : null,
        correctOption: q.correctOption,
        isCorrect: userAns ? q.correctOption === Number(userAns.selectedOption) : false,
        explanation: q.explanation
      };
    });

    // Award XP to user if they performed well!
    const xpReward = score * 10;
    if (xpReward > 0) {
      await prisma.userGamification.upsert({
        where: { userId },
        update: {
          xp: { increment: xpReward }
        },
        create: {
          userId,
          xp: xpReward,
          level: 1,
          streakDays: 0
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        total: totalQuestions,
        mastery: nodeProgress.mastery,
        corrections
      }
    });
  } catch (err: any) {
    console.error('[submitNodeQuiz Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getNodeProgress(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }
  if (!id) {
    return res.status(400).json({ success: false, error: 'Thiếu mindmapId.' });
  }

  try {
    const progressList = await prisma.nodeProgress.findMany({
      where: {
        userId,
        node: {
          mindmapId: Number(id)
        }
      },
      include: {
        node: true
      }
    });

    const progressMap: Record<string, any> = {};
    progressList.forEach(p => {
      progressMap[p.node.nodeKey] = {
        mastery: p.mastery,
        bestScore: p.bestScore,
        attempts: p.attempts,
        lastPracticed: p.lastPracticed
      };
    });

    return res.status(200).json({ success: true, data: progressMap });
  } catch (err: any) {
    console.error('[getNodeProgress Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function generateWeaknessMindmap(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  try {
    // Query user's incorrect answers
    const incorrectAnswers = await prisma.userAnswer.findMany({
      where: {
        attempt: { userId },
        isCorrect: false
      },
      include: {
        question: {
          include: {
            node: {
              include: {
                mindmap: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (incorrectAnswers.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          isNoWeakness: true,
          message: 'Học sinh chưa có lỗi sai nào trong hệ thống! Hãy làm một vài bài quiz để chẩn đoán vùng yếu.'
        }
      });
    }

    const errorLogs = incorrectAnswers.map((ans: any) => {
      const q = ans.question;
      const opts = Array.isArray(q?.options) ? q.options : [];
      return {
        mindmapTitle: q?.node?.mindmap?.title || 'Tổng quan',
        topic: q?.node?.name || 'Tổng quan',
        question: q?.questionText || '',
        selectedWrongOption: opts[ans.selectedOption] || 'Bỏ trống',
        correctOption: opts[q?.correctOption] || 'Không rõ'
      };
    });

    const prompt = `Bạn là Chuyên gia thiết kế Lộ trình học tập cá nhân hóa (Learning Experience Architect).
Dưới đây là danh sách các lỗi sai gần đây của học sinh ôn thi THPT Quốc Gia:
${JSON.stringify(errorLogs, null, 2)}

Hãy xây dựng một Sơ đồ tư duy khắc phục lỗ hổng kiến thức (Weakness Mindmap) có cấu trúc cây JSON hợp lệ.
Yêu cầu cấu trúc sơ đồ tư duy JSON:
1. Nhánh cấp 1 là môn học/chương lớn bị hổng (ví dụ: Toán Học, Vật Lý...).
2. Nhánh cấp 2 là các dạng chủ đề chứa lỗi sai (ví dụ: Đạo hàm, Dao động cơ...).
3. Nhánh cấp 3 là các nút kiến thức trọng tâm cần ôn tập lại. Mỗi nút phải có:
   - "name": Tên ngắn gọn (dưới 6 từ, ví dụ: "Xem lại Đạo hàm của mũ")
   - "description": Giải thích ngắn gọn lý do bị hổng kiến thức kèm theo gợi ý học tập hoặc công thức cần nhớ. (dưới 20 từ)
   - "priority": Mức độ ưu tiên dựa trên mức lỗi sai ("Critical" | "High" | "Medium" | "Low")
   - "recommendedAction": Hướng dẫn hành động cụ thể để khắc phục lỗ hổng này.

Yêu cầu định dạng JSON phản hồi:
{
  "name": "Sơ đồ Lấp Lỗ Hổng Kiến Thức",
  "description": "Bản đồ khắc phục sai lầm do AI thiết lập dựa trên kết quả luyện tập thực tế.",
  "children": [
    {
      "name": "Tên môn học/chương lớn",
      "description": "Nhận xét tổng quan lỗi sai ở môn/chương này",
      "children": [
        {
          "name": "Tên nút khắc phục cụ thể",
          "description": "Giải thích lỗi sai + công thức cốt lõi ôn tập",
          "priority": "Critical",
          "recommendedAction": "Học bài Đạo Hàm và làm lại quiz"
        }
      ]
    }
  ]
}

Chỉ trả về chuỗi JSON thô duy nhất. Không đính kèm bất cứ câu chào hỏi hay markdown nào bên ngoài JSON.`;

    const aiResponse = await callOpenRouter(prompt, 2000, 0.4);
    let parsedMindmap: any = null;
    
    const jsonRegex = /\{[\s\S]*\}/;
    const match = aiResponse.match(jsonRegex);
    if (match) {
      try {
        const cleaned = cleanJsonString(match[0]);
        parsedMindmap = JSON.parse(cleaned);
      } catch (e) {
        console.error("Weakness JSON parse error", e);
      }
    }

    if (!parsedMindmap || !parsedMindmap.name) {
      throw new Error("Không thể tạo cấu trúc sơ đồ vùng yếu từ kết quả AI.");
    }

    const title = `Sơ đồ Khắc phục Lỗ hổng - ${new Date().toLocaleDateString('vi-VN')}`;

    // Save as normal mindmap so it displays on canvas library
    const mindmap = await prisma.mindmap.create({
      data: {
        userId,
        title,
        content: parsedMindmap
      }
    });

    await syncMindmapNodes(mindmap.id, parsedMindmap);

    // Save to WeaknessMindmap record
    await prisma.weaknessMindmap.create({
      data: {
        userId,
        title,
        content: parsedMindmap
      }
    });

    return res.status(201).json({ success: true, data: mindmap });
  } catch (err: any) {
    console.error('[generateWeaknessMindmap Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function uploadExamFile(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, error: 'Không tìm thấy tệp tin được tải lên.' });
  }

  // Kiểm tra dung lượng tệp tải lên động
  const maxMb = SystemSettingService.getNumber('MAX_UPLOAD_SIZE_MB') || 50;
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {}
    return res.status(400).json({ 
      success: false, 
      error: `Dung lượng tệp tải lên vượt quá giới hạn cấu hình của hệ thống (Tối đa ${maxMb}MB)!` 
    });
  }

  try {
    const filename = file.originalname;
    const fileUrl = `/uploads/${file.filename}`;
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    let extractedText = '';

    // Extract content based on file extension
    if (ext === 'txt' || ext === 'md') {
      extractedText = fs.readFileSync(file.path, 'utf8');
    } else if (ext === 'pdf') {
      const fileBuffer = fs.readFileSync(file.path);
      const parser = new PDFParse({ data: fileBuffer });
      const parsed = await parser.getText();
      extractedText = parsed.text || '';
    } else if (ext === 'docx') {
      const parsed = await mammoth.extractRawText({ path: file.path });
      extractedText = parsed.value || '';
    } else {
      // For images, fallback to high-quality simulated Vietnamese THPT exam paper text
      const nameLower = filename.toLowerCase();
      if (nameLower.includes('toán') || nameLower.includes('toan') || nameLower.includes('math')) {
        extractedText = `ĐỀ THI THỬ THPT QUỐC GIA MÔN TOÁN HỌC 2026
Đề thi gồm 50 câu trắc nghiệm khách quan.
Cấu trúc kiến thức khảo thí:
- Khảo sát hàm số và đồ thị (12 câu): Tính đơn điệu, cực trị, tiệm cận, giá trị lớn nhất nhỏ nhất.
- Hàm số lũy thừa, mũ và lôgarit (8 câu): Tập xác định, đạo hàm, đồ thị, phương trình mũ lôgarit.
- Nguyên hàm, tích phân và ứng dụng (8 câu): Ứng dụng tính diện tích hình phẳng, thể tích khối tròn xoay.
- Số phức (6 câu): Phần thực phần ảo, môđun, biểu diễn hình học, phương trình bậc hai số phức.
- Hình học không gian (8 câu): Khối đa diện, thể tích khối chóp, khối lăng trụ.
- Mặt nón, mặt trụ, mặt cầu (4 câu): Diện tích xung quanh, thể tích khối nón trụ cầu.
- Phương pháp tọa độ trong không gian Oxyz (4 câu): Phương trình đường thẳng, mặt phẳng, mặt cầu, góc và khoảng cách.
Độ khó: 60% Nhận biết thông hiểu, 30% Vận dụng, 10% Vận dụng cao nâng cao.`;
      } else if (nameLower.includes('lý') || nameLower.includes('ly') || nameLower.includes('physics') || nameLower.includes('vật lý')) {
        extractedText = `ĐỀ THI THỬ THPT QUỐC GIA MÔN VẬT LÝ 2026
Đề thi gồm 40 câu trắc nghiệm khách quan.
Cơ cấu phân bố nội dung:
- Chương 1: Dao động cơ học (7 câu): Dao động điều hòa, con lắc lò xo, con lắc đơn, dao động tắt dần, cộng hưởng.
- Chương 2: Sóng cơ và sóng âm (5 câu): Phương trình sóng, giao thoa sóng cơ, sóng dừng, đặc trưng sóng âm.
- Chương 3: Dòng điện xoay chiều (8 câu): Đoạn mạch RLC mắc nối tiếp, công suất tiêu thụ, hệ số công suất, máy phát điện, máy biến áp.
- Chương 4: Dao động và sóng điện từ (4 câu): Mạch dao động LC, sự lan truyền sóng điện từ, thông tin liên lạc bằng sóng vô tuyến.
- Chương 5: Sóng ánh sáng (5 câu): Hiện tượng tán sắc, giao thoa ánh sáng đơn sắc, các loại quang phổ.
- Chương 6: Lượng tử ánh sáng (5 câu): Hiện tượng quang điện ngoài, thuyết lượng tử, hiện tượng quang - phát quang, mẫu nguyên tử Bo.
- Chương 7: Hạt nhân nguyên tử (6 câu): Năng lượng liên kết, hiện tượng phóng xạ, phản ứng phân hạch, nhiệt hạch.`;
      } else {
        extractedText = `ĐỀ THI THỬ THPT QUỐC GIA MÔN TIẾNG ANH 2026
Đề thi trắc nghiệm gồm 50 câu hỏi khảo sát:
- Ngữ âm (4 câu): Trọng âm chính và phát âm nguyên âm/phụ âm.
- Ngữ pháp cốt lõi (12 câu): Thì động từ, câu bị động, câu so sánh, câu điều kiện, giới từ, mạo từ.
- Từ vựng & Điền từ (10 câu): Cụm động từ (phrasal verbs), collocation, từ đồng nghĩa trái nghĩa.
- Đọc điền từ vào đoạn văn (5 câu): Trắc nghiệm đục lỗ chọn liên từ, từ vựng phù hợp ngữ cảnh.
- Đọc hiểu văn bản (15 câu): Gồm 2 bài đọc (5 câu và 7 câu) kiểm tra ý chính, quy chiếu, từ vựng và suy luận.
- Tìm lỗi sai và Viết lại câu (4 câu): Lỗi cấu trúc song song, chuyển đổi thì động từ, câu gián tiếp.`;
      }
    }

    const fileRecord = await prisma.uploadedExamFile.create({
      data: {
        userId,
        filename,
        fileUrl,
        fileType: ext
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        id: fileRecord.id,
        filename,
        fileUrl,
        fileType: ext,
        extractedText
      }
    });
  } catch (err: any) {
    console.error('[uploadExamFile Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function generateExamMindmap(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const { title, text, fileUrl, fileType, uploadId } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa xác thực!' });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Nội dung đề thi trích xuất trống.' });
  }

  try {
    const prompt = `Bạn là Chuyên gia Khảo thí và Lập cấu trúc Đề thi THPT Quốc Gia.
Hãy phân tích văn bản trích xuất từ đề thi sau đây và lập sơ đồ phân bố cấu trúc của đề thi đó:
"${text.substring(0, 8000)}"

Hãy phân tích và trả về cấu trúc cây JSON đại diện cho sơ đồ phân tích cấu trúc đề thi.
Cấp 1 là các Phần/Chương lớn kèm theo tỷ lệ phần trăm phân bố điểm trong đề thi (ví dụ: "Hàm số & Đồ thị - 35%").
Cấp 2 là các chủ đề/dạng toán cụ thể trong phần đó kèm theo mô tả ngắn gọn:
- Số lượng câu hỏi thuộc dạng đó
- Độ khó ước lượng
- Kiến thức cần ghi nhớ.

Schema JSON yêu cầu bắt buộc:
{
  "name": "${(title || 'Sơ đồ phân tích đề thi').substring(0, 24)}",
  "description": "Sơ đồ trọng số điểm và độ khó chi tiết trích xuất từ đề thi học sinh tải lên.",
  "children": [
    {
      "name": "[Tên phần] - [Trọng số]%",
      "description": "Nhận xét cấu trúc tổng quan phần này",
      "children": [
        {
          "name": "[Dạng câu hỏi] (ví dụ: Tiệm cận đồ thị - 3 câu)",
          "description": "Độ khó: trung bình | Các công thức/lý thuyết cần ôn luyện kỹ"
        }
      ]
    }
  ]
}

TUYỆT ĐỐI chỉ trả về JSON thô duy nhất. Không kèm theo bất cứ giải thích hay markdown nào khác ngoài khối JSON.`;

    const aiResponse = await callOpenRouter(prompt, 2000, 0.4);
    let parsedMindmap: any = null;

    const jsonRegex = /\{[\s\S]*\}/;
    const match = aiResponse.match(jsonRegex);
    if (match) {
      try {
        const cleaned = cleanJsonString(match[0]);
        parsedMindmap = JSON.parse(cleaned);
      } catch (e) {
        console.error("Exam Analysis JSON parse error", e);
      }
    }

    if (!parsedMindmap || !parsedMindmap.name) {
      throw new Error("Không thể lập sơ đồ phân bố cấu trúc đề thi từ kết quả AI.");
    }

    // Determine subject from title/text
    const textLower = text.toLowerCase() + ' ' + (title || '').toLowerCase();
    let subject = 'Tổng hợp';
    if (textLower.includes('toán') || textLower.includes('math')) subject = 'Toán học';
    else if (textLower.includes('lý') || textLower.includes('ly') || textLower.includes('physics')) subject = 'Vật lý';
    else if (textLower.includes('anh') || textLower.includes('english')) subject = 'Tiếng Anh';
    else if (textLower.includes('hóa') || textLower.includes('chemistry')) subject = 'Hóa học';

    // Save as normal Mindmap
    const mindmap = await prisma.mindmap.create({
      data: {
        userId,
        title: title || `Phân tích ${parsedMindmap.name}`,
        content: parsedMindmap
      }
    });

    await syncMindmapNodes(mindmap.id, parsedMindmap);

    // Save ExamPaperAnalysis
    const examAnalysis = await prisma.examPaperAnalysis.create({
      data: {
        userId,
        title: title || parsedMindmap.name,
        subject,
        grade: '12',
        analysisResult: parsedMindmap,
        mindmapId: mindmap.id
      }
    });

    // Update UploadedExamFile link
    if (uploadId && !isNaN(Number(uploadId))) {
      await prisma.uploadedExamFile.update({
        where: { id: Number(uploadId) },
        data: {
          analysisId: examAnalysis.id
        }
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        mindmapId: mindmap.id,
        analysisId: examAnalysis.id
      }
    });
  } catch (err: any) {
    console.error('[generateExamMindmap Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

