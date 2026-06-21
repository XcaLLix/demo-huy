import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedRealExamData } from '../src/utils/examImporter.js';
import { seedAllCourses } from './seed_courses.js';

const prisma = new PrismaClient();

async function main() {
  const courseCount = await prisma.course.count();
  const userCount = await prisma.user.count();
  const forceReset = process.argv.includes('--force') || process.argv.includes('-f');

  if ((courseCount > 0 || userCount > 0) && !forceReset) {
    console.log(`[Seed] Database already has data (Users: ${userCount}, Courses: ${courseCount}). Skipping seed to prevent data loss. Use --force or -f to override.`);
    return;
  }

  console.log('[Seed] Resetting database records...');
  
  // Wipe database tables in order of dependency
  await prisma.testAttemptAnswer.deleteMany({});
  await prisma.testAttempt.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.exam.deleteMany({});
  
  await prisma.enrollment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.course.deleteMany({});
  
  await prisma.studyGroupMember.deleteMany({});
  await prisma.groupAnnouncement.deleteMany({});
  await prisma.studyGroup.deleteMany({});
  await prisma.resourceShare.deleteMany({});
  await prisma.forumReaction.deleteMany({});
  await prisma.forumComment.deleteMany({});
  await prisma.forumReport.deleteMany({});
  await prisma.forumPost.deleteMany({});
  await prisma.forumTag.deleteMany({});
  await prisma.forumCategory.deleteMany({});
  
  await prisma.userBadge.deleteMany({});
  await prisma.userGamification.deleteMany({});
  await prisma.nodeProgress.deleteMany({});
  await prisma.userAnswer.deleteMany({});
  await prisma.nodeQuizAttempt.deleteMany({});
  await prisma.dailyContribution.deleteMany({});
  await prisma.subjectStreak.deleteMany({});
  await prisma.reputationHistory.deleteMany({});
  await prisma.documentComment.deleteMany({});
  await prisma.weaknessMindmap.deleteMany({});
  await prisma.uploadedExamFile.deleteMany({});
  await prisma.examPaperAnalysis.deleteMany({});
  await prisma.roleChangeRequest.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});


  console.log('[Seed] Seeding default admin account...');
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@edupath.vn',
      passwordHash: adminHash,
      fullName: 'EduPath Quản trị viên',
      role: 'ADMIN',
      avatarUrl: 'AD'
    }
  });

  console.log('[Seed] Seeding 3 approved teachers and 1 pending teacher...');
  const teacherHash = await bcrypt.hash('teacher123', 12);
  const teacherA = await prisma.user.create({
    data: {
      email: 'theanh.math@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Thầy Nguyễn Thế Anh',
      role: 'TEACHER',
      avatarUrl: 'TA',
      teacher: { create: { isApproved: true, bio: 'Giảng viên chuyên ôn Toán THPTQG với 12 năm kinh nghiệm.' } }
    }
  });

  const teacherB = await prisma.user.create({
    data: {
      email: 'huong.physics@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Cô Lê Thu Hương',
      role: 'TEACHER',
      avatarUrl: 'LH',
      teacher: { create: { isApproved: true, bio: 'Tốt nghiệp Đại học Sư Phạm Hà Nội, ôn luyện Vật lý THPTQG.' } }
    }
  });

  const teacherC = await prisma.user.create({
    data: {
      email: 'quynhchi.english@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Cô Phạm Quỳnh Chi',
      role: 'TEACHER',
      avatarUrl: 'QC',
      teacher: { create: { isApproved: true, bio: 'Thạc sĩ Ngôn ngữ Anh, chuyên luyện thi IELTS và THPTQG môn Tiếng Anh.' } }
    }
  });

  const teacherPending = await prisma.user.create({
    data: {
      email: 'pending.teacher@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Thầy Nguyễn Văn Chờ',
      role: 'TEACHER',
      avatarUrl: 'TC',
      teacher: { create: { isApproved: false, bio: 'Giảng viên ôn Văn đang chờ duyệt.' } }
    }
  });

  console.log('[Seed] Seeding 10 student accounts...');
  const studentHash = await bcrypt.hash('student123', 12);
  const studentList = [];
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@gmail.com`,
        passwordHash: studentHash,
        fullName: `Học sinh Nguyễn Minh Anh ${i}`,
        role: 'STUDENT',
        avatarUrl: `S${i}`,
        isPro: i === 1 || i === 2,
        student: {
          create: {
            subjectGroup: i % 2 === 0 ? 'A01' : 'D01',
            grade: 12,
            province: i % 2 === 0 ? 'Hà Nội' : 'Đà Nẵng'
          }
        }
      }
    });

    await prisma.userGamification.create({
      data: {
        userId: student.id,
        level: i,
        xp: i * 150,
        streakDays: i >= 8 ? 6 : i,
        lastActiveDate: new Date()
      }
    });

    studentList.push(student);
  }

  console.log('[Seed] Seeding 3 Courses (one per combo: A01, B00, D01)...');
  const courseA = await prisma.course.create({
    data: {
      title: 'Khảo sát hàm số nâng cao THPTQG',
      description: 'Chuyên đề bứt phá điểm 9+ môn Toán khối A01 và D01.',
      subject: 'Toán học',
      price: 499.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Sự đồng biến và nghịch biến của hàm số', order: 1, duration: '15:20', videoUrl: 'https://www.youtube.com/embed/V1y3_Tz1Gf4' },
          { title: 'Bài 2: Cực trị của hàm số và kỹ thuật tính nhanh', order: 2, duration: '18:45', videoUrl: 'https://www.youtube.com/embed/3Q90uJdSpXo' },
          { title: 'Bài 3: Giá trị lớn nhất và nhỏ nhất của hàm số', order: 3, duration: '22:10', videoUrl: 'https://www.youtube.com/embed/537bNfX-i64' },
          { title: 'Bài 4: Đường tiệm cận của đồ thị hàm số', order: 4, duration: '20:30', videoUrl: 'https://www.youtube.com/embed/F91V6c_yO50' },
          { title: 'Bài 5: Khảo sát sự biến thiên và đồ thị hàm số', order: 5, duration: '28:15', videoUrl: 'https://www.youtube.com/embed/bM7SZ5SBzyY' },
          { title: 'Bài 6: Biện luận số nghiệm của phương trình bằng đồ thị', order: 6, duration: '24:12', videoUrl: 'https://www.youtube.com/embed/HGeUpeCjSbg' },
          { title: 'Bài 7: Tiếp tuyến của đồ thị hàm số', order: 7, duration: '19:40', videoUrl: 'https://www.youtube.com/embed/01GzX1S6_sM' },
          { title: 'Bài 8: Điểm cực trị hàm chứa dấu giá trị tuyệt đối', order: 8, duration: '26:15', videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
          { title: 'Bài 9: Bài toán tương giao nâng cao', order: 9, duration: '21:05', videoUrl: 'https://www.youtube.com/embed/5_b7s1kGEXQ' },
          { title: 'Bài 10: Tổng ôn trắc nghiệm khảo sát hàm số 9+', order: 10, duration: '35:00', videoUrl: 'https://www.youtube.com/embed/7Qn6Xf5nF7M' }
        ]
      }
    }
  });

  const courseB = await prisma.course.create({
    data: {
      title: 'Hóa học hữu cơ Este - Lipit chuyên sâu',
      description: 'Lộ trình bứt phá điểm tuyệt đối môn Hóa học khối B00.',
      subject: 'Hóa học',
      price: 599.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Este lý thuyết căn bản và danh pháp', order: 1, duration: '12:15', videoUrl: 'https://www.youtube.com/embed/bM7SZ5SBzyY' },
          { title: 'Bài 2: Tính chất hóa học Este và phản ứng thủy phân', order: 2, duration: '16:40', videoUrl: 'https://www.youtube.com/embed/HGeUpeCjSbg' },
          { title: 'Bài 3: Phản ứng xà phòng hóa chất béo', order: 3, duration: '24:20', videoUrl: 'https://www.youtube.com/embed/01GzX1S6_sM' },
          { title: 'Bài 4: Lipit và cấu tạo hóa học', order: 4, duration: '18:30', videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
          { title: 'Bài 5: Bài toán đốt cháy Este lý thuyết và bài tập', order: 5, duration: '32:10', videoUrl: 'https://www.youtube.com/embed/5_b7s1kGEXQ' },
          { title: 'Bài 6: Phản ứng este hóa và hiệu suất phản ứng', order: 6, duration: '20:15', videoUrl: 'https://www.youtube.com/embed/7Qn6Xf5nF7M' },
          { title: 'Bài 7: Este đa chức lý thuyết nâng cao', order: 7, duration: '22:30', videoUrl: 'https://www.youtube.com/embed/V1y3_Tz1Gf4' },
          { title: 'Bài 8: Chất béo và phương pháp dồn chất', order: 8, duration: '27:40', videoUrl: 'https://www.youtube.com/embed/3Q90uJdSpXo' },
          { title: 'Bài 9: Sơ đồ chuyển hóa Este - Lipit chuyên sâu', order: 9, duration: '21:12', videoUrl: 'https://www.youtube.com/embed/537bNfX-i64' },
          { title: 'Bài 10: Tổng ôn trắc nghiệm Este - Lipit toàn tập', order: 10, duration: '38:00', videoUrl: 'https://www.youtube.com/embed/F91V6c_yO50' }
        ]
      }
    }
  });

  const courseC = await prisma.course.create({
    data: {
      title: 'Chuyên đề Dao động cơ học thi đại học',
      description: 'Nắm chắc 7+ điểm phần dao động điều hòa khối A01.',
      subject: 'Vật lý',
      price: 399.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherB.id,
      lessons: {
        create: [
          { title: 'Bài 1: Đại cương về Dao động điều hòa', order: 1, duration: '20:15', videoUrl: 'https://www.youtube.com/embed/537bNfX-i64' },
          { title: 'Bài 2: Con lắc lò xo cấu tạo và tần số góc', order: 2, duration: '22:45', videoUrl: 'https://www.youtube.com/embed/F91V6c_yO50' },
          { title: 'Bài 3: Năng lượng trong dao động điều hòa', order: 3, duration: '18:30', videoUrl: 'https://www.youtube.com/embed/bM7SZ5SBzyY' },
          { title: 'Bài 4: Con lắc đơn và chu kỳ dao động', order: 4, duration: '25:10', videoUrl: 'https://www.youtube.com/embed/HGeUpeCjSbg' },
          { title: 'Bài 5: Dao động tắt dần và dao động duy trì', order: 5, duration: '30:00', videoUrl: 'https://www.youtube.com/embed/01GzX1S6_sM' },
          { title: 'Bài 6: Hiện tượng cộng hưởng cơ học lý thuyết', order: 6, duration: '17:25', videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
          { title: 'Bài 7: Tổng hợp hai dao động điều hòa cùng phương', order: 7, duration: '23:40', videoUrl: 'https://www.youtube.com/embed/5_b7s1kGEXQ' },
          { title: 'Bài 8: Phương pháp giản đồ Fre-nen giải bài tập', order: 8, duration: '28:15', videoUrl: 'https://www.youtube.com/embed/7Qn6Xf5nF7M' },
          { title: 'Bài 9: Bài toán đồ thị dao động điều hòa', order: 9, duration: '24:50', videoUrl: 'https://www.youtube.com/embed/V1y3_Tz1Gf4' },
          { title: 'Bài 10: Tổng ôn tập dao động cơ học đề thi THPT', order: 10, duration: '36:00', videoUrl: 'https://www.youtube.com/embed/3Q90uJdSpXo' }
        ]
      }
    }
  });

  console.log('[Seed] Seeding additional template courses from seed_courses...');
  await seedAllCourses();

  console.log('[Seed] Seeding 50 multiple choice questions...');
  const questionsData = [];
  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh'];

  for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
    const subName = subjects[sIdx];
    for (let q = 1; q <= 10; q++) {
      const question = await prisma.question.create({
        data: {
          content: `[Đề thi thử THPTQG] Câu hỏi trắc nghiệm môn ${subName} câu số ${q}?`,
          options: [
            { label: 'A', text: `Đáp án A của câu hỏi ${q}` },
            { label: 'B', text: `Đáp án B của câu hỏi ${q}` },
            { label: 'C', text: `Đáp án C của câu hỏi ${q}` },
            { label: 'D', text: `Đáp án D của câu hỏi ${q}` }
          ],
          correctAnswer: 'A',
          explanation: 'Lời giải chi tiết giải thích rõ lý do đáp án A là câu trả lời chính xác.',
          subject: subName,
          topic: 'Chương 1 ôn tập tổng hợp',
          difficulty: q % 3 === 0 ? 'HARD' : (q % 2 === 0 ? 'MEDIUM' : 'EASY'),
          createdBy: teacherA.id
        }
      });
      questionsData.push(question);
    }
  }

  console.log('[Seed] Seeding 2 Full Exams (40 questions each)...');
  const examA = await prisma.exam.create({
    data: {
      title: 'Đề thi thử THPTQG Toán học toàn diện lần 1',
      subject: 'Toán học',
      subjectGroup: 'A01',
      duration: 90,
      isPublic: true,
      createdBy: teacherA.id
    }
  });

  const examB = await prisma.exam.create({
    data: {
      title: 'Đề thi khảo sát năng lực Vật lý Học kỳ 1',
      subject: 'Vật lý',
      subjectGroup: 'A01',
      duration: 50,
      isPublic: true,
      createdBy: teacherB.id
    }
  });

  // Assign questions to exams
  const mathQuestions = questionsData.filter(q => q.subject === 'Toán học');
  const physicsQuestions = questionsData.filter(q => q.subject === 'Vật lý');

  for (let i = 0; i < Math.min(mathQuestions.length, 20); i++) {
    await prisma.examQuestion.create({
      data: {
        examId: examA.id,
        questionId: mathQuestions[i].id,
        order: i + 1
      }
    });
  }

  for (let i = 0; i < Math.min(physicsQuestions.length, 20); i++) {
    await prisma.examQuestion.create({
      data: {
        examId: examB.id,
        questionId: physicsQuestions[i].id,
        order: i + 1
      }
    });
  }

  console.log('[Seed] Seeding Official 2024 THPT Quốc Gia past exams...');

  // 1. MATH 2024 (Mã đề 101) - 50 questions
  const mathAnswers101 = [
    'B', 'D', 'C', 'C', 'A', 'A', 'B', 'B', 'C', 'A',
    'B', 'A', 'D', 'C', 'B', 'C', 'D', 'A', 'B', 'C',
    'D', 'A', 'C', 'B', 'A', 'D', 'B', 'C', 'A', 'D',
    'C', 'B', 'A', 'D', 'C', 'A', 'B', 'D', 'C', 'B',
    'A', 'D', 'C', 'B', 'A', 'D', 'C', 'A', 'B', 'D'
  ];

  const mathDetailedQ = [
    {
      content: "Cho số phức $z = -5 + 6i$. Phần ảo của số phức $z$ bằng:",
      options: [
        { label: 'A', text: "-5" },
        { label: 'B', text: "5" },
        { label: 'C', text: "-5i" },
        { label: 'D', text: "6" }
      ],
      correctAnswer: 'D',
      explanation: "Phần ảo của số phức z = a + bi là b. Ở đây z = -5 + 6i nên phần ảo bằng 6.",
      topic: "Số phức",
      difficulty: 'EASY' as const
    },
    {
      content: "Khẳng định nào dưới đây đúng? $\\int (2x + 3)dx = ?$",
      options: [
        { label: 'A', text: "2x^2 + 3x + C" },
        { label: 'B', text: "x^2 + 3 + C" },
        { label: 'C', text: "2 + C" },
        { label: 'D', text: "x^2 + 3x + C" }
      ],
      correctAnswer: 'D',
      explanation: "Ta có \\int (2x + 3)dx = x^2 + 3x + C.",
      topic: "Nguyên hàm - Tích phân",
      difficulty: 'EASY' as const
    },
    {
      content: "Trong không gian $Oxyz$, cho đường thẳng $d: \\frac{x+1}{1} = \\frac{y-2}{-1} = \\frac{z}{-3}$. Vectơ nào dưới đây là một vectơ chỉ phương của đường thẳng $d$?",
      options: [
        { label: 'A', text: "\\vec{u}_1 = (-1; 2; 0)" },
        { label: 'B', text: "\\vec{u}_2 = (1; 2; -3)" },
        { label: 'C', text: "\\vec{u}_3 = (1; -1; -3)" },
        { label: 'D', text: "\\vec{u}_4 = (1; 1; 3)" }
      ],
      correctAnswer: 'C',
      explanation: "Từ phương trình chính tắc của đường thẳng d, ta đọc được tọa độ vectơ chỉ phương ở mẫu số là (1; -1; -3).",
      topic: "Phương trình đường thẳng",
      difficulty: 'EASY' as const
    },
    {
      content: "Cho hình trụ có diện tích xung quanh $S_{xq} = 36\\pi$ và chiều cao $h = 6$. Bán kính đáy của hình trụ đã cho bằng:",
      options: [
        { label: 'A', text: "6" },
        { label: 'B', text: "18" },
        { label: 'C', text: "3" },
        { label: 'D', text: "9" }
      ],
      correctAnswer: 'C',
      explanation: "Công thức diện tích xung quanh hình trụ: S_xq = 2\\pi R h <=> 36\\pi = 2\\pi * R * 6 <=> 12\\pi R = 36\\pi <=> R = 3.",
      topic: "Hình nón - Hình trụ - Hình cầu",
      difficulty: 'EASY' as const
    },
    {
      content: "Dãy số nào dưới đây là một cấp số cộng?",
      options: [
        { label: 'A', text: "1; 3; 5; 7" },
        { label: 'B', text: "1; 2; 4; 8" },
        { label: 'C', text: "1; -1; 1; -1" },
        { label: 'D', text: "1; 4; 9; 16" }
      ],
      correctAnswer: 'A',
      explanation: "Dãy số 1, 3, 5, 7 có hiệu hai số liên tiếp là d = 2 không đổi, do đó là một cấp số cộng.",
      topic: "Cấp số cộng và cấp số nhân",
      difficulty: 'EASY' as const
    },
    {
      content: "Với $a, b$ là các số thực dương tùy ý và $a \\neq 1$, giá trị của biểu thức $\\log_a(a^3b)$ bằng:",
      options: [
        { label: 'A', text: "3 + \\log_a b" },
        { label: 'B', text: "3\\log_a b" },
        { label: 'C', text: "3 - \\log_a b" },
        { label: 'D', text: "1/3 + \\log_a b" }
      ],
      correctAnswer: 'A',
      explanation: "Áp dụng tính chất logarit của một tích: \\log_a(a^3b) = \\log_a(a^3) + \\log_a b = 3 + \\log_a b.",
      topic: "Hàm số mũ và logarit",
      difficulty: 'EASY' as const
    },
    {
      content: "Cho hàm số bậc bốn $y = f(x)$ có đồ thị là đường cong trong hình bên. Số nghiệm thực phân biệt của phương trình $f(x) = 0$ là:",
      options: [
        { label: 'A', text: "4" },
        { label: 'B', text: "2" },
        { label: 'C', text: "3" },
        { label: 'D', text: "1" }
      ],
      correctAnswer: 'A',
      explanation: "Số nghiệm của phương trình f(x) = 0 chính là số giao điểm của đồ thị y = f(x) với trục hoành Ox. Đồ thị cắt Ox tại 4 điểm phân biệt, nên phương trình có 4 nghiệm thực phân biệt.",
      topic: "Đồ thị và giao điểm",
      difficulty: 'EASY' as const
    },
    {
      content: "Cho khối lăng trụ tam giác có diện tích đáy bằng $B$ và chiều cao bằng $h$. Thể tích $V$ của khối lăng trụ đã cho được tính theo công thức nào dưới đây?",
      options: [
        { label: 'A', text: "V = 1/3 B h" },
        { label: 'B', text: "V = 1/2 B h" },
        { label: 'C', text: "V = B h" },
        { label: 'D', text: "V = 3 B h" }
      ],
      correctAnswer: 'C',
      explanation: "Thể tích khối lăng trụ bằng diện tích đáy nhân với chiều cao: V = B.h.",
      topic: "Thể tích khối đa diện",
      difficulty: 'EASY' as const
    },
    {
      content: "Tập xác định của hàm số $y = x^{\\sqrt{2}}$ là:",
      options: [
        { label: 'A', text: "R" },
        { label: 'B', text: "[0; +\\infty)" },
        { label: 'C', text: "(0; +\\infty)" },
        { label: 'D', text: "R \\ {0}" }
      ],
      correctAnswer: 'C',
      explanation: "Hàm số lũy thừa với số mũ không nguyên xác định khi cơ số dương. Do đó x > 0.",
      topic: "Hàm số mũ và logarit",
      difficulty: 'EASY' as const
    },
    {
      content: "Cho hình chóp $S.ABC$ đáy là tam giác vuông cân tại $B$, $AB = a$, cạnh bên $SA$ vuông góc với đáy và $SA = a\\sqrt{2}$. Tính thể tích khối chóp $S.ABC$?",
      options: [
        { label: 'A', text: "V = a^3 \\sqrt{2} / 6" },
        { label: 'B', text: "V = a^3 \\sqrt{2} / 2" },
        { label: 'C', text: "V = a^3 \\sqrt{2} / 3" },
        { label: 'D', text: "V = a^3 / 3" }
      ],
      correctAnswer: 'A',
      explanation: "Diện tích đáy S_ABC = 1/2 * AB * BC = 1/2 * a * a = a^2 / 2. Chiều cao SA = a\\sqrt{2}. Thể tích V = 1/3 * SA * S_ABC = 1/3 * a\\sqrt{2} * a^2/2 = a^3\\sqrt{2} / 6.",
      topic: "Thể tích khối đa diện",
      difficulty: 'MEDIUM' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Toán 2024 - Mã đề 101',
    'Toán học',
    'A01',
    90,
    mathAnswers101,
    mathDetailedQ,
    teacherA.id
  );

  // 2. ENGLISH 2024 (Mã đề 401) - 50 questions
  const englishAnswers401 = [
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'A', 'D', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C'
  ];

  const englishDetailedQ = [
    {
      content: "Choose the word whose underlined part is pronounced differently from that of the others: standard -ed sound in 'played', 'visited', 'decided', 'started'.",
      options: [
        { label: 'A', text: "played" },
        { label: 'B', text: "visited" },
        { label: 'C', text: "decided" },
        { label: 'D', text: "started" }
      ],
      correctAnswer: 'A',
      explanation: "'played' phát âm đuôi là /d/. Ba từ còn lại phát âm đuôi là /id/.",
      topic: "Phát âm (Pronunciation)",
      difficulty: 'EASY' as const
    },
    {
      content: "Choose the word that differs from the other three in the position of primary stress: balance, carbon, repeat, standard",
      options: [
        { label: 'A', text: "balance" },
        { label: 'B', text: "carbon" },
        { label: 'C', text: "repeat" },
        { label: 'D', text: "standard" }
      ],
      correctAnswer: 'C',
      explanation: "'repeat' nhấn trọng âm vào âm tiết thứ 2. Các từ còn lại nhấn trọng âm vào âm tiết thứ nhất.",
      topic: "Trọng âm (Word Stress)",
      difficulty: 'EASY' as const
    },
    {
      content: "She has been working here for five years, ______?",
      options: [
        { label: 'A', text: "hasn't she" },
        { label: 'B', text: "has she" },
        { label: 'C', text: "doesn't she" },
        { label: 'D', text: "isn't she" }
      ],
      correctAnswer: 'A',
      explanation: "Câu hỏi đuôi cho mệnh đề khẳng định ở thì hiện tại hoàn thành 'She has been...' là 'hasn't she?'.",
      topic: "Câu hỏi đuôi (Tag Questions)",
      difficulty: 'EASY' as const
    },
    {
      content: "The student got a high grade in the exam ______ he studied very hard.",
      options: [
        { label: 'A', text: "because" },
        { label: 'B', text: "although" },
        { label: 'C', text: "despite" },
        { label: 'D', text: "because of" }
      ],
      correctAnswer: 'A',
      explanation: "Dùng liên từ chỉ nguyên nhân kết quả 'because' + mệnh đề (he studied very hard).",
      topic: "Liên từ (Conjunctions)",
      difficulty: 'EASY' as const
    },
    {
      content: "If I ______ more time, I would write a longer letter to my parents.",
      options: [
        { label: 'A', text: "have" },
        { label: 'B', text: "had" },
        { label: 'C', text: "will have" },
        { label: 'D', text: "would have" }
      ],
      correctAnswer: 'B',
      explanation: "Câu điều kiện loại 2 diễn tả sự việc không có thật ở hiện tại: If + S + V(quá khứ đơn), S + would + V-infinitive.",
      topic: "Câu điều kiện (Conditionals)",
      difficulty: 'EASY' as const
    },
    {
      content: "Choose the word CLOSEST in meaning to the underlined word in the sentence: The book was so fascinating that I couldn't put it down.",
      options: [
        { label: 'A', text: "boring" },
        { label: 'B', text: "interesting" },
        { label: 'C', text: "tiring" },
        { label: 'D', text: "simple" }
      ],
      correctAnswer: 'B',
      explanation: "'fascinating' có nghĩa là lôi cuốn, hấp dẫn, gần nghĩa nhất với 'interesting'.",
      topic: "Từ đồng nghĩa (Synonyms)",
      difficulty: 'EASY' as const
    },
    {
      content: "Choose the word OPPOSITE in meaning to the underlined word: We need to reduce our carbon footprint to save the planet.",
      options: [
        { label: 'A', text: "increase" },
        { label: 'B', text: "decrease" },
        { label: 'C', text: "cut" },
        { label: 'D', text: "limit" }
      ],
      correctAnswer: 'A',
      explanation: "'reduce' nghĩa là cắt giảm, giảm thiểu. Trái nghĩa của nó là 'increase' (tăng lên).",
      topic: "Từ trái nghĩa (Antonyms)",
      difficulty: 'EASY' as const
    },
    {
      content: "The teacher suggested ______ to the museum on the weekend.",
      options: [
        { label: 'A', text: "go" },
        { label: 'B', text: "to go" },
        { label: 'C', text: "going" },
        { label: 'D', text: "went" }
      ],
      correctAnswer: 'C',
      explanation: "Cấu trúc: suggest + V-ing (gợi ý làm việc gì).",
      topic: "Danh động từ và động từ nguyên mẫu (Gerund & Infinitive)",
      difficulty: 'EASY' as const
    },
    {
      content: "He is ______ student in our class.",
      options: [
        { label: 'A', text: "the most intelligent" },
        { label: 'B', text: "more intelligent" },
        { label: 'C', text: "intelligent" },
        { label: 'D', text: "most intelligent" }
      ],
      correctAnswer: 'A',
      explanation: "Cấu trúc so sánh nhất đối với tính từ dài: the + most + adj + N.",
      topic: "So sánh (Comparisons)",
      difficulty: 'EASY' as const
    },
    {
      content: "By the time the police arrived, the thieves ______ away.",
      options: [
        { label: 'A', text: "ran" },
        { label: 'B', text: "were running" },
        { label: 'C', text: "had run" },
        { label: 'D', text: "run" }
      ],
      correctAnswer: 'C',
      explanation: "Sử dụng thì quá khứ hoàn thành để diễn tả một hành động xảy ra trước một hành động khác trong quá khứ: By the time + S + V(quá khứ đơn), S + V(quá khứ hoàn thành).",
      topic: "Thì của động từ (Verb Tenses)",
      difficulty: 'MEDIUM' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Tiếng Anh 2024 - Mã đề 401',
    'Tiếng Anh',
    'D01',
    60,
    englishAnswers401,
    englishDetailedQ,
    teacherA.id
  );

  // 3. PHYSICS 2024 (Mã đề 201) - 40 questions
  const physicsAnswers201 = [
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A',
    'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D',
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A',
    'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D'
  ];

  const physicsDetailedQ = [
    {
      content: "Một con lắc lò xo gồm lò xo nhẹ có độ cứng $k$ và vật nhỏ có khối lượng $m$ đang dao động điều hòa. Tần số góc dao động $\\omega$ của vật được tính bằng công thức:",
      options: [
        { label: 'A', text: "\\omega = \\sqrt{\\frac{m}{k}}" },
        { label: 'B', text: "\\omega = 2\\pi\\sqrt{\\frac{k}{m}}" },
        { label: 'C', text: "\\omega = \\sqrt{\\frac{k}{m}}" },
        { label: 'D', text: "\\omega = \\frac{1}{2\\pi}\\sqrt{\\frac{k}{m}}" }
      ],
      correctAnswer: 'C',
      explanation: "Tần số góc dao động của con lắc lò xo: \\omega = \\sqrt{k/m}.",
      topic: "Dao động cơ",
      difficulty: 'EASY' as const
    },
    {
      content: "Trong sóng cơ học, tốc độ truyền sóng là:",
      options: [
        { label: 'A', text: "Tốc độ dao động của các phần tử môi trường" },
        { label: 'B', text: "Tốc độ truyền pha dao động của sóng" },
        { label: 'C', text: "Tốc độ cực đại của phần tử môi trường" },
        { label: 'D', text: "Tốc độ chuyển động của nguồn phát sóng" }
      ],
      correctAnswer: 'B',
      explanation: "Tốc độ truyền sóng là tốc độ lan truyền pha dao động (hoặc trạng thái dao động) trong môi trường.",
      topic: "Sóng cơ",
      difficulty: 'EASY' as const
    },
    {
      content: "Đặc trưng nào sau đây là một đặc trưng sinh lí của âm?",
      options: [
        { label: 'A', text: "Độ cao" },
        { label: 'B', text: "Tần số âm" },
        { label: 'C', text: "Đồ thị dao động âm" },
        { label: 'D', text: "Mức cường độ âm" }
      ],
      correctAnswer: 'A',
      explanation: "Các đặc trưng sinh lí của âm bao gồm: Độ cao, Độ to, và Âm sắc.",
      topic: "Sóng âm",
      difficulty: 'EASY' as const
    },
    {
      content: "Đặt điện áp xoay chiều vào hai đầu một đoạn mạch gồm điện trở $R$, cuộn cảm thuần và tụ điện mắc nối tiếp thì cảm kháng và dung kháng của mạch lần lượt là $Z_L$ và $Z_C$. Hệ số công suất $\\cos\\varphi$ của đoạn mạch là:",
      options: [
        { label: 'A', text: "\\cos\\varphi = \\frac{R}{\\sqrt{R^2 + (Z_L - Z_C)^2}}" },
        { label: 'B', text: "\\cos\\varphi = \\frac{\\sqrt{R^2 + (Z_L - Z_C)^2}}{R}" },
        { label: 'C', text: "\\cos\\varphi = \\frac{R}{\\sqrt{R^2 + (Z_L + Z_C)^2}}" },
        { label: 'D', text: "\\cos\\varphi = \\frac{R}{R^2 + (Z_L - Z_C)^2}" }
      ],
      correctAnswer: 'A',
      explanation: "Hệ số công suất của mạch RLC nối tiếp là \\cos\\varphi = R / Z = R / \\sqrt{R^2 + (Z_L - Z_C)^2}.",
      topic: "Dòng điện xoay chiều",
      difficulty: 'EASY' as const
    },
    {
      content: "Một máy biến áp lí tưởng có số vòng dây của cuộn sơ cấp và cuộn thứ cấp lần lượt là $N_1$ và $N_2$. Đặt điện áp hiệu dụng $U_1$ vào hai đầu cuộn sơ cấp thì điện áp hiệu dụng ở hai đầu cuộn thứ cấp để hở là $U_2$. Hệ thức nào sau đây đúng?",
      options: [
        { label: 'A', text: "\\frac{U_2}{U_1} = \\frac{N_1}{N_2}" },
        { label: 'B', text: "\\frac{U_2}{U_1} = \\frac{N_2}{N_1}" },
        { label: 'C', text: "U_1 U_2 = N_1 N_2" },
        { label: 'D', text: "\\frac{U_2}{U_1} = \\sqrt{\\frac{N_2}{N_1}}" }
      ],
      correctAnswer: 'B',
      explanation: "Hệ thức máy biến áp lí tưởng: U_2 / U_1 = N_2 / N_1.",
      topic: "Dòng điện xoay chiều",
      difficulty: 'EASY' as const
    },
    {
      content: "Tia hồng ngoại không có tính chất nào sau đây?",
      options: [
        { label: 'A', text: "Có tác dụng nhiệt rất mạnh" },
        { label: 'B', text: "Có khả năng gây ra một số phản ứng hóa học" },
        { label: 'C', text: "Có khả năng đâm xuyên cực mạnh, đi qua được tấm chì dày" },
        { label: 'D', text: "Có thể biến điệu như sóng điện từ cao tần" }
      ],
      correctAnswer: 'C',
      explanation: "Tia hồng ngoại không có khả năng đâm xuyên mạnh (đây là tính chất của tia X hoặc tia gamma).",
      topic: "Sóng ánh sáng",
      difficulty: 'EASY' as const
    },
    {
      content: "Theo thuyết lượng tử ánh sáng, mỗi lần một nguyên tử hay phân tử phát xạ ánh sáng thì chúng phát ra:",
      options: [
        { label: 'A', text: "Một êlectron" },
        { label: 'B', text: "Một nơtron" },
        { label: 'C', text: "Một phôtôn" },
        { label: 'D', text: "Một proton" }
      ],
      correctAnswer: 'C',
      explanation: "Theo thuyết lượng tử, mỗi lần phát xạ hay hấp thụ ánh sáng, nguyên tử/phân tử phát ra hay hấp thụ một phôtôn.",
      topic: "Lượng tử ánh sáng",
      difficulty: 'EASY' as const
    },
    {
      content: "Số nuclôn có trong hạt nhân $^{235}_{92}U$ là:",
      options: [
        { label: 'A', text: "92" },
        { label: 'B', text: "143" },
        { label: 'C', text: "235" },
        { label: 'D', text: "327" }
      ],
      correctAnswer: 'C',
      explanation: "Số nuclôn chính là số khối A của hạt nhân. Ký hiệu hạt nhân ^A_Z X, vậy hạt nhân U-235 có số khối A = 235.",
      topic: "Vật lí hạt nhân",
      difficulty: 'EASY' as const
    },
    {
      content: "Một mạch dao động LC lí tưởng gồm cuộn cảm thuần có độ tự cảm $L = 2\\text{ mH}$ và tụ điện có điện dung $C = 8\\text{ nF}$. Chu kì dao động riêng của mạch là:",
      options: [
        { label: 'A', text: "8\\pi \\cdot 10^{-6}\\text{ s}" },
        { label: 'B', text: "4\\pi \\cdot 10^{-6}\\text{ s}" },
        { label: 'C', text: "16\\pi \\cdot 10^{-6}\\text{ s}" },
        { label: 'D', text: "2\\pi \\cdot 10^{-6}\\text{ s}" }
      ],
      correctAnswer: 'A',
      explanation: "Chu kì dao động riêng của mạch LC: T = 2\\pi\\sqrt{LC} = 2\\pi\\sqrt{2\\cdot 10^{-3} \\cdot 8\\cdot 10^{-9}} = 8\\pi \\cdot 10^{-6}\\text{ s}.",
      topic: "Dao động và sóng điện từ",
      difficulty: 'MEDIUM' as const
    },
    {
      content: "Trong chân không, bức xạ có bước sóng nào sau đây thuộc miền ánh sáng nhìn thấy?",
      options: [
        { label: 'A', text: "550 nm" },
        { label: 'B', text: "200 nm" },
        { label: 'C', text: "950 nm" },
        { label: 'D', text: "4.5 \\mu m" }
      ],
      correctAnswer: 'A',
      explanation: "Miền ánh sáng nhìn thấy có bước sóng từ khoảng 380 nm đến 760 nm. Bức xạ 550 nm thuộc miền này.",
      topic: "Sóng ánh sáng",
      difficulty: 'EASY' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Vật Lý 2024 - Mã đề 201',
    'Vật lý',
    'A01',
    50,
    physicsAnswers201,
    physicsDetailedQ,
    teacherB.id
  );

  console.log('[Seed] Seeding Official 2023 THPT Quốc Gia past exams...');

  // 1. MATH 2023 (Mã đề 101) - 50 questions
  const mathAnswers2023_101 = [
    'A', 'B', 'B', 'D', 'C', 'A', 'D', 'A', 'A', 'B',
    'D', 'B', 'C', 'D', 'C', 'C', 'B', 'B', 'A', 'C',
    'B', 'C', 'B', 'B', 'D', 'C', 'B', 'D', 'D', 'C',
    'D', 'C', 'B', 'D', 'C', 'C', 'D', 'D', 'B', 'C',
    'D', 'D', 'C', 'C', 'B', 'D', 'A', 'B', 'A', 'D'
  ];

  const mathDetailedQ2023 = [
    {
      content: "Cho hàm số y = f(x) có bảng xét dấu đạo hàm như sau. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?",
      options: [
        { label: 'A', text: "(0; 2)" },
        { label: 'B', text: "(-\\infty; 0)" },
        { label: 'C', text: "(2; +\\infty)" },
        { label: 'D', text: "(-1; 2)" }
      ],
      correctAnswer: 'A',
      explanation: "Nhìn bảng xét dấu, đạo hàm f'(x) mang dấu âm trên khoảng (0; 2) nên hàm số nghịch biến trên khoảng (0; 2).",
      topic: "Sự biến thiên của hàm số",
      difficulty: 'EASY' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Toán 2023 - Mã đề 101',
    'Toán học',
    'A01',
    90,
    mathAnswers2023_101,
    mathDetailedQ2023,
    teacherA.id
  );

  // 2. ENGLISH 2023 (Mã đề 401) - 50 questions
  const englishAnswers2023_401 = [
    'D', 'A', 'C', 'A', 'D', 'D', 'C', 'C', 'A', 'C',
    'D', 'A', 'B', 'C', 'C', 'D', 'C', 'D', 'B', 'A',
    'D', 'B', 'A', 'D', 'A', 'D', 'B', 'A', 'D', 'C',
    'B', 'C', 'A', 'B', 'B', 'D', 'C', 'C', 'B', 'C',
    'C', 'B', 'D', 'B', 'B', 'D', 'D', 'B', 'C', 'B'
  ];

  const englishDetailedQ2023 = [
    {
      content: "Hong and Mike are in the school canteen. – Hong: 'Can you pass the salt, please?' – Mike: '______'",
      options: [
        { label: 'A', text: "Yes, you are" },
        { label: 'B', text: "It doesn't matter" },
        { label: 'C', text: "Not at all" },
        { label: 'D', text: "Here you are" }
      ],
      correctAnswer: 'D',
      explanation: "Mike trả lời khi lấy muối giúp bạn: 'Here you are' (Của bạn đây/gửi bạn).",
      topic: "Communication",
      difficulty: 'EASY' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Tiếng Anh 2023 - Mã đề 401',
    'Tiếng Anh',
    'D01',
    60,
    englishAnswers2023_401,
    englishDetailedQ2023,
    teacherA.id
  );

  // 3. PHYSICS 2023 (Mã đề 201) - 40 questions
  const physicsAnswers2023_201 = [
    'A', 'A', 'B', 'B', 'A', 'A', 'D', 'B', 'C', 'D',
    'D', 'C', 'C', 'A', 'B', 'A', 'D', 'A', 'C', 'D',
    'D', 'A', 'C', 'C', 'C', 'A', 'A', 'D', 'D', 'C',
    'A', 'C', 'A', 'C', 'B', 'C', 'B', 'D', 'C', 'A'
  ];

  const physicsDetailedQ2023 = [
    {
      content: "Trong dao động điều hòa của con lắc lò xo, đại lượng I_0 (hoặc cường độ cực đại trong dòng điện xoay chiều) được gọi là:",
      options: [
        { label: 'A', text: "Cường độ dòng điện cực đại" },
        { label: 'B', text: "Cường độ dòng điện hiệu dụng" },
        { label: 'C', text: "Cường độ dòng điện tức thời" },
        { label: 'D', text: "Cường độ dòng điện trung bình" }
      ],
      correctAnswer: 'A',
      explanation: "Ký hiệu có số 0 ở chân (như I0, U0, E0) là giá trị cực đại.",
      topic: "Dòng điện xoay chiều",
      difficulty: 'EASY' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Vật Lý 2023 - Mã đề 201',
    'Vật lý',
    'A01',
    50,
    physicsAnswers2023_201,
    physicsDetailedQ2023,
    teacherB.id
  );

  console.log('[Seed] Seeding Official 2022 THPT Quốc Gia past exams...');

  // 4. MATH 2022 (Mã đề 101) - 50 questions
  const mathAnswers2022_101 = [
    'A', 'B', 'D', 'C', 'B', 'C', 'C', 'C', 'B', 'A',
    'C', 'D', 'D', 'C', 'B', 'C', 'B', 'C', 'D', 'B',
    'A', 'B', 'C', 'C', 'C', 'B', 'A', 'D', 'D', 'C',
    'A', 'B', 'B', 'D', 'C', 'D', 'D', 'D', 'B', 'B',
    'D', 'D', 'B', 'C', 'B', 'D', 'D', 'D', 'B', 'C'
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Toán 2022 - Mã đề 101',
    'Toán học',
    'A01',
    90,
    mathAnswers2022_101,
    [],
    teacherA.id
  );

  // 5. ENGLISH 2022 (Mã đề 401) - 50 questions
  const englishAnswers2022_401 = [
    'C', 'D', 'A', 'D', 'D', 'C', 'D', 'B', 'C', 'A',
    'B', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B',
    'C', 'D', 'A', 'B', 'A', 'D', 'B', 'C', 'D', 'C',
    'B', 'A', 'C', 'B', 'C', 'A', 'D', 'A', 'C', 'B',
    'D', 'C', 'A', 'D', 'C', 'D', 'B', 'C', 'A', 'D'
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Tiếng Anh 2022 - Mã đề 401',
    'Tiếng Anh',
    'D01',
    60,
    englishAnswers2022_401,
    [],
    teacherA.id
  );

  // 6. PHYSICS 2022 (Mã đề 201) - 40 questions
  const physicsAnswers2022_201 = [
    'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C',
    'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D',
    'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C',
    'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D'
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Vật Lý 2022 - Mã đề 201',
    'Vật lý',
    'A01',
    50,
    physicsAnswers2022_201,
    [],
    teacherB.id
  );

  console.log('[Seed] Seeding School Mock exams...');
  // 7. Chuyên Hà Nội - Amsterdam (Toán 2024) - 50 questions
  const mathAnswersAms = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'
  ];
  await createPastExam(
    'Đề thi thử Toán THPTQG 2024 - Chuyên Hùng Vương',
    'Toán học',
    'A01',
    90,
    mathAnswersAms,
    [],
    teacherA.id
  );

  // 8. Chuyên Lam Sơn (Vật Lý 2024) - 40 questions
  const physicsAnswersLamSon = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'
  ];
  await createPastExam(
    'Đề thi thử Vật lý THPTQG 2024 - Chuyên Lam Sơn',
    'Vật lý',
    'A01',
    50,
    physicsAnswersLamSon,
    [],
    teacherB.id
  );

  // 9. Chuyên Phan Bội Châu (Tiếng Anh 2024) - 50 questions
  const englishAnswersPBC = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'
  ];
  await createPastExam(
    'Đề thi thử Tiếng Anh THPTQG 2024 - Chuyên Phan Bội Châu',
    'Tiếng Anh',
    'D01',
    60,
    englishAnswersPBC,
    [],
    teacherA.id
  );

  console.log('[Seed] Seeding Aptitude exams...');
  // 10. HSA ĐHQG Hà Nội - 50 questions
  const hsaAnswers = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'
  ];
  await createPastExam(
    'Đề thi Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đề minh họa',
    'Đánh giá năng lực',
    'A01',
    150,
    hsaAnswers,
    [],
    teacherA.id
  );

  // 11. ĐGNL ĐHQG TP.HCM - 50 questions
  const dgnlAnswers = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'
  ];
  await createPastExam(
    'Đề thi Đánh giá năng lực ĐHQG TP.HCM - Đề ôn tập',
    'Đánh giá năng lực',
    'D01',
    120,
    dgnlAnswers,
    [],
    teacherB.id
  );

  // 12. CHEMISTRY 2024 - 40 questions
  const chemistryAnswers2024 = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'
  ];
  const chemistryDetailedQ = [
    {
      content: "Chất nào sau đây là chất điện li mạnh?",
      options: [
        { label: 'A', text: "NaCl" },
        { label: 'B', text: "CH_3COOH" },
        { label: 'C', text: "H_2O" },
        { label: 'D', text: "C_2H_5OH" }
      ],
      correctAnswer: 'A',
      explanation: "NaCl là muối tan, điện li hoàn toàn trong nước tạo ion Na+ và Cl-, nên là chất điện li mạnh.",
      topic: "Sự điện li",
      difficulty: 'EASY' as const
    },
    {
      content: "Kim loại nào sau đây có tính khử yếu nhất?",
      options: [
        { label: 'A', text: "K" },
        { label: 'B', text: "Al" },
        { label: 'C', text: "Fe" },
        { label: 'D', text: "Ag" }
      ],
      correctAnswer: 'D',
      explanation: "Trong các kim loại trên, Ag (bạc) hoạt động hóa học kém nhất nên có tính khử yếu nhất.",
      topic: "Tính chất của kim loại",
      difficulty: 'EASY' as const
    },
    {
      content: "Công thức hóa học của sắt(III) hiđroxit là:",
      options: [
        { label: 'A', text: "Fe(OH)_2" },
        { label: 'B', text: "Fe(OH)_3" },
        { label: 'C', text: "Fe_2O_3" },
        { label: 'D', text: "FeO" }
      ],
      correctAnswer: 'B',
      explanation: "Sắt(III) hiđroxit có công thức hóa học là Fe(OH)_3.",
      topic: "Sắt và hợp chất của sắt",
      difficulty: 'EASY' as const
    },
    {
      content: "Khí làm đục nước vôi trong dư khi sục vào là:",
      options: [
        { label: 'A', text: "CO_2" },
        { label: 'B', text: "H_2" },
        { label: 'C', text: "O_2" },
        { label: 'D', text: "N_2" }
      ],
      correctAnswer: 'A',
      explanation: "Khí CO_2 phản ứng với nước vôi trong Ca(OH)_2 dư tạo kết tủa CaCO_3 làm đục dung dịch.",
      topic: "Hợp chất của Cacbon",
      difficulty: 'EASY' as const
    },
    {
      content: "Chất nào sau đây là este?",
      options: [
        { label: 'A', text: "CH_3COOCH_3" },
        { label: 'B', text: "CH_3COOH" },
        { label: 'C', text: "CH_3CHO" },
        { label: 'D', text: "CH_3OH" }
      ],
      correctAnswer: 'A',
      explanation: "CH_3COOCH_3 (metyl axetat) có nhóm chức -COO- của este.",
      topic: "Este - Lipit",
      difficulty: 'EASY' as const
    },
    {
      content: "Công thức phân tử của glucozơ là:",
      options: [
        { label: 'A', text: "C_{12}H_{22}O_{11}" },
        { label: 'B', text: "C_6H_{12}O_6" },
        { label: 'C', text: "(C_6H_{10}O_5)_n" },
        { label: 'D', text: "CH_3COOH" }
      ],
      correctAnswer: 'B',
      explanation: "Glucozơ là monosaccarit có công thức phân tử C_6H_{12}O_6.",
      topic: "Cacbohiđrat",
      difficulty: 'EASY' as const
    },
    {
      content: "Polime nào sau đây được điều chế bằng phản ứng trùng ngưng?",
      options: [
        { label: 'A', text: "Nilon-6,6" },
        { label: 'B', text: "Polietilen (PE)" },
        { label: 'C', text: "Poli(vinyl clorua) (PVC)" },
        { label: 'D', text: "Polibutadien" }
      ],
      correctAnswer: 'A',
      explanation: "Nilon-6,6 được tổng hợp bằng phản ứng trùng ngưng hexametylenđiamin và axit adipic.",
      topic: "Polime",
      difficulty: 'EASY' as const
    },
    {
      content: "Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?",
      options: [
        { label: 'A', text: "Metylamin" },
        { label: 'B', text: "Anilin" },
        { label: 'C', text: "Glycin" },
        { label: 'D', text: "Axit axetic" }
      ],
      correctAnswer: 'A',
      explanation: "Metylamin (CH_3NH_2) có tính bazơ đủ mạnh làm quỳ tím hóa xanh. Anilin có tính bazơ rất yếu không làm đổi màu quỳ. Glycin lưỡng tính gần như trung tính.",
      topic: "Amin - Amino axit",
      difficulty: 'EASY' as const
    },
    {
      content: "Số liên kết peptit có trong phân tử tripeptit Gly-Ala-Val là:",
      options: [
        { label: 'A', text: "3" },
        { label: 'B', text: "2" },
        { label: 'C', text: "1" },
        { label: 'D', text: "4" }
      ],
      correctAnswer: 'B',
      explanation: "Tripeptit cấu tạo từ 3 gốc amino axit liên kết bởi 2 liên kết peptit.",
      topic: "Peptit - Protein",
      difficulty: 'EASY' as const
    },
    {
      content: "Cho 4,5 gam etylamin ($C_2H_5NH_2$, $M=45$) tác dụng vừa đủ với axit HCl. Khối lượng muối thu được sau phản ứng là:",
      options: [
        { label: 'A', text: "8,15 gam" },
        { label: 'B', text: "7,65 gam" },
        { label: 'C', text: "9,25 gam" },
        { label: 'D', text: "6,85 gam" }
      ],
      correctAnswer: 'A',
      explanation: "n_amin = 4,5 / 45 = 0,1 mol. m_muối = 4,5 + 0,1 * 36,5 = 8,15 gam.",
      topic: "Amin - Amino axit",
      difficulty: 'MEDIUM' as const
    }
  ];

  await createPastExam(
    'Đề thi chính thức THPT QG Môn Hóa học 2024 - Mã đề 201',
    'Hóa học',
    'B00',
    50,
    chemistryAnswers2024,
    chemistryDetailedQ,
    teacherA.id
  );

  // 13. CHEMISTRY 2023 - 40 questions
  const chemistryAnswers2023 = [
    'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C',
    'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D',
    'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C',
    'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Hóa học 2023 - Mã đề 201',
    'Hóa học',
    'B00',
    50,
    chemistryAnswers2023,
    [],
    teacherA.id
  );

  // 14. CHEMISTRY 2022 - 40 questions
  const chemistryAnswers2022 = [
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Hóa học 2022 - Mã đề 201',
    'Hóa học',
    'B00',
    50,
    chemistryAnswers2022,
    [],
    teacherA.id
  );

  // 15. BIOLOGY 2024 - 40 questions
  const biologyAnswers2024 = [
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Sinh học 2024 - Mã đề 201',
    'Sinh học',
    'B00',
    50,
    biologyAnswers2024,
    [],
    teacherB.id
  );

  // 16. BIOLOGY 2023 - 40 questions
  const biologyAnswers2023 = [
    'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C',
    'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D',
    'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C',
    'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Sinh học 2023 - Mã đề 201',
    'Sinh học',
    'B00',
    50,
    biologyAnswers2023,
    [],
    teacherB.id
  );

  // 17. BIOLOGY 2022 - 40 questions
  const biologyAnswers2022 = [
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B',
    'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D',
    'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Sinh học 2022 - Mã đề 201',
    'Sinh học',
    'B00',
    50,
    biologyAnswers2022,
    [],
    teacherB.id
  );

  // 18. MATH 2021 - 50 questions
  const mathAnswers2021 = [
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Toán 2021 - Mã đề 101',
    'Toán học',
    'A01',
    90,
    mathAnswers2021,
    [],
    teacherA.id
  );

  // 19. ENGLISH 2021 - 50 questions
  const englishAnswers2021 = [
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Tiếng Anh 2021 - Mã đề 401',
    'Tiếng Anh',
    'D01',
    60,
    englishAnswers2021,
    [],
    teacherA.id
  );

  // 20. PHYSICS 2021 - 40 questions
  const physicsAnswers2021 = [
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A',
    'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D',
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A',
    'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Vật Lý 2021 - Mã đề 201',
    'Vật lý',
    'A01',
    50,
    physicsAnswers2021,
    [],
    teacherB.id
  );

  // 21. CHEMISTRY 2021 - 40 questions
  const chemistryAnswers2021 = [
    'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C',
    'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A',
    'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C',
    'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Hóa học 2021 - Mã đề 201',
    'Hóa học',
    'B00',
    50,
    chemistryAnswers2021,
    [],
    teacherA.id
  );

  // 22. BIOLOGY 2021 - 40 questions
  const biologyAnswers2021 = [
    'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A',
    'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C',
    'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A',
    'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Sinh học 2021 - Mã đề 201',
    'Sinh học',
    'B00',
    50,
    biologyAnswers2021,
    [],
    teacherB.id
  );

  // 23. MATH 2020 - 50 questions
  const mathAnswers2020 = [
    'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B',
    'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A',
    'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B',
    'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A',
    'D', 'B', 'C', 'A', 'D', 'B', 'C', 'A', 'D', 'B'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Toán 2020 - Mã đề 101',
    'Toán học',
    'A01',
    90,
    mathAnswers2020,
    [],
    teacherA.id
  );

  // 24. ENGLISH 2020 - 50 questions
  const englishAnswers2020 = [
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A',
    'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D',
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A',
    'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D',
    'C', 'A', 'B', 'D', 'C', 'A', 'B', 'D', 'C', 'A'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Tiếng Anh 2020 - Mã đề 401',
    'Tiếng Anh',
    'D01',
    60,
    englishAnswers2020,
    [],
    teacherA.id
  );

  // 25. PHYSICS 2020 - 40 questions
  const physicsAnswers2020 = [
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Vật Lý 2020 - Mã đề 201',
    'Vật lý',
    'A01',
    50,
    physicsAnswers2020,
    [],
    teacherB.id
  );

  // 26. CHEMISTRY 2020 - 40 questions
  const chemistryAnswers2020 = [
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C',
    'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D',
    'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A', 'C'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Hóa học 2020 - Mã đề 201',
    'Hóa học',
    'B00',
    50,
    chemistryAnswers2020,
    [],
    teacherA.id
  );

  // 27. BIOLOGY 2020 - 40 questions
  const biologyAnswers2020 = [
    'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B',
    'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D',
    'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B',
    'A', 'D', 'C', 'B', 'A', 'D', 'C', 'B', 'A', 'D'
  ];
  await createPastExam(
    'Đề thi chính thức THPT QG Môn Sinh học 2020 - Mã đề 201',
    'Sinh học',
    'B00',
    50,
    biologyAnswers2020,
    [],
    teacherB.id
  );

  console.log('[Seed] Seeding default forum categories...');
  const defaultCategories = [
    { name: 'Toán học', slug: 'toan-hoc', description: 'Thảo luận và học hỏi kiến thức môn Toán học THPTQG' },
    { name: 'Vật lý', slug: 'vat-ly', description: 'Trao đổi lời giải bài tập Vật lý và đề thi thử' },
    { name: 'Hóa học', slug: 'hoa-hoc', description: 'Góc học tập môn Hóa học lớp 10, 11, 12' },
    { name: 'Tiếng Anh', slug: 'tieng-anh', description: 'Chia sẻ từ vựng, ngữ pháp và đề thi mẫu THPTQG' },
    { name: 'Sinh học', slug: 'sinh-hoc', description: 'Nơi thảo luận về môn Sinh học và kiến thức liên quan' },
    { name: 'Thảo luận chung', slug: 'thao-luan-chung', description: 'Chia sẻ kinh nghiệm thi cử, phương pháp học tập chung' }
  ];

  for (const cat of defaultCategories) {
    await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        allowedRoles: ['STUDENT', 'TEACHER', 'ADMIN']
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        allowedRoles: ['STUDENT', 'TEACHER', 'ADMIN']
      }
    });
  }

  // =========================================================================
  // SEED ADDITIONAL EDTECH & FORUM RELATION TABLES (ENSURING NO EMPTY TABLES)
  // =========================================================================
  console.log('[Seed] Seeding Reviews...');
  await prisma.review.create({
    data: {
      courseId: courseA.id,
      studentId: studentList[0].id,
      rating: 5,
      comment: 'Khóa học cực kỳ chi tiết, giúp em củng cố lý thuyết rất nhiều!'
    }
  });
  await prisma.review.create({
    data: {
      courseId: courseB.id,
      studentId: studentList[1].id,
      rating: 4,
      comment: 'Thầy dạy hay và ví dụ minh họa dễ hiểu, em rất thích bài giảng Este.'
    }
  });

  console.log('[Seed] Seeding Enrollments...');
  await prisma.enrollment.create({
    data: {
      studentId: studentList[0].id,
      courseId: courseA.id,
      transactionId: 'TX1000000001',
      paidAt: new Date()
    }
  });
  await prisma.enrollment.create({
    data: {
      studentId: studentList[1].id,
      courseId: courseB.id,
      transactionId: 'TX1000000002',
      paidAt: new Date()
    }
  });

  console.log('[Seed] Seeding Lesson Documents...');
  const lessonsA = await prisma.lesson.findMany({ where: { courseId: courseA.id } });
  if (lessonsA.length > 0) {
    await prisma.document.create({
      data: {
        title: 'Tài liệu bài giảng Khảo sát hàm số',
        fileUrl: 'https://edupath.vn/docs/khao-sat-ham-so.pdf',
        fileType: 'PDF',
        lessonId: lessonsA[0].id,
        uploadedBy: teacherA.id
      }
    });
  }

  console.log('[Seed] Seeding ChatMessages...');
  await prisma.chatMessage.create({
    data: {
      studentId: studentList[0].id,
      role: 'user',
      content: 'Em muốn hỏi công thức tính nhanh thể tích khối chóp tứ diện đều?',
      roomId: 'room-math-101'
    }
  });
  await prisma.chatMessage.create({
    data: {
      studentId: studentList[0].id,
      role: 'assistant',
      content: 'Công thức tính nhanh thể tích tứ diện đều cạnh $a$ là: $V = \\frac{a^3\\sqrt{2}}{12}$.',
      roomId: 'room-math-101'
    }
  });

  console.log('[Seed] Seeding Notifications...');
  await prisma.notification.create({
    data: {
      userId: studentList[0].id,
      title: 'Chúc mừng bạn gia nhập EduPath!',
      message: 'Hãy bắt đầu thi thử hoặc đăng ký các khóa học để ôn tập tốt nhất.',
      isRead: false
    }
  });

  console.log('[Seed] Seeding Roadmaps...');
  await prisma.roadmap.create({
    data: {
      studentId: studentList[0].id,
      content: {
        currentLevel: 'Trung bình',
        targetScore: 9.0,
        focusTopics: ['Số phức', 'Khối đa diện', 'Oxyz'],
        weeklyPlan: [
          { week: 1, topic: 'Ôn tập Hàm số nâng cao', completed: true },
          { week: 2, topic: 'Luyện đề thi thử 2024', completed: false }
        ]
      }
    }
  });

  console.log('[Seed] Seeding OtpVerification...');
  await prisma.otpVerification.create({
    data: {
      email: 'student_temp@gmail.com',
      otpHash: await bcrypt.hash('123456', 12),
      purpose: 'REGISTRATION',
      expiresAt: new Date(Date.now() + 3600000)
    }
  });

  console.log('[Seed] Seeding RoleChangeRequest...');
  await prisma.roleChangeRequest.create({
    data: {
      userId: studentList[2].id,
      currentRole: 'STUDENT',
      requestedRole: 'TEACHER',
      reason: 'Tôi muốn đóng góp các bài giảng luyện đề môn Tiếng Anh và Hóa học.',
      status: 'PENDING'
    }
  });

  console.log('[Seed] Seeding Forum tables...');
  const category = await prisma.forumCategory.upsert({
    where: { slug: 'thao-luan-mon-toan' },
    update: {
      name: 'Thảo luận môn Toán',
      description: 'Nơi trao đổi bài tập khó, phương pháp giải nhanh trắc nghiệm môn Toán.'
    },
    create: {
      name: 'Thảo luận môn Toán',
      slug: 'thao-luan-mon-toan',
      description: 'Nơi trao đổi bài tập khó, phương pháp giải nhanh trắc nghiệm môn Toán.'
    }
  });
  const post = await prisma.forumPost.create({
    data: {
      title: 'Cách bấm máy tính giải nhanh số phức THPTQG 2024?',
      slug: 'cach-bam-may-tinh-giai-nhanh-so-phuc-thptqg-2024',
      content: 'Mọi người cho em hỏi có mẹo nào dùng Casio fx-580 để tìm nhanh căn bậc hai của số phức không ạ?',
      categoryId: category.id,
      authorId: studentList[0].id,
      postType: 'QA'
    }
  });
  const comment = await prisma.forumComment.create({
    data: {
      postId: post.id,
      authorId: teacherA.id,
      content: 'Chào em, em có thể sử dụng tính năng Mode 2 (Complex) rồi bấm căn bậc hai của số phức bình thường. Đối với các bài tìm căn bậc hai phức tạp, ta có thể dùng công thức đổi qua dạng lượng giác hoặc thử ngược lại đáp án nhé.'
    }
  });
  await prisma.forumReaction.create({
    data: {
      userId: studentList[1].id,
      postId: post.id,
      type: 'LIKE'
    }
  });
  const tag = await prisma.forumTag.create({
    data: {
      name: 'CasioToan',
      slug: 'casio-toan'
    }
  });
  // Link tag to post
  await prisma.forumPost.update({
    where: { id: post.id },
    data: {
      tags: { connect: { id: tag.id } }
    }
  });

  console.log('[Seed] Seeding Study Groups...');
  const group = await prisma.studyGroup.create({
    data: {
      name: 'Chiến thần chinh phục 9+ Toán Lý Hóa',
      description: 'Nhóm dành cho các học sinh ôn thi khối A00 và A01 quyết tâm đạt điểm cao.',
      creatorId: teacherA.id
    }
  });
  await prisma.studyGroupMember.create({
    data: {
      groupId: group.id,
      userId: studentList[0].id,
      role: 'MEMBER'
    }
  });
  await prisma.groupAnnouncement.create({
    data: {
      groupId: group.id,
      title: 'Lịch thi thử chung tuần này',
      content: 'Chúng ta sẽ thi thử chung đề Toán 2024 vào tối thứ Bảy lúc 20h00 nhé các em.',
      authorId: teacherA.id
    }
  });

  console.log('[Seed] Seeding ResourceShare...');
  const resourcePost = await prisma.forumPost.create({
    data: {
      title: 'Tóm tắt toàn bộ công thức giải nhanh Vật lý 12',
      slug: 'tom-tat-toan-bo-cong-thuc-giai-nhanh-vat-ly-12',
      content: 'Chia sẻ tài liệu PDF tóm tắt đầy đủ công thức giải nhanh 7 chương Vật lý 12 cực kỳ hữu ích.',
      categoryId: category.id,
      authorId: teacherB.id,
      postType: 'RESOURCE'
    }
  });
  await prisma.resourceShare.create({
    data: {
      postId: resourcePost.id,
      fileUrl: 'https://edupath.vn/resources/vatly12-quick.pdf',
      fileType: 'PDF',
      fileSize: 4500000,
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewedAt: new Date()
    }
  });

  console.log('[Seed] Seeding Reputation and Badges...');
  await prisma.reputationHistory.create({
    data: {
      userId: studentList[0].id,
      points: 10,
      action: 'POST_CREATED'
    }
  });
  const badge = await prisma.badge.create({
    data: {
      name: 'Chăm Chỉ',
      description: 'Đăng bài viết hỏi đáp đầu tiên trên diễn đàn.',
      iconUrl: 'badge_first_post',
      category: 'POSTING',
      criteria: { count: 1 }
    }
  });
  await prisma.userBadge.create({
    data: {
      userId: studentList[0].id,
      badgeId: badge.id
    }
  });
  await prisma.userGamification.create({
    data: {
      userId: studentList[0].id,
      level: 2,
      xp: 250,
      streakDays: 3,
      lastActiveDate: new Date()
    }
  });

  console.log('[Seed] Seeding ForumReport and AuditLogs...');
  await prisma.forumReport.create({
    data: {
      reporterId: studentList[1].id,
      postId: post.id,
      reason: 'Nội dung chứa liên kết quảng cáo spam.',
      status: 'PENDING'
    }
  });
  await prisma.forumAuditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'DELETE_POST',
      targetId: String(post.id),
      details: 'Xóa bài viết spam theo báo cáo từ người dùng.',
      ipAddress: '127.0.0.1'
    }
  });

  const firstMathExam = await prisma.exam.findFirst({ where: { subject: 'Toán học' } });
  const targetExamId = firstMathExam ? firstMathExam.id : 1;

  console.log('[Seed] Seeding TestAttempts & TestAttemptAnswers...');
  const attempt = await prisma.testAttempt.create({
    data: {
      studentId: studentList[0].id,
      examId: targetExamId,
      score: 8.4,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
      durationUsed: 2700,
      correctCount: 42,
      wrongCount: 8,
      skippedCount: 0,
      status: 'SUBMITTED',
      aiFeedback: {
        assessment: 'Kết quả khá tốt! Bạn đạt 8.4 điểm.',
        knowledgeGaps: ['Số phức nâng cao'],
        strongAreas: ['Khảo sát hàm số', 'Tích phân'],
        advice: ['Luyện thêm các câu số phức vận dụng cao.'],
        encouragement: 'Tiếp tục cố gắng phát huy nhé!'
      }
    }
  });

  // Fetch created math questions for this exam
  const examMathQuestions = await prisma.examQuestion.findMany({ where: { examId: targetExamId } });
  if (examMathQuestions.length > 0) {
    await prisma.testAttemptAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: examMathQuestions[0].questionId,
        selectedAnswer: 'A',
        isCorrect: true
      }
    });
  }

  console.log('[Seed] Seeding additional test data requested...');

  // Note: pending.teacher was created above with pending teacher accounts. We preserve variable references.
  // const pendingTeacher = await prisma.user.findUnique({ where: { email: 'pending.teacher@edupath.vn' } });

  // 2. Thêm 2 Course pending approval
  const coursePending1 = await prisma.course.create({
    data: {
      title: 'Hình học giải tích nâng cao Oxyz',
      description: 'Chương trình ôn tập toàn bộ phần Hình học giải tích nâng cao.',
      subject: 'Toán học',
      price: 350.0,
      isPublished: false,
      isApproved: false,
      teacherId: teacherA.id
    }
  });

  const coursePending2 = await prisma.course.create({
    data: {
      title: 'Luyện đề Tiếng Anh nâng cao 9+',
      description: 'Khóa học ôn đề thực chiến bám sát đề thi 2026.',
      subject: 'Tiếng Anh',
      price: 299.0,
      isPublished: false,
      isApproved: false,
      teacherId: teacherB.id
    }
  });

  // Create two extra approved courses to reach 5 courses total for enrollments
  const courseD = await prisma.course.create({
    data: {
      title: 'Chinh phục ngữ pháp Tiếng Anh 12',
      description: 'Lộ trình ngữ pháp trọng tâm ôn thi THPTQG.',
      subject: 'Tiếng Anh',
      price: 250.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherB.id
    }
  });

  const courseE = await prisma.course.create({
    data: {
      title: 'Sinh học tế bào và di truyền',
      description: 'Lý thuyết cơ bản và bài tập di truyền học.',
      subject: 'Sinh học',
      price: 300.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id
    }
  });

  // 3. Thêm 5 enrollment cho mỗi student (đa dạng khóa)
  const coursesToEnroll = [courseA, courseB, courseC, courseD, courseE];
  for (let sIdx = 0; sIdx < studentList.length; sIdx++) {
    const student = studentList[sIdx];
    for (let cIdx = 0; cIdx < coursesToEnroll.length; cIdx++) {
      const course = coursesToEnroll[cIdx];
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          transactionId: `SEED_ENROLL_${student.id}_${course.id}_${Date.now() + cIdx}`,
          paidAt: new Date()
        }
      });
    }
  }

  // 4. Thêm 3 RoleChangeRequest pending
  await prisma.roleChangeRequest.create({
    data: {
      userId: studentList[0].id,
      currentRole: 'STUDENT',
      requestedRole: 'TEACHER',
      reason: 'Tôi muốn đóng góp các bài giảng toán học chất lượng cao.',
      status: 'PENDING'
    }
  });

  await prisma.roleChangeRequest.create({
    data: {
      userId: studentList[1].id,
      currentRole: 'STUDENT',
      requestedRole: 'TEACHER',
      reason: 'Tôi muốn chia sẻ tài liệu ôn thi Vật lý.',
      status: 'PENDING'
    }
  });

  await prisma.roleChangeRequest.create({
    data: {
      userId: studentList[2].id,
      currentRole: 'STUDENT',
      requestedRole: 'ADMIN',
      reason: 'Yêu cầu làm admin hỗ trợ hệ thống.',
      status: 'PENDING'
    }
  });

  // 5. Thêm 10 TestAttempt với điểm khác nhau
  const exams = [examA, examB];
  for (let i = 0; i < 10; i++) {
    const student = studentList[i % studentList.length];
    const exam = exams[i % exams.length];
    const score = 2.0 + (i * 0.8); // Points: 2.0, 2.8, 3.6, 4.4, 5.2, 6.0, 6.8, 7.6, 8.4, 9.2
    await prisma.testAttempt.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        score,
        startedAt: new Date(Date.now() - 3600000),
        submittedAt: new Date(),
        status: 'SUBMITTED',
        correctCount: Math.round(score * 2),
        wrongCount: 20 - Math.round(score * 2),
        durationUsed: 1200
      }
    });
  }

  // 6. Thêm 5 ForumPost + 3 ForumReport pending
  const categoriesList = await prisma.forumCategory.findMany();
  const targetCategory = categoriesList[0] || { id: 1 };
  
  const createdPosts = [];
  for (let i = 1; i <= 5; i++) {
    const post = await prisma.forumPost.create({
      data: {
        title: `Bài thảo luận học tập số ${i}`,
        content: `Nội dung chi tiết bài viết chia sẻ kinh nghiệm học tập số ${i} trên hệ thống.`,
        slug: `bai-thao-luan-hoc-tap-so-${i}-${Date.now()}`,
        categoryId: targetCategory.id,
        authorId: studentList[i % studentList.length].id,
        postType: 'GENERAL'
      }
    });
    createdPosts.push(post);
  }

  // Create 3 ForumReport pending
  for (let i = 0; i < 3; i++) {
    await prisma.forumReport.create({
      data: {
        reporterId: studentList[(i + 1) % studentList.length].id,
        postId: createdPosts[i].id,
        reason: `Nội dung bài viết số ${i+1} có dấu hiệu spam hoặc ngôn từ không phù hợp.`,
        status: 'PENDING'
      }
    });
  }

  console.log('[Seed] Seeding additional test data completed successfully!');

  await seedRealExamData();


  // Post-process exam grades: distribute exams across Grade 10, 11, and 12
  console.log('[Seed] Post-processing exam grades...');
  const allSeededExams = await prisma.exam.findMany();
  for (let i = 0; i < allSeededExams.length; i++) {
    const exam = allSeededExams[i];
    const grade = 10 + (i % 3); // 10, 11, 12
    await prisma.exam.update({
      where: { id: exam.id },
      data: { grade }
    });
  }

  console.log('[Seed] Seeding 3 approved affiliates and 1 pending affiliate...');
  const affiliateHash = await bcrypt.hash('affiliate123', 12);
  
  const affiliate1 = await prisma.user.create({
    data: {
      email: 'affiliate1@edupath.vn',
      passwordHash: affiliateHash,
      fullName: 'Đối tác Tiếp thị Đồng (Bronze)',
      role: 'AFFILIATE',
      avatarUrl: 'AF1',
      affiliate: {
        create: {
          referralCode: 'REFBRONZ',
          commissionRate: 0.15,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          tier: 'BRONZE',
          bankName: 'Vietcombank',
          bankAccount: '1012345678',
          taxId: '809217823',
          isApproved: true,
          approvedAt: new Date()
        }
      }
    }
  });

  const affiliate2 = await prisma.user.create({
    data: {
      email: 'affiliate2@edupath.vn',
      passwordHash: affiliateHash,
      fullName: 'Đối tác Tiếp thị Bạc (Silver)',
      role: 'AFFILIATE',
      avatarUrl: 'AF2',
      affiliate: {
        create: {
          referralCode: 'REFSILVR',
          commissionRate: 0.18,
          totalEarnings: 450.0,
          pendingEarnings: 150.0,
          paidEarnings: 300.0,
          tier: 'SILVER',
          bankName: 'Techcombank',
          bankAccount: '19012345678',
          taxId: '809217824',
          isApproved: true,
          approvedAt: new Date()
        }
      }
    }
  });

  const affiliate3 = await prisma.user.create({
    data: {
      email: 'affiliate3@edupath.vn',
      passwordHash: affiliateHash,
      fullName: 'Đối tác Tiếp thị Vàng (Gold)',
      role: 'AFFILIATE',
      avatarUrl: 'AF3',
      affiliate: {
        create: {
          referralCode: 'REFGOLDC',
          commissionRate: 0.22,
          totalEarnings: 1200.0,
          pendingEarnings: 400.0,
          paidEarnings: 800.0,
          tier: 'GOLD',
          bankName: 'ACB',
          bankAccount: '202345678',
          taxId: '809217825',
          isApproved: true,
          approvedAt: new Date()
        }
      }
    }
  });

  const affiliatePending = await prisma.user.create({
    data: {
      email: 'pending.affiliate@edupath.vn',
      passwordHash: affiliateHash,
      fullName: 'Đối tác Tiếp thị Chờ Duyệt',
      role: 'AFFILIATE',
      avatarUrl: 'AFP',
      affiliate: {
        create: {
          referralCode: 'REFPNDNG',
          commissionRate: 0.15,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          tier: 'BRONZE',
          bankName: 'Momo',
          bankAccount: '0901234567',
          isApproved: false
        }
      }
    }
  });

  console.log('[Seed] Seeding 50 Referral records...');
  for (let k = 1; k <= 50; k++) {
    const referredEmail = `referred_student_${k}@gmail.com`;
    const refUser = await prisma.user.create({
      data: {
        email: referredEmail,
        passwordHash: studentHash,
        fullName: `Học sinh Được Giới Thiệu ${k}`,
        role: 'STUDENT',
        avatarUrl: `R${k % 9}`,
        student: { create: { subjectGroup: 'A01' } }
      }
    });

    const targetAffiliate = k <= 10 ? affiliate1 : (k <= 35 ? affiliate2 : affiliate3);
    const converted = k % 2 === 0;
    
    await prisma.referral.create({
      data: {
        affiliateId: targetAffiliate.id,
        referredUserId: refUser.id,
        source: k % 4 === 0 ? 'social' : (k % 3 === 0 ? 'email' : 'landing'),
        campaign: k % 3 === 0 ? 'summer_campaign' : 'default',
        isConverted: converted,
        convertedAt: converted ? new Date() : null
      }
    });

    await prisma.user.update({
      where: { id: refUser.id },
      data: { referredBy: targetAffiliate.id }
    });
  }

  console.log('[Seed] Seeding 30 Commission records...');
  for (let c = 1; c <= 30; c++) {
    const status = c <= 10 ? 'PENDING' : (c <= 25 ? 'APPROVED' : 'PAID');
    const targetAffiliate = c <= 10 ? affiliate1 : (c <= 20 ? affiliate2 : affiliate3);
    
    await prisma.commission.create({
      data: {
        affiliateId: targetAffiliate.id,
        orderId: 1000 + c,
        amount: 50.0 + (c * 5),
        rate: targetAffiliate.id === affiliate1.id ? 0.15 : (targetAffiliate.id === affiliate2.id ? 0.18 : 0.22),
        status: status as any,
        earnedAt: new Date(Date.now() - (30 - c) * 24 * 60 * 60 * 1000),
        approvedAt: status !== 'PENDING' ? new Date() : null,
        paidAt: status === 'PAID' ? new Date() : null
      }
    });
  }

  console.log('[Seed] Seeding 2 Payout records...');
  await prisma.payout.create({
    data: {
      affiliateId: affiliate2.id,
      amount: 250.0,
      method: 'bank',
      status: 'COMPLETED',
      requestedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      transactionId: 'TXN12345678'
    }
  });

  await prisma.payout.create({
    data: {
      affiliateId: affiliate3.id,
      amount: 400.0,
      method: 'bank',
      status: 'PENDING',
      requestedAt: new Date()
    }
  });

  console.log('[Seed] Seeding 15 Teacher Material records...');
  const materialsList = [
    { title: 'Tài liệu ôn thi cực trị hàm số lớp 12', subject: 'Toán học', fileType: 'pdf', isPublic: true, isApproved: true },
    { title: 'Tóm tắt công thức giải nhanh Logarit', subject: 'Toán học', fileType: 'pdf', isPublic: true, isApproved: true },
    { title: 'Video giải chi tiết đề thi thử chuyên Hùng Vương', subject: 'Toán học', fileType: 'mp4', isPublic: true, isApproved: true },
    { title: 'Slide bài giảng khảo sát hàm số bậc ba', subject: 'Toán học', fileType: 'pptx', isPublic: true, isApproved: false },
    { title: 'Bài tập trắc nghiệm tiệm cận đứng tiệm cận ngang', subject: 'Toán học', fileType: 'docx', isPublic: false, isApproved: true },

    { title: 'Sổ tay Vật Lý 12 ôn thi THPTQG 2026', subject: 'Vật lý', fileType: 'pdf', isPublic: true, isApproved: true },
    { title: 'Video thực hành giải bài tập dòng điện xoay chiều', subject: 'Vật lý', fileType: 'mp4', isPublic: true, isApproved: true },
    { title: 'Bộ đề ôn tập học kỳ 1 môn Vật lý 12', subject: 'Vật lý', fileType: 'pdf', isPublic: true, isApproved: true },
    { title: 'Slide bài giảng dao động điều hòa con lắc đơn', subject: 'Vật lý', fileType: 'pptx', isPublic: true, isApproved: false },
    { title: 'Bài tập tự luyện dao động tắt dần nâng cao', subject: 'Vật lý', fileType: 'docx', isPublic: false, isApproved: true },

    { title: 'Ebook từ vựng Tiếng Anh theo chủ đề thi THPT', subject: 'Tiếng Anh', fileType: 'pdf', isPublic: true, isApproved: true },
    { title: 'Chuyên đề ngữ pháp câu điều kiện và câu ước', subject: 'Tiếng Anh', fileType: 'pdf', isPublic: true, isApproved: true },
    { title: 'Video hướng dẫn phát âm đuôi ed và s/es', subject: 'Tiếng Anh', fileType: 'mp4', isPublic: true, isApproved: true },
    { title: 'Bộ đề thi thử môn Anh chuẩn cấu trúc đề 2026', subject: 'Tiếng Anh', fileType: 'pdf', isPublic: true, isApproved: false },
    { title: 'Bài tập trắc nghiệm câu hỏi đuôi từ cơ bản đến nâng cao', subject: 'Tiếng Anh', fileType: 'docx', isPublic: false, isApproved: true }
  ];

  for (let m = 0; m < materialsList.length; m++) {
    const tId = m < 5 ? teacherA.id : (m < 10 ? teacherB.id : teacherC.id);
    const mat = materialsList[m];
    await prisma.teacherMaterial.create({
      data: {
        teacherId: tId,
        title: mat.title,
        description: `Tài liệu chất lượng cao ôn tập môn ${mat.subject} phục vụ kỳ thi tốt nghiệp THPT Quốc Gia.`,
        subject: mat.subject,
        grade: '12',
        fileUrl: `https://edupath.vn/materials/material_${m + 1}.${mat.fileType}`,
        fileType: mat.fileType,
        fileSize: 1024 * 1024 * (m + 1),
        isPublic: mat.isPublic,
        isApproved: mat.isApproved,
        downloadCount: m * 15,
        viewCount: m * 35,
        price: m % 3 === 0 ? 0.0 : 49.0
      }
    });
  }

  console.log('[Seed] Database seeding completed successfully!');
}

