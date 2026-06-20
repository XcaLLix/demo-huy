import { PrismaClient, RequestStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed Teachers] Starting seeding teacher accounts...');

  const passwordHash = await bcrypt.hash('teacher123', 12);

  // 1. Pending teachers (2 records)
  const pendingTeachersData = [
    {
      email: 'gv.pending1@edupath.vn',
      fullName: 'Trần Văn Hùng',
      phone: '0912345001',
      subjects: 'Toán học',
      education: 'Thạc sĩ',
      university: 'Đại học Sư phạm Hà Nội',
      experienceYears: 5,
      bio: 'Tôi có 5 năm kinh nghiệm ôn thi THPT Quốc gia môn Toán.',
      dob: new Date('1992-05-15'),
      cvUrl: 'https://example.com/cv/tran-van-hung.pdf',
      degreeUrl: 'https://example.com/degrees/tran-van-hung-master.jpg',
      certificateUrl: 'https://example.com/certs/toan-hoc-su-pham.jpg',
      status: 'PENDING' as RequestStatus
    },
    {
      email: 'gv.pending2@edupath.vn',
      fullName: 'Nguyễn Thị Lan',
      phone: '0987654002',
      subjects: 'Tiếng Anh',
      education: 'Cử nhân',
      university: 'Đại học Ngoại ngữ - ĐHQGHN',
      experienceYears: 3,
      bio: 'Giảng dạy Tiếng Anh giao tiếp và ôn thi đại học bám sát cấu trúc mới.',
      dob: new Date('1995-09-20'),
      cvUrl: 'https://example.com/cv/nguyen-thi-lan.pdf',
      degreeUrl: 'https://example.com/degrees/nguyen-thi-lan-bachelor.jpg',
      certificateUrl: 'https://example.com/certs/ielts-8-5.jpg',
      status: 'PENDING' as RequestStatus
    }
  ];

  // 2. Approved teachers (2 records)
  const approvedTeachersData = [
    {
      email: 'gv.approved1@edupath.vn',
      fullName: 'Phạm Minh Đức',
      phone: '0901234003',
      subjects: 'Vật lý',
      education: 'Tiến sĩ',
      university: 'Đại học Bách khoa Hà Nội',
      experienceYears: 10,
      bio: 'Chuyên gia luyện thi Vật lý khối A00, A01 với các phương pháp giải nhanh.',
      dob: new Date('1988-12-10'),
      cvUrl: 'https://example.com/cv/pham-minh-duc.pdf',
      degreeUrl: 'https://example.com/degrees/pham-minh-duc-phd.jpg',
      certificateUrl: 'https://example.com/certs/nghiem-cuu-vat-ly.jpg',
      status: 'APPROVED' as RequestStatus,
      approvedAt: new Date()
    },
    {
      email: 'gv.approved2@edupath.vn',
      fullName: 'Hoàng Ngọc Hà',
      phone: '0934567004',
      subjects: 'Hóa học',
      education: 'Thạc sĩ',
      university: 'Đại học Sư phạm TP.HCM',
      experienceYears: 7,
      bio: 'Giáo viên ôn thi Hóa học chất lượng cao, giúp học sinh mất gốc lấy lại căn bản.',
      dob: new Date('1990-03-25'),
      cvUrl: 'https://example.com/cv/hoang-ngoc-ha.pdf',
      degreeUrl: 'https://example.com/degrees/hoang-ngoc-ha-master.jpg',
      certificateUrl: 'https://example.com/certs/hoa-huu-co-chuyen-sau.jpg',
      status: 'APPROVED' as RequestStatus,
      approvedAt: new Date()
    }
  ];

  // 3. Rejected teachers (2 records)
  const rejectedTeachersData = [
    {
      email: 'gv.rejected1@edupath.vn',
      fullName: 'Vũ Quốc Bảo',
      phone: '0976543005',
      subjects: 'Sinh học',
      education: 'Cử nhân',
      university: 'Đại học Khoa học Tự nhiên',
      experienceYears: 2,
      bio: 'Đam mê Sinh học và mong muốn truyền lửa cho các em học sinh.',
      dob: new Date('1998-07-08'),
      cvUrl: 'https://example.com/cv/vu-quoc-bao.pdf',
      degreeUrl: 'https://example.com/degrees/vu-quoc-bao-bachelor.jpg',
      certificateUrl: 'https://example.com/certs/sinh-hoc-co-ban.jpg',
      status: 'REJECTED' as RequestStatus,
      rejectedAt: new Date(),
      rejectedReason: 'Hồ sơ thiếu chứng chỉ sư phạm hoặc kinh nghiệm giảng dạy tối thiểu (yêu cầu ít nhất 3 năm kinh nghiệm).'
    },
    {
      email: 'gv.rejected2@edupath.vn',
      fullName: 'Lê Thu Trang',
      phone: '0965432006',
      subjects: 'Tiếng Anh',
      education: 'Cử nhân',
      university: 'Đại học Hà Nội',
      experienceYears: 1,
      bio: 'Giáo viên trẻ nhiệt huyết môn Tiếng Anh.',
      dob: new Date('1999-11-30'),
      cvUrl: 'https://example.com/cv/le-thu-trang.pdf',
      degreeUrl: 'https://example.com/degrees/le-thu-trang-bachelor.jpg',
      certificateUrl: 'https://example.com/certs/toeic-750.jpg',
      status: 'REJECTED' as RequestStatus,
      rejectedAt: new Date(),
      rejectedReason: 'Minh chứng chứng chỉ tiếng Anh (TOEIC 750) chưa đạt yêu cầu tối thiểu (yêu cầu IELTS 7.0 hoặc tương đương trở lên).'
    }
  ];

  // 4. Blocked teacher (1 record)
  const blockedTeacherData = {
    email: 'gv.blocked@edupath.vn',
    fullName: 'Đỗ Văn Chiến',
    phone: '0988888007',
    subjects: 'Toán học',
    education: 'Cử nhân',
    university: 'Đại học Sư phạm Thái Nguyên',
    experienceYears: 4,
    bio: 'Chuyên giảng dạy Toán THPT lớp 10, 11, 12.',
    dob: new Date('1993-01-01'),
    cvUrl: 'https://example.com/cv/do-van-chien.pdf',
    degreeUrl: 'https://example.com/degrees/do-van-chien-bachelor.jpg',
    certificateUrl: 'https://example.com/certs/su-pham-toan.jpg',
    status: 'APPROVED' as RequestStatus,
    approvedAt: new Date(),
    accountStatus: 'BLOCKED' as const,
    blockedReason: 'Vi phạm quy chuẩn cộng đồng: Đăng tải nội dung không phù hợp trên diễn đàn học tập.'
  };

  const seedTeacher = async (data: any, adminUser: any) => {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    const isBlocked = data.accountStatus === 'BLOCKED';

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          role: 'TEACHER',
          isActive: !isBlocked,
          status: isBlocked ? 'BLOCKED' : 'ACTIVE',
          phone: data.phone,
          emailVerified: true,
          onboardingComplete: true,
          blockedAt: isBlocked ? new Date() : null,
          blockedReason: isBlocked ? data.blockedReason : null,
          blockedBy: isBlocked ? adminUser.email : null
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: !isBlocked,
          status: isBlocked ? 'BLOCKED' : 'ACTIVE',
          phone: data.phone,
          blockedAt: isBlocked ? new Date() : null,
          blockedReason: isBlocked ? data.blockedReason : null,
          blockedBy: isBlocked ? adminUser.email : null
        }
      });
    }

    // Upsert Teacher
    await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {
        isApproved: data.status === 'APPROVED',
        bio: data.bio
      },
      create: {
        userId: user.id,
        isApproved: data.status === 'APPROVED',
        bio: data.bio
      }
    });

    // Upsert TeacherProfile
    await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        subjects: data.subjects,
        education: data.education,
        university: data.university,
        experienceYears: data.experienceYears,
        bio: data.bio,
        dob: data.dob,
        cvUrl: data.cvUrl,
        degreeUrl: data.degreeUrl,
        certificateUrl: data.certificateUrl,
        status: data.status,
        approvedAt: data.approvedAt || null,
        approvedBy: data.approvedAt ? adminUser.id : null,
        rejectedAt: data.rejectedAt || null,
        rejectedBy: data.rejectedAt ? adminUser.id : null,
        rejectedReason: data.rejectedReason || null
      },
      create: {
        userId: user.id,
        subjects: data.subjects,
        education: data.education,
        university: data.university,
        experienceYears: data.experienceYears,
        bio: data.bio,
        dob: data.dob,
        cvUrl: data.cvUrl,
        degreeUrl: data.degreeUrl,
        certificateUrl: data.certificateUrl,
        status: data.status,
        approvedAt: data.approvedAt || null,
        approvedBy: data.approvedAt ? adminUser.id : null,
        rejectedAt: data.rejectedAt || null,
        rejectedBy: data.rejectedAt ? adminUser.id : null,
        rejectedReason: data.rejectedReason || null
      }
    });
  };

  // Get admin user to assign reviewer relations
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('Error: Admin user not found. Please run main database seeder first!');
    return;
  }

  // Seed all categories
  for (const t of pendingTeachersData) {
    await seedTeacher(t, adminUser);
  }
  for (const t of approvedTeachersData) {
    await seedTeacher(t, adminUser);
  }
  for (const t of rejectedTeachersData) {
    await seedTeacher(t, adminUser);
  }
  await seedTeacher(blockedTeacherData, adminUser);

  console.log('[Seed Teachers] Seeding teacher accounts completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Teachers Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
