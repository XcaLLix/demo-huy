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
import CourseDetails from './components/CourseDetails';
import TestSimulator from './components/TestSimulator';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import AISystemCenter from './components/AISystemCenter';
import Forum from './components/Forum';
import CourseMall from './components/CourseMall';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import OCRScanner from './components/OCRScanner.jsx';
import StudentDashboard from './components/dashboard/StudentDashboard';

import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LearningPage from './pages/LearningPage';
import MockExamsPage from './pages/MockExamsPage';
import MockExamDetailPage from './pages/MockExamDetailPage';
import MockExamTakingPage from './pages/MockExamTakingPage';
import MockExamResultPage from './pages/MockExamResultPage';
import { enrollmentService } from './services/enrollmentService';
import './styles/mockExams.css';
import './styles/dashboard.css';

import { HiPlay, HiDocumentDownload, HiBeaker, HiX } from 'react-icons/hi';
import { api } from './api';

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
  },
  {
    id: 103,
    name: 'Trần Văn Thuận',
    email: 'Tranvanthuan2005tt@gmail.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'AD',
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
    id: 100,
    title: "📢 [THÔNG BÁO QUAN TRỌNG] Lịch thi thử THPT Quốc Gia 2026 & Tài liệu Ôn tập Độc quyền",
    content: "Chào toàn thể các em học sinh trên hệ thống EduPath AI,\n\nBan Quản Trị xin gửi tới các em lịch thi thử trực tuyến các môn học trọng điểm (Toán, Lý, Hóa, Anh, Sinh) chuẩn cấu trúc của Bộ GD&ĐT. Các đề thi sẽ được mở vào tối thứ 7 hàng tuần lúc 20:00.\n\nSau khi làm bài, các em sẽ nhận được phân tích kết quả chi tiết từ hệ thống AI và lộ trình khắc phục lỗ hổng kiến thức tương ứng.\n\nChúc các em ôn tập đạt kết quả cao nhất!",
    subject: "Khác",
    author: "Trần Văn Thuận",
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

  const mathExams = backendExams.filter(e => e.subject === 'Toán học');
  const physicsExams = backendExams.filter(e => e.subject === 'Vật lý');
  const chemistryExams = backendExams.filter(e => e.subject === 'Hóa học');
  const biologyExams = backendExams.filter(e => e.subject === 'Sinh học');
  const englishExams = backendExams.filter(e => e.subject === 'Tiếng Anh');
  const aptitudeExams = backendExams.filter(e => e.subject.includes('Đánh giá năng lực') || e.title.includes('HSA') || e.title.includes('ĐGNL'));

  const getMappedId = (subject) => {
    let list = [];
    if (subject === 'Toán học') list = mathExams;
    else if (subject === 'Vật lý') list = physicsExams;
    else if (subject === 'Hóa học') list = chemistryExams;
    else if (subject === 'Sinh học') list = biologyExams;
    else if (subject === 'Tiếng Anh') list = englishExams;
    else list = aptitudeExams;

    if (list.length === 0) return backendExams[0]?.id;
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex]?.id;
  };

  const list = [...backendExams];

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
        const examObj = backendExams.find(e => e.id === mappedId);
        list.push({
          id: count,
          title: `Đề thi thử ${subject} THPTQG ${year} - ${school}`,
          subject,
          subjectGroup: subject === 'Tiếng Anh' ? 'D01' : (subject === 'Sinh học' ? 'B00' : 'A01'),
          duration: subject === 'Toán học' ? 90 : (subject === 'Tiếng Anh' ? 60 : 50),
          isPublic: true,
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
    const examObj = backendExams.find(e => e.id === mappedId);
    list.push({
      id: count,
      title: aptitudeTitles[i],
      subject: 'Đánh giá năng lực',
      subjectGroup: 'A01',
      duration: 150,
      isPublic: true,
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
        const examObj = backendExams.find(e => e.id === mappedId);
        list.push({
          id: count,
          title: `Đề thi chính thức THPT QG Môn ${subject} ${year} - Mã đề ${code}`,
          subject,
          subjectGroup: subject === 'Tiếng Anh' ? 'D01' : (subject === 'Sinh học' ? 'B00' : 'A01'),
          duration: subject === 'Toán học' ? 90 : (subject === 'Tiếng Anh' ? 60 : 50),
          isPublic: true,
          isGenerated: true,
          dbExamId: mappedId,
          examQuestions: examObj?.examQuestions || []
        });
      }
    }
  }

  return list;
};

