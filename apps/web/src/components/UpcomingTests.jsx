import { HiCalendar } from 'react-icons/hi';

const tests = [
  { title: 'Kiểm tra Toán – Chương Hàm số', date: '20/05/2024 · 19:30', countdown: 'Còn 2 ngày' },
  { title: 'Kiểm tra Lý – Dao động cơ', date: '22/05/2024 · 19:30', countdown: 'Còn 4 ngày' },
  { title: 'Kiểm tra Anh – Reading Test', date: '25/05/2024 · 19:30', countdown: 'Còn 7 ngày' },
];

export default function UpcomingTests() {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <h3>BÀI KIỂM TRA SẮP TỚI</h3>
        <a href="#" className="link">Xem tất cả</a>
      </div>
      <div className="test-list">
        {tests.map((t, i) => (
          <div className="test-item" key={i}>
            <div className="test-info">
              <h4>{t.title}</h4>
              <p><HiCalendar /> {t.date}</p>
            </div>
            <span className="test-countdown">{t.countdown}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
