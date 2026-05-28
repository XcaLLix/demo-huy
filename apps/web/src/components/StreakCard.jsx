import { HiCheck } from 'react-icons/hi';

const days = [
  { label: 'T2', status: 'done' },
  { label: 'T3', status: 'done' },
  { label: 'T4', status: 'done' },
  { label: 'T5', status: 'done' },
  { label: 'T6', status: 'done' },
  { label: 'T7', status: 'today' },
  { label: 'CN', status: 'missed' },
];

export default function StreakCard() {
  return (
    <div className="card streak-card animate-in">
      <div className="streak-header">
        <span className="fire">🔥</span>
        <h3>Chuỗi ngày học tập</h3>
      </div>
      <div className="streak-days">12 <span style={{ fontSize: 16, fontWeight: 500, color: '#2D3436' }}>ngày</span></div>
      <p className="streak-msg">Cố lên! Bạn đang làm rất tốt!</p>
      <div className="streak-week">
        {days.map((d, i) => (
          <div className="streak-day" key={i}>
            <span className="day-label">{d.label}</span>
            <div className={`day-circle ${d.status}`}>
              {d.status === 'done' && <HiCheck />}
              {d.status === 'today' && <HiCheck />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
