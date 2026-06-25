import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed Reports] Starting seeding moderation reports...');

  // 1. Find Admin
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  if (!admin) {
    console.error('No admin user found! Please seed users first.');
    return;
  }

  // 2. Find Student Users for Reporters
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    take: 5
  });
  if (students.length === 0) {
    console.error('No student users found! Please seed users first.');
    return;
  }

  // 3. Find Courses to Report
  const courses = await prisma.course.findMany({
    take: 10,
    include: { teacher: { include: { user: true } } }
  });
  if (courses.length === 0) {
    console.error('No courses found! Please seed courses first.');
    return;
  }

  // 4. Create/Get Forum Category and Post for Comment reporting
  let category = await prisma.forumCategory.findFirst();
  if (!category) {
    category = await prisma.forumCategory.create({
      data: {
        name: 'Thảo luận chung',
        slug: 'thao-luan-chung',
        description: 'Thảo luận chung'
      }
    });
  }

  const commentAuthor = students[1] || students[0];
  const reporterUser = students[0];

  const post = await prisma.forumPost.create({
    data: {
      title: 'Bài viết cho mục đích kiểm duyệt bình luận',
      slug: `post-for-moderation-reports-${Date.now()}`,
      content: 'Bài viết này chứa các bình luận mẫu được dùng để báo cáo kiểm duyệt.',
      categoryId: category.id,
      authorId: commentAuthor.id,
      postType: 'GENERAL'
    }
  });

  // Create 10 comments to report
  const commentContents = [
    'Bình luận spam quảng cáo khóa học khác 1',
    'Bình luận dùng từ ngữ thô tục vô văn hóa 2',
    'Spam link lừa đảo trúng thưởng điện thoại 3',
    'Bình luận xúc phạm người dạy và các bạn học sinh 4',
    'Chia sẻ tài liệu lậu không có bản quyền ở đây 5',
    'Bình luận spam nhảm nhí lập đi lập lại 6',
    'Nói xấu chửi bới giáo viên dạy dở 7',
    'Bình luận chia sẻ nội dung độc hại 8',
    'Bình luận quảng bá dịch vụ thi hộ điểm cao 9',
    'Gửi link chứa mã độc đánh cắp tài khoản 10'
  ];

  const createdComments = [];
  for (let i = 0; i < commentContents.length; i++) {
    const c = await prisma.forumComment.create({
      data: {
        postId: post.id,
        authorId: commentAuthor.id,
        content: commentContents[i]
      }
    });
    createdComments.push(c);
  }

  console.log(`[Seed Reports] Created ${createdComments.length} comments to report.`);

  // 5. Seed 10 Course Reports
  // 5 Pending, 3 Approved, 2 Rejected
  const courseReasons = [
    'Nội dung khóa học vi phạm bản quyền sách bài tập bộ giáo dục.',
    'Giáo viên giảng dạy hời hợt, nội dung không đúng với quảng cáo.',
    'Quảng cáo lừa đảo, khóa học trống rỗng không có bài giảng nào.',
    'Sử dụng ngôn từ không chuẩn mực trong phần mô tả khóa học.',
    'Nội dung chứa hình ảnh và thông tin không lành mạnh.',
    'Nội dung trùng lặp hoàn toàn với khóa học miễn phí khác.',
    'Lừa đảo chiếm đoạt tài sản học sinh.',
    'Giáo viên lăng mạ học sinh ở phần mô tả khóa học.',
    'Tài liệu đi kèm chứa mã độc hoặc liên kết nguy hiểm.',
    'Khóa học bắt học sinh mua thêm phần mềm ngoài đắt tiền.'
  ];

  const courseReportsData = [];
  for (let i = 0; i < 10; i++) {
    const courseIndex = i % courses.length;
    const targetCourse = courses[courseIndex];
    let status = 'PENDING';
    let resolutionNote = null;
    let reviewedAt = null;
    let reviewedBy = null;

    if (i >= 5 && i < 8) {
      status = 'APPROVED';
      resolutionNote = 'Báo cáo hợp lệ. Đã tiến hành ẩn khóa học và nhắc nhở giáo viên.';
      reviewedAt = new Date();
      reviewedBy = admin.id;
    } else if (i >= 8) {
      status = 'REJECTED';
      resolutionNote = 'Báo cáo không chính xác. Khóa học có nội dung đầy đủ và đúng quy định.';
      reviewedAt = new Date();
      reviewedBy = admin.id;
    }

    const r = await prisma.report.create({
      data: {
        reporterId: reporterUser.id,
        targetType: 'COURSE',
        targetId: targetCourse.id,
        reason: courseReasons[i].slice(0, 50),
        description: courseReasons[i],
        status,
        resolutionNote,
        reviewedAt,
        reviewedBy
      }
    });
    courseReportsData.push(r);
  }
  console.log('[Seed Reports] Created 10 course reports.');

  // 6. Seed 10 Comment Reports
  // 5 Pending, 2 Approved, 3 Rejected
  const commentReasons = [
    'Bình luận spam quảng cáo rác làm loãng diễn đàn.',
    'Sử dụng từ ngữ tục tĩu, thóa mạ thành viên khác.',
    'Spam liên kết lừa đảo nhận quà nhận thưởng giả mạo.',
    'Xúc phạm cá nhân học sinh và giáo viên giảng dạy.',
    'Phát tán tài liệu ôn thi lậu vi phạm nghiêm trọng bản quyền.',
    'Bình luận nhảm nhí, lặp lại nhiều lần gây khó chịu.',
    'Chửi bới và xúc phạm danh dự giáo viên.',
    'Nội dung chia sẻ thông tin độc hại không lành mạnh.',
    'Quảng bá dịch vụ thi hộ, gian lận trong học tập và thi cử.',
    'Bình luận chứa liên kết nguy hiểm tải virus phá hoại máy tính.'
  ];

  const commentReportsData = [];
  for (let i = 0; i < 10; i++) {
    const targetComment = createdComments[i];
    let status = 'PENDING';
    let resolutionNote = null;
    let reviewedAt = null;
    let reviewedBy = null;

    if (i >= 5 && i < 7) {
      status = 'APPROVED';
      resolutionNote = 'Bình luận chứa từ ngữ thô tục vi phạm quy tắc ứng xử của EduPath. Đã duyệt báo cáo.';
      reviewedAt = new Date();
      reviewedBy = admin.id;
    } else if (i >= 7) {
      status = 'REJECTED';
      resolutionNote = 'Nội dung bình luận bình thường, mang tính chất thảo luận bài học ôn thi.';
      reviewedAt = new Date();
      reviewedBy = admin.id;
    }

    const r = await prisma.report.create({
      data: {
        reporterId: reporterUser.id,
        targetType: 'COMMENT',
        targetId: targetComment.id,
        reason: commentReasons[i].slice(0, 50),
        description: commentReasons[i],
        status,
        resolutionNote,
        reviewedAt,
        reviewedBy
      }
    });
    commentReportsData.push(r);
  }
  console.log('[Seed Reports] Created 10 comment reports.');

  // 7. Seed Warnings
  // Create some warnings for commentAuthor and teachers of reported courses
  const warningsData = [
    {
      userId: commentAuthor.id,
      reportId: commentReportsData[5].id, // Approved comment report
      message: 'Tài khoản của bạn đã bị cảnh báo do bình luận chứa từ ngữ không chuẩn mực trên diễn đàn. Vui lòng tôn trọng quy chuẩn cộng đồng.'
    },
    {
      userId: commentAuthor.id,
      reportId: commentReportsData[6].id, // Approved comment report
      message: 'Cảnh báo lần 2: Phát tán thông tin rác quảng cáo làm ảnh hưởng đến học sinh khác.'
    },
    {
      userId: courses[0].teacherId,
      reportId: courseReportsData[5].id, // Approved course report
      message: 'Khóa học của bạn bị báo cáo vi phạm nội dung mô tả không chuẩn mực. Vui lòng chỉnh sửa lại nội dung mô tả khóa học.'
    }
  ];

  for (const w of warningsData) {
    await prisma.warning.create({
      data: {
        userId: w.userId,
        reportId: w.reportId,
        message: w.message
      }
    });

    // Also send an in-app notification
    await prisma.notification.create({
      data: {
        userId: w.userId,
        title: 'Cảnh báo từ Quản trị viên',
        message: w.message
      }
    });
  }
  console.log('[Seed Reports] Created warnings and notifications.');

  console.log('[Seed Reports] Seeding complete! Database is populated with moderation data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
