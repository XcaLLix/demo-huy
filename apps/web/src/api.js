export const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : '/api');

let refreshPromise = null;

async function request(path, options = {}) {
  let token = localStorage.getItem('access_token');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  
  let res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
    body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
  });

  // Handle expired/invalid JWT token by automatically refreshing it
  if ((res.status === 401 || res.status === 403) && token) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        if (!refreshPromise) {
          refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
          }).then(async r => {
            const d = await r.json();
            if (r.ok && d.success && d.data) {
              localStorage.setItem('access_token', d.data.accessToken);
              localStorage.setItem('refresh_token', d.data.refreshToken);
              return d.data.accessToken;
            }
            throw new Error(d.error || 'Refresh failed');
          }).finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;

        // Retry original request with new token
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`
        };

        res = await fetch(`${API_BASE}${path}`, {
          headers: retryHeaders,
          ...options,
          body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new CustomEvent('edupath-auth-logout'));
          const err = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
          err.status = res.status;
          throw err;
        }
      } catch (refreshErr) {
        console.error('[api] Silent refresh failed:', refreshErr.message);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Notify application components to clear state and visually logout the user
        window.dispatchEvent(new CustomEvent('edupath-auth-logout'));
      }
    } else {
      // No refresh token available, logout user immediately
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new CustomEvent('edupath-auth-logout'));
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    if (res.status === 503 || (data.error && data.error.toLowerCase().includes('bảo trì'))) {
      window.dispatchEvent(new CustomEvent('edupath-maintenance'));
    }
    const err = new Error(data.error || `Lỗi ${res.status}`);
    err.status = res.status;
    err.data = data.data || null;
    throw err;
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', { method: 'POST', body: formData });
  },

  deleteUploadedFile: (url) => {
    return request('/upload/delete', { method: 'POST', body: { url } });
  },

  login: (email, password) =>
    request('/login', { method: 'POST', body: { email, password } }),

  getMe: () => request('/auth/me'),

  updateProfile: (payload) => request('/auth/profile', { method: 'PATCH', body: payload }),

  sendOtp: (payload) =>
    request('/auth/send-otp', { method: 'POST', body: payload }),

  resendOtp: (email) =>
    request('/auth/resend-otp', { method: 'POST', body: { email } }),

  verifyOtpRegister: (email, otp) =>
    request('/auth/verify-otp-register', { method: 'POST', body: { email, otp } }),

  googleAuth: (profile) =>
    request('/auth/google', { method: 'POST', body: profile }),

  googleCompleteOnboarding: (tempToken, role, subjectGroup) =>
    request('/auth/google/complete-onboarding', {
      method: 'POST',
      body: { tempToken, role, subjectGroup }
    }),

  chatbot: (message, history) =>
    request('/chatbot', { method: 'POST', body: { message, history } }),

  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: { email } }),

  verifyResetOtp: (email, otp) =>
    request('/auth/verify-reset-otp', { method: 'POST', body: { email, otp } }),

  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: { token, password } }),

  getCourses: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/courses?${params}`);
  },

  aiSearchCourses: (query) =>
    request('/courses/ai-search', { method: 'POST', body: { query } }),

  getCourseById: (id) => request(`/courses/${id}`),

  createCourseReview: (id, rating, comment) =>
    request(`/courses/${id}/reviews`, {
      method: 'POST',
      body: { rating, comment }
    }),

  createCourse: (payload) => request('/courses', { method: 'POST', body: payload }),
  updateCourse: (id, payload) => request(`/courses/${id}`, { method: 'PUT', body: payload }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  createLesson: (payload) => request('/lessons', { method: 'POST', body: payload }),
  updateLesson: (id, payload) => request(`/lessons/${id}`, { method: 'PUT', body: payload }),
  deleteLesson: (id) => request(`/lessons/${id}`, { method: 'DELETE' }),

  getExams: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    return request(`/exams?${params.toString()}`);
  },

  getDocumentResources: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    return request(`/document-resources?${params.toString()}`);
  },
  getDocumentComments: (documentId) => request(`/document-resources/${documentId}/comments`),
  addDocumentComment: (documentId, content) => request(`/document-resources/${documentId}/comments`, {
    method: 'POST',
    body: { content },
  }),

  getExamById: (examId) => request(`/exams/${examId}`),

  getExamQuestionsPublic: (examId) => request(`/exams/${examId}/questions`),

  getAttempts: () => request('/exams/attempts'),

  getAttemptById: (attemptId) => request(`/exams/attempts/${attemptId}`),

  startAttempt: (examId, retakeMode = null, questionIds = []) => request('/exam-attempts/start', { method: 'POST', body: { examId, retakeMode, questionIds } }),

  saveAttemptAnswer: (attemptId, questionId, selectedAnswer) =>
    request(`/exam-attempts/${attemptId}/save-answer`, { method: 'POST', body: { questionId, selectedAnswer } }),

  submitAttempt: (attemptId, answers = [], retakeMode = null, questionIds = []) => 
    request(`/exam-attempts/${attemptId}/submit`, { method: 'POST', body: { answers, retakeMode, questionIds } }),

  getAttemptResult: (attemptId) => request(`/exam-attempts/${attemptId}/result`),

  getExamHistory: () => request('/users/me/exam-history'),

  getWrongQuestions: () => request('/exams/wrong-questions'),

  recordViolation: (attemptId) => request(`/exam-attempts/${attemptId}/violation`, { method: 'POST' }),

  recordViolationDetail: (attemptId, violationType) =>
    request(`/exam-attempts/${attemptId}/violation-detail`, { method: 'POST', body: { violationType } }),

  recordExamEvent: (attemptId, eventType, questionId, payload) =>
    request(`/exam-attempts/${attemptId}/events`, { method: 'POST', body: { eventType, questionId, payload } }),

  getExamEvents: (attemptId) =>
    request(`/exam-attempts/${attemptId}/events`),

  generateAiCoach: (attemptId, body = undefined) =>
    request(`/exam-attempts/${attemptId}/ai-coach`, { method: 'POST', body }),

  generateSimilarQuestion: (payload) =>
    request('/exam-attempts/generate-similar-question', { method: 'POST', body: payload }),

  createSmartRetake: (examId, mode, attemptId) =>
    request(`/exams/${examId}/smart-retake`, { method: 'POST', body: { mode, attemptId } }),

  refreshRoadmap: () => request('/ai/roadmap/refresh', { method: 'POST' }),

  createVNPayPayment: (courseId) => request('/enrollments', { method: 'POST', body: { courseId } }),

  checkEnrollmentStatus: (courseId) => request(`/enrollments/status?courseId=${courseId}`),

  enrollCourseDemo: (payload) => {
    const body = typeof payload === 'object' ? payload : { courseId: payload };
    return request('/enrollments/demo', { method: 'POST', body });
  },

  checkProStatus: () => request('/users/pro-status'),

  requestRoleChange: (requestedRole, reason) =>
    request('/auth/role-change-request', { method: 'POST', body: { requestedRole, reason } }),

  getRoleChangeRequests: () =>
    request('/admin/role-change-requests', { method: 'GET' }),

  reviewRoleChange: (requestId, action) =>
    request(`/admin/role-change-requests/${requestId}/review`, { method: 'POST', body: { action } }),

  // Forum API helpers
  getForumCategories: () =>
    request('/forum/categories', { method: 'GET' }),

  createForumCategory: (name, description, parentId) =>
    request('/forum/categories', { method: 'POST', body: { name, description, parentId } }),

  deleteForumCategory: (id) =>
    request(`/forum/categories/${id}`, { method: 'DELETE' }),

  getForumPosts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request(`/forum/posts?${query.toString()}`, { method: 'GET' });
  },

  getForumPostById: (id) =>
    request(`/forum/posts/${id}`, { method: 'GET' }),

  createForumPost: (postData) =>
    request('/forum/posts', { method: 'POST', body: postData }),

  deleteForumPost: (id) =>
    request(`/forum/posts/${id}`, { method: 'DELETE' }),

  updateForumPost: (id, postData) =>
    request(`/forum/posts/${id}`, { method: 'PUT', body: postData }),

  togglePinForumPost: (id) =>
    request(`/forum/posts/${id}/pin`, { method: 'PUT' }),

  reactForumPost: (id, type) =>
    request(`/forum/posts/${id}/react`, { method: 'POST', body: { type } }),

  toggleSaveForumPost: (id) =>
    request(`/forum/posts/${id}/save`, { method: 'POST' }),

  getForumComments: (postId) =>
    request(`/forum/posts/${postId}/comments`, { method: 'GET' }),

  createForumComment: (postId, content, parentId = null) =>
    request(`/forum/posts/${postId}/comments`, { method: 'POST', body: { content, parentId } }),

  reactForumComment: (id, type) =>
    request(`/forum/comments/${id}/react`, { method: 'POST', body: { type } }),

  acceptCommentSolution: (id) =>
    request(`/forum/comments/${id}/accept`, { method: 'PUT' }),

  getStudyGroups: () =>
    request('/forum/study-groups', { method: 'GET' }),

  createStudyGroup: (groupData) =>
    request('/forum/study-groups', { method: 'POST', body: groupData }),

  joinStudyGroup: (id) =>
    request(`/forum/study-groups/${id}/join`, { method: 'POST' }),

  leaveStudyGroup: (id) =>
    request(`/forum/study-groups/${id}/leave`, { method: 'POST' }),

  deleteStudyGroup: (id) =>
    request(`/forum/study-groups/${id}`, { method: 'DELETE' }),

  getForumLeaderboard: () =>
    request('/forum/leaderboard', { method: 'GET' }),

  getUserGamificationProfile: () =>
    request('/forum/gamification/profile', { method: 'GET' }),

  downloadResource: (id) =>
    request(`/forum/resources/${id}/download`, { method: 'POST' }),

  createForumReport: (postId, commentId, reason) =>
    request('/forum/moderation/reports', { method: 'POST', body: { postId, commentId, reason } }),

  getGroupAnnouncements: (groupId) =>
    request(`/forum/study-groups/${groupId}/announcements`, { method: 'GET' }),

  createGroupAnnouncement: (groupId, title, content) =>
    request(`/forum/study-groups/${groupId}/announcements`, { method: 'POST', body: { title, content } }),

  getForumReports: () =>
    request('/forum/moderation/reports', { method: 'GET' }),

  resolveForumReport: (id, status, notes) =>
    request(`/forum/moderation/reports/${id}/resolve`, { method: 'PUT', body: { status, notes } }),

  getAdminReports: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request(`/admin/reports?${query.toString()}`);
  },
  getAdminReportById: (id) => request(`/admin/reports/${id}`),
  approveAdminReport: (id) => request(`/admin/reports/${id}/approve`, { method: 'PATCH' }),
  rejectAdminReport: (id, reason) => request(`/admin/reports/${id}/reject`, { method: 'PATCH', body: { reason } }),
  closeAdminReport: (id, notes) => request(`/admin/reports/${id}/close`, { method: 'PATCH', body: { notes } }),
  createAdminReportWarning: (id, message) => request(`/admin/reports/${id}/warning`, { method: 'POST', body: { message } }),
  getAdminReportStatistics: () => request('/admin/reports/statistics'),

  importExam: (examData) =>
    request('/exams/import', { method: 'POST', body: examData }),

  updateExamStatus: (id, status) =>
    request(`/exams/${id}/status`, { method: 'PATCH', body: { status } }),

  generateMindmap: (text) =>
    request('/ai/mindmap', {
      method: 'POST',
      body: { text },
    }),

  generateFlashcards: (text) =>
    request('/ai/flashcards', {
      method: 'POST',
      body: { text },
    }),

  generateFlashcardMnemonic: (front, back) =>
    request('/ai/flashcards/mnemonic', {
      method: 'POST',
      body: { front, back },
    }),

  generateFlashcardsOCR: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/ai/flashcards/ocr', { method: 'POST', body: formData });
  },

  saveMindmap: (title, content, id = null) =>
    request('/mindmaps', {
      method: 'POST',
      body: { title, content, id },
    }),

  getMindmaps: () =>
    request('/mindmaps', { method: 'GET' }),

  getMindmapById: (id) =>
    request(`/mindmaps/${id}`, { method: 'GET' }),

  deleteMindmap: (id) =>
    request(`/mindmaps/${id}`, { method: 'DELETE' }),

  getPublicMindmapById: (id) =>
    request(`/mindmaps/public/${id}`, { method: 'GET' }),

  getAdminStats: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    const url = '/admin/stats' + (query.toString() ? `?${query.toString()}` : '');
    return request(url);
  },
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/users?' + query.toString());
  },
  banAdminUser: (id) => request(`/admin/users/${id}/ban`, { method: 'POST' }),
  getUserDetail: (id) => request(`/admin/users/${id}/detail`),
  blockUser: (id, reason) => request(`/admin/users/${id}/block`, { method: 'POST', body: { reason } }),
  unblockUser: (id) => request(`/admin/users/${id}/unblock`, { method: 'POST' }),
  getAdminLeads: () => request('/admin/leads'),
  createAdminLead: (payload) => request('/admin/leads', { method: 'POST', body: payload }),
  updateAdminLeadStatus: (id, status) => request(`/admin/leads/${id}/status`, { method: 'PUT', body: { status } }),
  getFeatureFlags: () => request('/admin/features'),
  toggleFeatureFlag: (id, isEnabled) => request(`/admin/features/${id}/toggle`, { method: 'POST', body: { isEnabled } }),

  getAdvancedLeaderboard: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request(`/v1/leaderboard?${query.toString()}`);
  },

  getActivityHeatmap: (userId, year) => {
    const url = userId 
      ? `/v1/users/${userId}/activity-heatmap${year ? `?year=${year}` : ''}`
      : `/v1/users/me/activity-heatmap${year ? `?year=${year}` : ''}`;
    return request(url);
  },

  generateNodeQuiz: (mindmapId, nodeKey, refresh = false) =>
    request('/ai/mindmap/quiz', {
      method: 'POST',
      body: { mindmapId, nodeKey, refresh }
    }),

  submitNodeQuiz: (mindmapId, nodeKey, answers, completionTime) =>
    request('/ai/mindmap/quiz/submit', {
      method: 'POST',
      body: { mindmapId, nodeKey, answers, completionTime }
    }),

  getNodeProgress: (mindmapId) =>
    request(`/mindmaps/${mindmapId}/progress`, { method: 'GET' }),

  generateWeaknessMindmap: () =>
    request('/ai/mindmap/weakness', { method: 'POST' }),

  uploadExamFile: (formData) =>
    request('/ai/mindmap/exam-upload', {
      method: 'POST',
      body: formData
    }),

  generateExamMindmap: (payload) =>
    request('/ai/mindmap/exam-analyse', {
      method: 'POST',
      body: payload
    }),

  // ==========================================
  // AFFILIATE SYSTEM API
  // ==========================================
  getAffiliateMe: () => request('/affiliate/me'),
  updateAffiliateMe: (payload) => request('/affiliate/me', { method: 'PUT', body: payload }),
  getMyReferrals: (page = 1, limit = 10) => request(`/affiliate/me/referrals?page=${page}&limit=${limit}`),
  getMyCommissions: (status = '') => request(`/affiliate/me/commissions${status ? `?status=${status}` : ''}`),
  getMyAnalytics: () => request('/affiliate/me/analytics'),
  requestPayout: (amount) => request('/affiliate/me/payout-request', { method: 'POST', body: { amount } }),
  getMarketingMaterials: () => request('/affiliate/me/materials'),
  trackMaterialClick: (materialId, isConversion = false) => request('/affiliate/me/materials/track', { method: 'POST', body: { materialId, isConversion } }),
  getAffiliateLeaderboard: () => request('/affiliate/leaderboard'),

  // ADMIN AFFILIATE MODERATION
  getAdminAffiliates: (status = '') => request(`/admin/affiliates${status ? `?status=${status}` : ''}`),
  approveAffiliate: (id) => request(`/admin/affiliates/${id}/approve`, { method: 'POST' }),
  rejectAffiliate: (id) => request(`/admin/affiliates/${id}/reject`, { method: 'POST' }),
  updateAffiliateTier: (id, tier) => request(`/admin/affiliates/${id}/tier`, { method: 'PUT', body: { tier } }),
  updateAffiliateCommissionRate: (id, commissionRate) => request(`/admin/affiliates/${id}/commission-rate`, { method: 'PUT', body: { commissionRate } }),
  getAdminPendingPayouts: () => request('/admin/affiliates/payouts/pending'),
  approvePayout: (id, transactionId) => request(`/admin/affiliates/payouts/${id}/approve`, { method: 'POST', body: { transactionId } }),
  rejectPayout: (id) => request(`/admin/affiliates/payouts/${id}/reject`, { method: 'POST' }),
  autoApproveCommissions: () => request('/admin/affiliates/commissions/auto-approve', { method: 'POST' }),

  // ==========================================
  // TEACHER MATERIALS API
  // ==========================================
  getTeacherMaterials: () => request('/teacher/materials'),
  createTeacherMaterial: (formData) => request('/teacher/materials', { method: 'POST', body: formData }),
  updateTeacherMaterial: (id, payload) => request(`/teacher/materials/${id}`, { method: 'PUT', body: payload }),
  deleteTeacherMaterial: (id) => request(`/teacher/materials/${id}`, { method: 'DELETE' }),
  submitTeacherMaterial: (id) => request(`/teacher/materials/${id}/submit`, { method: 'POST' }),
  getPublicMaterials: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    return request(`/materials?${params.toString()}`);
  },
  getMaterialDetail: (id) => request(`/materials/${id}`),
  downloadMaterial: (id) => request(`/materials/${id}/download`, { method: 'POST' }),

  // ADMIN MATERIALS MODERATION
  getAdminPendingMaterials: () => request('/admin/materials/pending'),
  approveMaterial: (id) => request(`/admin/materials/${id}/approve`, { method: 'POST' }),
  rejectMaterial: (id) => request(`/admin/materials/${id}/reject`, { method: 'POST' }),

  getTeacherStats: () => request('/teacher/stats'),

  // ADMIN TEACHER MANAGEMENT (from admin-dinh branch)
  getAdminTeacherStats: () => request('/admin/teachers/statistics'),
  getAdminTeachers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/teachers?' + query.toString());
  },
  getTeacherDetail: (id) => request(`/admin/teachers/${id}`),
  createTeacherAccount: (payload) => request('/admin/teachers', { method: 'POST', body: payload }),
  approveTeacherProfile: (id) => request(`/admin/teachers/${id}/approve`, { method: 'PATCH' }),
  rejectTeacherProfile: (id, reason) => request(`/admin/teachers/${id}/reject`, { method: 'PATCH', body: { reason } }),
  blockTeacher: (id, reason) => request(`/admin/teachers/${id}/block`, { method: 'PATCH', body: { reason } }),
  unblockTeacher: (id) => request(`/admin/teachers/${id}/unblock`, { method: 'PATCH' }),

  // ADMIN COURSE MANAGEMENT (from admin-dinh branch)
  getAdminCoursesStats: () => request('/admin/courses/statistics'),
  getAdminCourses: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/courses?' + query.toString());
  },
  getAdminCourseDetail: (id) => request(`/admin/courses/${id}`),
  approveCourse: (id) => request(`/admin/courses/${id}/approve`, { method: 'PATCH' }),
  rejectCourse: (id, reason) => request(`/admin/courses/${id}/reject`, { method: 'PATCH', body: { reason } }),
  hideCourse: (id, reason) => request(`/admin/courses/${id}/hide`, { method: 'PATCH', body: { reason } }),
  showCourse: (id) => request(`/admin/courses/${id}/show`, { method: 'PATCH' }),

  // ADMIN EXAM MANAGEMENT
  getAdminTests: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/tests?' + query.toString());
  },
  getAdminTestById: (id) => request(`/admin/tests/${id}`),
  approveTest: (id) => request(`/admin/tests/${id}/approve`, { method: 'PUT' }),
  rejectTest: (id, reason) => request(`/admin/tests/${id}/reject`, { method: 'PUT', body: { reason } }),
  hideTest: (id, reason) => request(`/admin/tests/${id}/hide`, { method: 'PUT', body: { reason } }),
  showTest: (id) => request(`/admin/tests/${id}/show`, { method: 'PUT' }),

  getUserDocuments: () => request('/user-documents', { method: 'GET' }),
  createUserDocument: (title, fileUrl, fileType) => request('/user-documents', { method: 'POST', body: { title, fileUrl, fileType } }),
  deleteUserDocument: (id) => request(`/user-documents/${id}`, { method: 'DELETE' }),

  getAdminLogsStatistics: () => request('/admin/logs/statistics'),
  getAdminLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/logs?' + query.toString());
  },
  getAdminLogById: (id) => request(`/admin/logs/${id}`),

  getHighestScoreLeaderboard: (subject) => request(`/gamification/score-leaderboard?subject=${subject}`),
  getEffortLeaderboard: () => request('/gamification/effort-leaderboard'),
  logAttendance: (activity) => request('/gamification/attendance', { method: 'POST', body: { activity } }),
  getAttendanceHistory: (startDate, endDate) => request(`/gamification/attendance?startDate=${startDate}&endDate=${endDate}`),
  
  getAdminSystemSettings: () => request('/admin/system-settings', { method: 'GET' }),
  updateAdminSystemSettings: (settings) => request('/admin/system-settings', { method: 'PUT', body: { settings } }),

  // Notification API Methods
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/notifications?' + query.toString());
  },
  getUnreadNotificationsCount: () => request('/notifications/unread-count'),
  markNotificationAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsAsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  deleteAllReadNotifications: () => request('/notifications/all-read', { method: 'DELETE' }),

  // Admin Notification management
  adminSendNotification: (data) => request('/notifications/admin/send', { method: 'POST', body: data }),
  adminGetSentNotifications: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/notifications/admin/history?' + query.toString());
  },
  adminGetTemplates: () => request('/notifications/admin/templates'),
  adminCreateTemplate: (data) => request('/notifications/admin/templates', { method: 'POST', body: data }),
  adminUpdateTemplate: (id, data) => request(`/notifications/admin/templates/${id}`, { method: 'PUT', body: data }),
  adminDeleteTemplate: (id) => request(`/notifications/admin/templates/${id}`, { method: 'DELETE' }),

  // Voucher Management APIs
  getAdminVouchers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/vouchers?' + query.toString());
  },
  getAdminVoucherById: (id) => request(`/admin/vouchers/${id}`),
  createAdminVoucher: (data) => request('/admin/vouchers', { method: 'POST', body: data }),
  updateAdminVoucher: (id, data) => request(`/admin/vouchers/${id}`, { method: 'PUT', body: data }),
  deleteAdminVoucher: (id) => request(`/admin/vouchers/${id}`, { method: 'DELETE' }),
  enableAdminVoucher: (id) => request(`/admin/vouchers/${id}/enable`, { method: 'PUT' }),
  disableAdminVoucher: (id) => request(`/admin/vouchers/${id}/disable`, { method: 'PUT' }),
  validateVoucher: (data) => request('/enrollments/validate-voucher', { method: 'POST', body: data }),
  reserveVoucher: (data) => request('/enrollments/reserve-voucher', { method: 'POST', body: data }),

  // Announcement Popup APIs
  getAdminAnnouncements: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request('/admin/announcements?' + query.toString());
  },
  getAdminAnnouncementById: (id) => request(`/admin/announcements/${id}`),
  createAdminAnnouncement: (data) => request('/admin/announcements', { method: 'POST', body: data }),
  updateAdminAnnouncement: (id, data) => request(`/admin/announcements/${id}`, { method: 'PUT', body: data }),
  deleteAdminAnnouncement: (id) => request(`/admin/announcements/${id}`, { method: 'DELETE' }),
  updateAdminAnnouncementStatus: (id, status) => request(`/admin/announcements/${id}/status`, { method: 'PATCH', body: { status } }),
  getActiveAnnouncement: (role = '', page = '') => {
    const query = new URLSearchParams();
    if (role) query.append('role', role);
    if (page) query.append('page', page);
    const qStr = query.toString();
    return request('/announcements/active' + (qStr ? `?${qStr}` : ''));
  }
};


