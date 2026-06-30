import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

// Helper to calculate level from XP
export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (xp >= Math.floor(100 * Math.pow(level, 1.5))) {
    level++;
  }
  return level - 1 || 1;
}

// Function to log daily user study activity and update streaks/XP
export async function logUserActivity(
  userId: number,
  activityType: 'exercise' | 'exam' | 'lesson',
  subject: string,
  xpEarned: number,
  studyMinutes: number
) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to local date midnight

    // 1. Upsert DailyContribution for the heatmap
    const contribution = await prisma.dailyContribution.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    const subjectSlug = subject.toLowerCase().trim();

    if (contribution) {
      const currentSubjects = Array.isArray(contribution.subjectsStudied) 
        ? (contribution.subjectsStudied as string[]) 
        : [];
      const updatedSubjects = currentSubjects.includes(subjectSlug)
        ? currentSubjects
        : [...currentSubjects, subjectSlug];

      await prisma.dailyContribution.update({
        where: { id: contribution.id },
        data: {
          exerciseCount: { increment: activityType === 'exercise' ? 1 : 0 },
          examsCompleted: { increment: activityType === 'exam' ? 1 : 0 },
          lessonsCompleted: { increment: activityType === 'lesson' ? 1 : 0 },
          studyMinutes: { increment: studyMinutes },
          xpEarned: { increment: xpEarned },
          subjectsStudied: updatedSubjects
        }
      });
    } else {
      await prisma.dailyContribution.create({
        data: {
          userId,
          date: today,
          exerciseCount: activityType === 'exercise' ? 1 : 0,
          examsCompleted: activityType === 'exam' ? 1 : 0,
          lessonsCompleted: activityType === 'lesson' ? 1 : 0,
          studyMinutes,
          xpEarned,
          subjectsStudied: [subjectSlug]
        }
      });
    }

    // 2. Award XP and calculate general daily streak
    let gamify = await prisma.userGamification.findUnique({
      where: { userId }
    });

    if (!gamify) {
      gamify = await prisma.userGamification.create({
        data: {
          userId,
          level: 1,
          xp: 0,
          streakDays: 0,
          milestonesReached: []
        }
      });
    }

    const nextXP = Math.max(0, gamify.xp + xpEarned);
    const nextLevel = getLevelFromXP(nextXP);
    const leveledUp = nextLevel > gamify.level;

    // Check general streak
    let newStreak = gamify.streakDays;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (gamify.lastActiveDate) {
      const lastActive = new Date(gamify.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const diffTime = now.getTime() - lastActive.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // Reset streak
      }
    } else {
      newStreak = 1; // Initial streak
    }

    await prisma.userGamification.update({
      where: { userId },
      data: {
        xp: nextXP,
        level: nextLevel,
        streakDays: newStreak,
        lastActiveDate: new Date()
      }
    });

    // Notify user on level up
    if (leveledUp) {
      await prisma.notification.create({
        data: {
          userId,
          title: '🎉 Lên cấp độ mới!',
          message: `Chúc mừng bạn đã đạt cấp độ ${nextLevel} trên diễn đàn EduPath!`
        }
      });
    }

    // 3. Update Subject-specific Streak
    const subjectStreak = await prisma.subjectStreak.findUnique({
      where: {
        userId_subject: {
          userId,
          subject: subjectSlug
        }
      }
    });

    if (subjectStreak) {
      let currentSubStreak = subjectStreak.currentStreak;
      if (subjectStreak.lastActive) {
        const lastActiveSub = new Date(subjectStreak.lastActive);
        lastActiveSub.setHours(0, 0, 0, 0);

        const diffTimeSub = now.getTime() - lastActiveSub.getTime();
        const diffDaysSub = Math.floor(diffTimeSub / (1000 * 60 * 60 * 24));

        if (diffDaysSub === 1) {
          currentSubStreak += 1;
        } else if (diffDaysSub > 1) {
          currentSubStreak = 1;
        }
      } else {
        currentSubStreak = 1;
      }

      await prisma.subjectStreak.update({
        where: { id: subjectStreak.id },
        data: {
          currentStreak: currentSubStreak,
          longestStreak: Math.max(subjectStreak.longestStreak, currentSubStreak),
          lastActive: new Date()
        }
      });
    } else {
      await prisma.subjectStreak.create({
        data: {
          userId,
          subject: subjectSlug,
          currentStreak: 1,
          longestStreak: 1,
          lastActive: new Date()
        }
      });
    }

  } catch (err) {
    console.error('[logUserActivity Error]', err);
  }
}

