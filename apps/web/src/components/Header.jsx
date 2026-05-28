import { useState } from 'react';
import { HiSearch, HiBell, HiSun, HiMoon, HiUser, HiLockClosed, HiLogout, HiX } from 'react-icons/hi';

export default function Header({
  role,
  userProfile,
  theme,
  onToggleTheme,
  notifications,
  onClearNotifications,
  onLogout,
  onChangePassword,
  addLog
}) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  // Password change states
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const getGreeting = () => {
    if (role === 'admin') return 'Chào Quản trị viên! 🛡️';
    if (role === 'teacher') return `Kính chào Thầy/Cô ${userProfile?.name}! 🎓`;
    return `Chào lại, ${userProfile?.name}! 👋`;
  };

  const getSubtitle = () => {
    if (role === 'admin') return 'Hệ thống đang hoạt động ổn định.';
    if (role === 'teacher') return 'Hôm nay Thầy/Cô muốn chuẩn bị học liệu nào?';
    return 'Hôm nay bạn muốn chinh phục kiến thức nào?';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!oldPass || !newPass) return;
    if (newPass.length < 6) {
      alert('Mật khẩu mới phải từ 6 ký tự trở lên!');
      return;
    }
    onChangePassword(oldPass, newPass);
    setOldPass('');
    setNewPass('');
    setShowChangePassModal(false);
  };

  return (
    <div className="main-header animate-in" style={{ position: 'relative' }}>
      <div>
        <h2>{getGreeting()}</h2>
        <p>{getSubtitle()}</p>
      </div>

      <div className="header-actions">
        {role === 'student' && (
          <div className="search-box">
            <HiSearch className="search-icon" />
            <input type="text" placeholder="Tìm kiếm bài học, bài tập..." />
          </div>
        )}

        {/* Theme Switcher Toggle */}
        <button
          className="header-icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? <HiSun style={{ color: '#FFD700' }} /> : <HiMoon style={{ color: '#6C5CE7' }} />}
        </button>

        {/* Notification Bell */}
        <button
          className="header-icon-btn"
          onClick={() => {
            setShowNotif(!showNotif);
            setShowProfileMenu(false);
          }}
          id="notifications-btn"
        >
          <HiBell />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>

        {/* User initials triggering profile menu */}
        <div
          className="header-avatar"
          style={{ background: role === 'admin' ? '#E74C3C' : (role === 'teacher' ? '#0984E3' : '#6C5CE7') }}
          onClick={() => {
            setShowProfileMenu(!showProfileMenu);
            setShowNotif(false);
          }}
        >
          {userProfile?.avatar || 'U'}
        </div>

        {/* Notification Dropdown Drawer */}
        {showNotif && (
          <div
            style={{
              position: 'absolute', top: '55px', right: '60px',
              width: '320px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)', zIndex: 1000, padding: '16px',
              animation: 'fadeInUp 0.2s ease forwards'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>THÔNG BÁO ({unreadCount})</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    onClearNotifications();
                    setShowNotif(false);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '8px 10px', borderRadius: '4px',
                      background: n.read ? 'transparent' : 'var(--primary-bg)',
                      borderLeft: n.read ? 'none' : '3px solid var(--primary)',
                      fontSize: '11.5px', lineHeight: '1.4'
                    }}
                  >
                    <p style={{ color: 'var(--text-primary)', fontWeight: n.read ? 'normal' : '600' }}>{n.text}</p>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{n.time}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Không có thông báo mới.</p>
              )}
            </div>
          </div>
        )}

        {/* User Profile dropdown menu */}
        {showProfileMenu && (
          <div className="profile-dropdown-card" style={{ right: '10px', top: '55px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{userProfile?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{userProfile?.email}</div>
            </div>
            <button
              className="dropdown-item"
              onClick={() => {
                setShowChangePassModal(true);
                setShowProfileMenu(false);
              }}
            >
              <HiLockClosed /> Đổi mật khẩu
            </button>
            <button
              className="dropdown-item"
              style={{ color: 'var(--accent-red)' }}
              onClick={() => {
                onLogout();
                setShowProfileMenu(false);
              }}
            >
              <HiLogout /> Đăng xuất an toàn
            </button>
          </div>
        )}
      </div>

      {/* UC-04 Change Password Modal */}
      {showChangePassModal && (
        <div className="checkout-overlay">
          <div className="checkout-modal animate-in" style={{ maxWidth: '400px' }}>
            <button
              onClick={() => setShowChangePassModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
            >
              <HiX />
            </button>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>ĐỔI MẬT KHẨU BẢO MẬT (UC-04)</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11.5px', fontWeight: '600' }}>Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  className="form-control"
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '11.5px', fontWeight: '600' }}>Mật khẩu mới:</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                Cập nhật mật khẩu mới
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
