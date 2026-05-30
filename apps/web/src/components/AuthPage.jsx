import { useState } from 'react';
import { HiMail, HiLockClosed, HiUser, HiBookOpen, HiArrowLeft, HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';

export default function AuthPage({ defaultMode = 'login', onAuthSuccess, usersList, addLog, onBackToLanding }) {
  const [mode, setMode] = useState(defaultMode); // 'login', 'signup', 'forgot', 'reset_password'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [combo, setCombo] = useState('A01 (Toán – Lý – Anh)');
  const [userRole, setUserRole] = useState('student');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // New Upgraded States for Capstone Logic
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchMode = (m) => {
    setMode(m);
    setErrorMessage('');
    setSuccessMessage('');
    setName('');
    setPassword('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (mode === 'login') {
        if (email === 'admin@edupath.vn' && password === 'admin123') {
          addLog('Quản trị viên đăng nhập thành công', 'sys');
          onAuthSuccess({ name: 'Quản trị viên Hệ thống', email: 'admin@edupath.vn', role: 'admin', avatar: 'AD' });
          return;
        }
        const matched = usersList.find(u => u.email === email && u.password === password);
        if (matched) {
          if (matched.isBanned) {
            setErrorMessage('Tài khoản của bạn đã bị khóa do vi phạm chính sách hệ thống.');
            return;
          }
          if (matched.status === 'pending') {
            setErrorMessage('Tài khoản Giáo viên đang chờ Admin phê duyệt. Vui lòng thử lại sau.');
            return;
          }
          addLog(`"${matched.name}" đăng nhập thành công — vai trò: ${matched.role.toUpperCase()}`, 'sys');
          onAuthSuccess(matched);
        } else {
          setErrorMessage('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
        }

      } else if (mode === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setErrorMessage('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
          return;
        }
        if (usersList.find(u => u.email === email) || email === 'admin@edupath.vn') {
          setErrorMessage('Email này đã được đăng ký bởi tài khoản khác.');
          return;
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          password,
          role: userRole,
          combo: userRole === 'student' ? combo : '',
          grade: userRole === 'student' ? '12' : '',
          avatar: name.substring(0, 2).toUpperCase(),
          isBanned: false,
          status: userRole === 'teacher' ? 'pending' : 'active',
          unlockedCourses: [],
        };

        addLog(`Tài khoản mới: "${name}" (${email}) — Vai trò: ${userRole.toUpperCase()}`, 'sys');
        onAuthSuccess(null, newUser);

        if (userRole === 'teacher') {
          setSuccessMessage('Đăng ký Giáo viên thành công! Hồ sơ của bạn đang chờ Admin phê duyệt.');
          setEmail(email);
          setPassword('');
          setMode('login');
        } else {
          setSuccessMessage('Đăng ký thành công! Hãy đăng nhập để bắt đầu học.');
          setEmail(email);
          setPassword('');
          setMode('login');
        }

      } else if (mode === 'forgot') {
        if (!resetEmail.trim()) return;
        addLog(`Yêu cầu khôi phục mật khẩu: ${resetEmail}`, 'sys');
        setResetSuccess(true);
        setShowInbox(true); // Open mock inbox to show simulated mail
      } else if (mode === 'reset_password') {
        if (password !== confirmPassword) {
          setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
          setLoading(false);
          return;
        }
        
        // Find existing user and update password
        const existingUser = usersList.find(u => u.email === resetEmail);
        if (existingUser) {
          const updatedUser = { ...existingUser, password };
          onAuthSuccess(null, updatedUser); // This will update the user record in App.jsx usersList
          addLog(`Khôi phục mật khẩu thành công cho email: ${resetEmail}`, 'sys');
          setSuccessMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
          setEmail(resetEmail);
          setPassword('');
          setConfirmPassword('');
          setMode('login');
        } else {
          // If mock default users, update the list manually
          const defaultUser = {
            id: resetEmail === 'student@gmail.com' ? 101 : 102,
            name: resetEmail === 'student@gmail.com' ? 'Nguyễn Minh Anh' : 'Thầy Thế Anh',
            email: resetEmail,
            password: password,
            role: resetEmail === 'student@gmail.com' ? 'student' : 'teacher',
            combo: 'A01 (Toán – Lý – Anh)',
            grade: '12',
            avatar: resetEmail === 'student@gmail.com' ? 'MA' : 'TA',
            isBanned: false,
            status: 'active',
            unlockedCourses: [1]
          };
          onAuthSuccess(null, defaultUser);
          addLog(`Khôi phục mật khẩu thành công cho email: ${resetEmail}`, 'sys');
          setSuccessMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
          setEmail(resetEmail);
          setPassword('');
          setConfirmPassword('');
          setMode('login');
        }
      }
    }, 600);
  };

  const handleSelectOAuthAccount = (accountEmail) => {
    setOauthLoading(true);
    setTimeout(() => {
      setOauthLoading(false);
      setShowGoogleOAuth(false);

      if (accountEmail === 'student@gmail.com') {
        const student = usersList.find(u => u.email === 'student@gmail.com');
        if (student) {
          addLog('Đăng nhập nhanh qua Google (Học sinh: student@gmail.com) thành công', 'sys');
          onAuthSuccess(student);
        }
      } else if (accountEmail === 'teacher@gmail.com') {
        const teacher = usersList.find(u => u.email === 'teacher@gmail.com');
        if (teacher) {
          addLog('Đăng nhập nhanh qua Google (Giảng viên: teacher@gmail.com) thành công', 'sys');
          onAuthSuccess(teacher);
        }
      }
    }, 1200);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      try {
        const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
        const googleProfile = await userInfoRes.json();
        
        if (googleProfile && googleProfile.email) {
          const matched = usersList.find(u => u.email === googleProfile.email);
          if (matched) {
            if (matched.isBanned) {
              setErrorMessage('Tài khoản của bạn đã bị khóa do vi phạm chính sách hệ thống.');
              return;
            }
            addLog(`"${matched.name}" đăng nhập thành công qua Google OAuth`, 'sys');
            onAuthSuccess(matched);
          } else {
            const newGoogleUser = {
              id: Date.now(),
              name: googleProfile.name || 'Người dùng Google',
              email: googleProfile.email,
              password: 'google_oauth_no_password_2026',
              role: 'student',
              combo: 'A01 (Toán – Lý – Anh)',
              grade: '12',
              avatar: googleProfile.picture ? googleProfile.email.substring(0, 2).toUpperCase() : 'GG',
              isBanned: false,
              status: 'active',
              unlockedCourses: [1],
            };
            onAuthSuccess(null, newGoogleUser);
            addLog(`Tài khoản mới đăng ký tự động qua Google: "${newGoogleUser.name}" (${newGoogleUser.email})`, 'sys');
            onAuthSuccess(newGoogleUser);
          }
        } else {
          setErrorMessage('Không thể truy cập hồ sơ Google của bạn.');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('Đăng nhập Google thất bại do lỗi kết nối mạng.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setErrorMessage('Google OAuth Authorization failed.');
    }
  });

  return (
    <div className="auth-page-layout" style={{ position: 'relative' }}>
      {/* Left branding panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="nav-logo-icon" style={{ width: 44, height: 44, fontSize: 22 }}>E</div>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>EduPath AI</span>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
            Học thông minh.<br />Thi thật tự tin.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, marginBottom: 32 }}>
            Nền tảng luyện thi THPTQG được hơn 42,500 học sinh tin chọn, với AI cá nhân hóa lộ trình và phân tích lỗ hổng kiến thức tức thì.
          </p>

          <div className="auth-brand-stats">
            {[
              { v: '42,500+', l: 'Học sinh' },
              { v: '98.4%', l: 'Đạt mục tiêu' },
              { v: '27+', l: 'Điểm THPTQG' },
            ].map((s, i) => (
              <div key={i} className="auth-brand-stat">
                <span className="auth-brand-stat-value">{s.v}</span>
                <span className="auth-brand-stat-label">{s.l}</span>
              </div>
            ))}
          </div>

          <div className="auth-brand-quote">
            <p>"EduPath giúp mình biết chính xác cần ôn gì mỗi ngày. Điểm tăng từ 6.5 lên 9.2 chỉ trong 3 tháng!"</p>
            <span>— Trần Ngọc Bích, Khối A01</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          {/* Back button */}
          <button className="auth-back-btn" onClick={onBackToLanding}>
            <HiArrowLeft />
            Về trang chủ
          </button>

          <div className="auth-form-header">
            <h2>
              {mode === 'login' && 'Chào mừng trở lại!'}
              {mode === 'signup' && 'Tạo tài khoản mới'}
              {mode === 'forgot' && 'Khôi phục mật khẩu'}
              {mode === 'reset_password' && 'Đặt lại mật khẩu mới'}
            </h2>
            <p>
              {mode === 'login' && 'Đăng nhập để tiếp tục lộ trình học của bạn.'}
              {mode === 'signup' && 'Đăng ký miễn phí — không cần thẻ tín dụng.'}
              {mode === 'forgot' && 'Nhập email để nhận liên kết đặt lại mật khẩu.'}
              {mode === 'reset_password' && 'Thiết lập mật khẩu bảo mật mới cho tài khoản.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="auth-alert error">
              <HiExclamationCircle />
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="auth-alert success">
              <HiCheckCircle />
              {successMessage}
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!resetSuccess ? (
                <>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu ngay.
                  </p>
                  <div className="auth-input-group">
                    <label>Địa chỉ Email</label>
                    <div className="auth-input-wrap">
                      <HiMail className="auth-input-icon" />
                      <input type="email" placeholder="email@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
                  </button>
                </>
              ) : (
                <div className="auth-alert success" style={{ flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiCheckCircle />
                    <strong>Đã gửi thành công!</strong>
                  </div>
                  <p style={{ fontSize: '13px' }}>Kiểm tra hộp thư thử nghiệm bên dưới để nhận liên kết đặt lại mật khẩu cho email <strong>{resetEmail}</strong>.</p>
                </div>
              )}
              <button type="button" className="auth-link-btn" onClick={() => { switchMode('login'); setResetSuccess(false); setResetEmail(''); }}>
                <HiArrowLeft style={{ marginRight: 4 }} /> Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* RESET PASSWORD */}
          {mode === 'reset_password' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Đặt mật khẩu mới cho tài khoản: <strong>{resetEmail}</strong>
              </p>
              <div className="auth-input-group">
                <label>Mật khẩu mới <span className="required">*</span></label>
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
              </div>
              <div className="auth-input-group">
                <label>Xác nhận mật khẩu mới <span className="required">*</span></label>
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
              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu mới'}
              </button>
              <button type="button" className="auth-link-btn" onClick={() => switchMode('login')}>
                <HiArrowLeft style={{ marginRight: 4 }} /> Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* LOGIN & SIGNUP */}
          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {mode === 'signup' && (
                <div className="auth-input-group">
                  <label>Họ và tên <span className="required">*</span></label>
                  <div className="auth-input-wrap">
                    <HiUser className="auth-input-icon" />
                    <input type="text" placeholder="Ví dụ: Nguyễn Minh Anh" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="auth-input-group">
                <label>Địa chỉ Email <span className="required">*</span></label>
                <div className="auth-input-wrap">
                  <HiMail className="auth-input-icon" />
                  <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Mật khẩu <span className="required">*</span></label>
                  {mode === 'login' && (
                    <button type="button" className="auth-link-inline" onClick={() => switchMode('forgot')}>
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
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
              </div>

              {mode === 'signup' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="auth-input-group">
                    <label>Bạn là:</label>
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
                      <label>Khối thi mục tiêu <span className="required">*</span></label>
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

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>

              {mode === 'login' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Hoặc</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                  </div>
                  <button type="button" className="google-signin-btn" onClick={() => loginWithGoogle()}>
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.711a5.41 5.41 0 0 1-.282-1.71c0-.593.102-1.17.282-1.711V4.957H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.463 1.077 11.427 0 9 0A8.997 8.997 0 0 0 .957 4.957l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z"/>
                    </svg>
                    Tiếp tục với Google (OAuth)
                  </button>
                </div>
              )}
            </form>
          )}

          {mode !== 'forgot' && mode !== 'reset_password' && (
            <p className="auth-switch-mode">
              {mode === 'login' ? (
                <>Chưa có tài khoản? <button type="button" onClick={() => switchMode('signup')}>Đăng ký miễn phí</button></>
              ) : (
                <>Đã có tài khoản? <button type="button" onClick={() => switchMode('login')}>Đăng nhập ngay</button></>
              )}
            </p>
          )}

          {/* Demo hint - collapsible */}
          {mode === 'login' && <DemoHint />}
        </div>
      </div>

      {/* ── GOOGLE OAUTH POPUP SIMULATION MODAL ── */}
      {showGoogleOAuth && (
        <div className="checkout-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="checkout-modal oauth-modal animate-in" style={{ padding: '30px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <button 
              onClick={() => setShowGoogleOAuth(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
              disabled={oauthLoading}
            >
              <HiX />
            </button>
            
            <svg width="36" height="36" viewBox="0 0 18 18" style={{ marginBottom: 12 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.711a5.41 5.41 0 0 1-.282-1.71c0-.593.102-1.17.282-1.711V4.957H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.043l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.463 1.077 11.427 0 9 0A8.997 8.997 0 0 0 .957 4.957l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z"/>
            </svg>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-main)' }}>Đăng nhập bằng Google</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>để tiếp tục liên kết tài khoản đến EduPath AI</p>

            {oauthLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: 12 }}>
                <div className="progress-spinner" style={{ width: 36, height: 36, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Đang kết nối xác thực Google...</span>
              </div>
            ) : (
              <div className="oauth-account-list">
                <div className="oauth-account-item" onClick={() => handleSelectOAuthAccount('student@gmail.com')}>
                  <div className="leaderboard-avatar" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>MA</div>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Nguyễn Minh Anh (Học sinh)</h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>student@gmail.com</span>
                  </div>
                </div>
                <div className="oauth-account-item" onClick={() => handleSelectOAuthAccount('teacher@gmail.com')}>
                  <div className="leaderboard-avatar" style={{ background: 'rgba(9,132,227,0.1)', color: '#0984E3' }}>TA</div>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Thầy Thế Anh (Giáo viên)</h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>teacher@gmail.com</span>
                  </div>
                </div>
              </div>
            )}
            
            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '14px 0 0' }}>EduPath cam kết bảo mật tuyệt đối thông tin và không tự ý chia sẻ tài khoản Google của bạn.</p>
          </div>
        </div>
      )}

      {/* ── MOCK INBOX DRAWER FOR FORGOT PASSWORD ── */}
      {showInbox && resetSuccess && (
        <div className="mock-inbox-overlay">
          <div className="mock-inbox-header">
            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>📬 Hộp Thư Thử Nghiệm (Mock Inbox)</span>
            <button 
              onClick={() => setShowInbox(false)} 
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div className="mock-inbox-content">
            <div className="mock-email-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span>Người gửi: <strong>support@edupath.vn</strong></span>
                <span>Vừa xong</span>
              </div>
              <h4 style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                Yêu cầu khôi phục mật khẩu tài khoản EduPath
              </h4>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                Xin chào, hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>{resetEmail}</strong>. Vui lòng bấm nút dưới đây để hoàn tất:
              </p>
              <button 
                className="btn-primary" 
                style={{ padding: '8px 16px', fontSize: '11px', width: '100%', borderRadius: 'var(--radius-sm)' }}
                onClick={() => {
                  setMode('reset_password');
                  setShowInbox(false);
                  setSuccessMessage('');
                  setErrorMessage('');
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                🔑 Đặt Lại Mật Khẩu Mới
              </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

function DemoHint() {
  const [open, setOpen] = useState(false);
  return (
    <div className="demo-hint-box">
      <button className="demo-hint-toggle" onClick={() => setOpen(!open)}>
        🔑 Tài khoản demo thử nghiệm {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="demo-hint-content">
          <div><strong>Học sinh:</strong> student@gmail.com / student123</div>
          <div><strong>Giáo viên:</strong> teacher@gmail.com / teacher123</div>
          <div><strong>Admin:</strong> admin@edupath.vn / admin123</div>
        </div>
      )}
    </div>
  );
}
