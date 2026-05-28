import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

// Server-Sent Events (SSE) AI Streaming Chat
export async function streamAIChat(req: AuthRequest, res: Response) {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const responseChunks = [
    "Chào em! Thầy đã nhận được câu hỏi ôn luyện kỳ thi THPTQG.\n\n",
    "Để giải bài toán này một cách chính xác, chúng ta thực hiện theo các bước cụ thể như sau:\n\n",
    "**Bước 1**: Xác định các hệ số của bài toán và tập xác định.\n",
    "**Bước 2**: Áp dụng định lý đạo hàm liên hợp hoặc công thức giải nhanh lý thuyết.\n",
    "**Bước 3**: Thay số và kết luận kết quả cuối cùng.\n\n",
    "Em hãy thử áp dụng tương tự với các dạng bài tập tự luyện trong chương này. Có phần nào chưa hiểu rõ, cứ nhắn thầy hỗ trợ tiếp nhé! Chúc em ôn luyện thật tốt! ✨"
  ];

  let idx = 0;
  const interval = setInterval(() => {
    if (idx < responseChunks.length) {
      res.write(`data: ${JSON.stringify({ text: responseChunks[idx] })}\n\n`);
      idx++;
    } else {
      res.write('data: [DONE]\n\n');
      clearInterval(interval);
      res.end();
    }
  }, 400);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}

// Refresh Adaptive Study Roadmap based on recent performance
export async function refreshRoadmap(req: AuthRequest, res: Response) {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ success: false, error: 'Chưa xác thực!' });

  try {
    // Scan attempts
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId },
      include: { attemptAnswers: { include: { question: true } } }
    });

    const topicAccuracy: any = {};
    attempts.forEach(attempt => {
      attempt.attemptAnswers.forEach(ans => {
        const q = ans.question;
        if (!topicAccuracy[q.topic]) topicAccuracy[q.topic] = { total: 0, correct: 0 };
        topicAccuracy[q.topic].total++;
        if (ans.isCorrect) topicAccuracy[q.topic].correct++;
      });
    });

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    Object.keys(topicAccuracy).forEach(topic => {
      const acc = topicAccuracy[topic].correct / topicAccuracy[topic].total;
      if (acc < 0.6) weakTopics.push(topic); // Error rate >40%
      else if (acc > 0.8) strongTopics.push(topic); // Error rate <20%
    });

    // Custom adaptive JSON Roadmap response
    const adaptiveRoadmapContent = {
      weeklyPlan: [
        {
          week: "Tuần 1",
          focus: weakTopics.length > 0 ? `Vá lỗ hổng kiến thức: ${weakTopics.join(', ')}` : "Ôn tập tổng lực Sự biến thiên hàm số",
          dailyTasks: [
            { day: "Thứ 2", task: "Xem video bài giảng Ứng dụng Đạo hàm", estimatedMinutes: 45 },
            { day: "Thứ 4", task: "Luyện 15 câu trắc nghiệm mức độ Thông hiểu", estimatedMinutes: 30 },
            { day: "Thứ Sáu", task: "Hoàn thành Mini-test và xem AI chẩn đoán lỗi sai", estimatedMinutes: 20 }
          ],
          targetScore: weakTopics.length > 0 ? "Bứt phá điểm 8+" : "Giữ vững điểm 9+"
        },
        {
          week: "Tuần 2",
          focus: "Chuyên đề nâng cao Hình học Oxyz - Góc và khoảng cách",
          dailyTasks: [
            { day: "Thứ 3", task: "Khảo sát công thức khoảng cách Oxyz", estimatedMinutes: 40 },
            { day: "Thứ 5", task: "Giải đề cương tự luận do thầy Thế Anh biên soạn", estimatedMinutes: 50 }
          ],
          targetScore: "Đạt 9+ điểm tuyệt đối"
        }
      ],
      priorityTopics: weakTopics.length > 0 ? weakTopics : ["Phương trình mũ và lôgarit"],
      recommendedCourses: [1, 2],
      motivationalMessage: "Sự kiên trì hôm nay là tấm vé bước vào giảng đường Đại học mơ ước ngày mai. Thầy cô luôn đồng hành cùng em!"
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
