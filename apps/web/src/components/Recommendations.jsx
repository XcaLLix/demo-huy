import { HiPlay, HiArrowRight } from 'react-icons/hi';

const cards = [
  {
    badge: 'Bài học', badgeClass: 'lesson',
    title: 'Hàm số bậc 2 và đồ thị',
    subject: 'Toán học', time: '45 phút',
    icon: <HiPlay />
  },
  {
    badge: 'Bài tập', badgeClass: 'exercise',
    title: 'Bài tập vận dụng cao Hàm số bậc 2',
    subject: 'Toán học', time: '20 câu hỏi',
    icon: <HiPlay />
  },
  {
    badge: 'Ôn tập', badgeClass: 'review',
    title: 'Tóm tắt công thức Dao động cơ',
    subject: 'Vật lý', time: '15 phút',
    icon: <HiPlay />
  },
  {
    badge: 'Bài kiểm tra', badgeClass: 'exam',
    title: 'Đề thi thử THPTQG 2023 – Môn Anh',
    subject: 'Tiếng Anh', time: '90 phút',
    icon: <HiPlay />
  },
];

export default function Recommendations() {
  return (
    <div className="card recommendations animate-in">
      <div className="card-header">
        <h3>ĐỀ XUẤT DÀNH CHO BẠN</h3>
        <a href="#" className="link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HiArrowRight />
        </a>
      </div>
      <div className="rec-grid">
        {cards.map((card, i) => (
          <div className="rec-card" key={i}>
            <span className={`rec-badge ${card.badgeClass}`}>{card.badge}</span>
            <h4>{card.title}</h4>
            <p className="rec-subject">{card.subject}</p>
            <div className="rec-card-footer">
              <span className="rec-time">⏱ {card.time}</span>
              <button className="rec-play">{card.icon}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
