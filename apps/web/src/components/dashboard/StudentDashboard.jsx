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
  HiUserGroup
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
          for (const course of courses) {
            let calculated = 0;
            if (currentUser) {
              const completed = await enrollmentService.getEnrolledCourseProgress(currentUser.id, course.id);
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
            className={`sdb-menu-item ${currentTab === 'my-courses' || currentTab === 'courses' ? 'active' : ''}`}
            onClick={() => navigateTo('/user/my-courses')}
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
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                  marginBottom: '16px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="sdb-card-title" style={{ fontSize: '16px', fontWeight: '700' }}>Khóa học của tôi</h3>
                  <button 
                    onClick={() => navigateTo('/user/my-courses')} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6366f1' }}
                  >
                    Xem tất cả
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Tên khóa học</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', width: '120px' }}>Môn học</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', width: '110px', textAlign: 'center' }}>Số bài học</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', width: '220px' }}>Tiến độ</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', width: '120px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursesToRender.map((course) => (
                        <tr 
                          key={course.id} 
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                          className="sdb-table-row"
                        >
                          <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                            {course.title}
                          </td>
                          <td style={{ padding: '16px 8px', fontSize: '13px', fontWeight: '500' }}>
                            <span style={{
                              background: course.subject === 'Toán' || course.subject === 'Toán học' ? '#f3e8ff' : course.subject === 'Vật lý' ? '#ccfbf1' : course.subject === 'Hóa học' ? '#dbeafe' : '#ffedd5',
                              color: course.subject === 'Toán' || course.subject === 'Toán học' ? '#7c3aed' : course.subject === 'Vật lý' ? '#0d9488' : course.subject === 'Hóa học' ? '#2563eb' : '#ea580c',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {course.subject}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px', fontSize: '13px', fontWeight: '500', textAlign: 'center', color: '#475569' }}>
                            {course.lessons?.length || course.lessonsCount || 10} bài
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${course.progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }}></div>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#4f46e5', minWidth: '35px', textAlign: 'right' }}>{course.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                if (course.id && !String(course.id).startsWith('def')) {
                                  navigateTo(`/courses/${course.id}`);
                                } else {
                                  navigateTo('/user/courses');
                                }
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.15)'
                              }}
                            >
                              Vào học
                            </button>
                          </td>
                        </tr>
                      ))}
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
                  onClick={() => navigateTo('/user/courses')}
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
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
                  marginBottom: '16px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="sdb-card-title" style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📜 Bài thi gần đây
                  </h3>
                  <button
                    onClick={() => navigateTo('/user/exam-history')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6c5ce7' }}
                  >
                    Xem tất cả →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dashboardData.attempts
                    .filter(a => a.status === 'SUBMITTED')
                    .slice(0, 4)
                    .map((att) => {
                      const score = att.score ?? 0;
                      const scoreColor = score >= 8 ? '#00b894' : score >= 5 ? '#e17055' : '#d63031';
                      const scoreBg = score >= 8 ? 'rgba(0,184,148,0.1)' : score >= 5 ? 'rgba(225,112,85,0.1)' : 'rgba(214,48,49,0.1)';
                      const totalQs = (att.correctCount || 0) + (att.wrongCount || 0) + (att.skippedCount || 0);
                      const dateStr = att.submittedAt
                        ? new Date(att.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '';
                      return (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            background: '#fafafa',
                            transition: 'background 0.15s',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigateTo(`/mock-exams/${att.examId}/result/${att.id}`)}
                          onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseOut={e => e.currentTarget.style.background = '#fafafa'}
                        >
                          {/* Score pill */}
                          <div style={{
                            minWidth: '52px',
                            textAlign: 'center',
                            background: scoreBg,
                            border: `1.5px solid ${scoreColor}`,
                            borderRadius: '10px',
                            padding: '6px 4px',
                            flexShrink: 0
                          }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{score.toFixed(1)}</div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: scoreColor, marginTop: '1px' }}>điểm</div>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {att.exam?.title || 'Đề thi thử'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', display: 'flex', gap: '10px' }}>
                              <span>✅ {att.correctCount || 0}/{totalQs} câu</span>
                              {att.exam?.subject && <span style={{ color: '#6c5ce7', fontWeight: '600' }}>{att.exam.subject}</span>}
                              <span>{dateStr}</span>
                            </div>
                          </div>

                          {/* Action */}
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button
                              onClick={e => { e.stopPropagation(); navigateTo(`/mock-exams/${att.examId}/start`); }}
                              style={{ padding: '5px 10px', background: '#6c5ce7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
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
                <div className="sdb-documents-card">
                  <div className="sdb-card-title-row">
                    <h3 className="sdb-card-title">Tài liệu học tập gần đây</h3>
                    <button 
                      onClick={() => navigateTo('/user/documents')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '900', color: '#8b5cf6' }}
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {userDocuments.length > 0 ? (
                      userDocuments.slice(0, 3).map((doc, idx) => {
                        const tagClass = idx % 4 === 0 ? 'purple-tag' : idx % 4 === 1 ? 'teal-tag' : idx % 4 === 2 ? 'orange-tag' : 'blue-tag';
                        return (
                          <div key={doc.id} className={`sdb-doc-item ${tagClass}`}>
                            <div className="sdb-doc-info" onClick={() => window.open(doc.fileUrl, '_blank')} style={{ cursor: 'pointer', flex: 1 }}>
                              <h4 className="sdb-doc-title">{doc.title}</h4>
                              <p className="sdb-doc-desc">Định dạng: {doc.fileType} • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <a 
                              href={doc.fileUrl} 
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="sdb-doc-action-btn"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                            >
                              <HiDownload />
                            </a>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '28px' }}>📂</span>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '8px 0 0 0', fontWeight: 'bold' }}>Chưa có tài liệu tải lên gần đây</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Joined Classrooms Quick Widget */}
                <div className="sdb-documents-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="sdb-card-title-row">
                    <h3 className="sdb-card-title">Lớp học trực tuyến</h3>
                    <button 
                      onClick={() => navigateTo('/user/classrooms')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '900', color: '#8b5cf6' }}
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {studyGroups.filter(g => g.isMember).length > 0 ? (
                      studyGroups.filter(g => g.isMember).slice(0, 3).map((group, idx) => {
                        const tagClass = idx % 4 === 0 ? 'purple-tag' : idx % 4 === 1 ? 'teal-tag' : idx % 4 === 2 ? 'orange-tag' : 'blue-tag';
                        return (
                          <div 
                            key={group.id} 
                            className={`sdb-doc-item ${tagClass}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              localStorage.setItem('forum_active_group', JSON.stringify(group));
                              navigateTo('/user/forum');
                            }}
                          >
                            <div className="sdb-doc-info" style={{ flex: 1 }}>
                              <h4 className="sdb-doc-title">👥 {group.name}</h4>
                              <p className="sdb-doc-desc">{group.memberCount} thành viên • Trao đổi học tập</p>
                            </div>
                            <span style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: '900' }}>Vào lớp →</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                        <span style={{ fontSize: '28px' }}>🏫</span>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '8px 0 12px 0', fontWeight: 'bold' }}>Chưa tham gia lớp học nào</p>
                        <button
                          onClick={() => navigateTo('/user/classrooms')}
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Khám phá lớp học
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              {/* Stats column with widgets and Pro banner */}
              <div className="sdb-stats-column">
                <div className="sdb-stats-row">
                  <div className="sdb-stat-box">
                    <span className="sdb-stat-label">Thời gian học</span>
                    <h3 className="sdb-stat-value">28 h</h3>
                  </div>

                  <div className="sdb-stat-box">
                    <span className="sdb-stat-label">Chuỗi học tập</span>
                    <h3 className="sdb-stat-value">{dashboardData.gamification?.streakDays ?? 7} ngày</h3>
                  </div>
                </div>

                {/* Upgrade to Pro Banner */}
                <div className="sdb-promo-banner">
                  <div className="sdb-promo-info">
                    <span className="sdb-promo-tag">Gói Tài Khoản</span>
                    <h4 className="sdb-promo-title">Nâng cấp PRO</h4>
                    <p className="sdb-promo-subtitle">Mở khóa AI phân tích lỗi sai & thi thử không giới hành.</p>
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
        {currentTab === 'my-courses' && (
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
                onClick={() => navigateTo('/user/courses')}
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
                  onClick={() => navigateTo('/user/courses')}
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

              <button type="submit" className="sdb-form-submit-btn">
                💾 Lưu thông tin & Cập nhật lộ trình AI
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: TÀI LIỆU CỦA TÔI */}
        {currentTab === 'documents' && (
          <div className="sdb-docs-view">
            <div className="sdb-docs-header">
              <div style={{ textAlign: 'left' }}>
                <h3 className="sdb-card-title" style={{ fontSize: '20px' }}>Kho tài liệu của tôi</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '700' }}>Tải lên các tài liệu ôn tập cá nhân dạng PDF, DOCX hoặc ảnh để lưu trữ.</p>
              </div>

              <label 
                className="sdb-action-btn"
                style={{ background: '#ffffff', color: '#6366f1', border: '1px solid #ddd6fe', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(99,102,241,0.05)' }}
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

            <div className="sdb-search-input-wrap">
              <span className="sdb-search-input-icon"><HiSearch /></span>
              <input 
                type="text" 
                placeholder="Tìm kiếm tài liệu đã tải lên..." 
                className="sdb-search-input"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
              />
            </div>

            <div className="sdb-docs-grid">
              {filteredUserDocs.length > 0 ? (
                filteredUserDocs.map((doc, idx) => {
                  const tagClass = idx % 4 === 0 ? 'purple-tag' : idx % 4 === 1 ? 'teal-tag' : idx % 4 === 2 ? 'orange-tag' : 'blue-tag';
                  return (
                    <div key={doc.id} className={`sdb-doc-item ${tagClass}`} style={{ cursor: 'pointer', position: 'relative' }}>
                      <div className="sdb-doc-info" style={{ marginRight: '50px' }} onClick={() => window.open(doc.fileUrl, '_blank')}>
                        <h4 className="sdb-doc-title" style={{ fontSize: '15px' }}>{doc.title}</h4>
                        <p className="sdb-doc-desc" style={{ fontSize: '12px', marginTop: '4px' }}>
                          Định dạng: {doc.fileType} • Đã tải lên: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <a 
                          href={doc.fileUrl} 
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="sdb-doc-action-btn"
                          style={{ fontSize: '18px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HiDownload />
                        </a>
                        <button 
                          className="sdb-doc-action-btn"
                          style={{ fontSize: '16px', padding: '6px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id, doc.title);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '32px' }}>📂</span>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', marginTop: '12px' }}>Không có tài liệu nào phù hợp!</p>
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
          <div className="sdb-classrooms-view animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header info */}
            <div className="sdb-docs-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 className="sdb-card-title" style={{ fontSize: '20px', margin: 0 }}>Lớp học của tôi</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
                  Tham gia vào các lớp học online thực tế để trao đổi bài học, làm đề ôn tập và thảo luận nhóm cùng các bạn học.
                </p>
              </div>
              <button 
                className="sdb-action-btn"
                onClick={() => navigateTo('/user/forum')}
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)' }}
              >
                Vào cộng đồng chung
              </button>
            </div>

            {/* Statistics summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '8px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>🏫</span>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Đã tham gia</h4>
                  <strong style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                    {studyGroups.filter(g => g.isMember).length} lớp học
                  </strong>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>👥</span>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Tổng số lớp khả dụng</h4>
                  <strong style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                    {studyGroups.length} nhóm học
                  </strong>
                </div>
              </div>
            </div>

            {/* Main grid split */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Joined classrooms section */}
              <div style={{ textAlign: 'left' }}>
                <h4 className="sdb-card-title" style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span> LỚP HỌC ĐANG HỌC TẬP ({studyGroups.filter(g => g.isMember).length})
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
                          padding: '24px',
                          boxShadow: '0 10px 15px -3px rgba(148, 163, 184, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '190px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>
                              {group.name}
                            </h4>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                              Đã tham gia
                            </span>
                          </div>
                          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4', textAlign: 'left' }}>
                            {group.description || 'Chưa có mô tả chi tiết cho lớp học này. Thảo luận cùng bạn bè ngay để trao đổi thông tin.'}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', fontWeight: '500', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '12px' }}>
                            <span>Thành viên lớp: {group.memberCount} học sinh</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => {
                                localStorage.setItem('forum_active_group', JSON.stringify(group));
                                navigateTo('/user/forum');
                              }}
                              style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Vào thảo luận nhóm ⚡
                            </button>
                            <button
                              onClick={() => handleLeaveClassroom(group.id, group.name)}
                              style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Rời lớp
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', border: '2.5px dashed #cbd5e1', borderRadius: '16px', background: '#ffffff' }}>
                    <span style={{ fontSize: '36px' }}>🎒</span>
                    <h5 style={{ fontSize: '15px', fontWeight: '900', color: '#000', margin: '12px 0 6px 0' }}>Bạn chưa tham gia lớp học nào</h5>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0', fontWeight: '700' }}>
                      Tham khảo danh sách lớp học khả dụng bên dưới để cùng kết nối nhé!
                    </p>
                  </div>
                )}
              </div>

              {/* Browse available classrooms */}
              <div style={{ textAlign: 'left' }}>
                <h4 className="sdb-card-title" style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🌐</span> DANH SÁCH LỚP HỌC KHÁC ({studyGroups.filter(g => !g.isMember).length})
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
                          padding: '24px',
                          boxShadow: '0 10px 15px -3px rgba(148, 163, 184, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '190px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '16.5px', fontWeight: '700', color: '#0f172a', margin: 0, textAlign: 'left' }}>
                              {group.name}
                            </h4>
                          </div>
                          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4', textAlign: 'left' }}>
                            {group.description || 'Chưa có mô tả chi tiết cho lớp học này.'}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b', fontWeight: '500', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '12px' }}>
                            <span>Thành viên lớp: {group.memberCount} học sinh</span>
                          </div>
                          <button
                            onClick={() => handleJoinClassroom(group.id)}
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Tham gia lớp học 🤝
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', background: '#ffffff' }}>
                    <span style={{ fontSize: '24px' }}>✨</span>
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: '8px 0 0 0', fontWeight: '800' }}>Tất cả các lớp học hiện tại đều đã được tham gia!</p>
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
    </div>
  );
}
