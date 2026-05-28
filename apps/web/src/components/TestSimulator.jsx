import { useState, useEffect } from 'react';
import { HiClock, HiCheckCircle, HiChevronRight, HiChevronLeft, HiSparkles } from 'react-icons/hi';

const sampleQuizQuestions = [
  {
    id: 1,
    question: "Cho hàm số $y = x^3 - 3x^2 + 2$. Khẳng định nào sau đây về tính đơn điệu của hàm số là ĐÚNG?",
    options: [
      { key: 'A', value: "Hàm số đồng biến trên khoảng $(0; 2)$" },
      { key: 'B', value: "Hàm số nghịch biến trên khoảng $(0; 2)$" },
      { key: 'C', value: "Hàm số nghịch biến trên khoảng $(-\\infty; 0)$" },
      { key: 'D', value: "Hàm số đồng biến trên khoảng $(2; +\\infty)$ và nghịch biến trên $(-\\infty; 0)$" }
    ],
    correctAnswer: 'B',
    difficulty: 'Dễ',
    difficultyClass: 'diff-easy',
    explanation: "Đạo hàm: y' = 3x^2 - 6x = 3x(x - 2).\ny' = 0 <=> x = 0 hoặc x = 2.\nLập bảng biến thiên:\n- Trong khoảng (0; 2), y' < 0 => Hàm số nghịch biến trên khoảng (0; 2).\n- Trong khoảng (-oo; 0) và (2; +oo), y' > 0 => Hàm số đồng biến.",
    topic: "Sự biến thiên của hàm số"
  },
  {
    id: 2,
    question: "Một vật dao động điều hòa theo phương trình $x = 5\\cos(4\\pi t + \\pi/3)$ (cm). Biên độ và pha ban đầu của dao động lần lượt là:",
    options: [
      { key: 'A', value: "5 cm; \\pi/3 rad" },
      { key: 'B', value: "5 cm; 4\\pi t rad" },
      { key: 'C', value: "-5 cm; \\pi/3 rad" },
      { key: 'D', value: "5 cm; 4\\pi rad" }
    ],
    correctAnswer: 'A',
    difficulty: 'Dễ',
    difficultyClass: 'diff-easy',
    explanation: "Phương trình dao động điều hòa có dạng: x = A cos(omega t + phi).\nSo sánh phương trình dao động x = 5 cos(4*pi*t + pi/3) (cm):\n- Biên độ dao động: A = 5 (cm).\n- Pha ban đầu: phi = pi/3 (rad).",
    topic: "Dao động điều hòa"
  },
  {
    id: 3,
    question: "Cho khối chóp S.ABC có đáy ABC là tam giác vuông tại B, AB = a, BC = 2a, cạnh bên SA vuông góc với đáy và SA = 3a. Thể tích V của khối chóp S.ABC bằng:",
    options: [
      { key: 'A', value: "V = a^3" },
      { key: 'B', value: "V = 3a^3" },
      { key: 'C', value: "V = 2a^3" },
      { key: 'D', value: "V = a^3 / 3" }
    ],
    correctAnswer: 'A',
    difficulty: 'Trung bình',
    difficultyClass: 'diff-medium',
    explanation: "Diện tích đáy S_ABC = 1/2 * AB * BC = 1/2 * a * 2a = a^2.\nThể tích khối chóp: V = 1/3 * SA * S_ABC = 1/3 * 3a * a^2 = a^3.",
    topic: "Thể tích khối đa diện"
  },
  {
    id: 4,
    question: "Trong không gian Oxyz, cho mặt cầu (S): x^2 + y^2 + z^2 - 2x + 4y - 6z - 2 = 0. Tâm I và bán kính R của mặt cầu là:",
    options: [
      { key: 'A', value: "I(1; -2; 3), R = 4" },
      { key: 'B', value: "I(-1; 2; -3), R = 4" },
      { key: 'C', value: "I(1; -2; 3), R = 16" },
      { key: 'D', value: "I(1; -2; 3), R = sqrt(14)" }
    ],
    correctAnswer: 'A',
    difficulty: 'Trung bình',
    difficultyClass: 'diff-medium',
    explanation: "Mặt cầu (S) có hệ số: a = 1, b = -2, c = 3, d = -2.\nTâm mặt cầu I(a; b; c) => I(1; -2; 3).\nBán kính R = sqrt(a^2 + b^2 + c^2 - d) = sqrt(1 + 4 + 9 - (-2)) = sqrt(16) = 4.",
    topic: "Phương trình mặt cầu"
  },
  {
    id: 5,
    question: "Tìm tất cả các giá trị thực của tham số m để phương trình $9^x - 2.3^x + m = 0$ có hai nghiệm thực phân biệt?",
    options: [
      { key: 'A', value: "m < 1" },
      { key: 'B', value: "0 < m < 1" },
      { key: 'C', value: "m > 0" },
      { key: 'D', value: "m <= 0" }
    ],
    correctAnswer: 'B',
    difficulty: 'Khó',
    difficultyClass: 'diff-hard',
    explanation: "Đặt t = 3^x (t > 0). Phương trình trở thành: t^2 - 2t + m = 0 (*).\nĐể phương trình ban đầu có 2 nghiệm thực phân biệt thì phương trình (*) phải có 2 nghiệm t dương phân biệt (t1 > 0, t2 > 0).\nĐiều kiện:\n1) Delta' = 1 - m > 0 <=> m < 1\n2) S = t1 + t2 = 2 > 0 (luôn đúng)\n3) P = t1.t2 = m > 0 <=> m > 0.\nKết hợp điều kiện: 0 < m < 1.",
    topic: "Phương trình mũ và lôgarit"
  }
];

