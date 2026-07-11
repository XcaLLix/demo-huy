import './env.js';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initSocket } from './lib/socket.js';
import { prisma } from './lib/prisma.js';
import { upload } from './lib/s3.js';

import { login, logout, sendOtp, resendOtp, verifyOtpRegister, googleAuth, googleCompleteOnboarding, changePassword, forgotPassword, verifyResetOtp, resetPassword, requestRoleChange, getRoleChangeRequests, reviewRoleChange, refreshToken, getMe, registerAffiliate, updateProfile } from './controllers/auth.js';
import { getCourses, getCourseById, createCourse, getCourseStats, updateCourse, deleteCourse, updateLesson, deleteLesson, createLesson } from './controllers/course.js';
import { getExams, getExamById, startAttempt, saveAnswer, submitAttempt, getAttempts, getExamQuestionsPublic, getAttemptById, getAttemptResult, getExamHistory, recordViolation, recordExamEvent, getExamEvents, recordViolationDetail, generateAiCoach, createSmartRetake, importExam, generateSimilarQuestion, updateExamStatus, getWrongQuestions } from './controllers/exam.js';
import { streamAIChat, refreshRoadmap, generateAIQuestions, generateMindmap, saveMindmap, getMindmaps, getMindmapById, deleteMindmap, generateFlashcards, getPublicMindmapById, generateNodeQuiz, submitNodeQuiz, getNodeProgress, generateWeaknessMindmap, uploadExamFile, generateExamMindmap } from './controllers/ai.js';

import { chatbotConsult } from './controllers/chatbot.js';
import { getDocumentResources, getDocumentComments, addDocumentComment, getUserDocuments, createUserDocument, deleteUserDocument } from './controllers/document.js';
import { createVNPayPayment, vnpayWebhook, sepayWebhook, checkEnrollmentStatus, checkUserProStatus, createDemoEnrollment, getPremiumPricing } from './controllers/payment.js';
import { authenticateJWT, requireRole, optionalAuthenticateJWT } from './middleware/auth.js';
import { ownsCourse, ownsLesson, ownsAttempt } from './middleware/ownership.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { auditLogger } from './middleware/audit.js';
import { logSystemEvent } from './utils/logger.js';
import { getAdminStats, getAdminUsers, toggleUserBan, getAdminLeads, createAdminLead, updateAdminLeadStatus, getFeatureFlags, toggleFeatureFlag, getUserDetail, blockUser, unblockUser } from './controllers/admin.js';
import { getTeacherStats, getAdminTeachers, getTeacherDetail, createTeacherAccount, approveTeacherProfile, rejectTeacherProfile, blockTeacher, unblockTeacher } from './controllers/adminTeachers.js';
import { getAdminCoursesStats, getAdminCourses, getAdminCourseDetail, approveCourse, rejectCourse, hideCourse, showCourse } from './controllers/adminCourses.js';
import { getAdminTests, getAdminTestById, approveTest, rejectTest, hideTest, showTest } from './controllers/adminTests.js';
import {
  getAdminReports,
  getAdminReportById,
  approveAdminReport,
  rejectAdminReport,
  closeAdminReport,
  createAdminReportWarning,
  getAdminReportStatistics
} from './controllers/moderation.js';

import { getAdminLogs, getAdminLogById, getAdminLogsStatistics } from './controllers/adminLogs.js';
import { getSettings, updateSettings } from './controllers/systemSettings.js';
import { SystemSettingService } from './services/systemSetting.service.js';
import notificationRoutes from './routes/notification.routes.js';
import { NotificationTemplateService } from './services/notificationTemplate.service.js';
import { seedSystemSettings } from './seedSettings.js';

import {
  getLeaderboardRankings,
  getActivityHeatmap,
  recordAttendance,
  getAttendanceHistory,
  getEffortLeaderboard,
  getHighestScoreLeaderboard
} from './controllers/gamification.js';
import { getTeacherStats as getTeacherDashboardStats } from './controllers/teacher.js';
import {
  getScoreLeaderboard,
  getStreakLeaderboard,
  getCourseLeaderboard,
  getLeaderboardTelemetry
} from './controllers/leaderboard.js';

