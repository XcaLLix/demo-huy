const RECENT_EXAMS = [
  {
    id: 1,
    title: 'Đề THPTQG Toán 2024 – Chính thức',
    subject: 'Toán học',
    icon: '📐',
    score: 7.8,
    maxScore: 10,
    rank: 'Top 12%',
    time: '87 phút',
    improvement: +0.6,
    date: '2 ngày trước',
    color: '#7C3AED',
  },
  {
    id: 2,
    title: 'Đề thi thử Vật Lý – Chuyên Amsterdam',
    subject: 'Vật lý',
    icon: '⚡',
    score: 6.5,
    maxScore: 10,
    rank: 'Top 28%',
    time: '50 phút',
    improvement: -0.3,
    date: '4 ngày trước',
    color: '#0EA5E9',
  },
  {
    id: 3,
    title: 'Đề thi thử Tiếng Anh 2024 – Chính thức',
    subject: 'Tiếng Anh',
    icon: '🌍',
    score: 8.2,
    maxScore: 10,
    rank: 'Top 8%',
    time: '60 phút',
    improvement: +1.0,
    date: '6 ngày trước',
    color: '#F59E0B',
  },
];

export default function RecentExams({ onNavigateTo }) {
  return (
    <div className="db-recent-exams">
      <div className="db-section-header">
        <div>
          <span className="db-eyebrow">📊 Lịch sử thi</span>
          <h2 className="db-section-title">Kết quả gần đây</h2>
        </div>
        <button
          className="db-section-link"
          onClick={() => onNavigateTo && onNavigateTo('tests')}
          id="recent-exams-view-all-btn"
        >
          Xem tất cả →
        </button>
      </div>

      <div className="db-recent-exams__grid">
        {RECENT_EXAMS.map((exam) => {
          const pct = Math.round((exam.score / exam.maxScore) * 100);
          const isUp = exam.improvement >= 0;

          return (
            <div
              key={exam.id}
              className="db-exam-card"
              style={{ '--exam-color': exam.color }}
              onClick={() => onNavigateTo && onNavigateTo('tests')}
            >
              {/* Top */}
              <div className="db-exam-card__top">
                <span className="db-exam-card__icon">{exam.icon}</span>
                <div className="db-exam-card__meta">
                  <span className="db-exam-card__subject">{exam.subject}</span>
                  <span className="db-exam-card__date">{exam.date}</span>
                </div>
                <div
                  className={`db-exam-card__delta ${isUp ? 'db-exam-card__delta--up' : 'db-exam-card__delta--down'}`}
                >
                  {isUp ? '↑' : '↓'} {Math.abs(exam.improvement)}
                </div>
              </div>

              <p className="db-exam-card__title">{exam.title}</p>

              {/* Score */}
              <div className="db-exam-card__score-row">
                <span className="db-exam-card__score">{exam.score}</span>
                <span className="db-exam-card__score-max">/{exam.maxScore}</span>
              </div>

              {/* Bar */}
              <div className="db-exam-card__bar">
                <div className="db-exam-card__bar-fill" style={{ width: `${pct}%` }} />
              </div>

              {/* Footer */}
              <div className="db-exam-card__footer">
                <span className="db-exam-card__rank">🏅 {exam.rank}</span>
                <span className="db-exam-card__time">⏱ {exam.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
