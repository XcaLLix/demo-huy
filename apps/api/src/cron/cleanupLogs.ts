import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';

export function startLogCleanupJob() {
  const cronExpr = '0 2 * * *'; // Run daily at 02:00 AM

  console.log(`[Cron] Initializing Database Log Cleanup job with schedule: "${cronExpr}"`);

  cron.schedule(cronExpr, async () => {
    console.log('[Cron] Starting Database Log Cleanup...');
    try {
      const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '7', 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      console.log(`[Cron] Deleting synced logs older than ${retentionDays} days (cutoff: ${cutoffDate.toISOString()})...`);

      const result = await prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          syncedToGoogle: true
        }
      });

      console.log(`[Cron] Database Cleanup completed. Deleted ${result.count} synced system logs.`);
    } catch (err: any) {
      console.error('[Cron Error] Failed to execute database log cleanup:', err.message || err);
    }
  });
}
