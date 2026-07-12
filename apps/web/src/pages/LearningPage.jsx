import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';
import { HiSparkles, HiPlay, HiClock, HiChevronLeft, HiChevronRight, HiAcademicCap, HiMenu, HiX, HiOutlineLightBulb, HiInformationCircle, HiCheckCircle } from 'react-icons/hi';
import useCourseProgress from '../hooks/useCourseProgress';
import { mapDbCourseToMockFormat } from '../utils/courseMapper';
import { api } from '../api';
import { discussionService } from '../services/discussionService';
import sunLogo from '../assets/sun_logo.png';
import '../styles/courses.css';

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

const EduPathLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '8px' }}>
    <img src={sunLogo} alt="EduPath AI" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
    <span style={{ fontSize: '18px', fontWeight: '800', color: '#6366f1', letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif" }}>
      EduPath <em style={{ color: '#4f46e5', fontStyle: 'normal' }}>AI</em>
    </span>
  </div>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

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
  const [activeTab, setActiveTab] = useState('transcript'); // transcript = Tóm tắt video, exercise = Flashcard ôn tập
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // Layout panels toggles and resizing
  const [sidebarOpen, setSidebarOpen] = useState(false); // Left list is collapsed/removed
  const [rightPanelTab, setRightPanelTab] = useState('curriculum'); // curriculum (Nội dung bài học), ai (Trợ lý học tập)
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

  // Ask AI explanation based on transcript segment click
  const handleAskAIFromTranscript = (sentence) => {
    setAiQuery({
      text: `Giải thích chi tiết câu giảng này trong bài giảng giúp em: "${sentence}"`,
      timestamp: Date.now()
    });
    setRightPanelOpen(true);
    setRightPanelTab('ai');
    toast('Đã gửi mốc câu hỏi sang Gia sư AI!', 'success');
  };

  // Generate AI Flashcards from current lesson content
  const handleGenerateLessonFlashcards = async () => {
    if (!currentLesson) return;
    setIsGeneratingFlashcards(true);
    toast('Trợ lý AI bắt đầu phân tích và tạo bộ thẻ ghi nhớ...', 'info');

    try {
      const contentPrompt = `Hãy tạo 5 flashcards kiến thức cốt lõi cho bài học sau:
Tiêu đề: "${currentLesson.title}"
Nội dung bài học: "${currentLesson.content || 'Khái niệm và cách giải quyết bài toán nhanh trong thi THPT Quốc Gia.'}"`;
      
      const result = await api.generateFlashcards(contentPrompt);

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Hệ thống AI không trả về bộ thẻ hợp lệ.');
      }

      // Format flashcards list
      const formatted = result.map((c, index) => ({
        ...c,
        image: null,
        partOfSpeech: index % 2 === 0 ? "Khái niệm" : "Định nghĩa",
        hashtag: `# ${currentLesson.title.substring(0, 10)}`
      }));

      // Prepare new deck
      const deckTitle = `Flashcard: ${currentLesson.title}`;
      const newDeck = {
        id: Date.now().toString(),
        title: deckTitle,
        cards: formatted,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      let existingDecks = [];
      try {
        const stored = localStorage.getItem('edupath_saved_flashcard_decks');
        if (stored) {
          existingDecks = JSON.parse(stored);
        }
      } catch (err) {
        console.error(err);
      }

      const updatedDecks = [newDeck, ...existingDecks.filter(d => d.title !== deckTitle)];
      localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(updatedDecks));

      toast(`Đã tạo bộ thẻ "${deckTitle}" với ${formatted.length} thẻ học!`, 'success');
      
      setTimeout(() => {
        toast('Hệ thống đang chuyển bạn sang trang Học Flashcards...', 'info');
        if (onBackToCourse) {
          onBackToCourse('/flashcards');
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      toast(err.message || 'Lỗi khi tạo flashcard từ AI!', 'error');
    } finally {
      setIsGeneratingFlashcards(false);
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
            margin: '16px'
          }}
          className="animate-in"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔐</span>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '900', display: 'block', textAlign: 'left' }}>
                CHẾ ĐỘ XEM THỬ (ADMIN PREVIEW)
              </span>
              <span style={{ fontSize: '11.5px', opacity: 0.85, display: 'block', textAlign: 'left' }}>
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
      <div className="learning-header-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: '64px',
        boxSizing: 'border-box'
      }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <EduPathLogo />
          <h2 className="current-lesson-title" style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {course.title}
          </h2>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            type="button" 
            onClick={() => toast('Cảm ơn bạn đã đánh giá khóa học!', 'success')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: '700', 
              color: '#475569',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <span style={{ fontSize: '15px' }}>☆</span> <span style={{ textDecoration: 'underline' }}>Leave a rating</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13px', color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px solid #0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFE259'
            }}>
              🏆
            </div>
            <span>{Math.round(progressPercent)}%</span>
          </div>

          <button 
            type="button" 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast('Đã sao chép liên kết khóa học vào bộ nhớ tạm!', 'success');
            }}
            style={{
              background: '#3f51b5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(63, 81, 181, 0.2)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
            Share
          </button>
        </div>
      </div>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="learning-layout-grid">
        
        {/* CENTER COLUMN: VIDEO & INTERACTIVE TABS */}
        <div className="center-workspace-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', gap: '24px' }}>
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
                videoUrl={currentLesson.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
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

          {/* Bottom Tabs Panel for Engagement: Tóm tắt video & Flashcard ôn tập */}
          <div className="interactive-tabs-container" style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <div className="interactive-tabs-header" style={{
              display: 'flex',
              background: '#f8fafc',
              borderBottom: '1.5px solid #e2e8f0',
              padding: '12px 16px',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'transcript' ? '#3f51b5' : '#f1f5f9',
                  color: activeTab === 'transcript' ? '#ffffff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                📄 Tóm tắt video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('exercise')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: activeTab === 'exercise' ? '#3f51b5' : '#f1f5f9',
                  color: activeTab === 'exercise' ? '#ffffff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                🗂️ Flashcard ôn tập
              </button>
            </div>

            <div className="interactive-tabs-content" style={{ padding: '24px' }}>
              {activeTab === 'transcript' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Split Layout: Transcript Left, Notes & Download Right */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="transcript-split-layout">
                    <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }} className="transcript-left-pane">
                      <h4 style={{ fontSize: '14.5px', fontWeight: '800', marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📄</span> Phụ đề & Nội dung bài học đồng bộ
                      </h4>
                      <TranscriptTab 
                        transcript={currentLesson.transcript || mockTranscript} 
                        videoTime={videoTime} 
                        onSeek={handleSeek}
                        onAskAI={handleAskAIFromTranscript}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="transcript-right-pane">
                      {/* Summary download card */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#eef2ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#3f51b5',
                          fontSize: '20px'
                        }}>
                          <FileIcon />
                        </div>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Tải bản Tóm tắt AI</h4>
                        <button
                          onClick={() => {
                            toast('Đang khởi tạo tóm tắt thông minh từ AI...', 'info');
                            setTimeout(() => {
                              const docText = `Tóm tắt bài học: ${currentLesson.title}\n\n1. Kiến thức cốt lõi:\n- Phân tích chi tiết các dạng lý thuyết trọng tâm.\n- Áp dụng sơ đồ tư duy hệ thống hóa kiến thức.\n\n2. Ghi chú & Công thức:\n- Ghi nhớ công thức đặc biệt được giáo viên nhấn mạnh trong bài giảng.`;
                              const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = `Tom_tat_${currentLesson.title.replace(/\s+/g, '_')}.txt`;
                              link.click();
                              toast('Tải tóm tắt video thành công! 📄', 'success');
                            }, 1000);
                          }}
                          style={{
                            background: '#3f51b5',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 20px',
                            fontWeight: '700',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(63, 81, 181, 0.2)'
                          }}
                        >
                          Tải tóm tắt
                        </button>
                      </div>
                      
                      {/* Real timestamped notes form and cards */}
                      <NotePanel 
                        lesson={currentLesson} 
                        videoTime={videoTime} 
                        onSeek={handleSeek} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'exercise' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* AI Flashcard Generator Card */}
                  <div className="ai-flashcard-box animate-in">
                    <div className="icon-container">
                      <HiSparkles />
                    </div>
                    <h4>Trợ lý AI tạo Bộ Thẻ Ôn Tập Cấp Tốc</h4>
                    <p>
                      Hệ thống AI sẽ phân tích nội dung bài học <strong>"{currentLesson.title}"</strong> để thiết kế một bộ gồm 5 thẻ ghi nhớ flashcards ôn luyện các khái niệm trọng tâm.
                    </p>
                    <button
                      type="button"
                      className="btn-generate-ai-flashcards"
                      onClick={handleGenerateLessonFlashcards}
                      disabled={isGeneratingFlashcards}
                    >
                      {isGeneratingFlashcards ? '⌛ Đang tạo bộ thẻ...' : '⚡ Sinh Flashcards bằng AI'}
                    </button>
                  </div>

                  {/* Exercises tab */}
                  <ExerciseTab 
                    exercises={mockQuizzes} 
                    onCompleteExercise={(score) => {
                      toast(`Hoàn thành bài luyện tập với tỷ lệ ${score}%!`, 'success');
                    }} 
                  />
                  {/* Materials/documents tab */}
                  <MaterialsTab materials={materials} />
                </div>
              )}
            </div>
          </div>

          {/* Comment/Discussion section (directly below tabs) */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            textAlign: 'left',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span style={{ fontSize: '18px' }}>💬</span>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Bình luận</h3>
            </div>
            <DiscussionTab
              discussions={discussions}
              currentUser={currentUser}
              onAddComment={handleAddComment}
              videoTime={videoTime}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN PANEL */}
        {rightPanelOpen ? (
          <div 
            className="right-sidebar-panel" 
            style={{ 
              width: `${rightPanelWidth}px`, 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              borderLeft: '1.5px solid #e2e8f0',
              background: '#ffffff',
              position: 'relative'
            }}
          >
            {/* Panel resizer handle bar */}
            <div 
              onMouseDown={handleMouseDown} 
              className="panel-resizer-bar" 
            />

            <div className="right-panel-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Tab headers at the top: Nội dung bài học & Trợ lý học tập */}
              <div className="panel-toggle-tabs" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('curriculum')}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: rightPanelTab === 'curriculum' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                      padding: '8px 0',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: rightPanelTab === 'curriculum' ? '#2563eb' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Nội dung bài học
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('ai')}
                    style={{
                      border: '1.5px solid transparent',
                      background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #f093fb 0%, #f5576c 100%) border-box',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: rightPanelTab === 'ai' ? '#4f46e5' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✨</span>
                    <span>Trợ lý học tập</span>
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Đổi giao diện"
                    onClick={() => toast('Đã thay đổi chế độ xem!', 'info')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setRightPanelOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '18px' }}
                    title="Đóng bảng thông tin"
                  >
                    <HiX />
                  </button>
                </div>
              </div>

              {/* Tab contents (curriculum list or AI Tutor panel) */}
              <div className="panel-tab-content" style={{ flex: 1, overflowY: 'auto' }}>
                {rightPanelTab === 'curriculum' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <LessonSidebar
                        curriculum={course.curriculum}
                        currentLessonId={currentLesson.id}
                        onSelectLesson={(lesson) => onSelectLesson(courseId, lesson.id)}
                        completedLessons={completedLessons}
                        isOwned={isOwned}
                        courseTitle={course.title}
                      />
                    </div>
                    {/* Locked Certificate footer */}
                    <div style={{
                      padding: '16px 20px',
                      borderTop: '1px solid #e2e8f0',
                      background: '#faf8f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                        <span>🎓</span>
                        <span>Chứng chỉ hoàn thành khóa học</span>
                      </div>
                      <span style={{ fontSize: '16px' }}>🔒</span>
                    </div>
                  </div>
                ) : (
                  <AITutorPanel lesson={currentLesson} initialQuery={aiQuery} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={() => setRightPanelOpen(true)} 
            className="btn-toggle-right-panel-floating"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 20,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#3f51b5'
            }}
            title="Mở bảng nội dung & AI"
          >
            <HiAcademicCap />
          </button>
        )}
      </div>

      {/* FLOATING COPYRIGHT WATERMARK BADGE */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        border: '1.5px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '40px',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#ffffff',
        fontFamily: "'Outfit', sans-serif",
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#0f172a', fontSize: '11px', fontWeight: '900' }}>
              {currentUser?.fullName?.substring(0, 2).toUpperCase() || 'US'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', textAlign: 'left', lineHeight: '1.2' }}>
          <span style={{ fontWeight: '700', opacity: 0.9 }}>Username: {currentUser?.fullName || 'tranvanthuan'}</span>
          <span style={{ opacity: 0.6 }}>{currentUser?.email || 'tranvanthuan2005tt@gmail.com'}</span>
        </div>
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
