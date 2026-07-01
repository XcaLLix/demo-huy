import cron from 'node-cron';
import { LeaderboardService } from '../services/leaderboard.service.js';

/**
 * Initializes and schedules the background Leaderboard Snapshot warming job.
 * Runs every 30 minutes to pre-calculate high-cost leaderboards.
 */
export function startLeaderboardSnapshotJob() {
  // Run every 30 minutes
  const cronExpr = '*/30 * * * *';

  console.log(`[Cron] Initializing Leaderboard Snapshot Warming job with schedule: "${cronExpr}"`);

  // Run immediately on startup to warm up cache
  LeaderboardService.warmLeaderboardSnapshots()
    .then(() => console.log('[Cron] Initial cache pre-calculated on server startup.'))
    .catch(err => console.error('[Cron] Initial cache pre-calculation error:', err.message));

  cron.schedule(cronExpr, async () => {
    console.log('[Cron] Starting Leaderboard Snapshot calculations...');
    try {
      await LeaderboardService.warmLeaderboardSnapshots();
      console.log('[Cron] Leaderboard Snapshot calculations completed successfully.');
    } catch (err: any) {
      console.error('[Cron Error] Failed to update leaderboard snapshots:', err.message || err);
    }
  });
}
