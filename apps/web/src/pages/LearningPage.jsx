import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';
import { HiSparkles, HiPlay, HiClock, HiChevronLeft, HiChevronRight, HiAcademicCap, HiMenu, HiX, HiOutlineLightBulb, HiInformationCircle, HiCheckCircle } from 'react-icons/hi';
import useCourseProgress from '../hooks/useCourseProgress';
import { mapDbCourseToMockFormat } from '../utils/courseMapper';
import { api } from '../api';
import { discussionService } from '../services/discussionService';

// Subcomponents
import VideoPlayer from '../components/courses/learning/VideoPlayer';
import LessonSidebar from '../components/courses/learning/LessonSidebar';
import MaterialsTab from '../components/courses/learning/MaterialsTab';
import DiscussionTab from '../components/courses/learning/DiscussionTab';
import TeacherQATab from '../components/courses/learning/TeacherQATab';
import TranscriptTab from '../components/courses/learning/TranscriptTab';
import ExerciseTab from '../components/courses/learning/ExerciseTab';
import AITutorPanel from '../components/courses/learning/AITutorPanel';
import NotePanel from '../components/courses/learning/NotePanel';
import KeyboardShortcutsOverlay from '../components/courses/learning/KeyboardShortcutsOverlay';
import CompletionModal from '../components/courses/learning/CompletionModal';

