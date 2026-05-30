import { useState, useEffect, useRef } from 'react';
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
import Forum from './components/Forum';
import CourseMall from './components/CourseMall';

import { HiPlay, HiDocumentDownload, HiBeaker, HiX } from 'react-icons/hi';

function DemoPanel({ onQuickLogin }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      {open && (
        <div className="demo-controller animate-in" style={{ marginBottom: 8 }}>
          <div className="demo-controller-header">
            <h4>Demo — Đăng nhập nhanh</h4>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
          <div className="demo-role-btns" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <button className="demo-role-btn" onClick={() => { onQuickLogin('student'); setOpen(false); }}>🎒 Học sinh</button>
            <button className="demo-role-btn" onClick={() => { onQuickLogin('teacher'); setOpen(false); }}>🎓 Giáo viên</button>
            <button className="demo-role-btn" onClick={() => { onQuickLogin('admin'); setOpen(false); }}>🛡️ Admin</button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(108,92,231,0.5)',
          transition: 'all 0.2s',
        }}
        title="Demo login"
      >
        {open ? '✕' : '⚡'}
      </button>
    </div>
  );
}

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

const initialForumPosts = [
  {
    id: 1,
    title: "Có bạn nào giải được bài toán cực trị Casio 12 câu 4 đề minh họa không?",
    content: "Chào mọi người, em đang ôn thi phần ứng dụng đạo hàm và gặp khó khăn trong việc tìm giá trị cực trị lớn nhất bằng Casio FX-880. Em đã thử lập bảng biến thiên nhưng mất nhiều thời gian quá. Bác nào có mẹo bấm máy nhanh chỉ em với!",
    subject: "Toán học",
    author: "Nguyễn Minh Anh",
    authorAvatar: "MA",
    date: "10 phút trước",
    likes: 5,
    likedBy: [],
    comments: [
      {
        id: 11,
        author: "Thầy Thế Anh",
        avatar: "TA",
        content: "Em có thể dùng tính năng Table (Vô cực đại) trên FX-880, quét từ -5 đến 5 với bước nhảy là 0.1 để định vị vùng cực trị trước, sau đó dùng công cụ Solver để tính đạo hàm bằng 0 cực kỳ chính xác nhé!",
        date: "5 phút trước"
      }
    ]
  },
  {
    id: 2,
    title: "Tổng hợp công thức Dao động cơ học 12 cần nhớ để thi THPTQG",
    content: "Mình vừa tổng hợp lại toàn bộ các phương trình quan trọng của dao động điều hòa, con lắc lò xo và bài toán quãng đường max-min cực kỳ dễ học thuộc. Hy vọng sẽ giúp ích cho các bạn trong mùa ôn thi năm nay!",
    subject: "Vật lý",
    author: "Lê Minh Tuấn",
    authorAvatar: "MT",
    date: "1 giờ trước",
    likes: 12,
    likedBy: [],
    comments: []
  }
];

