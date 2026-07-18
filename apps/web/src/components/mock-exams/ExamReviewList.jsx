import React, { useState } from 'react';
import { 
  HiSearch, 
  HiCheck, 
  HiX, 
  HiCheckCircle, 
  HiOutlineExclamation, 
  HiLightBulb,
  HiSparkles,
  HiChevronDown,
  HiChevronUp,
  HiRefresh
} from 'react-icons/hi';
import { mockExamService } from '../../services/mockExamService';

export default function ExamReviewList({ questions = [], userAnswers = {}, subject = 'Toán học' }) {
  const [similarStates, setSimilarStates] = useState({});
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);

  const displayedQuestions = questions.filter(q => {
    if (!showIncorrectOnly) return true;
    const qOptions = q.options || [];
    const correctAnswer = qOptions.find(o => o.is_correct);
    const selectedLabel = userAnswers[q.id];
    const isCorrect = correctAnswer && correctAnswer.option_label === selectedLabel;
    return !isCorrect;
  });

  const handleLuyenTuongTu = async (q) => {
    if (similarStates[q.id]?.visible && !similarStates[q.id]?.checked) {
      setSimilarStates(prev => ({
        ...prev,
        [q.id]: { ...prev[q.id], visible: false }
      }));
      return;
    }

    setSimilarStates(prev => ({
      ...prev,
      [q.id]: { ...prev[q.id], loading: true, error: null, visible: true, checked: false, selectedOption: null }
    }));

    try {
      const data = await mockExamService.generateSimilarQuestion({
        content: q.question_text,
        topic: q.topic || 'Chung',
        difficulty: q.difficulty === 'Dễ' ? 'EASY' : (q.difficulty === 'Khó' ? 'HARD' : 'MEDIUM'),
        options: q.options?.map(o => ({ label: o.option_label, text: o.option_text })) || [],
        explanation: q.explanation,
        subject: subject || 'Toán học'
      });

      if (data) {
        setSimilarStates(prev => ({
          ...prev,
          [q.id]: {
            ...prev[q.id],
            loading: false,
            data,
            selectedOption: null,
            checked: false
          }
        }));
        setTimeout(() => {
          window.MathJax?.typesetPromise?.().catch(e => console.log('MathJax typeset error:', e));
        }, 100);
      } else {
        setSimilarStates(prev => ({
          ...prev,
          [q.id]: {
            ...prev[q.id],
            loading: false,
            error: 'Không thể tạo câu hỏi mới. Vui lòng thử lại.'
          }
        }));
      }
    } catch (err) {
      setSimilarStates(prev => ({
        ...prev,
        [q.id]: {
          ...prev[q.id],
          loading: false,
          error: err.message || 'Lỗi kết nối máy chủ.'
        }
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiSearch style={{ color: 'var(--exams-purple)' }} /> XEM LẠI BÀI LÀM CHI TIẾT
        </h3>
        
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: showIncorrectOnly ? 'var(--exams-red)' : 'var(--text-secondary)', background: showIncorrectOnly ? 'rgba(214, 48, 49, 0.08)' : 'var(--bg-main)', border: showIncorrectOnly ? '1.5px solid var(--exams-red)' : '1.5px solid var(--border)', padding: '6px 12px', borderRadius: '10px', transition: 'all 0.2s' }}>
          <input 
            type="checkbox" 
            checked={showIncorrectOnly}
            onChange={(e) => setShowIncorrectOnly(e.target.checked)}
            style={{ accentColor: 'var(--exams-red)', width: '16px', height: '16px', cursor: 'pointer' }}
          />
          ⚠️ Chỉ hiển thị câu làm sai ({questions.filter(q => {
            const correctAnswer = q.options?.find(o => o.is_correct);
            return !(correctAnswer && correctAnswer.option_label === userAnswers[q.id]);
          }).length} câu)
        </label>
      </div>

      {displayedQuestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '40px' }}>🎉</span>
          <h4 style={{ fontSize: '15px', fontWeight: '800', margin: '12px 0 6px 0', color: 'var(--text-primary)' }}>Không có câu sai nào!</h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>Chúc mừng em đã hoàn thành xuất sắc các câu hỏi được chọn!</p>
        </div>
      ) : (
        displayedQuestions.map((q) => {
          const qOptions = q.options || [];
          const correctAnswer = qOptions.find(o => o.is_correct);
          const selectedLabel = userAnswers[q.id];
          const isCorrect = correctAnswer && correctAnswer.option_label === selectedLabel;
          const isBlank = !selectedLabel;

          return (
            <div 
              key={q.id}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: `1px solid ${isBlank ? 'var(--border)' : (isCorrect ? 'rgba(0, 184, 148, 0.3)' : 'rgba(214, 48, 49, 0.3)')}`,
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                <strong style={{ fontSize: '13.5px', color: 'var(--exams-purple)' }}>Câu {q.question_number}</strong>
                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: isBlank ? '#64748b' : (isCorrect ? 'var(--exams-green)' : 'var(--exams-red)'),
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isBlank ? 'CHƯA TRẢ LỜI' : isCorrect ? (
                    <>ĐÚNG <HiCheck /></>
                  ) : (
                    <>SAI <HiX /></>
                  )}
                </span>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {q.question_text}
              </p>

              {q.audio_url && (
                <div 
                  style={{ 
                    margin: '12px 0', 
                    padding: '10px 14px', 
                    background: 'var(--bg-main, #f8fafc)', 
                    border: '1.5px solid var(--border)', 
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔊 Nghe học phần:
                  </span>
                  <audio src={q.audio_url} controls style={{ width: '100%', outline: 'none' }} />
                </div>
              )}

              {q.question_image_url && (
                <div style={{ margin: '12px 0', textAlign: 'center' }}>
                  <img src={q.question_image_url} alt="Minh họa" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {qOptions.map((opt) => {
                  const isCorrectOpt = opt.is_correct;
                  const isSelectedOpt = selectedLabel === opt.option_label;

                  let optionBg = 'transparent';
                  let optionBorder = 'var(--border)';
                  let showStatus = false;
                  let isOptCorrect = false;

                  if (isCorrectOpt) {
                    optionBg = 'rgba(0, 184, 148, 0.08)';
                    optionBorder = 'var(--exams-green)';
                    showStatus = true;
                    isOptCorrect = true;
                  } else if (isSelectedOpt && !isCorrectOpt) {
                    optionBg = 'rgba(214, 48, 49, 0.08)';
                    optionBorder = 'var(--exams-red)';
                    showStatus = true;
                    isOptCorrect = false;
                  }

                  return (
                    <div 
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${optionBorder}`,
                        background: optionBg,
                        fontSize: '13px'
                      }}
                    >
                      <span 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCorrectOpt ? 'var(--exams-green)' : (isSelectedOpt ? 'var(--exams-red)' : 'var(--bg-main)'),
                          color: (isCorrectOpt || isSelectedOpt) ? '#fff' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          flexShrink: 0
                        }}
                      >
                        {opt.option_label}
                      </span>
                       <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                        {(() => {
                          const rawText = opt.option_text || '';
                          const hasLatex = /\\|\^|_|\{|\}/.test(rawText);
                          const isWrapped = rawText.trim().startsWith('$') && rawText.trim().endsWith('$');
                          return (hasLatex && !isWrapped) ? `$${rawText}$` : rawText;
                        })()}
                       </span>
                      {showStatus && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: isOptCorrect ? 'var(--exams-green)' : 'var(--exams-red)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          {isOptCorrect ? (
                            <><HiCheckCircle /> (Đáp án đúng)</>
                          ) : (
                            <><HiOutlineExclamation /> (Lựa chọn của bạn)</>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {(q.explanation || correctAnswer) && (
                <div 
                  style={{
                    background: 'var(--bg-main, #f8fafc)',
                    borderRadius: '10px',
                    padding: '14px',
                    borderLeft: '3px solid var(--exams-purple)',
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--exams-purple)', marginBottom: '4px' }}>
                    <HiLightBulb /> Hướng dẫn giải chi tiết:
                  </strong>
                  <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {q.explanation || `Đáp án đúng là ${correctAnswer?.option_label}.`}
                  </p>
                  {q.topic && (
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', background: 'var(--exams-purple-bg)', color: 'var(--exams-purple)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Chủ đề: {q.topic}
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

                <button
                  onClick={() => handleLuyenTuongTu(q)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(108, 92, 231, 0.15)',
                    transition: 'transform 0.2s, opacity 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <HiSparkles /> 🤖 Luyện câu tương tự AI {similarStates[q.id]?.visible ? <HiChevronUp /> : <HiChevronDown />}
                </button>

                {similarStates[q.id]?.visible && (
                  <div style={{
                    marginTop: '12px',
                    background: 'var(--bg-main, #f8fafc)',
                    border: '1.5px solid var(--exams-purple)',
                    borderRadius: '12px',
                    padding: '16px',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    {similarStates[q.id]?.loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
                        <div className="spinner" style={{
                          width: '24px',
                          height: '24px',
                          border: '3px solid rgba(108, 92, 231, 0.2)',
                          borderTop: '3px solid var(--exams-purple)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          AI đang biên soạn câu hỏi tương tự...
                        </span>
                      </div>
                    ) : similarStates[q.id]?.error ? (
                      <div style={{ color: 'var(--exams-red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineExclamation /> {similarStates[q.id].error}
                        <button 
                          onClick={() => handleLuyenTuongTu(q)} 
                          style={{ border: 'none', background: 'transparent', color: 'var(--exams-purple)', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                        >
                          <HiRefresh /> Thử lại
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '12px', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                          {similarStates[q.id].data.content}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          {similarStates[q.id].data.options?.map((opt) => {
                            const isSelected = similarStates[q.id].selectedOption === opt.label;
                            const isCorrect = opt.label === similarStates[q.id].data.correctAnswer;
                            const isChecked = similarStates[q.id].checked;

                            let optionBg = 'var(--bg-card, #ffffff)';
                            let optionBorder = 'var(--border)';
                            let cursor = 'pointer';

                            if (isChecked) {
                              cursor = 'default';
                              if (isCorrect) {
                                optionBg = 'rgba(0, 184, 148, 0.08)';
                                optionBorder = 'var(--exams-green)';
                              } else if (isSelected) {
                                optionBg = 'rgba(214, 48, 49, 0.08)';
                                optionBorder = 'var(--exams-red)';
                              }
                            } else if (isSelected) {
                              optionBg = 'rgba(108, 92, 231, 0.08)';
                              optionBorder = 'var(--exams-purple)';
                            }

                            return (
                              <button
                                key={opt.label}
                                disabled={isChecked}
                                onClick={() => {
                                  setSimilarStates(prev => ({
                                    ...prev,
                                    [q.id]: { ...prev[q.id], selectedOption: opt.label }
                                  }));
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${optionBorder}`,
                                  background: optionBg,
                                  fontSize: '12.5px',
                                  width: '100%',
                                  textAlign: 'left',
                                  cursor: cursor,
                                  transition: 'all 0.2s',
                                  outline: 'none'
                                }}
                              >
                                <span 
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: isChecked && isCorrect ? 'var(--exams-green)' : (isChecked && isSelected ? 'var(--exams-red)' : (isSelected ? 'var(--exams-purple)' : 'var(--bg-main, #f1f5f9)')),
                                    color: (isSelected || (isChecked && (isCorrect || isSelected))) ? '#fff' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                    flexShrink: 0
                                  }}
                                >
                                  {opt.label}
                                </span>
                                <span style={{ color: 'var(--text-primary)', flex: 1 }}>{opt.text}</span>
                                {isChecked && isCorrect && (
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--exams-green)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <HiCheckCircle /> Đúng
                                  </span>
                                )}
                                {isChecked && isSelected && !isCorrect && (
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--exams-red)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <HiX /> Sai
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', marginTop: '12px' }}>
                          {!similarStates[q.id].checked ? (
                            <button
                              disabled={!similarStates[q.id].selectedOption}
                              onClick={() => {
                                setSimilarStates(prev => ({
                                  ...prev,
                                  [q.id]: { ...prev[q.id], checked: true }
                                }));
                              }}
                              style={{
                                background: similarStates[q.id].selectedOption ? 'var(--exams-purple)' : '#cbd5e1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: similarStates[q.id].selectedOption ? 'pointer' : 'default',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              Kiểm tra
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLuyenTuongTu(q)}
                              style={{
                                background: '#f1f5f9',
                                color: 'var(--exams-purple)',
                                border: '1.5px solid var(--exams-purple)',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <HiRefresh /> Luyện câu khác
                            </button>
                          )}
                        </div>

                        {similarStates[q.id].checked && (
                          <div style={{
                            marginTop: '12px',
                            background: 'rgba(108, 92, 231, 0.03)',
                            borderRadius: '8px',
                            padding: '12px',
                            borderLeft: '3px solid var(--exams-purple)',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            animation: 'fadeIn 0.2s ease-out'
                          }}>
                            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--exams-purple)', marginBottom: '4px' }}>
                              <HiLightBulb /> Hướng dẫn giải AI:
                            </strong>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                              {similarStates[q.id].data.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
