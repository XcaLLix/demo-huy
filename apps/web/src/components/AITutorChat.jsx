import { useState, useRef, useEffect } from 'react';
import { HiPaperAirplane, HiSparkles, HiChatAlt2, HiUser } from 'react-icons/hi';

const channels = [
  { id: 'ai-tutor', name: 'Trợ lý AI EduBot', type: 'ai', subject: 'Tất cả môn học', avatar: '🤖', welcome: 'Chào bạn! Mình là EduBot, trợ lý học tập AI của bạn. Hãy gửi bài tập hoặc câu hỏi bất kỳ, mình sẽ hướng dẫn chi tiết từng bước nhé!' },
  { id: 'teacher-math', name: 'Thầy Thế Anh (Toán)', type: 'teacher', subject: 'Toán học', avatar: '👨‍🏫', welcome: 'Chào Minh Anh, thầy đã nhận được kết quả làm bài khảo sát Hàm số của em. Có chỗ nào chưa hiểu rõ cần thầy giải thích thêm không?' },
  { id: 'teacher-physics', name: 'Cô Thu Hương (Lý)', type: 'teacher', subject: 'Vật lý', avatar: '👩‍🏫', welcome: 'Chào em, bài tập phần Dao động điều hòa em làm rất tốt. Cần hỗ trợ thêm dạng toán nào cứ nhắn cô nhé.' },
  { id: 'teacher-english', name: 'Cô Quỳnh Chi (Anh)', type: 'teacher', subject: 'Tiếng Anh', avatar: '👩‍🏫', welcome: 'Hi Minh Anh! How can I help you with your English learning roadmap today?' }
];

export default function AITutorChat({ addLog }) {
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const [chatHistories, setChatHistories] = useState({
    'ai-tutor': [
      { sender: 'system', text: channels[0].welcome, time: 'Vừa xong' }
    ],
    'teacher-math': [
      { sender: 'system', text: channels[1].welcome, time: 'Vừa xong' }
    ],
    'teacher-physics': [
      { sender: 'system', text: channels[2].welcome, time: 'Vừa xong' }
    ],
    'teacher-english': [
      { sender: 'system', text: channels[3].welcome, time: 'Vừa xong' }
    ]
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistories, typing, activeChannel]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = { sender: 'user', text: inputText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const channelId = activeChannel.id;

    // Update history with User message
    const updatedHistory = [...(chatHistories[channelId] || []), userMessage];
    setChatHistories({
      ...chatHistories,
      [channelId]: updatedHistory
    });

    setInputText('');
    setTyping(true);

    if (channelId === 'ai-tutor') {
      addLog(`Học viên gửi câu hỏi cho AI: "${inputText.substring(0, 40)}..."`, 'sys');
    } else {
      addLog(`Học viên gửi tin nhắn cho giáo viên ${activeChannel.name}: "${inputText.substring(0, 40)}..."`, 'sys');
    }

    // Simulate AI / Teacher response
    setTimeout(() => {
      let replyText = '';
      if (channelId === 'ai-tutor') {
        const query = inputText.toLowerCase();
        if (query.includes('hàm số') || query.includes('toán')) {
          replyText = `**[EduBot giải bài Toán Hàm số]**\n\nĐể giải bài toán hàm số này, ta thực hiện theo 3 bước sau:\n\n1. **Tìm tập xác định**: Đảm bảo mẫu thức khác không hoặc biểu thức trong căn lớn hơn hoặc bằng không.\n2. **Tính đạo hàm y'**: Tìm các điểm mà tại đó y' = 0 hoặc y' không xác định.\n3. **Lập bảng biến thiên**: Từ dấu của y' để suy ra các khoảng đồng biến, nghịch biến.\n\n*Gợi ý*: Phương trình bậc hai $ax^2 + bx + c = 0$ có nghiệm kép khi $\\Delta = b^2 - 4ac = 0$. Em có muốn thử sức với bài toán tương tự không?`;
        } else if (query.includes('lý') || query.includes('dao động')) {
          replyText = `**[EduBot Vật Lý]**\n\nTrong dao động điều hòa, phương trình li độ là:\n$$x = A\\cos(\\omega t + \\varphi)$$\nTrong đó:\n- $A$: Biên độ dao động (luôn dương).\n- $\\omega$: Tần số góc (rad/s).\n- $\\varphi$: Pha ban đầu.\n\n*Lưu ý*: Vận tốc cực đại đạt tại vị trí cân bằng ($v_{max} = \\omega A$), gia tốc cực đại đạt tại biên ($a_{max} = \\omega^2 A$). Em cần giải bài tập số mấy trong đề vậy?`;
        } else {
          replyText = `Cảm ơn bạn đã hỏi! Cầu hỏi của bạn về "${inputText}" đã được ghi nhận. Để hỗ trợ hiệu quả nhất cho kỳ thi THPTQG, bạn có thể gửi cụ thể đề toán học, lý thuyết dao động vật lý hoặc bài tập Tiếng Anh để mình phân tích và giải thích chi tiết nhé! ✨`;
        }
        addLog(`Hệ thống AI tự động trả lời câu hỏi`, 'ai');
      } else {
        // Teacher replies
        replyText = `Cảm ơn Minh Anh. Thầy/Cô đã nhận được câu hỏi của em. Thầy/Cô đang chấm bài thi thử của lớp, thầy/cô sẽ xem chi tiết và phản hồi em vào tối nay nhé. Trong lúc đó, em hãy xem lại video bài giảng và hoàn thành bài luyện tập tuần này nhé! Chúc em học tốt! 💪`;
      }

      const botMessage = { sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

      setChatHistories(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), botMessage]
      }));
      setTyping(false);
    }, 1500);
  };

  return (
    <div className="card chat-view-panel animate-in" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', height: '540px' }}>
        {/* Left Side Channels */}
        <div style={{ width: '220px', borderRight: '1px solid var(--border)', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 'bold' }}>
            HỘI THOẠI HỖ TRỢ
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px' }}>
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  border: 'none',
                  background: activeChannel.id === channel.id ? 'var(--bg-card)' : 'transparent',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: activeChannel.id === channel.id ? '3px solid var(--primary)' : '3px solid transparent',
                  boxShadow: activeChannel.id === channel.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '20px' }}>{channel.avatar}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{channel.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{channel.subject}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Chat window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{activeChannel.avatar}</span>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>{activeChannel.name}</h4>
                <p style={{ fontSize: '11px', color: 'var(--accent-green)' }}>● Đang trực tuyến</p>
              </div>
            </div>
            {activeChannel.type === 'ai' && (
              <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                <HiSparkles style={{ marginRight: 4, verticalAlign: 'middle' }} /> AI Assistant
              </span>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {chatHistories[activeChannel.id]?.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeInUp 0.2s ease forwards'
                }}
              >
                <div
                  style={{
                    background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-main)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderTopLeftRadius: msg.sender === 'user' ? '16px' : '2px',
                    borderTopRightRadius: msg.sender === 'user' ? '2px' : '16px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    boxShadow: 'var(--shadow-sm)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{msg.time}</span>
              </div>
            ))}
            {typing && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-main)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'bounce 1s infinite' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'bounce 1s infinite 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: 'bounce 1s infinite 0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={activeChannel.type === 'ai' ? "Hỏi AI công thức, lời giải..." : "Nhập câu hỏi thảo luận..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                outline: 'none',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifycontent: 'center',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <HiPaperAirplane style={{ fontSize: '18px', transform: 'rotate(90deg)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
