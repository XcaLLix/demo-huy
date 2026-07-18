import React, { useState, useEffect } from 'react';
import { HiSearch, HiPlus, HiOutlineFlag, HiPencilAlt, HiEye } from 'react-icons/hi';
import { api } from '../../api';

const TOPICS_BY_SUBJECT = {
  'Toán học': [
    'Hàm số và Đồ thị (Lớp 10, 12)',
    'Mũ và Lôgarit (Lớp 11, 12)',
    'Tích phân và Nguyên hàm (Lớp 12)',
    'Hình học không gian (Lớp 11, 12)',
    'Khảo sát hàm số (Lớp 12)',
    'Tổ hợp và Xác suất (Lớp 11)',
    'Vectơ và Tọa độ (Lớp 10, 12)',
    'Lượng giác (Lớp 11)',
    'Phương trình và Hệ phương trình (Lớp 10)'
  ],
  'Vật lý': [
    'Dao động cơ (Lớp 12)',
    'Sóng cơ và Sóng âm (Lớp 12)',
    'Dòng điện xoay chiều (Lớp 12)',
    'Dao động và Sóng điện từ (Lớp 12)',
    'Sóng ánh sáng (Lớp 12)',
    'Lượng tử ánh sáng (Lớp 12)',
    'Hạt nhân nguyên tử (Lớp 12)',
    'Cơ học & Động học (Lớp 10)',
    'Điện tích & Điện trường (Lớp 11)'
  ],
  'Hóa học': [
    'Este và Lipit (Lớp 12)',
    'Cacbohidrat (Lớp 12)',
    'Amin, Amino axit và Protein (Lớp 12)',
    'Polime và Vật liệu polime (Lớp 12)',
    'Đại cương về kim loại (Lớp 12)',
    'Kim loại kiềm, kiềm thổ, nhôm (Lớp 12)',
    'Sắt và một số kim loại quan trọng (Lớp 12)',
    'Hóa học vô cơ & Phi kim (Lớp 10, 11)',
    'Hóa học hữu cơ đại cương (Lớp 11)'
  ],
  'Tiếng Anh': [
    'Thì của động từ (Verb Tenses)',
    'Câu bị động (Passive Voice)',
    'Câu điều kiện & Câu ước (Conditional & Wish)',
    'Mệnh đề quan hệ (Relative Clauses)',
    'Sự hòa hợp chủ ngữ & động từ (Subject-Verb Agreement)',
    'Câu gián tiếp (Reported Speech)',
    'Danh từ, Tính từ, Trạng từ (Nouns, Adjectives, Adverbs)',
    'Động từ khuyết thiếu (Modal Verbs)',
    'Phát âm & Trọng âm (Pronunciation & Stress)'
  ]
};


