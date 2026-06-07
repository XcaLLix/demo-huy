import { useState, useEffect } from 'react';
import { HiSearch, HiBell, HiSun, HiMoon, HiLockClosed, HiLogout, HiX, HiChevronRight, HiCheck, HiExclamation } from 'react-icons/hi';

const breadcrumbMap = {
  home: ['Trang chủ'],
  path: ['Trang chủ', 'Lộ trình AI'],
  courses: ['Trang chủ', 'Kho khóa học'],
  tests: ['Trang chủ', 'Kiểm tra trực tuyến'],
  forum: ['Trang chủ', 'Diễn đàn'],
  'ai-qa': ['Trang chủ', 'Hỏi đáp AI'],
  library: ['Trang chủ', 'Thư viện'],
  settings: ['Trang chủ', 'Cài đặt'],
  users: ['Quản trị', 'Tài khoản'],
  courses_admin: ['Quản trị', 'Phê duyệt khóa học'],
  announcements: ['Quản trị', 'Thông báo'],
  finance: ['Quản trị', 'Tài chính'],
  'ai-config': ['Quản trị', 'Cấu hình AI'],
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return { greet: 'Chào buổi sáng', emoji: '🌤️' };
  if (h < 17) return { greet: 'Chào buổi chiều', emoji: '☀️' };
  return { greet: 'Chào buổi tối', emoji: '🌙' };
}

