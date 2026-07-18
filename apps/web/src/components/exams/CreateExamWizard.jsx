import React, { useState, useEffect } from 'react';
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

export function CreateExamWizard({ onClose, onSubmit, editingExamId }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Toán học',
    duration: 90,
    grade: 12,
    description: '',
    creationMethod: 'MANUAL',
    questionIds: [],
    aiConfig: { topic: TOPICS_BY_SUBJECT['Toán học'][0], easyCount: 5, mediumCount: 5, hardCount: 5 }
  });

  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // MathJax Formula typesetting hook
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err));
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [step, availableQuestions]);

  // Fetch questions for manual choice
  useEffect(() => {
    if (step === 2 && formData.creationMethod === 'MANUAL') {
      api.getTeacherQuestions({ subject: formData.subject, limit: 50 }).then(res => {
        setAvailableQuestions(res.questions || []);
      });
    }
  }, [step, formData.subject, formData.creationMethod]);

  // Load existing exam for edit
  useEffect(() => {
    if (editingExamId) {
      api.getTeacherExamById(editingExamId).then(res => {
        if (res) {
          setFormData({
            title: res.title || '',
            subject: res.subject || 'Toán học',
            duration: res.duration || 90,
            grade: res.grade || 12,
            description: res.description || '',
            creationMethod: 'MANUAL',
            questionIds: res.examQuestions?.map(eq => eq.questionId) || [],
            aiConfig: { topic: '', easyCount: 5, mediumCount: 5, hardCount: 5 }
          });
        }
      });
    }
  }, [editingExamId]);

  const handleCheckboxChange = (qId) => {
    const ids = formData.questionIds.includes(qId)
      ? formData.questionIds.filter(id => id !== qId)
      : [...formData.questionIds, qId];
    setFormData({ ...formData, questionIds: ids });
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      if (editingExamId) {
        await api.updateTeacherExam(editingExamId, formData);
      } else {
        await api.createTeacherExam(formData);
      }
      alert('Đã lưu đề thi thành công!');
      onSubmit();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = availableQuestions.filter(q => 
    q.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        style={{
          width: '90%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '90vh',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
            {editingExamId ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
          >
            ×
          </button>
        </div>

        {/* Steps Progress */}
        <div className="wizard-steps-header">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`wizard-step-node ${step === n ? 'active' : step > n ? 'completed' : ''}`}>
              <div className="wizard-step-circle">{n}</div>
              <span className="wizard-step-label">
                {n === 1 ? 'Thông tin' : n === 2 ? 'Chọn câu hỏi' : n === 3 ? 'Xem trước' : 'Hoàn tất'}
              </span>
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Tiêu đề đề thi</label>
                <input 
                  type="text" 
                  className="saas-search-input" 
                  style={{ paddingLeft: '16px' }}
                  placeholder="Ví dụ: Đề khảo sát chất lượng môn Toán lớp 12 - Lần 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Môn học</label>
                  <select 
                    className="saas-select-filter" 
                    style={{ width: '100%' }}
                    value={formData.subject}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      const defaultTopic = TOPICS_BY_SUBJECT[newSub]?.[0] || '';
                      setFormData({ 
                        ...formData, 
                        subject: newSub, 
                        aiConfig: { ...formData.aiConfig, topic: defaultTopic } 
                      });
                    }}
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Thời lượng (phút)</label>
                  <input 
                    type="number" 
                    className="saas-search-input" 
                    style={{ paddingLeft: '16px' }}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Mô tả chi tiết</label>
                <textarea 
                  rows="3"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px', outline: 'none', fontSize: '13.5px', boxSizing: 'border-box' }}
                  placeholder="Ghi chú thêm về cấu trúc đề thi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Phương thức cấu tạo</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="creationMethod" 
                      value="MANUAL"
                      checked={formData.creationMethod === 'MANUAL'}
                      onChange={() => setFormData({ ...formData, creationMethod: 'MANUAL' })}
                    />
                    Tự chọn thủ công
                  </label>
                  {!editingExamId && (
                    <label style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="creationMethod" 
                        value="AI"
                        checked={formData.creationMethod === 'AI'}
                        onChange={() => setFormData({ ...formData, creationMethod: 'AI' })}
                      />
                      Gợi ý câu hỏi tự động (AI Recommendation)
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && formData.creationMethod === 'MANUAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" 
                className="saas-search-input" 
                style={{ paddingLeft: '16px' }}
                placeholder="Tìm lọc câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px' }}>
                {filteredQuestions.map((q) => (
                  <label key={q.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.questionIds.includes(q.id)}
                      onChange={() => handleCheckboxChange(q.id)}
                    />
                    <div>
                      <strong>#{q.id} ({q.difficulty}):</strong> {q.content}
                    </div>
                  </label>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Đã chọn: {formData.questionIds.length} câu hỏi.</span>
            </div>
          )}

          {step === 2 && formData.creationMethod === 'AI' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Chuyên đề (Topic)</label>
                <select 
                  className="saas-select-filter" 
                  style={{ width: '100%' }}
                  value={formData.aiConfig.topic}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    aiConfig: { ...formData.aiConfig, topic: e.target.value } 
                  })}
                >
                  {(TOPICS_BY_SUBJECT[formData.subject] || []).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Số câu Dễ</label>
                  <input 
                    type="number" 
                    className="saas-search-input" 
                    style={{ paddingLeft: '12px' }}
                    value={formData.aiConfig.easyCount}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      aiConfig: { ...formData.aiConfig, easyCount: Number(e.target.value) } 
                    })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Số câu Trung bình</label>
                  <input 
                    type="number" 
                    className="saas-search-input" 
                    style={{ paddingLeft: '12px' }}
                    value={formData.aiConfig.mediumCount}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      aiConfig: { ...formData.aiConfig, mediumCount: Number(e.target.value) } 
                    })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Số câu Khó</label>
                  <input 
                    type="number" 
                    className="saas-search-input" 
                    style={{ paddingLeft: '12px' }}
                    value={formData.aiConfig.hardCount}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      aiConfig: { ...formData.aiConfig, hardCount: Number(e.target.value) } 
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '14.5px', fontWeight: 800 }}>{formData.title || '(Chưa điền tiêu đề)'}</h5>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  Môn học: {formData.subject} | Thời lượng: {formData.duration} phút | Lớp: {formData.grade}
                </p>
                {formData.description && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                    Mô tả: {formData.description}
                  </p>
                )}
              </div>

              <div style={{ fontSize: '13px' }}>
                {formData.creationMethod === 'MANUAL' ? (
                  <p>Cấu trúc đề thi gồm có: <strong>{formData.questionIds.length}</strong> câu hỏi tự chọn thủ công.</p>
                ) : (
                  <p>
                    Hệ thống sẽ lấy tự động: 
                    <strong> {formData.aiConfig.easyCount}</strong> câu Dễ, 
                    <strong> {formData.aiConfig.mediumCount}</strong> câu Trung bình, và 
                    <strong> {formData.aiConfig.hardCount}</strong> câu Khó từ Ngân hàng câu hỏi.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '48px' }}>🎉</span>
              <h4 style={{ margin: '12px 0 6px 0', fontWeight: 800 }}>Cấu trúc đề thi đã sẵn sàng!</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Nhấn nút "Lưu đề thi" phía dưới để ghi dữ liệu nháp vào hệ thống.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button 
            className="saas-select-filter" 
            style={{ borderRadius: '20px' }}
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
          >
            Quay lại
          </button>
          
          {step < 4 ? (
            <button 
              className="saas-btn-primary"
              onClick={() => {
                if (step === 1 && !formData.title) return alert('Vui lòng nhập tiêu đề đề thi!');
                setStep(step + 1);
              }}
            >
              Tiếp tục
            </button>
          ) : (
            <button 
              className="saas-btn-primary" 
              disabled={submitting}
              onClick={handleSave}
            >
              {submitting ? 'Đang lưu...' : 'Lưu đề thi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
