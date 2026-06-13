const UPCOMING = [
  {
    id: 1,
    type: 'lesson',
    icon: '📚',
    title: 'Tích phân bất định và ứng dụng',
    subject: 'Toán học',
    date: 'Hôm nay, 20:00',
    urgent: true,
    color: '#7C3AED',
  },
  {
    id: 2,
    type: 'exam',
    icon: '📝',
    title: 'Thi thử Vật lý – Đề chuyên Hà Nội 2024',
    subject: 'Vật lý',
    date: 'Ngày mai, 19:30',
    urgent: false,
    color: '#0EA5E9',
  },
  {
    id: 3,
    type: 'review',
    icon: '🔁',
    title: 'Ôn tập Ngữ pháp tiếng Anh – Thì hoàn thành',
    subject: 'Tiếng Anh',
    date: 'Thứ 5, 18:00',
    urgent: false,
    color: '#F59E0B',
  },
  {
    id: 4,
    type: 'exam',
    icon: '🎯',
    title: 'Đề thi thử Toán – Đề chính thức Bộ GD 2025',
    subject: 'Toán học',
    date: 'Thứ 7, 09:00',
    urgent: false,
    color: '#7C3AED',
  },
];

const TYPE_LABELS = {
  lesson: 'Bài học',
  exam: 'Thi thử',
  review: 'Ôn tập',
};

export default function UpcomingTasks({ onNavigateTo }) {
  return (
    <div className="db-upcoming">
      <div className="db-section-header">
        <div>
          <span className="db-eyebrow">📅 Lịch học</span>
          <h2 className="db-section-title">Nhiệm vụ sắp tới</h2>
        </div>
      </div>

      <div className="db-upcoming__list">
        {UPCOMING.map((item) => (
          <div
            key={item.id}
            className={`db-upcoming__item ${item.urgent ? 'db-upcoming__item--urgent' : ''}`}
            style={{ '--upcoming-color': item.color }}
            onClick={() => onNavigateTo && onNavigateTo(item.type === 'exam' ? 'tests' : 'courses')}
          >
            <div className="db-upcoming__item-accent" />
            <span className="db-upcoming__item-icon">{item.icon}</span>
            <div className="db-upcoming__item-body">
              <span className="db-upcoming__item-title">{item.title}</span>
              <span className="db-upcoming__item-meta">
                <span className="db-upcoming__item-type">{TYPE_LABELS[item.type]}</span>
                · {item.subject}
              </span>
            </div>
            <div className="db-upcoming__item-right">
              <span className={`db-upcoming__item-date ${item.urgent ? 'db-upcoming__item-date--urgent' : ''}`}>
                {item.urgent && '⚡ '}
                {item.date}
              </span>
              <span className="db-upcoming__item-arrow">›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
