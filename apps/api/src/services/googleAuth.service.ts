import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export class GoogleAuthService {
  private static auth: any = null;

  public static authenticate() {
    if (this.auth) {
      return this.auth;
    }

    // Hỗ trợ OAuth2 Refresh Token (cho phép ghi dưới danh nghĩa tài khoản cá nhân có dung lượng lớn)
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
      this.auth = oauth2Client;
      return this.auth;
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not defined.');
    }

    // Resolve path relative to process.cwd() (the apps/api root)
    const resolvedPath = path.resolve(process.cwd(), credentialsPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Credentials file not found at: ${resolvedPath}`);
    }

    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const credentials = JSON.parse(fileContent);

    // Validate service account credentials keys
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Google service account credentials (client_email, private_key) are missing or empty in google-service-account.json');
    }

    this.auth = new google.auth.GoogleAuth({
      keyFile: resolvedPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    return this.auth;
  }
}
