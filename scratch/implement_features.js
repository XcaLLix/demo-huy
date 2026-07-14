const fs = require('fs');

const path = 'apps/web/src/components/dashboard/StudentDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject States
content = content.replace(
  /const \[loading, setLoading\] = useState\(true\);/g,
  `const [loading, setLoading] = useState(true);
  
  // Attendance & Streak States
  const [streakViewMode, setStreakViewMode] = useState('week'); // 'week' | 'month'
  const [currentStreakDate, setCurrentStreakDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  // Home Dashboard Leaderboard States
  const [effortLeaderboard, setEffortLeaderboard] = useState([]);
  const [scoreLeaderboard, setScoreLeaderboard] = useState([]);
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);
  const LEADERBOARD_SUBJECTS = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn'];
  const [isRotating, setIsRotating] = useState(false);`
);

// 2. Inject UseEffects for Data Fetching
content = content.replace(
  /loadDashboardResources\(\);\s*\}, \[currentUser\]\);/g,
  `loadDashboardResources();
  }, [currentUser]);

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
  }, [currentUser, streakViewMode, currentStreakDate, currentTab]);

  // Load Leaderboards on Home
  useEffect(() => {
    if (currentTab !== 'home') return;
    const loadEffort = async () => {
      try {
        const data = await api.getEffortLeaderboard();
        setEffortLeaderboard(data || []);
      } catch (err) {
        console.error('Lỗi tải BXH nỗ lực:', err);
      }
    };
    loadEffort();
  }, [currentTab]);

  useEffect(() => {
    if (currentTab !== 'home') return;
    const currentSubject = LEADERBOARD_SUBJECTS[activeSubjectIdx];
    const loadScore = async () => {
      setIsRotating(true);
      try {
        const data = await api.getHighestScoreLeaderboard(currentSubject);
        setScoreLeaderboard(data || []);
      } catch (err) {
        console.error('Lỗi tải BXH điểm số:', err);
      } finally {
        setTimeout(() => setIsRotating(false), 300);
      }
    };
    loadScore();
  }, [currentTab, activeSubjectIdx]);

  useEffect(() => {
    if (currentTab !== 'home') return;
    const timer = setInterval(() => {
      setActiveSubjectIdx(prev => (prev + 1) % LEADERBOARD_SUBJECTS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [currentTab]);`
);

