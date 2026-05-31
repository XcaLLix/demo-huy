import { useState } from 'react';
import { HiMail, HiLockClosed, HiUser, HiBookOpen, HiArrowLeft, HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle, HiX } from 'react-icons/hi';
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
  const [phone, setPhone] = useState('');

  // New Upgraded States for Capstone Logic
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Simulated OTP States
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [typedOtp, setTypedOtp] = useState('');

  // Custom Google OAuth States
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [newGoogleRole, setNewGoogleRole] = useState('student');
  const [newGoogleCombo, setNewGoogleCombo] = useState('A01 (Toán – Lý – Anh)');
  const [googleOAuthError, setGoogleOAuthError] = useState('');

  const switchMode = (m) => {
    setMode(m);
    setErrorMessage('');
    setSuccessMessage('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setTypedOtp('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (mode === 'login') {
        if ((email.toLowerCase() === 'admin@edupath.vn' || email.toLowerCase() === 'tranvanthuan2005tt@gmail.com') && password === 'admin123') {
          addLog('Quản trị viên đăng nhập thành công', 'sys');
          onAuthSuccess({ name: email.toLowerCase() === 'tranvanthuan2005tt@gmail.com' ? 'Trần Văn Thuận' : 'Quản trị viên Hệ thống', email: email.toLowerCase(), role: 'admin', avatar: 'AD' });
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
        
        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setTypedOtp('');
        
        addLog(`Yêu cầu khôi phục mật khẩu (Simulated OTP): ${resetEmail}`, 'sys');
        setResetSuccess(true);
        setShowInbox(true); // Open mock inbox to show simulated mail

      } else if (mode === 'reset_password') {
        if (typedOtp !== generatedOtp) {
          setErrorMessage('Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
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

  const handleCustomGoogleSubmit = () => {
    if (!customGoogleEmail.trim()) {
      setGoogleOAuthError('Vui lòng nhập địa chỉ email Google.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customGoogleEmail)) {
      setGoogleOAuthError('Địa chỉ email không hợp lệ.');
      return;
    }

    setOauthLoading(true);
    setGoogleOAuthError('');

    setTimeout(() => {
      setOauthLoading(false);
      
      const matched = usersList.find(u => u.email.toLowerCase() === customGoogleEmail.toLowerCase());
      
      if (matched) {
        if (matched.isBanned) {
          setGoogleOAuthError('Tài khoản này đã bị khóa do vi phạm chính sách.');
          return;
        }
        if (matched.status === 'pending') {
          setGoogleOAuthError('Tài khoản Giáo viên này đang chờ Admin phê duyệt.');
          return;
        }
        setShowGoogleOAuth(false);
        addLog(`Đăng nhập thành công qua Google OAuth: ${matched.email}`, 'sys');
        onAuthSuccess(matched);
      } else {
        const prefix = customGoogleEmail.split('@')[0];
        const computedName = prefix.split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Người dùng Google';
        
        const newGoogleUser = {
          id: Date.now(),
          name: computedName,
          email: customGoogleEmail,
          password: 'google_oauth_no_password_2026',
          role: newGoogleRole,
          combo: newGoogleRole === 'student' ? newGoogleCombo : '',
          grade: newGoogleRole === 'student' ? '12' : '',
          avatar: computedName.substring(0, 2).toUpperCase(),
          isBanned: false,
          status: newGoogleRole === 'teacher' ? 'pending' : 'active',
          unlockedCourses: newGoogleRole === 'student' ? [1] : [],
        };

        onAuthSuccess(null, newGoogleUser); // Save to usersList in App.jsx

        if (newGoogleRole === 'teacher') {
          setSuccessMessage('Đăng ký Giáo viên Google thành công! Tài khoản đang chờ Admin phê duyệt.');
          setEmail(customGoogleEmail);
          setMode('login');
          setShowGoogleOAuth(false);
        } else {
          addLog(`Đăng ký tài khoản Học sinh mới qua Google OAuth: "${computedName}" (${customGoogleEmail})`, 'sys');
          onAuthSuccess(newGoogleUser); // Instantly login student
          setShowGoogleOAuth(false);
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
      {/* Standalone Floating Wide Card Container */}
      <div className="auth-floating-container">
        
        {/* Peaking Half-circle Sun Mascot behind the top border */}
        <div className="auth-peaking-sun-container">
          <div className="auth-peaking-sun">
            {/* Cute sun with eyes and mouth */}
            <svg viewBox="0 0 200 100" className="auth-peaking-sun-svg">
              <path d="M 20 100 A 80 80 0 0 1 180 100 Z" fill="#FFA502" stroke="#000000" strokeWidth="3" />
              {/* Sun rays ripple border */}
              <path d="M 20 100 Q 15 85 5 100" fill="none" stroke="#000000" strokeWidth="3" />
              <path d="M 180 100 Q 185 85 195 100" fill="none" stroke="#000000" strokeWidth="3" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="#FFA502" strokeWidth="5" strokeDasharray="12 8" />
              
              {/* Smiling eyes */}
              <circle cx="85" cy="72" r="3.5" fill="#000" />
              <circle cx="115" cy="72" r="3.5" fill="#000" />
              
              {/* Chattering smile mouth */}
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
              {mode !== 'forgot' && mode !== 'reset_password' ? (
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
                  {mode === 'forgot' ? 'QUÊN MẬT KHẨU' : 'OTP XÁC THỰC'}
                </button>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="auth-card-body">
            
            {/* Back button */}
            <button className="auth-back-btn" onClick={onBackToLanding}>
              <HiArrowLeft /> Về trang chủ
            </button>

            {/* Title / Subheading */}
            <div className="auth-form-header">
              <h2>
                {mode === 'login' && 'Chào mừng trở lại 👋'}
                {mode === 'signup' && 'Tạo tài khoản mới ✨'}
                {mode === 'forgot' && 'Khôi phục mật khẩu 🔑'}
                {mode === 'reset_password' && 'Đặt lại mật khẩu mới 🛡️'}
              </h2>
              <p>
                {mode === 'login' && 'Đăng nhập để tiếp tục lộ trình học tập của bạn.'}
                {mode === 'signup' && 'Đăng ký miễn phí và bắt đầu học tập tại EduPath ngay hôm nay.'}
                {mode === 'forgot' && 'Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP xác nhận ngay.'}
                {mode === 'reset_password' && 'Mã OTP đã được gửi đến email của bạn. Hãy đổi mật khẩu.'}
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

            {/* Forms rendering */}
            {/* 1. FORGOT PASSWORD FORM */}
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

            {/* 2. RESET PASSWORD FORM */}
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

            {/* 3. LOGIN & SIGNUP FORM */}
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
                  </div>
                </div>

                {/* Additional parameters for student/teacher targets selection */}
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

                {/* Submit button olive green */}
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

            {/* Demo Hint Collapsible inside body */}
            {mode === 'login' && <DemoHint />}

            <div className="auth-footer-lock">
              <span>🛡️ THÔNG TIN ĐƯỢC BẢO MẬT TUYỆT ĐỐI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── GOOGLE OAUTH POPUP SIMULATION MODAL ── */}
      {showGoogleOAuth && (
        <div className="checkout-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="checkout-modal oauth-modal animate-in" style={{ padding: '30px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', maxWidth: '420px', width: '90%' }}>
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

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Xác thực Google (OAuth)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>để kết nối tài khoản đến EduPath AI</p>

            {oauthLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: 12 }}>
                <div className="progress-spinner" style={{ width: 36, height: 36, border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Đang kết nối xác thực Google...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="oauth-account-list">
                  <div className="oauth-account-item" onClick={() => handleSelectOAuthAccount('student@gmail.com')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: '8px' }}>
                    <div className="leaderboard-avatar" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '12px' }}>MA</div>
                    <div>
                      <h5 style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Nguyễn Minh Anh (Học sinh)</h5>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>student@gmail.com</span>
                    </div>
                  </div>
                  <div className="oauth-account-item" onClick={() => handleSelectOAuthAccount('teacher@gmail.com')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    <div className="leaderboard-avatar" style={{ background: 'rgba(9,132,227,0.1)', color: '#0984E3', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '12px' }}>TA</div>
                    <div>
                      <h5 style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Thầy Thế Anh (Giáo viên)</h5>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>teacher@gmail.com</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Hoặc dùng tài khoản Google khác</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
                </div>

                {googleOAuthError && (
                  <div style={{ color: 'var(--accent-red)', fontSize: '11.5px', padding: '8px 12px', background: 'rgba(231,76,60,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HiExclamationCircle />
                    {googleOAuthError}
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Địa chỉ Email Google của bạn:</label>
                  <div className="auth-input-wrap" style={{ margin: 0 }}>
                    <HiMail className="auth-input-icon" />
                    <input 
                      type="email" 
                      placeholder="ten.ban@gmail.com" 
                      value={customGoogleEmail}
                      onChange={e => {
                        setCustomGoogleEmail(e.target.value);
                        setGoogleOAuthError('');
                      }}
                      style={{ fontSize: '12.5px', padding: '10px 10px 10px 36px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>THIẾT LẬP VAI TRÒ (Nếu chưa có tài khoản):</div>
                  <div className="auth-role-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label className={`auth-role-option${newGoogleRole === 'student' ? ' selected' : ''}`} style={{ fontSize: '11.5px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', textAlign: 'center' }}>
                      <input type="radio" name="googleRole" value="student" checked={newGoogleRole === 'student'} onChange={() => setNewGoogleRole('student')} style={{ display: 'none' }} />
                      <span>🎒 Học sinh</span>
                    </label>
                    <label className={`auth-role-option${newGoogleRole === 'teacher' ? ' selected' : ''}`} style={{ fontSize: '11.5px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', textAlign: 'center' }}>
                      <input type="radio" name="googleRole" value="teacher" checked={newGoogleRole === 'teacher'} onChange={() => setNewGoogleRole('teacher')} style={{ display: 'none' }} />
                      <span>🎓 Giáo viên</span>
                    </label>
                  </div>

                  {newGoogleRole === 'student' && (
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <label style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-secondary)' }}>Khối thi mục tiêu:</label>
                      <select 
                        value={newGoogleCombo} 
                        onChange={e => setNewGoogleCombo(e.target.value)} 
                        style={{ fontSize: '11.5px', padding: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                      >
                        <option value="A01 (Toán – Lý – Anh)">A01 — Toán, Lý, Anh</option>
                        <option value="B00 (Toán – Hóa – Sinh)">B00 — Toán, Hóa, Sinh</option>
                        <option value="D01 (Toán – Văn – Anh)">D01 — Toán, Văn, Anh</option>
                      </select>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
                  onClick={handleCustomGoogleSubmit}
                >
                  Xác nhận Tiếp tục với Google
                </button>
              </div>
            )}
            
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '14px 0 0', lineHeight: '1.4' }}>EduPath cam kết bảo mật tuyệt đối thông tin và không tự ý chia sẻ tài khoản Google của bạn.</p>
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
              <h4 style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                Mã xác thực khôi phục mật khẩu tài khoản EduPath
              </h4>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 10px 0' }}>
                Xin chào, mã xác thực OTP dùng để khôi phục mật khẩu tài khoản liên kết với email <strong>{resetEmail}</strong> là:
              </p>
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px dashed var(--primary)', margin: '10px 0 14px 0' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>MÃ OTP XÁC THỰC CỦA BẠN:</span>
                <strong style={{ fontSize: '24px', color: 'var(--primary)', letterSpacing: '4px' }}>{generatedOtp}</strong>
              </div>
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
                🔑 Bấm Vào Đây Để Nhập OTP & Đổi Mật Khẩu
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
