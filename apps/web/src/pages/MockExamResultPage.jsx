import React, { useState, useEffect } from 'react';
import ExamResultSummary from '../components/mock-exams/ExamResultSummary';
import ExamReviewList from '../components/mock-exams/ExamReviewList';
import TrustScoreCard from '../components/mock-exams/TrustScoreCard';
import TopicAnalysisChart from '../components/mock-exams/TopicAnalysisChart';
import DifficultyChart from '../components/mock-exams/DifficultyChart';
import CapabilityAnalysis from '../components/mock-exams/CapabilityAnalysis';
import AiCoachCard from '../components/mock-exams/AiCoachCard';
import SmartRetakeOptions from '../components/mock-exams/SmartRetakeOptions';
import ExamReplayTimeline from '../components/mock-exams/ExamReplayTimeline';
import { mockExamService } from '../services/mockExamService';
import { toast } from '../utils/toast';
import { 
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

const TABS = [
  { key: 'overview', label: '📊 Tổng quan' },
  { key: 'analysis', label: '📈 Phân tích' },
  { key: 'coach', label: '🤖 AI Coach' },
  { key: 'wrong_questions', label: '❌ Phân tích câu sai' },
  { key: 'review', label: '📝 Xem lại bài' },
  { key: 'replay', label: '📼 Replay' }
];

export default function MockExamResultPage({ examId, attemptId, currentUser, navigateTo }) {
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [coachPlan, setCoachPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [similarStates, setSimilarStates] = useState({});

  useEffect(() => {
    if (window.MathJax) {
      setTimeout(() => {
        window.MathJax.typesetPromise?.().catch(e => console.log('MathJax error:', e));
      }, 100);
    }
  }, [activeTab, similarStates]);

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
        content: q.question_text || q.content,
        topic: q.topic || 'Chung',
        difficulty: q.difficulty === 'Dễ' || q.difficulty === 'EASY' ? 'EASY' : (q.difficulty === 'Khó' || q.difficulty === 'HARD' ? 'HARD' : 'MEDIUM'),
        options: q.options?.map(o => ({ label: o.option_label || o.label, text: o.option_text || o.text })) || [],
        explanation: q.explanation,
        subject: result?.mock_exams?.subject || result?.subject || 'Toán học'
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

  const loadResultDetails = async () => {
    setLoading(true);
    try {
      const resultData = await mockExamService.getExamResult(attemptId);
      setResult(resultData);

      if (resultData?.questions?.length > 0) {
        setQuestions(resultData.questions);
      } else {
        const qs = await mockExamService.getExamQuestions(examId);
        setQuestions(qs);
      }

      const answersList = await mockExamService.getAttemptAnswers(attemptId);
      const answersMap = {};
      answersList.forEach(ans => {
        answersMap[ans.question_id] = ans.selected_option_label;
      });
      setUserAnswers(answersMap);

      // Load analytics (topicStats, difficultyStats, trust score)
      const analyticsData = await mockExamService.getAttemptAnalytics(attemptId);
      if (analyticsData) {
        setAnalytics(analyticsData);
      }

      // Extract coach plan from existing aiFeedback if present
      if (resultData?.ai_feedback) {
        try {
          const fb = typeof resultData.ai_feedback === 'string'
            ? JSON.parse(resultData.ai_feedback)
            : resultData.ai_feedback;
          if (fb?.coachPlan) setCoachPlan(fb.coachPlan);
        } catch (_) {}
      }
    } catch (err) {
      console.error('Lỗi nạp kết quả thi:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    if (events.length > 0) return;
    setEventsLoading(true);
    try {
      const data = await mockExamService.getExamEvents(attemptId);
      setEvents(data);
    } catch (_) {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleGenerateCoach = async () => {
    setCoachLoading(true);
    try {
      const plan = await mockExamService.generateAiCoach(attemptId);
      if (plan) {
        setCoachPlan(plan);
        toast('AI Coach đã tạo kế hoạch học 7 ngày cho bạn!', 'success');
      }
    } catch (_) {
      toast('Không thể tạo kế hoạch AI Coach. Vui lòng thử lại.', 'error');
    } finally {
      setCoachLoading(false);
    }
  };

  const handleRetake = async (eid, mode, aid) => {
    if (mode === 'bookmarked') {
      const bookmarkedKeys = Object.keys(
        JSON.parse(localStorage.getItem(`exam_taking_bookmarks_${examId}`) || '{}')
      );
      const bookmarkedQuestions = questions.filter(q => bookmarkedKeys.includes(String(q.id)));
      if (bookmarkedQuestions.length === 0) {
        toast('Không có câu hỏi đánh dấu nào!', 'warning');
        return;
      }
      
      const mappedQuestions = bookmarkedQuestions.map(q => {
        const dbOptions = q.options?.map(opt => ({
          label: opt.option_label,
          text: opt.option_text
        })) || [];
        
        let dbDifficulty = 'MEDIUM';
        if (q.difficulty === 'Dễ') dbDifficulty = 'EASY';
        else if (q.difficulty === 'Khó') dbDifficulty = 'HARD';

        return {
          id: Number(q.id),
          content: q.question_text,
          options: dbOptions,
          subject: result?.mock_exams?.subject || '',
          topic: q.topic,
          difficulty: dbDifficulty,
          imageUrl: q.question_image_url || null,
          explanation: q.explanation
        };
      });

      const retake = {
        exam: {
          id: Number(examId),
          title: `${result?.mock_exams?.title || 'Đề thi'} — Làm lại câu đánh dấu`,
          subject: result?.mock_exams?.subject || '',
          duration: Math.max(15, Math.ceil(mappedQuestions.length * 1.5)),
          totalQuestions: mappedQuestions.length,
          retakeMode: 'bookmarked',
          sourceExamId: Number(examId),
          sourceAttemptId: attemptId || null
        },
        questions: mappedQuestions
      };
      navigateTo(`/mock-exams/${eid}/start`, { retakeMode: mode, retakeData: retake });
      return;
    }
    try {
      const retake = await mockExamService.createSmartRetake(eid, mode, aid);
      if (retake?.questions?.length === 0) {
        toast('Không có câu hỏi phù hợp với chế độ này!', 'warning');
        return;
      }
      navigateTo(`/mock-exams/${eid}/start`, { retakeMode: mode, retakeData: retake });
    } catch (_) {
      toast('Không thể tạo phiên ôn luyện. Vui lòng thử lại.', 'error');
    }
  };

  useEffect(() => {
    loadResultDetails();
  }, [examId, attemptId]);

  useEffect(() => {
    if (activeTab === 'replay') loadEvents();
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '30px', animation: 'pulse 1.5s infinite alternate' }}>⏳</div>
        <p style={{ marginTop: '12px', fontSize: '13px' }}>Đang nạp bảng điểm và phân tích kết quả...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '16px 0 8px', color: 'var(--text-primary)' }}>Không tìm thấy kết quả</h3>
        <button className="btn-primary" onClick={() => navigateTo('/mock-exams')} style={{ marginTop: '12px' }}>
          Quay lại danh mục đề thi
        </button>
      </div>
    );
  }

  const aiFeedback = (() => {
    try {
      if (!result.ai_feedback) return null;
      return typeof result.ai_feedback === 'string' ? JSON.parse(result.ai_feedback) : result.ai_feedback;
    } catch (_) { return null; }
  })();

  const topicStats = analytics?.topicStats || aiFeedback?.topicStats || {};
  const difficultyStats = analytics?.difficultyStats || aiFeedback?.difficultyStats || {};
  const trustScore = analytics?.examTrustScore ?? null;

  const bookmarkedKeys = Object.keys(
    JSON.parse(localStorage.getItem(`exam_taking_bookmarks_${examId}`) || '{}')
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px', margin: '0 auto', padding: '0 16px 48px' }} className="animate-in">

      {/* ── TOP NAVIGATION ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => navigateTo(`/mock-exams/${examId}`)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Chi tiết đề thi
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-outline" onClick={() => navigateTo('/mock-exams')} style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 'bold' }}>
            Danh mục đề thi
          </button>
          <button
            className="btn-primary"
            onClick={() => navigateTo(`/mock-exams/${examId}/start`)}
            style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 'bold', background: 'var(--exams-purple)', color: '#fff', border: 'none' }}
          >
            Thi lại ⚡
          </button>
        </div>
      </div>

      {/* ── SCORE SUMMARY ── */}
      <ExamResultSummary result={result} durationSeconds={result.duration_seconds || 0} />

      {/* ── TRUST SCORE (if available) ── */}
      {trustScore !== null && (
        <TrustScoreCard
          trustScore={trustScore}
          tabSwitchCount={analytics?.tabSwitchCount || 0}
          copyPasteCount={analytics?.copyPasteCount || 0}
          fullscreenExitCount={analytics?.fullscreenExitCount || 0}
        />
      )}

      {/* ── TABS ── */}
      <div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--border)', overflowX: 'auto', paddingBottom: '0' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: activeTab === tab.key ? '800' : '500',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px', whiteSpace: 'nowrap',
                transition: 'color 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card" style={{ padding: '24px', marginTop: '0', borderTopLeftRadius: '0', borderTopRightRadius: '0', borderTop: 'none' }}>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <CapabilityAnalysis topicStats={topicStats} difficultyStats={difficultyStats} />

              {/* Existing AI diagnostic feedback */}
              {aiFeedback && !aiFeedback.coachPlan && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    💬 Nhận xét tổng quát
                  </div>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', lineHeight: 1.7 }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{aiFeedback.assessment}</p>
                    {aiFeedback.advice?.length > 0 && (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>{aiFeedback.advice[0]}</p>
                    )}
                    {aiFeedback.encouragement && (
                      <p style={{ fontSize: '12px', color: 'var(--primary)', margin: '8px 0 0', fontStyle: 'italic' }}>✨ {aiFeedback.encouragement}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt to go to AI Coach tab */}
              {!coachPlan && (
                <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #6c5ce710, #a29bfe18)', border: '1px solid #6c5ce730', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    🤖 <strong>AI Coach</strong> có thể tạo kế hoạch học 7 ngày cá nhân hóa cho bạn
                  </div>
                  <button
                    onClick={() => { setActiveTab('coach'); handleGenerateCoach(); }}
                    style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Tạo kế hoạch ✨
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYSIS TAB ── */}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  📚 Tỷ lệ đúng theo chủ đề
                </div>
                <TopicAnalysisChart topicStats={topicStats} />
              </div>

              <div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                  🎯 Phân tích theo độ khó
                </div>
                <DifficultyChart difficultyStats={difficultyStats} />
              </div>

              {Object.keys(topicStats).length === 0 && Object.keys(difficultyStats).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Chưa có dữ liệu phân tích. Dữ liệu chủ đề sẽ có ở những lần thi sau khi hệ thống cập nhật.
                </div>
              )}
            </div>
          )}

          {/* ── AI COACH TAB ── */}
          {activeTab === 'coach' && (
            <AiCoachCard
              coachPlan={coachPlan}
              onGenerateCoach={!coachPlan && !coachLoading ? handleGenerateCoach : null}
              isGenerating={coachLoading}
            />
          )}

          {/* ── WRONG QUESTIONS ANALYSIS TAB ── */}
          {activeTab === 'wrong_questions' && (() => {
            const wrongQs = questions.filter(q => {
              const qOptions = q.options || [];
              const correctAnswer = qOptions.find(o => o.is_correct || o.isCorrect);
              const selectedLabel = userAnswers[q.id];
              const isCorrect = correctAnswer && (correctAnswer.option_label === selectedLabel || correctAnswer.label === selectedLabel);
              return !isCorrect;
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                      ❌ TỔNG HỢP CÂU SAI & PHÂN TÍCH CHI TIẾT
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Bạn làm sai/bỏ trống {wrongQs.length} trên tổng số {questions.length} câu. Hãy luyện tập lại các dạng câu này!
                    </p>
                  </div>
                  {wrongQs.length > 0 && (
                    <button
                      className="btn-primary"
                      onClick={() => handleRetake(examId, 'wrong_similar', attemptId)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(108, 92, 231, 0.15)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <HiSparkles /> Tạo đề tương tự câu sai (AI) 🤖
                    </button>
                  )}
                </div>

                {wrongQs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: '48px' }}>🎉</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '900', margin: '12px 0 6px 0', color: 'var(--text-primary)' }}>Không có câu hỏi làm sai!</h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                      Tuyệt vời! Bạn đã đạt điểm số tối đa cho các câu hỏi trong đề thi này.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {wrongQs.map((q) => {
                      const qOptions = q.options || [];
                      const correctAnswer = qOptions.find(o => o.is_correct || o.isCorrect);
                      const selectedLabel = userAnswers[q.id];
                      const isCorrect = correctAnswer && (correctAnswer.option_label === selectedLabel || correctAnswer.label === selectedLabel);
                      const isBlank = !selectedLabel;

                      return (
                        <div
                          key={q.id}
                          style={{
                            background: 'var(--bg-card, #ffffff)',
                            border: `1.5px solid ${isBlank ? 'var(--border)' : 'rgba(214, 48, 49, 0.25)'}`,
                            borderRadius: '16px',
                            padding: '20px',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed var(--border)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '13.5px', color: 'var(--exams-purple)' }}>Câu {q.question_number}</strong>
                              {q.topic && (
                                <span style={{ fontSize: '10.5px', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  🏷️ {q.topic}
                                </span>
                              )}
                              <span style={{ fontSize: '10.5px', background: 'var(--bg-main)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                ⚡ Độ khó: {q.difficulty === 'EASY' || q.difficulty === 'Dễ' ? 'Dễ' : (q.difficulty === 'HARD' || q.difficulty === 'Khó' ? 'Khó' : 'Trung bình')}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: isBlank ? '#64748b' : 'var(--exams-red)',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {isBlank ? 'CHƯA TRẢ LỜI' : (
                                <>SAI <HiX /></>
                              )}
                            </span>
                          </div>

                          <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '16px', whiteSpace: 'pre-line', lineHeight: 1.6, fontWeight: '500' }}>
                            {q.question_text || q.content}
                          </p>

                          {q.question_image_url && (
                            <div style={{ margin: '12px 0', textAlign: 'center' }}>
                              <img src={q.question_image_url} alt="Minh họa" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {qOptions.map((opt) => {
                              const isCorrectOpt = opt.is_correct || opt.isCorrect || opt.label === correctAnswer?.option_label || opt.option_label === correctAnswer?.option_label;
                              const isSelectedOpt = selectedLabel === (opt.option_label || opt.label);

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
                                  key={opt.id || opt.label}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: `1px solid ${optionBorder}`,
                                    background: optionBg,
                                    fontSize: '12.5px'
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
                                    {opt.option_label || opt.label}
                                  </span>
                                  <span style={{ color: 'var(--text-primary)', flex: 1 }}>{opt.option_text || opt.text}</span>
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

                          {/* Phân tích giải thích và lỗi sai */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main, #f8fafc)', borderRadius: '10px', padding: '14px', borderLeft: '3px solid var(--exams-purple)', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--exams-purple)' }}>
                              <HiLightBulb /> Hướng dẫn giải chi tiết:
                            </strong>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                              {q.explanation || `Đáp án đúng là ${correctAnswer?.option_label || correctAnswer?.label || 'A'}.`}
                            </p>

                            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--exams-orange)', marginTop: '8px' }}>
                              💡 Phân tích lỗi sai thường gặp & Kiến thức trọng tâm:
                            </strong>
                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5, fontStyle: 'italic' }}>
                              Đối với chủ đề <strong>{q.topic || 'này'}</strong>, lỗi phổ biến nhất là không xác định đúng dữ kiện cốt lõi hoặc áp dụng sai công thức cơ bản. Để khắc phục triệt để, bạn cần nắm vững kiến thức lý thuyết tương ứng và lưu ý kỹ các điều kiện ràng buộc của bài toán.
                            </p>
                          </div>

                          {/* Luyện câu hỏi tương tự AI */}
                          <div>
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
                                padding: '16px'
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
                                              outline: 'none',
                                              whiteSpace: 'normal'
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
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── REVIEW TAB ── */}
          {activeTab === 'review' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                🔍 Xem lại từng câu hỏi
              </div>
              <ExamReviewList 
                questions={questions} 
                userAnswers={userAnswers} 
                subject={result?.mock_exams?.subject || result?.subject} 
              />
            </div>
          )}

          {/* ── REPLAY TAB ── */}
          {activeTab === 'replay' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                📼 Lịch sử hành động trong phòng thi
              </div>
              <ExamReplayTimeline
                events={events}
                startedAt={result?.startedAt}
                loading={eventsLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── SMART RETAKE OPTIONS ── */}
      <SmartRetakeOptions
        examId={examId}
        attemptId={attemptId}
        onRetake={handleRetake}
        wrongCount={(result?.wrong_count || 0) + (result?.blank_count || result?.blankCount || 0)}
        bookmarkedCount={bookmarkedKeys.length}
      />

      {/* ── BOTTOM CTA ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
        <button className="btn-outline" onClick={() => navigateTo('/mock-exams')} style={{ padding: '12px 24px', fontSize: '13.5px', fontWeight: 'bold' }}>
          Quay lại danh sách đề thi
        </button>
        <button
          className="btn-primary"
          onClick={() => navigateTo(`/mock-exams/${examId}/start`)}
          style={{ padding: '12px 24px', fontSize: '13.5px', fontWeight: 'bold', background: 'var(--exams-purple)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(108,92,231,0.2)' }}
        >
          Thi lại đề này ⚡
        </button>
      </div>
    </div>
  );
}