function mapOptions(optionsText: { A: string; B: string; C: string; D: string }, correctAns: string) {
  const incorrectVals = [optionsText.B, optionsText.C, optionsText.D];
  let incorrectIdx = 0;
  return ['A', 'B', 'C', 'D'].map(label => {
    if (label === correctAns) {
      return { label, text: optionsText.A };
    } else {
      const val = incorrectVals[incorrectIdx];
      incorrectIdx++;
      return { label, text: val || `Lựa chọn sai ${label}` };
    }
  });
}

function getMathQuestion(qIndex: number, seed: number, correctAns: string) {
  const val1 = (seed % 6) + 2;
  const val2 = (seed % 5) + 3;
  const val3 = (seed % 4) + 1;
  const val4 = (seed % 3) + 2;

  let content = "";
  let optionsText = { A: "", B: "", C: "", D: "" };
  let explanation = "";
  let topic = "Kiến thức chung";

  switch (qIndex) {
    case 1:
      topic = "Số phức";
      content = `Cho số phức $z = ${val1} - ${val2}i$. Phần thực của số phức $z$ bằng:`;
      optionsText = { A: `${val1}`, B: `-${val2}`, C: `${val1}i`, D: `-${val2}i` };
      explanation = `Phần thực của số phức $z = a + bi$ là $a$. Đối với $z = ${val1} - ${val2}i$, phần thực là $${val1}$.`;
      break;
    case 2:
      topic = "Số phức";
      content = `Cho số phức $z = ${val1} + ${val2}i$. Phần ảo của số phức $z$ bằng:`;
      optionsText = { A: `${val2}`, B: `${val1}`, C: `${val1}i`, D: `${val2}i` };
      explanation = `Phần ảo của số phức $z = a + bi$ là $b$. Đối với $z = ${val1} + ${val2}i$, phần ảo là $${val2}$.`;
      break;
    case 3:
      topic = "Hình chiếu và tọa độ Oxyz";
      content = `Trong không gian $Oxyz$, cho điểm $A(${val1}; -${val2}; ${val3})$. Hình chiếu vuông góc của điểm $A$ trên trục $Ox$ có tọa độ là:`;
      optionsText = { A: `(${val1}; 0; 0)`, B: `(0; -${val2}; 0)`, C: `(0; 0; ${val3})`, D: `(0; -${val2}; ${val3})` };
      explanation = `Hình chiếu vuông góc của điểm $A(x; y; z)$ trên trục $Ox$ là $A'(x; 0; 0)$. Ở đây $A(${val1}; -${val2}; ${val3})$ nên hình chiếu trên $Ox$ là $(${val1}; 0; 0)$.`;
      break;
    case 4:
      topic = "Mặt cầu Oxyz";
      content = `Trong không gian $Oxyz$, cho mặt cầu $(S): (x-${val1})^2 + y^2 + (z+${val2})^2 = ${val3 * val3}$. Bán kính của mặt cầu $(S)$ bằng:`;
      optionsText = { A: `${val3}`, B: `${val3 * val3}`, C: `${val1}`, D: `${val2}` };
      explanation = `Phương trình mặt cầu có dạng $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$. Từ phương trình $(S)$, ta có $R^2 = ${val3 * val3} \\Rightarrow R = ${val3}$.`;
      break;
    case 5:
      topic = "Đường tiệm cận";
      content = `Tiệm cận đứng của đồ thị hàm số $y = \\frac{${val1}x - 1}{x + ${val2}}$ là đường thẳng:`;
      optionsText = { A: `x = -${val2}`, B: `x = ${val1}`, C: `y = -${val2}`, D: `y = ${val1}` };
      explanation = `Đồ thị hàm số phân thức bậc nhất $y = \\frac{ax+b}{cx+d}$ có tiệm cận đứng là đường thẳng $x = -\\frac{d}{c}$. Ở đây mẫu số $x + ${val2} = 0 \\Rightarrow x = -${val2}$.`;
      break;
    case 6:
      topic = "Đồ thị hàm số";
      content = `Cho hàm số $y = f(x)$ có bảng biến thiên với điểm cực đại $x_1 = -1$, cực tiểu $x_2 = 1$. Điểm cực đại của đồ thị hàm số đã cho là:`;
      optionsText = { A: `x = -1`, B: `x = 1`, C: `y = f(-1)`, D: `y = f(1)` };
      explanation = `Điểm cực đại của hàm số là giá trị của biến số $x$ làm cho hàm số đạt cực đại, ở đây là $x = -1$.`;
      break;
    case 7:
      topic = "Thể tích khối đa diện";
      content = `Cho khối chóp có diện tích đáy $B = ${val1 * 3}a^2$ và chiều cao $h = ${val2}a$. Thể tích của khối chóp đã cho bằng:`;
      optionsText = { A: `${val1 * val2}a^3`, B: `${val1 * val2 * 3}a^3`, C: `${val1 * val2 / 3}a^3`, D: `${val1 * val2 * 2}a^3` };
      explanation = `Công thức thể tích khối chóp: $V = \\frac{1}{3} B h = \\frac{1}{3} \\cdot ${val1 * 3}a^2 \\cdot ${val2}a = ${val1 * val2}a^3$.`;
      break;
    case 8:
      topic = "Thể tích khối đa diện";
      content = `Cho khối lăng trụ có diện tích đáy $B = ${val1 * 2}a^2$ và chiều cao $h = ${val2}a$. Thể tích của khối lăng trụ đã cho bằng:`;
      optionsText = { A: `${val1 * val2 * 2}a^3`, B: `${val1 * val2 * 2 / 3}a^3`, C: `${val1 * val2}a^3`, D: `${val1 * val2 * 6}a^3` };
      explanation = `Công thức thể tích khối lăng trụ: $V = B h = ${val1 * 2}a^2 \\cdot ${val2}a = ${val1 * val2 * 2}a^3$.`;
      break;
    case 9:
      topic = "Hàm số mũ và logarit";
      content = `Tập xác định của hàm số $y = (x - ${val1})^{\\pi}$ là:`;
      optionsText = { A: `(${val1}; +\\infty)`, B: `R \\\\ {${val1}}`, C: `[${val1}; +\\infty)`, D: `R` };
      explanation = `Hàm số lũy thừa $y = x^\\alpha$ với số mũ $\\alpha$ không nguyên có tập xác định là $(0; +\\infty)$. Do đó, $x - ${val1} > 0 \\Rightarrow x > ${val1}$.`;
      break;
    case 10:
      topic = "Hàm số mũ và logarit";
      content = `Nghiệm của phương trình $\\log_{${val1}}(x - 1) = 2$ là:`;
      optionsText = { A: `x = ${val1 * val1 + 1}`, B: `x = ${val1 * 2 + 1}`, C: `x = ${val1 * val1}`, D: `x = ${val1 * 2}` };
      explanation = `Phương trình $\\log_{${val1}}(x - 1) = 2 \\Leftrightarrow x - 1 = ${val1}^2 = ${val1 * val1} \\Rightarrow x = ${val1 * val1 + 1}$.`;
      break;
    case 11:
      topic = "Nguyên hàm";
      content = `Họ tất cả các nguyên hàm của hàm số $f(x) = x^{${val1}}$ là:`;
      optionsText = { A: `\\frac{x^{${val1 + 1}}}{${val1 + 1}} + C`, B: `${val1}x^{${val1 - 1}} + C`, C: `x^{${val1 + 1}} + C`, D: `\\frac{x^{${val1}}}{${val1}} + C` };
      explanation = `Theo công thức nguyên hàm cơ bản: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$. Ở đây $f(x) = x^{${val1}} \\Rightarrow \\int x^{${val1}} dx = \\frac{x^{${val1 + 1}}}{${val1 + 1}} + C$.`;
      break;
    case 12:
      topic = "Nguyên hàm";
      content = `Khẳng định nào dưới đây đúng?`;
      optionsText = { A: `\\int e^x dx = e^x + C`, B: `\\int e^x dx = -e^x + C`, C: `\\int e^x dx = \\frac{e^x}{x} + C`, D: `\\int e^x dx = x e^{x-1} + C` };
      explanation = `Nguyên hàm của hàm số mũ cơ bản: $\\int e^x dx = e^x + C$.`;
      break;
    case 13:
      topic = "Tích phân";
      content = `Cho $\\int_{0}^{2} f(x)dx = ${val1}$ và $\\int_{0}^{2} g(x)dx = ${val2}$. Tích phân $\\int_{0}^{2} [f(x) + g(x)]dx$ bằng:`;
      optionsText = { A: `${val1 + val2}`, B: `${val1 - val2}`, C: `${val1 * val2}`, D: `${val1 / val2}` };
      explanation = `Tính chất tuyến tính của tích phân: $\\int_a^b [f(x) + g(x)]dx = \\int_a^b f(x)dx + \\int_a^b g(x)dx = ${val1} + ${val2} = ${val1 + val2}$.`;
      break;
    case 14:
      topic = "Tích phân";
      content = `Cho $\\int_{1}^{3} f(x)dx = ${val1 * 2}$. Tích phân $\\int_{1}^{3} \\frac{1}{2}f(x)dx$ bằng:`;
      optionsText = { A: `${val1}`, B: `${val1 * 4}`, C: `${val1 * 2}`, D: `${val1 / 2}` };
      explanation = `Hệ số tự do có thể đưa ra ngoài dấu tích phân: $\\int_a^b k f(x)dx = k \\int_a^b f(x)dx$. Ở đây $\\frac{1}{2} \\int_{1}^{3} f(x)dx = \\frac{1}{2} \\cdot ${val1 * 2} = ${val1}$.`;
      break;
    case 15:
      topic = "Cấp số cộng và cấp số nhân";
      content = `Cho cấp số cộng $(u_n)$ có $u_1 = ${val1}$ và công sai $d = ${val2}$. Giá trị của $u_2$ bằng:`;
      optionsText = { A: `${val1 + val2}`, B: `${val1 * val2}`, C: `${val1 - val2}`, D: `${val2 - val1}` };
      explanation = `Công thức số hạng tổng quát của cấp số cộng: $u_2 = u_1 + d = ${val1} + ${val2} = ${val1 + val2}$.`;
      break;
    case 16:
      topic = "Cấp số cộng và cấp số nhân";
      content = `Cho cấp số nhân $(u_n)$ có $u_1 = ${val1}$ và công bội $q = ${val2}$. Giá trị của $u_2$ bằng:`;
      optionsText = { A: `${val1 * val2}`, B: `${val1 + val2}`, C: `${val1 - val2}`, D: `${val2}` };
      explanation = `Công thức số hạng tổng quát của cấp số nhân: $u_2 = u_1 \\cdot q = ${val1} \\cdot ${val2} = ${val1 * val2}$.`;
      break;
    case 17:
      topic = "Hình nón và hình trụ";
      content = `Cho hình nón có bán kính đáy $r = ${val1}$ và độ dài đường sinh $l = ${val2}$. Diện tích xung quanh của hình nón đã cho bằng:`;
      optionsText = { A: `${val1 * val2}\\pi`, B: `${val1 * val2 * 2}\\pi`, C: `${val1 * val1}\\pi`, D: `${val1 * val2 / 3}\\pi` };
      explanation = `Diện tích xung quanh hình nón được tính bằng công thức: $S_{xq} = \\pi r l = \\pi \\cdot ${val1} \\cdot ${val2} = ${val1 * val2}\\pi$.`;
      break;
    case 18:
      topic = "Hình nón và hình trụ";
      content = `Cho hình trụ có bán kính đáy $r = ${val1}$ và chiều cao $h = ${val2}$. Thể tích của khối trụ đã cho bằng:`;
      optionsText = { A: `${val1 * val1 * val2}\\pi`, B: `${val1 * val2}\\pi`, C: `${val1 * val2 * 2}\\pi`, D: `${val1 * val1 * val2 / 3}\\pi` };
      explanation = `Thể tích khối trụ được tính bằng công thức: $V = \\pi r^2 h = \\pi \\cdot ${val1}^2 \\cdot ${val2} = ${val1 * val1 * val2}\\pi$.`;
      break;
    case 19:
      topic = "Đường thẳng Oxyz";
      content = `Trong không gian $Oxyz$, cho đường thẳng $d: \\frac{x - ${val1}}{1} = \\frac{y + 2}{-${val2}} = \\frac{z - ${val3}}{3}$. Vectơ nào dưới đây là một vectơ chỉ phương của đường thẳng $d$?`;
      optionsText = { A: `\\vec{u} = (1; -${val2}; 3)`, B: `\\vec{u} = (${val1}; -2; ${val3})`, C: `\\vec{u} = (1; ${val2}; 3)`, D: `\\vec{u} = (-${val1}; 2; -${val3})` };
      explanation = `Tọa độ vectơ chỉ phương của đường thẳng đọc trực tiếp từ mẫu số của phương trình chính tắc: $\\vec{u} = (1; -${val2}; 3)$.`;
      break;
    case 20:
      topic = "Mặt phẳng Oxyz";
      content = `Trong không gian $Oxyz$, cho mặt phẳng $(P): ${val1}x - ${val2}y + z - ${val3} = 0$. Vectơ nào dưới đây là một vectơ pháp tuyến của mặt phẳng $(P)$?`;
      optionsText = { A: `\\vec{n} = (${val1}; -${val2}; 1)`, B: `\\vec{n} = (${val1}; ${val2}; 1)`, C: `\\vec{n} = (${val1}; -${val2}; -${val3})`, D: `\\vec{n} = (-${val1}; ${val2}; 0)` };
      explanation = `Tọa độ vectơ pháp tuyến là các hệ số đứng trước $x, y, z$ trong phương trình tổng quát: $\\vec{n} = (${val1}; -${val2}; 1)$.`;
      break;
    default:
      const mockMathQuestions = [
        {
          topic: "Tập nghiệm bất phương trình",
          content: `Tập nghiệm của bất phương trình $\\log_{2}(x - ${val1}) < 3$ là:`,
          optionsText: { A: `(${val1}; ${val1 + 8})`, B: `(-\\infty; ${val1 + 8})`, C: `[${val1}; ${val1 + 8})`, D: `(${val1}; +\\infty)` },
          explanation: `Điều kiện: $x - ${val1} > 0 \\Rightarrow x > ${val1}$. Bất phương trình $\\log_2 (x - ${val1}) < 3 \\Leftrightarrow x - ${val1} < 8 \\Leftrightarrow x < ${val1 + 8}$. Kết hợp điều kiện ta được $x \\in (${val1}; ${val1 + 8})$.`
        },
        {
          topic: "Tổ hợp và xác suất",
          content: `Có bao nhiêu cách chọn ${val3} học sinh từ một nhóm gồm ${val3 + 8} học sinh?`,
          optionsText: { A: `C_{${val3 + 8}}^{${val3}}`, B: `A_{${val3 + 8}}^{${val3}}`, C: `${val3}!`, D: `P_{${val3 + 8}}` },
          explanation: `Số cách chọn ${val3} học sinh từ một nhóm ${val3 + 8} học sinh (không phân biệt thứ tự) là số tổ hợp chập ${val3} của ${val3 + 8}, ký hiệu là $C_{${val3 + 8}}^{${val3}}$.`
        },
        {
          topic: "Số phức",
          content: `Cho hai số phức $z_1 = ${val1} + i$ và $z_2 = 2 - ${val2}i$. Phần thực của số phức $z_1 + z_2$ bằng:`,
          optionsText: { A: `${val1 + 2}`, B: `${val1 - 2}`, C: `1 - ${val2}`, D: `1 + ${val2}` },
          explanation: `$z_1 + z_2 = (${val1} + 2) + (1 - ${val2})i = ${val1 + 2} + (1 - ${val2})i$. Phần thực bằng ${val1 + 2}.`
        },
        {
          topic: "Tính cực trị của hàm số",
          content: `Cho hàm số $y = f(x)$ có đạo hàm $f'(x) = x(x - ${val1})^2(x + 2)$. Số điểm cực trị của hàm số đã cho là:`,
          optionsText: { A: `2`, B: `3`, C: `1`, D: `4` },
          explanation: `Điểm cực trị là nghiệm bội lẻ của đạo hàm $f'(x) = 0$. Đạo hàm đổi dấu khi qua nghiệm $x = 0$ (bội 1) và $x = -2$ (bội 1), không đổi dấu khi qua $x = ${val1}$ (bội chẵn). Do đó hàm số có 2 điểm cực trị.`
        },
        {
          topic: "Giá trị lớn nhất, nhỏ nhất",
          content: `Giá trị lớn nhất của hàm số $y = -x^4 + ${val1 * 2}x^2$ trên đoạn $[0; 2]$ bằng:`,
          optionsText: { A: `${val1 * val1}`, B: `0`, C: `-${val1 * 2}`, D: `16` },
          explanation: `Đạo hàm $y' = -4x^3 + ${val1 * 4}x = 0 \\Leftrightarrow x = 0$ hoặc $x = \\pm \\sqrt{${val1}}$. Xét trên $[0; 2]$, ta có các giá trị $y(0) = 0$, $y(\\sqrt{${val1}}) = ${val1 * val1}$, $y(2) = ${val1 * 8 - 16}$. GTLN là $${val1 * val1}$.`
        }
      ];
      const selected = mockMathQuestions[(qIndex - 21) % mockMathQuestions.length];
      topic = selected.topic;
      content = selected.content;
      optionsText = selected.optionsText;
      explanation = selected.explanation;
  }

  return {
    content,
    options: mapOptions(optionsText, correctAns),
    correctAnswer: correctAns,
    explanation,
    topic,
    difficulty: qIndex <= 15 ? 'EASY' as const : (qIndex <= 35 ? 'MEDIUM' as const : 'HARD' as const)
  };
}