import {
  trackClick,
  getLeaderboard as getAffiliateLeaderboard,
  getAffiliateMe,
  updateAffiliateMe,
  getMyReferrals,
  getMyCommissions,
  getMyAnalytics,
  requestPayout,
  getMarketingMaterials,
  trackMaterialClick,
  getAdminAffiliates,
  approveAffiliate,
  rejectAffiliate,
  updateAffiliateTier,
  updateAffiliateCommissionRate,
  getAdminPendingPayouts,
  approvePayout,
  rejectPayout,
  autoApproveCommissions
} from './controllers/affiliate.js';

import {
  getTeacherMaterials,
  createTeacherMaterial,
  updateTeacherMaterial,
  deleteTeacherMaterial,
  submitTeacherMaterial,
  getPublicMaterials,
  getMaterialDetail,
  downloadMaterial,
  getAdminPendingMaterials,
  approveMaterial,
  rejectMaterial
} from './controllers/material.js';

import { uploadValidation } from './middleware/upload.js';
import {
  getCategories, createCategory, deleteCategory,
  getPosts, getPostById, createPost, deletePost, togglePinPost, reactPost,
  getComments, createComment, acceptCommentSolution, reactComment,
  getStudyGroups, createStudyGroup, joinStudyGroup, leaveStudyGroup,
  getGroupAnnouncements, createGroupAnnouncement,
  getLeaderboard as getForumLeaderboard, getUserGamificationProfile,
  downloadResource, createReport, getReports, resolveReport, toggleSavePost
} from './controllers/forum.js';
import { initCronJobs } from './cron/index.js';
// Environment variables are loaded at the top of the file via import './env.js'

const app = express();
const server = createServer(app);

// Initialize Socket.io
initSocket(server);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolvedUploadsDir = path.resolve(__dirname, '../uploads');
console.log(`[API] Static uploads serving from: ${resolvedUploadsDir}`);
if (!fs.existsSync(resolvedUploadsDir)) {
  fs.mkdirSync(resolvedUploadsDir, { recursive: true });
}
app.use('/uploads', express.static(resolvedUploadsDir));

// Strip /api prefix for Vercel routing
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.substring(4);
  }
  next();
});

// Maintenance Mode Middleware
app.use((req, res, next) => {
  const isMaintenance = SystemSettingService.getBoolean('MAINTENANCE_MODE');
  if (isMaintenance) {
    const path = req.path;
    const isExempt = 
      path === '/' || 
      path === '/login' || 
      path === '/logout' || 
      path.startsWith('/admin') ||
      path.startsWith('/auth') ||
      path === '/dev/reset';
      
    if (!isExempt) {
      return res.status(503).json({ 
        success: false, 
        error: 'Hệ thống hiện đang trong chế độ bảo trì để nâng cấp. Vui lòng quay lại sau!' 
      });
    }
  }
  next();
});

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Audit Logger for admin routes
app.use('/admin', auditLogger);

// Rate Limiter for public endpoints
app.use(['/courses', '/exams', '/public'], rateLimiter);


// Auth Routes
app.post('/login', login);
app.post('/logout', logout);
app.post('/auth/send-otp', sendOtp);
app.post('/auth/resend-otp', resendOtp);
app.post('/auth/verify-otp-register', verifyOtpRegister);
app.post('/auth/google', googleAuth);
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/verify-reset-otp', verifyResetOtp);
app.post('/auth/reset-password', resetPassword);
app.post('/auth/google/complete-onboarding', googleCompleteOnboarding);
app.post('/auth/refresh', refreshToken);
app.get('/auth/me', authenticateJWT, getMe);
app.post('/auth/change-password', authenticateJWT, changePassword);
app.post('/auth/register-affiliate', registerAffiliate);
app.patch('/auth/profile', authenticateJWT, updateProfile);

// File Upload Route
app.post('/upload', authenticateJWT, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Không nhận được tệp tải lên!' });
  }
  const maxMb = SystemSettingService.getNumber('MAX_UPLOAD_SIZE_MB') || 50;
  const maxBytes = maxMb * 1024 * 1024;
  if (req.file.size > maxBytes) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {}
    return res.status(400).json({ success: false, error: `Dung lượng tệp tải lên vượt quá giới hạn cấu hình của hệ thống (Tối đa ${maxMb}MB)!` });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.status(200).json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Role Change Routes
