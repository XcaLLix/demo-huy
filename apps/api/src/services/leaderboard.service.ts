import { prisma } from '../lib/prisma.js';
import { getLevelFromXP } from '../controllers/gamification.js';

/**
 * Interface representing standard cache entries.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

/**
 * Interface representing filters for leaderboard rankings.
 */
export interface LeaderboardFilters {
  grade?: number;
  subject?: string;
  province?: string;
  search?: string;
  sortBy?: 'streak' | 'xp' | 'testScore';
  page: number;
  limit: number;
}

/**
 * Leaderboard performance statistics.
 */
interface LeaderboardStats {
  hits: number;
  misses: number;
  staleHits: number;
  backgroundRefreshes: number;
  totalRequests: number;
  averageQueryTimeMs: number;
}

/**
 * LeaderboardService - A high-performance leaderboard processing service
 * featuring granular SWR caching, request coalescing (single-flight), 
 * database aggregation, and automated background snapshot calculation.
 */
export class LeaderboardService {
  private static cache: Map<string, CacheEntry<any>> = new Map();
  private static rebuildingPromises: Map<string, Promise<any>> = new Map();
  
  // SWR Configuration
  private static readonly FRESH_TTL_MS = 15 * 1000;    // 15 seconds fresh duration
  private static readonly STALE_TTL_MS = 10 * 60 * 1000; // 10 minutes stale duration
  