function LibraryCabinet({ addLog }) {
  const [search, setSearch] = useState('');
  const [selectedSubj, setSelectedSubj] = useState('All');
  
  // List of high-quality premium documents
  const [docs, setDocs] = useState([
    { id: 1, title: "Sổ tay 100 công thức giải nhanh Vật Lý 12", subject: "Vật lý", size: "4.8 MB", type: "PDF", downloads: "2,450", progress: 0, status: 'idle' },
    { id: 2, title: "Tổng hợp các dạng bài toán Cực trị Hàm số Casio", subject: "Toán học", size: "3.2 MB", type: "PDF", downloads: "4,120", progress: 0, status: 'idle' },
    { id: 3, title: "Trọn bộ Từ vựng & Cụm từ Tiếng Anh trọng tâm 2026", subject: "Tiếng Anh", size: "5.5 MB", type: "PDF", downloads: "1,890", progress: 0, status: 'idle' },
    { id: 4, title: "Bài tập chuyên đề Este & Lipit nâng cao (có giải chi tiết)", subject: "Hóa học", size: "6.2 MB", type: "PDF", downloads: "850", progress: 0, status: 'idle' },
    { id: 5, title: "Lý thuyết Sinh học ôn thi khối B (Di truyền & Tiến hóa)", subject: "Sinh học", size: "3.9 MB", type: "PDF", downloads: "620", progress: 0, status: 'idle' },
    { id: 6, title: "Đề cương ôn tập Ngữ Văn 12 học kỳ 1 (THPT Amsterdam)", subject: "Ngữ văn", size: "2.1 MB", type: "Word", downloads: "1,150", progress: 0, status: 'idle' }
  ]);

  const handleDownload = (docId, docTitle) => {
    // Modify status to downloading
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'downloading', progress: 0 } : d));
    addLog(`Bắt đầu tải tài liệu: "${docTitle}"`, 'sys');

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setDocs(prev => prev.map(d => {
        if (d.id === docId) {
          if (currentProgress >= 100) {
            clearInterval(interval);
            addLog(`Tải tài liệu hoàn thành: "${docTitle}"`, 'sys');
            return { ...d, status: 'completed', progress: 100 };
          }
          return { ...d, progress: currentProgress };
        }
        return d;
      }));
    }, 150);
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubj = selectedSubj === 'All' || doc.subject === selectedSubj;
    return matchesSearch && matchesSubj;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px', color: 'var(--text-main)' }}>
          📚 THƯ VIỆN CHIA SẺ TÀI LIỆU LÝ THUYẾT (UC-25)
        </h3>
        
        {/* Search & Subject quick selectors */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Tìm tài liệu ôn thi..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', fontSize: '13px' }}
          />
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['All', 'Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Sinh học', 'Ngữ văn'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubj(subj)}
                style={{
                  border: '1px solid var(--border)',
                  background: selectedSubj === subj ? 'var(--primary)' : 'var(--bg-main)',
                  color: selectedSubj === subj ? '#fff' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {subj === 'All' ? 'Tất cả' : subj}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {filteredDocs.map(doc => {
            const radius = 12;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (doc.progress / 100) * circumference;

            return (
              <div 
                key={doc.id} 
                style={{ 
                  padding: '16px', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--bg-card)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '9px', fontWeight: 'bold' }}>
                    {doc.subject}
                  </span>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 'bold', marginTop: '6px', color: 'var(--text-main)', margin: '6px 0 2px 0' }}>{doc.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                    Dung lượng: {doc.size} • Định dạng: {doc.type} • Tải xuống: {doc.downloads} lượt
                  </p>
                </div>

                <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                  {doc.status === 'idle' && (
                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 14px', fontSize: '11.5px' }} 
                      onClick={() => handleDownload(doc.id, doc.title)}
                    >
                      Tải về
                    </button>
                  )}

                  {doc.status === 'downloading' && (
                    <div className="download-progress-ring" title={`Đang tải: ${doc.progress}%`}>
                      <svg>
                        <circle className="bg-circle" cx="20" cy="20" r={radius} />
                        <circle 
                          className="progress-circle" 
                          cx="20" 
                          cy="20" 
                          r={radius} 
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: '9px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {doc.progress}%
                      </span>
                    </div>
                  )}

                  {doc.status === 'completed' && (
                    <span 
                      style={{ 
                        background: 'rgba(0,184,148,0.12)', 
                        color: 'var(--accent-green)', 
                        fontSize: '11.5px', 
                        fontWeight: 'bold', 
                        padding: '6px 12px', 
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ✓ Đã lưu
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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

  const [forumPosts, setForumPosts] = useState(() => JSON.parse(localStorage.getItem('app_forum_posts')) || initialForumPosts);

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
    localStorage.setItem('app_forum_posts', JSON.stringify(forumPosts));
  }, [currentUser, role, theme, usersList, courses, questionBank, submissions, notifications, systemLogs, courseApprovals, forumPosts]);

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
      setUsersList(prev => {
        const filtered = prev.filter(u => u.email !== newlyRegisteredUser.email);
        return [...filtered, newlyRegisteredUser];
      });
      return;
    }

    setCurrentUser(user);
    setRole(user.role);
    setActiveTab('landing');
  };

  const handleBackToDashboard = (targetTab) => {
    setActiveTab(targetTab || 'home');
    setActiveCourseDetails(null);
    setActiveTestSimulator(null);
  };

  const handleLogout = () => {
    addLog(`Người dùng "${currentUser?.name}" đăng xuất an toàn khỏi hệ thống`, 'sys');
    setCurrentUser(null);
    setRole('guest');
    setActiveTab('home');
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

  // Forum interactions
  const handleForumAddPost = (newPost) => {
    setForumPosts(prev => [newPost, ...prev]);
    addLog(`Đăng bài thảo luận mới: "${newPost.title}"`, 'sys');
  };

  const handleForumLikePost = (postId) => {
    const updated = forumPosts.map(post => {
      if (post.id === postId) {
        const userEmail = currentUser?.email || 'guest';
        const alreadyLiked = post.likedBy?.includes(userEmail);
        const nextLikedBy = alreadyLiked 
          ? post.likedBy.filter(email => email !== userEmail)
          : [...(post.likedBy || []), userEmail];
        const nextLikesCount = alreadyLiked ? post.likes - 1 : post.likes + 1;
        
        return {
          ...post,
          likes: nextLikesCount,
          likedBy: nextLikedBy
        };
      }
      return post;
    });
    setForumPosts(updated);
  };

  const handleForumAddComment = (postId, newComment) => {
    const updated = forumPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    });
    setForumPosts(updated);
    addLog(`Thêm phản hồi cho bài thảo luận`, 'sys');
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
      {role !== 'guest' && activeTab !== 'landing' && (
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

      <div className="main-wrapper" style={{ marginLeft: (role === 'guest' || activeTab === 'landing') ? 0 : 'var(--sidebar-width)' }}>
        <main className="main-content" style={(role === 'guest' || activeTab === 'landing') ? { maxWidth: '100%', padding: 0 } : { maxWidth: '100%' }}>
          {role !== 'guest' && activeTab !== 'landing' ? (
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

          {/* ================= PUBLIC OR PREVIEW LANDING PAGE ================= */}
          {(role === 'guest' || activeTab === 'landing') && (
            <div>
              {role === 'guest' && (activeTab === 'login' || activeTab === 'signup') ? (
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
                  onBackToLanding={() => setActiveTab('home')}
                />
              ) : (
                <LandingPage
                  currentUser={currentUser}
                  onNavigateToAuth={(mode) => setActiveTab(mode)}
                  onBackToDashboard={handleBackToDashboard}
                  onLogout={handleLogout}
                />
              )}
            </div>
          )}

          {/* ================= STUDENT WORKSPACE ================= */}
          {role === 'student' && activeTab !== 'landing' && !activeCourseDetails && !activeTestSimulator && (

            <div>
              {activeTab === 'home' && (
                <div>
                  {/* Welcome stats row */}
                  <div className="dashboard-stats-row animate-in">
                    <div className="dash-stat-card">
                      <div className="dash-stat-icon" style={{ background: 'rgba(108,92,231,0.12)', color: 'var(--primary)' }}>🎯</div>
                      <div>
                        <div className="dash-stat-value">27+</div>
                        <div className="dash-stat-label">Điểm mục tiêu</div>
                      </div>
                    </div>
                    <div className="dash-stat-card">
                      <div className="dash-stat-icon" style={{ background: 'rgba(243,156,18,0.12)', color: 'var(--accent-orange)' }}>🔥</div>
                      <div>
                        <div className="dash-stat-value">7 ngày</div>
                        <div className="dash-stat-label">Học liên tiếp</div>
                      </div>
                    </div>
                    <div className="dash-stat-card">
                      <div className="dash-stat-icon" style={{ background: 'rgba(0,184,148,0.12)', color: 'var(--accent-green)' }}>📈</div>
                      <div>
                        <div className="dash-stat-value">72%</div>
                        <div className="dash-stat-label">Tiến độ lộ trình</div>
                      </div>
                    </div>
                    <div className="dash-stat-card">
                      <div className="dash-stat-icon" style={{ background: 'rgba(9,132,227,0.12)', color: 'var(--accent-blue)' }}>⏰</div>
                      <div>
                        <div className="dash-stat-value">180 ngày</div>
                        <div className="dash-stat-label">Đến kỳ thi</div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-main-grid">
                    {/* Left column */}
                    <div>
                      <div className="card learning-path animate-in">
                        <div className="card-header">
                          <h3>LỘ TRÌNH HỌC TẬP AI</h3>
                          <button className="link" onClick={() => setActiveTab('path')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px' }}>Xem đầy đủ →</button>
                        </div>
                        <div className="path-info-row" style={{ marginBottom: 16 }}>
                          <div className="path-info">
                            <p className="path-goal">Mục tiêu: <strong>Đạt 27+ điểm THPTQG</strong></p>
                            <p className="path-combo">Khối: {currentUser?.combo || 'A01 (Toán – Lý – Anh)'}</p>
                          </div>
                        </div>
                        <LearningPath />
                      </div>

                      <div className="card recommendations animate-in">
                        <div className="card-header">
                          <h3>ĐỀ XUẤT HÔM NAY</h3>
                          <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 'bold' }}>✨ AI gợi ý</span>
                        </div>
                        <div className="rec-grid">
                          <div className="rec-card" onClick={() => { const course = activeUserCourses.find(c => c.id === 1); if (course) setActiveCourseDetails(course); }}>
                            <span className="rec-badge lesson">Bài học</span>
                            <h4>Hàm số bậc 2 và đồ thị</h4>
                            <p className="rec-subject">Toán học</p>
                            <div className="rec-card-footer">
                              <span className="rec-time">⏱ 45 phút</span>
                              <button className="rec-play">▶</button>
                            </div>
                          </div>
                          <div className="rec-card" onClick={() => setActiveTestSimulator("Bài tập củng cố Đạo hàm")}>
                            <span className="rec-badge exercise">Luyện tập</span>
                            <h4>Sửa sai Khảo sát hàm số</h4>
                            <p className="rec-subject">Toán học</p>
                            <div className="rec-card-footer">
                              <span className="rec-time">⏱ 5 câu</span>
                              <button className="rec-play">▶</button>
                            </div>
                          </div>
                          <div className="rec-card" onClick={() => setActiveTab('ai-qa')}>
                            <span className="rec-badge review">AI Tutor</span>
                            <h4>Hỏi EduBot về Dao động cơ</h4>
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

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <StreakCard />
                      <PerformanceCard />
                      <UpcomingTests />
                      <div className="card chatbot-card animate-in" onClick={() => setActiveTab('ai-qa')} style={{ cursor: 'pointer' }}>
                        <div className="chatbot-header">
                          <h3>Trợ lý EduBot AI</h3>
                          <span className="ai-badge">AI</span>
                        </div>
                        <p className="chatbot-question">{currentUser?.name}, hôm nay bạn muốn hỏi về kiến thức gì? Nhấp để bắt đầu!</p>
                        <div className="chatbot-suggestions">
                          <span className="chatbot-suggestion">Giải bài tập</span>
                          <span className="chatbot-suggestion">Hỏi công thức</span>
                        </div>
                        <div className="chatbot-robot">🤖</div>
                      </div>
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
                <CourseMall
                  courses={courses}
                  currentUser={currentUser}
                  onSelectCourse={setActiveCourseDetails}
                  onCheckoutCourse={setCheckoutCourse}
                />
              )}

              {/* Forum tab */}
              {activeTab === 'forum' && (
                <Forum
                  forumPosts={forumPosts}
                  onAddPost={handleForumAddPost}
                  onLikePost={handleForumLikePost}
                  onAddComment={handleForumAddComment}
                  currentUser={currentUser}
                />
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
                <LibraryCabinet addLog={addLog} />
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
          {role === 'student' && activeTab !== 'landing' && activeCourseDetails && (
            <CourseDetails
              course={activeCourseDetails}
              onBack={() => setActiveCourseDetails(null)}
              addLog={addLog}
            />
          )}

          {/* Student active test simulator taking view */}
          {role === 'student' && activeTab !== 'landing' && activeTestSimulator && (
            <TestSimulator
              testName={activeTestSimulator}
              onFinished={handleFinishedTest}
              addLog={addLog}
            />
          )}

          {/* ================= TEACHER WORKSPACE ================= */}
          {role === 'teacher' && activeTab !== 'landing' && (
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
          {role === 'admin' && activeTab !== 'landing' && (
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

      {/* Demo quick-login panel (collapsible) */}
      {/* <DemoPanel onQuickLogin={handleQuickLogin} /> */}
    </div>
  );
}