// REST Endpoint: Get rankings based on Grade, Subject, Province
export async function getLeaderboardRankings(req: AuthRequest, res: Response) {
  try {
    const grade = req.query.grade ? Number(req.query.grade) : undefined;
    const subject = req.query.subject ? String(req.query.subject).toLowerCase().trim() : undefined;
    const province = req.query.province ? String(req.query.province).trim() : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const whereClause: any = {};

    if (grade !== undefined || province !== undefined || search !== undefined) {
      whereClause.user = {};
      
      const studentFilters: any = {};
      if (grade !== undefined || province !== undefined) {
        studentFilters.profile = {};
        if (grade !== undefined) {
          studentFilters.profile.grade = grade;
        }
        if (province !== undefined) {
          studentFilters.profile.province = {
            contains: province,
            mode: 'insensitive'
          };
        }
      }

      if (Object.keys(studentFilters).length > 0) {
        whereClause.user.student = studentFilters;
      }

      if (search !== undefined) {
        whereClause.user.fullName = {
          contains: search,
          mode: 'insensitive'
        };
      }
    }

    let ranks;
    let totalCount;

    if (!subject) {
      totalCount = await prisma.userGamification.count({ where: whereClause });
      ranks = await prisma.userGamification.findMany({
        where: whereClause,
        orderBy: { xp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
              role: true,
              student: true,
              subjectStreaks: true
            }
          }
        }
      });
    } else {
      ranks = await prisma.userGamification.findMany({
        where: whereClause,
        orderBy: { xp: 'desc' },
        include: {
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
              role: true,
              student: true,
              subjectStreaks: true
            }
          }
        }
      });
      totalCount = ranks.length;
    }

    // Custom formatting and filtering by subject statistics if requested
    let formatted = ranks.map((r) => {
      const student = r.user.student;
      const subStreaks = r.user.subjectStreaks || [];
      const currentSubStreak = subject
        ? subStreaks.find((s) => s.subject === subject)?.currentStreak || 0
        : 0;

      return {
        userId: r.userId,
        name: r.user.fullName,
        avatar: r.user.avatarUrl || '',
        role: r.user.role,
        level: r.level,
        xp: r.xp,
        streak: r.streakDays,
        subjectStreak: currentSubStreak,
        grade: student?.grade || null,
        province: student?.province || 'Chưa cập nhật'
      };
    });

    // If a subject is selected, rank them primarily by subject streak, secondarily by total XP
    if (subject) {
      formatted.sort((a, b) => {
        if (b.subjectStreak !== a.subjectStreak) {
          return b.subjectStreak - a.subjectStreak;
        }
        return b.xp - a.xp;
      });
    }

    // Apply pagination
    const paginated = (subject ? formatted.slice(skip, skip + limit) : formatted).map((item, idx) => ({
      rank: skip + idx + 1,
      ...item
    }));

    return res.status(200).json({
      success: true,
      data: {
        rankings: paginated,
        pagination: {
          page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount
        }
      }
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// REST Endpoint: Get 365-day activity contributions for a user profile
export async function getActivityHeatmap(req: AuthRequest, res: Response) {
  try {
    const userId = Number(req.params.id) || req.user?.id;
    if (!userId) return res.status(400).json({ success: false, error: 'Thiếu mã định danh học viên!' });

    const year = Number(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    const contributionMap: Record<string, any> = {};

    contributions.forEach((c) => {
      const dateStr = c.date.toISOString().split('T')[0];
      const totalActivities = c.exerciseCount + c.examsCompleted + c.lessonsCompleted;

      // Map level 0 to 4 based on density
      let level = 0;
      if (totalActivities > 10) level = 4;
      else if (totalActivities >= 6) level = 3;
      else if (totalActivities >= 3) level = 2;
      else if (totalActivities >= 1) level = 1;

      contributionMap[dateStr] = {
        level,
        exerciseCount: c.exerciseCount,
        examsCompleted: c.examsCompleted,
        lessonsCompleted: c.lessonsCompleted,
        studyMinutes: c.studyMinutes,
        xpEarned: c.xpEarned,
        subjects: c.subjectsStudied
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        year,
        totalContributions: contributions.reduce((sum, c) => sum + c.exerciseCount + c.examsCompleted + c.lessonsCompleted, 0),
        contributions: contributionMap
      }
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Helper to award general XP to UserGamification
async function awardGamificationXP(userId: number, xpEarned: number) {
  let gamify = await prisma.userGamification.findUnique({
    where: { userId }
  });

  if (!gamify) {
    gamify = await prisma.userGamification.create({
      data: {
        userId,
        level: 1,
        xp: 0,
        streakDays: 0,
        milestonesReached: []
      }
    });
  }

  const nextXP = Math.max(0, gamify.xp + xpEarned);
  const nextLevel = getLevelFromXP(nextXP);
  const leveledUp = nextLevel > gamify.level;

  await prisma.userGamification.update({
    where: { userId },
    data: {
      xp: nextXP,
      level: nextLevel,
      lastActiveDate: new Date()
    }
  });

  if (leveledUp) {
    await prisma.notification.create({
      data: {
        userId,
        title: '🎉 Lên cấp độ mới!',
        message: `Chúc mừng bạn đã đạt cấp độ ${nextLevel} trên diễn đàn EduPath!`
      }
    });
  }
}

// Helper to update general learning streak
async function updateGeneralStreak(userId: number): Promise<number> {
  let gamify = await prisma.userGamification.findUnique({
    where: { userId }
  });

  if (!gamify) {
    gamify = await prisma.userGamification.create({
      data: {
        userId,
        level: 1,
        xp: 0,
        streakDays: 0,
        milestonesReached: []
      }
    });
  }

  let newStreak = gamify.streakDays;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (gamify.lastActiveDate) {
    const lastActive = new Date(gamify.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // Reset streak
    }
  } else {
    newStreak = 1; // Initial streak
  }

  await prisma.userGamification.update({
    where: { userId },
    data: {
      streakDays: newStreak,
      lastActiveDate: new Date()
    }
  });

  return newStreak;
}

// Helper to award effort points from forum activities
export async function awardForumEffortPoints(userId: number, points: number) {
  try {
    await prisma.userEffort.upsert({
      where: { userId },
      update: {
        forumPoints: { increment: points },
        score: { increment: points }
      },
      create: {
        userId,
        forumPoints: points,
        studyPoints: 0,
        score: points
      }
    });
  } catch (err) {
    console.error('[awardForumEffortPoints Error]', err);
  }
}

// Helper to award effort points from study activities
export async function awardStudyEffortPoints(userId: number, points: number) {
  try {
    await prisma.userEffort.upsert({
      where: { userId },
      update: {
        studyPoints: { increment: points },
        score: { increment: points }
      },
      create: {
        userId,
        forumPoints: 0,
        studyPoints: points,
        score: points
      }
    });
  } catch (err) {
    console.error('[awardStudyEffortPoints Error]', err);
  }
}

// REST Endpoint: Record daily attendance
export async function logAttendanceInternal(userId: number, activity: string) {
  const validActivities = ['LESSON', 'TEST', 'MINDMAP', 'FLASHCARD'];
  if (!validActivities.includes(activity)) return { streakAwarded: false, activityAwarded: false, streakDays: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Check if user has attended AT ALL today
  const existingToday = await prisma.learningAttendance.findFirst({
    where: { userId, date: today }
  });

  let streakAwarded = false;
  let streakDays = 0;

  if (!existingToday) {
    // First learning activity of today!
    // Award daily streak effort points + XP + update streak days
    await awardStudyEffortPoints(userId, 30);
    await awardGamificationXP(userId, 15);
    streakDays = await updateGeneralStreak(userId);
    streakAwarded = true;
  } else {
    const gamify = await prisma.userGamification.findUnique({
      where: { userId }
    });
    streakDays = gamify?.streakDays || 0;
  }

  // 2. Check if they have done THIS specific activity today
  const existingSpecific = await prisma.learningAttendance.findUnique({
    where: {
      userId_date_activity: {
        userId,
        date: today,
        activity
      }
    }
  });

  let activityAwarded = false;
  if (!existingSpecific) {
    await prisma.learningAttendance.create({
      data: { userId, date: today, activity }
    });

    // Award activity-specific points and XP
    let xp = 0;
    let studyPoints = 0;
    if (activity === 'LESSON') {
      xp = 20;
      studyPoints = 20;
    } else if (activity === 'TEST') {
      xp = 50;
      studyPoints = 40;
    } else if (activity === 'MINDMAP') {
      xp = 10;
      studyPoints = 15;
    } else if (activity === 'FLASHCARD') {
      xp = 10;
      studyPoints = 15;
    }

    await awardStudyEffortPoints(userId, studyPoints);
    await awardGamificationXP(userId, xp);
    activityAwarded = true;
  }

  return {
    streakAwarded,
    activityAwarded,
    streakDays
  };
}

// REST Endpoint: Record daily attendance
export async function recordAttendance(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa đăng nhập!' });

  const { activity } = req.body;
  if (!activity) {
    return res.status(400).json({ success: false, error: 'Hoạt động không hợp lệ!' });
  }

  try {
    const result = await logAttendanceInternal(userId, activity);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// REST Endpoint: Get attendance history within a date range
export async function getAttendanceHistory(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Chưa đăng nhập!' });

  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'Thiếu tham số khoảng thời gian!' });
  }

  try {
    const start = new Date(String(startDate));
    const end = new Date(String(endDate));

    const attendances = await prisma.learningAttendance.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end
        }
      },
      orderBy: { date: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: attendances
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Simple in-memory cache for Leaderboards to avoid DB load on public home page loads
interface CacheEntry {
  data: any;
  timestamp: number;
}

const leaderboardCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache duration

function getCachedData(key: string): any | null {
  const cached = leaderboardCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  leaderboardCache[key] = {
    data,
    timestamp: Date.now()
  };
}

// REST Endpoint: Get top 5 efforts leaderboard
export async function getEffortLeaderboard(req: AuthRequest, res: Response) {
  try {
    const cacheKey = 'effort_leaderboard';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    const efforts = await prisma.userEffort.findMany({
      orderBy: { score: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    setCachedData(cacheKey, efforts);

    return res.status(200).json({
      success: true,
      data: efforts
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// REST Endpoint: Get top 5 highest scores in practice tests per subject
export async function getHighestScoreLeaderboard(req: AuthRequest, res: Response) {
  const subject = req.query.subject ? String(req.query.subject).toLowerCase().trim() : 'toán';
  try {
    const cacheKey = `highest_score_leaderboard_${subject}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    // 1. Group by studentId to get the highest score for each student in the selected subject
    const topScores = await prisma.testAttempt.groupBy({
      by: ['studentId'],
      where: {
        status: 'SUBMITTED',
        exam: {
          subject: {
            contains: subject,
            mode: 'insensitive'
          }
        }
      },
      _max: {
        score: true
      },
      orderBy: {
        _max: {
          score: 'desc'
        }
      },
      take: 5
    });

    const distinctAttempts = [];
    for (const item of topScores) {
      const bestAttempt = await prisma.testAttempt.findFirst({
        where: {
          studentId: item.studentId,
          score: item._max.score || 0,
          status: 'SUBMITTED',
          exam: {
            subject: {
              contains: subject,
              mode: 'insensitive'
            }
          }
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  fullName: true,
                  avatarUrl: true
                }
              }
            }
          },
          exam: {
            select: {
              title: true,
              subject: true
            }
          }
        }
      });
      
      if (bestAttempt) {
        distinctAttempts.push({
          userId: bestAttempt.studentId,
          name: bestAttempt.student.user.fullName,
          avatar: bestAttempt.student.user.avatarUrl,
          score: bestAttempt.score,
          examTitle: bestAttempt.exam.title,
          subject: bestAttempt.exam.subject
        });
      }
    }

    setCachedData(cacheKey, distinctAttempts);

    return res.status(200).json({
      success: true,
      data: distinctAttempts
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

