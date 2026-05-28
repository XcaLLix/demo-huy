import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LearningPath from './components/LearningPath';
import Recommendations from './components/Recommendations';
import ProgressChart from './components/ProgressChart';
import StreakCard from './components/StreakCard';
import PerformanceCard from './components/PerformanceCard';
import UpcomingTests from './components/UpcomingTests';
import ChatbotCard from './components/ChatbotCard';

// Upgraded sub-components
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import AITutorChat from './components/AITutorChat';
import CheckoutModal from './components/CheckoutModal';
import CourseDetails from './components/CourseDetails';
import TestSimulator from './components/TestSimulator';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import AISystemCenter from './components/AISystemCenter';

import { HiPlay, HiDocumentDownload } from 'react-icons/hi';

// Initial Database preloads
const initialCourses = [
  {
    id: 1,
    title: "Ứng dụng đạo hàm khảo sát đồ thị hàm số",
    subject: "Toán học",
    price: "499.000",
    teacherName: "Thầy Thế Anh",
    isUnlocked: true,
    lessons: [
      { id: 101, name: "Bài 1: Sự đồng biến, nghịch biến của hàm số", duration: "18:45" },
      { id: 102, name: "Bài 2: Cực trị của hàm số và kỹ thuật bấm máy Casio", duration: "25:30" },
      { id: 103, name: "Bài 3: Giá trị lớn nhất, nhỏ nhất trên đoạn", duration: "22:15" },
      { id: 104, name: "Bài 4: Khảo sát sự biến thiên và vẽ đồ thị nâng cao", duration: "32:10" }
    ]
  },
  {
    id: 2,
    title: "Chinh phục toàn diện Dao động cơ & Sóng cơ học",
    subject: "Vật lý",
    price: "599.000",
    teacherName: "Cô Thu Hương",
    isUnlocked: false,
    lessons: [
      { id: 201, name: "Bài 1: Khái niệm Dao động điều hòa và các phương trình cốt lõi", duration: "20:15" },
      { id: 202, name: "Bài 2: Con lắc lò xo và bài toán năng lượng", duration: "26:40" },
      { id: 203, name: "Bài 3: Con lắc đơn và sự biến thiên chu kỳ", duration: "18:30" }
    ]
  },
  {
    id: 3,
    title: "Ngữ pháp Tiếng Anh trọng tâm thi THPTQG 2026",
    subject: "Tiếng Anh",
    price: "399.000",
    teacherName: "Cô Quỳnh Chi",
    isUnlocked: false,
    lessons: [
      { id: 301, name: "Bài 1: Trọn bộ 12 thì trong Tiếng Anh và dấu hiệu nhận biết", duration: "15:45" },
      { id: 302, name: "Bài 2: Câu bị động và các dạng đặc biệt thường gặp", duration: "22:20" },
      { id: 303, name: "Bài 3: Câu điều kiện và Mệnh đề giả định", duration: "20:10" }
    ]
  }
];

const initialUsers = [
  {
    id: 101,
    name: 'Nguyễn Minh Anh',
    email: 'student@gmail.com',
    password: 'student123',
    role: 'student',
    combo: 'A01 (Toán – Lý – Anh)',
    grade: '12',
    avatar: 'MA',
    isBanned: false,
    unlockedCourses: [1]
  },
  {
    id: 102,
    name: 'Thầy Thế Anh',
    email: 'teacher@gmail.com',
    password: 'teacher123',
    role: 'teacher',
    avatar: 'TA',
    isBanned: false,
    status: 'active'
  }
];