  // Telemetry metrics
  private static stats: LeaderboardStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    backgroundRefreshes: 0,
    totalRequests: 0,
    averageQueryTimeMs: 0
  };
  private static queryTimes: number[] = [];

  /**
   * Generates a unique cache key based on the provided prefix and filters/arguments.
   */
  private static generateCacheKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${args.map(arg => {
      if (arg === undefined || arg === null) return '';
      if (typeof arg === 'object') return JSON.stringify(arg);
      return String(arg).toLowerCase().trim();
    }).join('_')}`;
  }

  /**
   * Tracks telemetry for query durations.
   */
  private static trackQueryTime(duration: number) {
    this.queryTimes.push(duration);
    if (this.queryTimes.length > 100) {
      this.queryTimes.shift(); // Keep moving average of last 100 queries
    }
    const sum = this.queryTimes.reduce((a, b) => a + b, 0);
    this.stats.averageQueryTimeMs = Math.round(sum / this.queryTimes.length);
  }

  /**
   * Core Stale-While-Revalidate execution engine.
   * Ensures instant reads by utilizing stale data while initiating background updates,
   * and coalesces concurrent identical requests to save DB resources.
   */
  private static async getOrResolve<T>(
    key: string,
    resolver: () => Promise<T>,
    customFreshTtl?: number
  ): Promise<T> {
    const now = Date.now();
    this.stats.totalRequests++;
    
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    const freshTtl = customFreshTtl ?? this.FRESH_TTL_MS;

    if (cached) {
      const age = now - cached.timestamp;
      
      // Scenario 1: Cache is fully fresh
      if (age < freshTtl && !cached.isStale) {
        this.stats.hits++;
        return cached.data;
      }
      
      // Scenario 2: Cache is stale but within stale window
      if (age < this.STALE_TTL_MS) {
        this.stats.staleHits++;
        
        // Trigger background refresh in a non-blocking promise
        this.triggerBackgroundRefresh(key, resolver);
        
        return cached.data;
      }
    }

    // Scenario 3: Cache miss or completely expired
    this.stats.misses++;
    return this.resolveBlocking(key, resolver);
  }

  /**
   * Coalesces concurrent calls and handles database fetching blocking.
   */
  private static async resolveBlocking<T>(key: string, resolver: () => Promise<T>): Promise<T> {
    // Check if an existing query is currently rebuilding this key
    let promise = this.rebuildingPromises.get(key) as Promise<T> | undefined;
    
    if (!promise) {
      const start = Date.now();
      promise = resolver()
        .then(data => {
          this.trackQueryTime(Date.now() - start);
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            isStale: false
          });
          this.rebuildingPromises.delete(key);
          return data;
        })
        .catch(err => {
          this.rebuildingPromises.delete(key);
          // If query fails but we have stale cache, return it as a fallback (Circuit Breaker pattern)
          const fallback = this.cache.get(key);
          if (fallback) {
            console.warn(`[LeaderboardService] Resolution failed for ${key}, falling back to stale cache. Error:`, err.message);
            return fallback.data;
          }
          throw err;
        });
      
      this.rebuildingPromises.set(key, promise);
    }
    
    return promise;
  }

  /**
   * Refreshes the cache entry in the background without blocking the client.
   */
  private static triggerBackgroundRefresh<T>(key: string, resolver: () => Promise<T>) {
    if (this.rebuildingPromises.has(key)) {
      return; // Already refreshing
    }

    this.stats.backgroundRefreshes++;
    const start = Date.now();
    
    const promise = resolver()
      .then(data => {
        this.trackQueryTime(Date.now() - start);
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          isStale: false
        });
        this.rebuildingPromises.delete(key);
      })
      .catch(err => {
        this.rebuildingPromises.delete(key);
        console.error(`[LeaderboardService] Background refresh failed for ${key}:`, err.message);
      });
      
    this.rebuildingPromises.set(key, promise);
  }

  /**
   * Marks specific cache keys or all cache entries as stale, triggering SWR updates.
   */
  public static invalidateCache(pattern?: string) {
    if (!pattern) {
      console.log('[LeaderboardService] Invalidating entire leaderboard cache...');
      for (const [key, entry] of this.cache.entries()) {
        entry.isStale = true;
      }
    } else {
      console.log(`[LeaderboardService] Invalidating cache keys matching pattern: ${pattern}`);
      const lowerPattern = pattern.toLowerCase();
      for (const [key, entry] of this.cache.entries()) {
        if (key.toLowerCase().includes(lowerPattern)) {
          entry.isStale = true;
        }
      }
    }
  }

  /**
   * Returns current service telemetry.
   */
  public static getTelemetryInfo() {
    return {
      stats: { ...this.stats },
      cacheSize: this.cache.size,
      activeRebuilds: this.rebuildingPromises.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // ═════════════════════════════════════════════════════════
  // ENDPOINT METRICS AND OPTIMIZED DB RESOLVERS
  // ═════════════════════════════════════════════════════════

  /**
   * Retrieve score leaderboard using database aggregations (Prisma groupBy).
   * Reduces memory load and handles thousands of students natively in DB.
   */
  public static async getScoreLeaderboard(subjectGroup?: string) {
    const key = this.generateCacheKey('scores', subjectGroup || 'ALL');
    
    return this.getOrResolve(key, async () => {
      const whereClause: any = {
        status: 'SUBMITTED'
      };

      if (subjectGroup && subjectGroup !== 'ALL') {
        whereClause.student = {
          subjectGroup: subjectGroup
        };
      }

      // Group attempts by student ID and average their scores in PostgreSQL
      const aggregates = await prisma.testAttempt.groupBy({
        by: ['studentId'],
        where: whereClause,
        _avg: {
          score: true
        },
        _max: {
          score: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _avg: {
            score: 'desc'
          }
        },
        take: 20
      });

      if (aggregates.length === 0) {
        return {
          type: 'scores',
          entries: [],
          updatedAt: new Date().toISOString()
        };
      }

      // Fetch student details for the top 20 aggregated results in 1 batch query
      const studentIds = aggregates.map(a => a.studentId);
      const students = await prisma.student.findMany({
        where: {
          userId: { in: studentIds }
        },
        include: {
          user: {
            select: {
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });

      // Construct a fast lookup map for students
      const studentMap = new Map(students.map(s => [s.userId, s]));

      // Format top list maintaining original database order
      const entries = aggregates.map((item, index) => {
        const student = studentMap.get(item.studentId);
        const fullName = student?.user.fullName || 'Học sinh EduPath';
        const avatarUrl = student?.user.avatarUrl || null;
        const subGroup = student?.subjectGroup || 'A01';
        const avgScore = item._avg.score || 0;
        const bestScore = item._max.score || 0;

        return {
          rank: index + 1,
          userId: item.studentId,
          fullName,
          avatarUrl,
          subjectGroup: subGroup,
          avgScore: Math.round(avgScore * 10) / 10,
          bestScore: Math.round(bestScore * 10) / 10,
          totalAttempts: item._count.id,
          badge: this.getScoreBadgeTitle(avgScore, subGroup)
        };
      });

      return {
        type: 'scores',
        entries,
        updatedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Retrieve streaks leaderboard using optimized database index ordering.
   */
  public static async getStreakLeaderboard() {
    const key = 'streaks:main';
    
    return this.getOrResolve(key, async () => {
      const streaks = await prisma.userGamification.findMany({
        where: { streakDays: { gt: 0 } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              student: {
                select: {
                  subjectGroup: true
                }
              }
            }
          }
        },
        orderBy: { streakDays: 'desc' },
        take: 20
      });

      const entries = streaks.map((s, index) => {
        const student = s.user.student;
        const streak = s.streakDays;
        return {
          rank: index + 1,
          userId: s.userId,
          fullName: s.user.fullName,
          avatarUrl: s.user.avatarUrl,
          subjectGroup: student?.subjectGroup || 'A01',
          currentStreak: streak,
          longestStreak: streak,
          lastActiveDate: s.updatedAt.toISOString(),
          badge: this.getStreakBadgeTitle(streak)
        };
      });

      return {
        type: 'streaks',
        entries,
        updatedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Retrieve course completion leaderboard.
   * Leverages Prisma relation counts sorting, pushing execution entirely to DB.
   */
  public static async getCourseLeaderboard() {
    const key = 'courses:main';
    
    return this.getOrResolve(key, async () => {
      // Find students ordered by enrollment counts
      const students = await prisma.student.findMany({
        where: { enrollments: { some: {} } },
        include: {
          user: {
            select: {
              fullName: true,
              avatarUrl: true
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
        },
        take: 20
      });

      const entries = students.map((student, index) => {
        const courseCount = student._count.enrollments;
        return {
          rank: index + 1,
          userId: student.userId,
          fullName: student.user.fullName,
          avatarUrl: student.user.avatarUrl,
          subjectGroup: student.subjectGroup,
          courseCount,
          badge: this.getCourseBadgeTitle(courseCount)
        };
      });

      return {
        type: 'courses',
        entries,
        updatedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Retrieve forum leaderboard based on total gamification XP.
   */
  public static async getForumLeaderboard() {
    const key = 'forum:main';
    
    return this.getOrResolve(key, async () => {
      const ranks = await prisma.userGamification.findMany({
        orderBy: { xp: 'desc' },
        take: 20,
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

      return ranks.map((r, index) => ({
        rank: index + 1,
        userId: r.userId,
        name: r.user.fullName,
        avatar: r.user.avatarUrl || 'HS',
        role: r.user.role,
        level: r.level,
        xp: r.xp,
        streak: r.streakDays
      }));
    });
  }

  /**
   * Retrieve effort point leaderboard using optimized caching.
   */
  public static async getEffortLeaderboard() {
    const key = 'effort:main';
    
    return this.getOrResolve(key, async () => {
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
      return efforts;
    });
  }

  /**
   * Retrieve highest score in practice tests.
   * Optimizes N+1 query pattern by resolving max attempts in single batch query.
   */
  public static async getHighestScoreLeaderboard(subject: string) {
    const cleanSubject = subject.toLowerCase().trim();
    const key = this.generateCacheKey('highest_scores', cleanSubject);
    
    return this.getOrResolve(key, async () => {
      // 1. Group by studentId to find the maximum score for each student in the selected subject
      const topScores = await prisma.testAttempt.groupBy({
        by: ['studentId'],
        where: {
          status: 'SUBMITTED',
          exam: {
            subject: {
              contains: cleanSubject,
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

      if (topScores.length === 0) {
        return [];
      }

      // 2. Fetch details for all 5 best attempts in a single batched Prisma query
      const bestAttempts = await prisma.testAttempt.findMany({
        where: {
          OR: topScores.map(item => ({
            studentId: item.studentId,
            score: item._max.score || 0,
            status: 'SUBMITTED',
            exam: {
              subject: {
                contains: cleanSubject,
                mode: 'insensitive'
              }
            }
          }))
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

      // Construct distinct mapped attempts, deduplicating studentId
      const studentTracker = new Set<number>();
      const distinctAttempts = [];

      for (const attempt of bestAttempts) {
        if (!studentTracker.has(attempt.studentId) && distinctAttempts.length < 5) {
          studentTracker.add(attempt.studentId);
          distinctAttempts.push({
            userId: attempt.studentId,
            name: attempt.student.user.fullName,
            avatar: attempt.student.user.avatarUrl,
            score: attempt.score,
            examTitle: attempt.exam.title,
            subject: attempt.exam.subject
          });
        }
      }

      // Re-sort distinct list descending to maintain order accuracy
      distinctAttempts.sort((a, b) => b.score - a.score);

      return distinctAttempts;
    });
  }

  /**
   * Main paginated and filtered advanced leaderboard.
   * Utilizes database checks first, and falls back to cached SWR calculations.
   */
  public static async getLeaderboardRankings(filters: LeaderboardFilters) {
    const key = this.generateCacheKey('rankings', filters);
    
    return this.getOrResolve(key, async () => {
      const { grade, subject, province, search, sortBy, page, limit } = filters;
      const skip = (page - 1) * limit;

      // ────────────────────────────────────────────────────────
      // OPTIMIZATION: Try to use pre-calculated snapshots if query matches
      // ────────────────────────────────────────────────────────
      if (
        !search &&
        page === 1 &&
        limit <= 100 &&
        sortBy === 'xp' &&
        grade && [10, 11, 12].includes(grade) &&
        !subject &&
        !province
      ) {
        const dimensionKey = `grade_${grade}_xp`;
        try {
          const snapshots = await prisma.leaderboardSnapshot.findMany({
            where: { dimensionKey },
            orderBy: { rank: 'asc' },
            take: limit,
            include: {
              user: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                  role: true,
                  student: {
                    select: {
                      grade: true,
                      province: true
                    }
                  },
                  gamification: {
                    select: {
                      level: true
                    }
                  }
                }
              }
            }
          });

          if (snapshots.length > 0) {
            console.log(`[LeaderboardService] Serving rankings from pre-calculated snapshot for: ${dimensionKey}`);
            const formatted = snapshots.map(s => {
              const student = s.user.student;
              const gamify = s.user.gamification;
              return {
                userId: s.userId,
                name: s.user.fullName,
                avatar: s.user.avatarUrl || '',
                role: s.user.role,
                level: gamify?.level || 1,
                xp: s.xp,
                testScore: s.score,
                streak: s.streakDays,
                subjectStreak: 0,
                grade: student?.grade || null,
                province: student?.province || 'Chưa cập nhật'
              };
            });

            return {
              rankings: formatted.map((item, idx) => ({
                rank: idx + 1,
                ...item
              })),
              pagination: {
                page,
                totalPages: Math.ceil(snapshots.length / limit),
                totalCount: snapshots.length
              }
            };
          }
        } catch (snapErr: any) {
          console.error(`[LeaderboardService] Failed to fetch snapshots for ${dimensionKey}:`, snapErr.message);
        }
      }

      // ────────────────────────────────────────────────────────
      // CASE A: Sorting by 'xp' (Special composite metric)
      // ────────────────────────────────────────────────────────
      if (sortBy === 'xp') {
        const studentWhereClause: any = {};
        if (grade !== undefined) {
          studentWhereClause.grade = grade;
        }
        if (province !== undefined) {
          studentWhereClause.province = {
            contains: province,
            mode: 'insensitive'
          };
        }
        if (search !== undefined) {
          studentWhereClause.user = {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          };
        }

        // Fetch students matching filters along with their test attempts
        const students = await prisma.student.findMany({
          where: studentWhereClause,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                role: true,
                gamification: true,
                subjectStreaks: true
              }
            },
            testAttempts: {
              where: {
                status: 'SUBMITTED',
                ...(subject ? {
                  exam: {
                    subject: {
                      contains: subject,
                      mode: 'insensitive'
                    }
                  }
                } : {})
              },
              select: {
                score: true
              }
            }
          }
        });

        // Formats student metrics
        const formatted = students.map(student => {
          const scores = student.testAttempts.map(a => a.score);
          const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
          const gamify = student.user.gamification;
          const subStreaks = student.user.subjectStreaks || [];
          const currentSubStreak = subject
            ? subStreaks.find(s => s.subject === subject.toLowerCase().trim())?.currentStreak || 0
            : 0;

          return {
            userId: student.userId,
            name: student.user.fullName,
            avatar: student.user.avatarUrl || '',
            role: student.user.role,
            level: gamify?.level || 1,
            xp: gamify?.xp || 0,
            testScore: Math.round(maxScore * 10) / 10,
            streak: gamify?.streakDays || 0,
            subjectStreak: currentSubStreak,
            grade: student.grade || null,
            province: student.province || 'Chưa cập nhật'
          };
        });

        // Sort: testScore desc, xp desc, streak desc
        formatted.sort((a, b) => {
          if (b.testScore !== a.testScore) return b.testScore - a.testScore;
          if (b.xp !== a.xp) return b.xp - a.xp;
          return b.streak - a.streak;
        });

        const totalCount = formatted.length;
        const paginated = formatted.slice(skip, skip + limit).map((item, idx) => ({
          rank: skip + idx + 1,
          ...item
        }));

        return {
          rankings: paginated,
          pagination: {
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
          }
        };
      }

      // ────────────────────────────────────────────────────────
      // CASE B: Sorting by 'streak' or 'xp' (gamification table)
      // ────────────────────────────────────────────────────────
      const whereClause: any = {};

      if (grade !== undefined || province !== undefined || search !== undefined) {
        whereClause.user = {};
        const studentFilters: any = {};
        
        if (grade !== undefined) studentFilters.grade = grade;
        if (province !== undefined) {
          studentFilters.province = {
            contains: province,
            mode: 'insensitive'
          };
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
        // Query paginated results directly in database if no subject filter (Maximum DB level speed!)
        totalCount = await prisma.userGamification.count({ where: whereClause });
        ranks = await prisma.userGamification.findMany({
          where: whereClause,
          orderBy: sortBy === 'streak' 
            ? [{ streakDays: 'desc' }, { xp: 'desc' }] 
            : [{ xp: 'desc' }, { streakDays: 'desc' }],
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
        // If subject is selected, streaks must be resolved per subject, requiring full list mapping
        // OPTIMIZATION: Filter database rows by subject relation first to reduce volume
        const cleanSubject = subject.toLowerCase().trim();
        const optimizedWhereClause = {
          ...whereClause,
          user: {
            ...whereClause.user,
            subjectStreaks: {
              some: {
                subject: cleanSubject
              }
            }
          }
        };

        ranks = await prisma.userGamification.findMany({
          where: optimizedWhereClause,
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

      const cleanSubject = subject ? subject.toLowerCase().trim() : undefined;

      // Format results
      let formatted = ranks.map(r => {
        const student = r.user.student;
        const subStreaks = r.user.subjectStreaks || [];
        const currentSubStreak = cleanSubject
          ? subStreaks.find(s => s.subject === cleanSubject)?.currentStreak || 0
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

      // Filter/Sort based on subject streak
      if (cleanSubject) {
        if (sortBy === 'streak') {
          formatted.sort((a, b) => {
            if (b.subjectStreak !== a.subjectStreak) return b.subjectStreak - a.subjectStreak;
            return b.xp - a.xp;
          });
        } else {
          formatted.sort((a, b) => {
            if (b.xp !== a.xp) return b.xp - a.xp;
            return b.subjectStreak - a.subjectStreak;
          });
        }
      }

      const paginated = (subject ? formatted.slice(skip, skip + limit) : formatted).map((item, idx) => ({
        rank: skip + idx + 1,
        ...item
      }));

      return {
        rankings: paginated,
        pagination: {
          page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount
        }
      };
    });
  }

  /**
   * Pre-calculates top leaderboards periodically and stores snapshots in DB.
   * This handles high volume analytics offline and reduces live DB workloads.
   */
  public static async warmLeaderboardSnapshots() {
    console.log('[LeaderboardService] Starting pre-calculated LeaderboardSnapshot warming...');
    const startTime = Date.now();
    
    try {
      // Dimensions to warm up:
      // 1. Grade 10, 11, 12 Main Streaks
      // 2. Main XP Leaderboard
      const grades = [10, 11, 12];
      
      for (const grade of grades) {
        const key = `grade_${grade}_xp`;
        const rankings = await this.getLeaderboardRankings({
          grade,
          sortBy: 'xp',
          page: 1,
          limit: 100
        });

        // Clear existing snapshots for this dimension
        await prisma.leaderboardSnapshot.deleteMany({
          where: { dimensionKey: key }
        });

        // Insert new snapshots
        if (rankings?.rankings?.length > 0) {
          const snapshotData = rankings.rankings.map(item => ({
            dimensionKey: key,
            rank: item.rank,
            userId: item.userId,
            score: (item as any).testScore || 0.0,
            xp: item.xp,
            streakDays: item.streak
          }));

          await prisma.leaderboardSnapshot.createMany({
            data: snapshotData
          });
        }
      }
      
      console.log(`[LeaderboardService] Snapshot warming complete! Total time: ${Date.now() - startTime}ms`);
    } catch (err: any) {
      console.error('[LeaderboardService] Snapshot warming failed:', err.message);
    }
  }

  // ═════════════════════════════════════════════════════════
  // REPUTATION & BADGE TITLE GENERATOR HELPERS
  // ═════════════════════════════════════════════════════════

  private static getScoreBadgeTitle(avgScore: number, subjectGroup: string): string {
    const subjectNames: Record<string, string> = {
      'A01': 'Lý',
      'B00': 'Hóa Học',
      'D01': 'Anh ngữ'
    };
    const subjectLabel = subjectNames[subjectGroup] || subjectGroup;

    if (avgScore >= 9.5) return `Thủ khoa ${subjectLabel}`;
    if (avgScore >= 9.0) return `Thần tốc ${subjectLabel}`;
    if (avgScore >= 8.5) return `Chiến thần ${subjectLabel}`;
    if (avgScore >= 8.0) return `Đệ nhất ${subjectLabel}`;
    if (avgScore >= 7.0) return `Xuất sắc ${subjectLabel}`;
    return `Nỗ lực ${subjectLabel}`;
  }

  private static getStreakBadgeTitle(days: number): string {
    if (days >= 100) return '🏆 Huyền thoại kiên trì';
    if (days >= 60) return '💎 Siêu bền bỉ';
    if (days >= 30) return '🔥 Chiến binh 30 ngày';
    if (days >= 14) return '⚡ Chuỗi ấn tượng';
    if (days >= 7) return '✨ Khởi đầu vững chắc';
    return '🌱 Đang nỗ lực';
  }

  private static getCourseBadgeTitle(count: number): string {
    if (count >= 10) return '🎓 Học giả uyên bác';
    if (count >= 7) return '📚 Mọt sách chăm chỉ';
    if (count >= 5) return '⭐ Học viên tích cực';
    if (count >= 3) return '💪 Chinh phục kiến thức';
    return '🌟 Khám phá tri thức';
  }
}
