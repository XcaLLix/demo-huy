import React, { useState, useEffect, useRef } from 'react';
import { 
  HiUserCircle, 
  HiIdentification, 
  HiDesktopComputer, 
  HiBadgeCheck, 
  HiCurrencyDollar, 
  HiSun, 
  HiMoon, 
  HiLogout 
} from 'react-icons/hi';
import '../../styles/floatingUserMenu.css';

export default function FloatingUserMenu({ 
  currentUser, 
  navigateTo, 
  theme, 
  onToggleTheme, 
  onLogout 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!currentUser) return null;

  const username = currentUser.fullName || currentUser.name || 'Học sinh';
  const email = currentUser.email || '—';
  const points = currentUser.rewardPoints ?? 0;

  // Initials for avatar fallback
  const getInitials = () => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleItemClick = (path) => {
    navigateTo(path);
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
    navigateTo('/');
  };

  return (
    <div className="floating-user-menu-container" ref={menuRef}>
      {/* Pop-up Menu */}
      {isOpen && (
        <div className="fum-popup animate-in">
          {/* Mobile Overlay Backdrop (only visible on mobile via CSS) */}
          <div className="fum-mobile-backdrop" onClick={() => setIsOpen(false)} />
          
          <div className="fum-popup-content">
            {/* 1. Trang cá nhân */}
            <div 
              className="fum-item" 
              onClick={() => handleItemClick('/profile')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick('/profile')}
            >
              <HiUserCircle className="fum-icon" />
              <span>Trang cá nhân</span>
            </div>

            {/* 2. Thông tin cá nhân */}
            <div 
              className="fum-item" 
              onClick={() => handleItemClick('/profile/edit')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick('/profile/edit')}
            >
              <HiIdentification className="fum-icon" />
              <span>Thông tin cá nhân</span>
            </div>

            {/* 3. Khóa học của tôi */}
            <div 
              className="fum-item" 
              onClick={() => handleItemClick('/user/courses')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick('/user/courses')}
            >
              <HiDesktopComputer className="fum-icon" />
              <span>Khóa học của tôi</span>
            </div>

            {/* 4. Chứng chỉ của tôi */}
            <div 
              className="fum-item" 
              onClick={() => handleItemClick('/my-certificates')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick('/my-certificates')}
            >
              <HiBadgeCheck className="fum-icon" />
              <span>Chứng chỉ của tôi</span>
            </div>

            {/* 5. Điểm thưởng */}
            <div 
              className="fum-item" 
              onClick={() => handleItemClick('/rewards')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick('/rewards')}
            >
              <HiCurrencyDollar className="fum-icon" />
              <span>Điểm thưởng: {points}</span>
            </div>

            {/* 6. Giao diện tối */}
            <div className="fum-item theme-toggle-item">
              <div className="fum-item-left">
                {theme === 'dark' ? <HiMoon className="fum-icon" /> : <HiSun className="fum-icon" />}
                <span>Giao diện tối</span>
              </div>
              <div 
                className={`theme-switch ${theme === 'dark' ? 'active' : ''}`} 
                onClick={onToggleTheme}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onToggleTheme()}
              >
                <div className="theme-switch-handle">
                  {theme === 'dark' ? <HiMoon className="switch-icon purple-moon" /> : <HiSun className="switch-icon orange-sun" />}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="fum-divider" />

            {/* 7. Đăng xuất */}
            <div 
              className="fum-item logout-item" 
              onClick={handleLogoutClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleLogoutClick()}
            >
              <HiLogout className="fum-icon logout-icon" />
              <span>Đăng xuất</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <div 
        className={`floating-user-pill ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <div className="fup-avatar-wrap">
          {currentUser.avatarUrl || currentUser.avatar ? (
            <img 
              src={currentUser.avatarUrl || currentUser.avatar} 
              alt="Avatar" 
              className="fup-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="fup-avatar-text" style={{ display: (currentUser.avatarUrl || currentUser.avatar) ? 'none' : 'flex' }}>
            {getInitials()}
          </div>
        </div>
        <div className="fup-info">
          <span className="fup-username" title={username}>
            Username: {username.length > 18 ? `${username.slice(0, 18)}...` : username}
          </span>
          <span className="fup-email" title={email}>
            {email.length > 24 ? `${email.slice(0, 24)}...` : email}
          </span>
        </div>
      </div>
    </div>
  );
}
