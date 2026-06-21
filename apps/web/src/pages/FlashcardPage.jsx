import React, { useState, useRef, useEffect } from 'react';
import { 
  HiSparkles, HiPlus, HiMinus, HiTrash, HiSave, HiDownload, 
  HiDocumentText, HiRefresh, HiUpload, HiX, HiChevronRight, 
  HiChevronLeft, HiFolder, HiBadgeCheck, HiStar, HiVolumeUp
} from 'react-icons/hi';
import Tesseract from 'tesseract.js';
import { api } from '../api';
import { toast } from '../utils/toast';
import sunLogoImg from '../assets/sun_logo.png';

const DEFAULT_DECK = [
  {
    front: "artifact",
    back: "Là một vật thể được tạo ra bởi con người, đặc biệt có giá trị khảo cổ hoặc lịch sử.",
    image: null,
    partOfSpeech: "Danh từ",
    hashtag: "# Lịch sử"
  },
  {
    front: "excavation",
    back: "Hoạt động đào bới lòng đất một cách khoa học để tìm kiếm cổ vật cổ xưa.",
    image: null,
    partOfSpeech: "Danh từ",
    hashtag: "# Khảo cổ"
  },
  {
    front: "dynasty",
    back: "Một triều đại, thời kỳ lịch sử được cai trị bởi một gia tộc phong kiến nối tiếp nhau.",
    image: null,
    partOfSpeech: "Danh từ",
    hashtag: "# Lịch sử"
  },
  {
    front: "fossil",
    back: "Hóa thạch - Dấu vết hoặc di tích còn lại của sinh vật cổ đại được lưu giữ trong đá.",
    image: null,
    partOfSpeech: "Danh từ",
    hashtag: "# Khảo cổ"
  },
  {
    front: "heritage",
    back: "Di sản lịch sử, truyền thống hoặc giá trị văn hóa được truyền lại từ tổ tiên.",
    image: null,
    partOfSpeech: "Danh từ",
    hashtag: "# Văn hóa"
  }
];