app.post('/auth/role-change-request', authenticateJWT, requestRoleChange);
app.get('/admin/role-change-requests', authenticateJWT, requireRole(['ADMIN']), getRoleChangeRequests);
app.post('/admin/role-change-requests/:id/review', authenticateJWT, requireRole(['ADMIN']), reviewRoleChange);
app.post('/admin/exams/import', authenticateJWT, requireRole(['ADMIN']), importExam);

// Admin Dashboard DB & Stats Routes
app.get('/admin/stats', authenticateJWT, requireRole(['ADMIN']), getAdminStats);
app.get('/admin/users', authenticateJWT, requireRole(['ADMIN']), getAdminUsers);
app.post('/admin/users/:id/ban', authenticateJWT, requireRole(['ADMIN']), toggleUserBan);
app.get('/admin/users/:id/detail', authenticateJWT, requireRole(['ADMIN']), getUserDetail);
app.post('/admin/users/:id/block', authenticateJWT, requireRole(['ADMIN']), blockUser);
app.post('/admin/users/:id/unblock', authenticateJWT, requireRole(['ADMIN']), unblockUser);
app.get('/admin/leads', authenticateJWT, requireRole(['ADMIN']), getAdminLeads);
app.post('/admin/leads', authenticateJWT, createAdminLead);
app.put('/admin/leads/:id/status', authenticateJWT, requireRole(['ADMIN']), updateAdminLeadStatus);
app.get('/admin/features', getFeatureFlags);
app.post('/admin/features/:id/toggle', authenticateJWT, requireRole(['ADMIN']), toggleFeatureFlag);
app.get('/admin/system-settings', authenticateJWT, requireRole(['ADMIN']), getSettings);
app.put('/admin/system-settings', authenticateJWT, requireRole(['ADMIN']), updateSettings);

// Admin System Logs Routes
app.get('/admin/logs/statistics', authenticateJWT, requireRole(['ADMIN']), getAdminLogsStatistics);
app.get('/admin/logs', authenticateJWT, requireRole(['ADMIN']), getAdminLogs);
app.get('/admin/logs/:id', authenticateJWT, requireRole(['ADMIN']), getAdminLogById);

// Admin Teacher Management Routes
app.get('/admin/teachers/statistics', authenticateJWT, requireRole(['ADMIN']), getTeacherStats);
app.get('/admin/teachers', authenticateJWT, requireRole(['ADMIN']), getAdminTeachers);
app.get('/admin/teachers/:id', authenticateJWT, requireRole(['ADMIN']), getTeacherDetail);
app.post('/admin/teachers', authenticateJWT, requireRole(['ADMIN']), createTeacherAccount);
app.patch('/admin/teachers/:id/approve', authenticateJWT, requireRole(['ADMIN']), approveTeacherProfile);
app.patch('/admin/teachers/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectTeacherProfile);
app.patch('/admin/teachers/:id/block', authenticateJWT, requireRole(['ADMIN']), blockTeacher);
app.patch('/admin/teachers/:id/unblock', authenticateJWT, requireRole(['ADMIN']), unblockTeacher);

// Admin Course Management Routes
app.get('/admin/courses/statistics', authenticateJWT, requireRole(['ADMIN']), getAdminCoursesStats);
app.get('/admin/courses', authenticateJWT, requireRole(['ADMIN']), getAdminCourses);
app.get('/admin/courses/:id', authenticateJWT, requireRole(['ADMIN']), getAdminCourseDetail);
app.patch('/admin/courses/:id/approve', authenticateJWT, requireRole(['ADMIN']), approveCourse);
app.patch('/admin/courses/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectCourse);
app.patch('/admin/courses/:id/hide', authenticateJWT, requireRole(['ADMIN']), hideCourse);
app.patch('/admin/courses/:id/show', authenticateJWT, requireRole(['ADMIN']), showCourse);

// Admin Exam Management Routes
app.get('/admin/tests', authenticateJWT, requireRole(['ADMIN']), getAdminTests);
app.get('/admin/tests/:id', authenticateJWT, requireRole(['ADMIN']), getAdminTestById);
app.put('/admin/tests/:id/approve', authenticateJWT, requireRole(['ADMIN']), approveTest);
app.put('/admin/tests/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectTest);
app.put('/admin/tests/:id/hide', authenticateJWT, requireRole(['ADMIN']), hideTest);
app.put('/admin/tests/:id/show', authenticateJWT, requireRole(['ADMIN']), showTest);


// Protected Course Routes
app.get('/courses', getCourses);
app.get('/courses/:id', getCourseById);
app.get('/courses/:id/stats', getCourseStats);
app.post('/courses', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), createCourse);
app.put('/courses/:id', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), ownsCourse, updateCourse);
app.delete('/courses/:id', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), ownsCourse, deleteCourse);
app.put('/lessons/:id', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), ownsLesson, updateLesson);
app.delete('/lessons/:id', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), ownsLesson, deleteLesson);
app.post('/lessons', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), createLesson);

