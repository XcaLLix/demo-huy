import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courseCount = await prisma.course.count();
  const lessonCount = await prisma.lesson.count();
  const examCount = await prisma.exam.count();
  const questionCount = await prisma.question.count();
  
  console.log(`Courses: ${courseCount}`);
  console.log(`Lessons: ${lessonCount}`);
  console.log(`Exams: ${examCount}`);
  console.log(`Questions: ${questionCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
