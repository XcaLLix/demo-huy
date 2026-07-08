import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  HiSparkles, HiPlus, HiMinus, HiTrash, HiSave, HiDownload, 
  HiDocumentText, HiRefresh, HiUpload, HiX, HiSearch, HiFolder,
  HiChat, HiChevronRight, HiChevronLeft, HiPlay
} from 'react-icons/hi';
import Tesseract from 'tesseract.js';
import { api, API_BASE } from '../api';
import { toast } from '../utils/toast';
import sunLogoImg from '../assets/sun_logo.png';

// Default welcome mindmap to show on first load
const WELCOME_MINDMAP = {
  name: "Sơ đồ Tư duy AI",
  description: "Trình trực quan hóa kiến thức thông minh bằng AI. Tải tài liệu lên hoặc dán nội dung để bắt đầu lập sơ đồ tư duy ngay lập tức.",
  children: [
    {
      name: "1. Nhập Dữ Liệu",
      description: "Bạn có thể đưa kiến thức vào hệ thống bằng nhiều cách linh hoạt.",
      children: [
        {
          name: "Tải file văn bản",
          description: "Hỗ trợ các định dạng file TXT, MD chứa thông tin bài học."
        },
        {
          name: "Ảnh chụp (OCR)",
          description: "Chụp/Tải ảnh sách giáo khoa, ghi chép. AI sẽ dùng Tesseract để nhận diện chữ tiếng Việt cực chuẩn."
        },
        {
          name: "Dán văn bản",
          description: "Copy trực tiếp tài liệu từ trình duyệt hoặc ghi chú vào ô nhập liệu."
        }
      ]
    },
    {
      name: "2. Tính Năng Canvas",
      description: "Khám phá giao diện tương tác sơ đồ dạng hình cây cực kỳ mượt mà.",
      children: [
        {
          name: "Kéo thả & Thu phóng",
          description: "Dùng chuột kéo để di chuyển (pan), lăn chuột hoặc nhấn nút để phóng to, thu nhỏ."
        },
        {
          name: "Đóng / Mở nhánh",
          description: "Nhấp vào nút (+) hoặc (-) ở mép mỗi nút để ẩn hoặc hiện các nhánh con."
        },
        {
          name: "Xuất dữ liệu",
          description: "Tải sơ đồ về máy dưới dạng ảnh SVG chất lượng cao hoặc file dữ liệu JSON."
        }
      ]
    },
    {
      name: "3. Hỏi Đáp Với Nút",
      description: "Tương tác trực tiếp với từng phần kiến thức trên sơ đồ.",
      children: [
        {
          name: "Bảng Chi Tiết",
          description: "Nhấp vào bất kỳ nút nào để mở ngăn bên phải, hiển thị định nghĩa và diễn giải chi tiết."
        },
        {
          name: "Hỏi AI Theo Ngữ Cảnh",
          description: "Gửi câu hỏi trực tiếp cho AI về khái niệm của nút đó. AI sẽ trả lời bám sát vị trí kiến thức đó."
        }
      ]
    }
  ]
};

