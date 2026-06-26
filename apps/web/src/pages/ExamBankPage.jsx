import { useState, useEffect, useMemo } from 'react';
import { toast } from '../utils/toast';
import { api } from '../api';
import {
  HiSearch, HiDownload, HiEye, HiX,
  HiAcademicCap, HiDocumentText, HiClock,
  HiChartBar, HiArrowLeft, HiSparkles,
  HiBookOpen, HiClipboardList, HiLockClosed
} from 'react-icons/hi';

// ============================================================
// SUBJECT CONFIGURATION WITH DB MAPPINGS
// ============================================================
const SUBJECTS = [
  { id: 'toan', name: 'Toán Học', emoji: '🦉', color: '#5b75f3', dbName: 'Toán Học' },
  { id: 'van', name: 'Ngữ Văn', emoji: '🦋', color: '#4598a7', dbName: 'Ngữ Văn' },
  { id: 'anh', name: 'Tiếng Anh', emoji: '🐸', color: '#db8142', dbName: 'Tiếng Anh' },
  { id: 'ly', name: 'Vật Lý', emoji: '🦊', color: '#52ad58', dbName: 'Vật Lý' },
  { id: 'hoa', name: 'Hóa Học', emoji: '🐙', color: '#cf6674', dbName: 'Hóa Học' },
  { id: 'sinh', name: 'Sinh Học', emoji: '🐢', color: '#6f4ab3', dbName: 'Sinh Học' },
  { id: 'su', name: 'Lịch Sử', emoji: '📜', color: '#c44747', dbName: 'Lịch Sử' },
  { id: 'dia', name: 'Địa Lý', emoji: '🌍', color: '#2d8659', dbName: 'Địa Lý' },
  { id: 'ielts', name: 'Toeic & Ielts', emoji: '🇬🇧', color: '#e17055', dbName: 'Toeic & Ielts' },
  { id: 'sat', name: 'SAT', emoji: '🎓', color: '#00cec9', dbName: 'SAT' },
  { id: 'toeic', name: 'TOEIC', emoji: '📖', color: '#6c5ce7', dbName: 'TOEIC' },
  { id: 'dgnl', name: 'ĐGNL', emoji: '📝', color: '#fdcb6e', dbName: 'ĐGNL' }
];

const LEVELS = ['Tất cả', '10', '11', '12', 'Sinh viên'];
const PRICE_FILTERS = ['Tất cả', 'Miễn phí', 'Premium'];

// ============================================================
// RENDER HELPER FOR STRUCTURED METADATA
// ============================================================
function renderDescription(desc) {
  if (!desc) {
    return <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, fontStyle: 'italic' }}>Không có mô tả chi tiết cho tài liệu này.</p>;
  }
  try {
    const parsed = JSON.parse(desc);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => {
        if (item.type === 'heading') {
          return <h4 key={idx} style={{ fontSize: '14.5px', fontWeight: '800', marginTop: '16px', marginBottom: '8px', color: '#1e293b' }}>{item.text}</h4>;
        }
        if (item.type === 'paragraph') {
          return <p key={idx} style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', marginBottom: '8px' }}>{item.text}</p>;
        }
        if (item.type === 'list') {
          return (
            <ul key={idx} style={{ paddingLeft: '20px', fontSize: '13.5px', color: '#475569', marginBottom: '10px', listStyleType: 'disc' }}>
              {item.items?.map((li, lIdx) => <li key={lIdx} style={{ marginBottom: '4px' }}>{li}</li>)}
            </ul>
          );
        }
        if (item.type === 'divider') {
          return <hr key={idx} style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: '14px 0' }} />;
        }
        return null;
      });
    }
  } catch (e) {
    // Treat as raw text if JSON parse fails
  }
  return <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{desc}</p>;
}

