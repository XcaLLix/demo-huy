const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching users and exams...");
  const users = await prisma.user.findMany({
    take: 10,
    include: { student: true }
  });
  const exams = await prisma.exam.findMany({
    take: 10
  });

  console.log(`Found ${users.length} users and ${exams.length} exams.`);
  
  if (users.length === 0) {
    console.log("No users found. Cannot seed mock leaderboard data.");
    return;
  }

  // Create efforts for users
  const mockEfforts = [
    { name: "Lê Ngọc Hoàng", forum: 145, study: 230 },
    { name: "Trần Văn Thuận", forum: 90, study: 180 },
    { name: "Nguyễn Minh Đức", forum: 120, study: 140 },
    { name: "Phạm Thùy Linh", forum: 75, study: 210 },
    { name: "Đặng Hoàng Nam", forum: 60, study: 170 },
    { name: "Vũ Thị Mai", forum: 110, study: 105 }
  ];

  for (let i = 0; i < Math.min(users.length, mockEfforts.length); i++) {
    const user = users[i];
    const data = mockEfforts[i];
    
    // Update fullName to match mock names for beautiful display
    await prisma.user.update({
      where: { id: user.id },
      data: { fullName: data.name }
    });

    // Seed Effort Score
    await prisma.userEffort.upsert({
      where: { userId: user.id },
      update: {
        forumPoints: data.forum,
        studyPoints: data.study,
        score: data.forum + data.study
      },
      create: {
        userId: user.id,
        forumPoints: data.forum,
        studyPoints: data.study,
        score: data.forum + data.study
      }
    });

    // Seed Attendance for the last 30 days
    const today = new Date();
    today.setHours(0,0,0,0);
    const activities = ['LESSON', 'TEST', 'MINDMAP', 'FLASHCARD'];
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      // Randomly complete some days
      if (Math.random() > 0.3) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);
        
        // Random activity count
        const activityCount = Math.floor(Math.random() * 2) + 1;
        const shuffled = [...activities].sort(() => 0.5 - Math.random());
        
        for (let actIdx = 0; actIdx < activityCount; actIdx++) {
          const activity = shuffled[actIdx];
          await prisma.learningAttendance.upsert({
            where: {
              userId_date_activity: {
                userId: user.id,
                date,
                activity
              }
            },
            update: {},
            create: {
              userId: user.id,
              date,
              activity
            }
          });
        }
      }
    }
    
    // Seed general streak in gamification
    await prisma.userGamification.upsert({
      where: { userId: user.id },
      update: {
        streakDays: 5 + (i % 3) * 3,
        xp: 1200 + i * 250,
        level: 3 + (i % 2)
      },
      create: {
        userId: user.id,
        streakDays: 5 + (i % 3) * 3,
        xp: 1200 + i * 250,
        level: 3 + (i % 2)
      }
    });

    // Seed test attempts with top scores across subjects if exams exist
    if (exams.length > 0) {
      const subjects = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn'];
      for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
        const subj = subjects[sIdx];
        
        // Find or create an exam for this subject
        let exam = exams.find(e => e.subject.toLowerCase() === subj.toLowerCase());
        if (!exam) {
          exam = await prisma.exam.create({
            data: {
              title: `Đề thi thử THPT QG ${subj} - Lần 1`,
              subject: subj,
              subjectGroup: "A00",
              duration: 90,
              isPublic: true,
              createdBy: user.id,
              totalQuestions: 40,
              difficulty: "MEDIUM"
            }
          });
        }

        // Create test attempt
        if (user.student) {
          const score = parseFloat((8.0 + Math.random() * 2.0).toFixed(1));
          await prisma.testAttempt.create({
            data: {
              studentId: user.id,
              examId: exam.id,
              score,
              status: 'SUBMITTED',
              durationUsed: 3600,
              correctCount: Math.round(score * 4),
              wrongCount: 40 - Math.round(score * 4),
              skippedCount: 0,
              submittedAt: new Date(Date.now() - sIdx * 86400000)
            }
          });
        }
      }
    }
  }

  console.log("Seeding gamification data completed successfully.");
}

main()
  .catch(err => {
    console.error(err);
  })
  .finally(() => prisma.$disconnect());
