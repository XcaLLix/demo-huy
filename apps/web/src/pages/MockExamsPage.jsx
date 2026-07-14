import React, { useState, useEffect } from 'react';
import MockExamCard from '../components/mock-exams/MockExamCard';
import MockExamFilters from '../components/mock-exams/MockExamFilters';
import { mockExamService } from '../services/mockExamService';
import { supabase } from '../lib/supabaseClient';
import { getLocalData } from '../services/mockDb';
import { api } from '../api';
import { 
  HiBookOpen, 
  HiClipboardList, 
  HiAcademicCap, 
  HiOutlineFolderOpen, 
  HiSearch, 
  HiCheckCircle,
  HiX
} from 'react-icons/hi';
import { FaCalculator, FaGlobe, FaAtom, FaFlask, FaRobot } from 'react-icons/fa';

const SUBJECT_GRADIENTS = {
  1: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  2: 'linear-gradient(135deg, #e17055 0%, #fdcb6e 100%)',
  3: 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)',
  4: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
};

const SUBJECT_ICONS = {
  1: FaCalculator,
  2: FaGlobe,
  3: FaAtom,
  4: FaFlask
};

export default function MockExamsPage({ currentUser, onSelectExam, navigateTo, examsList }) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    subjectId: 'All',
    year: 'All',
    examType: 'All',
    grade: 'All'
  });

  // Tab state: 'list' | 'wrong' | 'history'
  const [activeTab, setActiveTab] = useState('list');
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [wrongLoading, setWrongLoading] = useState(false);

  // Exam history state
  const [historyAttempts, setHistoryAttempts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // AI Similar Question practice state
  const [similarModalOpen, setSimilarModalOpen] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarSelectedOption, setSimilarSelectedOption] = useState(null);
  const [similarAnswerSubmitted, setSimilarAnswerSubmitted] = useState(false);

  const loadSubjects = async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('exam_subjects')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          setSubjects(data);
          return;
        }
      } catch (e) {
        // ignore
      }
    }
    const localSubj = getLocalData('supabase_mock_exam_subjects') || [];
    setSubjects(localSubj);
  };

  const loadExams = async () => {
    setLoading(true);
    try {
      if (examsList && examsList.length > 0) {
        let result = [...examsList];
        
        if (filters.subjectId && filters.subjectId !== 'All') {
          result = result.filter(e => String(e.subject_id) === String(filters.subjectId));
        }
        if (filters.year && filters.year !== 'All') {
          result = result.filter(e => String(e.year) === String(filters.year));
        }
        if (filters.examType && filters.examType !== 'All') {
          result = result.filter(e => e.exam_type === filters.examType);
        }
        if (filters.grade && filters.grade !== 'All') {
          result = result.filter(e => String(e.grade) === String(filters.grade));
        }
        if (filters.search) {
          const query = filters.search.toLowerCase();
          result = result.filter(e => e.title.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query));
        }
        setExams(result);
      } else {
        const data = await mockExamService.getMockExams(filters);
        setExams(data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đề thi:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWrongQuestions = async () => {
    setWrongLoading(true);
    try {
      const res = await api.getWrongQuestions();
      setWrongQuestions(res || []);
    } catch (err) {
      console.error('Lỗi tải nhật ký câu sai:', err);
    } finally {
      setWrongLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const list = await api.getAttempts();
      const submitted = (list || []).filter(a => a.status === 'SUBMITTED');
      submitted.sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt));
      setHistoryAttempts(submitted);
    } catch (err) {
      console.error('Lỗi tải lịch sử thi:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Auto-switch to tab from query param (e.g. ?tab=history)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'history' && currentUser) setActiveTab('history');
    else if (tabParam === 'wrong' && currentUser) setActiveTab('wrong');
  }, [currentUser]);

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { loadExams(); }, [filters, examsList]);

  useEffect(() => {
    if (activeTab === 'wrong') loadWrongQuestions();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const handleStartExam = (examId) => {
    navigateTo(`/mock-exams/${examId}/start`);
  };

  const handleRetakeWrong = async (examId, attemptId) => {
    try {
      const retake = await mockExamService.createSmartRetake(examId, 'wrong_only', attemptId);
      if (!retake || !retake.questions || retake.questions.length === 0) {
        alert('Không có câu hỏi sai nào phù hợp để làm lại!');
        return;
      }
      navigateTo(`/mock-exams/${examId}/start`, { retakeMode: 'wrong_only', retakeData: retake });
    } catch (err) {
      console.error(err);
      alert('Không thể tạo phiên làm lại câu sai.');
    }
  };

  const handlePracticeSimilar = async (wq) => {
    setSimilarModalOpen(true);
    setSimilarLoading(true);
    setSimilarQuestion(null);
    setSimilarSelectedOption(null);
    setSimilarAnswerSubmitted(false);
    try {
      const res = await api.generateSimilarQuestion({
        content: wq.content,
        topic: wq.topic,
        difficulty: wq.difficulty,
        options: wq.options,
        explanation: wq.explanation,
        subject: wq.subject
      });
      setSimilarQuestion(res);
    } catch (err) {
      console.error(err);
      alert('Không thể sinh câu hỏi tương tự từ AI.');
      setSimilarModalOpen(false);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleSelectSimilarOption = (opt) => {
    if (similarAnswerSubmitted) return;
    setSimilarSelectedOption(opt);
  };

  const handleSubmitSimilarAnswer = () => {
    if (!similarSelectedOption) return;
    setSimilarAnswerSubmitted(true);
  };

  const subjectCounts = {};
  exams.forEach(e => {
    const name = e.exam_subjects?.name || (
      e.subject_id === 1 ? 'Toán học' :
      e.subject_id === 2 ? 'Tiếng Anh' :
      e.subject_id === 3 ? 'Vật lý' : 'Hóa học'
    );
    subjectCounts[name] = (subjectCounts[name] || 0) + 1;
  });

  const hasActiveFilters =
    filters.search || filters.subjectId !== 'All' || filters.year !== 'All' || filters.examType !== 'All' || filters.grade !== 'All';

  const activeSubjectName = subjects.find(s => String(s.id) === String(filters.subjectId))?.name;

  return (
    <div className="mock-exams-public-page animate-in">
      <div className="mock-exams-content-wrapper">

        <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '20px', textTransform: 'uppercase' }}>
          Đề Thi Thử THPT Quốc Gia
        </h2>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'list', label: '📋 Tất cả đề thi', authRequired: false },
            { key: 'history', label: '📜 Lịch sử thi', authRequired: true },
            { key: 'wrong', label: '⚠️ Nhật ký câu sai (AI)', authRequired: true },
          ].filter(t => !t.authRequired || currentUser).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: '800',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === tab.key ? 'var(--exams-purple)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.key ? '3px solid var(--exams-purple)' : '3px solid transparent',
                marginBottom: '-14px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'list' ? (
          <>
            {/* Filter panel */}
            <MockExamFilters
              filters={filters}
              onFilterChange={setFilters}
              subjects={subjects}
            />

            {/* RESULTS BAR v2 */}
            {loading ? (
              <div className="exam-cards-grid">
                {[1, 2, 3, 4, 5, 6].map(idx => (
                  <div key={idx} className="exam-skeleton-card">
                    <div className="skeleton-header"></div>
                    <div className="skeleton-body">
                      <div className="skeleton-line w80"></div>
                      <div className="skeleton-line w60"></div>
                      <div className="skeleton-line w40"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : exams.length > 0 ? (
              <>
                <div className="exams-results-bar-v2">
                  <span className="results-count-v2">
                    Tìm thấy <strong>{exams.length}</strong> đề thi phù hợp
                  </span>

                  {hasActiveFilters && (
                    <div className="results-active-filters">
                      {filters.search && (
                        <span className="active-filter-chip">
                          Từ khoá: &quot;{filters.search}&quot;
                          <button onClick={() => setFilters(f => ({ ...f, search: '' }))} title="Xoá">×</button>
                        </span>
                      )}
                      {filters.subjectId !== 'All' && (
                        <span className="active-filter-chip">
                          {activeSubjectName}
                          <button onClick={() => setFilters(f => ({ ...f, subjectId: 'All' }))} title="Xoá">×</button>
                        </span>
                      )}
                      {filters.year !== 'All' && (
                        <span className="active-filter-chip">
                          Năm {filters.year}
                          <button onClick={() => setFilters(f => ({ ...f, year: 'All' }))} title="Xoá">×</button>
                        </span>
                      )}
                      {filters.examType !== 'All' && (
                        <span className="active-filter-chip">
                          {filters.examType === 'official' ? 'Chính thức' : filters.examType === 'mock' ? 'Trường chuyên' : 'Nội bộ'}
                          <button onClick={() => setFilters(f => ({ ...f, examType: 'All' }))} title="Xoá">×</button>
                        </span>
                      )}
                      {filters.grade !== 'All' && (
                        <span className="active-filter-chip">
                          Lớp {filters.grade}
                          <button onClick={() => setFilters(f => ({ ...f, grade: 'All' }))} title="Xoá">×</button>
                        </span>
                      )}
                      <button
                        onClick={() => setFilters({ search: '', subjectId: 'All', year: 'All', examType: 'All', grade: 'All' })}
                        style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                      >
                        Xoá tất cả
                      </button>
                    </div>
                  )}
                </div>

                <div className="exam-cards-grid" style={{ marginBottom: '40px' }}>
                  {exams.map(exam => (
                    <MockExamCard
                      key={exam.id}
                      exam={exam}
                      onSelect={onSelectExam}
                      onStart={handleStartExam}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="exams-empty-state">
                <HiOutlineFolderOpen style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', margin: '0 auto 12px auto' }} />
                <h3 className="empty-title">Không tìm thấy đề thi phù hợp</h3>
                <p className="empty-desc">Vui lòng thay đổi từ khóa hoặc điều chỉnh bộ lọc tìm kiếm.</p>
                <button
                  className="btn-primary"
                  onClick={() => setFilters({ search: '', subjectId: 'All', year: 'All', examType: 'All', grade: 'All' })}
                  style={{ marginTop: '12px', background: 'var(--exams-purple)', border: 'none', cursor: 'pointer' }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'history' ? (
          /* ── EXAM HISTORY TAB ── */
          <div style={{ marginTop: '12px', marginBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #6c5ce715, #a29bfe18)', border: '1.5px solid #6c5ce730', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📜 Lịch Sử Bài Thi Của Bạn
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Xem lại kết quả, phân tích AI và luyện tập tiếp theo cho tất cả các lần thi.
                </p>
              </div>
              <button
                onClick={loadHistory}
                style={{ padding: '8px 16px', background: 'var(--exams-purple)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                🔄 Làm mới
              </button>
            </div>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '28px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
                <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 'bold' }}>Đang tải lịch sử thi...</p>
              </div>
            ) : historyAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '16px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📭</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Chưa có lịch sử thi nào</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto 16px' }}>
                  Hãy chọn một đề thi và bắt đầu làm bài để lịch sử của bạn xuất hiện ở đây.
                </p>
                <button
                  onClick={() => setActiveTab('list')}
                  style={{ padding: '10px 20px', background: 'var(--exams-purple)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  📋 Xem danh sách đề thi
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historyAttempts.map((att, idx) => {
                  const score = att.score ?? 0;
                  const scoreColor = score >= 8 ? '#00b894' : score >= 5 ? '#e17055' : '#d63031';
                  const scoreBg = score >= 8 ? 'rgba(0,184,148,0.1)' : score >= 5 ? 'rgba(225,112,85,0.1)' : 'rgba(214,48,49,0.1)';
                  const rankLabel = score >= 9 ? 'Xuất sắc' : score >= 8 ? 'Giỏi' : score >= 6.5 ? 'Khá' : score >= 5 ? 'Trung bình' : 'Cần cải thiện';
                  const dateStr = att.submittedAt
                    ? new Date(att.submittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const totalQs = (att.correctCount || 0) + (att.wrongCount || 0) + (att.skippedCount || 0);
                  const durationMins = att.durationUsed ? Math.ceil(att.durationUsed / 60) : null;
                  const retakeMode = att.aiFeedback?.retakeMode || null;

                  return (
                    <div
                      key={att.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border)',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'box-shadow 0.2s',
                        position: 'relative'
                      }}
                    >
                      {/* Score Badge */}
                      <div style={{
                        minWidth: '70px',
                        textAlign: 'center',
                        background: scoreBg,
                        border: `2px solid ${scoreColor}`,
                        borderRadius: '12px',
                        padding: '10px 8px',
                        flexShrink: 0
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>
                          {score.toFixed(1)}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: scoreColor, marginTop: '2px' }}>{rankLabel}</div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                          {att.exam?.title || 'Đề thi thử'}
                          {retakeMode && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', background: '#6c5ce720', color: 'var(--exams-purple)', padding: '2px 7px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {retakeMode === 'wrong_only' ? 'Làm lại câu sai' : retakeMode === 'weak_topic' ? 'Chủ đề yếu' : retakeMode === 'bookmarked' ? 'Câu đánh dấu' : 'Ôn luyện'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {att.exam?.subject && (
                            <span style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              {att.exam.subject}
                            </span>
                          )}
                          <span>✅ {att.correctCount || 0}/{totalQs || '?'} câu đúng</span>
                          {durationMins && <span>⏱ {durationMins} phút</span>}
                          <span>🕐 {dateStr}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => navigateTo(`/mock-exams/${att.examId}/result/${att.id}`)}
                          style={{
                            padding: '8px 14px',
                            background: 'var(--bg-main)',
                            border: '1.5px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          🔎 Xem kết quả
                        </button>
                        <button
                          onClick={() => navigateTo(`/mock-exams/${att.examId}/start`)}
                          style={{
                            padding: '8px 14px',
                            background: 'var(--exams-purple)',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          ⚡ Thi lại
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Wrong Questions Log Tab */
          <div style={{ marginTop: '12px' }}>
            <div style={{ background: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🤖</span> Nhật Ký Câu Sai Thông Minh & AI Luyện Tập
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Hệ thống tự động lưu trữ toàn bộ câu hỏi bạn đã làm sai trong các đề thi. Bạn có thể luyện tập lại các câu hỏi này hoặc yêu cầu AI tạo ra các câu hỏi tương tự để nắm vững kiến thức!
              </p>
            </div>

            {wrongLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '24px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
                <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 'bold' }}>Đang nạp nhật ký câu sai...</p>
              </div>
            ) : wrongQuestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                {wrongQuestions.map((wq, idx) => (
                  <div key={wq.id || idx} style={{
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: 'var(--exams-purple)', color: '#fff' }}>
                          {wq.subject || 'Môn học'}
                        </span>
                        {wq.topic && (
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                            {wq.topic}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Độ khó: <strong>{wq.difficulty === 'HARD' ? 'Khó' : wq.difficulty === 'EASY' ? 'Dễ' : 'Trung bình'}</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        Nguồn đề: <strong style={{ color: 'var(--text-primary)' }}>{wq.examTitle || 'Đề thi'}</strong>
                      </span>
                    </div>

                    <div style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.6' }}>
                      Câu hỏi: {wq.content}
                    </div>

                    {/* Render image or audio if exists */}
                    {wq.imageUrl && (
                      <div style={{ marginBottom: '16px' }}>
                        <img src={wq.imageUrl} alt="Đính kèm câu hỏi" style={{ maxWidth: '100%', maxHeight: '250px', border: '1px solid var(--border)', borderRadius: '8px', objectFit: 'contain' }} />
                      </div>
                    )}
                    {wq.audioUrl && (
                      <div style={{ marginBottom: '16px' }}>
                        <audio src={wq.audioUrl} controls style={{ width: '100%', maxWidth: '400px' }} />
                      </div>
                    )}

                    {/* Options list */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      {wq.options && Object.entries(wq.options).map(([key, value]) => {
                        const isCorrect = key === wq.correctAnswer;
                        const isSelected = key === wq.selectedAnswer;
                        let borderStyle = '1px solid var(--border)';
                        let bgStyle = 'var(--bg-main)';
                        let textColor = 'var(--text-secondary)';
                        
                        if (isCorrect) {
                          borderStyle = '2px solid #2ecc71';
                          bgStyle = 'rgba(46, 204, 113, 0.1)';
                          textColor = '#27ae60';
                        } else if (isSelected) {
                          borderStyle = '2px solid #e74c3c';
                          bgStyle = 'rgba(231, 76, 60, 0.1)';
                          textColor = '#c0392b';
                        }

                        return (
                          <div key={key} style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: borderStyle,
                            background: bgStyle,
                            color: textColor,
                            fontSize: '13px',
                            fontWeight: (isCorrect || isSelected) ? 'bold' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isCorrect ? '#2ecc71' : isSelected ? '#e74c3c' : 'var(--border)',
                              color: (isCorrect || isSelected) ? '#fff' : 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>{key}</span>
                            <div style={{ flex: 1 }}>{value}</div>
                            {isCorrect && <span style={{ fontSize: '11px', color: '#27ae60' }}>(Đáp án đúng)</span>}
                            {isSelected && !isCorrect && <span style={{ fontSize: '11px', color: '#c0392b' }}>(Bạn chọn)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {wq.explanation && (
                      <div style={{ background: 'var(--bg-main)', borderLeft: '4px solid var(--exams-purple)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                        <strong>Lời giải:</strong> {wq.explanation}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <button
                        onClick={() => handleRetakeWrong(wq.examId, wq.attemptId)}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--bg-card)',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '12.5px',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🔄 Làm lại các câu sai của đề này
                      </button>
                      <button
                        onClick={() => handlePracticeSimilar(wq)}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--exams-purple)',
                          border: '2px solid var(--border)',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '12.5px',
                          color: '#fff',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🤖 Luyện câu tương tự AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '16px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎉</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Nhật ký câu sai trống!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                  Tuyệt vời! Bạn không có bất kỳ câu hỏi làm sai nào. Hãy tích cực làm thêm nhiều đề thi khác để duy trì phong độ nhé.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA Banner for guests */}
        {!currentUser && (
          <div className="exams-cta-banner">
            <div className="cta-content">
              <h3 className="cta-title">🚀 Đăng ký tài khoản miễn phí</h3>
              <p className="cta-desc">Lưu lịch sử làm bài, nhận phân tích kết quả từ AI và theo dõi tiến trình ôn tập.</p>
            </div>
            <button className="cta-btn" onClick={() => navigateTo('/')}>Đăng ký ngay →</button>
          </div>
        )}
      </div>

      {/* AI Similar Question Practice Modal */}
      {similarModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-main)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🤖</span> AI Luyện Tập Câu Hỏi Tương Tự
              </h3>
              <button
                onClick={() => setSimilarModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HiX />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {similarLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '28px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚡</div>
                  <p style={{ marginTop: '12px', fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    AI đang biên soạn câu hỏi tương tự cùng độ khó...
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Lộ trình học tối ưu hóa theo timing và mục tiêu của bạn.
                  </p>
                </div>
              ) : similarQuestion ? (
                <div>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    display: 'inline-block',
                    marginBottom: '12px'
                  }}>
                    Chủ đề: {similarQuestion.topic || 'Chung'} | Độ khó: {similarQuestion.difficulty || 'MEDIUM'}
                  </div>

                  <div style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.6' }}>
                    {similarQuestion.content}
                  </div>

                  {/* Option Choices */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {similarQuestion.options && similarQuestion.options.map((opt) => {
                      const isSelected = similarSelectedOption === opt.label;
                      const isCorrectAnswer = opt.label === similarQuestion.correctAnswer;
                      
                      let borderStyle = '1px solid var(--border)';
                      let bgStyle = 'var(--bg-card)';
                      let textColor = 'var(--text-primary)';

                      if (similarAnswerSubmitted) {
                        if (isCorrectAnswer) {
                          borderStyle = '2px solid #2ecc71';
                          bgStyle = 'rgba(46, 204, 113, 0.1)';
                          textColor = '#27ae60';
                        } else if (isSelected) {
                          borderStyle = '2px solid #e74c3c';
                          bgStyle = 'rgba(231, 76, 60, 0.1)';
                          textColor = '#c0392b';
                        }
                      } else if (isSelected) {
                        borderStyle = '2px solid var(--exams-purple)';
                        bgStyle = 'rgba(108, 92, 231, 0.05)';
                      }

                      return (
                        <button
                          key={opt.label}
                          disabled={similarAnswerSubmitted}
                          onClick={() => handleSelectSimilarOption(opt.label)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: borderStyle,
                            background: bgStyle,
                            color: textColor,
                            fontSize: '13px',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            cursor: similarAnswerSubmitted ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isCorrectAnswer && similarAnswerSubmitted ? '#2ecc71' : (isSelected ? 'var(--exams-purple)' : 'var(--border)'),
                            color: (isCorrectAnswer && similarAnswerSubmitted) || isSelected ? '#fff' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>{opt.label}</span>
                          <div style={{ flex: 1 }}>{opt.text}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submission and Result message */}
                  {!similarAnswerSubmitted ? (
                    <button
                      onClick={handleSubmitSimilarAnswer}
                      disabled={!similarSelectedOption}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: similarSelectedOption ? 'var(--exams-purple)' : 'var(--border)',
                        color: similarSelectedOption ? '#fff' : 'var(--text-muted)',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '13.5px',
                        cursor: similarSelectedOption ? 'pointer' : 'not-allowed',
                        boxShadow: similarSelectedOption ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Kiểm tra đáp án
                    </button>
                  ) : (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '2px solid var(--border)',
                      background: 'var(--bg-main)',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: similarSelectedOption === similarQuestion.correctAnswer ? '#27ae60' : '#c0392b',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {similarSelectedOption === similarQuestion.correctAnswer ? (
                          <><span>✅</span> Chính xác! Bạn đã hiểu bài rất tốt.</>
                        ) : (
                          <><span>❌</span> Chưa chính xác. Đừng lo lắng, hãy xem lời giải thích bên dưới.</>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Giải thích chi tiết:</strong> {similarQuestion.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Không thể sinh câu hỏi lúc này.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '2px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--bg-main)',
              borderBottomLeftRadius: '13px',
              borderBottomRightRadius: '13px'
            }}>
              <button
                onClick={() => setSimilarModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-card)',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
