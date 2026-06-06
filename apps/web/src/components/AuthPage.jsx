import { useState, useEffect, useRef, useCallback } from 'react';
import { HiMail, HiLockClosed, HiUser, HiBookOpen, HiArrowLeft, HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle, HiX } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import { api } from '../api';

function mapBackendUser(backendUser, password) {
  const roleLower = (backendUser.role || 'STUDENT').toLowerCase();
  const name = backendUser.fullName || backendUser.email.split('@')[0];
  return {
    id: backendUser.id,
    name,
    email: backendUser.email,
    password: password || 'backend_managed',
    role: roleLower,
    combo: backendUser.subjectGroup || (roleLower === 'student' ? 'A01 (Toán – Lý – Anh)' : ''),
    grade: roleLower === 'student' ? '12' : '',
    avatar: backendUser.avatarUrl ? null : name.substring(0, 2).toUpperCase(),
    avatarUrl: backendUser.avatarUrl || null,
    isBanned: false,
    status: 'active',
    unlockedCourses: []
  };
}

function saveAuthTokens(data) {
  if (data.accessToken) localStorage.setItem('access_token', data.accessToken);
  if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
}

// ── Premium OTP Input Component ──
function OtpDigitInput({ length = 6, value, onChange, disabled }) {
  const inputRefs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val && e.nativeEvent.inputType !== 'deleteContentBackward') return;

    const newOtp = value.split('');
    newOtp[index] = val.slice(-1);
    const joined = newOtp.join('');
    onChange(joined);

    // Auto-focus next
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="otp-digit-container">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-digit-box${value[i] ? ' filled' : ''}`}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ── Password Strength Calculator ──
const PASSWORD_RULES = [
  { id: 'length', label: 'Tối thiểu 6 ký tự', test: (p) => p.length >= 6 },
  { id: 'upper', label: 'Ít nhất 1 chữ viết HOA (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Ít nhất 1 chữ viết thường (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Ít nhất 1 chữ số (0-9)', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Ít nhất 1 ký tự đặc biệt (!@#$%...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function getPasswordStrength(password) {
  if (!password) return { score: 0, level: 'none', label: '', color: '' };
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed <= 1) return { score: passed, level: 'weak', label: 'Yếu', color: '#DC2626' };
  if (passed <= 2) return { score: passed, level: 'fair', label: 'Trung bình', color: '#F97316' };
  if (passed <= 3) return { score: passed, level: 'good', label: 'Khá', color: '#EAB308' };
  if (passed <= 4) return { score: passed, level: 'strong', label: 'Mạnh', color: '#65A30D' };
  return { score: passed, level: 'excellent', label: 'Rất mạnh', color: '#16A34A' };
}

function isPasswordValid(password) {
  return PASSWORD_RULES.every(r => r.test(password));
}

// ── Password Strength Meter Component ──
function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  const segments = 4;
  const filledSegments = strength.level === 'weak' ? 1
    : strength.level === 'fair' ? 2
    : strength.level === 'good' ? 2
    : strength.level === 'strong' ? 3 : 4;

  return (
    <div className="pwd-strength-wrapper">
      <div className="pwd-strength-bar">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`pwd-strength-segment${i < filledSegments ? ' filled' : ''}`}
            style={{ backgroundColor: i < filledSegments ? strength.color : undefined }}
          />
        ))}
      </div>
      <div className="pwd-strength-label" style={{ color: strength.color }}>
        {strength.label}
      </div>
      <div className="pwd-rules-checklist">
        {PASSWORD_RULES.map(rule => {
          const passed = rule.test(password);
          return (
            <div key={rule.id} className={`pwd-rule-item${passed ? ' passed' : ''}`}>
              <span className="pwd-rule-icon">{passed ? '✓' : '○'}</span>
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Countdown Timer Hook ──
function useCountdown(targetTime) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!targetTime) { setRemaining(0); return; }
    const calc = () => Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
    setRemaining(calc());
    const interval = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return { remaining, formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` };
}

