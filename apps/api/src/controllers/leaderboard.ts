import type { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service.js';

/**
 * GET /leaderboard/scores
 * Top students sorted by average exam practice test score.
 * Leverages LeaderboardService database aggregation and SWR cache.
 */
export async function getScoreLeaderboard(req: Request, res: Response) {
  const subjectGroup = req.query.subjectGroup ? String(req.query.subjectGroup).trim() : undefined;

  try {
    const startTime = Date.now();
    const result = await LeaderboardService.getScoreLeaderboard(subjectGroup);
    
    // Log performance metrics
    const duration = Date.now() - startTime;
    console.log(`[LeaderboardController] getScoreLeaderboard completed in ${duration}ms (subjectGroup: ${subjectGroup || 'ALL'})`);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('[LeaderboardController] Error fetching score leaderboard:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Không thể tải bảng xếp hạng điểm số! Vui lòng thử lại sau.' 
    });
  }
}

/**
 * GET /leaderboard/streaks
 * Top students sorted by general study streaks (streakDays).
 * Fetches rankings from cache or optimized database index query.
 */
export async function getStreakLeaderboard(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    const result = await LeaderboardService.getStreakLeaderboard();
    
    const duration = Date.now() - startTime;
    console.log(`[LeaderboardController] getStreakLeaderboard completed in ${duration}ms`);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('[LeaderboardController] Error fetching streak leaderboard:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Không thể tải bảng xếp hạng chuỗi ngày học tập! Vui lòng thử lại sau.' 
    });
  }
}

/**
 * GET /leaderboard/courses
 * Top students sorted by number of completed/enrolled courses.
 */
export async function getCourseLeaderboard(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    const result = await LeaderboardService.getCourseLeaderboard();
    
    const duration = Date.now() - startTime;
    console.log(`[LeaderboardController] getCourseLeaderboard completed in ${duration}ms`);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('[LeaderboardController] Error fetching course leaderboard:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Không thể tải bảng xếp hạng khóa học! Vui lòng thử lại sau.' 
    });
  }
}

/**
 * GET /admin/leaderboard/telemetry
 * Retrieve service health status and performance metadata.
 */
export async function getLeaderboardTelemetry(req: Request, res: Response) {
  try {
    const info = LeaderboardService.getTelemetryInfo();
    return res.status(200).json({
      success: true,
      data: info
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
