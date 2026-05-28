import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const data = [
  { date: '06/05', toan: 60, vatly: 55, anh: 58 },
  { date: '07/05', toan: 65, vatly: 58, anh: 62 },
  { date: '08/05', toan: 62, vatly: 60, anh: 65 },
  { date: '09/05', toan: 70, vatly: 57, anh: 68 },
  { date: '10/05', toan: 72, vatly: 62, anh: 70 },
  { date: '11/05', toan: 75, vatly: 63, anh: 71 },
  { date: '12/05', toan: 78, vatly: 65, anh: 72 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff', padding: '10px 14px', borderRadius: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E8ECF1',
        fontSize: 12
      }}>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: <strong>{p.value}%</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressChart() {
  return (
    <div className="card progress-chart animate-in">
      <div className="chart-header">
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>TIẾN ĐỘ HỌC TẬP</h3>
        <div className="chart-legends">
          <span className="chart-legend">
            <span className="dot" style={{ background: '#6C5CE7' }} /> Toán học
          </span>
          <span className="chart-legend">
            <span className="dot" style={{ background: '#0984E3' }} /> Vật lý
          </span>
          <span className="chart-legend">
            <span className="dot" style={{ background: '#00B894' }} /> Tiếng Anh
          </span>
        </div>
        <div className="chart-period">7 ngày qua ▾</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#B2BEC3' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#B2BEC3' }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="toan" name="Toán học" stroke="#6C5CE7"
            strokeWidth={2.5} dot={{ r: 3, fill: '#6C5CE7' }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="vatly" name="Vật lý" stroke="#0984E3"
            strokeWidth={2.5} dot={{ r: 3, fill: '#0984E3' }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="anh" name="Tiếng Anh" stroke="#00B894"
            strokeWidth={2.5} dot={{ r: 3, fill: '#00B894' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
