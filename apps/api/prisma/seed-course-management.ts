import { PrismaClient, RequestStatus, CourseStatus, CourseVisibility } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed Course Management] Starting optimized seeder...');

  // 1. Password hashes
  const passwordHashTeacher = await bcrypt.hash('teacher123', 10);
  const passwordHashStudent = await bcrypt.hash('student123', 10);
  
  // Get default admin
  const defaultAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  const adminId = defaultAdmin ? defaultAdmin.id : 1;

  // 2. Seed Teachers (5 APPROVED, 2 PENDING, 1 BLOCKED)
  console.log('[Seed Course Management] Seeding teacher accounts...');
  const teachersData = [
    {
      email: 'gv.approved.math@edupath.vn',
      fullName: 'Nguyễn Văn Toán',
      subject: 'Toán học',
      status: 'APPROVED' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: true
    },
    {
      email: 'gv.approved.phys@edupath.vn',
      fullName: 'Trần Văn Lý',
      subject: 'Vật lý',
      status: 'APPROVED' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: true
    },
    {
      email: 'gv.approved.chem@edupath.vn',
      fullName: 'Lê Thị Hóa',
      subject: 'Hóa học',
      status: 'APPROVED' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: true
    },
    {
      email: 'gv.approved.bio@edupath.vn',
      fullName: 'Phạm Thị Sinh',
      subject: 'Sinh học',
      status: 'APPROVED' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: true
    },
    {
      email: 'gv.approved.eng@edupath.vn',
      fullName: 'Hoàng Thị Anh',
      subject: 'Tiếng Anh',
      status: 'APPROVED' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: true
    },
    {
      email: 'gv.pending.lit@edupath.vn',
      fullName: 'Bùi Thị Văn',
      subject: 'Ngữ văn',
      status: 'PENDING' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: false
    },
    {
      email: 'gv.pending.math@edupath.vn',
      fullName: 'Phùng Thế Toán',
      subject: 'Toán học',
      status: 'PENDING' as RequestStatus,
      accountStatus: 'ACTIVE' as const,
      isApproved: false
    },
    {
      email: 'gv.blocked.phys@edupath.vn',
      fullName: 'Tạ Văn Blocked',
      subject: 'Vật lý',
      status: 'APPROVED' as RequestStatus,
      accountStatus: 'BLOCKED' as const,
      isApproved: true,
      blockedReason: 'Vi phạm nghiêm trọng chính sách bảo mật của hệ thống'
    }
  ];

  const teacherUserIds = [];

  for (const t of teachersData) {
    const isBlocked = t.accountStatus === 'BLOCKED';
    
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {
        fullName: t.fullName,
        isActive: !isBlocked,
        status: isBlocked ? 'BLOCKED' : 'ACTIVE',
        blockedAt: isBlocked ? new Date() : null,
        blockedReason: isBlocked ? t.blockedReason : null,
        blockedBy: isBlocked ? 'admin@edupath.vn' : null
      },
      create: {
        email: t.email,
        passwordHash: passwordHashTeacher,
        fullName: t.fullName,
        role: 'TEACHER',
        isActive: !isBlocked,
        status: isBlocked ? 'BLOCKED' : 'ACTIVE',
        emailVerified: true,
        onboardingComplete: true,
        blockedAt: isBlocked ? new Date() : null,
        blockedReason: isBlocked ? t.blockedReason : null,
        blockedBy: isBlocked ? 'admin@edupath.vn' : null
      }
    });

    await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {
        isApproved: t.isApproved,
        bio: `Giáo viên chuyên môn ${t.subject} với nhiều năm giảng dạy.`
      },
      create: {
        userId: user.id,
        isApproved: t.isApproved,
        bio: `Giáo viên chuyên môn ${t.subject} với nhiều năm giảng dạy.`
      }
    });

    await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        subjects: t.subject,
        education: 'Thạc sĩ',
        university: 'Đại học Sư phạm Hà Nội',
        experienceYears: 5,
        status: t.status,
        approvedAt: t.isApproved ? new Date() : null,
        approvedBy: t.isApproved ? adminId : null
      },
      create: {
        userId: user.id,
        subjects: t.subject,
        education: 'Thạc sĩ',
        university: 'Đại học Sư phạm Hà Nội',
        experienceYears: 5,
        status: t.status,
        approvedAt: t.isApproved ? new Date() : null,
        approvedBy: t.isApproved ? adminId : null
      }
    });

    teacherUserIds.push({ userId: user.id, isApproved: t.isApproved, email: t.email });
  }

  // 3. Seed Students (105 students using createMany)
  console.log('[Seed Course Management] Seeding 105 student accounts in batches...');
  const studentEmails = [];
  const studentsUserData = [];
  
  for (let i = 1; i <= 105; i++) {
    const email = `hs.seed${i}@edupath.vn`;
    studentEmails.push(email);
    studentsUserData.push({
      email,
      passwordHash: passwordHashStudent,
      fullName: `Học sinh Seed ${i}`,
      role: 'STUDENT' as const,
      isActive: true,
      status: 'ACTIVE' as const,
      emailVerified: true,
      onboardingComplete: true
    });
  }

  // Clear existing seed students to keep it clean and prevent duplicate key violations
  await prisma.enrollment.deleteMany({
    where: { student: { user: { email: { in: studentEmails } } } }
  });
  await prisma.student.deleteMany({
    where: { user: { email: { in: studentEmails } } }
  });
  await prisma.user.deleteMany({
    where: { email: { in: studentEmails } }
  });

  // Bulk insert users
  await prisma.user.createMany({ data: studentsUserData });

  // Fetch created student users
  const studentUsers = await prisma.user.findMany({
    where: { email: { in: studentEmails } },
    select: { id: true }
  });

  // Bulk insert student relations
  const studentsData = studentUsers.map((u, index) => ({
    userId: u.id,
    subjectGroup: index % 2 === 0 ? 'A00' : 'A01'
  }));
  await prisma.student.createMany({ data: studentsData });

  // 4. Seed Courses (33 Courses)
  console.log('[Seed Course Management] Seeding 33 courses in batches...');
  const subjectsList = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh'];
  const healthyTeachers = teacherUserIds.filter(t => t.isApproved && t.email !== 'gv.blocked.phys@edupath.vn');

  const coursesToInsert = [];
  const now = new Date();

  // Helper to subtract days
  const subDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() - days);
    return res;
  };

  // 15 APPROVED + VISIBLE
  for (let i = 1; i <= 15; i++) {
    coursesToInsert.push({
      title: `Khóa ôn thi THPT Quốc gia môn ${subjectsList[i % 6]} Chuyên sâu Đợt ${i}`,
      description: `Khóa học cung cấp kiến thức nền tảng và nâng cao giúp học sinh chinh phục điểm 8, 9, 10 môn ${subjectsList[i % 6]}.`,
      subject: subjectsList[i % 6],
      price: 199000 + (i * 20000),
      discount: i % 3 === 0 ? 10 : 0,
      isPublished: true,
      isApproved: true,
      teacherId: healthyTeachers[i % healthyTeachers.length].userId,
      status: 'APPROVED' as CourseStatus,
      visibility: 'VISIBLE' as CourseVisibility,
      submittedAt: subDays(now, 30),
      approvedAt: subDays(now, 28),
      approvedBy: adminId
    });
  }

  // 8 PENDING
  for (let i = 1; i <= 8; i++) {
    coursesToInsert.push({
      title: `Khóa học Bứt phá Điểm số môn ${subjectsList[(i + 1) % 6]} Lớp 12 - Phiên bản ${i}`,
      description: `Tổng ôn cấp tốc kiến thức môn ${subjectsList[(i + 1) % 6]} trong 30 ngày cuối trước kì thi.`,
      subject: subjectsList[(i + 1) % 6],
      price: 149000 + (i * 15000),
      discount: 0,
      isPublished: false,
      isApproved: false,
      teacherId: healthyTeachers[i % healthyTeachers.length].userId,
      status: 'PENDING' as CourseStatus,
      visibility: 'HIDDEN' as CourseVisibility,
      submittedAt: subDays(now, 2)
    });
  }

  // 5 DRAFT
  for (let i = 1; i <= 5; i++) {
    coursesToInsert.push({
      title: `Khóa nháp: Ôn tập môn ${subjectsList[(i + 2) % 6]} Học kì 1 Lớp 12 - Draft ${i}`,
      description: `Tài liệu và bài tập nháp đang chuẩn bị biên soạn của giáo viên.`,
      subject: subjectsList[(i + 2) % 6],
      price: 99000,
      discount: 0,
      isPublished: false,
      isApproved: false,
      teacherId: healthyTeachers[i % healthyTeachers.length].userId,
      status: 'DRAFT' as CourseStatus,
      visibility: 'HIDDEN' as CourseVisibility
    });
  }

  // 3 REJECTED
  for (let i = 1; i <= 3; i++) {
    coursesToInsert.push({
      title: `Khóa học Luyện thi Cấp tốc môn ${subjectsList[(i + 3) % 6]} (Bị từ chối) - Bản ${i}`,
      description: `Mô tả khóa học quá ngắn gọn, nội dung bài học không đầy đủ chứng từ.`,
      subject: subjectsList[(i + 3) % 6],
      price: 299000,
      discount: 0,
      isPublished: false,
      isApproved: false,
      teacherId: healthyTeachers[i % healthyTeachers.length].userId,
      status: 'REJECTED' as CourseStatus,
      visibility: 'HIDDEN' as CourseVisibility,
      submittedAt: subDays(now, 5),
      rejectedAt: subDays(now, 4),
      rejectedBy: adminId,
      rejectedReason: 'Nội dung video bài giảng không rõ nét và thiếu giáo án tài liệu PDF đính kèm của chương 1.'
    });
  }

  // 2 APPROVED + HIDDEN
  for (let i = 1; i <= 2; i++) {
    coursesToInsert.push({
      title: `Khóa học Đề thi thử tổng hợp môn ${subjectsList[(i + 4) % 6]} năm 2026 - Tạm ẩn ${i}`,
      description: `Khóa học tổng hợp 50 đề thi thử môn ${subjectsList[(i + 4) % 6]} chất lượng nhất, tạm ẩn để nâng cấp hệ thống đề thi mới.`,
      subject: subjectsList[(i + 4) % 6],
      price: 189000,
      discount: 15,
      isPublished: false,
      isApproved: true,
      teacherId: healthyTeachers[i % healthyTeachers.length].userId,
      status: 'APPROVED' as CourseStatus,
      visibility: 'HIDDEN' as CourseVisibility,
      submittedAt: subDays(now, 15),
      approvedAt: subDays(now, 14),
      approvedBy: adminId,
      hiddenAt: subDays(now, 3),
      hiddenBy: adminId,
      hiddenReason: 'Tạm ẩn theo yêu cầu của giáo viên để cập nhật lại ngân hàng đề thi học kì.'
    });
  }

  // Clear existing courses with these titles to prevent duplicate key/bloat issues
  const courseTitles = coursesToInsert.map(c => c.title);
  await prisma.course.deleteMany({
    where: { title: { in: courseTitles } }
  });

  // Bulk insert courses
  await prisma.course.createMany({ data: coursesToInsert });

  // Fetch created courses to get IDs
  const createdCourses = await prisma.course.findMany({
    where: { title: { in: courseTitles } },
    select: { id: true, subject: true, status: true, price: true, discount: true }
  });

  // Seed 3 lessons per course using createMany
  console.log('[Seed Course Management] Seeding curriculum lessons...');
  const lessonsToInsert = [];
  for (const c of createdCourses) {
    for (let order = 1; order <= 3; order++) {
      lessonsToInsert.push({
        courseId: c.id,
        title: `Bài học ${order}: Chuyên đề nâng cao phần ${c.subject} - Bài tập tự luận mẫu`,
        order,
        duration: `${30 + order * 10} phút`,
        content: `Nội dung hướng dẫn chi tiết phương pháp giải nhanh và các lưu ý quan trọng của chuyên đề bài học số ${order}.`
      });
    }
  }
  await prisma.lesson.createMany({ data: lessonsToInsert });

  // 5. Seed Enrollments (20 - 100 students per APPROVED course)
  console.log('[Seed Course Management] Seeding student enrollments in a single batch...');
  const approvedCourses = createdCourses.filter(c => c.status === 'APPROVED');
  const enrollmentsToInsert = [];
  let enrollmentCounter = 0;

  // Function to spread paid history
  const getPaidDate = (index: number): Date => {
    const cycle = index % 4;
    if (cycle === 0) {
      // This month (June 2026)
      return new Date(2026, 5, 1 + (index % 18), 10, 30);
    } else if (cycle === 1) {
      // Last month (May 2026)
      return new Date(2026, 4, 1 + (index % 28), 14, 20);
    } else if (cycle === 2) {
      // 3 months ago (April 2026)
      return new Date(2026, 3, 1 + (index % 28), 9, 15);
    } else {
      // 6 months ago (Feb 2026)
      return new Date(2026, 1, 1 + (index % 28), 16, 45);
    }
  };

  for (const c of approvedCourses) {
    const enrollmentsCount = 20 + (c.id % 41); // 20 to 60 enrollments
    
    // Pick unique students randomly
    const shuffledStudents = [...studentUsers].sort(() => 0.5 - Math.random());
    const studentsForCourse = shuffledStudents.slice(0, enrollmentsCount);

    for (let s = 0; s < studentsForCourse.length; s++) {
      const student = studentsForCourse[s];
      const paidAt = getPaidDate(enrollmentCounter);
      const transactionId = `TXN_SEED_${c.id}_${student.id}_${paidAt.getTime()}`;
      
      // Every 3rd student has progress >= 80% (to create completedCount)
      let progress = 10 + (s * 7) % 70;
      if (s % 3 === 0) {
        progress = 80 + (s * 3) % 21; // 80 - 100%
      }

      const amountPaid = c.price * (1 - c.discount / 100);

      enrollmentsToInsert.push({
        studentId: student.id,
        courseId: c.id,
        paidAt,
        transactionId,
        progress,
        amount: amountPaid
      });

      enrollmentCounter++;
    }
  }

  // Bulk insert enrollments
  await prisma.enrollment.createMany({ data: enrollmentsToInsert });

  console.log(`[Seed Course Management] Seeding completed successfully! Total enrollments: ${enrollmentCounter}`);
}

main()
  .catch((e) => {
    console.error('[Seed Course Management Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
