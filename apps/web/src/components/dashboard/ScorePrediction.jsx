// Pure SVG radar chart – no external dependencies
export default function ScorePrediction({ currentUser }) {
  const combo = currentUser?.combo || 'A01 (Toán – Lý – Anh)';

  // Derive subjects from combo
  const subjectMap = {
    'Toán': { color: '#7C3AED', icon: '📐' },
    'Lý': { color: '#0EA5E9', icon: '⚡' },
    'Hóa': { color: '#10B981', icon: '🧪' },
    'Anh': { color: '#F59E0B', icon: '🌍' },
    'Văn': { color: '#EF4444', icon: '📖' },
    'Sinh': { color: '#06B6D4', icon: '🧬' },
    'Sử': { color: '#8B5CF6', icon: '📜' },
    'Địa': { color: '#F97316', icon: '🌏' },
  };

  const subjects = [
    { name: 'Toán', current: 7.2, target: 9.0 },
    { name: 'Lý', current: 6.8, target: 8.5 },
    { name: 'Anh', current: 7.5, target: 9.0 },
  ];

  const totalCurrent = subjects.reduce((a, b) => a + b.current, 0).toFixed(1);
  const totalTarget = subjects.reduce((a, b) => a + b.target, 0).toFixed(1);
  const gap = (totalTarget - totalCurrent).toFixed(1);

  // Build SVG radar
  const N = subjects.length;
  const CX = 120, CY = 110, R = 80;

  const getPoint = (i, val, maxVal = 10) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (val / maxVal) * R;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const targetPts = subjects.map((s, i) => getPoint(i, s.target));
  const currentPts = subjects.map((s, i) => getPoint(i, s.current));
  const gridPts = subjects.map((_, i) => getPoint(i, 10));

  const toPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  // Grid rings (25%, 50%, 75%, 100%)
  const rings = [2.5, 5, 7.5, 10];

  return (
    <div className="db-score-card">
      <div className="db-score-card__header">
        <div>
          <span className="db-score-card__eyebrow">📊 AI Phân tích</span>
          <h2 className="db-score-card__title">Dự đoán điểm thi</h2>
        </div>
        <div className="db-score-card__combo">{combo}</div>
      </div>

      <div className="db-score-card__body">
        {/* Radar SVG */}
        <div className="db-score-card__radar">
          <svg viewBox="0 0 240 220" width="240" height="220">
            {/* Grid rings */}
            {rings.map((r) => (
              <polygon
                key={r}
                points={subjects
                  .map((_, i) => {
                    const p = getPoint(i, r);
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="rgba(124,58,237,0.15)"
                strokeWidth="1"
              />
            ))}

            {/* Grid spokes */}
            {gridPts.map((p, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={p.x.toFixed(1)}
                y2={p.y.toFixed(1)}
                stroke="rgba(124,58,237,0.15)"
                strokeWidth="1"
              />
            ))}

            {/* Target area */}
            <path
              d={toPath(targetPts)}
              fill="rgba(124,58,237,0.12)"
              stroke="#7C3AED"
              strokeWidth="2"
              strokeDasharray="5 3"
            />

            {/* Current area */}
            <path
              d={toPath(currentPts)}
              fill="rgba(6,182,212,0.18)"
              stroke="#06B6D4"
              strokeWidth="2.5"
            />

            {/* Dots – current */}
            {currentPts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="5" fill="#06B6D4" stroke="#fff" strokeWidth="2" />
            ))}

            {/* Labels */}
            {subjects.map((s, i) => {
              const labelPt = getPoint(i, 12.5);
              const meta = subjectMap[s.name] || {};
              return (
                <text
                  key={i}
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--text-main, #1e293b)"
                >
                  {meta.icon} {s.name}
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="db-score-card__legend">
            <span className="db-score-card__legend-item db-score-card__legend-item--current">
              <span /> Hiện tại
            </span>
            <span className="db-score-card__legend-item db-score-card__legend-item--target">
              <span /> Mục tiêu
            </span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="db-score-card__breakdown">
          {subjects.map((s) => {
            const meta = subjectMap[s.name] || {};
            const pct = Math.round((s.current / s.target) * 100);
            return (
              <div key={s.name} className="db-score-card__subject" style={{ '--subj-color': meta.color }}>
                <div className="db-score-card__subject-top">
                  <span className="db-score-card__subject-icon">{meta.icon}</span>
                  <span className="db-score-card__subject-name">{s.name}</span>
                  <span className="db-score-card__subject-current">{s.current}</span>
                  <span className="db-score-card__subject-slash">/</span>
                  <span className="db-score-card__subject-target">{s.target}</span>
                </div>
                <div className="db-score-card__subject-bar">
                  <div
                    className="db-score-card__subject-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="db-score-card__total">
            <div className="db-score-card__total-row">
              <span>Tổng hiện tại</span>
              <strong className="db-score-card__total-current">{totalCurrent}</strong>
            </div>
            <div className="db-score-card__total-row">
              <span>Mục tiêu</span>
              <strong className="db-score-card__total-target">{totalTarget}</strong>
            </div>
            <div className="db-score-card__gap">
              Cần cải thiện thêm <strong style={{ color: '#EF4444' }}>+{gap} điểm</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