function getEnglishQuestion(qIndex: number, seed: number, correctAns: string) {
  let content = "";
  let optionsText = { A: "", B: "", C: "", D: "" };
  let explanation = "";
  let topic = "Grammar & Vocabulary";

  switch (qIndex) {
    case 1:
      topic = "Pronunciation";
      content = `Choose the word whose underlined part is pronounced differently from that of the others:`;
      optionsText = { A: "played", B: "visited", C: "decided", D: "started" };
      explanation = `'played' ends with the /d/ sound, whereas the other three end with the /id/ sound.`;
      break;
    case 2:
      topic = "Stress";
      content = `Choose the word that differs from the other three in the position of primary stress:`;
      optionsText = { A: "repeat", B: "balance", C: "carbon", D: "standard" };
      explanation = `'repeat' is stressed on the second syllable, while the other three words are stressed on the first syllable.`;
      break;
    case 3:
      topic = "Tag Questions";
      content = `She has been working here for a long time, ______?`;
      optionsText = { A: "hasn't she", B: "has she", C: "doesn't she", D: "isn't she" };
      explanation = `The main sentence is positive and uses the present perfect ('She has...'), so the tag question must be negative present perfect ('hasn't she?').`;
      break;
    case 4:
      topic = "Conjunctions";
      content = `The flight was delayed ______ the bad weather.`;
      optionsText = { A: "because of", B: "because", C: "although", D: "in spite of" };
      explanation = `'because of' is followed by a noun phrase ('the bad weather') to indicate a cause. 'because' is followed by a clause.`;
      break;
    case 5:
      topic = "Conditionals";
      content = `If I ______ you, I would take that course to improve my English.`;
      optionsText = { A: "were", B: "am", C: "was", D: "had been" };
      explanation = `This is a second conditional sentence (expressing an unreal condition in the present), so we use 'were' for all subjects in the If-clause.`;
      break;
    case 6:
      topic = "Gerund & Infinitive";
      content = `He decided ______ to another university next semester.`;
      optionsText = { A: "to transfer", B: "transferring", C: "transfer", D: "transferred" };
      explanation = `The verb 'decide' is followed by a to-infinitive (decide + to-V).`;
      break;
    default:
      const generalEnglish = [
        {
          topic: "Tenses",
          content: `By the time we arrived at the classroom, the teacher ______ the lesson.`,
          optionsText: { A: "had started", B: "started", C: "has started", D: "was starting" },
          explanation: `We use the past perfect ('had + V3') to express an action that was completed before another past action ('arrived').`
        },
        {
          topic: "Synonyms",
          content: `Choose the word CLOSEST in meaning to the underlined word: "The math exam was very 'challenging'."`,
          optionsText: { A: "difficult", B: "easy", C: "simple", D: "boring" },
          explanation: `'challenging' means demanding or difficult, so 'difficult' is the closest synonym.`
        },
        {
          topic: "Antonyms",
          content: `Choose the word OPPOSITE in meaning to the underlined word: "We need to 'reduce' our energy consumption."`,
          optionsText: { A: "increase", B: "decrease", C: "limit", D: "cut" },
          explanation: `'reduce' means to make smaller or less, so its opposite is 'increase'.`
        },
        {
          topic: "Modal Verbs",
          content: `You ______ park here; it is a prohibited area.`,
          optionsText: { A: "mustn't", B: "needn't", C: "should", D: "may" },
          explanation: `'mustn't' indicates prohibition, which fits 'prohibited area'.`
        }
      ];
      const sel = generalEnglish[(qIndex - 7) % generalEnglish.length];
      topic = sel.topic;
      content = sel.content;
      optionsText = sel.optionsText;
      explanation = sel.explanation;
  }

  return {
    content,
    options: mapOptions(optionsText, correctAns),
    correctAnswer: correctAns,
    explanation,
    topic,
    difficulty: qIndex <= 15 ? 'EASY' as const : (qIndex <= 35 ? 'MEDIUM' as const : 'HARD' as const)
  };
}

