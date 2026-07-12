import { startLogSyncJob } from './syncLogs.js';
import { startLogCleanupJob } from './cleanupLogs.js';
import { startLeaderboardSnapshotJob } from './leaderboardSnapshots.js';
import { startWeeklyPraiseEmailJob } from './weeklyPraiseEmail.js';

export function initCronJobs() {
  console.log('[Cron] Initializing scheduled tasks...');
  try {
    startLogSyncJob();
    startLogCleanupJob();
    startLeaderboardSnapshotJob();
    startWeeklyPraiseEmailJob();
  } catch (err: any) {
    console.error('[Cron] Failed to initialize background jobs:', err.message || err);
  }
}
