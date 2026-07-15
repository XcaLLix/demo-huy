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

  // Tab state: 'list' | 'history'
  const [activeTab, setActiveTab] = useState('list');

  // Exam history state
  const [historyAttempts, setHistoryAttempts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
  }, [currentUser]);

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { loadExams(); }, [filters, examsList]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const handleStartExam = (examId) => {
    navigateTo(`/mock-exams/${examId}/start`);
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
        ) : (
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

    </div>
  );
}