function getPhysicsQuestion(qIndex: number, seed: number, correctAns: string) {
  const val1 = (seed % 5) + 2;
  const val2 = (seed % 3) + 1;

  let content = "";
  let optionsText = { A: "", B: "", C: "", D: "" };
  let explanation = "";
  let topic = "Vật lý đại cương";

  switch (qIndex) {
    case 1:
      topic = "Dao động cơ";
      content = `Một con lắc lò xo có độ cứng $k = ${val1 * 50}\\text{ N/m}$, gắn vật nặng khối lượng $m = 0.5\\text{ kg}$. Tần số góc dao động riêng của con lắc bằng:`;
      optionsText = { A: `${Math.round(Math.sqrt(val1 * 50 / 0.5))}\\text{ rad/s}`, B: `10\\text{ rad/s}`, C: `20\\text{ rad/s}`, D: `5\\text{ rad/s}` };
      explanation = `Tần số góc của con lắc lò xo được tính bằng công thức: $\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{${val1 * 50}}{0.5}} = \\sqrt{${val1 * 100}} = ${Math.round(Math.sqrt(val1 * 50 / 0.5))}\\text{ rad/s}$.`;
      break;
    case 2:
      topic = "Sóng cơ";
      content = `Một sóng cơ truyền trong một môi trường có bước sóng $\\lambda = ${val1 * 2}\\text{ cm}$. Khoảng cách giữa hai cực đại liên tiếp trên cùng một phương truyền sóng bằng:`;
      optionsText = { A: `${val1 * 2}\\text{ cm}`, B: `${val1}\\text{ cm}`, C: `${val1 * 4}\\text{ cm}`, D: `${val1 / 2}\\text{ cm}` };
      explanation = `Khoảng cách giữa hai đỉnh sóng (cực đại) liên tiếp trên cùng một phương truyền chính bằng một bước sóng $\\lambda = ${val1 * 2}\\text{ cm}$.`;
      break;
    case 3:
      topic = "Dòng điện xoay chiều";
      content = `Đặt điện áp xoay chiều có tần số góc $\\omega = 100\\pi\\text{ rad/s}$ vào hai đầu cuộn cảm thuần có độ tự cảm $L = \\frac{${val2}}{\\pi}\\text{ H}$. Cảm kháng của cuộn cảm bằng:`;
      optionsText = { A: `${val2 * 100}\\text{ }\\Omega`, B: `100\\text{ }\\Omega`, C: `50\\text{ }\\Omega`, D: `${val2 * 50}\\text{ }\\Omega` };
      explanation = `Cảm kháng của cuộn cảm thuần: $Z_L = \\omega L = 100\\pi \\cdot \\frac{${val2}}{\\pi} = ${val2 * 100}\\text{ }\\Omega$.`;
      break;
    default:
      const generalPhysics = [
        {
          topic: "Sóng ánh sáng",
          content: `Trong thí nghiệm Y-âng về giao thoa ánh sáng, khoảng cách giữa hai khe là $a = 1\\text{ mm}$, khoảng cách từ hai khe đến màn là $D = 2\\text{ m}$. Ánh sáng đơn sắc có bước sóng $\\lambda = 0.5\\text{ }\\mu\\text{m}$. Khoảng vân giao thoa trên màn bằng:`,
          optionsText: { A: `1.0\\text{ mm}`, B: `0.5\\text{ mm}`, C: `2.0\\text{ mm}`, D: `1.5\\text{ mm}` },
          explanation: `Khoảng vân $i = \\frac{\\lambda D}{a} = \\frac{0.5 \\cdot 10^{-6} \\cdot 2}{1 \\cdot 10^{-3}} = 1.0 \\cdot 10^{-3}\\text{ m} = 1.0\\text{ mm}$.`
        },
        {
          topic: "Lượng tử ánh sáng",
          content: `Công thoát êlectron của một kim loại là $A = 3.0\\text{ eV}$. Biết hằng số Plăng $h = 6.625 \\cdot 10^{-34}\\text{ J.s}$ và tốc độ ánh sáng $c = 3 \\cdot 10^8\\text{ m/s}$. Giới hạn quang điện của kim loại này gần nhất với giá trị:`,
          optionsText: { A: `0.414\\text{ }\\mu\\text{m}`, B: `0.350\\text{ }\\mu\\text{m}`, C: `0.497\\text{ }\\mu\\text{m}`, D: `0.260\\text{ }\\mu\\text{m}` },
          explanation: `Đổi công thoát $A = 3.0 \\cdot 1.6 \\cdot 10^{-19} = 4.8 \\cdot 10^{-19}\\text{ J}$. Giới hạn quang điện $\\lambda_0 = \\frac{hc}{A} = \\frac{6.625 \\cdot 10^{-34} \\cdot 3 \\cdot 10^8}{4.8 \\cdot 10^{-19}} \\approx 4.14 \\cdot 10^{-7}\\text{ m} = 0.414\\text{ }\\mu\\text{m}$.`
        },
        {
          topic: "Vật lý hạt nhân",
          content: `Số nơtron có trong hạt nhân nguyên tử $^{238}_{92}\\text{U}$ bằng:`,
          optionsText: { A: `146`, B: `92`, C: `238`, D: `143` },
          explanation: `Số nơtron $N = A - Z = 238 - 92 = 146$.`
        }
      ];
      const sel = generalPhysics[(qIndex - 4) % generalPhysics.length];
      topic = sel.topic;
      content = sel.content;
      optionsText = sel.optionsText;
      explanation = sel.explanation;
  }

  return {
    content,
    options: mapOptions(optionsText, correctAns),
    correctAnswer: correctAns,
    explanation,
    topic,
    difficulty: qIndex <= 15 ? 'EASY' as const : (qIndex <= 30 ? 'MEDIUM' as const : 'HARD' as const)
  };
}