// 3. Inject Leaderboards Section into Home Tab markup
const bxhHtml = `              </div>
            </div>

            {/* LEADERBOARDS SECTION */}
            <div className="sdb-leaderboards-section" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', textAlign: 'left' }}>
              
              {/* Score Leaderboard with rotation */}
              <div className="card animate-in" style={{ border: '3px solid #000', borderRadius: '16px', padding: '24px', background: '#fff', boxShadow: '4px 4px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#000', margin: 0 }}>
                      🏆 ĐIỂM LUYỆN ĐỀ CAO NHẤT
                    </h3>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0', fontWeight: '800' }}>
                      Phân môn: <span style={{ color: '#8b5cf6' }}>{LEADERBOARD_SUBJECTS[activeSubjectIdx]}</span> (tự động chuyển sau 8s)
                    </p>
                  </div>
                  <span style={{ fontSize: '24px' }}>🎯</span>
                </div>

                <div className={isRotating ? 'fade-out-slide' : 'fade-in-slide'} style={{ transition: 'opacity 0.3s ease, transform 0.3s ease', minHeight: '260px' }}>
                  {scoreLeaderboard.length > 0 ? (
                    scoreLeaderboard.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx < 4 ? '1px dashed #e2e8f0' : 'none' }}>
                        <span style={{ fontSize: '14px', fontWeight: '950', width: '24px', color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#000' }}>
                          #{idx + 1}
                        </span>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #000', background: '#e2e8f0', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px'
                        }}>
                          {item.avatar ? <img src={item.avatar} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#000' }}>{item.name}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>{item.examTitle}</div>
                        </div>
                        <span style={{ background: '#fef3c7', border: '1.5px solid #000', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '950', color: '#b45309' }}>
                          {item.score}đ
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', color: '#94a3b8' }}>
                      <span style={{ fontSize: '32px' }}>📊</span>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '8px' }}>Chưa có lượt nộp bài môn này</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Effort Leaderboard */}
              <div className="card animate-in" style={{ border: '3px solid #000', borderRadius: '16px', padding: '24px', background: '#fff', boxShadow: '4px 4px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#000', margin: 0 }}>
                      ⚡ BẢNG XẾP HẠNG NỖ LỰC
                    </h3>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0 0', fontWeight: '800' }}>
                      Điểm tích lũy từ diễn đàn & chăm chỉ luyện tập
                    </p>
                  </div>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                </div>

                <div style={{ minHeight: '260px' }}>
                  {effortLeaderboard.length > 0 ? (
                    effortLeaderboard.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: idx < 4 ? '1px dashed #e2e8f0' : 'none' }}>
                        <span style={{ fontSize: '14px', fontWeight: '950', width: '24px', color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#000' }}>
                          #{idx + 1}
                        </span>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #000', background: '#e2e8f0', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px'
                        }}>
                          {item.user.avatarUrl ? <img src={item.user.avatarUrl} alt={item.user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.user.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#000' }}>{item.user.fullName}</div>
                          <div style={{ fontSize: '9px', color: '#8b5cf6', fontWeight: '900' }}>
                            Diễn đàn: +{item.forumPoints}đ • Học tập: +{item.studyPoints}đ
                          </div>
                        </div>
                        <span style={{ background: '#e0f2fe', border: '1.5px solid #000', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '950', color: '#0369a1' }}>
                          {item.score} nỗ lực
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', color: '#94a3b8' }}>
                      <span style={{ fontSize: '32px' }}>⚡</span>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '8px' }}>Chưa có dữ liệu nỗ lực</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<\/>\s*\)\}/g,
  bxhHtml
);

// 4. Inject Monthly & Weekly attendance grid in the Streak Tab
const helperCode = `
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
`;

content = content.replace(
  /const toggleCalendarSlot =/g,
  `${helperCode}\n  const toggleCalendarSlot =`
);

const streakTabHtml = `
            {/* Checkin study heatmap */}
            <div className="sdb-heatmap-section" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="sdb-heatmap-title" style={{ margin: 0 }}>Lịch sử chuyên cần</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setStreakViewMode('week')}
                    style={{
                      background: streakViewMode === 'week' ? '#000' : '#fff',
                      color: streakViewMode === 'week' ? '#fff' : '#000',
                      border: '2px solid #000',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontWeight: '900',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Tuần
                  </button>
                  <button 
                    onClick={() => setStreakViewMode('month')}
                    style={{
                      background: streakViewMode === 'month' ? '#000' : '#fff',
                      color: streakViewMode === 'month' ? '#fff' : '#000',
                      border: '2px solid #000',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontWeight: '900',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Tháng
                  </button>
                </div>
              </div>

              {/* Navigation row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '2px solid #000', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px' }}>
                <button onClick={() => handleNavAttendance('prev')} style={{ background: '#fff', border: '1.5px solid #000', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: '900', fontSize: '11px' }}>
                  ← Trước
                </button>
                <span style={{ fontSize: '13px', fontWeight: '950' }}>
                  {streakViewMode === 'week' ? (
                    \`Tuần bắt đầu ngày \${getWeekDays()[0].date.toLocaleDateString('vi-VN')}\`
                  ) : (
                    \`Tháng \${currentStreakDate.getMonth() + 1} / \${currentStreakDate.getFullYear()}\`
                  )}
                </span>
                <button onClick={() => handleNavAttendance('next')} style={{ background: '#fff', border: '1.5px solid #000', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: '900', fontSize: '11px' }}>
                  Sau →
                </button>
              </div>

              {streakViewMode === 'week' ? (
                <div className="sdb-heatmap-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {getWeekDays().map((item) => (
                    <div 
                      key={item.dateStr} 
                      className={\`sdb-heatmap-day \${item.hasAttended ? 'completed' : 'missed'}\`}
                      style={{ border: item.isToday ? '3px solid #ef4444' : '2px solid #000', position: 'relative' }}
                      title={\`\${item.label}: \${item.hasAttended ? 'Đã điểm danh học tập' : 'Chưa có hoạt động'}\`}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '950' }}>{item.label}</span>
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
                        background: item.hasAttended ? '#86efac' : '#f1f5f9',
                        border: item.isToday ? '3px solid #ef4444' : '2px solid #000',
                        borderRadius: '8px',
                        boxShadow: '1.5px 1.5px 0px #000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                      title={\`Ngày \${item.dayNum}: \${item.hasAttended ? 'Đã điểm danh học tập' : 'Chưa học'}\`}
                    >
                      <span style={{ fontSize: '11px', fontWeight: '950', color: '#000' }}>{item.dayNum}</span>
                      <span style={{ fontSize: '8px' }}>
                        {item.hasAttended ? '🔥' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
`;

content = content.replace(
  /<div className="sdb-heatmap-section">[\s\S]*?<\/div>\s*<\/div>/,
  streakTabHtml
);

fs.writeFileSync(path, content, 'utf8');

console.log("StudentDashboard updated successfully.");
