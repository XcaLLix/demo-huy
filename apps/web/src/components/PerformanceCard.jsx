const subjects = [
  { label: 'Toán học', value: 78, color: '#E74C3C' },
  { label: 'Vật lý', value: 65, color: '#0984E3' },
  { label: 'Tiếng Anh', value: 72, color: '#00B894' },
];

export default function PerformanceCard() {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <h3>HIỆU SUẤT THEO MÔN</h3>
        <a href="#" className="link">Xem chi tiết</a>
      </div>
      <div className="perf-list">
        {subjects.map((s, i) => (
          <div className="perf-item" key={i}>
            <span className="perf-label">{s.label}</span>
            <div className="perf-bar-bg">
              <div className="perf-bar" style={{ width: `${s.value}%`, background: s.color }} />
            </div>
            <span className="perf-value" style={{ color: s.color }}>{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
