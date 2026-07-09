import { useState, useEffect, useRef } from 'react';
import { toast } from '../utils/toast';
import { 
  HiChartBar, 
  HiBookOpen, 
  HiClipboardCheck, 
  HiUsers, 
  HiCollection, 
  HiTrendingUp, 
  HiTerminal, 
  HiGlobeAlt, 
  HiAdjustments,
  HiPlus,
  HiTrash,
  HiPencil,
  HiSearch,
  HiArrowLeft,
  HiShieldCheck,
  HiCurrencyDollar,
  HiAcademicCap,
  HiChevronDown
} from 'react-icons/hi';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';
import { mockExamService } from '../services/mockExamService';
import Header from './Header';
import AdminExamManager from './AdminExamManager';

// Custom Neo-Brutalist Select component with rounded corners and theme support
const NeoSelect = ({ value, onChange, options, placeholder = 'Chọn...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="neo-select-container">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="neo-select-trigger"
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <HiChevronDown style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.2s', 
          fontSize: '16px',
          flexShrink: 0
        }} />
      </div>

      {isOpen && (
        <div className="neo-select-options">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`neo-select-option ${opt.value === value ? 'selected' : ''}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const financeData = [
  { name: 'Tháng 1', revenue: 15.4 },
  { name: 'Tháng 2', revenue: 22.8 },
  { name: 'Tháng 3', revenue: 35.1 },
  { name: 'Tháng 4', revenue: 48.6 },
  { name: 'Tháng 5', revenue: 64.2 }
];

// Default seeded books recommendations
const initialBooks = [
  {
    id: 1,
    title: "Bộ đề ôn luyện THPTQG môn Toán 2026",
    author: "Thầy Thế Anh",
    coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200",
    description: "Tổng hợp 20 đề thi thử bám sát cấu trúc mới nhất của Bộ GD&ĐT kèm giải chi tiết và kỹ thuật bấm máy nhanh.",
    price: "129.000đ",
    link: "https://shopee.vn"
  },
  {
    id: 2,
    title: "Chinh phục Ngữ pháp Tiếng Anh THPTQG",
    author: "Cô Quỳnh Chi",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200",
    description: "Hệ thống hóa toàn bộ kiến thức ngữ pháp trọng tâm và các phương pháp giải nhanh điểm 9+.",
    price: "99.000đ",
    link: "https://tiki.vn"
  },
  {
    id: 3,
    title: "Sổ tay công thức nhanh Vật Lý 12",
    author: "Cô Thu Hương",
    coverUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=200",
    description: "Tóm gọn toàn bộ công thức cốt lõi và các dạng bài tập chuyên đề dao động, sóng cơ, sóng điện từ.",
    price: "79.000đ",
    link: "https://shopee.vn"
  }
];

// Default seeded leads
const initialLeads = [
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

export default function AdminDashboard({
  users,
  onToggleUserBan,
  onApproveTeacher,
  courseApprovals = [],
  onApproveCourse,
  onRejectCourse,
  onSendAnnouncement,
  systemLogs = [],
  addLog,
  navigateTo,
  submissions = [],
  leadsList = [],
  setLeadsList,
  featureFlags = [],
  setFeatureFlags,
  
  // Header Props
  currentUser,
  theme,
  onToggleTheme,
  notifications,
  onClearNotifications,
  onLogout,
  onChangePassword,
  onNavigateSettings,
  cartCourse,
  onCheckoutCourse,

  // Tab Sync Props
  activeTab: propActiveTab = 'stats',
  setActiveTab: propSetActiveTab
}) {
  // Sidebar tabs state (sync'ed with prop)
  const [activeTab, setActiveTabState] = useState(propActiveTab || 'stats');
  
  useEffect(() => {
    if (propActiveTab) {
      setActiveTabState(propActiveTab);
    }
  }, [propActiveTab]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (propSetActiveTab) {
      propSetActiveTab(tab);
    }
  };

  // --- NOTIFICATION CENTER STATES ---
  const [notifSubTab, setNotifSubTab] = useState('send'); // 'send', 'history', 'templates'
  const [notifHistory, setNotifHistory] = useState([]);
  const [notifHistoryTotal, setNotifHistoryTotal] = useState(0);
  const [notifHistoryPage, setNotifHistoryPage] = useState(1);
  const [notifHistoryLoading, setNotifHistoryLoading] = useState(false);

  const [notifTemplates, setNotifTemplates] = useState([]);
  const [notifTemplatesLoading, setNotifTemplatesLoading] = useState(false);

  // Send Notification Form states
  const [notifSendTarget, setNotifSendTarget] = useState('all'); // 'all', 'role', 'user'
  const [notifSendRole, setNotifSendRole] = useState('STUDENT');
  const [notifSendUserId, setNotifSendUserId] = useState('');
  const [notifSendMode, setNotifSendMode] = useState('raw'); // 'raw', 'template'
  const [notifSendTemplateCode, setNotifSendTemplateCode] = useState('');
  const [notifSendTitle, setNotifSendTitle] = useState('');
  const [notifSendMessage, setNotifSendMessage] = useState('');
  const [notifSendType, setNotifSendType] = useState('INFO');
  const [notifSendCategory, setNotifSendCategory] = useState('SYSTEM');
  const [notifSendLink, setNotifSendLink] = useState('');
  const [notifSendVariables, setNotifSendVariables] = useState(''); // JSON string or comma separated k=v
  const [notifSending, setNotifSending] = useState(false);

  // Template CRUD Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // null means creating
  const [templateFormCode, setTemplateFormCode] = useState('');
  const [templateFormTitle, setTemplateFormTitle] = useState('');
  const [templateFormMessage, setTemplateFormMessage] = useState('');
  const [templateFormType, setTemplateFormType] = useState('INFO');
  const [templateFormCategory, setTemplateFormCategory] = useState('SYSTEM');
  const [templateFormIcon, setTemplateFormIcon] = useState('');
  const [templateFormLink, setTemplateFormLink] = useState('');
  const [templateFormActive, setTemplateFormActive] = useState(true);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  // Fetch Sent Notification History
  const fetchNotifHistory = async (page = 1) => {
    setNotifHistoryLoading(true);
    try {
      const res = await api.adminGetSentNotifications({ page, limit: 15 });
      if (res?.success && res.data) {
        setNotifHistory(res.data.history);
        setNotifHistoryTotal(res.data.pagination.total);
        setNotifHistoryPage(res.data.pagination.page);
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi tải lịch sử thông báo!', 'error');
    } finally {
      setNotifHistoryLoading(false);
    }
  };

  // Fetch Notification Templates
  const fetchNotifTemplates = async () => {
    setNotifTemplatesLoading(true);
    try {
      const res = await api.adminGetTemplates();
      if (res?.success && res.data) {
        setNotifTemplates(res.data);
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi tải danh sách mẫu thông báo!', 'error');
    } finally {
      setNotifTemplatesLoading(false);
    }
  };

  // Fetch data on tab changes
  useEffect(() => {
    if (activeTab === 'announcements') {
      if (notifSubTab === 'history') {
        fetchNotifHistory(1);
      } else if (notifSubTab === 'templates') {
        fetchNotifTemplates();
      }
    }
  }, [activeTab, notifSubTab]);

  // Handle Send Notification Submit
  const handleAdminSendNotification = async (e) => {
    e.preventDefault();
    if (notifSending) return;

    let parsedVars = {};
    if (notifSendMode === 'template' && notifSendVariables.trim()) {
      try {
        parsedVars = JSON.parse(notifSendVariables);
      } catch (err) {
        notifSendVariables.split(',').forEach(line => {
          const parts = line.split('=');
          if (parts.length >= 2) {
            parsedVars[parts[0].trim()] = parts.slice(1).join('=').trim();
          }
        });
      }
    }

    const payload = {
      target: notifSendTarget,
      userId: notifSendTarget === 'user' ? Number(notifSendUserId) : undefined,
      role: notifSendTarget === 'role' ? notifSendRole : undefined,
      title: notifSendMode === 'raw' ? notifSendTitle : undefined,
      message: notifSendMode === 'raw' ? notifSendMessage : undefined,
      type: notifSendMode === 'raw' ? notifSendType : undefined,
      category: notifSendMode === 'raw' ? notifSendCategory : undefined,
      templateCode: notifSendMode === 'template' ? notifSendTemplateCode : undefined,
      variables: notifSendMode === 'template' ? parsedVars : undefined,
      link: notifSendLink.trim() || undefined
    };

    setNotifSending(true);
    try {
      const res = await api.adminSendNotification(payload);
      if (res?.success) {
        toast('Đã gửi thông báo thành công!', 'success');
        setNotifSendUserId('');
        setNotifSendTitle('');
        setNotifSendMessage('');
        setNotifSendLink('');
        setNotifSendVariables('');
        if (notifSubTab === 'history') {
          fetchNotifHistory(1);
        }
      }
    } catch (err) {
      toast(err.message || 'Lỗi gửi thông báo!', 'error');
    } finally {
      setNotifSending(false);
    }
  };

  // Handle Save Template (Create/Edit)
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (templateSubmitting) return;

    const payload = {
      code: editingTemplate ? undefined : templateFormCode.toUpperCase().trim(),
      title: templateFormTitle.trim(),
      message: templateFormMessage.trim(),
      type: templateFormType,
      category: templateFormCategory,
      icon: templateFormIcon.trim() || null,
      defaultLink: templateFormLink.trim() || null,
      isActive: templateFormActive
    };

    setTemplateSubmitting(true);
    try {
      let res;
      if (editingTemplate) {
        res = await api.adminUpdateTemplate(editingTemplate.id, payload);
      } else {
        res = await api.adminCreateTemplate(payload);
      }

      if (res?.success) {
        toast(editingTemplate ? 'Cập nhật mẫu thành công!' : 'Tạo mới mẫu thành công!', 'success');
        setShowTemplateModal(false);
        fetchNotifTemplates();
      }
    } catch (err) {
      toast(err.message || 'Lỗi lưu mẫu thông báo!', 'error');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mẫu thông báo này?')) return;
    try {
      const res = await api.adminDeleteTemplate(id);
      if (res?.success) {
        toast('Đã xóa mẫu thông báo thành công!', 'success');
        fetchNotifTemplates();
      }
    } catch (err) {
      toast(err.message || 'Lỗi xóa mẫu thông báo!', 'error');
    }
  };

  // Open Template Modal for creation/editing
  const openTemplateModal = (tpl = null) => {
    setEditingTemplate(tpl);
    if (tpl) {
      setTemplateFormCode(tpl.code);
      setTemplateFormTitle(tpl.title);
      setTemplateFormMessage(tpl.message);
      setTemplateFormType(tpl.type);
      setTemplateFormCategory(tpl.category);
      setTemplateFormIcon(tpl.icon || '');
      setTemplateFormLink(tpl.defaultLink || '');
      setTemplateFormActive(tpl.isActive);
    } else {
      setTemplateFormCode('');
      setTemplateFormTitle('');
      setTemplateFormMessage('');
      setTemplateFormType('INFO');
      setTemplateFormCategory('SYSTEM');
      setTemplateFormIcon('');
      setTemplateFormLink('');
      setTemplateFormActive(true);
    }
    setShowTemplateModal(true);
  };

  // --- SYSTEM LOGS STATE ---
  const [systemLogsList, setSystemLogsList] = useState([]);
  const [systemLogsStats, setSystemLogsStats] = useState({
    totalToday: 0,
    loginToday: 0,
    adminToday: 0,
    systemToday: 0,
    aiErrorsToday: 0,
    paymentErrorsToday: 0
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsTypeFilter, setLogsTypeFilter] = useState('ALL'); // ALL, LOGIN, ADMIN, SYSTEM
  const [logsLevelFilter, setLogsLevelFilter] = useState('ALL'); // ALL, INFO, WARNING, ERROR, CRITICAL
  const [logsModuleFilter, setLogsModuleFilter] = useState('ALL');
  const [logsFromDate, setLogsFromDate] = useState('');
  const [logsToDate, setLogsToDate] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [showLogDetailDrawer, setShowLogDetailDrawer] = useState(false);

  const fetchLogsStats = async () => {
    try {
      const statsData = await api.getAdminLogsStatistics();
      if (statsData) {
        setSystemLogsStats(statsData);
      }
    } catch (err) {
      console.error('[AdminDashboard] Lỗi tải thống kê logs:', err);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setLogsLoading(true);
      const data = await api.getAdminLogs({
        page: 1,
        limit: 1000,
        search: logsSearch,
        type: logsTypeFilter,
        level: logsLevelFilter,
        module: logsModuleFilter,
        fromDate: logsFromDate,
        toDate: logsToDate
      });
      if (data) {
        setSystemLogsList(data.logs || []);
        setLogsTotalPages(1);
      }
    } catch (err) {
      console.error('[AdminDashboard] Lỗi tải danh sách logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'system-logs') {
      fetchLogsStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'system-logs') {
      fetchSystemLogs();
    }
  }, [activeTab, logsTypeFilter, logsLevelFilter, logsModuleFilter, logsFromDate, logsToDate]);

  // Debounced search logic for logs search input
  useEffect(() => {
    if (activeTab !== 'system-logs') return;
    const timer = setTimeout(() => {
      setLogsPage(1);
      fetchSystemLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [logsSearch]);

  const tabOptions = [
    { key: 'LOGIN', label: 'Nhật ký đăng nhập' },
    { key: 'ADMIN', label: 'Nhật ký quản trị' },
    { key: 'SYSTEM', label: 'Nhật ký hệ thống' }
  ];
  

  
  // Dynamic stats state from Supabase
  const [stats, setStats] = useState({
    kpi: {
      totalUsers: { value: 0, prevValue: 0, change: 0, description: 'Tài khoản đã đăng ký' },
      newUsersThisWeek: { value: 0, prevValue: 0, change: 0, description: 'Đăng ký trong 7 ngày qua' },
      totalAttempts: { value: 0, prevValue: 0, change: 0, description: 'Lượt thi thử THPTQG' },
      totalAiQuestions: { value: 0, prevValue: 0, change: 0, description: 'Câu hỏi gửi tới AI Coach' },
      revenue: { value: 0, prevValue: 0, change: 0, description: 'Doanh thu học phí kì này' }
    },
    attemptsChart: [],
    aiQuestionsChart: [],
    revenueChart: [],
    topStudents: []
  });
  
  const [timeFilter, setTimeFilter] = useState('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);

  const loadStats = async () => {
    if (activeTab === 'stats') {
      setLoadingStats(true);
      try {
        const { api } = await import('../api');
        const params = { filter: timeFilter };
        if (timeFilter === 'custom') {
          if (customStartDate) params.startDate = customStartDate;
          if (customEndDate) params.endDate = customEndDate;
        }
        const dbStats = await api.getAdminStats(params);
        if (dbStats) {
          setStats(dbStats);
        }
      } catch (err) {
        console.error('[AdminDashboard] Lỗi tải thống kê từ Supabase:', err);
      } finally {
        setLoadingStats(false);
      }
    }
  };

  useEffect(() => {
    loadStats();
  }, [activeTab, timeFilter, customStartDate, customEndDate]);


  // ────────────────────────────────────────────────────────────
  // New States and Handlers for User Management
  // ────────────────────────────────────────────────────────────
  // --- TEACHER MANAGEMENT MODULE STATE ---
  const [adminTeachers, setAdminTeachers] = useState([]);
  const [teacherPagination, setTeacherPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [teacherStats, setTeacherStats] = useState({ totalTeachers: 0, pendingProfiles: 0, approvedProfiles: 0, blockedTeachers: 0 });
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherProfileStatusFilter, setTeacherProfileStatusFilter] = useState('all');
  const [teacherAccountStatusFilter, setTeacherAccountStatusFilter] = useState('all');
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState('all');
  const [teacherPage, setTeacherPage] = useState(1);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetailLoading, setTeacherDetailLoading] = useState(false);
  const [showTeacherDetailModal, setShowTeacherDetailModal] = useState(false);

  const [teacherToBlock, setTeacherToBlock] = useState(null);
  const [teacherBlockReason, setTeacherBlockReason] = useState('');
  const [showTeacherBlockModal, setShowTeacherBlockModal] = useState(false);

  const [teacherToUnblock, setTeacherToUnblock] = useState(null);
  const [showTeacherUnblockModal, setShowTeacherUnblockModal] = useState(false);

  const [showRejectTeacherModal, setShowRejectTeacherModal] = useState(false);
  const [rejectTeacherReason, setRejectTeacherReason] = useState('');
  const [teacherToReject, setTeacherToReject] = useState(null);

  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    avatarUrl: '',
    subjects: '',
    degree: '',
    institution: '',
    experienceYears: '',
    bio: '',
    cvUrl: '',
    degreeUrl: '',
    certUrl: '',
    initialStatus: 'PENDING'
  });

  const fetchTeacherStats = async () => {
    try {
      const data = await api.getAdminTeacherStats();
      if (data) setTeacherStats(data);
    } catch (err) {
      toast(err.message || 'Lỗi tải thống kê giáo viên', 'error');
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const data = await api.getAdminTeachers({
        search: teacherSearch,
        status: teacherProfileStatusFilter,
        accountStatus: teacherAccountStatusFilter,
        subject: teacherSubjectFilter,
        page: teacherPage,
        limit: 10
      });
      if (data) {
        setAdminTeachers(data.teachers || []);
        setTeacherPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải danh sách giáo viên', 'error');
    } finally {
      setTeachersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeacherStats();
      fetchTeachers();
    }
  }, [activeTab, teacherSearch, teacherProfileStatusFilter, teacherAccountStatusFilter, teacherSubjectFilter, teacherPage]);

  const handleApproveTeacherSubmit = async (teacherId) => {
    try {
      await api.approveTeacherProfile(teacherId);
      toast('Phê duyệt hồ sơ giáo viên thành công!', 'success');
      addLog(`Phê duyệt hồ sơ giáo viên ID ${teacherId}`, 'sys');
      fetchTeacherStats();
      fetchTeachers();
      if (selectedTeacher && selectedTeacher.id === teacherId) {
        handleViewTeacherDetail(teacherId);
      }
    } catch (err) {
      toast(err.message || 'Duyệt hồ sơ thất bại', 'error');
    }
  };

  const handleOpenRejectTeacherModal = (teacher) => {
    setTeacherToReject(teacher);
    setRejectTeacherReason('');
    setShowRejectTeacherModal(true);
  };

  const handleRejectTeacherSubmit = async () => {
    if (!rejectTeacherReason.trim()) {
      toast('Vui lòng nhập lý do từ chối!', 'error');
      return;
    }
    try {
      await api.rejectTeacherProfile(teacherToReject.id, rejectTeacherReason);
      toast('Từ chối hồ sơ giáo viên thành công!', 'success');
      addLog(`Từ chối hồ sơ giáo viên ID ${teacherToReject.id} lý do: ${rejectTeacherReason}`, 'sys');
      setShowRejectTeacherModal(false);
      fetchTeacherStats();
      fetchTeachers();
      if (selectedTeacher && selectedTeacher.id === teacherToReject.id) {
        handleViewTeacherDetail(teacherToReject.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleBlockTeacherSubmit = async () => {
    if (!teacherBlockReason.trim()) {
      toast('Vui lòng nhập lý do khóa!', 'error');
      return;
    }
    try {
      await api.blockTeacher(teacherToBlock.id, teacherBlockReason);
      toast('Khóa tài khoản giáo viên thành công!', 'success');
      addLog(`Khóa tài khoản giáo viên ID ${teacherToBlock.id} lý do: ${teacherBlockReason}`, 'sys');
      setShowTeacherBlockModal(false);
      fetchTeacherStats();
      fetchTeachers();
      if (selectedTeacher && selectedTeacher.id === teacherToBlock.id) {
        handleViewTeacherDetail(teacherToBlock.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleUnblockTeacherSubmit = async () => {
    try {
      await api.unblockTeacher(teacherToUnblock.id);
      toast('Mở khóa tài khoản giáo viên thành công!', 'success');
      addLog(`Mở khóa tài khoản giáo viên ID ${teacherToUnblock.id}`, 'sys');
      setShowTeacherUnblockModal(false);
      fetchTeacherStats();
      fetchTeachers();
      if (selectedTeacher && selectedTeacher.id === teacherToUnblock.id) {
        handleViewTeacherDetail(teacherToUnblock.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleViewTeacherDetail = async (teacherId) => {
    try {
      setTeacherDetailLoading(true);
      setShowTeacherDetailModal(true);
      const data = await api.getTeacherDetail(teacherId);
      if (data) {
        setSelectedTeacher(data);
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải chi tiết hồ sơ', 'error');
    } finally {
      setTeacherDetailLoading(false);
    }
  };

  const handleCreateTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createTeacherAccount({
        email: newTeacherForm.email,
        fullName: newTeacherForm.name,
        password: newTeacherForm.password,
        phone: newTeacherForm.phone,
        dob: newTeacherForm.dateOfBirth,
        avatarUrl: newTeacherForm.avatarUrl,
        subjects: newTeacherForm.subjects,
        education: newTeacherForm.degree,
        university: newTeacherForm.institution,
        experienceYears: newTeacherForm.experienceYears,
        bio: newTeacherForm.bio,
        cvUrl: newTeacherForm.cvUrl,
        degreeUrl: newTeacherForm.degreeUrl,
        certificateUrl: newTeacherForm.certUrl,
        status: newTeacherForm.initialStatus
      });
      toast('Tạo tài khoản giáo viên thành công!', 'success');
      addLog(`Tạo tài khoản giáo viên mới: ${newTeacherForm.email}`, 'sys');
      setShowCreateTeacherModal(false);
      setNewTeacherForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        dateOfBirth: '',
        avatarUrl: '',
        subjects: '',
        degree: '',
        institution: '',
        experienceYears: '',
        bio: '',
        cvUrl: '',
        degreeUrl: '',
        certUrl: '',
        initialStatus: 'PENDING'
      });
      fetchTeacherStats();
      fetchTeachers();
    } catch (err) {
      toast(err.message || 'Tạo tài khoản thất bại', 'error');
    }
  };

  // --- COURSE MANAGEMENT STATE ---
  const [adminCourses, setAdminCourses] = useState([]);
  const [courseStats, setCourseStats] = useState({ totalCourses: 0, pendingCourses: 0, approvedCourses: 0, rejectedCourses: 0, hiddenCourses: 0, totalStudentsEnrolled: 0, totalRevenue: 0 });
  const [coursePagination, setCoursePagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSubjectFilter, setCourseSubjectFilter] = useState('all');
  const [courseStatusFilter, setCourseStatusFilter] = useState('all');
  const [courseVisibilityFilter, setCourseVisibilityFilter] = useState('all');
  const [coursePriceFrom, setCoursePriceFrom] = useState('');
  const [coursePriceTo, setCoursePriceTo] = useState('');
  const [courseFromDate, setCourseFromDate] = useState('');
  const [courseToDate, setCourseToDate] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);

  const [courseToReject, setCourseToReject] = useState(null);
  const [rejectCourseReason, setRejectCourseReason] = useState('');
  const [showRejectCourseModal, setShowRejectCourseModal] = useState(false);

  const [courseToHide, setCourseToHide] = useState(null);
  const [hideCourseReason, setHideCourseReason] = useState('');
  const [showHideCourseModal, setShowHideCourseModal] = useState(false);

  const [courseActiveTab, setCourseActiveTab] = useState('all');

  const fetchCourseStats = async () => {
    try {
      const data = await api.getAdminCoursesStats();
      if (data) setCourseStats(data);
    } catch (err) {
      toast(err.message || 'Lỗi tải thống kê khóa học', 'error');
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      let apiStatus = courseStatusFilter;
      let apiVisibility = courseVisibilityFilter;
      if (courseActiveTab === 'pending') {
        apiStatus = 'PENDING';
        apiVisibility = 'all';
      } else if (courseActiveTab === 'approved') {
        apiStatus = 'APPROVED';
        apiVisibility = 'all';
      } else if (courseActiveTab === 'rejected') {
        apiStatus = 'REJECTED';
        apiVisibility = 'all';
      } else if (courseActiveTab === 'hidden') {
        apiStatus = 'APPROVED';
        apiVisibility = 'HIDDEN';
      }

      const data = await api.getAdminCourses({
        search: courseSearch,
        subject: courseSubjectFilter,
        status: apiStatus,
        visibility: apiVisibility,
        priceFrom: coursePriceFrom,
        priceTo: coursePriceTo,
        fromDate: courseFromDate,
        toDate: courseToDate,
        page: coursePage,
        limit: 10
      });
      if (data) {
        setAdminCourses(data.courses || []);
        setCoursePagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải danh sách khóa học', 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourseStats();
      fetchCourses();
    }
  }, [activeTab, courseSearch, courseSubjectFilter, courseStatusFilter, courseVisibilityFilter, coursePriceFrom, coursePriceTo, courseFromDate, courseToDate, coursePage, courseActiveTab]);

  const handleApproveCourseSubmit = async (courseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt khóa học này phát hành công khai không?')) return;
    try {
      await api.approveCourse(courseId);
      toast('Phê duyệt khóa học thành công!', 'success');
      if (addLog) addLog(`Phê duyệt khóa học ID ${courseId}`, 'sys');
      fetchCourseStats();
      fetchCourses();
      if (selectedCourse && selectedCourse.id === courseId) {
        handleViewCourseDetail(courseId);
      }
    } catch (err) {
      toast(err.message || 'Duyệt khóa học thất bại', 'error');
    }
  };

  const handleOpenRejectCourseModal = (course) => {
    setCourseToReject(course);
    setRejectCourseReason('');
    setShowRejectCourseModal(true);
  };

  const handleRejectCourseSubmit = async () => {
    if (!rejectCourseReason.trim()) {
      toast('Vui lòng nhập lý do từ chối!', 'error');
      return;
    }
    try {
      await api.rejectCourse(courseToReject.id, rejectCourseReason);
      toast('Từ chối phê duyệt khóa học thành công!', 'success');
      if (addLog) addLog(`Từ chối khóa học ID ${courseToReject.id} lý do: ${rejectCourseReason}`, 'sys');
      setShowRejectCourseModal(false);
      fetchCourseStats();
      fetchCourses();
      if (selectedCourse && selectedCourse.id === courseToReject.id) {
        handleViewCourseDetail(courseToReject.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleOpenHideCourseModal = (course) => {
    setCourseToHide(course);
    setHideCourseReason('');
    setShowHideCourseModal(true);
  };

  const handleHideCourseSubmit = async () => {
    if (!hideCourseReason.trim()) {
      toast('Vui lòng nhập lý do ẩn khóa học!', 'error');
      return;
    }
    try {
      await api.hideCourse(courseToHide.id, hideCourseReason);
      toast('Ẩn khóa học thành công!', 'success');
      if (addLog) addLog(`Ẩn khóa học ID ${courseToHide.id} lý do: ${hideCourseReason}`, 'sys');
      setShowHideCourseModal(false);
      fetchCourseStats();
      fetchCourses();
      if (selectedCourse && selectedCourse.id === courseToHide.id) {
        handleViewCourseDetail(courseToHide.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleShowCourseSubmit = async (courseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hiển thị lại khóa học này không?')) return;
    try {
      await api.showCourse(courseId);
      toast('Hiển thị lại khóa học thành công!', 'success');
      if (addLog) addLog(`Hiển thị lại khóa học ID ${courseId}`, 'sys');
      fetchCourseStats();
      fetchCourses();
      if (selectedCourse && selectedCourse.id === courseId) {
        handleViewCourseDetail(courseId);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleViewCourseDetail = async (courseId) => {
    try {
      setCourseDetailLoading(true);
      setShowCourseDetailModal(true);
      setSelectedCourse(null);
      const data = await api.getAdminCourseDetail(courseId);
      if (data) {
        setSelectedCourse(data);
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải chi tiết khóa học', 'error');
      setShowCourseDetailModal(false);
    } finally {
      setCourseDetailLoading(false);
    }
  };

  const [adminUsers, setAdminUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [userStats, setUserStats] = useState({ totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalBlocked: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userStartDate, setUserStartDate] = useState('');
  const [userEndDate, setUserEndDate] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [userToBlock, setUserToBlock] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  const [userToUnblock, setUserToUnblock] = useState(null);
  const [showUnblockModal, setShowUnblockModal] = useState(false);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.getAdminUsers({
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        startDate: userStartDate,
        endDate: userEndDate,
        page: userPage,
        limit: 10
      });
      if (res) {
        setAdminUsers(res.users);
        setUserPagination(res.pagination);
        setUserStats(res.stats);
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải danh sách người dùng', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userSearch, userRoleFilter, userStatusFilter, userStartDate, userEndDate, userPage]);

  const handleViewUserDetail = async (userId) => {
    try {
      setUserDetailLoading(true);
      setShowDetailModal(true);
      setSelectedUser(null);
      const res = await api.getUserDetail(userId);
      if (res) {
        setSelectedUser(res);
      }
    } catch (err) {
      toast(err.message || 'Không thể lấy thông tin chi tiết', 'error');
      setShowDetailModal(false);
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleBlockUserSubmit = async () => {
    if (!blockReason.trim()) {
      toast('Vui lòng nhập lý do khóa!', 'warning');
      return;
    }
    try {
      await api.blockUser(userToBlock.id, blockReason);
      toast(`Đã khóa tài khoản "${userToBlock.name}"`, 'success');
      setShowBlockModal(false);
      setBlockReason('');
      fetchUsers();
      if (addLog) {
        addLog(`Khóa tài khoản ${userToBlock.email} lý do: ${blockReason}`, 'sys');
      }
    } catch (err) {
      toast(err.message || 'Lỗi khóa tài khoản', 'error');
    }
  };

  const handleUnblockUserSubmit = async () => {
    try {
      await api.unblockUser(userToUnblock.id);
      toast(`Đã mở khóa tài khoản "${userToUnblock.name}"`, 'success');
      setShowUnblockModal(false);
      fetchUsers();
      if (addLog) {
        addLog(`Mở khóa tài khoản ${userToUnblock.email}`, 'sys');
      }
    } catch (err) {
      toast(err.message || 'Lỗi mở khóa tài khoản', 'error');
    }
  };

  const [leadSearch, setLeadSearch] = useState('');

  const getCurrentDateVietnamese = () => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateStr = String(now.getDate()).padStart(2, '0');
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = now.getFullYear();
    return `${dayName}, ngày ${dateStr} tháng ${monthStr}, ${yearStr}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0).replace('₫', 'đ');
  };

  const getFilterText = (filter) => {
    switch (filter) {
      case 'this-month':
        return 'tháng này';
      case 'last-month':
        return 'tháng trước';
      case '3-months':
        return '3 tháng qua';
      case '6-months':
        return '6 tháng qua';
      case 'this-year':
        return 'năm nay';
      case 'custom':
        return 'trong kỳ';
      default:
        return 'trong kỳ';
    }
  };

  const renderKpiCard = (title, icon, data, colorKey = 'blue') => {
    const value = data?.value ?? 0;
    const isRevenue = title.toLowerCase().includes('doanh thu');
    const displayVal = isRevenue ? formatCurrency(value) : value;
    const change = data?.change ?? 0;
    const isPositive = change >= 0;
    
    return (
      <div className="kpi-card" key={title}>
        <div className="kpi-card-header">
          <div className={`kpi-card-icon ${colorKey}`}>{icon}</div>
          <span className={`kpi-change-badge ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
        </div>
        <div className="kpi-card-body">
          <h4 className="kpi-value">{displayVal}</h4>
          <span className="kpi-title">{title}</span>
          <p className="kpi-desc">{data?.description}</p>
        </div>
      </div>
    );
  };

  const renderLogKpiCard = (title, icon, value, colorKey = 'blue') => {
    return (
      <div className="kpi-card" key={title} style={{ cursor: 'default' }}>
        <div className="kpi-card-header">
          <div className={`kpi-card-icon ${colorKey}`}>{icon}</div>
        </div>
        <div className="kpi-card-body">
          <h4 className="kpi-value">{value}</h4>
          <span className="kpi-title">{title}</span>
        </div>
      </div>
    );
  };

  // Announcement & AI variables
  const [annText, setAnnText] = useState('');
  // Moderation Reports states
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [modStats, setModStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    closedReports: 0,
    warnedUsers: 0
  });
  const [modSearch, setModSearch] = useState('');
  const [modStatusFilter, setModStatusFilter] = useState('ALL');
  const [modTargetTypeFilter, setModTargetTypeFilter] = useState('ALL');
  const [modPage, setModPage] = useState(1);
  const [modPagination, setModPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetailLoading, setReportDetailLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [showRejectReportModal, setShowRejectReportModal] = useState(false);
  const [rejectReportReason, setRejectReportReason] = useState('');
  const [reportToReject, setReportToReject] = useState(null);

  const [showCloseReportModal, setShowCloseReportModal] = useState(false);
  const [closeReportNotes, setCloseReportNotes] = useState('');
  const [reportToClose, setReportToClose] = useState(null);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [reportToWarn, setReportToWarn] = useState(null);

  const [aiWeightDifficulty, setAiWeightDifficulty] = useState(70);
  const [aiWeightWeakness, setAiWeightWeakness] = useState(85);
  const [aiWeightRoadmap, setAiWeightRoadmap] = useState(90);

  // System Settings States
  const [systemSettings, setSystemSettings] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [formSettings, setFormSettings] = useState({
    FREE_AI_QUESTION_LIMIT: '20',
    MAX_UPLOAD_SIZE_MB: '50',
    PREMIUM_MONTHLY_PRICE: '199000',
    PREMIUM_YEARLY_PRICE: '1990000',
    LOG_SYNC_INTERVAL_MINUTES: '5',
    LOG_RETENTION_DAYS: '7'
  });

  const fetchSystemSettings = async () => {
    setLoadingSettings(true);
    try {
      const { api } = await import('../api');
      const data = await api.getAdminSystemSettings();
      if (data) {
        setSystemSettings(data);
        const formUpdates = {};
        data.forEach(item => {
          if (item.type !== 'BOOLEAN') {
            formUpdates[item.key] = item.value;
          }
        });
        setFormSettings(prev => ({ ...prev, ...formUpdates }));
      }
    } catch (err) {
      toast(`Lỗi khi tải cấu hình hệ thống: ${err.message || err}`, 'error');
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'features') {
      fetchSystemSettings();
    }
  }, [activeTab]);

  // Role upgrade requests and Payouts states
  const [roleRequests, setRoleRequests] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [commissionRate, setCommissionRate] = useState(20);
  const [teacherPayouts, setTeacherPayouts] = useState([
    { id: 1, name: 'Thầy Thế Anh', email: 'theanh@gmail.com', pendingAmount: '4.500.000đ', bankInfo: 'Vietcombank - 1012345678', status: 'PENDING' },
    { id: 2, name: 'Cô Quỳnh Chi', email: 'quynhchi@gmail.com', pendingAmount: '3.200.000đ', bankInfo: 'MBBank - 999988882222', status: 'PENDING' }
  ]);

  const fetchRoleRequests = async () => {
    setLoadingRoles(true);
    try {
      const data = await api.getRoleChangeRequests();
      if (data && data.length > 0) {
        setRoleRequests(data);
      } else {
        setRoleRequests([
          { id: 1, userId: 12, user: { fullName: 'Nguyễn Văn Đạt', email: 'datnguyen@gmail.com' }, currentRole: 'STUDENT', requestedRole: 'TEACHER', reason: 'Tôi là giáo viên Toán chuyên luyện thi đại học lớp 12 tại Hà Nội, muốn đăng tài liệu và tạo khóa học.', status: 'PENDING', createdAt: new Date().toISOString() },
          { id: 2, userId: 15, user: { fullName: 'Lê Thu Trang', email: 'trangle@gmail.com' }, currentRole: 'STUDENT', requestedRole: 'TEACHER', reason: 'Thạc sĩ vật lý trường ĐH Sư Phạm, muốn chia sẻ bài giảng sóng cơ học.', status: 'PENDING', createdAt: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('Lỗi khi tải yêu cầu nâng cấp quyền:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleReview = async (requestId, action) => {
    try {
      await api.reviewRoleChange(requestId, action === 'approve' ? 'APPROVED' : 'REJECTED');
      toast(`Đã ${action === 'approve' ? 'chấp thuận' : 'từ chối'} nâng cấp tài khoản!`, 'success');
      fetchRoleRequests();
      if (addLog) addLog(`[Admin] Duyệt yêu cầu nâng cấp quyền ID ${requestId}: ${action.toUpperCase()}`, 'sys');
    } catch (err) {
      toast(err.message || 'Thao tác phê duyệt thất bại!', 'error');
    }
  };

  const handlePayoutTeacher = (payoutId) => {
    setTeacherPayouts(teacherPayouts.map(p => p.id === payoutId ? { ...p, status: 'PAID' } : p));
    toast('Đã ghi nhận thanh toán lương/hoa hồng cho giáo viên!', 'success');
  };

  useEffect(() => {
    if (activeTab === 'moderation') {
      fetchReports();
    }
    if (activeTab === 'roles') {
      fetchRoleRequests();
    }
  }, [activeTab, modSearch, modStatusFilter, modTargetTypeFilter, modPage]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const [statsData, res] = await Promise.all([
        api.getAdminReportStatistics(),
        api.getAdminReports({
          search: modSearch,
          status: modStatusFilter,
          targetType: modTargetTypeFilter,
          page: modPage,
          limit: 10
        })
      ]);
      if (statsData) {
        setModStats(statsData);
      }
      setReports(res || []);
    } catch (err) {
      console.error('Lỗi tải báo cáo kiểm duyệt:', err);
      toast(err.message || 'Lỗi tải danh sách báo cáo', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleApproveReportSubmit = async (reportId) => {
    if (!window.confirm('Bạn có chắc chắn phê duyệt báo cáo này không? (Nội dung vi phạm liên quan sẽ bị ẩn)')) return;
    try {
      await api.approveAdminReport(reportId);
      toast('Phê duyệt báo cáo thành công!', 'success');
      addLog(`Phê duyệt báo cáo ID ${reportId}`, 'sys');
      fetchReports();
      if (selectedReport && selectedReport.id === reportId) {
        handleViewReportDetail(reportId);
      }
    } catch (err) {
      toast(err.message || 'Phê duyệt thất bại', 'error');
    }
  };

  const handleOpenRejectReportModal = (report) => {
    setReportToReject(report);
    setRejectReportReason('');
    setShowRejectReportModal(true);
  };

  const handleRejectReportSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rejectReportReason.trim()) {
      toast('Vui lòng nhập lý do từ chối!', 'error');
      return;
    }
    try {
      await api.rejectAdminReport(reportToReject.id, rejectReportReason);
      toast('Từ chối báo cáo thành công!', 'success');
      addLog(`Từ chối báo cáo ID ${reportToReject.id}. Lý do: ${rejectReportReason}`, 'sys');
      setShowRejectReportModal(false);
      fetchReports();
      if (selectedReport && selectedReport.id === reportToReject.id) {
        handleViewReportDetail(reportToReject.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleOpenCloseReportModal = (report) => {
    setReportToClose(report);
    setCloseReportNotes('');
    setShowCloseReportModal(true);
  };

  const handleCloseReportSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.closeAdminReport(reportToClose.id, closeReportNotes);
      toast('Đóng báo cáo thành công!', 'success');
      addLog(`Đóng báo cáo ID ${reportToClose.id}. Ghi chú: ${closeReportNotes}`, 'sys');
      setShowCloseReportModal(false);
      fetchReports();
      if (selectedReport && selectedReport.id === reportToClose.id) {
        handleViewReportDetail(reportToClose.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleOpenWarningModal = (report) => {
    setReportToWarn(report);
    setWarningMessage('');
    setShowWarningModal(true);
  };

  const handleWarningSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!warningMessage.trim()) {
      toast('Vui lòng nhập tin nhắn cảnh báo!', 'error');
      return;
    }
    try {
      await api.createAdminReportWarning(reportToWarn.id, warningMessage);
      toast('Đã gửi cảnh báo thành công!', 'success');
      addLog(`Gửi cảnh báo đến người dùng bị báo cáo trong báo cáo ID ${reportToWarn.id}. Nội dung: ${warningMessage}`, 'sys');
      setShowWarningModal(false);
      fetchReports();
      if (selectedReport && selectedReport.id === reportToWarn.id) {
        handleViewReportDetail(reportToWarn.id);
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleViewReportDetail = async (reportId) => {
    try {
      setReportDetailLoading(true);
      setShowReportModal(true);
      setSelectedReport(null);
      const data = await api.getAdminReportById(reportId);
      if (data) {
        setSelectedReport(data);
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải chi tiết báo cáo', 'error');
      setShowReportModal(false);
    } finally {
      setReportDetailLoading(false);
    }
  };

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!annText.trim()) return;
    onSendAnnouncement(annText);
    setAnnText('');
    addLog(`Quản trị viên phát hành thông báo hệ thống: "${annText}"`, 'sys');
    toast('Đã gửi thông báo hệ thống đến tất cả người dùng!', 'success');
  };

  const handleUpdateAIWeights = () => {
    addLog(`[AI Config] Cập nhật trọng số thuật toán thích ứng (Khó: ${aiWeightDifficulty}%, Điểm yếu: ${aiWeightWeakness}%, Lộ trình: ${aiWeightRoadmap}%)`, 'sys');
    toast('Cập nhật cấu hình thuật toán AI thành công!', 'success');
  };



  // Leads logic with DB sync
  const handleToggleLeadStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Chờ tư vấn' ? 'Đã liên hệ' : (currentStatus === 'Đã liên hệ' ? 'Thành công' : 'Chờ tư vấn');
    try {
      const { api } = await import('../api');
      const updated = await api.updateAdminLeadStatus(id, nextStatus);
      if (updated) {
        setLeadsList(prev => prev.map(l => l.id === id ? { ...l, status: updated.status } : l));
        addLog(`[Admin] Cập nhật trạng thái Lead ID ${id} sang "${nextStatus}"`, 'sys');
        toast(`Cập nhật trạng thái sang "${nextStatus}"!`, 'success');
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái lead:', err);
      toast('Không thể cập nhật trạng thái lead', 'error');
    }
  };

  const filteredLeads = leadsList.filter(l => 
    l.name?.toLowerCase().includes(leadSearch.toLowerCase()) || 
    l.phone?.includes(leadSearch) ||
    l.email?.toLowerCase().includes(leadSearch.toLowerCase())
  );

  return (
    <div className="admin-root-container">
      {/* Dynamic CSS Stylesheet block for neobrutalism custom dashboard rendering */}
      <style dangerouslySetInnerHTML={{__html: `
        .admin-root-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          background-color: #FCFBFA;
          color: #0E100D;
        }

        /* ── SIDEBAR ── */
        .admin-sidebar {
          width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          background-color: #0E100D;
          border-right: 1.5px solid #1C2B17;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          box-sizing: border-box;
          color: #FFFFFF;
          flex-shrink: 0;
          overflow-y: auto;
        }

        .admin-sidebar::-webkit-scrollbar {
          width: 4px;
        }

        .admin-sidebar::-webkit-scrollbar-thumb {
          background-color: #2E332A;
          border-radius: 4px;
        }

        .admin-sidebar-header {
          padding-bottom: 24px;
          border-bottom: 2px dashed #2E332A;
          margin-bottom: 24px;
        }

        .admin-sidebar-title {
          font-size: 20px;
          font-weight: 950;
          letter-spacing: 1px;
          margin: 0;
          color: #FFFFFF;
        }

        .admin-sidebar-subtitle {
          font-size: 11px;
          color: #8C9985;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 4px;
          font-weight: 700;
        }

        .admin-sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .admin-menu-item {
          width: 100%;
          background: none;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          color: #A3B899;
          font-size: 14.5px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .admin-menu-item:hover {
          color: #FFFFFF;
          background-color: rgba(255, 255, 255, 0.04);
        }

        .admin-menu-item.active {
          background-color: #1C2B17;
          color: #FFFFFF;
        }

        .admin-menu-badge {
          background-color: #EF4444;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 100px;
          margin-left: auto;
        }

        .admin-sidebar-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 2px dashed #2E332A;
        }

        .admin-back-btn {
          width: 100%;
          background-color: #FFFFFF;
          border: 1.5px solid #2D3229;
          color: #2D3229;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s;
          box-shadow: 2px 2px 0px #2D3229;
        }

        .admin-back-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #2D3229;
          background-color: #FCFBFA;
        }

        .admin-table-btn {
          background-color: #FFFFFF;
          border: 1.5px solid #2D3229;
          color: #2D3229;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.15s;
          white-space: nowrap;
          box-shadow: none;
        }

        .admin-table-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 2px 2px 0px #2D3229;
        }

        /* ── MAIN WORKSPACE ── */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* ── STICKY TOP WRAPPER (Header chào mừng + admin-header) ── */
        .admin-sticky-top {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: #FCFBFA;
          border-bottom: 1.5px solid #E8E7E3;
        }

        .dark-theme .admin-sticky-top {
          background-color: #151A22 !important;
          border-bottom-color: #2D3748 !important;
        }

        .admin-header {
          background-color: transparent;
          border-bottom: none;
          padding: 10px 32px 14px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-header-title {
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          margin: 0;
          color: #0E100D;
        }

        .admin-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .admin-header-subtitle-date {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          color: #7A7A7A;
        }

        .admin-header-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .admin-filter-select {
          padding: 8px 16px;
          border: 1.5px solid #2D3229;
          border-radius: 8px;
          background-color: #FFFFFF;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          color: #2D3229;
          cursor: pointer;
          outline: none;
          box-shadow: 2px 2px 0px #2D3229;
          transition: all 0.15s;
        }

        .admin-filter-select:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #2D3229;
        }

        .admin-custom-date-range {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #FFFFFF;
          border: 1.5px solid #2D3229;
          border-radius: 8px;
          padding: 4px 8px;
          box-shadow: 2px 2px 0px #2D3229;
        }

        .admin-date-input {
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          color: #2D3229;
          padding: 4px;
        }

        .admin-date-separator {
          font-size: 11px;
          font-weight: 800;
          color: #7A7A7A;
          text-transform: uppercase;
        }

        .admin-date-apply-btn {
          border: none;
          background-color: #1C2B17;
          color: #FFFFFF;
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .admin-date-apply-btn:hover {
          background-color: #2F4D25;
        }

        .admin-body {
          padding: 32px;
          max-width: 1360px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* ── MODERN SaaS CARDS ── */
        .admin-card {
          background-color: #FFFFFF;
          border: 1.5px solid #E8E7E3;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(45, 50, 41, 0.03);
          margin-bottom: 24px;
          box-sizing: border-box;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45, 50, 41, 0.06);
          border-color: #A3B899;
        }

        /* ── KPI CARD STYLES ── */
        .stats-row-5col {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .stats-row-5col {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-row-5col {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .stats-row-5col {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          background-color: #FFFFFF;
          border: 1.5px solid #E8E7E3;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(45, 50, 41, 0.03);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45, 50, 41, 0.06);
          border-color: #A3B899;
        }

        .kpi-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kpi-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background-color: #FCFBFA;
          border: 1px solid #E8E7E3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C2B17;
          font-size: 20px;
          transition: all 0.2s;
        }

        .kpi-card-icon.blue { background-color: #E0F2FE; color: #0284C7; border-color: #BAE6FD; }
        .kpi-card-icon.green { background-color: #D1FAE5; color: #059669; border-color: #A7F3D0; }
        .kpi-card-icon.indigo { background-color: #E0E7FF; color: #4F46E5; border-color: #C7D2FE; }
        .kpi-card-icon.purple { background-color: #F3E8FF; color: #7C3AED; border-color: #E9D5FF; }
        .kpi-card-icon.amber { background-color: #FEF3C7; color: #D97706; border-color: #FDE68A; }

        .kpi-change-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid currentColor;
        }

        .kpi-change-badge.positive {
          background-color: #D1FAE5;
          color: #065F46;
          border-color: #A7F3D0;
        }

        .kpi-change-badge.negative {
          background-color: #FEE2E2;
          color: #991B1B;
          border-color: #FCA5A5;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 950;
          color: #0E100D;
          margin: 0 0 2px 0;
          letter-spacing: -0.5px;
        }

        .kpi-title {
          font-size: 12px;
          font-weight: 850;
          color: #1C2B17;
          text-transform: uppercase;
        }

        .kpi-desc {
          font-size: 11px;
          color: #7A7A7A;
          margin: 4px 0 0 0;
          font-weight: 600;
        }

        /* ── CHARTS SECTION ── */
        .charts-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .charts-grid-2col {
            grid-template-columns: 1fr;
          }
        }

        .chart-card-title {
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 24px 0;
          color: #1C2B17;
        }

        .revenue-total-amount {
          color: #3B82F6;
          margin-left: 8px;
          text-transform: none;
          font-weight: 800;
        }

        .chart-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chart-active-filter-badge {
          font-size: 11px;
          font-weight: 800;
          color: #1C2B17;
          background-color: #E8F4E5;
          border: 1px solid #C2E2BC;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        /* ── PROGRESS & SKILLS ── */
        .skills-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skill-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 800;
          color: #0E100D;
        }

        .skill-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .skill-val {
          font-weight: 900;
        }

        .skill-progress-bar-bg {
          width: 100%;
          background-color: #F0EDEB;
          height: 14px;
          border: 1.5px solid #2D3229;
          border-radius: 20px;
          overflow: hidden;
        }

        .skill-progress-bar-fill {
          height: 100%;
          border-radius: 20px;
          transition: width 0.6s ease;
        }

        /* ── ADMIN SUB TABS FOR CONTENT ── */
        .admin-sub-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1.5px solid #E8E7E3;
          padding-bottom: 12px;
          overflow-x: auto;
        }

        .admin-sub-tab-btn {
          background: none;
          border: 1.5px solid transparent;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          color: #7A7A7A;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .admin-sub-tab-btn:hover {
          color: #1C2B17;
          background-color: #F0EDEB;
        }

        .admin-sub-tab-btn.active {
          border-color: #2D3229;
          background-color: #FFFFFF;
          color: #1C2B17;
          box-shadow: 2px 2px 0px #2D3229;
        }

        /* ── LEADS TABLE ── */
        .leads-table-container {
          width: 100%;
          overflow-x: auto;
          border: 1.5px solid #E8E7E3;
          border-radius: 12px;
          background-color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(45, 50, 41, 0.02);
        }

        .leads-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        .leads-table th {
          background-color: #FCFBFA;
          border-bottom: 1.5px solid #E8E7E3;
          padding: 14px 16px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #1C2B17;
        }

        .leads-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #F0EDEB;
          font-weight: 700;
          color: #333333;
        }

        .leads-table tr:last-child td {
          border-bottom: none;
        }

        .lead-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid currentColor;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }

        .lead-status-badge:hover {
          transform: scale(1.05);
        }

        .lead-status-badge.pending {
          background-color: #FEF3C7;
          color: #D97706;
          border-color: #FDE68A;
        }

        .lead-status-badge.contacted {
          background-color: #DBEAFE;
          color: #2563EB;
          border-color: #BFDBFE;
        }

        .lead-status-badge.success {
          background-color: #D1FAE5;
          color: #059669;
          border-color: #A7F3D0;
        }

        .student-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }

        /* ── BOOKS GRID ── */
        .books-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }

        .book-card {
          background-color: #FFFFFF;
          border: 1.5px solid #E8E7E3;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(45, 50, 41, 0.03);
          display: flex;
          gap: 16px;
          position: relative;
          transition: all 0.2s;
        }

        .book-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45, 50, 41, 0.06);
          border-color: #A3B899;
        }

        .book-cover {
          width: 90px;
          height: 120px;
          border: 1.5px solid #2D3229;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .book-info {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex: 1;
        }

        .book-title {
          font-size: 14.5px;
          font-weight: 900;
          margin: 0 0 4px 0;
          line-height: 1.3;
          color: #0E100D;
        }

        .book-author {
          font-size: 11.5px;
          font-weight: 850;
          color: #7A7A7A;
          margin-bottom: 6px;
        }

        .book-desc {
          font-size: 11px;
          color: #64748B;
          line-height: 1.4;
          margin: 0 0 10px 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .book-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .book-price {
          font-weight: 900;
          color: #EF4444;
          font-size: 13.5px;
        }

        .book-btn-buy {
          background-color: #FFFFFF;
          border: 1.5px solid #2D3229;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          color: #2D3229;
          transition: all 0.15s;
          box-shadow: 1px 1px 0px #2D3229;
        }

        .book-btn-buy:hover {
          background-color: #2D3229;
          color: #FFFFFF;
          transform: translate(-0.5px, -0.5px);
          box-shadow: 1.5px 1.5px 0px #2D3229;
        }

        .book-actions-overlay {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 6px;
        }

        .book-act-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1.5px solid #2D3229;
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s;
        }

        .book-act-btn:hover {
          transform: translateY(-1px);
        }

        .book-act-btn.edit:hover { background-color: #DBEAFE; }
        .book-act-btn.delete:hover { background-color: #FEE2E2; color: #EF4444; }

        /* ── MODAL ── */
        .admin-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .admin-modal {
          background-color: #FFFFFF;
          border: 1.5px solid #2D3229;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          box-shadow: 6px 6px 0px rgba(45, 50, 41, 0.15);
          overflow: hidden;
          animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .admin-modal-header {
          background-color: #F0EDEB;
          border-bottom: 2.5px solid #2D3229;
          padding: 16px 24px;
          font-weight: 950;
          font-size: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-modal-body {
          padding: 24px;
        }

        .admin-modal-footer {
          padding: 16px 24px;
          border-top: 2px dashed #E5E5E5;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .admin-form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-form-group label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .admin-form-input, .admin-form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #2D3229;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          box-sizing: border-box;
          outline: none;
        }

        select.admin-form-input {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%232D3229%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 14px;
          padding-right: 36px !important;
          cursor: pointer;
        }

        .dark-theme select.admin-form-input {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23E2E8F0%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E") !important;
        }

        /* ── CUSTOM NEO SELECT ── */
        .neo-select-container {
          position: relative;
          width: 100%;
        }

        .neo-select-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          height: 40px;
          padding: 0 12px;
          background: #FFFFFF;
          border: 1.5px solid #2D3229;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          box-sizing: border-box;
          user-select: none;
          color: #2D3229;
          transition: all 0.15s;
        }
        
        .dark-theme .neo-select-trigger {
          background: #151A22;
          border-color: #4A5568;
          color: #E2E8F0;
        }

        .neo-select-trigger:focus, .neo-select-trigger:hover {
          box-shadow: 2px 2px 0px #2D3229;
        }

        .dark-theme .neo-select-trigger:focus, .dark-theme .neo-select-trigger:hover {
          box-shadow: 2px 2px 0px #4A5568;
        }

        .neo-select-options {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 999;
          background: #FFFFFF;
          border: 2px solid #2D3229;
          border-radius: 10px;
          box-shadow: 3px 3px 0px #2D3229;
          overflow: hidden;
          padding: 4px 0;
        }

        .dark-theme .neo-select-options {
          background: #151A22;
          border-color: #4A5568;
          box-shadow: 3px 3px 0px #4A5568;
        }

        .neo-select-option {
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          color: #2D3229;
          transition: background 0.1s;
          text-align: left;
        }

        .dark-theme .neo-select-option {
          color: #E2E8F0;
        }

        .neo-select-option:hover {
          background-color: #F3F4F6;
        }

        .dark-theme .neo-select-option:hover {
          background-color: #2D3748;
        }

        .neo-select-option.selected {
          background-color: #6c5ce7 !important;
          color: #FFFFFF !important;
        }

        .admin-form-input:focus, .admin-form-textarea:focus {
          box-shadow: 2px 2px 0px #2D3229;
        }

        /* ── TERMINAL LOGS ── */
        .admin-terminal {
          background-color: #0E100D !important;
          border: 1.5px solid #2D3229;
          border-radius: 12px;
          padding: 16px;
          height: 320px;
          overflow-y: auto;
          font-family: 'SF Mono', Fira Code, Monaco, monospace;
          font-size: 11.5px;
          color: #4AF626 !important;
          line-height: 1.6;
          box-sizing: border-box;
        }

        .terminal-line {
          margin-bottom: 4px;
        }

        .terminal-time {
          color: #7A7A7A;
          margin-right: 8px;
        }

        .terminal-tag-ai {
          color: #38BDF8;
          font-weight: bold;
        }

        .terminal-tag-sys {
          color: #A855F7;
          font-weight: bold;
        }

        /* ── LOADING STATS OVERLAY ── */
        .stats-spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #E8E7E3;
          border-top-color: #059669;
          border-radius: 50%;
          animation: spin-stats 0.8s linear infinite;
        }

        @keyframes spin-stats {
          to { transform: rotate(360deg); }
        }

        .dark-theme .stats-spinner {
          border-color: #2D3748;
          border-top-color: #A3B899;
        }

        .dark-theme .stats-loading-overlay {
          background: rgba(21, 26, 34, 0.75) !important;
        }
        
        .dark-theme .stats-loading-text {
          color: #A3B899 !important;
        }

        /* ── SYSTEM LOGS DRAWER & KPI ── */
        .kpi-card-icon.red {
          background-color: #FEE2E2;
          color: #EF4444;
          border-color: #FCA5A5;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1 className="admin-sidebar-title">ADMIN PANEL</h1>
          <div className="admin-sidebar-subtitle">SUPER ADMIN</div>
        </div>

        <nav className="admin-sidebar-menu">
          <button 
            className={`admin-menu-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <HiChartBar style={{ fontSize: '18px' }} /> Thống kê
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <HiBookOpen style={{ fontSize: '18px' }} /> Quản lý đề
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <HiUsers style={{ fontSize: '18px' }} /> Người dùng
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <HiAcademicCap style={{ fontSize: '18px' }} /> Quản lý Giáo viên
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <HiBookOpen style={{ fontSize: '18px' }} /> Quản lý Khóa học
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <HiTrendingUp style={{ fontSize: '18px' }} /> Leads
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <HiAdjustments style={{ fontSize: '18px' }} /> Quản lý chức năng
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            <HiGlobeAlt style={{ fontSize: '18px' }} /> Thông báo hệ thống
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <span style={{ fontSize: '18px' }}>🛡️</span> Kiểm duyệt báo cáo
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
          >
            <HiCurrencyDollar style={{ fontSize: '18px' }} /> Doanh thu & Chi trả
          </button>
          <button 
            className={`admin-menu-item ${activeTab === 'system-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('system-logs')}
          >
            <HiTerminal style={{ fontSize: '18px' }} /> Nhật ký hệ thống
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            className="admin-back-btn" 
            onClick={() => {
              if (navigateTo) {
                navigateTo('/');
              }
            }}
          >
            <HiArrowLeft /> Quay lại trang chủ
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ── */}
      <main className="admin-main">
        {/* ── STICKY TOP: Header chào mừng + Admin page header ── */}
        <div className="admin-sticky-top">
          <div style={{ padding: '8px 32px 0 32px' }}>
            <Header
              role="admin"
              userProfile={currentUser}
              theme={theme}
              onToggleTheme={onToggleTheme}
              notifications={notifications || []}
              onClearNotifications={onClearNotifications}
              onLogout={onLogout}
              onChangePassword={onChangePassword}
              onNavigateSettings={onNavigateSettings}
              addLog={addLog}
              cartCourse={cartCourse}
              onCheckoutCourse={onCheckoutCourse}
              courses={[]}
            />
          </div>
          <header className="admin-header">
            <div className="admin-header-left">
              <h2 className="admin-header-title">
                {activeTab === 'stats' && 'Dashboard Thống kê'}
                {activeTab === 'exams' && 'QUẢN LÝ ĐỀ THI'}
                {activeTab === 'users' && 'QUẢN LÝ NGƯỜI DÙNG'}
                {activeTab === 'teachers' && 'QUẢN LÝ GIÁO VIÊN'}
                {activeTab === 'courses' && 'QUẢN LÝ KHÓA HỌC'}
                {activeTab === 'leads' && 'QUẢN LÝ ĐĂNG KÝ HỌC VIÊN (LEADS)'}
                {activeTab === 'features' && 'QUẢN LÝ CÁC CHỨC NĂNG HỆ THỐNG'}
                {activeTab === 'announcements' && 'GỬI THÔNG BÁO HỆ THỐNG'}
                {activeTab === 'moderation' && 'KIỂM DUYỆT BÁO CÁO VI PHẠM'}
                {activeTab === 'finance' && 'QUẢN LÝ TÀI CHÍNH & CHI TRẢ'}
                {activeTab === 'system-logs' && 'NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG'}
              </h2>
              {activeTab === 'stats' && (
                <p className="admin-header-subtitle-date">{getCurrentDateVietnamese()}</p>
              )}
            </div>
            {activeTab === 'stats' && (
              <div className="admin-header-filters">
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="this-month">Tháng này</option>
                  <option value="last-month">Tháng trước</option>
                  <option value="3-months">3 tháng gần nhất</option>
                  <option value="6-months">6 tháng gần nhất</option>
                  <option value="this-year">Năm nay</option>
                </select>
              </div>
            )}
            {activeTab === 'system-logs' && (
              <div className="admin-header-filters">
                <a
                  href="https://drive.google.com/drive/folders/1FPZl6YD5ZvJTxiZIJ4DFTjVjb7BtApx1"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: '#fff',
                    color: '#000',
                    fontWeight: '800',
                    fontSize: '13px',
                    border: '2.5px solid #000',
                    borderRadius: '8px',
                    boxShadow: '3px 3px 0px #000',
                    textDecoration: 'none',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = '5px 5px 0px #000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = '3px 3px 0px #000';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                  </svg>
                  Mở thư mục Drive Log
                </a>
              </div>
            )}
          </header>
        </div>

        <div className="admin-body">
          {/* ==========================================
              TAB: THỐNG KÊ (DASHBOARD)
              ========================================== */}
          {activeTab === 'stats' && (
            <div style={{ position: 'relative', minHeight: '400px' }}>
              {loadingStats && (
                <div className="stats-loading-overlay animate-in" style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(252, 251, 250, 0.75)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 50,
                  borderRadius: '16px',
                  gap: '16px',
                  transition: 'all 0.3s ease'
                }}>
                  <div className="stats-spinner" />
                  <p className="stats-loading-text" style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#1C2B17',
                    letterSpacing: '-0.3px',
                    margin: 0
                  }}>
                    Đang tải dữ liệu thống kê...
                  </p>
                </div>
              )}

              <div style={{ opacity: loadingStats ? 0.35 : 1, transition: 'opacity 0.3s ease', pointerEvents: loadingStats ? 'none' : 'auto' }}>
                {/* Row 1: 5 Column KPI Cards */}
                <div className="stats-row-5col">
                {renderKpiCard('Tổng User', <HiUsers />, stats.kpi?.totalUsers, 'blue')}
                {renderKpiCard(`User mới ${getFilterText(timeFilter)}`, <HiPlus />, stats.kpi?.newUsersThisWeek, 'green')}
                {renderKpiCard(`Tổng bài làm ${getFilterText(timeFilter)}`, <HiClipboardCheck />, stats.kpi?.totalAttempts, 'indigo')}
                {renderKpiCard(`Tổng câu hỏi AI ${getFilterText(timeFilter)}`, <HiTerminal />, stats.kpi?.totalAiQuestions, 'purple')}
                {renderKpiCard(`Doanh thu ${getFilterText(timeFilter)}`, <HiTrendingUp />, stats.kpi?.revenue, 'amber')}
              </div>

              {/* Row 2: 2 Column Charts (Lượt làm bài & Câu hỏi AI) */}
              <div className="charts-grid-2col">
                {/* Bar Chart: Lượt làm bài */}
                <div className="admin-card">
                  <h3 className="chart-card-title">
                    Lượt làm bài: <span className="revenue-total-amount" style={{ color: '#059669' }}>{stats.kpi?.totalAttempts?.value}</span>
                  </h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={stats.attemptsChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" vertical={false} />
                        <XAxis dataKey="date" stroke="#7A7A7A" fontSize={11} fontWeight={700} tickLine={false} />
                        <YAxis stroke="#7A7A7A" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1.5px solid #2D3229', 
                            borderRadius: '8px',
                            fontFamily: 'inherit',
                            fontSize: '12px',
                            fontWeight: '700',
                            boxShadow: '2px 2px 0px rgba(45, 50, 41, 0.15)'
                          }} 
                        />
                        <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} barSize={28} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart: Câu hỏi AI */}
                <div className="admin-card">
                  <h3 className="chart-card-title">
                    Câu hỏi AI: <span className="revenue-total-amount" style={{ color: '#8B5CF6' }}>{stats.kpi?.totalAiQuestions?.value}</span>
                  </h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <LineChart data={stats.aiQuestionsChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" vertical={false} />
                        <XAxis dataKey="date" stroke="#7A7A7A" fontSize={11} fontWeight={700} tickLine={false} />
                        <YAxis stroke="#7A7A7A" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1.5px solid #2D3229', 
                            borderRadius: '8px',
                            fontFamily: 'inherit',
                            fontSize: '12px',
                            fontWeight: '700',
                            boxShadow: '2px 2px 0px rgba(45, 50, 41, 0.15)'
                          }} 
                        />
                        <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={true} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 3: Revenue Trend Area Chart */}
              <div className="admin-card">
                <div className="chart-header-row">
                  <h3 className="chart-card-title">
                    Doanh thu: <span className="revenue-total-amount">{formatCurrency(stats.kpi?.revenue?.value)}</span>
                  </h3>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={stats.revenueChart || []} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E3" vertical={false} />
                      <XAxis dataKey="label" stroke="#7A7A7A" fontSize={11} fontWeight={700} tickLine={false} />
                      <YAxis 
                        stroke="#7A7A7A" 
                        fontSize={11} 
                        fontWeight={700} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1).replace('.0', '')}tr` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1.5px solid #2D3229', 
                          borderRadius: '8px',
                          fontFamily: 'inherit',
                          fontSize: '12px',
                          fontWeight: '700',
                          boxShadow: '2px 2px 0px rgba(45, 50, 41, 0.15)'
                        }} 
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={{ r: 3 }} connectNulls={true} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: QUẢN LÝ ĐỀ
              ========================================== */}
          {activeTab === 'exams' && (
            <AdminExamManager addLog={addLog} />
          )}



          {/* ==========================================
              TAB: GỬI THÔNG BÁO HỆ THỐNG (SYSTEM ANNOUNCEMENTS)
              ========================================== */}
          {activeTab === 'announcements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Sub-tabs bar */}
              <div style={{ display: 'flex', gap: '10px', borderBottom: '2.5px solid #000000', paddingBottom: '12px' }}>
                {[
                  { id: 'send', label: '⚡ GỬI THÔNG BÁO', color: '#6c5ce7' },
                  { id: 'history', label: '📖 LỊCH SỬ THÔNG BÁO', color: '#0984e3' },
                  { id: 'templates', label: '📋 QUẢN LÝ TEMPLATES', color: '#00b894' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setNotifSubTab(sub.id)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      border: '2px solid #000000',
                      background: notifSubTab === sub.id ? sub.color : '#FFFFFF',
                      color: notifSubTab === sub.id ? '#FFFFFF' : '#1E293B',
                      fontWeight: '900', fontSize: '12.5px', cursor: 'pointer',
                      boxShadow: notifSubTab === sub.id ? '2px 2px 0px #000000' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab 1: Gửi thông báo */}
              {notifSubTab === 'send' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
                  {/* Form card */}
                  <div className="admin-card">
                    <h3 className="chart-card-title">Thiết lập thông báo mới</h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', fontWeight: '500' }}>
                      Phát đi các thông điệp tùy chỉnh hoặc sử dụng mẫu cấu hình sẵn tới toàn bộ người dùng, vai trò hoặc tài khoản cụ thể.
                    </p>

                    <form onSubmit={handleAdminSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Đối tượng nhận */}
                      <div className="admin-form-group">
                        <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Đối tượng nhận thông báo:</label>
                        <select
                          className="admin-form-select"
                          value={notifSendTarget}
                          onChange={e => setNotifSendTarget(e.target.value)}
                        >
                          <option value="all">Toàn bộ người dùng trên hệ thống</option>
                          <option value="role">Theo vai trò tài khoản (Role)</option>
                          <option value="user">Tài khoản cụ thể (User ID)</option>
                        </select>
                      </div>

                      {/* Phụ thuộc vào đối tượng */}
                      {notifSendTarget === 'role' && (
                        <div className="admin-form-group">
                          <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Chọn vai trò nhận:</label>
                          <select
                            className="admin-form-select"
                            value={notifSendRole}
                            onChange={e => setNotifSendRole(e.target.value)}
                          >
                            <option value="STUDENT">Học sinh (STUDENT)</option>
                            <option value="TEACHER">Giáo viên (TEACHER)</option>
                            <option value="ADMIN">Quản trị viên (ADMIN)</option>
                          </select>
                        </div>
                      )}

                      {notifSendTarget === 'user' && (
                        <div className="admin-form-group">
                          <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Nhập ID người dùng (User ID):</label>
                          <input
                            type="number"
                            className="admin-form-input"
                            placeholder="Ví dụ: 101"
                            value={notifSendUserId}
                            onChange={e => setNotifSendUserId(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {/* Chế độ gửi */}
                      <div className="admin-form-group">
                        <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Phương thức soạn thông báo:</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <input
                              type="radio"
                              name="sendMode"
                              checked={notifSendMode === 'raw'}
                              onChange={() => setNotifSendMode('raw')}
                            /> Soạn tùy ý (Raw)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <input
                              type="radio"
                              name="sendMode"
                              checked={notifSendMode === 'template'}
                              onChange={() => setNotifSendMode('template')}
                            /> Theo mẫu (Template)
                          </label>
                        </div>
                      </div>

                      {/* Nội dung khi chọn RAW */}
                      {notifSendMode === 'raw' && (
                        <>
                          <div className="admin-form-group">
                            <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Tiêu đề thông báo:</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              placeholder="Nhập tiêu đề..."
                              value={notifSendTitle}
                              onChange={e => setNotifSendTitle(e.target.value)}
                              required
                            />
                          </div>

                          <div className="admin-form-group">
                            <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Nội dung thông báo:</label>
                            <textarea
                              className="admin-form-textarea"
                              rows="4"
                              placeholder="Nhập nội dung thông điệp chi tiết..."
                              value={notifSendMessage}
                              onChange={e => setNotifSendMessage(e.target.value)}
                              required
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="admin-form-group">
                              <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Loại (Type):</label>
                              <select
                                className="admin-form-select"
                                value={notifSendType}
                                onChange={e => setNotifSendType(e.target.value)}
                              >
                                <option value="INFO">INFO (Thông tin màu xanh)</option>
                                <option value="SUCCESS">SUCCESS (Thành công màu xanh lá)</option>
                                <option value="WARNING">WARNING (Cảnh báo màu vàng)</option>
                                <option value="ERROR">ERROR (Quan trọng màu đỏ)</option>
                              </select>
                            </div>

                            <div className="admin-form-group">
                              <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Danh mục (Category):</label>
                              <select
                                className="admin-form-select"
                                value={notifSendCategory}
                                onChange={e => setNotifSendCategory(e.target.value)}
                              >
                                <option value="SYSTEM">SYSTEM (Hệ thống)</option>
                                <option value="ACCOUNT">ACCOUNT (Tài khoản)</option>
                                <option value="COURSE">COURSE (Khóa học)</option>
                                <option value="EXAM">EXAM (Thi cử)</option>
                                <option value="PAYMENT">PAYMENT (Thanh toán)</option>
                                <option value="AI">AI (Trí tuệ nhân tạo)</option>
                                <option value="REPORT">REPORT (Báo cáo vi phạm)</option>
                                <option value="TEACHER">TEACHER (Giảng dạy)</option>
                                <option value="ADMIN">ADMIN (Quản trị)</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Nội dung khi chọn TEMPLATE */}
                      {notifSendMode === 'template' && (
                        <>
                          <div className="admin-form-group">
                            <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Chọn mẫu thông báo:</label>
                            <select
                              className="admin-form-select"
                              value={notifSendTemplateCode}
                              onChange={e => {
                                setNotifSendTemplateCode(e.target.value);
                                setNotifSendVariables('');
                              }}
                              required
                            >
                              <option value="">-- Chọn mẫu thông báo --</option>
                              {notifTemplates.map(t => (
                                <option key={t.id} value={t.code}>{t.code} - {t.title}</option>
                              ))}
                            </select>
                          </div>

                          {notifSendTemplateCode && (
                            <div style={{ background: '#FAF9FF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '11px', color: '#6c5ce7', display: 'block', marginBottom: '4px' }}>NỘI DUNG MẪU GỐC:</strong>
                              <p style={{ margin: 0, fontSize: '11.5px', color: '#4B5563', lineHeight: '1.4' }}>
                                {notifTemplates.find(t => t.code === notifSendTemplateCode)?.message}
                              </p>
                            </div>
                          )}

                          <div className="admin-form-group">
                            <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Các biến số thay thế (Variables):</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              placeholder="Ví dụ: fullName=Minh Anh, reason=Spam"
                              value={notifSendVariables}
                              onChange={e => setNotifSendVariables(e.target.value)}
                            />
                            <small style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                              Ngăn cách các biến bằng dấu phẩy. Cấu trúc: <code>tenBien=giaTri</code>
                            </small>
                          </div>
                        </>
                      )}

                      {/* Link đính kèm */}
                      <div className="admin-form-group">
                        <label style={{ fontSize: '12px', fontWeight: '900', display: 'block', marginBottom: '6px' }}>Đường dẫn điều hướng (Link - Tùy chọn):</label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="Ví dụ: /dashboard/home hoặc https://..."
                          value={notifSendLink}
                          onChange={e => setNotifSendLink(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={notifSending}
                        className="admin-back-btn"
                        style={{
                          alignSelf: 'flex-start', background: '#6c5ce7', color: '#FFFFFF',
                          border: '2px solid #000000', boxShadow: '3px 3px 0px #000000', fontWeight: '900', cursor: 'pointer'
                        }}
                      >
                        {notifSending ? 'Đang gửi...' : 'Phát thông báo ngay ⚡'}
                      </button>
                    </form>
                  </div>

                  {/* Guide card */}
                  <div className="admin-card" style={{ background: '#FAF9FF' }}>
                    <h3 className="chart-card-title">💡 Hướng dẫn hệ thống</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6', color: '#4B5563' }}>
                      <p>
                        Hệ thống <strong>Notification Center</strong> được xây dựng tập trung để phục vụ tất cả các module nghiệp vụ trong ứng dụng EduPath.
                      </p>
                      <div>
                        <strong style={{ display: 'block', color: '#1E293B', marginBottom: '4px' }}>Các biến phổ biến trong Template:</strong>
                        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <li><code>{'{fullName}'}</code>: Tên đầy đủ người nhận.</li>
                          <li><code>{'{email}'}</code>: Địa chỉ email tài khoản.</li>
                          <li><code>{'{courseName}'}</code>: Tên khóa học liên quan.</li>
                          <li><code>{'{teacherName}'}</code>: Tên của thầy/cô giáo viên.</li>
                          <li><code>{'{reason}'}</code>: Lý do phê duyệt, từ chối, khóa tài khoản.</li>
                        </ul>
                      </div>
                      <div style={{ marginTop: '10px', padding: '10px', background: '#E0F2FE', borderRadius: '8px', borderLeft: '4px solid #0284C7' }}>
                        <span style={{ fontWeight: 'bold', color: '#0369A1' }}>Thông báo tức thời (Real-time):</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                          Người dùng đang trực tuyến trên hệ thống sẽ nhận được thông báo ngay lập tức dạng popup kèm âm thanh nhờ vào kênh truyền tin tức thời Socket.IO.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Lịch sử thông báo đã gửi */}
              {notifSubTab === 'history' && (
                <div className="admin-card">
                  <h3 className="chart-card-title">Nhật ký lịch sử thông báo đã phát đi</h3>
                  <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                    Danh sách các thông báo đã gửi cho các tài khoản trên hệ thống EduPath.
                  </p>

                  {notifHistoryLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="admin-spinner" /></div>
                  ) : notifHistory.length > 0 ? (
                    <>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Người nhận</th>
                              <th>Tiêu đề</th>
                              <th>Nội dung thông điệp</th>
                              <th>Danh mục</th>
                              <th>Cấp độ</th>
                              <th>Ngày gửi</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notifHistory.map(h => (
                              <tr key={h.id}>
                                <td><code>#{h.id}</code></td>
                                <td>
                                  {h.recipient ? (
                                    <div>
                                      <div style={{ fontWeight: 'bold' }}>{h.recipient.name}</div>
                                      <div style={{ fontSize: '10.5px', color: '#6B7280' }}>{h.recipient.email}</div>
                                      <span style={{ fontSize: '9px', background: '#E2E8F0', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{h.recipient.role}</span>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#9CA3AF' }}>Bị xóa</span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 'bold' }}>{h.title}</td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '12px', lineHeight: '1.4' }}>{h.message}</td>
                                <td><span style={{ background: '#FAF9FF', padding: '2px 6px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 'bold' }}>{h.category}</span></td>
                                <td>
                                  <span style={{
                                    background: h.type === 'SUCCESS' ? '#D1FAE5' : (h.type === 'WARNING' ? '#FEF3C7' : (h.type === 'ERROR' ? '#FEE2E2' : '#E0F2FE')),
                                    color: h.type === 'SUCCESS' ? '#065F46' : (h.type === 'WARNING' ? '#92400E' : (h.type === 'ERROR' ? '#991B1B' : '#0369A1')),
                                    fontSize: '10.5px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px'
                                  }}>
                                    {h.type}
                                  </span>
                                </td>
                                <td style={{ fontSize: '11.5px', color: '#6B7280' }}>{new Date(h.createdAt).toLocaleString()}</td>
                                <td>
                                  <span style={{
                                    background: h.isRead ? '#E6FFFA' : '#FFF5F5',
                                    color: h.isRead ? '#319795' : '#E53E3E',
                                    fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px'
                                  }}>
                                    {h.isRead ? 'ĐÃ ĐỌC' : 'CHƯA ĐỌC'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {Math.ceil(notifHistoryTotal / 15) > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                          <button
                            disabled={notifHistoryPage === 1}
                            onClick={() => fetchNotifHistory(notifHistoryPage - 1)}
                            className="admin-back-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', background: '#FFFFFF' }}
                          >
                            Trước
                          </button>
                          <span style={{ fontSize: '12.5px', fontWeight: 'bold' }}>Trang {notifHistoryPage} / {Math.ceil(notifHistoryTotal / 15)}</span>
                          <button
                            disabled={notifHistoryPage >= Math.ceil(notifHistoryTotal / 15)}
                            onClick={() => fetchNotifHistory(notifHistoryPage + 1)}
                            className="admin-back-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', background: '#FFFFFF' }}
                          >
                            Sau
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontWeight: 'bold' }}>Chưa có thông báo nào được phát đi.</p>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Quản lý Templates */}
              {notifSubTab === 'templates' && (
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 className="chart-card-title">Danh sách mẫu thông báo tự động</h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                        Các template được dùng để tự động tạo tiêu đề, thông điệp và điều hướng ở backend.
                      </p>
                    </div>

                    <button
                      onClick={() => openTemplateModal()}
                      className="admin-back-btn"
                      style={{
                        background: '#6c5ce7', color: '#FFFFFF', border: '2px solid #000000',
                        boxShadow: '2.5px 2.5px 0px #000000', fontWeight: '900', fontSize: '12.5px',
                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'
                      }}
                    >
                      + Tạo mẫu mới
                    </button>
                  </div>

                  {notifTemplatesLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="admin-spinner" /></div>
                  ) : notifTemplates.length > 0 ? (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Mã (Code)</th>
                            <th>Tiêu đề mặc định</th>
                            <th>Nội dung khuôn mẫu</th>
                            <th>Cấp độ/Danh mục</th>
                            <th>Icon/Link</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notifTemplates.map(t => (
                            <tr key={t.id}>
                              <td><code>{t.code}</code></td>
                              <td style={{ fontWeight: 'bold' }}>{t.title}</td>
                              <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '12px', lineHeight: '1.4' }}>{t.message}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '9px', background: '#F3F4F6', border: '1px solid #E5E7EB', padding: '2px 4px', borderRadius: '4px', alignSelf: 'flex-start', fontWeight: 'bold' }}>{t.category}</span>
                                  <span style={{ fontSize: '9px', background: '#E0F2FE', color: '#0369A1', padding: '2px 4px', borderRadius: '4px', alignSelf: 'flex-start', fontWeight: 'bold' }}>{t.type}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: '11.5px' }}>
                                <div>Icon: <span style={{ fontSize: '15px' }}>{t.icon || '📢'}</span></div>
                                <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>Link: <code>{t.defaultLink || 'Không'}</code></div>
                              </td>
                              <td>
                                <span style={{
                                  background: t.isActive ? '#D1FAE5' : '#F3F4F6',
                                  color: t.isActive ? '#065F46' : '#374151',
                                  fontSize: '10.5px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px'
                                }}>
                                  {t.isActive ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => openTemplateModal(t)}
                                    style={{
                                      padding: '5px 10px', background: '#E0F2FE', color: '#0369A1',
                                      border: '1.5px solid #000000', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    style={{
                                      padding: '5px 10px', background: '#FEE2E2', color: '#EF4444',
                                      border: '1.5px solid #000000', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontWeight: 'bold' }}>Chưa có khuôn mẫu thông báo nào.</p>
                  )}
                </div>
              )}

              {/* Template CRUD Modal */}
              {showTemplateModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
                  alignItems: 'center', zIndex: 9999
                }}>
                  <div className="admin-card" style={{ width: '500px', padding: '24px', position: 'relative', border: '3px solid #000000', boxShadow: '6px 6px 0px #000000' }}>
                    <h3 className="chart-card-title">{editingTemplate ? 'Sửa mẫu thông báo' : 'Tạo mẫu thông báo mới'}</h3>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>

                    <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                      {!editingTemplate && (
                        <div className="admin-form-group">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Mã mẫu (Code - Viết hoa, duy nhất):</label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="Ví dụ: SYSTEM_MAINTENANCE"
                            value={templateFormCode}
                            onChange={e => setTemplateFormCode(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="admin-form-group">
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tiêu đề mặc định:</label>
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="Tiêu đề mẫu..."
                          value={templateFormTitle}
                          onChange={e => setTemplateFormTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="admin-form-group">
                        <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nội dung khuôn mẫu:</label>
                        <textarea
                          className="admin-form-textarea"
                          rows="4"
                          placeholder="Ví dụ: Chào mừng {fullName} đã tham gia học tập..."
                          value={templateFormMessage}
                          onChange={e => setTemplateFormMessage(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="admin-form-group">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Loại (Type):</label>
                          <select
                            className="admin-form-select"
                            value={templateFormType}
                            onChange={e => setTemplateFormType(e.target.value)}
                          >
                            <option value="INFO">INFO</option>
                            <option value="SUCCESS">SUCCESS</option>
                            <option value="WARNING">WARNING</option>
                            <option value="ERROR">ERROR</option>
                          </select>
                        </div>

                        <div className="admin-form-group">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Danh mục (Category):</label>
                          <select
                            className="admin-form-select"
                            value={templateFormCategory}
                            onChange={e => setTemplateFormCategory(e.target.value)}
                          >
                            <option value="SYSTEM">SYSTEM</option>
                            <option value="ACCOUNT">ACCOUNT</option>
                            <option value="COURSE">COURSE</option>
                            <option value="EXAM">EXAM</option>
                            <option value="PAYMENT">PAYMENT</option>
                            <option value="AI">AI</option>
                            <option value="REPORT">REPORT</option>
                            <option value="TEACHER">TEACHER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="admin-form-group">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Biểu tượng (Emoji - Tùy chọn):</label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="Ví dụ: ⚙️"
                            value={templateFormIcon}
                            onChange={e => setTemplateFormIcon(e.target.value)}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Link mặc định (Tùy chọn):</label>
                          <input
                            type="text"
                            className="admin-form-input"
                            placeholder="Ví dụ: /dashboard/home"
                            value={templateFormLink}
                            onChange={e => setTemplateFormLink(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="tpl-active"
                          checked={templateFormActive}
                          onChange={e => setTemplateFormActive(e.target.checked)}
                        />
                        <label htmlFor="tpl-active" style={{ fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Kích hoạt hoạt động (Active)</label>
                      </div>

                      <button
                        type="submit"
                        disabled={templateSubmitting}
                        className="admin-back-btn"
                        style={{
                          background: '#6c5ce7', color: '#FFFFFF', border: '2.5px solid #000000',
                          boxShadow: '3px 3px 0px #000000', fontWeight: '950', marginTop: '10px'
                        }}
                      >
                        {templateSubmitting ? 'Đang lưu...' : 'Lưu mẫu cấu hình ➔'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* ==========================================
              TAB: USERS LIST & VERIFY
              ========================================== */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Thống kê Người dùng */}
              <div className="stats-row-5col" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '0' }}>
                {renderKpiCard('Tổng Người dùng', <HiUsers />, { value: userStats.totalUsers, change: 0, description: 'Tài khoản hệ thống' }, 'blue')}
                {renderKpiCard('Tổng Học sinh', <HiUsers />, { value: userStats.totalStudents, change: 0, description: 'Vai trò STUDENT' }, 'green')}
                {renderKpiCard('Tổng Giáo viên', <HiUsers />, { value: userStats.totalTeachers, change: 0, description: 'Vai trò TEACHER' }, 'purple')}
                {renderKpiCard('Bị khóa', <HiUsers />, { value: userStats.totalBlocked, change: 0, description: 'Trạng thái BLOCKED' }, 'amber')}
              </div>

              {/* Bộ lọc & Tìm kiếm */}
              <div className="admin-card" style={{ marginBottom: '0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '16px', alignItems: 'center' }}>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Tìm theo tên hoặc email..."
                      value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>

                  {/* Role filter */}
                  <select
                    className="admin-form-input"
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                    style={{ height: '40px', padding: '0 10px' }}
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="STUDENT">Học sinh (STUDENT)</option>
                    <option value="TEACHER">Giáo viên (TEACHER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>

                  {/* Status filter */}
                  <select
                    className="admin-form-input"
                    value={userStatusFilter}
                    onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                    style={{ height: '40px', padding: '0 10px' }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="BLOCKED">Bị khóa (BLOCKED)</option>
                  </select>

                  {/* Date range filter */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={userStartDate}
                      onChange={(e) => { setUserStartDate(e.target.value); setUserPage(1); }}
                      style={{ fontSize: '11px', height: '40px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>-</span>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={userEndDate}
                      onChange={(e) => { setUserEndDate(e.target.value); setUserPage(1); }}
                      style={{ fontSize: '11px', height: '40px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Bảng danh sách người dùng */}
              <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="chart-card-title" style={{ margin: 0 }}>DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG</h3>
                  {usersLoading && <div className="stats-spinner" style={{ width: '20px', height: '20px' }} />}
                </div>

                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Avatar</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'center' }}>Vai trò</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th>Ngày đăng ký</th>
                        <th>Lần đăng nhập cuối</th>
                        <th style={{ textAlign: 'center', width: '200px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(user => {
                        const isSelf = user.id === currentUser?.id;
                        return (
                          <tr key={user.id} style={{ opacity: usersLoading ? 0.5 : 1 }}>
                            <td style={{ textAlign: 'center' }}>
                              {user.avatarUrl && (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('data:')) ? (
                                <img
                                  src={user.avatarUrl}
                                  alt="Avatar"
                                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #000' }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: user.role === 'ADMIN' ? '#EF4444' : user.role === 'TEACHER' ? '#3B82F6' : '#10B981',
                                  color: '#FFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  margin: '0 auto',
                                  border: '1.5px solid #000'
                                }}>
                                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: '800' }}>{user.name}</td>
                            <td>{user.email}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '800',
                                border: '1.5px solid #000',
                                background: user.role === 'ADMIN' ? '#FEE2E2' : user.role === 'TEACHER' ? '#DBEAFE' : '#D1FAE5',
                                color: user.role === 'ADMIN' ? '#991B1B' : user.role === 'TEACHER' ? '#1E40AF' : '#065F46'
                              }}>
                                {user.role}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '800',
                                border: '1.5px solid #000',
                                background: user.status === 'BLOCKED' ? '#F3F4F6' : '#D1FAE5',
                                color: user.status === 'BLOCKED' ? '#374151' : '#065F46'
                              }}>
                                {user.status === 'BLOCKED' ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}
                              </span>
                            </td>
                            <td>{user.registeredDate}</td>
                            <td>
                              {user.lastLoginAt ? (
                                new Date(user.lastLoginAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              ) : (
                                <span style={{ color: '#7A7A7A', fontStyle: 'italic' }}>Chưa đăng nhập</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  className="admin-table-btn"
                                  style={{ background: '#3B82F6', color: '#FFF', borderColor: '#000' }}
                                  onClick={() => handleViewUserDetail(user.id)}
                                >
                                  Chi tiết
                                </button>
                                {user.status === 'BLOCKED' ? (
                                  <button
                                    className="admin-table-btn"
                                    style={{ background: '#10B981', color: '#FFF', borderColor: '#000' }}
                                    onClick={() => { setUserToUnblock(user); setShowUnblockModal(true); }}
                                  >
                                    Mở khóa
                                  </button>
                                ) : (
                                  <button
                                    className="admin-table-btn"
                                    style={{ background: '#EF4444', color: '#FFF', borderColor: '#000', opacity: isSelf ? 0.5 : 1 }}
                                    disabled={isSelf}
                                    title={isSelf ? 'Bạn không thể tự khóa chính mình' : ''}
                                    onClick={() => { setUserToBlock(user); setShowBlockModal(true); }}
                                  >
                                    Khóa
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {adminUsers.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#7A7A7A', fontWeight: 'bold' }}>
                            Không tìm thấy tài khoản người dùng nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {userPagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="admin-back-btn"
                      style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none', opacity: userPage === 1 ? 0.5 : 1 }}
                      disabled={userPage === 1}
                      onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                    >
                      Trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', padding: '0 8px' }}>
                      Trang {userPage} / {userPagination.totalPages} (Tổng: {userPagination.total})
                    </span>
                    <button
                      className="admin-back-btn"
                      style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none', opacity: userPage === userPagination.totalPages ? 0.5 : 1 }}
                      disabled={userPage === userPagination.totalPages}
                      onClick={() => setUserPage(prev => Math.min(userPagination.totalPages, prev + 1))}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: QUẢN LÝ GIÁO VIÊN
              ========================================== */}
          {activeTab === 'teachers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Thống kê Giáo viên */}
              <div className="stats-row-5col" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '0' }}>
                {renderKpiCard('Tổng Giáo viên', <HiAcademicCap />, teacherStats.totalTeachers, 'blue')}
                {renderKpiCard('Hồ sơ chờ duyệt', <HiClipboardCheck />, teacherStats.pendingProfiles, 'amber')}
                {renderKpiCard('Hồ sơ đã duyệt', <HiPlus />, teacherStats.approvedProfiles, 'green')}
                {renderKpiCard('Tài khoản bị khóa', <HiUsers />, teacherStats.blockedTeachers, 'purple')}
              </div>

              {/* Bộ lọc & Tìm kiếm & Nút Tạo giáo viên */}
              <div className="admin-card" style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  <span style={{ fontSize: '13.5px', color: '#7A7A7A', fontWeight: '800' }}>
                    Tìm kiếm và lọc danh sách giáo viên trong hệ thống
                  </span>
                  <button 
                    className="admin-back-btn" 
                    style={{ background: '#1C2B17', color: '#FFFFFF', width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setShowCreateTeacherModal(true)}
                  >
                    <HiPlus /> Tạo tài khoản Giáo viên ⚡
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {/* Search input */}
                  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Tìm theo Tên, Email hoặc Số điện thoại..."
                      value={teacherSearch}
                      onChange={(e) => { setTeacherSearch(e.target.value); setTeacherPage(1); }}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>

                  {/* Filter by Profile Status */}
                  <div style={{ width: '160px' }}>
                    <select
                      className="admin-filter-select"
                      value={teacherProfileStatusFilter}
                      onChange={(e) => { setTeacherProfileStatusFilter(e.target.value); setTeacherPage(1); }}
                      style={{ width: '100%', height: '100%', minHeight: '38px' }}
                    >
                      <option value="all">Trạng thái hồ sơ: Tất cả</option>
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="APPROVED">Đã duyệt</option>
                      <option value="REJECTED">Bị từ chối</option>
                    </select>
                  </div>

                  {/* Filter by Account Status */}
                  <div style={{ width: '160px' }}>
                    <select
                      className="admin-filter-select"
                      value={teacherAccountStatusFilter}
                      onChange={(e) => { setTeacherAccountStatusFilter(e.target.value); setTeacherPage(1); }}
                      style={{ width: '100%', height: '100%', minHeight: '38px' }}
                    >
                      <option value="all">Tài khoản: Tất cả</option>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="BLOCKED">Bị khóa</option>
                    </select>
                  </div>

                  {/* Filter by Subject */}
                  <div style={{ width: '160px' }}>
                    <select
                      className="admin-filter-select"
                      value={teacherSubjectFilter}
                      onChange={(e) => { setTeacherSubjectFilter(e.target.value); setTeacherPage(1); }}
                      style={{ width: '100%', height: '100%', minHeight: '38px' }}
                    >
                      <option value="all">Môn giảng dạy: Tất cả</option>
                      <option value="Toán học">Toán học</option>
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                    </select>
                  </div>
                </div>

                {/* Bảng Giáo viên */}
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Avatar</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Môn học</th>
                        <th style={{ textAlign: 'center' }}>Hồ sơ</th>
                        <th style={{ textAlign: 'center' }}>Tài khoản</th>
                        <th>Ngày đăng ký</th>
                        <th style={{ textAlign: 'center', width: '240px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminTeachers.map(teacher => {
                        const profileStatus = teacher.profile?.status || 'Chưa tạo';
                        const accountStatus = teacher.accountStatus;
                        return (
                          <tr key={teacher.id} style={{ opacity: teachersLoading ? 0.5 : 1 }}>
                            <td style={{ textAlign: 'center' }}>
                              {teacher.avatarUrl && (teacher.avatarUrl.startsWith('http') || teacher.avatarUrl.startsWith('data:')) ? (
                                <img
                                  src={teacher.avatarUrl}
                                  alt="Avatar"
                                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #000' }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#3B82F6',
                                  color: '#FFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  margin: '0 auto',
                                  border: '1.5px solid #000'
                                }}>
                                  {teacher.name ? teacher.name.slice(0, 2).toUpperCase() : 'TA'}
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: '800' }}>{teacher.name}</td>
                            <td>{teacher.email}</td>
                            <td>{teacher.phone || <span style={{ color: '#7A7A7A', fontStyle: 'italic' }}>Chưa có</span>}</td>
                            <td>
                              <span style={{ fontWeight: '750', color: '#1C2B17' }}>
                                {teacher.profile?.subjects || <span style={{ color: '#7A7A7A', fontStyle: 'italic' }}>Chưa thiết lập</span>}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '800',
                                border: '1.5px solid #000',
                                background: profileStatus === 'APPROVED' ? '#D1FAE5' : profileStatus === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                                color: profileStatus === 'APPROVED' ? '#065F46' : profileStatus === 'PENDING' ? '#D97706' : '#991B1B'
                              }}>
                                {profileStatus === 'APPROVED' ? 'ĐÃ DUYỆT' : profileStatus === 'PENDING' ? 'CHỜ DUYỆT' : profileStatus === 'REJECTED' ? 'BỊ TỪ CHỐI' : profileStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '800',
                                border: '1.5px solid #000',
                                background: accountStatus === 'BLOCKED' ? '#F3F4F6' : '#D1FAE5',
                                color: accountStatus === 'BLOCKED' ? '#374151' : '#065F46'
                              }}>
                                {accountStatus === 'BLOCKED' ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}
                              </span>
                            </td>
                            <td>{teacher.registeredDate}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                                <button
                                  className="admin-table-btn"
                                  style={{ background: '#3B82F6', color: '#FFF', borderColor: '#000' }}
                                  onClick={() => handleViewTeacherDetail(teacher.id)}
                                >
                                  Chi tiết
                                </button>
                                {profileStatus === 'PENDING' && (
                                  <>
                                    <button
                                      className="admin-table-btn"
                                      style={{ background: '#10B981', color: '#FFF', borderColor: '#000' }}
                                      onClick={() => handleApproveTeacherSubmit(teacher.id)}
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      className="admin-table-btn"
                                      style={{ background: '#EF4444', color: '#FFF', borderColor: '#000' }}
                                      onClick={() => handleOpenRejectTeacherModal(teacher)}
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {accountStatus === 'BLOCKED' ? (
                                  <button
                                    className="admin-table-btn"
                                    style={{ background: '#10B981', color: '#FFF', borderColor: '#000' }}
                                    onClick={() => { setTeacherToUnblock(teacher); setShowTeacherUnblockModal(true); }}
                                  >
                                    Mở khóa
                                  </button>
                                ) : (
                                  <button
                                    className="admin-table-btn"
                                    style={{ background: '#EF4444', color: '#FFF', borderColor: '#000' }}
                                    onClick={() => { setTeacherToBlock(teacher); setShowTeacherBlockModal(true); }}
                                  >
                                    Khóa
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {adminTeachers.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#7A7A7A', fontWeight: 'bold' }}>
                            Không tìm thấy tài khoản giáo viên nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {teacherPagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="admin-back-btn"
                      style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none', opacity: teacherPage === 1 ? 0.5 : 1 }}
                      disabled={teacherPage === 1}
                      onClick={() => setTeacherPage(prev => Math.max(1, prev - 1))}
                    >
                      Trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', padding: '0 8px' }}>
                      Trang {teacherPage} / {teacherPagination.totalPages} (Tổng: {teacherPagination.total})
                    </span>
                    <button
                      className="admin-back-btn"
                      style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none', opacity: teacherPage === teacherPagination.totalPages ? 0.5 : 1 }}
                      disabled={teacherPage === teacherPagination.totalPages}
                      onClick={() => setTeacherPage(prev => Math.min(teacherPagination.totalPages, prev + 1))}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ==========================================
              TAB: QUẢN LÝ KHÓA HỌC
              ========================================== */}
          {activeTab === 'courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Thống kê Khóa học */}
              <div className="stats-row-5col" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '0' }}>
                {renderKpiCard('Tổng số khóa học', <HiBookOpen />, { value: courseStats.totalCourses, change: 0, description: 'Khóa học trong hệ thống' }, 'blue')}
                {renderKpiCard('Chờ duyệt', <HiClipboardCheck />, { value: courseStats.pendingCourses, change: 0, description: 'Cần Admin phê duyệt' }, 'amber')}
                {renderKpiCard('Đã duyệt', <HiPlus />, { value: courseStats.approvedCourses, change: 0, description: 'Trạng thái APPROVED' }, 'green')}
                {renderKpiCard('Bị từ chối', <HiUsers />, { value: courseStats.rejectedCourses, change: 0, description: 'Trạng thái REJECTED' }, 'purple')}
              </div>
              <div className="stats-row-5col" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '0' }}>
                {renderKpiCard('Đang bị ẩn', <HiBookOpen />, { value: courseStats.hiddenCourses, change: 0, description: 'Trạng thái HIDDEN' }, 'amber')}
                {renderKpiCard('Tổng học viên tham gia', <HiUsers />, { value: courseStats.totalStudentsEnrolled, change: 0, description: 'Học viên đăng ký học' }, 'blue')}
                {renderKpiCard('Tổng doanh thu khóa học', <HiTrendingUp />, { value: courseStats.totalRevenue, change: 0, description: 'Doanh thu học phí' }, 'green')}
              </div>

              {/* Bộ lọc & Tìm kiếm */}
              <div className="admin-card" style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Hàng 1: Tabs phân loại trạng thái duyệt */}
                  <div className="admin-sub-tabs" style={{ marginBottom: '0', borderBottom: 'none', paddingBottom: '0' }}>
                    <button 
                      className={`admin-sub-tab-btn ${courseActiveTab === 'all' ? 'active' : ''}`}
                      onClick={() => { setCourseActiveTab('all'); setCoursePage(1); }}
                    >
                      Tất cả khóa học
                    </button>
                    <button 
                      className={`admin-sub-tab-btn ${courseActiveTab === 'pending' ? 'active' : ''}`}
                      onClick={() => { setCourseActiveTab('pending'); setCoursePage(1); }}
                    >
                      Chờ duyệt ({courseStats.pendingCourses})
                    </button>
                    <button 
                      className={`admin-sub-tab-btn ${courseActiveTab === 'approved' ? 'active' : ''}`}
                      onClick={() => { setCourseActiveTab('approved'); setCoursePage(1); }}
                    >
                      Đã duyệt ({courseStats.approvedCourses})
                    </button>
                    <button 
                      className={`admin-sub-tab-btn ${courseActiveTab === 'rejected' ? 'active' : ''}`}
                      onClick={() => { setCourseActiveTab('rejected'); setCoursePage(1); }}
                    >
                      Bị từ chối ({courseStats.rejectedCourses})
                    </button>
                    <button 
                      className={`admin-sub-tab-btn ${courseActiveTab === 'hidden' ? 'active' : ''}`}
                      onClick={() => { setCourseActiveTab('hidden'); setCoursePage(1); }}
                    >
                      Đang bị ẩn ({courseStats.hiddenCourses})
                    </button>
                  </div>

                  {/* Hàng 2: Ô tìm kiếm + Lọc môn học */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                      <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="Tìm theo tên khóa học hoặc giáo viên..."
                        value={courseSearch}
                        onChange={(e) => { setCourseSearch(e.target.value); setCoursePage(1); }}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>

                    {/* Subject Filter */}
                    <select
                      className="admin-form-input"
                      value={courseSubjectFilter}
                      onChange={(e) => { setCourseSubjectFilter(e.target.value); setCoursePage(1); }}
                      style={{ height: '40px', padding: '0 10px' }}
                    >
                      <option value="all">Tất cả môn học</option>
                      <option value="Toán học">Toán học</option>
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                    </select>

                    {/* Price range */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        className="admin-form-input"
                        placeholder="Giá từ..."
                        value={coursePriceFrom}
                        onChange={(e) => { setCoursePriceFrom(e.target.value); setCoursePage(1); }}
                        style={{ height: '40px', fontSize: '12px' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>-</span>
                      <input
                        type="number"
                        className="admin-form-input"
                        placeholder="đến..."
                        value={coursePriceTo}
                        onChange={(e) => { setCoursePriceTo(e.target.value); setCoursePage(1); }}
                        style={{ height: '40px', fontSize: '12px' }}
                      />
                    </div>

                    {/* Date range */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="date"
                        className="admin-form-input"
                        value={courseFromDate}
                        onChange={(e) => { setCourseFromDate(e.target.value); setCoursePage(1); }}
                        style={{ fontSize: '11px', height: '40px', padding: '0 8px' }}
                        title="Ngày tạo từ"
                      />
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>-</span>
                      <input
                        type="date"
                        className="admin-form-input"
                        value={courseToDate}
                        onChange={(e) => { setCourseToDate(e.target.value); setCoursePage(1); }}
                        style={{ fontSize: '11px', height: '40px', padding: '0 8px' }}
                        title="Ngày tạo đến"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng danh sách khóa học */}
              <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="chart-card-title" style={{ margin: 0 }}>DANH SÁCH KHÓA HỌC HỆ THỐNG</h3>
                  {coursesLoading && <div className="stats-spinner" style={{ width: '20px', height: '20px' }} />}
                </div>

                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center', whiteSpace: 'nowrap' }}>Ảnh bìa</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Tên khóa học</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Giáo viên</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Môn học</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Giá bán</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Học viên</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Doanh thu</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Phê duyệt</th>
                        <th style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Hiển thị</th>
                        <th style={{ textAlign: 'center', width: '180px', whiteSpace: 'nowrap' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCourses.map(course => {
                        return (
                          <tr key={course.id} style={{ opacity: coursesLoading ? 0.5 : 1 }}>
                            <td style={{ textAlign: 'center' }}>
                              {course.thumbnailUrl && (course.thumbnailUrl.startsWith('http') || course.thumbnailUrl.startsWith('data:')) ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt="Thumbnail"
                                  style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1.5px solid #000' }}
                                />
                              ) : (
                                <div style={{
                                  width: '48px',
                                  height: '36px',
                                  borderRadius: '4px',
                                  background: '#E8ECF1',
                                  color: '#2D3229',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  margin: '0 auto',
                                  border: '1.5px solid #000'
                                }}>
                                  {course.subject ? course.subject.slice(0, 2).toUpperCase() : 'KH'}
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: '850', fontSize: '13.5px', maxWidth: '200px' }} title={course.title}>
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {course.title}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>{course.teacherName}</div>
                              <div style={{ fontSize: '10.5px', color: '#7A7A7A', whiteSpace: 'nowrap' }}>{course.teacherEmail}</div>
                            </td>
                            <td style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>{course.subject}</td>
                            <td style={{ fontWeight: '850', color: '#1C2B17', whiteSpace: 'nowrap' }}>
                              {course.discount > 0 ? (
                                <div>
                                  <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#7A7A7A' }}>{formatCurrency(course.price)}</div>
                                  <div style={{ color: '#EF4444' }}>{formatCurrency(course.price * (1 - course.discount / 100))}</div>
                                </div>
                              ) : (
                                formatCurrency(course.price)
                              )}
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '800', fontSize: '13.5px' }}>
                                {course.enrolledCount} / {course.completedCount}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700' }}>
                                {course.completionRate}% hoàn thành
                              </div>
                            </td>
                            <td style={{ fontWeight: '850', color: '#2563EB', whiteSpace: 'nowrap' }}>{formatCurrency(course.revenue)}</td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '850',
                                border: '1.5px solid #000',
                                background: course.status === 'APPROVED' ? '#D1FAE5' : course.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                                color: course.status === 'APPROVED' ? '#065F46' : course.status === 'PENDING' ? '#D97706' : '#991B1B',
                                whiteSpace: 'nowrap'
                              }}>
                                {course.status === 'APPROVED' ? 'ĐÃ DUYỆT' : course.status === 'PENDING' ? 'CHỜ DUYỆT' : 'BỊ TỪ CHỐI'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '850',
                                border: '1.5px solid #000',
                                background: course.visibility === 'VISIBLE' ? '#D1FAE5' : '#F3F4F6',
                                color: course.visibility === 'VISIBLE' ? '#065F46' : '#374151',
                                whiteSpace: 'nowrap'
                              }}>
                                {course.visibility === 'VISIBLE' ? 'HIỂN THỊ' : 'ẨN'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                                <button
                                  className="admin-table-btn"
                                  style={{ background: '#3B82F6', color: '#FFF', borderColor: '#000' }}
                                  onClick={() => handleViewCourseDetail(course.id)}
                                >
                                  Chi tiết
                                </button>
                                {course.status === 'PENDING' && (
                                  <>
                                    <button
                                      className="admin-table-btn"
                                      style={{ background: '#10B981', color: '#FFF', borderColor: '#000' }}
                                      onClick={() => handleApproveCourseSubmit(course.id)}
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      className="admin-table-btn"
                                      style={{ background: '#EF4444', color: '#FFF', borderColor: '#000' }}
                                      onClick={() => handleOpenRejectCourseModal(course)}
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {course.status === 'APPROVED' && (
                                  course.visibility === 'VISIBLE' ? (
                                    <button
                                      className="admin-table-btn"
                                      style={{ background: '#F59E0B', color: '#FFF', borderColor: '#000' }}
                                      onClick={() => handleOpenHideCourseModal(course)}
                                    >
                                      Ẩn
                                    </button>
                                  ) : (
                                    <button
                                      className="admin-table-btn"
                                      style={{ background: '#10B981', color: '#FFF', borderColor: '#000' }}
                                      onClick={() => handleShowCourseSubmit(course.id)}
                                    >
                                      Hiện
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {adminCourses.length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#7A7A7A', fontWeight: 'bold' }}>
                            Không tìm thấy khóa học nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {coursePagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button
                      className="admin-back-btn"
                      style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none', opacity: coursePage === 1 ? 0.5 : 1 }}
                      disabled={coursePage === 1}
                      onClick={() => setCoursePage(prev => Math.max(1, prev - 1))}
                    >
                      Trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', padding: '0 8px' }}>
                      Trang {coursePage} / {coursePagination.totalPages} (Tổng: {coursePagination.total})
                    </span>
                    <button
                      className="admin-back-btn"
                      style={{ padding: '4px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none', opacity: coursePage === coursePagination.totalPages ? 0.5 : 1 }}
                      disabled={coursePage === coursePagination.totalPages}
                      onClick={() => setCoursePage(prev => Math.min(coursePagination.totalPages, prev + 1))}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ==========================================
              TAB: LEADS REGISTRY
              ========================================== */}
          {activeTab === 'leads' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13.5px', color: '#7A7A7A', fontWeight: '800' }}>
                  Danh sách Leads đăng ký form tư vấn lộ trình thích ứng
                </span>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '260px' }}>
                  <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="Tìm leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    style={{ paddingLeft: '32px', height: '36px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="leads-table-container">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Điện thoại</th>
                      <th>Email</th>
                      <th>Combo đăng ký</th>
                      <th>Ngày đăng ký</th>
                      <th style={{ textAlign: 'center' }}>Trạng thái (Click đổi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id}>
                        <td>{lead.name}</td>
                        <td>{lead.phone}</td>
                        <td>{lead.email}</td>
                        <td>{lead.target}</td>
                        <td>{lead.registeredDate}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span 
                            onClick={() => handleToggleLeadStatus(lead.id, lead.status)}
                            className={`lead-status-badge ${
                              lead.status === 'Chờ tư vấn' ? 'pending' : (lead.status === 'Đã liên hệ' ? 'contacted' : 'success')
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#7A7A7A' }}>
                          Không tìm thấy leads nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: SYSTEM SETTINGS MANAGEMENT (QUẢN LÝ CHỨC NĂNG & THÔNG SỐ HỆ THỐNG)
              ========================================== */}
          {activeTab === 'features' && (() => {
            const getFriendlySettingName = (key) => {
              switch (key) {
                case 'AI_ENABLED':
                  return 'Kích hoạt Trợ lý ảo AI Coach';
                case 'REGISTRATION_ENABLED':
                  return 'Cho phép Đăng ký tài khoản';
                case 'PAYMENT_ENABLED':
                  return 'Kích hoạt Cổng thanh toán';
                case 'COURSE_CREATION_ENABLED':
                  return 'Cho phép Tạo khóa học mới';
                case 'MAINTENANCE_MODE':
                  return 'Chế độ Bảo trì hệ thống';
                case 'FREE_AI_QUESTION_LIMIT':
                  return 'Lượt hỏi AI miễn phí / ngày';
                case 'MAX_UPLOAD_SIZE_MB':
                  return 'Dung lượng tải lên tối đa (MB)';
                case 'PREMIUM_MONTHLY_PRICE':
                  return 'Giá Premium theo tháng (VND)';
                case 'PREMIUM_YEARLY_PRICE':
                  return 'Giá Premium theo năm (VND)';
                case 'LOG_SYNC_INTERVAL_MINUTES':
                  return 'Chu kỳ đồng bộ log (phút)';
                case 'LOG_RETENTION_DAYS':
                  return 'Số ngày lưu log trong DB';
                default:
                  return key;
              }
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Header Tab */}
                <div style={{
                  background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
                  padding: '24px',
                  borderRadius: '16px',
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(108, 92, 227, 0.15)',
                  border: '2px solid #000'
                }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚙️ Cấu Hình Hệ Thống & Quản Lý Chức Năng Admin
                  </h2>
                  <p style={{ fontSize: '13.5px', opacity: 0.9, margin: 0, fontWeight: '500' }}>
                    Kiểm soát bật/tắt các module tính năng trực quan và thay đổi các tham số giới hạn, định giá Premium tại thời gian chạy (runtime) mà không cần cấu hình file .env hay khởi động lại máy chủ.
                  </p>
                </div>

                {loadingSettings ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px',
                    background: '#fff',
                    border: '2px solid #000',
                    borderRadius: '16px',
                    boxShadow: '4px 4px 0px #000'
                  }}>
                    <div className="spin" style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
                    <span style={{ fontWeight: '800', fontSize: '16px' }}>Đang nạp dữ liệu cấu hình từ Database...</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
                    
                    {/* NHÓM 1: BẬT / TẮT CHỨC NĂNG HỆ THỐNG */}
                    <div className="admin-card" style={{ marginBottom: 0, border: '2.5px solid #000', borderRadius: '16px', padding: '24px', background: '#fff' }}>
                      <div style={{ borderBottom: '2px solid #F3F4F6', paddingBottom: '16px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🟢 Nhóm 1: Bật/Tắt Chức Năng Hệ Thống (Feature Switches)
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0', fontWeight: '600' }}>
                          Các tính năng dưới đây áp dụng trực tiếp lên trải nghiệm người dùng cuối ngay khi thay đổi.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                        {systemSettings.filter(s => s.type === 'BOOLEAN').map(setting => {
                          const isEnabled = setting.value === 'true';
                          
                          return (
                            <div 
                              key={setting.key} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                border: '2px solid #000',
                                borderRadius: '12px',
                                background: '#FCFBFA',
                                boxShadow: '2px 2px 0px #000',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ marginRight: '16px' }}>
                                <div style={{ fontSize: '14.5px', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span>{getFriendlySettingName(setting.key)}</span>
                                  <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'monospace', background: '#E5E7EB', padding: '1px 5px', borderRadius: '4px', fontWeight: 'normal' }}>
                                    {setting.key}
                                  </span>
                                  {setting.key === 'MAINTENANCE_MODE' && isEnabled && (
                                    <span style={{ fontSize: '10px', background: '#F59E0B', color: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #000', fontWeight: 'bold' }}>
                                      ĐANG BẢO TRÌ
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', lineHeight: 1.3 }}>
                                  {setting.description || 'Không có mô tả chi tiết cho cấu hình này.'}
                                </div>
                              </div>

                              {/* Premium Toggle Switch */}
                              <div 
                                onClick={async () => {
                                  const nextVal = isEnabled ? 'false' : 'true';
                                  if (window.confirm(`Bạn có chắc chắn muốn ${isEnabled ? 'TẮT' : 'BẬT'} cấu hình "${getFriendlySettingName(setting.key)}"?`)) {
                                    try {
                                      const { api } = await import('../api');
                                      const res = await api.updateAdminSystemSettings([{ key: setting.key, value: nextVal }]);
                                      if (res) {
                                        toast(`Đã cập nhật cấu hình ${getFriendlySettingName(setting.key)} thành công!`, 'success');
                                        setSystemSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: nextVal } : s));
                                        if (addLog) addLog(`[ADMIN] Bật/tắt cấu hình ${setting.key} = ${nextVal}`, 'info');
                                      }
                                    } catch (err) {
                                      toast(`Lỗi cập nhật cấu hình: ${err.message}`, 'error');
                                    }
                                  }
                                }}
                                style={{
                                  width: '56px',
                                  height: '28px',
                                  borderRadius: '14px',
                                  background: isEnabled ? 'linear-gradient(135deg, #10B981, #059669)' : '#D1D5DB',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: isEnabled ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none',
                                  border: '2px solid #000',
                                  flexShrink: 0
                                }}
                              >
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: '#FFFFFF',
                                  position: 'absolute',
                                  top: '2px',
                                  left: isEnabled ? '30px' : '2px',
                                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                  border: '1.5px solid #000'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* NHÓM 2: CẤU HÌNH THÔNG SỐ HỆ THỐNG */}
                    <div className="admin-card" style={{ marginBottom: 0, border: '2.5px solid #000', borderRadius: '16px', padding: '24px', background: '#fff' }}>
                      <div style={{ borderBottom: '2px solid #F3F4F6', paddingBottom: '16px', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🛠️ Nhóm 2: Cấu Hân Tham Số Hệ Thống & Giới Hạn (System Parameters)
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0', fontWeight: '600' }}>
                          Điều chỉnh các hạn mức vận hành, thời gian chu kỳ hoặc biểu phí thanh toán Premium trực quan.
                        </p>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setSavingSettings(true);

                        // Client-side Validations
                        const freeLimit = Number(formSettings.FREE_AI_QUESTION_LIMIT);
                        if (isNaN(freeLimit) || freeLimit < 0) {
                          toast('Số câu hỏi AI miễn phí phải lớn hơn hoặc bằng 0!', 'error');
                          setSavingSettings(false);
                          return;
                        }

                        const uploadLimit = Number(formSettings.MAX_UPLOAD_SIZE_MB);
                        if (isNaN(uploadLimit) || uploadLimit < 1 || uploadLimit > 500) {
                          toast('Dung lượng upload cho phép phải từ 1 đến 500MB!', 'error');
                          setSavingSettings(false);
                          return;
                        }

                        const monthlyPrice = Number(formSettings.PREMIUM_MONTHLY_PRICE);
                        if (isNaN(monthlyPrice) || monthlyPrice <= 0) {
                          toast('Giá Premium theo tháng phải lớn hơn 0 VND!', 'error');
                          setSavingSettings(false);
                          return;
                        }

                        const yearlyPrice = Number(formSettings.PREMIUM_YEARLY_PRICE);
                        if (isNaN(yearlyPrice) || yearlyPrice <= 0) {
                          toast('Giá Premium theo năm phải lớn hơn 0 VND!', 'error');
                          setSavingSettings(false);
                          return;
                        }

                        const logInterval = Number(formSettings.LOG_SYNC_INTERVAL_MINUTES);
                        if (isNaN(logInterval) || logInterval < 1 || logInterval > 60) {
                          toast('Chu kỳ đồng bộ Google Sheet phải từ 1 đến 60 phút!', 'error');
                          setSavingSettings(false);
                          return;
                        }

                        const logRetention = Number(formSettings.LOG_RETENTION_DAYS);
                        if (isNaN(logRetention) || logRetention < 1) {
                          toast('Số ngày lưu System Log phải từ 1 ngày trở lên!', 'error');
                          setSavingSettings(false);
                          return;
                        }

                        try {
                          const { api } = await import('../api');
                          const updates = Object.keys(formSettings).map(key => ({
                            key,
                            value: String(formSettings[key])
                          }));

                          const res = await api.updateAdminSystemSettings(updates);
                          if (res) {
                            toast('Đã lưu các thông số cấu hình hệ thống thành công!', 'success');
                            if (addLog) addLog(`[ADMIN] Đã cập nhật hàng loạt tham số cấu hình hệ thống`, 'info');
                            fetchSystemSettings(); // Refresh
                          }
                        } catch (err) {
                          toast(`Lưu cấu hình thất bại: ${err.message}`, 'error');
                        } finally {
                          setSavingSettings(false);
                        }
                      }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                          {systemSettings.filter(s => s.type !== 'BOOLEAN').map(setting => {
                            return (
                              <div key={setting.key} className="admin-form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '13.5px', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
                                  {getFriendlySettingName(setting.key)}{' '}
                                  <span style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'normal', background: '#E5E7EB', padding: '1px 5px', borderRadius: '4px' }}>
                                    {setting.key}
                                  </span>
                                </label>
                                
                                <input
                                  type="text"
                                  className="admin-input"
                                  value={formSettings[setting.key] || ''}
                                  onChange={(e) => setFormSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    border: '2px solid #000',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    background: '#fff',
                                    boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.05)'
                                  }}
                                />

                                <span style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '4px', fontWeight: '500' }}>
                                  {setting.description}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '16px', borderTop: '2px solid #F3F4F6', paddingTop: '20px' }}>
                          <button
                            type="submit"
                            className="admin-back-btn"
                            disabled={savingSettings}
                            style={{
                              background: '#6C5CE7',
                              color: '#fff',
                              border: '2.5px solid #000',
                              boxShadow: '3px 3px 0px #000',
                              padding: '12px 28px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              borderRadius: '8px'
                            }}
                          >
                            {savingSettings ? 'Đang lưu thay đổi...' : '💾 Lưu thay đổi thông số'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ thông số cấu hình về giá trị mặc định ban đầu?')) {
                                setFormSettings({
                                  FREE_AI_QUESTION_LIMIT: '20',
                                  MAX_UPLOAD_SIZE_MB: '50',
                                  PREMIUM_MONTHLY_PRICE: '199000',
                                  PREMIUM_YEARLY_PRICE: '1990000',
                                  LOG_SYNC_INTERVAL_MINUTES: '5',
                                  LOG_RETENTION_DAYS: '7'
                                });
                                toast('Đã nạp các giá trị mặc định. Hãy nhấn "Lưu thay đổi" để áp dụng!', 'info');
                              }
                            }}
                            className="admin-back-btn"
                            style={{
                              background: '#F3F4F6',
                              color: '#000',
                              border: '2.5px solid #000',
                              boxShadow: '3px 3px 0px #000',
                              padding: '12px 28px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              borderRadius: '8px'
                            }}
                          >
                            🔄 Khôi phục mặc định
                          </button>
                        </div>

                      </form>
                    </div>

                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'moderation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Thống kê Báo cáo */}
              <div className="stats-row-5col" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '0' }}>
                {renderKpiCard('Tổng số báo cáo', <HiShieldCheck />, { value: modStats.totalReports || 0, change: 0, description: 'Báo cáo vi phạm' }, 'blue')}
                {renderKpiCard('Chờ xử lý', <HiClipboardCheck />, { value: modStats.pendingReports || 0, change: 0, description: 'Chưa kiểm duyệt' }, 'amber')}
                {renderKpiCard('Đã duyệt', <HiPlus />, { value: modStats.approvedReports || 0, change: 0, description: 'Vi phạm đã xử lý' }, 'green')}
                {renderKpiCard('Đã đóng', <HiUsers />, { value: modStats.closedReports || 0, change: 0, description: 'Báo cáo đã đóng' }, 'purple')}
                {renderKpiCard('Đã cảnh báo', <HiUsers />, { value: modStats.warnedUsers || 0, change: 0, description: 'Người dùng nhận cảnh báo' }, 'amber')}
              </div>

              {/* Bộ lọc & Tìm kiếm */}
              <div className="admin-card" style={{ marginBottom: '0' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Search input */}
                  <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Tìm theo mã, người báo cáo, đối tượng, lý do..."
                      value={modSearch}
                      onChange={(e) => { setModSearch(e.target.value); setModPage(1); }}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>

                  {/* Filter by Status */}
                  <div style={{ width: '180px' }}>
                    <select
                      className="admin-filter-select"
                      value={modStatusFilter}
                      onChange={(e) => { setModStatusFilter(e.target.value); setModPage(1); }}
                      style={{ width: '100%', height: '100%', minHeight: '38px' }}
                    >
                      <option value="ALL">Trạng thái: Tất cả</option>
                      <option value="PENDING">Chờ xử lý</option>
                      <option value="APPROVED">Đã duyệt (APPROVED)</option>
                      <option value="REJECTED">Bị từ chối (REJECTED)</option>
                      <option value="CLOSED">Đã đóng (CLOSED)</option>
                    </select>
                  </div>

                  {/* Filter by Target Type */}
                  <div style={{ width: '180px' }}>
                    <select
                      className="admin-filter-select"
                      value={modTargetTypeFilter}
                      onChange={(e) => { setModTargetTypeFilter(e.target.value); setModPage(1); }}
                      style={{ width: '100%', height: '100%', minHeight: '38px' }}
                    >
                      <option value="ALL">Loại đối tượng: Tất cả</option>
                      <option value="COURSE">Khóa học (COURSE)</option>
                      <option value="COMMENT">Bình luận (COMMENT)</option>
                    </select>
                  </div>
                </div>

                {/* Bảng danh sách báo cáo */}
                <div className="leads-table-container" style={{ marginTop: '20px' }}>
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th style={{ width: '120px', textAlign: 'center' }}>Mã báo cáo</th>
                        <th>Người báo cáo</th>
                        <th>Đối tượng bị báo cáo</th>
                        <th>Loại báo cáo</th>
                        <th>Lý do báo cáo</th>
                        <th>Ngày tạo</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ textAlign: 'center', width: '120px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(rep => (
                        <tr key={rep.id} style={{ opacity: loadingReports ? 0.5 : 1 }}>
                          <td style={{ textAlign: 'center', fontWeight: '800' }}>#{rep.id}</td>
                          <td>
                            <div style={{ fontWeight: '800' }}>{rep.reporter?.fullName || 'Ẩn danh'}</div>
                            <div style={{ fontSize: '11px', color: '#7A7A7A' }}>{rep.reporter?.email || ''}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '800', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rep.targetName}>
                              {rep.targetName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#7A7A7A' }}>Tạo bởi: {rep.targetCreator || 'Hệ thống'}</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1.5px solid #000',
                              fontSize: '10px',
                              fontWeight: '800',
                              background: rep.targetType === 'COURSE' ? '#E0E7FF' : '#F3E8FF',
                              color: rep.targetType === 'COURSE' ? '#1E40AF' : '#6B21A8'
                            }}>
                              {rep.targetType === 'COURSE' ? 'KHÓA HỌC' : 'BÌNH LUẬN'}
                            </span>
                          </td>
                          <td style={{ color: '#EF4444' }}>
                            <div style={{ fontWeight: '750', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rep.reason}>
                              {rep.reason}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{new Date(rep.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '850',
                              border: '1.5px solid #000',
                              background: rep.status === 'APPROVED' ? '#D1FAE5' : rep.status === 'PENDING' ? '#FEF3C7' : rep.status === 'REJECTED' ? '#FEE2E2' : '#F3F4F6',
                              color: rep.status === 'APPROVED' ? '#065F46' : rep.status === 'PENDING' ? '#D97706' : rep.status === 'REJECTED' ? '#991B1B' : '#374151'
                            }}>
                              {rep.status === 'PENDING' ? 'CHỜ XỬ LÝ' : rep.status === 'APPROVED' ? 'ĐÃ DUYỆT' : rep.status === 'REJECTED' ? 'TỪ CHỐI' : 'ĐÃ ĐÓNG'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="admin-table-btn"
                              style={{ background: '#3B82F6', color: '#FFF', borderColor: '#000' }}
                              onClick={() => handleViewReportDetail(rep.id)}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                      {reports.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#7A7A7A', fontWeight: 'bold' }}>
                            Không tìm thấy báo cáo vi phạm nào phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ==========================================
              TAB: FINANCE & PAYOUTS
              ========================================== */}
          {activeTab === 'finance' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
              <div className="admin-card" style={{ border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                  💸 YÊU CẦU RÚT TIỀN CỦA GIÁO VIÊN (PAYOUTS)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {teacherPayouts.map(p => (
                    <div key={p.id} style={{ padding: '16px', border: '2px solid #000', borderRadius: '10px', background: '#FCFBFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '900', margin: '0 0 4px 0' }}>{p.name}</h4>
                        <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                          TK: {p.bankInfo} • Số tiền rút: <strong style={{ color: '#059669', fontSize: '13px' }}>{p.pendingAmount}</strong>
                        </div>
                      </div>
                      <button 
                        onClick={() => handlePayoutTeacher(p.id)}
                        disabled={p.status === 'PAID'}
                        className="admin-back-btn"
                        style={{ 
                          padding: '6px 12px', fontSize: '11px', width: 'auto', boxShadow: 'none',
                          background: p.status === 'PAID' ? '#E5E7EB' : '#10B981',
                          color: p.status === 'PAID' ? '#9CA3AF' : '#fff',
                          borderColor: '#000000'
                        }}
                      >
                        {p.status === 'PAID' ? 'Đã chi' : 'Xác nhận chuyển'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card" style={{ background: '#FEF3C7', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '950', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                  ⚙️ THIẾT LẬP CHIẾT KHẤU HOA HỒNG
                </h3>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: '850', display: 'block', marginBottom: '8px' }}>Tỷ lệ trích hoa hồng hệ thống (%):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <input 
                      type="range" min="5" max="50" step="5" 
                      style={{ flex: 1 }}
                      value={commissionRate}
                      onChange={e => setCommissionRate(Number(e.target.value))}
                    />
                    <strong style={{ fontSize: '18px', fontWeight: '900', padding: '6px 12px', border: '2.5px solid #000', borderRadius: '8px', background: '#fff', boxShadow: '2px 2px 0px #000' }}>
                      {commissionRate}%
                    </strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400E', fontWeight: '750', lineHeight: '1.4' }}>
                    * Giáo viên nhận về {100 - commissionRate}% học phí khóa học thực nhận từ học viên.
                  </div>
                  <button 
                    onClick={() => toast('Cấu hình hoa hồng hệ thống đã được cập nhật!', 'success')}
                    className="admin-back-btn" 
                    style={{ width: '100%', padding: '10px', border: '2.5px solid #000', borderRadius: '8px', fontWeight: '900', marginTop: '20px', background: '#0E100D', color: '#FFF' }}
                  >
                    Lưu thiết lập
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: SYSTEM LOGS (NHẬT KÝ HỆ THỐNG)
              ========================================== */}
          {activeTab === 'system-logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              

              {/* Filtering Controls */}
              <div className="admin-card" style={{ marginBottom: '0', border: '2px solid #000', boxShadow: '3px 3px 0px #000', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr 80px', gap: '12px', alignItems: 'center' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }} />
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Tìm theo người dùng, email, nội dung..."
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>

                  {/* Log Type filter */}
                  {/* Log Type filter */}
                  <NeoSelect
                    value={logsTypeFilter}
                    onChange={(val) => { 
                      setLogsTypeFilter(val); 
                      setLogsModuleFilter('ALL'); 
                      setLogsPage(1); 
                    }}
                    options={[
                      { value: 'ALL', label: 'Tất cả loại nhật ký' },
                      { value: 'LOGIN', label: 'Nhật ký đăng nhập' },
                      { value: 'ADMIN', label: 'Nhật ký quản trị' },
                      { value: 'SYSTEM', label: 'Nhật ký hệ thống' }
                    ]}
                  />

                  {/* Level filter */}
                  <NeoSelect
                    value={logsLevelFilter}
                    onChange={(val) => { setLogsLevelFilter(val); setLogsPage(1); }}
                    options={[
                      { value: 'ALL', label: 'Tất cả mức độ' },
                      { value: 'INFO', label: 'Thông tin (INFO)' },
                      { value: 'WARNING', label: 'Cảnh báo (WARNING)' },
                      { value: 'ERROR', label: 'Lỗi (ERROR)' },
                      { value: 'CRITICAL', label: 'Nghiêm trọng (CRITICAL)' }
                    ]}
                  />

                  {/* Module filter */}
                  {(() => {
                    const moduleOpts = [{ value: 'ALL', label: 'Tất cả chức năng' }];
                    if (logsTypeFilter === 'ALL' || logsTypeFilter === 'LOGIN') {
                      moduleOpts.push({ value: 'AUTH_SERVICE', label: 'Xác thực (AUTH_SERVICE)' });
                    }
                    if (logsTypeFilter === 'ALL' || logsTypeFilter === 'ADMIN') {
                      moduleOpts.push(
                        { value: 'ADMIN_SERVICE', label: 'Quản trị chung (ADMIN_SERVICE)' },
                        { value: 'TEACHER_SERVICE', label: 'Giáo viên (TEACHER_SERVICE)' },
                        { value: 'COURSE_SERVICE', label: 'Khóa học (COURSE_SERVICE)' },
                        { value: 'MODERATION_SERVICE', label: 'Báo cáo vi phạm (MODERATION_SERVICE)' }
                      );
                    }
                    if (logsTypeFilter === 'ALL' || logsTypeFilter === 'SYSTEM') {
                      moduleOpts.push(
                        { value: 'AI_SERVICE', label: 'Dịch vụ AI (AI_SERVICE)' },
                        { value: 'PAYMENT_SERVICE', label: 'Thanh toán (PAYMENT_SERVICE)' },
                        { value: 'SYSTEM_SERVICE', label: 'Nhân hệ thống (SYSTEM_SERVICE)' }
                      );
                    }
                    return (
                      <NeoSelect
                        value={logsModuleFilter}
                        onChange={(val) => { setLogsModuleFilter(val); setLogsPage(1); }}
                        options={moduleOpts}
                      />
                    );
                  })()}

                  {/* Date range filter */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={logsFromDate}
                      onChange={(e) => { setLogsFromDate(e.target.value); setLogsPage(1); }}
                      style={{ fontSize: '11px', height: '40px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>-</span>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={logsToDate}
                      onChange={(e) => { setLogsToDate(e.target.value); setLogsPage(1); }}
                      style={{ fontSize: '11px', height: '40px' }}
                    />
                  </div>

                  {/* Reset filters button */}
                  <button
                    type="button"
                    className="admin-table-btn"
                    onClick={() => {
                      setLogsSearch('');
                      setLogsTypeFilter('ALL');
                      setLogsLevelFilter('ALL');
                      setLogsModuleFilter('ALL');
                      setLogsFromDate('');
                      setLogsToDate('');
                      setLogsPage(1);
                    }}
                    style={{ height: '40px', justifyContent: 'center' }}
                  >
                    Đặt lại
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="admin-card" style={{ border: '2px solid #000', boxShadow: '3px 3px 0px #000', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="chart-card-title" style={{ margin: 0 }}>
                    {logsTypeFilter === 'ALL' && 'BẢNG NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG'}
                    {logsTypeFilter === 'LOGIN' && 'BẢNG NHẬT KÝ ĐĂNG NHẬP'}
                    {logsTypeFilter === 'ADMIN' && 'BẢNG NHẬT KÝ THAO TÁC QUẢN TRỊ'}
                    {logsTypeFilter === 'SYSTEM' && 'BẢNG NHẬT KÝ HỆ THỐNG'}
                  </h3>
                  {logsLoading && <div className="stats-spinner" style={{ width: '20px', height: '20px' }} />}
                </div>

                <div className="admin-terminal" style={{ height: 'calc(100vh - 440px)', minHeight: '350px', cursor: 'default' }}>
                  {systemLogsList.map((log) => {
                    const timeStr = new Date(log.createdAt).toLocaleTimeString('vi-VN');
                    
                    if (log.type === 'LOGIN') {
                      const isSuccess = log.level !== 'ERROR' && log.level !== 'CRITICAL';
                      return (
                        <div 
                          key={log.id} 
                          className="terminal-line" 
                          onClick={() => {
                            setSelectedLogDetail(log);
                            setShowLogDetailDrawer(true);
                          }}
                          style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', transition: 'background 0.15s' }}
                          title="Click để xem chi tiết log"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span className="terminal-time">[{timeStr}]</span>
                          <span style={{ color: '#00BFFF', fontWeight: 'bold', marginRight: '6px' }}>[LOGIN]</span>
                          <span style={{ color: '#4AF626', fontWeight: 'bold', marginRight: '6px' }}>
                            [{isSuccess ? 'SUCCESS' : 'FAILED'}]
                          </span>
                          <span style={{ color: '#4AF626' }}>
                            {log.description} - IP: {log.ipAddress || 'N/A'} - {log.device || 'N/A'} ({log.operatingSystem || 'N/A'} • {log.browser || 'N/A'})
                          </span>
                        </div>
                      );
                    }

                    if (log.type === 'ADMIN') {
                      return (
                        <div 
                          key={log.id} 
                          className="terminal-line" 
                          onClick={() => {
                            setSelectedLogDetail(log);
                            setShowLogDetailDrawer(true);
                          }}
                          style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', transition: 'background 0.15s' }}
                          title="Click để xem chi tiết log"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span className="terminal-time">[{timeStr}]</span>
                          <span style={{ color: '#FF007F', fontWeight: 'bold', marginRight: '6px' }}>[ADMIN]</span>
                          <span style={{ color: '#4AF626', fontWeight: 'bold', marginRight: '6px' }}>
                            [{log.module}]
                          </span>
                          <span style={{ color: '#4AF626', fontWeight: 'bold', marginRight: '6px' }}>
                            {log.user?.fullName || 'Admin'}:
                          </span>
                          <span style={{ color: '#4AF626' }}>
                            {log.action} - {log.description} (IP: {log.ipAddress || 'N/A'})
                          </span>
                        </div>
                      );
                    }

                    // Default SYSTEM type
                    const isAi = log.module === 'AI_SERVICE';
                    return (
                      <div 
                        key={log.id} 
                        className="terminal-line" 
                        onClick={() => {
                          setSelectedLogDetail(log);
                          setShowLogDetailDrawer(true);
                        }}
                        style={{ cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', transition: 'background 0.15s' }}
                        title="Click để xem chi tiết log"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span className="terminal-time">[{timeStr}]</span>
                        {isAi ? (
                          <span style={{ color: '#00BFFF', fontWeight: 'bold', marginRight: '6px' }}>[AI SYSTEM]</span>
                        ) : (
                          <span style={{ color: '#FF007F', fontWeight: 'bold', marginRight: '6px' }}>[SYSTEM]</span>
                        )}
                        <span style={{ color: '#4AF626', fontWeight: 'bold', marginRight: '6px' }}>
                          [{log.level}]
                        </span>
                        {log.action && (
                          <span style={{ color: '#4AF626', fontWeight: 'bold', marginRight: '6px' }}>
                            {log.action}
                          </span>
                        )}
                        {log.action && <span style={{ color: '#4AF626', marginRight: '6px' }}>-</span>}
                        <span style={{ color: '#4AF626' }}>
                          {log.description}
                        </span>
                      </div>
                    );
                  })}
                  {systemLogsList.length === 0 && (
                    <div style={{ color: '#7A7A7A', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                      Không có dữ liệu log phù hợp.
                    </div>
                  )}
                </div>

                {/* No pagination for terminal - showing all logs */}

              </div>

            </div>
          )}
        </div>
      </main>



      {/* ==========================================
          USER DETAIL MODAL
          ========================================== */}
      {showDetailModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>CHI TIẾT TÀI KHOẢN NGƯỜI DÙNG</span>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              {userDetailLoading || !selectedUser ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="stats-spinner" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ fontWeight: 'bold' }}>Đang tải thông tin chi tiết...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#FCFBFA', padding: '16px', border: '2px solid #000', borderRadius: '12px' }}>
                    {selectedUser.user.avatarUrl && (selectedUser.user.avatarUrl.startsWith('http') || selectedUser.user.avatarUrl.startsWith('data:')) ? (
                      <img
                        src={selectedUser.user.avatarUrl}
                        alt="Avatar"
                        style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #000' }}
                      />
                    ) : (
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: selectedUser.user.role === 'ADMIN' ? '#EF4444' : selectedUser.user.role === 'TEACHER' ? '#3B82F6' : '#10B981',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '800',
                        border: '2px solid #000'
                      }}>
                        {selectedUser.user.name ? selectedUser.user.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '950' }}>{selectedUser.user.name}</h3>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: '600' }}>Email: {selectedUser.user.email}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: '600' }}>Điện thoại: {selectedUser.user.phone || 'Chưa cung cấp'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Vai trò:</label>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1.5px solid #000',
                        background: selectedUser.user.role === 'ADMIN' ? '#FEE2E2' : selectedUser.user.role === 'TEACHER' ? '#DBEAFE' : '#D1FAE5',
                        color: selectedUser.user.role === 'ADMIN' ? '#991B1B' : selectedUser.user.role === 'TEACHER' ? '#1E40AF' : '#065F46'
                      }}>{selectedUser.user.role}</span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Trạng thái:</label>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1.5px solid #000',
                        background: selectedUser.user.status === 'BLOCKED' ? '#F3F4F6' : '#D1FAE5',
                        color: selectedUser.user.status === 'BLOCKED' ? '#374151' : '#065F46'
                      }}>{selectedUser.user.status === 'BLOCKED' ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}</span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Ngày tạo tài khoản:</label>
                      <span style={{ fontWeight: '700' }}>{new Date(selectedUser.user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Đăng nhập cuối:</label>
                      <span style={{ fontWeight: '700' }}>
                        {selectedUser.user.lastLoginAt ? new Date(selectedUser.user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                      </span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Số lần bị cảnh báo:</label>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1.5px solid #000',
                        background: (selectedUser.user.warningCount || 0) > 0 ? '#FEF3C7' : '#D1FAE5',
                        color: (selectedUser.user.warningCount || 0) > 0 ? '#D97706' : '#065F46'
                      }}>
                        {selectedUser.user.warningCount || 0} lần
                      </span>
                    </div>
                  </div>

                  {selectedUser.user.status === 'BLOCKED' && (
                    <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: '12px', padding: '14px' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#B45309', fontWeight: '900', fontSize: '13px' }}>THÔNG TIN KHÓA TÀI KHOẢN</h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12.5px', fontWeight: '700' }}>Lý do: <span style={{ color: '#D97706' }}>{selectedUser.user.blockedReason}</span></p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12.5px', fontWeight: '700' }}>Khóa bởi: {selectedUser.user.blockedBy}</p>
                      <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700' }}>Thời gian khóa: {selectedUser.user.blockedAt ? new Date(selectedUser.user.blockedAt).toLocaleString('vi-VN') : ''}</p>
                    </div>
                  )}

                  {selectedUser.user.role === 'STUDENT' && (
                    <div style={{ borderTop: '2px solid #000', paddingTop: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontWeight: '950', fontSize: '14px' }}>📊 THỐNG KÊ HỌC TẬP (STUDENT)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: '#6B7280', fontWeight: '700' }}>Tổng số bài làm</span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.totalAttempts || 0}</span>
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: '#6B7280', fontWeight: '700' }}>Điểm trung bình</span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.averageScore || 0}/10</span>
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: '#6B7280', fontWeight: '700' }}>Tổng câu hỏi AI</span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.totalAiQuestions || 0}</span>
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: '#6B7280', fontWeight: '700' }}>Khóa học đã tham gia</span>
                          <span style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.enrolledCourses || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedUser.user.role === 'TEACHER' && (
                    <div style={{ borderTop: '2px solid #000', paddingTop: '16px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontWeight: '950', fontSize: '14px' }}>📊 THỐNG KÊ GIẢNG DẠY (TEACHER)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: '#6B7280', fontWeight: '700' }}>Khóa học đã tạo</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.createdCourses || 0}</span>
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: '#6B7280', fontWeight: '700' }}>Khóa học đã duyệt</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.approvedCourses || 0}</span>
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '10px', color: '#6B7280', fontWeight: '700' }}>Tổng số học viên</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#111827' }}>{selectedUser.stats?.studentCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: '#1C2B17', color: '#FFFFFF', boxShadow: 'none' }}
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          CONFIRM BLOCK MODAL
          ========================================== */}
      {showBlockModal && userToBlock && (
        <div className="admin-modal-backdrop" onClick={() => setShowBlockModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header" style={{ borderBottom: '2px solid #EF4444' }}>
              <span style={{ color: '#EF4444', fontWeight: '900' }}>⚠️ XÁC NHẬN KHÓA TÀI KHOẢN</span>
              <button 
                onClick={() => setShowBlockModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>
                Bạn có chắc chắn muốn khóa tài khoản của người dùng:
                <br />
                <span style={{ color: '#EF4444', fontSize: '16px', fontWeight: '950' }}>{userToBlock.name}</span> ({userToBlock.email})?
              </p>
              
              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Lý do khóa tài khoản (Bắt buộc):</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Nhập lý do khóa tài khoản..."
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  rows="3"
                  required
                />
              </div>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowBlockModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleBlockUserSubmit}
              >
                Khóa tài khoản
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          CONFIRM UNBLOCK MODAL
          ========================================== */}
      {showUnblockModal && userToUnblock && (
        <div className="admin-modal-backdrop" onClick={() => setShowUnblockModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header" style={{ borderBottom: '2px solid #10B981' }}>
              <span style={{ color: '#10B981', fontWeight: '900' }}>✅ XÁC NHẬN MỞ KHÓA TÀI KHOẢN</span>
              <button 
                onClick={() => setShowUnblockModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <p style={{ fontWeight: 'bold', margin: 0 }}>
                Bạn muốn mở khóa hoạt động lại cho tài khoản người dùng:
                <br />
                <span style={{ color: '#10B981', fontSize: '16px', fontWeight: '950' }}>{userToUnblock.name}</span> ({userToUnblock.email})?
              </p>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowUnblockModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleUnblockUserSubmit}
              >
                Mở khóa tài khoản
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          TEACHER DETAIL MODAL
          ========================================== */}
      {showTeacherDetailModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowTeacherDetailModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>HỒ SƠ CHI TIẾT GIÁO VIÊN</span>
              <button 
                onClick={() => setShowTeacherDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {teacherDetailLoading || !selectedTeacher ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="stats-spinner" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ fontWeight: 'bold' }}>Đang tải hồ sơ giáo viên...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Personal info card */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#FCFBFA', padding: '16px', border: '2px solid #000', borderRadius: '12px' }}>
                    {selectedTeacher.avatarUrl && (selectedTeacher.avatarUrl.startsWith('http') || selectedTeacher.avatarUrl.startsWith('data:')) ? (
                      <img
                        src={selectedTeacher.avatarUrl}
                        alt="Avatar"
                        style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #000' }}
                      />
                    ) : (
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '800',
                        border: '2px solid #000'
                      }}>
                        {selectedTeacher.name ? selectedTeacher.name.slice(0, 2).toUpperCase() : 'TA'}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '950' }}>{selectedTeacher.name}</h3>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: '600' }}>Email: {selectedTeacher.email}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: '600' }}>Điện thoại: {selectedTeacher.phone || 'Chưa cung cấp'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Môn giảng dạy:</label>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#1C2B17' }}>{selectedTeacher.profile?.subjects || 'Chưa có'}</span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Ngày sinh:</label>
                      <span style={{ fontWeight: '750' }}>{selectedTeacher.profile?.dob ? new Date(selectedTeacher.profile.dob).toLocaleDateString('vi-VN') : 'Chưa cung cấp'}</span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Học vị & Trường đào tạo:</label>
                      <span style={{ fontWeight: '750' }}>
                        {selectedTeacher.profile?.education || 'Chưa rõ'} tại {selectedTeacher.profile?.university || 'Chưa rõ'}
                      </span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Số năm kinh nghiệm:</label>
                      <span style={{ fontWeight: '800' }}>{selectedTeacher.profile?.experienceYears ?? 0} năm</span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Trạng thái hồ sơ:</label>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1.5px solid #000',
                        background: selectedTeacher.profile?.status === 'APPROVED' ? '#D1FAE5' : selectedTeacher.profile?.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                        color: selectedTeacher.profile?.status === 'APPROVED' ? '#065F46' : selectedTeacher.profile?.status === 'PENDING' ? '#D97706' : '#991B1B'
                      }}>
                        {selectedTeacher.profile?.status === 'APPROVED' ? 'ĐÃ DUYỆT' : selectedTeacher.profile?.status === 'PENDING' ? 'CHỜ DUYỆT' : selectedTeacher.profile?.status === 'REJECTED' ? 'BỊ TỪ CHỐI' : 'CHƯA TẠO'}
                      </span>
                    </div>

                    <div className="admin-form-group" style={{ margin: 0 }}>
                      <label>Trạng thái tài khoản:</label>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1.5px solid #000',
                        background: selectedTeacher.accountStatus === 'BLOCKED' ? '#F3F4F6' : '#D1FAE5',
                        color: selectedTeacher.accountStatus === 'BLOCKED' ? '#374151' : '#065F46'
                      }}>
                        {selectedTeacher.accountStatus === 'BLOCKED' ? 'BỊ KHÓA' : 'HOẠT ĐỘNG'}
                      </span>
                    </div>
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Giới thiệu bản thân:</label>
                    <div style={{ background: '#FCFBFA', border: '1.5px solid #E8E7E3', padding: '12px', borderRadius: '8px', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {selectedTeacher.profile?.bio || <span style={{ color: '#7A7A7A', fontStyle: 'italic' }}>Không có giới thiệu</span>}
                    </div>
                  </div>

                  {/* Minh chứng chuyên môn */}
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Tài liệu minh chứng chuyên môn:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {selectedTeacher.profile?.cvUrl ? (
                        <a href={selectedTeacher.profile.cvUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#3B82F6', textDecoration: 'underline' }}>
                          📄 Hồ sơ năng lực (CV) của giáo viên
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#7A7A7A', fontStyle: 'italic' }}>Chưa cập nhật CV</span>
                      )}
                      {selectedTeacher.profile?.degreeUrl ? (
                        <a href={selectedTeacher.profile.degreeUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#3B82F6', textDecoration: 'underline' }}>
                          🎓 Bằng tốt nghiệp / Bằng cấp chuyên môn
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#7A7A7A', fontStyle: 'italic' }}>Chưa cập nhật bằng cấp</span>
                      )}
                      {selectedTeacher.profile?.certificateUrl ? (
                        <a href={selectedTeacher.profile.certificateUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#3B82F6', textDecoration: 'underline' }}>
                          📜 Chứng chỉ nghiệp vụ sư phạm / chuyên môn
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#7A7A7A', fontStyle: 'italic' }}>Chưa cập nhật chứng chỉ khác</span>
                      )}
                    </div>
                  </div>

                  {/* Lịch sử phê duyệt hồ sơ */}
                  {selectedTeacher.profile && (selectedTeacher.profile.approvedAt || selectedTeacher.profile.rejectedAt) && (
                    <div style={{ background: '#FCFBFA', border: '1.5px solid #000', borderRadius: '12px', padding: '14px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '900' }}>NHẬT KÝ DUYỆT HỒ SƠ</h4>
                      {selectedTeacher.profile.status === 'APPROVED' ? (
                        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', color: '#065F46' }}>
                          ✓ Được phê duyệt vào ngày: {new Date(selectedTeacher.profile.approvedAt).toLocaleString('vi-VN')}
                        </p>
                      ) : selectedTeacher.profile.status === 'REJECTED' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '750', color: '#991B1B' }}>
                            ✗ Bị từ chối phê duyệt vào ngày: {new Date(selectedTeacher.profile.rejectedAt).toLocaleString('vi-VN')}
                          </p>
                          <p style={{ margin: 0, fontSize: '12.5px', color: '#333', fontWeight: '700' }}>
                            Lý do: <span style={{ fontStyle: 'italic', color: '#EF4444' }}>{selectedTeacher.profile.rejectedReason}</span>
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Lịch sử khóa tài khoản */}
                  {selectedTeacher.accountStatus === 'BLOCKED' && (
                    <div style={{ background: '#FFFBEB', border: '2px solid #F59E0B', borderRadius: '12px', padding: '14px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '900', color: '#B45309' }}>TÀI KHOẢN ĐANG BỊ KHÓA</h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12.5px', fontWeight: '700' }}>
                        Ngày khóa: {new Date(selectedTeacher.blockedAt).toLocaleString('vi-VN')} bởi {selectedTeacher.blockedBy || 'Admin'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700' }}>
                        Lý do khóa: <span style={{ color: '#EF4444', fontStyle: 'italic' }}>{selectedTeacher.blockedReason}</span>
                      </p>
                    </div>
                  )}

                  {/* Danh sách khóa học đã tạo */}
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Khóa giảng dạy đã phát hành ({selectedTeacher.courses?.length || 0}):</label>
                    {selectedTeacher.courses && selectedTeacher.courses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        {selectedTeacher.courses.map(course => (
                          <div key={course.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1.5px solid #000', padding: '10px 12px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: '800' }}>{course.title}</span>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '800',
                              border: '1px solid #000',
                              background: course.status === 'PUBLISHED' ? '#D1FAE5' : '#FEF3C7',
                              color: '#000000'
                            }}>{course.status === 'PUBLISHED' ? 'ĐÃ PHÁT HÀNH' : 'BẢN NHÁP'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#7A7A7A', fontStyle: 'italic' }}>Chưa tạo khóa học nào.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <footer className="admin-modal-footer">
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                {selectedTeacher && selectedTeacher.profile?.status === 'PENDING' && (
                  <>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleApproveTeacherSubmit(selectedTeacher.id)}
                    >
                      Duyệt hồ sơ
                    </button>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleOpenRejectTeacherModal(selectedTeacher)}
                    >
                      Từ chối
                    </button>
                  </>
                )}
                {selectedTeacher && (
                  selectedTeacher.accountStatus === 'BLOCKED' ? (
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => { setTeacherToUnblock(selectedTeacher); setShowTeacherUnblockModal(true); }}
                    >
                      Mở khóa
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => { setTeacherToBlock(selectedTeacher); setShowTeacherBlockModal(true); }}
                    >
                      Khóa tài khoản
                    </button>
                  )
                )}
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: '#1C2B17', color: '#FFFFFF', width: 'auto', margin: 0, boxShadow: 'none' }}
                  onClick={() => setShowTeacherDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          TEACHER REJECT MODAL
          ========================================== */}
      {showRejectTeacherModal && teacherToReject && (
        <div className="admin-modal-backdrop" onClick={() => setShowRejectTeacherModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header" style={{ borderBottom: '2px solid #EF4444' }}>
              <span style={{ color: '#EF4444', fontWeight: '900' }}>✗ TỪ CHỐI DUYỆT HỒ SƠ GIÁO VIÊN</span>
              <button 
                onClick={() => setShowRejectTeacherModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>
                Từ chối phê duyệt hồ sơ của giáo viên:
                <br />
                <span style={{ color: '#EF4444', fontSize: '16px', fontWeight: '950' }}>{teacherToReject.name}</span>?
              </p>
              
              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Lý do từ chối (Bắt buộc):</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Nhập lý do từ chối duyệt hồ sơ (VD: Minh chứng bằng cấp bị mờ, CV thiếu kinh nghiệm...)"
                  value={rejectTeacherReason}
                  onChange={e => setRejectTeacherReason(e.target.value)}
                  rows="3"
                  required
                />
              </div>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowRejectTeacherModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleRejectTeacherSubmit}
              >
                Từ chối hồ sơ
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          TEACHER BLOCK MODAL
          ========================================== */}
      {showTeacherBlockModal && teacherToBlock && (
        <div className="admin-modal-backdrop" onClick={() => setShowTeacherBlockModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header" style={{ borderBottom: '2px solid #EF4444' }}>
              <span style={{ color: '#EF4444', fontWeight: '900' }}>🔒 XÁC NHẬN KHÓA GIÁO VIÊN</span>
              <button 
                onClick={() => setShowTeacherBlockModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <p style={{ fontWeight: 'bold', marginBottom: '16px' }}>
                Khóa tài khoản của giáo viên:
                <br />
                <span style={{ color: '#EF4444', fontSize: '16px', fontWeight: '950' }}>{teacherToBlock.name}</span> ({teacherToBlock.email})?
              </p>
              
              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Lý do khóa tài khoản (Bắt buộc):</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Nhập lý do khóa..."
                  value={teacherBlockReason}
                  onChange={e => setTeacherBlockReason(e.target.value)}
                  rows="3"
                  required
                />
              </div>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowTeacherBlockModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleBlockTeacherSubmit}
              >
                Khóa giáo viên
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          TEACHER UNBLOCK MODAL
          ========================================== */}
      {showTeacherUnblockModal && teacherToUnblock && (
        <div className="admin-modal-backdrop" onClick={() => setShowTeacherUnblockModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header" style={{ borderBottom: '2px solid #10B981' }}>
              <span style={{ color: '#10B981', fontWeight: '900' }}>🔓 XÁC NHẬN MỞ KHÓA GIÁO VIÊN</span>
              <button 
                onClick={() => setShowTeacherUnblockModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <p style={{ fontWeight: 'bold', margin: 0 }}>
                Bạn muốn mở khóa hoạt động lại cho giáo viên:
                <br />
                <span style={{ color: '#10B981', fontSize: '16px', fontWeight: '950' }}>{teacherToUnblock.name}</span> ({teacherToUnblock.email})?
              </p>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowTeacherUnblockModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleUnblockTeacherSubmit}
              >
                Mở khóa
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          CREATE TEACHER MODAL
          ========================================== */}
      {showCreateTeacherModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCreateTeacherModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>TẠO MỚI TÀI KHOẢN GIÁO VIÊN</span>
              <button 
                onClick={() => setShowCreateTeacherModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleCreateTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="admin-modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: '900', borderBottom: '2px dashed #E8E7E3', paddingBottom: '4px' }}>THÔNG TIN CÁ NHÂN</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Họ và tên (Bắt buộc):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      required
                      placeholder="Nhập họ tên giáo viên..."
                      value={newTeacherForm.name}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, name: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Email (Bắt buộc):</label>
                    <input
                      type="email"
                      className="admin-form-input"
                      required
                      placeholder="Nhập email giáo viên..."
                      value={newTeacherForm.email}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, email: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Mật khẩu (Bắt buộc):</label>
                    <input
                      type="password"
                      className="admin-form-input"
                      required
                      placeholder="Nhập mật khẩu ban đầu..."
                      value={newTeacherForm.password}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, password: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Số điện thoại:</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Nhập số điện thoại..."
                      value={newTeacherForm.phone}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Ngày sinh:</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={newTeacherForm.dateOfBirth}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Ảnh đại diện (URL):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Nhập link ảnh đại diện..."
                      value={newTeacherForm.avatarUrl}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, avatarUrl: e.target.value })}
                    />
                  </div>
                </div>

                <h4 style={{ margin: '12px 0 4px 0', fontSize: '13.5px', fontWeight: '900', borderBottom: '2px dashed #E8E7E3', paddingBottom: '4px' }}>THÔNG TIN CHUYÊN MÔN</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Môn học giảng dạy (Bắt buộc):</label>
                    <select
                      className="admin-filter-select"
                      required
                      value={newTeacherForm.subjects}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, subjects: e.target.value })}
                      style={{ width: '100%', minHeight: '38px' }}
                    >
                      <option value="">Chọn môn học...</option>
                      <option value="Toán học">Toán học</option>
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                    </select>
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Trình độ học vấn (Bắt buộc):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      required
                      placeholder="VD: Cử nhân, Thạc sĩ, Tiến sĩ..."
                      value={newTeacherForm.degree}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, degree: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Trường đào tạo (Bắt buộc):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      required
                      placeholder="VD: Đại học Sư phạm Hà Nội..."
                      value={newTeacherForm.institution}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, institution: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Số năm kinh nghiệm:</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="VD: 5"
                      value={newTeacherForm.experienceYears}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, experienceYears: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Giới thiệu bản thân:</label>
                  <textarea
                    className="admin-form-textarea"
                    placeholder="Giới thiệu bản thân, phương pháp giảng dạy..."
                    rows="3"
                    value={newTeacherForm.bio}
                    onChange={e => setNewTeacherForm({ ...newTeacherForm, bio: e.target.value })}
                  />
                </div>

                <h4 style={{ margin: '12px 0 4px 0', fontSize: '13.5px', fontWeight: '900', borderBottom: '2px dashed #E8E7E3', paddingBottom: '4px' }}>MINH CHỨNG CHUYÊN MÔN & PHÊ DUYỆT</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Đường dẫn Hồ sơ năng lực (CV URL):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Nhập URL CV..."
                      value={newTeacherForm.cvUrl}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, cvUrl: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Đường dẫn Bằng cấp tốt nghiệp (Degree URL):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Nhập URL bằng tốt nghiệp..."
                      value={newTeacherForm.degreeUrl}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, degreeUrl: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Đường dẫn Chứng chỉ chuyên môn (Cert URL):</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Nhập URL chứng chỉ chuyên môn..."
                      value={newTeacherForm.certUrl}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, certUrl: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Trạng thái duyệt ban đầu:</label>
                    <select
                      className="admin-filter-select"
                      value={newTeacherForm.initialStatus}
                      onChange={e => setNewTeacherForm({ ...newTeacherForm, initialStatus: e.target.value })}
                      style={{ width: '100%', minHeight: '38px' }}
                    >
                      <option value="PENDING">Chờ duyệt (PENDING)</option>
                      <option value="APPROVED">Phê duyệt trực tiếp (APPROVED)</option>
                    </select>
                  </div>
                </div>
              </div>

              <footer className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: 'none', boxShadow: 'none' }}
                  onClick={() => setShowCreateTeacherModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="admin-back-btn"
                  style={{ background: '#1C2B17', color: '#FFFFFF', borderColor: '#000' }}
                >
                  Lưu & Tạo tài khoản ⚡
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CHI TIẾT KHÓA HỌC (ADMIN VIEW)
          ========================================== */}
      {showCourseDetailModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCourseDetailModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>HỒ SƠ CHI TIẾT KHÓA HỌC</span>
              <button 
                onClick={() => setShowCourseDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
              {courseDetailLoading || !selectedCourse ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="stats-spinner" style={{ margin: '0 auto 16px auto' }} />
                  <p style={{ fontWeight: 'bold' }}>Đang tải thông tin chi tiết khóa học...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Row 1: Cover Image & Basic Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
                    <div style={{ border: '3px solid #000', borderRadius: '12px', overflow: 'hidden', background: '#FCFBFA', boxShadow: '3px 3px 0px #000' }}>
                      {selectedCourse.thumbnailUrl && (selectedCourse.thumbnailUrl.startsWith('http') || selectedCourse.thumbnailUrl.startsWith('data:')) ? (
                        <img 
                          src={selectedCourse.thumbnailUrl} 
                          alt="Cover" 
                          style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8ECF1', fontWeight: '900', fontSize: '24px' }}>
                          {selectedCourse.subject}
                        </div>
                      )}
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        background: '#E0E7FF',
                        border: '1.5px solid #000',
                        color: '#4F46E5',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        textTransform: 'uppercase'
                      }}>
                        {selectedCourse.subject}
                      </span>
                      <h3 style={{ fontSize: '20px', fontWeight: '950', margin: '0 0 8px 0', lineHeight: '1.3' }}>{selectedCourse.title}</h3>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555', fontWeight: '600' }}>{selectedCourse.description}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', fontWeight: '700' }}>
                        <div><strong>Giáo viên:</strong> {selectedCourse.teacher?.name}</div>
                        <div><strong>Email:</strong> {selectedCourse.teacher?.email}</div>
                        <div>
                          <strong>Giá bán:</strong>{' '}
                          {selectedCourse.discount > 0 ? (
                            <span style={{ color: '#EF4444' }}>
                              {formatCurrency(selectedCourse.price * (1 - selectedCourse.discount / 100))} (Giảm {selectedCourse.discount}%)
                            </span>
                          ) : (
                            formatCurrency(selectedCourse.price)
                          )}
                        </div>
                        <div><strong>Ngày tạo:</strong> {selectedCourse.courseCreatedAt ? new Date(selectedCourse.courseCreatedAt).toLocaleDateString('vi-VN') : 'Chưa rõ'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Stats Grid */}
                  <div style={{ border: '2.5px solid #000', borderRadius: '12px', background: '#F8FAFC', padding: '16px', boxShadow: '3px 3px 0px #000' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase' }}>📊 THỐNG KÊ HIỆU QUẢ ĐÀO TẠO</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', textAlign: 'center' }}>
                      <div style={{ background: '#FFF', border: '1.5px solid #000', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '950', color: '#2563EB' }}>{selectedCourse.stats?.enrolledCount}</div>
                        <div style={{ fontSize: '10.5px', color: '#666', fontWeight: 'bold' }}>HỌC VIÊN</div>
                      </div>
                      <div style={{ background: '#FFF', border: '1.5px solid #000', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '950', color: '#D97706' }}>{selectedCourse.stats?.activeCount}</div>
                        <div style={{ fontSize: '10.5px', color: '#666', fontWeight: 'bold' }}>ĐANG HỌC</div>
                      </div>
                      <div style={{ background: '#FFF', border: '1.5px solid #000', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '950', color: '#10B981' }}>{selectedCourse.stats?.completedCount}</div>
                        <div style={{ fontSize: '10.5px', color: '#666', fontWeight: 'bold' }}>HOÀN THÀNH</div>
                      </div>
                      <div style={{ background: '#FFF', border: '1.5px solid #000', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '950', color: '#7C3AED' }}>{selectedCourse.stats?.completionRate}%</div>
                        <div style={{ fontSize: '10.5px', color: '#666', fontWeight: 'bold' }}>TỶ LỆ HT</div>
                      </div>
                      <div style={{ background: '#FFF', border: '1.5px solid #000', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '950', color: '#EF4444', height: '27px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {formatCurrency(selectedCourse.stats?.revenue)}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#666', fontWeight: 'bold' }}>DOANH THU</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Curriculum / Lessons */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase' }}>📖 NỘI DUNG CHƯƠNG TRÌNH HỌC ({selectedCourse.lessons?.length || 0} BÀI GIẢNG)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedCourse.lessons && selectedCourse.lessons.length > 0 ? (
                        selectedCourse.lessons.map((lesson, idx) => (
                          <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F1F5F9', border: '1.5px solid #000', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                            <span>Bài {lesson.order}: {lesson.title}</span>
                            <span style={{ color: '#64748B', fontSize: '11.5px' }}>{lesson.duration || 'Chưa định lượng'}</span>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#7A7A7A' }}>Khóa học chưa được cập nhật bài giảng.</p>
                      )}
                    </div>
                  </div>

                  {/* Row 4: Approval Audit History */}
                  <div style={{ borderTop: '2px dashed #E8E7E3', paddingTop: '16px', fontSize: '12.5px', fontWeight: '700' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase' }}>⏱️ LỊCH SỬ DUYỆT & TRẠNG THÁI</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <strong>Trạng thái duyệt:</strong>{' '}
                        <span style={{ textTransform: 'uppercase', color: selectedCourse.status === 'APPROVED' ? '#10B981' : selectedCourse.status === 'PENDING' ? '#F59E0B' : '#EF4444' }}>
                          {selectedCourse.status}
                        </span>
                        {selectedCourse.approvedAt && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                            Duyệt ngày: {new Date(selectedCourse.approvedAt).toLocaleString('vi-VN')} bởi Admin {selectedCourse.approvedBy?.fullName || `ID: ${selectedCourse.approvedBy}`}
                          </div>
                        )}
                        {selectedCourse.rejectedAt && (
                          <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px' }}>
                            Từ chối ngày: {new Date(selectedCourse.rejectedAt).toLocaleString('vi-VN')} bởi Admin {selectedCourse.rejectedBy?.fullName || `ID: ${selectedCourse.rejectedBy}`}
                            <div style={{ fontWeight: 'normal', color: '#000', marginTop: '2px' }}><strong>Lý do từ chối:</strong> {selectedCourse.rejectedReason}</div>
                          </div>
                        )}
                      </div>
                      <div>
                        <strong>Hiển thị trên Landing:</strong>{' '}
                        <span style={{ color: selectedCourse.visibility === 'VISIBLE' ? '#10B981' : '#64748B' }}>
                          {selectedCourse.visibility === 'VISIBLE' ? 'HIỂN THỊ (VISIBLE)' : 'ẨN (HIDDEN)'}
                        </span>
                        {selectedCourse.hiddenAt && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                            Ẩn ngày: {new Date(selectedCourse.hiddenAt).toLocaleString('vi-VN')} bởi Admin {selectedCourse.hiddenBy?.fullName || `ID: ${selectedCourse.hiddenBy}`}
                            <div style={{ fontWeight: 'normal', color: '#000', marginTop: '2px' }}><strong>Lý do ẩn:</strong> {selectedCourse.hiddenReason}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <footer className="admin-modal-footer">
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                {selectedCourse && selectedCourse.status === 'PENDING' && (
                  <>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleApproveCourseSubmit(selectedCourse.id)}
                    >
                      Duyệt & Phát hành
                    </button>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleOpenRejectCourseModal(selectedCourse)}
                    >
                      Từ chối
                    </button>
                  </>
                )}
                {selectedCourse && selectedCourse.status === 'APPROVED' && (
                  selectedCourse.visibility === 'VISIBLE' ? (
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#F59E0B', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleOpenHideCourseModal(selectedCourse)}
                    >
                      Ẩn khóa học
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleShowCourseSubmit(selectedCourse.id)}
                    >
                      Hiển thị lại
                    </button>
                  )
                )}
                {selectedCourse && (
                  <button
                    type="button"
                    className="admin-table-btn"
                    style={{ background: '#6c5ce7', color: '#FFFFFF', borderColor: '#000', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => window.open(`${window.location.origin}/learn/${selectedCourse.id}`, '_blank')}
                    title="Mở trang học bài của khóa học này theo góc nhìn học sinh"
                  >
                    🎓 Xem trang học bài
                  </button>
                )}
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: '#1C2B17', color: '#FFFFFF', width: 'auto', margin: 0, boxShadow: 'none' }}
                  onClick={() => setShowCourseDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: TỪ CHỐI DUYỆT KHÓA HỌC
          ========================================== */}
      {showRejectCourseModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowRejectCourseModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>TỪ CHỐI DUYỆT KHÓA HỌC</span>
              <button 
                onClick={() => setShowRejectCourseModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Lý do từ chối phê duyệt (Bắt buộc):</label>
                <textarea
                  className="admin-form-textarea"
                  rows="4"
                  placeholder="Vui lòng cung cấp lý do từ chối chi tiết để giáo viên sửa đổi lại khóa học (Ví dụ: thiếu bài giảng, video lỗi, thiếu tài liệu...)"
                  value={rejectCourseReason}
                  onChange={e => setRejectCourseReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowRejectCourseModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleRejectCourseSubmit}
              >
                Gửi từ chối ✕
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ẨN KHÓA HỌC ĐA PHÊ DUYỆT
          ========================================== */}
      {showHideCourseModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowHideCourseModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>ẨN KHÓA HỌC HỆ THỐNG</span>
              <button 
                onClick={() => setShowHideCourseModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Lý do tạm ẩn khóa học (Bắt buộc):</label>
                <textarea
                  className="admin-form-textarea"
                  rows="4"
                  placeholder="Nhập lý do ẩn khóa học khỏi giao diện hiển thị cho học sinh (Ví dụ: giáo viên yêu cầu cập nhật, nâng cấp học liệu, khóa học cũ lỗi thời...)"
                  value={hideCourseReason}
                  onChange={e => setHideCourseReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <footer className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setShowHideCourseModal(false)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="admin-back-btn"
                style={{ background: '#F59E0B', color: '#FFFFFF', borderColor: '#000' }}
                onClick={handleHideCourseSubmit}
              >
                Xác nhận Ẩn khóa học
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CHI TIẾT BÁO CÁO VI PHẠM (ADMIN VIEW)
          ========================================== */}
      {showReportModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>HỒ SƠ CHI TIẾT BÁO CÁO VI PHẠM</span>
              <button 
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
              {reportDetailLoading || !selectedReport ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="stats-spinner" style={{ margin: '0 auto 16px auto' }} />
                  <p style={{ fontWeight: 'bold' }}>Đang tải thông tin chi tiết báo cáo...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Cột 1: Thông tin báo cáo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ padding: '16px', border: '2.5px solid #000', borderRadius: '12px', background: '#FCFBFA', boxShadow: '3px 3px 0px #000' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '6px' }}>
                        🛡️ THÔNG TIN BÁO CÁO
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', fontWeight: '700' }}>
                        <div><strong>Mã báo cáo:</strong> #{selectedReport.id}</div>
                        <div><strong>Loại đối tượng:</strong> {selectedReport.targetType === 'COURSE' ? 'Khóa học (COURSE)' : 'Bình luận (COMMENT)'}</div>
                        <div><strong>Lý do tố cáo:</strong> <span style={{ color: '#EF4444' }}>{selectedReport.reason}</span></div>
                        {selectedReport.description && <div><strong>Mô tả chi tiết:</strong> {selectedReport.description}</div>}
                        <div><strong>Ngày báo cáo:</strong> {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</div>
                        <div>
                          <strong>Trạng thái:</strong>{' '}
                          <span style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1.5px solid #000',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: selectedReport.status === 'APPROVED' ? '#D1FAE5' : selectedReport.status === 'PENDING' ? '#FEF3C7' : selectedReport.status === 'REJECTED' ? '#FEE2E2' : '#F3F4F6',
                            color: selectedReport.status === 'APPROVED' ? '#065F46' : selectedReport.status === 'PENDING' ? '#D97706' : selectedReport.status === 'REJECTED' ? '#991B1B' : '#374151'
                          }}>
                            {selectedReport.status === 'PENDING' ? 'CHỜ XỬ LÝ' : selectedReport.status === 'APPROVED' ? 'ĐÃ DUYỆT' : selectedReport.status === 'REJECTED' ? 'TỪ CHỐI' : 'ĐÃ ĐÓNG'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px', border: '2.5px solid #000', borderRadius: '12px', background: '#FCFBFA', boxShadow: '3px 3px 0px #000' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '6px' }}>
                        👤 NGƯỜI BÁO CÁO & XỬ LÝ
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', fontWeight: '700' }}>
                        <div><strong>Họ tên:</strong> {selectedReport.reporter?.fullName || 'Ẩn danh'}</div>
                        <div><strong>Email:</strong> {selectedReport.reporter?.email || 'N/A'}</div>
                        <div><strong>Vai trò:</strong> {selectedReport.reporter?.role || 'N/A'}</div>
                        {selectedReport.reviewedAt && (
                          <>
                            <div style={{ borderTop: '1.5px solid #E5E7EB', paddingTop: '8px', marginTop: '4px' }}>
                              <strong>Ngày duyệt:</strong> {new Date(selectedReport.reviewedAt).toLocaleString('vi-VN')}
                            </div>
                            {selectedReport.resolutionNote && (
                              <div><strong>Ghi chú xử lý:</strong> <span style={{ color: '#059669' }}>{selectedReport.resolutionNote}</span></div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Đối tượng bị báo cáo */}
                  <div style={{ padding: '16px', border: '2.5px solid #000', borderRadius: '12px', background: '#F8FAFC', boxShadow: '3px 3px 0px #000' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '2px dashed #000', paddingBottom: '6px' }}>
                      🚨 NỘI DUNG BỊ BÁO CÁO (TẠO BỞI: {selectedReport.targetCreator})
                    </h4>
                    
                    {selectedReport.targetType === 'COURSE' && selectedReport.targetInfo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', fontWeight: '700' }}>
                          <div><strong>Tên khóa học:</strong> {selectedReport.targetInfo.title}</div>
                          <div><strong>Môn học:</strong> {selectedReport.targetInfo.subject}</div>
                          <div><strong>Học phí:</strong> {formatCurrency(selectedReport.targetInfo.price)}</div>
                          <div>
                            <strong>Trạng thái hiển thị:</strong>{' '}
                            <span style={{ color: selectedReport.targetInfo.visibility === 'VISIBLE' ? '#10B981' : '#EF4444' }}>
                              {selectedReport.targetInfo.visibility === 'VISIBLE' ? 'HIỂN THỊ (VISIBLE)' : 'ĐANG ẨN (HIDDEN)'}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: '750', background: '#FFF', padding: '10px', border: '1.5px solid #000', borderRadius: '8px' }}>
                          <strong>Mô tả khóa học:</strong> {selectedReport.targetInfo.description}
                        </div>
                        
                        {/* Course actions directly in Report */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          {selectedReport.targetInfo.visibility === 'VISIBLE' ? (
                            <button
                              type="button"
                              className="admin-table-btn"
                              style={{ background: '#EF4444', color: '#FFF', borderColor: '#000' }}
                              onClick={() => {
                                handleOpenHideCourseModal({ id: selectedReport.targetId, title: selectedReport.targetInfo.title });
                              }}
                            >
                              Ẩn khóa học ngay
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-table-btn"
                              style={{ background: '#10B981', color: '#FFF', borderColor: '#000' }}
                              onClick={async () => {
                                await api.showCourse(selectedReport.targetId);
                                toast('Hiển thị lại khóa học thành công!', 'success');
                                handleViewReportDetail(selectedReport.id);
                              }}
                            >
                              Hiển thị lại khóa học
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-table-btn"
                            style={{ background: '#3B82F6', color: '#FFF', borderColor: '#000' }}
                            onClick={() => {
                              setShowReportModal(false);
                              handleViewCourseDetail(selectedReport.targetId);
                            }}
                          >
                            Xem chi tiết khóa học 🔗
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedReport.targetType === 'COMMENT' && selectedReport.targetInfo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '750', background: '#FFF', padding: '12px', border: '1.5px solid #000', borderRadius: '8px' }}>
                          <strong>Nội dung bình luận:</strong> "{selectedReport.targetInfo.content}"
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>
                          Bình luận tại module: <strong>{selectedReport.targetInfo.type === 'FORUM' ? 'DIỄN ĐÀN (FORUM)' : 'TÀI LIỆU HỌC TẬP (DOCUMENT)'}</strong>
                          <br />
                          Ngày tạo bình luận: {new Date(selectedReport.targetInfo.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phần cảnh báo người dùng */}
                  <div style={{ padding: '16px', border: '2.5px solid #000', borderRadius: '12px', background: '#FFFBEB', boxShadow: '3px 3px 0px #000' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: '900', textTransform: 'uppercase', color: '#B45309' }}>
                      ⚠️ XỬ LÝ VI PHẠM ĐỐI VỚI TÁC GIẢ NỘI DUNG: {selectedReport.targetCreator}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '750' }}>
                        Email: <strong>{selectedReport.targetCreatorEmail}</strong> (Mã ID: {selectedReport.targetCreatorId})
                      </span>
                      <button
                        type="button"
                        className="admin-table-btn"
                        style={{ background: '#F59E0B', color: '#FFF', borderColor: '#000' }}
                        onClick={() => handleOpenWarningModal(selectedReport)}
                      >
                        Gửi Cảnh báo vi phạm ⚠️
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

            <footer className="admin-modal-footer">
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                {selectedReport && selectedReport.status === 'PENDING' && (
                  <>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#10B981', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleApproveReportSubmit(selectedReport.id)}
                    >
                      Duyệt vi phạm (Ẩn nội dung)
                    </button>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleOpenRejectReportModal(selectedReport)}
                    >
                      Bác bỏ báo cáo
                    </button>
                    <button 
                      type="button" 
                      className="admin-table-btn" 
                      style={{ background: '#6B7280', color: '#FFFFFF', borderColor: '#000' }}
                      onClick={() => handleOpenCloseReportModal(selectedReport)}
                    >
                      Đóng báo cáo
                    </button>
                  </>
                )}
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: '#1C2B17', color: '#FFFFFF', width: 'auto', margin: 0, boxShadow: 'none' }}
                  onClick={() => setShowReportModal(false)}
                >
                  Đóng
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: TỪ CHỐI BÁO CÁO VI PHẠM
          ========================================== */}
      {showRejectReportModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowRejectReportModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>BÁC BỎ BÁO CÁO VI PHẠM</span>
              <button 
                onClick={() => setShowRejectReportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleRejectReportSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Lý do bác bỏ báo cáo (Bắt buộc):</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="4"
                    placeholder="Vui lòng cung cấp lý do bác bỏ hoặc từ chối báo cáo vi phạm này..."
                    value={rejectReportReason}
                    onChange={e => setRejectReportReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <footer className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: 'none', boxShadow: 'none' }}
                  onClick={() => setShowRejectReportModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="admin-back-btn"
                  style={{ background: '#EF4444', color: '#FFFFFF', borderColor: '#000' }}
                >
                  Gửi từ chối ✕
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ĐÓNG BÁO CÁO VI PHẠM
          ========================================== */}
      {showCloseReportModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowCloseReportModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>ĐÓNG BÁO CÁO VI PHẠM</span>
              <button 
                onClick={() => setShowCloseReportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleCloseReportSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Ghi chú đóng báo cáo (Không bắt buộc):</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="4"
                    placeholder="Nhập ghi chú đóng báo cáo..."
                    value={closeReportNotes}
                    onChange={e => setCloseReportNotes(e.target.value)}
                  />
                </div>
              </div>

              <footer className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: 'none', boxShadow: 'none' }}
                  onClick={() => setShowCloseReportModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="admin-back-btn"
                  style={{ background: '#6B7280', color: '#FFFFFF', borderColor: '#000' }}
                >
                  Đóng báo cáo ✓
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: GỬI CẢNH BÁO VI PHẠM CHO NGƯỜI DÙNG
          ========================================== */}
      {showWarningModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowWarningModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span>GỬI CẢNH BÁO VI PHẠM</span>
              <button 
                onClick={() => setShowWarningModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleWarningSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Nội dung cảnh báo gửi đến người dùng vi phạm (Bắt buộc):</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="4"
                    placeholder="Nhập nội dung cảnh báo (ví dụ: phát ngôn không phù hợp, chia sẻ học liệu lậu, nội dung khóa học sai lệch...)"
                    value={warningMessage}
                    onChange={e => setWarningMessage(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: '11px', color: '#D97706', fontWeight: '700', marginTop: '6px' }}>
                    * Người dùng sẽ nhận được cảnh báo này qua thông báo hệ thống và số lần cảnh báo tài khoản sẽ tăng thêm 1.
                  </p>
                </div>
              </div>

              <footer className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: 'none', boxShadow: 'none' }}
                  onClick={() => setShowWarningModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="admin-back-btn"
                  style={{ background: '#F59E0B', color: '#FFFFFF', borderColor: '#000' }}
                >
                  Gửi Cảnh báo ⚠️
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          SYSTEM LOGS DETAIL DRAWER (SLIDE-IN RIGHT)
          ========================================== */}
      {showLogDetailDrawer && selectedLogDetail && (
        <div className="admin-modal-backdrop" style={{ justifyContent: 'flex-end', padding: 0 }} onClick={() => setShowLogDetailDrawer(false)}>
          <div 
            style={{
              width: '550px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              borderLeft: '3px solid #2D3229',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-6px 0px 0px rgba(45, 50, 41, 0.15)',
              animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <header className="admin-modal-header" style={{ borderRadius: 0 }}>
              <span style={{ fontSize: '15px', fontWeight: '950' }}>📄 CHI TIẾT NHẬT KÝ HỆ THỐNG</span>
              <button 
                onClick={() => setShowLogDetailDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* General Information */}
              <div style={{ border: '1.5px solid #2D3229', padding: '14px', borderRadius: '12px', background: '#FCFBFA', boxShadow: '2px 2px 0px #2D3229' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px dashed #2D3229', paddingBottom: '4px' }}>
                  Thông tin chung
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                  <div><strong>Mã Log:</strong> #{selectedLogDetail.id}</div>
                  <div><strong>Thời gian:</strong> {new Date(selectedLogDetail.createdAt).toLocaleString('vi-VN')}</div>
                  <div>
                    <strong>Mức độ:</strong>{' '}
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #000',
                      fontSize: '10px',
                      fontWeight: '800',
                      background: selectedLogDetail.level === 'INFO' ? '#D1FAE5' : selectedLogDetail.level === 'WARNING' ? '#FEF3C7' : selectedLogDetail.level === 'ERROR' ? '#FEE2E2' : '#FCE7F3',
                      color: selectedLogDetail.level === 'INFO' ? '#065F46' : selectedLogDetail.level === 'WARNING' ? '#D97706' : selectedLogDetail.level === 'ERROR' || selectedLogDetail.level === 'CRITICAL' ? '#991B1B' : '#9D174D'
                    }}>
                      {selectedLogDetail.level}
                    </span>
                  </div>
                  <div>
                    <strong>Loại Log:</strong>{' '}
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #000',
                      fontSize: '10px',
                      fontWeight: '800',
                      background: '#E0E7FF',
                      color: '#4F46E5'
                    }}>
                      {selectedLogDetail.type}
                    </span>
                  </div>
                  <div><strong>Module / Dịch vụ:</strong> <code style={{ background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>{selectedLogDetail.module}</code></div>
                </div>
              </div>

              {/* User Details */}
              <div style={{ border: '1.5px solid #2D3229', padding: '14px', borderRadius: '12px', background: '#FCFBFA', boxShadow: '2px 2px 0px #2D3229' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px dashed #2D3229', paddingBottom: '4px' }}>
                  Người thực hiện
                </h4>
                {selectedLogDetail.user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                    <div><strong>Họ và tên:</strong> {selectedLogDetail.user.fullName}</div>
                    <div><strong>Email:</strong> {selectedLogDetail.user.email}</div>
                    <div><strong>Vai trò:</strong> {selectedLogDetail.user.role}</div>
                    <div><strong>Mã ID:</strong> {selectedLogDetail.userId}</div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: '#7A7A7A', fontSize: '12.5px', fontWeight: '700' }}>
                    Khách vãng lai (Chưa đăng nhập / Hệ thống tự động)
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div style={{ border: '1.5px solid #2D3229', padding: '14px', borderRadius: '12px', background: '#FCFBFA', boxShadow: '2px 2px 0px #2D3229' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px dashed #2D3229', paddingBottom: '4px' }}>
                  Chi tiết sự kiện
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', fontWeight: '700' }}>
                  <div><strong>Hành động:</strong> {selectedLogDetail.action}</div>
                  <div><strong>Mô tả:</strong> {selectedLogDetail.description}</div>
                </div>
              </div>

              {/* Connection & User Agent */}
              <div style={{ border: '1.5px solid #2D3229', padding: '14px', borderRadius: '12px', background: '#FCFBFA', boxShadow: '2px 2px 0px #2D3229' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', borderBottom: '1px dashed #2D3229', paddingBottom: '4px' }}>
                  Thiết bị & Kết nối
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', fontWeight: '700' }}>
                  <div><strong>Địa chỉ IP:</strong> {selectedLogDetail.ipAddress || 'Không rõ'}</div>
                  <div><strong>Thiết bị:</strong> {selectedLogDetail.device || 'Không rõ'}</div>
                  <div><strong>Hệ điều hành (OS):</strong> {selectedLogDetail.operatingSystem || 'Không rõ'}</div>
                  <div><strong>Trình duyệt (Browser):</strong> {selectedLogDetail.browser || 'Không rõ'}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', wordBreak: 'break-all', marginTop: '4px' }}>
                    <strong>User Agent:</strong> {selectedLogDetail.userAgent}
                  </div>
                </div>
              </div>

              {/* Metadata Block */}
              {selectedLogDetail.metadata && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#2D3229', textTransform: 'uppercase' }}>Dữ liệu mở rộng (Metadata):</span>
                  <pre style={{
                    margin: 0,
                    padding: '12px',
                    background: '#0E100D',
                    color: '#4AF626',
                    border: '1.5px solid #2D3229',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    maxHeight: '240px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {JSON.stringify(selectedLogDetail.metadata, null, 2)}
                  </pre>
                </div>
              )}

            </div>

            <footer className="admin-modal-footer" style={{ borderRadius: 0 }}>
              <button 
                type="button" 
                className="admin-back-btn" 
                style={{ background: '#1C2B17', color: '#FFFFFF', width: 'auto', margin: 0, boxShadow: 'none' }}
                onClick={() => setShowLogDetailDrawer(false)}
              >
                Đóng Chi tiết
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
}

