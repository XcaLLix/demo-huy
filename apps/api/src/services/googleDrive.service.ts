import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.service.js';

export class GoogleDriveService {
  private static getDriveClient() {
    const auth = GoogleAuthService.authenticate();
    return google.drive({ version: 'v3', auth });
  }

  private static getFolderId(): string {
    const id = process.env.GOOGLE_LOG_FOLDER_ID;
    if (!id) {
      throw new Error('GOOGLE_LOG_FOLDER_ID is not configured in environment variables.');
    }
    return id;
  }

  /**
   * findSpreadsheetByName: Tìm file Spreadsheet theo tên nằm trong Folder ID chỉ định
   * Trả về spreadsheetId nếu có, ngược lại trả về null.
   */
  public static async findSpreadsheetByName(name: string): Promise<string | null> {
    const drive = this.getDriveClient();
    const folderId = this.getFolderId();

    const query = `name = '${name}' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = res.data.files || [];
    if (files.length > 0) {
      return files[0].id || null;
    }
    return null;
  }

  /**
   * createSpreadsheetInFolder: Tạo mới file Spreadsheet và đưa vào Folder ID chỉ định
   * Trả về spreadsheetId của file vừa tạo.
   */
  public static async createSpreadsheetInFolder(name: string): Promise<string> {
    const drive = this.getDriveClient();
    const folderId = this.getFolderId();

    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [folderId]
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
      supportsAllDrives: true,
    });

    const spreadsheetId = file.data.id;
    if (!spreadsheetId) {
      throw new Error(`Failed to create spreadsheet '${name}' in Google Drive folder: ${folderId}`);
    }

    return spreadsheetId;
  }
}