// Document Resource Routes
app.get('/document-resources', getDocumentResources);
app.get('/document-resources/:id/comments', getDocumentComments);
app.post('/document-resources/:id/comments', authenticateJWT, addDocumentComment);

// User Document Routes
app.get('/user-documents', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), getUserDocuments);
app.post('/user-documents', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), createUserDocument);
app.delete('/user-documents/:id', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), deleteUserDocument);

// Protected Exam Routes
app.get('/exams', getExams);
app.get('/exams/attempts', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), getAttempts);
app.get('/exams/attempts/:attemptId', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, getAttemptById);
app.get('/exams/:id', getExamById);
app.get('/exams/:id/questions', getExamQuestionsPublic);
app.post('/exams/:id/attempts', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), startAttempt);
app.post('/exams/:id/attempts/:attemptId/submit', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, submitAttempt);
app.post('/exams/import', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), importExam);
app.patch('/exams/:id/status', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), updateExamStatus);

// Upgraded Exam Simulation Endpoints
app.post('/exam-attempts/start', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), (req, res, next) => {
  req.params.id = String(req.body.examId);
  next();
}, startAttempt);
app.post('/exam-attempts/:attemptId/save-answer', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, saveAnswer);
app.post('/exam-attempts/:attemptId/submit', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, submitAttempt);
app.get('/exam-attempts/:attemptId/result', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, getAttemptResult);
app.post('/exam-attempts/:attemptId/violation', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, recordViolation);
app.post('/exam-attempts/:attemptId/violation-detail', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, recordViolationDetail);
app.post('/exam-attempts/:attemptId/events', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, recordExamEvent);
app.get('/exam-attempts/:attemptId/events', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, getExamEvents);
app.post('/exam-attempts/:attemptId/ai-coach', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), ownsAttempt, generateAiCoach);
app.post('/exam-attempts/generate-similar-question', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), generateSimilarQuestion);
app.post('/exams/:id/smart-retake', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), createSmartRetake);
app.get('/users/me/exam-history', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), getExamHistory);
app.get('/exams/wrong-questions', authenticateJWT, requireRole(['STUDENT', 'TEACHER', 'ADMIN']), getWrongQuestions);

// Protected Payment Routes
app.post('/enrollments', authenticateJWT, requireRole(['STUDENT']), createVNPayPayment);
app.get('/enrollments/webhook', vnpayWebhook);
app.get('/enrollments/status', authenticateJWT, requireRole(['STUDENT']), checkEnrollmentStatus);
app.post('/enrollments/sepay-webhook', sepayWebhook);
app.get('/users/pro-status', authenticateJWT, requireRole(['STUDENT']), checkUserProStatus);
app.post('/enrollments/demo', authenticateJWT, requireRole(['STUDENT']), createDemoEnrollment);
app.get('/enrollments/pricing', getPremiumPricing);

// Protected AI Routes
app.post('/ai/chat', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req as any, res, next);
  }
  next();
}, streamAIChat);
app.post('/ai/roadmap/refresh', authenticateJWT, requireRole(['STUDENT']), refreshRoadmap);
app.post('/ai/generate-questions', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), generateAIQuestions);

