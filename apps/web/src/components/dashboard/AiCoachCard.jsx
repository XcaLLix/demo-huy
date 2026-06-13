import { useState } from 'react';

const AI_MESSAGES = [
  {
    topic: 'Dao động điều hòa',
    subject: 'Vật lý',
    message:
      'Hôm qua bạn gặp khó khăn với chủ đề **Dao động điều hòa**. Mình đã chuẩn bị một bài ôn tập cá nhân hóa dành riêng cho bạn!',
    icon: '⚡',
    color: '#0EA5E9',
  },
  {
    topic: 'Hàm số và đồ thị',
    subject: 'Toán học',
    message:
      'Tỷ lệ đúng của bạn trong **Hàm số bậc 3** chỉ đạt 54%. AI đã phân tích và chuẩn bị 8 câu luyện tập trọng tâm cho bạn!',
    icon: '📊',
    color: '#7C3AED',
  },
];

export default function AiCoachCard({ onNavigateTo }) {
  const [msgIndex] = useState(0);
  const msg = AI_MESSAGES[msgIndex];

  const renderMessage = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: '#fff' }}>{part}</strong> : part
    );
  };

  return (
    <div className="db-ai-coach" style={{ '--coach-color': msg.color }}>
      {/* Decorative bg */}
      <div className="db-ai-coach__bg" />

      <div className="db-ai-coach__inner">
        {/* Bot avatar */}
        <div className="db-ai-coach__bot">
          <span className="db-ai-coach__bot-icon">🤖</span>
          <div className="db-ai-coach__pulse" />
        </div>

        {/* Content */}
        <div className="db-ai-coach__content">
          <div className="db-ai-coach__badge">
            <span className="db-ai-coach__badge-dot" />
            EduBot AI · Phân tích cá nhân hóa
          </div>

          <p className="db-ai-coach__message">
            {renderMessage(msg.message)}
          </p>

          <div className="db-ai-coach__subject-pill">
            {msg.icon} {msg.subject} · {msg.topic}
          </div>

          <div className="db-ai-coach__actions">
            <button
              className="db-ai-coach__btn db-ai-coach__btn--primary"
              onClick={() => onNavigateTo && onNavigateTo('path')}
              id="ai-coach-review-btn"
            >
              📖 Ôn tập ngay
            </button>
            <button
              className="db-ai-coach__btn db-ai-coach__btn--ghost"
              onClick={() => onNavigateTo && onNavigateTo('ai-qa')}
              id="ai-coach-ask-btn"
            >
              💬 Hỏi AI Tutor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
