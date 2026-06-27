import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { GoogleSheetService } from '../services/googleSheet.service.js';

export function startLogSyncJob() {
  const intervalMinutes = parseInt(process.env.LOG_SYNC_INTERVAL_MINUTES || '5', 10);
  const cronExpr = `*/${intervalMinutes} * * * *`;

  console.log(`[Cron] Initializing System Log Sync job with schedule: "${cronExpr}"`);

  cron.schedule(cronExpr, async () => {
    console.log('[Cron] Starting System Log Sync to Google Drive/Sheets...');
    try {
      // 1. Lấy toàn bộ các log chưa được đồng bộ kèm thông tin user
      const unsyncedLogs = await prisma.systemLog.findMany({
        where: {
          syncedToGoogle: false
        },
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (unsyncedLogs.length === 0) {
        console.log('[Cron] No unsynced logs found.');
        return;
      }

      console.log(`[Cron] Found ${unsyncedLogs.length} unsynced logs.`);

      // 2. Gom nhóm logs theo tháng YYYY-MM và ngày YYYY-MM-DD
      const logsByMonthAndDay: {
        [monthStr: string]: {
          [dayStr: string]: typeof unsyncedLogs
        }
      } = {};

      for (const log of unsyncedLogs) {
        const dateObj = new Date(log.createdAt);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const monthStr = `${year}-${month}`; // YYYY-MM
        const dayStr = `${year}-${month}-${day}`; // YYYY-MM-DD

        if (!logsByMonthAndDay[monthStr]) {
          logsByMonthAndDay[monthStr] = {};
        }
        if (!logsByMonthAndDay[monthStr][dayStr]) {
          logsByMonthAndDay[monthStr][dayStr] = [];
        }
        logsByMonthAndDay[monthStr][dayStr].push(log);
      }

      // 3. Đồng bộ theo từng tháng
      for (const [monthStr, daysData] of Object.entries(logsByMonthAndDay)) {
        try {
          // Lấy hoặc tạo bảng tính cho tháng tương ứng (nằm trong thư mục cấu hình)
          const spreadsheetId = await GoogleSheetService.getOrCreateSpreadsheetForMonth(monthStr);

          // Đồng bộ từng ngày vào bảng tính đó
          for (const [dayStr, logs] of Object.entries(daysData)) {
            try {
              console.log(`[Cron] Syncing ${logs.length} logs to spreadsheet '${monthStr}', tab '${dayStr}'...`);
              await GoogleSheetService.appendLogsToSpreadsheet(spreadsheetId, dayStr, logs);

              // 4. Đánh dấu đồng bộ thành công trong DB
              const logIds = logs.map(l => l.id);
              await prisma.systemLog.updateMany({
                where: {
                  id: { in: logIds }
                },
                data: {
                  syncedToGoogle: true,
                  syncedAt: new Date()
                }
              });
              console.log(`[Cron] Successfully synced and marked ${logs.length} logs for date: ${dayStr}`);
            } catch (dayErr: any) {
              console.error(`[Cron Error] Failed to sync logs for date ${dayStr} in spreadsheet ${monthStr}:`, dayErr.message || dayErr);
            }
          }
        } catch (monthErr: any) {
          console.error(`[Cron Error] Failed to process spreadsheet for month ${monthStr}:`, monthErr.message || monthErr);
        }
      }
    } catch (err: any) {
      console.error('[Cron Error] Unexpected error during System Log Sync execution:', err.message || err);
    }
  });
}
