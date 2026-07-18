import { useState, useEffect } from 'react';
import { api } from '../api';

export function useExamManagement() {
  const [activeTab, setActiveTab] = useState('exams');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stats State
  const [stats, setStats] = useState(null);

  // Exams State
  const [exams, setExams] = useState([]);
  const [examsPagination, setExamsPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [examsFilters, setExamsFilters] = useState({ search: '', subject: '', status: '' });

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [questionsPagination, setQuestionsPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [questionsFilters, setQuestionsFilters] = useState({ search: '', subject: '', difficulty: '', ownerOnly: false });

  // Import State
  const [importSessions, setImportSessions] = useState([]);
  const [activeImportSession, setActiveImportSession] = useState(null);
  const [importDecisions, setImportDecisions] = useState({}); // { [importQuestionId]: 'CREATE_NEW' | 'REUSE' }

  // Reports State
  const [reports, setReports] = useState([]);

  // Exam Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [examFormData, setExamFormData] = useState({
    title: '',
    subject: 'Toán học',
    duration: 90,
    grade: 12,
    description: '',
    creationMethod: 'MANUAL',
    questionIds: [],
    aiConfig: { topic: '', easyCount: 5, mediumCount: 5, hardCount: 5 }
  });

  // Edit / Preview State
  const [editingExamId, setEditingExamId] = useState(null);

  // --- FETCH DATA ACTIONS ---
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getTeacherExamStats();
      setStats(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getTeacherExams({ ...examsFilters, page });
      setExams(res.exams || []);
      setExamsPagination(res.pagination || { page, limit: 10, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getTeacherQuestions({ ...questionsFilters, page });
      setQuestions(res.questions || []);
      setQuestionsPagination(res.pagination || { page, limit: 10, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchImportSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getImportSessions();
      setImportSessions(res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchImportSessionDetail = async (id) => {
    try {
      setLoading(true);
      const res = await api.getImportSessionById(id);
      setActiveImportSession(res);
      // Initialize default decisions
      const initialDecisions = {};
      res.questions?.forEach(q => {
        initialDecisions[q.id] = q.status === 'WARNING' ? 'REUSE' : 'CREATE_NEW';
      });
      setImportDecisions(initialDecisions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getTeacherReports();
      setReports(res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleCreateExam = async () => {
    try {
      setLoading(true);
      await api.createTeacherExam(examFormData);
      setShowWizard(false);
      fetchExams(1);
      fetchStats();
      resetExamForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async (id) => {
    try {
      setLoading(true);
      await api.updateTeacherExam(id, examFormData);
      setEditingExamId(null);
      fetchExams(examsPagination.page);
      resetExamForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneExam = async (id) => {
    try {
      setLoading(true);
      await api.cloneTeacherExam(id);
      fetchExams(1);
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi nháp này?')) return;
    try {
      setLoading(true);
      await api.deleteTeacherExam(id);
      fetchExams(1);
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (file) => {
    try {
      setLoading(true);
      await api.uploadImportDocument(file);
      alert('Tài liệu đã được tải lên thành công. AI đang thực hiện phân tích và nhận diện câu hỏi.');
      fetchImportSessions();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async (sessionId) => {
    try {
      setLoading(true);
      const decisionsList = Object.entries(importDecisions).map(([importQuestionId, action]) => ({
        importQuestionId: Number(importQuestionId),
        action
      }));
      await api.confirmImportSession(sessionId, decisionsList);
      alert('Xác nhận nhập danh sách câu hỏi thành công vào Ngân hàng câu hỏi!');
      setActiveImportSession(null);
      setActiveTab('questions');
      fetchQuestions(1);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateImportQuestion = async (id, updatedQuestion) => {
    try {
      setLoading(true);
      await api.updateImportQuestion(id, updatedQuestion);
      // Update local state
      if (activeImportSession) {
        const updatedQuestions = activeImportSession.questions.map(q => 
          q.id === id ? { ...q, ...updatedQuestion } : q
        );
        setActiveImportSession({ ...activeImportSession, questions: updatedQuestions });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImportSession = async (sessionId) => {
    try {
      setLoading(true);
      await api.deleteImportSession(sessionId);
      // Clear active session and refresh list
      setActiveImportSession(null);
      await fetchImportSessions();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      setLoading(true);
      await api.resolveTeacherReport(reportId, status);
      fetchReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetExamForm = () => {
    setExamFormData({
      title: '',
      subject: 'Toán học',
      duration: 90,
      grade: 12,
      description: '',
      creationMethod: 'MANUAL',
      questionIds: [],
      aiConfig: { topic: '', easyCount: 5, mediumCount: 5, hardCount: 5 }
    });
    setWizardStep(1);
  };

  // Sync tab data triggers
  useEffect(() => {
    fetchStats();
    if (activeTab === 'exams') fetchExams(1);
    if (activeTab === 'questions') fetchQuestions(1);
    if (activeTab === 'imports') fetchImportSessions();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, examsFilters, questionsFilters]);

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    stats,
    exams,
    examsPagination,
    examsFilters,
    setExamsFilters,
    fetchExams,
    questions,
    questionsPagination,
    questionsFilters,
    setQuestionsFilters,
    fetchQuestions,
    importSessions,
    activeImportSession,
    setActiveImportSession,
    importDecisions,
    setImportDecisions,
    fetchImportSessionDetail,
    handleUploadDocument,
    handleConfirmImport,
    handleUpdateImportQuestion,
    handleDeleteImportSession,
    reports,
    handleResolveReport,
    // Wizard
    showWizard,
    setShowWizard,
    wizardStep,
    setWizardStep,
    examFormData,
    setExamFormData,
    resetExamForm,
    handleCreateExam,
    // Actions
    editingExamId,
    setEditingExamId,
    handleUpdateExam,
    handleCloneExam,
    handleDeleteExam,
    fetchStats
  };
}
