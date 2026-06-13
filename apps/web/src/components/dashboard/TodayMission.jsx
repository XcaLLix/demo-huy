import { useState } from 'react';

const DEFAULT_TASKS = [
  {
    id: 1,
    type: 'lesson',
    icon: '📚',
    title: 'Bài học: Hàm số bậc 3 và cực trị',
    subject: 'Toán học',
    duration: '25 phút',
    done: false,
    color: '#7C3AED',
  },
  {
    id: 2,
    type: 'exam',
    icon: '📝',
    title: 'Thi thử: Đề minh họa Vật Lý 2024',
    subject: 'Vật lý',
    duration: '50 phút',
    done: false,
    color: '#0EA5E9',
  },
  {
    id: 3,
    type: 'review',
    icon: '🔁',
    title: 'Ôn lại: Dao động điều hòa (yếu)',
    subject: 'Vật lý',
    duration: '15 phút',
    done: true,
    color: '#10B981',
  },
  {
    id: 4,
    type: 'ai',
    icon: '🤖',
    title: 'AI Coach: Phân tích lỗ hổng hôm qua',
    subject: 'AI Gợi ý',
    duration: '5 phút',
    done: false,
    color: '#F59E0B',
  },
];

export default function TodayMission({ onNavigateTo }) {
  const [tasks, setTasks] = useState(DEFAULT_TASKS);

  const doneCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = Math.round((doneCount / total) * 100);

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="db-mission">
      {/* Header */}
      <div className="db-mission__header">
        <div className="db-mission__title-group">
          <span className="db-mission__eyebrow">📅 Hôm nay</span>
          <h2 className="db-mission__title">Nhiệm vụ của bạn</h2>
          <p className="db-mission__sub">Hoàn thành để duy trì chuỗi học tập!</p>
        </div>

        {/* Circular progress */}
        <div className="db-mission__ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="url(#missionGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <defs>
              <linearGradient id="missionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="db-mission__ring-inner">
            <span className="db-mission__ring-pct">{pct}%</span>
            <span className="db-mission__ring-label">Hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="db-mission__list">
        {tasks.map((t) => (
          <div
            key={t.id}
            className={`db-mission__task ${t.done ? 'db-mission__task--done' : ''}`}
            style={{ '--task-color': t.color }}
            onClick={() => toggleTask(t.id)}
          >
            <div className="db-mission__task-check">
              {t.done ? '✓' : ''}
            </div>
            <span className="db-mission__task-icon">{t.icon}</span>
            <div className="db-mission__task-body">
              <span className="db-mission__task-title">{t.title}</span>
              <span className="db-mission__task-meta">{t.subject} · {t.duration}</span>
            </div>
            <span className="db-mission__task-arrow">→</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="db-mission__cta"
        onClick={() => onNavigateTo && onNavigateTo('courses')}
        id="today-mission-start-btn"
      >
        ⚡ Bắt đầu ngay
      </button>
    </div>
  );
}
