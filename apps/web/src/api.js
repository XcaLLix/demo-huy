export const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : '/api');

async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Lỗi ${res.status}`);
  }
  return data.data;
}

export const api = {
  login: (email, password) =>
    request('/login', { method: 'POST', body: { email, password } }),

  register: (payload) =>
    request('/register', { method: 'POST', body: payload }),

  sendOtp: (payload) =>
    request('/auth/send-otp', { method: 'POST', body: payload }),

  verifyOtpRegister: (email, otp) =>
    request('/auth/verify-otp-register', { method: 'POST', body: { email, otp } }),

  googleAuth: (profile) =>
    request('/auth/google', { method: 'POST', body: profile }),

  chatbot: (message, history) =>
    request('/chatbot', { method: 'POST', body: { message, history } }),

  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } })
};