export default function LearningPage({ 
  courseId, 
  lessonId, 
  currentUser, 
  onSelectLesson, 
  onBackToCourse 
}) {
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [activeTab, setActiveTab] = useState('materials'); // materials, discussion, teacher, transcript, exercise
  const [loading, setLoading] = useState(true);

  // Layout panels toggles and resizing
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState('ai'); // ai, notes
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const isResizingRef = useRef(false);

  // Video time tracker (synchronized with Player to drive seekable transcripts & discussions)
  const [videoTime, setVideoTime] = useState(0);
  const videoRef = useRef(null);

  // Modal displays
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  // 1. Fetch Course details from API
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await api.getCourseById(courseId);
        if (data) {
          const found = mapDbCourseToMockFormat(data);
          setCourse(found);
        } else {
          setCourse(null);
        }
      } catch (err) {
        console.error('Failed to fetch course in LearningPage:', err);
        setCourse(null);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Flattened list of lessons for linear navigation
  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.curriculum.flatMap(chapter => chapter.lessons) || [];
  }, [course]);

  // Determine active current lesson
  useEffect(() => {
    if (allLessons.length === 0) return;
    const activeId = lessonId ? lessonId.toString() : allLessons[0].id.toString();
    const active = allLessons.find(l => l.id.toString() === activeId) || allLessons[0];
    setCurrentLesson(active);
  }, [lessonId, allLessons]);

  const totalLessonsCount = allLessons.length;

  // 2. Load Progress Hook
  const { completedLessons, toggleCompleted, progressPercent } = useCourseProgress(
    courseId,
    currentUser,
    totalLessonsCount
  );

  // Check enrollment — Admin always has full access to all courses
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'ADMIN';
  const isOwned = useMemo(() => {
    if (!courseId) return false;
    if (isAdmin) return true; // Admin can access all courses regardless of enrollment
    return !!(currentUser?.unlockedCourses?.includes(Number(courseId)) || currentUser?.unlockedCourses?.includes(courseId.toString()));
  }, [currentUser, courseId, isAdmin]);

  const isDemoMode = window.location.search.includes('demo=true');
  const isLocked = !isAdmin && !isDemoMode && !isOwned && currentLesson && !currentLesson.isPreview;

  // Load materials & discussions for current lesson
  useEffect(() => {
    if (!currentLesson) return;
    setLoading(true);

    const backendDocs = currentLesson.documents || [];
    if (backendDocs.length > 0) {
      setMaterials(backendDocs.map(doc => ({
        id: String(doc.id),
        title: doc.title,
        file_type: doc.fileType || 'PDF',
        file_url: doc.fileUrl
      })));
    } else {
      const fallbackMaterials = [
        { id: `${currentLesson.id}_m1`, title: `Sổ tay lý thuyết trọng tâm - ${currentLesson.title}`, file_type: 'PDF' },
        { id: `${currentLesson.id}_m2`, title: `Bài tập trắc nghiệm tự luyện kèm giải chi tiết - ${currentLesson.title}`, file_type: 'PDF' }
      ];
      setMaterials(fallbackMaterials);
    }

    const loadDiscussions = async () => {
      try {
        const discData = await discussionService.getDiscussionsByLessonId(Number(currentLesson.id));
        setDiscussions(discData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDiscussions();
  }, [currentLesson]);

  // Add Comment/Discussion
  const handleAddComment = async (text) => {
    if (!currentLesson || !currentUser) return;
    try {
      const newComment = await discussionService.createDiscussion(
        Number(currentLesson.id),
        currentUser.id,
        currentUser.fullName || currentUser.name || 'Học sinh',
        currentUser.avatar || 'U',
        text
      );
      setDiscussions(prev => [...prev, newComment]);
      toast('Đăng câu hỏi thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Lỗi đăng câu hỏi.', 'error');
    }
  };

  // Navigations (Linear next / prev)
  const currentIdx = allLessons.findIndex(l => currentLesson && l.id.toString() === currentLesson.id.toString());
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allLessons.length - 1;
  const nextLessonName = hasNext ? allLessons[currentIdx + 1].title : null;

  const handlePrevLesson = useCallback(() => {
    if (hasPrev) {
      onSelectLesson(courseId, allLessons[currentIdx - 1].id);
    }
  }, [hasPrev, currentIdx, allLessons, courseId, onSelectLesson]);

  const handleNextLesson = useCallback(() => {
    if (hasNext) {
      onSelectLesson(courseId, allLessons[currentIdx + 1].id);
    }
  }, [hasNext, currentIdx, allLessons, courseId, onSelectLesson]);

  const handleVideoEnded = () => {
    // Automatically mark lesson as completed
    const numericLessonId = Number(currentLesson.id);
    if (!completedLessons.includes(numericLessonId)) {
      toggleCompleted(numericLessonId);
    }

    if (hasNext) {
      // Handled by Custom VideoPlayer UpNext countdown triggers
    } else {
      // Last lesson concludes: Trigger celebration modal
      setCompletionOpen(true);
    }
  };

  // Draggable right sidebar handler
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Listen for materials download events
  useEffect(() => {
    const handleDownload = () => {
      toast('Bắt đầu tải bộ tài liệu ôn tập của bài học!', 'success');
    };
    window.addEventListener('edupath-download-materials', handleDownload);
    return () => window.removeEventListener('edupath-download-materials', handleDownload);
  }, []);

  // Sync seek to video player
  const handleSeek = (secs) => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.currentTime = secs;
      videoEl.play().catch(() => {});
    }
  };


  // Mock transcripts and quizzes for complete demonstration
  const mockTranscript = [
    { timeSeconds: 0, text: "Chào mừng các em học sinh đến với bài giảng luyện thi ngày hôm nay.", text_en: "Welcome students to today's prep lecture." },
    { timeSeconds: 12, text: "Chúng ta sẽ phân tích sâu các dạng toán trắc nghiệm trọng tâm thi THPT Quốc Gia.", text_en: "We will deeply analyze core multiple-choice math formats in the high school graduation exam." },
    { timeSeconds: 28, text: "Hãy lưu ý kỹ phương pháp giải nhanh và cách loại trừ đáp án nhiễu cực nhanh.", text_en: "Please carefully note the fast-solving method and how to eliminate distractors very quickly." },
    { timeSeconds: 45, text: "Ghi chép công thức đặc biệt này vào sổ tay để tự tin làm bài nhé.", text_en: "Write this special formula in your notebook to solve papers confidently." }
  ];

  const mockQuizzes = [
    {
      question: `Bài tập củng cố: Khẳng định nào sau đây là ĐÚNG về chuyên đề "${currentLesson?.title}"?`,
      options: ["Nên học thuộc lòng công thức giải.", "Cần hiểu bản chất kết hợp mẹo giải nhanh.", "Bấm máy tính Casio luôn giải được mọi bài.", "Đề thi không bao giờ ra phần này."],
      correctOptionIndex: 1,
      explanation: "Chuyên đề ôn thi tốt nghiệp THPT yêu cầu học sinh vừa nắm vững bản chất kiến thức để tránh bẫy lý thuyết, vừa linh hoạt áp dụng phương pháp bấm Casio hoặc loại trừ để tối ưu thời gian."
    }
  ];

  if (!course || !currentLesson) {
    return (
      <div className="cp-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--stone-text-secondary)' }}>
          <div style={{ fontSize: '32px', animation: 'spin 2s linear infinite' }}>⏳</div>
          <div style={{ fontSize: '14px', marginTop: '12px', fontWeight: 'bold' }}>Đang tải phòng học trực tuyến...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-workspace-container">
      {/* CHẾ ĐỘ XEM THỬ (ADMIN PREVIEW) */}
      {isAdmin && (
        <div
          style={{
            background: 'linear-gradient(135deg, #6c5ce7 0%, #4c3d99 100%)',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '4px 4px 0px #000000',
            border: '2px solid #000000',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}
          className="animate-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '900', display: 'block' }}>
                CHẾ ĐỘ XEM THỬ (ADMIN PREVIEW)
              </span>
              <span style={{ fontSize: '11.5px', opacity: 0.85 }}>
                Bạn đang xem nội dung khóa học với tư cách Quản trị viên. Mọi hoạt động xem bài sẽ không được ghi vào hệ thống.
              </span>
            </div>
          </div>
          <button
            onClick={() => onBackToCourse('/admin')}
            style={{
              backgroundColor: '#ffffff',
              color: '#4c3d99',
              border: '2px solid #000000',
              padding: '7px 16px',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px #000000'
            }}
          >
            ← Về Admin Dashboard
          </button>
        </div>
      )}

      {/* HEADER BANNER FOR DEMO */}
      {isDemoMode && !isAdmin && (
        <div className="demo-header-strip animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="demo-icon">✨</span>
            <span>Bạn đang trải nghiệm học thử (DEMO). Đăng ký ngay để sở hữu toàn bộ bộ đề thi VIP và Adaptive AI!</span>
          </div>
          <button 
            type="button" 
            onClick={() => onBackToCourse(`/courses/${courseId}`)}
            className="btn-demo-enroll"
          >
            Đăng ký học ngay
          </button>
        </div>
      )}

      {/* TOP CONTROL NAVIGATION ROW */}
      <div className="learning-header-bar">
        <div className="header-left">
          <button 
            type="button" 
            onClick={() => onBackToCourse(isDemoMode ? '/courses' : `/courses/${courseId}`)}
            className="btn-back-to-details"
          >
            Quay lại khóa học
          </button>
          <span className="header-divider">|</span>
          <div className="course-title-group">
            <span className="course-title-sub">Khóa: {course.title}</span>
            <h2 className="current-lesson-title">{currentLesson.title}</h2>
          </div>
        </div>

        <div className="header-right">
          <button 
            type="button" 
            onClick={() => setShortcutsOpen(true)}
            className="btn-shortcuts-info"
            title="Xem phím tắt video"
          >
            <HiInformationCircle />
            <span>Phím tắt</span>
          </button>
        </div>
      </div>

      {/* THREE COLUMN GRID LAYOUT */}
      <div className="learning-layout-grid">
        {/* LEFT COLUMN: COLLAPSIBLE SIDEBAR LESSON LIST */}
        {sidebarOpen && (
          <div className="left-sidebar-wrapper animate-in">
            <button 
              type="button" 
              onClick={() => setSidebarOpen(false)} 
              className="btn-toggle-sidebar close"
              title="Ẩn danh sách bài học"
            >
              <HiX />
            </button>
            <LessonSidebar
              curriculum={course.curriculum}
              currentLessonId={currentLesson.id}
              onSelectLesson={(lesson) => onSelectLesson(courseId, lesson.id)}
              completedLessons={completedLessons}
              isOwned={isOwned}
              courseTitle={course.title}
            />
          </div>
        )}

        {!sidebarOpen && (
          <button 
            type="button" 
            onClick={() => setSidebarOpen(true)} 
            className="btn-toggle-sidebar-floating"
            title="Hiện danh sách bài học"
          >
            <HiMenu />
          </button>
        )}

        {/* CENTER COLUMN: VIDEO & INTERACTIVE TABS */}
        <div className="center-workspace-wrapper">
          {/* Main Video Screen Container */}
          <div className="main-video-screen">
            {isLocked ? (
              <div className="video-locked-overlay animate-in">
                <HiAcademicCap className="locked-icon" />
                <h3>Bài học VIP đã bị khóa</h3>
                <p>Bài học này nằm trong giáo trình trả phí. Vui lòng hoàn tất học phí để mở khóa bài học này nhé.</p>
                <button 
                  type="button" 
                  onClick={() => onBackToCourse(`/courses/${courseId}`)}
                  className="btn-locked-purchase"
                >
                  Đăng ký khóa học ngay
                </button>
              </div>
            ) : (
              <VideoPlayer
                ref={videoRef}
                videoUrl={currentLesson.videoUrl || "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}
                title={currentLesson.title}
                lessonId={currentLesson.id}
                nextLessonName={nextLessonName}
                onEnded={handleVideoEnded}
                onTimeUpdate={(t) => setVideoTime(t)}
                chapters={[
                  { title: "Phần 1: Giới thiệu chuyên đề", timeSeconds: 0 },
                  { title: "Phần 2: Phương pháp giải nhanh", timeSeconds: 28 }
                ]}
              />
            )}

            {/* Video navigation controller footer */}
            <div className="video-nav-row">
              <button 
                type="button" 
                onClick={handlePrevLesson} 
                disabled={!hasPrev} 
                className="btn-nav-arrow"
              >
                <HiChevronLeft /> Bài trước
              </button>
              
              <button 
                type="button" 
                onClick={() => toggleCompleted(Number(currentLesson.id))}
                className={`btn-toggle-complete ${completedLessons.includes(Number(currentLesson.id)) ? 'completed' : ''}`}
              >
                <HiCheckCircle />
                {completedLessons.includes(Number(currentLesson.id)) ? 'Đã học xong' : 'Đánh dấu hoàn thành'}
              </button>

              <button 
                type="button" 
                onClick={handleNextLesson} 
                disabled={!hasNext} 
                className="btn-nav-arrow"
              >
                Bài sau <HiChevronRight />
              </button>
            </div>
          </div>

          {/* Bottom Tabs Panel for Engagement & Materials */}
          <div className="interactive-tabs-container">
            <div className="interactive-tabs-header">
              {[
                { id: 'materials', label: 'Tài liệu bài học' },
                { id: 'transcript', label: 'Bản dịch & Subtitle' },
                { id: 'exercise', label: 'Luyện tập trắc nghiệm' },
                { id: 'discussion', label: 'Thảo luận lớp học' },
                { id: 'teacher', label: 'Hỏi đáp giáo viên' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-toggle-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="interactive-tabs-content">
              {activeTab === 'materials' && (
                <MaterialsTab materials={materials} />
              )}
              {activeTab === 'transcript' && (
                <TranscriptTab 
                  transcript={mockTranscript} 
                  videoTime={videoTime} 
                  onSeek={handleSeek} 
                />
              )}
              {activeTab === 'exercise' && (
                <ExerciseTab 
                  exercises={mockQuizzes} 
                  onCompleteExercise={(score) => {
                    toast(`Hoàn thành bài luyện tập với tỷ lệ ${score}%!`, 'success');
                  }} 
                />
              )}
              {activeTab === 'discussion' && (
                <DiscussionTab
                  discussions={discussions}
                  currentUser={currentUser}
                  onAddComment={handleAddComment}
                  videoTime={videoTime}
                  onSeek={handleSeek}
                />
              )}
              {activeTab === 'teacher' && (
                <TeacherQATab 
                  currentUser={currentUser} 
                  lesson={currentLesson} 
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DOUBLE PANEL SIDEBAR (AI TUTOR & NOTES) */}
        {rightPanelOpen && (
          <div 
            className="right-sidebar-panel" 
            style={{ width: `${rightPanelWidth}px` }}
          >
            {/* Panel resizer handle bar */}
            <div 
              onMouseDown={handleMouseDown} 
              className="panel-resizer-bar" 
            />

            <div className="right-panel-inner">
              <div className="panel-toggle-tabs">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('ai')}
                  className={`panel-tab-btn ${rightPanelTab === 'ai' ? 'active' : ''}`}
                >
                  <HiSparkles />
                  <span>Gia sư AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('notes')}
                  className={`panel-tab-btn ${rightPanelTab === 'notes' ? 'active' : ''}`}
                >
                  <HiOutlineLightBulb />
                  <span>Ghi chú cá nhân</span>
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setRightPanelOpen(false)}
                  className="btn-close-panel"
                >
                  <HiX />
                </button>
              </div>

              <div className="panel-tab-content">
                {rightPanelTab === 'ai' ? (
                  <AITutorPanel lesson={currentLesson} />
                ) : (
                  <NotePanel 
                    lesson={currentLesson} 
                    videoTime={videoTime} 
                    onSeek={handleSeek} 
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {!rightPanelOpen && (
          <button 
            type="button" 
            onClick={() => setRightPanelOpen(true)} 
            className="btn-toggle-right-panel-floating"
            title="Mở bảng Gia sư AI & Ghi chú"
          >
            <HiSparkles />
          </button>
        )}
      </div>

      {/* OVERLAY MODALS */}
      <KeyboardShortcutsOverlay 
        isOpen={shortcutsOpen} 
        onClose={() => setShortcutsOpen(false)} 
      />

      <CompletionModal
        isOpen={completionOpen}
        onClose={() => setCompletionOpen(false)}
        courseTitle={course.title}
        stats={{
          totalLessons: totalLessonsCount,
          totalQuizzes: allLessons.length > 2 ? 3 : 1,
          averageScore: 90
        }}
        onRequestCertificate={() => {
          return new Promise(resolve => setTimeout(resolve, 1500));
        }}
        onSubmitCourseReview={(review) => {
          return new Promise(resolve => setTimeout(resolve, 1200));
        }}
      />
    </div>
  );
}