export default function AITutorPage({ currentUser, navigateTo, addLog, hideHeader }) {
  // Tabs & Views states
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'
  const [mindmapData, setMindmapData] = useState(null);
  
  // Interactive Mindmap View Mode & Search States
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'outline'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Input states
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Interactive Mindmap Canvas States
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [pan, setPan] = useState({ x: 50, y: 150 });
  const [zoom, setZoom] = useState(0.9);
  
  // Dragging Canvas State
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Node details chat states
  const [nodeChatMessages, setNodeChatMessages] = useState({}); // { [nodeId]: [{ sender, text, time }] }
  const [nodeChatInput, setNodeChatInput] = useState('');
  const [isNodeChatTyping, setIsNodeChatTyping] = useState(false);
  
  // Node CRUD States
  const [editNodeName, setEditNodeName] = useState('');
  const [editNodeDesc, setEditNodeDesc] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newChildDesc, setNewChildDesc] = useState('');
  // Sidebar resizing and node shapes states
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [editNodeShape, setEditNodeShape] = useState('oval');
  const isDraggingSidebarRef = useRef(false);
  const isDirtyRef = useRef(false);
  const [autosaveStatus, setAutosaveStatus] = useState('');
  const [blankMindmapTitle, setBlankMindmapTitle] = useState('Sơ đồ tư duy mới');
  const examFileInputRef = useRef(null);
  const [isDraggingExamFile, setIsDraggingExamFile] = useState(false);

  const handleExamDragOver = (e) => {
    e.preventDefault();
    setIsDraggingExamFile(true);
  };

  const handleExamDragLeave = () => {
    setIsDraggingExamFile(false);
  };

  const handleExamDrop = (e) => {
    e.preventDefault();
    setIsDraggingExamFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleExamUpload(file);
    }
  };

  // Node Mastery Progress
  const [nodeProgressMap, setNodeProgressMap] = useState({});

  // Node Quiz States
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(0);

  // Weakness Analysis State
  const [isGeneratingWeakness, setIsGeneratingWeakness] = useState(false);

  // Exam Paper Analysis States
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examUploadLoading, setExamUploadLoading] = useState(false);
  const [examAnalysisLoading, setExamAnalysisLoading] = useState(false);
  const [examText, setExamText] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examFileUrl, setExamFileUrl] = useState('');
  const [examFileType, setExamFileType] = useState('');
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    isDraggingSidebarRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSidebarRef.current) return;
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingSidebarRef.current) {
        isDraggingSidebarRef.current = false;
        document.body.style.cursor = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Saved Mindmaps History List
  const [savedMindmaps, setSavedMindmaps] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeMindmapDbId, setActiveMindmapDbId] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const svgRef = useRef(null);
  const chatEndRef = useRef(null);
  const drawerBodyRef = useRef(null);

  const loadSharedMindmap = async (id) => {
    setIsLoading(true);
    setLoadingStep('Đang tải sơ đồ tư duy được chia sẻ...');
    try {
      const data = await api.getPublicMindmapById(id);
      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      const structured = assignIds(parsed);
      setMindmapData(structured);
      setActiveMindmapDbId(data.id);
      setSelectedNode(null);

      // Auto expand root + level 1
      const newExpanded = new Set();
      newExpanded.add(structured.id);
      structured.children?.forEach(ch => {
        newExpanded.add(ch.id);
      });
      setExpandedNodes(newExpanded);

      // Reset coordinates
      setZoom(0.9);
      setPan({ x: 50, y: 150 });
      
      toast(`Đã tải sơ đồ tư duy được chia sẻ: ${data.title}`, 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể tải sơ đồ tư duy được chia sẻ hoặc link đã hết hạn.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      loadSharedMindmap(shareId);
    } else {
      // Load default mindmap
      setMindmapData(null);
      setExpandedNodes(new Set());
      if (currentUser) {
        api.logAttendance('MINDMAP')
          .then(res => {
            if (res && res.streakAwarded) {
              toast(`🔥 Điểm danh ngày mới thành công! Chuỗi ngày: ${res.streakDays}`, 'success');
            }
          })
          .catch(err => console.warn('[Attendance] Study mindmap log error:', err));
      }
    }

    // Fetch saved list on mount or when auth state changes
    fetchHistory(true);
  }, [currentUser]);

  // Adjust scroll when new messages arrive in drawer
  useEffect(() => {
    if (selectedNode) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [nodeChatMessages, isNodeChatTyping]);

  // Sync selected node with edit fields
  useEffect(() => {
    if (selectedNode) {
      setEditNodeName(selectedNode.name || '');
      setEditNodeDesc(selectedNode.description || '');
      setEditNodeShape(selectedNode.shape || 'oval');
      setNewChildName('');
      setNewChildDesc('');
      if (drawerBodyRef.current) {
        drawerBodyRef.current.scrollTop = 0;
      }
    }
  }, [selectedNode]);

  // Autosave Effect
  useEffect(() => {
    if (!mindmapData || !isDirtyRef.current) return;

    setAutosaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        if (!currentUser) {
          // LocalStorage save
          const localId = activeMindmapDbId || `local-${Date.now()}`;
          const newMindmap = {
            id: localId,
            title: mindmapData.name.trim() || 'Sơ đồ tư duy không tên',
            content: mindmapData,
            createdAt: new Date().toISOString()
          };
          const stored = localStorage.getItem('edupath_saved_mindmaps');
          let list = stored ? JSON.parse(stored) : [];
          const existingIdx = list.findIndex(m => m.id === localId);
          if (existingIdx > -1) {
            list[existingIdx] = newMindmap;
          } else {
            list = [newMindmap, ...list];
          }
          localStorage.setItem('edupath_saved_mindmaps', JSON.stringify(list));
          setActiveMindmapDbId(localId);
          loadLocalHistory();
        } else {
          // DB save
          const response = await api.saveMindmap(mindmapData.name, mindmapData, activeMindmapDbId);
          const savedId = response?.id || response?.data?.id;
          if (savedId) {
            setActiveMindmapDbId(savedId);
          }
          fetchHistory();
        }
        isDirtyRef.current = false;
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus(''), 3000);
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveStatus('');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [mindmapData, currentUser, activeMindmapDbId]);

  // Panning & Zooming SVG passive event hook
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.15, Math.min(3, prev * scaleChange)));
    };

    svgEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleWheel);
    };
  }, [svgRef.current]);

  // Fetch saved history
  const fetchHistory = async (autoLoadIfEmpty = false) => {
    if (!currentUser) {
      loadLocalHistory();
      return;
    }
    setIsHistoryLoading(true);
    try {
      const data = await api.getMindmaps();
      const mindmaps = data || [];
      setSavedMindmaps(mindmaps);

      // Auto-load the most recent mindmap if requested and nothing is loaded yet
      if (autoLoadIfEmpty && mindmaps.length > 0 && !activeMindmapDbId && !mindmapData) {
        handleLoadMindmap(mindmaps[0]);
        setActiveTab('history');
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadLocalHistory = () => {
    try {
      const stored = localStorage.getItem('edupath_saved_mindmaps');
      setSavedMindmaps(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to assign sequential unique ID paths to mindmap nodes
  const assignIds = (node, path = '0') => {
    const newNode = { ...node, id: path };
    if (node.children && node.children.length > 0) {
      newNode.children = node.children.map((child, idx) => assignIds(child, `${path}-${idx}`));
    }
    return newNode;
  };

  // Find node by path ID
  const findNodeById = (node, id) => {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // File drag & drop handlers
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

  // Extract text from files (OCR or File Reader)
  const processFile = async (file) => {
    setSelectedFile(file);
    setIsLoading(true);
    
    try {
      if (file.type.startsWith('image/')) {
        setLoadingStep('Đang khởi tạo công cụ nhận dạng chữ OCR...');
        const result = await Tesseract.recognize(file, 'vie+eng', {
          logger: m => {
            if (m.status === 'recognizing') {
              setLoadingStep(`Nhận diện chữ trong ảnh (OCR): ${Math.round(m.progress * 100)}%`);
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
        setLoadingStep('Đang đọc nội dung file văn bản...');
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
        setInputText(text);
        toast('Đã nạp văn bản từ file thành công!', 'success');
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setLoadingStep('Đang nạp công cụ đọc file PDF...');
        
        // Dynamically load PDF.js from cdnjs
        const pdfjs = await new Promise((resolve, reject) => {
          if (window.pdfjsLib) {
            resolve(window.pdfjsLib);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          };
          script.onerror = (err) => reject(new Error('Không thể tải thư viện xử lý PDF.'));
          document.body.appendChild(script);
        });

        setLoadingStep('Đang trích xuất nội dung chữ từ file PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          setLoadingStep(`Đang trích xuất văn bản trang ${i} / ${numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        if (!fullText.trim()) {
          toast('Không tìm thấy văn bản trong tệp PDF. Tệp có thể chứa ảnh quét (cần OCR).', 'warning');
          setInputText(`Tài liệu PDF: ${file.name}. Hãy tạo sơ đồ tư duy cho tài liệu này.`);
        } else {
          setInputText(fullText.substring(0, 15000)); // Limit to safe payload length
          toast(`Đã trích xuất văn bản từ ${numPages} trang PDF thành công!`, 'success');
        }
      } else {
        // PDF or other binary file fallback (simulate text extraction or guide user)
        setLoadingStep('Đang đọc dữ liệu cấu trúc file tài liệu...');
        await new Promise(r => setTimeout(r, 1200));
        
        const promptText = `Tài liệu: ${file.name} (Kích thước: ${Math.round(file.size / 1024)} KB). Hãy phân tích và tạo một sơ đồ tư duy phân chia các chủ đề cốt lõi của môn học/lĩnh vực này.`;
        setInputText(promptText);
        toast(`Đã nhận diện file ${file.name}. Nhấn 'Tạo Sơ Đồ' để AI phân tích theo tên tài liệu.`, 'success');
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

  // Trigger OpenRouter AI generation via Backend API
  const handleGenerateMindmap = async () => {
    const content = inputText.trim();
    if (!content) {
      toast('Vui lòng nhập văn bản hoặc tải file lên để tạo sơ đồ!', 'warning');
      return;
    }

    setIsLoading(true);
    setLoadingStep('AI đang phân tích kiến thức và trích xuất cấu trúc sơ đồ (khoảng 10-15s)...');
    setSelectedNode(null);

    if (addLog) {
      addLog(`Lập sơ đồ tư duy AI cho nội dung: "${content.substring(0, 50)}..."`, 'sys');
    }

    try {
      const result = await api.generateMindmap(content);
      
      const structured = assignIds(result);
      setMindmapData(structured);
      setActiveMindmapDbId(null); // unsaved new mindmap

      // Auto-expand root and first level
      const newExpanded = new Set();
      newExpanded.add(structured.id);
      structured.children?.forEach(ch => {
        newExpanded.add(ch.id);
      });
      setExpandedNodes(newExpanded);

      // Center layout
      setZoom(0.95);
      setPan({ x: 80, y: 180 });
      
      toast('Đã tạo sơ đồ tư duy thành công!', 'success');
      if (addLog) addLog('Đã trích xuất sơ đồ tư duy AI hoàn tất', 'ai');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Lỗi khi tạo sơ đồ tư duy từ AI. Vui lòng thử lại!', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Node collapse / expand toggle handler
  const handleToggleExpand = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };

  // Flat Node Index Memoization for fast searches
  const flatNodes = useMemo(() => {
    if (!mindmapData) return [];
    const list = [];
    const traverse = (node) => {
      if (!node) return;
      list.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(mindmapData);
    return list;
  }, [mindmapData]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setSearchIndex(-1);
      return;
    }
    const query = val.trim().toLowerCase();
    const results = flatNodes
      .filter(node => node.name.toLowerCase().includes(query))
      .map(node => node.id);
    setSearchResults(results);
    if (results.length > 0) {
      setSearchIndex(0);
      focusOnNode(results[0]);
    } else {
      setSearchIndex(-1);
    }
  };

  const handleSearchNext = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIndex);
    focusOnNode(searchResults[nextIndex]);
  };

  const handleSearchPrev = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prevIndex);
    focusOnNode(searchResults[prevIndex]);
  };

  const focusOnNode = (nodeId) => {
    const nodeInTree = findNodeById(mindmapData, nodeId);
    if (nodeInTree) {
      setSelectedNode(nodeInTree);
      // Auto-expand all parent branches leading to this node
      const parts = nodeId.split('-');
      const newExpanded = new Set(expandedNodes);
      let currentPath = '';
      parts.forEach((part, idx) => {
        currentPath = idx === 0 ? part : `${currentPath}-${part}`;
        newExpanded.add(currentPath);
      });
      setExpandedNodes(newExpanded);

      // Scroll canvas to focus on target node coordinates
      const { nodes: layoutNodes } = computeTreeLayout(newExpanded);
      const targetLayout = layoutNodes.find(n => n.id === nodeId);
      if (targetLayout) {
        const containerWidth = svgRef.current ? svgRef.current.clientWidth : 800;
        const containerHeight = svgRef.current ? svgRef.current.clientHeight : 500;
        const newZoom = 1.0;
        setZoom(newZoom);
        setPan({
          x: (containerWidth / 2) - targetLayout.x * newZoom,
          y: (containerHeight / 2) - targetLayout.y * newZoom
        });
      }
    }
  };

  // Client-side html-to-image PNG Exporter
  const handleExportPng = async () => {
    if (!svgRef.current) return;
    setIsLoading(true);
    setLoadingStep('Đang chuẩn bị công cụ xuất ảnh PNG...');
    try {
      // Dynamically load html-to-image library from jsDelivr CDN
      const htmlToImage = await new Promise((resolve, reject) => {
        if (window.htmlToImage) {
          resolve(window.htmlToImage);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js';
        script.onload = () => resolve(window.htmlToImage);
        script.onerror = (err) => reject(new Error('Không thể tải thư viện xuất ảnh PNG.'));
        document.body.appendChild(script);
      });

      setLoadingStep('Đang chuyển đổi sơ đồ thành ảnh PNG...');
      const svgElement = svgRef.current;
      const contentGroup = svgElement.querySelector('g');
      if (!contentGroup) {
        throw new Error('Không tìm thấy nội dung sơ đồ để xuất.');
      }

      // Temporarily remove transform of <g> to measure local bounding box
      const originalTransform = contentGroup.getAttribute('transform');
      contentGroup.setAttribute('transform', 'translate(0,0) scale(1)');
      const bbox = svgElement.getBBox ? svgElement.getBBox() : { x: 0, y: 0, width: 1200, height: 800 };
      
      // Restore original transform
      contentGroup.setAttribute('transform', originalTransform);

      // Clone SVG and set its dimensions to encapsulate the whole mindmap
      const clonedSvg = svgElement.cloneNode(true);
      const clonedContentGroup = clonedSvg.querySelector('g');
      
      const padding = 80;
      const width = bbox.width + padding * 2;
      const height = bbox.height + padding * 2;

      clonedSvg.setAttribute('width', width);
      clonedSvg.setAttribute('height', height);
      clonedSvg.setAttribute('style', `background-color: #141410; width: ${width}px; height: ${height}px;`);

      // Translate group in the clone so the whole mindmap is visible inside cloned bounds
      const tx = padding - bbox.x;
      const ty = padding - bbox.y;
      clonedContentGroup.setAttribute('transform', `translate(${tx}, ${ty}) scale(1)`);

      // Append clone to body off-screen to allow proper stylesheet styles inheritance
      clonedSvg.style.position = 'absolute';
      clonedSvg.style.top = '-9999px';
      clonedSvg.style.left = '-9999px';
      document.body.appendChild(clonedSvg);

      // Inline mindmap styles into the clone
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        svg { background-color: #141410; font-family: 'Inter', system-ui, sans-serif; }
        .canvas-node-card { border-radius: 14px; text-align: center; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
        .canvas-node-card-root { background: linear-gradient(135deg, #3B82F6, #1D4ED8) !important; color: #FFFFFF !important; }
        .canvas-node-card-level1 { background: linear-gradient(135deg, #8B5CF6, #6D28D9) !important; color: #FFFFFF !important; }
        .canvas-node-card-level2 { background: linear-gradient(135deg, #10B981, #047857) !important; color: #FFFFFF !important; }
        .node-status--learning { border-left: 6px solid #F59E0B !important; background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04)) !important; border: 1.5px solid #F59E0B !important; color: #F59E0B !important; }
        .node-status--learned { border-left: 6px solid #10B981 !important; background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04)) !important; border: 1.5px solid #10B981 !important; color: #10B981 !important; }
        .node-status--review { border-left: 6px solid #EF4444 !important; background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04)) !important; border: 1.5px solid #EF4444 !important; color: #EF4444 !important; }
        .node-status--important { border-left: 6px solid #D946EF !important; background: linear-gradient(135deg, rgba(217, 70, 239, 0.15), rgba(217, 70, 239, 0.04)) !important; border: 1.5px solid #D946EF !important; color: #E879F9 !important; }
        .node-status-badge { position: absolute; top: 4px; right: 6px; font-size: 9px; font-weight: 800; }
        text { fill: #F3F4F6; }
      `;
      clonedSvg.appendChild(styleEl);

      const dataUrl = await htmlToImage.toPng(clonedSvg, {
        width: width,
        height: height,
        style: {
          transform: 'none',
          left: '0',
          top: '0',
          position: 'static'
        }
      });

      document.body.removeChild(clonedSvg);

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `${mindmapData?.name || 'mindmap'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast('Đã xuất file PNG thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Lỗi khi xuất ảnh PNG! Thử phóng to/thu nhỏ sơ đồ trước khi xuất.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Interactive recursive Outline view node builder
  const renderOutlineNode = (node, depth = 0) => {
    if (!node) return null;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    const nodeStatus = node.status || 'none';
    let statusBadge = null;
    if (nodeStatus === 'learned') statusBadge = <span className="outline-status-badge outline-status-badge--learned">Đã hiểu</span>;
    else if (nodeStatus === 'learning') statusBadge = <span className="outline-status-badge outline-status-badge--learning">Đang học</span>;
    else if (nodeStatus === 'review') statusBadge = <span className="outline-status-badge outline-status-badge--review">Cần ôn lại</span>;
    else if (nodeStatus === 'important') statusBadge = <span className="outline-status-badge outline-status-badge--important">★ Quan trọng</span>;

    return (
      <div key={node.id} className={`outline-node-wrapper ${depth === 0 ? 'outline-node-wrapper--root' : ''}`}>
        <div 
          className={`outline-node-header ${isSelected ? 'outline-node-header--selected' : ''}`}
          onClick={() => handleNodeSelect(node)}
        >
          <div className="outline-node-title-area">
            {hasChildren && (
              <button 
                className="outline-node-expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand(node.id);
                }}
                style={{ marginTop: '2px' }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <div className="outline-node-text-group">
              <span className="outline-node-name" style={{ fontWeight: depth === 0 ? '800' : (depth === 1 ? '700' : '500') }}>
                {node.name}
              </span>
              {node.description && (
                <span className="outline-node-desc">{node.description}</span>
              )}
            </div>
          </div>
          <div className="outline-node-actions">
            {statusBadge}
            {nodeProgressMap[node.id]?.mastery !== undefined && (
              <span style={{ fontSize: '10.5px', color: 'var(--mm-gold)', fontWeight: 'bold' }}>
                {Math.round(nodeProgressMap[node.id].mastery * 100)}% Thành thạo
              </span>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="outline-node-children">
            {node.children.map(child => renderOutlineNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // SVB Tree coordinate layout algorithm (Horizontal Tree left-to-right)
  const computeTreeLayout = (customExpanded = expandedNodes) => {
    if (!mindmapData) return { nodes: [], links: [] };

    // Inner recursive tree coordinate assigner
    const layoutSubtree = (node, depth = 0, state = { currentY: 50 }) => {
      const isExpanded = customExpanded.has(node.id);
      const children = (isExpanded && node.children) ? node.children : [];
      
      const layoutNode = {
        id: node.id,
        name: node.name,
        description: node.description || '',
        depth,
        x: depth * 310 + 130, // spacing between columns
        y: 0,
        children: [],
        rawNode: node
      };

      if (children.length === 0) {
        layoutNode.y = state.currentY;
        state.currentY += 95; // spacing between sibling leaves
      } else {
        const childLayouts = children.map(child => layoutSubtree(child, depth + 1, state));
        layoutNode.children = childLayouts;
        
        // Parent node Y coordinate is average of first and last child
        const firstY = childLayouts[0].y;
        const lastY = childLayouts[childLayouts.length - 1].y;
        layoutNode.y = (firstY + lastY) / 2;
      }
      return layoutNode;
    };

    const rootLayout = layoutSubtree(mindmapData);
    
    // Flatten helper
    const nodesList = [];
    const linksList = [];

    const flatten = (layoutNode) => {
      const rawNode = layoutNode.rawNode;
      const hasChildren = rawNode && rawNode.children && rawNode.children.length > 0;

      nodesList.push({
        id: layoutNode.id,
        name: layoutNode.name,
        description: layoutNode.description,
        depth: layoutNode.depth,
        x: layoutNode.x,
        y: layoutNode.y,
        hasChildren,
        shape: rawNode?.shape || 'oval',
        status: rawNode?.status || 'none'
      });

      layoutNode.children.forEach(child => {
        linksList.push({
          id: `${layoutNode.id}->${child.id}`,
          source: { x: layoutNode.x, y: layoutNode.y },
          target: { x: child.x, y: child.y },
          depth: layoutNode.depth
        });
        flatten(child);
      });
    };

    flatten(rootLayout);
    return { nodes: nodesList, links: linksList };
  };

  const { nodes, links } = useMemo(() => {
    return computeTreeLayout();
  }, [mindmapData, expandedNodes]);

  const renderedLinks = useMemo(() => {
    return links.map((link) => {
      const x1 = link.source.x + 110;
      const y1 = link.source.y;
      const x2 = link.target.x - 110;
      const y2 = link.target.y;
      const cx1 = x1 + 55;
      const cy1 = y1;
      const cx2 = x2 - 55;
      const cy2 = y2;
      const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
      
      const isTargetSelected = selectedNode?.id === link.target.id;
      const isSourceSelected = selectedNode?.id === link.source.id;
      const isActive = isTargetSelected || isSourceSelected;

      return (
        <path
          key={link.id}
          d={pathData}
          className={`canvas-connection-path ${isActive ? 'canvas-connection-path--active' : ''}`}
        />
      );
    });
  }, [links, selectedNode]);

  const renderedNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = selectedNode?.id === node.id;
      const isRoot = node.depth === 0;
      const isLevel1 = node.depth === 1;
      const isExpanded = expandedNodes.has(node.id);

      const progressStyle = getNodeProgressStyle(node, isRoot, isLevel1);

      // Custom Shapes Styling
      let borderRadius = '12px';
      let clipPath = 'none';
      let width = '100%';
      let height = '100%';
      let margin = '0';
      let padding = '8px 12px';

      if (node.shape === 'rectangle') {
        borderRadius = '4px';
      } else if (node.shape === 'oval') {
        borderRadius = '100px';
      } else if (node.shape === 'circle') {
        borderRadius = '50%';
        width = '80px';
        height = '80px';
        margin = '0 auto';
        padding = '6px';
      } else if (node.shape === 'rhombus') {
        clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        borderRadius = '0px';
        padding = '12px 28px';
      }

      const nodeStatus = node.status || 'none';
      let statusBadgeText = '';
      if (nodeStatus === 'learned') statusBadgeText = '🟢';
      else if (nodeStatus === 'learning') statusBadgeText = '🟡';
      else if (nodeStatus === 'review') statusBadgeText = '🔴';
      else if (nodeStatus === 'important') statusBadgeText = '⭐';

      let depthClass = '';
      if (isRoot) depthClass = 'canvas-node-card-root';
      else if (isLevel1) depthClass = 'canvas-node-card-level1';
      else if (node.depth === 2) depthClass = 'canvas-node-card-level2';

      let statusClass = '';
      if (nodeStatus !== 'none') statusClass = `node-status--${nodeStatus}`;

      return (
        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
          {/* Interactive HTML inside SVG foreignObject */}
          <foreignObject x="-110" y="-40" width="220" height="80">
            <div 
              xmlns="http://www.w3.org/1999/xhtml"
              onClick={() => handleNodeSelect(node)}
              title={getNodeTooltip(node)}
              style={{
                width: width,
                height: height,
                margin: margin,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: padding,
                boxSizing: 'border-box',
                background: progressStyle.background,
                borderRadius: borderRadius,
                clipPath: clipPath,
                cursor: 'pointer',
                overflow: 'hidden',
                userSelect: 'none',
                position: 'relative'
              }}
              className={`canvas-node-card ${isSelected ? 'canvas-node-card--selected' : ''} ${depthClass} ${statusClass}`}
            >
              {/* Left status color strip */}
              {progressStyle.statusColor && (
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '7px',
                    backgroundColor: progressStyle.statusColor,
                    borderRight: '1px solid rgba(0,0,0,0.06)',
                    zIndex: 2
                  }}
                />
              )}

              {statusBadgeText && (
                <span className="node-status-badge" style={{ pointerEvents: 'none' }}>
                  {statusBadgeText}
                </span>
              )}
              <span 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  lineHeight: '1.3',
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical',
                  paddingLeft: progressStyle.statusColor ? '8px' : '0px'
                }}
                title={node.name}
              >
                {node.name}
              </span>
            </div>
          </foreignObject>

          {/* Node Collapse/Expand Toggle Controller */}
          {node.hasChildren && (
            <g 
              transform="translate(110, 0)"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(node.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle 
                r="10" 
                fill="var(--mm-card-dark)" 
                stroke="var(--mm-gold)"
                strokeWidth="1.5"
                style={{ transition: 'all 0.2s' }}
                className="canvas-node-toggle-circle"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight="900"
                fill="#ffffff"
                y="0.5"
                style={{ userSelect: 'none' }}
              >
                {isExpanded ? '-' : '+'}
              </text>
            </g>
          )}
        </g>
      );
    });
  }, [nodes, selectedNode, expandedNodes, nodeProgressMap]);

  // Canvas zoom actions
  const zoomIn = () => setZoom(prev => Math.min(3, prev * 1.15));
  const zoomOut = () => setZoom(prev => Math.max(0.15, prev * 0.85));
  const resetZoom = () => {
    setZoom(0.9);
    setPan({ x: 50, y: 150 });
  };

  // Canvas drag handlers
  const handleCanvasMouseDown = (e) => {
    // Drag allowed on background or svg element directly
    if (e.target.tagName === 'svg' || e.target.getAttribute('data-canvas-bg') === 'true') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // Save mindmap to Database or localStorage
  const handleSaveMindmap = async () => {
    if (!mindmapData) return;

    if (!currentUser) {
      // Guest localStorage fallback
      try {
        const localId = activeMindmapDbId || `local-${Date.now()}`;
        const newMindmap = {
          id: localId,
          title: mindmapData.name.trim() || 'Sơ đồ tư duy không tên',
          content: mindmapData,
          createdAt: new Date().toISOString()
        };

        const stored = localStorage.getItem('edupath_saved_mindmaps');
        let list = stored ? JSON.parse(stored) : [];
        
        const existingIdx = list.findIndex(m => m.id === localId);
        if (existingIdx > -1) {
          list[existingIdx] = newMindmap;
        } else {
          list = [newMindmap, ...list];
        }

        localStorage.setItem('edupath_saved_mindmaps', JSON.stringify(list));
        setActiveMindmapDbId(localId);
        toast('Đã lưu sơ đồ tư duy vào bộ nhớ tạm trình duyệt!', 'success');
        
        loadLocalHistory();
      } catch (err) {
        console.error(err);
        toast('Lỗi khi lưu sơ đồ vào trình duyệt!', 'error');
      }
      return;
    }

    try {
      const response = await api.saveMindmap(mindmapData.name, mindmapData, activeMindmapDbId);
      toast('Đã lưu sơ đồ tư duy vào Thư viện thành công!', 'success');
      setActiveMindmapDbId(response.id);
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast('Không thể lưu sơ đồ tư duy!', 'error');
    }
  };

  const fetchNodeProgress = async (mindmapId) => {
    if (!mindmapId || String(mindmapId).startsWith('local-')) return;
    try {
      const res = await api.getNodeProgress(mindmapId);
      if (res) {
        setNodeProgressMap(res);
      }
    } catch (e) {
      console.error("Lỗi khi tải tiến trình học tập:", e);
    }
  };

  useEffect(() => {
    if (activeMindmapDbId && !String(activeMindmapDbId).startsWith('local-')) {
      fetchNodeProgress(activeMindmapDbId);
    } else {
      setNodeProgressMap({});
    }
  }, [activeMindmapDbId]);

  const handleStartNodeQuiz = async (refresh = false) => {
    if (!mindmapData) return;
    if (!selectedNode) {
      toast("Vui lòng chọn một nút trên sơ đồ tư duy để làm quiz.", "warning");
      return;
    }
    
    let targetMindmapId = activeMindmapDbId;
    if (!targetMindmapId || String(targetMindmapId).startsWith('local-')) {
      toast("Đang tự động lưu sơ đồ tư duy trước khi làm quiz...", "info");
      try {
        const response = await api.saveMindmap(mindmapData.name, mindmapData, null);
        const savedId = response?.id || response?.data?.id;
        if (savedId) {
          targetMindmapId = savedId;
          setActiveMindmapDbId(targetMindmapId);
          const data = await api.getMindmaps();
          setSavedMindmaps(data || []);
        } else {
          toast("Lỗi tự động lưu sơ đồ tư duy.", "error");
          return;
        }
      } catch (e) {
        console.error("Lỗi tự động lưu:", e);
        toast("Lỗi tự động lưu sơ đồ tư duy.", "error");
        return;
      }
    }

    setQuizLoading(true);
    setIsQuizModalOpen(true);
    setQuizQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setQuizStartTime(Date.now());

    try {
      const res = await api.generateNodeQuiz(targetMindmapId, selectedNode.id, refresh);
      if (res) {
        setQuizQuestions(res);
      } else {
        toast("Không thể tải câu hỏi luyện tập.", "error");
        setIsQuizModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast("Lỗi khi tải câu hỏi luyện tập từ AI.", "error");
      setIsQuizModalOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizOption = (questionId, optionIdx) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (quizQuestions.length === 0 || quizSubmitted) return;
    
    if (Object.keys(selectedAnswers).length < quizQuestions.length) {
      toast("Vui lòng trả lời đầy đủ các câu hỏi trước khi nộp bài.", "warning");
      return;
    }

    setQuizLoading(true);
    const completionTime = Math.round((Date.now() - quizStartTime) / 1000);
    const formattedAnswers = Object.entries(selectedAnswers).map(([qId, optIdx]) => ({
      questionId: Number(qId),
      selectedOption: Number(optIdx)
    }));

    try {
      const res = await api.submitNodeQuiz(activeMindmapDbId, selectedNode.id, formattedAnswers, completionTime);
      if (res && res.score !== undefined) {
        setQuizResult(res);
        setQuizSubmitted(true);
        fetchNodeProgress(activeMindmapDbId);
        toast(`Nộp bài thành công! Bạn đạt ${res.score}/${res.total} câu.`, "success");
      } else {
        toast("Lỗi nộp bài thi trắc nghiệm.", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Lỗi nộp bài thi trắc nghiệm.", "error");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleGenerateWeaknessMindmap = async () => {
    setIsGeneratingWeakness(true);
    try {
      const res = await api.generateWeaknessMindmap();
      if (res && res.isNoWeakness) {
        toast(res.message, "info");
      } else if (res && res.content) {
        const parsed = typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
        const structured = assignIds(parsed);
        setMindmapData(structured);
        setActiveMindmapDbId(res.id);
        setSelectedNode(null);

        const newExpanded = new Set();
        newExpanded.add(structured.id);
        structured.children?.forEach(ch => {
          newExpanded.add(ch.id);
        });
        setExpandedNodes(newExpanded);

        const listData = await api.getMindmaps();
        setSavedMindmaps(listData || []);
        
        toast("Đã tạo thành công Sơ đồ tư duy khắc phục lỗ hổng kiến thức!", "success");
      } else {
        toast("Không thể chẩn đoán vùng yếu. Hãy làm thêm một số bài quiz nhé!", "warning");
      }
    } catch (e) {
      console.error(e);
      toast("Lỗi khi tạo sơ đồ vùng yếu bằng AI.", "error");
    } finally {
      setIsGeneratingWeakness(false);
    }
  };

  const handleExamUpload = async (file) => {
    if (!file) return;
    const allowed = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      toast("Tệp tin không được hỗ trợ! Chỉ cho phép PDF, DOCX, Hình ảnh hoặc Văn bản.", "warning");
      return;
    }

    setExamUploadLoading(true);
    setExamTitle(file.name.replace(/\.[^/.]+$/, ""));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadExamFile(formData);
      if (res && res.extractedText !== undefined) {
        setExamText(res.extractedText || '');
        setExamFileUrl(res.fileUrl || '');
        setExamFileType(res.fileType || '');
        setUploadedFileId(res.id);
        toast("Tải lên đề thi thành công! Đã trích xuất nội dung.", "success");
      } else {
        toast("Không thể trích xuất nội dung file.", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Lỗi tải lên tệp tin.", "error");
    } finally {
      setExamUploadLoading(false);
    }
  };

  const handleAnalyzeExam = async () => {
    if (!examText.trim()) {
      toast("Nội dung đề thi trống. Hãy viết hoặc tải tệp tin.", "warning");
      return;
    }

    setExamAnalysisLoading(true);
    try {
      const res = await api.generateExamMindmap({
        title: examTitle.trim() || "Phân tích Đề thi",
        text: examText,
        fileUrl: examFileUrl,
        fileType: examFileType,
        uploadId: uploadedFileId
      });

      if (res && res.mindmapId) {
        const data = await api.getMindmapById(res.mindmapId);
        if (data) {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          const structured = assignIds(parsed);
          setMindmapData(structured);
          setActiveMindmapDbId(data.id);
          setSelectedNode(null);

          const newExpanded = new Set();
          newExpanded.add(structured.id);
          structured.children?.forEach(ch => {
            newExpanded.add(ch.id);
          });
          setExpandedNodes(newExpanded);

          const listData = await api.getMindmaps();
          setSavedMindmaps(listData || []);
          
          setIsExamModalOpen(false);
          toast("Đã lập thành công Sơ đồ tư duy cấu trúc đề thi!", "success");
        }
      } else {
        toast("AI lỗi khi phân tích đề thi.", "error");
      }
    } catch (e) {
      console.error(e);
      toast("Lỗi khi lập sơ đồ đề thi bằng AI.", "error");
    } finally {
      setExamAnalysisLoading(false);
    }
  };

  function getNodeProgressStyle(node, isRoot, isLevel1) {
    const nodeId = node.id;
    const idParts = String(node.id).split('-');

    // Core pastel colors specified by the user
    const colors = [
      '#BFDBFE', // Pastel Blue
      '#A7F3D0', // Pastel Mint Green
      '#FED7AA', // Pastel Orange/Peach
      '#DDD6FE'  // Pastel Violet/Purple
    ];

    let background = '#ffffff';
    let statusColor = null;

    if (idParts.length === 1) {
      // Root Node: Clean white card with distinct contrast border
      background = '#ffffff';
    } else {
      // Resolve the branch index based on the Level 1 parent node index (idParts[1])
      const branchIdx = (parseInt(idParts[1]) || 0) % colors.length;
      const baseColor = colors[branchIdx];

      if (idParts.length === 2) {
        // Level 1 Nodes: Full vivid user pastel color for branch distinction
        background = baseColor;
      } else {
        // Level 2 / Leaf Nodes: Very soft, lighter variant of the branch color
        const lightColors = [
          '#EFF6FF', // Light Blue
          '#ECFDF5', // Light Mint Green
          '#FFF7ED', // Light Peach
          '#F5F3FF'  // Light Lavender
        ];
        background = lightColors[branchIdx];
      }
    }

    // Determine status color based on priority or mastery progress
    if (node.priority) {
      const priority = node.priority.toLowerCase();
      if (priority === 'critical') statusColor = '#EF4444';
      else if (priority === 'high') statusColor = '#F97316';
      else if (priority === 'medium') statusColor = '#F59E0B';
      else if (priority === 'low') statusColor = '#10B981';
    } else {
      const progress = nodeProgressMap[nodeId];
      if (progress && progress.mastery !== undefined) {
        const mastery = progress.mastery;
        if (mastery < 0.5) {
          statusColor = '#EF4444'; // Red (Not understood)
        } else if (mastery < 0.8) {
          statusColor = '#F59E0B'; // Orange (Learning)
        } else {
          statusColor = '#10B981'; // Green (Mastered)
        }
      }
    }

    return { background, statusColor };
  }

  function getNodeTooltip(node) {
    const nodeId = node.id;
    const progress = nodeProgressMap[nodeId];
    
    if (node.priority) {
      return `${node.name}\n---\nKhắc phục sai sót [Mức: ${node.priority}]\nGợi ý: ${node.description || 'Xem lại kiến thức'}`;
    }
    
    if (!progress || progress.mastery === undefined) {
      return `${node.name}\nTiến độ: Chưa bắt đầu`;
    }
    
    const mastery = progress.mastery;
    let status = 'Chưa luyện tập';
    if (mastery < 0.4) status = 'Yếu';
    else if (mastery < 0.6) status = 'Cơ bản';
    else if (mastery < 0.8) status = 'Khá';
    else if (mastery < 0.9) status = 'Giỏi';
    else status = 'Thành thạo';

    const dateStr = progress.lastPracticed ? new Date(progress.lastPracticed).toLocaleDateString('vi-VN') : 'Chưa rõ';

    return `${node.name}\n---\nĐộ thành thạo: ${status} (${Math.round(mastery * 100)}%)\nĐiểm cao nhất: ${progress.bestScore || 0}/10\nSố lần luyện tập: ${progress.attempts || 0}\nLần luyện tập cuối: ${dateStr}`;
  }

  const handleShareMindmap = () => {
    if (!activeMindmapDbId) {
      toast('Vui lòng lưu sơ đồ tư duy trước khi chia sẻ!', 'warning');
      return;
    }
    const shareUrl = `${window.location.origin}/ai-tutor?share=${activeMindmapDbId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast('Đã sao chép liên kết chia sẻ sơ đồ tư duy!', 'success');
      })
      .catch((err) => {
        console.error(err);
        toast('Không thể sao chép liên kết chia sẻ!', 'error');
      });
  };

  const handleExpandAllOutline = () => {
    if (!mindmapData) return;
    const newExpanded = new Set();
    const traverse = (node) => {
      if (!node) return;
      newExpanded.add(node.id);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(mindmapData);
    setExpandedNodes(newExpanded);
    toast('Đã mở rộng toàn bộ các cấp độ dàn ý!', 'success');
  };

  const handleCollapseAllOutline = () => {
    if (!mindmapData) return;
    const newExpanded = new Set();
    newExpanded.add(mindmapData.id);
    setExpandedNodes(newExpanded);
    toast('Đã thu gọn toàn bộ các nhánh con!', 'success');
  };

  const handleCreateBlankMindmap = () => {
    const name = prompt('Nhập tiêu đề cho sơ đồ tư duy mới của bạn:', 'Sơ đồ tư duy của tôi');
    if (name === null) return;
    const finalName = name.trim() || 'Sơ đồ tư duy của tôi';

    const newRoot = {
      name: finalName,
      description: 'Chủ đề gốc. Chọn nút này và sử dụng bảng bên phải để thêm nút con hoặc chỉnh sửa nội dung.',
      children: []
    };

    const structured = assignIds(newRoot);
    setMindmapData(structured);
    setActiveMindmapDbId(null);
    setSelectedNode(null);

    // Expand root node
    const newExpanded = new Set();
    newExpanded.add(structured.id);
    setExpandedNodes(newExpanded);

    // Center layout
    setZoom(1.0);
    setPan({ x: 150, y: 200 });

    toast('Đã khởi tạo sơ đồ tư duy trống mới! Bấm chọn nút và sử dụng bảng bên phải để bắt đầu thiết kế.', 'success');
  };

  // Node CRUD Action Handlers
  const handleUpdateNode = () => {
    if (!editNodeName.trim()) {
      toast('Tên nút không được để trống!', 'warning');
      return;
    }
    const nodeId = selectedNode.id;
    const name = editNodeName.trim();
    const desc = editNodeDesc.trim();
    const shape = editNodeShape;

    const updateNodeInTree = (node) => {
      if (node.id === nodeId) {
        return { ...node, name, description: desc, shape };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeInTree)
        };
      }
      return node;
    };

    const updatedData = updateNodeInTree(mindmapData);
    setMindmapData(updatedData);
    isDirtyRef.current = true;
    setSelectedNode(findNodeById(updatedData, nodeId));
    toast('Đã cập nhật thông tin nút sơ đồ!', 'success');
  };

  const handleUpdateNodeStatus = (status) => {
    if (!selectedNode) return;
    const nodeId = selectedNode.id;

    const updateNodeStatusInTree = (node) => {
      if (node.id === nodeId) {
        return { ...node, status };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeStatusInTree)
        };
      }
      return node;
    };

    const updatedData = updateNodeStatusInTree(mindmapData);
    setMindmapData(updatedData);
    isDirtyRef.current = true;
    setSelectedNode(findNodeById(updatedData, nodeId));
    toast('Đã cập nhật trạng thái học tập của nút!', 'success');
  };

  const handleAddChildNode = () => {
    if (!newChildName.trim()) {
      toast('Tên nút con không được để trống!', 'warning');
      return;
    }
    const parentId = selectedNode.id;
    const name = newChildName.trim();
    const desc = newChildDesc.trim();

    const addChildToTree = (node) => {
      if (node.id === parentId) {
        const newChild = {
          name,
          description: desc,
          children: []
        };
        return {
          ...node,
          children: node.children ? [...node.children, newChild] : [newChild]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addChildToTree)
        };
      }
      return node;
    };

    const updatedData = addChildToTree(mindmapData);
    const structured = assignIds(updatedData);
    setMindmapData(structured);
    isDirtyRef.current = true;
    
    // Automatically expand parent node to see the new child
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });

    setSelectedNode(findNodeById(structured, parentId));
    setNewChildName('');
    setNewChildDesc('');
    toast('Đã thêm nút con thành công!', 'success');
  };

  const handleDeleteNode = () => {
    if (selectedNode.id === mindmapData.id) {
      toast('Không thể xóa nút gốc của sơ đồ tư duy! Bạn có thể chỉnh sửa nó.', 'warning');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa nút này cùng tất cả các nhánh con của nó?')) return;
    
    const nodeId = selectedNode.id;

    const deleteNodeFromTree = (node) => {
      if (node.children) {
        const hasTarget = node.children.some(ch => ch.id === nodeId);
        if (hasTarget) {
          return {
            ...node,
            children: node.children.filter(ch => ch.id !== nodeId)
          };
        }
        return {
          ...node,
          children: node.children.map(deleteNodeFromTree)
        };
      }
      return node;
    };

    const updatedData = deleteNodeFromTree(mindmapData);
    const structured = assignIds(updatedData);
    setMindmapData(structured);
    isDirtyRef.current = true;
    setSelectedNode(null); // Close drawer since selected node is deleted
    toast('Đã xóa nút sơ đồ thành công!', 'success');
  };

  // Load mindmap from history
  const handleLoadMindmap = (savedItem) => {
    try {
      const parsed = typeof savedItem.content === 'string' ? JSON.parse(savedItem.content) : savedItem.content;
      const structured = assignIds(parsed);
      setMindmapData(structured);
      setActiveMindmapDbId(savedItem.id);
      setSelectedNode(null);

      // Auto expand root + level 1
      const newExpanded = new Set();
      newExpanded.add(structured.id);
      structured.children?.forEach(ch => {
        newExpanded.add(ch.id);
      });
      setExpandedNodes(newExpanded);

      // Reset coordinates
      setZoom(0.9);
      setPan({ x: 50, y: 150 });
      
      toast(`Đã tải sơ đồ: ${savedItem.title}`, 'success');
    } catch (err) {
      console.error(err);
      toast('Không thể parse dữ liệu sơ đồ tư duy đã lưu!', 'error');
    }
  };

  // Delete saved mindmap
  const handleDeleteMindmap = async (e, id) => {
    e.stopPropagation(); // stop click from loading
    if (!confirm('Bạn có chắc chắn muốn xóa sơ đồ tư duy này?')) return;

    if (!currentUser || String(id).startsWith('local-')) {
      // Local delete
      try {
        const stored = localStorage.getItem('edupath_saved_mindmaps');
        if (stored) {
          const list = JSON.parse(stored);
          const nextList = list.filter(m => m.id !== id);
          localStorage.setItem('edupath_saved_mindmaps', JSON.stringify(nextList));
          if (activeMindmapDbId === id) {
            setActiveMindmapDbId(null);
          }
          loadLocalHistory();
          toast('Đã xóa sơ đồ tư duy khỏi trình duyệt!', 'success');
        }
      } catch (err) {
        console.error(err);
        toast('Lỗi khi xóa sơ đồ tư duy!', 'error');
      }
      return;
    }

    try {
      await api.deleteMindmap(id);
      toast('Đã xóa sơ đồ tư duy khỏi Thư viện!', 'success');
      if (activeMindmapDbId === id) {
        setActiveMindmapDbId(null);
      }
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast('Lỗi khi xóa sơ đồ tư duy!', 'error');
    }
  };

  // Export options
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    try {
      const svgString = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `${mindmapData?.name || 'mindmap'}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast('Đã xuất file SVG thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Lỗi khi xuất SVG!', 'error');
    }
  };

  const handleExportJson = () => {
    if (!mindmapData) return;
    try {
      const jsonString = JSON.stringify(mindmapData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${mindmapData.name || 'mindmap'}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast('Đã xuất file JSON thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Lỗi khi xuất JSON!', 'error');
    }
  };

  // Q&A Node Chat submissions (calls Backend chat endpoint streaming response)
  const handleSendNodeQuestion = async (predefinedText = '') => {
    const text = predefinedText || nodeChatInput;
    if (!text.trim() || !selectedNode || isNodeChatTyping) return;

    const nodeId = selectedNode.id;
    const currentMessages = nodeChatMessages[nodeId] || [];
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMsg = { sender: 'user', text, time: timeString };
    const updatedMsgs = [...currentMessages, userMsg];

    setNodeChatMessages(prev => ({
      ...prev,
      [nodeId]: updatedMsgs
    }));
    
    setNodeChatInput('');
    setIsNodeChatTyping(true);

    if (addLog) {
      addLog(`Hỏi AI về nút [${selectedNode.name}]: "${text.substring(0, 30)}..."`, 'sys');
    }

    // Embed contextual node info to instruct AI
    const contextualPrompt = `Trong sơ đồ tư duy tên "${mindmapData.name}", tôi đang quan sát mục "${selectedNode.name}" có phần nội dung tóm tắt là: "${selectedNode.description}". Hãy giải đáp chi tiết câu hỏi này của tôi liên quan đến khái niệm này: "${text}"`;

    // Bot message template
    const botMsgId = Date.now();
    const initialBotMsg = { id: botMsgId, sender: 'bot', text: '', time: 'Hệ thống' };
    
    setNodeChatMessages(prev => ({
      ...prev,
      [nodeId]: [...(prev[nodeId] || []), initialBotMsg]
    }));

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        },
        body: JSON.stringify({ message: contextualPrompt })
      });

      if (!response.ok) {
        throw new Error(`Connection status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botResponseText = '';
      setIsNodeChatTyping(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                botResponseText += parsed.text;
                
                setNodeChatMessages(prev => {
                  const list = prev[nodeId] || [];
                  const mapped = list.map(m => m.id === botMsgId ? { ...m, text: botResponseText } : m);
                  return { ...prev, [nodeId]: mapped };
                });
              }
            } catch (e) {
              // ignore JSON fragments
            }
          }
        }
      }

      if (addLog) addLog('AI trả lời câu hỏi nút hoàn thành', 'ai');
    } catch (err) {
      console.error(err);
      setIsNodeChatTyping(false);
      
      const errorMsg = 'Chào bạn! EduBot AI đã nhận được câu hỏi. Tuy nhiên kết nối máy chủ AI đang tải hoặc tài khoản của bạn chưa đăng nhập. Bạn hãy đăng nhập để hỏi đáp đầy đủ cùng AI nhé!';
      setNodeChatMessages(prev => {
        const list = prev[nodeId] || [];
        const mapped = list.map(m => m.id === botMsgId ? { ...m, text: errorMsg } : m);
        return { ...prev, [nodeId]: mapped };
      });
    }
  };

  const handleNavigateToAuth = (mode) => {
    navigateTo('/');
    setTimeout(() => {
      const event = new CustomEvent('edupath-auth-redirect', { detail: { mode } });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <div className="aitutor-page">
      {/* Stand-alone Header for Guests */}
      {!currentUser && !hideHeader && (
        <header className="aitutor-guest-header animate-in">
          <a href="/" className="aitutor-guest-logo" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>
            <span>EduPath <em>AI</em></span>
          </a>
          <div className="aitutor-guest-nav">
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>Trang chủ</a>
            <a href="/courses" onClick={(e) => { e.preventDefault(); navigateTo('/courses'); }}>Khóa học</a>
            <a href="/mock-exams" onClick={(e) => { e.preventDefault(); navigateTo('/mock-exams'); }}>Thi thử</a>
            <button className="aitutor-guest-btn-login" onClick={() => handleNavigateToAuth('login')}>Đăng nhập</button>
            <button className="aitutor-guest-btn-signup" onClick={() => handleNavigateToAuth('signup')}>Đăng ký</button>
          </div>
        </header>
      )}

      {/* Main Workspace grid */}
      <div 
        className={`aitutor-workspace ${isFullscreen ? 'aitutor-workspace--fullscreen' : ''}`}
        style={{
          gridTemplateColumns: `${sidebarWidth}px 6px 1fr`,
          gap: '0px'
        }}
      >
        {/* Left sidebar: Control & history */}
        <aside className="aitutor-sidebar">
          <div 
            onClick={() => navigateTo('/')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              textDecoration: 'none',
              padding: '6px 8px 16px 8px',
              borderBottom: '1px solid var(--mm-border-dark, #2F2F26)',
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
          {/* Tabs header */}
          <div className="aitutor-sidebar-tabs">
            <button 
              className={`aitutor-tab-btn ${activeTab === 'create' ? 'aitutor-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              <HiSparkles /> Tạo sơ đồ mới
            </button>
            <button 
              className={`aitutor-tab-btn ${activeTab === 'history' ? 'aitutor-tab-btn--active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
            >
              <HiFolder /> Thư viện của tôi
            </button>
          </div>

          {/* Creation Panel */}
          {activeTab === 'create' && (
            <div className="aitutor-panel-content">
              <button 
                className="flashcard-btn-create-deck" 
                onClick={handleCreateBlankMindmap}
                style={{ marginBottom: '16px' }}
                title="Tự tay thiết kế sơ đồ tư duy của riêng bạn"
              >
                <HiPlus />
                <span>Tạo sơ đồ trống mới</span>
              </button>

              {/* Mindmap Guide card */}
              <div className="aitutor-guide-card" style={{
                background: 'rgba(255, 226, 89, 0.03)',
                border: '1px dashed rgba(255, 226, 89, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '11px',
                color: '#ffffff'
              }}>
                <h5 style={{ color: 'var(--fc-gold)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 'bold' }}>
                  💡 HƯỚNG DẪN SỬ DỤNG HIỆU QUẢ
                </h5>
                <ul style={{ margin: 0, paddingLeft: '14px', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <li><strong>Tự động tạo:</strong> Dán văn bản hoặc tải file PDF/Ảnh học tập để AI phân tích vẽ sơ đồ.</li>
                  <li><strong>Tương tác kéo thả:</strong> Nhấp giữ chuột vào khoảng trống canvas để kéo sơ đồ, cuộn chuột để phóng to/thu nhỏ.</li>
                  <li><strong>Hỏi đáp chuyên sâu:</strong> Click chọn bất kỳ nút nào để mở bảng chat bên phải, chọn <em>Giải thích sâu</em> hoặc <em>Ví dụ</em> để ôn tập cùng EduBot AI.</li>
                  <li><strong>Lưu & Chia sẻ:</strong> Bấm <strong>Lưu</strong> ở trên cùng để đưa vào Thư viện cá nhân. Sau khi lưu, bấm <strong>🔗 Chia sẻ</strong> để copy link gửi cho bạn bè!</li>
                </ul>
              </div>

              {/* Drag & drop upload area */}
              <div 
                className={`aitutor-dropzone ${isDraggingFile ? 'aitutor-dropzone--active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*,text/plain,.txt,.md,application/pdf,.pdf"
                  style={{ display: 'none' }} 
                />
                <HiUpload className="aitutor-dropzone-icon" />
                <p className="aitutor-dropzone-title">Kéo & thả file vào đây</p>
                <p className="aitutor-dropzone-desc">Hỗ trợ Ảnh học tập (OCR), file ghi chú TXT, MD hoặc PDF</p>
                
                {selectedFile && (
                  <div className="aitutor-uploaded-tag" onClick={(e) => e.stopPropagation()}>
                    <HiDocumentText />
                    <span>{selectedFile.name}</span>
                    <button className="aitutor-clear-file" onClick={clearSelectedFile}>
                      <HiX />
                    </button>
                  </div>
                )}
              </div>

              {/* Paste Text input area */}
              <div className="aitutor-text-area-container">
                <label className="aitutor-textarea-label">Hoặc nhập/dán tài liệu kiến thức:</label>
                <textarea
                  className="aitutor-textarea"
                  placeholder="Dán đề bài, nội dung bài học hoặc đoạn văn bản tóm tắt vào đây. AI sẽ phân tích cấu trúc sơ đồ tư duy..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Action Trigger Button */}
              <button
                className="aitutor-action-btn"
                onClick={handleGenerateMindmap}
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="unique-loader" /> Đang phân tích...
                  </>
                ) : (
                  <>
                    <HiSparkles /> Tạo Sơ đồ tư duy AI
                  </>
                )}
              </button>

              {/* Loading progress status messages */}
              {isLoading && loadingStep && (
                <div className="aitutor-step-progress animate-in">
                  <span className="unique-loader" />
                  <p>{loadingStep}</p>
                </div>
              )}
            </div>
          )}



          {/* History Saved Panel */}
          {activeTab === 'history' && (
            <div className="aitutor-panel-content" style={{ padding: '12px' }}>
              {!currentUser && (
                <div style={{
                  background: 'rgba(255, 226, 89, 0.03)',
                  border: '1px dashed rgba(255, 226, 89, 0.2)',
                  borderRadius: '10px',
                  padding: '10px',
                  marginBottom: '10px',
                  fontSize: '10.5px',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }} className="animate-in">
                  <span>💡 Bạn đang lưu sơ đồ tạm thời trên trình duyệt này.</span>
                  <button 
                    onClick={() => handleNavigateToAuth('login')}
                    style={{ background: 'var(--mm-gold)', color: '#12120e', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Đăng nhập để đồng bộ đám mây
                  </button>
                </div>
              )}
              {isHistoryLoading ? (
                <div className="aitutor-history-loading">
                  <span className="unique-loader" /> Đang tải danh sách...
                </div>
              ) : savedMindmaps.length === 0 ? (
                <div className="aitutor-history-empty">
                  Bạn chưa lưu sơ đồ tư duy nào.
                </div>
              ) : (
                <div className="aitutor-history-list">
                  {savedMindmaps.map((item) => (
                    <div 
                      key={item.id} 
                      className={`aitutor-history-item ${activeMindmapDbId === item.id ? 'aitutor-history-item--active' : ''}`}
                      onClick={() => handleLoadMindmap(item)}
                    >
                      <div className="aitutor-history-item-body">
                        <span className="aitutor-history-item-icon">🧠</span>
                        <div className="aitutor-history-item-details">
                          <p className="aitutor-history-item-title">{item.title}</p>
                          <span className="aitutor-history-item-date">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="aitutor-history-item-delete"
                        onClick={(e) => handleDeleteMindmap(e, item.id)}
                        title="Xóa sơ đồ tư duy"
                      >
                        <HiTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <div className="aitutor-sidebar-resizer" onMouseDown={handleSidebarMouseDown} />

        {/* Center Canvas Workspace */}
        <main className="aitutor-chat-panel">
          {/* Header Actions */}
          <div className="aitutor-chat-header">
            <div className="aitutor-chat-header-left">
              <span className="aitutor-channel-avatar" style={{ width: 38, height: 38, fontSize: 18, background: '#EEF2F6', border: '1px solid var(--border)' }}>
                🧠
              </span>
              <div>
                <h4 className="aitutor-active-title" style={{ fontSize: '14.5px', fontWeight: 'bold' }}>
                  {mindmapData ? mindmapData.name : 'Sơ đồ tư duy'}
                </h4>
                <div className="aitutor-active-status" style={{ fontSize: '11px' }}>
                  {activeMindmapDbId ? '✓ Đã lưu đồng bộ' : '☁ Bản nháp (chưa lưu)'}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {mindmapData && (
                <>
                  {/* Search Bar */}
                  <div className="aitutor-search-wrapper">
                    <input 
                      type="text" 
                      className="aitutor-search-input" 
                      placeholder="Tìm nút..." 
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <span className="aitutor-search-count">
                        {searchIndex + 1}/{searchResults.length}
                      </span>
                    )}
                    <button 
                      className="aitutor-search-btn" 
                      onClick={handleSearchPrev}
                      disabled={searchResults.length === 0}
                      title="Nút trước"
                    >
                      ◀
                    </button>
                    <button 
                      className="aitutor-search-btn" 
                      onClick={handleSearchNext}
                      disabled={searchResults.length === 0}
                      title="Nút tiếp"
                    >
                      ▶
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <button 
                    className="canvas-action-pill" 
                    onClick={() => setViewMode(viewMode === 'canvas' ? 'outline' : 'canvas')}
                    title="Chuyển đổi giao diện Sơ đồ / Dàn ý"
                    style={{ background: 'rgba(255, 226, 89, 0.1)', color: 'var(--fc-gold)', border: '1px solid rgba(255, 226, 89, 0.2)' }}
                  >
                    {viewMode === 'canvas' ? '📋 Dàn ý' : '🧠 Sơ đồ'}
                  </button>

                  {/* Fullscreen Toggle */}
                  <button 
                    className="canvas-action-pill" 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? "Hiện Sidebar" : "Chế độ tập trung (Ẩn Sidebar)"}
                  >
                    {isFullscreen ? '🔍 Hiện Sidebar' : '🧘 Tập trung'}
                  </button>



                  {autosaveStatus && (
                    <span 
                      style={{ 
                        fontSize: '11.5px', 
                        color: autosaveStatus === 'saving' ? '#fbbf24' : '#34d399', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        background: autosaveStatus === 'saving' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(52, 211, 153, 0.1)', 
                        padding: '6px 12px', 
                        borderRadius: '20px',
                        border: autosaveStatus === 'saving' ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(52, 211, 153, 0.2)',
                        fontWeight: '600',
                        marginRight: '4px'
                      }}
                    >
                      {autosaveStatus === 'saving' ? '⏳ Đang tự động lưu...' : '✅ Đã lưu tự động'}
                    </span>
                  )}

                  <button 
                    className="canvas-action-pill" 
                    onClick={handleSaveMindmap} 
                    title="Lưu sơ đồ tư duy vào thư viện"
                  >
                    <HiSave /> Lưu
                  </button>
                  {activeMindmapDbId && (
                    <button 
                      className="canvas-action-pill" 
                      onClick={handleShareMindmap} 
                      title="Sao chép liên kết chia sẻ công khai"
                      style={{ background: 'rgba(255, 226, 89, 0.1)', color: 'var(--fc-gold)', border: '1px solid rgba(255, 226, 89, 0.2)' }}
                    >
                      🔗 Chia sẻ
                    </button>
                  )}
                  <div className="canvas-export-dropdown">
                    <button className="canvas-action-pill">
                      <HiDownload /> Xuất sơ đồ
                    </button>
                    <div className="canvas-export-menu">
                      <button onClick={handleExportSvg}>Xuất file SVG ảnh</button>
                      <button onClick={handleExportPng}>Xuất file PNG ảnh</button>
                      <button onClick={handleExportJson}>Xuất file JSON</button>
                    </div>
                  </div>
                </>
              )}
              
            </div>
          </div>

          {/* Interactive SVG Canvas or Outline view */}
          {viewMode === 'outline' ? (
            <div className="aitutor-outline-view animate-in">
              <div className="outline-card">
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--mm-gold)', borderBottom: '1px solid var(--mm-border-dark)', paddingBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📋 DÀN Ý KIẾN THỨC HỆ THỐNG HÓA
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleExpandAllOutline}
                      style={{ background: 'rgba(255, 210, 52, 0.12)', border: '1px solid rgba(255, 210, 52, 0.3)', color: 'var(--mm-gold)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}
                      title="Mở rộng toàn bộ các cấp độ dàn ý"
                    >
                      👐 Mở rộng hết
                    </button>
                    <button 
                      onClick={handleCollapseAllOutline}
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}
                      title="Thu gọn các cấp độ nhánh con"
                    >
                      📁 Thu gọn hết
                    </button>
                  </div>
                </div>
                {mindmapData ? renderOutlineNode(mindmapData) : (
                  <div style={{ textAlign: 'center', color: 'var(--mm-text-secondary)', fontSize: '13px', padding: '20px' }}>
                    Nhập tài liệu ở cột trái để bắt đầu lập sơ đồ
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="aitutor-canvas-container"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{ cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}
            >
              {mindmapData ? (
                <svg 
                  ref={svgRef}
                  className="aitutor-svg"
                  width="100%"
                  height="100%"
                >
                  {/* Background grid representation */}
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" data-canvas-bg="true" />

                  {/* Transform group with zoom/pan vector */}
                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {renderedLinks}
                    {renderedNodes}
                  </g>
                </svg>
              ) : (
                <div className="aitutor-canvas-empty">
                  <p>Nhập tài liệu ở cột trái để bắt đầu lập sơ đồ tư duy</p>
                </div>
              )}

              {/* Floating Zoom & Tool Controls bar */}
              {mindmapData && (
                <div className="aitutor-canvas-controls">
                  <button className="control-btn" onClick={zoomIn} title="Phóng to (Scroll Up)">
                    <HiPlus />
                  </button>
                  <button className="control-btn" onClick={zoomOut} title="Thu nhỏ (Scroll Down)">
                    <HiMinus />
                  </button>
                  <button className="control-btn" onClick={resetZoom} title="Mặc định / Căn giữa">
                    <HiRefresh /> Căn giữa
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right slide-in drawer details & AI mini-chat */}
        {selectedNode && (
          <aside className="aitutor-drawer animate-in-right">
            {/* Header */}
            <div className="aitutor-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {selectedNode.depth === 0 ? '👑' : (selectedNode.depth === 1 ? '🎯' : '💡')}
                </span>
                <span className="drawer-depth-tag">
                  {selectedNode.depth === 0 ? 'Chủ đề gốc' : (selectedNode.depth === 1 ? 'Chủ đề cấp 1' : 'Chi tiết cấp 2')}
                </span>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedNode(null)}>
                <HiX />
              </button>
            </div>

            {/* Content Body scrollable */}
            <div ref={drawerBodyRef} className="aitutor-drawer-body">
              {/* Node Title & Description with CRUD Edits */}
              <div className="drawer-section">
                {!isEditingNode ? (
                  // VIEW MODE
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                      {selectedNode.name}
                    </h3>
                    <div style={{ 
                      fontSize: '12.5px', 
                      color: 'rgba(255,255,255,0.75)', 
                      lineHeight: '1.55', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.07)', 
                      borderRadius: '12px', 
                      padding: '12px', 
                      minHeight: '40px',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedNode.description || "Nút kiến thức này chưa có mô tả chi tiết."}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button 
                        className="flashcard-header-btn" 
                        onClick={() => setIsEditingNode(true)}
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', fontSize: '11.5px', cursor: 'pointer', borderRadius: '8px', flex: 1, fontWeight: '700' }}
                      >
                        ✏️ Chỉnh sửa
                      </button>
                      {selectedNode.id !== '0' && (
                        <button 
                          className="flashcard-header-btn" 
                          onClick={handleDeleteNode}
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', fontSize: '11.5px', cursor: 'pointer', borderRadius: '8px', fontWeight: '700' }}
                          title="Xóa nút này"
                        >
                          🗑️ Xóa
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // EDIT MODE
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="flashcard-modal-label" style={{ marginBottom: '4px', display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Tên nút sơ đồ</label>
                      <input 
                        type="text"
                        className="flashcard-modal-input"
                        style={{ background: '#141410', width: '100%', fontSize: '13.5px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', height: '36px', padding: '0 10px', boxSizing: 'border-box', color: '#ffffff' }}
                        value={editNodeName}
                        onChange={(e) => setEditNodeName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="flashcard-modal-label" style={{ marginBottom: '4px', display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Mô tả chi tiết</label>
                      <textarea 
                        className="flashcard-modal-textarea"
                        style={{ background: '#141410', width: '100%', fontSize: '12.5px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 10px', boxSizing: 'border-box', color: '#ffffff' }}
                        value={editNodeDesc}
                        onChange={(e) => setEditNodeDesc(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="flashcard-modal-label" style={{ marginBottom: '4px', display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Hình dạng nút</label>
                      <select 
                        className="flashcard-modal-input"
                        style={{ background: '#141410', width: '100%', fontSize: '13px', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', height: '36px', borderRadius: '10px', padding: '0 8px', boxSizing: 'border-box' }}
                        value={editNodeShape}
                        onChange={(e) => setEditNodeShape(e.target.value)}
                      >
                        <option value="oval">Hình Bầu Dục (Oval)</option>
                        <option value="rectangle">Hình Chữ Nhật (Rectangle)</option>
                        <option value="circle">Hình Tròn (Circle)</option>
                        <option value="rhombus">Hình Thoi (Rhombus)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button 
                        className="flashcard-header-btn" 
                        onClick={async () => {
                          await handleUpdateNode();
                          setIsEditingNode(false);
                        }}
                        style={{ background: 'var(--mm-gold)', color: '#12120e', border: 'none', padding: '8px 12px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', flex: 1, borderRadius: '8px' }}
                      >
                        Lưu lại
                      </button>
                      <button 
                        className="flashcard-header-btn" 
                        onClick={() => {
                          setEditNodeName(selectedNode.name || '');
                          setEditNodeDesc(selectedNode.description || '');
                          setEditNodeShape(selectedNode.shape || 'oval');
                          setIsEditingNode(false);
                        }}
                        style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 12px', fontSize: '11.5px', cursor: 'pointer', borderRadius: '8px' }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '16px', paddingTop: '12px' }}>
                  <label className="flashcard-modal-label" style={{ marginBottom: '6px', display: 'block', fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>Trạng thái học tập</label>
                  <div className="status-tagger-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button 
                      type="button"
                      className={`status-tag-pill ${selectedNode.status === 'none' || !selectedNode.status ? 'status-tag-pill--active' : ''}`}
                      onClick={() => handleUpdateNodeStatus('none')}
                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: selectedNode.status === 'none' || !selectedNode.status ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#ffffff', cursor: 'pointer' }}
                    >
                      ⚪ Chưa học
                    </button>
                    <button 
                      type="button"
                      className={`status-tag-pill ${selectedNode.status === 'learning' ? 'status-tag-pill--active' : ''}`}
                      onClick={() => handleUpdateNodeStatus('learning')}
                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', background: selectedNode.status === 'learning' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: '#f59e0b', cursor: 'pointer' }}
                    >
                      ⚡ Đang học
                    </button>
                    <button 
                      type="button"
                      className={`status-tag-pill ${selectedNode.status === 'learned' ? 'status-tag-pill--active' : ''}`}
                      onClick={() => handleUpdateNodeStatus('learned')}
                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', background: selectedNode.status === 'learned' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: '#10b981', cursor: 'pointer' }}
                    >
                      ✓ Đã hiểu
                    </button>
                    <button 
                      type="button"
                      className={`status-tag-pill ${selectedNode.status === 'review' ? 'status-tag-pill--active' : ''}`}
                      onClick={() => handleUpdateNodeStatus('review')}
                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: selectedNode.status === 'review' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >
                      ⏳ Cần ôn lại
                    </button>
                    <button 
                      type="button"
                      className={`status-tag-pill ${selectedNode.status === 'important' ? 'status-tag-pill--active' : ''}`}
                      onClick={() => handleUpdateNodeStatus('important')}
                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid rgba(217, 70, 239, 0.3)', background: selectedNode.status === 'important' ? 'rgba(217, 70, 239, 0.2)' : 'transparent', color: '#d946ef', cursor: 'pointer' }}
                    >
                      ⭐ Quan trọng
                    </button>
                  </div>
                </div>
              </div>

              {/* Practice & Progress stats and quiz trigger */}
              <div className="drawer-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '16px' }}>
                <h4 className="drawer-chat-title" style={{ marginBottom: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎯 Luyện tập trắc nghiệm
                </h4>
                
                {/* Stats cards grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#ffffff' }}>Độ thành thạo</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: nodeProgressMap[selectedNode.id]?.mastery !== undefined
                        ? (nodeProgressMap[selectedNode.id].mastery >= 0.9 ? '#10B981' : nodeProgressMap[selectedNode.id].mastery >= 0.8 ? '#3B82F6' : nodeProgressMap[selectedNode.id].mastery >= 0.6 ? '#EAB308' : nodeProgressMap[selectedNode.id].mastery >= 0.4 ? '#F97316' : '#EF4444')
                        : '#ffffff'
                    }}>
                      {nodeProgressMap[selectedNode.id]?.mastery !== undefined
                        ? `${Math.round(nodeProgressMap[selectedNode.id].mastery * 100)}%`
                        : 'Chưa học'
                      }
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#ffffff' }}>Điểm cao nhất</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--fc-gold)' }}>
                      {nodeProgressMap[selectedNode.id]?.bestScore !== undefined
                        ? `${nodeProgressMap[selectedNode.id].bestScore}/10`
                        : '- / 10'
                      }
                    </div>
                  </div>
                </div>

                <button 
                  className="aitutor-action-btn" 
                  onClick={handleStartNodeQuiz}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '12.5px',
                    background: 'linear-gradient(135deg, #F97316, #FFE259)',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '800',
                    color: '#12120e',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <HiSparkles /> Bắt đầu Quiz 10 câu
                </button>
              </div>

              {/* Add Child Node Form */}
              <div className="drawer-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '16px' }}>
                <h4 className="drawer-chat-title" style={{ marginBottom: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ➕ Thêm ý con nhanh
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text"
                    className="flashcard-modal-input"
                    style={{ flex: 1, background: '#141410', fontSize: '12.5px', padding: '8px 12px', height: '38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box', color: '#ffffff' }}
                    placeholder="Thêm ý con nhanh..."
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newChildName.trim()) {
                        handleAddChildNode();
                      }
                    }}
                  />
                  <button 
                    className="aitutor-action-btn"
                    style={{ width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'var(--mm-gold)', border: 'none', cursor: 'pointer' }}
                    onClick={handleAddChildNode}
                    disabled={!newChildName.trim()}
                  >
                    <HiPlus style={{ fontSize: '18px', color: '#12120e' }} />
                  </button>
                </div>
              </div>

              {/* Contextual Q&A Section */}
              <div className="drawer-section drawer-chat-container">
                <h4 className="drawer-chat-title">
                  <HiChat style={{ marginRight: '6px', fontSize: '16px' }} />
                  Hỏi AI về nội dung này
                </h4>
                
                {/* Message Log */}
                <div className="drawer-chat-log">
                  <div className="drawer-msg drawer-msg--bot">
                    <div className="drawer-bubble">
                      Chào bạn! Có điểm lý thuyết nào ở phần <strong>{selectedNode.name}</strong> khiến bạn băn khoăn không? Hãy chọn câu hỏi gợi ý bên dưới hoặc tự đặt câu hỏi để mình giải đáp nhé!
                    </div>
                  </div>

                  {/* Log mapping */}
                  {nodeChatMessages[selectedNode.id]?.map((msg, idx) => (
                    <div key={idx} className={`drawer-msg drawer-msg--${msg.sender}`}>
                      <div className="drawer-bubble">
                        {msg.text.split('\n').map((line, lineIdx) => (
                          <div key={lineIdx}>{line}</div>
                        ))}
                      </div>
                      <span className="drawer-msg-time">{msg.time}</span>
                    </div>
                  ))}

                  {/* AI thinking state */}
                  {isNodeChatTyping && (
                    <div className="drawer-msg drawer-msg--bot">
                      <div className="drawer-bubble drawer-bubble--typing">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* Pre-defined Chips */}
                <div className="drawer-chat-chips">
                  <button 
                    onClick={() => handleSendNodeQuestion("Giải thích chi tiết hơn cho em phần kiến thức này")}
                    disabled={isNodeChatTyping}
                  >
                    🔍 Giải thích sâu
                  </button>
                  <button 
                    onClick={() => handleSendNodeQuestion("Cho em xin 2 ví dụ thực tế liên quan")}
                    disabled={isNodeChatTyping}
                  >
                    💡 Ví dụ cụ thể
                  </button>
                  <button 
                    onClick={() => handleSendNodeQuestion("Tạo 2 câu hỏi trắc nghiệm nhanh để ôn luyện phần này")}
                    disabled={isNodeChatTyping}
                  >
                    ✏️ Luyện tập nhanh
                  </button>
                </div>

                {/* Question Input */}
                <div className="drawer-chat-input-bar">
                  <input
                    type="text"
                    placeholder="Hỏi AI thêm về phần này..."
                    value={nodeChatInput}
                    onChange={(e) => setNodeChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendNodeQuestion()}
                    disabled={isNodeChatTyping}
                  />
                  <button 
                    onClick={() => handleSendNodeQuestion()}
                    disabled={isNodeChatTyping || !nodeChatInput.trim()}
                  >
                    <HiPlay />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Quiz Modal overlay */}
      {isQuizModalOpen && (
        <div className="mm-modal-overlay animate-in">
          <div className="mm-modal-card mm-quiz-modal">
            {/* Header */}
            <div className="mm-modal-header">
              <h3 className="mm-modal-title">
                🎯 Luyện tập: {selectedNode?.name}
              </h3>
              <button 
                className="mm-modal-close" 
                onClick={() => {
                  if (quizSubmitted || confirm("Bạn đang làm dở bài quiz. Bạn có chắc chắn muốn thoát?")) {
                    setIsQuizModalOpen(false);
                  }
                }}
              >
                <HiX />
              </button>
            </div>

            {/* Body */}
            <div className="mm-modal-body">
              {quizLoading ? (
                <div className="mm-quiz-loading-container">
                  <span className="spinner-secondary mm-quiz-spinner" />
                  <p className="mm-quiz-loading-text">
                    EduPath AI đang biên tập 10 câu hỏi trắc nghiệm bám sát cấu trúc đề thi THPT Quốc gia...
                  </p>
                  <p className="mm-quiz-loading-sub">Vui lòng chờ trong giây lát (khoảng 5-10 giây)</p>
                </div>
              ) : quizQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#ffffff' }}>
                  Không thể tải câu hỏi trắc nghiệm. Hãy đóng modal và thử lại.
                </div>
              ) : (
                <>
                  {/* Progress Header / Sequential Nav */}
                  {!quizSubmitted && (
                    <div className="mm-quiz-progress-bar">
                      <div className="mm-quiz-progress-text">
                        <span>Câu hỏi {currentQuestionIdx + 1} / {quizQuestions.length}</span>
                        <span>Đã trả lời: {Object.keys(selectedAnswers).length} / {quizQuestions.length}</span>
                      </div>
                      <div className="mm-quiz-progress-track">
                        <div 
                          className="mm-quiz-progress-fill" 
                          style={{ width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Sequential Question View */}
                  {!quizSubmitted ? (
                    <div className="mm-quiz-question-container">
                      <h4 className="mm-quiz-question-text">
                        {quizQuestions[currentQuestionIdx]?.questionText}
                      </h4>
                      
                      <div className="mm-quiz-options-grid">
                        {(quizQuestions[currentQuestionIdx]?.options || []).map((option, idx) => {
                          const isSelected = selectedAnswers[quizQuestions[currentQuestionIdx].id] === idx;
                          return (
                            <button
                              key={idx}
                              className={`mm-quiz-option-btn ${isSelected ? 'mm-quiz-option-btn--selected' : ''}`}
                              onClick={() => handleSelectQuizOption(quizQuestions[currentQuestionIdx].id, idx)}
                            >
                              <span className="option-label">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="option-text">{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Navigation buttons */}
                      <div className="mm-quiz-navigation">
                        <button
                          className="mm-quiz-nav-btn"
                          disabled={currentQuestionIdx === 0}
                          onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                        >
                          <HiChevronLeft /> Câu trước
                        </button>
                        
                        {currentQuestionIdx < quizQuestions.length - 1 ? (
                          <button
                            className="mm-quiz-nav-btn"
                            onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                          >
                            Câu tiếp <HiChevronRight />
                          </button>
                        ) : (
                          <button
                            className="mm-quiz-submit-btn"
                            onClick={handleSubmitQuiz}
                          >
                            <HiSparkles /> Nộp bài & Xem kết quả
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Quiz Results Dashboard & Review */
                    <div className="mm-quiz-results-container">
                      {/* Score circle & details */}
                      <div className="mm-quiz-score-card">
                        <div className="score-circle">
                          <span className="score-num">{quizResult?.score}</span>
                          <span className="score-total">/10</span>
                        </div>
                        <div className="score-details">
                          <h4>
                            {quizResult?.score >= 9 ? '🏆 Xuất sắc!' : quizResult?.score >= 8 ? '🌟 Rất tốt!' : quizResult?.score >= 6 ? '👍 Khá' : quizResult?.score >= 4 ? '⚠️ Cần cải thiện' : '❌ Yếu'}
                          </h4>
                          <p>
                            Độ thành thạo cập nhật: <strong>{Math.round((quizResult?.mastery || 0) * 100)}%</strong>
                          </p>
                          <p style={{ fontSize: '11px', color: '#ffffff' }}>
                            Thời gian hoàn thành: {quizResult?.completionTime || 0} giây
                          </p>
                        </div>
                      </div>

                      {/* Question Corrections Review List */}
                      <div className="mm-quiz-review-section">
                        <h4 className="review-title">Xem lại đáp án chi tiết</h4>
                        <div className="review-list">
                          {quizQuestions.map((q, idx) => {
                            const correction = quizResult?.corrections?.find(c => c.questionId === q.id) || {};
                            const userAns = correction.selectedOption;
                            const correctAns = correction.correctOption;
                            const isCorrect = correction.isCorrect;

                            return (
                              <div key={q.id} className={`review-item ${isCorrect ? 'review-item--correct' : 'review-item--incorrect'}`}>
                                <div className="review-question-header">
                                  <span className={`review-status-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}`}>
                                    {isCorrect ? 'Đúng' : 'Sai'}
                                  </span>
                                  <h5>Câu {idx + 1}: {q.questionText}</h5>
                                </div>
                                <div className="review-options-list">
                                  {(q.options || []).map((opt, oIdx) => {
                                    let classSuffix = '';
                                    if (oIdx === correctAns) classSuffix = '--correct';
                                    else if (oIdx === userAns && !isCorrect) classSuffix = '--user-incorrect';

                                    return (
                                      <div key={oIdx} className={`review-option-item${classSuffix}`}>
                                        <span className="opt-label">{String.fromCharCode(65 + oIdx)}</span>
                                        <span className="opt-text">{opt}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="review-explanation">
                                  <strong>💡 Giải thích chi tiết:</strong>
                                  <p>{correction.explanation || q.explanation}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mm-quiz-results-footer">
                        <button 
                          className="mm-quiz-action-btn-secondary" 
                          onClick={() => {
                            setIsQuizModalOpen(false);
                          }}
                        >
                          Quay lại sơ đồ
                        </button>
                        <button 
                          className="mm-quiz-action-btn-primary" 
                          onClick={() => handleStartNodeQuiz(true)}
                        >
                          <HiRefresh /> Luyện tập lại
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exam Upload & Analyse Modal */}
      {isExamModalOpen && (
        <div className="mm-modal-overlay animate-in" onDragOver={handleExamDragOver} onDragLeave={handleExamDragLeave} onDrop={handleExamDrop}>
          <div className="mm-modal-card mm-exam-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="mm-modal-header">
              <h3 className="mm-modal-title">
                📝 Lập sơ đồ cấu trúc đề thi bằng AI
              </h3>
              <button 
                className="mm-modal-close" 
                onClick={() => {
                  if (!examAnalysisLoading) setIsExamModalOpen(false);
                }}
              >
                <HiX />
              </button>
            </div>

            {/* Body */}
            <div className="mm-modal-body">
              {examAnalysisLoading ? (
                <div className="mm-quiz-loading-container">
                  <span className="spinner-secondary mm-quiz-spinner" />
                  <p className="mm-quiz-loading-text">
                    EduPath AI đang đọc đề thi, phân loại các dạng toán, ước lượng trọng số điểm và thiết lập sơ đồ...
                  </p>
                  <p className="mm-quiz-loading-sub">Quá trình này có thể mất 15-20 giây. Vui lòng không đóng cửa sổ.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Title Input */}
                  <div>
                    <label className="flashcard-modal-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>
                      Tiêu đề sơ đồ / Tên đề thi:
                    </label>
                    <input 
                      type="text" 
                      className="flashcard-modal-input"
                      placeholder="Ví dụ: Đề thi thử THPT Quốc gia môn Toán 2026 - Chuyên KHTN"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      style={{ background: '#141410', width: '100%', padding: '10px 12px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* File Upload drag/drop zone */}
                  <div>
                    <label className="flashcard-modal-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>
                      Tải đề thi lên (Hỗ trợ PDF, DOCX, Ảnh, Text):
                    </label>
                    <div 
                      className={`aitutor-dropzone ${examUploadLoading ? 'aitutor-dropzone--active' : ''} ${isDraggingExamFile ? 'aitutor-dropzone--dragging' : ''}`}
                      onClick={() => !examUploadLoading && examFileInputRef.current?.click()}
                      style={{ padding: '28px 16px' }}
                    >
                      <input 
                        type="file" 
                        ref={examFileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleExamUpload(file);
                        }}
                        accept="image/*,text/plain,.txt,.md,application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        style={{ display: 'none' }} 
                      />
                      {examUploadLoading ? (
                        <>
                          <span className="unique-loader" />
                          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--mm-gold)' }}>
                            Đang trích xuất nội dung đề thi (OCR)...
                          </p>
                        </>
                      ) : (
                        <>
                          <HiUpload className="aitutor-dropzone-icon" />
                          <p className="aitutor-dropzone-title">Kéo thả đề thi vào đây hoặc click để chọn file</p>
                          <p className="aitutor-dropzone-desc">File PDF, Word (.docx), Ảnh đề thi hoặc file văn bản ghi chú</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Raw Exam Text / Extracted Text Review Area */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="flashcard-modal-label" style={{ fontSize: '12px' }}>
                        Nội dung văn bản đề thi (Xem/chỉnh sửa trực tiếp):
                      </label>
                      {examFileUrl && (
                        <span style={{ fontSize: '11px', color: 'var(--mm-gold)' }}>
                          ✓ Trích xuất từ file thành công
                        </span>
                      )}
                    </div>
                    <textarea
                      className="aitutor-textarea"
                      placeholder="Dán nội dung đề thi của bạn vào đây nếu không tải tệp lên. Càng chi tiết thì AI phân loại càng chuẩn..."
                      value={examText}
                      onChange={(e) => setExamText(e.target.value)}
                      style={{ minHeight: '140px', background: '#141410', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Trigger Button */}
                  <button
                    className="aitutor-action-btn"
                    onClick={handleAnalyzeExam}
                    disabled={!examText.trim() || examAnalysisLoading}
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      fontSize: '13px',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🚀 Bắt đầu Phân tích cấu trúc & Lập sơ đồ
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
