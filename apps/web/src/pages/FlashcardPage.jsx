import React, { useState, useRef, useEffect } from 'react';
import { 
  HiSparkles, HiPlus, HiMinus, HiTrash, HiSave, HiDownload, 
  HiDocumentText, HiRefresh, HiUpload, HiX, HiChevronRight, 
  HiChevronLeft, HiFolder, HiBadgeCheck, HiStar, HiVolumeUp,
  HiOutlineCog, HiOutlineQuestionMarkCircle
} from 'react-icons/hi';
import { 
  FaPencilAlt, FaLeaf, FaLaptop, FaUsers, FaMapMarkerAlt, 
  FaChartBar, FaStethoscope, FaGraduationCap, FaUniversity 
} from 'react-icons/fa';
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

const getSubjectIcon = (iconName) => {
  switch (iconName) {
    case 'pencil': return <FaPencilAlt />;
    case 'leaf': return <FaLeaf />;
    case 'computer': return <FaLaptop />;
    case 'group': return <FaUsers />;
    case 'urn': return <FaMapMarkerAlt />;
    case 'chart': return <FaChartBar />;
    case 'stethoscope': return <FaStethoscope />;
    case 'graduation': return <FaGraduationCap />;
    case 'bank': return <FaUniversity />;
    default: return <HiFolder />;
  }
};

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

  useEffect(() => {
    // Record flashcard study attendance automatically when entering the page
    if (currentUser) {
      api.logAttendance('FLASHCARD')
        .then(res => {
          if (res && res.streakAwarded) {
            toast(`🔥 Điểm danh ngày mới thành công! Chuỗi ngày: ${res.streakDays}`, 'success');
          }
        })
        .catch(err => console.warn('[Attendance] Study flashcard log error:', err));
    }
  }, [currentUser]);

  // Trigger MathJax rendering when active card, flipped state, or view changes
  useEffect(() => {
    if (window.MathJax) {
      const timer = setTimeout(() => {
        window.MathJax.typesetPromise?.().catch(e => console.warn('MathJax error:', e));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, isFlipped, cards, currentView]);

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

  // User OpenRouter API Configuration States
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('user_openrouter_api_key') || '');
  const [userModel, setUserModel] = useState(() => localStorage.getItem('user_openrouter_model') || 'google/gemini-2.5-flash');
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSaveSettings = () => {
    localStorage.setItem('user_openrouter_api_key', userApiKey.trim());
    localStorage.setItem('user_openrouter_model', userModel);
    setShowSettings(false);
    toast('Đã lưu cấu hình API Key cá nhân thành công!', 'success');
  };

  // Game states for Match & Pop Speedrun Mode
  const [gameItems, setGameItems] = useState([]);
  const [selectedGameItem, setSelectedGameItem] = useState(null);
  const [matchedGameIds, setMatchedGameIds] = useState(new Set());
  const [gameTime, setGameTime] = useState(0);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [gameTimerInterval, setGameTimerInterval] = useState(null);
  const [wrongMatchedIds, setWrongMatchedIds] = useState(new Set());

  const handleLaunchGameForDeck = (deckCards, title, id) => {
    if (!deckCards || deckCards.length === 0) {
      toast('Bộ thẻ học rỗng, không thể chơi game!', 'warning');
      return;
    }

    // Load deck states first
    setCards(deckCards);
    setDeckTitle(title);
    setActiveDeckId(id);
    setCurrentIdx(0);
    setIsFlipped(false);
    setIsFinished(false);

    // Select up to 6 random cards from the deck for a quick match challenge
    const shuffledCards = [...deckCards].sort(() => 0.5 - Math.random());
    const selectedCards = shuffledCards.slice(0, 6); // Play with 6 pairs (12 cards total)

    // Build the 12 matching items (6 front, 6 back)
    const items = [];
    selectedCards.forEach((card, index) => {
      // Front item
      items.push({
        id: `front-${index}`,
        pairIndex: index,
        type: 'front',
        text: card.front,
      });
      // Back item
      items.push({
        id: `back-${index}`,
        pairIndex: index,
        type: 'back',
        text: card.back,
      });
    });

    // Shuffle the items for the game board grid
    const shuffledItems = items.sort(() => 0.5 - Math.random());

    setGameItems(shuffledItems);
    setSelectedGameItem(null);
    setMatchedGameIds(new Set());
    setWrongMatchedIds(new Set());
    setGameTime(0);
    setIsGameCompleted(false);
    setCurrentView('game');

    // Start stopwatch
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    const interval = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 100);
    setGameTimerInterval(interval);
  };

  const handleStartGameMode = () => {
    if (!cards || cards.length === 0) {
      toast('Bộ thẻ học rỗng, không thể bắt đầu chơi game!', 'warning');
      return;
    }

    // Select up to 6 random cards from the deck for a quick match challenge
    const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
    const selectedCards = shuffledCards.slice(0, 6); // Play with 6 pairs (12 cards total)

    // Build the 12 matching items (6 front, 6 back)
    const items = [];
    selectedCards.forEach((card, index) => {
      // Front item
      items.push({
        id: `front-${index}`,
        pairIndex: index,
        type: 'front',
        text: card.front,
      });
      // Back item
      items.push({
        id: `back-${index}`,
        pairIndex: index,
        type: 'back',
        text: card.back,
      });
    });

    // Shuffle the items for the game board grid
    const shuffledItems = items.sort(() => 0.5 - Math.random());

    setGameItems(shuffledItems);
    setSelectedGameItem(null);
    setMatchedGameIds(new Set());
    setWrongMatchedIds(new Set());
    setGameTime(0);
    setIsGameCompleted(false);
    setCurrentView('game');

    // Start stopwatch
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    const interval = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 100); // 100ms precision (ticks 10 times per second!)
    setGameTimerInterval(interval);
  };

  const handleSelectGameItem = (item) => {
    // Ignore already matched items or wrong selection freeze
    if (matchedGameIds.has(item.id) || wrongMatchedIds.has(item.id)) return;

    if (!selectedGameItem) {
      // First item selected
      setSelectedGameItem(item);
    } else {
      // Second item selected
      if (selectedGameItem.id === item.id) {
        // Clicked same item twice, deselect it
        setSelectedGameItem(null);
        return;
      }

      if (selectedGameItem.pairIndex === item.pairIndex && selectedGameItem.type !== item.type) {
        // Match!
        const nextMatched = new Set(matchedGameIds);
        nextMatched.add(selectedGameItem.id);
        nextMatched.add(item.id);
        setMatchedGameIds(nextMatched);
        setSelectedGameItem(null);

        // Check completion
        if (nextMatched.size === gameItems.length) {
          if (gameTimerInterval) clearInterval(gameTimerInterval);
          setIsGameCompleted(true);
          toast(`Chúc mừng! Bạn đã hoàn thành game trong ${(gameTime / 10).toFixed(1)} giây!`, 'success');
        }
      } else {
        // Mismatch!
        setWrongMatchedIds(new Set([selectedGameItem.id, item.id]));
        setSelectedGameItem(null);
        
        // Remove wrong styling after 600ms
        setTimeout(() => {
          setWrongMatchedIds(new Set());
        }, 600);
      }
    }
  };

  const handleStopGame = () => {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    setCurrentView('study');
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (gameTimerInterval) clearInterval(gameTimerInterval);
    };
  }, [gameTimerInterval]);

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
    
    // Check if user says 'tạo đi', 'ok tạo đi', etc.
    const isConfirmGen = /^(ok\s+)?tạo\s+(đi|luôn|thôi)/i.test(cleanText) || 
                          cleanText.includes("bắt đầu tạo") || 
                          cleanText === 'tạo' ||
                          cleanText === 'tạo đi';

    // General creation keywords check
    const hasCreationVerb = /(?:tạo|làm|sinh|thiết kế|generate|create|make|build|soạn|viết)/i.test(cleanText);
    const hasTargetNoun = /(?:thẻ|flashcard|card|bộ|từ vựng|công thức|lý thuyết|câu hỏi|từ)/i.test(cleanText);
    
    const isGen = isConfirmGen || (hasCreationVerb && hasTargetNoun);

    if (isGen) {
      // Add standard loading message from bot
      setChatMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Đang khởi tạo và thiết kế bộ thẻ học theo yêu cầu của em. Quá trình này có thể mất vài giây...' 
      }]);

      // Construct a richer prompt if this is a follow-up or confirmation request
      let promptText = message;
      const isFollowUp = cleanText.startsWith('nhưng mà') || 
                         cleanText.includes('mặt trước') || 
                         cleanText.includes('mặt sau') || 
                         cleanText.includes('đổi thành') ||
                         isConfirmGen;
      if (isFollowUp) {
        const lastDetailedMsg = [...chatMessages].reverse().find(msg => 
          msg.sender === 'user' && 
          msg.text.length > 15 && 
          !msg.text.toLowerCase().includes('tạo đi')
        );
        if (lastDetailedMsg) {
          promptText = `Yêu cầu trước đó: "${lastDetailedMsg.text}". Yêu cầu điều chỉnh mới: "${message}". Hãy tạo bộ thẻ ghi nhớ hoàn chỉnh kết hợp cả hai yêu cầu trên.`;
        }
      }

      try {
        const result = await api.generateFlashcards(promptText);
        
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
        const nameMatch = promptText.match(/(?:đặt\s+)?tên\s+là\s+["']?([^"'\n]+?)["']?(?:\s+cho\s+tôi|\s+nữa|\s*$)/i);
        if (nameMatch && nameMatch[1]) {
          extractedTitle = nameMatch[1].trim();
        } else {
          const match = promptText.match(/(?:tạo|làm|sinh|thiết kế|generate|create)\s+(?:cho\s+tôi\s+)?(?:một\s+)?(?:bộ\s+)?(?:thẻ|flashcard|card|bộ từ vựng|thẻ học)(?:\s+mới)?(?:\s+(?:về|chủ đề|cho|có\s+tên|tên\s+là))?\s*(.+)/i);
          if (match && match[1]) {
            extractedTitle = match[1].trim();
            extractedTitle = extractedTitle.replace(/(?:cho\s+tôi|nhất|ngay\s+lập\s+tức|ngay)$/i, '').trim();
          }
        }
        if (extractedTitle) {
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

  const handleExplainCardWithAI = (card) => {
    if (!card) return;
    toast('Đang gửi khái niệm sang AI để giải thích chuyên sâu...', 'success');
    
    // Automatically switch to chat mode prompt
    const promptText = `Giải thích cặn kẽ cho mình khái niệm hoặc công thức này: "${card.front}" nghĩa là "${card.back}". Hãy cho mình ví dụ thực tiễn dễ học thuộc lòng nhé.`;
    handleSendChatMessage(null, promptText);
  };

  const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);

  const handleGenerateMnemonic = async (card) => {
    if (!card) return;
    try {
      setIsGeneratingMnemonic(true);
      toast('Đang khởi tạo mẹo ghi nhớ bằng AI...', 'info');
      const response = await api.generateFlashcardMnemonic(card.front, card.back);
      if (response && response.success) {
        const nextCards = cards.map(c => {
          if (c.front === card.front && c.back === card.back) {
            return { ...c, mnemonic: response.mnemonic };
          }
          return c;
        });
        setCards(nextCards);
        saveActiveDeckChanges(nextCards);
        toast('Đã tạo mẹo ghi nhớ thành công!', 'success');
      } else {
        throw new Error(response?.error || 'Lỗi không xác định.');
      }
    } catch (err) {
      console.error(err);
      toast('Tạo mẹo ghi nhớ thất bại. Hãy thử lại!', 'error');
    } finally {
      setIsGeneratingMnemonic(false);
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
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [selectedFile]);

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
    setLoadingStep('Đang nạp file...');
    try {
      if (file.type.startsWith('image/')) {
        setInputText(`[Hình ảnh: ${file.name} - Đã sẵn sàng để trích xuất bằng AI]`);
        toast('Đã nạp hình ảnh thành công! Nhấn nút màu vàng bên dưới để AI trích xuất thẻ học nhé.', 'success');
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
        setInputText(`[Tài liệu: ${file.name} - Đã sẵn sàng để trích xuất bằng AI]`);
        toast(`Đã nhận diện file ${file.name}. Nhấn nút màu vàng bên dưới để AI trích xuất thẻ học nhé.`, 'success');
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

  const parseTextToCards = (text) => {
    const cards = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    let hasSeparator = false;
    for (let line of lines) {
      for (const sep of [':', '=', '-', '—', '–', '|', '\t', '  ']) {
        if (line.includes(sep)) {
          hasSeparator = true;
          break;
        }
      }
    }

    if (hasSeparator) {
      for (let line of lines) {
        let separator = null;
        for (const sep of [':', '=', '-', '—', '–', '|', '\t', '  ']) {
          if (line.includes(sep)) {
            separator = sep;
            break;
          }
        }
        
        if (separator) {
          const parts = line.split(separator);
          const front = parts[0].trim().replace(/\*\*/g, '').replace(/__/g, '');
          const back = parts.slice(1).join(separator).trim().replace(/\*\*/g, '').replace(/__/g, '');
          if (front && back) {
            cards.push({ front, back });
          }
        }
      }
    } else {
      // Pair up even and odd lines
      for (let i = 0; i < lines.length - 1; i += 2) {
        const front = lines[i].replace(/\*\*/g, '').replace(/__/g, '');
        const back = lines[i+1].replace(/\*\*/g, '').replace(/__/g, '');
        if (front && back) {
          cards.push({ front, back });
        }
      }
    }
    return cards;
  };

  const handleGenerateOCRNoAI = async () => {
    // 1. If a file is selected (both image and document), ALWAYS call backend API for AI-driven structure extraction
    if (selectedFile) {
      setIsLoading(true);
      setLoadingStep('Đang tải tài liệu lên và trích xuất cấu trúc bằng AI...');
      try {
        const response = await api.generateFlashcardsOCR(selectedFile);
        if (response && response.success && response.data && response.data.length > 0) {
          const formatted = response.data.map((c, index) => ({
            front: c.front,
            back: c.back,
            image: null,
            partOfSpeech: index % 2 === 0 ? "Khái niệm" : "Định nghĩa",
            hashtag: "# Học tập"
          }));

          const extractedTitle = selectedFile.name.split('.')[0] || 'Flashcard OCR';
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

          toast(`Đã tạo thành công bộ thẻ "${extractedTitle}" với ${formatted.length} thẻ bằng AI!`, 'success');
        } else {
          toast(response?.error || 'Không trích xuất được cấu trúc thẻ học từ tệp này.', 'warning');
        }
      } catch (err) {
        console.error(err);
        toast('Lỗi khi tải lên và phân tích tài liệu bằng AI!', 'error');
      } finally {
        setIsLoading(false);
        setLoadingStep('');
      }
      return;
    }

    // 2. If NO file is selected, but there is text in the textarea, parse it locally
    const content = inputText.trim();
    if (content) {
      const parsed = parseTextToCards(content);
      if (parsed.length > 0) {
        const formatted = parsed.map((c, index) => ({
          front: c.front,
          back: c.back,
          image: null,
          partOfSpeech: index % 2 === 0 ? "Khái niệm" : "Định nghĩa",
          hashtag: "# Học tập"
        }));

        const extractedTitle = 'Bộ thẻ tự tạo - ' + new Date().toLocaleDateString('vi-VN');
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

        toast(`Phân tách bộ thẻ thành công từ dữ liệu chữ!`, 'success');
      } else {
        toast('Không thể phân tách dữ liệu chữ. Hãy sử dụng dấu hai chấm (:) hoặc dấu bằng (=) giữa mặt trước và mặt sau nhé.', 'warning');
      }
      return;
    }

    toast('Vui lòng chọn tài liệu hoặc nhập văn bản trước.', 'warning');
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
          gridTemplateColumns: `250px 1fr 6px ${sidebarWidth}px`,
          gap: '12px'
        }}
      >
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="flashcard-left-sidebar" style={{ width: '250px', boxSizing: 'border-box' }}>
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

            <button 
              className={`flashcard-menu-item ${currentView === 'game_hub' ? 'flashcard-menu-item--active' : ''}`}
              onClick={() => {
                setCurrentView('game_hub');
                setIsFinished(false);
              }}
            >
              <span className="flashcard-menu-item-left">
                <span className="flashcard-menu-item-icon">🎮</span>
                <span>Trò chơi</span>
              </span>
            </button>
          </div>



          {/* Spaced Repetition & Streak Unified Progress Dashboard Card */}
          <div 
            className="animate-in"
            style={{ 
              background: 'rgba(30, 30, 24, 0.5)',
              border: '1.5px solid var(--fc-border-dark)',
              borderRadius: '18px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              marginTop: '12px',
              boxSizing: 'border-box',
              width: '100%'
            }}
          >
            <h5 style={{ margin: 0, fontSize: '11px', fontWeight: '850', color: 'var(--fc-text-secondary)', letterSpacing: '0.8px', textTransform: 'uppercase', textAlign: 'left' }}>
              📊 TIẾN TRÌNH CỦA BẠN
            </h5>

            {cards.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700' }}>
                  <span style={{ color: 'var(--fc-text-secondary)' }}>Trí nhớ Spaced</span>
                  <span style={{ color: 'var(--fc-gold)', fontWeight: '850' }}>
                    {Math.max(15, Math.min(100, Math.round((learnedCards.size / cards.length) * 100 || 0)))}%
                  </span>
                </div>
                <div className="srs-progress-bar-bg" style={{ margin: '2px 0' }}>
                  <div 
                    className="srs-progress-bar-fill" 
                    style={{ width: `${Math.max(15, Math.min(100, Math.round((learnedCards.size / cards.length) * 100 || 0)))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Streak row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '20px' }}>🔥</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>{streakDays} ngày</span>
                <span style={{ fontSize: '9.5px', color: 'var(--fc-text-secondary)' }}>Chuỗi học liên tục</span>
              </div>
            </div>

            {/* Session schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px', fontSize: '10.5px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--fc-text-secondary)' }}>Chu kỳ ôn tập:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>3 ngày / lượt</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--fc-text-secondary)' }}>Lịch học kế tiếp:</span>
                <span style={{ fontWeight: '700', color: 'var(--fc-gold)' }}>Ngày mai (Trong 24h)</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= CENTER WORKSPACE ================= */}
        <main className="flashcard-center-workspace">
          {currentView === 'decks' ? (() => {
            const totalDecksCount = 1 + savedDecks.length;
            const totalWordsCount = 5 + savedDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
            return (
              /* ================= DECKS SELECTOR VIEW ================= */
              <div className="flashcard-decks-selector animate-in" style={{ padding: '8px 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', margin: 0 }}>Chọn bộ từ để bắt đầu học</h2>
                  </div>
                  <span className="new-fc-total-badge">{totalDecksCount} bộ • {totalWordsCount} từ</span>
                </div>

                {/* Decks Grid */}
                <div className="new-fc-decks-grid">
                  
                  {/* Default Deck (Green Theme) */}
                  <div 
                    className="new-fc-card new-fc-card--green animate-in"
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
                      toast('Đã tải bộ thẻ: Bộ từ của bản thân', 'success');
                    }}
                  >
                    <div className="new-fc-card-pattern" />
                    <div className="new-fc-card-cloud-watermark">
                      <svg viewBox="0 0 200 120" fill="currentColor" width="100" height="70">
                        <path d="M150,60 A30,30 0 0,0 120,35 A45,45 0 0,0 55,45 A35,35 0 0,0 60,100 L150,100 A25,25 0 0,0 150,60 Z" opacity="0.45" />
                        <path d="M135,70 A22,22 0 0,0 112,50 A32,32 0 0,0 65,58 A25,25 0 0,0 70,100 L135,100 A18,18 0 0,0 135,70 Z" opacity="0.65" />
                      </svg>
                    </div>
                    
                    <div className="new-fc-card-header">
                      <span className="new-fc-card-meta">Cá nhân • {activeDeckId === 'default' ? cards.length : DEFAULT_DECK.length} từ</span>
                      <span className="new-fc-card-icon-badge">
                        <FaPencilAlt />
                      </span>
                    </div>

                    <div className="new-fc-card-body">
                      <h3 className="new-fc-card-title">Bộ từ của bản thân</h3>
                      <p className="new-fc-card-description">
                        Tự thêm và ôn tập từ vựng của riêng bạn.
                      </p>
                      <button 
                        className="new-fc-card-btn-add"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateNewDeck();
                        }}
                      >
                        + Thêm từ của bạn
                      </button>
                    </div>
                  </div>

                  {/* Saved Decks */}
                  {savedDecks.map((deck, idx) => {
                    const themes = [
                      { theme: 'orange', icon: 'leaf', defaultDesc: 'Biến đổi khí hậu, tài nguyên và phát triển bền vững.' },
                      { theme: 'teal', icon: 'computer', defaultDesc: 'Thuật ngữ công nghệ, AI và chuyển đổi số.' },
                      { theme: 'red', icon: 'group', defaultDesc: 'Cộng đồng, bản sắc và các vấn đề xã hội.' },
                      { theme: 'gold', icon: 'urn', defaultDesc: 'Văn minh, di sản và khám phá khảo cổ học.' },
                      { theme: 'pink', icon: 'chart', defaultDesc: 'Thị trường, thương mại và tài chính.' },
                      { theme: 'blue', icon: 'stethoscope', defaultDesc: 'Y học, dịch tễ và lối sống lành mạnh.' },
                      { theme: 'purple', icon: 'graduation', defaultDesc: 'Học tập, nhận thức và hành vi con người.' },
                      { theme: 'seagreen', icon: 'bank', defaultDesc: 'Quy hoạch, xây dựng và không gian sống.' }
                    ];
                    const themeCfg = themes[idx % themes.length];
                    
                    return (
                      <div 
                        key={deck.id} 
                        className={`new-fc-card new-fc-card--${themeCfg.theme} animate-in`}
                        onClick={() => handleLoadDeck(deck)}
                      >
                        <div className="new-fc-card-pattern" />
                        <div className="new-fc-card-cloud-watermark">
                          <svg viewBox="0 0 200 120" fill="currentColor" width="100" height="70">
                            <path d="M150,60 A30,30 0 0,0 120,35 A45,45 0 0,0 55,45 A35,35 0 0,0 60,100 L150,100 A25,25 0 0,0 150,60 Z" opacity="0.45" />
                            <path d="M135,70 A22,22 0 0,0 112,50 A32,32 0 0,0 65,58 A25,25 0 0,0 70,100 L135,100 A18,18 0 0,0 135,70 Z" opacity="0.65" />
                          </svg>
                        </div>

                        <div className="new-fc-card-header">
                          <span className="new-fc-card-meta">
                            {(() => {
                              const raw = deck.cards?.[0]?.hashtag;
                              if (raw) return raw.replace('#', '').trim();
                              return 'IELTS';
                            })()} • {deck.cards?.length || 0} từ
                          </span>
                          <span className="new-fc-card-icon-badge">
                            {getSubjectIcon(themeCfg.icon)}
                          </span>
                        </div>

                        <div className="new-fc-card-body">
                          <h3 className="new-fc-card-title">{deck.title}</h3>
                          <p className="new-fc-card-description">
                            {themeCfg.defaultDesc}
                          </p>
                        </div>

                        <div className="new-fc-card-footer">
                          <span className="new-fc-card-progress">
                            <HiBadgeCheck className="new-fc-card-progress-icon" /> 0% thuộc
                          </span>
                          <button 
                            className="new-fc-card-btn-delete-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeck(e, deck.id);
                            }}
                            title="Xóa bộ thẻ"
                          >
                            <HiTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {savedDecks.length === 0 && (
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--fc-border-dark)', borderRadius: '20px', padding: '40px', marginTop: '24px' }}>
                    <p style={{ color: 'var(--fc-text-secondary)', fontSize: '13px', margin: 0 }}>
                      Bạn chưa tạo thêm bộ thẻ nào khác. Hãy dán tài liệu vào khung nhập bên trái hoặc sử dụng EduBot chat để tạo thẻ học tự động!
                    </p>
                  </div>
                )}
              </div>
            );
          })() : currentView === 'game_hub' ? (
            /* ================= GAME SELECTION HUB VIEW ================= */
            <div className="flashcard-decks-selector animate-in" style={{ padding: '8px 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#d946ef', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🎮 KHU VUI CHƠI ÔN TẬP</span>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', margin: '4px 0 0 0' }}>Chọn một bộ từ để đua tốc độ</h2>
                </div>
              </div>

              {/* Game Hub Decks Grid */}
              <div className="new-fc-decks-grid">
                {/* Default Deck (Green Theme) */}
                <div 
                  className="new-fc-card new-fc-card--green animate-in"
                  onClick={() => handleLaunchGameForDeck(DEFAULT_DECK, 'Chủ đề Lịch sử & Khảo cổ học', 'default')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="new-fc-card-pattern" />
                  <div className="new-fc-card-cloud-watermark">
                    <svg viewBox="0 0 200 120" fill="currentColor" width="100" height="70">
                      <path d="M150,60 A30,30 0 0,0 120,35 A45,45 0 0,0 55,45 A35,35 0 0,0 60,100 L150,100 A25,25 0 0,0 150,60 Z" opacity="0.45" />
                      <path d="M135,70 A22,22 0 0,0 112,50 A32,32 0 0,0 65,58 A25,25 0 0,0 70,100 L135,100 A18,18 0 0,0 135,70 Z" opacity="0.65" />
                    </svg>
                  </div>
                  <div className="new-fc-card-header">
                    <span className="new-fc-card-meta">Lịch sử • {DEFAULT_DECK.length} từ</span>
                    <span className="new-fc-card-icon-badge">🎯</span>
                  </div>
                  <div className="new-fc-card-body">
                    <h3 className="new-fc-card-title">Chủ đề Lịch sử & Khảo cổ học</h3>
                    <p className="new-fc-card-description">
                      Học từ vựng và các thuật ngữ lịch sử khảo cổ học nổi bật thế giới.
                    </p>
                  </div>
                  <div className="new-fc-card-footer" style={{ marginTop: '16px' }}>
                    <button 
                      className="new-fc-card-btn-add" 
                      style={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', color: '#fff', border: 'none', width: '100%', padding: '10px', borderRadius: '12px', fontWeight: 'bold' }}
                    >
                      Bắt đầu chơi 🎮
                    </button>
                  </div>
                </div>

                {/* Saved Decks */}
                {savedDecks.map((deck, idx) => {
                  const themes = [
                    { theme: 'orange', icon: 'leaf', defaultDesc: 'Biến đổi khí hậu, tài nguyên và phát triển bền vững.' },
                    { theme: 'teal', icon: 'computer', defaultDesc: 'Thuật ngữ công nghệ, AI và chuyển đổi số.' },
                    { theme: 'red', icon: 'group', defaultDesc: 'Cộng đồng, bản sắc và các vấn đề xã hội.' },
                    { theme: 'gold', icon: 'urn', defaultDesc: 'Văn minh, di sản và khám phá khảo cổ học.' },
                    { theme: 'pink', icon: 'chart', defaultDesc: 'Thị trường, thương mại và tài chính.' },
                    { theme: 'blue', icon: 'stethoscope', defaultDesc: 'Y học, dịch tễ và lối sống lành mạnh.' },
                    { theme: 'purple', icon: 'graduation', defaultDesc: 'Học tập, nhận thức và hành vi con người.' },
                    { theme: 'seagreen', icon: 'bank', defaultDesc: 'Quy hoạch, xây dựng và không gian sống.' }
                  ];
                  const themeCfg = themes[idx % themes.length];
                  
                  return (
                    <div 
                      key={deck.id} 
                      className={`new-fc-card new-fc-card--${themeCfg.theme} animate-in`}
                      onClick={() => handleLaunchGameForDeck(deck.cards, deck.title, deck.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="new-fc-card-pattern" />
                      <div className="new-fc-card-cloud-watermark">
                        <svg viewBox="0 0 200 120" fill="currentColor" width="100" height="70">
                          <path d="M150,60 A30,30 0 0,0 120,35 A45,45 0 0,0 55,45 A35,35 0 0,0 60,100 L150,100 A25,25 0 0,0 150,60 Z" opacity="0.45" />
                          <path d="M135,70 A22,22 0 0,0 112,50 A32,32 0 0,0 65,58 A25,25 0 0,0 70,100 L135,100 A18,18 0 0,0 135,70 Z" opacity="0.65" />
                        </svg>
                      </div>
                      <div className="new-fc-card-header">
                        <span className="new-fc-card-meta">
                          {(() => {
                            const raw = deck.cards?.[0]?.hashtag;
                            if (raw) return raw.replace('#', '').trim();
                            return 'IELTS';
                          })()} • {deck.cards?.length || 0} từ
                        </span>
                        <span className="new-fc-card-icon-badge">
                          {getSubjectIcon(themeCfg.icon)}
                        </span>
                      </div>
                      <div className="new-fc-card-body">
                        <h3 className="new-fc-card-title">{deck.title}</h3>
                        <p className="new-fc-card-description">
                          {themeCfg.defaultDesc}
                        </p>
                      </div>
                      <div className="new-fc-card-footer" style={{ marginTop: '16px' }}>
                        <button 
                          className="new-fc-card-btn-add" 
                          style={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', color: '#fff', border: 'none', width: '100%', padding: '10px', borderRadius: '12px', fontWeight: 'bold' }}
                        >
                          Bắt đầu chơi 🎮
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {savedDecks.length === 0 && (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--fc-border-dark)', borderRadius: '20px', padding: '40px', marginTop: '24px' }}>
                  <p style={{ color: 'var(--fc-text-secondary)', fontSize: '13px', margin: 0 }}>
                    Bạn chưa tự tạo bộ thẻ học cá nhân nào để chơi game. Hãy nhập tài liệu hoặc chat với EduBot để tạo nhanh nhé!
                  </p>
                </div>
              )}
            </div>
          ) : currentView === 'game' ? (
            /* ================= MATCH & POP SPEEDRUN GAME CANVAS ================= */
            <div className="flashcard-game-workspace animate-in" style={{ 
              padding: '32px', 
              textAlign: 'center', 
              background: 'radial-gradient(circle at top left, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.06), rgba(15, 23, 42, 0.95))', 
              borderRadius: '24px', 
              border: '1.5px solid rgba(255, 255, 255, 0.08)', 
              width: '100%', 
              boxSizing: 'border-box',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Inline CSS animation styles for game mechanics */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes fcGameShake {
                  0%, 100% { transform: translateX(0); }
                  20%, 60% { transform: translateX(-6px); }
                  40%, 80% { transform: translateX(6px); }
                }
                @keyframes fcGamePop {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.08); }
                  100% { transform: scale(1); }
                }
                @keyframes fcGamePulseGlow {
                  0%, 100% { box-shadow: 0 0 12px rgba(236, 72, 153, 0.2); }
                  50% { box-shadow: 0 0 25px rgba(236, 72, 153, 0.45); }
                }
                .fc-game-cell-shake {
                  animation: fcGameShake 0.4s ease-in-out !important;
                }
                .fc-game-cell-pop {
                  animation: fcGamePop 0.3s ease-out !important;
                }
                .fc-game-cell-selected {
                  animation: fcGamePulseGlow 1.5s infinite alternate !important;
                }
              `}} />

              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ec4899', animate: 'ping 1s infinite' }} />
                    🎮 TRÒ CHƠI ÔN TẬP
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#fff', margin: '6px 0 0 0', fontFamily: "'Outfit', sans-serif" }}>Đua tốc độ: Nối cặp Khái niệm & Định nghĩa</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 20px', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--fc-text-secondary)', fontSize: '12.5px' }}>⏱️ Thời gian: </span>
                    <strong style={{ fontSize: '20px', color: '#ffd234', fontFamily: 'monospace', fontWeight: '800' }}>{(gameTime / 10).toFixed(1)}s</strong>
                  </div>
                  <button 
                    onClick={handleStopGame}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1.5px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '10px 20px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#f87171'; }}
                  >
                    Thoát Game
                  </button>
                </div>
              </div>

              {/* Game Grid */}
              {!isGameCompleted ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '18px',
                  marginTop: '20px'
                }}>
                  {gameItems.map((item) => {
                    const isSelected = selectedGameItem?.id === item.id;
                    const isMatched = matchedGameIds.has(item.id);
                    const isWrong = wrongMatchedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectGameItem(item)}
                        className={`
                          ${isWrong ? 'fc-game-cell-shake' : ''} 
                          ${isMatched ? 'fc-game-cell-pop' : ''} 
                          ${isSelected ? 'fc-game-cell-selected' : ''}
                        `}
                        style={{
                          background: isMatched 
                            ? 'rgba(16, 185, 129, 0.08)' 
                            : isWrong 
                            ? 'rgba(239, 68, 68, 0.12)' 
                            : isSelected 
                            ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.2))' 
                            : 'rgba(255, 255, 255, 0.02)',
                          border: isMatched
                            ? '2px solid rgba(16, 185, 129, 0.8)'
                            : isWrong
                            ? '2px solid rgba(239, 68, 68, 0.8)'
                            : isSelected
                            ? '2px solid rgba(236, 72, 153, 0.9)'
                            : '1.5px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '18px',
                          padding: '24px 16px',
                          minHeight: '110px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isMatched ? 'default' : 'pointer',
                          opacity: isMatched ? 0.35 : 1,
                          transform: isSelected ? 'scale(1.03) translateY(-2px)' : 'none',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                          boxShadow: isMatched 
                            ? '0 0 15px rgba(16, 185, 129, 0.15)' 
                            : isWrong 
                            ? '0 0 15px rgba(239, 68, 68, 0.2)' 
                            : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          backdropFilter: 'blur(8px)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isMatched && !isSelected && !isWrong) {
                            e.currentTarget.style.border = '1.5px solid rgba(139, 92, 246, 0.4)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMatched && !isSelected && !isWrong) {
                            e.currentTarget.style.border = '1.5px solid rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          }
                        }}
                      >
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: isMatched ? '#a7f3d0' : isSelected ? '#fbcfe8' : '#e2e8f0',
                          lineHeight: '1.45',
                          wordBreak: 'break-word'
                        }}>
                          {item.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Completion Screen */
                <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontSize: '72px', animation: 'fcGamePop 1s infinite alternate' }}>🏆</div>
                  <h3 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Hoàn thành xuất sắc!</h3>
                  <p style={{ color: 'var(--fc-text-secondary)', fontSize: '15.5px', margin: 0 }}>
                    Bạn đã tìm được tất cả các cặp tương ứng trong thời gian kỷ lục:
                  </p>
                  <div style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(217, 70, 239, 0.15))', padding: '16px 36px', borderRadius: '20px', border: '1.5px solid #d946ef', boxShadow: '0 0 30px rgba(217, 70, 239, 0.25)' }}>
                    <strong style={{ fontSize: '36px', color: '#ffd234', fontFamily: 'monospace', fontWeight: '800' }}>{(gameTime / 10).toFixed(1)} giây</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
                    <button
                      onClick={handleStartGameMode}
                      style={{
                        background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 28px',
                        borderRadius: '14px',
                        fontWeight: '800',
                        fontSize: '14.5px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: '0 8px 20px rgba(217, 70, 239, 0.3)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      Chơi Vòng Mới 🎮
                    </button>
                    <button
                      onClick={handleStopGame}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '12px 28px',
                        borderRadius: '14px',
                        fontWeight: '800',
                        fontSize: '14.5px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    >
                      Quay Lại Ôn Tập 📖
                    </button>
                  </div>
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
                  <button 
                    className="flashcard-header-btn" 
                    onClick={handleStartGameMode} 
                    style={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', color: '#fff', border: 'none' }}
                    title="Chơi game nối cặp tốc độ với bộ thẻ này"
                  >
                    🎮 Chơi Game
                  </button>
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

                        {/* AI Mnemonic memory tip */}
                        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', padding: '0 20px' }} onClick={e => e.stopPropagation()}>
                          {activeCards[currentIdx]?.card?.mnemonic ? (
                            <div style={{
                              background: 'rgba(255, 226, 89, 0.08)',
                              border: '1.5px dashed var(--fc-gold)',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              fontSize: '12.5px',
                              color: '#fff',
                              maxWidth: '480px',
                              textAlign: 'center',
                              lineHeight: '1.5',
                              boxShadow: '0 0 15px rgba(255, 226, 89, 0.08)'
                            }}>
                              💡 <strong>Mẹo nhớ từ AI:</strong> &quot;{activeCards[currentIdx]?.card?.mnemonic}&quot;
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateMnemonic(activeCards[currentIdx]?.card)}
                              disabled={isGeneratingMnemonic}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--fc-border-dark)',
                                color: 'var(--fc-text-secondary)',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--fc-gold)'; e.currentTarget.style.color = 'var(--fc-gold)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--fc-border-dark)'; e.currentTarget.style.color = 'var(--fc-text-secondary)'; }}
                            >
                              {isGeneratingMnemonic ? '🤖 Đang tạo mẹo nhớ...' : '💡 Gợi ý mẹo nhớ AI'}
                            </button>
                          )}
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
          <div className="flashcard-chat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h5 className="flashcard-chat-header-title" style={{ margin: 0 }}>EDUBOT ĐỒNG HÀNH</h5>
              <span className="flashcard-chat-header-status" style={{ fontSize: '10px', background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Hoạt động</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Question Help Button */}
              <button 
                type="button" 
                onClick={() => {
                  setShowGuide(!showGuide);
                  setShowSettings(false);
                }} 
                title="Hướng dẫn lấy API Key miễn phí"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: showGuide ? '#f59e0b' : '#94a3b8', 
                  cursor: 'pointer', 
                  fontSize: '18px', 
                  transition: 'color 0.2s', 
                  display: 'flex', 
                  alignItems: 'center',
                  animation: 'attention-rotate 3s infinite ease-in-out'
                }}
              >
                <HiOutlineQuestionMarkCircle />
              </button>

              {/* Settings Gear Button */}
              <button 
                type="button" 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowGuide(false);
                }} 
                title="Cấu hình API Key cá nhân"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: showSettings ? '#6366f1' : '#94a3b8', 
                  cursor: 'pointer', 
                  fontSize: '18px', 
                  transition: 'color 0.2s', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = showSettings ? '#6366f1' : '#94a3b8'}
              >
                <HiOutlineCog />
              </button>

              {/* Mascot decoration */}
              <svg 
                style={{ animation: 'float-moon 4s ease-in-out infinite' }} 
                width="20" 
                height="20" 
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
          </div>

          {/* Free AI configuration guide panel */}
          {showGuide && (
            <div style={{
              background: '#fef3c7',
              borderBottom: '1px solid #fde68a',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                💡 Hướng dẫn cấu hình AI Miễn phí 100%
              </h4>
              <p style={{ fontSize: '11px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
                Học sinh có thể cấu hình API Key cá nhân để trò chuyện với Trợ lý AI và tự động tạo flashcard hoàn toàn miễn phí mà không lo giới hạn:
              </p>
              <ol style={{ fontSize: '11.5px', color: '#78350f', margin: '0 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: '600' }}>
                <li>Đăng ký tài khoản miễn phí tại OpenRouter.</li>
                <li>Tạo khóa API Key (miễn phí, không yêu cầu thẻ).</li>
                <li>Bấm bánh răng ⚙️ bên cạnh, dán Key và chọn model Gemini 2.5 Flash (Miễn phí).</li>
              </ol>
              <a 
                href="https://openrouter.ai/settings/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  background: '#d97706',
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  textAlign: 'center',
                  marginTop: '4px',
                  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                }}
              >
                Tạo API Key miễn phí ngay 🔑
              </a>
            </div>
          )}

          {/* Personal API settings panel */}
          {showSettings && (
            <div style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚙️ Cấu hình API Key cá nhân (Pay-as-you-go)
              </h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                Nhập API Key OpenRouter cá nhân của em để gọi mô hình AI cao cấp tạo flashcard siêu tốc và trò chuyện không giới hạn.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>OpenRouter API Key:</label>
                <input 
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={userApiKey}
                  onChange={e => setUserApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Mô hình AI thông minh:</label>
                <select
                  value={userModel}
                  onChange={e => setUserModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    background: '#fff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="google/gemini-2.5-flash">⚡ Google Gemini 2.5 Flash (Khuyên dùng - Rất nhanh)</option>
                  <option value="google/gemini-2.5-pro">🚀 Google Gemini 2.5 Pro (Cao cấp - Rất thông minh)</option>
                  <option value="meta-llama/llama-3.2-11b-vision-instruct:free">🖼️ Llama 3.2 Vision (Miễn phí hoàn toàn)</option>
                  <option value="google/gemini-2.5-flash:free">⚡ Google Gemini 2.5 Flash (Miễn phí - Chỉ chat chữ)</option>
                  <option value="qwen/qwen-2.5-72b-instruct:free">🤖 Qwen 2.5 72B (Miễn phí - Logic xuất sắc)</option>
                  <option value="deepseek/deepseek-chat">🧠 DeepSeek Chat V3 (Trả phí - Cực thông minh)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={handleSaveSettings}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Lưu cấu hình
                </button>
                <button
                  onClick={() => {
                    setUserApiKey('');
                    localStorage.removeItem('user_openrouter_api_key');
                    alert('Đã xóa API Key cá nhân, hệ thống sẽ sử dụng key dùng chung của lớp học.');
                  }}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Xóa Key
                </button>
              </div>
            </div>
          )}

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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-width {
          from { width: 30%; }
          to { width: 95%; }
        }
      `}</style>
    </div>
  );
}
