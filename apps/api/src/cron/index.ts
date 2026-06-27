import { startLogSyncJob } from './syncLogs.js';
import { startLogCleanupJob } from './cleanupLogs.js';

export function initCronJobs() {
  console.log('[Cron] Initializing scheduled tasks...');
  try {
    startLogSyncJob();
    startLogCleanupJob();
  } catch (err: any) {
    console.error('[Cron] Failed to initialize background jobs:', err.message || err);
  }
}
