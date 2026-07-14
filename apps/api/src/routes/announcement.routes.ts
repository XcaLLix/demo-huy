import { Router } from 'express';
import { authenticateJWT, requireRole, optionalAuthenticateJWT } from '../middleware/auth.js';
import {
  getAnnouncements,
  getActiveAnnouncement,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  updateAnnouncementStatus
} from '../controllers/announcement.js';

const router = Router();

// Public / Guest / User popup fetch
router.get('/announcements/active', optionalAuthenticateJWT, getActiveAnnouncement);

// Admin popup CRUD operations
router.get('/admin/announcements', authenticateJWT, requireRole(['ADMIN']), getAnnouncements);
router.get('/admin/announcements/:id', authenticateJWT, requireRole(['ADMIN']), getAnnouncementById);
router.post('/admin/announcements', authenticateJWT, requireRole(['ADMIN']), createAnnouncement);
router.put('/admin/announcements/:id', authenticateJWT, requireRole(['ADMIN']), updateAnnouncement);
router.delete('/admin/announcements/:id', authenticateJWT, requireRole(['ADMIN']), deleteAnnouncement);
router.patch('/admin/announcements/:id/status', authenticateJWT, requireRole(['ADMIN']), updateAnnouncementStatus);

export default router;
