import React, { useState, useEffect, useRef } from 'react';
import { 
  HiUpload, 
  HiCheckCircle, 
  HiExclamationCircle, 
  HiChevronRight, 
  HiChevronUp, 
  HiChevronDown, 
  HiTrash, 
  HiPlusCircle, 
  HiSave,
  HiEye
} from 'react-icons/hi';
import { api, API_BASE } from '../../api';
import * as WMF from 'wmf';

export function WmfPreview({ url }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buf => {
        const canvas = canvasRef.current;
        if (canvas) {
          try {
            // Strip placeable header (22 bytes) if signature matches 0x9AC6CDD7
            let wmfData = buf;
            const view = new DataView(buf);
            if (view.byteLength > 4 && view.getUint32(0, true) === 0x9AC6CDD7) {
              wmfData = buf.slice(22);
            }

            const size = WMF.image_size(wmfData);
            if (size && size[0] && size[1]) {
              const w = size[0];
              const h = size[1];
              canvas.width = w;
              canvas.height = h;
              
              // Scale visually to a standard height (e.g. 36px) preserving aspect ratio
              const displayHeight = 36;
              const displayWidth = (w / h) * displayHeight;
              canvas.style.width = `${displayWidth}px`;
              canvas.style.height = `${displayHeight}px`;
            } else {
              canvas.width = 180;
              canvas.height = 45;
              canvas.style.width = '180px';
              canvas.style.height = '45px';
            }
            
            WMF.draw_canvas(wmfData, canvas);
          } catch (err) {
            console.error('Error drawing WMF to canvas:', err);
          }
        }
      })
      .catch(err => {
        console.error('Failed to render WMF:', err);
      });
  }, [url]);

  return <canvas ref={canvasRef} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', padding: '4px' }} />;
}