// AI Mindmap Routes
app.post('/ai/mindmap', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req as any, res, next);
  }
  next();
}, generateMindmap);

app.post('/ai/flashcards', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req as any, res, next);
  }
  next();
}, generateFlashcards);
app.post('/mindmaps', authenticateJWT, saveMindmap);
app.get('/mindmaps', authenticateJWT, getMindmaps);
app.get('/mindmaps/:id', authenticateJWT, getMindmapById);
app.get('/mindmaps/public/:id', getPublicMindmapById);
app.delete('/mindmaps/:id', authenticateJWT, deleteMindmap);

app.post('/ai/mindmap/quiz', authenticateJWT, generateNodeQuiz);
app.post('/ai/mindmap/quiz/submit', authenticateJWT, submitNodeQuiz);
app.get('/mindmaps/:id/progress', authenticateJWT, getNodeProgress);
app.post('/ai/mindmap/weakness', authenticateJWT, generateWeaknessMindmap);
app.post('/ai/mindmap/exam-upload', authenticateJWT, upload.single('file'), uploadExamFile);
app.post('/ai/mindmap/exam-analyse', authenticateJWT, generateExamMindmap);

// Public AI Chatbot Route (No Auth required so landing page guests can use it!)
app.post('/chatbot', chatbotConsult);

// =========================================================================
// FORUM FEATURES ROUTING
// =========================================================================
app.get('/forum/categories', getCategories);
app.post('/forum/categories', authenticateJWT, requireRole(['ADMIN']), createCategory);
app.delete('/forum/categories/:id', authenticateJWT, requireRole(['ADMIN']), deleteCategory);

app.get('/forum/posts', optionalAuthenticateJWT, getPosts);
app.get('/forum/posts/:id', optionalAuthenticateJWT, getPostById);
app.post('/forum/posts', authenticateJWT, createPost);
app.delete('/forum/posts/:id', authenticateJWT, deletePost);
app.put('/forum/posts/:id/pin', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), togglePinPost);
app.post('/forum/posts/:id/react', authenticateJWT, reactPost);
app.post('/forum/posts/:id/save', authenticateJWT, toggleSavePost);

app.get('/forum/posts/:postId/comments', optionalAuthenticateJWT, getComments);
app.post('/forum/posts/:postId/comments', authenticateJWT, createComment);
app.put('/forum/comments/:id/accept', authenticateJWT, acceptCommentSolution);
app.post('/forum/comments/:id/react', authenticateJWT, reactComment);

app.get('/forum/study-groups', authenticateJWT, getStudyGroups);
app.post('/forum/study-groups', authenticateJWT, createStudyGroup);
app.post('/forum/study-groups/:id/join', authenticateJWT, joinStudyGroup);
app.post('/forum/study-groups/:id/leave', authenticateJWT, leaveStudyGroup);
app.get('/forum/study-groups/:id/announcements', authenticateJWT, getGroupAnnouncements);
app.post('/forum/study-groups/:id/announcements', authenticateJWT, createGroupAnnouncement);

app.get('/forum/leaderboard', getForumLeaderboard);
app.get('/forum/gamification/profile', authenticateJWT, getUserGamificationProfile);

app.get('/v1/leaderboard', authenticateJWT, getLeaderboardRankings);
app.get('/v1/users/:id/activity-heatmap', authenticateJWT, getActivityHeatmap);

app.get('/leaderboard/scores', getScoreLeaderboard);
app.get('/leaderboard/streaks', getStreakLeaderboard);
app.get('/leaderboard/courses', getCourseLeaderboard);
app.get('/leaderboard/telemetry', getLeaderboardTelemetry);

app.post('/gamification/attendance', authenticateJWT, recordAttendance);
app.get('/gamification/attendance', authenticateJWT, getAttendanceHistory);
app.get('/gamification/effort-leaderboard', getEffortLeaderboard);
app.get('/gamification/score-leaderboard', getHighestScoreLeaderboard);

