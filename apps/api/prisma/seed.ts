import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Resetting database records...');
  
  // Wipe database tables
  await prisma.user.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.course.deleteMany({});

  console.log('[Seed] Seeding default admin account...');
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@edupath.vn',
      passwordHash: adminHash,
      fullName: 'EduPath Quản trị viên',
      role: 'ADMIN',
      avatarUrl: 'AD',
      admin: { create: {} }
    }
  });

  console.log('[Seed] Seeding 2 pre-approved teachers...');
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

  console.log('[Seed] Seeding 5 student accounts...');
  const studentHash = await bcrypt.hash('student123', 12);
  const studentList = [];
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@gmail.com`,
        passwordHash: studentHash,
        fullName: `Học sinh Nguyễn Minh Anh ${i}`,
        role: 'STUDENT',
        avatarUrl: `S${i}`,
        student: {
          create: {
            subjectGroup: i % 2 === 0 ? 'A01' : 'D01'
          }
        }
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
      subjectGroup: 'A01',
      price: 499.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Khái niệm tính đơn điệu hàm số', order: 1, duration: '15:20' },
          { title: 'Bài 2: Kỹ thuật tìm cực trị hàm số nhanh', order: 2, duration: '18:45' },
          { title: 'Bài 3: Bài toán min-max chứa tham số m', order: 3, duration: '22:10' },
          { title: 'Bài 4: Khảo sát đồ thị và bài toán tiệm cận', order: 4, duration: '20:30' },
          { title: 'Bài 5: Luyện đề tổng hợp cực trị hàm số', order: 5, duration: '28:15' }
        ]
      }
    }
  });

  const courseB = await prisma.course.create({
    data: {
      title: 'Hóa học hữu cơ Este - Lipit chuyên sâu',
      description: 'Lộ trình bứt phá điểm tuyệt đối môn Hóa học khối B00.',
      subject: 'Hóa học',
      subjectGroup: 'B00',
      price: 599.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Este lý thuyết căn bản', order: 1, duration: '12:15' },
          { title: 'Bài 2: Tính chất hóa học Este nâng cao', duration: '16:40' },
          { title: 'Bài 3: Phản ứng thủy phân và bài toán xà phòng hóa', order: 3, duration: '24:20' },
          { title: 'Bài 4: Lipit và chất béo cấu tạo', order: 4, duration: '18:30' },
          { title: 'Bài 5: Tổng ôn Este - Lipit từ lý thuyết đến bài tập', order: 5, duration: '32:10' }
        ]
      }
    }
  });

  const courseC = await prisma.course.create({
    data: {
      title: 'Chuyên đề Dao động cơ học thi đại học',
      description: 'Nắm chắc 7+ điểm phần dao động điều hòa khối A01.',
      subject: 'Vật lý',
      subjectGroup: 'A01',
      price: 399.0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherB.id,
      lessons: {
        create: [
          { title: 'Bài 1: Khái niệm Dao động điều hòa cơ học', order: 1, duration: '20:15' },
          { title: 'Bài 2: Con lắc lò xo và phương trình li độ', order: 2, duration: '22:45' },
          { title: 'Bài 3: Con lắc đơn và bài toán tính chu kỳ', order: 3, duration: '18:30' },
          { title: 'Bài 4: Dao động tắt dần, dao động cưỡng bức', order: 4, duration: '25:10' },
          { title: 'Bài 5: Tổng ôn tập trắc nghiệm dao động cơ', order: 5, duration: '30:00' }
        ]
      }
    }
  });

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

  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Error] Seeding process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
