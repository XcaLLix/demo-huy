import React, { useState, useEffect, useRef } from 'react';
import { HiSparkles, HiChevronRight, HiDatabase, HiTerminal, HiTrash, HiOutlineChat, HiOutlineLightBulb } from 'react-icons/hi';
import { aiService } from '../../../services/aiService';

export default function AITutorPanel({ lesson, onClose, initialQuery }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const messagesEndRef = useRef(null);

  const lessonId = lesson?.id || 'default';
  const lessonTitle = lesson?.title || 'Bài học';

  // Load chat history from localStorage (Simulating DB history)
  useEffect(() => {
    const historyKey = `ai_tutor_history_${lessonId}`;
    const savedHistory = localStorage.getItem(historyKey);
    const savedTokens = localStorage.getItem(`ai_tutor_tokens_${lessonId}`);
    
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    } else {
      // Welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Xin chào! Tôi là Trợ lý AI EduPath học tập của bạn. Tôi đang hỗ trợ bài học hiện tại: "${lessonTitle}". Hãy đặt câu hỏi bất kỳ về bài học này hoặc sử dụng các gợi ý bên dưới để ôn tập nhé!`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    if (savedTokens) {
      setTokenCount(Number(savedTokens));
    } else {
      setTokenCount(0);
    }
  }, [lessonId, lessonTitle]);

  // Save messages to history
  const saveHistory = (updatedMessages, updatedTokens) => {
    localStorage.setItem(`ai_tutor_history_${lessonId}`, JSON.stringify(updatedMessages));
    if (updatedTokens !== undefined) {
      localStorage.setItem(`ai_tutor_tokens_${lessonId}`, updatedTokens.toString());
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendQuery = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await aiService.sendAiMessage(queryText, lesson);
      
      // Calculate fake token consumption
      const queryTokens = Math.floor(queryText.length * 0.5) + 10;
      const respTokens = Math.floor(response.length * 0.4) + 15;
      const nextTokens = tokenCount + queryTokens + respTokens;
      setTokenCount(nextTokens);

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      const updated = [...newMessages, assistantMessage];
      setMessages(updated);
      saveHistory(updated, nextTokens);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi em, có lỗi kết nối đến máy chủ AI. Vui lòng kiểm tra lại đường truyền mạng nhé.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      const updated = [...newMessages, errorMessage];
      setMessages(updated);
      saveHistory(updated);
    } finally {
      setLoading(false);
    }
  };

  // Handle initial query from parent (e.g. click Sparkle in transcript or explain in flashcards)
  useEffect(() => {
    if (initialQuery && typeof initialQuery === 'object' && initialQuery.text && initialQuery.text.trim()) {
      handleSendQuery(initialQuery.text);
    }
  }, [initialQuery]);

  const handleClearHistory = () => {
    const defaultMsg = [
      {
        role: 'assistant',
        content: `Lịch sử chat đã được xóa. Tôi sẵn sàng hỗ trợ bạn cho bài học: "${lessonTitle}".`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
    setTokenCount(0);
    localStorage.removeItem(`ai_tutor_history_${lessonId}`);
    localStorage.removeItem(`ai_tutor_tokens_${lessonId}`);
  };

  const presetActions = [
    { label: 'Tóm tắt bài này', query: 'Hãy tóm tắt ngắn gọn các kiến thức trọng tâm trong bài học này cho tôi.' },
    { label: 'Giải thích công thức chính', query: 'Liệt kê và giải thích chi tiết các công thức toán/lý/hóa quan trọng nhất trong bài học này.' },
    { label: 'Cho câu hỏi tương tự', query: 'Hãy tạo cho tôi 1 câu hỏi trắc nghiệm tương tự nội dung bài học này để tôi luyện tập giải.' }
  ];

  return (
    <div className="ai-tutor-panel animate-in">
      <div className="ai-tutor-header">
        <div className="ai-tutor-header-title">
          <HiSparkles className="ai-sparkle-icon" />
          <div>
            <h3>Gia sư AI EduPath</h3>
            <p>Trợ lý học tập thông minh 24/7</p>
          </div>
        </div>
        <div className="ai-tutor-header-actions">
          <button 
            type="button" 
            onClick={handleClearHistory} 
            className="btn-clear-history"
            title="Xóa lịch sử chat"
          >
            <HiTrash />
          </button>
        </div>
      </div>

      <div className="ai-tutor-stats">
        <div className="stat-item">
          <HiDatabase className="stat-icon" />
          <span>Lịch sử: {messages.length - 1} lượt</span>
        </div>
        <div className="stat-item">
          <HiTerminal className="stat-icon" />
          <span>Tokens: {tokenCount.toLocaleString()} / 10,000</span>
        </div>
      </div>

      <div className="ai-tutor-messages">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`ai-message-bubble ${isUser ? 'user' : 'assistant'}`}>
              <div className="bubble-avatar">
                {isUser ? 'U' : <HiSparkles />}
              </div>
              <div className="bubble-content-wrapper">
                <div className="bubble-text">
                  {msg.content.split('\n').map((line, lIdx) => (
                    <span key={lIdx} style={{ display: 'block', marginBottom: line === '' ? '10px' : '0' }}>{line}</span>
                  ))}
                </div>
                <span className="bubble-time">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="ai-message-bubble assistant">
            <div className="bubble-avatar">
              <HiSparkles className="spinning" />
            </div>
            <div className="bubble-content-wrapper">
              <div className="ai-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-tutor-footer">
        <div className="ai-presets-rail">
          {presetActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(action.query)}
              className="preset-chip"
              disabled={loading}
            >
              <HiOutlineLightBulb style={{ marginRight: 4 }} />
              {action.label}
            </button>
          ))}
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputText);
          }} 
          className="ai-chat-input-form"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Hỏi AI công thức hoặc mẹo giải nhanh..."
            className="ai-chat-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn-send-ai" 
            disabled={loading || !inputText.trim()}
          >
            <HiChevronRight />
          </button>
        </form>
      </div>
    </div>
  );
}
