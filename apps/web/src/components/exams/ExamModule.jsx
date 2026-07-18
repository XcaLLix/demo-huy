import React from 'react';
import { useExamManagement } from '../../hooks/useExamManagement';
import { HeaderStats } from './HeaderStats';
import { QuickActions } from './QuickActions';
import { ExamsTab } from './ExamsTab';
import { QuestionsTab } from './QuestionsTab';
import { ImportsTab } from './ImportsTab';
import { ReportsTab } from './ReportsTab';
import { StatsTab } from './StatsTab';
import { CreateExamWizard } from './CreateExamWizard';
import '../../styles/teacherExams.css';

export default function ExamModule({ currentUser }) {
  const {
    activeTab,
    setActiveTab,
    loading,
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
    editingExamId,
    setEditingExamId,
    handleCloneExam,
    handleDeleteExam,
    fetchStats
  } = useExamManagement();

  return (
    <div className="exams-module-wrapper">
      {/* Upper Metrics Header */}
      <HeaderStats stats={stats} />

      {/* Quick Actions Row */}
      <QuickActions 
        onTabChange={(tab) => setActiveTab(tab)} 
        onCreateExam={() => {
          setEditingExamId(null);
          setShowWizard(true);
        }} 
      />

      {/* Main Tabs Navigation */}
      <div className="saas-tabs-container">
        <button 
          className={`saas-tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          Đề thi & Bài kiểm tra
        </button>
        <button 
          className={`saas-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Ngân hàng câu hỏi
        </button>
        <button 
          className={`saas-tab-btn ${activeTab === 'imports' ? 'active' : ''}`}
          onClick={() => setActiveTab('imports')}
        >
          Nhập đề (AI Import)
        </button>
        <button 
          className={`saas-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Báo cáo lỗi câu hỏi
        </button>
        <button 
          className={`saas-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Thống kê phân tích
        </button>
      </div>

      {/* Active Tab Content Area */}
      <div style={{ minHeight: '380px' }}>
        {loading && (
          <div style={{ padding: '20px 0', color: '#64748b', fontSize: '13.5px', fontWeight: 600 }}>
            Đang tải dữ liệu từ hệ thống...
          </div>
        )}

        {!loading && activeTab === 'exams' && (
          <ExamsTab 
            exams={exams}
            pagination={examsPagination}
            filters={examsFilters}
            setFilters={setExamsFilters}
            onPageChange={fetchExams}
            onCreateClick={() => {
              setEditingExamId(null);
              setShowWizard(true);
            }}
            onEditClick={(id) => {
              setEditingExamId(id);
              setShowWizard(true);
            }}
            onCloneClick={handleCloneExam}
            onDeleteClick={handleDeleteExam}
          />
        )}

        {!loading && activeTab === 'questions' && (
          <QuestionsTab 
            questions={questions}
            pagination={questionsPagination}
            filters={questionsFilters}
            setFilters={setQuestionsFilters}
            onPageChange={fetchQuestions}
            currentUser={currentUser}
          />
        )}

        {!loading && activeTab === 'imports' && (
          <ImportsTab 
            sessions={importSessions}
            activeSession={activeImportSession}
            decisions={importDecisions}
            setDecisions={setImportDecisions}
            onUpload={handleUploadDocument}
            onConfirm={handleConfirmImport}
            onUpdateQuestion={handleUpdateImportQuestion}
            onDeleteSession={handleDeleteImportSession}
            onViewDetail={fetchImportSessionDetail}
            onCloseDetail={() => setActiveImportSession(null)}
          />
        )}

        {!loading && activeTab === 'reports' && (
          <ReportsTab 
            reports={reports}
            onResolve={handleResolveReport}
          />
        )}

        {!loading && activeTab === 'stats' && (
          <StatsTab stats={stats} />
        )}
      </div>

      {/* Create / Edit Wizard Modal */}
      {showWizard && (
        <CreateExamWizard 
          editingExamId={editingExamId}
          onClose={() => setShowWizard(false)}
          onSubmit={() => {
            setShowWizard(false);
            fetchExams(1);
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
