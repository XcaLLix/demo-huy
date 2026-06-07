import { useState } from 'react';
import {
  HiHome, HiAcademicCap, HiBookOpen, HiClipboardCheck,
  HiLightBulb, HiChartBar, HiCollection,
  HiChat, HiCog, HiStar, HiArrowUp, HiDatabase, HiTerminal,
  HiUsers, HiTrendingUp, HiSparkles, HiShieldCheck, HiBell,
  HiChevronRight, HiLogout, HiFire
} from 'react-icons/hi';

const navConfigs = {
  student: [
    {
      group: 'TỔNG QUAN',
      items: [
        { icon: HiHome, label: 'Trang chủ', id: 'home', color: '#6C5CE7' },
        { icon: HiAcademicCap, label: 'Lộ trình AI', id: 'path', color: '#00B894', badge: 'AI' },
      ]
    },
    {
      group: 'HỌC TẬP',
      items: [
        { icon: HiBookOpen, label: 'Kho khóa học', id: 'courses', color: '#0984E3' },
        { icon: HiClipboardCheck, label: 'Kiểm tra trực tuyến', id: 'tests', color: '#E17055' },
        { icon: HiChat, label: 'Diễn đàn', id: 'forum', color: '#FDCB6E' },
        { icon: HiSparkles, label: 'Hỏi đáp AI', id: 'ai-qa', color: '#A29BFE', badge: 'HOT' },
      ]
    },
    {
      group: 'TÀI NGUYÊN',
      items: [
        { icon: HiCollection, label: 'Thư viện tài liệu', id: 'library', color: '#74B9FF' },
        { icon: HiCog, label: 'Cài đặt hồ sơ', id: 'settings', color: '#636E72' },
      ]
    }
  ],
  teacher: [
    {
      group: 'GIẢNG DẠY',
      items: [
        { icon: HiHome, label: 'Quản lý khóa học', id: 'home', color: '#6C5CE7' },
        { icon: HiDatabase, label: 'Ngân hàng câu hỏi', id: 'questions', color: '#00B894' },
        { icon: HiChartBar, label: 'Thống kê lớp học', id: 'stats', color: '#0984E3' },
      ]
    },
    {
      group: 'CỘNG ĐỒNG',
      items: [
        { icon: HiChat, label: 'Diễn đàn học tập', id: 'forum', color: '#FDCB6E' },
      ]
    }
  ],
  admin: [
    {
      group: 'HỆ THỐNG',
      items: [
        { icon: HiTerminal, label: 'Live System Logs', id: 'home', color: '#E74C3C' },
        { icon: HiUsers, label: 'Quản lý tài khoản', id: 'users', color: '#0984E3' },
      ]
    },
    {
      group: 'NỘI DUNG',
      items: [
        { icon: HiClipboardCheck, label: 'Phê duyệt khóa học', id: 'courses', color: '#00B894' },
        { icon: HiBell, label: 'Gửi thông báo', id: 'announcements', color: '#FDCB6E' },
      ]
    },
    {
      group: 'PHÂN TÍCH',
      items: [
        { icon: HiTrendingUp, label: 'Thống kê tài chính', id: 'finance', color: '#6C5CE7' },
        { icon: HiShieldCheck, label: 'Cấu hình AI', id: 'ai-config', color: '#A29BFE' },
      ]
    }
  ]
};

export default function Sidebar({ role, active, setActive, userProfile, onLogout, onUpgradePRO }) {
  const [collapsed, setCollapsed] = useState(false);
  if (role === 'guest') return null;

  const groups = navConfigs[role] || [];
  const roleColor = role === 'admin' ? '#E74C3C' : role === 'teacher' ? '#0984E3' : '#6C5CE7';
  const roleLabel = role === 'admin' ? 'Quản trị viên' : role === 'teacher' ? 'Giáo viên' : 'Học viên';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => setActive('landing')} title="Trang chủ công khai">
        <div className="logo-icon">E</div>
        {!collapsed && (
          <div className="logo-text">
            <h1>EduPath <span style={{ color: '#A29BFE' }}>AI</span></h1>
            <p>Học đúng hướng · Thi đúng đích</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <HiChevronRight style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
      </button>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {groups.map(group => (
          <div key={group.group} className="nav-group">
            {!collapsed && <div className="nav-group-label">{group.group}</div>}
            {group.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => setActive(item.id)}
                title={collapsed ? item.label : undefined}
                style={active === item.id ? { '--nav-accent': item.color } : {}}
              >
                <span className="nav-icon" style={{ color: active === item.id ? '#fff' : item.color }}>
                  <item.icon />
                </span>
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge" style={{
                        background: item.badge === 'AI' ? '#6C5CE7' : '#E74C3C',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {active === item.id && !collapsed && (
                  <span className="nav-active-dot" />
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* PRO Upgrade Banner */}
      {role === 'student' && !userProfile?.isPro && !collapsed && (
        <div className="sidebar-upgrade-v2">
          <div className="upgrade-glow" />
          <div className="upgrade-icon">⚡</div>
          <div className="upgrade-content">
            <strong>Nâng cấp PRO</strong>
            <p>Mở khoá AI cá nhân hoá & lộ trình nâng cao</p>
          </div>
          <button className="upgrade-btn-v2" onClick={onUpgradePRO}>
            Nâng cấp <HiArrowUp style={{ verticalAlign: 'middle', marginLeft: 2 }} />
          </button>
        </div>
      )}

      {/* User Footer */}
      <div className="sidebar-user-v2">
        <div className="sidebar-user-avatar" style={{ background: userProfile?.isPro ? 'linear-gradient(135deg,#FFE259,#FFA751)' : roleColor }}>
          {userProfile?.avatar && (userProfile.avatar.startsWith('http') || userProfile.avatar.startsWith('data:')) ? (
            <img src={userProfile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : 'U'
          )}
          <span className="online-dot" />
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userProfile?.name || 'Tài khoản'}</div>
            <div className="sidebar-user-role" style={{ color: userProfile?.isPro ? '#FFA751' : roleColor }}>
              {userProfile?.isPro ? '⭐ PRO Member' : roleLabel}
            </div>
          </div>
        )}
        {!collapsed && (
          <button className="sidebar-logout-btn" onClick={onLogout} title="Đăng xuất">
            <HiLogout />
          </button>
        )}
      </div>
    </aside>
  );
}