export function ImportsTab({
  sessions,
  activeSession,
  decisions,
  setDecisions,
  onUpload,
  onConfirm,
  onUpdateQuestion,
  onDeleteSession,
  onViewDetail,
  onCloseDetail
}) {
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [duplicatedQuestion, setDuplicatedQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const activeQuestion = activeSession?.questions?.[activeQuestionIdx];

  // Fetch duplicated question details when active question has duplicateOfId
  useEffect(() => {
    if (activeQuestion && activeQuestion.duplicateOfId) {
      api.getQuestionById(activeQuestion.duplicateOfId)
        .then(res => {
          setDuplicatedQuestion(res);
        })
        .catch(err => {
          console.error('Failed to fetch duplicated question details:', err);
          setDuplicatedQuestion(null);
        });
    } else {
      setDuplicatedQuestion(null);
    }
  }, [activeQuestion]);

  // MathJax Formula typesetting hook
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeSession, activeQuestionIdx, activeQuestion, duplicatedQuestion]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleDecisionChange = (qId, action) => {
    setDecisions({ ...decisions, [qId]: action });
  };

  // Local Field Editing
  const handleFieldChange = (field, value) => {
    if (!activeSession || !activeQuestion) return;
    const updatedQuestion = { ...activeQuestion, [field]: value };
    // Optimistic local state update
    activeSession.questions[activeQuestionIdx] = updatedQuestion;
    // Trigger render update
    setDecisions({ ...decisions });
  };

  const handleOptionChange = (idx, value) => {
    if (!activeSession || !activeQuestion) return;
    const updatedOptions = [...activeQuestion.options];
    updatedOptions[idx] = { ...updatedOptions[idx], text: value };
    handleFieldChange('options', updatedOptions);
  };

  // Save changes to backend
  const handleSaveQuestion = async () => {
    if (!activeQuestion) return;
    try {
      setSaving(true);
      const payload = {
        content: activeQuestion.content,
        options: activeQuestion.options,
        correctAnswer: activeQuestion.correctAnswer,
        explanation: activeQuestion.explanation,
        difficulty: activeQuestion.difficulty,
        media: activeQuestion.media
      };
      await onUpdateQuestion(activeQuestion.id, payload);
      alert('Đã lưu thay đổi của câu hỏi thành công!');
    } catch (err) {
      alert('Không thể lưu câu hỏi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Media Management
  const handleAddMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeQuestion) return;

    try {
      setUploadingMedia(true);
      const res = await api.uploadFile(file);
      const newUrl = res.url || res;
      
      const currentMedia = Array.isArray(activeQuestion.media) ? activeQuestion.media : [];
      const newMedia = [
        ...currentMedia,
        {
          type: 'IMAGE',
          url: newUrl,
          order: currentMedia.length
        }
      ];
      handleFieldChange('media', newMedia);
      alert('Tải ảnh lên thành công!');
    } catch (err) {
      alert('Tải ảnh thất bại: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleReplaceMedia = async (mediaIdx, e) => {
    const file = e.target.files?.[0];
    if (!file || !activeQuestion) return;

    try {
      setUploadingMedia(true);
      const res = await api.uploadFile(file);
      const newUrl = res.url || res;

      const currentMedia = [...activeQuestion.media];
      currentMedia[mediaIdx] = {
        ...currentMedia[mediaIdx],
        url: newUrl
      };
      handleFieldChange('media', currentMedia);
      alert('Thay thế ảnh thành công!');
    } catch (err) {
      alert('Thay thế ảnh thất bại: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = (mediaIdx) => {
    if (!activeQuestion) return;
    const currentMedia = activeQuestion.media.filter((_, idx) => idx !== mediaIdx);
    // Reorder
    const updatedMedia = currentMedia.map((m, idx) => ({ ...m, order: idx }));
    handleFieldChange('media', updatedMedia);
  };

  const handleMediaTypeChange = (mediaIdx, type) => {
    if (!activeQuestion) return;
    const currentMedia = [...activeQuestion.media];
    currentMedia[mediaIdx] = { ...currentMedia[mediaIdx], type };
    handleFieldChange('media', currentMedia);
  };

  const handleMoveMedia = (mediaIdx, direction) => {
    if (!activeQuestion) return;
    const currentMedia = [...activeQuestion.media];
    const targetIdx = direction === 'up' ? mediaIdx - 1 : mediaIdx + 1;
    
    if (targetIdx < 0 || targetIdx >= currentMedia.length) return;

    // Swap elements
    const temp = currentMedia[mediaIdx];
    currentMedia[mediaIdx] = currentMedia[targetIdx];
    currentMedia[targetIdx] = temp;

    // Recalculate order values
    const updatedMedia = currentMedia.map((m, idx) => ({ ...m, order: idx }));
    handleFieldChange('media', updatedMedia);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!activeSession ? (
        <>
          {/* Uploader */}
          <div 
            className="saas-dropzone-container"
            onClick={() => document.getElementById('file-upload-input').click()}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
          >
            <HiUpload style={{ fontSize: '48px', color: '#6366f1' }} />
            <h4 style={{ margin: '12px 0 6px 0', fontWeight: 800, fontSize: '16px' }}>Tải lên đề thi của bạn (Word/PDF)</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '400px', lineHeight: 1.5 }}>
              Hệ thống tự động nhận diện bố cục đề thi, bóc tách công thức Toán học và phân loại các ảnh nhúng (đồ thị, hình học, bảng biến thiên).
            </p>
            <input 
              id="file-upload-input" 
              type="file" 
              style={{ display: 'none' }} 
              accept=".pdf,.docx"
              onChange={handleFileChange}
            />
          </div>

          {/* Session List */}
          <div className="premium-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
              Lịch sử các phiên nhập đề thi THPT
            </h4>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '13.5px' }}>
                Chưa có tệp đề thi nào được tải lên hệ thống.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessions.map(s => (
                  <div 
                    key={s.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px', 
                      border: '1px solid #f1f5f9', 
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc' 
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        {s.fileName}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Dung lượng: {Math.round(s.fileSize / 1024)} KB &bull; Ngày tải: {new Date(s.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span className={`saas-badge ${s.status === 'REVIEWING' ? 'pending' : s.status === 'COMPLETED' ? 'published' : 'draft'}`} style={{ fontSize: '11.5px', padding: '4px 10px' }}>
                        {s.status === 'PROCESSING' ? 'AI Đang phân tích' : s.status === 'REVIEWING' ? 'Chờ hậu kiểm' : s.status === 'COMPLETED' ? 'Hoàn thành' : 'Thất bại'}
                      </span>
                      {s.status === 'REVIEWING' && (
                        <button 
                          className="saas-btn-primary" 
                          style={{ height: '36px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => onViewDetail(s.id)}
                        >
                          Rà soát ngay <HiChevronRight />
                        </button>
                      )}
                      {(s.status === 'FAILED' || s.status === 'COMPLETED') && (
                        <button 
                          className="saas-select-filter" 
                          style={{ height: '36px', width: '36px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', border: '1px solid #fecaca' }}
                          title="Xóa phiên nhập đề này"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa phiên nhập đề này cùng toàn bộ các tệp liên quan khỏi hệ thống?')) {
                              onDeleteSession(s.id);
                            }
                          }}
                        >
                          <HiTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Side-by-side Review Panel */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1e293b' }}>
                Hậu kiểm đề: {activeSession.fileName}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Kiểm tra văn bản, chỉnh sửa ảnh (hình học, bảng biến thiên) và phê duyệt trước khi đẩy vào Ngân hàng.
              </span>
            </div>
            <button className="saas-select-filter" style={{ borderRadius: '10px', padding: '8px 16px' }} onClick={onCloseDetail}>
              Quay lại danh sách
            </button>
          </div>

          <div className="saas-split-panel" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
            {/* Left Nav List */}
            <div className="saas-sidebar-list" style={{ width: '220px', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
              {activeSession.questions?.map((q, idx) => (
                <div 
                  key={q.id} 
                  className={`saas-sidebar-item ${activeQuestionIdx === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveQuestionIdx(idx);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Câu {idx + 1}</span>
                  {q.status === 'OK' && <HiCheckCircle className="saas-sidebar-status-icon ok" style={{ fontSize: '18px' }} />}
                  {q.status === 'WARNING' && <HiExclamationCircle className="saas-sidebar-status-icon warning" style={{ fontSize: '18px' }} />}
                  {q.status === 'ERROR' && <HiExclamationCircle className="saas-sidebar-status-icon error" style={{ fontSize: '18px' }} />}
                </div>
              ))}
            </div>

            {/* Right Editor Panel */}
            {activeQuestion ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. Duplicate Comparison Section (Side by side comparison if Warning) */}
                {activeQuestion.status === 'WARNING' && (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HiExclamationCircle style={{ fontSize: '18px' }} /> Trùng lặp cao ({activeQuestion.similarityScore}%) với câu hỏi ID #{activeQuestion.duplicateOfId}
                      </span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="saas-btn-primary" 
                          style={{ height: '32px', padding: '0 14px', borderRadius: '16px', fontSize: '12px', backgroundColor: decisions[activeQuestion.id] === 'REUSE' ? '#10b981' : '#94a3b8', border: 'none' }}
                          onClick={() => handleDecisionChange(activeQuestion.id, 'REUSE')}
                        >
                          Sử dụng lại câu gốc
                        </button>
                        <button 
                          className="saas-btn-primary" 
                          style={{ height: '32px', padding: '0 14px', borderRadius: '16px', fontSize: '12px', backgroundColor: decisions[activeQuestion.id] === 'CREATE_NEW' ? '#6366f1' : '#94a3b8', border: 'none' }}
                          onClick={() => handleDecisionChange(activeQuestion.id, 'CREATE_NEW')}
                        >
                          Tạo câu mới hoàn toàn
                        </button>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison Container */}
                    {duplicatedQuestion && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                        {/* Current Parsed */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #fdecac' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Bản phân tích (Đang rà soát)</span>
                          <div style={{ fontSize: '13.5px', color: '#1e293b', marginBottom: '10px', lineHeight: 1.6 }}>{activeQuestion.content}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {activeQuestion.options?.map((opt, oIdx) => (
                              <div key={oIdx} style={{ fontSize: '12.5px', color: '#475569' }}>
                                <strong>{opt.label}.</strong> {opt.text}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Existing Original */}
                        <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Bản gốc (Trong ngân hàng đề)</span>
                          <div style={{ fontSize: '13.5px', color: '#475569', marginBottom: '10px', lineHeight: 1.6 }}>{duplicatedQuestion.content}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {duplicatedQuestion.options?.map((opt, oIdx) => (
                              <div key={oIdx} style={{ fontSize: '12.5px', color: '#475569' }}>
                                <strong>{opt.optionLabel}.</strong> {opt.optionText}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Text Editor Section */}
                <div className="premium-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Nội dung câu hỏi (hỗ trợ công thức LaTeX $...$)</label>
                    <textarea 
                      rows="3"
                      className="saas-search-input"
                      style={{ paddingLeft: '16px', height: 'auto', borderRadius: '10px', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.5 }}
                      value={activeQuestion.content}
                      onChange={(e) => handleFieldChange('content', e.target.value)}
                    />
                  </div>

                  {/* Dynamic Question Type Editor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Loại câu hỏi</label>
                      <select 
                        className="saas-select-filter" 
                        style={{ width: '100%', borderRadius: '10px', height: '40px' }}
                        value={activeQuestion.type || 'MULTIPLE_CHOICE'}
                        onChange={(e) => {
                          const newType = e.target.value;
                          let newOptions = activeQuestion.options;
                          let newCorrectAnswer = activeQuestion.correctAnswer;
                          if (newType === 'MULTIPLE_CHOICE') {
                            newOptions = Array.isArray(activeQuestion.options) ? activeQuestion.options.map((o, i) => ({ label: ['A','B','C','D'][i] || '', text: o.text || '' })) : [
                              { label: 'A', text: '...' }, { label: 'B', text: '...' }, { label: 'C', text: '...' }, { label: 'D', text: '...' }
                            ];
                            newCorrectAnswer = 'A';
                          } else if (newType === 'TRUE_FALSE') {
                            newOptions = Array.isArray(activeQuestion.options) ? activeQuestion.options.map((o, i) => ({ label: ['a','b','c','d'][i] || '', text: o.text || '', isCorrect: o.isCorrect !== undefined ? o.isCorrect : true })) : [
                              { label: 'a', text: '...', isCorrect: true }, { label: 'b', text: '...', isCorrect: false },
                              { label: 'c', text: '...', isCorrect: true }, { label: 'd', text: '...', isCorrect: false }
                            ];
                            newCorrectAnswer = '';
                          } else if (newType === 'SHORT_ANSWER') {
                            newOptions = { tolerance: 0.0, format: 'NUMBER' };
                            newCorrectAnswer = '0';
                          }
                          
                          if (activeSession) {
                            activeSession.questions[activeQuestionIdx] = {
                              ...activeQuestion,
                              type: newType,
                              options: newOptions,
                              correctAnswer: newCorrectAnswer
                            };
                            setDecisions({ ...decisions });
                          }
                        }}
                      >
                        <option value="MULTIPLE_CHOICE">Trắc nghiệm ABCD (Một đáp án đúng)</option>
                        <option value="TRUE_FALSE">Trắc nghiệm Đúng/Sai (Nhiều phát biểu)</option>
                        <option value="SHORT_ANSWER">Trắc nghiệm trả lời ngắn (Điền số/chữ)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Mức độ nhận thức</label>
                      <select 
                        className="saas-select-filter" 
                        style={{ width: '100%', borderRadius: '10px', height: '40px' }}
                        value={activeQuestion.difficulty}
                        onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                      >
                        <option value="EASY">Nhận biết (Dễ)</option>
                        <option value="MEDIUM">Thông hiểu (Trung bình)</option>
                        <option value="HARD">Vận dụng (Khó)</option>
                      </select>
                    </div>
                  </div>

                  {/* MCQ Options Editor */}
                  {(activeQuestion.type === 'MULTIPLE_CHOICE' || !activeQuestion.type) && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', margin: 0 }}>4 Phương án lựa chọn</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {Array.isArray(activeQuestion.options) && activeQuestion.options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, color: '#6366f1', minWidth: '16px' }}>{opt.label}.</span>
                              <input 
                                type="text" 
                                className="saas-search-input" 
                                style={{ paddingLeft: '12px', height: '38px', borderRadius: '10px' }}
                                value={opt.text}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Đáp án chính xác</label>
                        <select 
                          className="saas-select-filter" 
                          style={{ width: '100%', borderRadius: '10px', height: '40px' }}
                          value={activeQuestion.correctAnswer}
                          onChange={(e) => handleFieldChange('correctAnswer', e.target.value)}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* True / False Options Editor */}
                  {activeQuestion.type === 'TRUE_FALSE' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', margin: 0 }}>Danh sách phát biểu và Đáp án Đúng/Sai</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {Array.isArray(activeQuestion.options) && activeQuestion.options.map((opt, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: '#6366f1', minWidth: '16px' }}>{opt.label}.</span>
                            <input 
                              type="text" 
                              className="saas-search-input" 
                              style={{ paddingLeft: '12px', height: '38px', borderRadius: '10px', flex: 1 }}
                              value={opt.text}
                              onChange={(e) => {
                                const updatedOptions = [...activeQuestion.options];
                                updatedOptions[idx] = { ...updatedOptions[idx], text: e.target.value };
                                handleFieldChange('options', updatedOptions);
                              }}
                            />
                            <div style={{ display: 'flex', gap: '4px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '38px', flexShrink: 0 }}>
                              <button
                                type="button"
                                style={{
                                  border: 'none',
                                  padding: '0 12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  backgroundColor: opt.isCorrect ? '#10b981' : '#f1f5f9',
                                  color: opt.isCorrect ? '#ffffff' : '#64748b',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onClick={() => {
                                  const updatedOptions = [...activeQuestion.options];
                                  updatedOptions[idx] = { ...updatedOptions[idx], isCorrect: true };
                                  handleFieldChange('options', updatedOptions);
                                }}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                style={{
                                  border: 'none',
                                  padding: '0 12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  backgroundColor: !opt.isCorrect ? '#ef4444' : '#f1f5f9',
                                  color: !opt.isCorrect ? '#ffffff' : '#64748b',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onClick={() => {
                                  const updatedOptions = [...activeQuestion.options];
                                  updatedOptions[idx] = { ...updatedOptions[idx], isCorrect: false };
                                  handleFieldChange('options', updatedOptions);
                                }}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short Answer Editor */}
                  {activeQuestion.type === 'SHORT_ANSWER' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Đáp án ngắn</label>
                        <input 
                          type="text" 
                          className="saas-search-input" 
                          style={{ paddingLeft: '12px', height: '40px', borderRadius: '10px' }}
                          value={activeQuestion.correctAnswer}
                          onChange={(e) => handleFieldChange('correctAnswer', e.target.value)}
                          placeholder="Nhập giá trị số hoặc biểu thức LaTeX..."
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Định dạng dữ liệu</label>
                        <select 
                          className="saas-select-filter" 
                          style={{ width: '100%', borderRadius: '10px', height: '40px' }}
                          value={activeQuestion.options?.format || 'NUMBER'}
                          onChange={(e) => {
                            const updatedOptions = { ...activeQuestion.options, format: e.target.value };
                            handleFieldChange('options', updatedOptions);
                          }}
                        >
                          <option value="NUMBER">Số học (Number)</option>
                          <option value="TEXT">Văn bản / Ký tự (Text)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Hướng dẫn giải chi tiết</label>
                    <textarea 
                      rows="3"
                      className="saas-search-input"
                      style={{ paddingLeft: '16px', height: 'auto', borderRadius: '10px', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.5 }}
                      value={activeQuestion.explanation || ''}
                      onChange={(e) => handleFieldChange('explanation', e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. Media Manager Section */}
                <div className="premium-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                        Quản lý hình ảnh & tài nguyên của câu hỏi ({activeQuestion.media?.length || 0})
                      </label>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Bạn có thể tải thêm ảnh, phân loại kiểu ảnh, sắp xếp thứ tự hiển thị bằng nút di chuyển.
                      </span>
                    </div>

                    <button 
                      className="saas-select-filter" 
                      style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', border: '1px solid #6366f1', padding: '6px 12px' }}
                      onClick={() => document.getElementById('add-media-input').click()}
                      disabled={uploadingMedia}
                    >
                      <HiPlusCircle /> {uploadingMedia ? 'Đang tải lên...' : 'Thêm ảnh mới'}
                    </button>
                    <input 
                      id="add-media-input" 
                      type="file" 
                      style={{ display: 'none' }} 
                      accept="image/*"
                      onChange={handleAddMedia}
                    />
                  </div>

                  {(!activeQuestion.media || activeQuestion.media.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', border: '1px dashed #e2e8f0', borderRadius: '12px', color: '#94a3b8', fontSize: '13px' }}>
                      Câu hỏi này hiện không đính kèm hình ảnh nào.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeQuestion.media.map((med, medIdx) => (
                        <div 
                          key={medIdx} 
                          style={{ 
                            display: 'flex', 
                            gap: '16px', 
                            alignItems: 'center', 
                            padding: '12px', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '12px',
                            backgroundColor: '#f8fafc' 
                          }}
                        >
                          {/* Image Thumbnail */}
                          <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {med.url && med.url.toLowerCase().endsWith('.wmf') ? (
                              <WmfPreview url={`${API_BASE}${med.url}`} />
                            ) : (
                              <img 
                                src={`${API_BASE}${med.url}`} 
                                alt={`media-${medIdx}`} 
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            )}
                          </div>

                          {/* Controls */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Phân loại:</span>
                              <select 
                                className="saas-select-filter" 
                                style={{ height: '30px', padding: '0 8px', fontSize: '12px', borderRadius: '8px' }}
                                value={med.type}
                                onChange={(e) => handleMediaTypeChange(medIdx, e.target.value)}
                              >
                                <option value="IMAGE">Ảnh thường (Image)</option>
                                <option value="VARIATION_TABLE">Bảng biến thiên (Variation Table)</option>
                                <option value="GRAPH">Đồ thị hàm số (Graph)</option>
                                <option value="GEOMETRY">Hình vẽ hình học (Geometry)</option>
                                <option value="TABLE">Bảng số liệu (Table)</option>
                                <option value="MAP">Bản đồ (Map)</option>
                                <option value="DIAGRAM">Sơ đồ/Biểu đồ (Diagram)</option>
                                <option value="CHEMICAL_STRUCTURE">Cấu trúc hóa học (Chemical Structure)</option>
                                <option value="OTHER">Khác (Other)</option>
                              </select>
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all' }}>Link: {med.url}</span>
                          </div>

                          {/* Reordering and Actions */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button 
                              className="saas-select-filter" 
                              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              disabled={medIdx === 0}
                              onClick={() => handleMoveMedia(medIdx, 'up')}
                            >
                              <HiChevronUp />
                            </button>
                            <button 
                              className="saas-select-filter" 
                              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              disabled={medIdx === activeQuestion.media.length - 1}
                              onClick={() => handleMoveMedia(medIdx, 'down')}
                            >
                              <HiChevronDown />
                            </button>
                            <button 
                              className="saas-select-filter" 
                              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                              onClick={() => {
                                document.getElementById(`replace-media-${medIdx}`).click();
                              }}
                            >
                              Thay
                            </button>
                            <input 
                              id={`replace-media-${medIdx}`} 
                              type="file" 
                              style={{ display: 'none' }} 
                              accept="image/*"
                              onChange={(e) => handleReplaceMedia(medIdx, e)}
                            />
                            <button 
                              className="saas-select-filter" 
                              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                              onClick={() => handleDeleteMedia(medIdx)}
                            >
                              <HiTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Live Render Preview Section */}
                <div className="premium-card" style={{ padding: '24px', borderLeft: '4px solid #6366f1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Xem trước hiển thị thực tế của Học sinh
                  </label>

                  {/* WMF Formula Warning */}
                  {activeQuestion.media && activeQuestion.media.some(m => m.type === 'FORMULA') && (
                    <div style={{
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                      borderRadius: '10px', padding: '12px 16px', marginBottom: '16px'
                    }}>
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      <div style={{ fontSize: '12.5px', color: '#92400e', lineHeight: 1.6 }}>
                        <strong>Câu hỏi chứa {activeQuestion.media.filter(m => m.type === 'FORMULA').length} công thức toán (MathType/WMF)</strong> không thể hiển thị trực tiếp trên trình duyệt.
                        <br />Vui lòng gõ lại công thức theo cú pháp <code style={{ backgroundColor: '#fef3c7', padding: '1px 4px', borderRadius: '4px' }}>$...$</code> vào ô nội dung câu hỏi và phương án.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Rendered content — use HTML from parser if available */}
                    <div
                      style={{ fontSize: '15px', color: '#0f172a', fontWeight: 500, lineHeight: 1.7 }}
                      className="mathjax-render question-html-preview"
                      dangerouslySetInnerHTML={{
                        __html: activeQuestion.content
                          ? activeQuestion.content
                              .replace(/<img([^>]+)src=(["'])([^"']+\.wmf)\2/gi,
                                '<span class="wmf-placeholder" title="Công thức MathType (WMF — không hiển thị được trên trình duyệt)">📐</span><img$1src=$2$3$2')
                          : '<em style="color:#94a3b8">Chưa có nội dung</em>'
                      }}
                    />

                    {/* Regular images (non-formula) */}
                    {activeQuestion.media && activeQuestion.media.filter(m => m.type !== 'FORMULA').length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '8px 0' }}>
                        {activeQuestion.media.filter(m => m.type !== 'FORMULA').map((med, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', backgroundColor: '#ffffff', maxWidth: '380px' }}>
                              {med.url && med.url.toLowerCase().endsWith('.wmf') ? (
                                <WmfPreview url={`${API_BASE}${med.url}`} />
                              ) : (
                                <img
                                  src={`${API_BASE}${med.url}`}
                                  alt={`render-${idx}`}
                                  style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}
                                  onError={(e) => { e.target.style.display='none'; }}
                                />
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                              {med.type === 'VARIATION_TABLE' ? 'Bảng biến thiên'
                                : med.type === 'GRAPH' ? 'Đồ thị'
                                : med.type === 'GEOMETRY' ? 'Hình học'
                                : med.type === 'TABLE' ? 'Bảng số liệu'
                                : med.type === 'MAP' ? 'Bản đồ'
                                : med.type === 'DIAGRAM' ? 'Sơ đồ'
                                : med.type === 'CHEMICAL_STRUCTURE' ? 'Cấu trúc hóa học'
                                : med.type === 'OTHER' ? 'Tài nguyên khác'
                                : `Hình ${idx + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* WMF Formula Previews for Teacher review */}
                    {activeQuestion.media && activeQuestion.media.filter(m => m.type === 'FORMULA').length > 0 && (
                      <div style={{ margin: '12px 0', padding: '14px', border: '1px dashed #6366f1', borderRadius: '10px', backgroundColor: '#f5f3ff' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#4f46e5', display: 'block', marginBottom: '8px' }}>
                          📐 Ảnh công thức gốc trong Word (Dùng để rà soát):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {activeQuestion.media.filter(m => m.type === 'FORMULA').map((med, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              <WmfPreview url={`${API_BASE}${med.url}`} />
                              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700 }}>
                                Công thức {idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic Options preview list */}
                    {(activeQuestion.type === 'MULTIPLE_CHOICE' || !activeQuestion.type) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                        {Array.isArray(activeQuestion.options) && activeQuestion.options.map((opt, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '10px',
                              border: opt.label === activeQuestion.correctAnswer ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                              backgroundColor: opt.label === activeQuestion.correctAnswer ? '#f0fdf4' : '#ffffff',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: opt.label === activeQuestion.correctAnswer ? '#15803d' : '#334155',
                              display: 'flex',
                              gap: '6px',
                              alignItems: 'flex-start'
                            }}
                          >
                            <span style={{ color: opt.label === activeQuestion.correctAnswer ? '#10b981' : '#6366f1', fontWeight: 800, flexShrink: 0 }}>{opt.label}.</span>
                            <span
                              className="mathjax-render"
                              dangerouslySetInnerHTML={{
                                __html: opt.text && opt.text !== '...'
                                  ? opt.text
                                      .replace(/<img([^>]+)src=(["'])([^"']+\.wmf)\2/gi,
                                        '<span class="wmf-placeholder" title="Công thức WMF">📐</span>')
                                  : '<em style="color:#94a3b8">Chưa có nội dung</em>'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {activeQuestion.type === 'TRUE_FALSE' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {Array.isArray(activeQuestion.options) && activeQuestion.options.map((opt, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: '#334155',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                              <span style={{ color: '#6366f1', fontWeight: 800, flexShrink: 0 }}>{opt.label}.</span>
                              <span
                                className="mathjax-render"
                                dangerouslySetInnerHTML={{
                                  __html: opt.text && opt.text !== '...'
                                    ? opt.text
                                        .replace(/<img([^>]+)src=(["'])([^"']+\.wmf)\2/gi,
                                          '<span class="wmf-placeholder" title="Công thức WMF">📐</span>')
                                    : '<em style="color:#94a3b8">Chưa có nội dung</em>'
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: opt.isCorrect ? '#d1fae5' : '#fee2e2',
                                color: opt.isCorrect ? '#065f46' : '#991b1b',
                                flexShrink: 0
                              }}
                            >
                              {opt.isCorrect ? 'Đúng' : 'Sai'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeQuestion.type === 'SHORT_ANSWER' && (
                      <div style={{ padding: '16px', borderRadius: '10px', border: '1.5px dashed #6366f1', backgroundColor: '#f5f3ff', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#4f46e5' }}>Đáp án điền khuyết của học sinh:</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="saas-search-input" 
                            disabled 
                            style={{ height: '38px', borderRadius: '8px', paddingLeft: '12px', backgroundColor: '#e2e8f0', color: '#64748b', flex: 1 }}
                            value={activeQuestion.correctAnswer}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Đúng (Định dạng: {activeQuestion.options?.format === 'NUMBER' ? 'Số học' : 'Chữ'})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {activeQuestion.explanation && (
                      <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>Hướng dẫn giải:</span>
                        <p
                          style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}
                          className="mathjax-render"
                          dangerouslySetInnerHTML={{ __html: activeQuestion.explanation || '' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Save and Submit Action Panel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button 
                    className="saas-select-filter" 
                    style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
                    onClick={handleSaveQuestion}
                    disabled={saving}
                  >
                    <HiSave /> {saving ? 'Đang lưu...' : 'Lưu thay đổi câu này'}
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="saas-select-filter" 
                      style={{ borderRadius: '10px', padding: '10px 20px', color: '#ef4444', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn từ chối phiên import này? Toàn bộ câu hỏi đã phân tích và các tệp tin đính kèm sẽ bị xóa hoàn toàn khỏi hệ thống!')) {
                          onDeleteSession(activeSession.id);
                        }
                      }}
                    >
                      Từ chối & Xóa đề
                    </button>

                    <button 
                      className="saas-btn-primary" 
                      style={{ borderRadius: '10px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        // Trigger main confirm action
                        onConfirm(activeSession.id);
                      }}
                    >
                      Xác nhận nhập Ngân hàng đề <HiChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                Chọn một câu hỏi từ danh sách bên trái để bắt đầu rà soát hậu kiểm.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
