import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { sendWeeklyPraiseEmail } from '../lib/mailer.js';

/**
 * Weekly Praise Email Cron Job
 * Runs every Monday at 7:00 AM to fetch and congratulate top performing students.
 */
export function startWeeklyPraiseEmailJob() {
  const cronExpr = '0 7 * * 1'; // 7:00 AM every Monday (1 = Monday)
  console.log(`[Cron] Initializing Weekly Praise Email job with schedule: "${cronExpr}"`);

  cron.schedule(cronExpr, async () => {
    console.log('[Cron] Starting Weekly Praise Email distribution...');
    try {
      await sendAllWeeklyPraiseEmails();
      console.log('[Cron] Weekly Praise Email distribution completed successfully.');
    } catch (err: any) {
      console.error('[Cron Error] Weekly Praise Email distribution failed:', err.message || err);
    }
  });
}

/**
 * Core business logic to retrieve top users and send congratulations emails.
 */
export async function sendAllWeeklyPraiseEmails(): Promise<void> {
  // 1. Fetch Top 1 XP student
  const topXPUser = await prisma.userGamification.findFirst({
    orderBy: { xp: 'desc' },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  });

  if (topXPUser && topXPUser.user.email) {
    await sendWeeklyPraiseEmail(
      topXPUser.user.email,
      topXPUser.user.fullName,
      'xp',
      topXPUser.xp
    );
  }

  // 2. Fetch Top 1 Streak student
  const topStreakUser = await prisma.userGamification.findFirst({
    where: { streakDays: { gt: 0 } },
    orderBy: { streakDays: 'desc' },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  });

  if (topStreakUser && topStreakUser.user.email) {
    await sendWeeklyPraiseEmail(
      topStreakUser.user.email,
      topStreakUser.user.fullName,
      'streak',
      topStreakUser.streakDays
    );
  }

  // 3. Fetch Top 1 Course Completion student
  const topCourseStudent = await prisma.student.findFirst({
    where: { enrollments: { some: {} } },
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      },
      _count: {
        select: { enrollments: true }
      }
    },
    orderBy: {
      enrollments: {
        _count: 'desc'
      }
    }
  });

  if (topCourseStudent && topCourseStudent.user.email) {
    await sendWeeklyPraiseEmail(
      topCourseStudent.user.email,
      topCourseStudent.user.fullName,
      'courses',
      topCourseStudent._count.enrollments
    );
  }
}
