import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from '../utils/toast';

export default function LeaderboardTab({ currentUser }) {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [province, setProvince] = useState('');
  const [search, setSearch] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('streak'); // Default to attendance streak (chuỗi điểm danh)
  const [userGamify, setUserGamify] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchGamifyProfile = async () => {
    try {
      const res = await api.getUserGamificationProfile();
      if (res) {
        setUserGamify(res);
      }
    } catch (err) {
      console.error('Lỗi tải thông tin gamification:', err);
    }
  };

  useEffect(() => {
    fetchGamifyProfile();
  }, []);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      const res = await api.logAttendance('MINDMAP');
      if (res) {
        toast('Điểm danh ngày hôm nay thành công! +15 XP và tăng chuỗi học lửa 🔥', 'success');
        await fetchGamifyProfile();
        setPage(1);
        // Force ranking reload
        const filters = { page: 1, limit: 10, sortBy };
        if (grade) filters.grade = grade;
        if (subject) filters.subject = subject;
        if (province) filters.province = province;
        if (search) filters.search = search;
        const rankRes = await api.getAdvancedLeaderboard(filters);
        if (rankRes) {
          setRankings(rankRes.rankings || []);
          setTotalPages(rankRes.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      toast(err.message || 'Điểm danh thất bại!', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const filters = { page, limit: 10, sortBy };
        if (grade) filters.grade = grade;
        if (subject) filters.subject = subject;
        if (province) filters.province = province;
        if (search) filters.search = search;

        const res = await api.getAdvancedLeaderboard(filters);
        if (active && res) {
          setRankings(res.rankings || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('Lỗi tải bảng xếp hạng:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRankings();
    return () => { active = false; };
  }, [grade, subject, province, search, page, sortBy]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const getStreakDisplay = (student) => {
    if (subject) {
      return `🔥 ${student.subjectStreak || 0} ngày (${subject.toUpperCase()})`;
    }
    return `🔥 ${student.streak || 0} ngày`;
  };

  const renderAvatar = (avatar, name, size = 64, borderSize = 2) => {
    const isUrl = typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('data:'));
    
    if (isUrl) {
      return (
        <img
          src={avatar}
          alt={name}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            border: `${borderSize}px solid #F5C453`,
            objectFit: 'cover',
            display: 'inline-block',
            margin: size > 40 ? '14px 0' : '0',
            boxShadow: 'var(--shadow-sm)'
          }}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'HS')}&background=F5C453&color=15181F`;
          }}
        />
      );
    }

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #F5C453, #f7d070)',
        color: '#15181F',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: size > 40 ? '18px' : '11px',
        border: `${borderSize}px solid #F5C453`,
        margin: size > 40 ? '14px 0' : '0',
        boxShadow: 'var(--shadow-sm)',
        textTransform: 'uppercase'
      }}>
        {avatar || name?.substring(0, 2).toUpperCase() || 'HS'}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Daily Check-In Premium Panel */}
      {userGamify && (
        <div style={{
          background: 'linear-gradient(135deg, #F0F5FF 0%, #E5EDFF 100%)',
          border: '1px solid #BFDBFE',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03), inset 0 0 16px rgba(255, 255, 255, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Flame element */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: 'rgba(255, 167, 81, 0.15)',
            border: '2px solid #ff9f43',
            fontSize: '36px',
            boxShadow: '0 0 20px rgba(255, 167, 81, 0.2)',
            flexShrink: 0
          }}>
            🔥
          </div>

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', background: '#6c5ce7', color: '#FFFFFF', padding: '2px 8px', borderRadius: '12px', fontWeight: '900', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                ĐIỂM DANH TÍCH LŨY STREAK
              </span>
              <strong style={{ fontSize: '16px', color: '#4f46e5' }}>
                Chuỗi học tập hiện tại: {userGamify.streakDays} ngày 🔥
              </strong>
            </div>
            <h4 style={{ fontSize: '16px', color: '#1E293B', fontWeight: '800', marginTop: '8px', marginBottom: '4px' }}>
              {userGamify.alreadyCheckedInToday 
                ? 'Hôm nay bạn đã thắp lửa học tập thành công! ✅' 
                : 'Thắp lửa chuỗi ngày học tập của bạn! ⚡'}
            </h4>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
              {userGamify.alreadyCheckedInToday 
                ? 'Tuyệt vời! Bạn đã duy trì chuỗi học tập ngày hôm nay. Hãy tiếp tục ôn luyện và giữ vững phong độ vào ngày mai nhé!' 
                : 'Điểm danh ngay hôm nay để thắp lửa chuỗi ngày học liên tục, nhận ngay +20 XP thưởng bứt phá thứ hạng!'}
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            {userGamify.alreadyCheckedInToday ? (
              <span style={{
                background: 'rgba(0, 184, 148, 0.1)',
                border: '1px solid #00b894',
                color: '#00b894',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: '900',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ✓ Đã thắp lửa hôm nay (+20 XP)
              </span>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                style={{
                  background: 'linear-gradient(135deg, #6c5ce7 0%, #4f46e5 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '900',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(108, 92, 231, 0.25)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(108, 92, 231, 0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 92, 231, 0.25)'; }}
              >
                {checkingIn ? 'Đang điểm danh...' : '🔥 Điểm danh hàng ngày'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters Section */}
      <div className="card" style={{
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
        borderRadius: '16px',
        padding: '20px',
        background: '#FFFFFF',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Tìm học sinh bằng họ tên..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              border: '1px solid #CBD5E1',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#F8FAFC',
              color: '#1E293B',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="📍 Tìm kiếm tỉnh thành..."
            value={province}
            onChange={(e) => { setProvince(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              border: '1px solid #CBD5E1',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#F8FAFC',
              color: '#1E293B',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ flex: '0 0 120px' }}>
          <select
            value={grade}
            onChange={(e) => { setGrade(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              border: '1px solid #CBD5E1',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: '#F8FAFC',
              color: '#1E293B',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Khối lớp</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>
        </div>

        <div style={{ flex: '0 0 140px' }}>
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              border: '1px solid #CBD5E1',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              background: '#F8FAFC',
              color: '#1E293B',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Tất cả môn</option>
            <option value="toán học">Toán học</option>
            <option value="vật lý">Vật lý</option>
            <option value="hóa học">Hóa học</option>
            <option value="sinh học">Sinh học</option>
            <option value="tiếng anh">Tiếng Anh</option>
          </select>
        </div>

        {/* Toggle Streak vs XP */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setSortBy('streak'); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid ' + (sortBy === 'streak' ? '#6c5ce7' : '#E2E8F0'),
              background: sortBy === 'streak' ? '#6c5ce7' : '#F1F5F9',
              color: sortBy === 'streak' ? '#FFFFFF' : '#475569',
              boxShadow: sortBy === 'streak' ? '0 4px 12px rgba(108, 92, 231, 0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            ⚡ Chăm Chỉ (Streak)
          </button>
          <button
            onClick={() => { setSortBy('xp'); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '1px solid ' + (sortBy === 'xp' ? '#6c5ce7' : '#E2E8F0'),
              background: sortBy === 'xp' ? '#6c5ce7' : '#F1F5F9',
              color: sortBy === 'xp' ? '#FFFFFF' : '#475569',
              boxShadow: sortBy === 'xp' ? '0 4px 12px rgba(108, 92, 231, 0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📝 Điểm Thi Thử
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', fontSize: '15px', fontWeight: 'bold', color: '#475569' }}>
          Đang tải bảng xếp hạng học tập... 🏆
        </div>
      ) : (
        <>
          {/* Top 3 High-contrast Cards */}
          {top3.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {top3.map((student, index) => {
                const colors = [
                  { 
                    bg: 'linear-gradient(135deg, #FFFDF0 0%, #FFFBEB 100%)', 
                    border: '1.5px solid #F5C453', 
                    medal: '👑', 
                    label: 'Thủ Khoa', 
                    text: '#B45309',
                    glow: '0 10px 25px rgba(245, 196, 83, 0.12)' 
                  },
                  { 
                    bg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', 
                    border: '1.5px solid #94A3B8', 
                    medal: '🥈', 
                    label: 'Á Khoa', 
                    text: '#475569',
                    glow: '0 10px 20px rgba(148, 163, 184, 0.08)' 
                  },
                  { 
                    bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', 
                    border: '1.5px solid #F97316', 
                    medal: '🥉', 
                    label: 'Tam Khoa', 
                    text: '#C2410C',
                    glow: '0 10px 20px rgba(249, 115, 22, 0.08)' 
                  }
                ][index] || { bg: '#FFFFFF', border: '1px solid #E2E8F0', medal: '⭐', label: 'Vinh danh', text: '#64748B', glow: 'none' };

                return (
                  <div
                    key={student.userId}
                    style={{
                      background: colors.bg,
                      border: colors.border,
                      borderRadius: '18px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      boxShadow: colors.glow,
                      position: 'relative',
                      transition: 'transform 0.3s ease-in-out',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      right: '16px',
                      fontSize: '11px',
                      fontWeight: '900',
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: '#4f46e5',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      Hạng {student.rank}
                    </span>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{colors.medal}</span>
                    <h3 style={{ fontSize: '14.5px', fontWeight: '955', textTransform: 'uppercase', color: colors.text, margin: 0 }}>
                      {colors.label} {subject ? subject.toUpperCase() : 'Toàn sàn'}
                    </h3>
                    
                    {renderAvatar(student.avatar, student.name, 64, 2)}

                    <h4 style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B', margin: '10px 0 4px 0' }}>{student.name}</h4>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 8px 0', fontWeight: '500' }}>
                      Khối {student.grade || 'Chưa rõ'} • Tỉnh: {student.province || 'Chưa cập nhật'}
                    </p>
                    <p style={{ fontSize: '13.5px', fontWeight: '900', color: colors.text, margin: 0 }}>
                      {sortBy === 'xp' ? (
                        <>Điểm thi thử: <strong>{student.testScore ?? 0}</strong></>
                      ) : (
                        <>XP: <strong>{student.xp.toLocaleString()}</strong></>
                      )}
                      {" • "}{getStreakDisplay(student)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table rankings */}
          <div className="card animate-slide-up" style={{
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
            borderRadius: '16px',
            padding: '24px',
            background: '#FFFFFF'
          }}>
            {rankings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '14px', color: '#64748B' }}>
                Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại. 🔍
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '800px' }}>
                {/* Custom Grid Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 2fr 1fr 1.2fr 1.5fr 1.2fr',
                  alignItems: 'center',
                  padding: '12px 24px',
                  borderBottom: '2px solid #E2E8F0',
                  color: '#1E293B',
                  fontWeight: '950',
                  fontSize: '13px',
                  textTransform: 'uppercase'
                }}>
                  <div>Hạng</div>
                  <div>Học sinh</div>
                  <div>Khối lớp</div>
                  <div>Tỉnh thành</div>
                  <div>Chuỗi học</div>
                  <div style={{ textAlign: 'right' }}>{sortBy === 'xp' ? 'Điểm thi thử' : 'Tổng điểm XP'}</div>
                </div>

                {/* Custom Grid Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rankings.map((student) => (
                    <div
                      key={student.userId}
                      className={`leaderboard-row animate-slide-up ${student.rank === 1 ? 'top-1' : student.rank === 2 ? 'top-2' : student.rank === 3 ? 'top-3' : ''}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 2fr 1fr 1.2fr 1.5fr 1.2fr',
                        alignItems: 'center',
                        padding: '16px 24px',
                        background: student.userId === currentUser?.id ? 'rgba(108, 92, 231, 0.06)' : 'var(--bg-card, #FFFFFF)',
                        fontWeight: student.userId === currentUser?.id ? 'bold' : 'normal',
                        color: '#1E293B',
                        borderRadius: '18px',
                        border: '2.5px solid #000000',
                        boxShadow: student.rank === 1 
                          ? '5px 5px 0px #FFD234' 
                          : student.rank === 2 
                          ? '5px 5px 0px #CBD5E1' 
                          : student.rank === 3 
                          ? '5px 5px 0px #F0A36D' 
                          : '4px 4px 0px #000000',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-2px, -2px)';
                        e.currentTarget.style.boxShadow = student.rank === 1 
                          ? '7px 7px 0px #FFD234' 
                          : student.rank === 2 
                          ? '7px 7px 0px #CBD5E1' 
                          : student.rank === 3 
                          ? '7px 7px 0px #F0A36D' 
                          : '7px 7px 0px #000000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = student.rank === 1 
                          ? '5px 5px 0px #FFD234' 
                          : student.rank === 2 
                          ? '5px 5px 0px #CBD5E1' 
                          : student.rank === 3 
                          ? '5px 5px 0px #F0A36D' 
                          : '4px 4px 0px #000000';
                      }}
                    >
                      {/* Rank Column */}
                      <div>
                        <span style={{
                          fontWeight: '900',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: student.rank <= 3 ? 'none' : '1px solid #E2E8F0',
                          background: student.rank === 1 ? '#fef08a' : (student.rank === 2 ? '#e2e8f0' : (student.rank === 3 ? '#fed7aa' : 'transparent')),
                          color: student.rank <= 3 ? '#854d0e' : '#475569',
                          boxShadow: student.rank <= 3 ? 'var(--shadow-sm)' : 'none'
                        }}>
                          {student.rank}
                        </span>
                      </div>

                      {/* Student Info Column */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {renderAvatar(student.avatar, student.name, 36, 1.5)}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: '900', fontSize: '14px', color: '#1E293B', whiteSpace: 'nowrap' }}>{student.name}</div>
                            {student.userId === currentUser?.id && (
                              <span style={{ fontSize: '10px', background: '#00b894', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '900', marginTop: '2px', display: 'inline-block' }}>BẠN</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Grade Column */}
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#475569' }}>
                        Khối {student.grade || 'Chưa cập nhật'}
                      </div>

                      {/* Province Column */}
                      <div style={{ color: '#64748B', fontSize: '13.5px' }}>
                        📍 {student.province || 'Chưa rõ'}
                      </div>

                      {/* Streak Column */}
                      <div style={{ fontWeight: '800', color: '#ff9f43', fontSize: '13.5px' }}>
                        {getStreakDisplay(student)}
                      </div>

                      {/* XP Column */}
                      <div style={{ textAlign: 'right', fontWeight: '955', fontSize: '15px', color: '#1E293B' }}>
                        {sortBy === 'xp' ? `${student.testScore ?? 0} điểm` : `${student.xp.toLocaleString()} XP`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  style={{
                    border: '1px solid #CBD5E1',
                    background: page === 1 ? '#F1F5F9' : '#FFFFFF',
                    color: page === 1 ? '#94A3B8' : '#1E293B',
                    fontWeight: '800',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  ◀ Trang trước
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontWeight: '900', fontSize: '13px', color: '#1E293B' }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{
                    border: '1px solid #CBD5E1',
                    background: page === totalPages ? '#F1F5F9' : '#FFFFFF',
                    color: page === totalPages ? '#94A3B8' : '#1E293B',
                    fontWeight: '800',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  Trang sau ▶
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
