import { useState } from 'react';
import { HiPaperAirplane } from 'react-icons/hi';

const suggestions = [
  'Giải thích bài tập này',
  'Gợi ý lộ trình học',
  'Tóm tắt kiến thức',
  'Khác',
];

export default function ChatbotCard() {
  const [message, setMessage] = useState('');

  return (
    <div className="card chatbot-card animate-in">
      <div className="chatbot-header">
        <h3>Trợ lý AI EduBot</h3>
        <span className="ai-badge">AI</span>
      </div>
      <p className="chatbot-question">Bạn cần hỗ trợ gì hôm nay?</p>
      <div className="chatbot-suggestions">
        {suggestions.map((s, i) => (
          <button key={i} className="chatbot-suggestion" onClick={() => setMessage(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          placeholder="Nhập câu hỏi của bạn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="send-btn"><HiPaperAirplane /></button>
      </div>
      <div className="chatbot-robot">🤖</div>
    </div>
  );
}
