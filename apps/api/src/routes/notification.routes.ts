import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  adminSendNotification,
  adminGetSentNotifications,
  adminGetTemplates,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate
} from '../controllers/notification.js';

const router = Router();

// Student/Teacher Notification Routes
router.get('/', authenticateJWT, getNotifications);
router.get('/unread-count', authenticateJWT, getUnreadCount);
router.put('/:id/read', authenticateJWT, markAsRead);
router.put('/read-all', authenticateJWT, markAllAsRead);
router.delete('/all-read', authenticateJWT, deleteAllRead);
router.delete('/:id', authenticateJWT, deleteNotification);

// Admin Notification Management Routes
router.post('/admin/send', authenticateJWT, requireRole(['ADMIN']), adminSendNotification);
router.get('/admin/history', authenticateJWT, requireRole(['ADMIN']), adminGetSentNotifications);
router.get('/admin/templates', authenticateJWT, requireRole(['ADMIN']), adminGetTemplates);
router.post('/admin/templates', authenticateJWT, requireRole(['ADMIN']), adminCreateTemplate);
router.put('/admin/templates/:id', authenticateJWT, requireRole(['ADMIN']), adminUpdateTemplate);
router.delete('/admin/templates/:id', authenticateJWT, requireRole(['ADMIN']), adminDeleteTemplate);

export default router;