export default function TestSimulator({ testName, onFinished, addLog }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 mins
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  
  // Adaptive AI Practice state
  const [aiGeneratedPractice, setAiGeneratedPractice] = useState(null);
  const [generatingPractice, setGeneratingPractice] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmitTest();
    }
  }, [timeLeft, submitted]);

  const handleSelectOption = (qId, optionKey) => {
    if (submitted) return;
    setAnswers({
      ...answers,
      [qId]: optionKey
    });
  };

  const handleSubmitTest = () => {
    setSubmitted(true);
    let correctCount = 0;
    const failedTopicsList = [];

    sampleQuizQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      } else {
        if (!failedTopicsList.includes(q.topic)) {
          failedTopicsList.push(q.topic);
        }
      }
    });

    const finalScore = (correctCount / sampleQuizQuestions.length) * 10;
    setScoreResult({
      score: finalScore,
      correct: correctCount,
      total: sampleQuizQuestions.length,
      failedTopics: failedTopicsList
    });

    addLog(`Học viên nộp bài kiểm tra "${testName}". Số câu đúng: ${correctCount}/${sampleQuizQuestions.length}, Điểm số: ${finalScore.toFixed(1)}`, 'sys');
    
    // Simulate AI system analyzing
    setTimeout(() => {
      addLog(`[AI] Quét câu trả lời học viên... phát hiện lỗ hổng kiến thức thuộc các chuyên đề: ${failedTopicsList.join(', ') || 'Không phát hiện điểm yếu'}`, 'ai');
    }, 1000);
  };

  const handleGenerateAIPractice = () => {
    setGeneratingPractice(true);
    addLog(`[AI] Đang tổng hợp lỗi sai, tự động sinh 3 câu hỏi ôn luyện chuyên biệt...`, 'ai');
    
    setTimeout(() => {
      setGeneratingPractice(false);
      setAiGeneratedPractice([
        {
          id: 101,
          question: "[AI sinh ra - Chủ đề: Phương trình mũ] Cho phương trình $4^x - 6.2^x + 5 = 0$. Tìm tổng các nghiệm thực của phương trình?",
          options: [
            { key: 'A', value: "5" },
            { key: 'B', value: "log2(5)" },
            { key: 'C', value: "1" },
            { key: 'D', value: "log5(2)" }
          ],
          correctAnswer: 'B',
          explanation: "Đặt t = 2^x (t > 0). Phương trình <=> t^2 - 6t + 5 = 0 <=> t = 1 hoặc t = 5.\n=> 2^x = 1 <=> x = 0\n=> 2^x = 5 <=> x = log2(5).\nTổng các nghiệm là: 0 + log2(5) = log2(5)."
        },
        {
          id: 102,
          question: "[AI sinh ra - Chủ đề: Sự biến thiên] Cho hàm số y = -x^3 + 3x. Mệnh đề nào sau đây đúng?",
          options: [
            { key: 'A', value: "Hàm số đồng biến trên (-1; 1)" },
            { key: 'B', value: "Hàm số nghịch biến trên (-1; 1)" },
            { key: 'C', value: "Hàm số đồng biến trên (-oo; -1)" },
            { key: 'D', value: "Hàm số đồng biến trên (1; +oo)" }
          ],
          correctAnswer: 'A',
          explanation: "y' = -3x^2 + 3 = -3(x^2 - 1). y' = 0 <=> x = -1 hoặc x = 1. Trong khoảng (-1; 1), y' > 0 => Hàm số đồng biến."
        }
      ]);
      addLog(`[AI] Đã tạo thành công 2 câu luyện tập thông minh dựa trên lịch sử lỗi sai!`, 'ai');
    }, 1500);
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const currentQuestion = sampleQuizQuestions[currentIdx];

  return (
    <div className="animate-in">
      {!submitted ? (
        // ACTIVE TEST TAKING ENVIRONMENT
        <div className="test-simulator-layout">
          <div className="test-questions-panel">
            <div className="question-item-box">
              <div className="question-header">
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                  Câu {currentIdx + 1} của {sampleQuizQuestions.length}
                </span>
                <span className={`difficulty-tag ${currentQuestion.difficultyClass}`}>
                  Độ khó: {currentQuestion.difficulty}
                </span>
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', lineHeight: '1.6' }}>
                {currentQuestion.question}
              </p>

              <div className="options-list">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.key}
                    className={`option-btn ${answers[currentQuestion.id] === opt.key ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.key)}
                  >
                    <span className="option-letter">{opt.key}</span>
                    <span style={{ fontSize: '13.5px' }}>{opt.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button
                className="btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
              >
                <HiChevronLeft /> Câu trước
              </button>
              <button
                className="btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={currentIdx === sampleQuizQuestions.length - 1}
                onClick={() => setCurrentIdx(currentIdx + 1)}
              >
                Câu sau <HiChevronRight />
              </button>
            </div>
          </div>

          <div className="test-sidebar-panel">
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-orange)' }}>
                <HiClock style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTimer(timeLeft)}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thời gian làm bài còn lại</p>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>BẢN ĐỒ CÂU HỎI</h4>
              <div className="test-grid-bubble" style={{ marginBottom: '16px' }}>
                {sampleQuizQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    className={`bubble-num ${answers[q.id] ? 'answered' : ''} ${currentIdx === idx ? 'current' : ''}`}
                    onClick={() => setCurrentIdx(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleSubmitTest}>
                Nộp bài thi
              </button>
            </div>
          </div>
        </div>
      ) : (
        // POST SUBMISSION GRADE REPORT AND AI DIAGNOSIS
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card animate-in" style={{ background: 'linear-gradient(135deg, var(--primary-bg), rgba(0, 184, 148, 0.05))', border: '1px solid var(--border)', textAlign: 'center', padding: '30px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>KẾT QUẢ BÀI LÀM</h2>
            <div style={{ fontSize: '48px', fontWeight: '900', color: scoreResult.score >= 8 ? 'var(--accent-green)' : 'var(--accent-orange)', margin: '14px 0' }}>
              {scoreResult.score.toFixed(1)} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ 10 điểm</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Đúng <strong>{scoreResult.correct}</strong> trên tổng số <strong>{scoreResult.total}</strong> câu hỏi.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={() => setReviewing(true)}>
                🔎 Xem đáp án chi tiết
              </button>
              <button className="btn-outline" onClick={() => onFinished(scoreResult)}>
                Hoàn thành
              </button>
            </div>
          </div>

          {/* AI ADAPTIVE DIAGNOSIS AND ROADMAP UPDATER PANEL */}
          <div className="card animate-in" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <HiSparkles style={{ color: 'var(--primary)', fontSize: '20px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>CHẨN ĐOÁN & GỢI Ý LỘ TRÌNH TỪ AI</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-red)', marginBottom: '8px' }}>
                  Lỗ hổng kiến thức phát hiện:
                </p>
                <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {scoreResult.failedTopics.length > 0 ? (
                    scoreResult.failedTopics.map((topic, i) => (
                      <li key={i}>{topic} (Tỷ lệ sai: 100%)</li>
                    ))
                  ) : (
                    <li>Tệt vời! Không phát hiện lỗ hổng lớn nào. Bạn đã nắm chắc kiến thức phần này!</li>
                  )}
                </ul>

                <p style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px', color: 'var(--primary)' }}>
                  Khuyên dùng lộ trình thích ứng (Adaptive Recommendation):
                </p>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  🧠 <strong>Hệ thống AI đề xuất:</strong> Học viên cần xem lại video bài giảng <em>"Ứng dụng đạo hàm khảo sát hàm số nâng cao"</em> và luyện thêm 3 bài tập tự luận bậc trung bình.
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Sinh đề luyện tập sửa sai (Adaptive AI Practice):
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  AI sẽ tự động lọc ngân hàng câu hỏi để tạo 2 câu trắc nghiệm tương tự các câu bạn vừa làm sai giúp vá lỗ hổng lập tức.
                </p>
                
                {!aiGeneratedPractice ? (
                  <button
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                    disabled={generatingPractice}
                    onClick={handleGenerateAIPractice}
                  >
                    {generatingPractice ? 'Đang tổng hợp...' : '✨ Tự động tạo bài tập sửa sai'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                      ✓ Đã tạo thành công bài tập khắc phục!
                    </div>
                    {aiGeneratedPractice.map((pq) => (
                      <div key={pq.id} style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{pq.question}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {pq.options.map(o => (
                            <div key={o.key}><strong>{o.key}.</strong> {o.value}</div>
                          ))}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '11px', background: 'var(--primary-bg)', padding: '6px', borderRadius: '4px' }}>
                          🔑 <strong>Đáp án {pq.correctAnswer}:</strong> {pq.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED QUESTIONS REVIEW PANEL */}
          {reviewing && (
            <div className="card animate-in" style={{ marginTop: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>XEM ĐÁP ÁN CHI TIẾT TỪNG CÂU</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div style={{ borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
                  <div className="test-grid-bubble">
                    {sampleQuizQuestions.map((q, idx) => {
                      const isCorrect = answers[q.id] === q.correctAnswer;
                      return (
                        <button
                          key={q.id}
                          className="bubble-num"
                          style={{
                            background: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)',
                            color: '#fff',
                            borderColor: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)',
                            opacity: currentIdx === idx ? 1 : 0.7,
                            transform: currentIdx === idx ? 'scale(1.1)' : 'scale(1)'
                          }}
                          onClick={() => setCurrentIdx(idx)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', background: 'var(--accent-green)', borderRadius: '2px' }}></span>
                      <span>Câu đúng</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '12px', height: '12px', background: 'var(--accent-red)', borderRadius: '2px' }}></span>
                      <span>Câu sai</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>Câu hỏi {currentIdx + 1}:</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chuyên đề: {currentQuestion.topic}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>{currentQuestion.question}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {currentQuestion.options.map(o => {
                        const isChosen = answers[currentQuestion.id] === o.key;
                        const isCorrect = currentQuestion.correctAnswer === o.key;
                        let btnStyle = { border: '1px solid var(--border)', background: 'var(--bg-card)' };
                        if (isCorrect) {
                          btnStyle = { border: '1px solid var(--accent-green)', background: 'rgba(0,184,148,0.1)' };
                        } else if (isChosen) {
                          btnStyle = { border: '1px solid var(--accent-red)', background: 'rgba(231,76,60,0.1)' };
                        }
                        return (
                          <div key={o.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '4px', ...btnStyle, fontSize: '12.5px' }}>
                            <strong style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: isCorrect ? 'var(--accent-green)' : (isChosen ? 'var(--accent-red)' : 'var(--bg-main)'),
                              color: (isCorrect || isChosen) ? '#fff' : 'var(--text-primary)',
                              display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: '11px'
                            }}>{o.key}</strong>
                            <span>{o.value}</span>
                            {isCorrect && <span style={{ color: 'var(--accent-green)', fontSize: '11px', marginLeft: 'auto', fontWeight: 'bold' }}>✓ Đáp án đúng</span>}
                            {isChosen && !isCorrect && <span style={{ color: 'var(--accent-red)', fontSize: '11px', marginLeft: 'auto', fontWeight: 'bold' }}>✗ Bạn đã chọn</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', lineHeight: '1.5' }}>
                      <strong>💡 Lời giải chi tiết:</strong>
                      <p style={{ whiteSpace: 'pre-line', marginTop: '6px', color: 'var(--text-secondary)' }}>{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