function getChemistryQuestion(qIndex: number, seed: number, correctAns: string) {
  let content = "";
  let optionsText = { A: "", B: "", C: "", D: "" };
  let explanation = "";
  let topic = "Hóa học đại cương";

  switch (qIndex) {
    case 1:
      topic = "Este - Lipit";
      content = `Este nào sau đây phản ứng với dung dịch NaOH sinh ra ancol etylic ($C_2H_5OH$)?`;
      optionsText = { A: "CH_3COOC_2H_5", B: "HCOOCH_3", C: "CH_3COOCH_3", D: "C_2H_5COOCH_3" };
      explanation = `CH_3COOC_2H_5 (etyl axetat) bị thủy phân trong NaOH tạo muối CH_3COONa và ancol etylic C_2H_5OH.`;
      break;
    case 2:
      topic = "Cacbohiđrat";
      content = `Chất nào sau đây không tham gia phản ứng thủy phân?`;
      optionsText = { A: "Glucozơ", B: "Saccarozơ", C: "Tinh bột", D: "Xenlulozơ" };
      explanation = `Glucozơ là monosaccarit, là đường đơn giản nhất nên không bị thủy phân tiếp.`;
      break;
    case 3:
      topic = "Kim loại";
      content = `Kim loại nào sau đây có nhiệt độ nóng chảy cao nhất, thường dùng làm dây tóc bóng đèn?`;
      optionsText = { A: "Wolfram (W)", B: "Sắt (Fe)", C: "Đồng (Cu)", D: "Vàng (Au)" };
      explanation = `Wolfram (W) có nhiệt độ nóng chảy cao nhất trong các kim loại (khoảng 3410 độ C).`;
      break;
    default:
      const generalChem = [
        {
          topic: "Đại cương kim loại",
          content: `Khi cho lá sắt vào dung dịch muối nào sau đây, có hiện tượng lá sắt tan dần và kim loại mới bám vào lá sắt?`,
          optionsText: { A: "CuSO_4", B: "MgSO_4", C: "NaCl", D: "ZnSO_4" },
          explanation: `Fe có tính khử mạnh hơn Cu nên đẩy được Cu ra khỏi muối: Fe + CuSO_4 -> FeSO_4 + Cu bám vào lá sắt.`
        },
        {
          topic: "Polime",
          content: `Tơ nilon-6,6 thuộc loại:`,
          optionsText: { A: "Tơ tổng hợp", B: "Tơ bán tổng hợp", C: "Tơ thiên nhiên", D: "Tơ nhân tạo" },
          explanation: `Tơ nilon-6,6 được tổng hợp bằng phản ứng trùng ngưng giữa hexametylenđiamin và axit adipic, là một loại tơ tổng hợp.`
        },
        {
          topic: "Amin",
          content: `Chất nào sau đây là amin bậc một?`,
          optionsText: { A: "CH_3NH_2", B: "(CH_3)_2NH", C: "(CH_3)_3N", D: "CH_3-NH-CH_3" },
          explanation: `Amin bậc 1 có nhóm chức -NH_2 liên kết với gốc hidrocacbon. Metylamin (CH_3NH_2) là amin bậc một.`
        }
      ];
      const sel = generalChem[(qIndex - 4) % generalChem.length];
      topic = sel.topic;
      content = sel.content;
      optionsText = sel.optionsText;
      explanation = sel.explanation;
  }

  return {
    content,
    options: mapOptions(optionsText, correctAns),
    correctAnswer: correctAns,
    explanation,
    topic,
    difficulty: qIndex <= 15 ? 'EASY' as const : (qIndex <= 30 ? 'MEDIUM' as const : 'HARD' as const)
  };
}

