import React, { useState, useEffect } from 'react';
import { mockExamService } from '../services/mockExamService';
import { 
  HiClock, 
  HiClipboardList, 
  HiCheckCircle, 
  HiInformationCircle, 
  HiShieldCheck, 
  HiChevronRight,
  HiLightningBolt
} from 'react-icons/hi';
import { FaLock } from 'react-icons/fa';

export default function MockExamDetailPage({ examId, currentUser, onStartExam, navigateTo }) {
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState({
    network: false,
    quiet: false,
    honesty: false
  });

  const loadExamDetails = async () => {
    setLoading(true);
    try {
      const examData = await mockExamService.getMockExamById(examId);
      setExam(examData);

      if (currentUser) {
        const history = await mockExamService.getUserExamAttempts(currentUser.id, examId);
        setAttempts(history || []);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết đề thi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamDetails();
  }, [examId, currentUser]);

  const handleStartClick = () => {
    if (allAgreed) {
      onStartExam(examId);
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s} giây`;
  };

  const allAgreed = agreed.network && agreed.quiet && agreed.honesty;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '36px', animation: 'pulse 1.5s infinite alternate', color: 'var(--exams-purple)' }}>⏳</div>
        <p style={{ marginTop: '12px', fontSize: '14px', fontWeight: 'bold' }}>Đang cấu hình phòng thi thử trực tuyến...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '16px 0 8px 0', color: 'var(--text-primary)' }}>Không tìm thấy đề thi</h3>
        <button className="btn-primary" onClick={() => navigateTo('/mock-exams')} style={{ marginTop: '12px' }}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Map difficulty level
  const difficulty = exam.total_questions > 40 ? 'Khó (Phân loại)' : exam.total_questions > 20 ? 'Trung bình' : 'Dễ (Cơ bản)';
  const difficultyColor = exam.total_questions > 40 ? '#ef4444' : exam.total_questions > 20 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px', margin: '0 auto', padding: '0 16px' }} className="animate-in">
      {/* Back button */}
      <button 
        onClick={() => navigateTo('/mock-exams')}
        style={{
          border: 'none', background: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontWeight: '800', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content',
          padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--exams-purple)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        ← Quay lại danh mục đề thi
      </button>

      {/* Main Info Card */}
      <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge-pill" style={{ background: 'var(--exams-purple-bg)', color: 'var(--exams-purple)', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {exam.exam_subjects?.name || 'Đề ôn tập'}
          </span>
          <span style={{ fontSize: '12px', color: difficultyColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HiLightningBolt /> Độ khó: {difficulty}
          </span>
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: '950', color: 'var(--text-primary)', margin: '14px 0 8px 0', lineHeight: 1.3, fontFamily: "'Outfit', sans-serif" }}>
          {exam.title}
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          {exam.description || 'Đề thi trắc nghiệm chuẩn cấu trúc ma trận của Bộ Giáo dục & Đào tạo. Hãy thử thách để kiểm tra kiến thức của mình.'}
        </p>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', background: 'var(--bg-main)', padding: '24px', borderRadius: '16px', border: '1.5px solid var(--border)', marginBottom: '28px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px' }}>NĂM THI</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Năm {exam.year || '2026'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px' }}>MÃ ĐỀ THI</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Mã: {exam.exam_code || '101'}</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px' }}>THỜI GIAN LÀM BÀI</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><HiClock style={{ color: 'var(--exams-purple)' }} /> {exam.duration_minutes || 90} phút</strong>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px' }}>TỔNG CÂU HỎI</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}><HiClipboardList style={{ color: 'var(--exams-green)' }} /> {exam.total_questions || 50} câu</strong>
          </div>
        </div>

        {/* PDF Downloads block */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {exam.pdf_url && (
            <a 
              href={exam.pdf_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ padding: '10px 18px', fontSize: '12.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-primary)' }}
            >
              📥 Tải đề bài (PDF)
            </a>
          )}
          {exam.official_answer_key_url && (
            <a 
              href={exam.official_answer_key_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ padding: '10px 18px', fontSize: '12.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-primary)' }}
            >
              📥 Tải đáp án chi tiết (PDF)
            </a>
          )}
        </div>

        {/* Dynamic CBT Entrance Checklist */}
        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
          <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiShieldCheck style={{ color: 'var(--exams-purple)', fontSize: '20px' }} /> Xác nhận điều kiện dự thi (CBT Requirements)
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13.5px', color: '#475569' }}>
              <input 
                type="checkbox" 
                checked={agreed.network} 
                onChange={(e) => setAgreed(prev => ({ ...prev, network: e.target.checked }))}
                style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer', accentColor: 'var(--exams-purple)' }}
              />
              <div>
                <strong>Thiết bị & Kết nối ổn định</strong>: Máy tính/Điện thoại đã được kết nối nguồn điện/sạc đầy và kết nối mạng Wi-Fi/4G hoạt động tốt.
              </div>
            </label>

            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13.5px', color: '#475569' }}>
              <input 
                type="checkbox" 
                checked={agreed.quiet} 
                onChange={(e) => setAgreed(prev => ({ ...prev, quiet: e.target.checked }))}
                style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer', accentColor: 'var(--exams-purple)' }}
              />
              <div>
                <strong>Tập trung tối đa</strong>: Bạn đang ở trong phòng yên tĩnh, không bị phân tâm hay có người làm phiền trong suốt {exam.duration_minutes || 90} phút tới.
              </div>
            </label>

            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13.5px', color: '#475569' }}>
              <input 
                type="checkbox" 
                checked={agreed.honesty} 
                onChange={(e) => setAgreed(prev => ({ ...prev, honesty: e.target.checked }))}
                style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer', accentColor: 'var(--exams-purple)' }}
              />
              <div>
                <strong>Cam kết trung thực</strong>: Tự giác làm bài, không sao chép lời giải hoặc nhờ người khác hỗ trợ. Hệ thống có giám sát chuyển tab và thoát toàn màn hình.
              </div>
            </label>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleStartClick}
          disabled={!allAgreed}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '16px',
            background: allAgreed ? 'linear-gradient(135deg, #818cf8, #6366f1)' : '#cbd5e1',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '800',
            boxShadow: allAgreed ? '0 8px 24px rgba(99, 102, 241, 0.3)' : 'none',
            cursor: allAgreed ? 'pointer' : 'not-allowed',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.25s ease'
          }}
        >
          {allAgreed ? <HiChevronRight style={{ fontSize: '20px' }} /> : <FaLock style={{ fontSize: '13px' }} />}
          {allAgreed ? 'BẮT ĐẦU VÀO PHÒNG THI NGAY' : 'VUI LÒNG TÍCH ĐỒNG Ý CÁC ĐIỀU KIỆN TRÊN'}
        </button>
      </div>

      {/* Attempt History Section */}
      <div className="card" style={{ padding: '28px', border: '1.5px solid var(--border)', borderRadius: '20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Outfit', sans-serif" }}>
          📜 Lịch sử ôn luyện đề thi này của bạn
        </h3>

        {!currentUser ? (
          <div style={{ padding: '16px', background: 'rgba(243, 156, 18, 0.06)', borderRadius: '12px', fontSize: '13px', color: '#d97706', border: '1.5px solid rgba(243, 156, 18, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiInformationCircle style={{ fontSize: '18px' }} />
            <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để lưu trữ lịch sử thi thử và nhận phân tích học tập thông minh từ AI.</span>
          </div>
        ) : attempts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2.5px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  <th style={{ padding: '12px 14px' }}>Thời gian dự thi</th>
                  <th style={{ padding: '12px 14px' }}>Thời lượng làm bài</th>
                  <th style={{ padding: '12px 14px' }}>Số câu trả lời đúng</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Điểm số</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => {
                  const dateStr = new Date(att.submitted_at || att.started_at).toLocaleDateString('vi-VN', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                  });
                  return (
                    <tr key={att.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{dateStr}</td>
                      <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{formatDuration(att.duration_seconds || 0)}</td>
                      <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                        <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          {att.correct_count} câu đúng
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: '900', fontSize: '15px', color: att.score >= 8 ? 'var(--exams-green)' : (att.score >= 5 ? 'var(--exams-orange)' : 'var(--exams-red)') }}>
                        {att.score.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <button
                          className="btn-outline"
                          onClick={() => navigateTo(`/mock-exams/${examId}/result/${att.id}`)}
                          style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: '8px', fontWeight: 'bold' }}
                        >
                          Xem kết quả 🔎
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            📭 Bạn chưa thực hiện lượt thi thử nào cho đề thi này. Hãy bắt đầu câu hỏi đầu tiên!
          </div>
        )}
      </div>
    </div>
  );
}
