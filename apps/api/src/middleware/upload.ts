import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { SystemSettingService } from '../services/systemSetting.service.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Disk Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

// Create Multer instance
export const multerUpload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB Max Capability
  }
});

// Magic byte validator
export function validateMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // PDF: %PDF (25 50 44 46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return true;
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    // JPG/JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return true;
    }
    // ZIP / DOCX / PPTX: PK.. (50 4B 03 04)
    if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return true;
    }
    // MP4: ftyp (66 74 79 70) starting at offset 4
    if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

// Express Middleware to wrap upload + magic byte validation
export function uploadValidation(req: Request, res: Response, next: NextFunction) {
  multerUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Dung lượng tệp tải lên vượt quá giới hạn tối đa 500MB!' });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy tệp tải lên!' });
    }

    // Kiểm tra dung lượng tệp tải lên động
    const maxMb = SystemSettingService.getNumber('MAX_UPLOAD_SIZE_MB') || 50;
    const maxBytes = maxMb * 1024 * 1024;
    if (req.file.size > maxBytes) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {}
      return res.status(400).json({ 
        success: false, 
        error: `Dung lượng tệp tải lên vượt quá giới hạn cấu hình của hệ thống (Tối đa ${maxMb}MB)!` 
      });
    }

    // Validate magic bytes
    const isValid = validateMagicBytes(req.file.path);
    if (!isValid) {
      // Clean up invalid file
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {}
      return res.status(400).json({ success: false, error: 'Định dạng tệp không hợp lệ hoặc nội dung tệp đã bị giả mạo!' });
    }

    next();
  });
}
