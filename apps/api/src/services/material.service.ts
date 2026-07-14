import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export class MaterialService {
  /**
   * Đọc số trang của tệp tin PDF
   */
  static async getPdfPageCount(filePath: string): Promise<number | null> {
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`[MaterialService] File not found at: ${filePath}`);
        return null;
      }
      const dataBuffer = fs.readFileSync(filePath);
      const parsed = await pdf(dataBuffer);
      return parsed.numpages || null;
    } catch (err) {
      console.error('[MaterialService] Failed to read PDF page count:', err);
      return null;
    }
  }

  /**
   * Đồng bộ hóa tài liệu từ bảng TeacherMaterial sang bảng công khai DocumentResource
   */
  static async syncMaterialToPublic(materialId: number): Promise<void> {
    try {
      const material = await prisma.teacherMaterial.findUnique({
        where: { id: materialId }
      });

      if (!material) {
        console.warn(`[MaterialService] Material ${materialId} not found to sync.`);
        return;
      }

      if (material.status === 'APPROVED') {
        const existing = await prisma.documentResource.findFirst({
          where: { driveUrl: material.fileUrl }
        });

        const docData = {
          title: material.title,
          description: material.description || null,
          subject: material.subject,
          level: material.grade || '12',
          price: Math.round(material.price || 0),
          isFree: !material.price || material.price === 0,
          isActive: true,
          isDeleted: false,
          previewUrl: material.previewUrl
        };

        if (existing) {
          await prisma.documentResource.update({
            where: { id: existing.id },
            data: docData
          });
          console.log(`[MaterialService] Updated public DocumentResource for material ${material.id}`);
        } else {
          await prisma.documentResource.create({
            data: {
              ...docData,
              driveUrl: material.fileUrl
            }
          });
          console.log(`[MaterialService] Created new public DocumentResource for material ${material.id}`);
        }
      } else if (material.status === 'HIDDEN') {
        // Nếu HIDDEN, ẩn khỏi học sinh (set isActive = false)
        const existing = await prisma.documentResource.findFirst({
          where: { driveUrl: material.fileUrl }
        });
        if (existing) {
          await prisma.documentResource.update({
            where: { id: existing.id },
            data: { isActive: false }
          });
          console.log(`[MaterialService] Hid public DocumentResource for material ${material.id}`);
        }
      } else {
        // Nếu DRAFT, PENDING_REVIEW, REJECTED, xóa cứng khỏi kho tài liệu học sinh
        const deleteRes = await prisma.documentResource.deleteMany({
          where: { driveUrl: material.fileUrl }
        });
        if (deleteRes.count > 0) {
          console.log(`[MaterialService] Deleted public DocumentResource for material ${material.id} due to status: ${material.status}`);
        }
      }
    } catch (err: any) {
      console.error(`[MaterialService] Error syncing material ${materialId}:`, err.message || err);
    }
  }
}
