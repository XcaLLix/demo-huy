import {
  HiHome, HiAcademicCap, HiBookOpen, HiClipboardCheck,
  HiLightBulb, HiChartBar, HiCollection,
  HiChat, HiCog, HiStar, HiArrowUp, HiDatabase, HiTerminal, HiUsers, HiTrendingUp,
  HiMap, HiShieldCheck, HiBadgeCheck
} from 'react-icons/hi';

const navGroups = {
  student: [
    {
      groupLabel: '📖 Học tập',
      items: [
        { label: 'Trang chủ', id: 'home', icon: HiHome },
        { label: 'Khóa học', id: 'courses', icon: HiAcademicCap },
        { label: 'Lộ trình AI', id: 'path', icon: HiMap },
      ],
    },
    {
      groupLabel: '✏️ Luyện tập',
      items: [
        { label: 'Thi thử THPTQG', id: 'tests', icon: HiClipboardCheck },
        { label: 'Ngân hàng đề', id: 'library', icon: HiBookOpen },
      ],
    },
    {
      groupLabel: '🌐 Cộng đồng',
      items: [
        { label: 'AI Gia sư', id: 'ai-qa', icon: HiLightBulb },
        { label: 'Cộng đồng', id: 'forum', icon: HiChat },
      ],
    },
    {
      groupLabel: '🏆 Thành tích',
      items: [
        { label: 'Bảng xếp hạng', id: 'leaderboard', icon: HiChartBar },
      ],
    },
  ],
  teacher: [
    {
      groupLabel: 'Quản lý',
      items: [
        { icon: HiHome, label: 'Quản lý khóa học', id: 'home' },
        { icon: HiChat, label: 'Diễn đàn học tập', id: 'forum' },
        { icon: HiDatabase, label: 'Ngân hàng câu hỏi', id: 'questions' },
        { icon: HiChartBar, label: 'Thống kê lớp học', id: 'stats' },
      ],
    },
  ],
  admin: [
    {
      groupLabel: 'Hệ thống',
      items: [
        { icon: HiTerminal, label: 'Live Logs', id: 'home' },
        { icon: HiUsers, label: 'Quản lý tài khoản', id: 'users' },
        { icon: HiClipboardCheck, label: 'Phê duyệt khóa học', id: 'courses' },
        { icon: HiChat, label: 'Diễn đàn', id: 'forum' },
        { icon: HiCollection, label: 'Gửi thông báo', id: 'announcements' },
        { icon: HiTrendingUp, label: 'Thống kê tài chính', id: 'finance' },
        { icon: HiCog, label: 'Cấu hình AI', id: 'ai-config' },
      ],
    },
  ],
};

export default function Sidebar({ role, active, setActive, userProfile, onLogout, onUpgradePRO }) {
  if (role === 'guest') return null;

  const groups = navGroups[role] || [];
  const isPro = userProfile?.isPro;

  return (
    <aside className="sidebar sidebar--v2">
      {/* Logo */}
      <div
        className="sidebar-logo sidebar-logo--v2"
        onClick={() => setActive('landing')}
        style={{ cursor: 'pointer' }}
        title="Quay lại Trang chủ"
      >
        <div className="logo-icon logo-icon--v2">E</div>
        <div className="logo-text">
          <h1>EduPath AI</h1>
          <p>Học đúng hướng · Thi đúng đích</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="sidebar-nav sidebar-nav--v2">
        {groups.map((group, gi) => (
          <div key={gi} className="sidebar-nav-group">
            <span className="sidebar-nav-group__label">{group.groupLabel}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item nav-item--v2 ${isActive ? 'nav-item--active' : ''}`}
                  onClick={() => setActive(item.id)}
                  id={`sidebar-nav-${item.id}`}
                >
                  {Icon && (
                    <span className="nav-item__icon">
                      <Icon />
                    </span>
                  )}
                  <span className="nav-item__label">{item.label}</span>
                  {isActive && <span className="nav-item__indicator" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* PRO upgrade banner (student only, non-PRO) */}
      {role === 'student' && !isPro && (
        <div className="sidebar-upgrade sidebar-upgrade--v2">
          <div className="sidebar-upgrade__icon">⭐</div>
          <div className="sidebar-upgrade__body">
            <strong>Nâng cấp PRO</strong>
            <p>Mở toàn bộ AI nâng cao & lộ trình cá nhân hóa</p>
          </div>
          <button
            className="sidebar-upgrade__btn"
            onClick={onUpgradePRO}
            id="sidebar-upgrade-pro-btn"
          >
            Nâng cấp
          </button>
        </div>
      )}

      {/* User footer */}
      <div className="sidebar-user sidebar-user--v2">
        <div className="sidebar-user__avatar-wrap">
          {userProfile?.avatar && (userProfile.avatar.startsWith('data:') || userProfile.avatar.startsWith('http') || userProfile.avatar.length > 10) ? (
            <img
              src={userProfile.avatar.startsWith('data:') || userProfile.avatar.startsWith('http') ? userProfile.avatar : `data:image/png;base64,${userProfile.avatar}`}
              alt="Avatar"
              className="sidebar-user__avatar-img"
            />
          ) : (
            <div
              className="sidebar-user__avatar-text"
              style={{
                background: isPro
                  ? 'linear-gradient(135deg, #FFE259, #FFA751)'
                  : role === 'admin' ? '#E74C3C' : role === 'teacher' ? '#0984E3' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              }}
            >
              {userProfile?.avatar && userProfile.avatar.length <= 10
                ? userProfile.avatar
                : (userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : 'U')}
            </div>
          )}
          {isPro && <span className="sidebar-user__pro-badge">PRO</span>}
        </div>

        <div className="sidebar-user__info">
          <h4
            className="sidebar-user__name"
            style={{ color: isPro ? '#FFA751' : 'var(--text-main)' }}
          >
            {userProfile?.name || 'Tài khoản'}
          </h4>
          <p className="sidebar-user__role">
            {role === 'student'
              ? (isPro ? '⭐ HỌC VIÊN PRO' : `Lớp ${userProfile?.grade || 12} · ${userProfile?.combo || 'A01'}`)
              : role.toUpperCase()}
          </p>
        </div>

        <button
          className="sidebar-user__logout"
          onClick={onLogout}
          title="Đăng xuất"
          id="sidebar-logout-btn"
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}