const initialQuestions = [
  {
    id: 1,
    question: "Cho hàm số $y = x^3 - 3x^2 + 2$. Khẳng định nào sau đây về tính đơn điệu của hàm số là ĐÚNG?",
    options: [
      { key: 'A', value: "Hàm số đồng biến trên khoảng $(0; 2)$" },
      { key: 'B', value: "Hàm số nghịch biến trên khoảng $(0; 2)$" },
      { key: 'C', value: "Hàm số nghịch biến trên khoảng $(-\\infty; 0)$" },
      { key: 'D', value: "Hàm số đồng biến trên khoảng $(2; +\\infty)$ và nghịch biến trên $(-\\infty; 0)$" }
    ],
    correctAnswer: 'B',
    difficulty: 'Dễ',
    difficultyClass: 'diff-easy',
    explanation: "Đạo hàm: y' = 3x^2 - 6x = 3x(x - 2).\ny' = 0 <=> x = 0 hoặc x = 2.\nLập bảng biến thiên:\n- Trong khoảng (0; 2), y' < 0 => Hàm số nghịch biến trên khoảng (0; 2).\n- Trong khoảng (-oo; 0) và (2; +oo), y' > 0 => Hàm số đồng biến.",
    topic: "Sự biến thiên của hàm số",
    subject: "Toán học"
  },
  {
    id: 2,
    question: "Một vật dao động điều hòa theo phương trình $x = 5\\cos(4\\pi t + \\pi/3)$ (cm). Biên độ và pha ban đầu của dao động lần lượt là:",
    options: [
      { key: 'A', value: "5 cm; \\pi/3 rad" },
      { key: 'B', value: "5 cm; 4\\pi t rad" },
      { key: 'C', value: "-5 cm; \\pi/3 rad" },
      { key: 'D', value: "5 cm; 4\\pi rad" }
    ],
    correctAnswer: 'A',
    difficulty: 'Dễ',
    difficultyClass: 'diff-easy',
    explanation: "Phương trình dao động điều hòa có dạng: x = A cos(omega t + phi).\nSo sánh phương trình dao động x = 5 cos(4*pi*t + pi/3) (cm):\n- Biên độ dao động: A = 5 (cm).\n- Pha ban đầu: phi = pi/3 (rad).",
    topic: "Dao động điều hòa",
    subject: "Vật lý"
  }
];

