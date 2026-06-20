import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';
import VideoPlayer from '../components/courses/VideoPlayer';
import ProgressSidebar from '../components/courses/ProgressSidebar';
import CourseMaterials from '../components/courses/CourseMaterials';
import CourseDiscussion from '../components/courses/CourseDiscussion';
import TeacherChat from '../components/courses/TeacherChat';
import AiTutorChat from '../components/courses/AiTutorChat';
import useCourseProgress from '../hooks/useCourseProgress';
import { mapDbCourseToMockFormat } from '../utils/courseMapper';
import { api } from '../api';
import { discussionService } from '../services/discussionService';
import { aiService } from '../services/aiService';

export default function LearningPage({ courseId, lessonId, currentUser, onSelectLesson, onBackToCourse }) {
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [activeTab, setActiveTab] = useState('materials'); // materials, discussion, teacher, ai
  const [loading, setLoading] = useState(true);

  // Notebook and AI chat state
  const [notebookTab, setNotebookTab] = useState('notes'); // notes, ai
  const [noteText, setNoteText] = useState('');
  const [saveStatus, setSaveStatus] = useState('Đã lưu'); // Đã lưu, Đang lưu
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Resizer state
  const [notebookWidth, setNotebookWidth] = useState(380);
  const isResizingRef = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX - 40;
      if (newWidth >= 280 && newWidth <= 600) {
        setNotebookWidth(newWidth);
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

  // Load notes per lesson
  useEffect(() => {
    if (!currentLesson || !courseId) return;
    const key = `course_note_${courseId}_lesson_${currentLesson.id}`;
    const saved = localStorage.getItem(key) || '';
    setNoteText(saved);
    setSaveStatus('Đã lưu');
  }, [courseId, currentLesson]);

  // Handle auto-save notes
  const handleNoteChange = (e) => {
    const text = e.target.value;
    setNoteText(text);
    setSaveStatus('Đang lưu...');
    
    if (currentLesson && courseId) {
      const key = `course_note_${courseId}_lesson_${currentLesson.id}`;
      localStorage.setItem(key, text);
      setTimeout(() => {
        setSaveStatus('Đã tự động lưu');
      }, 500);
    }
  };

  // Initialize AI messages for this lesson
  useEffect(() => {
    if (!currentLesson) return;
    setAiMessages([
      {
        role: 'assistant',
        content: `Chào em! Thầy là Gia sư AI đồng hành cùng em trong bài học "${currentLesson.title}". Hãy hỏi thầy bất cứ thắc mắc gì về lý thuyết hay bài tập của buổi học này nhé! 🤖`
      }
    ]);
  }, [currentLesson]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiTyping]);

  // 1. Fetch Course from API
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

  // Determine current lesson
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

    // Mock materials specifically tailored for the lesson
    const fallbackMaterials = [
      { id: `${currentLesson.id}_m1`, title: `Sổ tay lý thuyết trọng tâm - ${currentLesson.title}`, file_type: 'PDF' },
      { id: `${currentLesson.id}_m2`, title: `Bài tập trắc nghiệm tự luyện kèm giải chi tiết - ${currentLesson.title}`, file_type: 'PDF' },
      { id: `${currentLesson.id}_m3`, title: `Slide bài giảng sơ đồ tư duy - ${currentLesson.title}`, file_type: 'Slide' }
    ];
    setMaterials(fallbackMaterials);

    // Fetch discussions properly
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

  const handleAddComment = async (text, parentId = null) => {
    if (!currentLesson || !currentUser) return;
    try {
      const newComment = await discussionService.createDiscussion(
        Number(currentLesson.id),
        currentUser.id,
        currentUser.fullName || currentUser.name || 'Học sinh',
        currentUser.avatar || 'U',
        text,
        parentId
      );
      setDiscussions(prev => [...prev, newComment]);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrevLesson = useCallback(() => {
    if (!currentLesson || allLessons.length === 0) return;
    const idx = allLessons.findIndex(l => l.id.toString() === currentLesson.id.toString());
    if (idx > 0) {
      // Find the first preceding lesson that is unlocked or owned
      const prevLesson = allLessons[idx - 1];
      onSelectLesson(courseId, prevLesson.id);
    }
  }, [currentLesson, allLessons, courseId, onSelectLesson]);

  const handleNextLesson = useCallback(() => {
    if (!currentLesson || allLessons.length === 0) return;
    const idx = allLessons.findIndex(l => l.id.toString() === currentLesson.id.toString());
    if (idx < allLessons.length - 1) {
      const nextLesson = allLessons[idx + 1];
      onSelectLesson(courseId, nextLesson.id);
    }
  }, [currentLesson, allLessons, courseId, onSelectLesson]);


  const currentIdx = allLessons.findIndex(l => currentLesson && l.id.toString() === currentLesson.id.toString());
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allLessons.length - 1;

  if (!course || !currentLesson) {
    return (
      <div className="cp-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--stone-text-secondary)' }}>
          <div style={{ fontSize: '32px', animation: 'spin 2s linear infinite' }}>⏳</div>
          <div style={{ fontSize: '14px', marginTop: '12px', fontWeight: 'bold' }}>Đang chuẩn bị lớp học...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page-container">
      <div className="cp-page animate-in" style={{ gap: '24px' }}>
        
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
              gap: '12px'
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

        {isDemoMode && !isAdmin && (
          <div 
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-warm-sm)',
              flexWrap: 'wrap',
              gap: '12px'
            }}
            className="animate-in"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>✨</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Bạn đang ở lớp học thử nghiệm (DEMO). Đăng ký khóa học ngay để mở khóa toàn bộ giáo trình VIP và được AI phân tích lộ trình!
              </span>
            </div>
            <button 
              onClick={() => onBackToCourse(`/courses/${courseId}`)}
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--emerald-primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              ĐĂNG KÝ HỌC NGAY
            </button>
          </div>
        )}
        
        {/* ── TOP CONTROL BAR ── */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: '#ffffff', 
            padding: '16px 24px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1.5px solid var(--border-warm)',
            boxShadow: 'var(--shadow-warm-sm)',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="cc-btn cc-btn--owned"
              style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '800' }}
              onClick={() => onBackToCourse(isDemoMode ? '/courses' : `/courses/${courseId}`)}
            >
              {isDemoMode ? '◀ Quay lại khóa học' : '◀ Quay lại Chi tiết khóa'}
            </button>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--stone-text-muted)', display: 'block', fontWeight: '600' }}>
                Học phần: {course.title}
              </span>
              <strong style={{ fontSize: '14px', color: 'var(--stone-text-main)' }}>
                Bài {currentIdx + 1}: {currentLesson.title}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Mark complete checkbox */}
            {!isLocked && currentUser && (
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '12.5px', 
                  color: completedLessons.includes(Number(currentLesson.id)) || completedLessons.includes(currentLesson.id.toString()) ? 'var(--emerald-primary)' : 'var(--stone-text-secondary)', 
                  cursor: 'pointer', 
                  background: completedLessons.includes(Number(currentLesson.id)) || completedLessons.includes(currentLesson.id.toString()) ? 'var(--emerald-light)' : '#ffffff', 
                  border: '1.5px solid var(--border-warm)', 
                  padding: '8px 16px', 
                  borderRadius: '10px',
                  fontWeight: '700',
                  transition: 'all 0.2s'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={completedLessons.includes(Number(currentLesson.id)) || completedLessons.includes(currentLesson.id.toString())}
                  onChange={() => toggleCompleted(currentLesson.id)}
                  style={{ accentColor: 'var(--emerald-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {completedLessons.includes(Number(currentLesson.id)) || completedLessons.includes(currentLesson.id.toString()) ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </label>
            )}

            <button 
              className="cc-btn cc-btn--owned" 
              style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: '700' }}
              onClick={handlePrevLesson}
              disabled={!hasPrev}
            >
              Bài trước
            </button>
            
            <button 
              className="cc-btn cc-btn--enroll" 
              style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: '800' }}
              onClick={handleNextLesson}
              disabled={!hasNext}
            >
              Bài tiếp theo
            </button>
          </div>
        </div>

        {/* ── RESPONSIVE FLEX/GRID STYLING ── */}
        <style>{`
          .learning-layout-grid {
            display: flex;
            gap: 20px;
            align-items: start;
            margin-top: 20px;
            width: 100%;
          }
          .sidebar-col {
            width: 290px;
            flex-shrink: 0;
          }
          .video-col {
            flex: 1;
            min-width: 0;
          }
          .resizer-bar {
            width: 8px;
            align-self: stretch;
            cursor: ew-resize;
            background: transparent;
            transition: background 0.2s;
            border-left: 2px dashed #cbd5e1;
            margin: 0 -4px;
            position: relative;
            z-index: 10;
          }
          .resizer-bar:hover, .resizer-bar.active {
            background: rgba(16, 185, 129, 0.1);
            border-left: 2px solid var(--emerald-primary);
          }
          @media (max-width: 1200px) {
            .learning-layout-grid {
              flex-wrap: wrap;
            }
            .sidebar-col {
              width: 260px;
            }
            .resizer-bar {
              display: none;
            }
            .notebook-col {
              width: 100% !important;
            }
          }
          @media (max-width: 768px) {
            .sidebar-col {
              width: 100%;
            }
          }
        `}</style>

        {/* ── MAIN LAYOUT GRID ── */}
        <div className="learning-layout-grid">
          
          {/* COLUMN 1: PROGRESS SIDEBAR (Left) */}
          <div className="sidebar-col" style={{ height: '580px', position: 'sticky', top: '24px' }}>
            <ProgressSidebar 
              curriculum={course.curriculum}
              currentLessonId={currentLesson.id}
              onSelectLesson={(lesson) => onSelectLesson(course.id, lesson.id)}
              completedLessons={completedLessons}
              isOwned={isOwned}
            />
          </div>

          {/* COLUMN 2: VIDEO PLAYER / LOCKS & DETAILS (Middle) */}
          <div className="video-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
            
            {isLocked ? (
              <div 
                style={{
                  height: '420px',
                  background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  padding: '32px',
                  textAlign: 'center',
                  border: '1.5px solid var(--border-warm)',
                  boxShadow: 'var(--shadow-warm-md)'
                }}
              >
                <span style={{ fontSize: '56px', marginBottom: '20px' }}>🔒</span>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', margin: '0 0 10px 0' }}>
                  Bài giảng này thuộc phạm vi VIP
                </h3>
                <p style={{ fontSize: '14px', color: '#d6d3d1', maxWidth: '440px', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                  Vui lòng đăng ký sở hữu trọn bộ khóa học để xem các bài giảng chuyên sâu nâng cao và truy cập tài liệu tự luyện trắc nghiệm.
                </p>
                <button 
                  className="cc-btn cc-btn--enroll" 
                  style={{ padding: '12px 28px', fontSize: '14px', fontWeight: '800', borderRadius: '10px' }}
                  onClick={() => onBackToCourse(`/courses/${courseId}`)}
                >
                  Đăng ký khóa học ngay
                </button>
              </div>
            ) : (
              <VideoPlayer 
                videoUrl={currentLesson.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
                title={currentLesson.title}
                onEnded={handleNextLesson} // Auto play next lesson when finished!
              />
            )}

            {/* TABBED PANELS */}
            {!isLocked && (
              <>
                <div style={{ display: 'flex', borderBottom: '2px solid var(--border-warm)', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'materials', label: '📥 Tài liệu' },
                    { id: 'discussion', label: '💬 Thảo luận lớp học' },
                    { id: 'teacher', label: '👨‍🏫 Hỏi Giáo viên' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`detail-tab-btn ${activeTab === tab.id ? 'detail-tab-btn--active' : ''}`}
                      style={{ padding: '10px 18px', fontSize: '13.5px' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div>
                  {activeTab === 'materials' && (
                    <CourseMaterials 
                      materials={materials}
                      onDownload={(mat) => toast(`Bắt đầu tải tài liệu: ${mat.title}`, 'success')}
                    />
                  )}
                  {activeTab === 'discussion' && (
                    <CourseDiscussion 
                      discussions={discussions}
                      onAddComment={handleAddComment}
                      currentUser={currentUser}
                    />
                  )}
                  {activeTab === 'teacher' && (
                    <TeacherChat 
                      currentUser={currentUser}
                      teacherName={course.instructor.name}
                    />
                  )}
                </div>
              </>
            )}

          </div>

          {/* DRAG RESIZER BAR */}
          <div className="resizer-bar" onMouseDown={handleMouseDown} />

          {/* COLUMN 3: NOTEBOOK / AI NOTES (Right) */}
          <div className="notebook-col" style={{ width: `${notebookWidth}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
            
            {/* Spiral Binder Container */}
            <div style={{
              background: '#fffdf5',
              border: '1.5px solid var(--border-warm)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-warm-md)',
              display: 'flex',
              flexDirection: 'column',
              height: '560px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Spiral rings simulation */}
              <div style={{ 
                height: '22px', 
                background: '#e2e8f0', 
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center', 
                padding: '0 25px',
                borderBottom: '1px solid #cbd5e1',
                zIndex: 10
              }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{ 
                    width: '8px', 
                    height: '16px', 
                    borderRadius: '4px', 
                    background: 'linear-gradient(to right, #94a3b8, #cbd5e1, #94a3b8)',
                    border: '1px solid #64748b',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)' 
                  }} />
                ))}
              </div>

              {/* Notebook Header / Tab Switcher */}
              <div style={{ 
                display: 'flex', 
                background: '#f1f5f9', 
                borderBottom: '1.5px solid var(--border-warm)',
                padding: '8px 12px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setNotebookTab('notes')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      border: 'none',
                      borderRadius: '8px',
                      background: notebookTab === 'notes' ? '#fffdf5' : 'transparent',
                      color: notebookTab === 'notes' ? 'var(--stone-text-main)' : 'var(--stone-text-secondary)',
                      boxShadow: notebookTab === 'notes' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>📝</span> Ghi chép
                  </button>
                  <button
                    onClick={() => setNotebookTab('ai')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '800',
                      border: 'none',
                      borderRadius: '8px',
                      background: notebookTab === 'ai' ? '#fffdf5' : 'transparent',
                      color: notebookTab === 'ai' ? 'var(--stone-text-main)' : 'var(--stone-text-secondary)',
                      boxShadow: notebookTab === 'ai' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>🤖</span> Hỏi AI buổi học
                  </button>
                </div>
                {notebookTab === 'notes' && (
                  <span style={{ fontSize: '11px', color: 'var(--stone-text-muted)', fontWeight: 'bold' }}>
                    {saveStatus}
                  </span>
                )}
              </div>

              {/* Notebook Content Panel */}
              <div style={{ 
                flex: 1, 
                position: 'relative',
                background: '#fffdf5',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {notebookTab === 'notes' ? (
                  <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                    {/* Vertical Red Margin Line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '40px',
                      width: '1px',
                      background: 'rgba(239, 68, 68, 0.4)',
                      borderRight: '1px solid rgba(239, 68, 68, 0.2)',
                      pointerEvents: 'none'
                    }} />

                    {/* Textarea styled on top of lined paper */}
                    <textarea
                      placeholder="Ghi chú các công thức hay kiến thức quan trọng của buổi học vào đây..."
                      value={noteText}
                      onChange={handleNoteChange}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        backgroundImage: 'linear-gradient(rgba(0, 0, 255, 0.06) 1px, transparent 1px)',
                        backgroundSize: '100% 28px',
                        border: 'none',
                        outline: 'none',
                        lineHeight: '28px',
                        fontSize: '13.5px',
                        fontFamily: 'inherit',
                        padding: '10px 15px 10px 52px',
                        color: 'var(--stone-text-main)',
                        resize: 'none',
                        zIndex: 2,
                        minHeight: '100%'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                    {/* Lined Paper background for chat messages */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: '60px',
                      left: '40px',
                      width: '1px',
                      background: 'rgba(239, 68, 68, 0.3)',
                      pointerEvents: 'none'
                    }} />

                    {/* Messages list */}
                    <div style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      padding: '12px 12px 12px 52px',
                      backgroundImage: 'linear-gradient(rgba(0, 0, 255, 0.05) 1px, transparent 1px)',
                      backgroundSize: '100% 28px',
                      lineHeight: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      maxHeight: '420px'
                    }}>
                      {aiMessages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: isUser ? 'flex-end' : 'flex-start',
                              lineHeight: '20px',
                              marginBottom: '6px'
                            }}
                          >
                            <div style={{
                              maxWidth: '85%',
                              background: isUser ? '#e0f2fe' : '#f8fafc',
                              color: 'var(--stone-text-main)',
                              border: '1px solid var(--border-warm)',
                              borderRadius: '12px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              whiteSpace: 'pre-line'
                            }}>
                              <strong style={{ display: 'block', fontSize: '11px', color: isUser ? '#0284c7' : 'var(--emerald-primary)', marginBottom: '4px' }}>
                                {isUser ? 'Tôi' : 'Gia sư AI'}
                              </strong>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                      {aiTyping && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '6px' }}>
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid var(--border-warm)',
                            borderRadius: '12px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--stone-text-muted)',
                            fontStyle: 'italic'
                          }}>
                            AI đang suy nghĩ...
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Lined Paper input box */}
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!aiInput.trim() || aiTyping) return;
                        const userText = aiInput;
                        setAiInput('');
                        setAiMessages(prev => [...prev, { role: 'user', content: userText }]);
                        setAiTyping(true);
                        try {
                          const response = await aiService.sendAiMessage(userText, currentLesson);
                          setAiMessages(prev => [...prev, { role: 'assistant', content: response }]);
                        } catch (err) {
                          setAiMessages(prev => [...prev, { role: 'assistant', content: 'Thầy xin lỗi, hệ thống AI đang bận. Em thử lại nhé!' }]);
                        } finally {
                          setAiTyping(false);
                        }
                      }}
                      style={{
                        height: '60px',
                        borderTop: '1.5px solid var(--border-warm)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        gap: '8px'
                      }}
                    >
                      <input 
                        type="text"
                        placeholder="Hỏi AI về nội dung buổi học này..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        disabled={aiTyping}
                        style={{
                          flex: 1,
                          fontSize: '12.5px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border-warm)',
                          outline: 'none',
                          background: '#ffffff'
                        }}
                      />
                      <button 
                        type="submit"
                        disabled={aiTyping || !aiInput.trim()}
                        style={{
                          background: aiInput.trim() ? 'var(--emerald-primary)' : '#cbd5e1',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: aiInput.trim() ? 'pointer' : 'default',
                          fontSize: '14px'
                        }}
                      >
                        ✈
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

      </div>
    </div>
  </div>
);
}
