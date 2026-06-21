import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
export async function seedAllCourses() {
  console.log('[Seed Courses] Starting course seeder...');

  // 1. Clean existing course records to prevent duplicates and keep DB clean if run directly
  const isDirectRun = process.argv[1]?.includes('seed_courses');
  if (isDirectRun) {
    console.log('[Seed Courses] Cleaning existing courses...');
    await prisma.course.deleteMany({});
  }
  // 2. Ensure teachers exist (retrieve if existing, create if not)
  console.log('[Seed Courses] Ensuring teachers exist...');
  const teacherHash = await bcrypt.hash('teacher123', 12);
  
  const teacherA = await prisma.user.upsert({
    where: { email: 'theanh.math@edupath.vn' },
    update: {},
    create: {
      email: 'theanh.math@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Thầy Nguyễn Thế Anh',
      role: 'TEACHER',
      avatarUrl: 'TA',
      teacher: { create: { isApproved: true, bio: 'Giảng viên chuyên ôn Toán THPTQG với 12 năm kinh nghiệm.' } }
    }
  });

  const teacherB = await prisma.user.upsert({
    where: { email: 'huong.physics@edupath.vn' },
    update: {},
    create: {
      email: 'huong.physics@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Cô Lê Thu Hương',
      role: 'TEACHER',
      avatarUrl: 'LH',
      teacher: { create: { isApproved: true, bio: 'Tốt nghiệp Đại học Sư Phạm Hà Nội, ôn luyện Vật lý THPTQG.' } }
    }
  });

  const teacherC = await prisma.user.upsert({
    where: { email: 'maianh.english@edupath.vn' },
    update: {},
    create: {
      email: 'maianh.english@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Cô Triệu Mai Anh',
      role: 'TEACHER',
      avatarUrl: 'MA',
      teacher: { create: { isApproved: true, bio: 'Thạc sĩ Ngôn ngữ Anh, cựu giáo viên Chuyên Ngoại Ngữ.' } }
    }
  });

  const teacherD = await prisma.user.upsert({
    where: { email: 'baocao.literature@edupath.vn' },
    update: {},
    create: {
      email: 'baocao.literature@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Thầy Nguyễn Quốc Bảo',
      role: 'TEACHER',
      avatarUrl: 'QB',
      teacher: { create: { isApproved: true, bio: 'Tốt nghiệp ĐH Sư Phạm, tác giả nhiều đầu sách ôn thi Văn THPTQG.' } }
    }
  });

  const teacherE = await prisma.user.upsert({
    where: { email: 'tri.history@edupath.vn' },
    update: {},
    create: {
      email: 'tri.history@edupath.vn',
      passwordHash: teacherHash,
      fullName: 'Thầy Hoàng Minh Trí',
      role: 'TEACHER',
      avatarUrl: 'MT',
      teacher: { create: { isApproved: true, bio: 'Chuyên gia ôn luyện Lịch sử & Địa lý THPTQG ôn thi trường chuyên.' } }
    }
  });

  // 3. Seed 10 courses
  console.log('[Seed Courses] Seeding 10 Courses...');
  
  await prisma.course.create({
    data: {
      title: 'Khảo sát hàm số nâng cao THPTQG',
      description: 'Chuyên đề bứt phá điểm 9+ môn Toán khối A01 và D01.',
      subject: 'Toán học',
      price: 499000.0,
      discount: 30,
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

  await prisma.course.create({
    data: {
      title: 'Hóa học hữu cơ Este - Lipit chuyên sâu',
      description: 'Lộ trình bứt phá điểm tuyệt đối môn Hóa học khối B00.',
      subject: 'Hóa học',
      price: 599000.0,
      discount: 40,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Este lý thuyết căn bản', order: 1, duration: '12:15' },
          { title: 'Bài 2: Tính chất hóa học Este nâng cao', order: 2, duration: '16:40' },
          { title: 'Bài 3: Phản ứng thủy phân và bài toán xà phòng hóa', order: 3, duration: '24:20' },
          { title: 'Bài 4: Lipit và chất béo cấu tạo', order: 4, duration: '18:30' },
          { title: 'Bài 5: Tổng ôn Este - Lipit từ lý thuyết đến bài tập', order: 5, duration: '32:10' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Chuyên đề Dao động cơ học thi đại học',
      description: 'Nắm chắc 7+ điểm phần dao động điều hòa khối A01.',
      subject: 'Vật lý',
      price: 399000.0,
      discount: 50,
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

  await prisma.course.create({
    data: {
      title: 'Chinh phục ngữ pháp Tiếng Anh THPTQG',
      description: 'Lấy lại căn bản ngữ pháp trọng tâm và kỹ thuật làm bài đọc hiểu Tiếng Anh.',
      subject: 'Tiếng Anh',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherC.id,
      lessons: {
        create: [
          { title: 'Bài 1: Tổng ôn các thì tiếng Anh hay gặp', order: 1, duration: '18:45' },
          { title: 'Bài 2: Sự hòa hợp giữa chủ ngữ và động từ', order: 2, duration: '20:10' },
          { title: 'Bài 3: Câu bị động và cách chuyển đổi nâng cao', order: 3, duration: '22:15' },
          { title: 'Bài 4: Mệnh đề quan hệ và cách rút gọn nhanh', order: 4, duration: '19:40' },
          { title: 'Bài 5: Kỹ năng đoán từ vựng trong bài đọc hiểu', order: 5, duration: '26:50' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Đột phá Nghị luận xã hội môn Ngữ văn',
      description: 'Bí quyết viết văn nghị luận xã hội sắc bén, lập luận logic đạt điểm tối đa.',
      subject: 'Ngữ văn',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherD.id,
      lessons: {
        create: [
          { title: 'Bài 1: Cấu trúc chuẩn 200 chữ bài viết nghị luận', order: 1, duration: '15:15' },
          { title: 'Bài 2: Cách lấy và đưa dẫn chứng thực tế thuyết phục', order: 3, duration: '18:30' },
          { title: 'Bài 3: Kỹ thuật viết mở bài cuốn hút và ấn tượng', order: 2, duration: '14:20' },
          { title: 'Bài 4: Phân tích tư tưởng đạo lý và hiện tượng đời sống', order: 4, duration: '22:00' },
          { title: 'Bài 5: Luyện viết đề tổng hợp và nhận xét chi tiết', order: 5, duration: '30:45' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Lịch sử Việt Nam cận hiện đại cấp tốc',
      description: 'Tóm tắt sơ đồ tư duy lịch sử Việt Nam giai đoạn 1858 đến nay.',
      subject: 'Lịch sử',
      price: 199000.0,
      discount: 20,
      isPublished: true,
      isApproved: true,
      teacherId: teacherE.id,
      lessons: {
        create: [
          { title: 'Bài 1: Thực dân Pháp xâm lược Việt Nam (1858-1884)', order: 1, duration: '25:10' },
          { title: 'Bài 2: Phong trào yêu nước chống Pháp đầu thế kỷ XX', order: 2, duration: '28:30' },
          { title: 'Bài 3: Cách mạng tháng Tám 1945 và nước VN Dân chủ Cộng hòa', order: 3, duration: '32:00' },
          { title: 'Bài 4: Cuộc kháng chiến chống thực dân Pháp (1945-1954)', order: 4, duration: '35:45' },
          { title: 'Bài 5: Luyện tập câu hỏi trắc nghiệm lịch sử cấp tốc', order: 5, duration: '24:20' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Sinh học tế bào & Di truyền học cốt lõi',
      description: 'Luyện thi THPTQG Sinh học chuyên sâu phần Di truyền và Biến dị.',
      subject: 'Sinh học',
      price: 299000.0,
      discount: 15,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Cấu trúc DNA, RNA và cơ chế phiên mã', order: 1, duration: '20:15' },
          { title: 'Bài 2: Quá trình dịch mã và tổng hợp Protein', order: 2, duration: '18:40' },
          { title: 'Bài 3: Quy luật di truyền Mendel và ứng dụng', order: 3, duration: '24:30' },
          { title: 'Bài 4: Biến dị nhiễm sắc thể và các hội chứng di truyền', order: 4, duration: '22:15' },
          { title: 'Bài 5: Bài tập quy luật di truyền nâng cao', order: 5, duration: '30:00' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Địa lý tự nhiên và kinh tế xã hội dễ hiểu',
      description: 'Học Địa lý qua Atlas trực quan, nắm chắc các đặc điểm tự nhiên và kinh tế vùng.',
      subject: 'Địa lý',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherE.id,
      lessons: {
        create: [
          { title: 'Bài 1: Hướng dẫn khai thác kỹ năng Atlas Địa lý VN', order: 1, duration: '18:20' },
          { title: 'Bài 2: Đặc điểm địa hình và khí hậu Việt Nam', order: 2, duration: '22:45' },
          { title: 'Bài 3: Địa lý dân cư và lao động việc làm', order: 3, duration: '16:50' },
          { title: 'Bài 4: Các vùng kinh tế trọng điểm Việt Nam', order: 4, duration: '25:10' },
          { title: 'Bài 5: Tổng ôn trắc nghiệm kỹ năng Atlas', order: 5, duration: '20:30' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Chuyên đề Số phức & Tích phân vận dụng cao',
      description: 'Luyện đề chinh phục điểm 9.6 - 10 môn Toán thi THPTQG.',
      subject: 'Toán học',
      price: 699000.0,
      discount: 45,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Khái niệm số phức và biểu diễn hình học nâng cao', order: 1, duration: '22:10' },
          { title: 'Bài 2: Cực trị số phức (Min-Max môđun) cực khó', order: 2, duration: '28:40' },
          { title: 'Bài 3: Phương pháp tính tích phân hàm ẩn vận dụng cao', order: 3, duration: '26:15' },
          { title: 'Bài 4: Ứng dụng tích phân tính diện tích, thể tích vật thể', order: 4, duration: '24:50' },
          { title: 'Bài 5: Tổng ôn đề thi số phức - tích phân cực khó', order: 5, duration: '32:30' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Luyện đề thi thử THPTQG Tiếng Anh 2026',
      description: 'Quét sạch các bẫy đề thi thử, bứt phá band điểm Tiếng Anh cấp tốc.',
      subject: 'Tiếng Anh',
      price: 299000.0,
      discount: 10,
      isPublished: true,
      isApproved: true,
      teacherId: teacherC.id,
      lessons: {
        create: [
          { title: 'Bài 1: Phân tích bẫy phát âm và trọng âm thường gặp', order: 1, duration: '15:45' },
          { title: 'Bài 2: Các cụm động từ (Phrasal Verbs) thông dụng nhất', order: 2, duration: '22:10' },
          { title: 'Bài 3: Bài tập sửa lỗi sai trong câu trắc nghiệm', order: 3, duration: '19:30' },
          { title: 'Bài 4: Giải đề thi thử cấu trúc chuẩn Bộ GD&ĐT 2026', order: 4, duration: '35:00' },
          { title: 'Bài 5: Chữa đề và chia sẻ kinh nghiệm tâm lý phòng thi', order: 5, duration: '28:15' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Chuyên đề Hình học không gian Oxyz',
      description: 'Bí quyết giải nhanh hình học tọa độ không gian Oxyz và ứng dụng thực tế môn Toán.',
      subject: 'Toán học',
      price: 350000.0,
      discount: 25,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Hệ tọa độ trong không gian Oxyz căn bản', order: 1, duration: '18:10' },
          { title: 'Bài 2: Phương trình mặt phẳng và các bài toán khoảng cách', order: 2, duration: '24:15' },
          { title: 'Bài 3: Phương trình đường thẳng trong không gian', order: 3, duration: '22:50' },
          { title: 'Bài 4: Vị trí tương đối và các bài toán góc', order: 4, duration: '20:45' },
          { title: 'Bài 5: Tìm điểm cực trị hình học Oxyz bằng hình chiếu', order: 5, duration: '31:20' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Nền tảng Toán 12 cho học sinh mất gốc',
      description: 'Lấy lại toàn bộ kiến thức Toán cốt lõi lớp 11 và tạo bước đệm vững chắc cho lớp 12.',
      subject: 'Toán học',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Ôn tập đạo hàm và các công thức tính nhanh đạo hàm', order: 1, duration: '15:30' },
          { title: 'Bài 2: Các khái niệm cơ bản về khảo sát hàm số', order: 2, duration: '19:45' },
          { title: 'Bài 3: Nhắc lại hình học không gian lớp 11 và tính thể tích', order: 3, duration: '21:10' },
          { title: 'Bài 4: Cách sử dụng máy tính Casio hỗ trợ giải toán', order: 4, duration: '25:20' },
          { title: 'Bài 5: Lộ trình học Toán 12 hiệu quả cho người xuất phát muộn', order: 5, duration: '18:15' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Dòng điện xoay chiều từ A đến Z',
      description: 'Đập tan nỗi sợ dòng điện xoay chiều, chinh phục trọn vẹn điểm số phần khó nhất môn Vật lý.',
      subject: 'Vật lý',
      price: 450000.0,
      discount: 35,
      isPublished: true,
      isApproved: true,
      teacherId: teacherB.id,
      lessons: {
        create: [
          { title: 'Bài 1: Đại cương về dòng điện xoay chiều', order: 1, duration: '20:15' },
          { title: 'Bài 2: Các mạch điện xoay chiều R, L, C mắc nối tiếp', order: 2, duration: '26:40' },
          { title: 'Bài 3: Hiện tượng cộng hưởng điện và ứng dụng thực tế', order: 3, duration: '22:10' },
          { title: 'Bài 4: Công suất của mạch điện xoay chiều và hệ số công suất', order: 4, duration: '28:30' },
          { title: 'Bài 5: Kỹ thuật giản đồ vectơ giải nhanh các bài toán nâng cao', order: 5, duration: '35:15' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Sóng ánh sáng & Sóng lượng tử vũ trụ',
      description: 'Khóa học miễn phí giúp học sinh làm quen với hiện tượng giao thoa ánh sáng và thuyết lượng tử.',
      subject: 'Vật lý',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherB.id,
      lessons: {
        create: [
          { title: 'Bài 1: Hiện tượng tán sắc ánh sáng và ánh sáng đơn sắc', order: 1, duration: '15:20' },
          { title: 'Bài 2: Giao thoa ánh sáng khe Y-âng và công thức khoảng vân', order: 2, duration: '22:15' },
          { title: 'Bài 3: Các loại quang phổ và nguồn phát quang', order: 3, duration: '18:40' },
          { title: 'Bài 4: Hiện tượng quang điện ngoài và thuyết lượng tử ánh sáng', order: 4, duration: '24:10' },
          { title: 'Bài 5: Mẫu nguyên tử Bo và các trạng thái dừng của electron', order: 5, duration: '21:30' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Hóa vô cơ lớp 12 chinh phục điểm 8+',
      description: 'Ôn tập hệ thống lý thuyết kim loại, kiềm, kiềm thổ, nhôm và các dạng bài tập đặc trưng.',
      subject: 'Hóa học',
      price: 380000.0,
      discount: 50,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Tính chất chung của kim loại và dãy điện hóa', order: 1, duration: '18:30' },
          { title: 'Bài 2: Kim loại kiềm, kiềm thổ và hợp chất quan trọng', order: 2, duration: '21:45' },
          { title: 'Bài 3: Nhôm và hợp chất lưỡng tính của nhôm', order: 3, duration: '24:10' },
          { title: 'Bài 4: Sắt, Crom và các phản ứng oxi hóa khử đặc trưng', order: 4, duration: '23:50' },
          { title: 'Bài 5: Phương pháp giải bài toán đồ thị và CO2 tác dụng với dung dịch kiềm', order: 5, duration: '30:15' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Lý thuyết Hóa học cốt lõi chống sai ngu',
      description: 'Tổng hợp 500 câu hỏi lý thuyết thường gặp trong đề thi thử THPTQG tránh bẫy điểm số.',
      subject: 'Hóa học',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Các lỗi sai kinh điển trong lý thuyết hữu cơ', order: 1, duration: '16:20' },
          { title: 'Bài 2: Tổng hợp thí nghiệm hóa học THPTQG', order: 2, duration: '20:15' },
          { title: 'Bài 3: Câu hỏi đếm phát biểu đúng sai về cacbohiđrat, polime', order: 3, duration: '22:30' },
          { title: 'Bài 4: Hiện tượng hóa học thực tiễn và nhận biết chất khí', order: 4, duration: '17:45' },
          { title: 'Bài 5: Đề kiểm tra lý thuyết tổng hợp số 1', order: 5, duration: '25:00' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Hệ sinh thái & Tiến hóa sinh giới',
      description: 'Nắm trọn vẹn điểm phần Tiến hóa và Sinh thái học trong đề thi Sinh học THPTQG.',
      subject: 'Sinh học',
      price: 180000.0,
      discount: 15,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Bằng chứng tiến hóa và học thuyết Darwin', order: 1, duration: '19:15' },
          { title: 'Bài 2: Học thuyết tiến hóa tổng hợp hiện đại', order: 2, duration: '21:30' },
          { title: 'Bài 3: Môi trường sống và các nhân tố sinh thái', order: 3, duration: '18:45' },
          { title: 'Bài 4: Đặc trưng của quần thể và quần xã sinh vật', order: 4, duration: '24:20' },
          { title: 'Bài 5: Chu trình sinh địa hóa và dòng năng lượng trong hệ sinh thái', order: 5, duration: '28:10' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Chinh phục Nghị luận văn học 12',
      description: 'Phân tích sâu sắc các tác phẩm trọng tâm như Vợ Chồng A Phủ, Vợ Nhặt, Người Lái Đò Sông Đà.',
      subject: 'Ngữ văn',
      price: 420000.0,
      discount: 30,
      isPublished: true,
      isApproved: true,
      teacherId: teacherD.id,
      lessons: {
        create: [
          { title: 'Bài 1: Kỹ năng phân tích nhân vật và diễn biến tâm lý', order: 1, duration: '22:15' },
          { title: 'Bài 2: Phân tích hình tượng thiên nhiên và con người Tây Bắc trong Vợ Chồng A Phủ', order: 2, duration: '28:40' },
          { title: 'Bài 3: Giá trị hiện thực và giá trị nhân đạo trong tác phẩm Vợ Nhặt', order: 3, duration: '26:50' },
          { title: 'Bài 4: Bút pháp nghệ thuật độc đáo của Nguyễn Tuân trong Người Lái Đò Sông Đà', order: 4, duration: '32:10' },
          { title: 'Bài 5: Các cách chuyển ý mượt mà và viết kết bài ấn tượng', order: 5, duration: '20:30' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Sơ đồ tư duy 10 tác phẩm văn học trọng tâm',
      description: 'Hệ thống hóa toàn bộ kiến thức văn học lớp 12 bằng Mindmap trực quan, dễ nhớ.',
      subject: 'Ngữ văn',
      price: 250000.0,
      discount: 20,
      isPublished: true,
      isApproved: true,
      teacherId: teacherD.id,
      lessons: {
        create: [
          { title: 'Bài 1: Sơ đồ tư duy Tây Tiến - Quang Dũng', order: 1, duration: '18:45' },
          { title: 'Bài 2: Sơ đồ tư duy Việt Bắc - Tố Hữu', order: 2, duration: '20:10' },
          { title: 'Bài 3: Sơ đồ tư duy Đất Nước - Nguyễn Khoa Điềm', order: 3, duration: '22:30' },
          { title: 'Bài 4: Sơ đồ tư duy Sóng - Xuân Quỳnh', order: 4, duration: '19:15' },
          { title: 'Bài 5: Sơ đồ tư duy Chiếc Thuyền Ngoài Xa - Nguyễn Minh Châu', order: 5, duration: '24:50' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Kỹ năng viết lại câu và từ vựng Tiếng Anh nâng cao',
      description: 'Làm chủ bài tập viết lại câu, nâng cao vốn từ vựng học thuật chinh phục điểm 9+.',
      subject: 'Tiếng Anh',
      price: 199000.0,
      discount: 10,
      isPublished: true,
      isApproved: true,
      teacherId: teacherC.id,
      lessons: {
        create: [
          { title: 'Bài 1: Cấu trúc biến đổi câu điều kiện và câu ước', order: 1, duration: '20:15' },
          { title: 'Bài 2: Biến đổi câu với cấu trúc so sánh và đảo ngữ nâng cao', order: 2, duration: '24:40' },
          { title: 'Bài 3: Cụm từ cố định (Collocations) phổ biến trong đề thi', order: 3, duration: '22:10' },
          { title: 'Bài 4: Phân biệt các từ dễ gây nhầm lẫn (Confusing Words)', order: 4, duration: '25:30' },
          { title: 'Bài 5: Luyện tập giải đề viết lại câu và điền từ bài đọc', order: 5, duration: '30:00' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Lịch sử Thế giới hiện đại (1945 - 2000)',
      description: 'Tóm tắt trọn vẹn lịch sử thế giới từ sau Chiến tranh thế giới thứ hai đến nay.',
      subject: 'Lịch sử',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherE.id,
      lessons: {
        create: [
          { title: 'Bài 1: Trật tự thế giới hai cực Ianta và tổ chức Liên Hợp Quốc', order: 1, duration: '22:30' },
          { title: 'Bài 2: Liên Xô và các nước Đông Âu giai đoạn 1945 - 1991', order: 2, duration: '25:15' },
          { title: 'Bài 3: Các nước Á, Phi, Mỹ Latinh sau chiến tranh thế giới thứ hai', order: 3, duration: '28:40' },
          { title: 'Bài 4: Mỹ, Tây Âu, Nhật Bản phát triển kinh tế và quan hệ quốc tế', order: 4, duration: '30:20' },
          { title: 'Bài 5: Tổng ôn trắc nghiệm lịch sử thế giới', order: 5, duration: '24:00' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Cách mạng Việt Nam giai đoạn vàng (1930 - 1975)',
      description: 'Học sâu hiểu kỹ hai cuộc kháng chiến chống Pháp và chống Mỹ cứu nước vĩ đại.',
      subject: 'Lịch sử',
      price: 220000.0,
      discount: 40,
      isPublished: true,
      isApproved: true,
      teacherId: teacherE.id,
      lessons: {
        create: [
          { title: 'Bài 1: Đảng Cộng sản Việt Nam ra đời và phong trào cách mạng 1930-1935', order: 1, duration: '24:15' },
          { title: 'Bài 2: Cao trào kháng Nhật cứu nước và Tổng khởi nghĩa tháng Tám 1945', order: 2, duration: '26:50' },
          { title: 'Bài 3: Chiến dịch Điện Biên Phủ 1954 lừng lẫy năm châu', order: 3, duration: '30:10' },
          { title: 'Bài 4: Chiến dịch Hồ Chí Minh lịch sử và đại thắng mùa xuân 1975', order: 4, duration: '35:45' },
          { title: 'Bài 5: Luyện giải câu hỏi lịch sử Việt Nam mức độ nhận biết - thông hiểu', order: 5, duration: '28:00' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Địa lý ngành kinh tế Việt Nam trọng tâm',
      description: 'Phân tích các ngành nông nghiệp, lâm nghiệp, ngư nghiệp và công nghiệp Việt Nam hiện đại.',
      subject: 'Địa lý',
      price: 210000.0,
      discount: 15,
      isPublished: true,
      isApproved: true,
      teacherId: teacherE.id,
      lessons: {
        create: [
          { title: 'Bài 1: Địa lý ngành nông nghiệp và sự phát triển nông thôn mới', order: 1, duration: '20:30' },
          { title: 'Bài 2: Lâm nghiệp, thủy sản và kinh tế biển Việt Nam', order: 2, duration: '18:45' },
          { title: 'Bài 3: Cơ cấu ngành công nghiệp và sự dịch chuyển cơ cấu kinh tế', order: 3, duration: '22:15' },
          { title: 'Bài 4: Địa lý ngành dịch vụ: Giao thông vận tải, Bưu chính viễn thông, Du lịch', order: 4, duration: '25:40' },
          { title: 'Bài 5: Luyện tập nhận dạng biểu đồ và bảng số liệu địa lý', order: 5, duration: '23:10' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Khai thác triệt để Atlas Địa lý Việt Nam',
      description: 'Chuyên đề miễn phí giúp học sinh lấy trọn vẹn điểm các câu hỏi trắc nghiệm dùng Atlas.',
      subject: 'Địa lý',
      price: 0.0,
      discount: 0,
      isPublished: true,
      isApproved: true,
      teacherId: teacherE.id,
      lessons: {
        create: [
          { title: 'Bài 1: Các ký hiệu chung và quy tắc tra cứu Atlas nhanh', order: 1, duration: '15:20' },
          { title: 'Bài 2: Hướng dẫn đọc trang Địa lý tự nhiên (Hình thể, Đất, Khí hậu...)', order: 2, duration: '21:40' },
          { title: 'Bài 3: Đọc trang Địa lý dân cư và các vùng kinh tế nông - lâm - ngư nghiệp', order: 3, duration: '19:15' },
          { title: 'Bài 4: Đọc trang Địa lý các ngành công nghiệp và giao thông dịch vụ', order: 4, duration: '23:50' },
          { title: 'Bài 5: Các mẹo trả lời câu hỏi Atlas loại trừ phương án sai nhanh nhất', order: 5, duration: '18:45' }
        ]
      }
    }
  });

  await prisma.course.create({
    data: {
      title: 'Luyện thi Đánh giá năng lực ĐHQG Hà Nội & TP.HCM',
      description: 'Tổng ôn toàn diện các dạng bài tư duy định lượng, tư duy định tính và giải quyết vấn đề.',
      subject: 'Toán học',
      price: 599000.0,
      discount: 30,
      isPublished: true,
      isApproved: true,
      teacherId: teacherA.id,
      lessons: {
        create: [
          { title: 'Bài 1: Cấu trúc đề thi HSA, APT và chiến lược làm bài thi', order: 1, duration: '22:45' },
          { title: 'Bài 2: Chuyên đề tư duy định lượng (Toán học logic, thống kê dữ liệu)', order: 3, duration: '30:30' },
          { title: 'Bài 3: Chuyên đề tư duy định tính (Ngữ văn, cảm thụ văn học nâng cao)', order: 2, duration: '26:15' },
          { title: 'Bài 4: Chuyên đề giải quyết vấn đề Khoa học Tự nhiên & Xã hội', order: 4, duration: '32:40' },
          { title: 'Bài 5: Giải chi tiết đề minh họa Đánh giá năng lực mới nhất', order: 5, duration: '45:00' }
        ]
      }
    }
  });

  // 4. Generate 30 additional dynamic courses to populate the database
  console.log('[Seed Courses] Seeding 30 additional dynamic courses...');
  const extraSubjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn', 'Lịch sử', 'Địa lý'];
  const extraTitles = [
    'Bí quyết ôn thi cấp tốc {subject}',
    'Tuyển tập 100 dạng bài {subject} nâng cao',
    'Tổng hợp chuyên đề cốt lõi {subject} 2026',
    'Bứt phá điểm 8+ cùng {subject}',
    'Lấy gốc {subject} trong 10 ngày',
    'Chinh phục đề thi thử THPTQG {subject}',
    'Tổng ôn lý thuyết và bài tập {subject}'
  ];
  const extraDescriptions = [
    'Khóa học được biên soạn bám sát cấu trúc đề thi chính thức của Bộ Giáo dục và Đào tạo.',
    'Giúp học sinh hệ thống hóa kiến thức nhanh chóng và nhớ lâu qua sơ đồ tư duy.',
    'Chuyên đề trọng tâm giúp học sinh đạt điểm số mong muốn trong kỳ thi THPT Quốc gia.',
    'Tổng hợp các mẹo và phương pháp giải nhanh trắc nghiệm hiệu quả.',
    'Lộ trình tinh gọn dành cho các em học sinh bận rộn muốn bứt phá điểm số.'
  ];
  const teachersList = [teacherA, teacherB, teacherC, teacherD, teacherE];
  
  for (let i = 0; i < 30; i++) {
    const subject = extraSubjects[i % extraSubjects.length];
    const teacher = teachersList[i % teachersList.length];
    const titleTemplate = extraTitles[i % extraTitles.length];
    const title = titleTemplate.replace('{subject}', subject === 'Toán học' ? 'Toán' : subject);
    const description = extraDescriptions[i % extraDescriptions.length];
    
    // Some free, some paid
    const isFree = i % 5 === 0;
    const price = isFree ? 0.0 : (200000 + (i % 8) * 70000);
    const discount = isFree ? 0 : (10 + (i % 5) * 10); // 10%, 20%, 30%, 40%, 50%
    
    await prisma.course.create({
      data: {
        title: `${title} (Kỳ ${i + 1})`,
        description,
        subject,
        price,
        discount,
        isPublished: true,
        isApproved: true,
        teacherId: teacher.id,
        lessons: {
          create: [
            { title: 'Bài 1: Khởi động và định hướng lộ trình', order: 1, duration: '12:00' },
            { title: 'Bài 2: Kiến thức nền tảng bắt buộc phải nhớ', order: 2, duration: '18:15' },
            { title: 'Bài 3: Các phương pháp và kỹ thuật giải nhanh', order: 3, duration: '22:30' },
            { title: 'Bài 4: Thực hành giải chi tiết ví dụ minh họa', order: 4, duration: '20:45' },
            { title: 'Bài 5: Tổng ôn và đánh giá kết quả chuyên đề', order: 5, duration: '25:00' }
          ]
        }
      }
    });
  }

  // Post-process grades: distribute courses across grade 10, 11, 12 to populate filters
  console.log('[Seed Courses] Post-processing course grades...');
  const allSeededCourses = await prisma.course.findMany();
  for (let i = 0; i < allSeededCourses.length; i++) {
    const course = allSeededCourses[i];
    const grade = 10 + (i % 3); // 10, 11, 12
    await prisma.course.update({
      where: { id: course.id },
      data: { grade }
    });
  }

  // Post-process lessons to add videoUrls
  console.log('[Seed Courses] Adding default embeddable videos to all lessons...');
  const allLessons = await prisma.lesson.findMany({
    where: { videoUrl: null }
  });
  
  const YOUTUBE_IDS = [
    'V1y3_Tz1Gf4',
    '3Q90uJdSpXo',
    '537bNfX-i64',
    'F91V6c_yO50',
    'bM7SZ5SBzyY',
    'HGeUpeCjSbg',
    '01GzX1S6_sM',
    'W6NZfCO5SIk',
    '5_b7s1kGEXQ',
    '7Qn6Xf5nF7M'
  ];

  for (let i = 0; i < allLessons.length; i++) {
    const lesson = allLessons[i];
    const id = YOUTUBE_IDS[i % YOUTUBE_IDS.length];
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { videoUrl: `https://www.youtube.com/embed/${id}` }
    });
  }

  console.log('[Seed Courses] Seeding completed successfully!');
}

async function main() {
  await seedAllCourses();
}

if (process.argv[1]?.includes('seed_courses')) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