function getBiologyQuestion(qIndex: number, seed: number, correctAns: string) {
  let content = "";
  let optionsText = { A: "", B: "", C: "", D: "" };
  let explanation = "";
  let topic = "Sinh học đại cương";

  switch (qIndex) {
    case 1:
      topic = "Mã di truyền";
      content = `Bộ ba nào sau đây quy định mã mở đầu dịch mã trên phân tử mARN?`;
      optionsText = { A: "5'-AUG-3'", B: "5'-UAG-3'", C: "5'-UAA-3'", D: "5'-UGA-3'" };
      explanation = `Bộ ba 5'-AUG-3' mã hóa cho axit amin Mêtiônin ở sinh vật nhân chuẩn và là mã mở đầu dịch mã.`;
      break;
    case 2:
      topic = "Nhân đôi ADN";
      content = `Trong quá trình nhân đôi ADN, enzim nào có vai trò tổng hợp mạch mới bổ sung?`;
      optionsText = { A: "ADN pôlimeraza", B: "Ligaza", C: "Amilaza", D: "ARN pôlimeraza" };
      explanation = `ADN pôlimeraza trượt trên mạch khuôn và lắp ráp các nuclêôtit tự do của môi trường để tạo mạch mới.`;
      break;
    default:
      const generalBio = [
        {
          topic: "Đột biến gen",
          content: `Đột biến điểm là dạng đột biến liên quan đến:`,
          optionsText: { A: "Một cặp nuclêôtit", B: "Hai cặp nuclêôtit", C: "Nhiều cặp nuclêôtit", D: "Toàn bộ gen" },
          explanation: `Đột biến điểm theo định nghĩa là đột biến gen chỉ liên quan đến một cặp nuclêôtit duy nhất.`
        },
        {
          topic: "Hệ sinh thái",
          content: `Trong một chuỗi thức ăn, sinh vật nào thuộc nhóm sinh vật sản xuất?`,
          optionsText: { A: "Cây xanh", B: "Động vật ăn cỏ", C: "Nấm và vi khuẩn", D: "Thú ăn thịt" },
          explanation: `Cây xanh có khả năng quang hợp tự dưỡng, sản xuất chất hữu cơ từ chất vô cơ nên là sinh vật sản xuất.`
        }
      ];
      const sel = generalBio[(qIndex - 3) % generalBio.length];
      topic = sel.topic;
      content = sel.content;
      optionsText = sel.optionsText;
      explanation = sel.explanation;
  }

  return {
    content,
    options: mapOptions(optionsText, correctAns),
    correctAnswer: correctAns,
    explanation,
    topic,
    difficulty: qIndex <= 15 ? 'EASY' as const : (qIndex <= 30 ? 'MEDIUM' as const : 'HARD' as const)
  };
}

