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
import UpgradeModal from './components/UpgradeModal';
import AnnouncementPopup from './components/AnnouncementPopup';
import CourseDetails from './components/CourseDetails';
import TestSimulator from './components/TestSimulator';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import AffiliateDashboard from './components/AffiliateDashboard';
import AISystemCenter from './components/AISystemCenter';
import Forum from './components/Forum';
import CourseMall from './components/CourseMall';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import OCRScanner from './components/OCRScanner.jsx';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ContributionHeatmap from './components/ContributionHeatmap';
import LeaderboardTab from './components/LeaderboardTab';

import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import { mapDbCourseToMockFormat } from './utils/courseMapper';
import LearningPage from './pages/LearningPage';
import MockExamsPage from './pages/MockExamsPage';
import MockExamDetailPage from './pages/MockExamDetailPage';
import MockExamTakingPage from './pages/MockExamTakingPage';
import MockExamResultPage from './pages/MockExamResultPage';
import { enrollmentService } from './services/enrollmentService';
import './styles/mockExams.css';
import './styles/dashboard.css';
import './styles/courses.css';
import AITutorPage from './pages/AITutorPage';
import './styles/aitutor.css';
import NotificationsPage from './pages/NotificationsPage';
import FlashcardPage from './pages/FlashcardPage';
import './styles/flashcards.css';
import ExamBankPage from './pages/ExamBankPage';
import './styles/exambank.css';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import RouteGuard from './components/common/RouteGuard';
import DevToolsPage from './pages/DevToolsPage';


import { HiPlay, HiDocumentDownload, HiBeaker, HiX, HiBookOpen } from 'react-icons/hi';
import { io } from 'socket.io-client';
import { api, API_BASE } from './api';



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
    unlockedCourses: [1],
    registeredDate: '2026-06-12'
  },
  {
    id: 102,
    name: 'Thầy Thế Anh',
    email: 'teacher@gmail.com',
    password: 'teacher123',
    role: 'teacher',
    avatar: 'TA',
    isBanned: false,
    status: 'active',
    registeredDate: '2026-06-10'
  },
  {
    id: 103,
    name: 'Trần Văn Thuần',
    email: 'Tranvanthuan2005tt@gmail.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'AD',
    isBanned: false,
    status: 'active',
    registeredDate: '2026-06-08'
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
    id: 100,
    title: "📢 [THÔNG BÁO QUAN TRỌNG] Lịch thi thử THPT Quốc Gia 2026 & Tài liệu Ôn tập Độc quyền",
    content: "Chào toàn thể các em học sinh trên hệ thống EduPath AI,\n\nBan Quản Trị xin gửi tới các em lịch thi thử trực tuyến các môn học trọng điểm (Toán, Lý, Hóa, Anh, Sinh) chuẩn cấu trúc của Bộ GD&ĐT. Các đề thi sẽ được mở vào tối thứ 7 hàng tuần lúc 20:00.\n\nSau khi làm bài, các em sẽ nhận được phân tích kết quả chi tiết từ hệ thống AI và lộ trình khắc phục lỗ hổng kiến thức tương ứng.\n\nChúc các em ôn tập đạt kết quả cao nhất!",
    subject: "Khác",
    author: "Trần Văn Thuần",
    authorAvatar: "AD",
    authorRole: "admin",
    date: "Đã ghim",
    likes: 128,
    likedBy: [],
    comments: [
      {
        id: 1001,
        author: "Nguyễn Minh Anh",
        avatar: "MA",
        content: "Tuyệt vời quá ạ! Em đang mong có đề thi thử chuẩn cấu trúc để test năng lực.",
        date: "2 giờ trước",
        isAccepted: false
      },
      {
        id: 1002,
        author: "Lê Minh Tuấn",
        avatar: "MT",
        content: "Em sẽ đặt lịch thi đúng giờ. Cảm ơn thầy cô admin rất nhiều!",
        date: "1 giờ trước",
        isAccepted: false
      }
    ]
  },
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
        date: "5 phút trước",
        isAccepted: false
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

const generateMassiveExamsList = (backendExams) => {
  if (!backendExams || backendExams.length === 0) return [];

  const getSlug = (subject) => {
    if (subject === 'Toán học') return 'toan';
    if (subject === 'Tiếng Anh') return 'anh';
    if (subject === 'Vật lý') return 'ly';
    if (subject === 'Hóa học') return 'hoa';
    return 'toan';
  };

  const getIcon = (subject) => {
    if (subject === 'Toán học') return '📐';
    if (subject === 'Tiếng Anh') return '🗣️';
    if (subject === 'Vật lý') return '⚛️';
    if (subject === 'Hóa học') return '🧪';
    return '🎯';
  };

  const getSubjectId = (subject) => {
    if (subject === 'Toán học') return 1;
    if (subject === 'Tiếng Anh') return 2;
    if (subject === 'Vật lý') return 3;
    if (subject === 'Hóa học') return 4;
    return 1;
  };

  const mapBackendExam = (e) => {
    const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
    const matchedYear = years.find(y => e.title.includes(String(y))) || 2024;
    const matchedCode = e.title.match(/Mã đề (\d+)/)?.[1] || '101';
    const isOfficial = e.title.toLowerCase().includes('chính thức');
    const subjectSlug = getSlug(e.subject);
    const subjectIcon = getIcon(e.subject);
    const subjectId = getSubjectId(e.subject);

    return {
      id: String(e.id),
      subject_id: subjectId,
      title: e.title,
      year: matchedYear,
      exam_code: matchedCode,
      exam_type: isOfficial ? 'official' : 'mock',
      source: isOfficial ? 'Bộ GD&ĐT' : 'Trường chuyên',
      duration_minutes: e.duration,
      total_questions: e.examQuestions ? e.examQuestions.length : (e.totalQuestions || 0),
      description: e.description || `Đề thi ôn luyện môn ${e.subject} thi tốt nghiệp THPT Quốc Gia.`,
      status: 'published',
      exam_subjects: {
        id: subjectId,
        name: e.subject,
        slug: subjectSlug,
        icon: subjectIcon,
        description: `Môn ${e.subject} ôn thi THPT Quốc Gia`
      },
      attempts_count: 0,
      examQuestions: e.examQuestions || []
    };
  };

  const mappedBackend = backendExams.map(mapBackendExam);

  const mathExams = mappedBackend.filter(e => e.exam_subjects?.name === 'Toán học');
  const physicsExams = mappedBackend.filter(e => e.exam_subjects?.name === 'Vật lý');
  const chemistryExams = mappedBackend.filter(e => e.exam_subjects?.name === 'Hóa học');
  const biologyExams = mappedBackend.filter(e => e.exam_subjects?.name === 'Sinh học');
  const englishExams = mappedBackend.filter(e => e.exam_subjects?.name === 'Tiếng Anh');
  const aptitudeExams = mappedBackend.filter(e => e.exam_subjects?.name.includes('Đánh giá năng lực') || e.title.includes('HSA') || e.title.includes('ĐGNL'));

  const getMappedId = (subject) => {
    let list = [];
    if (subject === 'Toán học') list = mathExams;
    else if (subject === 'Vật lý') list = physicsExams;
    else if (subject === 'Hóa học') list = chemistryExams;
    else if (subject === 'Sinh học') list = biologyExams;
    else if (subject === 'Tiếng Anh') list = englishExams;
    else list = aptitudeExams;

    if (list.length === 0) return mappedBackend[0]?.id;
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex]?.id;
  };

  const list = [...mappedBackend];

  const schools = [
    'Chuyên Hà Nội - Amsterdam', 'Chuyên Lam Sơn Thanh Hóa', 'Chuyên Phan Bội Châu Nghệ An',
    'Chuyên Lê Hồng Phong Nam Định', 'Chuyên Nguyễn Trãi Hải Dương', 'Chuyên Bắc Ninh',
    'Chuyên Quốc Học Huế', 'Chuyên Lê Quý Đôn Đà Nẵng', 'Chuyên Trần Đại Nghĩa TP.HCM',
    'Chuyên Lương Thế Vinh Đồng Nai', 'Chuyên Hùng Vương Gia Lai', 'Chuyên KHTN Hà Nội',
    'Chuyên Sư Phạm Hà Nội', 'THPT Kim Liên Hà Nội', 'THPT Phan Đình Phùng Hà Nội',
    'THPT Lê Quý Đôn TP.HCM', 'THPT Gia Định TP.HCM', 'THPT Bùi Thị Xuân TP.HCM'
  ];

  const aptitudeTitles = [
    'Đề thi thử Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đợt 401',
    'Đề thi thử Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đợt 402',
    'Đề thi thử Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đợt 403',
    'Đề thi thử Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đợt 404',
    'Đề thi thử Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đợt 405',
    'Đề thi thử Đánh giá năng lực ĐHQG Hà Nội (HSA) - Đợt 406',
    'Đề thi Đánh giá năng lực ĐHQG TP.HCM - Đợt 1',
    'Đề thi Đánh giá năng lực ĐHQG TP.HCM - Đợt 2',
    'Đề thi thử Đánh giá tư duy Đại học Bách Khoa Hà Nội (TSA)'
  ];

  let count = 1000;
  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh'];
  const years = ['2024', '2023', '2022', '2021', '2020'];

  // 1. Generate School Mocks
  for (let year of years) {
    for (let school of schools) {
      for (let subject of subjects) {
        count++;
        const mappedId = getMappedId(subject);
        const examObj = mappedBackend.find(e => e.id === mappedId);
        
        const subjectSlug = getSlug(subject);
        const subjectIcon = getIcon(subject);
        const subjectId = getSubjectId(subject);

        list.push({
          id: String(count),
          title: `Đề thi thử ${subject} THPTQG ${year} - ${school}`,
          subject_id: subjectId,
          year: Number(year),
          exam_code: String(count % 100 + 101),
          exam_type: 'mock',
          source: 'Trường chuyên',
          duration_minutes: subject === 'Toán học' ? 90 : (subject === 'Tiếng Anh' ? 60 : 50),
          total_questions: examObj?.total_questions || 50,
          description: `Đề thi ôn luyện môn ${subject} thi tốt nghiệp THPT Quốc Gia.`,
          status: 'published',
          exam_subjects: {
            id: subjectId,
            name: subject,
            slug: subjectSlug,
            icon: subjectIcon,
            description: `Môn ${subject} ôn thi THPT Quốc Gia`
          },
          attempts_count: 0,
          isGenerated: true,
          dbExamId: mappedId,
          examQuestions: examObj?.examQuestions || []
        });
      }
    }
  }

  // 2. Generate HSA & Aptitude
  for (let i = 0; i < aptitudeTitles.length; i++) {
    count++;
    const mappedId = getMappedId('Đánh giá năng lực');
    const examObj = mappedBackend.find(e => e.id === mappedId);
    
    const subject = 'Đánh giá năng lực';
    const subjectSlug = getSlug(subject);
    const subjectIcon = getIcon(subject);
    const subjectId = getSubjectId(subject);

    list.push({
      id: String(count),
      title: aptitudeTitles[i],
      subject_id: subjectId,
      year: 2024,
      exam_code: String(count % 100 + 101),
      exam_type: 'mock',
      source: 'Trường chuyên',
      duration_minutes: 150,
      total_questions: examObj?.total_questions || 50,
      description: `Đề thi ôn luyện môn ${subject} thi tốt nghiệp THPT Quốc Gia.`,
      status: 'published',
      exam_subjects: {
        id: subjectId,
        name: subject,
        slug: subjectSlug,
        icon: subjectIcon,
        description: `Môn ${subject} ôn thi THPT Quốc Gia`
      },
      attempts_count: 0,
      isGenerated: true,
      dbExamId: mappedId,
      examQuestions: examObj?.examQuestions || []
    });
  }

  // 3. Generate MOET Codes
  const moetSubjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh'];
  const moetYears = ['2024', '2023', '2022', '2021', '2020'];
  const codes = ['102', '103', '104', '105', '106', '107', '108', '202', '203', '204'];

  for (let year of moetYears) {
    for (let subject of moetSubjects) {
      for (let code of codes) {
        count++;
        const mappedId = getMappedId(subject);
        const examObj = mappedBackend.find(e => e.id === mappedId);
        
        const subjectSlug = getSlug(subject);
        const subjectIcon = getIcon(subject);
        const subjectId = getSubjectId(subject);

        list.push({
          id: String(count),
          title: `Đề thi chính thức THPT QG Môn ${subject} ${year} - Mã đề ${code}`,
          subject_id: subjectId,
          year: Number(year),
          exam_code: code,
          exam_type: 'official',
          source: 'Bộ GD&ĐT',
          duration_minutes: subject === 'Toán học' ? 90 : (subject === 'Tiếng Anh' ? 60 : 50),
          total_questions: examObj?.total_questions || 50,
          description: `Đề thi chính thức môn ${subject} năm ${year} của Bộ Giáo dục và Đào tạo.`,
          status: 'published',
          exam_subjects: {
            id: subjectId,
            name: subject,
            slug: subjectSlug,
            icon: subjectIcon,
            description: `Môn ${subject} ôn thi THPT Quốc Gia`
          },
          attempts_count: 0,
          isGenerated: true,
          dbExamId: mappedId,
          examQuestions: examObj?.examQuestions || []
        });
      }
    }
  }

  return list;
};

const inlineLeaderboardKeyframes = `
  @keyframes float-sparkle-inline {
    0% { transform: translateY(0px) translateX(0px) scale(0.6) rotate(0deg); opacity: 0; }
    30% { opacity: 0.8; }
    70% { opacity: 0.8; }
    100% { transform: translateY(-80px) translateX(15px) scale(1.1) rotate(180deg); opacity: 0; }
  }
  @keyframes aura-glow-gold-inline {
    0% { box-shadow: 0 0 15px rgba(245, 196, 83, 0.2); }
    50% { box-shadow: 0 0 35px rgba(245, 196, 83, 0.6); }
    100% { box-shadow: 0 0 15px rgba(245, 196, 83, 0.2); }
  }
  @keyframes aura-glow-silver-inline {
    0% { box-shadow: 0 0 15px rgba(191, 219, 254, 0.25); }
    50% { box-shadow: 0 0 35px rgba(191, 219, 254, 0.65); }
    100% { box-shadow: 0 0 15px rgba(191, 219, 254, 0.25); }
  }
  @keyframes aura-glow-bronze-inline {
    0% { box-shadow: 0 0 15px rgba(254, 215, 170, 0.25); }
    50% { box-shadow: 0 0 35px rgba(254, 215, 170, 0.65); }
    100% { box-shadow: 0 0 15px rgba(254, 215, 170, 0.25); }
  }
  .leaderboard-row-animated-inline {
    opacity: 0;
    transform: translateX(50px);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .leaderboard-row-animated-inline.is-visible {
    opacity: 1;
    transform: translateX(0);
  }
  .leaderboard-top1-card-inline {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .leaderboard-top1-card-inline:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 45px rgba(245, 196, 83, 0.45) !important;
  }
  .leaderboard-top2-card-inline {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .leaderboard-top2-card-inline:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 45px rgba(191, 219, 254, 0.5) !important;
  }
  .leaderboard-top3-card-inline {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .leaderboard-top3-card-inline:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 45px rgba(254, 215, 170, 0.5) !important;
  }
`;

function useIntersectionObserverInline() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return [ref, isVisible];
}

function ScrollAnimatedRowInline({ children, className, style, delay = 0, duration = '0.6s' }) {
  const [ref, isVisible] = useIntersectionObserverInline();

  return (
    <div
      ref={ref}
      className={`${className} leaderboard-row-animated-inline ${isVisible ? 'is-visible' : ''}`}
      style={{
        ...style,
        transitionDuration: duration,
        transitionDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  );
}

function FairyDustInline({ active }) {
  if (!active) return null;
  const particles = [
    { top: '15%', left: '10%', delay: '0s', size: '12px' },
    { top: '35%', left: '85%', delay: '1.2s', size: '14px' },
    { top: '55%', left: '8%', delay: '0.6s', size: '10px' },
    { top: '75%', left: '80%', delay: '2s', size: '13px' },
    { top: '80%', left: '20%', delay: '0.9s', size: '11px' },
    { top: '25%', left: '50%', delay: '0.4s', size: '15px' },
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      {particles.map((p, idx) => (
        <span
          key={idx}
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            fontSize: p.size,
            animation: 'float-sparkle-inline 3.2s ease-in-out infinite',
            animationDelay: p.delay,
            opacity: 0,
            color: idx % 2 === 0 ? '#F5C453' : '#a29bfe'
          }}
        >
          {idx % 3 === 0 ? '✨' : (idx % 3 === 1 ? '⭐' : '🌸')}
        </span>
      ))}
    </div>
  );
}