// ============================================================
// EXAM BANK PAGE COMPONENT (DOCUMENT REPOSITORY)
// ============================================================
export default function ExamBankPage({ currentUser, navigateTo, hideHeader }) {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [documents, setDocuments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // ============================================================
  // LOCAL AI SEARCH, ROADMAP & CHATBOT STATES
  // ============================================================
  const [aiSearchText, setAiSearchText] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // States for quick document QA direct chat & autocomplete suggestions
  const [selectedDirectDoc, setSelectedDirectDoc] = useState(null);
  const [directChatHistory, setDirectChatHistory] = useState([]);
  const [directChatInput, setDirectChatInput] = useState('');
  const [isDirectChatTyping, setIsDirectChatTyping] = useState(false);
  const [suggestedDocs, setSuggestedDocs] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [modalTab, setModalTab] = useState('details'); // 'details' | 'chat' | 'discussion'
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Discussion board states
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);

  const fetchComments = async (docId) => {
    setCommentsLoading(true);
    try {
      const res = await api.getDocumentComments(docId);
      setComments(res);
      setCommentError(null);
    } catch (err) {
      setCommentError(err.message || 'Không thể tải thảo luận.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || !previewDoc) return;

    if (!currentUser) {
      toast('Vui lòng đăng nhập để tham gia thảo luận!', 'error');
      return;
    }

    try {
      const newComment = await api.addDocumentComment(previewDoc.id, newCommentText);
      setComments(prev => [newComment, ...prev]);
      setNewCommentText('');
      toast('Đã gửi câu hỏi/thảo luận thành công!', 'success');
    } catch (err) {
      toast(err.message || 'Không thể gửi thảo luận.', 'error');
    }
  };

  // Reset chatbot modal state & load comments on preview document change
  useEffect(() => {
    if (previewDoc) {
      setModalTab('details');
      setChatHistory([
        {
          role: 'assistant',
          text: `Xin chào! Anh là Trợ lý Học tập AI của EduPath. Rất vui được đồng hành cùng em trong việc chinh phục tài liệu "${previewDoc.title}". Em muốn hỏi gì về cuốn tài liệu này nào?`
        }
      ]);
      setNewCommentText('');
      fetchComments(previewDoc.id);
    }
  }, [previewDoc]);

  // Client-side NLP query interpreter to scan keywords and build roadmaps
  const interpretAiSearchPrompt = (prompt) => {
    const p = prompt.toLowerCase();
    
    // 1. Identify Subject matching SUBJECTS config
    let matchedSubjectId = null;
    let subjectObj = null;
    for (const sub of SUBJECTS) {
      if (p.includes(sub.name.toLowerCase()) || p.includes(sub.id) || (sub.dbName && p.includes(sub.dbName.toLowerCase()))) {
        matchedSubjectId = sub.id;
        subjectObj = sub;
        break;
      }
    }
    // Abbreviations mapping
    if (!matchedSubjectId) {
      if (p.includes('toán') || p.includes('math')) { matchedSubjectId = 'toan'; subjectObj = SUBJECTS.find(s => s.id === 'toan'); }
      else if (p.includes('văn') || p.includes('ngữ văn') || p.includes('literacy')) { matchedSubjectId = 'van'; subjectObj = SUBJECTS.find(s => s.id === 'van'); }
      else if (p.includes('anh') || p.includes('english') || p.includes('tiếng anh')) { matchedSubjectId = 'anh'; subjectObj = SUBJECTS.find(s => s.id === 'anh'); }
      else if (p.includes('lý') || p.includes('vật lý') || p.includes('physics')) { matchedSubjectId = 'ly'; subjectObj = SUBJECTS.find(s => s.id === 'ly'); }
      else if (p.includes('hóa') || p.includes('hóa học') || p.includes('chemistry')) { matchedSubjectId = 'hoa'; subjectObj = SUBJECTS.find(s => s.id === 'hoa'); }
      else if (p.includes('sinh') || p.includes('sinh học') || p.includes('biology')) { matchedSubjectId = 'sinh'; subjectObj = SUBJECTS.find(s => s.id === 'sinh'); }
      else if (p.includes('sử') || p.includes('lịch sử') || p.includes('history')) { matchedSubjectId = 'su'; subjectObj = SUBJECTS.find(s => s.id === 'su'); }
      else if (p.includes('địa') || p.includes('địa lý') || p.includes('geography')) { matchedSubjectId = 'dia'; subjectObj = SUBJECTS.find(s => s.id === 'dia'); }
      else if (p.includes('ielts')) { matchedSubjectId = 'ielts'; subjectObj = SUBJECTS.find(s => s.id === 'ielts'); }
      else if (p.includes('sat')) { matchedSubjectId = 'sat'; subjectObj = SUBJECTS.find(s => s.id === 'sat'); }
      else if (p.includes('toeic')) { matchedSubjectId = 'toeic'; subjectObj = SUBJECTS.find(s => s.id === 'toeic'); }
      else if (p.includes('đgnl') || p.includes('đánh giá năng lực')) { matchedSubjectId = 'dgnl'; subjectObj = SUBJECTS.find(s => s.id === 'dgnl'); }
    }

    // 2. Identify Education Level
    let matchedLevel = 'Tất cả';
    if (p.includes('10') || p.includes('lớp 10')) matchedLevel = '10';
    else if (p.includes('11') || p.includes('lớp 11')) matchedLevel = '11';
    else if (p.includes('12') || p.includes('lớp 12') || p.includes('thi đại học') || p.includes('thpt')) matchedLevel = '12';
    else if (p.includes('sinh viên') || p.includes('đại học') || p.includes('university')) matchedLevel = 'Sinh viên';

    // 3. Identify Price Preferences
    let freeOnly = false;
    if (p.includes('miễn phí') || p.includes('free')) freeOnly = true;

    // Filter matching documents from local list
    const filtered = documents.filter(doc => {
      let isMatch = true;
      if (subjectObj && doc.subject.toLowerCase() !== subjectObj.dbName.toLowerCase()) {
        isMatch = false;
      }
      if (matchedLevel !== 'Tất cả' && doc.level.toLowerCase() !== matchedLevel.toLowerCase()) {
        isMatch = false;
      }
      if (freeOnly && !doc.isFree) {
        isMatch = false;
      }
      return isMatch;
    });

    const recommendations = filtered.slice(0, 3);
    const subName = subjectObj ? subjectObj.name : 'các môn học';
    const lvlName = matchedLevel === 'Tất cả' ? 'mọi cấp học' : (matchedLevel === 'Sinh viên' ? 'Sinh viên' : `Lớp ${matchedLevel}`);

    const steps = [
      {
        title: 'Tuần 1: Ôn lý thuyết cốt lõi & Xem tóm tắt',
        detail: `Hệ thống hóa lý thuyết môn ${subName} (${lvlName}). Mỗi ngày dành ra 30-45 phút đọc các tài liệu tổng ôn trọng tâm đã đề xuất.`
      },
      {
        title: 'Tuần 2: Rèn luyện kỹ năng qua câu hỏi mẫu',
        detail: `Làm các dạng bài cơ bản đến trung bình có đáp án chi tiết. Nhấp vào "Xem chi tiết" tài liệu để kiểm tra và đối chiếu cách giải.`
      },
      {
        title: 'Tuần 3: Luyện đề và tự tính thời gian',
        detail: `Thử sức với các đề thi thử giống cấu trúc đề chính thức nhất. Rút kinh nghiệm từ các câu sai để note vào sổ tay ôn tập.`
      },
      {
        title: 'Tuần 4: Ôn tập mẹo giải nhanh & Tự tin đi thi',
        detail: `Tổng kết các bẫy đề thi, học thêm mẹo bấm máy tính Casio hoặc mẹo loại trừ đáp án. Giữ tinh thần thoải mái.`
      }
    ];

    return {
      subject: subjectObj,
      level: matchedLevel,
      recommendations,
      advice: `Dựa trên mô tả của em, Cố vấn AI đề xuất lộ trình ôn luyện môn **${subName}** cho trình độ **${lvlName}**. Trực tiếp click vào các tài liệu đề cử để xem chi tiết và tải về tự học nhé!`,
      steps
    };
  };

  // Local AI document assistant chatbot response generator
  const generateLocalAiResponse = (doc, question) => {
    const q = question.toLowerCase();
    const docTitle = doc.title;
    const docSubject = doc.subject;
    const docLevel = doc.level === 'Sinh viên' ? 'Sinh viên' : `Lớp ${doc.level}`;
    const isFree = doc.isFree ? 'Miễn phí' : 'Premium';

    if (q.includes('tóm tắt') || q.includes('nội dung') || q.includes('cấu trúc') || q.includes('chứa')) {
      return {
        text: `Chào em! Dưới đây là tóm tắt nhanh nội dung cốt lõi của tài liệu **"${docTitle}"**:`,
        list: [
          `📚 **Phân loại**: Tài liệu học tập chính thức môn **${docSubject}** (${docLevel}).`,
          `🎯 **Mục tiêu**: Hệ thống hoá kiến thức, củng cố lý thuyết trọng tâm và cung cấp hệ thống bài tập tự luyện bám sát cấu trúc thi cử mới nhất.`,
          `📝 **Nội dung chính**: Bao gồm các công thức cốt lõi, phần phân tích lý thuyết, các câu hỏi minh hoạ kèm lời giải từng bước rất chi tiết.`,
          `💡 **Bản quyền**: Tài liệu thuộc nhóm **${isFree}** (nguồn lưu trữ Google Drive tốc độ cao).`
        ]
      };
    } else if (q.includes('lộ trình') || q.includes('kế hoạch') || q.includes('7 ngày') || q.includes('học thế nào')) {
      return {
        text: `Tuyệt vời! Dưới đây là gợi ý lộ trình tự học **7 ngày** cực kỳ khoa học để làm chủ cuốn tài liệu **"${docTitle}"**:`,
        list: [
          `📅 **Ngày 1-2 (Xem lý thuyết tổng quan)**: Tập trung đọc kỹ sơ đồ tư duy hoặc tóm tắt lý thuyết. Note các định lý quan trọng môn ${docSubject} ra giấy nhớ.`,
          `📅 **Ngày 3-4 (Thực hành cơ bản)**: Tự giải các bài tập cơ bản mà không xem giải. Cố gắng ghi nhớ các bước lập luận căn bản.`,
          `📅 **Ngày 5 (Phân tích đáp án chi tiết)**: Đối chiếu bài làm với phần giải chi tiết trong tài liệu. Rút kinh nghiệm sâu sắc cho các câu giải sai.`,
          `📅 **Ngày 6 (Thử thách vận dụng cao)**: Thử sức với 5 câu khó nhất ở phần cuối tài liệu để mở rộng tư duy phản xạ đề.`,
          `📅 **Ngày 7 (Tổng ôn tập & Note-taking)**: Làm lại toàn bộ các câu sai và ôn lại công thức lần cuối trước bài kiểm tra.`
        ]
      };
    } else if (q.includes('lưu ý') || q.includes('hiệu quả') || q.includes('đạt điểm cao') || q.includes('mẹo')) {
      return {
        text: `Để đạt kết quả tốt nhất khi sử dụng tài liệu **"${docTitle}"**, Trợ lý AI khuyên em:`,
        list: [
          `⏳ **Học tập trung (Pomodoro)**: Học sâu 25 phút, nghỉ 5 phút để tăng năng suất tiếp thu não bộ.`,
          `✍️ **Làm bài trước, xem giải sau**: Tuyệt đối không vừa đọc câu hỏi vừa xem luôn lời giải, vì sẽ làm mất đi khả năng tư duy giải quyết vấn đề.`,
          `🔁 **Ôn tập định kỳ**: Ôn lại tài liệu sau 3 ngày và 7 ngày để chuyển đổi kiến thức vào vùng nhớ dài hạn.`
        ]
      };
    } else {
      return {
        text: `Cảm ơn câu hỏi của em về tài liệu **"${docTitle}"**!`,
        list: [
          `Đây là tài liệu môn **${docSubject}** dành cho cấp học **${docLevel}**, định dạng file rõ nét và lưu trữ trên Cloud Drive an toàn.`,
          `Em có thể bấm vào tab **"Chi tiết tài liệu"** để xem tổng quan tóm tắt nhanh, hoặc nhấp chọn nút **"Mở Google Drive để Tải về"** ở góc phải bên dưới để tải trực tiếp file về máy học tập.`,
          `Nếu cần hỗ trợ thêm lộ trình học hoặc các chuyên đề tương tự, hãy đặt câu hỏi cụ thể cho AI nhé!`
        ]
      };
    }
  };

  const handleAskChat = (questionText) => {
    const q = questionText || chatInput;
    if (!q.trim() || !previewDoc) return;

    const newHistory = [...chatHistory, { role: 'user', text: q }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsChatTyping(true);

    setTimeout(() => {
      const response = generateLocalAiResponse(previewDoc, q);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: response.text,
        list: response.list
      }]);
      setIsChatTyping(false);
    }, 800);
  };

  const handleAiSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!aiSearchText.trim()) return;

    setIsAiLoading(true);
    setAiRecommendation(null);

    setTimeout(() => {
      const result = interpretAiSearchPrompt(aiSearchText);
      setAiRecommendation(result);
      setIsAiLoading(false);
    }, 1200);
  };

  const handleAskDirectChat = (questionText) => {
    const q = questionText || directChatInput;
    if (!q.trim() || !selectedDirectDoc) return;

    const newHistory = [...directChatHistory, { role: 'user', text: q }];
    setDirectChatHistory(newHistory);
    setDirectChatInput('');
    setIsDirectChatTyping(true);

    setTimeout(() => {
      const response = generateLocalAiResponse(selectedDirectDoc, q);
      setDirectChatHistory(prev => [...prev, {
        role: 'assistant',
        text: response.text,
        list: response.list
      }]);
      setIsDirectChatTyping(false);
    }, 800);
  };

  // Autocomplete document suggestions from database
  useEffect(() => {
    if (!aiSearchText || aiSearchText.length < 2) {
      setSuggestedDocs([]);
      return;
    }

    if (selectedDirectDoc) return;

    const fetchSuggestions = async () => {
      setIsSuggesting(true);
      try {
        const data = await api.getDocumentResources({ search: aiSearchText });
        setSuggestedDocs(data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsSuggesting(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [aiSearchText, selectedDirectDoc]);

  // Set chat history when selecting a document for direct chat
  useEffect(() => {
    if (selectedDirectDoc) {
      setDirectChatHistory([
        {
          role: 'assistant',
          text: `Xin chào! Anh là Trợ lý Học tập AI của EduPath. Anh đã sẵn sàng trả lời các câu hỏi về tài liệu "${selectedDirectDoc.title}" mà em đã chọn. Em muốn tìm hiểu điều gì nào?`
        }
      ]);
    } else {
      setDirectChatHistory([]);
    }
  }, [selectedDirectDoc]);

  // Load documents from backend
  useEffect(() => {
    let active = true;
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const queryParams = {};
        if (selectedSubject !== 'all') {
          const matched = SUBJECTS.find(s => s.id === selectedSubject);
          queryParams.subject = matched ? matched.dbName : selectedSubject;
        }
        if (selectedLevel !== 'Tất cả') {
          queryParams.level = selectedLevel;
        }
        if (selectedPriceFilter === 'Miễn phí') {
          queryParams.isFree = 'true';
        } else if (selectedPriceFilter === 'Premium') {
          queryParams.isFree = 'false';
        }
        if (searchQuery.trim()) {
          queryParams.search = searchQuery;
        }
        
        const data = await api.getDocumentResources(queryParams);
        if (active) {
          setDocuments(data);
          setCurrentPage(1);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Không thể tải danh sách tài liệu.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDocuments();
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [selectedSubject, selectedLevel, selectedPriceFilter, searchQuery]);

  // Pagination Calculations & Helper functions
  const itemsPerPage = 10;
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  
  const displayedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return documents.slice(startIndex, startIndex + itemsPerPage);
  }, [documents, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  // Compute metrics from fetched data
  const stats = useMemo(() => {
    const total = documents.length;
    const uniqueSubjects = new Set(documents.map(d => d.subject)).size;
    const freeCount = documents.filter(d => d.isFree).length;
    return { total, uniqueSubjects, freeCount };
  }, [documents]);

  const handleDownload = (doc) => {
    if (doc.driveUrl) {
      window.open(doc.driveUrl, '_blank');
      toast(`Đang tải xuống: ${doc.title}`, 'success');
    } else {
      toast(`Tài liệu này chưa có liên kết tải trực tiếp.`, 'error');
    }
  };

  const isGuest = !currentUser;

  return (
    <div className="exambank-page">
      {/* Guest Header */}
      {isGuest && !hideHeader && (
        <header className="exambank-guest-header">
          <div className="exambank-guest-header__logo" onClick={() => navigateTo('/')}>
            <div className="exambank-guest-header__logo-icon">E</div>
            <span>EduPath <em>AI</em></span>
          </div>
          <div className="exambank-guest-header__actions">
            <button className="exambank-guest-header__btn exambank-guest-header__btn--back" onClick={() => navigateTo('/')}>
              <HiArrowLeft style={{ marginRight: 4 }} /> Trang chủ
            </button>
            <button
              className="exambank-guest-header__btn exambank-guest-header__btn--login"
              onClick={() => {
                navigateTo('/');
                setTimeout(() => window.dispatchEvent(new CustomEvent('edupath-auth-redirect', { detail: { mode: 'login' } })), 100);
              }}
            >
              Đăng nhập
            </button>
            <button
              className="exambank-guest-header__btn exambank-guest-header__btn--register"
              onClick={() => {
                navigateTo('/');
                setTimeout(() => window.dispatchEvent(new CustomEvent('edupath-auth-redirect', { detail: { mode: 'register' } })), 100);
              }}
            >
              Đăng ký miễn phí
            </button>
          </div>
        </header>
      )}

      {/* Hero */}
      <div className="exambank-hero" style={{ padding: '24px 40px 16px' }}>

        <div className="exambank-stats">
          <div className="exambank-stat">
            <span className="exambank-stat__number">{stats.total}</span>
            <div className="exambank-stat__label">Tài liệu khả dụng</div>
          </div>
          <div className="exambank-stat">
            <span className="exambank-stat__number">{stats.uniqueSubjects}</span>
            <div className="exambank-stat__label">Chuyên mục môn học</div>
          </div>
          <div className="exambank-stat">
            <span className="exambank-stat__number">{stats.freeCount}</span>
            <div className="exambank-stat__label">Tài liệu Miễn phí</div>
          </div>
          <div className="exambank-stat">
            <span className="exambank-stat__number">Khối 10-ĐH</span>
            <div className="exambank-stat__label">Cấp bậc học tập</div>
          </div>
        </div>
      </div>



      {/* Filters */}
      <div className="exambank-filters">
        <div className="exambank-filters__inner">


          {/* Level + Price Tier + Search */}
          <div className="exambank-filters__row">
            <span className="exambank-filters__label">🎓 Lớp học</span>
            <div className="exambank-filters__chips">
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={`exambank-chip ${selectedLevel === l ? 'exambank-chip--active' : ''}`}
                  onClick={() => setSelectedLevel(l)}
                >
                  {l === 'Tất cả' ? 'Tất cả' : (l === 'Sinh viên' ? 'Sinh viên' : `Lớp ${l}`)}
                </button>
              ))}
            </div>

            <span className="exambank-filters__label" style={{ marginLeft: 8 }}>⚡ Bản quyền</span>
            <div className="exambank-filters__chips">
              {PRICE_FILTERS.map(pf => (
                <button
                  key={pf}
                  className={`exambank-chip ${selectedPriceFilter === pf ? 'exambank-chip--active' : ''}`}
                  onClick={() => setSelectedPriceFilter(pf)}
                >
                  {pf}
                </button>
              ))}
            </div>
          </div>

          <div className="exambank-filters__divider" />

          <div className="exambank-filters__row">
            <div className="exambank-filters__search">
              <HiSearch className="exambank-filters__search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu học tập theo tiêu đề..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="exambank-filters__count">
              Hiển thị {documents.length} tài liệu phù hợp
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="exambank-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="auth-alert success" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              💡 Đang tải danh sách tài liệu...
            </div>
          </div>
        ) : error ? (
          <div className="auth-alert error" style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
            {error}
          </div>
        ) : documents.length === 0 ? (
          <div className="exambank-empty">
            <div className="exambank-empty__icon">📭</div>
            <h3 className="exambank-empty__title">Không tìm thấy tài liệu</h3>
            <p className="exambank-empty__desc">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <>
            <div className="exambank-grid">
              {displayedDocs.map((doc) => {
                // Match subject color and emoji
                const matchedSubject = SUBJECTS.find(s => s.dbName.toLowerCase() === doc.subject.toLowerCase());
                const cardColor = matchedSubject ? matchedSubject.color : '#64748b';
                const cardEmoji = matchedSubject ? matchedSubject.emoji : '📄';
                
                // Get file extension from title (e.g. PDF)
                const ext = doc.title.split('.').pop()?.toUpperCase() || 'PDF';
                const displayExt = ext.length > 4 ? 'DOC' : ext;

                return (
                  <article
                    key={doc.id}
                    className="exambank-card"
                    style={{ '--card-color': cardColor }}
                  >
                    <div className="exambank-card__header">
                      <div className="exambank-card__year-badge" style={{ background: cardColor }}>
                        <span>{displayExt}</span>
                        <small>Định dạng</small>
                      </div>
                      <div className="exambank-card__info">
                        <div className="exambank-card__subject-tag">
                          {cardEmoji} {doc.subject}
                        </div>
                        <h3 className="exambank-card__title" style={{ fontSize: '14px', fontWeight: '800', maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {doc.title}
                        </h3>
                        <p className="exambank-card__subtitle" style={{ fontSize: '11.5px', marginTop: '4px' }}>
                          Khối lớp: {doc.level === 'Sinh viên' ? 'Sinh viên' : `Lớp ${doc.level}`}
                        </p>
                      </div>
                    </div>

                    <div className="exambank-card__stats" style={{ background: '#FAF8F4' }}>
                      <div className="exambank-card__stat">
                        <span className="exambank-card__stat-value" style={{ color: doc.isFree ? '#22C55E' : '#E28743' }}>
                          {doc.isFree ? 'Miễn phí' : 'Premium'}
                        </span>
                        <div className="exambank-card__stat-label">Bản quyền</div>
                      </div>
                      <div className="exambank-card__stat">
                        <span className="exambank-card__stat-value">
                          {doc.price === 0 ? '0đ' : `${doc.price.toLocaleString('vi-VN')}đ`}
                        </span>
                        <div className="exambank-card__stat-label">Đơn giá</div>
                      </div>
                      <div className="exambank-card__stat">
                        <span className="exambank-card__stat-value">Drive</span>
                        <div className="exambank-card__stat-label">Lưu trữ</div>
                      </div>
                    </div>

                    <div className="exambank-card__actions">
                      <button
                        className="exambank-card__btn exambank-card__btn--view"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <HiEye /> Xem chi tiết
                      </button>
                      <button
                        className="exambank-card__btn exambank-card__btn--download"
                        onClick={() => handleDownload(doc)}
                      >
                        <HiDownload /> Tải tài liệu
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="exambank-pagination">
                <button
                  type="button"
                  className="exambank-pagination__btn exambank-pagination__btn--nav"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  ←
                </button>
                
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`ell-${idx}`} className="exambank-pagination__ellipsis">...</span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      type="button"
                      className={`exambank-pagination__btn ${currentPage === page ? 'exambank-pagination__btn--active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
                
                <button
                  type="button"
                  className="exambank-pagination__btn exambank-pagination__btn--nav"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="exambank-modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="exambank-modal" onClick={e => e.stopPropagation()}>
            <div className="exambank-modal__header">
              <h2>
                📁 Chi tiết tài liệu: {previewDoc.title}
              </h2>
              <button className="exambank-modal__close" onClick={() => setPreviewDoc(null)}>
                <HiX />
              </button>
            </div>

            <div className="exambank-modal__body">
              {/* Document info tags */}
              <div className="exambank-modal__exam-info">
                <div className="exambank-modal__exam-tag">
                  📚 Môn học: <strong>{previewDoc.subject}</strong>
                </div>
                <div className="exambank-modal__exam-tag">
                  🎓 Trình độ: <strong>{previewDoc.level === 'Sinh viên' ? 'Sinh viên' : `Lớp ${previewDoc.level}`}</strong>
                </div>
                <div className="exambank-modal__exam-tag">
                  💰 Học phí: <strong style={{ color: previewDoc.isFree ? '#10b981' : '#d97706' }}>{previewDoc.price === 0 ? 'Miễn phí' : `${previewDoc.price.toLocaleString('vi-VN')}đ`}</strong>
                </div>
                <div className="exambank-modal__exam-tag">
                  📁 Nơi lưu: <strong>Google Drive</strong>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="exambank-modal-tabs">
                <button
                  type="button"
                  className={`exambank-modal-tab ${modalTab === 'details' ? 'exambank-modal-tab--active' : ''}`}
                  onClick={() => setModalTab('details')}
                >
                  📁 Chi tiết tài liệu
                </button>
                <button
                  type="button"
                  className={`exambank-modal-tab ${modalTab === 'chat' ? 'exambank-modal-tab--active' : ''}`}
                  onClick={() => setModalTab('chat')}
                >
                  💬 Hỏi đáp AI (Chatbot)
                </button>
                <button
                  type="button"
                  className={`exambank-modal-tab ${modalTab === 'discussion' ? 'exambank-modal-tab--active' : ''}`}
                  onClick={() => setModalTab('discussion')}
                >
                  👥 Thảo luận học viên
                </button>
              </div>

              {modalTab === 'details' ? (
                <>
                  {/* Description block */}
                  <div className="exambank-modal__section">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>
                      <HiDocumentText /> Tóm tắt tài liệu & mô tả chi tiết
                    </h3>
                    <div className="exambank-modal__question" style={{ background: '#faf9f6', padding: '20px', borderRadius: '12px', border: '1.5px solid #e8e2d6' }}>
                      {renderDescription(previewDoc.description)}
                    </div>
                  </div>

                  {/* Notice */}
                  <div style={{
                    background: '#fffbeb',
                    border: '1.5px solid #fbbf24',
                    borderRadius: 12,
                    padding: '14px 18px',
                    fontSize: '13px',
                    color: '#92400e',
                    lineHeight: 1.6,
                    marginBottom: '24px'
                  }}>
                    <strong>📌 Hướng dẫn sử dụng:</strong> Tài liệu học tập của em sẽ được mở và tải về trực tiếp từ tài khoản Google Drive chính thức của hệ thống. Vui lòng bấm vào nút dưới đây để chuyển hướng tới Drive.
                  </div>
                </>
              ) : modalTab === 'chat' ? (
                /* Chatbot Tab panel */
                <div style={{ marginBottom: '24px' }}>
                  <div className="exambank-chat">
                    <div className="exambank-chat__history">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`exambank-chat__bubble exambank-chat__bubble--${msg.role}`}>
                          <div className="exambank-chat__avatar">
                            {msg.role === 'user' ? '🙋' : '🤖'}
                          </div>
                          <div className="exambank-chat__msg-content">
                            <div>{msg.text}</div>
                            {msg.list && (
                              <ul className="exambank-chat__msg-list">
                                {msg.list.map((item, lIdx) => (
                                  <li key={lIdx} dangerouslySetInnerHTML={{ __html: item }} />
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isChatTyping && (
                        <div className="exambank-chat__bubble exambank-chat__bubble--assistant">
                          <div className="exambank-chat__avatar">🤖</div>
                          <div className="exambank-chat__msg-content">
                            <div className="exambank-chat__dots">
                              <span></span><span></span><span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="exambank-chat__suggestions">
                      <button
                        type="button"
                        className="exambank-chat__suggestion-btn"
                        onClick={() => handleAskChat('Tóm tắt nội dung chính và cấu trúc tài liệu này?')}
                        disabled={isChatTyping}
                      >
                        📖 Tóm tắt nội dung
                      </button>
                      <button
                        type="button"
                        className="exambank-chat__suggestion-btn"
                        onClick={() => handleAskChat('Lộ trình 7 ngày ôn tập hiệu quả nhất với tài liệu?')}
                        disabled={isChatTyping}
                      >
                        🎯 Lộ trình 7 ngày ôn tập
                      </button>
                      <button
                        type="button"
                        className="exambank-chat__suggestion-btn"
                        onClick={() => handleAskChat('Những lưu ý quan trọng để đạt điểm cao?')}
                        disabled={isChatTyping}
                      >
                        💡 Mẹo đạt điểm cao
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAskChat();
                      }}
                      className="exambank-chat__form"
                    >
                      <input
                        type="text"
                        className="exambank-chat__input"
                        placeholder="Hỏi AI thêm về tài liệu..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isChatTyping}
                      />
                      <button
                        type="submit"
                        className="exambank-chat__btn-send"
                        disabled={isChatTyping || !chatInput.trim()}
                      >
                        Gửi
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Discussion Board Tab panel */
                <div style={{ marginBottom: '24px' }} className="exambank-discussion">
                  {/* Form to submit comment */}
                  {currentUser ? (
                    <form onSubmit={handlePostComment} className="exambank-discussion__form">
                      <textarea
                        className="exambank-discussion__textarea"
                        placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến của em về tài liệu này..."
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        required
                      />
                      <button type="submit" className="exambank-discussion__btn-submit">
                        Gửi thảo luận
                      </button>
                    </form>
                  ) : (
                    <div className="exambank-discussion__guest-box">
                      🔑 Vui lòng đăng nhập để tham gia thảo luận và hỏi đáp về tài liệu này.
                    </div>
                  )}

                  {/* Comments list */}
                  {commentsLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div className="exambank-chat__dots">
                        <span></span><span></span><span></span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>Đang tải thảo luận...</p>
                    </div>
                  ) : commentError ? (
                    <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '13.5px' }}>{commentError}</p>
                  ) : comments.length === 0 ? (
                    <div className="exambank-discussion__empty">
                      💬 Chưa có thảo luận nào cho tài liệu này. Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ ý kiến của em!
                    </div>
                  ) : (
                    <div className="exambank-discussion__comments-list">
                      {comments.map(c => {
                        const init = c.user.fullName ? c.user.fullName[0].toUpperCase() : '?';
                        const dateStr = new Date(c.createdAt).toLocaleDateString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        const roleClass = c.user.role === 'ADMIN' ? 'admin' : (c.user.role === 'TEACHER' ? 'teacher' : 'student');
                        const roleLabel = c.user.role === 'ADMIN' ? 'Admin' : (c.user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh');
                        
                        return (
                          <div key={c.id} className="exambank-discussion__comment-card">
                            <div className="exambank-discussion__avatar">
                              {c.user.avatarUrl ? (
                                <img src={c.user.avatarUrl} alt={c.user.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : init}
                            </div>
                            <div className="exambank-discussion__comment-body">
                              <div className="exambank-discussion__comment-header">
                                <span className="exambank-discussion__comment-author">{c.user.fullName}</span>
                                <span className={`exambank-discussion__comment-role exambank-discussion__comment-role--${roleClass}`}>
                                  {roleLabel}
                                </span>
                                <span className="exambank-discussion__comment-date">{dateStr}</span>
                              </div>
                              <p className="exambank-discussion__comment-text">{c.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="exambank-modal__actions">
                <button className="exambank-modal__btn exambank-modal__btn--secondary" onClick={() => setPreviewDoc(null)}>
                  Đóng cửa sổ
                </button>
                <button className="exambank-modal__btn exambank-modal__btn--primary" onClick={() => handleDownload(previewDoc)}>
                  <HiDownload /> Mở Google Drive để Tải về
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