function getAptitudeQuestion(qIndex: number, seed: number, correctAns: string, subject: string) {
  let content = `[Đề thi ${subject}] Câu hỏi tư duy logic số ${qIndex}?`;
  let optionsText = { A: "Mệnh đề (1) và (3) mâu thuẫn nhau", B: "Cả ba mệnh đề có thể cùng đúng", C: "A luôn đúng", D: "B luôn đúng" };
  let explanation = `Giải thích chi tiết cho câu hỏi tư duy logic số ${qIndex} môn ${subject}. Đáp án đúng là ${correctAns}.`;
  let topic = "Tư duy logic";

  if (qIndex === 1) {
    content = "Cho ba mệnh đề: (1) Nếu A đúng thì B đúng. (2) Nếu B sai thì A đúng. (3) A và B không cùng đúng. Phát biểu nào sau đây là hợp lý?";
    optionsText = { A: "Mệnh đề (1) và (3) mâu thuẫn nhau", B: "Cả ba mệnh đề có thể cùng đúng", C: "A luôn đúng", D: "B luôn đúng" };
    explanation = "Nếu A đúng thì theo (1) B đúng, nhưng theo (3) A và B không cùng đúng, mâu thuẫn. Do đó (1) và (3) mâu thuẫn nhau.";
  }

  return {
    content,
    options: mapOptions(optionsText, correctAns),
    correctAnswer: correctAns,
    explanation,
    topic,
    difficulty: qIndex <= 15 ? 'EASY' as const : (qIndex <= 30 ? 'MEDIUM' as const : 'HARD' as const)
  };
}

