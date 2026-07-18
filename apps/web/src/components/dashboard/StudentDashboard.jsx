import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  HiCalendar, 
  HiBookOpen, 
  HiPlus,
  HiFire,
  HiAcademicCap,
  HiUser,
  HiStar,
  HiDownload,
  HiSearch,
  HiBell,
  HiOutlineClock,
  HiCheck,
  HiUpload,
  HiChevronRight,
  HiHome,
  HiChatAlt2,
  HiSparkles,
  HiLightningBolt,
  HiFolderOpen,
  HiClipboardList,
  HiLogout,
  HiUserGroup,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiExclamationCircle,
  HiCheckCircle,
  HiX,
  HiTrash
} from 'react-icons/hi';
import { HiTrophy } from 'react-icons/hi2';
import { api } from '../../api';
import { toast } from '../../utils/toast';
import sunLogoImg from '../../assets/sun_logo.png';
import '../../styles/studentDashboard.css';
import ContinueLearningRail from '../courses/catalog/ContinueLearningRail';

export default function StudentDashboard({ currentUser, setActiveTab, navigateTo, onUpdateUser, activeTab, currentTab: passedCurrentTab, onLogout, unreadCount = 0, notifications = [], children }) {
  // --- STATES & STORES ---
  const currentTab = activeTab || passedCurrentTab || 'home';
  const formatFileName = (title) => {
    if (!title) return '';
    let clean = title.replace(/^\d{2}_\d{2}_\d{4}___/, '');
    clean = clean.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_+/, '');
    const parts = clean.split('.');
    const ext = parts.pop();
    const base = parts.join('.');
    if (base.length > 24) {
      return base.substring(0, 16) + '...' + base.slice(-6) + '.' + ext;
    }
    return clean;
  };
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifDropdownPos, setNotifDropdownPos] = useState({ top: 0, left: 0 });
  const notifRef = useRef(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState(() => {
    const saved = localStorage.getItem('student_onboarding_data');
    return saved ? JSON.parse(saved) : {
      subjectGroup: 'A01 (Toán - Lý - Anh)',
      targetSchool: 'Đại học Bách Khoa Hà Nội',
      targetScore: '26.5',
      grade: '12',
      subjects: ['Toán học', 'Vật lý', 'Tiếng Anh']
    };
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return localStorage.getItem('student_onboarding_completed') === 'true';
  });

  // Change Password Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Calendar study slots check-ins
  const [calendarSlots, setCalendarSlots] = useState(() => {
    const saved = localStorage.getItem('student_calendar_slots');
    return saved ? JSON.parse(saved) : {
      'T2-morning': { subject: 'Toán học', done: true },
      'T2-evening': { subject: 'Vật lý', done: false },
      'T3-evening': { subject: 'Tiếng Anh', done: true },
      'T4-afternoon': { subject: 'Toán học', done: false },
      'T5-morning': { subject: 'Vật lý', done: false },
      'T5-evening': { subject: 'Tiếng Anh', done: false },
      'T6-evening': { subject: 'Đề thi thử Toán', done: false },
      'T7-morning': { subject: 'Luyện Flashcard', done: true },
      'CN-evening': { subject: 'Hỏi AI Tutor', done: false },
    };
  });

  // Data states loaded from APIs
  const [loading, setLoading] = useState(true);
  
  // Attendance & Streak States
  const [streakViewMode, setStreakViewMode] = useState('week'); // 'week' | 'month'
  const [currentStreakDate, setCurrentStreakDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  

  const [dashboardData, setDashboardData] = useState({
    courses: [],
    attempts: [],
    gamification: { level: 4, xp: 1450, streakDays: 7, badges: [] },
    forumPosts: [],
    recentActivities: []
  });

  const [documents, setDocuments] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [userDocuments, setUserDocuments] = useState([]);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [progresses, setProgresses] = useState({});

  // Form edit states (initialized when activeTabLocal changes to 'profile')
  const [profileName, setProfileName] = useState(currentUser?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileSchool, setProfileSchool] = useState(currentUser?.school || onboardingData.targetSchool);
  const [profileGrade, setProfileGrade] = useState(currentUser?.grade || onboardingData.grade);
  const [profileCombo, setProfileCombo] = useState(currentUser?.combo || onboardingData.subjectGroup);
  const [profileTargetScore, setProfileTargetScore] = useState(currentUser?.targetScore || parseFloat(onboardingData.targetScore) || 25.0);
  const [profileTargetUniversity, setProfileTargetUniversity] = useState(currentUser?.targetUniversity || onboardingData.targetSchool);

  // Load API resources
  useEffect(() => {
    async function loadDashboardResources() {
      setLoading(true);
      try {
        const [coursesRes, attemptsRes, gamiRes, docsRes, userDocsRes, groupsRes] = await Promise.allSettled([
          api.getCourses(), // Fetch all courses to correctly filter owned ones
          api.getExamHistory().catch(() => api.getAttempts()),
          api.getUserGamificationProfile(),
          api.getDocumentResources(),
          api.getUserDocuments(),
          api.getStudyGroups()
        ]);

        const courses = coursesRes.status === 'fulfilled' ? coursesRes.value : [];
        const attempts = attemptsRes.status === 'fulfilled' ? attemptsRes.value : [];
        const gamification = gamiRes.status === 'fulfilled' && gamiRes.value ? gamiRes.value : {
          level: 4,
          xp: 1450,
          streakDays: 7,
          badges: [
            { id: 1, name: 'Siêu Chiến Binh', icon: '🏅', desc: 'Đã hoàn thành 5 đề thi thử' },
            { id: 2, name: 'Kẻ Diệt Đề', icon: '🔥', desc: 'Đạt điểm >8.0 trong 3 đề liên tục' },
            { id: 3, name: 'Thiên Tài AI', icon: '🧠', desc: 'Hỏi AI Tutor trên 10 câu hỏi' },
            { id: 4, name: 'Học Giả Chăm Chỉ', icon: '📚', desc: 'Duy trì học tập 7 ngày liên tục' }
          ]
        };
        const docs = docsRes.status === 'fulfilled' ? docsRes.value : [];
        const userDocs = userDocsRes.status === 'fulfilled' ? userDocsRes.value : [];
        const groups = groupsRes.status === 'fulfilled' ? groupsRes.value : [];

        // Calculate progress for courses
        const progressMap = {};
        try {
          const { enrollmentService } = await import('../../services/enrollmentService');
          let completed = [];
          if (currentUser) {
            completed = await enrollmentService.getEnrolledCourseProgress(currentUser.id);
          }
          for (const course of courses) {
            let calculated = 0;
            if (currentUser) {
              const totalLessons = course.lessons?.length || 5;
              const completedInCourse = completed.filter(id => {
                return course.lessons?.some(l => l.id.toString() === id.toString());
              }).length;
              calculated = totalLessons > 0 ? Math.round((completedInCourse / totalLessons) * 100) : 0;
            }
            const isOwned = currentUser?.unlockedCourses?.includes(course.id) || 
                            currentUser?.unlockedCourses?.includes(course.id.toString()) ||
                            currentUser?.unlockedCourses?.includes(Number(course.id));
            progressMap[course.id] = isOwned ? calculated : (course.id === 1 ? 60 : (course.id === 2 ? 40 : 25));
          }
        } catch (err) {
          console.warn('[StudentDashboard] Lỗi tính tiến trình học:', err);
        }
        setProgresses(progressMap);

        // Build recent activities timeline list
        const recentActivities = [];
        if (attempts && attempts.length > 0) {
          attempts.slice(0, 4).forEach(att => {
            recentActivities.push({
              id: `attempt-${att.id}`,
              type: 'exam',
              title: `Đã làm ${att.exam?.title || 'Đề thi thử'}`,
              detail: `Điểm số: ${att.score}đ • Đúng: ${att.correctCount || 0}/${(att.correctCount || 0) + (att.wrongCount || 0)} câu`,
              time: new Date(att.submittedAt || att.startedAt).toLocaleDateString('vi-VN')
            });
          });
        } else {
          recentActivities.push(
            { id: 'act-1', type: 'exam', title: 'Đã hoàn thành Đề thi thử Toán học số 15', detail: 'Điểm số: 8.4/10đ • Thời gian: 45 phút', time: 'Hôm nay' },
            { id: 'act-2', type: 'ai', title: 'Hỏi đáp với AI Tutor thành công', detail: 'Hỏi về phương pháp tính tích phân hàm ẩn', time: 'Hôm qua' },
            { id: 'act-3', type: 'flashcard', title: 'Ôn tập bộ Flashcard Hóa Hữu Cơ', detail: 'Ghi nhớ thành công 18/20 từ khóa', time: '2 ngày trước' },
            { id: 'act-4', type: 'system', title: 'Đăng nhập điểm danh hàng ngày', detail: 'Nhận 10 XP chuỗi học tập', time: '3 ngày trước' }
          );
        }

        setDashboardData({
          courses: courses, // Keep all courses so we can filter owned ones
          attempts,
          gamification,
          recentActivities
        });
        setDocuments(docs);
        setStudyGroups(groups);
        setUserDocuments(userDocs);
      } catch (err) {
        console.error('Lỗi khi tải tài nguyên dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardResources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Fetch attendance records
  useEffect(() => {
    if (!currentUser || currentTab !== 'streak') return;
    const loadAttendanceData = async () => {
      try {
        let start, end;
        const d = new Date(currentStreakDate);
        if (streakViewMode === 'week') {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff));
          monday.setHours(0, 0, 0, 0);
          start = new Date(monday);
          
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          end = sunday;
        } else {
          start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
          end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        
        const data = await api.getAttendanceHistory(start.toISOString(), end.toISOString());
        setAttendanceRecords(data || []);
      } catch (err) {
        console.error('Lỗi tải lịch sử điểm danh:', err);
      }
    };
    loadAttendanceData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, streakViewMode, currentStreakDate, currentTab]);



  // Sync profile editing inputs if currentUser updates
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName || currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileSchool(currentUser.school || onboardingData.targetSchool);
      setProfileGrade(currentUser.grade || onboardingData.grade);
      setProfileCombo(currentUser.combo || onboardingData.subjectGroup);
      setProfileTargetScore(currentUser.targetScore || parseFloat(onboardingData.targetScore) || 25.0);
      setProfileTargetUniversity(currentUser.targetUniversity || onboardingData.targetSchool);
    }
  }, [currentUser?.id, currentTab]);

  // Show onboarding automatically if not completed
  useEffect(() => {
    if (!onboardingCompleted) {
      setOnboardingOpen(true);
    }
  }, [onboardingCompleted]);

  // Toggle study schedules
  
  const handleNavAttendance = (direction) => {
    setCurrentStreakDate(prev => {
      const next = new Date(prev);
      if (streakViewMode === 'week') {
        next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
      }
      return next;
    });
  };

  const getWeekDays = () => {
    const d = new Date(currentStreakDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return labels.map((label, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const dateStr = date.toISOString().split('T')[0];
      const hasAttended = attendanceRecords.some(r => r.date.split('T')[0] === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      return { label, date, dateStr, hasAttended, isToday };
    });
  };

  const getMonthDays = () => {
    const d = new Date(currentStreakDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    
    const days = [];
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      const hasAttended = attendanceRecords.some(r => r.date.split('T')[0] === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      days.push({ dayNum: i, date, dateStr, hasAttended, isToday });
    }
    return days;
  };

  const toggleCalendarSlot = (key) => {
    const updated = {
      ...calendarSlots,
      [key]: {
        ...calendarSlots[key],
        done: !calendarSlots[key]?.done
      }
    };
    setCalendarSlots(updated);
    localStorage.setItem('student_calendar_slots', JSON.stringify(updated));
    toast('Cập nhật trạng thái lịch học!', 'success');
  };

  const handleSaveOnboarding = (e) => {
    e.preventDefault();
    localStorage.setItem('student_onboarding_data', JSON.stringify(onboardingData));
    localStorage.setItem('student_onboarding_completed', 'true');
    setOnboardingCompleted(true);
    setOnboardingOpen(false);

    // Save profile configurations
    const updatedUser = {
      ...currentUser,
      name: currentUser?.fullName || currentUser?.name || 'Học viên',
      fullName: currentUser?.fullName || currentUser?.name || 'Học viên',
      grade: onboardingData.grade,
      combo: onboardingData.subjectGroup,
      targetScore: parseFloat(onboardingData.targetScore),
      targetUniversity: onboardingData.targetSchool
    };
    if (onUpdateUser) onUpdateUser(updatedUser);

    toast('Thiết lập mục tiêu học tập thành công! 🎯', 'success');
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      fullName: profileName,
      name: profileName,
      phone: profilePhone,
      school: profileSchool,
      grade: profileGrade,
      combo: profileCombo,
      targetScore: parseFloat(profileTargetScore),
      targetUniversity: profileTargetUniversity
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
      toast('Cập nhật thông tin cá nhân thành công!', 'success');
    } else {
      toast('Không tìm thấy hàm cập nhật thông tin. Vui lòng liên hệ quản trị viên!', 'warning');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Mật khẩu mới nhập lại không khớp!');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordSuccess('Đổi mật khẩu thành công! 🎉');
      toast('Đổi mật khẩu thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Get first name for greeting
  const getFirstName = () => {
    const fullName = currentUser?.fullName || currentUser?.name || 'Học viên';
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || 'bạn';
  };

  // Get Vietnamese formatted current date
  const getVietnameseDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('vi-VN', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // Mock list of redeemable rewards
  const rewardItems = [
    { id: 1, name: 'Sách ôn thi Casio Toán học (PDF)', cost: 50, icon: '📚' },
    { id: 2, name: 'Cẩm nang sơ đồ lý thuyết Vật Lý 12', cost: 80, icon: '🗺️' },
    { id: 3, name: 'Tài liệu VIP: 10 đề thi thử nâng cao Toán 12', cost: 120, icon: '📝' },
    { id: 4, name: '100 lượt tương tác AI Tutor Premium', cost: 200, icon: '🤖' },
    { id: 5, name: 'Nâng cấp tài khoản PRO 7 ngày miễn phí', cost: 500, icon: '⭐' }
  ];

  const handleRedeemReward = (reward) => {
    const userPoints = currentUser?.rewardPoints ?? 0;
    if (userPoints < reward.cost) {
      toast(`Bạn không đủ điểm thưởng! Cần thêm ${reward.cost - userPoints} điểm nữa.`, 'warning');
      return;
    }

    const updatedUser = {
      ...currentUser,
      rewardPoints: userPoints - reward.cost
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
      toast(`Đổi quà thành công: ${reward.name}! File tài liệu đã được gửi đến hòm thư của bạn.`, 'success');
    }
  };

  // Check-in study day to grow streak
  const handleCheckinDay = (dayKey) => {
    if (calendarSlots[dayKey]?.done) {
      toast('Bạn đã hoàn thành lịch học ngày này rồi!', 'info');
      return;
    }

    const updatedSlots = {
      ...calendarSlots,
      [dayKey]: {
        ...calendarSlots[dayKey],
        done: true
      }
    };
    setCalendarSlots(updatedSlots);
    localStorage.setItem('student_calendar_slots', JSON.stringify(updatedSlots));

    // Increase points and streak
    const currentPoints = currentUser?.rewardPoints ?? 0;
    const currentStreak = dashboardData.gamification?.streakDays ?? 7;
    const updatedUser = {
      ...currentUser,
      rewardPoints: currentPoints + 15 // Gift 15 points
    };

    setDashboardData({
      ...dashboardData,
      gamification: {
        ...dashboardData.gamification,
        streakDays: currentStreak + 1
      }
    });

    if (onUpdateUser) onUpdateUser(updatedUser);
    toast('Học tập tích cực! +15 điểm thưởng và tăng chuỗi liên tục! 🌟', 'success');
  };

  // Filter courses to show only the student's owned/purchased courses
  const ownedCourses = (dashboardData.courses || []).filter(c => {
    return currentUser?.unlockedCourses?.includes(c.id) || 
           currentUser?.unlockedCourses?.includes(c.id.toString()) ||
           currentUser?.unlockedCourses?.includes(Number(c.id));
  });

  const coursesToRender = ownedCourses.map((c, idx) => {
    // Choose dynamic gradient background colorClass
    let colorClass = 'purple';
    if (c.subject === 'Toán' || c.subject === 'Toán học') {
      colorClass = 'purple';
    } else if (c.subject === 'Vật lý') {
      colorClass = 'teal';
    } else if (c.subject === 'Hóa học') {
      colorClass = 'blue';
    } else if (c.subject === 'Tiếng Anh') {
      colorClass = 'orange';
    }
    return {
      ...c,
      progress: progresses[c.id] || 0,
      colorClass
    };
  });

  // Fallback documents if database documents are empty
  const defaultDocs = [
    { id: 'doc-1', title: 'Tóm tắt công thức Hình học Oxyz 12', desc: 'Toán học • File PDF tóm gọn công thức giải nhanh', tagClass: 'purple-tag' },
    { id: 'doc-2', title: 'Dao động điều hòa lí thuyết chuyên sâu', desc: 'Vật lý • 20 câu hỏi lý thuyết kèm lời giải', tagClass: 'teal-tag' },
    { id: 'doc-3', title: 'Từ vựng tiếng Anh chủ đề học đường nâng cao', desc: 'Tiếng Anh • Bộ flashcard 50 từ vựng', tagClass: 'orange-tag' },
    { id: 'doc-4', title: 'Sơ đồ tư duy Hóa Hữu cơ kì I lớp 12', desc: 'Hóa học • AI generated mindmap chất lượng cao', tagClass: 'blue-tag' }
  ];

  const docsToRender = documents.length > 0
    ? documents.map((d, idx) => ({
        id: d.id,
        title: d.title,
        desc: `${d.subject || 'Tài liệu'} • ${d.description || 'Không có mô tả'}`,
        tagClass: idx % 4 === 0 ? 'purple-tag' : idx % 4 === 1 ? 'teal-tag' : idx % 4 === 2 ? 'orange-tag' : 'blue-tag'
      }))
    : defaultDocs;

  const filteredDocs = docsToRender.filter(doc => 
    doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    doc.desc.toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredUserDocs = userDocuments.filter(doc => 
    doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    (doc.fileType && doc.fileType.toLowerCase().includes(docSearchQuery.toLowerCase()))
  );

  const handleUploadDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      toast('Kích thước tệp tối đa là 20MB!', 'warning');
      return;
    }

    try {
      toast(`Đang tải tài liệu "${file.name}" lên...`, 'info');
      const uploadRes = await api.uploadFile(file);
      if (uploadRes && uploadRes.url) {
        const fileType = file.name.split('.').pop()?.toUpperCase() || 'PDF';
        const savedDoc = await api.createUserDocument(file.name, uploadRes.url, fileType);
        setUserDocuments(prev => [savedDoc, ...prev]);
        toast(`Tải lên tài liệu "${file.name}" thành công!`, 'success');
      }
    } catch (err) {
      console.error(err);
      toast(err.message || 'Tải lên tài liệu thất bại!', 'error');
    }
  };

  const handleDeleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${docTitle}"?`)) {
      return;
    }
    try {
      await api.deleteUserDocument(docId);
      setUserDocuments(prev => prev.filter(d => d.id !== docId));
      toast('Xóa tài liệu thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Xóa tài liệu thất bại!', 'error');
    }
  };

  const handleJoinClassroom = async (groupId) => {
    try {
      await api.joinStudyGroup(groupId);
      const updated = await api.getStudyGroups();
      setStudyGroups(updated);
      toast('Tham gia lớp học thành công! 🎓', 'success');
    } catch (err) {
      toast(err.message || 'Không thể tham gia lớp học!', 'error');
    }
  };

  const handleLeaveClassroom = async (groupId, groupName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn rời lớp học "${groupName}"?`)) {
      return;
    }
    try {
      await api.leaveStudyGroup(groupId);
      const updated = await api.getStudyGroups();
      setStudyGroups(updated);
      toast('Đã rời khỏi lớp học!', 'success');
    } catch (err) {
      toast(err.message || 'Không thể rời lớp học!', 'error');
    }
  };

  const hasRightSidebar = false;

  return (
    <div 
      className="student-dashboard-layout" 
      style={{ 
        gridTemplateColumns: hasRightSidebar ? '260px 1fr 320px' : '260px 1fr' 
      }}
    >
      {/* ==========================================================================
         LEFT SIDEBAR
         ========================================================================== */}
      <aside className="sdb-left-sidebar">
        <div className="sdb-logo-section" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/')}>
          <img src={sunLogoImg} alt="EduPath AI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span>EduPath AI</span>
        </div>

        {/* Profile Card */}
        <div className="sdb-profile-widget">
          <div className="sdb-avatar-container">
            {currentUser?.avatarUrl || currentUser?.avatar ? (
              <img 
                src={currentUser.avatarUrl || (currentUser.avatar.startsWith('data:') ? currentUser.avatar : `data:image/png;base64,${currentUser.avatar}`)} 
                alt="Avatar" 
                className="sdb-avatar-img"
              />
            ) : (
              <div 
                className="sdb-avatar-fallback"
                style={{
                  background: currentUser?.isPro 
                    ? 'linear-gradient(135deg, #FFE259, #FFA751)' 
                    : 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                }}
              >
                {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'U'}
              </div>
            )}
            <span className="sdb-status-badge">🟢 Lớp {profileGrade}</span>
          </div>

          <h4 className="sdb-profile-name">{currentUser?.fullName || 'Học viên'}</h4>
          <p className="sdb-profile-email">{currentUser?.email || 'student@gmail.com'}</p>
        </div>

        {/* Sidebar Tabs Menu */}
        <ul className="sdb-menu-list">
          {/* TRANG CHỦ */}
          <div className="sdb-menu-category-title">Trang chủ</div>
          <button 
            className={`sdb-menu-item ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/home')}
          >
            <span className="sdb-menu-icon"><HiHome /></span>
            <span>Tổng quan</span>
          </button>

          {/* HỌC TẬP CỦA TÔI */}
          <div className="sdb-menu-category-title">Học tập của tôi</div>
          <button 
            className={`sdb-menu-item ${currentTab === 'courses' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/courses')}
          >
            <span className="sdb-menu-icon"><HiBookOpen /></span>
            <span>Khóa học của tôi</span>
          </button>

          <button 
            className={`sdb-menu-item ${currentTab === 'classrooms' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/classrooms')}
          >
            <span className="sdb-menu-icon"><HiUserGroup /></span>
            <span>Lớp học của tôi</span>
          </button>

          <button 
            className={`sdb-menu-item ${currentTab === 'documents' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/documents')}
          >
            <span className="sdb-menu-icon"><HiStar /></span>
            <span>Tài liệu của tôi</span>
          </button>

          <button 
            className={`sdb-menu-item ${currentTab === 'streak' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/streak')}
          >
            <span className="sdb-menu-icon"><HiFire /></span>
            <span>Chuỗi học tập</span>
          </button>

          <button
            className={`sdb-menu-item ${currentTab === 'exam-history' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/exam-history')}
          >
            <span className="sdb-menu-icon"><HiClipboardList /></span>
            <span>Lịch sử thi thử</span>
          </button>

          {/* CÁ NHÂN */}
          <div className="sdb-menu-category-title">Cá nhân</div>
          {/* Notification Bell */}
          <button
            className={`sdb-menu-item ${currentTab === 'notifications' ? 'active' : ''}`}
            onClick={() => {
              navigateTo('/user/notifications');
            }}
            style={{ width: '100%' }}
          >
            <span className="sdb-menu-icon"><HiBell /></span>
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '18px',
                textAlign: 'center',
                lineHeight: '16px'
              }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          <button 
            className={`sdb-menu-item ${currentTab === 'settings' || currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/settings')}
          >
            <span className="sdb-menu-icon"><HiUser /></span>
            <span>Thông tin cá nhân</span>
          </button>
        </ul>
      </aside>

      {/* ==========================================================================
         CENTER MAIN PANE
         ========================================================================== */}
      <main className="sdb-center-pane">
        {/* TAB 1: OVERVIEW VIEW */}
        {currentTab === 'home' && (
          <>
            {/* Header section */}
            <div className="sdb-header-bar">
              <div style={{ textAlign: 'left' }}>
                <h1 className="sdb-greeting-title">Chào bạn, {getFirstName()}!</h1>
                <p className="sdb-greeting-subtitle">Hôm nay là {getVietnameseDate()}</p>
              </div>

              <div className="sdb-actions-wrapper">
                <button 
                  className="sdb-search-btn" 
                  title="Tìm kiếm"
                  onClick={() => {
                    navigateTo('/user/documents');
                  }}
                >
                  <HiSearch />
                </button>
                <button 
                  className="sdb-action-btn"
                  onClick={() => navigateTo('/user/mock-exams')}
                >
                  Làm đề thi mới
                </button>
              </div>
            </div>

            {/* Courses list table format */}
            {coursesToRender.length > 0 ? (
              <div 
                className="animate-in"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 10px 30px -10px rgba(100, 116, 139, 0.05)',
                  marginBottom: '20px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="sdb-card-title" style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📚</span> Khóa học của tôi
                  </h3>
                  <button 
                    onClick={() => navigateTo('/user/courses')} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#6366f1',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
                  >
                    Xem tất cả ➔
                  </button>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tên khóa học</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', width: '130px' }}>Môn học</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', width: '120px', textAlign: 'center' }}>Số bài học</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', width: '220px' }}>Tiến độ</th>
                        <th style={{ padding: '14px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', width: '120px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursesToRender.map((course) => {
                        const getSubjectTag = (subject) => {
                          const s = subject?.toLowerCase() || '';
                          if (s.includes('toán')) return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
                          if (s.includes('lý') || s.includes('vật lý')) return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
                          if (s.includes('hóa') || s.includes('hóa học')) return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
                          if (s.includes('anh') || s.includes('tiếng anh')) return { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' };
                          if (s.includes('văn') || s.includes('ngữ văn')) return { bg: '#fff1f2', color: '#e11d48', border: '#ffe4e6' };
                          return { bg: '#faf5ff', color: '#7c3aed', border: '#f3e8ff' }; // default
                        };
                        const tag = getSubjectTag(course.subject);
                        return (
                          <tr 
                            key={course.id} 
                            style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.25s ease' }}
                            className="sdb-table-row"
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <td style={{ padding: '16px 16px', fontSize: '13.5px', fontWeight: '600', color: '#0f172a', verticalAlign: 'middle' }}>
                              {course.title}
                            </td>
                            <td style={{ padding: '16px 16px', fontSize: '13px', verticalAlign: 'middle' }}>
                              <span style={{
                                background: tag.bg,
                                color: tag.color,
                                border: `1px solid ${tag.border}`,
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                display: 'inline-block'
                              }}>
                                {course.subject}
                              </span>
                            </td>
                            <td style={{ padding: '16px 16px', fontSize: '13px', fontWeight: '600', textAlign: 'center', color: '#475569', verticalAlign: 'middle' }}>
                              {course.lessons?.length || course.lessonsCount || 10} bài
                            </td>
                            <td style={{ padding: '16px 16px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${course.progress}%`, height: '100%', background: 'linear-gradient(90deg, #818cf8, #6366f1)', borderRadius: '4px' }}></div>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', minWidth: '35px', textAlign: 'right' }}>{course.progress}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <button
                                onClick={() => {
                                  if (course.id && !String(course.id).startsWith('def')) {
                                    navigateTo(`/courses/${course.id}`);
                                  } else {
                                    navigateTo('/user/courses');
                                  }
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '7px 18px',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.15)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
                                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(99, 102, 241, 0.25)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)';
                                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(99, 102, 241, 0.15)';
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                Vào học
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '40px 32px',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                marginBottom: '24px'
              }} className="animate-in">
                <span style={{ fontSize: '44px' }}>📚</span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '16px 0 8px 0', color: '#0f172a' }}>Em chưa đăng ký khóa học nào</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px 0', fontWeight: '500', lineHeight: '1.5' }}>
                  Hãy đăng ký khóa học Premium để mở khóa bài học và bắt đầu lộ trình học cá nhân hóa ngay nhé!
                </p>
                <button
                  onClick={() => navigateTo('/courses')}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Khám phá kho khóa học
                </button>
              </div>
            )}

            {/* Recent exam attempts widget */}
            {dashboardData.attempts && dashboardData.attempts.length > 0 && (
              <div
                className="animate-in"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 10px 30px -10px rgba(100, 116, 139, 0.05)',
                  marginBottom: '20px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="sdb-card-title" style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    📜 Bài thi gần đây
                  </h3>
                  <button
                    onClick={() => navigateTo('/user/exam-history')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#6366f1',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
                  >
                    Xem tất cả ➔
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dashboardData.attempts
                    .filter(a => a.status === 'SUBMITTED')
                    .slice(0, 4)
                    .map((att) => {
                      const score = att.score ?? 0;
                      const scoreColor = '#ffffff';
                      const scoreBg = score >= 8 ? 'linear-gradient(135deg, #10b981, #059669)' : score >= 5 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #f87171, #ef4444)';
                      const scoreShadow = score >= 8 ? '0 4px 10px rgba(16, 185, 129, 0.2)' : score >= 5 ? '0 4px 10px rgba(245, 158, 11, 0.2)' : '0 4px 10px rgba(239, 68, 68, 0.2)';
                      const totalQs = (att.correctCount || 0) + (att.wrongCount || 0) + (att.skippedCount || 0);
                      const dateStr = att.submittedAt
                        ? new Date(att.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '';
                      
                      const getSubjectTag = (subject) => {
                        const s = subject?.toLowerCase() || '';
                        if (s.includes('toán')) return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
                        if (s.includes('lý') || s.includes('vật lý')) return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
                        if (s.includes('hóa') || s.includes('hóa học')) return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
                        if (s.includes('anh') || s.includes('tiếng anh')) return { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' };
                        if (s.includes('văn') || s.includes('ngữ văn')) return { bg: '#fff1f2', color: '#e11d48', border: '#ffe4e6' };
                        return { bg: '#faf5ff', color: '#7c3aed', border: '#f3e8ff' };
                      };
                      const subTag = getSubjectTag(att.exam?.subject || '');

                      return (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '14px 16px',
                            borderRadius: '16px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            background: 'rgba(248, 250, 252, 0.6)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigateTo(`/mock-exams/${att.examId}/result/${att.id}`)}
                          onMouseOver={e => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 15px rgba(100, 116, 139, 0.05)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.6)';
                            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Score pill */}
                          <div style={{
                            minWidth: '56px',
                            textAlign: 'center',
                            background: scoreBg,
                            borderRadius: '12px',
                            padding: '6px 4px',
                            flexShrink: 0,
                            boxShadow: scoreShadow
                          }}>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{score.toFixed(1)}</div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: scoreColor, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>điểm</div>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {att.exam?.title || 'Đề thi thử'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>✅ {att.correctCount || 0}/{totalQs} câu</span>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              {att.exam?.subject && (
                                <span style={{
                                  background: subTag.bg,
                                  color: subTag.color,
                                  border: `1px solid ${subTag.border}`,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10.5px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase'
                                }}>
                                  {att.exam.subject}
                                </span>
                              )}
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>

                          {/* Action */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button
                              onClick={e => { e.stopPropagation(); navigateTo(`/mock-exams/${att.examId}/start`); }}
                              style={{ 
                                padding: '6px 14px', 
                                background: '#ffffff', 
                                color: '#4f46e5', 
                                border: '1px solid rgba(79, 70, 229, 0.2)', 
                                borderRadius: '10px', 
                                fontSize: '12px', 
                                fontWeight: '700', 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#4f46e5';
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.borderColor = '#4f46e5';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.color = '#4f46e5';
                                e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.2)';
                              }}
                            >
                              Thi lại ⚡
                            </button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* Bottom split: Checklist documents & Stats widgets */}
            <div className="sdb-bottom-split">
              {/* Documents card */}
              <div className="sdb-documents-card" style={{
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 10px 30px -10px rgba(100, 116, 139, 0.05)',
                textAlign: 'left'
              }}>
                <div className="sdb-card-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="sdb-card-title" style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Tài liệu học tập gần đây</h3>
                  <button 
                    onClick={() => navigateTo('/user/documents')} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#6366f1',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
                  >
                    Xem tất cả
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userDocuments.length > 0 ? (
                    userDocuments.slice(0, 3).map((doc, idx) => {
                      const colors = [
                        { border: '#818cf8', bgHover: '#f5f3ff' }, // violet
                        { border: '#2dd4bf', bgHover: '#f0fdfa' }, // teal
                        { border: '#fb923c', bgHover: '#fff7ed' }, // orange
                        { border: '#60a5fa', bgHover: '#eff6ff' }  // blue
                      ];
                      const tagColor = colors[idx % colors.length];

                      return (
                        <div 
                          key={doc.id} 
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: '16px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            borderLeft: `4px solid ${tagColor.border}`,
                            background: '#ffffff',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = tagColor.bgHover;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(100, 116, 139, 0.04)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="sdb-doc-info" onClick={() => window.open(doc.fileUrl, '_blank')} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                            <h4 className="sdb-doc-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {formatFileName(doc.title)}
                            </h4>
                            <p className="sdb-doc-desc" style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                              Định dạng: <span style={{ fontWeight: '700', color: '#475569' }}>{doc.fileType?.toUpperCase() || 'FILE'}</span> • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <a 
                            href={doc.fileUrl} 
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="sdb-doc-action-btn"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '16px',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#f8fafc',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              color: '#475569',
                              transition: 'all 0.2s',
                              flexShrink: 0,
                              marginLeft: '10px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#4f46e5';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#4f46e5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#475569';
                              e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                            }}
                          >
                            <HiDownload />
                          </a>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 24px', border: '1.5px dashed rgba(226, 232, 240, 0.8)', borderRadius: '16px', background: '#f8fafc' }}>
                      <span style={{ fontSize: '28px' }}>📂</span>
                      <p style={{ fontSize: '12.5px', color: '#64748b', margin: '8px 0 0 0', fontWeight: '600' }}>Chưa có tài liệu tải lên gần đây</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Joined Classrooms Quick Widget */}
              <div className="sdb-documents-card" style={{ 
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 10px 30px -10px rgba(100, 116, 139, 0.05)',
                textAlign: 'left',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px' 
              }}>
                <div className="sdb-card-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="sdb-card-title" style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Lớp học trực tuyến</h3>
                  <button 
                    onClick={() => navigateTo('/user/classrooms')} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: '#6366f1',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
                  >
                    Xem tất cả
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {studyGroups.filter(g => g.isMember).length > 0 ? (
                    studyGroups.filter(g => g.isMember).slice(0, 3).map((group, idx) => {
                      const colors = [
                        { border: '#818cf8', bgHover: '#f5f3ff' }, // violet
                        { border: '#2dd4bf', bgHover: '#f0fdfa' }, // teal
                        { border: '#fb923c', bgHover: '#fff7ed' }, // orange
                        { border: '#60a5fa', bgHover: '#eff6ff' }  // blue
                      ];
                      const tagColor = colors[idx % colors.length];

                      return (
                        <div 
                          key={group.id} 
                          className="sdb-group-item"
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: '16px',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            borderLeft: `4px solid ${tagColor.border}`,
                            background: '#ffffff',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onClick={() => {
                            localStorage.setItem('forum_active_group', JSON.stringify(group));
                            navigateTo('/user/forum');
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = tagColor.bgHover;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(100, 116, 139, 0.04)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="sdb-doc-info" style={{ flex: 1, minWidth: 0 }}>
                            <h4 className="sdb-doc-title" style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              👥 {group.name}
                            </h4>
                            <p className="sdb-doc-desc" style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                              {group.memberCount} thành viên • Trao đổi học tập
                            </p>
                          </div>
                          <span style={{ fontSize: '12.5px', color: '#4f46e5', fontWeight: '800', flexShrink: 0, marginLeft: '10px' }}>Vào lớp ➔</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 16px', border: '1.5px dashed rgba(226, 232, 240, 0.8)', borderRadius: '16px', background: '#f8fafc' }}>
                      <span style={{ fontSize: '28px' }}>🏫</span>
                      <p style={{ fontSize: '12.5px', color: '#64748b', margin: '6px 0 10px 0', fontWeight: '600' }}>Chưa tham gia lớp học nào</p>
                      <button
                        onClick={() => navigateTo('/user/classrooms')}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '10px',
                          padding: '6px 14px',
                          fontWeight: '700',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dbeafe';
                          e.currentTarget.style.transform = 'translateY(-0.5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        Khám phá lớp học
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats column with widgets and Pro banner */}
              <div className="sdb-stats-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="sdb-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  
                  {/* Stat 1: Study Time */}
                  <div 
                    className="sdb-stat-box" 
                    style={{ 
                      background: 'rgba(99, 102, 241, 0.04)',
                      border: '1px solid rgba(99, 102, 241, 0.1)',
                      borderLeft: '4px solid #6366f1',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(99, 102, 241, 0.06)';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0 }}>
                      <HiOutlineClock size={20} />
                    </div>
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                      <span className="sdb-stat-label" style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời gian học</span>
                      <h3 className="sdb-stat-value" style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#1e1b4b' }}>28 h</h3>
                    </div>
                  </div>

                  {/* Stat 2: Streak */}
                  <div 
                    className="sdb-stat-box" 
                    style={{ 
                      background: 'rgba(249, 115, 22, 0.04)',
                      border: '1px solid rgba(249, 115, 22, 0.1)',
                      borderLeft: '4px solid #f97316',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(249, 115, 22, 0.06)';
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.06)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.background = 'rgba(249, 115, 22, 0.04)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
                      <HiFire size={20} />
                    </div>
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                      <span className="sdb-stat-label" style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chuỗi học tập</span>
                      <h3 className="sdb-stat-value" style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#431407' }}>{dashboardData.gamification?.streakDays ?? 7} ngày</h3>
                    </div>
                  </div>

                </div>

                {/* Upgrade to Pro Banner */}
                <div 
                  className="sdb-promo-banner"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
                    border: 'none',
                    borderRadius: '24px',
                    padding: '22px 24px',
                    boxShadow: '0 12px 28px rgba(79, 70, 229, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    color: '#ffffff',
                    marginTop: '4px'
                  }}
                >
                  {/* Decorative golden blur circles */}
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(253, 224, 71, 0.12)', filter: 'blur(30px)', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', filter: 'blur(20px)', zIndex: 1 }} />

                  <div className="sdb-promo-info" style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, zIndex: 2 }}>
                    <span className="sdb-promo-tag" style={{ fontSize: '9px', fontWeight: '800', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      🔥 ĐẶC QUYỀN VIP
                    </span>
                    <h4 className="sdb-promo-title" style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Nâng cấp PRO</h4>
                    <p className="sdb-promo-subtitle" style={{ fontSize: '11.5px', color: '#c7d2fe', fontWeight: '400', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                      Mở khóa AI phân tích lỗi sai & luyện thi thử không giới hạn.
                    </p>
                  </div>
                  <button 
                    className="sdb-promo-btn"
                    onClick={() => {
                      const upgradeBtn = document.getElementById('sidebar-upgrade-pro-btn') || document.querySelector('.sidebar-upgrade__btn');
                      if (upgradeBtn) {
                        upgradeBtn.click();
                      } else {
                        toast('Vui lòng click vào nút Nâng cấp PRO ở menu tài khoản.', 'info');
                      }
                    }}
                  >
                    Nâng cấp
                  </button>
                </div>
                            </div>
            </div>
          </>
        )}

        {/* TAB: KHÓA HỌC CỦA TÔI */}
        {currentTab === 'courses' && (
          <div className="sdb-my-courses-view animate-in">
            <div className="sdb-docs-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 className="sdb-card-title" style={{ fontSize: '20px', margin: 0 }}>Khóa học của tôi</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
                  Tiến độ học tập và lộ trình các khóa học bạn đã mua thực tế.
                </p>
              </div>
              <button 
                className="sdb-action-btn"
                onClick={() => navigateTo('/courses')}
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }}
              >
                Mua thêm khóa học
              </button>
            </div>

            {/* CONTINUE LEARNING RAIL */}
            <ContinueLearningRail 
              currentUser={currentUser}
              courses={dashboardData.courses}
              onSelectCourse={(course) => navigateTo(`/learn/${course.id}`)}
              progresses={progresses}
            />

            {coursesToRender.length === 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                maxWidth: '600px',
                margin: '40px auto'
              }}>
                <span style={{ fontSize: '48px' }}>📚</span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '16px 0 8px 0', color: '#0f172a' }}>
                  Bạn chưa sở hữu khóa học thực tế nào
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px 0', fontWeight: '500', lineHeight: '1.5' }}>
                  Hãy đăng ký các khóa học chất lượng cao từ EduPath AI để bắt đầu bài học, luyện đề, và chinh phục kỳ thi của mình nhé!
                </p>
                <button
                  onClick={() => navigateTo('/courses')}
                  style={{
                    background: '#FFE259',
                    color: '#000',
                    border: '2.5px solid #000',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0px #000',
                    transition: 'all 0.1s'
                  }}
                >
                  Khám phá kho khóa học
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: THÔNG TIN CÁ NHÂN */}
        {(currentTab === 'profile' || currentTab === 'settings') && (
          <div className="sdb-form-view">
            <div className="sdb-card-title-row" style={{ marginBottom: '24px' }}>
              <h3 className="sdb-card-title">Hồ sơ & Mục tiêu học tập</h3>
              <span className="badge-pill" style={{ background: currentUser?.isPro ? '#ede9fe' : '#f1f5f9', color: currentUser?.isPro ? '#6366f1' : '#475569', padding: '6px 14px', borderRadius: '20px', fontWeight: '600', fontSize: '12px' }}>
                Học viên {currentUser?.isPro ? 'PRO' : 'Thường'}
              </span>
            </div>

            <form onSubmit={handleProfileSave} className="sdb-form-section">
              <div className="sdb-form-grid">
                <div className="sdb-form-group">
                  <label className="sdb-form-label">1. Họ và tên học sinh:</label>
                  <input 
                    type="text" 
                    className="sdb-form-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="sdb-form-group">
                  <label className="sdb-form-label">2. Số điện thoại liên lạc:</label>
                  <input 
                    type="tel" 
                    className="sdb-form-input"
                    placeholder="Nhập số điện thoại"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </div>

                <div className="sdb-form-group">
                  <label className="sdb-form-label">3. Lớp học:</label>
                  <select 
                    className="sdb-form-select"
                    value={profileGrade}
                    onChange={(e) => setProfileGrade(e.target.value)}
                  >
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
                </div>

                <div className="sdb-form-group">
                  <label className="sdb-form-label">4. Khối thi & Tổ hợp:</label>
                  <select 
                    className="sdb-form-select"
                    value={profileCombo}
                    onChange={(e) => setProfileCombo(e.target.value)}
                  >
                    <option value="A00 (Toán – Lý – Hóa)">Khối A00 (Toán – Vật lý – Hóa học)</option>
                    <option value="A01 (Toán – Lý – Anh)">Khối A01 (Toán – Vật lý – Tiếng Anh)</option>
                    <option value="B00 (Toán – Hóa – Sinh)">Khối B00 (Toán – Hóa học – Sinh học)</option>
                    <option value="C00 (Văn – Sử – Địa)">Khối C00 (Ngữ văn – Lịch sử – Địa lý)</option>
                    <option value="D01 (Toán – Văn – Anh)">Khối D01 (Toán – Ngữ văn – Tiếng Anh)</option>
                  </select>
                </div>

                <div className="sdb-form-group">
                  <label className="sdb-form-label">5. Trường THPT đang theo học:</label>
                  <input 
                    type="text" 
                    className="sdb-form-input"
                    value={profileSchool}
                    onChange={(e) => setProfileSchool(e.target.value)}
                  />
                </div>

                <div className="sdb-form-group">
                  <label className="sdb-form-label">6. Trường Đại học mục tiêu:</label>
                  <input 
                    type="text" 
                    className="sdb-form-input"
                    value={profileTargetUniversity}
                    onChange={(e) => setProfileTargetUniversity(e.target.value)}
                  />
                </div>

                <div className="sdb-form-group full-width" style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="sdb-form-label">Mục tiêu điểm số THPT Quốc gia (khối thi):</label>
                    <strong style={{ fontSize: '16px', color: '#6366f1', background: '#ede9fe', padding: '4px 12px', borderRadius: '8px', fontWeight: '700' }}>
                      {profileTargetScore.toFixed(1)} Điểm
                    </strong>
                  </div>
                  <input 
                    type="range"
                    min="15.0"
                    max="30.0"
                    step="0.5"
                    value={profileTargetScore}
                    onChange={(e) => setProfileTargetScore(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '6px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button type="submit" className="sdb-form-submit-btn" style={{ marginTop: 0 }}>
                  💾 Lưu thông tin & Cập nhật lộ trình AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordError('');
                    setPasswordSuccess('');
                    setIsChangePasswordOpen(true);
                  }}
                  style={{
                    padding: '14px 24px',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2.5px solid #000000',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '3px 3px 0px #000000',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-1px, -1px)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '3px 3px 0px #000000';
                  }}
                >
                  🔒 Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: TÀI LIỆU CỦA TÔI */}
        {currentTab === 'documents' && (
          <div className="sdb-docs-view" style={{ textAlign: 'left' }}>
            <div className="sdb-docs-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 className="sdb-card-title" style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Kho tài liệu của tôi</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>Tải lên các tài liệu ôn tập cá nhân dạng PDF, DOCX hoặc ảnh để lưu trữ.</p>
              </div>

              <label 
                className="sdb-action-btn"
                style={{ 
                  background: 'linear-gradient(135deg, #818cf8, #6366f1)', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <HiUpload /> Tải tài liệu lên
                <input 
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                  onChange={handleUploadDocument}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ position: 'relative', maxWidth: '420px', marginBottom: '24px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                <HiSearch />
              </span>
              <input 
                type="text" 
                placeholder="Tìm kiếm tài liệu đã tải lên..." 
                style={{ 
                  width: '100%', 
                  padding: '12px 16px 12px 46px', 
                  borderRadius: '14px', 
                  border: '1px solid rgba(226, 232, 240, 0.8)', 
                  outline: 'none', 
                  fontSize: '13.5px', 
                  fontWeight: '500', 
                  color: '#0f172a', 
                  background: '#ffffff', 
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.02)';
                }}
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
              />
            </div>

            <div className="sdb-docs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredUserDocs.length > 0 ? (
                filteredUserDocs.map((doc, idx) => {
                  const colors = [
                    { border: '#818cf8', bgHover: '#f5f3ff' }, // violet
                    { border: '#2dd4bf', bgHover: '#f0fdfa' }, // teal
                    { border: '#fb923c', bgHover: '#fff7ed' }, // orange
                    { border: '#60a5fa', bgHover: '#eff6ff' }  // blue
                  ];
                  const tagColor = colors[idx % colors.length];

                  const getFileTypeBadge = (fileType) => {
                    const t = fileType?.toLowerCase() || '';
                    if (t.includes('pdf')) return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', label: 'PDF' };
                    if (t.includes('doc') || t.includes('docx')) return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'DOC' };
                    if (t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('webp')) return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'IMAGE' };
                    return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: t.toUpperCase() || 'FILE' };
                  };
                  const badge = getFileTypeBadge(doc.fileType);



                  return (
                    <div 
                      key={doc.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderLeft: `4px solid ${tagColor.border}`,
                        borderRadius: '16px',
                        padding: '16px 20px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(100, 116, 139, 0.08)';
                        e.currentTarget.style.borderColor = '#c7d2fe';
                        e.currentTarget.style.background = tagColor.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                    >
                      <div style={{ marginRight: '72px', minWidth: 0, textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.title}>
                          {formatFileName(doc.title)}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '9.5px',
                            fontWeight: '800',
                            letterSpacing: '0.3px'
                          }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500' }}>
                            Đã tải lên: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                        <a 
                          href={doc.fileUrl} 
                          download
                          target="_blank"
                          rel="noreferrer"
                          style={{ 
                            fontSize: '16px', 
                            background: '#f8fafc',
                            color: '#6366f1',
                            border: '1px solid #e2e8f0',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#6366f1';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#6366f1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#6366f1';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HiDownload />
                        </a>
                        <button 
                          style={{ 
                            fontSize: '15px', 
                            background: '#fff5f5',
                            color: '#f87171',
                            border: '1px solid #fee2e2',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff5f5';
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.borderColor = '#fee2e2';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id, doc.title);
                          }}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '48px 32px', textAlign: 'center', border: '1.5px dashed #cbd5e1', borderRadius: '24px', background: '#f8fafc', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '36px', display: 'inline-block', marginBottom: '8px' }}>📂</span>
                  <p style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748b', margin: 0 }}>Không có tài liệu nào phù hợp!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ĐIỂM THƯỞNG */}
        {currentTab === 'rewards' && (
          <div className="sdb-rewards-view">
            {/* Balance Widget */}
            <div className="sdb-points-hero">
              <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', tracking: '1px' }}>Điểm tích lũy hiện tại</span>
              <div className="sdb-points-badge">
                <span>{currentUser?.rewardPoints ?? 0}</span>
                <span style={{ fontSize: '28px' }}>đ</span>
              </div>
              <p className="sdb-points-desc">Hãy luyện đề chăm chỉ, hoàn thành chuỗi học tập hàng ngày để đổi lấy các tài liệu ôn thi VIP và lượt hỏi AI Tutor Premium miễn phí.</p>
            </div>

            {/* Shop layout */}
            <div style={{ textAlign: 'left' }}>
              <h3 className="sdb-card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Cửa hàng đổi quà tặng</h3>
              
              <div className="sdb-rewards-shop-grid">
                {rewardItems.map((item) => {
                  const points = currentUser?.rewardPoints ?? 0;
                  const canAfford = points >= item.cost;
                  return (
                    <div key={item.id} className="sdb-reward-card">
                      <span className="sdb-reward-icon">{item.icon}</span>
                      <h4 className="sdb-reward-name">{item.name}</h4>
                      <div className="sdb-reward-cost">{item.cost} Điểm thưởng</div>
                      <button 
                        className="sdb-reward-btn"
                        disabled={!canAfford}
                        onClick={() => handleRedeemReward(item)}
                      >
                        {canAfford ? 'Đổi ngay' : 'Không đủ điểm'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STEACK */}
        {currentTab === 'streak' && (
          <div className="sdb-streak-view">
            <div className="sdb-streak-header-row">
              {/* Flame count */}
              <div className="sdb-streak-hero">
                <div className="sdb-streak-hero-info">
                  <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', opacity: 0.9 }}>Chuỗi học tập liên tục</span>
                  <div className="sdb-streak-hero-count">
                    <span>{dashboardData.gamification?.streakDays ?? 7} ngày</span>
                  </div>
                  <p style={{ fontSize: '11px', fontWeight: '700', margin: 0, opacity: 0.9 }}>Duy trì học tập mỗi ngày để giữ lửa và nhận thêm 15 điểm thưởng!</p>
                </div>
                <span className="sdb-streak-hero-icon">🔥</span>
              </div>

              {/* General XP/LV progress */}
              <div className="sdb-streak-stat-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="sdb-stat-label">Cấp độ Level</span>
                  <span style={{ fontSize: '14px', fontWeight: '950', color: '#8b5cf6' }}>Lv.{dashboardData.gamification?.level ?? 4}</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', margin: '8px 0' }}>
                  <div 
                    style={{ 
                      width: `${((dashboardData.gamification?.xp ?? 1450) / 2000) * 100}%`, 
                      height: '100%', 
                      backgroundColor: '#6366f1' 
                    }}
                  ></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                  <span>{dashboardData.gamification?.xp ?? 1450} XP</span>
                  <span>2000 XP để Lên cấp</span>
                </div>
              </div>
            </div>

            {/* Checkin study heatmap */}
            
            {/* Checkin study heatmap */}
            <div className="sdb-heatmap-section" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="sdb-heatmap-title" style={{ margin: 0 }}>Lịch sử chuyên cần</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setStreakViewMode('week')}
                    style={{
                      background: streakViewMode === 'week' ? '#6366f1' : '#fff',
                      color: streakViewMode === 'week' ? '#fff' : '#475569',
                      border: '1px solid ' + (streakViewMode === 'week' ? '#6366f1' : '#cbd5e1'),
                      padding: '6px 16px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Tuần
                  </button>
                  <button 
                    onClick={() => setStreakViewMode('month')}
                    style={{
                      background: streakViewMode === 'month' ? '#6366f1' : '#fff',
                      color: streakViewMode === 'month' ? '#fff' : '#475569',
                      border: '1px solid ' + (streakViewMode === 'month' ? '#6366f1' : '#cbd5e1'),
                      padding: '6px 16px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Tháng
                  </button>
                </div>
              </div>

              {/* Navigation row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <button onClick={() => handleNavAttendance('prev')} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: '#475569', transition: 'all 0.2s ease' }}>
                  ← Trước
                </button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {streakViewMode === 'week' ? (
                    `Tuần bắt đầu ngày ${getWeekDays()[0].date.toLocaleDateString('vi-VN')}`
                  ) : (
                    `Tháng ${currentStreakDate.getMonth() + 1} / ${currentStreakDate.getFullYear()}`
                  )}
                </span>
                <button onClick={() => handleNavAttendance('next')} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', color: '#475569', transition: 'all 0.2s ease' }}>
                  Sau →
                </button>
              </div>

              {streakViewMode === 'week' ? (
                <div className="sdb-heatmap-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {getWeekDays().map((item) => (
                    <div 
                      key={item.dateStr} 
                      className={`sdb-heatmap-day ${item.hasAttended ? 'completed' : 'missed'}`}
                      style={{ border: item.isToday ? '2px solid #ef4444' : '1px solid #e2e8f0', position: 'relative', borderRadius: '10px' }}
                      title={`${item.label}: ${item.hasAttended ? 'Đã điểm danh học tập' : 'Chưa có hoạt động'}`}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>{item.label}</span>
                      <span style={{ position: 'absolute', bottom: '4px', fontSize: '8px' }}>
                        {item.hasAttended ? '🔥' : '⏳'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {getMonthDays().map((item) => (
                    <div 
                      key={item.dateStr}
                      style={{
                        height: '48px',
                        background: item.hasAttended ? '#10b981' : '#f1f5f9',
                        color: item.hasAttended ? '#ffffff' : '#475569',
                        border: item.isToday ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      title={`Ngày ${item.dayNum}: ${item.hasAttended ? 'Đã điểm danh học tập' : 'Chưa học'}`}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '750' }}>{item.dayNum}</span>
                      <span style={{ fontSize: '8px' }}>
                        {item.hasAttended ? '🔥' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Badges row */}
            <div style={{ textAlign: 'left' }}>
              <h3 className="sdb-card-title" style={{ fontSize: '16px', marginBottom: '14px' }}>Huy hiệu học tập đạt được</h3>
              <div className="sdb-badges-grid">
                {(dashboardData.gamification?.badges || []).map((badge) => (
                  <div key={badge.id} className="sdb-badge-card" title={badge.desc}>
                    <span className="sdb-badge-icon">{badge.icon}</span>
                    <h5 className="sdb-badge-name">{badge.name}</h5>
                    <p className="sdb-badge-desc">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: LỚP HỌC CỦA TÔI */}
        {currentTab === 'classrooms' && (
          <div className="sdb-classrooms-view animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header info */}
            <div className="sdb-docs-header" style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 className="sdb-card-title" style={{ fontSize: '22px', margin: 0, fontWeight: '800', color: '#0f172a' }}>Lớp học của tôi</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: '6px 0 0 0', fontWeight: '500', lineHeight: 1.4 }}>
                  Tham gia vào các lớp học online thực tế để trao đổi bài học, làm đề ôn tập và thảo luận nhóm cùng các bạn học.
                </p>
              </div>
              <button 
                className="sdb-action-btn"
                onClick={() => navigateTo('/user/forum')}
                style={{ 
                  background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', 
                  color: '#ffffff', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '14px', 
                  fontWeight: '700', 
                  fontSize: '13.5px',
                  cursor: 'pointer', 
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.15)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.15)';
                }}
              >
                <span>Vào cộng đồng chung</span> 👥
              </button>
            </div>

            {/* Statistics summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '4px' }}>
              {/* Card 1: Enrolled Classrooms */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
                border: '1px solid #ddd6fe', 
                borderRadius: '20px', 
                padding: '24px 20px', 
                boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '18px',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(109, 40, 217, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(109, 40, 217, 0.04)';
              }}
              >
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '26px',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.08)' 
                }}>
                  🏫
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#7c3aed', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Lớp đã tham gia</h4>
                  <strong style={{ fontSize: '24px', fontWeight: '900', color: '#4c1d95', lineHeight: 1.2 }}>
                    {studyGroups.filter(g => g.isMember).length} lớp học
                  </strong>
                </div>
              </div>

              {/* Card 2: Total Available Groups */}
              <div style={{ 
                background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)', 
                border: '1px solid #bae6fd', 
                borderRadius: '20px', 
                padding: '24px 20px', 
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '18px',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(2, 132, 199, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(2, 132, 199, 0.04)';
              }}
              >
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  background: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '26px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)' 
                }}>
                  👥
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tổng số lớp khả dụng</h4>
                  <strong style={{ fontSize: '24px', fontWeight: '900', color: '#0369a1', lineHeight: 1.2 }}>
                    {studyGroups.length} nhóm học
                  </strong>
                </div>
              </div>
            </div>

            {/* Main grid split */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Joined classrooms section */}
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ 
                  fontSize: '13.5px', 
                  fontWeight: '800', 
                  color: '#475569', 
                  marginBottom: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>✓</span> 
                  LỚP HỌC ĐANG HỌC TẬP ({studyGroups.filter(g => g.isMember).length})
                </h4>

                {studyGroups.filter(g => g.isMember).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {studyGroups.filter(g => g.isMember).map(group => (
                      <div 
                        key={group.id} 
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '20px',
                          padding: '20px',
                          boxShadow: '0 10px 25px -10px rgba(100, 116, 139, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.22s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(99, 102, 241, 0.08)';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 10px 25px -10px rgba(100, 116, 139, 0.05)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, textAlign: 'left', lineHeight: 1.3 }}>
                              👥 {group.name}
                            </h4>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <span style={{ 
                                background: '#ecfdf5', 
                                color: '#059669', 
                                fontSize: '10px', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontWeight: '800',
                                border: '1px solid #a7f3d0'
                              }}>
                                Đã vào
                              </span>
                              <span style={{ 
                                background: '#eff6ff', 
                                color: '#2563eb', 
                                fontSize: '10px', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontWeight: '800',
                                border: '1px solid #bfdbfe'
                              }}>
                                {group.memberCount} HS
                              </span>
                            </div>
                          </div>
                          <p style={{ 
                            fontSize: '12.5px', 
                            color: '#64748b', 
                            margin: '0 0 16px 0', 
                            lineHeight: '1.4', 
                            textAlign: 'left', 
                            fontWeight: '500',
                            minHeight: '35px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {group.description || 'Chưa có mô tả chi tiết cho lớp học này. Thảo luận cùng bạn bè ngay để trao đổi thông tin.'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              localStorage.setItem('forum_active_group', JSON.stringify(group));
                              navigateTo('/user/forum');
                            }}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.12)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)';
                            }}
                          >
                            Thảo luận ⚡
                          </button>
                          <button
                            onClick={() => handleLeaveClassroom(group.id, group.name)}
                            style={{
                              background: '#fff5f5',
                              color: '#f87171',
                              border: '1px solid #fee2e2',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fee2e2';
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = '#fca5a5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff5f5';
                              e.currentTarget.style.color = '#f87171';
                              e.currentTarget.style.borderColor = '#fee2e2';
                            }}
                          >
                            Rời lớp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '48px 32px', 
                    textAlign: 'center', 
                    border: '1.5px dashed #cbd5e1', 
                    borderRadius: '24px', 
                    background: '#f8fafc',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                  }}>
                    <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '12px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.03))' }}>🎒</span>
                    <h5 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>Bạn chưa tham gia lớp học nào</h5>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500', lineHeight: 1.5 }}>
                      Hãy tham khảo danh sách lớp học khả dụng bên dưới để cùng tham gia kết nối nhé!
                    </p>
                  </div>
                )}
              </div>

              {/* Browse available classrooms */}
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ 
                  fontSize: '13.5px', 
                  fontWeight: '800', 
                  color: '#475569', 
                  marginBottom: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontSize: '11px', fontWeight: 'bold' }}>🌐</span> 
                  DANH SÁCH LỚP HỌC KHÁC ({studyGroups.filter(g => !g.isMember).length})
                </h4>

                {studyGroups.filter(g => !g.isMember).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {studyGroups.filter(g => !g.isMember).map(group => (
                      <div 
                        key={group.id} 
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '20px',
                          padding: '20px',
                          boxShadow: '0 10px 25px -10px rgba(100, 116, 139, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.22s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 15px 30px -10px rgba(99, 102, 241, 0.08)';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 10px 25px -10px rgba(100, 116, 139, 0.05)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, textAlign: 'left', lineHeight: 1.3 }}>
                              👥 {group.name}
                            </h4>
                            <span style={{ 
                              background: '#eff6ff', 
                              color: '#2563eb', 
                              fontSize: '10px', 
                              padding: '2px 8px', 
                              borderRadius: '10px', 
                              fontWeight: '800',
                              border: '1px solid #bfdbfe',
                              flexShrink: 0
                            }}>
                              {group.memberCount} HS
                            </span>
                          </div>
                          <p style={{ 
                            fontSize: '12.5px', 
                            color: '#64748b', 
                            margin: '0 0 16px 0', 
                            lineHeight: '1.4', 
                            textAlign: 'left', 
                            fontWeight: '500',
                            minHeight: '35px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {group.description || 'Chưa có mô tả chi tiết cho lớp học này.'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleJoinClassroom(group.id)}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #a5b4fc, #818cf8)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 10px rgba(129, 140, 248, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)';
                            e.currentTarget.style.boxShadow = '0 6px 14px rgba(99, 102, 241, 0.18)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #a5b4fc, #818cf8)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(129, 140, 248, 0.1)';
                          }}
                        >
                          Tham gia lớp học 🤝
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    padding: '32px', 
                    textAlign: 'center', 
                    border: '1.5px dashed #cbd5e1', 
                    borderRadius: '20px', 
                    background: '#f8fafc',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                  }}>
                    <span style={{ fontSize: '28px', display: 'inline-block', marginBottom: '8px' }}>✨</span>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '600' }}>Tất cả các lớp học hiện tại đều đã được tham gia!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LỊCH SỬ THI THỬ */}
        {currentTab === 'exam-history' && (
          <div className="sdb-my-courses-view animate-in">
            <div className="sdb-docs-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 className="sdb-card-title" style={{ fontSize: '20px', margin: 0 }}>Lịch sử thi thử & Luyện tập</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
                  Tổng hợp kết quả, tỷ lệ câu đúng và tiến độ luyện đề thi THPT Quốc Gia của bạn.
                </p>
              </div>
              <button 
                className="sdb-action-btn"
                onClick={() => navigateTo('/user/mock-exams')}
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }}
              >
                Làm đề thi mới ⚡
              </button>
            </div>

            {/* List of attempts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {dashboardData.attempts && dashboardData.attempts.filter(a => a.status === 'SUBMITTED').length > 0 ? (
                dashboardData.attempts
                  .filter(a => a.status === 'SUBMITTED')
                  .sort((a, b) => new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt))
                  .map((att) => {
                    const score = att.score ?? 0;
                    const scoreColor = score >= 8 ? '#00b894' : score >= 5 ? '#e17055' : '#d63031';
                    const scoreBg = score >= 8 ? 'rgba(0,184,148,0.1)' : score >= 5 ? 'rgba(225,112,85,0.1)' : 'rgba(214,48,49,0.1)';
                    const rankLabel = score >= 9 ? 'Xuất sắc' : score >= 8 ? 'Giỏi' : score >= 6.5 ? 'Khá' : score >= 5 ? 'Trung bình' : 'Cần cải thiện';
                    const dateStr = att.submittedAt
                      ? new Date(att.submittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—';
                    const totalQs = (att.correctCount || 0) + (att.wrongCount || 0) + (att.skippedCount || 0);
                    const durationMins = att.durationUsed ? Math.ceil(att.durationUsed / 60) : null;
                    const retakeMode = att.aiFeedback?.retakeMode || null;

                    return (
                      <div
                        key={att.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '20px',
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                          position: 'relative'
                        }}
                      >
                        {/* Score Badge */}
                        <div style={{
                          minWidth: '65px',
                          textAlign: 'center',
                          background: scoreBg,
                          border: `2px solid ${scoreColor}`,
                          borderRadius: '12px',
                          padding: '10px 8px',
                          flexShrink: 0
                        }}>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>
                            {score.toFixed(1)}
                          </div>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', color: scoreColor, marginTop: '2px' }}>{rankLabel}</div>
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: '180px', textAlign: 'left' }}>
                          <div style={{ fontSize: '14.5px', fontWeight: '750', color: '#0f172a', marginBottom: '6px', lineHeight: 1.3 }}>
                            {att.exam?.title || 'Đề thi tự luyện'}
                            {retakeMode && (
                              <span style={{ marginLeft: '8px', fontSize: '10px', background: '#ede9fe', color: '#6366f1', padding: '2px 7px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {retakeMode === 'wrong_only' ? 'Làm lại câu sai' : retakeMode === 'weak_topic' ? 'Chủ đề yếu' : retakeMode === 'bookmarked' ? 'Câu đánh dấu' : 'Ôn luyện'}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12.5px', color: '#64748b' }}>
                            {att.exam?.subject && (
                              <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {att.exam.subject}
                              </span>
                            )}
                            <span>✅ {att.correctCount || 0}/{totalQs || '?'} câu đúng</span>
                            {durationMins && <span>⏱ {durationMins} phút</span>}
                            <span>🕐 {dateStr}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => navigateTo(`/mock-exams/${att.examId}/result/${att.id}`)}
                            style={{
                              padding: '8px 14px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            🔎 Xem kết quả
                          </button>
                          <button
                            onClick={() => navigateTo(`/mock-exams/${att.examId}/start`)}
                            style={{
                              padding: '8px 14px',
                              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            ⚡ Thi lại
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                  <span style={{ fontSize: '44px', display: 'block', marginBottom: '16px' }}>📭</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Chưa có lịch sử thi nào</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 auto 16px' }}>
                    Hãy thực hiện làm một đề thi online hoặc tự luyện để lưu trữ và phân tích kết quả tại đây.
                  </p>
                  <button
                    onClick={() => navigateTo('/user/mock-exams')}
                    style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                  >
                    📋 Khám phá đề thi thử
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render children passed from App.jsx for other subpages */}
        {children}
      </main>

      {/* ==========================================================================
         RIGHT SIDEBAR (ONLY VISIBLE ON COURSES OVERVIEW)
         ========================================================================== */}


      {/* ==========================================================================
         ONBOARDING WIZARD MODAL
         ========================================================================== */}
      {onboardingOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="lp-modal-neo" style={{
            maxWidth: '520px',
            width: '100%',
            position: 'relative'
          }}>
            {onboardingCompleted && (
              <button 
                onClick={() => setOnboardingOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  background: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px' }}>🎯</span>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '12px 0 6px 0', color: '#0f172a' }}>
                Thiết lập lộ trình học tập
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
                Hãy cấu hình khối thi và mục tiêu điểm số để AI thiết lập lộ trình luyện đề tốt nhất cho bạn.
              </p>
            </div>

            <form onSubmit={handleSaveOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px', color: '#475569' }}>
                  1. Chọn Lớp học:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['10', '11', '12'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setOnboardingData({ ...onboardingData, grade: g })}
                      style={{
                        padding: '10px',
                        border: '1px solid ' + (onboardingData.grade === g ? '#6366f1' : '#cbd5e1'),
                        borderRadius: '10px',
                        fontWeight: '600',
                        background: onboardingData.grade === g ? '#ede9fe' : '#fff',
                        color: onboardingData.grade === g ? '#6366f1' : '#475569',
                        boxShadow: onboardingData.grade === g ? '0 4px 6px -1px rgba(99, 102, 241, 0.1)' : '0 2px 4px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Lớp {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px', color: '#475569' }}>
                  2. Chọn Tổ hợp / Khối thi mục tiêu:
                </label>
                <select 
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '500', outline: 'none', background: '#fff', fontSize: '14px' }}
                  value={onboardingData.subjectGroup}
                  onChange={(e) => {
                    const group = e.target.value;
                    let subjects = ['Toán học'];
                    if (group.startsWith('A00')) subjects = ['Toán học', 'Vật lý', 'Hóa học'];
                    else if (group.startsWith('A01')) subjects = ['Toán học', 'Vật lý', 'Tiếng Anh'];
                    else if (group.startsWith('B00')) subjects = ['Toán học', 'Hóa học', 'Sinh học'];
                    else if (group.startsWith('C00')) subjects = ['Ngữ văn', 'Lịch sử', 'Địa lý'];
                    else if (group.startsWith('D01')) subjects = ['Toán học', 'Ngữ văn', 'Tiếng Anh'];
                    setOnboardingData({ ...onboardingData, subjectGroup: group, subjects });
                  }}
                >
                  <option value="A00 (Toán – Lý – Hóa)">Khối A00 (Toán – Vật lý – Hóa học)</option>
                  <option value="A01 (Toán – Lý – Anh)">Khối A01 (Toán – Vật lý – Tiếng Anh)</option>
                  <option value="B00 (Toán – Hóa – Sinh)">Khối B00 (Toán – Hóa học – Sinh học)</option>
                  <option value="C00 (Văn – Sử – Địa)">Khối C00 (Ngữ văn – Lịch sử – Địa lý)</option>
                  <option value="D01 (Toán – Văn – Anh)">Khối D01 (Toán – Ngữ văn – Tiếng Anh)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px', color: '#475569' }}>
                  3. Trường Đại học mong muốn đỗ:
                </label>
                <input 
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '500', outline: 'none', background: '#fff', fontSize: '14px' }}
                  placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                  value={onboardingData.targetSchool}
                  onChange={(e) => setOnboardingData({ ...onboardingData, targetSchool: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px', color: '#475569' }}>
                  4. Mục tiêu điểm số khối thi (trên thang điểm 30):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="range"
                    min="15" max="30" step="0.5"
                    style={{ flex: 1, height: '6px', accentColor: '#6366f1', cursor: 'pointer' }}
                    value={onboardingData.targetScore}
                    onChange={(e) => setOnboardingData({ ...onboardingData, targetScore: e.target.value })}
                  />
                  <strong style={{ fontSize: '18px', fontWeight: '700', padding: '6px 14px', borderRadius: '8px', background: '#ede9fe', color: '#6366f1' }}>
                    {onboardingData.targetScore}đ
                  </strong>
                </div>
              </div>

              <button 
                type="submit" 
                className="lp-btn--accent" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '12px', fontWeight: '700', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff', border: 'none', marginTop: '10px', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                🏁 Hoàn tất thiết lập & Khởi tạo lộ trình AI
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ==========================================================================
         CHANGE PASSWORD POPUP MODAL
         ========================================================================== */}
      {isChangePasswordOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="lp-modal-neo" style={{
            maxWidth: '460px',
            width: '100%',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setIsChangePasswordOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: '2.5px solid #000000',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px #000000',
                transition: 'all 0.15s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-1px, -1px)';
                e.currentTarget.style.boxShadow = '3px 3px 0px #000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '2px 2px 0px #000000';
              }}
            >
              <HiX style={{ fontSize: '16px' }} />
            </button>

            {/* Title / Subheading */}
            <div className="auth-form-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '22px', fontWeight: '800' }}>
                Đổi mật khẩu tài khoản 🔑
              </h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                Vui lòng nhập mật khẩu cũ và thiết lập mật khẩu mới của bạn.
              </p>
            </div>

            {/* Error & Success Alerts */}
            {passwordError && (
              <div className="auth-alert error" style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <HiExclamationCircle className="auth-alert-icon" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="auth-alert success" style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <HiCheckCircle className="auth-alert-icon" />
                {passwordSuccess}
              </div>
            )}

            {/* Change Password Form */}
            <form onSubmit={handleChangePasswordSubmit} className="auth-premium-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Old Password */}
              <div className="auth-input-group">
                <label>MẬT KHẨU CŨ</label>
                <div className="auth-input-wrap">
                  <HiLockClosed className="auth-input-icon" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu cũ của bạn"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    style={{ paddingRight: '48px' }}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowOldPassword(!showOldPassword)} tabIndex={-1}>
                    {showOldPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="auth-input-group">
                <label>MẬT KHẨU MỚI</label>
                <div className="auth-input-wrap">
                  <HiLockClosed className="auth-input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '48px' }}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>
                    {showNewPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="auth-input-group" style={{ marginBottom: '8px' }}>
                <label>XÁC NHẬN MẬT KHẨU MỚI</label>
                <div className="auth-input-wrap">
                  <HiLockClosed className="auth-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '48px' }}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                    {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="auth-submit-btn-premium" 
                disabled={passwordLoading}
                style={{ margin: 0, width: '100%' }}
              >
                {passwordLoading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT MẬT KHẨU MỚI →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
