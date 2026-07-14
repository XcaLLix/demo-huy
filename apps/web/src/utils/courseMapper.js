export function mapDbCourseToMockFormat(c) {
  if (!c) return null;

  if (c.priceOriginal !== undefined && c.priceSale !== undefined) {
    if (c.priceOriginal <= c.priceSale) {
      const saleVal = Number(c.priceSale);
      if (saleVal === 0) {
        c.priceOriginal = 199000 + (Number(c.id || 0) % 3) * 50000;
      } else {
        const markupOriginal = Math.round((saleVal * 1.4) / 10000) * 10000;
        c.priceOriginal = markupOriginal > saleVal ? markupOriginal : saleVal + 150000;
      }
    }
    return c;
  }

  // Calculate rating
  const ratingVal = c.reviews && c.reviews.length > 0 
    ? Number((c.reviews.reduce((acc, r) => acc + r.rating, 0) / c.reviews.length).toFixed(1))
    : 4.8;

  // Student count (fallback if 0, to make dashboard look populated for demo)
  const studentCountVal = c.enrollments && c.enrollments.length > 0 
    ? c.enrollments.length 
    : (Number(c.id) * 350 + 120);

  // Badge assignment
  const badgeVal = c.price === 0 
    ? 'MIỄN PHÍ' 
    : (c.id % 3 === 0 ? 'BÁN CHẠY' : (c.id % 2 === 0 ? 'HOT' : 'ĐỀ XUẤT'));

  // Calculate duration
  let totalMinutes = 0;
  if (c.lessons && c.lessons.length > 0) {
    c.lessons.forEach(l => {
      if (l.duration) {
        const parts = l.duration.split(':');
        if (parts.length >= 1) {
          const m = parseInt(parts[0], 10);
          if (!isNaN(m)) totalMinutes += m;
        }
      }
    });
  }
  const durationHoursVal = totalMinutes > 0 ? Math.ceil(totalMinutes / 60) : 12;

  // Curriculum mapping (grouping flat list of lessons into sections/chapters)
  const curriculumVal = [];
  if (c.lessons && c.lessons.length > 0) {
    const sortedLessons = [...c.lessons].sort((a, b) => a.order - b.order);
    
    if (sortedLessons.length >= 3) {
      curriculumVal.push({
        title: "Phần 0",
        lessons: sortedLessons.slice(0, 1).map(l => ({
          id: l.id.toString(),
          title: l.title,
          type: l.videoUrl ? 'video' : 'document',
          durationMin: parseInt(l.duration?.split(':')[0], 10) || 15,
          isPreview: true,
          videoUrl: l.videoUrl
        }))
      });
      curriculumVal.push({
        title: "Phần 1",
        lessons: sortedLessons.slice(1, sortedLessons.length - 1).map(l => ({
          id: l.id.toString(),
          title: l.title,
          type: l.videoUrl ? 'video' : 'document',
          durationMin: parseInt(l.duration?.split(':')[0], 10) || 15,
          isPreview: false,
          videoUrl: l.videoUrl
        }))
      });
      curriculumVal.push({
        title: "Phần 2",
        lessons: sortedLessons.slice(sortedLessons.length - 1).map(l => ({
          id: l.id.toString(),
          title: l.title,
          type: l.videoUrl ? 'video' : 'document',
          durationMin: parseInt(l.duration?.split(':')[0], 10) || 15,
          isPreview: false,
          videoUrl: l.videoUrl
        }))
      });
    } else {
      curriculumVal.push({
        title: "Phần 0",
        lessons: sortedLessons.map(l => ({
          id: l.id.toString(),
          title: l.title,
          type: l.videoUrl ? 'video' : 'document',
          durationMin: parseInt(l.duration?.split(':')[0], 10) || 15,
          isPreview: l.order === 1,
          videoUrl: l.videoUrl
        }))
      });
    }
  } else {
    curriculumVal.push({
      title: "Danh sách bài học",
      lessons: [
        { id: `${c.id}01`, title: "Bài 1: Khái niệm và phương pháp mở đầu", type: "video", durationMin: 15, isPreview: true },
        { id: `${c.id}02`, title: "Bài 2: Các dạng bài tập trắc nghiệm cơ bản", type: "video", durationMin: 20, isPreview: false }
      ]
    });
  }

  // Determine level
  let levelVal = (c.level && !c.level.startsWith('http') && !c.level.startsWith('/')) ? c.level : "Cơ bản";
  if (c.title.toLowerCase().includes('nâng cao') || c.title.toLowerCase().includes('chuyên sâu')) {
    levelVal = "Nâng cao";
  } else if (c.title.toLowerCase().includes('cấp tốc')) {
    levelVal = "Cấp tốc";
  }

  return {
    id: c.id.toString(),
    title: c.title,
    subject: c.subject === 'Toán học' ? 'Toán' : c.subject,
    block: c.subjectGroup ? `Khối ${c.subjectGroup}` : "Tổng hợp",
    thumbnail: c.thumbnailUrl,
    badge: badgeVal,
    description: c.description,
    rating: ratingVal,
    reviewCount: c.reviews ? c.reviews.length : (Number(c.id) * 87 + 45),
    lessonCount: c.lessons ? c.lessons.length : 5,
    durationHours: durationHoursVal,
    studentCount: studentCountVal,
    instructor: {
      name: c.teacher?.user?.fullName || "Giảng viên EduPath",
      title: c.teacher?.bio || "Thạc sĩ, Cố vấn học thuật EduPath",
      avatar: c.teacher?.user?.avatarUrl || "GV"
    },
    priceOriginal: Number(c.price) <= (Number(c.price) * (1 - (c.discount || 0) / 100))
      ? (Number(c.price) === 0 ? (199000 + (Number(c.id || 0) % 3) * 50000) : (Math.round((Number(c.price) * (1 - (c.discount || 0) / 100) * 1.4) / 10000) * 10000 || Number(c.price) + 150000))
      : Number(c.price),
    priceSale: Number(c.price) * (1 - (c.discount || 0) / 100),
    discountPercent: c.discount || 0,
    level: levelVal,
    trailerUrl: (c.level && (c.level.startsWith('http') || c.level.startsWith('/'))) ? c.level : null,
    grade: c.grade,
    status: c.status,
    visibility: c.visibility,
    isApproved: c.isApproved,
    isPublished: c.isPublished,
    rejectedReason: c.rejectedReason,
    lessons: c.lessons || [],
    curriculum: curriculumVal.map(c => ({
      ...c,
      title: c.title
    }))
  };
}
