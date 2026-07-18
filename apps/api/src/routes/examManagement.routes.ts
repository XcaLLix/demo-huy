import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { uploadValidation } from '../middleware/upload.js';
import {
  validateCreateExam,
  validateCreateQuestion,
  validateUpdateExam
} from '../middleware/validation/examManagement.validation.js';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  cloneExam,
  deleteExam,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  reportQuestion,
  uploadDocument,
  getImportSessions,
  getImportSessionById,
  updateImportQuestion,
  confirmImport,
  deleteImportSession,
  getReports,
  resolveReport,
  getStats
} from '../controllers/examManagement.controller.js';

const router = Router();

// Stats route
router.get('/statistics/teacher', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), getStats);

// Exam routes
router.get('/exams', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), getExams);
router.get('/exams/:id', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), getExamById);
router.post('/exams', authenticateJWT, requireRole(['TEACHER']), validateCreateExam, createExam);
router.put('/exams/:id', authenticateJWT, requireRole(['TEACHER']), validateUpdateExam, updateExam);
router.post('/exams/:id/clone', authenticateJWT, requireRole(['TEACHER']), cloneExam);
router.delete('/exams/:id', authenticateJWT, requireRole(['TEACHER']), deleteExam);

// Question Bank routes
router.get('/questions', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), getQuestions);
router.get('/questions/:id', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), getQuestionById);
router.post('/questions', authenticateJWT, requireRole(['TEACHER']), validateCreateQuestion, createQuestion);
router.put('/questions/:id', authenticateJWT, requireRole(['TEACHER']), validateCreateQuestion, updateQuestion);
router.post('/questions/:id/report', authenticateJWT, requireRole(['TEACHER']), reportQuestion);

// AI Document Import routes
router.post('/import/upload', authenticateJWT, requireRole(['TEACHER']), uploadValidation, uploadDocument);
router.get('/import/sessions', authenticateJWT, requireRole(['TEACHER']), getImportSessions);
router.get('/import/sessions/:id', authenticateJWT, requireRole(['TEACHER']), getImportSessionById);
router.put('/import/questions/:id', authenticateJWT, requireRole(['TEACHER']), updateImportQuestion);
router.post('/import/sessions/:id/confirm', authenticateJWT, requireRole(['TEACHER']), confirmImport);
router.delete('/import/sessions/:id', authenticateJWT, requireRole(['TEACHER']), deleteImportSession);

// Reports moderation routes
router.get('/reports/my-questions', authenticateJWT, requireRole(['TEACHER']), getReports);
router.patch('/reports/:id/status', authenticateJWT, requireRole(['TEACHER']), resolveReport);

export default router;