export default function Header({ role, userProfile, theme, onToggleTheme, notifications, onClearNotifications, onLogout, onChangePassword, addLog, activeTab }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passMsg, setPassMsg] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { greet, emoji } = getTimeOfDay();
  const unreadCount = notifications.filter(n => !n.read).length;
  const crumbs = breadcrumbMap[activeTab] || ['Trang chủ'];

  const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassMsg({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự!' }); return; }
    if (newPass !== confirmNewPass) { setPassMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' }); return; }
    onChangePassword(oldPass, newPass);
    setPassMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    setTimeout(() => { setOldPass(''); setNewPass(''); setConfirmNewPass(''); setPassMsg(null); setShowChangePassModal(false); }, 1200);
  };

  const closeAll = () => { setShowNotif(false); setShowProfileMenu(false); };

  return (
    <>
      <div className="main-header-v2 animate-in">
        {/* Left: Breadcrumb + Greeting */}
        <div className="header-left">
          <div className="header-breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <HiChevronRight style={{ color: 'var(--text-muted)', fontSize: 12 }} />}
                <span style={{ color: i === crumbs.length - 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c}</span>
              </span>
            ))}
          </div>
          <div className="header-greeting">
            <span className="header-greeting-emoji">{emoji}</span>
            <div>
              <h2>
                {role === 'admin' ? 'Xin chào, Quản trị viên!' :
                 role === 'teacher' ? `Kính chào Thầy/Cô ${userProfile?.name?.split(' ').slice(-1)[0]}!` :
                 `${greet}, ${userProfile?.name?.split(' ').slice(-1)[0] || 'bạn'}!`}
              </h2>
              <p>
                {role === 'admin' ? 'Hệ thống đang hoạt động ổn định. Chào mừng trở lại.' :
                 role === 'teacher' ? 'Hôm nay Thầy/Cô muốn tạo bài học gì?' :
                 'Hôm nay bạn muốn chinh phục kiến thức nào?'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="header-right">
          {/* Date/Time chip */}
          <div className="header-datetime">
            <span className="header-time">{formatTime(currentTime)}</span>
            <span className="header-date">{formatDate(currentTime)}</span>
          </div>

          {/* Search */}
          {role === 'student' && (
            <div className={`header-search ${searchVal ? 'focused' : ''}`}>
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm bài học, đề thi..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
              {searchVal && (
                <button onClick={() => setSearchVal('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <HiX style={{ fontSize: 14 }} />
                </button>
              )}
            </div>
          )}

          {/* Theme */}
          <button className="header-icon-btn" onClick={onToggleTheme} title={theme === 'dark' ? 'Sáng' : 'Tối'}>
            {theme === 'dark' ? <HiSun style={{ color: '#FFD700' }} /> : <HiMoon style={{ color: '#6C5CE7' }} />}
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              className={`header-icon-btn ${unreadCount > 0 ? 'has-notif' : ''}`}
              onClick={() => { setShowNotif(v => !v); setShowProfileMenu(false); }}
            >
              <HiBell />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {showNotif && (
              <div className="notif-panel animate-in" onClick={e => e.stopPropagation()}>
                <div className="notif-panel-header">
                  <div>
                    <strong>Thông báo</strong>
                    {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} mới</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {unreadCount > 0 && (
                      <button className="notif-action-btn" onClick={() => { onClearNotifications(); }}>
                        <HiCheck style={{ marginRight: 3 }} /> Đọc hết
                      </button>
                    )}
                    <button className="notif-action-btn icon-only" onClick={() => setShowNotif(false)}><HiX /></button>
                  </div>
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <div style={{ fontSize: 32 }}>🔔</div>
                      <p>Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                        <div className="notif-dot" style={{ opacity: n.read ? 0 : 1 }} />
                        <div className="notif-body">
                          <p>{n.text}</p>
                          <span>{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar + Profile Menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="header-avatar-btn"
              onClick={() => { setShowProfileMenu(v => !v); setShowNotif(false); }}
              style={{ '--role-color': role === 'admin' ? '#E74C3C' : role === 'teacher' ? '#0984E3' : '#6C5CE7' }}
            >
              {userProfile?.avatar && (userProfile.avatar.startsWith('http') || userProfile.avatar.startsWith('data:')) ? (
                <img src={userProfile.avatar} alt="" />
              ) : (
                <span>{userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : 'U'}</span>
              )}
              {userProfile?.isPro && <span className="pro-ring" />}
            </button>

            {showProfileMenu && (
              <div className="profile-menu animate-in" onClick={e => e.stopPropagation()}>
                <div className="profile-menu-header">
                  <div className="pm-avatar" style={{ background: role === 'admin' ? '#E74C3C' : role === 'teacher' ? '#0984E3' : '#6C5CE7' }}>
                    {userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{userProfile?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{userProfile?.email}</div>
                    {userProfile?.isPro && <span className="pm-pro-badge">⭐ PRO</span>}
                  </div>
                </div>
                <div className="profile-menu-divider" />
                <button className="profile-menu-item" onClick={() => { setShowChangePassModal(true); setShowProfileMenu(false); }}>
                  <HiLockClosed /> Đổi mật khẩu
                </button>
                <button className="profile-menu-item danger" onClick={() => { onLogout(); setShowProfileMenu(false); }}>
                  <HiLogout /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      {(showNotif || showProfileMenu) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={closeAll} />
      )}

      {/* Change Password Modal */}
      {showChangePassModal && (
        <div className="modal-overlay">
          <div className="modal-box animate-in" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>🔒 Đổi mật khẩu bảo mật</h3>
              <button className="modal-close" onClick={() => setShowChangePassModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handlePasswordChange} className="modal-body">
              {passMsg && (
                <div className={`form-msg ${passMsg.type}`}>
                  {passMsg.type === 'error' ? <HiExclamation /> : <HiCheck />} {passMsg.text}
                </div>
              )}
              <div className="form-field">
                <label>Mật khẩu hiện tại</label>
                <input type="password" className="form-control" value={oldPass} onChange={e => setOldPass(e.target.value)} required placeholder="••••••••" />
              </div>
              <div className="form-field">
                <label>Mật khẩu mới</label>
                <input type="password" className="form-control" value={newPass} onChange={e => setNewPass(e.target.value)} required placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div className="form-field">
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" className="form-control" value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)} required placeholder="Nhập lại mật khẩu mới" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8, padding: '12px' }}>
                Cập nhật mật khẩu
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
