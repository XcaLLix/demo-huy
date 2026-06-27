import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.service.js';
import { GoogleDriveService } from './googleDrive.service.js';

export class GoogleSheetService {
  private static getSheetsClient() {
    const auth = GoogleAuthService.authenticate();
    return google.sheets({ version: 'v4', auth });
  }

  /**
   * getOrCreateSpreadsheetForMonth: Lấy hoặc tạo bảng tính của tháng
   * Tên bảng tính có định dạng: EduPath Logs - YYYY-MM
   */
  public static async getOrCreateSpreadsheetForMonth(monthStr: string): Promise<string> {
    const name = `EduPath Logs - ${monthStr}`;
    let spreadsheetId = await GoogleDriveService.findSpreadsheetByName(name);
    
    if (!spreadsheetId) {
      spreadsheetId = await GoogleDriveService.createSpreadsheetInFolder(name);
    }
    
    return spreadsheetId;
  }

  /**
   * createSheetIfNotExists: Tạo tab ngày trong spreadsheet chỉ định nếu chưa tồn tại
   */
  public static async createSheetIfNotExists(spreadsheetId: string, date: string): Promise<void> {
    const sheets = this.getSheetsClient();
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = res.data.sheets || [];
    const targetSheet = existingSheets.find(s => s.properties?.title === date);

    if (!targetSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: date
                }
              }
            }
          ]
        }
      });
      console.log(`[GoogleSheet] Created tab '${date}' in spreadsheet: ${spreadsheetId}`);
      await this.ensureHeader(spreadsheetId, date);
    } else {
      await this.ensureHeader(spreadsheetId, date);
    }
  }

  /**
   * ensureHeader: Ghi tiêu đề cột nếu tab trống
   */
  public static async ensureHeader(spreadsheetId: string, sheetName: string): Promise<void> {
    const sheets = this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:K1`
    });

    const rows = res.data.values;
    const headers = [
      'Time', 'Type', 'Module', 'Action', 'User', 'IP', 'Browser', 'Operating System', 'Device', 'Level', 'Description'
    ];

    if (!rows || rows.length === 0 || rows[0].length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers]
        }
      });
      console.log(`[GoogleSheet] Wrote header to tab '${sheetName}' in spreadsheet: ${spreadsheetId}`);
    }
  }

  /**
   * appendLogsToSpreadsheet: Nạp thêm logs vào tab ngày của spreadsheet tương ứng
   */
  public static async appendLogsToSpreadsheet(spreadsheetId: string, date: string, logs: any[]): Promise<void> {
    if (logs.length === 0) return;

    // Đảm bảo tab ngày đã tồn tại và có header
    await this.createSheetIfNotExists(spreadsheetId, date);

    const sheets = this.getSheetsClient();
    const values = logs.map(log => {
      const dateObj = new Date(log.createdAt);
      const timeStr = dateObj.toTimeString().split(' ')[0];
      return [
        timeStr,
        log.type,
        log.module,
        log.action,
        log.user?.email || '',
        log.ipAddress || '',
        log.browser || '',
        log.operatingSystem || '',
        log.device || '',
        log.level,
        log.description
      ];
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${date}!A:K`,
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });

    console.log(`[GoogleSheet] Appended ${logs.length} logs to tab '${date}' in spreadsheet: ${spreadsheetId}`);
  }
}
