import React, { useState } from 'react';

const RETAKE_MODES = [
  {
    mode: 'wrong_only',
    icon: '❌',
    title: 'Làm lại câu sai',
    desc: 'Chỉ luyện những câu bạn trả lời sai để củng cố lỗ hổng kiến thức',
    color: '#e17055',
    bg: '#e1705510',
    border: '#e1705530',
    badge: 'Hiệu quả'
  },
  {
    mode: 'wrong_similar',
    icon: '🔮',
    title: 'Đề tương tự câu sai AI',
    desc: 'Tạo đề thi mới gồm các câu tương tự các câu bạn đã làm sai bằng AI',
    color: '#a29bfe',
    bg: '#a29bfe10',
    border: '#a29bfe30',
    badge: 'Đặc biệt'
  },
  {
    mode: 'weak_topic',
    icon: '📚',
    title: 'Luyện chủ đề yếu',
    desc: 'Câu hỏi từ các chủ đề có tỷ lệ đúng dưới 60% để ôn tập trọng tâm',
    color: '#f39c12',
    bg: '#f39c1210',
    border: '#f39c1230',
    badge: 'Đề xuất'
  },
  {
    mode: 'bookmarked',
    icon: '🔖',
    title: 'Làm lại câu đánh dấu',
    desc: 'Ôn lại những câu bạn đã đánh dấu cần xem lại trong lúc thi',
    color: '#6c5ce7',
    bg: '#6c5ce710',
    border: '#6c5ce730',
    badge: null
  },
  {
    mode: 'ai_similar',
    icon: '🤖',
    title: 'Đề tương tự AI',
    desc: 'Hệ thống AI tự động soạn thảo đề thi mới bám sát cấu trúc đề này',
    color: '#00b894',
    bg: '#00b89410',
    border: '#00b89430',
    badge: 'Mới'
  },
  {
    mode: 'full',
    icon: '📝',
    title: 'Thi lại full đề',
    desc: 'Làm lại toàn bộ đề thi trong điều kiện thực tế để đo tiến bộ',
    color: '#0984e3',
    bg: '#0984e310',
    border: '#0984e330',
    badge: null
  }
];

export default function SmartRetakeOptions({ examId, attemptId, onRetake, wrongCount = 0, bookmarkedCount = 0 }) {
  const [selected, setSelected] = useState(null);

  const getSubtext = (mode) => {
    if (mode === 'wrong_only' || mode === 'wrong_similar') return wrongCount > 0 ? `${wrongCount} câu` : 'Không có câu sai';
    if (mode === 'bookmarked') return bookmarkedCount > 0 ? `${bookmarkedCount} câu` : 'Không có câu đánh dấu';
    return null;
  };

  const isDisabled = (mode) => {
    if (mode === 'wrong_only' || mode === 'wrong_similar') return wrongCount === 0;
    if (mode === 'bookmarked') return bookmarkedCount === 0;
    return false;
  };

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
          ⚡ Chế độ ôn luyện thông minh
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Chọn cách bạn muốn luyện tập tiếp theo
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {RETAKE_MODES.map(({ mode, icon, title, desc, color, bg, border, badge }) => {
          const disabled = isDisabled(mode);
          const subtext = getSubtext(mode);
          const isActive = selected === mode;

          return (
            <button
              key={mode}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setSelected(mode);
                  onRetake(examId, mode, attemptId);
                }
              }}
              style={{
                background: isActive ? bg : 'transparent',
                border: `1.5px solid ${isActive ? color : disabled ? 'var(--border)' : border}`,
                borderRadius: '12px',
                padding: '16px 14px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                boxSizing: 'border-box',
                whiteSpace: 'normal'
              }}
            >
              {badge && (
                <span style={{
                  position: 'absolute', top: '8px', right: '10px',
                  fontSize: '10px', fontWeight: '700', color,
                  background: `${color}18`, padding: '2px 7px', borderRadius: '99px'
                }}>
                  {badge}
                </span>
              )}
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: disabled ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom: '4px' }}>
                {title}
              </div>
              {subtext && (
                <div style={{ fontSize: '11px', color, fontWeight: '700', marginBottom: '4px' }}>
                  {subtext}
                </div>
              )}
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