export default function App() {
  // Global Application States
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('current_user')) || null);
  const [role, setRole] = useState(() => localStorage.getItem('user_role') || 'guest');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [activeTab, setActiveTab] = useState('home');

  // Relational Tables databases in localStorage
  const [usersList, setUsersList] = useState(() => JSON.parse(localStorage.getItem('users_list')) || initialUsers);
  const [courses, setCourses] = useState(() => JSON.parse(localStorage.getItem('app_courses')) || initialCourses);
  const [questionBank, setQuestionBank] = useState(() => JSON.parse(localStorage.getItem('app_questions')) || initialQuestions);
  const [submissions, setSubmissions] = useState(() => JSON.parse(localStorage.getItem('app_submissions')) || []);
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('app_notifications')) || [
    { id: 1, text: "Chào mừng bạn gia nhập EduPath AI! Hãy bắt đầu khám phá lộ trình của bạn.", time: "Vừa xong", read: false }
  ]);

  const [systemLogs, setSystemLogs] = useState(() => JSON.parse(localStorage.getItem('app_logs')) || [
    { id: 1, time: new Date().toLocaleTimeString(), tag: 'sys', text: "Hệ thống Adaptive AI-Assisted Learning khởi động thành công..." },
    { id: 2, time: new Date().toLocaleTimeString(), tag: 'ai', text: "[AI System] Nạp trọng số mạng lưới nơ-ron thích ứng... Trạng thái: Sẵn sàng." }
  ]);

  const [courseApprovals, setCourseApprovals] = useState(() => JSON.parse(localStorage.getItem('app_approvals')) || [
    {
      id: 201,
      title: "Chuyên đề Hóa hữu cơ 12 toàn diện thi đại học",
      subject: "Hóa học",
      price: "499.000",
      teacherName: "Thầy Khắc Ngọc",
      lessons: [
        { id: 2011, name: "Bài 1: Este - Lipit lý thuyết căn bản", duration: "22:15" },
        { id: 2012, name: "Bài 2: Bài toán thủy phân Este nâng cao", duration: "30:45" }
      ]
    }
  ]);

  // View state controllers
  const [activeCourseDetails, setActiveCourseDetails] = useState(null);
  const [activeTestSimulator, setActiveTestSimulator] = useState(null);
  const [checkoutCourse, setCheckoutCourse] = useState(null);

  // Sync state data to localStorage
  useEffect(() => {
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    localStorage.setItem('user_role', role);
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('users_list', JSON.stringify(usersList));
    localStorage.setItem('app_courses', JSON.stringify(courses));
    localStorage.setItem('app_questions', JSON.stringify(questionBank));
    localStorage.setItem('app_submissions', JSON.stringify(submissions));
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
    localStorage.setItem('app_logs', JSON.stringify(systemLogs));
    localStorage.setItem('app_approvals', JSON.stringify(courseApprovals));
  }, [currentUser, role, theme, usersList, courses, questionBank, submissions, notifications, systemLogs, courseApprovals]);

  // Dark theme trigger
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  const addLog = (text, tag = 'sys') => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      tag,
      text
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    addLog(`Thay đổi giao diện sang chế độ: ${nextTheme.toUpperCase()}`, 'sys');
  };

  // Safe Authentication Handlers
  const handleAuthSuccess = (user, newlyRegisteredUser = null) => {
    if (newlyRegisteredUser) {
      setUsersList(prev => [...prev, newlyRegisteredUser]);
      return;
    }

    setCurrentUser(user);
    setRole(user.role);
    setActiveTab('home');
  };

  const handleLogout = () => {
    addLog(`Người dùng "${currentUser?.name}" đăng xuất an toàn khỏi hệ thống`, 'sys');
    setCurrentUser(null);
    setRole('guest');
    setActiveTab('landing');
    setActiveCourseDetails(null);
    setActiveTestSimulator(null);
    setCheckoutCourse(null);
  };

  const handleChangePassword = (oldPass, newPass) => {
    const matched = usersList.find(u => u.email === currentUser.email);
    if (matched && matched.password === oldPass) {
      const updatedList = usersList.map(u => u.email === currentUser.email ? { ...u, password: newPass } : u);
      setUsersList(updatedList);
      
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      
      addLog(`Người dùng "${currentUser.name}" đổi mật khẩu tài khoản thành công (UC-04)`, 'sys');
      alert('Đổi mật khẩu thành công!');
    } else {
      alert('Mật khẩu cũ không chính xác!');
    }
  };

  // Student purchases course
  const handlePaymentSuccess = (courseId) => {
    // Add to student's list in users database
    const updatedUsers = usersList.map(u => {
      if (u.email === currentUser.email) {
        const unlocked = u.unlockedCourses || [];
        return { ...u, unlockedCourses: [...unlocked, courseId] };
      }
      return u;
    });
    setUsersList(updatedUsers);

    // Sync active session unlockedCourses
    const activeUnlocked = currentUser.unlockedCourses || [];
    setCurrentUser({
      ...currentUser,
      unlockedCourses: [...activeUnlocked, courseId]
    });

    setCheckoutCourse(null);
  };

  // Student completes exam
  const handleFinishedTest = (result) => {
    const newSubmission = {
      id: Date.now(),
      email: currentUser.email,
      testName: activeTestSimulator,
      score: result.score,
      correct: result.correct,
      total: result.total,
      failedTopics: result.failedTopics,
      date: new Date().toLocaleDateString()
    };

    setSubmissions(prev => [newSubmission, ...prev]);
    setActiveTestSimulator(null);
    setActiveTab('path'); // Take them to Adaptive Roadmap to see the AI updates!
  };

  // Teacher Workspace Actions
  const handleCreateCourse = (newCourse) => {
    setCourseApprovals(prev => [newCourse, ...prev]);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  const handleAddQuestion = (newQ) => {
    setQuestionBank(prev => [newQ, ...prev]);
  };

  // Admin Workspace Actions
  const handleToggleUserBan = (userId) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u));
  };

  const handleApproveTeacher = (teacherName, subject) => {
    setUsersList(prev => prev.map(u => u.name === teacherName ? { ...u, status: 'active' } : u));
  };

  const handleApproveCourse = (courseId) => {
    const targetCourse = courseApprovals.find(c => c.id === courseId);
    if (targetCourse) {
      setCourses(prev => [...prev, { ...targetCourse, isUnlocked: false }]); // standard lock, requires checkout
      setCourseApprovals(prev => prev.filter(c => c.id !== courseId));
      
      const newNotif = {
        id: Date.now(),
        text: `Khóa học mới: "${targetCourse.title}" giảng dạy bởi ${targetCourse.teacherName} đã xuất hiện trong Kho học liệu!`,
        time: "Vừa xong",
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleRejectCourse = (courseId) => {
    setCourseApprovals(prev => prev.filter(c => c.id !== courseId));
  };

  const handleSendAnnouncement = (annText) => {
    const newNotif = {
      id: Date.now(),
      text: `📢 THÔNG BÁO CHUNG: ${annText}`,
      time: "Vừa xong",
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Fast demo logins for easier auditing
  const handleQuickLogin = (targetRole) => {
    if (targetRole === 'student') {
      const student = usersList.find(u => u.email === 'student@gmail.com');
      if (student) handleAuthSuccess(student);
    } else if (targetRole === 'teacher') {
      const teacher = usersList.find(u => u.email === 'teacher@gmail.com');
      if (teacher) handleAuthSuccess(teacher);
    } else if (targetRole === 'admin') {
      const admin = {
        name: 'Quản trị viên Hệ thống',
        email: 'admin@edupath.vn',
        role: 'admin',
        avatar: 'AD'
      };
      handleAuthSuccess(admin);
    }
  };

  // Filter dynamic list of course purchases for current user session
  const activeUserCourses = courses.map(c => {
    const isUnlocked = c.id === 1 || currentUser?.unlockedCourses?.includes(c.id);
    return { ...c, isUnlocked };
  });

  const activeUserSubmissions = submissions.filter(s => s.email === currentUser?.email);

  return (
    <div className="app-layout">
      {/* Sidebar - Guarded against guest visitors */}
      {role !== 'guest' && (
        <Sidebar
          role={role}
          active={activeTab}
          setActive={(tab) => {
            setActiveTab(tab);
            setActiveCourseDetails(null);
            setActiveTestSimulator(null);
          }}
          userProfile={currentUser}
          onLogout={handleLogout}
        />
      )}

      <div className="main-wrapper" style={{ marginLeft: role === 'guest' ? 0 : 'var(--sidebar-width)' }}>
        <main className="main-content" style={{ maxWidth: '100%' }}>
          {role !== 'guest' ? (
            <Header
              role={role}
              userProfile={currentUser}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              notifications={notifications}
              onClearNotifications={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              onLogout={handleLogout}
              onChangePassword={handleChangePassword}
              addLog={addLog}
            />
          ) : (
            // Minimal Header for Guests
            theme === 'dark' && (
              <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
                <button className="header-icon-btn" onClick={handleToggleTheme}>
                  ☀️
                </button>
              </div>
            )
          )}

          {/* ================= GUEST PUBLIC PREVIEW ================= */}
          {role === 'guest' && (
            <div>
              {activeTab === 'landing' || activeTab === 'home' ? (
                <LandingPage
                  onNavigateToAuth={(mode) => {
                    setActiveTab(mode);
                  }}
                  onNavigateToTeacherSignup={() => {
                    setActiveTab('signup');
                    setUserRole('teacher');
                  }}
                />
              ) : (
                <AuthPage
                  defaultMode={activeTab === 'signup' ? 'signup' : 'login'}
                  onAuthSuccess={(user, newlyRegistered) => {
                    if (newlyRegistered) {
                      setUsersList(prev => [...prev, newlyRegistered]);
                      return;
                    }
                    handleAuthSuccess(user);
                  }}
                  usersList={usersList}
                  addLog={addLog}
                />
              )}
            </div>
          )}

          {/* ================= STUDENT WORKSPACE ================= */}
          {role === 'student' && !activeCourseDetails && !activeTestSimulator && (
            <div>
              {activeTab === 'home' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px' }}>
                  {/* Left column */}
                  <div>
                    {/* Learning Path roadmap card */}
                    <div className="card learning-path animate-in">
                      <div className="card-header">
                        <h3>LỘ TRÌNH HỌC TẬP TÍCH HỢP AI CỦA BẠN</h3>
                        <button className="link" onClick={() => setActiveTab('path')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer' }}>Chi tiết lộ trình</button>
                      </div>
                      <div className="path-info-row">
                        <div className="path-info">
                          <p className="path-goal">Mục tiêu: <strong>Đạt 27+ điểm tốt nghiệp THPTQG</strong></p>
                          <p className="path-combo">Khối ôn luyện hiện tại: {currentUser?.combo || 'A01'}</p>
                        </div>
                        <div className="path-days">
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thời gian còn lại</span>
                          <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)' }}>180 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>ngày</span></div>
                        </div>
                      </div>
                      <LearningPath />
                    </div>

                    {/* Recommendations */}
                    <div className="card recommendations animate-in">
                      <div className="card-header">
                        <h3>ĐỀ XUẤT CÁ NHÂN HÓA DÀNH CHO BẠN</h3>
                        <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 'bold' }}>AI gợi ý bài học</span>
                      </div>
                      <div className="rec-grid">
                        <div className="rec-card" onClick={() => {
                          const course = activeUserCourses.find(c => c.id === 1);
                          if (course) setActiveCourseDetails(course);
                        }}>
                          <span className="rec-badge lesson">Bài học đề xuất</span>
                          <h4>Hàm số bậc 2 và đồ thị</h4>
                          <p className="rec-subject">Toán học</p>
                          <div className="rec-card-footer">
                            <span className="rec-time">⏱ 45 phút</span>
                            <button className="rec-play">▶</button>
                          </div>
                        </div>

                        <div className="rec-card" onClick={() => setActiveTestSimulator("Bài tập củng cố Đạo hàm")}>
                          <span className="rec-badge exercise">Bài tự luyện</span>
                          <h4>Bài tập sửa sai Khảo sát hàm số</h4>
                          <p className="rec-subject">Toán học</p>
                          <div className="rec-card-footer">
                            <span className="rec-time">⏱ 5 câu hỏi</span>
                            <button className="rec-play">▶</button>
                          </div>
                        </div>

                        <div className="rec-card" onClick={() => setActiveTab('ai-qa')}>
                          <span className="rec-badge review">Tutor AI</span>
                          <h4>Hỏi đáp EduBot về Dao động cơ</h4>
                          <p className="rec-subject">Vật lý</p>
                          <div className="rec-card-footer">
                            <span className="rec-time">⏱ Trực tuyến</span>
                            <button className="rec-play">💬</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ProgressChart />
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <StreakCard />
                    <PerformanceCard />
                    <UpcomingTests />
                    
                    <div className="card chatbot-card animate-in" onClick={() => setActiveTab('ai-qa')} style={{ cursor: 'pointer' }}>
                      <div className="chatbot-header">
                        <h3>Trợ lý AI EduBot</h3>
                        <span className="ai-badge">AI</span>
                      </div>
                      <p className="chatbot-question">Học viên Nguyễn Minh Anh, bạn cần EduBot hỗ trợ giải bài tập nào khó hôm nay? Nhấp để trao đổi!</p>
                      <div className="chatbot-suggestions">
                        <span className="chatbot-suggestion">Giải bài tập</span>
                        <span className="chatbot-suggestion">Hỏi công thức</span>
                      </div>
                      <div className="chatbot-robot">🤖</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Learning path adaptive roadmap tab */}
              {activeTab === 'path' && (
                <AISystemCenter submissions={activeUserSubmissions} addLog={addLog} />
              )}

              {/* Courses tab */}
              {activeTab === 'courses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px' }}>KHO HỌC LIỆU KHÓA HỌC TRỰC TUYẾN</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {activeUserCourses.map((c) => (
                        <div key={c.id} className="landing-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '10px' }}>{c.subject}</span>
                            <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', marginTop: '8px', marginBottom: '6px' }}>{c.title}</h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Giảng viên: {c.teacherName}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Số bài giảng: {c.lessons.length} bài • Giáo trình THPTQG</p>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                            {c.isUnlocked ? (
                              <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold' }}>✓ Đã mở khóa</span>
                            ) : (
                              <span style={{ fontSize: '14px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>{c.price}đ</span>
                            )}
                            
                            {c.isUnlocked ? (
                              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px' }} onClick={() => setActiveCourseDetails(c)}>
                                Vào lớp học
                              </button>
                            ) : (
                              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '11.5px', borderColor: 'var(--accent-orange)', color: 'var(--accent-orange)' }} onClick={() => setCheckoutCourse(c)}>
                                Mua khóa học
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Online Mock Exams tab */}
              {activeTab === 'tests' && (
                <div className="card">
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px' }}>HỆ THỐNG KIỂM TRA & LUYỆN ĐỀ</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '10px' }}>Toán học</span>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px' }}>Đề khảo sát kiểm tra Khảo sát hàm số chương I</h4>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Thời lượng: 30 phút • Quy chuẩn đề thi THPTQG</p>
                      </div>
                      <button className="btn-primary" onClick={() => setActiveTestSimulator("Đề Khảo sát Hàm số Chương I")}>
                        Bắt đầu làm bài
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Q&A Tutor tab */}
              {activeTab === 'ai-qa' && (
                <AITutorChat addLog={addLog} />
              )}

              {/* Library docs downloads tab */}
              {activeTab === 'library' && (
                <div className="card">
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px' }}>THƯ VIỆN CHIA SẺ TÀI LIỆU LÝ THUYẾT</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 'bold' }}>Sổ tay 100 công thức giải nhanh Vật Lý 12</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dung lượng: 4.8 MB • Định dạng: PDF</p>
                      </div>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px' }} onClick={() => {
                        addLog(`Tải tài liệu: "Cong_thuc_Vat_Ly_12.pdf"`, 'sys');
                        alert('Đã tải tài liệu Vật Lý!');
                      }}>Tải về</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Profile tab */}
              {activeTab === 'settings' && (
                <div className="card" style={{ maxWidth: '600px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>THIẾT LẬP TÀI KHOẢN CÁ NHÂN</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    alert('Đã cập nhật thông tin cá nhân!');
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Họ và tên của bạn:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={currentUser.name}
                        onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Trường THPT học tập:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={currentUser.school || 'THPT Chuyên Hà Nội - Amsterdam'}
                        onChange={e => setCurrentUser({ ...currentUser, school: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Tổ hợp mục tiêu:</label>
                      <select
                        className="form-control"
                        value={currentUser.combo}
                        onChange={e => setCurrentUser({ ...currentUser, combo: e.target.value })}
                      >
                        <option value="A01 (Toán – Lý – Anh)">A01 (Toán – Lý – Anh)</option>
                        <option value="B00 (Toán – Hóa – Sinh)">B00 (Toán – Hóa – Sinh)</option>
                        <option value="D01 (Toán – Văn – Anh)">D01 (Toán – Văn – Anh)</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu cấu hình</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Student classroom details view */}
          {role === 'student' && activeCourseDetails && (
            <CourseDetails
              course={activeCourseDetails}
              onBack={() => setActiveCourseDetails(null)}
              addLog={addLog}
            />
          )}

          {/* Student active test simulator taking view */}
          {role === 'student' && activeTestSimulator && (
            <TestSimulator
              testName={activeTestSimulator}
              onFinished={handleFinishedTest}
              addLog={addLog}
            />
          )}

          {/* ================= TEACHER WORKSPACE ================= */}
          {role === 'teacher' && (
            <TeacherDashboard
              courses={courses}
              onCreateCourse={handleCreateCourse}
              onDeleteCourse={handleDeleteCourse}
              questionBank={questionBank}
              onAddQuestion={handleAddQuestion}
              addLog={addLog}
            />
          )}

          {/* ================= ADMIN WORKSPACE ================= */}
          {role === 'admin' && (
            <AdminDashboard
              users={usersList}
              onToggleUserBan={handleToggleUserBan}
              onApproveTeacher={handleApproveTeacher}
              courseApprovals={courseApprovals}
              onApproveCourse={handleApproveCourse}
              onRejectCourse={handleRejectCourse}
              onSendAnnouncement={handleSendAnnouncement}
              systemLogs={systemLogs}
              addLog={addLog}
            />
          )}
        </main>
      </div>

      {/* Checkout Shopping Portal */}
      {checkoutCourse && (
        <CheckoutModal
          course={checkoutCourse}
          onClose={() => setCheckoutCourse(null)}
          onPaymentSuccess={handlePaymentSuccess}
          addLog={addLog}
        />
      )}

      {/* ================= SAAS DEMO DEBUGGER / FAST LOGINS ================= */}
      <div className="demo-controller" style={{ maxWidth: '340px' }}>
        <div className="demo-controller-header">
          <h4>SAAS LOGINS DEBUGGER (KĐ HỆ THỐNG)</h4>
          <span style={{ fontSize: '9px', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold' }}>SWP391 PRO</span>
        </div>
        <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
          Nhấp đăng nhập nhanh bằng các tài khoản cấu hình sẵn để kiểm chứng quy trình hoặc đăng ký tài khoản mới thủ công.
        </p>
        <div className="demo-role-btns" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button className="demo-role-btn" onClick={() => handleQuickLogin('student')}>
            1. Student MA
          </button>
          <button className="demo-role-btn" onClick={() => handleQuickLogin('teacher')}>
            2. GV Thế Anh
          </button>
          <button className="demo-role-btn" onClick={() => handleQuickLogin('admin')}>
            3. Admin 🛡️
          </button>
        </div>
      </div>
    </div>
  );
}