app.post('/forum/resources/:id/download', downloadResource);
app.post('/forum/moderation/reports', authenticateJWT, createReport);
app.get('/forum/moderation/reports', authenticateJWT, requireRole(['ADMIN']), getReports);
app.put('/forum/moderation/reports/:id/resolve', authenticateJWT, requireRole(['ADMIN']), resolveReport);

// Notification Center Router
app.use('/notifications', notificationRoutes);

// =========================================================================
// AFFILIATE SYSTEM ROUTING
// =========================================================================
// Public
app.get('/affiliate/track-click/:code', trackClick);
app.get('/affiliate/leaderboard', getAffiliateLeaderboard);

// Affiliate Portal
app.get('/affiliate/me', authenticateJWT, requireRole(['AFFILIATE']), getAffiliateMe);
app.put('/affiliate/me', authenticateJWT, requireRole(['AFFILIATE']), updateAffiliateMe);
app.get('/affiliate/me/referrals', authenticateJWT, requireRole(['AFFILIATE']), getMyReferrals);
app.get('/affiliate/me/commissions', authenticateJWT, requireRole(['AFFILIATE']), getMyCommissions);
app.get('/affiliate/me/analytics', authenticateJWT, requireRole(['AFFILIATE']), getMyAnalytics);
app.post('/affiliate/me/payout-request', authenticateJWT, requireRole(['AFFILIATE']), requestPayout);
app.get('/affiliate/me/materials', authenticateJWT, requireRole(['AFFILIATE']), getMarketingMaterials);
app.post('/affiliate/me/materials/track', authenticateJWT, requireRole(['AFFILIATE']), trackMaterialClick);