export function QuestionsTab({ 
  questions, 
  pagination, 
  filters, 
  setFilters, 
  onPageChange,
  currentUser
}) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(null); // questionId or null
  const [reportReason, setReportReason] = useState('');

  // MathJax Formula typesetting hook
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedQuestion, questions, showForm]);

  // Form State for creating/editing manual question
  const [questionFormData, setQuestionFormData] = useState({
    id: null,
    content: '',
    subject: 'Toán học',
    topic: TOPICS_BY_SUBJECT['Toán học'][0],
    difficulty: 'MEDIUM',
    correctAnswer: 'A',
    explanation: '',
    options: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' }
    ]
  });

  const handleOpenForm = (q = null) => {
    if (q) {
      setQuestionFormData({
        id: q.id,
        content: q.content || '',
        subject: q.subject || 'Toán học',
        topic: q.topic || TOPICS_BY_SUBJECT[q.subject || 'Toán học']?.[0] || '',
        difficulty: q.difficulty || 'MEDIUM',
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || '',
        options: q.optionsRel?.length > 0 
          ? q.optionsRel.map(o => ({ label: o.optionLabel, text: o.optionText }))
          : [
              { label: 'A', text: '' },
              { label: 'B', text: '' },
              { label: 'C', text: '' },
              { label: 'D', text: '' }
            ]
      });
    } else {
      setQuestionFormData({
        id: null,
        content: '',
        subject: 'Toán học',
        topic: TOPICS_BY_SUBJECT['Toán học'][0],
        difficulty: 'MEDIUM',
        correctAnswer: 'A',
        explanation: '',
        options: [
          { label: 'A', text: '' },
          { label: 'B', text: '' },
          { label: 'C', text: '' },
          { label: 'D', text: '' }
        ]
      });
    }
    setShowForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionFormData.content.trim()) return alert('Vui lòng nhập nội dung câu hỏi!');
    if (questionFormData.options.some(o => !o.text.trim())) return alert('Vui lòng điền đủ 4 đáp án!');

    try {
      if (questionFormData.id) {
        await api.updateTeacherQuestion(questionFormData.id, questionFormData);
        alert('Cập nhật câu hỏi thành công!');
      } else {
        await api.createTeacherQuestion(questionFormData);
        alert('Thêm câu hỏi mới vào ngân hàng thành công!');
      }
      setShowForm(false);
      onPageChange(pagination.page);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return alert('Vui lòng nhập lý do báo cáo!');
    try {
      await api.reportTeacherQuestion(showReportModal, reportReason);
      alert('Đã gửi báo cáo lỗi câu hỏi thành công. Admin sẽ kiểm duyệt nội dung.');
      setShowReportModal(null);
      setReportReason('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search Toolbar */}
      <div className="saas-toolbar">
        <div className="saas-search-input-wrapper">
          <HiSearch className="saas-input-icon" />
          <input
            type="text"
            className="saas-search-input"
            placeholder="Tìm kiếm câu hỏi..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="saas-select-filter"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="">Tất cả môn</option>
            <option value="Toán học">Toán học</option>
            <option value="Vật lý">Vật lý</option>
            <option value="Hóa học">Hóa học</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
          </select>

          <select
            className="saas-select-filter"
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">Mọi độ khó</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>

          <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={filters.ownerOnly}
              onChange={(e) => setFilters({ ...filters, ownerOnly: e.target.checked })}
            />
            Của tôi
          </label>

          <button className="saas-btn-primary" onClick={() => handleOpenForm()}>
            <HiPlus /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="saas-table-container">
        <table className="saas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th style={{ width: '45%' }}>Nội dung câu hỏi</th>
              <th>Môn học</th>
              <th>Độ khó</th>
              <th>Người sở hữu</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  Không tìm thấy câu hỏi nào.
                </td>
              </tr>
            ) : (
              questions.map(q => (
                <tr key={q.id}>
                  <td>#{q.id}</td>
                  <td style={{ fontWeight: 600 }}>{q.content}</td>
                  <td>{q.subject}</td>
                  <td>
                    <span 
                      className="saas-badge"
                      style={{
                        backgroundColor: q.difficulty === 'EASY' ? '#d1fae5' : q.difficulty === 'MEDIUM' ? '#fef3c7' : '#fee2e2',
                        color: q.difficulty === 'EASY' ? '#065f46' : q.difficulty === 'MEDIUM' ? '#92400e' : '#991b1b'
                      }}
                    >
                      {q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'T.Bình' : 'Khó'}
                    </span>
                  </td>
                  <td>{q.creator?.fullName || 'Hệ thống'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => setSelectedQuestion(q)}
                        style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                        title="Xem chi tiết"
                      >
                        <HiEye style={{ color: '#64748b' }} />
                      </button>
                      
                      {q.createdBy === currentUser?.id ? (
                        <button 
                          onClick={() => handleOpenForm(q)}
                          style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                          title="Sửa câu hỏi"
                        >
                          <HiPencilAlt style={{ color: '#6366f1' }} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowReportModal(q.id)}
                          style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                          title="Báo cáo sai sót"
                        >
                          <HiOutlineFlag style={{ color: '#ef4444' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          {Array.from({ length: pagination.totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onPageChange(idx + 1)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: pagination.page === idx + 1 ? '#6366f1' : '#ffffff',
                color: pagination.page === idx + 1 ? '#ffffff' : '#1e293b',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', zIndex: 1010 }}>
          <div style={{ width: '90%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Chi tiết câu hỏi #{selectedQuestion.id}</h4>
              <button onClick={() => setSelectedQuestion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}>×</button>
            </div>
            <div>
              <p style={{ fontWeight: 700, margin: '0 0 12px 0' }}>{selectedQuestion.content}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedQuestion.optionsRel?.map(opt => (
                  <div key={opt.id} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: opt.optionLabel === selectedQuestion.correctAnswer ? '#d1fae5' : '#ffffff', fontWeight: opt.optionLabel === selectedQuestion.correctAnswer ? 700 : 500 }}>
                    {opt.optionLabel}. {opt.optionText}
                  </div>
                ))}
              </div>
              {selectedQuestion.explanation && (
                <div style={{ marginTop: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px' }}>
                  <strong>Lời giải chi tiết:</strong> {selectedQuestion.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
          <div style={{ width: '90%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Báo cáo sai sót câu hỏi #{showReportModal}</h4>
            <textarea 
              rows="3"
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px', fontSize: '13px', boxSizing: 'border-box' }}
              placeholder="Nhập lý do sai sót (Ví dụ: đáp án sai, lỗi gõ chữ...)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="saas-select-filter" style={{ borderRadius: '16px' }} onClick={() => setShowReportModal(null)}>Hủy</button>
              <button className="saas-btn-primary" onClick={handleSubmitReport}>Gửi báo cáo</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
          <div style={{ width: '95%', maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                {questionFormData.id ? `Sửa câu hỏi #${questionFormData.id}` : 'Thêm câu hỏi mới'}
              </h4>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}>×</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Nội dung câu hỏi</label>
              <textarea 
                rows="2"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px', fontSize: '13.5px', boxSizing: 'border-box' }}
                value={questionFormData.content}
                onChange={(e) => setQuestionFormData({ ...questionFormData, content: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Môn học</label>
                <select 
                  className="saas-select-filter" 
                  style={{ width: '100%' }}
                  value={questionFormData.subject}
                  onChange={(e) => {
                    const newSub = e.target.value;
                    const defaultTopic = TOPICS_BY_SUBJECT[newSub]?.[0] || '';
                    setQuestionFormData({ ...questionFormData, subject: newSub, topic: defaultTopic });
                  }}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Chuyên đề</label>
                <select 
                  className="saas-select-filter" 
                  style={{ width: '100%', height: '42px' }}
                  value={questionFormData.topic}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, topic: e.target.value })}
                >
                  {(TOPICS_BY_SUBJECT[questionFormData.subject] || []).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Độ khó</label>
                <select 
                  className="saas-select-filter" 
                  style={{ width: '100%' }}
                  value={questionFormData.difficulty}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, difficulty: e.target.value })}
                >
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>4 Đáp án lựa chọn</label>
              {questionFormData.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800 }}>{opt.label}.</span>
                  <input 
                    type="text" 
                    className="saas-search-input" 
                    style={{ paddingLeft: '12px', height: '36px' }}
                    value={opt.text}
                    onChange={(e) => {
                      const opts = [...questionFormData.options];
                      opts[idx].text = e.target.value;
                      setQuestionFormData({ ...questionFormData, options: opts });
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Đáp án đúng</label>
                <select 
                  className="saas-select-filter" 
                  style={{ width: '100%' }}
                  value={questionFormData.correctAnswer}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, correctAnswer: e.target.value })}
                >
                  <option value="A">Đáp án A</option>
                  <option value="B">Đáp án B</option>
                  <option value="C">Đáp án C</option>
                  <option value="D">Đáp án D</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Lời giải chi tiết</label>
              <textarea 
                rows="2"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px', fontSize: '13px', boxSizing: 'border-box' }}
                value={questionFormData.explanation}
                onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button className="saas-select-filter" style={{ borderRadius: '16px' }} onClick={() => setShowForm(false)}>Hủy</button>
              <button className="saas-btn-primary" onClick={handleSaveQuestion}>Lưu lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
