const SUBJECTS = [
  {
    name: 'Toán học',
    icon: '📐',
    color: '#7C3AED',
    progress: 68,
    accuracy: 72,
    timeSpent: '24h 30m',
    weakTopics: ['Cực trị hàm số', 'Tích phân'],
    trend: 'up',
  },
  {
    name: 'Vật lý',
    icon: '⚡',
    color: '#0EA5E9',
    progress: 55,
    accuracy: 58,
    timeSpent: '18h 15m',
    weakTopics: ['Dao động điều hòa', 'Sóng cơ học'],
    trend: 'down',
  },
  {
    name: 'Tiếng Anh',
    icon: '🌍',
    color: '#F59E0B',
    progress: 80,
    accuracy: 85,
    timeSpent: '21h 00m',
    weakTopics: ['Reading comprehension'],
    trend: 'up',
  },
];

export default function PerformanceAnalytics({ onNavigateTo }) {
  return (
    <div className="db-performance">
      <div className="db-section-header">
        <div>
          <span className="db-eyebrow">📈 Phân tích học tập</span>
          <h2 className="db-section-title">Hiệu suất theo môn</h2>
        </div>
        <button
          className="db-section-link"
          onClick={() => onNavigateTo && onNavigateTo('path')}
          id="performance-view-detail-btn"
        >
          Chi tiết →
        </button>
      </div>

      <div className="db-performance__grid">
        {SUBJECTS.map((s) => (
          <div
            key={s.name}
            className="db-perf-card"
            style={{ '--perf-color': s.color }}
          >
            {/* Card header */}
            <div className="db-perf-card__header">
              <span className="db-perf-card__icon">{s.icon}</span>
              <div>
                <h3 className="db-perf-card__name">{s.name}</h3>
                <span className={`db-perf-card__trend ${s.trend === 'up' ? 'db-perf-card__trend--up' : 'db-perf-card__trend--down'}`}>
                  {s.trend === 'up' ? '↑ Đang tiến bộ' : '↓ Cần cải thiện'}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="db-perf-card__metric">
              <div className="db-perf-card__metric-label">
                <span>Hoàn thành lộ trình</span>
                <span className="db-perf-card__metric-val">{s.progress}%</span>
              </div>
              <div className="db-perf-card__bar">
                <div className="db-perf-card__bar-fill" style={{ width: `${s.progress}%` }} />
              </div>
            </div>

            {/* Accuracy */}
            <div className="db-perf-card__metric">
              <div className="db-perf-card__metric-label">
                <span>Tỷ lệ đúng</span>
                <span className="db-perf-card__metric-val">{s.accuracy}%</span>
              </div>
              <div className="db-perf-card__bar">
                <div
                  className="db-perf-card__bar-fill db-perf-card__bar-fill--accuracy"
                  style={{ width: `${s.accuracy}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="db-perf-card__stats">
              <div className="db-perf-card__stat">
                <span className="db-perf-card__stat-icon">⏱</span>
                <span>{s.timeSpent}</span>
              </div>
              <div className="db-perf-card__stat">
                <span className="db-perf-card__stat-icon">📌</span>
                <span>{s.weakTopics.length} điểm yếu</span>
              </div>
            </div>

            {/* Weak topics */}
            <div className="db-perf-card__weak">
              {s.weakTopics.map((t) => (
                <span key={t} className="db-perf-card__weak-tag">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
