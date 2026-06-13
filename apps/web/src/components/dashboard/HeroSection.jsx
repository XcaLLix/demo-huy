import { useState, useEffect } from 'react';

const EXAM_DATE = new Date('2026-06-30');

function getDaysRemaining() {
  const now = new Date();
  const diff = EXAM_DATE - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function HeroSection({ currentUser, onStartLearning, onNavigateTo }) {
  const [daysLeft, setDaysLeft] = useState(getDaysRemaining());

  useEffect(() => {
    const t = setInterval(() => setDaysLeft(getDaysRemaining()), 60000);
    return () => clearInterval(t);
  }, []);

  const name = currentUser?.name || 'Học sinh';
  const firstName = name.split(' ').pop();
  const grade = currentUser?.grade || '12';
  const combo = currentUser?.combo || 'A01 (Toán – Lý – Anh)';
  const targetScore = currentUser?.targetScore || 27;
  const streak = currentUser?.streak || 12;
  const predictedScore = currentUser?.predictedScore || 23.8;
  const avatarText = name.slice(0, 2).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const stats = [
    { icon: '🎯', label: 'Mục tiêu', value: `${targetScore}+`, sub: 'điểm THPTQG', color: '#7C3AED' },
    { icon: '📅', label: 'Còn lại', value: daysLeft, sub: 'ngày đến thi', color: '#0EA5E9' },
    { icon: '🔥', label: 'Chuỗi học', value: `${streak} ngày`, sub: 'liên tiếp', color: '#F59E0B' },
    { icon: '📈', label: 'Dự đoán', value: predictedScore, sub: 'điểm hiện tại', color: '#10B981' },
  ];

  return (
    <div className="db-hero">
      {/* Animated background orbs */}
      <div className="db-hero__bg">
        <div className="db-hero__orb db-hero__orb--1" />
        <div className="db-hero__orb db-hero__orb--2" />
        <div className="db-hero__orb db-hero__orb--3" />
      </div>

      <div className="db-hero__inner">
        {/* Left: Avatar + info */}
        <div className="db-hero__left">
          <div className="db-hero__avatar-wrap">
            {currentUser?.avatar && (currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http')) ? (
              <img src={currentUser.avatar} alt={name} className="db-hero__avatar-img" />
            ) : (
              <div className="db-hero__avatar-text">{avatarText}</div>
            )}
            <div className="db-hero__avatar-ring" />
            <span className="db-hero__avatar-badge">Lớp {grade}</span>
          </div>

          <div className="db-hero__info">
            <p className="db-hero__greeting">{greeting}, 👋</p>
            <h1 className="db-hero__name">{firstName}!</h1>
            <p className="db-hero__combo">{combo}</p>

            <button
              className="db-hero__cta"
              onClick={onStartLearning}
              id="dashboard-continue-learning-btn"
            >
              <span className="db-hero__cta-icon">▶</span>
              Tiếp tục học ngay
              <span className="db-hero__cta-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Right: Stats pills */}
        <div className="db-hero__stats">
          {stats.map((s) => (
            <div key={s.label} className="db-hero__stat-card" style={{ '--stat-color': s.color }}>
              <span className="db-hero__stat-icon">{s.icon}</span>
              <div className="db-hero__stat-body">
                <span className="db-hero__stat-value">{s.value}</span>
                <span className="db-hero__stat-label">{s.label}</span>
                <span className="db-hero__stat-sub">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
