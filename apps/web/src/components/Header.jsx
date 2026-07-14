import React, { useState, useEffect, useRef } from 'react';
import { toast } from '../utils/toast';
import sunLogoImg from '../assets/sun_logo.png';
import { 
  HiSearch, 
  HiBell, 
  HiSun, 
  HiMoon, 
  HiUser, 
  HiLockClosed, 
  HiLogout, 
  HiX, 
  HiCog, 
  HiShoppingCart,
  HiMenu
} from 'react-icons/hi';

const EMPTY_ARRAY = [];

const getCategoryIcon = (cat, customIcon) => {
  if (customIcon) return customIcon;
  switch (cat) {
    case 'PAYMENT': return '💰';
    case 'COURSE': return '📚';
    case 'EXAM': return '📝';
    case 'ACCOUNT': return '🔐';
    case 'AI': return '🤖';
    case 'REPORT': return '🛡️';
    case 'TEACHER': return '👨‍🏫';
    case 'ADMIN': return '👑';
    default: return '📢';
  }
};

const getCategoryColor = (type) => {
  switch (type) {
    case 'SUCCESS': return '#10B981';
    case 'WARNING': return '#F59E0B';
    case 'ERROR': return '#EF4444';
    default: return '#6c5ce7';
  }
};

export default function Header({
  role,
  userProfile,
  theme,
  onToggleTheme,
  notifications = EMPTY_ARRAY,
  onClearNotifications,
  onNotificationClick,
  onLogout,
  onChangePassword,
  onNavigateSettings,
  addLog,
  cartCourses = EMPTY_ARRAY,
  onCheckoutCourse,
  navigateTo,
  currentPath = '',
  courses = EMPTY_ARRAY
}) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  
  // Search Autocomplete States
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const searchRef = useRef(null);

  // Password change states
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle Search Input Change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses([]);
      setShowAutocomplete(false);
      return;
    }

    const filtered = courses.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject && c.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredCourses(filtered.slice(0, 5)); // show max 5 results
    setShowAutocomplete(true);
  }, [searchQuery, courses]);

  // Close Autocomplete on Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmNewPass) return;
    if (newPass.length < 6) {
      toast('Mật khẩu mới phải từ 6 ký tự trở lên!', 'warning');
      return;
    }
    if (newPass !== confirmNewPass) {
      toast('Xác nhận mật khẩu mới không khớp!', 'warning');
      return;
    }
    onChangePassword(oldPass, newPass);
    setOldPass('');
    setNewPass('');
    setConfirmNewPass('');
    setShowChangePassModal(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Find the first matching course if any and navigate
      if (filteredCourses.length > 0) {
        navigateTo(`/courses/${filteredCourses[0].id}`);
        setSearchQuery('');
        setShowAutocomplete(false);
      } else {
        toast(`Không tìm thấy kết quả cho "${searchQuery}"`, 'warning');
      }
    }
  };

  const isLinkActive = (path) => {
    if (path === '/') {
      return currentPath === '/' || currentPath === '/landing';
    }
    return currentPath.startsWith(path);
  };

  if (role === 'admin') {
    return (
      <header className="fts-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '88px', padding: '0 32px' }}>
        {/* CENTER COLUMN: Search with Autocomplete */}
        <div className="fts-header-search-col" ref={searchRef} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <form className="fts-header-search-container" onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Tìm kiếm khóa học hoặc người dùng..." 
              className="fts-header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (filteredCourses.length > 0) setShowAutocomplete(true); }}
            />
            <button type="submit" className="fts-header-search-btn" aria-label="Tìm kiếm">
              <HiSearch />
            </button>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && filteredCourses.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '58px',
                left: '12px',
                right: '12px',
                background: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(79, 63, 203, 0.15)',
                border: '1px solid rgba(79, 63, 203, 0.08)',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                {filteredCourses.map(course => (
                  <div 
                    key={course.id}
                    onClick={() => {
                      navigateTo(`/courses/${course.id}`);
                      setSearchQuery('');
                      setShowAutocomplete(false);
                    }}
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      borderBottom: '1px solid rgba(79, 63, 203, 0.04)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F3F1FF'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--fts-text-primary)' }}>{course.title}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--fts-text-secondary)', marginTop: '2px' }}>Chuyên đề: {course.subject} • {course.lessonCount || 0} bài học</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </header>
    );
  }

  return (
    <header className="fts-header">
      {/* LEFT COLUMN: Logo */}
      <div 
        className="fts-header-logo-col" 
        onClick={() => navigateTo ? navigateTo('/') : (window.location.href = '/')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={sunLogoImg} alt="EduPath AI" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--fts-purple)', letterSpacing: '-0.5px' }}>
            EduPath <em style={{ color: 'var(--fts-purple-dark)', fontStyle: 'normal' }}>AI</em>
          </span>
        </div>
      </div>

      {/* CENTER COLUMN: Search with Autocomplete */}
      <div className="fts-header-search-col" ref={searchRef}>
        <form className="fts-header-search-container" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Tìm kiếm khóa học hoặc người dùng..." 
            className="fts-header-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (filteredCourses.length > 0) setShowAutocomplete(true); }}
          />
          <button type="submit" className="fts-header-search-btn" aria-label="Tìm kiếm">
            <HiSearch />
          </button>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && filteredCourses.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '58px',
              left: '12px',
              right: '12px',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(79, 63, 203, 0.15)',
              border: '1px solid rgba(79, 63, 203, 0.08)',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {filteredCourses.map(course => (
                <div 
                  key={course.id}
                  onClick={() => {
                    navigateTo(`/courses/${course.id}`);
                    setSearchQuery('');
                    setShowAutocomplete(false);
                  }}
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    borderBottom: '1px solid rgba(79, 63, 203, 0.04)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F3F1FF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--fts-text-primary)' }}>{course.title}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--fts-text-secondary)', marginTop: '2px' }}>Chuyên đề: {course.subject} • {course.lessonCount || 0} bài học</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* RIGHT COLUMN: Nav Links & Actions */}
      <div className="fts-header-nav-col">
        {/* Shopping Cart */}
        <button
          className="fts-header-cart-btn"
          onClick={() => {
            if (cartCourses && cartCourses.length > 0) {
              onCheckoutCourse(cartCourses[0]);
            } else {
              toast('Giỏ hàng trống! Hãy chọn khóa học hoặc tài liệu học tập để thêm vào giỏ.', 'warning');
            }
          }}
          title="Giỏ hàng"
        >
          <HiShoppingCart />
          {cartCourses.length > 0 && (
            <span className="fts-header-cart-badge">
              {cartCourses.length}
            </span>
          )}
        </button>

        {/* Notification Bell */}
        {role !== 'guest' && (
          <button
            className="header-icon-btn"
            style={{ position: 'relative', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--fts-text-primary)' }}
            onClick={() => {
              setShowNotif(!showNotif);
              setShowProfileMenu(false);
            }}
            id="notifications-btn"
          >
            <HiBell />
            {unreadCount > 0 && (
              <span className="fts-header-cart-badge" style={{ top: '-2px', right: '-4px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* User Profile Avatar */}
        {role !== 'guest' && (
          userProfile?.avatar && (userProfile.avatar.startsWith('data:') || userProfile.avatar.startsWith('http') || userProfile.avatar.length > 10) ? (
            <img
              src={userProfile.avatar}
              alt="Avatar"
              className="header-avatar"
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                objectFit: 'cover', cursor: 'pointer', border: '2px solid var(--fts-purple)'
              }}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotif(false);
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                id="user-profile-menu-btn"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                  color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '13px', border: '2px solid #000000', cursor: 'pointer',
                  boxShadow: '2px 2px 0px #000000'
                }}
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotif(false);
                }}
              >
                {userProfile?.fullName ? userProfile.fullName.substring(0, 2).toUpperCase() : 'US'}
              </div>
            </div>
          ))}
        </div>

      {/* Notifications Drawer */}
      {showNotif && (
        <div
          style={{
            position: 'absolute', top: '75px', right: '60px',
            width: '420px', background: '#FFFFFF',
            border: '2px solid #000000', borderRadius: '16px',
            boxShadow: '4px 4px 0px #000000', zIndex: 2000, padding: '20px',
            animation: 'fadeInUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #F3F4F6', paddingBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔔 THÔNG BÁO ({unreadCount})
            </span>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  onClearNotifications();
                }}
                style={{ background: 'none', border: 'none', color: '#6c5ce7', fontSize: '13px', cursor: 'pointer', fontWeight: '900' }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const icon = getCategoryIcon(n.category, n.icon);
                const borderLeftColor = getCategoryColor(n.type);
                const isReadNotif = n.read || n.isRead;

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (onNotificationClick) onNotificationClick(n);
                      setShowNotif(false);
                    }}
                    style={{
                      padding: '12px 16px', borderRadius: '12px',
                      background: isReadNotif ? '#FFFFFF' : 'rgba(108, 92, 231, 0.05)',
                      border: '1.5px solid #000000',
                      borderLeft: `6px solid ${borderLeftColor}`,
                      fontSize: '13px', lineHeight: '1.45',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      boxShadow: isReadNotif ? 'none' : '2px 2px 0px rgba(0,0,0,0.15)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translate(-1px, -1px)';
                      e.currentTarget.style.boxShadow = '3px 3px 0px #000000';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = isReadNotif ? 'none' : '2px 2px 0px rgba(0,0,0,0.15)';
                    }}
                  >
                    <div style={{ fontSize: '18px', marginTop: '2px' }}>{icon}</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '900', color: '#1E293B', fontSize: '13.5px', marginBottom: '4px' }}>{n.title || 'Thông báo'}</div>
                      <p style={{ color: '#4B5563', margin: 0, fontSize: '12.5px', fontWeight: isReadNotif ? 'normal' : '500' }}>{n.text || n.message}</p>
                      {n.link && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNotificationClick) onNotificationClick(n);
                            setShowNotif(false);
                          }}
                          style={{
                            marginTop: '10px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: borderLeftColor,
                            color: '#FFFFFF',
                            border: '1.5px solid #000000',
                            boxShadow: '1.5px 1.5px 0px #000000',
                            fontSize: '11.5px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translate(-1px, -1px)';
                            e.currentTarget.style.boxShadow = '2.5px 2.5px 0px #000000';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '1.5px 1.5px 0px #000000';
                          }}
                        >
                          {n.category === 'COURSE' && 'Vào học ngay 🚀'}
                          {n.category === 'EXAM' && 'Luyện tập ngay 📝'}
                          {n.category === 'PAYMENT' && 'Xem chi tiết 🧾'}
                          {n.category === 'TEACHER' && 'Xem lớp học 👨‍🏫'}
                          {n.category === 'AI' && 'Khám phá AI 🤖'}
                          {!['COURSE', 'EXAM', 'PAYMENT', 'TEACHER', 'AI'].includes(n.category) && 'Xem chi tiết ➔'}
                        </button>
                      )}
                      <span style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '6px', display: 'block' }}>{n.time}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '28px 0', fontWeight: 'bold' }}>Không có thông báo mới.</p>
            )}
          </div>

          <div style={{ marginTop: '14px', borderTop: '2px solid #F3F4F6', paddingTop: '12px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setShowNotif(false);
                const redirectPath = 
                  role === 'admin' ? '/dashboard/notifications' : 
                  role === 'teacher' ? '/teacher/notifications' : 
                  '/dashboard/notifications';
                navigateTo(redirectPath);
              }}
              style={{
                background: 'none', border: 'none', color: '#6c5ce7',
                fontSize: '13.5px', fontWeight: '900', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              Xem tất cả thông báo ➔
            </button>
          </div>
        </div>
      )}

      {/* User Profile dropdown menu */}
      {showProfileMenu && (
        <div 
          className="profile-dropdown-card" 
          style={{ 
            position: 'absolute', right: '32px', top: '75px',
            width: '220px', background: '#FFFFFF',
            border: '1px solid rgba(79, 63, 203, 0.1)', borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(79, 63, 203, 0.15)', zIndex: 2000, padding: '12px'
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(79, 63, 203, 0.05)', paddingBottom: '8px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--fts-text-primary)' }}>{userProfile?.fullName || userProfile?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--fts-text-secondary)', marginTop: '2px' }}>{userProfile?.email}</div>
          </div>
          {onNavigateSettings && (
            <button
              className="dropdown-item"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', textAlign: 'left', fontSize: '12.5px', color: 'var(--fts-text-primary)', cursor: 'pointer', borderRadius: '8px' }}
              onClick={() => {
                onNavigateSettings();
                setShowProfileMenu(false);
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F3F1FF'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <HiCog /> Cài đặt hồ sơ
            </button>
          )}
          <button
            className="dropdown-item"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', textAlign: 'left', fontSize: '12.5px', color: 'var(--fts-text-primary)', cursor: 'pointer', borderRadius: '8px' }}
            onClick={() => {
              setShowChangePassModal(true);
              setShowProfileMenu(false);
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F1FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <HiLockClosed /> Đổi mật khẩu
          </button>
          <button
            className="dropdown-item"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', background: 'none', border: 'none', textAlign: 'left', fontSize: '12.5px', color: '#EF4444', cursor: 'pointer', borderRadius: '8px' }}
            onClick={() => {
              onLogout();
              setShowProfileMenu(false);
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#FFEAEA'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <HiLogout /> Đăng xuất
          </button>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassModal && (
        <div className="checkout-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="checkout-modal animate-in" style={{ position: 'relative', width: '100%', maxWidth: '400px', background: '#FFFFFF', padding: '32px', borderRadius: '20px', boxShadow: 'var(--fts-shadow-player)' }}>
            <button
              onClick={() => setShowChangePassModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', color: 'var(--fts-text-secondary)', fontSize: '20px', cursor: 'pointer' }}
            >
              <HiX />
            </button>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--fts-text-primary)' }}>ĐỔI MẬT KHẨU BẢO MẬT</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--fts-text-primary)' }}>Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                  value={oldPass}
                  onChange={e => setOldPass(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--fts-text-primary)' }}>Mật khẩu mới:</label>
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--fts-text-primary)' }}>Xác nhận mật khẩu mới:</label>
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                  value={confirmNewPass}
                  onChange={e => setConfirmNewPass(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '6px', height: '44px', background: 'var(--fts-purple)', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cập nhật mật khẩu mới
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