function InlineLeaderboardTab({ currentUser }) {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [province, setProvince] = useState('');
  const [search, setSearch] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const filters = { page, limit: 10 };
        if (grade) filters.grade = grade;
        if (subject) filters.subject = subject;
        if (province) filters.province = province;
        if (search) filters.search = search;

        const res = await api.getAdvancedLeaderboard(filters);
        if (active && res) {
          setRankings(res.rankings || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('Lỗi tải bảng xếp hạng:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRankings();
    return () => { active = false; };
  }, [grade, subject, province, search, page]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const getStreakDisplay = (student) => {
    if (subject) {
      return `🔥 ${student.subjectStreak || 0} ngày (${subject.toUpperCase()})`;
    }
    return `🔥 ${student.streak || 0} ngày`;
  };

  const renderAvatar = (avatar, name, size = 64, borderSize = 3) => {
    const isUrl = typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('data:'));
    
    if (isUrl) {
      return (
        <img
          src={avatar}
          alt={name}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            border: `${borderSize}px solid #000`,
            objectFit: 'cover',
            display: 'inline-block',
            margin: size > 40 ? '14px 0' : '0',
            boxShadow: '1.5px 1.5px 0px #000'
          }}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'HS')}&background=6c5ce7&color=fff`;
          }}
        />
      );
    }

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: size > 40 ? '18px' : '11px',
        border: `${borderSize}px solid #000`,
        margin: size > 40 ? '14px 0' : '0',
        boxShadow: '1.5px 1.5px 0px #000',
        textTransform: 'uppercase'
      }}>
        {avatar || name?.substring(0, 2).toUpperCase() || 'HS'}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{inlineLeaderboardKeyframes}</style>

      {/* Filter Box */}
      <div className="card animate-slide-up" style={{ 
        border: '1.5px solid #E2E8F0', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)', 
        padding: '20px', 
        background: '#FCF9F2', 
        borderRadius: '16px',
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '12px', 
        alignItems: 'center' 
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            type="text"
            className="input-custom"
            placeholder="Tìm học sinh..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', fontWeight: 'bold' }}
          />
        </div>

        <div style={{ flex: '0 0 130px' }}>
          <select
            className="select-custom"
            value={grade}
            onChange={(e) => { setGrade(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', fontWeight: 'bold', background: '#FFF' }}
          >
            <option value="">Tất cả Khối</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>
        </div>

        <div style={{ flex: '0 0 150px' }}>
          <select
            className="select-custom"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', fontWeight: 'bold', background: '#FFF' }}
          >
            <option value="">Tất cả Môn</option>
            <option value="Toán học">Toán học</option>
            <option value="Vật lí">Vật lí</option>
            <option value="Hóa học">Hóa học</option>
            <option value="Sinh học">Sinh học</option>
            <option value="Lịch sử">Lịch sử</option>
            <option value="Địa lí">Địa lí</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="GDCD">GDCD</option>
          </select>
        </div>

        <div style={{ flex: '0 0 160px' }}>
          <select
            className="select-custom"
            value={province}
            onChange={(e) => { setProvince(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', fontWeight: 'bold', background: '#FFF' }}
          >
            <option value="">Tất cả Tỉnh thành</option>
            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nghệ An', 'Thanh Hóa', 'Đồng Nai', 'Bình Dương', 'Quảng Ninh'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', fontSize: '15px', fontWeight: 'bold', color: '#64748B' }}>
          Đang tải bảng xếp hạng chiến thần học tập... 🏆
        </div>
      ) : (
        <>
          {/* Top 3 High-contrast 3D Podium Cards */}
          {top3.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '24px',
              margin: '40px 0 24px 0',
              flexWrap: 'wrap',
              position: 'relative'
            }}>
              {(() => {
                const podiumSpots = [];
                if (top3.length === 3) {
                  podiumSpots.push({ student: top3[1], index: 1 }); // Rank 2 (Left)
                  podiumSpots.push({ student: top3[0], index: 0 }); // Rank 1 (Center)
                  podiumSpots.push({ student: top3[2], index: 2 }); // Rank 3 (Right)
                } else {
                  top3.forEach((s, i) => podiumSpots.push({ student: s, index: i }));
                }

                return podiumSpots.map(({ student, index }) => {
                  const configs = [
                    { 
                      bg: '#FED7AA', 
                      border: '2px solid #F5C453', 
                      medal: '👑', 
                      label: 'CHIẾN THẦN TOÀN NĂNG', 
                      textColor: '#B45309',
                      height: '350px',
                      podiumHeight: '80px',
                      podiumBg: 'linear-gradient(180deg, #F5C453 0%, #D97706 100%)',
                      shadow: '0 12px 30px rgba(245, 196, 83, 0.25)',
                      glowClass: 'leaderboard-top1-card-inline',
                      glowStyle: { animation: 'aura-glow-gold-inline 4s ease-in-out infinite' }
                    },
                    { 
                      bg: '#FED7AA', 
                      border: '2px solid #94A3B8', 
                      medal: '🥈', 
                      label: 'TINH ANH HỌC THUẬT', 
                      textColor: '#475569',
                      height: '310px',
                      podiumHeight: '60px',
                      podiumBg: 'linear-gradient(180deg, #94A3B8 0%, #64748B 100%)',
                      shadow: '0 8px 20px rgba(148, 163, 184, 0.15)',
                      glowClass: 'leaderboard-top2-card-inline',
                      glowStyle: { animation: 'aura-glow-silver-inline 4s ease-in-out infinite' }
                    },
                    { 
                      bg: '#FED7AA', 
                      border: '2px solid #F97316', 
                      medal: '🥉', 
                      label: 'CAO THỦ ẨN DANH', 
                      textColor: '#C2410C',
                      height: '280px',
                      podiumHeight: '40px',
                      podiumBg: 'linear-gradient(180deg, #F97316 0%, #C2410C 100%)',
                      shadow: '0 6px 15px rgba(249, 115, 22, 0.12)',
                      glowClass: 'leaderboard-top3-card-inline',
                      glowStyle: { animation: 'aura-glow-bronze-inline 4s ease-in-out infinite' }
                    }
                  ][index] || { bg: '#FED7AA', border: '1px solid #E2E8F0', medal: '⭐', label: 'Vinh danh', textColor: '#64748B', height: '240px', podiumHeight: '30px', podiumBg: '#E2E8F0', shadow: 'none', glowClass: '', glowStyle: {} };

                  return (
                    <ScrollAnimatedRowInline
                      key={student.userId}
                      className={configs.glowClass}
                      delay={index * 0.15}
                      duration="1.5s"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '280px',
                        position: 'relative',
                        zIndex: index === 0 ? 10 : 1,
                        ...configs.glowStyle
                      }}
                    >
                      <FairyDustInline active={index === 0} />

                      <div
                        style={{
                          background: configs.bg,
                          border: configs.border,
                          borderRadius: '24px',
                          padding: '24px 20px 16px 20px',
                          textAlign: 'center',
                          boxShadow: configs.shadow,
                          width: '100%',
                          minHeight: configs.height,
                          height: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          top: '-12px',
                          background: '#000',
                          color: '#fff',
                          padding: '3px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '900',
                          border: '1.5px solid ' + (index === 0 ? '#F5C453' : '#000')
                        }}>
                          Hạng {student.rank}
                        </span>

                        <div style={{ fontSize: '32px', marginTop: '6px' }}>{configs.medal}</div>

                        <h4 style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: configs.textColor, margin: '2px 0 10px 0', letterSpacing: '0.05em' }}>
                          {configs.label}
                        </h4>

                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                          {index === 0 && (
                            <span style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%) rotate(-10deg)', fontSize: '20px', zIndex: 11 }}>👑</span>
                          )}
                          {renderAvatar(student.avatar, student.name, index === 0 ? 76 : 64, index === 0 ? 3 : 2)}
                        </div>

                        <div style={{ width: '100%', marginBottom: '10px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B', margin: '0 0 4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {student.name}
                          </h4>
                          <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 6px 0', fontWeight: '500' }}>
                            Khối {student.grade || 'Chưa rõ'} • Tỉnh: {student.province || 'Chưa cập nhật'}
                          </p>
                        </div>

                        <div style={{ 
                          width: '100%', 
                          background: 'rgba(255,255,255,0.7)', 
                          border: '1px solid rgba(0,0,0,0.05)', 
                          borderRadius: '12px', 
                          padding: '8px 12px', 
                          fontSize: '12.5px', 
                          fontWeight: '800', 
                          color: '#1E293B',
                          boxSizing: 'border-box'
                        }}>
                          <span>XP: <strong style={{ color: '#6c5ce7', fontSize: '13.5px' }}>{student.xp.toLocaleString()}</strong></span>
                          <span style={{ color: '#94A3B8', margin: '0 6px' }}>|</span>
                          <span>{getStreakDisplay(student)}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: configs.podiumBg,
                          width: '85%',
                          height: configs.podiumHeight,
                          borderTopLeftRadius: '12px',
                          borderTopRightRadius: '12px',
                          boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.25), 0 4px 15px rgba(0,0,0,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: '900',
                          fontSize: '24px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          border: '1.5px solid rgba(0,0,0,0.15)',
                          borderBottom: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        {student.rank}
                      </div>
                    </ScrollAnimatedRowInline>
                  );
                });
              })()}
            </div>
          )}

          {/* Table rankings - Showing starting from top 4 onwards in pastel theme */}
          <div className="card animate-slide-up" style={{
            border: '1px solid #F1F5F9',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
            borderRadius: '20px',
            padding: '24px',
            background: '#A7F3D0'
          }}>
            {rest.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '14px', color: '#64748B' }}>
                Không tìm thấy học sinh nào phù hợp từ vị trí thứ 4 trở đi. 🔍
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '800px' }}>
                {/* Custom Grid Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 2fr 1fr 1.2fr 1.5fr 1.2fr',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderBottom: '2.5px solid #F1F5F9',
                  color: '#475569',
                  fontWeight: '900',
                  fontSize: '12.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>Hạng</div>
                  <div>Học sinh</div>
                  <div>Khối lớp</div>
                  <div>Tỉnh thành</div>
                  <div>Chuỗi học</div>
                  <div style={{ textAlign: 'right' }}>Tổng điểm XP</div>
                </div>

                {/* Custom Grid Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rest.map((student, idx) => (
                    <ScrollAnimatedRowInline
                      key={student.userId}
                      className="leaderboard-row"
                      delay={idx * 0.05}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 2fr 1fr 1.2fr 1.5fr 1.2fr',
                        alignItems: 'center',
                        padding: '16px 24px',
                        background: student.userId === currentUser?.id 
                          ? '#EEF2FF' 
                          : '#FFFFFF',
                        fontWeight: student.userId === currentUser?.id ? 'bold' : 'normal',
                          color: '#1E293B',
                          borderRadius: '16px',
                          border: '1.5px solid #E2E8F0',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.015)',
                          transition: 'all 0.25s ease',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Rank Column */}
                        <div>
                          <span style={{
                            fontWeight: '900',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: '1px solid #E2E8F0',
                            background: 'transparent',
                            color: '#475569'
                          }}>
                            {student.rank}
                          </span>
                        </div>

                        {/* Student Info Column */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {renderAvatar(student.avatar, student.name, 36, 1.5)}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <div style={{ fontWeight: '900', fontSize: '14px', color: '#1E293B', whiteSpace: 'nowrap' }}>{student.name}</div>
                              {student.userId === currentUser?.id && (
                                <span style={{ fontSize: '10px', background: '#00b894', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '900', marginTop: '2px', display: 'inline-block' }}>BẠN</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Grade Column */}
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>
                          Khối {student.grade || 'Chưa cập nhật'}
                        </div>

                        {/* Province Column */}
                        <div style={{ color: '#64748B', fontSize: '13px' }}>
                          📍 {student.province || 'Chưa rõ'}
                        </div>

                        {/* Streak Column */}
                        <div style={{ fontWeight: '800', color: '#ff9f43', fontSize: '13px' }}>
                          {getStreakDisplay(student)}
                        </div>

                        {/* XP Column */}
                        <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '14.5px', color: '#1E293B' }}>
                          {student.xp.toLocaleString()} XP
                        </div>
                      </ScrollAnimatedRowInline>
                    ))}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  style={{
                    border: '1px solid #CBD5E1',
                    background: page === 1 ? '#F1F5F9' : '#FFFFFF',
                    color: page === 1 ? '#94A3B8' : '#1E293B',
                    fontWeight: '800',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  ◀ Trang trước
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontWeight: '900', fontSize: '13px' }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{
                    border: '2px solid #000',
                    background: page === totalPages ? 'var(--border)' : 'var(--bg-card)',
                    color: '#000',
                    fontWeight: '800',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    boxShadow: page === totalPages ? 'none' : '2px 2px 0px #000'
                  }}
                >
                  Trang sau ▶
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  // Global Application States
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('current_user')) || null);
  const [role, setRole] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('current_user') || 'null');
    return saved?.role?.toLowerCase() || 'guest';
  });
  const effectiveRole = role;
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [activeTab, setActiveTab] = useState('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

  // Custom SPA Router State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Announcement popup states
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [sessionDismissedAnnouncements, setSessionDismissedAnnouncements] = useState([]);

  // Page mapper helper for targetPages matching
  const getCurrentPageName = (route) => {
    if (!route) return 'Home';
    if (route.route === 'landing') return 'Home';
    if (route.route === 'public-courses' || route.route === 'public-course-detail' || route.route === 'learn') {
      return 'Courses';
    }
    if (route.route === 'dashboard' && route.tab === 'courses') {
      return 'Courses';
    }
    if (
      route.route === 'public-mock-exams' || 
      route.route === 'public-mock-exam-detail' || 
      route.route === 'public-mock-exam-taking' || 
      route.route === 'public-mock-exam-result'
    ) {
      return 'Practice';
    }
    if (route.route === 'dashboard' && route.tab === 'tests') {
      return 'Practice';
    }
    if (route.route === 'public-exam-bank') return 'Exam';
    if (route.route === 'dashboard' && route.tab === 'library') {
      return 'Exam';
    }
    if (route.route === 'public-ai-tutor' || route.route === 'public-flashcards') return 'AI Coach';
    if (route.route === 'dashboard' && ['ai-qa', 'path', 'ai-chat'].includes(route.tab)) {
      return 'AI Coach';
    }
    if (route.route === 'dashboard' && route.tab === 'settings') return 'Profile';
    if (route.route === 'dashboard' && route.tab === 'home') return 'Dashboard';
    return 'Home';
  };

  // Fetch active announcements
  useEffect(() => {
    const fetchActiveAnnouncements = async () => {
      try {
        const uRole = currentUser?.role ? currentUser.role.toUpperCase() : 'GUEST';
        const res = await api.getActiveAnnouncement(uRole);
        if (res && Array.isArray(res)) {
          setActiveAnnouncements(res);
        } else if (res && res.data) {
          setActiveAnnouncements(res.data);
        }
      } catch (err) {
        console.error('[Fetch Active Announcements Error]:', err);
      }
    };
    fetchActiveAnnouncements();
  }, [currentUser]);

  // Determine popup display matching priority, role, page path, hide_until
  useEffect(() => {
    if (!activeAnnouncements || activeAnnouncements.length === 0) {
      setCurrentAnnouncement(null);
      return;
    }

    const pageName = getCurrentPageName(parsedRoute);
    const uRole = currentUser?.role ? currentUser.role.toUpperCase() : 'GUEST';

    const eligible = activeAnnouncements.filter(ann => {
      // 1. Session dismissed
      if (sessionDismissedAnnouncements.includes(ann.id)) {
        return false;
      }

      // 2. Local storage hide_until
      const hideUntilStr = localStorage.getItem(`announcement_${ann.id}_hide_until`);
      if (hideUntilStr) {
        const hideUntil = Number(hideUntilStr);
        if (Date.now() < hideUntil) {
          return false;
        }
      }

      // 3. Target roles check
      const roleMatch = ann.targetRoles.includes('EVERYONE') || ann.targetRoles.includes(uRole);
      if (!roleMatch) return false;

      // 4. Check target pages
      const pageMatch = ann.targetPages.includes('All Pages') || ann.targetPages.includes(pageName);
      if (!pageMatch) return false;

      return true;
    });

    if (eligible.length > 0) {
      eligible.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setCurrentAnnouncement(eligible[0]);
    } else {
      setCurrentAnnouncement(null);
    }
  }, [activeAnnouncements, currentPath, currentUser, sessionDismissedAnnouncements]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    const handleAuthRedirect = (e) => {
      setActiveTab(e.detail.mode);
    };
    const handleAuthLogout = () => {
      handleLogout();
      showToast.current?.('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 'warning');
    };
    const handleMaintenance = () => {
      const savedUser = JSON.parse(localStorage.getItem('current_user') || 'null');
      if (savedUser?.role !== 'admin' && savedUser?.role !== 'ADMIN') {
        setIsMaintenanceActive(true);
        if (savedUser) {
          handleLogout();
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('edupath-auth-redirect', handleAuthRedirect);
    window.addEventListener('edupath-auth-logout', handleAuthLogout);
    window.addEventListener('edupath-maintenance', handleMaintenance);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('edupath-auth-redirect', handleAuthRedirect);
      window.removeEventListener('edupath-auth-logout', handleAuthLogout);
      window.removeEventListener('edupath-maintenance', handleMaintenance);
    };
  }, []);

  // Sync role with currentUser state changes
  useEffect(() => {
    if (currentUser) {
      const uRole = currentUser.role.toLowerCase();
      setRole(uRole);
      if (isMaintenanceActive && uRole !== 'admin') {
        handleLogout();
        showToast.current?.('Hệ thống đang bảo trì. Chỉ Quản trị viên mới được phép truy cập!', 'warning');
      }
    } else {
      setRole('guest');
    }
  }, [currentUser, isMaintenanceActive]);

  // Verify JWT and sync profile with backend on page load
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const profile = await api.getMe();
          if (profile) {
            const mappedUser = {
              ...profile,
              name: profile.fullName,
              avatar: profile.avatarUrl || 'MA',
              role: profile.role.toLowerCase(),
              combo: profile.subjectGroup || 'A01 (Toán – Lý – Anh)',
              grade: '12',
              unlockedCourses: profile.enrollments?.map(e => e.courseId) || []
            };
            setCurrentUser(mappedUser);
            localStorage.setItem('current_user', JSON.stringify(mappedUser));
          }
        } catch (err) {
          console.error('[Verify User Error] Session expired or invalid token:', err);
          handleLogout();
        }
      }
    };
    verifyUser();
  }, []);

  const navigateTo = (path, state = null) => {
    window.history.pushState(state || {}, '', path);
    setCurrentPath(path);
  };

  const getParsedRoute = () => {
    if (currentPath === '/admin' || currentPath === '/admin/') {
      return { route: 'admin', tab: 'stats' };
    }
    if (currentPath.startsWith('/admin/')) {
      const tab = currentPath.substring(7).replace(/\/$/, '');
      if (tab === 'roles') {
        return { route: 'admin', tab: 'stats' };
      }
      return { route: 'admin', tab: tab };
    }

    if (currentPath === '/teacher' || currentPath === '/teacher/') {
      return { route: 'teacher', tab: 'home' };
    }
    if (currentPath.startsWith('/teacher/')) {
      const tab = currentPath.substring(9).replace(/\/$/, '');
      return { route: 'teacher', tab: tab };
    }

    if (currentPath === '/devtools') {
      return { route: 'devtools' };
    }

    if (currentPath === '/dashboard' || currentPath === '/dashboard/' || currentPath === '/user' || currentPath === '/user/') {
      return { route: 'dashboard', tab: 'home' };
    }
    if (currentPath.startsWith('/dashboard/')) {
      const sub = currentPath.substring(11).replace(/\/$/, '');
      let tab = sub;
      if (sub === 'mock-exams') tab = 'tests';
      if (sub === 'ai-tutor') tab = 'ai-qa';
      if (sub === 'flashcards') tab = 'path';
      if (sub === 'exam-bank') tab = 'library';
      return { route: 'dashboard', tab: tab };
    }
    if (currentPath.startsWith('/user/')) {
      const sub = currentPath.substring(6).replace(/\/$/, '');
      let tab = sub;
      if (sub === 'mock-exams') tab = 'tests';
      if (sub === 'ai-tutor') tab = 'ai-qa';
      if (sub === 'flashcards') tab = 'path';
      if (sub === 'exam-bank') tab = 'library';
      return { route: 'dashboard', tab: tab };
    }

    const learnMatch = currentPath.match(/^\/learn\/(\d+)(?:\/lesson\/(\d+))?$/);
    if (learnMatch) {
      return { route: 'learn', courseId: learnMatch[1], lessonId: learnMatch[2] || null };
    }

    if (currentPath.startsWith('/confirm-email')) {
      return { route: 'confirm-email' };
    }

    if (currentPath === '/courses') {
      return { route: 'public-courses' };
    }
    if (currentPath === '/leaderboard' || currentPath === '/leaderboard/') {
      return { route: 'public-leaderboard' };
    }
    const courseMatch = currentPath.match(/^\/courses\/(\d+)$/);
    if (courseMatch) {
      return { route: 'public-course-detail', courseId: courseMatch[1] };
    }
    if (currentPath === '/mock-exams') {
      return { route: 'public-mock-exams' };
    }
    const mockExamMatch = currentPath.match(/^\/mock-exams\/([^/]+)$/);
    if (mockExamMatch && !currentPath.includes('/start') && !currentPath.includes('/result/')) {
      return { route: 'public-mock-exam-detail', examId: mockExamMatch[1] };
    }
    const mockExamTakingMatch = currentPath.match(/^\/mock-exams\/([^/]+)\/start$/);
    if (mockExamTakingMatch) {
      return { route: 'public-mock-exam-taking', examId: mockExamTakingMatch[1] };
    }
    const mockExamResultMatch = currentPath.match(/^\/mock-exams\/([^/]+)\/result\/([^/]+)$/);
    if (mockExamResultMatch) {
      return { route: 'public-mock-exam-result', examId: mockExamResultMatch[1], attemptId: mockExamResultMatch[2] };
    }

    if (currentPath.startsWith('/ai-tutor') || currentPath.startsWith('/ai tutor') || currentPath.startsWith('/ai%20tutor')) {
      return { route: 'public-ai-tutor' };
    }

    if (currentPath.startsWith('/flashcards')) {
      return { route: 'public-flashcards' };
    }

    if (currentPath === '/exam-bank' || currentPath === '/exam bank' || currentPath === '/exam%20bank') {
      return { route: 'public-exam-bank' };
    }

    if (currentPath === '/forum' || currentPath === '/community' || currentPath === '/direct') {
      return { route: 'public-forum' };
    }

    return { route: 'landing' };
  };

  const parsedRoute = getParsedRoute();

  // Auto-collapse sidebar on key study pages to enter fullscreen
  useEffect(() => {
    if (parsedRoute.route === 'dashboard' && ['path', 'ai-qa', 'library'].includes(parsedRoute.tab)) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, [parsedRoute.tab, parsedRoute.route]);



  const handleSetAdminActiveTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'stats') {
      navigateTo('/admin');
    } else {
      navigateTo(`/admin/${tab}`);
    }
  };

  useEffect(() => {
    const routeInfo = getParsedRoute();
    if (routeInfo.route === 'admin' && routeInfo.tab) {
      setActiveTab(routeInfo.tab);
    }
  }, [currentPath]);

  // Relational Tables databases in localStorage
  const [usersList, setUsersList] = useState(() => {
    let list = JSON.parse(localStorage.getItem('users_list'));
    if (!list || !Array.isArray(list)) {
      list = initialUsers;
    }
    const adminExists = list.find(u => u.email && u.email.toLowerCase() === 'tranvanthuan2005tt@gmail.com');
    if (!adminExists) {
      list.push({
        id: 103,
        name: 'Trần Văn Thuần',
        email: 'Tranvanthuan2005tt@gmail.com',
        password: 'admin123',
        role: 'admin',
        avatar: 'AD',
        isBanned: false,
        status: 'active'
      });
    } else {
      list.forEach(u => {
        if (u.email && u.email.toLowerCase() === 'tranvanthuan2005tt@gmail.com') {
          u.role = 'admin';
          u.status = 'active';
        }
      });
    }
    return list;
  });
  const [courses, setCourses] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [attemptsHistory, setAttemptsHistory] = useState([]);
  const [questionBank, setQuestionBank] = useState(() => JSON.parse(localStorage.getItem('app_questions')) || initialQuestions);
  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('app_submissions');
    if (saved) return JSON.parse(saved);
    
    // Generate dynamic pre-seeded submissions for the last 7 days relative to today
    const list = [];
    const topics = [
      { name: "Đề thi thử Toán THPTQG 2026", subject: "Toán học", failed: ["Hàm số Mũ & Lôgarit", "Hàm số & Đồ thị"] },
      { name: "Đề thi thử Vật Lý THPTQG 2026", subject: "Vật lý", failed: ["Chương I: Dao động cơ học"] },
      { name: "Đề thi thử Hóa học THPTQG 2026", subject: "Hóa học", failed: ["Chương I: Este - Lipit"] },
      { name: "Đề thi thử Tiếng Anh THPTQG 2026", subject: "Tiếng Anh", failed: ["Ngữ pháp cốt lõi"] }
    ];

    for (let i = 0; i < 20; i++) {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(i / 3)); // 2-3 attempts per day
      const dateStr = d.toISOString().split('T')[0];
      const topicInfo = topics[i % topics.length];
      const score = parseFloat((6.0 + Math.random() * 3.5).toFixed(1)); // score between 6.0 and 9.5
      const total = 50;
      const correct = Math.round((score / 10) * total);
      
      list.push({
        id: 1000 + i,
        email: "student@gmail.com",
        testName: topicInfo.name,
        score: score,
        correct: correct,
        total: total,
        failedTopics: score < 8 ? topicInfo.failed : [],
        date: dateStr
      });
    }
    return list;
  });

  // Dynamic Leads List state lifted from AdminDashboard
  const [leadsList, setLeadsList] = useState(() => {
    return JSON.parse(localStorage.getItem('admin_leads')) || [
      {
        id: 1,
        name: "Lê Tuấn Tú",
        phone: "0912345678",
        email: "tuantu@gmail.com",
        target: "Toán - Lý - Hóa (A00) • Mục tiêu 27 điểm",
        registeredDate: "2026-06-15",
        status: "Chờ tư vấn"
      },
      {
        id: 2,
        name: "Nguyễn Hương Giang",
        phone: "0987654321",
        email: "giangnguyen@gmail.com",
        target: "Toán - Lý - Anh (A01) • Mục tiêu 26.5 điểm",
        registeredDate: "2026-06-14",
        status: "Đã liên hệ"
      },
      {
        id: 3,
        name: "Trần Minh Anh",
        phone: "0905678912",
        email: "minhanh@gmail.com",
        target: "Toán - Văn - Anh (D01) • Mục tiêu 28 điểm",
        registeredDate: "2026-06-13",
        status: "Thành công"
      },
      {
        id: 4,
        name: "Phạm Quốc Bảo",
        phone: "0971223344",
        email: "baopq@gmail.com",
        target: "Toán - Hóa - Sinh (B00) • Mục tiêu Y Hà Nội",
        registeredDate: "2026-06-12",
        status: "Chờ tư vấn"
      }
    ];
  });



  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('app_notifications')) || [
    { id: 1, text: "Chào mừng bạn gia nhập EduPath AI! Hãy bắt đầu khám phá lộ trình của bạn.", time: "Vừa xong", read: false }
  ]);

  const handleClearNotifications = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      showToast.current?.('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
    } catch (err) {
      console.error('[Clear Notifications Error]', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read && !notif.isRead) {
        await api.markNotificationAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, isRead: true } : n));
      }
      if (notif.link) {
        navigateTo(notif.link);
      }
    } catch (err) {
      console.error('[Notification Click Error]', err);
    }
  };

  function formatRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Vừa xong';
    }
  }

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.getNotifications({ limit: 20 });
        if (res && res.notifications) {
          setNotifications(res.notifications.map(n => ({
            id: n.id,
            text: n.message,
            title: n.title,
            message: n.message,
            read: n.isRead,
            isRead: n.isRead,
            type: n.type,
            category: n.category,
            icon: n.icon,
            link: n.link,
            time: formatRelativeTime(n.createdAt)
          })));
        }
      } catch (err) {
        console.error('Lỗi lấy thông báo:', err);
      }
    };
    fetchNotifications();

    const socket = io(API_BASE);

    socket.on('connect', () => {
      console.log('[Socket] Connected to server in App.jsx');
      socket.emit('join_user_room', currentUser.id);
    });

    socket.on('notification_received', (notif) => {
      console.log('[Socket] Real-time notification received:', notif);
      setNotifications(prev => [
        {
          id: notif.id,
          text: notif.message,
          title: notif.title,
          message: notif.message,
          read: notif.isRead,
          isRead: notif.isRead,
          type: notif.type,
          category: notif.category,
          icon: notif.icon,
          link: notif.link,
          time: 'Vừa xong'
        },
        ...prev
      ]);

      const typeStyleMap = {
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error',
        INFO: 'info'
      };
      const toastType = typeStyleMap[notif.type] || 'info';
      showToast.current?.(`${notif.icon ? notif.icon + ' ' : ''}${notif.title}: ${notif.message}`, toastType);

      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

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
  const [featureFlags, setFeatureFlags] = useState([]);

  // View state controllers
  const [activeCourseDetails, setActiveCourseDetails] = useState(null);
  const [activeTestSimulator, setActiveTestSimulator] = useState(null);
  const [activeOCRScanner, setActiveOCRScanner] = useState(null);
  const isEffectiveFullscreen = isFullscreen || (role === 'student' && parsedRoute.route === 'dashboard' && !!activeTestSimulator);
  const [examFilterSubject, setExamFilterSubject] = useState('All');
  const [examFilterYear, setExamFilterYear] = useState('All');
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [examCategory, setExamCategory] = useState('All');
  const [pageOfficial, setPageOfficial] = useState(1);
  const [pageMock, setPageMock] = useState(1);
  const [pageAptitude, setPageAptitude] = useState(1);

  useEffect(() => {
    setPageOfficial(1);
    setPageMock(1);
    setPageAptitude(1);
  }, [examFilterSubject, examFilterYear, examSearchQuery, examCategory]);

  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [paymentSuccessRedirect, setPaymentSuccessRedirect] = useState(false);
  const [cartCourses, setCartCourses] = useState(() => {
    const user = localStorage.getItem('current_user');
    if (!user) return [];
    return JSON.parse(localStorage.getItem('app_cart_courses')) || [];
  });
  const [showUpgradePRO, setShowUpgradePRO] = useState(false);

  const handleAddToCart = (course) => {
    if (!currentUser) {
      showToast.current?.('Vui lòng đăng nhập để thêm khóa học vào giỏ hàng!', 'warning');
      navigateTo('/');
      setActiveTab('login');
      return;
    }
    const exists = cartCourses.some(c => c.id === course.id);
    if (exists) {
      showToast.current?.(`Khóa học "${course.title}" đã có trong giỏ hàng rồi!`, 'warning');
      return;
    }
    const updated = [...cartCourses, course];
    setCartCourses(updated);
    localStorage.setItem('app_cart_courses', JSON.stringify(updated));
    showToast.current?.(`Đã thêm khóa học "${course.title}" vào giỏ hàng!`, 'success');
  };

  const handleCheckoutCourse = (course) => {
    if (!currentUser) {
      showToast.current?.('Vui lòng đăng nhập để mua khóa học!', 'warning');
      navigateTo('/');
      setActiveTab('login');
      return;
    }
    const exists = cartCourses.some(c => c.id === course.id);
    let updated = cartCourses;
    if (!exists) {
      updated = [...cartCourses, course];
      setCartCourses(updated);
      localStorage.setItem('app_cart_courses', JSON.stringify(updated));
    }
    setCheckoutCourse(course);
  };

  // Settings-specific local states
  const [settingsName, setSettingsName] = useState('');
  const [settingsAvatar, setSettingsAvatar] = useState('');
  const [settingsDob, setSettingsDob] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsCity, setSettingsCity] = useState('');
  const [settingsSchool, setSettingsSchool] = useState('');
  const [settingsCombo, setSettingsCombo] = useState('');
  const [settingsTargetScore, setSettingsTargetScore] = useState(25.0);
  const [settingsTargetUniversity, setSettingsTargetUniversity] = useState('');
  const [settingsNotifEmail, setSettingsNotifEmail] = useState(true);
  const [settingsNotifInApp, setSettingsNotifInApp] = useState(true);
  const [settingsLinkedFb, setSettingsLinkedFb] = useState(false);
  const [settingsLinkedGg, setSettingsLinkedGg] = useState(false);

  // Password change states in Settings
  const [settingsOldPass, setSettingsOldPass] = useState('');
  const [settingsNewPass, setSettingsNewPass] = useState('');
  const [settingsConfirmNewPass, setSettingsConfirmNewPass] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = useRef(null);
  showToast.current = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  };
  useEffect(() => {
    const handler = (e) => showToast.current(e.detail.message, e.detail.type);
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  // AI feedback modal
  const [aiFeedbackModal, setAiFeedbackModal] = useState(null);

  // Sync settings states when current user changes or tab is settings
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setResetToken(token);
      setActiveTab('reset-password');
      setRole('guest');
    }
  }, []);

  // Redirect guest users away from mock exams
  useEffect(() => {
    if ((role === 'guest' || !currentUser) && (parsedRoute.route.startsWith('mock-') || parsedRoute.route.startsWith('public-mock-'))) {
      showToast.current?.('Vui lòng đăng nhập để sử dụng chức năng thi thử!', 'warning');
      navigateTo('/');
      setActiveTab('login');
    }
  }, [currentUser?.id, role, parsedRoute.route]);

  // Redirect guest users away from leaderboard, and redirect logged-in users away from dashboard leaderboard
  useEffect(() => {
    if ((role === 'guest' || !currentUser) && parsedRoute.route === 'public-leaderboard') {
      showToast.current?.('Vui lòng đăng nhập để xem bảng xếp hạng học tập!', 'warning');
      navigateTo('/');
      setActiveTab('login');
    } else if (parsedRoute.route === 'dashboard' && parsedRoute.tab === 'leaderboard') {
      navigateTo('/leaderboard');
    }
  }, [currentUser?.id, role, parsedRoute.route, parsedRoute.tab]);

  // Guard dashboard routes and redirect to home if not logged in
  useEffect(() => {
    if ((role === 'guest' || !currentUser) && parsedRoute.route === 'dashboard') {
      navigateTo('/');
    }
  }, [currentUser?.id, role, parsedRoute.route]);

  // Redirect teachers visiting /dashboard routes to /teacher routes
  useEffect(() => {
    if (currentUser && role === 'teacher' && parsedRoute.route === 'dashboard') {
      const tab = parsedRoute.tab || 'home';
      navigateTo(`/teacher/${tab}`);
    }
  }, [currentUser?.id, role, parsedRoute.route, parsedRoute.tab]);

  // Auto-redirect logged-in admin/teacher away from student dashboard routes to their respective dashboards
  useEffect(() => {
    if (currentUser) {
      const lowercaseRole = currentUser.role?.toLowerCase() || role;
      if (lowercaseRole === 'admin' && !currentPath.startsWith('/admin') && currentPath !== '/' && currentPath !== '/devtools') {
        navigateTo('/admin');
      } else if (lowercaseRole === 'teacher' && !currentPath.startsWith('/teacher') && !currentPath.startsWith('/dashboard') && currentPath !== '/' && currentPath !== '/devtools') {
        navigateTo('/teacher');
      }
    }
  }, [currentUser?.id, role, currentPath]);

  useEffect(() => {
    if (currentUser) {
      setSettingsName(currentUser.name || '');
      setSettingsAvatar(currentUser.avatar || 'MA');
      setSettingsDob(currentUser.dob || '2008-01-01');
      setSettingsPhone(currentUser.phone || '');
      setSettingsCity(currentUser.city || 'Hà Nội');
      setSettingsSchool(currentUser.school || '');
      setSettingsCombo(currentUser.combo || 'A01 (Toán – Lý – Anh)');
      setSettingsTargetScore(currentUser.targetScore || 25.0);
      setSettingsTargetUniversity(currentUser.targetUniversity || '');
      setSettingsNotifEmail(currentUser.notificationsEnabled !== false);
      setSettingsNotifInApp(currentUser.inAppAlertsEnabled !== false);
      setSettingsLinkedFb(!!currentUser.linkedFacebook);
      setSettingsLinkedGg(!!currentUser.linkedGoogle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, activeTab]);

  // Guard admin routes and redirect to login if not authenticated with real credentials
  useEffect(() => {
    if (currentPath.startsWith('/admin')) {
      if (!currentUser || currentUser.role?.toLowerCase() !== 'admin') {
        showToast.current?.('Vui lòng đăng nhập tài khoản Quản trị viên!', 'warning');
        navigateTo('/');
        setActiveTab('login');
      } else {
        if (role !== 'admin') setRole('admin');
      }
    }
  }, [currentPath, role, currentUser?.id]);

  // Sync state data to localStorage
  useEffect(() => {
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('users_list', JSON.stringify(usersList));
    localStorage.setItem('app_courses', JSON.stringify(courses));
    localStorage.setItem('app_questions', JSON.stringify(questionBank));
    localStorage.setItem('app_submissions', JSON.stringify(submissions));
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
    localStorage.setItem('app_logs', JSON.stringify(systemLogs));
    localStorage.setItem('app_approvals', JSON.stringify(courseApprovals));
    localStorage.setItem('app_forum_posts', JSON.stringify(forumPosts));
    localStorage.setItem('admin_leads', JSON.stringify(leadsList));
  }, [currentUser, role, theme, usersList, courses, questionBank, submissions, notifications, systemLogs, courseApprovals, forumPosts, leadsList]);

  // Dark theme trigger
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  // Sync live backend data if logged in
  const fetchInitialData = async () => {
    if (!currentUser) return;

    // Fetch feature flags for routing controls
    try {
      const flags = await api.getFeatureFlags();
      if (flags) setFeatureFlags(flags);
    } catch (err) {
      console.warn('[App] Không thể tải Feature Flags:', err);
    }

    try {
      // 1. Fetch courses from backend
      const backendCourses = await api.getCourses();
      if (backendCourses && backendCourses.length > 0) {
        const mapped = backendCourses.map(c => mapDbCourseToMockFormat(c));
        setCourses(mapped);
      }
    } catch (err) {
      console.warn('[App] Không thể fetch courses:', err);
    }

    if (role === 'student' || currentUser.role?.toLowerCase() === 'student') {
      try {
        // 2. Fetch User PRO status
        const proStatus = await api.checkProStatus();
        if (proStatus && proStatus.isPro !== currentUser.isPro) {
          setCurrentUser(prev => prev ? { ...prev, isPro: proStatus.isPro } : null);
        }
      } catch (err) {
        // ignore
      }
    }

    try {
      // 3. Fetch exams from backend
      const backendExams = await api.getExams();
      if (backendExams && backendExams.length > 0) {
        const validExams = backendExams.filter(e => e.examQuestions && e.examQuestions.length > 0);
        const massiveList = generateMassiveExamsList(validExams);
        setExamsList(massiveList);
        localStorage.setItem('supabase_mock_exams', JSON.stringify(massiveList));
      }
    } catch (err) {
      console.warn("Không thể tải danh sách đề thi từ backend API:", err);
    }

    try {
      // 4. Fetch test attempts from backend
      const history = await api.getAttempts();
      if (history) {
        setAttemptsHistory(history);
      }
    } catch (err) {
      console.warn("Không thể tải lịch sử thi thử từ backend API:", err);
    }

    // Dynamic loading of admin lists from PostgreSQL / Supabase
    if (role === 'admin' || currentUser.role === 'admin') {
      try {
        const dbUsers = await api.getAdminUsers();
        if (dbUsers && Array.isArray(dbUsers.users)) {
          setUsersList(dbUsers.users);
        }
      } catch (err) {
        console.warn('[App] Không thể tải danh sách user từ DB:', err);
      }

      try {
        const dbLeads = await api.getAdminLeads();
        if (dbLeads) setLeadsList(dbLeads);
      } catch (err) {
        console.warn('[App] Không thể tải danh sách Lead từ DB:', err);
      }
    }
  };

  useEffect(() => {
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role, activeTab]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const backendCourses = await api.getCourses();
        if (backendCourses && backendCourses.length > 0) {
          const mapped = backendCourses.map(c => mapDbCourseToMockFormat(c));
          setCourses(mapped);
        }
      } catch (err) {
        console.warn('[App] Không thể fetch courses on mount:', err);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'tests') {
      setTimeout(() => {
        window.MathJax?.typesetPromise?.().catch((err) => console.log("MathJax error:", err));
      }, 200);
    }
  }, [activeTab, examsList, examFilterSubject, examFilterYear, examSearchQuery, examCategory, activeTestSimulator]);

  const addLog = (text, tag = 'sys') => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      tag,
      text
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  // Register dynamic student leads
  const handleRegisterLead = (leadInfo) => {
    const newLead = {
      id: Date.now(),
      name: leadInfo.name,
      phone: leadInfo.phone || 'Chưa cung cấp',
      email: leadInfo.email,
      target: leadInfo.target || 'Tư vấn lộ trình thích ứng',
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'Chờ tư vấn'
    };
    setLeadsList(prev => [newLead, ...prev]);
    addLog(`Lead đăng ký tư vấn mới: "${leadInfo.name}" (${leadInfo.email})`, 'sys');
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    addLog(`Thay đổi giao diện sang chế độ: ${nextTheme.toUpperCase()}`, 'sys');
  };

  // Safe Authentication Handlers
  const handleAuthSuccess = (user, newlyRegisteredUser = null) => {
    const targetUser = newlyRegisteredUser || user;
    if (targetUser) {
      setUsersList(prev => {
        const currentList = Array.isArray(prev) ? prev : [];
        const exists = currentList.some(u => u.email && u.email.toLowerCase() === (targetUser.email || '').toLowerCase());
        if (!exists) {
          const userWithDate = {
            ...targetUser,
            registeredDate: targetUser.registeredDate || new Date().toISOString().split('T')[0]
          };
          return [...currentList, userWithDate];
        }
        return currentList;
      });
    }

    setCurrentUser(user);
    const lowercaseRole = user.role.toLowerCase();
    setRole(lowercaseRole);
    if (lowercaseRole === 'admin') {
      navigateTo('/admin');
      setActiveTab('home');
    } else if (lowercaseRole === 'teacher') {
      navigateTo('/teacher');
      setActiveTab('home');
    } else {
      setActiveTab('landing');
    }
  };


  const handleBackToDashboard = (targetTab) => {
    const isTeacher = effectiveRole === 'teacher' || role === 'teacher' || currentUser?.role?.toLowerCase() === 'teacher';
    const prefix = isTeacher ? '/teacher' : '/user';
    if (targetTab === 'courses') {
      navigateTo(`${prefix}/courses`);
    } else if (targetTab === 'forum') {
      navigateTo(`${prefix}/forum`);
    } else if (targetTab === 'settings') {
      navigateTo(`${prefix}/settings`);
    } else {
      navigateTo(prefix);
      setActiveCourseDetails(null);
      setActiveTestSimulator(null);
      setActiveOCRScanner(null);
    }
  };

  const handleLogout = () => {
    addLog(`Người dùng "${currentUser?.name}" đăng xuất an toàn khỏi hệ thống`, 'sys');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('app_cart_courses');
    navigateTo('/');
    setCurrentUser(null);
    setRole('guest');
    setActiveTab('home');
    setActiveCourseDetails(null);
    setActiveTestSimulator(null);
    setActiveOCRScanner(null);
    setCheckoutCourse(null);
    setCartCourses([]);
  };


  const handleChangePassword = async (oldPass, newPass) => {
    try {
      await api.changePassword(oldPass, newPass);
      
      const currentList = Array.isArray(usersList) ? usersList : [];
      const updatedList = currentList.map(u => u.email === currentUser.email ? { ...u, password: newPass } : u);
      setUsersList(updatedList);
      
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      
      addLog(`Người dùng "${currentUser.name}" đổi mật khẩu tài khoản thành công (UC-04)`, 'sys');
      showToast.current('Đổi mật khẩu thành công!', 'success');
    } catch (err) {
      showToast.current(err.message || 'Đổi mật khẩu thất bại!', 'error');
    }
  };

  const handleSaveProfile = async (updatedProfile) => {
    try {
      const response = await api.updateProfile({
        fullName: updatedProfile.fullName || updatedProfile.name,
        phone: updatedProfile.phone,
        combo: updatedProfile.combo,
        grade: updatedProfile.grade ? Number(updatedProfile.grade) : undefined,
        school: updatedProfile.school,
        targetScore: updatedProfile.targetScore ? Number(updatedProfile.targetScore) : undefined,
        targetUniversity: updatedProfile.targetUniversity
      });

      if (response && response.success) {
        const profile = response.data;
        const mappedUser = {
          ...currentUser,
          ...profile,
          name: profile.fullName,
          avatar: profile.avatarUrl || 'MA',
          role: profile.role.toLowerCase(),
          combo: profile.subjectGroup || 'A01 (Toán – Lý – Anh)',
          unlockedCourses: profile.enrollments?.map(e => e.courseId) || []
        };
        setCurrentUser(mappedUser);
        localStorage.setItem('current_user', JSON.stringify(mappedUser));

        const currentList = Array.isArray(usersList) ? usersList : [];
        const updatedList = currentList.map(u => u.email === mappedUser.email ? mappedUser : u);
        setUsersList(updatedList);

        addLog(`Người dùng "${mappedUser.name}" cập nhật thông tin cá nhân thành công`, 'sys');
        showToast.current('Lưu thông tin cá nhân thành công!', 'success');
      } else {
        showToast.current(response?.error || 'Lưu thông tin cá nhân thất bại!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast.current(err.message || 'Lưu thông tin cá nhân thất bại!', 'error');
    }
  };

  const handleSettingsPasswordChange = async (oldPass, newPass, confirmPass) => {
    if (!oldPass || !newPass || !confirmPass) {
      showToast.current('Vui lòng nhập đầy đủ các trường đổi mật khẩu!', 'warning');
      return;
    }
    if (newPass.length < 6) {
      showToast.current('Mật khẩu mới phải từ 6 ký tự trở lên!', 'warning');
      return;
    }
    if (newPass !== confirmPass) {
      showToast.current('Xác nhận mật khẩu mới không trùng khớp!', 'warning');
      return;
    }

    try {
      await api.changePassword(oldPass, newPass);

      const currentList = Array.isArray(usersList) ? usersList : [];
      const updatedList = currentList.map(u => u.email === currentUser.email ? { ...u, password: newPass } : u);
      setUsersList(updatedList);

      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);

      addLog(`Người dùng "${currentUser.name}" đổi mật khẩu thành công từ cài đặt cá nhân`, 'sys');
      showToast.current('Đổi mật khẩu thành công!', 'success');
      setSettingsOldPass('');
      setSettingsNewPass('');
      setSettingsConfirmNewPass('');
    } catch (err) {
      showToast.current(err.message || 'Đổi mật khẩu thất bại!', 'error');
    }
  };

  // Student purchases course(s)
  const handlePaymentSuccess = async (courseIdOrIds, voucherCode) => {
    const ids = Array.isArray(courseIdOrIds) 
      ? courseIdOrIds.map(id => id.toString()) 
      : [courseIdOrIds.toString()];

    // Write payment & enrollment rows into local storage db / Supabase tables
    if (currentUser) {
      for (const id of ids) {
        try {
          const isDoc = cartCourses.some(c => c.id.toString() === id && (c.type === 'DOCUMENT' || c.driveUrl));
          if (isDoc) {
            continue;
          }
          const targetCourse = courses.find(c => c.id.toString() === id);
          const priceNum = targetCourse 
            ? parseFloat(String(targetCourse.priceSale || targetCourse.price || targetCourse.priceOriginal).replace(/\D/g, '')) 
            : 499000;
          await enrollmentService.enrollCourse(currentUser.id, id, priceNum);
          
          // Persist the course enrollment in the backend database
          await api.enrollCourseDemo({ courseId: Number(id), voucherCode });
        } catch (err) {
          console.error('Failed to log payment enrollment data:', err);
        }
      }
    }

    // Trigger custom event for documents purchase status sync
    window.dispatchEvent(new CustomEvent('document-purchased', { detail: { documentIds: ids.map(Number) } }));

    // Add to student's list in users database
    const currentList = Array.isArray(usersList) ? usersList : [];
    const updatedUsers = currentList.map(u => {
      if (u.email === currentUser.email) {
        const unlocked = u.unlockedCourses || [];
        const newUnlocked = Array.from(new Set([
          ...unlocked, 
          ...ids, 
          ...ids.map(Number), 
          ...ids.map(id => id.toString())
        ]));
        return { ...u, unlockedCourses: newUnlocked };
      }
      return u;
    });
    setUsersList(updatedUsers);

    // Sync active session unlockedCourses
    const activeUnlocked = currentUser?.unlockedCourses || [];
    const newActiveUnlocked = Array.from(new Set([
      ...activeUnlocked, 
      ...ids, 
      ...ids.map(Number), 
      ...ids.map(id => id.toString())
    ]));
    
    const updatedCurrentUser = {
      ...currentUser,
      unlockedCourses: newActiveUnlocked
    };
    setCurrentUser(updatedCurrentUser);
    localStorage.setItem('current_user', JSON.stringify(updatedCurrentUser));

    setCartCourses([]);
    localStorage.removeItem('app_cart_courses');
  };

  // Student upgrades to PRO membership success
  const handleUpgradeSuccess = () => {
    // 1. Update in the local users database list
    const currentList = Array.isArray(usersList) ? usersList : [];
    const updatedUsers = currentList.map(u => {
      if (u.email === currentUser.email) {
        return { ...u, isPro: true };
      }
      return u;
    });
    setUsersList(updatedUsers);

    // 2. Sync the active session currentUser object
    setCurrentUser({
      ...currentUser,
      isPro: true
    });

    // 3. Clear/close the upgrade modal
    setShowUpgradePRO(false);
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
    navigateTo('/dashboard/flashcards');
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

  const handleForumAcceptCommentSolution = (postId, commentId) => {
    const updated = forumPosts.map(post => {
      if (post.id === postId) {
        const updatedComments = (post.comments || []).map(c => {
          if (c.id === commentId) {
            return { ...c, isAccepted: !c.isAccepted };
          }
          return { ...c, isAccepted: false };
        });
        return { ...post, comments: updatedComments };
      }
      return post;
    });
    setForumPosts(updated);
    addLog(`Cập nhật trạng thái Lời giải đúng nhất cho phản hồi`, 'sys');
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

  const handleToggleUserBan = async (userId) => {
    try {
      const res = await api.banAdminUser(userId);
      if (res) {
        setUsersList(prev => {
          const currentList = Array.isArray(prev) ? prev : [];
          return currentList.map(u => u.id === userId ? { ...u, isBanned: res.isBanned } : u);
        });
        addLog(`Cập nhật trạng thái tài khoản ID ${userId}: ${res.isBanned ? 'Khóa' : 'Hoạt động'} thành công`, 'sys');
      }
    } catch (err) {
      console.error('[App] Lỗi toggle ban user in DB:', err);
      // fallback
      setUsersList(prev => {
        const currentList = Array.isArray(prev) ? prev : [];
        return currentList.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u);
      });
    }
  };

  const handleApproveTeacher = (teacherName, subject) => {
    setUsersList(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      return currentList.map(u => u.name === teacherName ? { ...u, status: 'active' } : u);
    });
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

  // Filter dynamic list of course purchases for current user session
  const activeUserCourses = courses.map(c => {
    const isUnlocked = currentUser?.unlockedCourses?.includes(Number(c.id)) || currentUser?.unlockedCourses?.includes(c.id.toString());
    return { ...c, isUnlocked };
  });

  const activeUserSubmissions = submissions.filter(s => s.email === currentUser?.email);

  if (isMaintenanceActive && activeTab !== 'login') {
    const savedUser = JSON.parse(localStorage.getItem('current_user') || 'null');
    if (savedUser?.role !== 'admin' && savedUser?.role !== 'ADMIN') {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0c1b 0%, #1e1b4b 100%)',
          color: '#FFFFFF',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            padding: '48px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            maxWidth: '540px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Animated gear or icon */}
            <div style={{
              fontSize: '80px',
              animation: 'spin 4s linear infinite',
              marginBottom: '24px',
              filter: 'drop-shadow(0 0 20px rgba(108, 92, 227, 0.5))'
            }}>
              ⚙️
            </div>
            
            <h1 style={{
              fontSize: '28px',
              fontWeight: '900',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              Hệ Thống Đang Bảo Trì
            </h1>
            
            <p style={{
              fontSize: '15px',
              color: '#cbd5e1',
              lineHeight: 1.6,
              marginBottom: '28px',
              fontWeight: '500'
            }}>
              Chúng tôi hiện đang nâng cấp và tối ưu hóa hệ thống để mang lại trải nghiệm tốt nhất cho bạn. Vui lòng quay lại sau ít phút.
            </p>

            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              marginBottom: '28px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                height: '100%',
                width: '50%',
                background: 'linear-gradient(90deg, #a29bfe, #6c5ce7)',
                borderRadius: '2px',
                animation: 'loadingProgress 2s ease-in-out infinite'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: '#6C5CE7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(108, 92, 227, 0.3)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(108, 92, 227, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(108, 92, 227, 0.3)';
                }}
              >
                🔄 Tải lại trang
              </button>

              <button 
                onClick={() => {
                  setActiveTab('login');
                  navigateTo('/login');
                }}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: '#a29bfe',
                  border: '2px solid rgba(162, 155, 254, 0.3)',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                  fontSize: '13px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(162, 155, 254, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(162, 155, 254, 0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(162, 155, 254, 0.3)';
                }}
              >
                🔑 Đăng nhập dành cho Quản trị viên
              </button>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes loadingProgress {
              0% { left: -50%; }
              50% { left: 25%; }
              100% { left: 100%; }
            }
          `}} />
        </div>
      );
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar - Guarded against guest visitors and focused exam sessions */}
      {effectiveRole !== 'guest' && effectiveRole !== 'admin' && effectiveRole !== 'teacher' && effectiveRole !== 'student' && !isEffectiveFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          transform: isEffectiveFullscreen ? 'translateX(-100%)' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
        }}>
          <Sidebar
            role={effectiveRole}
            featureFlags={featureFlags}
            active={parsedRoute.tab}
            setActive={(tab) => {
              if (tab === 'courses') {
                navigateTo('/dashboard/courses');
              } else if (tab === 'tests') {
                navigateTo('/dashboard/mock-exams');
              } else if (tab === 'ai-qa') {
                navigateTo('/dashboard/ai-tutor');
              } else if (tab === 'path') {
                navigateTo('/dashboard/flashcards');
              } else if (tab === 'library') {
                navigateTo('/dashboard/exam-bank');
              } else if (tab === 'forum') {
                navigateTo('/dashboard/forum');
              } else if (tab === 'leaderboard') {
                navigateTo('/dashboard/leaderboard');
              } else if (tab === 'settings') {
                navigateTo('/dashboard/settings');
              } else if (tab === 'landing') {
                navigateTo('/');
              } else if (['referrals', 'commissions', 'payouts', 'materials'].includes(tab)) {
                navigateTo(`/dashboard/${tab}`);
              } else {
                navigateTo('/dashboard/home');
              }
            }}
            userProfile={currentUser}
            onLogout={handleLogout}
            onUpgradePRO={() => setShowUpgradePRO(true)}
          />
        </div>
      )}

      {/* Floating Sidebar toggle handle for fullscreen mode */}
      {effectiveRole !== 'guest' && effectiveRole !== 'admin' && parsedRoute.route === 'dashboard' && ['path', 'ai-qa', 'library'].includes(parsedRoute.tab) && (
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          style={{
            position: 'fixed',
            top: '50%',
            left: isFullscreen ? '0' : 'var(--sidebar-width)',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '60px',
            background: 'var(--primary)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderLeft: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: isFullscreen ? '0 12px 12px 0' : '12px 0 0 12px',
            cursor: 'pointer',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 0.8,
            outline: 'none',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.width = '24px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.width = '20px';
          }}
          title={isFullscreen ? "Hiện menu điều hướng" : "Ẩn menu điều hướng (Toàn màn hình)"}
        >
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
            {isFullscreen ? '▶' : '◀'}
          </span>
        </button>
      )}

      <div 
        className="main-wrapper" 
        style={{ 
          marginLeft: (effectiveRole === 'guest' || effectiveRole === 'student' || effectiveRole === 'admin' || effectiveRole === 'teacher' || parsedRoute.route !== 'dashboard') ? 0 : (isEffectiveFullscreen ? 0 : 'var(--sidebar-width)'),
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <main 
          className="main-content" 
          style={(effectiveRole === 'guest' || effectiveRole === 'student' || effectiveRole === 'admin' || effectiveRole === 'teacher' || parsedRoute.route !== 'dashboard' || isEffectiveFullscreen) ? { width: '100%', maxWidth: '100%', padding: 0, overflow: 'hidden' } : { maxWidth: '100%' }}
        >

          {currentUser && parsedRoute.route.startsWith('mock-') && parsedRoute.route !== 'mock-exam-taking' && (
            <div className="mock-exams-simple-header">
              <button onClick={() => navigateTo('/')} className="mock-exams-back-btn">
                ← Quay lại Trang chủ
              </button>
              <div className="mock-exams-user-profile">
                <div className="mock-exams-user-avatar">
                  {currentUser.avatar || (currentUser.fullName || currentUser.name)?.substring(0, 2).toUpperCase() || 'HS'}
                </div>
                <span className="mock-exams-user-name">{currentUser.fullName || currentUser.name}</span>
              </div>
            </div>
          )}

          {effectiveRole !== 'guest' && ((parsedRoute.route === 'dashboard' && effectiveRole !== 'student' && !(effectiveRole === 'teacher' && parsedRoute.tab !== 'forum')) || (parsedRoute.route === 'teacher' && parsedRoute.tab === 'forum')) ? (
            <div style={{
              transform: isEffectiveFullscreen ? 'translateY(-100%)' : 'none',
              opacity: isEffectiveFullscreen ? 0 : 1,
              maxHeight: isEffectiveFullscreen ? '0px' : '200px',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <Header
                role={effectiveRole}
                userProfile={currentUser}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                notifications={notifications}
                onClearNotifications={handleClearNotifications}
                onNotificationClick={handleNotificationClick}
                onLogout={handleLogout}
                onChangePassword={handleChangePassword}
                onNavigateSettings={() => { navigateTo('/dashboard/settings'); }}
                addLog={addLog}
                cartCourses={cartCourses}
                onCheckoutCourse={handleCheckoutCourse}
                navigateTo={navigateTo}
                currentPath={currentPath}
                courses={courses}
              />
            </div>
          ) : !isEffectiveFullscreen ? (
            // Minimal Header for Guests
            <>
              {theme === 'dark' && parsedRoute.route !== 'mock-exam-taking' && (
                <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
                  <button className="header-icon-btn" onClick={handleToggleTheme}>
                    ☀️
                  </button>
                </div>
              )}
            </>
          ) : null}

          {/* ================= PUBLIC OR PREVIEW LANDING PAGE ================= */}
          {(parsedRoute.route === 'landing' || parsedRoute.route.startsWith('public-')) && parsedRoute.route !== 'admin' && (
            <div>
              {role === 'guest' && activeTab === 'reset-password' ? (
                <div className="auth-page-layout" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
                  <div className="auth-floating-container animate-in">
                    <div className="auth-floating-card" style={{ maxWidth: '440px', width: '100%', margin: '40px auto', padding: '32px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }}>
                      <div className="auth-card-header-bar" style={{ justifyContent: 'center', marginBottom: '24px', textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px' }}>🛡️ ĐẶT LẠI MẬT KHẨU MỚI</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Nhập mật khẩu mới cho tài khoản EduPath AI của em</p>
                      </div>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const password = e.target.password.value;
                        const confirm = e.target.confirm.value;
                        if (password.length < 6) {
                          showToast.current('Mật khẩu mới phải có tối thiểu 6 ký tự!', 'warning');
                          return;
                        }
                        if (password !== confirm) {
                          showToast.current('Mật khẩu xác nhận không khớp! Vui lòng nhập lại.', 'warning');
                          return;
                        }
                        try {
                          await api.resetPassword(resetToken, password);
                          showToast.current('Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.', 'success');
                          setResetToken(null);
                          setActiveTab('login');
                        } catch (err) {
                          showToast.current(err.message || 'Lỗi đặt lại mật khẩu.', 'error');
                        }
                      }}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Mật khẩu mới:</label>
                          <input type="password" name="password" className="form-control" required minLength={6} placeholder="Tối thiểu 6 ký tự" style={{ width: '100%', padding: '10px', fontSize: '13.5px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Xác nhận mật khẩu mới:</label>
                          <input type="password" name="confirm" className="form-control" required placeholder="Nhập lại mật khẩu mới" style={{ width: '100%', padding: '10px', fontSize: '13.5px' }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '13.5px', fontWeight: 'bold', borderRadius: 'var(--radius-md)' }}>
                          XÁC NHẬN ĐỔI MẬT KHẨU
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                          <button type="button" onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                            Quay lại đăng nhập
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : role === 'guest' && (activeTab === 'login' || activeTab === 'signup') ? (
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
                  onBackToLanding={() => navigateTo('/')}
                />
              ) : (
                <LandingPage
                  courses={courses}
                  currentUser={currentUser}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClearNotifications={handleClearNotifications}
                  onNavigateToAuth={(mode) => { navigateTo('/'); setActiveTab(mode); }}
                  onBackToDashboard={handleBackToDashboard}
                  onLogout={handleLogout}
                  forumPosts={forumPosts}
                  onAddPost={handleForumAddPost}
                  onLikePost={handleForumLikePost}
                  onAddComment={handleForumAddComment}
                  onAcceptCommentSolution={handleForumAcceptCommentSolution}
                  onCheckoutCourse={handleCheckoutCourse}
                  onNavigateToLearn={(courseId, lessonId) => {
                    if (currentUser) {
                      navigateTo(`/learn/${courseId}${lessonId ? `/lesson/${lessonId}` : ''}`);
                    } else {
                      navigateTo('/');
                      setActiveTab('signup');
                    }
                  }}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated);
                    setUsersList(prev => prev.map(u => u.email === updated.email ? updated : u));
                  }}
                  currentPath={currentPath}
                  navigateTo={navigateTo}
                  cartCourses={cartCourses}
                  onAddToCart={handleAddToCart}
                  onRemoveCourse={(courseId) => {
                    const updated = cartCourses.filter(c => c.id !== courseId);
                    setCartCourses(updated);
                    localStorage.setItem('app_cart_courses', JSON.stringify(updated));
                  }}
                />
              )}
            </div>
          )}

          {/* ================= CONFIRM EMAIL WORKSPACE ================= */}
          {parsedRoute.route === 'confirm-email' && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '40px 20px' }}>
              <ConfirmEmailPage
                onAuthSuccess={(user) => {
                  handleAuthSuccess(user);
                }}
                navigateTo={navigateTo}
              />
            </div>
          )}

          {/* ================= DEVTOOLS MANUAL HELPER ================= */}
          {parsedRoute.route === 'devtools' && import.meta.env.DEV && (
            <DevToolsPage
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              navigateTo={navigateTo}
              handleAuthSuccess={handleAuthSuccess}
              handleLogout={handleLogout}
              addLog={addLog}
            />
          )}

          {/* ================= MOCK EXAMS ROUTER WORKSPACE (PUBLIC ACCESS) ================= */}
          {parsedRoute.route.startsWith('mock-') && (
            <div className="mock-exams-workspace-wrapper" style={{ padding: '20px 0' }}>
              {parsedRoute.route === 'mock-exams-list' && (
                <MockExamsPage
                  currentUser={currentUser}
                  onSelectExam={(examId) => navigateTo(`/mock-exams/${examId}`)}
                  navigateTo={navigateTo}
                  examsList={examsList}
                />
              )}

              {parsedRoute.route === 'mock-exam-detail' && (
                <MockExamDetailPage
                  examId={parsedRoute.examId}
                  currentUser={currentUser}
                  onStartExam={(examId) => navigateTo(`/mock-exams/${examId}/start`)}
                  navigateTo={navigateTo}
                />
              )}

              {parsedRoute.route === 'mock-exam-taking' && (
                <MockExamTakingPage
                  examId={parsedRoute.examId}
                  currentUser={currentUser}
                  onFinished={(examId, attemptId) => navigateTo(`/mock-exams/${examId}/result/${attemptId}`)}
                  navigateTo={navigateTo}
                />
              )}

              {parsedRoute.route === 'mock-exam-result' && (
                <MockExamResultPage
                  examId={parsedRoute.examId}
                  attemptId={parsedRoute.attemptId}
                  currentUser={currentUser}
                  navigateTo={navigateTo}
                />
              )}
            </div>
          )}

          {/* ================= COURSES ROUTER WORKSPACE ================= */}
          {role !== 'guest' && activeTab !== 'landing' && (parsedRoute.route === 'courses-list' || parsedRoute.route === 'course-detail') && (
            <div style={{ padding: '0 0 20px 0' }}>
              <Header
                role={effectiveRole}
                userProfile={currentUser}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                notifications={notifications}
                onClearNotifications={handleClearNotifications}
                onNotificationClick={handleNotificationClick}
                onLogout={handleLogout}
                onChangePassword={handleChangePassword}
                onNavigateSettings={() => { navigateTo('/user/settings'); }}
                addLog={addLog}
                cartCourses={cartCourses}
                onCheckoutCourse={handleCheckoutCourse}
                navigateTo={navigateTo}
                currentPath={currentPath}
                courses={courses}
              />
              <div style={{ padding: '20px' }}>
              {parsedRoute.route === 'courses-list' && (
                role === 'student' ? (
                  <div className="cp-page-container">
                    <div className="cp-page animate-in">
                      <CourseMall
                        courses={courses}
                        currentUser={currentUser}
                        onSelectCourse={(course) => navigateTo(`/courses/${course.id}`)}
                        onLearnCourse={(course) => navigateTo(`/learn/${course.id}`)}
                        onCheckoutCourse={(course) => setCheckoutCourse(course)}
                        onRegisterLead={handleRegisterLead}
                      />
                    </div>
                  </div>
                ) : (
                  <CoursesPage
                    courses={courses}
                    currentUser={currentUser}
                    onSelectCourse={(course) => navigateTo(`/courses/${course.id}`)}
                    onCheckoutCourse={(course) => setCheckoutCourse(course)}
                    navigateTo={navigateTo}
                  />
                )
              )}

              {parsedRoute.route === 'course-detail' && (
                <CourseDetailPage
                  courseId={parsedRoute.courseId}
                  currentUser={currentUser}
                  onNavigateToLearn={(courseId, lessonId, isDemo = false) => {
                    const demoQuery = isDemo ? '?demo=true' : '';
                    navigateTo(`/learn/${courseId}${lessonId ? `/lesson/${lessonId}` : ''}${demoQuery}`);
                  }}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated);
                    const currentList = Array.isArray(usersList) ? usersList : [];
                    const updatedList = currentList.map(u => u.email === updated.email ? updated : u);
                    setUsersList(updatedList);
                  }}
                  navigateTo={navigateTo}
                  onAddToCart={handleAddToCart}
                  onCheckoutCourse={(course) => setCheckoutCourse(course)}
                />
              )}
              </div>
            </div>
          )}

          {/* ================= AI TUTOR WORKSPACE ================= */}
          {parsedRoute.route === 'ai-tutor' && (
            <div style={{ padding: '0', background: '#141410', minHeight: '100vh' }}>
              <AITutorPage
                currentUser={currentUser}
                navigateTo={navigateTo}
                addLog={addLog}
              />
            </div>
          )}

          {/* ================= FLASHCARDS WORKSPACE ================= */}
          {parsedRoute.route === 'flashcards' && (
            <div style={{ padding: '0', background: '#141410', minHeight: '100vh' }}>
              <FlashcardPage
                currentUser={currentUser}
                navigateTo={navigateTo}
                addLog={addLog}
              />
            </div>
          )}

          {/* ================= EXAM BANK PAGE ================= */}
          {parsedRoute.route === 'exam-bank' && (
            <div style={{ padding: '0' }}>
              <ExamBankPage
                currentUser={currentUser}
                navigateTo={navigateTo}
                cartDocs={cartCourses}
                onAddToCart={(doc) => {
                  const docItem = { ...doc, type: 'DOCUMENT' };
                  handleAddToCart(docItem);
                }}
                onCheckoutDoc={(doc) => {
                  const docItem = { ...doc, type: 'DOCUMENT' };
                  handleCheckoutCourse(docItem);
                }}
                onRemoveDoc={(docId) => {
                  const updated = cartCourses.filter(c => c.id !== docId);
                  setCartCourses(updated);
                  localStorage.setItem('app_cart_courses', JSON.stringify(updated));
                }}
              />
            </div>
          )}

          {/* ================= FORUM WORKSPACE ================= */}
          {parsedRoute.route === 'forum' && (
            <div style={{ padding: '0' }}>
              <Forum currentUser={currentUser} />
            </div>
          )}

          {/* ================= STUDENT LEARNING WORKSPACE ================= */}
          {(effectiveRole === 'student' || effectiveRole === 'admin' || window.location.search.includes('demo=true')) && parsedRoute.route === 'learn' && (
            <div style={{ padding: '0' }}>
              <LearningPage
                courseId={parsedRoute.courseId}
                lessonId={parsedRoute.lessonId}
                currentUser={currentUser}
                onSelectLesson={(courseId, lessonId) => navigateTo(`/learn/${courseId}/lesson/${lessonId}${window.location.search}`)}
                onBackToCourse={(targetPath) => navigateTo(targetPath || `/courses/${parsedRoute.courseId}`)}
              />
            </div>
          )}

          {/* ================= STUDENT WORKSPACE ================= */}
          {effectiveRole === 'student' && parsedRoute.route === 'dashboard' && !activeCourseDetails && !activeTestSimulator && !activeOCRScanner && (
            <RouteGuard allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} currentUser={currentUser}>
              <StudentDashboard
                currentUser={currentUser}
                currentTab={parsedRoute.tab === 'tests' ? 'tests' : 
                            parsedRoute.tab === 'ai-qa' ? 'ai-qa' : 
                            parsedRoute.tab === 'path' ? 'path' : 
                            parsedRoute.tab}
                setActiveTab={(tab) => {
                  if (tab === 'courses') navigateTo('/user/courses');
                  else if (tab === 'my-courses') navigateTo('/user/my-courses');
                  else if (tab === 'classrooms') navigateTo('/user/classrooms');
                  else if (tab === 'tests') navigateTo('/user/mock-exams');
                  else if (tab === 'ai-qa') navigateTo('/user/ai-tutor');
                  else if (tab === 'path') navigateTo('/user/flashcards');
                  else if (tab === 'library') navigateTo('/user/exam-bank');
                  else if (tab === 'forum') navigateTo('/user/forum');
                  else if (tab === 'documents') navigateTo('/user/documents');
                  else if (tab === 'streak') navigateTo('/user/streak');
                  else if (tab === 'leaderboard') navigateTo('/user/leaderboard');
                  else if (tab === 'settings') navigateTo('/user/settings');
                  else if (tab === 'notifications') navigateTo('/user/notifications');
                  else navigateTo('/user/home');
                }}
                navigateTo={navigateTo}
                onUpdateUser={handleSaveProfile}
                onLogout={handleLogout}
                unreadCount={unreadCount}
                notifications={notifications}
              >

              {/* Learning path adaptive roadmap tab */}
              {parsedRoute.tab === 'path' && (
                <FlashcardPage
                  currentUser={currentUser}
                  navigateTo={navigateTo}
                  addLog={addLog}
                />
              )}

              {/* Courses tab */}
              {parsedRoute.tab === 'courses' && (
                <CourseMall
                  courses={courses}
                  currentUser={currentUser}
                  onSelectCourse={setActiveCourseDetails}
                  onLearnCourse={(course) => navigateTo(`/learn/${course.id}`)}
                  onCheckoutCourse={handleCheckoutCourse}
                  onRegisterLead={handleRegisterLead}
                />
              )}

              {/* Forum tab */}
              {parsedRoute.tab === 'forum' && (
                <Forum currentUser={currentUser} />
              )}

              {/* Online Mock Exams tab */}
              {parsedRoute.tab === 'tests' && (
                <div className="exams-lobby-layout animate-in">
                  
                  {/* Left Column: Main Exams Panel */}
                  <div className="exams-main-content">
                    
                    {/* Hero Banner with statistics */}
                    <div className="exams-hero-banner">
                      <span className="subj-eyebrow" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff' }}>
                        Hệ thống luyện đề chuẩn cấu trúc Bộ GD&ĐT
                      </span>
                      <h2 style={{ fontSize: '28px', fontWeight: '950', color: '#fff', margin: '12px 0 6px 0', lineHeight: 1.2 }}>
                        Chinh phục Kỳ thi THPT Quốc Gia
                      </h2>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '0 0 24px 0', maxWidth: '560px', lineHeight: 1.5 }}>
                        Luyện tập trực tuyến với các đề thi chính thức các năm 2024 - 2025. Phân tích lỗ hổng kiến thức tức thì bằng trí tuệ nhân tạo Adaptive AI.
                      </p>
                      
                      {/* Stat row counters */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '16px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 'bold', textTransform: 'uppercase' }}>Lượt thi thử</span>
                          <strong style={{ fontSize: '20px', color: '#fff', fontWeight: '900' }}>42,500+</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 'bold', textTransform: 'uppercase' }}>Tỷ lệ hài lòng</span>
                          <strong style={{ fontSize: '20px', color: '#fff', fontWeight: '900' }}>98.2%</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 'bold', textTransform: 'uppercase' }}>Đề chính thức</span>
                          <strong style={{ fontSize: '20px', color: '#fff', fontWeight: '900' }}>2024 - 2025</strong>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: 'bold', textTransform: 'uppercase' }}>AI Chẩn đoán</span>
                          <strong style={{ fontSize: '20px', color: '#fff', fontWeight: '900' }}>Tự động 100%</strong>
                        </div>
                      </div>
                    </div>

                    {/* OCR Answer Sheet Grading Entry Banner */}
                    <div 
                      className="card animate-in"
                      style={{
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, rgba(255, 226, 89, 0.05), rgba(255, 167, 81, 0.05))',
                        border: '1px solid rgba(255, 226, 89, 0.25)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ flex: '1', minWidth: '280px' }}>
                        <span className="badge-pill" style={{ background: 'var(--fc-gold, #FFE259)', color: '#12120e', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>
                          ⚡ Tính năng Mới
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--fc-gold, #FFE259)', margin: '6px 0 4px 0' }}>
                          📸 Tự động chấm điểm nhanh qua Camera (OCR)
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>
                          Làm bài ra giấy hoặc tô phiếu trắc nghiệm rồi chụp ảnh tải lên. AI sẽ tự động đọc kết quả, đối chiếu đáp án chính thức của Bộ GD&ĐT và chấm điểm ngay lập tức!
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setActiveOCRScanner(true)}
                        className="btn-primary"
                        style={{
                          background: 'var(--fc-gold, #FFE259)',
                          color: '#12120e',
                          border: 'none',
                          padding: '10px 22px',
                          fontSize: '13px',
                          fontWeight: '600',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: '0 4px 12px rgba(255, 226, 89, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Chấm điểm bằng OCR 📸
                      </button>
                    </div>

                    {/* Lịch sử thi thử và Chẩn đoán AI */}
                    {attemptsHistory && attemptsHistory.length > 0 && (
                      <div className="card animate-in" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <span>📝</span> Lịch sử thi thử & Chẩn đoán từ AI <span style={{ fontSize: '11px', background: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{attemptsHistory.length} lượt</span>
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '8px 12px', fontWeight: 'bold' }}>Môn học</th>
                                <th style={{ padding: '8px 12px', fontWeight: 'bold' }}>Đề thi</th>
                                <th style={{ padding: '8px 12px', fontWeight: 'bold' }}>Ngày thi</th>
                                <th style={{ padding: '8px 12px', fontWeight: 'bold', textAlign: 'right' }}>Điểm số</th>
                                <th style={{ padding: '8px 12px', fontWeight: 'bold', textAlign: 'center' }}>Nhận xét AI</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attemptsHistory.map((att) => {
                                const dateStr = new Date(att.startedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                const scoreColor = att.score >= 8 ? 'var(--accent-green)' : (att.score >= 5 ? 'var(--accent-orange)' : 'var(--accent-red)');
                                return (
                                  <tr key={att.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{att.exam?.subject || 'Môn học'}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{att.exam?.title || 'Đề tự luyện'}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{dateStr}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '900', color: scoreColor, fontSize: '15px' }}>
                                      {att.score.toFixed(1)}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                      {att.aiFeedback && (
                                        <button
                                          onClick={() => {
                                            const feedback = typeof att.aiFeedback === 'string' ? JSON.parse(att.aiFeedback) : att.aiFeedback;
                                            setAiFeedbackModal({ feedback, exam: att.exam });
                                          }}
                                          style={{
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            background: 'rgba(108, 92, 231, 0.1)',
                                            color: 'var(--primary)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          Chi tiết 🔎
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Filters Tabs by Subject & Year & Search & Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                      
                      {/* Search Bar & Category filter row */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
                          <input 
                            type="text" 
                            placeholder="🔍 Tìm kiếm tên đề thi, từ khóa (Ví dụ: Toán 2024, Chuyên)..." 
                            value={examSearchQuery} 
                            onChange={e => setExamSearchQuery(e.target.value)} 
                            style={{
                              width: '100%',
                              padding: '10px 16px 10px 36px',
                              fontSize: '13px',
                              borderRadius: '12px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              boxShadow: 'var(--shadow-sm)',
                              outline: 'none',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>🔍</span>
                          {examSearchQuery && (
                            <button 
                              onClick={() => setExamSearchQuery('')}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                fontSize: '13px'
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Category selection */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { key: 'All', label: '🗂️ Tất cả' },
                            { key: 'Official', label: '📌 Đề chính thức THPT QG' },
                            { key: 'Mock', label: '🏫 Đề Trường Chuyên' },
                            { key: 'Aptitude', label: '🎯 Đánh giá năng lực' }
                          ].map(cat => {
                            const isSelected = examCategory === cat.key;
                            return (
                              <button
                                key={cat.key}
                                onClick={() => setExamCategory(cat.key)}
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '12.5px',
                                  fontWeight: '600',
                                  borderRadius: '10px',
                                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                  background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  boxShadow: isSelected ? '0 4px 12px rgba(108, 92, 231, 0.15)' : 'var(--shadow-sm)',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {cat.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stats Dashboard row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '12px',
                        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.04), rgba(165, 180, 252, 0.04))',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', padding: '4px' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>TỔNG SỐ ĐỀ THI</span>
                          <strong style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: '850' }}>{examsList.length} đề thi</strong>
                        </div>
                        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', padding: '4px' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>CHUYÊN ĐỀ PHỦ</span>
                          <strong style={{ fontSize: '18px', color: '#10b981', fontWeight: '850' }}>20+ chủ đề</strong>
                        </div>
                        <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', padding: '4px' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>CƠ CẤU ĐỘ KHÓ</span>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: '700', display: 'block', marginTop: '4px' }}>Dễ 35% | TB 45% | Khó 20%</span>
                        </div>
                        <div style={{ textAlign: 'center', padding: '4px' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>HỆ THỐNG GIÁM SÁT</span>
                          <strong style={{ fontSize: '16px', color: '#db8142', fontWeight: '850' }}>AI Diagnostics ⚡</strong>
                        </div>
                      </div>

                      {/* Subject filters & Year filters Row */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="exams-filter-tabs" style={{ marginBottom: 0 }}>
                          {['All', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Đánh giá năng lực'].map(subject => (
                            <button
                              key={subject}
                              className={examFilterSubject === subject ? 'active' : ''}
                              onClick={() => setExamFilterSubject(subject)}
                              style={{ cursor: 'pointer' }}
                            >
                              {subject === 'All' ? 'Tất cả môn học' : subject}
                            </button>
                          ))}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>🗓️ Năm:</span>
                          {['All', '2024', '2023', '2022', '2021', '2020'].map(year => {
                            const isSelected = examFilterYear === year;
                            return (
                              <button
                                key={year}
                                onClick={() => setExamFilterYear(year)}
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  borderRadius: '20px',
                                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                  background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                                }}
                              >
                                {year === 'All' ? 'Tất cả' : year}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Detailed Layout & Categorized Grids */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      {(() => {
                        // Filter logic
                        const filtered = examsList.filter(exam => {
                          const matchesSubject = examFilterSubject === 'All' || exam.subject === examFilterSubject;
                          const matchesYear = examFilterYear === 'All' || exam.title.includes(examFilterYear);
                          const matchesSearch = examSearchQuery.trim() === '' || 
                            exam.title.toLowerCase().includes(examSearchQuery.toLowerCase()) ||
                            exam.subject.toLowerCase().includes(examSearchQuery.toLowerCase());
                          
                          let matchesCategory = true;
                          const isOfficial = exam.title.includes("chính thức") || exam.title.includes("QG");
                          const isAptitude = exam.subject.includes("Đánh giá năng lực") || exam.title.includes("HSA") || exam.title.includes("ĐGNL") || exam.title.includes("năng lực");
                          const isMock = !isOfficial && !isAptitude;

                          if (examCategory === 'Official') matchesCategory = isOfficial;
                          else if (examCategory === 'Mock') matchesCategory = isMock;
                          else if (examCategory === 'Aptitude') matchesCategory = isAptitude;

                          return matchesSubject && matchesYear && matchesSearch && matchesCategory;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="subj-empty">
                              <span className="subj-empty-icon">📂</span>
                              <h3>Không tìm thấy đề thi phù hợp</h3>
                              <p>Vui lòng thử tìm kiếm khác hoặc thay đổi bộ lọc.</p>
                            </div>
                          );
                        }

                        // Categories breakdown
                        const official = filtered.filter(e => e.title.includes("chính thức") || e.title.includes("QG"));
                        const aptitude = filtered.filter(e => e.subject.includes("Đánh giá năng lực") || e.title.includes("HSA") || e.title.includes("ĐGNL") || e.title.includes("năng lực"));
                        const mocks = filtered.filter(e => !e.title.includes("chính thức") && !e.title.includes("QG") && !e.subject.includes("Đánh giá năng lực") && !e.title.includes("HSA") && !e.title.includes("ĐGNL") && !e.title.includes("năng lực"));

                        const renderCard = (exam) => {
                          const isMath = exam.subject === 'Toán học';
                          const isPhysics = exam.subject === 'Vật lý';
                          const isChemistry = exam.subject === 'Hóa học';
                          const isBiology = exam.subject === 'Sinh học';
                          const isEnglish = exam.subject === 'Tiếng Anh';
                          const cardHeaderBg = isMath ? '#5b75f3' : (isPhysics ? '#52ad58' : (isChemistry ? '#06b6d4' : (isBiology ? '#10b981' : (isEnglish ? '#db8142' : '#8b5cf6'))));
                          const mascot = isMath ? '🦉' : (isPhysics ? '🦊' : (isChemistry ? '🧪' : (isBiology ? '🌿' : (isEnglish ? '🐸' : '🎯'))));

                          return (
                            <div key={exam.id} className="exam-paper-card animate-in">
                              <div className="exam-paper-header" style={{ background: cardHeaderBg }}>
                                <span className="exam-paper-tag">{exam.subject}</span>
                                <div className="exam-paper-header-right">
                                  <span className="exam-paper-difficulty" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    Chuẩn cấu trúc
                                  </span>
                                  <span className="exam-paper-mascot">{mascot}</span>
                                </div>
                              </div>

                              <div className="exam-paper-body">
                                <span className="exam-paper-subject" style={{ color: cardHeaderBg }}>{exam.subjectGroup || 'Tổ hợp'}</span>
                                <h4 className="exam-paper-title" title={exam.title}>{exam.title}</h4>
                                
                                <div className="exam-paper-info-grid">
                                  <div className="info-item">⏱ {exam.duration} phút</div>
                                  <div className="info-item">📝 {exam.subject === 'Vật lý' ? '40 câu' : '50 câu'}</div>
                                </div>
                              </div>

                              <div className="exam-paper-footer">
                                <button 
                                  className="btn-primary" 
                                  onClick={() => setActiveTestSimulator(exam)}
                                  style={{ background: cardHeaderBg, color: '#fff', border: 'none', fontWeight: '600', boxShadow: `0 4px 12px ${cardHeaderBg}28`, cursor: 'pointer', transition: 'all 0.2s ease' }}
                                >
                                  Làm online 💻
                                </button>
                                <button 
                                  className="btn-outline" 
                                  onClick={() => setActiveOCRScanner(exam)}
                                  style={{ border: '1px solid var(--border)', fontWeight: '600', background: '#fff', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
                                >
                                  Nộp file OCR 📸
                                </button>
                              </div>
                            </div>
                          );
                        };

                        const ITEMS_PER_PAGE = 6;
                        const paginatedOfficial = official.slice((pageOfficial - 1) * ITEMS_PER_PAGE, pageOfficial * ITEMS_PER_PAGE);
                        const paginatedMocks = mocks.slice((pageMock - 1) * ITEMS_PER_PAGE, pageMock * ITEMS_PER_PAGE);
                        const paginatedAptitude = aptitude.slice((pageAptitude - 1) * ITEMS_PER_PAGE, pageAptitude * ITEMS_PER_PAGE);

                        return (
                          <>
                            {/* Section 1: Official Exams */}
                            {(examCategory === 'All' || examCategory === 'Official') && official.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                  <span>📌</span> Đề thi chính thức THPT Quốc Gia <span style={{ fontSize: '11px', background: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{official.length} đề</span>
                                </h3>
                                <div className="exam-cards-grid">
                                  {paginatedOfficial.map(renderCard)}
                                </div>
                                {official.length > ITEMS_PER_PAGE && (
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                                    <button 
                                      disabled={pageOfficial === 1} 
                                      onClick={() => setPageOfficial(pageOfficial - 1)}
                                      className="btn-outline"
                                      style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                      ◀ Trước
                                    </button>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Trang {pageOfficial} / {Math.ceil(official.length / ITEMS_PER_PAGE)}</span>
                                    <button 
                                      disabled={pageOfficial >= Math.ceil(official.length / ITEMS_PER_PAGE)} 
                                      onClick={() => setPageOfficial(pageOfficial + 1)}
                                      className="btn-outline"
                                      style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                      Sau ▶
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Section 2: Mock Exams */}
                            {(examCategory === 'All' || examCategory === 'Mock') && mocks.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                  <span>🏫</span> Đề thi thử các trường THPT Chuyên <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{mocks.length} đề</span>
                                </h3>
                                <div className="exam-cards-grid">
                                  {paginatedMocks.map(renderCard)}
                                </div>
                                {mocks.length > ITEMS_PER_PAGE && (
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                                    <button 
                                      disabled={pageMock === 1} 
                                      onClick={() => setPageMock(pageMock - 1)}
                                      className="btn-outline"
                                      style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                      ◀ Trước
                                    </button>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Trang {pageMock} / {Math.ceil(mocks.length / ITEMS_PER_PAGE)}</span>
                                    <button 
                                      disabled={pageMock >= Math.ceil(mocks.length / ITEMS_PER_PAGE)} 
                                      onClick={() => setPageMock(pageMock + 1)}
                                      className="btn-outline"
                                      style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                      Sau ▶
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Section 3: Aptitude Exams */}
                            {(examCategory === 'All' || examCategory === 'Aptitude') && aptitude.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                  <span>🎯</span> Đề Đánh giá năng lực ĐHQG (HSA / APT) <span style={{ fontSize: '11px', background: 'rgba(219, 129, 66, 0.1)', color: '#db8142', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{aptitude.length} đề</span>
                                </h3>
                                <div className="exam-cards-grid">
                                  {paginatedAptitude.map(renderCard)}
                                </div>
                                {aptitude.length > ITEMS_PER_PAGE && (
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                                    <button 
                                      disabled={pageAptitude === 1} 
                                      onClick={() => setPageAptitude(pageAptitude - 1)}
                                      className="btn-outline"
                                      style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                      ◀ Trước
                                    </button>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Trang {pageAptitude} / {Math.ceil(aptitude.length / ITEMS_PER_PAGE)}</span>
                                    <button 
                                      disabled={pageAptitude >= Math.ceil(aptitude.length / ITEMS_PER_PAGE)} 
                                      onClick={() => setPageAptitude(pageAptitude + 1)}
                                      className="btn-outline"
                                      style={{ padding: '6px 16px', fontSize: '12.5px', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                      Sau ▶
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                  </div>

                  {/* Right Column: Statistics Sidebar widgets */}
                  <div className="exams-sidebar-panel">
                    
                    {/* Widget 1: Personal Performance Stats */}
                    <div className="exams-sidebar-widget animate-in">
                      <h4>Thành tích thi thử</h4>
                      <div className="stat-row-enhanced">
                        <div className="stat-row-icon" style={{ background: '#fef3c7', color: '#d97706' }}>🔥</div>
                        <div className="stat-row-info">
                          <span className="stat-row-label">Chuỗi ngày ôn luyện (Streak)</span>
                          <span className="stat-row-value">{attemptsHistory.length > 0 ? "3 ngày liên tục" : "0 ngày"}</span>
                        </div>
                      </div>
                      <div className="stat-row-enhanced">
                        <div className="stat-row-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>📈</div>
                        <div className="stat-row-info">
                          <span className="stat-row-label">Điểm trung bình (Average Score)</span>
                          <span className="stat-row-value">
                            {attemptsHistory.length > 0
                              ? (attemptsHistory.reduce((sum, item) => sum + item.score, 0) / attemptsHistory.length).toFixed(1)
                              : '0.0'} / 10.0
                          </span>
                        </div>
                      </div>
                      <div className="stat-row-enhanced">
                        <div className="stat-row-icon" style={{ background: '#d1fae5', color: '#065f46' }}>✓</div>
                        <div className="stat-row-info">
                          <span className="stat-row-label">Đề thi đã hoàn thành</span>
                          <span className="stat-row-value">{attemptsHistory.length} bộ đề</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 2: Leaderboard */}
                    <div className="exams-sidebar-widget animate-in">
                      <h4>Bảng vàng thành tích</h4>
                      <table className="exams-sidebar-table">
                        <thead>
                          <tr>
                            <th>Hạng</th>
                            <th>Học sinh</th>
                            <th style={{ textAlign: 'right' }}>Điểm số</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><span className="rank-1">1</span></td>
                            <td><strong>Nguyễn Lâm Vy</strong> <span style={{ display: 'block', fontSize: '10px', color: '#6b7280' }}>Khối A01</span></td>
                            <td style={{ textAlign: 'right', fontWeight: '900', color: '#d97706' }}>9.8</td>
                          </tr>
                          <tr>
                            <td><span className="rank-2">2</span></td>
                            <td><strong>Trần Minh Đức</strong> <span style={{ display: 'block', fontSize: '10px', color: '#6b7280' }}>Khối B00</span></td>
                            <td style={{ textAlign: 'right', fontWeight: '900', color: '#475569' }}>9.6</td>
                          </tr>
                          <tr>
                            <td><span className="rank-3">3</span></td>
                            <td><strong>Lê Quỳnh Chi</strong> <span style={{ display: 'block', fontSize: '10px', color: '#6b7280' }}>Khối D01</span></td>
                            <td style={{ textAlign: 'right', fontWeight: '900', color: '#b45309' }}>9.4</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Widget 3: AI study tips */}
                    <div className="exams-sidebar-widget exams-ai-tips-widget animate-in">
                      <h4>💡 Lời khuyên từ EduBot AI</h4>
                      <div className="ai-tip-card">
                        🎯 <strong>Toán học:</strong> Hãy chú trọng rèn luyện kỹ năng giải nhanh bằng máy tính Casio các dạng hàm số ở phần Vận dụng.
                      </div>
                      <div className="ai-tip-card">
                        ⚡ <strong>Vật lý:</strong> Dành thêm 15 phút mỗi ngày làm quen với phương pháp giản đồ vector cho mạch xoay chiều RLC.
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* AI Q&A Tutor tab */}
              {parsedRoute.tab === 'ai-qa' && (
                <AITutorPage
                  currentUser={currentUser}
                  navigateTo={navigateTo}
                  addLog={addLog}
                />
              )}

              {/* Library docs downloads tab */}
              {parsedRoute.tab === 'library' && (
                <LibraryCabinet addLog={addLog} />
              )}

              {/* Notifications Tab */}
              {parsedRoute.tab === 'notifications' && (
                <NotificationsPage
                  currentUser={currentUser}
                  navigateTo={navigateTo}
                />
              )}

              {/* Settings Profile tab (natively handled by StudentDashboard) */}
              {false && parsedRoute.tab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }} className="animate-in">
                  {/* Settings tab placeholder (natively handled by StudentDashboard) */}
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>⚙️ CÀI ĐẶT TÀI KHOẢN & HỒ SƠ</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cập nhật hồ sơ cá nhân, điều chỉnh mục tiêu học tập và đổi mật khẩu bảo mật của bạn.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    
                    {/* HÀNG 1: THÔNG TIN CÁ NHÂN */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        👤 1. THÔNG TIN CÁ NHÂN & LIÊN HỆ
                      </h4>

                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '24px', 
                        alignItems: 'center',
                        background: 'var(--bg-main)',
                        padding: '20px',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)'
                      }}>
                        {/* Avatar Image circle on the left (increased size to 76px for premium feel) */}
                        <div style={{ position: 'relative', width: '76px', height: '76px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', boxShadow: '0 8px 20px rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {settingsAvatar && settingsAvatar.startsWith('data:image/') ? (
                            <img 
                              src={settingsAvatar} 
                              alt="Avatar Preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ 
                              width: '100%', height: '100%', 
                              background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', 
                              color: '#fff', fontSize: '32px', fontWeight: 'bold', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center' 
                            }}>
                              {settingsAvatar ? String(settingsAvatar).slice(0, 2).toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>

                        {/* Modern uploader specs on the right */}
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                            Ảnh đại diện tài khoản
                          </h4>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                            Tải lên ảnh chân dung thực tế của bạn để đồng bộ hiển thị trên toàn bộ hệ thống lớp học trực tuyến EduPath. Định dạng hỗ trợ: PNG, JPG, JPEG (Tối đa 2MB).
                          </p>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <label 
                              style={{
                                padding: '8px 18px', fontSize: '12.5px', background: 'var(--primary)',
                                color: '#fff', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                fontWeight: 'bold', boxShadow: '0 4px 12px rgba(108,92,231,0.25)',
                                transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px'
                              }}
                            >
                              📁 Tải ảnh mới lên
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                      showToast.current('Dung lượng ảnh tối đa là 2MB!', 'warning');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setSettingsAvatar(event.target.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>

                            {settingsAvatar && settingsAvatar.startsWith('data:image/') && (
                              <button
                                type="button"
                                className="btn-outline"
                                onClick={() => {
                                  // Revert to student initials or a simple placeholder letter from fullname
                                  const firstLetter = settingsName ? settingsName.charAt(0) : '🦊';
                                  setSettingsAvatar(firstLetter);
                                }}
                                style={{ 
                                  padding: '8px 18px', fontSize: '12.5px', 
                                  color: 'var(--accent-red)', borderColor: 'var(--border)',
                                  borderRadius: 'var(--radius-md)', fontWeight: 'bold' 
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.borderColor = 'var(--accent-red)';
                                  e.currentTarget.style.background = 'rgba(231, 76, 60, 0.05)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.borderColor = 'var(--border)';
                                  e.currentTarget.style.background = 'none';
                                }}
                              >
                                🗑️ Xóa ảnh đại diện
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: '600' }}>Họ và tên:</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settingsName}
                            onChange={e => setSettingsName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: '600' }}>Địa chỉ Email (Không thể đổi):</label>
                          <input
                            type="email"
                            className="form-control"
                            value={currentUser.email}
                            disabled
                            style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: '600' }}>Số điện thoại:</label>
                          <input
                            type="tel"
                            className="form-control"
                            placeholder="Nhập số điện thoại"
                            value={settingsPhone}
                            onChange={e => setSettingsPhone(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: '600' }}>Ngày sinh:</label>
                          <input
                            type="date"
                            className="form-control"
                            value={settingsDob}
                            onChange={e => setSettingsDob(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: '600' }}>Tỉnh / Thành phố:</label>
                          <select
                            className="form-control"
                            value={settingsCity}
                            onChange={e => setSettingsCity(e.target.value)}
                          >
                            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Quảng Ninh', 'Nghệ An', 'Thừa Thiên Huế', 'Bình Dương', 'Đồng Nai'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* HÀNG 2: MỤC TIÊU HỌC TẬP (Chỉ hiển thị cho học sinh) */}
                    {role === 'student' && (
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🎯 2. MỤC TIÊU HỌC TẬP & KHỐI THI
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Trường THPT:</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Nhập tên trường cấp 3"
                              value={settingsSchool}
                              onChange={e => setSettingsSchool(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Tổ hợp môn thi mục tiêu:</label>
                            <select
                              className="form-control"
                              value={settingsCombo}
                              onChange={e => setSettingsCombo(e.target.value)}
                            >
                              <option value="A01 (Toán – Lý – Anh)">A01 (Toán – Lý – Anh)</option>
                              <option value="B00 (Toán – Hóa – Sinh)">B00 (Toán – Hóa – Sinh)</option>
                              <option value="D01 (Toán – Văn – Anh)">D01 (Toán – Văn – Anh)</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Trường Đại học mong ước:</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Ví dụ: Đại học Bách Khoa Hà Nội, NEU..."
                              value={settingsTargetUniversity}
                              onChange={e => setSettingsTargetUniversity(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Mục tiêu điểm số thi THPTQG:</span>
                            <span className="badge-pill" style={{ background: 'var(--primary)', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{settingsTargetScore.toFixed(1)} Điểm</span>
                          </div>
                          <input 
                            type="range" 
                            min="20.0" 
                            max="30.0" 
                            step="0.1" 
                            value={settingsTargetScore}
                            onChange={e => setSettingsTargetScore(parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px', borderRadius: '3px' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                            <span>Khá (20.0đ)</span>
                            <span>Giỏi (25.0đ)</span>
                            <span>Xuất sắc (30.0đ)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HÀNG 3: BẢO MẬT VÀ THÔNG BÁO & ĐỔI MẬT KHẨU */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                      
                      {/* BẢO MẬT & LIÊN KẾT */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent-orange)' }}>
                          🔔 3. THÔNG BÁO & KẾT NỐI
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>THIẾT LẬP THÔNG BÁO:</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12.5px' }}>
                            <input 
                              type="checkbox" 
                              checked={settingsNotifEmail} 
                              onChange={e => setSettingsNotifEmail(e.target.checked)} 
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                            />
                            Nhận email thông báo kết quả học tập tuần
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12.5px' }}>
                            <input 
                              type="checkbox" 
                              checked={settingsNotifInApp} 
                              onChange={e => setSettingsNotifInApp(e.target.checked)} 
                              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                            />
                            Hiển thị chuông thông báo hoạt động mới
                          </label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>LIÊN KẾT TÀI KHOẢN MẠNG XÃ HỘI (UC-03):</span>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              🌐 Tài khoản Facebook
                            </span>
                            <button
                              type="button"
                              onClick={() => setSettingsLinkedFb(!settingsLinkedFb)}
                              style={{
                                padding: '4px 10px', fontSize: '11px', fontWeight: 'bold',
                                background: settingsLinkedFb ? 'rgba(0,184,148,0.1)' : 'var(--border)',
                                color: settingsLinkedFb ? 'var(--accent-green)' : 'var(--text-secondary)',
                                border: 'none', borderRadius: '4px', cursor: 'pointer'
                              }}
                            >
                              {settingsLinkedFb ? '✓ Đã liên kết' : '+ Liên kết ngay'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              📧 Tài khoản Google
                            </span>
                            <button
                              type="button"
                              onClick={() => setSettingsLinkedGg(!settingsLinkedGg)}
                              style={{
                                padding: '4px 10px', fontSize: '11px', fontWeight: 'bold',
                                background: settingsLinkedGg ? 'rgba(0,184,148,0.1)' : 'var(--border)',
                                color: settingsLinkedGg ? 'var(--accent-green)' : 'var(--text-secondary)',
                                border: 'none', borderRadius: '4px', cursor: 'pointer'
                              }}
                            >
                              {settingsLinkedGg ? '✓ Đã liên kết' : '+ Liên kết ngay'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* KHỐI ĐỔI MẬT KHẨU */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSettingsPasswordChange(settingsOldPass, settingsNewPass, settingsConfirmNewPass);
                      }} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent-red)' }}>
                          🔒 4. ĐỔI MẬT KHẨU BẢO MẬT
                        </h4>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: '600' }}>Mật khẩu hiện tại:</label>
                          <input
                            type="password"
                            className="form-control"
                            value={settingsOldPass}
                            onChange={e => setSettingsOldPass(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: '600' }}>Mật khẩu mới:</label>
                          <input
                            type="password"
                            className="form-control"
                            value={settingsNewPass}
                            onChange={e => setSettingsNewPass(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11px', fontWeight: '600' }}>Xác nhận mật khẩu mới:</label>
                          <input
                            type="password"
                            className="form-control"
                            value={settingsConfirmNewPass}
                            onChange={e => setSettingsConfirmNewPass(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '4px', background: 'var(--accent-red)', border: 'none' }}>
                          Xác nhận đổi mật khẩu
                        </button>
                      </form>

                    </div>

                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        // Reset changes
                        navigateTo('/user/home');
                      }}
                      className="header-icon-btn"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: '13px', height: 'auto', color: 'var(--text-secondary)' }}
                    >
                      Hủy bỏ thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        // Automatically update password first if any password fields are filled
                        if (settingsOldPass || settingsNewPass || settingsConfirmNewPass) {
                          await handleSettingsPasswordChange(settingsOldPass, settingsNewPass, settingsConfirmNewPass);
                        }
                        // Save profile configurations
                        const updatedUser = {
                          ...currentUser,
                          name: settingsName,
                          avatar: settingsAvatar,
                          dob: settingsDob,
                          phone: settingsPhone,
                          city: settingsCity,
                          school: settingsSchool,
                          combo: settingsCombo,
                          targetScore: settingsTargetScore,
                          targetUniversity: settingsTargetUniversity,
                          notificationsEnabled: settingsNotifEmail,
                          inAppAlertsEnabled: settingsNotifInApp,
                          linkedFacebook: settingsLinkedFb,
                          linkedGoogle: settingsLinkedGg
                        };
                        handleSaveProfile(updatedUser);
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 24px', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
                    >
                      Lưu tất cả cấu hình hồ sơ
                    </button>
                  </div>
                </div>
              )}
              </StudentDashboard>
            </RouteGuard>
          )}

          {/* Student classroom details view */}
          {effectiveRole === 'student' && parsedRoute.route === 'dashboard' && activeCourseDetails && (
            <RouteGuard allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} currentUser={currentUser}>
              <CourseDetails
                course={activeCourseDetails}
                onBack={() => setActiveCourseDetails(null)}
                addLog={addLog}
              />
            </RouteGuard>
          )}

          {/* Student active test simulator taking view */}
          {effectiveRole === 'student' && parsedRoute.route === 'dashboard' && activeTestSimulator && (
            <RouteGuard allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} currentUser={currentUser}>
              <TestSimulator
                exam={typeof activeTestSimulator === 'object' ? activeTestSimulator : null}
                testName={typeof activeTestSimulator === 'object' ? activeTestSimulator.title : activeTestSimulator}
                onFinished={handleFinishedTest}
                addLog={addLog}
              />
            </RouteGuard>
          )}

          {/* Student active OCR Scanner view */}
          {effectiveRole === 'student' && parsedRoute.route === 'dashboard' && activeOCRScanner && (
            <RouteGuard allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} currentUser={currentUser}>
              <OCRScanner
                examsList={examsList}
                onBack={() => setActiveOCRScanner(null)}
                addLog={addLog}
              />
            </RouteGuard>
          )}

          {/* ================= TEACHER WORKSPACE ================= */}
          {(effectiveRole === 'teacher' && (parsedRoute.route === 'dashboard' || parsedRoute.route === 'teacher')) && (
            <RouteGuard allowedRoles={['TEACHER', 'ADMIN']} currentUser={currentUser}>
              {parsedRoute.tab === 'forum' ? (
                <Forum currentUser={currentUser} />
              ) : (
                <TeacherDashboard
                  currentUser={currentUser}
                  courses={courses}
                  onCreateCourse={handleCreateCourse}
                  onDeleteCourse={handleDeleteCourse}
                  onRefreshCourses={fetchInitialData}
                  questionBank={questionBank}
                  onAddQuestion={handleAddQuestion}
                  addLog={addLog}
                  activeTab={parsedRoute.tab}
                  navigateTo={navigateTo}
                  setActiveTab={(tab) => {
                    const prefix = parsedRoute.route === 'teacher' ? '/teacher' : '/dashboard';
                    if (tab === 'courses') navigateTo(`${prefix}/courses`);
                    else if (tab === 'forum') navigateTo(`${prefix}/forum`);
                    else if (tab === 'questions') navigateTo(`${prefix}/questions`);
                    else if (tab === 'stats') navigateTo(`${prefix}/stats`);
                    else if (tab === 'settings') navigateTo(`${prefix}/settings`);
                    else navigateTo(`${prefix}/home`);
                  }}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated);
                    setUsersList(prev => prev.map(u => u.email === updated.email ? updated : u));
                    localStorage.setItem('current_user', JSON.stringify(updated));
                  }}
                />
              )}
            </RouteGuard>
          )}
          {/* ================= AFFILIATE WORKSPACE ================= */}
          {effectiveRole === 'affiliate' && parsedRoute.route === 'dashboard' && (
            <RouteGuard allowedRoles={['AFFILIATE', 'ADMIN']} currentUser={currentUser}>
              <AffiliateDashboard
                currentUser={currentUser}
                activeTab={parsedRoute.tab}
                setActiveTab={(tab) => {
                  if (tab === 'leaderboard') navigateTo('/dashboard/leaderboard');
                  else if (tab === 'settings') navigateTo('/dashboard/settings');
                  else if (tab === 'home') navigateTo('/dashboard/home');
                  else navigateTo(`/dashboard/${tab}`);
                }}
                navigateTo={navigateTo}
              />
            </RouteGuard>
          )}

          {/* ================= ADMIN WORKSPACE ================= */}
          {parsedRoute.route === 'admin' && (
            <RouteGuard allowedRoles={['ADMIN']} currentUser={currentUser}>
              {parsedRoute.tab === 'forum' ? (
                <Forum currentUser={currentUser} />
              ) : (
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
                  activeTab={parsedRoute.tab}
                  setActiveTab={(tab) => {
                    if (tab === 'home') navigateTo('/admin');
                    else navigateTo(`/admin/${tab}`);
                  }}
                  navigateTo={navigateTo}
                  submissions={submissions}
                  leadsList={leadsList}
                  setLeadsList={setLeadsList}
                  featureFlags={featureFlags}
                  setFeatureFlags={setFeatureFlags}
                />
              )}
            </RouteGuard>
          )}
        </main>
      </div>

      {/* Checkout Shopping Portal */}
      {checkoutCourse && (
        <CheckoutModal
          courses={cartCourses}
          onClose={() => {
            setCheckoutCourse(null);
            if (paymentSuccessRedirect) {
              navigateTo('/user/courses');
              setPaymentSuccessRedirect(false);
            }
          }}
          onPaymentSuccess={(ids, code) => {
            handlePaymentSuccess(ids, code);
            setPaymentSuccessRedirect(true);
          }}
          onRemoveCourse={(courseId) => {
            const updated = cartCourses.filter(c => c.id !== courseId);
            setCartCourses(updated);
            localStorage.setItem('app_cart_courses', JSON.stringify(updated));
            if (updated.length === 0) {
              setCheckoutCourse(null);
            }
          }}
          addLog={addLog}
        />
      )}

      {/* Upgrade Premium Modal */}
      {showUpgradePRO && (
        <UpgradeModal
          onClose={() => setShowUpgradePRO(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
          addLog={addLog}
        />
      )}

      {/* Announcement Popup Overlay */}
      {currentAnnouncement && (
        <AnnouncementPopup
          announcement={currentAnnouncement}
          onClose={() => {
            // Dismiss it for the session
            setSessionDismissedAnnouncements(prev => [...prev, currentAnnouncement.id]);
            setCurrentAnnouncement(null);
          }}
        />
      )}



      {/* ── Toast Notifications ── */}
      <div className={`app-toasts-container ${['ai-tutor', 'flashcards', 'mock-exam-taking', 'mock-exam-result'].includes(parsedRoute?.route) ? 'dark-theme' : ''}`}>
        {toasts.map(t => (
          <div key={t.id} className={`app-toast app-toast-${t.type}`}>
            <span className="app-toast-icon">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : '⚠️'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* ── AI Feedback Modal ── */}
      {aiFeedbackModal && (
        <div className="ai-feedback-modal-overlay" onClick={() => setAiFeedbackModal(null)}>
          <div className="ai-feedback-modal" onClick={e => e.stopPropagation()}>
            <h3>🤖 Chẩn đoán AI — {aiFeedbackModal.exam?.title || 'Đề tự luyện'}</h3>

            <div className="ai-feedback-section">
              <div className="ai-feedback-section-label">📝 Đánh giá chung</div>
              <div className="ai-feedback-section-body">
                {aiFeedbackModal.feedback.assessment || 'Chưa có đánh giá.'}
              </div>
            </div>

            <div className="ai-feedback-section">
              <div className="ai-feedback-section-label">⚠️ Lỗ hổng kiến thức</div>
              <div className="ai-feedback-section-body">
                {(aiFeedbackModal.feedback.knowledgeGaps || []).length > 0
                  ? (aiFeedbackModal.feedback.knowledgeGaps).map((gap, i) => (
                      <span key={i} className="ai-feedback-gap-tag">{gap}</span>
                    ))
                  : <span style={{ color: 'var(--accent-green)' }}>Không phát hiện lỗ hổng lớn ✓</span>
                }
              </div>
            </div>

            {(aiFeedbackModal.feedback.advice || []).length > 0 && (
              <div className="ai-feedback-section">
                <div className="ai-feedback-section-label">💡 Lời khuyên cải thiện</div>
                <div className="ai-feedback-section-body" style={{ padding: '6px 14px' }}>
                  {(aiFeedbackModal.feedback.advice).map((item, i) => (
                    <div key={i} className="ai-feedback-advice-item">
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="ai-feedback-close-btn" onClick={() => setAiFeedbackModal(null)}>
              Đã hiểu, đóng lại
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
