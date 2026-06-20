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
    const err = new Error(data.error || `Lỗi ${res.status}`);
    err.data = data.data || null;
    throw err;
  }
  return data.data;
}

export const api = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload', { method: 'POST', body: formData });
  },

  login: (email, password) =>
    request('/login', { method: 'POST', body: { email, password } }),

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

  getCourseById: (id) => request(`/courses/${id}`),

  createCourse: (payload) => request('/courses', { method: 'POST', body: payload }),

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

  togglePinForumPost: (id) =>
    request(`/forum/posts/${id}/pin`, { method: 'PUT' }),

  reactForumPost: (id, type) =>
    request(`/forum/posts/${id}/react`, { method: 'POST', body: { type } }),

  getForumComments: (postId) =>
    request(`/forum/posts/${postId}/comments`, { method: 'GET' }),

  createForumComment: (postId, content, parentId = null) =>
    request(`/forum/posts/${postId}/comments`, { method: 'POST', body: { content, parentId } }),

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

  importExam: (examData) =>
    request('/admin/exams/import', { method: 'POST', body: examData }),

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

  generateNodeQuiz: (mindmapId, nodeKey) =>
    request('/ai/mindmap/quiz', {
      method: 'POST',
      body: { mindmapId, nodeKey }
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

  getTeacherStats: () => request('/admin/teachers/statistics'),
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
  showCourse: (id) => request(`/admin/courses/${id}/show`, { method: 'PATCH' })
};