// Admin moderation for Affiliates
app.get('/admin/affiliates', authenticateJWT, requireRole(['ADMIN']), getAdminAffiliates);
app.post('/admin/affiliates/:id/approve', authenticateJWT, requireRole(['ADMIN']), approveAffiliate);
app.post('/admin/affiliates/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectAffiliate);
app.put('/admin/affiliates/:id/tier', authenticateJWT, requireRole(['ADMIN']), updateAffiliateTier);
app.put('/admin/affiliates/:id/commission-rate', authenticateJWT, requireRole(['ADMIN']), updateAffiliateCommissionRate);
app.get('/admin/affiliates/payouts/pending', authenticateJWT, requireRole(['ADMIN']), getAdminPendingPayouts);
app.post('/admin/affiliates/payouts/:id/approve', authenticateJWT, requireRole(['ADMIN']), approvePayout);
app.post('/admin/affiliates/payouts/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectPayout);
app.post('/admin/affiliates/commissions/auto-approve', authenticateJWT, requireRole(['ADMIN']), autoApproveCommissions);

// Admin moderation for general reports
app.get('/admin/reports/statistics', authenticateJWT, requireRole(['ADMIN']), getAdminReportStatistics);
app.get('/admin/reports', authenticateJWT, requireRole(['ADMIN']), getAdminReports);
app.get('/admin/reports/:id', authenticateJWT, requireRole(['ADMIN']), getAdminReportById);
app.patch('/admin/reports/:id/approve', authenticateJWT, requireRole(['ADMIN']), approveAdminReport);
app.patch('/admin/reports/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectAdminReport);
app.patch('/admin/reports/:id/close', authenticateJWT, requireRole(['ADMIN']), closeAdminReport);
app.post('/admin/reports/:id/warning', authenticateJWT, requireRole(['ADMIN']), createAdminReportWarning);

// =========================================================================
// TEACHER MATERIALS SYSTEM ROUTING
// =========================================================================
// Teacher side
app.get('/teacher/stats', authenticateJWT, requireRole(['TEACHER']), getTeacherDashboardStats);
app.get('/teacher/materials', authenticateJWT, requireRole(['TEACHER']), getTeacherMaterials);
app.post('/teacher/materials', authenticateJWT, requireRole(['TEACHER']), uploadValidation, createTeacherMaterial);
app.put('/teacher/materials/:id', authenticateJWT, requireRole(['TEACHER']), updateTeacherMaterial);
app.delete('/teacher/materials/:id', authenticateJWT, requireRole(['TEACHER']), deleteTeacherMaterial);
app.post('/teacher/materials/:id/submit', authenticateJWT, requireRole(['TEACHER']), submitTeacherMaterial);

// Public side
app.get('/materials', getPublicMaterials);
app.get('/materials/:id', getMaterialDetail);
app.post('/materials/:id/download', downloadMaterial);

// Admin side
app.get('/admin/materials/pending', authenticateJWT, requireRole(['ADMIN']), getAdminPendingMaterials);
app.post('/admin/materials/:id/approve', authenticateJWT, requireRole(['ADMIN']), approveMaterial);
app.post('/admin/materials/:id/reject', authenticateJWT, requireRole(['ADMIN']), rejectMaterial);

// Root Hello check
app.get('/', (req, res) => {
  res.json({ success: true, data: "EduPath API Server is online!" });
});


// Dev reset endpoint for automation
app.post('/dev/reset', async (req, res) => {
  try {
    console.log('[Dev] Resetting database seed...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    const { stdout, stderr } = await execPromise('npx tsx prisma/seed.ts --force');
    console.log('[Dev Seed Output]', stdout);
    if (stderr) console.error('[Dev Seed Error]', stderr);
    return res.status(200).json({ success: true, data: 'Database reset successfully!' });
  } catch (err: any) {
    console.error('[Dev Reset Error]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  server.listen(PORT, async () => {
    console.log(`[API] EduPath Server is running on port: ${PORT}`);
    try {
      // Tải và chạy seeder cấu hình mặc định
      await seedSystemSettings();
      // Nạp cấu hình từ DB vào bộ nhớ đệm
      await SystemSettingService.loadAll();
    } catch (err: any) {
      console.error('[Startup] Lỗi khởi tạo cấu hình hệ thống:', err.message || err);
    }
  });
  initCronJobs();
}

async function seedDefaultCategories() {
  try {
    const count = await prisma.forumCategory.count();
    if (count === 0) {
      console.log('[Seed] Seeding default forum categories...');
      const defaultCategories = [
        { name: 'Toán học', slug: 'toan-hoc', description: 'Thảo luận và học hỏi kiến thức môn Toán học THPTQG' },
        { name: 'Vật lý', slug: 'vat-ly', description: 'Trao đổi lời giải bài tập Vật lý và đề thi thử' },
        { name: 'Hóa học', slug: 'hoa-hoc', description: 'Góc học tập môn Hóa học lớp 10, 11, 12' },
        { name: 'Tiếng Anh', slug: 'tieng-anh', description: 'Chia sẻ từ vựng, ngữ pháp và đề thi mẫu THPTQG' },
        { name: 'Sinh học', slug: 'sinh-hoc', description: 'Nơi thảo luận về môn Sinh học và kiến thức liên quan' },
        { name: 'Thảo luận chung', slug: 'thao-luan-chung', description: 'Chia sẻ kinh nghiệm thi cử, phương pháp học tập chung' }
      ];

      for (const cat of defaultCategories) {
        await prisma.forumCategory.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            allowedRoles: ['STUDENT', 'TEACHER', 'ADMIN']
          }
        });
      }
      console.log('[Seed] Default forum categories seeded successfully!');
    }
  } catch (err) {
    console.error('[Seed Error] Failed to seed default categories:', err);
  }
}

// Auto-seed on startup
seedDefaultCategories();
NotificationTemplateService.seedDefaultTemplates();

// Global Error Handler Middleware to catch exceptions and log them
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Global Error Handler]', err);
  
  const isPrismaError = err.code !== undefined || err.message?.includes('prisma') || err.message?.includes('Prisma');
  logSystemEvent(req, {
    type: 'SYSTEM',
    action: 'SERVER_ERROR',
    module: isPrismaError ? 'DATABASE' : 'SERVER',
    description: `Exception Backend: ${err.message || 'Lỗi hệ thống không xác định'}`,
    metadata: { 
      message: err.message, 
      stack: err.stack,
      path: req.path,
      method: req.method
    },
    level: 'ERROR'
  }).catch(logErr => console.error('Failed to log global error to DB:', logErr));

  res.status(500).json({ success: false, error: 'Đã xảy ra lỗi hệ thống! Vui lòng thử lại sau.' });
});

export default app;

