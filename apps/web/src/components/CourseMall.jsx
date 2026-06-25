import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { HiSearch, HiAcademicCap, HiStar, HiUsers, HiBookOpen, HiCurrencyDollar, HiCheckCircle } from 'react-icons/hi';
import teacherMathImg from '../assets/teacher_math.png';
import studentLearningImg from '../assets/student_learning.png';
import studentSuccessImg from '../assets/student_success.png';
import educatorsTeamImg from '../assets/educators_team.png';
import ContinueLearningRail from './courses/catalog/ContinueLearningRail';

const getCourseImage = (course) => {
  const subject = course?.subject || '';
  if (subject === 'Toán' || subject === 'Toán học') return teacherMathImg;
  if (subject === 'Vật lý') return studentLearningImg;
  if (subject === 'Hóa học') return studentSuccessImg;
  return educatorsTeamImg;
};

export default function CourseMall({ courses, currentUser, onSelectCourse, onLearnCourse, onCheckoutCourse, onRegisterLead }) {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewTab, setActiveViewTab] = useState('my-courses');
  const [progresses, setProgresses] = useState({});

  const subjects = ['All', 'Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh'];

  // Load progress details from DB / local
  useEffect(() => {
    const loadAllProgress = async () => {
      try {
        const { enrollmentService } = await import('../services/enrollmentService');
        const progressMap = {};
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
          // Set mock progression baseline if calculated is 0 so it looks active in demo
          progressMap[course.id] = calculated > 0 ? calculated : (course.id === 1 ? 60 : (course.id === 2 ? 40 : 25));
        }
        setProgresses(progressMap);
      } catch (err) {
        console.warn('[CourseMall] Failed to fetch progress:', err);
      }
    };
    loadAllProgress();
  }, [courses, currentUser]);

  // Add rich visual mockup info to initial courses
  const decoratedCourses = courses.map(c => {
    const isUnlocked = c.priceSale === 0 || 
                       currentUser?.unlockedCourses?.includes(c.id) || 
                       currentUser?.unlockedCourses?.includes(c.id.toString()) ||
                       currentUser?.unlockedCourses?.includes(Number(c.id));
    
    const rating = c.rating?.toString() || '4.8';
    const students = c.studentCount?.toLocaleString() || '1,200';
    const duration = c.durationHours ? `${c.durationHours} giờ học` : '15 giờ học';
    
    // Choose dynamic gradient background based on subject
    let imageBg = 'linear-gradient(135deg, #6C5CE7, #a29bfe)'; // Default purple/blue
    if (c.subject === 'Toán' || c.subject === 'Toán học') {
      imageBg = 'linear-gradient(135deg, #0984E3, #74b9ff)';
    } else if (c.subject === 'Vật lý') {
      imageBg = 'linear-gradient(135deg, #e17055, #fab1a0)';
    } else if (c.subject === 'Hóa học') {
      imageBg = 'linear-gradient(135deg, #00b894, #55efc4)';
    } else if (c.subject === 'Tiếng Anh') {
      imageBg = 'linear-gradient(135deg, #fd79a8, #fdcb6e)';
    }

    return {
      ...c,
      isUnlocked,
      rating,
      students,
      duration,
      imageBg
    };
  });

  const filteredCourses = decoratedCourses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || c.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const unlockedCourses = filteredCourses.filter(c => c.isUnlocked);
  const lockedCourses = filteredCourses.filter(c => !c.isUnlocked);

  return (
    <div className="course-mall-container animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '14px', borderBottom: '3px solid #000000', paddingBottom: '12px' }}>
        <button
          className="admin-sub-tab-btn"
          style={{
            background: activeViewTab === 'my-courses' ? '#000000' : 'transparent',
            color: activeViewTab === 'my-courses' ? '#ffffff' : '#000000',
            border: '3px solid #000000',
            padding: '10px 22px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            borderRadius: '8px',
            boxShadow: activeViewTab === 'my-courses' ? 'none' : '3px 3px 0px #000000',
            transform: activeViewTab === 'my-courses' ? 'translate(2px, 2px)' : 'none',
            transition: 'all 0.15s'
          }}
          onClick={() => setActiveViewTab('my-courses')}
        >
          🎓 KHÓA HỌC CỦA TÔI
        </button>
        <button
          className="admin-sub-tab-btn"
          style={{
            background: activeViewTab === 'store' ? '#000000' : 'transparent',
            color: activeViewTab === 'store' ? '#ffffff' : '#000000',
            border: '3px solid #000000',
            padding: '10px 22px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            borderRadius: '8px',
            boxShadow: activeViewTab === 'store' ? 'none' : '3px 3px 0px #000000',
            transform: activeViewTab === 'store' ? 'translate(2px, 2px)' : 'none',
            transition: 'all 0.15s'
          }}
          onClick={() => setActiveViewTab('store')}
        >
          🛒 KHO KHÓA HỌC PREMIUM
        </button>
      </div>

      {activeViewTab === 'my-courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Continue Learning Rail */}
          <ContinueLearningRail 
            currentUser={currentUser}
            courses={courses}
            onSelectCourse={(course) => onLearnCourse ? onLearnCourse(course) : onSelectCourse(course)}
          />

          {/* Search Bar for Owned Courses */}
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {subjects.map(subj => (
                <button
                  key={subj}
                  className={`badge-pill ${selectedSubject === subj ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(subj)}
                  style={{
                    border: '1.5px solid #000000',
                    background: selectedSubject === subj ? '#000000' : 'transparent',
                    color: selectedSubject === subj ? '#fff' : '#000',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {subj === 'All' ? 'Tất cả môn' : subj}
                </button>
              ))}
            </div>

            <div className="search-bar" style={{ position: 'relative', width: '280px' }}>
              <HiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Tìm khóa học của bạn..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%', fontSize: '12.5px', border: '1.5px solid #000000', borderRadius: '6px' }}
              />
            </div>
          </div>

          {unlockedCourses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {unlockedCourses.map(c => {
                const progressVal = progresses[c.id] || 0;
                return (
                  <div 
                    key={c.id} 
                    className="card landing-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      padding: 0,
                      border: '3px solid #000000',
                      boxShadow: '4px 4px 0px #000000',
                      borderRadius: '12px',
                      height: '100%'
                    }}
                  >
                    {/* Visual Header */}
                    <div 
                      onClick={() => onSelectCourse(c)}
                      style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${getCourseImage(c)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        height: '130px',
                        padding: '16px',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800' }}>
                          {c.subject}
                        </span>
                        <span style={{ fontSize: '10px', background: '#D1FAE5', border: '1.5px solid #000000', color: '#065F46', fontWeight: '800', padding: '3px 8px', borderRadius: '10px', boxShadow: '1px 1px 0px #000000' }}>
                          ✓ ĐÃ SỞ HỮU
                        </span>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.6)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                        {c.title}
                      </h4>
                    </div>

                    {/* Progress & Info */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                          Giảng viên: <strong>{c.teacherName}</strong>
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                          Thời lượng: {c.duration} • {c.lessons?.length || 5} bài học
                        </p>

                        {/* Learning Progress Bar */}
                        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: '800' }}>
                            <span style={{ color: '#555' }}>Tiến độ học:</span>
                            <span style={{ color: 'var(--primary)' }}>{progressVal}%</span>
                          </div>
                          <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden', border: '1.5px solid #000000' }}>
                            <div 
                              style={{ 
                                width: `${progressVal}%`, 
                                height: '100%', 
                                background: 'linear-gradient(90deg, #10B981, #059669)', 
                                transition: 'width 0.4s ease-in-out' 
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1.5px dashed #E5E7EB' }}>
                        <button 
                          className="admin-back-btn" 
                          style={{
                            width: '100%',
                            background: '#10B981',
                            color: '#ffffff',
                            fontWeight: '800',
                            border: '2px solid #000000',
                            boxShadow: '2px 2px 0px #000000',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: '8px'
                          }}
                          onClick={() => onLearnCourse ? onLearnCourse(c) : onSelectCourse(c)}
                        >
                          Vào học ngay →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FCFBFA', border: '2px dashed #000000', borderRadius: '12px' }}>
              <span style={{ fontSize: '36px' }}>📚</span>
              <h4 style={{ fontWeight: '800', marginTop: '16px', fontSize: '15px' }}>Bạn chưa sở hữu khóa học nào</h4>
              <p style={{ fontSize: '12.5px', color: '#666', marginTop: '6px', marginBottom: '20px' }}>
                Hãy đăng ký khóa học Premium để mở khóa lộ trình học và bắt đầu bài học của mình nhé.
              </p>
              <button 
                className="admin-back-btn" 
                style={{ background: '#000000', color: '#fff', border: '2px solid #000000', boxShadow: '3px 3px 0px #000000', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => setActiveViewTab('store')}
              >
                Khám phá kho khóa học &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {activeViewTab === 'store' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Premium Hero Banner */}
          <div 
            className="premium-hero-banner" 
            style={{ 
              background: 'linear-gradient(135deg, #6C5CE7 0%, #FD79A8 100%)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '36px', 
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(108,92,231,0.25)'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Combo Tiết Kiệm THPTQG 2026
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '14px', marginBottom: '10px', lineHeight: '1.3' }}>
                Chinh Phục Điểm Số Ước Mơ Cùng Đội Ngũ Thủ Khoa & Chuyên Gia
              </h1>
              <p style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.5', marginBottom: '24px' }}>
                Học tập thông minh hơn với lộ trình tự động điều chỉnh theo năng lực thực tế. Đăng ký combo học liệu để nhận ưu đãi lên đến 40% học phí.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ background: '#fff', color: 'var(--primary)', fontWeight: 'bold', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                  onClick={() => {
                    if (currentUser) {
                      if (onRegisterLead) {
                        onRegisterLead({
                          name: currentUser.name || 'Học viên ẩn danh',
                          phone: currentUser.phone || 'Chưa cung cấp SĐT',
                          email: currentUser.email,
                          target: `Combo Pro THPTQG 2026 • Khối ${currentUser.combo || 'Tổng hợp'}`
                        });
                      }
                      toast('Đăng ký tư vấn combo thành công! Cố vấn sẽ liên hệ với em qua SĐT/Email.', 'success');
                    } else {
                      toast('Vui lòng đăng nhập để đăng ký nhận tư vấn lộ trình Pro!', 'warning');
                    }
                  }}
                >
                  Tư vấn Combo Pro
                </button>
                <button 
                  className="btn-outline" 
                  style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-md)' }}
                  onClick={() => setSelectedSubject('All')}
                >
                  Khám phá khóa học
                </button>
              </div>
            </div>
            
            <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', filter: 'blur(30px)' }}></div>
            <div style={{ position: 'absolute', right: '150px', top: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)' }}></div>
          </div>

          {/* Filters for Store */}
          <div className="card" style={{ padding: '18px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {subjects.map(subj => (
                  <button
                    key={subj}
                    className={`badge-pill ${selectedSubject === subj ? 'active' : ''}`}
                    onClick={() => setSelectedSubject(subj)}
                    style={{
                      border: '1px solid var(--border)',
                      background: selectedSubject === subj ? 'var(--primary)' : 'var(--bg-main)',
                      color: selectedSubject === subj ? '#fff' : 'var(--text-secondary)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {subj === 'All' ? 'Tất cả các môn' : subj}
                  </button>
                ))}
              </div>

              <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                <HiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm tên khóa học, thầy cô..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px', width: '100%', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Premium Store List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <HiAcademicCap style={{ color: 'var(--accent-orange)', fontSize: '20px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>Kho khóa học Premium khuyên học ({lockedCourses.length})</h3>
            </div>

            {lockedCourses.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {lockedCourses.map(c => (
                  <div 
                    key={c.id} 
                    className="card landing-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      position: 'relative',
                      padding: 0,
                      height: '100%'
                    }}
                  >
                    <div 
                      onClick={() => onSelectCourse(c)}
                      style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${getCourseImage(c)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        height: '140px',
                        padding: '16px',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)', width: 'fit-content', padding: '4px 10px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {c.subject}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', textShadow: '0 2px 6px rgba(0,0,0,0.4)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{c.title}</h4>
                    </div>

                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Giảng dạy bởi: <strong>{c.teacherName}</strong></p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Số lượng bài giảng: {c.lessons?.length || 0} bài học cao cấp THPTQG</p>
                        
                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><HiStar style={{ color: '#f1c40f' }} /> {c.rating} (Đánh giá cao)</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><HiUsers /> {c.students} học viên</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through', display: 'block' }}>799.000đ</span>
                          <span style={{ fontSize: '17px', color: 'var(--accent-orange)', fontWeight: '800' }}>{c.price}đ</span>
                        </div>
                        
                        <button className="btn-primary" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #e17055, #fab1a0)', border: 'none', fontSize: '12px' }} onClick={() => onCheckoutCourse(c)}>
                          Mua khóa học
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Không có khóa học Premium nào khác phù hợp với bộ lọc tìm kiếm.</p>
              </div>
            )}
          </div>

          {/* SePay secured guideline */}
          <div 
            className="card animate-in" 
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                HƯỚNG DẪN THANH TOÁN & ĐĂNG KÝ HỌC PHÍ (SEPAY SECURED)
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px' }}>
                  1. Thông tin Tài khoản Ngân hàng
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ngân hàng:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>ACB (Ngân hàng Á Châu)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Số tài khoản:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>18657431</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Chủ tài khoản:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>THUAN VAN TRAN</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '4px', borderTop: '1px dashed var(--border)', paddingTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Cú pháp chuyển khoản:</span>
                      <strong style={{ color: 'var(--accent-red)' }}>EP{currentUser?.id || '101'}C[Mã_Khóa_Học]</strong>
                    </div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                      <em>Ví dụ:</em> Nếu mua khóa học mã số <strong>2</strong>, em ghi nội dung chuyển khoản là: <strong style={{ color: 'var(--text-primary)' }}>EP{currentUser?.id || '101'}C2</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-orange)', marginBottom: '10px' }}>
                  2. Quy trình Kích hoạt Tự động
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'var(--primary-bg)', color: 'var(--primary)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                    <span>Học sinh nhấn nút <strong>"Mua khóa học"</strong> để lấy mã QR tự động.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'var(--primary-bg)', color: 'var(--primary)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                    <span>Quét QR chuyển khoản qua ngân hàng (chờ Cổng SePay kiểm tra sao kê).</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'var(--primary-bg)', color: 'var(--primary)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</span>
                    <span>Hệ thống tự động kích hoạt quyền sở hữu khóa học ngay sau 3 - 5 giây.</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-green)', marginBottom: '10px' }}>
                  3. Cam kết An toàn & Hỗ trợ
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  🛡️ **Bảo mật giao dịch:** Mọi khoản thanh toán đều được mã hóa và đối soát hai chiều tự động qua cổng SePay.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '10px', margin: 0 }}>
                  📞 **Hỗ trợ khẩn cấp:** Nếu giao dịch gặp sự cố hoặc kích hoạt chậm, vui lòng liên hệ Zalo Hotline: **0901 234 567** để thầy cô hỗ trợ ngay lập tức.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
