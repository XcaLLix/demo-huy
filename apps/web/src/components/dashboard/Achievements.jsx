const BADGES = [
  { id: 'streak7', icon: '🔥', label: '7 Ngày Liên tiếp', desc: 'Học 7 ngày không nghỉ', unlocked: true, color: '#F59E0B' },
  { id: 'streak30', icon: '⚡', label: '30 Ngày Chiến thần', desc: 'Chuỗi học 30 ngày', unlocked: false, color: '#7C3AED' },
  { id: 'lessons100', icon: '📚', label: '100 Bài học', desc: 'Hoàn thành 100 bài', unlocked: true, color: '#0EA5E9' },
  { id: 'top10', icon: '🏆', label: 'Top 10%', desc: 'Điểm thi thử top 10%', unlocked: false, color: '#10B981' },
  { id: 'exam_master', icon: '🎓', label: 'Exam Master', desc: 'Hoàn thành 20 đề thi thử', unlocked: false, color: '#EF4444' },
  { id: 'ai_chat', icon: '🤖', label: 'AI Explorer', desc: 'Hỏi AI Tutor 50 lần', unlocked: true, color: '#06B6D4' },
  { id: 'perfect', icon: '⭐', label: 'Perfect Score', desc: 'Đạt 10/10 trong 1 đề', unlocked: false, color: '#F97316' },
  { id: 'community', icon: '💬', label: 'Community Star', desc: 'Nhận 10 lượt thích trên forum', unlocked: false, color: '#8B5CF6' },
];

export default function Achievements() {
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <div className="db-achievements">
      <div className="db-section-header">
        <div>
          <span className="db-eyebrow">🎖️ Gamification</span>
          <h2 className="db-section-title">Thành tích của bạn</h2>
        </div>
        <span className="db-achievements__count">
          {unlockedCount}/{BADGES.length} huy hiệu
        </span>
      </div>

      <div className="db-achievements__grid">
        {BADGES.map((b) => (
          <div
            key={b.id}
            className={`db-badge ${b.unlocked ? 'db-badge--unlocked' : 'db-badge--locked'}`}
            style={{ '--badge-color': b.color }}
            title={b.desc}
          >
            <div className="db-badge__icon-wrap">
              <span className="db-badge__icon">{b.unlocked ? b.icon : '🔒'}</span>
              {b.unlocked && <div className="db-badge__glow" />}
            </div>
            <span className="db-badge__label">{b.label}</span>
            <span className="db-badge__desc">{b.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