export default function FlashcardPage({ currentUser, navigateTo, addLog }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'
  const [deckTitle, setDeckTitle] = useState('Chủ đề Lịch sử & Khảo cổ học');
  const [cards, setCards] = useState(DEFAULT_DECK);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Card learning state logs
  const [learnedCards, setLearnedCards] = useState(new Set());
  const [reviewCards, setReviewCards] = useState(new Set());
  const [isFinished, setIsFinished] = useState(false);

  // View mode state: 'decks' (dashboard/selection) or 'study' (cards interface)
  const [currentView, setCurrentView] = useState('decks');
  const [activeDeckId, setActiveDeckId] = useState('default');
  const [editingCardIdx, setEditingCardIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New deck creation modal states
  const [isCreatingDeckModal, setIsCreatingDeckModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckHashtag, setNewDeckHashtag] = useState('# Tự tạo');

  // Attendance state loaded from localStorage
  const [attendance, setAttendance] = useState(() => {
    try {
      const stored = localStorage.getItem('edupath_flashcard_attendance');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Study history state loaded from localStorage
  const [studyHistory, setStudyHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('edupath_flashcard_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveAttendance = (newAttendance) => {
    setAttendance(newAttendance);
    localStorage.setItem('edupath_flashcard_attendance', JSON.stringify(newAttendance));
  };

  const saveStudyHistory = (newHistory) => {
    setStudyHistory(newHistory);
    localStorage.setItem('edupath_flashcard_history', JSON.stringify(newHistory));
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isTodayCheckedIn = attendance.includes(getTodayString());

  const calculateStreak = () => {
    if (attendance.length === 0) return 0;
    const uniqueDates = [...new Set(attendance)].sort((a, b) => new Date(b) - new Date(a));
    const todayStr = getTodayString();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    const latest = uniqueDates[0];
    if (latest !== todayStr && latest !== yesterdayStr) {
      return 0;
    }
    
    let streak = 0;
    let currentCheckDate = new Date(latest);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const d = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currentCheckDate - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (i === 0) {
        streak = 1;
      } else if (diffDays === 1) {
        streak += 1;
        currentCheckDate = d;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };

  const streakDays = calculateStreak();

  const handleCheckIn = () => {
    const todayStr = getTodayString();
    if (attendance.includes(todayStr)) {
      toast('Hôm nay bạn đã điểm danh rồi!', 'info');
      return;
    }
    const nextAttendance = [...attendance, todayStr];
    saveAttendance(nextAttendance);
    toast('Điểm danh ngày hôm nay thành công! +1 chuỗi học lửa 🔥', 'success');
    if (addLog) addLog('Đã điểm danh học tập hôm nay', 'sys');
  };

  // Automatically record a log when the user completes a study session (isFinished becomes true)
  useEffect(() => {
    if (isFinished && cards.length > 0) {
      const today = new Date();
      const timeStr = today.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + today.toLocaleDateString('vi-VN');
      const newLog = {
        id: Date.now().toString(),
        deckTitle: deckTitle,
        learnedCount: learnedCards.size,
        totalCount: cards.length,
        timestamp: timeStr
      };

      setStudyHistory(prev => {
        const exists = prev.some(log => log.deckTitle === deckTitle && log.timestamp === timeStr);
        if (exists) return prev;
        const next = [newLog, ...prev];
        localStorage.setItem('edupath_flashcard_history', JSON.stringify(next));
        return next;
      });

      if (addLog) addLog(`Hoàn thành buổi ôn tập bộ thẻ: ${deckTitle}`, 'sys');
    }
  }, [isFinished]);

  // Active study filter state (all / learned / remaining / review)
  const [studyFilter, setStudyFilter] = useState('all');

  const getActiveCards = () => {
    return cards.map((card, originalIdx) => ({ card, originalIdx })).filter(({ card, originalIdx }) => {
      if (studyFilter === 'learned') return learnedCards.has(originalIdx);
      if (studyFilter === 'remaining') return !learnedCards.has(originalIdx);
      if (studyFilter === 'review') return reviewCards.has(originalIdx);
      return true;
    });
  };
  const activeCards = getActiveCards();

  const handleFilterStudy = (filterType) => {
    setStudyFilter(filterType);
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsFinished(false);
    setCurrentView('study');
    toast(`Đã chuyển sang nhóm: ${filterType === 'learned' ? 'Đã thuộc' : filterType === 'remaining' ? 'Chưa thuộc' : filterType === 'review' ? 'Cần ôn tập' : 'Tất cả'}`, 'info');
  };

  // AI Chatbot States
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: 'Chào em! Anh là EduBot, trợ lý học tập đồng hành cùng em. Em có thể hỏi anh bất kỳ câu hỏi nào về học tập, hoặc nhập yêu cầu để anh tạo ngay một bộ flashcard học tập mới theo chủ đề nhé!\n\nVí dụ:\n- "Tạo bộ thẻ từ vựng IELTS chủ đề Môi trường"\n- "Tạo bộ thẻ các công thức Vật Lý 12 chương 1"\n- "Cách phân biệt Danh từ và Động từ?"'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatEndRef = useRef(null);

  // AI Chatbot Resizer States and Handlers
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default to 320px
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    // Window width minus mouse x coordinate, with margin adjustments
    const newWidth = window.innerWidth - e.clientX - 24;
    if (newWidth > 260 && newWidth < 600) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Clean up drag events on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Auto scroll to bottom of chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatTyping]);

  const SUGGESTED_CHIPS = [
    { label: '✈️ Từ vựng Du lịch', prompt: 'Tạo bộ thẻ về từ vựng IELTS chủ đề Du lịch' },
    { label: '📐 Công thức Toán', prompt: 'Tạo bộ thẻ về các công thức đạo hàm và tích phân lớp 12' },
    { label: '🌍 Lịch sử Việt Nam', prompt: 'Tạo bộ thẻ về các cột mốc lịch sử Việt Nam thế kỷ 20' },
    { label: '🧪 Nguyên tố Hóa học', prompt: 'Tạo bộ thẻ về tính chất các nguyên tố hóa học nhóm halogen' }
  ];

  const processAgentCommand = (messageText) => {
    const cleanText = messageText.toLowerCase().trim();
    
    // 1. DELETE DECK COMMAND
    const deleteMatch = cleanText.match(/(?:xóa|delete|remove|hủy)\s+(?:bộ\s+thẻ|bộ\s+card|flashcard|bộ\s+từ\s+vựng|bộ)?\s*(.+)/i);
    if (deleteMatch && deleteMatch[1]) {
      const targetName = deleteMatch[1].trim().toLowerCase();
      if (targetName.length >= 2) {
        let latestDecks = [];
        try {
          const stored = localStorage.getItem('edupath_saved_flashcard_decks');
          if (stored) latestDecks = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }

        const deckToDelete = latestDecks.find(d => 
          d.title.toLowerCase() === targetName ||
          d.title.toLowerCase().includes(targetName) || 
          targetName.includes(d.title.toLowerCase())
        );

        if (deckToDelete) {
          const nextDecks = latestDecks.filter(d => d.id !== deckToDelete.id);
          setSavedDecks(nextDecks);
          localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));
          
          if (activeDeckId === deckToDelete.id) {
            setCurrentView('decks');
            setActiveDeckId(null);
          }
          
          toast(`Đã xóa bộ thẻ "${deckToDelete.title}"!`, 'success');
          return {
            handled: true,
            reply: `Anh đã xóa thành công bộ thẻ "${deckToDelete.title}" theo yêu cầu của em rồi nhé! 🗑`
          };
        }
      }
    }

    // 2. RENAME DECK COMMAND
    const renameMatch = cleanText.match(/(?:đổi\s+tên|sửa\s+tên|rename)\s+(?:bộ\s+thẻ|bộ\s+card|flashcard|bộ)?\s*(.+?)\s+(?:thành|sang|to)\s+(.+)/i);
    if (renameMatch && renameMatch[1] && renameMatch[2]) {
      const oldNameQuery = renameMatch[1].trim().toLowerCase();
      const newName = renameMatch[2].trim();
      
      let latestDecks = [];
      try {
        const stored = localStorage.getItem('edupath_saved_flashcard_decks');
        if (stored) latestDecks = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }

      const deckToRename = latestDecks.find(d => 
        d.title.toLowerCase() === oldNameQuery ||
        d.title.toLowerCase().includes(oldNameQuery) || 
        oldNameQuery.includes(d.title.toLowerCase())
      );

      if (deckToRename) {
        const nextDecks = latestDecks.map(d => {
          if (d.id === deckToRename.id) {
            return { ...d, title: newName };
          }
          return d;
        });
        setSavedDecks(nextDecks);
        localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));
        
        if (activeDeckId === deckToRename.id) {
          setDeckTitle(newName);
        }
        
        toast(`Đã đổi tên bộ thẻ thành "${newName}"!`, 'success');
        return {
          handled: true,
          reply: `Anh đã đổi tên bộ thẻ từ "${deckToRename.title}" thành "${newName}" thành công rồi nhé! ✏️`
        };
      }
    }

    // 3. STUDY/OPEN DECK COMMAND
    const studyMatch = cleanText.match(/(?:học|mở|open|study)\s+(?:bộ\s+thẻ|bộ\s+card|flashcard|bộ)?\s*(.+)/i);
    if (studyMatch && studyMatch[1]) {
      const targetName = studyMatch[1].trim().toLowerCase();
      
      if (targetName.includes('mặc định') || targetName.includes('lịch sử') || targetName.includes('khảo cổ')) {
        setCards(DEFAULT_DECK);
        setDeckTitle('Chủ đề Lịch sử & Khảo cổ học');
        setActiveDeckId('default');
        setCurrentIdx(0);
        setIsFlipped(false);
        setIsFinished(false);
        setLearnedCards(new Set());
        setReviewCards(new Set());
        setCurrentView('study');
        return {
          handled: true,
          reply: `Anh đã mở bộ thẻ Mặc định "Chủ đề Lịch sử & Khảo cổ học" để em bắt đầu học rồi đấy! 📖`
        };
      }
      
      let latestDecks = [];
      try {
        const stored = localStorage.getItem('edupath_saved_flashcard_decks');
        if (stored) latestDecks = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }

      const deckToStudy = latestDecks.find(d => 
        d.title.toLowerCase() === targetName ||
        d.title.toLowerCase().includes(targetName) || 
        targetName.includes(d.title.toLowerCase())
      );

      if (deckToStudy) {
        handleLoadDeck(deckToStudy);
        return {
          handled: true,
          reply: `Anh đã mở bộ thẻ "${deckToStudy.title}" để em bắt đầu học rồi nhé! 📖`
        };
      }
    }

    return { handled: false };
  };

  const handleSendChatMessage = async (e, overrideText) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || chatInput;
    const message = textToSend.trim();
    if (!message) return;

    // Add user message to conversation list
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    if (!overrideText) {
      setChatInput('');
    }
    setIsChatTyping(true);

    // Check for agent CRUD commands first
    const cmdResult = processAgentCommand(message);
    if (cmdResult.handled) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: cmdResult.reply }]);
      setIsChatTyping(false);
      return;
    }

    const cleanText = message.toLowerCase();
    const isGen = cleanText.includes("tạo bộ thẻ") || 
                  cleanText.includes("tạo flashcard") || 
                  cleanText.includes("tạo thẻ học") || 
                  cleanText.includes("tạo bộ card") || 
                  cleanText.includes("thiết kế bộ thẻ") || 
                  cleanText.includes("thiết kế flashcard") || 
                  cleanText.includes("làm bộ thẻ") || 
                  cleanText.includes("làm flashcard") ||
                  cleanText.includes("generate flashcard") ||
                  /(?:tạo|làm|sinh|thiết kế|generate|create|make|build)\s+(?:cho\s+tôi\s+)?(?:một\s+)?(?:bộ\s+)?(?:thẻ|flashcard|card|bộ từ vựng|thẻ học)/i.test(cleanText);

    if (isGen) {
      // Add standard loading message from bot
      setChatMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Đang khởi tạo và thiết kế bộ thẻ học theo yêu cầu của em. Quá trình này có thể mất vài giây...' 
      }]);

      try {
        const result = await api.generateFlashcards(message);
        
        if (!Array.isArray(result) || result.length === 0) {
          throw new Error('Dữ liệu flashcard trả về không hợp lệ.');
        }

        const formatted = result.map((c, index) => ({
          ...c,
          image: null,
          partOfSpeech: index % 2 === 0 ? "Khái niệm" : "Định nghĩa",
          hashtag: "# Học tập"
        }));

        // Infer a nice deck title from the user prompt
        let extractedTitle = '';
        const match = message.match(/(?:tạo|làm|sinh|thiết kế|generate|create)\s+(?:cho\s+tôi\s+)?(?:một\s+)?(?:bộ\s+)?(?:thẻ|flashcard|card|bộ từ vựng|thẻ học)(?:\s+mới)?(?:\s+(?:về|chủ đề|cho|có\s+tên|tên\s+là))?\s*(.+)/i);
        if (match && match[1]) {
          extractedTitle = match[1].trim();
          extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);
        } else {
          extractedTitle = 'Flashcard AI - ' + new Date().toLocaleDateString('vi-VN');
        }

        const newId = Date.now().toString();
        const newDeck = {
          id: newId,
          title: extractedTitle,
          cards: formatted,
          createdAt: new Date().toISOString()
        };

        const nextDecks = [newDeck, ...savedDecks];
        setSavedDecks(nextDecks);
        localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));

        setCards(formatted);
        setDeckTitle(extractedTitle);
        setActiveDeckId(newId);
        setCurrentIdx(0);
        setIsFlipped(false);
        setIsFinished(false);
        setIsEditingCurrent(false);
        setLearnedCards(new Set());
        setReviewCards(new Set());
        setCurrentView('study');

        toast(`Đã tạo thành công bộ thẻ "${extractedTitle}" với ${formatted.length} thẻ!`, 'success');
        if (addLog) addLog(`Đã tạo bộ thẻ AI: ${extractedTitle}`, 'ai');

        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `Anh đã thiết kế thành công bộ thẻ "${extractedTitle}" gồm ${formatted.length} thẻ học cho em rồi đấy! Hãy cùng ôn luyện ở màn hình chính nhé. 🚀` 
        }]);
      } catch (err) {
        console.error(err);
        toast(err.message || 'Lỗi khi tạo flashcard từ AI!', 'error');
        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: 'Rất tiếc, đã xảy ra lỗi trong quá trình tự động thiết kế bộ thẻ. Em vui lòng thử lại hoặc mô tả rõ hơn nhé!' 
        }]);
      } finally {
        setIsChatTyping(false);
      }
    } else {
      // Normal conversational helper queries
      try {
        const historyToSend = chatMessages.slice(-8).map(msg => ({
          sender: msg.sender,
          text: msg.text
        }));

        const res = await api.chatbot(message, historyToSend);
        setChatMessages(prev => [...prev, { sender: 'bot', text: res.reply }]);
      } catch (err) {
        console.error(err);
        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: 'Có lỗi kết nối với trợ lý AI. Em hãy thử lại sau nhé!' 
        }]);
      } finally {
        setIsChatTyping(false);
      }
    }
  };

  // Manual Editing States
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPartOfSpeech, setEditPartOfSpeech] = useState('Danh từ');
  const [editHashtag, setEditHashtag] = useState('# Lịch sử');

  // Input states
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  // History state
  const [savedDecks, setSavedDecks] = useState([]);

  // Refs
  const fileInputRef = useRef(null);
  const cardImageInputRef = useRef(null);

  // Initial load history
  useEffect(() => {
    loadSavedDecks();
  }, []);

  // Keyboard listener for Space (Flip) and Arrows (Prev/Next)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in inputs or textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, activeCards.length]);

  // Voice synthesis auto pronounce when changing cards or flipping
  useEffect(() => {
    if (autoPronounce && activeCards.length > 0 && !isEditingCurrent && !isFinished) {
      const textToSpeak = isFlipped ? activeCards[currentIdx]?.card?.back : activeCards[currentIdx]?.card?.front;
      if (textToSpeak) {
        speakText(textToSpeak);
      }
    }
  }, [currentIdx, isFlipped, autoPronounce, isFinished, isEditingCurrent, activeCards]);

  const loadSavedDecks = () => {
    try {
      const stored = localStorage.getItem('edupath_saved_flashcard_decks');
      if (stored) {
        setSavedDecks(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveActiveDeckChanges = (updatedCards, updatedTitle) => {
    const titleToUse = updatedTitle !== undefined ? updatedTitle : deckTitle;
    let nextDecks = [];
    try {
      const stored = localStorage.getItem('edupath_saved_flashcard_decks');
      if (stored) {
        nextDecks = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    if (activeDeckId === 'default' || !activeDeckId) {
      const newId = Date.now().toString();
      const newDeck = {
        id: newId,
        title: titleToUse.trim() || 'Chủ đề Lịch sử & Khảo cổ học',
        cards: updatedCards,
        createdAt: new Date().toISOString()
      };
      const finalDecks = [newDeck, ...nextDecks];
      setActiveDeckId(newId);
      setSavedDecks(finalDecks);
      localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(finalDecks));
      toast('Đã lưu các chỉnh sửa thành bộ thẻ mới của bạn!', 'success');
    } else {
      const finalDecks = nextDecks.map(d => {
        if (d.id === activeDeckId) {
          return {
            ...d,
            title: titleToUse.trim() || d.title,
            cards: updatedCards
          };
        }
        return d;
      });
      setSavedDecks(finalDecks);
      localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(finalDecks));
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel playing voice first
      const utterance = new SpeechSynthesisUtterance(text);
      const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
      utterance.lang = isVietnamese ? 'vi-VN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      toast('Trình duyệt không hỗ trợ tổng hợp giọng nói.', 'warning');
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    setSelectedFile(file);
    setIsLoading(true);
    
    try {
      if (file.type.startsWith('image/')) {
        setLoadingStep('Đang khởi tạo OCR nhận diện chữ trong ảnh...');
        const result = await Tesseract.recognize(file, 'vie+eng', {
          logger: m => {
            if (m.status === 'recognizing') {
              setLoadingStep(`Nhận diện chữ trong ảnh: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        const text = result.data.text;
        if (!text || !text.trim()) {
          toast('Không tìm thấy văn bản nào trong ảnh này!', 'warning');
        } else {
          setInputText(text);
          toast('Nhận diện chữ thành công từ hình ảnh!', 'success');
        }
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        setLoadingStep('Đang đọc file văn bản...');
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
        setInputText(text);
        toast('Đã nạp văn bản thành công!', 'success');
      } else {
        setLoadingStep('Đang đọc cấu trúc tệp...');
        await new Promise(r => setTimeout(r, 1000));
        const promptText = `Tài liệu: ${file.name}. Hãy tạo các thẻ flashcard ôn tập.`;
        setInputText(promptText);
        toast(`Đã nhận diện file ${file.name}.`, 'success');
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi khi đọc file tài liệu!', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setInputText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger AI Flashcards generation
  const handleGenerateFlashcards = async () => {
    const content = inputText.trim();
    if (!content) {
      toast('Vui lòng nhập văn bản hoặc tải file lên!', 'warning');
      return;
    }

    setIsLoading(true);
    setLoadingStep('AI đang phân tích kiến thức và thiết kế thẻ học...');
    setIsFlipped(false);
    setIsFinished(false);
    setIsEditingCurrent(false);
    setLearnedCards(new Set());
    setReviewCards(new Set());

    if (addLog) {
      addLog(`Tạo bộ flashcard AI từ tài liệu: "${content.substring(0, 50)}..."`, 'sys');
    }

    try {
      const result = await api.generateFlashcards(content);
      
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Dữ liệu flashcard trả về không hợp lệ.');
      }

      // Add extra defaults
      const formatted = result.map((c, index) => ({
        ...c,
        image: null,
        partOfSpeech: index % 2 === 0 ? "Khái niệm" : "Định nghĩa",
        hashtag: selectedFile ? `# ${selectedFile.name.substring(0, 8)}` : "# Học tập"
      }));
      
      const generatedTitle = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : `Flashcard ${new Date().toLocaleDateString('vi-VN')}`;
      const newId = Date.now().toString();
      const newDeck = {
        id: newId,
        title: generatedTitle,
        cards: formatted,
        createdAt: new Date().toISOString()
      };

      const nextDecks = [newDeck, ...savedDecks];
      setSavedDecks(nextDecks);
      localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));

      setCards(formatted);
      setDeckTitle(generatedTitle);
      setActiveDeckId(newId);
      setCurrentIdx(0);
      setIsFlipped(false);
      setIsFinished(false);
      setIsEditingCurrent(false);
      setLearnedCards(new Set());
      setReviewCards(new Set());
      setCurrentView('study');

      toast(`Đã tạo thành công ${formatted.length} thẻ ghi nhớ AI!`, 'success');
      if (addLog) addLog('Đã tạo thành công bộ flashcard AI', 'ai');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Lỗi khi tạo flashcard từ AI. Vui lòng thử lại!', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Manual Card Operations
  const handleStartEditCurrent = () => {
    if (activeCards.length === 0) return;
    const cur = activeCards[currentIdx]?.card;
    if (!cur) return;
    setEditFront(cur.front || '');
    setEditBack(cur.back || '');
    setEditImage(cur.image || null);
    setEditPartOfSpeech(cur.partOfSpeech || 'Khái niệm');
    setEditHashtag(cur.hashtag || '# Ôn tập');
    setEditingCardIdx(activeCards[currentIdx]?.originalIdx);
    setIsAddingCard(false);
    setIsEditingCurrent(true);
  };

  const handleStartEditCardAtIndex = (idx) => {
    const cur = cards[idx];
    if (!cur) return;
    setEditFront(cur.front || '');
    setEditBack(cur.back || '');
    setEditImage(cur.image || null);
    setEditPartOfSpeech(cur.partOfSpeech || 'Khái niệm');
    setEditHashtag(cur.hashtag || '# Ôn tập');
    setEditingCardIdx(idx);
    setIsAddingCard(false);
    setIsEditingCurrent(true);
  };

  const handleSaveCurrentEdit = () => {
    if (!editFront.trim() || !editBack.trim()) {
      toast('Nội dung mặt trước và mặt sau không được bỏ trống!', 'warning');
      return;
    }

    let nextCards;
    if (isAddingCard) {
      const newCard = {
        front: editFront.trim(),
        back: editBack.trim(),
        image: editImage,
        partOfSpeech: editPartOfSpeech.trim(),
        hashtag: editHashtag.trim()
      };
      nextCards = [...cards, newCard];
      setCards(nextCards);
      setCurrentIdx(nextCards.length - 1);
      setIsAddingCard(false);
      toast('Đã thêm thẻ mới thành công!', 'success');
    } else {
      const editIdx = editingCardIdx !== null ? editingCardIdx : activeCards[currentIdx]?.originalIdx;
      if (editIdx === undefined || editIdx === null) return;
      nextCards = [...cards];
      nextCards[editIdx] = {
        front: editFront.trim(),
        back: editBack.trim(),
        image: editImage,
        partOfSpeech: editPartOfSpeech.trim(),
        hashtag: editHashtag.trim()
      };
      setCards(nextCards);
      toast('Đã cập nhật thẻ thành công!', 'success');
    }
    
    // Auto-save changes
    saveActiveDeckChanges(nextCards);
    setIsEditingCurrent(false);
    setEditingCardIdx(null);
  };

  const handleAddCard = () => {
    setEditFront('');
    setEditBack('');
    setEditImage(null);
    setEditPartOfSpeech('Khái niệm');
    setEditHashtag('# Tự tạo');
    setEditingCardIdx(null);
    setIsAddingCard(true);
    setIsEditingCurrent(true);
  };

  const handleCreateNewDeck = () => {
    setNewDeckTitle('');
    setNewDeckHashtag('# Tự tạo');
    setIsCreatingDeckModal(true);
  };

  const handleConfirmCreateDeck = () => {
    if (!newDeckTitle.trim()) {
      toast('Tên bộ thẻ không được bỏ trống!', 'warning');
      return;
    }

    const finalName = newDeckTitle.trim();
    const rawHashtag = newDeckHashtag.trim();
    const finalHashtag = rawHashtag ? (rawHashtag.startsWith('#') ? rawHashtag : `# ${rawHashtag}`) : '# Tự tạo';

    const newCards = [
      {
        front: 'Khái niệm 1',
        back: 'Giải thích chi tiết khái niệm 1',
        image: null,
        partOfSpeech: 'Khái niệm',
        hashtag: finalHashtag
      },
      {
        front: 'Khái niệm 2',
        back: 'Giải thích chi tiết khái niệm 2',
        image: null,
        partOfSpeech: 'Khái niệm',
        hashtag: finalHashtag
      },
      {
        front: 'Khái niệm 3',
        back: 'Giải thích chi tiết khái niệm 3',
        image: null,
        partOfSpeech: 'Khái niệm',
        hashtag: finalHashtag
      }
    ];

    const newId = Date.now().toString();
    const newDeck = {
      id: newId,
      title: finalName,
      cards: newCards,
      createdAt: new Date().toISOString()
    };

    let latestDecks = [];
    try {
      const stored = localStorage.getItem('edupath_saved_flashcard_decks');
      if (stored) {
        latestDecks = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    const nextDecks = [newDeck, ...latestDecks];
    setSavedDecks(nextDecks);
    localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));

    setDeckTitle(finalName);
    setCards(newCards);
    setActiveDeckId(newId);
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsFinished(false);
    setLearnedCards(new Set());
    setReviewCards(new Set());
    setCurrentView('study');

    // Do not auto-open the editing modal, show the folder/deck workspace
    setIsAddingCard(false);
    setIsEditingCurrent(false);
    setIsCreatingDeckModal(false);

    toast(`Đã tạo bộ thẻ "${finalName}" gồm ${newCards.length} thẻ học!`, 'success');
  };

  const handleDeleteCardAtIndex = (idx) => {
    if (cards.length <= 1) {
      toast('Không thể xóa vì bộ phải có ít nhất 1 thẻ!', 'warning');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa thẻ này khỏi bộ?')) return;
    
    const nextCards = cards.filter((_, i) => i !== idx);
    setCards(nextCards);
    
    // Auto-save changes
    saveActiveDeckChanges(nextCards);
    
    setCurrentIdx(prev => Math.max(0, Math.min(prev, nextCards.length - 1)));
    toast('Đã xóa thẻ khỏi bộ thành công!', 'success');
  };

  const handleDeleteCard = () => {
    if (activeCards.length === 0) return;
    const origIdx = activeCards[currentIdx]?.originalIdx;
    if (origIdx === undefined) return;
    handleDeleteCardAtIndex(origIdx);
  };

  const handleCardImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast('Vui lòng chọn tệp hình ảnh hợp lệ!', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setEditImage(uploadEvent.target.result);
        toast('Đã nạp hình ảnh lên thẻ!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShuffleDeck = () => {
    if (cards.length <= 1) return;
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsFinished(false);
    toast('Đã trộn ngẫu nhiên bộ thẻ!', 'success');
  };

  // Study Deck review navigation
  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIdx < activeCards.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
      }
    }, 150);
  };

  const markAsLearned = () => {
    const origIdx = activeCards[currentIdx]?.originalIdx;
    if (origIdx === undefined) return;
    setLearnedCards(prev => {
      const next = new Set(prev);
      next.add(origIdx);
      return next;
    });
    setReviewCards(prev => {
      const next = new Set(prev);
      next.delete(origIdx);
      return next;
    });
    handleNext();
  };

  const markForReview = () => {
    const origIdx = activeCards[currentIdx]?.originalIdx;
    if (origIdx === undefined) return;
    setReviewCards(prev => {
      const next = new Set(prev);
      next.add(origIdx);
      return next;
    });
    setLearnedCards(prev => {
      const next = new Set(prev);
      next.delete(origIdx);
      return next;
    });
    handleNext();
  };

  const restartReview = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsEditingCurrent(false);
    setLearnedCards(new Set());
    setReviewCards(new Set());
  };

  // Save deck to localStorage
  const handleSaveDeck = () => {
    if (cards.length === 0) return;
    
    const newDeck = {
      id: Date.now().toString(),
      title: deckTitle.trim() || 'Thẻ ghi nhớ không tên',
      cards: cards,
      createdAt: new Date().toISOString()
    };

    const nextDecks = [newDeck, ...savedDecks.filter(d => d.title !== newDeck.title)];
    setSavedDecks(nextDecks);
    localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));
    toast('Đã lưu bộ thẻ học thành công!', 'success');
  };

  // Load deck from history
  const handleLoadDeck = (deck) => {
    setCards(deck.cards);
    setDeckTitle(deck.title);
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsEditingCurrent(false);
    setLearnedCards(new Set());
    setReviewCards(new Set());
    setCurrentView('study');
    toast(`Đã tải bộ thẻ: ${deck.title}`, 'success');
  };

  // Delete saved deck
  const handleDeleteDeck = (e, id) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bộ thẻ này?')) return;

    const nextDecks = savedDecks.filter(d => d.id !== id);
    setSavedDecks(nextDecks);
    localStorage.setItem('edupath_saved_flashcard_decks', JSON.stringify(nextDecks));
    toast('Đã xóa bộ thẻ thành công!', 'success');
  };

  // Mastery percentage calculation
  const masteryPercent = Math.round((learnedCards.size / cards.length) * 100 || 0);
  const remainingCount = cards.length - learnedCards.size;

  return (
    <div className="flashcard-page-container">
      <div 
        className="flashcard-workspace-grid"
        style={{ 
          gridTemplateColumns: `220px 1fr 6px ${sidebarWidth}px`,
          gap: '12px'
        }}
      >
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="flashcard-left-sidebar">
          <div 
            onClick={() => navigateTo('/')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              textDecoration: 'none',
              padding: '6px 8px 16px 8px',
              borderBottom: '1px solid var(--fc-border-dark, #2F2F26)',
              marginBottom: '14px',
              width: '100%',
              boxSizing: 'border-box'
            }}
            title="Quay lại Trang chủ"
          >
            <div 
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img src={sunLogoImg} alt="EduPath AI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff', letterSpacing: '0.3px', fontFamily: "'Outfit', sans-serif" }}>
              EduPath <em style={{ fontStyle: 'normal', color: '#FFD234' }}>AI</em>
            </span>
          </div>

          <div className="flashcard-nav-menu">
            <h4 className="flashcard-menu-title">HỌC TẬP</h4>

            <button 
              className="flashcard-btn-create-deck" 
              onClick={handleCreateNewDeck} 
              title="Khởi tạo một bộ thẻ ghi nhớ hoàn toàn mới"
            >
              <HiPlus />
              <span>Tạo bộ thẻ mới</span>
            </button>
            
            <button 
              className={`flashcard-menu-item ${currentView === 'decks' ? 'flashcard-menu-item--active' : ''}`}
              onClick={() => {
                setCurrentView('decks');
                setIsFinished(false);
              }}
            >
              <span className="flashcard-menu-item-left">
                <span className="flashcard-menu-item-icon">🗂️</span>
                <span>Bộ thẻ của tôi</span>
              </span>
            </button>

            <button 
              className={`flashcard-menu-item ${currentView === 'study' && !isFinished && studyFilter === 'learned' ? 'flashcard-menu-item--active' : ''}`}
              onClick={() => {
                setCurrentView('study');
                setIsFinished(false);
                handleFilterStudy('learned');
              }}
            >
              <span className="flashcard-menu-item-left">
                <span className="flashcard-menu-item-icon" style={{ color: '#10b981' }}>✓</span>
                <span>Đã nhớ</span>
              </span>
              <span className="flashcard-menu-item-counter">{learnedCards.size}</span>
            </button>

            <button 
              className={`flashcard-menu-item ${currentView === 'study' && !isFinished && studyFilter === 'remaining' ? 'flashcard-menu-item--active' : ''}`}
              onClick={() => {
                setCurrentView('study');
                setIsFinished(false);
                handleFilterStudy('remaining');
              }}
            >
              <span className="flashcard-menu-item-left">
                <span className="flashcard-menu-item-icon" style={{ color: '#ef4444' }}>✕</span>
                <span>Chưa nhớ</span>
              </span>
              <span className="flashcard-menu-item-counter">{remainingCount}</span>
            </button>

            <button 
              className={`flashcard-menu-item ${currentView === 'study' && !isFinished && studyFilter === 'review' ? 'flashcard-menu-item--active' : ''}`}
              onClick={() => {
                setCurrentView('study');
                setIsFinished(false);
                handleFilterStudy('review');
              }}
            >
              <span className="flashcard-menu-item-left">
                <span className="flashcard-menu-item-icon" style={{ color: '#f59e0b' }}>↺</span>
                <span>Cần ôn tập</span>
              </span>
              <span className="flashcard-menu-item-counter">{reviewCards.size}</span>
            </button>

            <button 
              className={`flashcard-menu-item ${currentView === 'study' && isFinished ? 'flashcard-menu-item--active' : ''}`}
              onClick={() => {
                setCurrentView('study');
                setIsFinished(true);
              }}
            >
              <span className="flashcard-menu-item-left">
                <span className="flashcard-menu-item-icon">📈</span>
                <span>Thống kê</span>
              </span>
            </button>
          </div>

          {/* Left panel inputs inside sidebar */}
          {activeTab === 'create' ? (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--fc-border-dark)', paddingTop: '16px' }}>
              <div 
                className={`aitutor-dropzone ${isDraggingFile ? 'aitutor-dropzone--active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '12px 6px', minHeight: '100px' }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*,text/plain,.txt,.md"
                  style={{ display: 'none' }} 
                />
                <HiUpload style={{ fontSize: '18px', color: '#9CA3AF' }} />
                <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '4px 0 0 0' }}>Tải ảnh/tệp trích xuất</p>
                
                {selectedFile && (
                  <div className="aitutor-uploaded-tag" onClick={(e) => e.stopPropagation()} style={{ width: '90%', fontSize: '10px' }}>
                    <span>{selectedFile.name}</span>
                    <button className="aitutor-clear-file" onClick={clearSelectedFile}><HiX /></button>
                  </div>
                )}
              </div>

              <textarea
                className="aitutor-textarea"
                placeholder="Dán tóm tắt kiến thức vào đây để AI phân tích tạo thẻ học..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                style={{ minHeight: '90px' }}
              />

              <button
                className="aitutor-action-btn"
                onClick={handleGenerateFlashcards}
                disabled={isLoading || !inputText.trim()}
                style={{ padding: '8px' }}
              >
                {isLoading ? <span className="spinner" /> : <><HiSparkles /> Tạo bộ thẻ AI</>}
              </button>

              {isLoading && loadingStep && (
                <div className="aitutor-step-progress" style={{ fontSize: '10px', padding: '6px' }}>
                  <p>{loadingStep}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--fc-border-dark)', paddingTop: '16px', maxHeight: '250px', overflowY: 'auto' }}>
              <h5 style={{ fontSize: '11px', margin: '0 0 8px 0', color: 'var(--fc-text-secondary)' }}>BỘ THẺ ĐÃ LƯU</h5>
              {savedDecks.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--fc-text-secondary)', textAlign: 'center' }}>Chưa có bộ thẻ nào.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {savedDecks.map(deck => (
                    <div 
                      key={deck.id}
                      onClick={() => handleLoadDeck(deck)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', border: '1px solid var(--fc-border-dark)' }}
                    >
                      <span style={{ fontSize: '11.5px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {deck.title}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteDeck(e, deck.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                      >
                        <HiTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Streak Flame card at bottom left */}
          <div className="flashcard-streak-card">
            <span className="flashcard-streak-icon">🔥</span>
            <div className="flashcard-streak-text">
              <span className="flashcard-streak-value">{streakDays} ngày</span>
              <span className="flashcard-streak-label">Chuỗi học liên tục</span>
            </div>
          </div>
        </aside>

        {/* ================= CENTER WORKSPACE ================= */}
        <main className="flashcard-center-workspace">
          {currentView === 'decks' ? (
            /* ================= DECKS SELECTOR VIEW ================= */
            <div className="flashcard-decks-selector animate-in" style={{ padding: '8px 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--fc-gold)', margin: 0 }}>Bộ thẻ của tôi 🗂️</h2>
                  <p style={{ fontSize: '12.5px', color: 'var(--fc-text-secondary)', margin: '4px 0 0 0' }}>
                    Chọn một bộ từ vựng dưới đây để bắt đầu ôn luyện. Bạn có thể tự tạo hoặc dùng AI để sinh bộ thẻ mới.
                  </p>
                </div>
              </div>

              {/* Decks Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                
                {/* Default Deck */}
                <div 
                  className="flashcard-document-deck-item flashcard-document-deck-item--default animate-in"
                  onClick={() => {
                    setCards(DEFAULT_DECK);
                    setDeckTitle('Chủ đề Lịch sử & Khảo cổ học');
                    setActiveDeckId('default');
                    setCurrentIdx(0);
                    setIsFlipped(false);
                    setIsFinished(false);
                    setLearnedCards(new Set());
                    setReviewCards(new Set());
                    setCurrentView('study');
                    toast('Đã tải bộ thẻ: Chủ đề Lịch sử & Khảo cổ học', 'success');
                  }}
                >
                  <div>
                    <div className="flashcard-doc-icon-container">
                      <HiFolder className="flashcard-doc-large-icon" />
                      <span className="flashcard-doc-meta-badge flashcard-doc-meta-badge--default">
                        Mặc định
                      </span>
                    </div>
                    <span className="flashcard-doc-card-count">5 thẻ học</span>
                    <h4 className="flashcard-doc-title">
                      Chủ đề Lịch sử & Khảo cổ học
                    </h4>
                    <div className="flashcard-doc-lines-preview">
                      <div className="flashcard-doc-line" />
                      <div className="flashcard-doc-line" />
                      <div className="flashcard-doc-line" />
                    </div>
                  </div>
                  
                  <div className="flashcard-doc-actions">
                    <button 
                      className="flashcard-doc-btn-study"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCards(DEFAULT_DECK);
                        setDeckTitle('Chủ đề Lịch sử & Khảo cổ học');
                        setActiveDeckId('default');
                        setCurrentIdx(0);
                        setIsFlipped(false);
                        setIsFinished(false);
                        setLearnedCards(new Set());
                        setReviewCards(new Set());
                        setCurrentView('study');
                        toast('Đã tải bộ thẻ: Chủ đề Lịch sử & Khảo cổ học', 'success');
                      }}
                    >
                      Học ngay
                    </button>
                  </div>
                </div>

                {/* Saved Decks */}
                {savedDecks.map(deck => (
                  <div 
                    key={deck.id} 
                    className="flashcard-document-deck-item animate-in"
                    onClick={() => handleLoadDeck(deck)}
                  >
                    <div>
                      <div className="flashcard-doc-icon-container">
                        <HiFolder className="flashcard-doc-large-icon" style={{ color: 'var(--fc-gold)' }} />
                        <span className="flashcard-doc-meta-badge flashcard-doc-meta-badge--saved">
                          Đã lưu
                        </span>
                      </div>
                      <span className="flashcard-doc-card-count">{deck.cards?.length || 0} thẻ học</span>
                      <h4 className="flashcard-doc-title">
                        {deck.title}
                      </h4>
                      <div className="flashcard-doc-lines-preview">
                        <div className="flashcard-doc-line" />
                        <div className="flashcard-doc-line" />
                        <div className="flashcard-doc-line" />
                      </div>
                    </div>

                    <div className="flashcard-doc-actions">
                      <button 
                        onClick={(e) => handleDeleteDeck(e, deck.id)}
                        className="flashcard-doc-btn-delete"
                        title="Xóa bộ thẻ này"
                      >
                        Xóa
                      </button>
                      
                      <button 
                        className="flashcard-doc-btn-study" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadDeck(deck);
                        }}
                      >
                        Học ngay
                      </button>
                    </div>
                  </div>
                ))}

              </div>
              
              {savedDecks.length === 0 && (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--fc-border-dark)', borderRadius: '20px', padding: '40px', marginTop: '24px' }}>
                  <p style={{ color: 'var(--fc-text-secondary)', fontSize: '13px', margin: 0 }}>
                    Bạn chưa tạo thêm bộ thẻ nào khác. Hãy dán tài liệu vào khung nhập bên trái hoặc sử dụng EduBot chat để tạo thẻ học tự động!
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ================= REGULAR STUDY CANVAS ================= */
            <>
              <div className="flashcard-center-header">
                <div>
                  <div className="flashcard-header-breadcrumb" style={{ cursor: 'pointer', color: 'var(--fc-gold)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }} onClick={() => setCurrentView('decks')}>
                    <span>← Bộ thẻ của tôi</span> · <span>{deckTitle}</span>
                  </div>
                  <div className="flashcard-header-title-row" style={{ marginTop: '4px' }}>
                    <input 
                      type="text" 
                      className="flashcard-title-creator-input"
                      value={deckTitle}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setDeckTitle(newTitle);
                        saveActiveDeckChanges(cards, newTitle);
                      }}
                      placeholder="Nhập tên bộ thẻ học..."
                      style={{ width: '420px', fontSize: '18px', fontWeight: 'bold' }}
                    />
                    <span className="flashcard-header-tag">Academic</span>
                  </div>
                </div>

                <div className="flashcard-header-actions">
                  <button className="flashcard-header-btn" onClick={handleShuffleDeck} title="Trộn thẻ ngẫu nhiên">
                    Trộn thẻ
                  </button>
                  <button 
                    className="flashcard-header-btn" 
                    onClick={() => setAutoPronounce(!autoPronounce)}
                    style={{ borderColor: autoPronounce ? 'var(--fc-gold)' : '', color: autoPronounce ? 'var(--fc-gold)' : '' }}
                    title="Tự động đọc nội dung thẻ bằng giọng nói"
                  >
                    🔊 Tự động phát âm: {autoPronounce ? 'BẬT' : 'TẮT'}
                  </button>
                  <button className="flashcard-header-btn" onClick={handleAddCard}>
                    <HiPlus /> Thêm thẻ mới
                  </button>
                  {cards.length > 0 && (
                    <button className="flashcard-header-btn" onClick={handleSaveDeck} style={{ background: 'var(--fc-gold)', color: '#12120e' }}>
                      <HiSave /> Lưu bộ thẻ
                    </button>
                  )}
                </div>
              </div>

              {/* Flashcard Render Canvas */}
              <div className="flashcard-canvas-card-area">
                {!isFinished && activeCards.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                    
                    {/* 3D Starry Flippable Card */}
                    <div 
                      className={`flashcard-3d-card-wrapper ${isFlipped ? 'flashcard-3d-card-wrapper--flipped' : ''}`}
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      
                      {/* Front Side */}
                      <div className="flashcard-night-face">
                        <div className="flashcard-star-particles" />
                        
                        <span className="flashcard-card-part-of-speech">
                          {activeCards[currentIdx]?.card?.partOfSpeech || 'Khái niệm'} (Mặt trước)
                        </span>

                        <div className="flashcard-card-top-actions" onClick={e => e.stopPropagation()}>
                          <button 
                            className="flashcard-card-action-circle"
                            onClick={() => speakText(activeCards[currentIdx]?.card?.front)}
                            title="Đọc từ vựng"
                          >
                            <HiVolumeUp />
                          </button>
                          <button 
                            className="flashcard-card-action-circle"
                            onClick={handleStartEditCurrent}
                            title="Sửa nội dung thẻ này"
                          >
                            ✏️
                          </button>
                          <button 
                            className="flashcard-card-action-circle"
                            onClick={handleDeleteCard}
                            title="Xóa thẻ này"
                            style={{ color: '#ef4444' }}
                          >
                            <HiTrash />
                          </button>
                        </div>

                        <div className="flashcard-card-word-title">
                          {activeCards[currentIdx]?.card?.front}
                        </div>

                        {activeCards[currentIdx]?.card?.image && (
                          <div className="flashcard-uploaded-img-wrapper">
                            <img src={activeCards[currentIdx].card.image} alt="Card illustration" />
                          </div>
                        )}

                        <span className="flashcard-card-hashtag">
                          {activeCards[currentIdx]?.card?.hashtag || '# Học tập'}
                        </span>

                        <span className="flashcard-card-prompt-bottom">
                          Nhấp vào thẻ để xem nghĩa ↺
                        </span>

                        {/* Cartoon happy mascot bouncing */}
                        <svg className="moon-mascot" width="48" height="48" viewBox="0 0 64 64" fill="none">
                          <circle cx="32" cy="32" r="28" fill="#FFFFFF" />
                          <circle cx="24" cy="28" r="2.5" fill="#1E1E18" />
                          <circle cx="40" cy="28" r="2.5" fill="#1E1E18" />
                          <path d="M 28 36 Q 32 40 36 36" stroke="#1E1E18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                          <circle cx="19" cy="32" r="3" fill="#FFB4B4" opacity="0.6" />
                          <circle cx="45" cy="32" r="3" fill="#FFB4B4" opacity="0.6" />
                        </svg>
                      </div>

                      {/* Back Side */}
                      <div className="flashcard-night-face flashcard-night-face--back">
                        <div className="flashcard-star-particles" />
                        
                        <span className="flashcard-card-part-of-speech" style={{ color: 'var(--fc-gold)' }}>
                          GIẢI THÍCH (Mặt sau)
                        </span>

                        <div className="flashcard-card-top-actions" onClick={e => e.stopPropagation()}>
                          <button 
                            className="flashcard-card-action-circle"
                            onClick={() => speakText(activeCards[currentIdx]?.card?.back)}
                            title="Đọc giải thích"
                          >
                            <HiVolumeUp />
                          </button>
                          <button 
                            className="flashcard-card-action-circle"
                            onClick={handleStartEditCurrent}
                            title="Sửa nội dung thẻ này"
                          >
                            ✏️
                          </button>
                        </div>

                        <div className="flashcard-card-word-title" style={{ fontSize: '22px', fontWeight: '500', padding: '0 12px', lineHeight: '1.6' }}>
                          {activeCards[currentIdx]?.card?.back}
                        </div>

                        {activeCards[currentIdx]?.card?.image && (
                          <div className="flashcard-uploaded-img-wrapper">
                            <img src={activeCards[currentIdx].card.image} alt="Card illustration" />
                          </div>
                        )}

                        <span className="flashcard-card-hashtag" style={{ color: 'var(--fc-gold)', background: 'rgba(255, 226, 89, 0.05)' }}>
                          {activeCards[currentIdx]?.card?.hashtag || '# Học tập'}
                        </span>

                        <span className="flashcard-card-prompt-bottom">
                          Nhấp vào thẻ để xem lại câu hỏi ↺
                        </span>

                        {/* Cartoon happy mascot bouncing */}
                        <svg className="moon-mascot" width="48" height="48" viewBox="0 0 64 64" fill="none">
                          <circle cx="32" cy="32" r="28" fill="#FFFFFF" />
                          <circle cx="24" cy="28" r="2.5" fill="#1E1E18" />
                          <circle cx="40" cy="28" r="2.5" fill="#1E1E18" />
                          <path d="M 28 36 Q 32 40 36 36" stroke="#1E1E18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                          <circle cx="19" cy="32" r="3" fill="#FFB4B4" opacity="0.6" />
                          <circle cx="45" cy="32" r="3" fill="#FFB4B4" opacity="0.6" />
                        </svg>
                      </div>
                    </div>

                    {/* Progress indicators under card */}
                    <div style={{ display: 'flex', width: '100%', maxWidth: '740px', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--fc-text-secondary)' }}>
                      <span>Thẻ {currentIdx + 1} / {activeCards.length}</span>
                      <div style={{ width: '150px', background: 'var(--fc-border-dark)', height: '6px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--fc-gold)', height: '100%', width: `${((currentIdx + 1) / activeCards.length) * 100}%`, transition: 'width 0.2s' }} />
                      </div>
                      <span>Đã thuộc: {learnedCards.size} / {cards.length}</span>
                    </div>
                  </div>
                ) : activeCards.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: 'var(--fc-text-secondary)', fontSize: '13px' }}>
                      {studyFilter === 'all' 
                        ? 'Bộ thẻ ghi nhớ trống. Hãy nhập kiến thức bên trái để tạo thẻ tự động, hoặc bấm "Thêm thẻ mới"!'
                        : `Không có thẻ nào trong nhóm "${studyFilter === 'learned' ? 'Đã thuộc' : studyFilter === 'remaining' ? 'Chưa thuộc' : 'Cần ôn tập'}". Hãy chọn nhóm học khác hoặc tiếp tục học nhé!`
                      }
                    </p>
                    {studyFilter !== 'all' && (
                      <button 
                        className="flashcard-header-btn" 
                        onClick={() => setStudyFilter('all')}
                        style={{ marginTop: '16px', background: 'var(--fc-gold)', color: '#12120e', border: 'none', padding: '8px 16px' }}
                      >
                        Xem tất cả thẻ
                      </button>
                    )}
                  </div>
                ) : (
                  /* Finish summary screen */
                  <div className="flashcard-finish-screen animate-in" style={{ background: 'var(--fc-starry-bg)', border: '1px solid var(--fc-border-dark)', borderRadius: '28px', padding: '40px', width: '100%', maxWidth: '740px', textAlign: 'center' }}>
                    <div className="finish-emoji" style={{ fontSize: '48px', animation: 'float-moon 2s infinite' }}>🏆</div>
                    <h3 className="finish-title" style={{ fontSize: '20px', fontWeight: '900', color: 'var(--fc-gold)' }}>Hoàn thành buổi ôn tập!</h3>
                    <p className="finish-desc" style={{ fontSize: '13px', color: 'var(--fc-text-secondary)' }}>Bạn đã hoàn thành việc ôn luyện bộ thẻ học <strong>{deckTitle}</strong>.</p>
                    
                    {/* Result Statistics */}
                    <div className="finish-stats-card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--fc-border-dark)', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px', margin: '20px 0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '28px', fontWeight: '900', color: '#10b981' }}>{learnedCards.size}</span>
                        <span style={{ fontSize: '11px', color: 'var(--fc-text-secondary)' }}>Thẻ đã nhớ</span>
                      </div>
                      <div style={{ textAlign: 'center', borderLeft: '1px solid var(--fc-border-dark)' }}>
                        <span style={{ display: 'block', fontSize: '28px', fontWeight: '900', color: '#f59e0b' }}>{reviewCards.size}</span>
                        <span style={{ fontSize: '11px', color: 'var(--fc-text-secondary)' }}>Cần ôn tập lại</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button className="flashcard-header-btn" onClick={restartReview} style={{ background: 'var(--fc-gold)', color: '#12120e', border: 'none' }}>
                        <HiRefresh /> Ôn lại từ đầu
                      </button>
                      <button className="flashcard-header-btn" onClick={() => setCurrentView('decks')}>
                        Quay lại danh sách bộ thẻ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom review actions buttons */}
              {!isFinished && activeCards.length > 0 && (
                <div className="flashcard-bottom-actions-bar">
                  <button 
                    className="flashcard-bottom-btn flashcard-bottom-btn--review" 
                    onClick={markForReview}
                    title="Đánh dấu thẻ này chưa thuộc (Phím mũi tên Trái)"
                  >
                    ✕ Chưa nhớ <span className="flashcard-bottom-btn-count">{reviewCards.size}</span>
                  </button>
                  
                  <button 
                    className="flashcard-bottom-btn flashcard-bottom-btn--flip" 
                    onClick={() => setIsFlipped(!isFlipped)}
                    title="Lật thẻ qua lại (Phím cách Space)"
                  >
                    Lật thẻ <span className="flashcard-bottom-btn-count" style={{ fontSize: '9px' }}>Space</span>
                  </button>
                  
                  <button 
                    className="flashcard-bottom-btn flashcard-bottom-btn--learned" 
                    onClick={markAsLearned}
                    title="Đánh dấu thẻ này đã thuộc lòng (Phím mũi tên Phải)"
                  >
                    ✓ Đã nhớ <span className="flashcard-bottom-btn-count">{learnedCards.size}</span>
                  </button>
                </div>
              )}

              {/* Card List Manager */}
              {(() => {
                const filteredManagerCards = cards.map((card, index) => ({ card, index })).filter(({ card }) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const frontText = (card.front || '').toLowerCase();
                  const backText = (card.back || '').toLowerCase();
                  const hashtagText = (card.hashtag || '').toLowerCase();
                  return frontText.includes(query) || backText.includes(query) || hashtagText.includes(query);
                });

                return (
                  <div className="flashcard-list-manager-section">
                    <div className="flashcard-list-manager-header">
                      <div className="flashcard-list-manager-title-row">
                        <h3 className="flashcard-list-manager-title">
                          Danh sách thẻ trong bộ ({cards.length})
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="flashcard-list-search-wrapper">
                          <span className="flashcard-list-search-icon">🔍</span>
                          <input 
                            type="text" 
                            className="flashcard-list-search-input" 
                            placeholder="Tìm kiếm thẻ học..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <button 
                          className="flashcard-header-btn" 
                          onClick={handleAddCard}
                          style={{ background: 'rgba(255, 226, 89, 0.08)', color: 'var(--fc-gold)', borderColor: 'rgba(255, 226, 89, 0.3)' }}
                        >
                          <HiPlus /> Thêm thẻ mới
                        </button>
                      </div>
                    </div>

                    <div className="flashcard-list-table-container">
                      {filteredManagerCards.length === 0 ? (
                        <div className="flashcard-list-empty">
                          Không tìm thấy thẻ nào khớp với từ khóa.
                        </div>
                      ) : (
                        <table className="flashcard-list-table">
                          <thead>
                            <tr className="flashcard-list-header-row">
                              <th className="flashcard-list-header-cell" style={{ width: '60px', textAlign: 'center' }}>STT</th>
                              <th className="flashcard-list-header-cell" style={{ width: '220px' }}>Khái niệm (Mặt trước)</th>
                              <th className="flashcard-list-header-cell">Định nghĩa (Mặt sau)</th>
                              <th className="flashcard-list-header-cell" style={{ width: '130px' }}>Chủ đề</th>
                              <th className="flashcard-list-header-cell" style={{ width: '100px', textAlign: 'right' }}>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredManagerCards.map(({ card, index }) => (
                              <tr key={index} className="flashcard-list-row">
                                <td className="flashcard-list-cell" style={{ textAlign: 'center', color: 'var(--fc-text-secondary)', fontWeight: 'bold' }}>
                                  {index + 1}
                                </td>
                                <td className="flashcard-list-cell flashcard-list-cell--front">
                                  {card.front}
                                  {card.partOfSpeech && (
                                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--fc-gold)', marginTop: '4px', fontWeight: 'normal' }}>
                                      ({card.partOfSpeech})
                                    </span>
                                  )}
                                </td>
                                <td className="flashcard-list-cell flashcard-list-cell--back">
                                  {card.back}
                                  {card.image && (
                                    <div style={{ marginTop: '6px' }}>
                                      <img src={card.image} alt="illustration" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid var(--fc-border-dark)' }} />
                                    </div>
                                  )}
                                </td>
                                <td className="flashcard-list-cell">
                                  <span className="flashcard-list-badge">
                                    {card.hashtag || '# Học tập'}
                                  </span>
                                </td>
                                <td className="flashcard-list-cell" style={{ textAlign: 'right' }}>
                                  <div className="flashcard-list-actions">
                                    <button 
                                      className="flashcard-list-action-btn flashcard-list-action-btn--edit" 
                                      onClick={() => handleStartEditCardAtIndex(index)}
                                      title="Sửa thẻ này"
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      className="flashcard-list-action-btn flashcard-list-action-btn--delete" 
                                      onClick={() => handleDeleteCardAtIndex(index)}
                                      title="Xóa thẻ này"
                                    >
                                      <HiTrash />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </main>

        {/* Resizable Divider */}
        <div 
          className="flashcard-sidebar-resizer"
          onMouseDown={handleMouseDown}
          title="Kéo để co giãn sidebar"
        />

        {/* ================= RIGHT SIDEBAR ================= */}
        <aside className="flashcard-right-sidebar">
          {/* Chat Header */}
          <div className="flashcard-chat-header">
            <h5 className="flashcard-chat-header-title">EDUBOT ĐỒNG HÀNH</h5>
            <span className="flashcard-chat-header-status">Hoạt động</span>

            {/* Mascot decoration */}
            <svg 
              style={{ animation: 'float-moon 4s ease-in-out infinite' }} 
              width="24" 
              height="24" 
              viewBox="0 0 64 64"
            >
              <circle cx="32" cy="32" r="28" fill="#FFFFFF" />
              <circle cx="24" cy="28" r="2.5" fill="#1E1E18" />
              <circle cx="40" cy="28" r="2.5" fill="#1E1E18" />
              <path d="M 28 36 Q 32 40 36 36" stroke="#1E1E18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="19" cy="32" r="3" fill="#FFB4B4" opacity="0.6" />
              <circle cx="45" cy="32" r="3" fill="#FFB4B4" opacity="0.6" />
            </svg>
          </div>

          {/* Chat Messages */}
          <div className="flashcard-chat-messages-container">
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`flashcard-chat-bubble ${msg.sender === 'user' ? 'flashcard-chat-bubble--user' : 'flashcard-chat-bubble--bot'}`}
              >
                <span className="flashcard-chat-bubble-sender">
                  {msg.sender === 'user' ? 'Bạn' : 'EduBot'}
                </span>
                <div>{msg.text}</div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isChatTyping && (
              <div className="flashcard-chat-typing-container">
                <span className="flashcard-chat-bubble-sender" style={{ marginBottom: 0 }}>EduBot</span>
                <div className="flashcard-chat-typing-dots">
                  <span className="flashcard-chat-typing-dot"></span>
                  <span className="flashcard-chat-typing-dot"></span>
                  <span className="flashcard-chat-typing-dot"></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts Chips */}
          <div className="flashcard-chat-chips-container">
            <h6 className="flashcard-chat-chips-title">Gợi ý tạo bộ thẻ nhanh</h6>
            <div className="flashcard-chat-chips-row">
              {SUGGESTED_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="flashcard-chat-chip"
                  onClick={() => handleSendChatMessage(null, chip.prompt)}
                  title={chip.prompt}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Field Form */}
          <form className="flashcard-chat-input-wrapper" onSubmit={(e) => handleSendChatMessage(e)}>
            <textarea
              className="flashcard-chat-input-field"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Hỏi EduBot hoặc yêu cầu tạo bộ thẻ..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="flashcard-chat-send-btn" 
              disabled={isChatTyping || !chatInput.trim()}
              title="Gửi tin nhắn"
            >
              <HiSparkles />
            </button>
          </form>
        </aside>

      </div>

      {/* Modal for Creating and Editing Cards */}
      {isEditingCurrent && (
        <div className="flashcard-modal-overlay" onClick={() => setIsEditingCurrent(false)}>
          <div className="flashcard-modal-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="flashcard-modal-header">
              <h3 className="flashcard-modal-title">
                {isAddingCard ? "Thêm thẻ ghi nhớ mới" : "Chỉnh sửa thẻ ghi nhớ"}
              </h3>
              <button className="flashcard-modal-close-btn" onClick={() => setIsEditingCurrent(false)}>
                <HiX />
              </button>
            </div>
            
            <div className="flashcard-modal-body">
              {/* Front side content */}
              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Thuật ngữ / Khái niệm (Mặt trước)</label>
                <input 
                  type="text" 
                  className="flashcard-modal-input"
                  value={editFront}
                  onChange={(e) => setEditFront(e.target.value)}
                  placeholder="Ví dụ: artifact, photosynthesis..."
                  autoFocus
                />
              </div>

              {/* Part of speech */}
              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Từ loại / Phân loại</label>
                <input 
                  type="text" 
                  className="flashcard-modal-input"
                  value={editPartOfSpeech}
                  onChange={(e) => setEditPartOfSpeech(e.target.value)}
                  placeholder="Ví dụ: Danh từ, Động từ, Thuật ngữ..."
                />
              </div>

              {/* Back side content */}
              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Định nghĩa / Giải thích (Mặt sau)</label>
                <textarea 
                  className="flashcard-modal-textarea"
                  value={editBack}
                  onChange={(e) => setEditBack(e.target.value)}
                  placeholder="Giải thích chi tiết nghĩa của từ..."
                  rows={3}
                />
              </div>

              {/* Hashtag */}
              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Hashtag / Chủ đề</label>
                <input 
                  type="text" 
                  className="flashcard-modal-input"
                  value={editHashtag}
                  onChange={(e) => setEditHashtag(e.target.value)}
                  placeholder="Ví dụ: # Lịch sử, # Hóa học..."
                />
              </div>

              {/* Image Upload */}
              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Hình ảnh minh họa</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <button 
                    type="button"
                    className="flashcard-header-btn" 
                    onClick={() => cardImageInputRef.current?.click()}
                    style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '12px' }}
                  >
                    🖼️ Chọn hình ảnh
                  </button>
                  <input 
                    type="file"
                    ref={cardImageInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleCardImageUpload}
                  />
                  {editImage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="flashcard-modal-img-preview">
                        <img src={editImage} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--fc-border-dark)' }} />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditImage(null)} 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flashcard-modal-footer">
              <button 
                type="button"
                className="flashcard-header-btn" 
                onClick={() => setIsEditingCurrent(false)}
                style={{ background: 'transparent', borderColor: 'var(--fc-border-dark)' }}
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                className="flashcard-header-btn" 
                onClick={handleSaveCurrentEdit}
                style={{ background: 'var(--fc-gold)', color: '#12120e', border: 'none' }}
              >
                Lưu thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating New Deck */}
      {isCreatingDeckModal && (
        <div className="flashcard-modal-overlay" onClick={() => setIsCreatingDeckModal(false)}>
          <div className="flashcard-modal-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="flashcard-modal-header">
              <h3 className="flashcard-modal-title">Tạo bộ thẻ mới</h3>
              <button className="flashcard-modal-close-btn" onClick={() => setIsCreatingDeckModal(false)}>
                <HiX />
              </button>
            </div>
            
            <div className="flashcard-modal-body">
              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Tên bộ thẻ</label>
                <input 
                  type="text" 
                  className="flashcard-modal-input"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="Ví dụ: Từ vựng IELTS - Topic Travel"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmCreateDeck();
                    }
                  }}
                />
              </div>

              <div className="flashcard-modal-field">
                <label className="flashcard-modal-label">Chủ đề / Hashtag mặc định</label>
                <input 
                  type="text" 
                  className="flashcard-modal-input"
                  value={newDeckHashtag}
                  onChange={(e) => setNewDeckHashtag(e.target.value)}
                  placeholder="Ví dụ: # Tiếng Anh, # Vật lý..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmCreateDeck();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flashcard-modal-footer">
              <button 
                type="button"
                className="flashcard-header-btn" 
                onClick={() => setIsCreatingDeckModal(false)}
                style={{ background: 'transparent', borderColor: 'var(--fc-border-dark)' }}
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                className="flashcard-header-btn" 
                onClick={handleConfirmCreateDeck}
                style={{ background: 'var(--fc-gold)', color: '#12120e', border: 'none' }}
              >
                Tạo bộ thẻ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
