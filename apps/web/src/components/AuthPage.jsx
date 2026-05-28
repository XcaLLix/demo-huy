import { useState } from 'react';
import { HiMail, HiLockClosed, HiUser, HiBookOpen, HiIdentification, HiArrowLeft } from 'react-icons/hi';

export default function AuthPage({ defaultMode = 'login', onAuthSuccess, usersList, addLog }) {
  const [mode, setMode] = useState(defaultMode); // 'login', 'signup', or 'forgot'
  
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [combo, setCombo] = useState('A01 (Toán – Lý – Anh)');
  const [userRole, setUserRole] = useState('student'); // 'student' or 'teacher'

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'login') {
      // Validate login
      if (email === 'admin@edupath.vn' && password === 'admin123') {
        const adminUser = {
          name: 'Quản trị viên Hệ thống',
          email: 'admin@edupath.vn',
          role: 'admin',
          avatar: 'AD'
        };
        addLog(`Quản trị viên đăng nhập hệ thống thành công`, 'sys');
        onAuthSuccess(adminUser);
        return;
      }

      // Check registered list
      const matched = usersList.find(u => u.email === email && u.password === password);
      if (matched) {
        if (matched.isBanned) {
          setErrorMessage('Tài khoản của bạn đã bị Quản trị viên khóa do vi phạm chính sách của hệ thống.');
          addLog(`Đăng nhập thất bại: Tài khoản bị khóa (${email})`, 'sys');
          return;
        }
        if (matched.status === 'pending') {
          setErrorMessage('Tài khoản Giáo viên đang chờ Quản trị viên duyệt hồ sơ. Vui lòng thử lại sau.');
          addLog(`Đăng nhập thất bại: Tài khoản Giáo viên chưa được duyệt (${email})`, 'sys');
          return;
        }

        addLog(`Người dùng "${matched.name}" đăng nhập thành công với vai trò: ${matched.role.toUpperCase()}`, 'sys');
        onAuthSuccess(matched);
      } else {
        setErrorMessage('Email đăng nhập hoặc mật khẩu không chính xác!');
        addLog(`Đăng nhập thất bại: Sai thông tin truy cập (${email})`, 'sys');
      }
    } else if (mode === 'signup') {
      // Sign Up flow
      if (!name.trim() || !email.trim() || !password.trim()) {
        setErrorMessage('Vui lòng nhập đầy đủ các trường thông tin bắt buộc!');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Mật khẩu bảo mật phải có độ dài tối thiểu 6 ký tự!');
        return;
      }

      // Check if email already exists
      const exists = usersList.find(u => u.email === email);
      if (exists || email === 'admin@edupath.vn') {
        setErrorMessage('Địa chỉ Email này đã được đăng ký sử dụng bởi tài khoản khác!');
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
        status: userRole === 'teacher' ? 'pending' : 'active'
      };

      addLog(`Tài khoản mới được đăng ký: "${name}" (${email}) - Vai trò: ${userRole.toUpperCase()}`, 'sys');
      
      if (userRole === 'teacher') {
        alert('Đăng ký tài khoản Giáo viên thành công! Hồ sơ của thầy/cô đã được gửi lên hệ thống kiểm duyệt. Trạng thái: Chờ Admin cấp duyệt.');
        setMode('login');
        setEmail(email);
        setPassword('');
      } else {
        alert('Đăng ký tài khoản Học viên thành công! Hãy đăng nhập để bắt đầu trải nghiệm lộ trình ôn tập.');
        setMode('login');
        setEmail(email);
        setPassword('');
      }
      
      // Save new user trigger back to parent list
      onAuthSuccess(null, newUser); 
    } else {
      // Forgot Password flow
      if (!resetEmail.trim()) return;
      
      addLog(`Yêu cầu khôi phục mật khẩu cho email: ${resetEmail}`, 'sys');
      setResetSuccess(true);
      setTimeout(() => {
        alert(`Mã OTP khôi phục mật khẩu đã được gửi đến email: ${resetEmail}! Vui lòng kiểm tra hộp thư đến.`);
      }, 500);
    }
  };

  return (
    <div className="animate-in" style={{ padding: '40px 0' }}>
      <div className="auth-form-container animate-in" style={{ border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="logo-icon" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6C5CE7, #FD79A8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 auto 10px auto' }}>E</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
            {mode === 'login' ? 'ĐĂNG NHẬP EDUPATH AI' : (mode === 'signup' ? 'ĐĂNG KÝ THÀNH VIÊN MỚI' : 'KHÔI PHỤC MẬT KHẨU')}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Học thông minh · Luyện thi thích ứng THPTQG
          </p>
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(231,76,60,0.1)', color: 'var(--accent-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginBottom: '16px', border: '1px solid rgba(231,76,60,0.2)' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ================= FORGOT PASSWORD LAYOUT ================= */}
        {mode === 'forgot' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {!resetSuccess ? (
              <>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  Vui lòng nhập email tài khoản đã đăng ký của bạn. Chúng tôi sẽ gửi liên kết khôi phục mật khẩu tức thì.
                </p>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '700' }}>Nhập Email khôi phục:</label>
                  <div style={{ position: 'relative' }}>
                    <HiMail style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="form-control"
                      style={{ paddingLeft: '36px', width: '100%' }}
                      placeholder="email@example.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}>
                  Gửi liên kết đặt lại mật khẩu
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ color: 'var(--accent-green)', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>
                  ✓ Đã gửi liên kết thành công!
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
                  Vui lòng kiểm tra hộp thư đến của email <strong>{resetEmail}</strong> để hoàn tất việc lấy lại mật khẩu.
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', width: '100%' }}
              onClick={() => {
                setMode('login');
                setResetSuccess(false);
                setResetEmail('');
              }}
            >
              <HiArrowLeft /> Quay lại Đăng nhập
            </button>
          </form>
        ) : (
          /* ================= LOGIN & REGISTER LAYOUT ================= */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '700' }}>Họ và tên của bạn:</label>
                <div style={{ position: 'relative' }}>
                  <HiUser style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '36px', width: '100%' }}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label style={{ fontSize: '11px', fontWeight: '700' }}>Địa chỉ Email đăng nhập:</label>
              <div style={{ position: 'relative' }}>
                <HiMail style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: '700' }}>Mật khẩu bảo mật:</label>
                {mode === 'login' && (
                  <span
                    onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                    style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '11.5px', fontWeight: 'bold' }}
                  >
                    Quên mật khẩu?
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <HiLockClosed style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '700' }}>Bạn là:</label>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', cursor: 'pointer' }}>
                      <input type="radio" name="roleSelector" checked={userRole === 'student'} onChange={() => setUserRole('student')} />
                      Học sinh ôn thi THPTQG
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', cursor: 'pointer' }}>
                      <input type="radio" name="roleSelector" checked={userRole === 'teacher'} onChange={() => setUserRole('teacher')} />
                      Giảng viên ôn luyện
                    </label>
                  </div>
                </div>

                {userRole === 'student' && (
                  <div className="form-group">
                    <label style={{ fontSize: '11px', fontWeight: '700' }}>Khối thi / Tổ hợp mục tiêu:</label>
                    <div style={{ position: 'relative' }}>
                      <HiBookOpen style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                      <select
                        className="form-control"
                        style={{ paddingLeft: '36px', width: '100%', appearance: 'none' }}
                        value={combo}
                        onChange={e => setCombo(e.target.value)}
                      >
                        <option value="A01 (Toán – Lý – Anh)">A01 (Toán – Lý – Anh)</option>
                        <option value="B00 (Toán – Hóa – Sinh)">B00 (Toán – Hóa – Sinh)</option>
                        <option value="D01 (Toán – Văn – Anh)">D01 (Toán – Văn – Anh)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 'bold', fontSize: '13.5px', marginTop: '6px' }}>
              {mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Đăng ký thành viên'}
            </button>
          </form>
        )}

        {mode !== 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', borderTop: '1px solid var(--border)', paddingTop: '14px', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? (
              <>
                Bạn chưa có tài khoản?{' '}
                <span onClick={() => { setMode('signup'); setErrorMessage(''); }} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Đăng ký ngay
                </span>
              </>
            ) : (
              <>
                Bạn đã có tài khoản thành viên?{' '}
                <span onClick={() => { setMode('login'); setErrorMessage(''); }} style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Đăng nhập
                </span>
              </>
            )}
          </div>
        )}

        {mode === 'login' && (
          <div style={{ marginTop: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '11px', lineHeight: '1.5' }}>
            🔑 <strong>HỆ THỐNG TÀI KHOẢN DEMO THỬ NGHIỆM:</strong><br />
            <div style={{ marginTop: '6px' }}>
              <strong>1. Tài khoản Học sinh (Student):</strong><br />
              - Email: <code style={{ color: 'var(--primary)' }}>student@gmail.com</code> • Mật khẩu: <code style={{ color: 'var(--primary)' }}>student123</code>
            </div>
            <div style={{ marginTop: '6px' }}>
              <strong>2. Tài khoản Giáo viên (Teacher):</strong><br />
              - Email: <code style={{ color: 'var(--primary)' }}>teacher@gmail.com</code> • Mật khẩu: <code style={{ color: 'var(--primary)' }}>teacher123</code>
            </div>
            <div style={{ marginTop: '6px' }}>
              <strong>3. Tài khoản Quản trị viên (Admin):</strong><br />
              - Email: <code style={{ color: 'var(--primary)' }}>admin@edupath.vn</code> • Mật khẩu: <code style={{ color: 'var(--primary)' }}>admin123</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
