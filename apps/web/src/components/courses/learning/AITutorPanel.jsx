import React, { useState, useEffect, useRef } from 'react';
import { HiSparkles, HiChevronRight, HiDatabase, HiTerminal, HiTrash, HiOutlineLightBulb, HiOutlineCog, HiOutlineQuestionMarkCircle, HiOutlinePhotograph, HiX } from 'react-icons/hi';
import { aiService } from '../../../services/aiService';
import { API_BASE } from '../../../api';

export default function AITutorPanel({ lesson, onClose, initialQuery }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const messagesEndRef = useRef(null);

  const lessonId = lesson?.id || 'default';
  const lessonTitle = lesson?.title || 'Bài học';

  // Personal API Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('user_openrouter_api_key') || '');
  const [userModel, setUserModel] = useState(() => localStorage.getItem('user_openrouter_model') || 'google/gemini-2.5-flash');

  const handleSaveSettings = () => {
    localStorage.setItem('user_openrouter_api_key', userApiKey.trim());
    localStorage.setItem('user_openrouter_model', userModel);
    setShowSettings(false);
    alert('Đã lưu cấu hình API Key cá nhân!');
  };

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
          content: `Xin chào em! Thầy là **Gia sư AI EduPath**, trợ lý học tập 24/7 của em. 

Thầy đang đồng hành cùng em trong bài học: **"${lessonTitle}"**. Em hãy chọn các gợi ý ôn tập bên dưới hoặc nhập câu hỏi trực tiếp để thầy giải đáp chi tiết như một chuyên gia nhé!`,
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

  // Typeset math with MathJax whenever messages or loading state updates
  useEffect(() => {
    if (window.MathJax) {
      const timer = setTimeout(() => {
        window.MathJax.typesetPromise?.().catch((err) => console.log("MathJax error:", err));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messages, loading]);

  const cleanStreamedContent = (text) => {
    if (!text) return '';
    return text
      .replace(/^(User Safety:\s*safe|Response Safety:\s*safe|Moderation:\s*safe)\s*\n?/gi, '')
      .replace(/\n(User Safety:\s*safe|Response Safety:\s*safe|Moderation:\s*safe)\s*\n?/gi, '\n')
      .trim();
  };

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
      const historyToSend = messages
        .filter(m => m.content && !m.content.startsWith('Lịch sử cuộc hội thoại đã được xóa'))
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      let hasAppendedAssistant = false;

      const response = await aiService.sendAiMessage(
        queryText,
        lesson,
        historyToSend,
        (chunkText) => {
          const cleanedChunk = cleanStreamedContent(chunkText);
          if (!cleanedChunk) return;
          setLoading(false); // Stop loading indicator immediately as we receive the first token
          setMessages(prev => {
            const updated = [...prev];
            if (!hasAppendedAssistant) {
              hasAppendedAssistant = true;
              updated.push({
                role: 'assistant',
                content: cleanedChunk,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              });
            } else {
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.role === 'assistant') {
                lastMsg.content = cleanedChunk;
              }
            }
            return updated;
          });
        }
      );

      // Finalize and calculate token consumption
      setLoading(false);
      const cleanedFinal = cleanStreamedContent(response);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        
        let finalMessages = updated;
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = cleanedFinal;
        } else {
          finalMessages = [
            ...updated,
            {
              role: 'assistant',
              content: cleanedFinal,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            }
          ];
        }

        const queryTokens = Math.floor(queryText.length * 0.5) + 10;
        const respTokens = Math.floor(response.length * 0.4) + 15;
        const nextTokens = tokenCount + queryTokens + respTokens;
        setTokenCount(nextTokens);

        saveHistory(finalMessages, nextTokens);
        return finalMessages;
      });

    } catch (err) {
      setLoading(false);
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi em, có lỗi kết nối đến máy chủ AI. Vui lòng kiểm tra lại đường truyền mạng nhé.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      const updated = [...newMessages, errorMessage];
      setMessages(updated);
      saveHistory(updated);
    }
  };

  // Handle initial query from parent
  useEffect(() => {
    if (initialQuery && typeof initialQuery === 'object' && initialQuery.text && initialQuery.text.trim()) {
      handleSendQuery(initialQuery.text);
    }
  }, [initialQuery]);

  const handleClearHistory = () => {
    const defaultMsg = [
      {
        role: 'assistant',
        content: `Lịch sử cuộc hội thoại đã được xóa sạch. Thầy sẵn sàng hỗ trợ em cho bài học: **"${lessonTitle}"**.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
    setTokenCount(0);
    localStorage.removeItem(`ai_tutor_history_${lessonId}`);
    localStorage.removeItem(`ai_tutor_tokens_${lessonId}`);
  };

  const presetActions = [
    { label: 'Tóm tắt bài này 📚', query: 'Hãy tóm tắt ngắn gọn các kiến thức trọng tâm trong bài học này cho tôi.' },
    { label: 'Giải thích công thức chính 🧮', query: 'Liệt kê và giải thích chi tiết các công thức toán/lý/hóa quan trọng nhất trong bài học này.' },
    { label: 'Câu hỏi tương tự ❓', query: 'Hãy tạo cho tôi 1 câu hỏi trắc nghiệm tương tự nội dung bài học này để tôi luyện tập giải.' }
  ];

  // Robust custom markdown parser that outputs React elements
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    const renderedElements = [];
    let tableRows = [];
    let isInsideTable = false;

    const parseInlineMarkdown = (text) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} style={{ color: '#0f172a', fontWeight: '800' }}>{part.slice(2, -2)}</strong>;
        }
        
        const innerParts = part.split(/(\`[^\`]+\`)/g);
        return innerParts.map((subPart, subIndex) => {
          if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return (
              <code 
                key={subIndex} 
                style={{ 
                  background: '#f1f5f9', 
                  padding: '2px 6px', 
                  borderRadius: '6px', 
                  fontFamily: 'Consolas, Monaco, monospace', 
                  fontSize: '12px', 
                  color: '#4f46e5', 
                  fontWeight: '700' 
                }}
              >
                {subPart.slice(1, -1)}
              </code>
            );
          }
          return subPart;
        });
      });
    };

    const renderTable = (rows, key) => {
      if (rows.length < 2) return null;
      
      const headers = rows[0].split('|').map(cell => cell.trim()).filter(Boolean);
      const dataRows = rows.slice(2).map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));

      return (
        <div key={key} style={{ overflowX: 'auto', margin: '14px 0', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#ffffff', minWidth: '320px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'left' }}>
                    {parseInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: rIdx === dataRows.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '10px 14px', color: '#334155', lineHeight: 1.4 }}>
                      {parseInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    let elementKey = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        if (!isInsideTable) {
          isInsideTable = true;
          tableRows = [];
        }
        tableRows.push(line);
      } else {
        if (isInsideTable) {
          renderedElements.push(renderTable(tableRows, `table-${elementKey++}`));
          isInsideTable = false;
          tableRows = [];
        }

        if (line.startsWith('* ') || line.startsWith('- ')) {
          renderedElements.push(
            <li key={`list-${elementKey++}`} style={{ marginLeft: '16px', marginBottom: '6px', listStyleType: 'disc', color: '#334155', lineHeight: 1.5 }}>
              {parseInlineMarkdown(line.slice(2))}
            </li>
          );
        } else if (/^\d+\.\s+/.test(line)) {
          const dotIdx = line.indexOf('.');
          const number = line.slice(0, dotIdx + 1);
          const text = line.slice(dotIdx + 1).trim();
          renderedElements.push(
            <div key={`ord-${elementKey++}`} style={{ display: 'flex', gap: '6px', marginBottom: '8px', color: '#334155', lineHeight: 1.5 }}>
              <span style={{ fontWeight: '800', color: '#6366f1', flexShrink: 0 }}>{number}</span>
              <span>{parseInlineMarkdown(text)}</span>
            </div>
          );
        } else {
          if (line === '') {
            renderedElements.push(<div key={`space-${elementKey++}`} style={{ height: '8px' }} />);
          } else {
            renderedElements.push(
              <p key={`p-${elementKey++}`} style={{ margin: '0 0 10px 0', lineHeight: '1.6', color: '#334155' }}>
                {parseInlineMarkdown(lines[i])}
              </p>
            );
          }
        }
      }
    }

    if (isInsideTable) {
      renderedElements.push(renderTable(tableRows, `table-${elementKey++}`));
    }

    return <div>{renderedElements}</div>;
  };

  return (
    <div className="ai-tutor-panel animate-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff' }}>
      {/* Header */}
      <div className="ai-tutor-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
        <div className="ai-tutor-header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '18px',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
          }}>
            <HiSparkles />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Gia sư AI EduPath</h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>Trợ lý học tập thông minh 24/7</p>
          </div>
        </div>
        <div className="ai-tutor-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => {
              setShowGuide(!showGuide);
              setShowSettings(false);
            }} 
            className="btn-guide"
            title="Hướng dẫn cấu hình AI Miễn phí"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: showGuide ? '#6366f1' : '#f59e0b', 
              cursor: 'pointer', 
              fontSize: '19px', 
              display: 'flex', 
              alignItems: 'center',
              animation: 'attention-rotate 3s infinite ease-in-out'
            }}
          >
            <HiOutlineQuestionMarkCircle />
          </button>
          <button 
            type="button" 
            onClick={() => {
              setShowSettings(!showSettings);
              setShowGuide(false);
            }} 
            className="btn-settings"
            title="Cấu hình API Key cá nhân"
            style={{ background: 'none', border: 'none', color: showSettings ? '#6366f1' : '#94a3b8', cursor: 'pointer', fontSize: '18px', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
            onMouseLeave={(e) => e.currentTarget.style.color = showSettings ? '#6366f1' : '#94a3b8'}
          >
            <HiOutlineCog />
          </button>
          <button 
            type="button" 
            onClick={handleClearHistory} 
            className="btn-clear-history"
            title="Xóa lịch sử chat"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <HiTrash />
          </button>
        </div>
      </div>

      {/* Free AI configuration guide panel */}
      {showGuide && (
        <div style={{
          background: '#fef3c7',
          borderBottom: '1px solid #fde68a',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          textAlign: 'left'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            💡 Hướng dẫn cấu hình AI Miễn phí 100%
          </h4>
          <p style={{ fontSize: '11px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
            Học sinh có thể cấu hình API Key cá nhân để trò chuyện với Gia sư AI hoàn toàn miễn phí mà không lo giới hạn hàng ngày:
          </p>
          <ol style={{ fontSize: '11.5px', color: '#78350f', margin: '0 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: '600' }}>
            <li>Đăng ký tài khoản miễn phí tại OpenRouter.</li>
            <li>Tạo khóa API Key (miễn phí, không yêu cầu thẻ).</li>
            <li>Bấm bánh răng ⚙️ bên cạnh, dán Key và chọn model Gemini 2.5 Flash (Miễn phí).</li>
          </ol>
          <a 
            href="https://openrouter.ai/settings/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#d97706',
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: '800',
              textAlign: 'center',
              marginTop: '4px',
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
            }}
          >
            Tạo API Key miễn phí ngay 🔑
          </a>
        </div>
      )}

      {/* Personal API settings panel */}
      {showSettings && (
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          textAlign: 'left'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚙️ Cấu hình API Key cá nhân (Pay-as-you-go)
          </h4>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
            Nhập API Key OpenRouter cá nhân của em để gọi mô hình AI cao cấp và bỏ qua giới hạn lượt hỏi miễn phí hàng ngày.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>OpenRouter API Key:</label>
            <input 
              type="password"
              placeholder="sk-or-v1-..."
              value={userApiKey}
              onChange={e => setUserApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Mô hình AI thông minh:</label>
            <select
              value={userModel}
              onChange={e => setUserModel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                background: '#fff'
              }}
            >
              <option value="google/gemini-2.5-flash">⚡ Google Gemini 2.5 Flash (Khuyên dùng - Rất nhanh & Đọc ảnh)</option>
              <option value="google/gemini-2.5-pro">🚀 Google Gemini 2.5 Pro (Cao cấp - Rất thông minh & Đọc ảnh)</option>
              <option value="meta-llama/llama-3.2-11b-vision-instruct:free">🖼️ Llama 3.2 Vision (Miễn phí hoàn toàn - Đọc ảnh cực nhanh)</option>
              <option value="google/gemini-2.5-flash:free">⚡ Google Gemini 2.5 Flash (Miễn phí - Chỉ chat chữ)</option>
              <option value="qwen/qwen-2.5-72b-instruct:free">🤖 Qwen 2.5 72B (Miễn phí - Logic xuất sắc)</option>
              <option value="deepseek/deepseek-chat">🧠 DeepSeek Chat V3 (Trả phí - Cực thông minh)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={handleSaveSettings}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Lưu cấu hình
            </button>
            <button
              onClick={() => {
                setUserApiKey('');
                localStorage.removeItem('user_openrouter_api_key');
                alert('Đã xóa API Key cá nhân, hệ thống sẽ sử dụng key dùng chung của lớp học.');
              }}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Xóa Key
            </button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="ai-tutor-stats" style={{ display: 'flex', background: '#f8fafc', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
        <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
          <HiDatabase style={{ fontSize: '13px', color: '#94a3b8' }} />
          <span>Lịch sử: {messages.length - 1} lượt</span>
        </div>
        <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>
          <HiTerminal style={{ fontSize: '13px', color: '#94a3b8' }} />
          <span>Hạn mức: {tokenCount.toLocaleString()} / 10,000</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="ai-tutor-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={idx} 
              className={`ai-message-bubble ${isUser ? 'user' : 'assistant'}`} 
              style={{ 
                display: 'flex', 
                gap: '12px', 
                maxWidth: '85%', 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}
            >
              <div 
                className="bubble-avatar" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  flexShrink: 0,
                  background: isUser ? '#dbeafe' : 'linear-gradient(135deg, #818cf8, #6366f1)',
                  color: isUser ? '#2563eb' : '#ffffff',
                  boxShadow: isUser ? 'none' : '0 2px 6px rgba(99, 102, 241, 0.15)'
                }}
              >
                {isUser ? 'U' : <HiSparkles />}
              </div>
              <div className="bubble-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                {msg.imageUrl && (
                  <div style={{ position: 'relative', maxWidth: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded exercise illustration" 
                      style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '180px', objectFit: 'cover' }} 
                    />
                  </div>
                )}
                {msg.content && (
                  <div 
                    className="bubble-text animate-in" 
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '18px', 
                      fontSize: '13.5px', 
                      lineHeight: '1.6', 
                      wordBreak: 'break-word',
                      textAlign: 'left',
                      background: isUser ? '#eff6ff' : '#f8fafc',
                      color: isUser ? '#1e40af' : '#334155',
                      border: isUser ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid rgba(226, 232, 240, 0.8)',
                      borderTopRightRadius: isUser ? 0 : '18px',
                      borderTopLeftRadius: isUser ? '18px' : 0,
                      boxShadow: isUser ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.01)'
                    }}
                  >
                    {renderFormattedContent(msg.content)}
                  </div>
                )}
                <span className="bubble-time" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="ai-message-bubble assistant" style={{ display: 'flex', gap: '12px', maxWidth: '85%', alignSelf: 'flex-start' }}>
            <div 
              className="bubble-avatar" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '12px', 
                fontWeight: '800', 
                flexShrink: 0,
                background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.15)'
              }}
            >
              <HiSparkles className="spinning" />
            </div>
            <div className="bubble-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div 
                className="bubble-text" 
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '18px', 
                  background: '#f8fafc',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderTopLeftRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div className="ai-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="ai-loading-text">
                  Gia sư AI đang kết nối & soạn bài giải...
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="ai-tutor-footer" style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputText);
          }} 
          className="ai-chat-input-form"
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Hỏi AI công thức hoặc mẹo giải nhanh..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              fontSize: '13.5px',
              fontWeight: '500',
              outline: 'none',
              transition: 'all 0.2s',
              background: '#ffffff',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
              e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.02)';
            }}
          />
          <button 
            type="submit" 
            disabled={loading || !inputText.trim()}
            style={{
              width: '38px',
              height: '38px',
              background: loading || !inputText.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #818cf8, #6366f1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.2s',
              boxShadow: loading || !inputText.trim() ? 'none' : '0 4px 10px rgba(99, 102, 241, 0.2)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!loading && inputText.trim()) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && inputText.trim()) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            <HiChevronRight />
          </button>
        </form>
      </div>
    </div>
  );
}
