import { HiSparkles, HiTrendingUp, HiAcademicCap, HiCheck, HiLockClosed } from 'react-icons/hi';

export default function AISystemCenter({ submissions, addLog }) {
  // Compute weak points based on submissions
  const getWeaknesses = () => {
    if (!submissions || submissions.length === 0) return ['Chưa có dữ liệu làm bài để phân tích.'];
    const weakList = [];
    submissions.forEach(sub => {
      if (sub.score < 8) {
        sub.failedTopics?.forEach(topic => {
          if (!weakList.includes(topic)) weakList.push(topic);
        });
      }
    });
    return weakList.length > 0 ? weakList : ['Không phát hiện điểm yếu rõ rệt. Phong độ rất ổn định!'];
  };

  const weaknesses = getWeaknesses();

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <HiSparkles style={{ fontSize: '24px', color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>HỆ THỐNG AI PHÂN TÍCH HỌC TẬP (AI ANALYTICS INTERFACE)</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Đây là bảng điều khiển kỹ thuật hiển thị các tác vụ nền đang được xử lý bởi **Hệ thống AI (Actor 6)**. Hệ thống tự động thu thập lịch sử bài làm để chẩn đoán điểm khuyết và tinh chỉnh lộ trình.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Diagnostics */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiTrendingUp style={{ color: 'var(--accent-orange)' }} /> UC-31: CHẨN ĐOÁN KỸ THUẬT & ĐIỂM YẾU KẾT CẤU
          </h3>
          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-red)', marginBottom: '8px' }}>
              Danh sách chuyên đề cần củng cố:
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {weaknesses.map((w, idx) => (
                <li key={idx} style={{ fontWeight: '500' }}>{w}</li>
              ))}
            </ul>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              🤖 <strong>AI Diagnosis Log:</strong> Lịch sử làm bài cho thấy học sinh dễ nhầm lẫn trong các công thức lượng giác và giải phương trình chứa tham số. Khuyến nghị tập trung luyện tập lại.
            </div>
          </div>
        </div>

        {/* Adaptive Roadmap Visualizer */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiAcademicCap style={{ color: 'var(--accent-blue)' }} /> UC-32 & UC-33: LỘ TRÌNH THÍCH ỨNG DỰA TRÊN NĂNG LỰC
          </h3>
          <div className="roadmap-flow">
            <div className="roadmap-item">
              <div className="roadmap-dot done">
                <HiCheck />
              </div>
              <div className="roadmap-card">
                <span className="badge-pill" style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--accent-green)', fontSize: '9px', fontWeight: 'bold' }}>HOÀN THÀNH</span>
                <h5 style={{ fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px' }}>Chương I: Sự đồng biến, nghịch biến của hàm số</h5>
                <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Điểm đánh giá: 9.0/10 • Hoàn thành ngày 24/05/2026</p>
              </div>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-dot active">
                ⚡
              </div>
              <div className="roadmap-card" style={{ borderColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '9px', fontWeight: 'bold' }}>ĐANG TRỌNG TÂM ÔN LUYỆN</span>
                <h5 style={{ fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px' }}>Chương II: Phương trình mũ & Lôgarit chứa tham số</h5>
                <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                  {weaknesses.includes('Phương trình mũ và lôgarit') ? 
                    '⚠️ Lộ trình điều chỉnh: AI tự động chèn thêm 2 bài tập phụ củng cố phần t đặt 3^x.' : 
                    'Lộ trình tiêu chuẩn: Hoàn thành 4/6 bài học ôn tập.'
                  }
                </p>
              </div>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-dot">
                <HiLockClosed />
              </div>
              <div className="roadmap-card">
                <span className="badge-pill" style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'bold' }}>CHƯA MỞ</span>
                <h5 style={{ fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-muted)' }}>Chương III: Tích phân & Ứng dụng hình học</h5>
                <p style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Sẽ kích hoạt sau khi hoàn thành Đánh giá Chương II đạt trên 7.0 điểm.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
