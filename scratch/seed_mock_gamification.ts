import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
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
    
    console.log(`\n-------------------------------------`);
    console.log(`[User ${i + 1}/${mockEfforts.length}] Processing user ID: ${user.id}, current name: ${user.fullName}`);
    
    // Update fullName to match mock names for beautiful display
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { fullName: data.name }
      });
      console.log(`  - Updated name to: ${data.name}`);
    } catch (err) {
      console.error(`  - Failed to update name: ${err.message}`);
    }

    // Seed Effort Score
    try {
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
      console.log(`  - Upserted userEffort: forum=${data.forum}, study=${data.study}`);
    } catch (err) {
      console.error(`  - Failed to upsert userEffort: ${err.message}`);
    }

    // Seed Attendance for the last 30 days
    const today = new Date();
    today.setHours(0,0,0,0);
    const activities = ['LESSON', 'TEST', 'MINDMAP', 'FLASHCARD'];
    let attendanceCount = 0;
    
    try {
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        if (Math.random() > 0.3) {
          const date = new Date(today);
          date.setDate(today.getDate() - dayOffset);
          
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
            attendanceCount++;
          }
        }
      }
      console.log(`  - Seeded ${attendanceCount} attendance logs`);
    } catch (err) {
      console.error(`  - Failed to seed attendance: ${err.message}`);
    }
    
    // Seed general streak in gamification
    try {
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
      console.log(`  - Upserted userGamification (streak, level)`);
    } catch (err) {
      console.error(`  - Failed to upsert userGamification: ${err.message}`);
    }

    // Upsert Student profile if missing
    let student = user.student;
    if (!student) {
      try {
        student = await prisma.student.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            subjectGroup: "A00",
            grade: 12,
            province: "Hà Nội",
            school: "THPT Chuyên Hà Nội - Amsterdam"
          }
        });
        console.log(`  - Upserted Student profile`);
      } catch (err) {
        console.error(`  - Failed to upsert Student profile: ${err.message}`);
      }
    }

    // Seed test attempts with top scores across subjects if exams exist
    if (exams.length > 0) {
      const subjects = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn'];
      let attemptCount = 0;
      for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
        const subj = subjects[sIdx];
        
        try {
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

          if (student) {
            const score = parseFloat((8.0 + Math.random() * 2.0).toFixed(1));
            
            // Check if attempt exists for this student and exam, if not create it
            const existingAttempt = await prisma.testAttempt.findFirst({
              where: { studentId: user.id, examId: exam.id }
            });
            
            if (!existingAttempt) {
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
              attemptCount++;
            }
          }
        } catch (err) {
          console.error(`  - Failed to seed attempt for subject ${subj}: ${err.message}`);
        }
      }
      console.log(`  - Seeded ${attemptCount} new test attempts`);
    }
  }

  console.log("\nSeeding gamification data completed successfully.");
}

main()
  .catch(err => {
    console.error(err);
  })
  .finally(() => prisma.$disconnect());