export default function AuthPage({ defaultMode = 'login', onAuthSuccess, usersList, addLog, onBackToLanding }) {
  // ── Core States ──
  const [mode, setMode] = useState(defaultMode);
  // Modes: 'login', 'signup', 'signup_otp', 'forgot', 'reset_password', 'google_role_select'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [combo, setCombo] = useState('A01 (Toán – Lý – Anh)');
  const [userRole, setUserRole] = useState('student');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // ── OTP States ──
  const [pendingSignupEmail, setPendingSignupEmail] = useState('');
  const [signupOtpInput, setSignupOtpInput] = useState('');
  const [otpExpiryTime, setOtpExpiryTime] = useState(null);
  const [resendCooldownEnd, setResendCooldownEnd] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [devOtp, setDevOtp] = useState('');

  // ── Google Role Selection States ──
  const [tempGoogleToken, setTempGoogleToken] = useState('');
  const [googleProfile, setGoogleProfile] = useState(null);
  const [googleSelectedRole, setGoogleSelectedRole] = useState('');
  const [googleSubjectGroup, setGoogleSubjectGroup] = useState('A01');

  // ── Forgot Password States ──
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [typedOtp, setTypedOtp] = useState('');

  // ── Countdown hooks ──
  const otpExpiry = useCountdown(otpExpiryTime);
  const resendCooldown = useCountdown(resendCooldownEnd);

  const switchMode = (m) => {
    setMode(m);
    setErrorMessage('');
    setSuccessMessage('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setSignupOtpInput('');
  };

  // ═══════════════════════════════════════════
  // SIGNUP: Step 1 — Send OTP
  // ═══════════════════════════════════════════
  const handleSignupSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      return;
    }
    if (!isPasswordValid(password)) {
      setErrorMessage('Mật khẩu chưa đáp ứng tất cả yêu cầu bảo mật. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        email,
        password,
        fullName: name,
        role: userRole === 'teacher' ? 'TEACHER' : 'STUDENT',
        subjectGroup: userRole === 'student' ? (combo.split(' ')[0] || 'A01') : undefined,
        phone
      };
      const data = await api.sendOtp(payload);
      
      setPendingSignupEmail(email);
      setSignupOtpInput('');
      setRemainingAttempts(5);
      setOtpExpiryTime(Date.now() + (data.expiresInMinutes || 10) * 60 * 1000);
      setResendCooldownEnd(Date.now() + (data.cooldownSeconds || 60) * 1000);
      if (data.devOtp) setDevOtp(data.devOtp);
      
      setMode('signup_otp');
      setSuccessMessage(`Mã OTP đã được gửi đến ${email}. Hãy kiểm tra hộp thư (bao gồm cả Spam).`);
      addLog(`Gửi OTP xác thực đến: ${email}`, 'sys');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════
  // SIGNUP: Step 2 — Verify OTP
  // ═══════════════════════════════════════════
  const handleVerifyOtp = async () => {
    if (!signupOtpInput || signupOtpInput.length !== 6) {
      setErrorMessage('Vui lòng nhập đúng 6 chữ số OTP.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.verifyOtpRegister(pendingSignupEmail, signupOtpInput);
      saveAuthTokens(data);
      const mappedUser = mapBackendUser(data.user, password);
      addLog(`Tài khoản mới: "${mappedUser.name}" (${mappedUser.email}) — đã lưu vào Supabase`, 'sys');
      if (mappedUser.role === 'teacher') {
        setSuccessMessage('Đăng ký Giáo viên thành công! Tài khoản đang chờ Admin duyệt.');
        setMode('login');
      } else {
        onAuthSuccess(mappedUser);
      }
    } catch (err) {
      setErrorMessage(err.message);
      if (err.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.data.remainingAttempts);
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════
  // RESEND OTP
  // ═══════════════════════════════════════════
  const handleResendOtp = async () => {
    if (resendCooldown.remaining > 0) return;
    
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.resendOtp(pendingSignupEmail);
      setSignupOtpInput('');
      setRemainingAttempts(5);
      setOtpExpiryTime(Date.now() + (data.expiresInMinutes || 10) * 60 * 1000);
      setResendCooldownEnd(Date.now() + (data.cooldownSeconds || 60) * 1000);
      if (data.devOtp) setDevOtp(data.devOtp);
      
      setSuccessMessage('Đã gửi lại mã OTP mới đến email của bạn!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════
  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    // Admin demo bypass (keep for development)
    if ((email.toLowerCase() === 'admin@edupath.vn' || email.toLowerCase() === 'tranvanthuan2005tt@gmail.com') && password === 'admin123') {
      setLoading(false);
      addLog('Quản trị viên đăng nhập thành công', 'sys');
      onAuthSuccess({ name: email.toLowerCase() === 'tranvanthuan2005tt@gmail.com' ? 'Trần Văn Thuận' : 'Quản trị viên Hệ thống', email: email.toLowerCase(), role: 'admin', avatar: 'AD' });
      return;
    }
    try {
      const data = await api.login(email, password);
      saveAuthTokens(data);
      const mappedUser = mapBackendUser(data.user, password);
      addLog(`"${mappedUser.name}" đăng nhập thành công — vai trò: ${mappedUser.role.toUpperCase()}`, 'sys');
      onAuthSuccess(mappedUser);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════
  // GOOGLE OAUTH — Real integration
  // ═══════════════════════════════════════════
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      try {
        const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
        const gProfile = await userInfoRes.json();

        if (!gProfile || !gProfile.email) {
          setErrorMessage('Không thể truy cập hồ sơ Google của bạn.');
          return;
        }

        const data = await api.googleAuth({
          email: gProfile.email,
          fullName: gProfile.name || gProfile.email.split('@')[0],
          googleId: gProfile.sub,
          avatarUrl: gProfile.picture || null
        });

        if (data.needsRoleSelection) {
          // NEW USER — show Role Selection page
          setTempGoogleToken(data.tempToken);
          setGoogleProfile(data.googleProfile);
          setGoogleSelectedRole('');
          setGoogleSubjectGroup('A01');
          setMode('google_role_select');
          addLog(`Google OAuth: tài khoản mới (${gProfile.email}) — chờ chọn vai trò`, 'sys');
        } else {
          // EXISTING USER — login directly
          saveAuthTokens(data);
          const mappedUser = mapBackendUser(data.user, 'google_oauth');
          addLog(`"${mappedUser.name}" đăng nhập qua Google → lưu vào Supabase`, 'sys');
          onAuthSuccess(mappedUser);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(err.message || 'Đăng nhập Google thất bại.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setErrorMessage('Google OAuth Authorization failed.');
    }
  });

  // ═══════════════════════════════════════════
  // GOOGLE ROLE SELECTION — Complete onboarding
  // ═══════════════════════════════════════════
  const handleGoogleCompleteOnboarding = async () => {
    if (!googleSelectedRole) {
      setErrorMessage('Vui lòng chọn vai trò của bạn.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const role = googleSelectedRole.toUpperCase();
      const subjectGroup = role === 'STUDENT' ? googleSubjectGroup : undefined;
      const data = await api.googleCompleteOnboarding(tempGoogleToken, role, subjectGroup);
      saveAuthTokens(data);
      const mappedUser = mapBackendUser(data.user, 'google_oauth');
      addLog(`Hoàn tất đăng ký Google: "${mappedUser.name}" (${mappedUser.email}) — vai trò: ${mappedUser.role.toUpperCase()}`, 'sys');

      if (mappedUser.role === 'teacher') {
        setSuccessMessage('Đăng ký Giáo viên thành công! Tài khoản đang chờ Admin phê duyệt.');
        setMode('login');
      } else {
        onAuthSuccess(mappedUser);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════
  // FORM SUBMIT ROUTER
  // ═══════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'login') return handleLogin();
    if (mode === 'signup') return handleSignupSubmit();
    if (mode === 'signup_otp') return handleVerifyOtp();

    // Forgot / Reset password (simulated)
    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      if (mode === 'forgot') {
        if (!resetEmail.trim()) return;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setTypedOtp('');
        addLog(`Yêu cầu khôi phục mật khẩu (Simulated OTP): ${resetEmail}`, 'sys');
        setResetSuccess(true);
        setShowInbox(true);
      } else if (mode === 'reset_password') {
        if (typedOtp !== generatedOtp) {
          setErrorMessage('Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
          return;
        }
        if (!isPasswordValid(password)) {
          setErrorMessage('Mật khẩu mới chưa đáp ứng tất cả yêu cầu bảo mật. Vui lòng kiểm tra lại.');
          return;
        }
        const existingUser = usersList.find(u => u.email === resetEmail);
        if (existingUser) {
          const updatedUser = { ...existingUser, password };
          onAuthSuccess(null, updatedUser);
        }
        addLog(`Khôi phục mật khẩu thành công cho email: ${resetEmail}`, 'sys');
        setSuccessMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
        setEmail(resetEmail);
        setPassword('');
        setConfirmPassword('');
        setMode('login');
      }
    }, 600);
  };

  return (
    <div className="auth-page-layout" style={{ position: 'relative' }}>
      {/* Standalone Floating Wide Card Container */}
      <div className="auth-floating-container">
        
        {/* Peaking Half-circle Sun Mascot behind the top border */}
        <div className="auth-peaking-sun-container">
          <div className="auth-peaking-sun">
            <svg viewBox="0 0 200 100" className="auth-peaking-sun-svg">
              <path d="M 20 100 A 80 80 0 0 1 180 100 Z" fill="#FFA502" stroke="#000000" strokeWidth="3" />
              <path d="M 20 100 Q 15 85 5 100" fill="none" stroke="#000000" strokeWidth="3" />
              <path d="M 180 100 Q 185 85 195 100" fill="none" stroke="#000000" strokeWidth="3" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="#FFA502" strokeWidth="5" strokeDasharray="12 8" />
              <circle cx="85" cy="72" r="3.5" fill="#000" />
              <circle cx="115" cy="72" r="3.5" fill="#000" />
              <path d="M 92 82 Q 100 89 108 82" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* The Wide Card */}
        <div className="auth-floating-card">
          
          {/* Olive Green Card Header Bar */}
          <div className="auth-card-header-bar">
            <div className="auth-header-logo-side" onClick={onBackToLanding}>
              <div className="auth-header-logo-circle">EP</div>
              <div className="auth-header-logo-text">
                <h4>EduPath AI</h4>
                <span>● Trực tuyến</span>
              </div>
            </div>
            
            <div className="auth-header-toggle-side">
              {(mode === 'login' || mode === 'signup') ? (
                <>
                  <button
                    type="button"
                    className={`auth-header-toggle-btn${mode === 'login' ? ' active' : ''}`}
                    onClick={() => switchMode('login')}
                  >
                    ĐĂNG NHẬP
                  </button>
                  <button
                    type="button"
                    className={`auth-header-toggle-btn${mode === 'signup' ? ' active' : ''}`}
                    onClick={() => switchMode('signup')}
                  >
                    ĐĂNG KÝ
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="auth-header-toggle-btn active"
                  style={{ textTransform: 'uppercase' }}
                >
                  {mode === 'forgot' && 'QUÊN MẬT KHẨU'}
                  {mode === 'reset_password' && 'OTP XÁC THỰC'}
                  {mode === 'signup_otp' && 'XÁC THỰC OTP ĐĂNG KÝ'}
                  {mode === 'google_role_select' && 'CHỌN VAI TRÒ'}
                </button>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="auth-card-body">
            
            {/* Back button */}
            <button className="auth-back-btn" onClick={mode === 'google_role_select' ? () => switchMode('login') : onBackToLanding}>
              <HiArrowLeft /> {mode === 'google_role_select' ? 'Hủy bỏ' : 'Về trang chủ'}
            </button>

            {/* Title / Subheading */}
            <div className="auth-form-header">
              <h2>
                {mode === 'login' && 'Chào mừng trở lại 👋'}
                {mode === 'signup' && 'Tạo tài khoản mới ✨'}
                {mode === 'signup_otp' && 'Xác thực OTP 📧'}
                {mode === 'forgot' && 'Khôi phục mật khẩu 🔑'}
                {mode === 'reset_password' && 'Đặt lại mật khẩu mới 🛡️'}
                {mode === 'google_role_select' && 'Chọn vai trò của bạn 🎯'}
              </h2>
              <p>
                {mode === 'login' && 'Đăng nhập để tiếp tục lộ trình học tập của bạn.'}
                {mode === 'signup' && 'Đăng ký miễn phí và bắt đầu học tập tại EduPath ngay hôm nay.'}
                {mode === 'signup_otp' && `Mã OTP đã được gửi tới ${pendingSignupEmail}. Nhập mã để hoàn tất đăng ký.`}
                {mode === 'forgot' && 'Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP xác nhận ngay.'}
                {mode === 'reset_password' && 'Mã OTP đã được gửi đến email của bạn. Hãy đổi mật khẩu.'}
                {mode === 'google_role_select' && 'Đây là lần đầu bạn sử dụng EduPath. Hãy cho chúng tôi biết bạn là ai.'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="auth-alert error">
                <HiExclamationCircle className="auth-alert-icon" />
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="auth-alert success">
                <HiCheckCircle className="auth-alert-icon" />
                {successMessage}
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* GOOGLE ROLE SELECTION SCREEN                  */}
            {/* ══════════════════════════════════════════════ */}
            {mode === 'google_role_select' && googleProfile && (
              <div className="google-role-select-wrapper">
                {/* Google profile card */}
                <div className="google-profile-preview">
                  {googleProfile.avatarUrl ? (
                    <img src={googleProfile.avatarUrl} alt="avatar" className="google-profile-avatar" />
                  ) : (
                    <div className="google-profile-avatar-fallback">
                      {(googleProfile.fullName || '?').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="google-profile-info">
                    <strong>{googleProfile.fullName}</strong>
                    <span>{googleProfile.email}</span>
                  </div>
                  <div className="google-profile-badge">
                    <svg width="16" height="16" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.711a5.41 5.41 0 0 1-.282-1.71c0-.593.102-1.17.282-1.711V4.957H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.463 1.077 11.427 0 9 0A8.997 8.997 0 0 0 .957 4.957l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z"/>
                    </svg>
                    Google
                  </div>
                </div>

                {/* Role selection cards */}
                <div className="role-selection-grid">
                  <div
                    className={`role-card${googleSelectedRole === 'student' ? ' selected' : ''}`}
                    onClick={() => setGoogleSelectedRole('student')}
                  >
                    <div className="role-card-icon">🎒</div>
                    <div className="role-card-title">Học sinh ôn thi</div>
                    <div className="role-card-desc">Truy cập khóa học, luyện đề, lộ trình AI cá nhân hóa</div>
                    {googleSelectedRole === 'student' && <HiCheckCircle className="role-card-check" />}
                  </div>
                  <div
                    className={`role-card${googleSelectedRole === 'teacher' ? ' selected' : ''}`}
                    onClick={() => setGoogleSelectedRole('teacher')}
                  >
                    <div className="role-card-icon">🎓</div>
                    <div className="role-card-title">Giảng viên</div>
                    <div className="role-card-desc">Tạo khóa học, đề thi, quản lý học sinh đăng ký</div>
                    {googleSelectedRole === 'teacher' && <HiCheckCircle className="role-card-check" />}
                  </div>
                </div>

                {/* Subject group — only for student */}
                {googleSelectedRole === 'student' && (
                  <div className="auth-input-group" style={{ marginTop: 16 }}>
                    <label>KHỐI THI MỤC TIÊU</label>
                    <div className="auth-input-wrap">
                      <HiBookOpen className="auth-input-icon" />
                      <select value={googleSubjectGroup} onChange={e => setGoogleSubjectGroup(e.target.value)} style={{ appearance: 'none' }}>
                        <option value="A01">A01 — Toán, Vật lý, Tiếng Anh</option>
                        <option value="B00">B00 — Toán, Hóa học, Sinh học</option>
                        <option value="D01">D01 — Toán, Ngữ văn, Tiếng Anh</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="role-select-warning">
                  <HiExclamationCircle />
                  <span>Lựa chọn vai trò này là <strong>vĩnh viễn</strong>. Nếu cần thay đổi sau, bạn sẽ cần gửi yêu cầu cho quản trị viên.</span>
                </div>

                {/* Submit */}
                <button
                  type="button"
                  className="auth-submit-btn-premium"
                  disabled={loading || !googleSelectedRole}
                  onClick={handleGoogleCompleteOnboarding}
                >
                  {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN & BẮT ĐẦU →'}
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* SIGNUP OTP VERIFICATION FORM                  */}
            {/* ══════════════════════════════════════════════ */}
            {mode === 'signup_otp' && (
              <form onSubmit={handleSubmit} className="auth-premium-form">
                <p className="auth-form-sub-text">Nhập mã OTP 6 chữ số đã gửi tới <strong>{pendingSignupEmail}</strong></p>
                
                {/* Premium 6-digit OTP input */}
                <OtpDigitInput
                  value={signupOtpInput}
                  onChange={setSignupOtpInput}
                  disabled={loading}
                />

                {/* OTP meta info */}
                <div className="otp-meta-row">
                  <div className="otp-expiry-display">
                    ⏱ Mã hết hạn sau: <strong className={otpExpiry.remaining <= 60 ? 'otp-expiry-warn' : ''}>{otpExpiry.formatted}</strong>
                  </div>
                  <div className="otp-attempts-display">
                    Còn <strong>{remainingAttempts}/5</strong> lần thử
                  </div>
                </div>

                {devOtp && (
                  <div
                    className="dev-otp-hint"
                    style={{
                      marginTop: 10,
                      padding: '12px 14px',
                      background: '#FFF8E1',
                      border: '2.5px solid #000000',
                      borderRadius: '12px',
                      boxShadow: '2.5px 2.5px 0px #000000',
                      fontSize: '12px',
                      color: '#B45309',
                      fontWeight: '800',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSignupOtpInput(devOtp)}
                  >
                    💡 Nhấp vào đây để tự động điền mã thử nghiệm: <strong style={{ color: '#000000', textDecoration: 'underline' }}>{devOtp}</strong>
                  </div>
                )}

                {/* Resend */}
                <button
                  type="button"
                  className="auth-resend-btn"
                  disabled={resendCooldown.remaining > 0 || loading}
                  onClick={handleResendOtp}
                >
                  {resendCooldown.remaining > 0
                    ? `Gửi lại mã (${resendCooldown.remaining}s)`
                    : '🔄 Gửi lại mã OTP'
                  }
                </button>

                <button type="submit" className="auth-submit-btn-premium" disabled={loading || signupOtpInput.length !== 6}>
                  {loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN & TẠO TÀI KHOẢN →'}
                </button>
                <button type="button" className="auth-link-btn-flat" onClick={() => { setMode('signup'); setSignupOtpInput(''); setShowInbox(false); }}>
                  <HiArrowLeft /> Quay lại form đăng ký
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <form onSubmit={handleSubmit} className="auth-premium-form">
                {!resetSuccess ? (
                  <>
                    <div className="auth-input-group">
                      <label>EMAIL</label>
                      <div className="auth-input-wrap">
                        <HiMail className="auth-input-icon" />
                        <input 
                          type="email" 
                          placeholder="email@example.com" 
                          value={resetEmail} 
                          onChange={e => setResetEmail(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                    <button type="submit" className="auth-submit-btn-premium" disabled={loading}>
                      {loading ? 'ĐANG GỬI...' : 'GỬI LIÊN KẾT ĐẶT LẠI MẬT KHẨU →'}
                    </button>
                  </>
                ) : (
                  <div className="auth-alert success" style={{ flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HiCheckCircle />
                      <strong>Đã gửi thành công!</strong>
                    </div>
                    <p style={{ fontSize: '13px' }}>Kiểm tra hộp thư thử nghiệm bên dưới để nhận mã OTP khôi phục cho <strong>{resetEmail}</strong>.</p>
                  </div>
                )}
                <button type="button" className="auth-link-btn-flat" onClick={() => { switchMode('login'); setResetSuccess(false); setResetEmail(''); }}>
                  <HiArrowLeft /> Quay lại đăng nhập
                </button>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {mode === 'reset_password' && (
              <form onSubmit={handleSubmit} className="auth-premium-form">
                <p className="auth-form-sub-text">Đặt mật khẩu mới cho tài khoản: <strong>{resetEmail}</strong></p>
                
                <div className="auth-input-group">
                  <label>MÃ XÁC THỰC OTP (6 CHỮ SỐ)</label>
                  <div className="auth-input-wrap">
                    <HiLockClosed className="auth-input-icon" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Nhập mã OTP 6 chữ số từ Mock Inbox"
                      value={typedOtp}
                      onChange={e => setTypedOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>MẬT KHẨU MỚI</label>
                  <div className="auth-input-wrap">
                    <HiLockClosed className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <HiEyeOff /> : <HiEye />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                </div>

                <div className="auth-input-group">
                  <label>XÁC NHẬN MẬT KHẨU MỚI</label>
                  <div className="auth-input-wrap">
                    <HiLockClosed className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-submit-btn-premium" disabled={loading}>
                  {loading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT MẬT KHẨU MỚI →'}
                </button>
                <button type="button" className="auth-link-btn-flat" onClick={() => switchMode('login')}>
                  <HiArrowLeft /> Quay lại đăng nhập
                </button>
              </form>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* LOGIN & SIGNUP FORMS                          */}
            {/* ══════════════════════════════════════════════ */}
            {(mode === 'login' || mode === 'signup') && (
              <form onSubmit={handleSubmit} className="auth-premium-form">
                
                {/* Fields Container Grid */}
                <div className="auth-fields-grid">
                  {mode === 'signup' && (
                    <div className="auth-input-group">
                      <label>HỌ VÀ TÊN</label>
                      <div className="auth-input-wrap">
                        <HiUser className="auth-input-icon" />
                        <input 
                          type="text" 
                          placeholder="Nguyễn Văn A" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="auth-input-group">
                    <label>EMAIL</label>
                    <div className="auth-input-wrap">
                      <HiMail className="auth-input-icon" />
                      <input 
                        type="email" 
                        placeholder="email@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="auth-input-group">
                      <label>SỐ ĐIỆN THOẠI</label>
                      <div className="auth-input-wrap">
                        <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="auth-input-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <input 
                          type="tel" 
                          placeholder="0912 345 678" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="auth-input-group">
                    <div className="auth-label-row">
                      <label>MẬT KHẨU</label>
                      {mode === 'login' && (
                        <button type="button" className="auth-forgot-link" onClick={() => switchMode('forgot')}>
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>
                    <div className="auth-input-wrap">
                      <HiLockClosed className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? <HiEyeOff /> : <HiEye />}
                      </button>
                    </div>
                    {mode === 'signup' && <PasswordStrengthMeter password={password} />}
                  </div>
                </div>

                {/* Role selection for signup */}
                {mode === 'signup' && (
                  <div className="auth-signup-options">
                    <div className="auth-input-group">
                      <label>BẠN LÀ (VAI TRÒ)</label>
                      <div className="auth-role-selector">
                        <label className={`auth-role-option${userRole === 'student' ? ' selected' : ''}`}>
                          <input type="radio" name="role" value="student" checked={userRole === 'student'} onChange={() => setUserRole('student')} />
                          <span>🎒 Học sinh ôn thi</span>
                        </label>
                        <label className={`auth-role-option${userRole === 'teacher' ? ' selected' : ''}`}>
                          <input type="radio" name="role" value="teacher" checked={userRole === 'teacher'} onChange={() => setUserRole('teacher')} />
                          <span>🎓 Giảng viên</span>
                        </label>
                      </div>
                    </div>

                    {userRole === 'student' && (
                      <div className="auth-input-group">
                        <label>KHỐI THI MỤC TIÊU</label>
                        <div className="auth-input-wrap">
                          <HiBookOpen className="auth-input-icon" />
                          <select value={combo} onChange={e => setCombo(e.target.value)} style={{ appearance: 'none' }}>
                            <option value="A01 (Toán – Lý – Anh)">A01 — Toán, Vật lý, Tiếng Anh</option>
                            <option value="B00 (Toán – Hóa – Sinh)">B00 — Toán, Hóa học, Sinh học</option>
                            <option value="D01 (Toán – Văn – Anh)">D01 — Toán, Ngữ văn, Tiếng Anh</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <button type="submit" className="auth-submit-btn-premium" disabled={loading}>
                  {loading ? 'ĐANG XỬ LÝ...' : mode === 'login' ? 'ĐĂNG NHẬP NGAY →' : 'TẠO TÀI KHOẢN →'}
                </button>

                {/* Divider Google Signin */}
                <div className="auth-divider-container">
                  <div className="auth-divider-line"></div>
                  <span className="auth-divider-text">HOẶC TIẾP TỤC VỚI</span>
                  <div className="auth-divider-line"></div>
                </div>

                <button type="button" className="auth-google-btn-premium" onClick={() => loginWithGoogle()} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 10 }}>
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.711a5.41 5.41 0 0 1-.282-1.71c0-.593.102-1.17.282-1.711V4.957H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.463 1.077 11.427 0 9 0A8.997 8.997 0 0 0 .957 4.957l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z"/>
                  </svg>
                  {loading ? 'ĐANG XỬ LÝ...' : 'Google'}
                </button>
              </form>
            )}

            <div className="auth-footer-lock">
              <span>🛡️ THÔNG TIN ĐƯỢC BẢO MẬT TUYỆT ĐỐI</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
