import { useState } from 'react';
import { HiPlay, HiDocumentDownload, HiStar, HiArrowLeft, HiArrowDown } from 'react-icons/hi';

export default function CourseDetails({ course, onBack, addLog }) {
  const [activeLesson, setActiveLesson] = useState(course.lessons[0] || null);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'slides' or 'reviews'
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [reviews, setReviews] = useState([
    { author: 'Trần Văn Nam', rate: 5, text: 'Bài giảng siêu dễ hiểu, hình minh họa trực quan!', date: '3 ngày trước' },
    { author: 'Lê Thu Trang', rate: 4, text: 'Lý thuyết cơ bản vững, rất thích hợp cho ôn thi THPTQG.', date: '1 tuần trước' }
  ]);

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newReview = {
      author: 'Nguyễn Minh Anh',
      rate: rating,
      text: commentText,
      date: 'Vừa xong'
    };
    setReviews([newReview, ...reviews]);
    setCommentText('');
    addLog(`Học viên đánh giá khóa học "${course.title}" mức ${rating} sao`, 'sys');
  };

  const handleDownloadDoc = (docName) => {
    addLog(`Học viên tải xuống tài liệu bài học: "${docName}"`, 'sys');
    // Simulate web download behavior
    alert(`Đã tải xuống tài liệu: ${docName}`);
  };

  return (
    <div className="card animate-in" style={{ padding: '24px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', color: 'var(--primary)',
          fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px'
        }}
      >
        <HiArrowLeft /> Quay lại danh sách khóa học
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontWeight: 'bold' }}>
            {course.subject}
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '6px' }}>{course.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Giáo viên: {course.teacherName}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
        {/* Main Content Area */}
        <div>
          {activeLesson ? (
            <div>
              {/* Media Tabs */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <button
                  className={`btn-outline ${activeTab === 'video' ? 'active' : ''}`}
                  onClick={() => setActiveTab('video')}
                  style={{
                    padding: '6px 14px', fontSize: '12px', border: 'none',
                    borderBottom: activeTab === 'video' ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'none', borderRadius: 0, fontWeight: 700
                  }}
                >
                  📺 Video bài giảng
                </button>
                <button
                  className={`btn-outline ${activeTab === 'slides' ? 'active' : ''}`}
                  onClick={() => setActiveTab('slides')}
                  style={{
                    padding: '6px 14px', fontSize: '12px', border: 'none',
                    borderBottom: activeTab === 'slides' ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'none', borderRadius: 0, fontWeight: 700
                  }}
                >
                  📝 Slide & Tài liệu
                </button>
                <button
                  className={`btn-outline ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                  style={{
                    padding: '6px 14px', fontSize: '12px', border: 'none',
                    borderBottom: activeTab === 'reviews' ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'none', borderRadius: 0, fontWeight: 700
                  }}
                >
                  ⭐ Đánh giá ({reviews.length})
                </button>
              </div>

              {activeTab === 'video' && (
                <div>
                  {/* Visual Mock Video Player */}
                  <div
                    style={{
                      width: '100%', height: '320px', background: '#000',
                      borderRadius: 'var(--radius-md)', position: 'relative',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                      color: '#fff', overflow: 'hidden'
                    }}
                  >
                    <div style={{ fontSize: '48px', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
                      <HiPlay />
                    </div>
                    <div style={{ fontSize: '13px', zIndex: 10, marginTop: '8px', color: '#B2BEC3' }}>
                      [Đang phát: {activeLesson.name}]
                    </div>

                    {/* Bottom controller mock */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', cursor: 'pointer' }}>▶</span>
                        <span style={{ fontSize: '11px', color: '#B2BEC3' }}>04:15 / {activeLesson.duration}</span>
                      </div>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', margin: '0 16px', position: 'relative', borderRadius: '2px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#fff' }}>1080p ⚙</div>
                    </div>
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '16px' }}>Mô tả bài học</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Bài giảng này giúp học sinh nắm vững các lý thuyết cốt lõi phục vụ ôn tập kỳ thi tốt nghiệp THPTQG. Cung cấp các mẹo bấm máy tính Casio giải nhanh và bài tập vận dụng.
                  </p>
                </div>
              )}

              {activeTab === 'slides' && (
                <div>
                  <div style={{ border: '1px dashed var(--border)', padding: '30px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--bg-main)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Tài liệu đính kèm bài học</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                      <button
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', padding: '8px 14px' }}
                        onClick={() => handleDownloadDoc(`Slide_BaiGiang_${activeLesson.name.replace(/\s+/g, '_')}.pdf`)}
                      >
                        <HiDocumentDownload /> Tải Slide bài học (.pdf)
                      </button>
                      <button
                        className="btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', padding: '8px 14px' }}
                        onClick={() => handleDownloadDoc(`BaiTapTuLuyen_${activeLesson.name.replace(/\s+/g, '_')}.docx`)}
                      >
                        <HiDocumentDownload /> Tải Bài tự luyện (.docx)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {/* Add feedback rating form */}
                  <form onSubmit={handleAddReview} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Gửi đánh giá của bạn</p>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', fontSize: '18px', color: '#FFD700' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer' }}>
                          {rating >= star ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Hãy để lại ý kiến phản hồi về bài học..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)', outline: 'none', fontSize: '13px',
                          background: 'var(--bg-main)', color: 'var(--text-primary)'
                        }}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                        Gửi phản hồi
                      </button>
                    </div>
                  </form>

                  {/* Reviews List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map((rev, i) => (
                      <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{rev.author}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rev.date}</span>
                        </div>
                        <div style={{ color: '#FFD700', fontSize: '11px', margin: '2px 0' }}>
                          {'★'.repeat(rev.rate)}{'☆'.repeat(5 - rev.rate)}
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{rev.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chưa có nội dung bài học.</p>
          )}
        </div>

        {/* Sidebar Lessons List */}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>DANH SÁCH BÀI HỌC</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {course.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setActiveLesson(lesson);
                  setActiveTab('video');
                }}
                style={{
                  display: 'block', width: '100%', padding: '10px',
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  background: activeLesson?.id === lesson.id ? 'var(--primary-bg)' : 'var(--bg-main)',
                  color: activeLesson?.id === lesson.id ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: activeLesson?.id === lesson.id ? 700 : 500,
                  fontSize: '12px', textAlign: 'left', cursor: 'pointer',
                  borderLeft: activeLesson?.id === lesson.id ? '3px solid var(--primary)' : '3px solid transparent'
                }}
              >
                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{lesson.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>⏱ {lesson.duration}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
