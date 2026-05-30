import {
  HiHome, HiAcademicCap, HiBookOpen, HiClipboardCheck,
  HiLightBulb, HiClock, HiChartBar, HiCollection,
  HiChat, HiCog, HiStar, HiArrowUp, HiDatabase, HiTerminal, HiUsers, HiTrendingUp
} from 'react-icons/hi';

const navConfigs = {
  student: [
    { icon: HiHome, label: 'Trang chủ', id: 'home' },
    { icon: HiAcademicCap, label: 'Lộ trình học AI', id: 'path' },
    { icon: HiBookOpen, label: 'Kho khóa học', id: 'courses' },
    { icon: HiClipboardCheck, label: 'Kiểm tra trực tuyến', id: 'tests' },
    { icon: HiChat, label: 'Diễn đàn học tập', id: 'forum' },
    { icon: HiChat, label: 'Hỏi đáp AI / Giáo viên', id: 'ai-qa' },
    { icon: HiCollection, label: 'Thư viện tài liệu', id: 'library' },
    { icon: HiCog, label: 'Thiết lập profile', id: 'settings' }
  ],
  teacher: [
    { icon: HiHome, label: 'Quản lý khóa học', id: 'home' },
    { icon: HiChat, label: 'Diễn đàn học tập', id: 'forum' },
    { icon: HiDatabase, label: 'Ngân hàng câu hỏi', id: 'questions' },
    { icon: HiChartBar, label: 'Thống kê lớp học', id: 'stats' }
  ],
  admin: [
    { icon: HiTerminal, label: 'Nhật ký Live logs', id: 'home' },
    { icon: HiUsers, label: 'Quản lý tài khoản', id: 'users' },
    { icon: HiClipboardCheck, label: 'Phê duyệt khóa học', id: 'courses' },
    { icon: HiCollection, label: 'Gửi thông báo', id: 'announcements' },
    { icon: HiTrendingUp, label: 'Thống kê tài chính', id: 'finance' },
    { icon: HiCog, label: 'Cấu hình tham số AI', id: 'ai-config' }
  ]
};

export default function Sidebar({ role, active, setActive, userProfile, onLogout }) {
  // If guest, we do not render a sidebar or render a minimal one
  if (role === 'guest') return null;

  const items = navConfigs[role] || [];

  return (
    <aside className="sidebar">
      <div 
        className="sidebar-logo" 
        onClick={() => setActive('landing')}
        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        title="Quay lại Trang chủ Công khai"
      >
        <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #6C5CE7, #FD79A8)' }}>E</div>
        <div className="logo-text">
          <h1>EduPath AI</h1>
          <p>Học đúng hướng · Thi đúng đích</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => setActive(item.id)}
          >
            <span className="nav-icon"><item.icon /></span>
            {item.label}
          </button>
        ))}
      </nav>

      {role === 'student' && (
        <div className="sidebar-upgrade">
          <div className="upgrade-badge">
            <HiStar /> Nâng cấp PRO
          </div>
          <p>Trải nghiệm toàn bộ tính năng AI và lộ trình cá nhân hóa nâng cao.</p>
          <button className="upgrade-btn">
            <HiArrowUp style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Nâng cấp ngay
          </button>
        </div>
      )}

      <div className="sidebar-user" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="user-avatar" style={{ background: role === 'admin' ? '#E74C3C' : (role === 'teacher' ? '#0984E3' : '#6C5CE7') }}>
            {userProfile?.avatar || 'U'}
          </div>
          <div className="user-info">
            <h4 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {userProfile?.name || 'Tài khoản'}
            </h4>
            <p>{role === 'student' ? `Lớp ${userProfile?.grade} – ${userProfile?.combo}` : role.toUpperCase()}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '6px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)',
            fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-red)';
            e.currentTarget.style.color = 'var(--accent-red)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          Đăng xuất an toàn
        </button>
      </div>
    </aside>
  );
}
