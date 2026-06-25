import dotenv from 'dotenv';
dotenv.config({ path: 'D:/SU2026/Edu Path/swp391-rbl-project-team-1/apps/api/.env' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding approved teacher and admin...');
  const teacher = await prisma.teacher.findFirst({
    where: { isApproved: true }
  });
  if (!teacher) {
    throw new Error('No approved teacher found in DB. Run seed first.');
  }

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  const adminId = admin ? admin.id : 1;

  console.log(`Using teacher ID: ${teacher.userId}, admin ID: ${adminId}`);

  // Create PENDING course
  const pendingCourse = await prisma.course.create({
    data: {
      title: 'Khóa học mẫu: Ôn thi đại học - Chờ duyệt',
      description: 'Đây là khóa học mẫu ở trạng thái chờ duyệt (PENDING) để kiểm tra chức năng duyệt của quản trị viên.',
      subject: 'Toán học',
      price: 250000,
      discount: 0,
      isPublished: false,
      isApproved: false,
      teacherId: teacher.userId,
      status: 'PENDING',
      visibility: 'HIDDEN',
      submittedAt: new Date()
    }
  });
  console.log(`Created PENDING course: "${pendingCourse.title}" (ID: ${pendingCourse.id})`);

  // Create APPROVED course
  const approvedCourse = await prisma.course.create({
    data: {
      title: 'Khóa học mẫu: Thủ khoa ôn lý - Đã duyệt',
      description: 'Đây là khóa học mẫu ở trạng thái đã phê duyệt (APPROVED) và hiển thị công khai (VISIBLE).',
      subject: 'Vật lý',
      price: 350000,
      discount: 10,
      isPublished: true,
      isApproved: true,
      teacherId: teacher.userId,
      status: 'APPROVED',
      visibility: 'VISIBLE',
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      approvedBy: adminId
    }
  });
  console.log(`Created APPROVED course: "${approvedCourse.title}" (ID: ${approvedCourse.id})`);

  // Create HIDDEN course
  const hiddenCourse = await prisma.course.create({
    data: {
      title: 'Khóa học mẫu: Ngữ văn nâng cao - Ẩn',
      description: 'Đây là khóa học mẫu ở trạng thái đã phê duyệt (APPROVED) nhưng đang ẩn (HIDDEN) khỏi học viên.',
      subject: 'Ngữ văn',
      price: 150000,
      discount: 0,
      isPublished: false,
      isApproved: true,
      teacherId: teacher.userId,
      status: 'APPROVED',
      visibility: 'HIDDEN',
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      approvedBy: adminId,
      hiddenAt: new Date(),
      hiddenBy: adminId,
      hiddenReason: 'Tạm thời ẩn khóa học mẫu theo yêu cầu quản trị.'
    }
  });
  console.log(`Created HIDDEN course: "${hiddenCourse.title}" (ID: ${hiddenCourse.id})`);

  console.log('Sample courses created successfully!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
