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
export default function ExamBankPage({ currentUser, navigateTo, hideHeader, cartDocs = [], onAddToCart, onCheckoutDoc, onRemoveDoc }) {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [documents, setDocuments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isDocPurchased, setIsDocPurchased] = useState(true);

  // States for Document Ratings and Reviews
  const [ratingsInfo, setRatingsInfo] = useState({ ratings: [], average: 0, count: 0 });
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Sync document purchase status when document-purchased event is received
  useEffect(() => {
    const handlePurchaseSuccess = (e) => {
      const ids = e.detail?.documentIds || [];
      setDocuments(prev => prev.map(d => ids.includes(d.id) ? { ...d, isPurchased: true } : d));
      if (previewDoc && ids.includes(previewDoc.id)) {
        setIsDocPurchased(true);
      }
    };
    window.addEventListener('document-purchased', handlePurchaseSuccess);
    return () => window.removeEventListener('document-purchased', handlePurchaseSuccess);
  }, [previewDoc]);

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

  const fetchRatings = async (docId) => {
    setRatingsLoading(true);
    try {
      const res = await api.getDocumentRatings(docId);
      if (res) {
        setRatingsInfo({
          ratings: res.ratings || [],
          average: res.average || 0,
          count: res.count || 0
        });
      }
    } catch (err) {
      console.error('[Fetch Ratings Error]', err);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handlePostRating = async (e) => {
    if (e) e.preventDefault();
    if (!previewDoc) return;
    if (!currentUser) {
      toast('Vui lòng đăng nhập để gửi đánh giá!', 'error');
      return;
    }

    setSubmittingRating(true);
    try {
      await api.submitDocumentRating(previewDoc.id, userRating, userComment);
      toast('Đã gửi đánh giá thành công!', 'success');
      setUserComment('');
      fetchRatings(previewDoc.id);
    } catch (err) {
      toast(err.message || 'Không thể gửi đánh giá.', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Reset chatbot modal state & load comments/ratings on preview document change
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
      setUserComment('');
      setUserRating(5);
      fetchComments(previewDoc.id);
      fetchRatings(previewDoc.id);

      // Check purchase status if the document is not free
      if (previewDoc.isFree) {
        setIsDocPurchased(true);
      } else if (!currentUser) {
        setIsDocPurchased(false);
      } else {
        api.checkDocumentPurchaseStatus(previewDoc.id)
          .then(res => {
            if (res && res.isPurchased !== undefined) {
              setIsDocPurchased(res.isPurchased);
            } else {
              setIsDocPurchased(false);
            }
          })
          .catch(err => {
            console.error('[Purchase Check Error]', err);
            setIsDocPurchased(false);
          });
      }
    } else {
      setIsDocPurchased(true);
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

  const handleDownload = async (doc) => {
    if (!doc.isFree && currentUser) {
      try {
        const res = await api.checkDocumentPurchaseStatus(doc.id);
        if (res && res.isPurchased) {
          if (doc.driveUrl) {
            window.open(doc.driveUrl, '_blank');
            toast(`Đang tải xuống: ${doc.title}`, 'success');
          } else {
            toast(`Tài liệu này chưa có liên kết tải trực tiếp.`, 'error');
          }
        } else {
          handleCheckoutDocDirect(doc);
        }
      } catch (err) {
        handleCheckoutDocDirect(doc);
      }
    } else if (!doc.isFree && !currentUser) {
      toast('Vui lòng đăng nhập để mua và tải tài liệu!', 'error');
    } else {
      if (doc.driveUrl) {
        window.open(doc.driveUrl, '_blank');
        toast(`Đang tải xuống: ${doc.title}`, 'success');
      } else {
        toast(`Tài liệu này chưa có liên kết tải trực tiếp.`, 'error');
      }
    }
  };

  const handleViewOnline = async (doc) => {
    if (!doc.isFree && currentUser) {
      try {
        const res = await api.checkDocumentPurchaseStatus(doc.id);
        if (res && res.isPurchased) {
          setPreviewDoc(doc);
          setTimeout(() => {
            setModalTab('online-read');
          }, 50);
        } else {
          handleCheckoutDocDirect(doc);
        }
      } catch (err) {
        handleCheckoutDocDirect(doc);
      }
    } else if (!doc.isFree && !currentUser) {
      toast('Vui lòng đăng nhập để mua và đọc tài liệu!', 'error');
    } else {
      setPreviewDoc(doc);
      setTimeout(() => {
        setModalTab('online-read');
      }, 50);
    }
  };

  const handleAddDocToCart = (doc) => {
    if (onAddToCart) {
      onAddToCart(doc);
    }
  };

  const handleCheckoutDocDirect = (doc) => {
    if (onCheckoutDoc) {
      onCheckoutDoc(doc);
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


          {/* Subject Filter Row */}
          <div className="exambank-filters__row" style={{ flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <span className="exambank-filters__label">📚 Môn học</span>
            <div className="exambank-filters__chips" style={{ flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                className={`exambank-chip ${selectedSubject === 'all' ? 'exambank-chip--active' : ''}`}
                onClick={() => setSelectedSubject('all')}
              >
                Tất cả môn
              </button>
              {SUBJECTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`exambank-chip ${selectedSubject === s.id ? 'exambank-chip--active' : ''}`}
                  onClick={() => setSelectedSubject(s.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{s.emoji}</span> {s.name}
                </button>
              ))}
            </div>
          </div>

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
                
                 // Get file extension from driveUrl (e.g. PDF)
                 const getExt = (url) => {
                   if (!url) return 'PDF';
                   try {
                     const pathname = url.includes('://') ? new URL(url).pathname : url;
                     const parts = pathname.split('.');
                     if (parts.length < 2) return 'PDF';
                     const ext = parts.pop().toLowerCase();
                     if (ext === 'pdf') return 'PDF';
                     if (ext === 'doc') return 'DOC';
                     if (ext === 'docx') return 'DOCX';
                     return 'PDF';
                   } catch (e) {
                     return 'PDF';
                   }
                 };
                 const displayExt = getExt(doc.driveUrl);

                return (
                  <article
                    key={doc.id}
                    className="exambank-card"
                    style={{ '--card-color': cardColor }}
                  >
                    <div className="exambank-card__header">
                      <div className="exambank-card__year-badge" style={{ background: displayExt === 'PDF' ? '#ef4444' : cardColor }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '12px' }}>
                          <span style={{ color: '#f59e0b' }}>
                            {doc.averageRating > 0 ? (
                              <>{'★'.repeat(Math.round(doc.averageRating))}{'☆'.repeat(5 - Math.round(doc.averageRating))}</>
                            ) : (
                              '☆☆☆☆☆'
                            )}
                          </span>
                          <strong style={{ color: '#1e293b' }}>{doc.averageRating ? doc.averageRating.toFixed(1) : '0.0'}</strong>
                          <span style={{ color: '#64748b' }}>({doc.ratingCount || 0} đánh giá)</span>
                        </div>
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
                      {(!doc.isFree && !doc.isPurchased) ? (
                        <>
                          <button
                            type="button"
                            className="exambank-card__btn exambank-card__btn--view"
                            style={{ background: '#FFF', border: '2px solid #000', borderRadius: '8px', boxShadow: '2px 2px 0px #000', fontWeight: 'bold' }}
                            onClick={() => handleAddDocToCart(doc)}
                          >
                            🛒 Thêm giỏ hàng
                          </button>
                          <button
                            type="button"
                            className="exambank-card__btn exambank-card__btn--download"
                            style={{ background: '#FFE259', color: '#000', border: '2px solid #000', borderRadius: '8px', boxShadow: '2px 2px 0px #000', fontWeight: 'bold' }}
                            onClick={() => handleCheckoutDocDirect(doc)}
                          >
                            💳 Mua ngay
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="exambank-card__btn exambank-card__btn--view"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <HiEye /> Xem chi tiết
                          </button>
                          {displayExt === 'PDF' ? (
                            <button
                              className="exambank-card__btn exambank-card__btn--download"
                              style={{ background: '#ef4444', color: '#fff' }}
                              onClick={() => handleViewOnline(doc)}
                            >
                              <HiEye /> Xem tài liệu
                            </button>
                          ) : (
                            <button
                              className="exambank-card__btn exambank-card__btn--download"
                              onClick={() => handleDownload(doc)}
                            >
                              <HiDownload /> Tải tài liệu
                            </button>
                          )}
                        </>
                      )}
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
                <button
                  type="button"
                  className={`exambank-modal-tab ${modalTab === 'reviews' ? 'exambank-modal-tab--active' : ''}`}
                  onClick={() => setModalTab('reviews')}
                >
                  ⭐ Đánh giá ({ratingsInfo.count})
                </button>
                {previewDoc.previewUrl && (
                  <button
                    type="button"
                    className={`exambank-modal-tab ${modalTab === 'online-read' ? 'exambank-modal-tab--active' : ''}`}
                    onClick={() => setModalTab('online-read')}
                  >
                    📖 Đọc trực tuyến
                  </button>
                )}
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
              ) : modalTab === 'discussion' ? (
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
              ) : modalTab === 'reviews' ? (
                /* Ratings and Reviews Tab panel */
                <div style={{ marginBottom: '24px' }}>
                  {/* Average stats banner */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    alignItems: 'center', 
                    background: '#faf9f6', 
                    padding: '20px', 
                    borderRadius: '12px', 
                    border: '1.5px solid #e8e2d6', 
                    marginBottom: '20px' 
                  }}>
                    <div style={{ textAlign: 'center', paddingRight: '20px', borderRight: '2px solid #e8e2d6', minWidth: '90px' }}>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a' }}>{ratingsInfo.average}</div>
                      <div style={{ color: '#f59e0b', fontSize: '15px', margin: '4px 0' }}>
                        {'★'.repeat(Math.round(ratingsInfo.average))}{'☆'.repeat(5 - Math.round(ratingsInfo.average))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{ratingsInfo.count} đánh giá</div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>⭐ Đánh giá trung bình từ học sinh</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>Đánh giá này được tổng hợp tự động từ phản hồi thực tế của các học viên đã sử dụng tài liệu.</p>
                    </div>
                  </div>

                  {/* Submit Rating Form */}
                  {currentUser ? (
                    <form onSubmit={handlePostRating} style={{ background: '#fffbeb', border: '2px solid #000', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '13.5px', fontWeight: 'bold', color: '#1e293b' }}>✍️ Gửi đánh giá của em</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Số sao đánh giá:</span>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '20px', cursor: 'pointer' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span 
                              key={star} 
                              onClick={() => setUserRating(star)}
                              style={{ color: star <= userRating ? '#f59e0b' : '#cbd5e1', transition: 'color 0.2s' }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          rows="3"
                          placeholder="Nhập nhận xét chi tiết của em về tài liệu học tập này..."
                          value={userComment}
                          onChange={e => setUserComment(e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '10px', 
                            border: '2px solid #000', 
                            borderRadius: '8px', 
                            fontSize: '13px', 
                            outline: 'none', 
                            boxSizing: 'border-box' 
                          }}
                          required
                        />
                        <button 
                          type="submit" 
                          disabled={submittingRating}
                          style={{ 
                            alignSelf: 'flex-end', 
                            padding: '8px 20px', 
                            background: '#6366f1', 
                            color: '#fff', 
                            border: '2px solid #000', 
                            borderRadius: '8px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            boxShadow: '2px 2px 0px #000',
                            marginTop: '4px'
                          }}
                        >
                          {submittingRating ? 'Đang gửi...' : 'Gửi nhận xét'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ padding: '14px', background: '#f1f5f9', border: '1.5px dashed #cbd5e1', borderRadius: '8px', fontSize: '12.5px', color: '#475569', textAlign: 'center', marginBottom: '20px' }}>
                      🔑 Vui lòng đăng nhập để bình chọn và viết đánh giá cho tài liệu này.
                    </div>
                  )}

                  {/* Ratings list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {ratingsLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#64748b' }}>Đang tải danh sách nhận xét...</div>
                    ) : ratingsInfo.ratings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Chưa có nhận xét nào. Hãy là người đầu tiên đánh giá!</div>
                    ) : (
                      ratingsInfo.ratings.map(r => {
                        const init = r.student.fullName ? r.student.fullName[0].toUpperCase() : '?';
                        return (
                          <div key={r.id} style={{ display: 'flex', gap: '12px', background: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#818cf8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>
                              {r.student.avatarUrl ? (
                                <img src={r.student.avatarUrl} alt={r.student.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : init}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{r.student.fullName}</span>
                                <span style={{ color: '#f59e0b', fontSize: '11px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                              </div>
                              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>{r.comment || '(Học sinh chỉ vote sao)'}</p>
                              <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : modalTab === 'online-read' && previewDoc.previewUrl ? (
                !isDocPurchased ? (
                  <div style={{
                    marginBottom: '24px', height: '400px', border: '3px solid #000', borderRadius: '12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#FFFDF9', boxShadow: '4px 4px 0px #000', padding: '40px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '950', color: '#000', margin: '0 0 10px 0' }}>Tài liệu này thuộc gói Premium</h3>
                    <p style={{ fontSize: '13.5px', color: '#555', maxWidth: '420px', lineHeight: 1.5, margin: '0 0 24px 0', fontWeight: 'bold' }}>
                      Em cần mua tài liệu này để mở khóa tính năng đọc trực tuyến và tải về máy.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCheckoutDocDirect(previewDoc)}
                      style={{
                        padding: '12px 28px', background: '#FFE259', color: '#000',
                        border: '3px solid #000', borderRadius: '10px', fontSize: '14.5px', fontWeight: '950',
                        boxShadow: '3px 3px 0px #000', cursor: 'pointer'
                      }}
                    >
                      💳 Mua tài liệu ngay ({(previewDoc.price || 0).toLocaleString()}đ)
                    </button>
                  </div>
                ) : (
                  /* Online PDF Reading Tab panel */
                  <div style={{ marginBottom: '20px', height: '72vh', border: '3px solid #000', borderRadius: '12px', overflow: 'hidden', boxShadow: '4px 4px 0px #000' }}>
                    <iframe
                      src={previewDoc.previewUrl}
                      title="PDF Online Reader"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                )
              ) : null}

              {/* Action Buttons */}
              <div className="exambank-modal__actions">
                <button className="exambank-modal__btn exambank-modal__btn--secondary" onClick={() => setPreviewDoc(null)}>
                  Đóng cửa sổ
                </button>
                {!isDocPurchased ? (
                  <button 
                    className="exambank-modal__btn" 
                    style={{ background: '#FFE259', color: '#000', border: '2.5px solid #000', boxShadow: '2px 2px 0px #000' }}
                    onClick={() => handleCheckoutDocDirect(previewDoc)}
                  >
                    💳 Mua tài liệu để Tải về
                  </button>
                ) : (
                  <>
                    {previewDoc.previewUrl && (
                      <button 
                        className="exambank-modal__btn" 
                        style={{ background: '#3b82f6', color: '#fff', border: '2.5px solid #000', boxShadow: '2px 2px 0px #000', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => window.open(previewDoc.previewUrl, '_blank')}
                      >
                        <HiEye /> Xem ở trang mới
                      </button>
                    )}
                    <button className="exambank-modal__btn exambank-modal__btn--primary" onClick={() => handleDownload(previewDoc)}>
                      <HiDownload /> Tải xuống tài liệu
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
