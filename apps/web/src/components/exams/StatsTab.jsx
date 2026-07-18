import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function StatsTab({ stats }) {
  const bySubject = stats?.charts?.bySubject || [
    { subject: 'Toán học', count: 4 },
    { subject: 'Vật lý', count: 2 },
    { subject: 'Hóa học', count: 0 }
  ];

  const byDifficulty = stats?.charts?.byDifficulty || [
    { difficulty: 'EASY', count: 2 },
    { difficulty: 'MEDIUM', count: 3 },
    { difficulty: 'HARD', count: 1 }
  ];

  // Difficulty translations
  const difficultyMapping = {
    EASY: 'Dễ',
    MEDIUM: 'Trung bình',
    HARD: 'Khó'
  };

  const pieData = byDifficulty.map(d => ({
    name: difficultyMapping[d.difficulty] || d.difficulty,
    value: d.count
  })).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Subject Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14.5px', fontWeight: 800 }}>Số lượng câu hỏi theo Môn học</h4>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={bySubject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Số lượng câu" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14.5px', fontWeight: 800 }}>Phân bố câu hỏi theo độ khó</h4>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length === 0 ? (
              <span style={{ fontSize: '13px', color: '#64748b' }}>Không có dữ liệu</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value, entry) => <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{value} ({entry.payload.value})</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
