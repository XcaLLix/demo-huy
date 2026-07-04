import { PrismaClient, CourseStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Migrate] Starting: Convert DRAFT courses to PENDING...');

  // Convert all DRAFT courses to PENDING so admin can review them
  const result = await prisma.course.updateMany({
    where: {
      status: CourseStatus.DRAFT
    },
    data: {
      status: CourseStatus.PENDING,
      isApproved: false,
      isPublished: false,
      submittedAt: new Date()
    }
  });

  console.log(`[Migrate] Done! Updated ${result.count} courses from DRAFT → PENDING.`);

  // Show summary of all statuses
  const summary = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count FROM "Course" GROUP BY status ORDER BY count DESC
  `;
  console.log('[Migrate] Current course status distribution:', summary);
}

main()
  .catch((e) => {
    console.error('[Migrate Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

