import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './lib/socket.js';

// Controller imports
import { login, logout, register, sendOtp, verifyOtpRegister, googleAuth, changePassword } from './controllers/auth.js';
import { getCourses, getCourseById, createCourse, getCourseStats } from './controllers/course.js';
import { getExams, startAttempt, submitAttempt } from './controllers/exam.js';
import { streamAIChat, refreshRoadmap, generateAIQuestions } from './controllers/ai.js';
import { chatbotConsult } from './controllers/chatbot.js';
import { createVNPayPayment, vnpayWebhook, sepayWebhook, checkEnrollmentStatus, checkUserProStatus } from './controllers/payment.js';
import { authenticateJWT, requireRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.io
initSocket(server);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Auth Routes
app.post('/login', login);
app.post('/register', register);
app.post('/logout', logout);
app.post('/auth/send-otp', sendOtp);
app.post('/auth/verify-otp-register', verifyOtpRegister);
app.post('/auth/google', googleAuth);
app.post('/auth/change-password', authenticateJWT, changePassword);

// Protected Course Routes
app.get('/courses', getCourses);
app.get('/courses/:id', getCourseById);
app.get('/courses/:id/stats', getCourseStats);
app.post('/courses', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), createCourse);

// Protected Exam Routes
app.get('/exams', getExams);
app.post('/exams/:id/attempts', authenticateJWT, requireRole(['STUDENT']), startAttempt);
app.post('/exams/:id/attempts/:attemptId/submit', authenticateJWT, requireRole(['STUDENT']), submitAttempt);

// Protected Payment Routes
app.post('/enrollments', authenticateJWT, requireRole(['STUDENT']), createVNPayPayment);
app.get('/enrollments/webhook', vnpayWebhook);
app.get('/enrollments/status', authenticateJWT, requireRole(['STUDENT']), checkEnrollmentStatus);
app.post('/enrollments/sepay-webhook', sepayWebhook);
app.get('/users/pro-status', authenticateJWT, requireRole(['STUDENT']), checkUserProStatus);

// Protected AI Routes
app.post('/ai/chat', authenticateJWT, requireRole(['STUDENT']), streamAIChat);
app.post('/ai/roadmap/refresh', authenticateJWT, requireRole(['STUDENT']), refreshRoadmap);
app.post('/ai/generate-questions', authenticateJWT, requireRole(['TEACHER', 'ADMIN']), generateAIQuestions);

// Public AI Chatbot Route (No Auth required so landing page guests can use it!)
app.post('/chatbot', chatbotConsult);

// Root Hello check
app.get('/', (req, res) => {
  res.json({ success: true, data: "EduPath API Server is online!" });
});

const PORT = process.env.PORT || 4000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`[API] EduPath Server is running on port: ${PORT}`);
  });
}

export default app;