export default function App() {
  // Global Application States
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('current_user')) || null);
  const [role, setRole] = useState(() => localStorage.getItem('user_role') || 'guest');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [activeTab, setActiveTab] = useState('home');

  // Custom SPA Router State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const getParsedRoute = () => {
    if (currentPath === '/courses') {
      return { route: 'courses-list' };
    }
    const courseMatch = currentPath.match(/^\/courses\/(\d+)$/);
    if (courseMatch) {
      return { route: 'course-detail', courseId: courseMatch[1] };
    }
    const learnMatch = currentPath.match(/^\/learn\/(\d+)(?:\/lesson\/(\d+))?$/);
    if (learnMatch) {
      return { route: 'learn', courseId: learnMatch[1], lessonId: learnMatch[2] || null };
    }
    if (currentPath === '/mock-exams') {
      return { route: 'mock-exams-list' };
    }
    const mockExamMatch = currentPath.match(/^\/mock-exams\/([^/]+)$/);
    if (mockExamMatch && !currentPath.includes('/start') && !currentPath.includes('/result/')) {
      return { route: 'mock-exam-detail', examId: mockExamMatch[1] };
    }
    const mockExamTakingMatch = currentPath.match(/^\/mock-exams\/([^/]+)\/start$/);
    if (mockExamTakingMatch) {
      return { route: 'mock-exam-taking', examId: mockExamTakingMatch[1] };
    }
    const mockExamResultMatch = currentPath.match(/^\/mock-exams\/([^/]+)\/result\/([^/]+)$/);
    if (mockExamResultMatch) {
      return { route: 'mock-exam-result', examId: mockExamResultMatch[1], attemptId: mockExamResultMatch[2] };
    }

    return { route: 'legacy' };
  };

  const parsedRoute = getParsedRoute();

  // Relational Tables databases in localStorage
  const [usersList, setUsersList] = useState(() => {
    const list = JSON.parse(localStorage.getItem('users_list')) || initialUsers;
    if (!list.find(u => u.email.toLowerCase() === 'tranvanthuan2005tt@gmail.com')) {
      list.push({
        id: 103,
        name: 'Trần Văn Thuận',
        email: 'Tranvanthuan2005tt@gmail.com',
        password: 'admin123',
        role: 'admin',
        avatar: 'AD',
        isBanned: false,
        status: 'active'
      });
    } else {
      list.forEach(u => {
        if (u.email.toLowerCase() === 'tranvanthuan2005tt@gmail.com') {
          u.role = 'admin';
          u.status = 'active';
        }
      });
    }
    return list;
  });
  const [courses, setCourses] = useState(() => JSON.parse(localStorage.getItem('app_courses')) || initialCourses);
  const [examsList, setExamsList] = useState([]);
  const [attemptsHistory, setAttemptsHistory] = useState([]);
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
  const [activeOCRScanner, setActiveOCRScanner] = useState(null);
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
  const [showUpgradePRO, setShowUpgradePRO] = useState(false);

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
  }, [currentUser, activeTab]);

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

  // Sync live backend data if logged in
  const fetchInitialData = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch courses from backend
      const backendCourses = await api.getCourses();
      if (backendCourses && backendCourses.length > 0) {
        const mapped = backendCourses.map(c => ({
          id: c.id,
          title: c.title,
          subject: c.subject,
          price: c.price.toLocaleString('vi-VN'),
          teacherName: c.teacher?.user?.fullName || c.teacherName || 'Giảng viên',
          isUnlocked: c.isUnlocked || currentUser?.unlockedCourses?.includes(c.id) || false,
          lessons: c.lessons || []
        }));
        setCourses(mapped);
      }
    } catch (err) {
      console.warn("Không thể tải danh sách khóa học từ backend API, sử dụng mock thay thế.");
    }

    try {
      // 2. Fetch User PRO status
      const proStatus = await api.checkProStatus();
      if (proStatus && proStatus.isPro !== currentUser.isPro) {
        setCurrentUser(prev => prev ? { ...prev, isPro: proStatus.isPro } : null);
      }
    } catch (err) {
      // ignore
    }

    try {
      // 3. Fetch exams from backend
      const backendExams = await api.getExams();
      if (backendExams && backendExams.length > 0) {
        setExamsList(generateMassiveExamsList(backendExams));
      }
    } catch (err) {
      console.warn("Không thể tải danh sách đề thi từ backend API.");
    }

    try {
      // 4. Fetch test attempts from backend
      const history = await api.getAttempts();
      if (history) {
        setAttemptsHistory(history);
      }
    } catch (err) {
      console.warn("Không thể tải lịch sử thi thử từ backend API.");
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [currentUser, activeTab]);

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
    if (targetTab === 'courses') {
      navigateTo('/courses');
    } else {
      navigateTo('/');
      setActiveTab(targetTab || 'home');
      setActiveCourseDetails(null);
      setActiveTestSimulator(null);
      setActiveOCRScanner(null);
    }
  };

  const handleLogout = () => {
    addLog(`Người dùng "${currentUser?.name}" đăng xuất an toàn khỏi hệ thống`, 'sys');
    navigateTo('/');
    setCurrentUser(null);
    setRole('guest');
    setActiveTab('home');
    setActiveCourseDetails(null);
    setActiveTestSimulator(null);
    setActiveOCRScanner(null);
    setCheckoutCourse(null);
  };


  const handleChangePassword = async (oldPass, newPass) => {
    try {
      await api.changePassword(oldPass, newPass);
      
      const updatedList = usersList.map(u => u.email === currentUser.email ? { ...u, password: newPass } : u);
      setUsersList(updatedList);
      
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      
      addLog(`Người dùng "${currentUser.name}" đổi mật khẩu tài khoản thành công (UC-04)`, 'sys');
      alert('Đổi mật khẩu thành công!');
    } catch (err) {
      alert(err.message || 'Đổi mật khẩu thất bại!');
    }
  };

  const handleSaveProfile = (updatedProfile) => {
    setCurrentUser(updatedProfile);
    const updatedList = usersList.map(u => u.email === updatedProfile.email ? updatedProfile : u);
    setUsersList(updatedList);
    addLog(`Người dùng "${updatedProfile.name}" cập nhật thông tin cá nhân thành công`, 'sys');
    alert('Lưu thông tin cá nhân thành công!');
  };

  const handleSettingsPasswordChange = async (oldPass, newPass, confirmPass) => {
    if (!oldPass || !newPass || !confirmPass) {
      alert('Vui lòng nhập đầy đủ các trường đổi mật khẩu!');
      return;
    }
    if (newPass.length < 6) {
      alert('Mật khẩu mới phải từ 6 ký tự trở lên!');
      return;
    }
    if (newPass !== confirmPass) {
      alert('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    try {
      await api.changePassword(oldPass, newPass);
      
      const updatedList = usersList.map(u => u.email === currentUser.email ? { ...u, password: newPass } : u);
      setUsersList(updatedList);
      
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      
      addLog(`Người dùng "${currentUser.name}" đổi mật khẩu thành công từ cài đặt cá nhân`, 'sys');
      alert('Đổi mật khẩu thành công!');
      setSettingsOldPass('');
      setSettingsNewPass('');
      setSettingsConfirmNewPass('');
    } catch (err) {
      alert(err.message || 'Đổi mật khẩu thất bại!');
    }
  };

  // Student purchases course
  const handlePaymentSuccess = async (courseId) => {
    // Write payment & enrollment rows into local storage db / Supabase tables
    if (currentUser) {
      try {
        const targetCourse = courses.find(c => c.id === courseId);
        const priceNum = targetCourse ? parseFloat(String(targetCourse.price).replace(/\D/g, '')) : 499000;
        await enrollmentService.enrollCourse(currentUser.id, courseId, priceNum);
      } catch (err) {
        console.error('Failed to log payment enrollment data:', err);
      }
    }

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
    const activeUnlocked = currentUser?.unlockedCourses || [];
    setCurrentUser({
      ...currentUser,
      unlockedCourses: [...activeUnlocked, courseId]
    });

    setCheckoutCourse(null);
  };

  // Student upgrades to PRO membership success
  const handleUpgradeSuccess = () => {
    // 1. Update in the local users database list
    const updatedUsers = usersList.map(u => {
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
          active={parsedRoute.route !== 'legacy' ? (parsedRoute.route.startsWith('mock-') ? 'tests' : 'courses') : activeTab}
          setActive={(tab) => {
            if (tab === 'courses') {
              navigateTo('/courses');
            } else if (tab === 'tests') {
              navigateTo('/mock-exams');
            } else {
              navigateTo('/');
              setActiveTab(tab);
              setActiveCourseDetails(null);
              setActiveTestSimulator(null);
              setActiveOCRScanner(null);
            }
          }}
          userProfile={currentUser}
          onLogout={handleLogout}
          onUpgradePRO={() => setShowUpgradePRO(true)}
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
                          alert('Mật khẩu mới phải có tối thiểu 6 ký tự!');
                          return;
                        }
                        if (password !== confirm) {
                          alert('Mật khẩu xác nhận không khớp! Vui lòng nhập lại.');
                          return;
                        }
                        try {
                          await api.resetPassword(resetToken, password);
                          alert('Đặt lại mật khẩu thành công! Em có thể đăng nhập bằng mật khẩu mới.');
                          setResetToken(null);
                          setActiveTab('login');
                        } catch (err) {
                          alert(err.message || 'Lỗi đặt lại mật khẩu.');
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
                          <button type="button" onClick={() => setActiveTab('login')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
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
                  onBackToLanding={() => setActiveTab('home')}
                />
              ) : (
                <LandingPage
                  currentUser={currentUser}
                  onNavigateToAuth={(mode) => setActiveTab(mode)}
                  onBackToDashboard={handleBackToDashboard}
                  onLogout={handleLogout}
                  forumPosts={forumPosts}
                  onAddPost={handleForumAddPost}
                  onLikePost={handleForumLikePost}
                  onAddComment={handleForumAddComment}
                  onAcceptCommentSolution={handleForumAcceptCommentSolution}
                  onCheckoutCourse={(course) => setCheckoutCourse(course)}
                  onNavigateToLearn={(courseId, lessonId) => {
                    if (currentUser) {
                      setActiveTab('home');
                      navigateTo(`/learn/${courseId}${lessonId ? `/lesson/${lessonId}` : ''}`);
                    } else {
                      setActiveTab('signup');
                    }
                  }}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated);
                    setUsersList(prev => prev.map(u => u.email === updated.email ? updated : u));
                  }}
                  currentPath={currentPath}
                  navigateTo={navigateTo}
                />
              )}
            </div>
          )}

          {/* ================= MOCK EXAMS ROUTER WORKSPACE ================= */}
          {role !== 'guest' && activeTab !== 'landing' && parsedRoute.route.startsWith('mock-') && (
            <div style={{ padding: '20px 0' }}>
              {parsedRoute.route === 'mock-exams-list' && (
                <MockExamsPage
                  currentUser={currentUser}
                  onSelectExam={(examId) => navigateTo(`/mock-exams/${examId}`)}
                  navigateTo={navigateTo}
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
            <div style={{ padding: '20px 0' }}>
              {parsedRoute.route === 'courses-list' && (
                <CoursesPage
                  currentUser={currentUser}
                  onSelectCourse={(course) => navigateTo(`/courses/${course.id}`)}
                  onCheckoutCourse={(course) => setCheckoutCourse(course)}
                  navigateTo={navigateTo}
                />
              )}

              {parsedRoute.route === 'course-detail' && (
                <CourseDetailPage
                  courseId={parsedRoute.courseId}
                  currentUser={currentUser}
                  onNavigateToLearn={(courseId, lessonId) => navigateTo(`/learn/${courseId}${lessonId ? `/lesson/${lessonId}` : ''}`)}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated);
                    const updatedList = usersList.map(u => u.email === updated.email ? updated : u);
                    setUsersList(updatedList);
                  }}
                  navigateTo={navigateTo}
                />
              )}
            </div>
          )}

          {/* ================= STUDENT LEARNING WORKSPACE ================= */}
          {role === 'student' && activeTab !== 'landing' && parsedRoute.route === 'learn' && (
            <div style={{ padding: '20px 0' }}>
              <LearningPage
                courseId={parsedRoute.courseId}
                lessonId={parsedRoute.lessonId}
                currentUser={currentUser}
                onSelectLesson={(courseId, lessonId) => navigateTo(`/learn/${courseId}/lesson/${lessonId}`)}
                onBackToCourse={() => navigateTo(`/courses/${parsedRoute.courseId}`)}
              />
            </div>
          )}

          {/* ================= STUDENT WORKSPACE ================= */}
          {role === 'student' && activeTab !== 'landing' && parsedRoute.route === 'legacy' && !activeCourseDetails && !activeTestSimulator && !activeOCRScanner && (

            <div>
              {activeTab === 'home' && (
                <StudentDashboard
                  currentUser={currentUser}
                  setActiveTab={setActiveTab}
                  navigateTo={navigateTo}
                />
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
                <Forum currentUser={currentUser} />
              )}

              {/* Leaderboard tab */}
              {activeTab === 'leaderboard' && (
                <div className="card animate-in" style={{ border: '3px solid #000', boxShadow: '5px 5px 0px #000', padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #000', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '950', color: '#000', margin: 0 }}>
                        🏆 BẢNG XẾP HẠNG HỌC VIÊN XUẤT SẮC
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        Bảng vàng vinh danh những chiến thần học tập có phong độ cao nhất trên hệ thống EduPath.
                      </p>
                    </div>
                    <span style={{ fontSize: '32px' }}>🏆</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #fef9c3, #fef08a)', border: '2px solid #000', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '3px 3px 0px #000' }}>
                      <span style={{ fontSize: '24px' }}>🥇 Thủ khoa Tuần</span>
                      <h4 style={{ fontSize: '16px', fontWeight: '900', margin: '8px 0 2px 0' }}>Nguyễn Lâm Vy</h4>
                      <p style={{ fontSize: '12px', color: '#854d0e', margin: 0 }}>Khối A01 – Điểm trung bình: <strong>9.8</strong></p>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '2px solid #000', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '3px 3px 0px #000' }}>
                      <span style={{ fontSize: '24px' }}>🥈 Á khoa Tuần</span>
                      <h4 style={{ fontSize: '16px', fontWeight: '900', margin: '8px 0 2px 0' }}>Trần Minh Đức</h4>
                      <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>Khối B00 – Điểm trung bình: <strong>9.6</strong></p>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #ffedd5, #fed7aa)', border: '2px solid #000', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '3px 3px 0px #000' }}>
                      <span style={{ fontSize: '24px' }}>🥉 Tam khoa Tuần</span>
                      <h4 style={{ fontSize: '16px', fontWeight: '900', margin: '8px 0 2px 0' }}>Lê Quỳnh Chi</h4>
                      <p style={{ fontSize: '12px', color: '#c2410c', margin: 0 }}>Khối D01 – Điểm trung bình: <strong>9.4</strong></p>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="exams-sidebar-table">
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000' }}>
                        <th style={{ padding: '12px 8px', fontWeight: '900' }}>Hạng</th>
                        <th style={{ padding: '12px 8px', fontWeight: '900' }}>Học sinh</th>
                        <th style={{ padding: '12px 8px', fontWeight: '900' }}>Tổ hợp môn</th>
                        <th style={{ padding: '12px 8px', fontWeight: '900' }}>Chuỗi học (Streak)</th>
                        <th style={{ padding: '12px 8px', fontWeight: '900', textAlign: 'right' }}>Điểm số</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { rank: 1, name: "Nguyễn Lâm Vy", combo: "A01 (Toán - Lý - Anh)", streak: 42, score: "9.8", avatar: "LV" },
                        { rank: 2, name: "Trần Minh Đức", combo: "B00 (Toán - Hóa - Sinh)", streak: 35, score: "9.6", avatar: "MĐ" },
                        { rank: 3, name: "Lê Quỳnh Chi", combo: "D01 (Toán - Văn - Anh)", streak: 28, score: "9.4", avatar: "QC" },
                        { rank: 4, name: "Phạm Minh Hoàng", combo: "A01 (Toán - Lý - Anh)", streak: 21, score: "9.0", avatar: "MH" },
                        { rank: 5, name: "Đỗ Gia Bảo", combo: "B00 (Toán - Hóa - Sinh)", streak: 17, score: "8.8", avatar: "GB" }
                      ].map(student => (
                        <tr key={student.rank} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <span className={student.rank <= 3 ? `rank-${student.rank}` : 'rank-other'}>
                              {student.rank}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#6c5ce7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                                {student.avatar}
                              </div>
                              <strong>{student.name}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#4b5563', fontSize: '13px' }}>{student.combo}</td>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: '#d97706' }}>🔥 {student.streak} ngày</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', fontSize: '15px' }}>{student.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Online Mock Exams tab */}
              {activeTab === 'tests' && (
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
                        background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.6), rgba(220, 252, 231, 0.6))',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
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
                        <span className="badge-pill" style={{ background: 'var(--accent-green)', color: '#fff', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>
                          ⚡ Tính năng Mới
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#14532d', margin: '6px 0 4px 0' }}>
                          📸 Tự động chấm điểm nhanh qua Camera (OCR)
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                          Làm bài ra giấy hoặc tô phiếu trắc nghiệm rồi chụp ảnh tải lên. AI sẽ tự động đọc kết quả, đối chiếu đáp án chính thức của Bộ GD&ĐT và chấm điểm ngay lập tức!
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setActiveOCRScanner(true)}
                        className="btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 22px',
                          fontSize: '13px',
                          fontWeight: '600',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
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
                                            alert(`🤖 [CHẨN ĐOÁN AI - Đề: ${att.exam?.title}]\n\n📝 Đánh giá chung: ${feedback.assessment || 'Chưa có đánh giá.'}\n\n⚠️ Lỗ hổng kiến thức: ${(feedback.knowledgeGaps || []).join(', ') || 'Không phát hiện lỗ hổng lớn.'}\n\n💡 Lời khuyên: \n${(feedback.advice || []).map(a => `- ${a}`).join('\n')}`);
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
              {activeTab === 'ai-qa' && (
                <AITutorChat addLog={addLog} />
              )}

              {/* Library docs downloads tab */}
              {activeTab === 'library' && (
                <LibraryCabinet addLog={addLog} />
              )}

              {/* Settings Profile tab */}
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }} className="animate-in">
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
                                      alert('Dung lượng ảnh tối đa là 2MB!');
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
                        setActiveTab('home');
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
              exam={typeof activeTestSimulator === 'object' ? activeTestSimulator : null}
              testName={typeof activeTestSimulator === 'object' ? activeTestSimulator.title : activeTestSimulator}
              onFinished={handleFinishedTest}
              addLog={addLog}
            />
          )}

          {/* Student active OCR Scanner view */}
          {role === 'student' && activeTab !== 'landing' && activeOCRScanner && (
            <OCRScanner
              examsList={examsList}
              onBack={() => setActiveOCRScanner(null)}
              addLog={addLog}
            />
          )}

          {/* ================= TEACHER WORKSPACE ================= */}
          {role === 'teacher' && activeTab !== 'landing' && (
            activeTab === 'forum' ? (
              <Forum
                forumPosts={forumPosts}
                onAddPost={handleForumAddPost}
                onLikePost={handleForumLikePost}
                onAddComment={handleForumAddComment}
                onAcceptCommentSolution={handleForumAcceptCommentSolution}
                currentUser={currentUser}
              />
            ) : (
              <TeacherDashboard
                courses={courses}
                onCreateCourse={handleCreateCourse}
                onDeleteCourse={handleDeleteCourse}
                questionBank={questionBank}
                onAddQuestion={handleAddQuestion}
                addLog={addLog}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )
          )}

          {/* ================= ADMIN WORKSPACE ================= */}
          {role === 'admin' && activeTab !== 'landing' && (
            activeTab === 'forum' ? (
              <Forum
                forumPosts={forumPosts}
                onAddPost={handleForumAddPost}
                onLikePost={handleForumLikePost}
                onAddComment={handleForumAddComment}
                onAcceptCommentSolution={handleForumAcceptCommentSolution}
                currentUser={currentUser}
              />
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
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )
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

      {/* Upgrade Premium Modal */}
      {showUpgradePRO && (
        <UpgradeModal
          onClose={() => setShowUpgradePRO(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
          addLog={addLog}
        />
      )}

      {/* Public Chatbot AI floating button and chat dialog */}
      <ChatbotWidget />


    </div>
  );
}