function generateQuestionFallback(subject: string, title: string, qIndex: number, correctAnswer: string) {
  const seed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + qIndex;
  
  if (subject.includes('Toán')) {
    return getMathQuestion(qIndex, seed, correctAnswer);
  } else if (subject.includes('Anh') || subject.includes('English') || subject.includes('Tiếng Anh')) {
    return getEnglishQuestion(qIndex, seed, correctAnswer);
  } else if (subject.includes('Lý') || subject.includes('Physics') || subject.includes('Vật')) {
    return getPhysicsQuestion(qIndex, seed, correctAnswer);
  } else if (subject.includes('Hóa') || subject.includes('Chemistry')) {
    return getChemistryQuestion(qIndex, seed, correctAnswer);
  } else if (subject.includes('Sinh') || subject.includes('Biology')) {
    return getBiologyQuestion(qIndex, seed, correctAnswer);
  } else {
    return getAptitudeQuestion(qIndex, seed, correctAnswer, subject);
  }
}

async function createPastExam(
  title: string,
  subject: string,
  subjectGroup: string,
  duration: number,
  answers: string[],
  questionsData: any[],
  teacherId: number
) {
  const exam = await prisma.exam.create({
    data: {
      title,
      subject,
      subjectGroup,
      duration,
      isPublic: true,
      createdBy: teacherId
    }
  });

  const createdQuestions = [];
  for (let i = 0; i < answers.length; i++) {
    const ans = answers[i];
    const qIndex = i + 1;
    const customQ = questionsData[i];

    const fallbackQ = generateQuestionFallback(subject, title, qIndex, ans);

    const content = customQ ? customQ.content : fallbackQ.content;
    const options = customQ ? customQ.options : fallbackQ.options;
    const correctAnswer = customQ ? customQ.correctAnswer : fallbackQ.correctAnswer;
    const explanation = customQ ? customQ.explanation : fallbackQ.explanation;
    const topic = customQ ? customQ.topic : fallbackQ.topic;
    const difficulty = customQ ? customQ.difficulty : fallbackQ.difficulty;

    const question = await prisma.question.create({
      data: {
        content,
        options,
        correctAnswer,
        explanation,
        subject,
        topic,
        difficulty,
        createdBy: teacherId
      }
    });
    createdQuestions.push({ questionId: question.id, order: qIndex });
  }

  for (const item of createdQuestions) {
    await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        questionId: item.questionId,
        order: item.order
      }
    });
  }

  console.log(`[Seed] Created past exam "${title}" with ${answers.length} questions.`);
}


main()
  .catch((e) => {
    console.error('[Seed Error] Seeding process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
