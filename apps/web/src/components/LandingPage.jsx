import { useState } from 'react';
import { HiSparkles, HiShieldCheck, HiArrowRight, HiCheck, HiAcademicCap, HiTerminal, HiOutlineDatabase, HiFire, HiTrendingUp } from 'react-icons/hi';

const comboData = {
  a01: {
    name: 'Khối A01 (Toán – Vật lý – Tiếng Anh)',
    colorClass: 'a01',
    desc: 'Lộ trình tối ưu cho học sinh đăng ký các ngành Khoa học Máy tính, Kỹ thuật Công nghệ, và Kinh tế Quốc tế.',
    subjects: [
      { name: 'Toán học', topics: ['Khảo sát hàm số nâng cao', 'Tích phân & Ứng dụng', 'Hình học Oxyz', 'Tổ hợp & Xác suất'] },
      { name: 'Vật lý', topics: ['Dao động cơ học', 'Sóng cơ & Sóng âm', 'Dòng điện xoay chiều', 'Dao động điện từ'] },
      { name: 'Tiếng Anh', topics: ['Trọng âm & Ngữ âm', 'Hệ thống 12 Thì & Bị động', 'Mệnh đề quan hệ', 'Đọc hiểu & Điền từ THPTQG'] }
    ]
  },
  b00: {
    name: 'Khối B00 (Toán – Hóa học – Sinh học)',
    colorClass: 'b00',
    desc: 'Dành riêng cho các chiến binh chinh phục khối ngành Y Đa Khoa, Răng Hàm Mặt, Dược học, và Công nghệ Sinh học.',
    subjects: [
      { name: 'Toán học', topics: ['Khảo sát hàm số', 'Số phức', 'Thể tích đa diện', 'Xác suất ứng dụng'] },
      { name: 'Hóa học', topics: ['Este - Lipit hữu cơ 12', 'Cacbohiđrat & Amin', 'Kim loại kiềm, kiềm thổ', 'Bài toán đồ thị vô cơ'] },
      { name: 'Sinh học', topics: ['Cơ chế di truyền & Biến dị', 'Tính quy luật của hiện tượng di truyền', 'Di truyền học quần thể', 'Tiến hóa & Sinh thái học'] }
    ]
  },
  d01: {
    name: 'Khối D01 (Toán – Ngữ văn – Tiếng Anh)',
    colorClass: 'd01',
    desc: 'Thiết lập cho nhóm ngành Luật, Truyền thông Đa phương tiện, Quản trị Kinh doanh, và Ngôn ngữ Ngoại giao.',
    subjects: [
      { name: 'Toán học', topics: ['Khảo sát hàm số', 'Mũ & Lôgarit cơ bản', 'Tổ hợp xác suất', 'Hình học không gian'] },
      { name: 'Ngữ văn', topics: ['Nghị luận xã hội 200 chữ', 'Nghị luận văn học trọng tâm', 'Tác phẩm: Vợ chồng A Phủ, Đất Nước, Người lái đò sông Đà'] },
      { name: 'Tiếng Anh', topics: ['Ngữ pháp cơ bản đến nâng cao', 'Cụm từ cố định & Thành ngữ', 'Kỹ năng làm bài đọc hiểu', 'Sửa lỗi sai & Câu đồng nghĩa'] }
    ]
  }
};

export default function LandingPage({ onNavigateToAuth, onNavigateToTeacherSignup }) {
  const [template, setTemplate] = useState(1); // 1: Classic Premium, 2: Cyber Space AI
  const [activeCombo, setActiveCombo] = useState('a01');

  // Interactive AI Roadmap sandbox in Mẫu 2
  const [sandboxTopic, setSandboxTopic] = useState('Khảo sát hàm số');
  const [sandboxOutput, setSandboxOutput] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleSimulateAI = () => {
    setAnalyzing(true);
    setSandboxOutput(null);
    setTimeout(() => {
      setAnalyzing(false);
      setSandboxOutput({
        week1: "Tuần 1: Ôn lại bảng Đạo hàm và 15 câu trắc nghiệm Cực trị hàm số.",
        week2: "Tuần 2: Ứng dụng Casio giải nhanh bài toán chứa tham số m.",
        advice: "🤖 Khuyên dùng: Dành 45 phút mỗi ngày làm quen với các dạng đề thi khảo sát."
      });
    }, 1200);
  };

  const currentCombo = comboData[activeCombo];

  return (
    <div className="animate-in" style={{ padding: '20px 0', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Template Switcher Capsule */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'flex', gap: '4px', background: 'var(--bg-card)',
          border: '1px solid var(--border)', padding: '4px',
          borderRadius: '30px', boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            onClick={() => setTemplate(1)}
            style={{
              padding: '8px 18px', borderRadius: '24px', border: 'none',
              background: template === 1 ? 'var(--primary)' : 'transparent',
              color: template === 1 ? '#fff' : 'var(--text-primary)',
              fontWeight: 'bold', fontSize: '11px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Mẫu 1: Classic Premium (Lộ trình chuẩn)
          </button>
          <button
            onClick={() => setTemplate(2)}
            style={{
              padding: '8px 18px', borderRadius: '24px', border: 'none',
              background: template === 2 ? 'var(--primary)' : 'transparent',
              color: template === 2 ? '#fff' : 'var(--text-primary)',
              fontWeight: 'bold', fontSize: '11px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Mẫu 2: Cyber Space (AI Tương Tác)
          </button>
        </div>
      </div>

      {/* Dynamic Landing Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #6C5CE7, #FD79A8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 900 }}>E</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EduPath AI</h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '-2px' }}>Adaptive Learning Platform</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-outline" onClick={onNavigateToTeacherSignup} style={{ fontSize: '12.5px', padding: '8px 16px' }}>Đăng ký Giáo viên</button>
          <button className="btn-primary" onClick={() => onNavigateToAuth('login')} style={{ fontSize: '12.5px', padding: '8px 18px' }}>Đăng nhập</button>
        </div>
      </div>

      {/* ================= TEMPLATE 1: CLASSIC PREMIUM ================= */}
      {template === 1 && (
        <div className="animate-in">
          {/* Hero Section */}
          <div className="landing-hero animate-in" style={{ margin: '0 20px 40px 20px' }}>
            <div className="landing-badge-combo">
              <span className="combo-pill a01">Toán - Lý - Anh</span>
              <span className="combo-pill b00">Toán - Hóa - Sinh</span>
              <span className="combo-pill d01">Toán - Văn - Anh</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', lineHeight: 1.25 }}>
              Nền Tảng Luyện Thi THPTQG Thích Ứng Cá Nhân Hóa AI
            </h1>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '650px', margin: '12px auto 28px auto' }}>
              Đột phá điểm số kỳ thi Tốt nghiệp THPTQG. Trợ lý AI tự động dò tìm lỗ hổng kiến thức qua bài làm, xây dựng lộ trình chuyên biệt (Adaptive Roadmap) và sinh đề khắc phục tức thì.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '13.5px' }} onClick={() => onNavigateToAuth('signup')}>
                Bắt đầu học thử miễn phí <HiArrowRight style={{ marginLeft: 6, verticalAlign: 'middle' }} />
              </button>
              <button className="btn-outline" style={{ padding: '12px 28px', fontSize: '13.5px' }} onClick={() => {
                document.getElementById('combos-section').scrollIntoView({ behavior: 'smooth' });
              }}>
                Khám phá khối thi
              </button>
            </div>
          </div>

          {/* Core Features Grid */}
          <div style={{ padding: '0 20px 40px 20px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>HỆ THỐNG HỌC TẬP THÍCH ỨNG KHÁC BIỆT THẾ NÀO?</h2>
            <div className="landing-grid">
              <div className="landing-card">
                <div className="landing-card-icon" style={{ background: 'rgba(108,92,231,0.1)' }}><HiSparkles /></div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '8px' }}>Chẩn Đoán Lỗ Hổng Kiến Thức Tự Động</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Sau mỗi đề khảo sát, AI phân tích từng phương án sai để chẩn đoán chính xác bạn hổng định lý hay công thức nào.
                </p>
              </div>

              <div className="landing-card">
                <div className="landing-card-icon" style={{ background: 'rgba(9,132,227,0.1)', color: 'var(--accent-blue)' }}><HiAcademicCap /></div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '8px' }}>Điều Chỉnh Lộ Trình Học Thích Ứng</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Không còn học dàn trải. Bản đồ học tập tự động sắp xếp lại, chèn các bài học bổ trợ giúp tối ưu thời gian ôn luyện.
                </p>
              </div>

              <div className="landing-card">
                <div className="landing-card-icon" style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--accent-green)' }}><HiShieldCheck /></div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '8px' }}>Tự Động Sinh Đề Sửa Sai Chuyên Biệt</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  AI trích xuất ngân hàng câu hỏi, tạo đề thi mini tương tự lỗi sai giúp bạn thực hành khắc phục hổng kiến thức ngay.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TEMPLATE 2: CYBER SPACE AI INTERACTIVE ================= */}
      {template === 2 && (
        <div className="animate-in" style={{ padding: '0 20px' }}>
          {/* Cyber Hero Title */}
          <div style={{
            background: 'linear-gradient(135deg, #121824 0%, #080B11 100%)',
            border: '1px solid rgba(108,92,231,0.3)', borderRadius: 'var(--radius-xl)',
            padding: '48px 30px', textAlign: 'center', marginBottom: '40px',
            boxShadow: '0 10px 40px rgba(108,92,231,0.15)'
          }}>
            <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary-light)', border: '1px solid var(--primary)', marginBottom: '14px' }}>
              🤖 KHÔNG GIAN HỌC TẬP AI THẾ HỆ MỚI
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: '1.3' }}>
              ỨNG DỤNG TRÍ TUỆ NHÂN TẠO KHẮC PHỤC LỖ HỔNG LẬP TỨC
            </h1>
            <p style={{ fontSize: '13.5px', color: '#A0AEC0', maxWidth: '600px', margin: '12px auto 24px auto' }}>
              Trải nghiệm bảng điều khiển kỹ thuật ảo. Dùng thử công cụ chẩn đoán AI của EduPath trực tiếp bên dưới trước khi đăng nhập!
            </p>

            {/* Sandbox AI Simulator Component */}
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left', background: '#0F131A', borderColor: '#1A2332', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #1A2332', paddingBottom: '8px' }}>
                <HiTerminal style={{ color: '#4AF626' }} />
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#8892B0' }}>CONSOLE: MÔ PHỎNG PHÂN TÍCH THÍCH ỨNG</span>
              </div>
              <p style={{ fontSize: '12px', color: '#fff', marginBottom: '8px' }}>Nhập nội dung chuyên đề thi bạn muốn kiểm tra:</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ flex: 1, background: '#161F2E', borderColor: '#2D3748', color: '#fff', fontSize: '12.5px' }}
                  value={sandboxTopic}
                  onChange={e => setSandboxTopic(e.target.value)}
                />
                <button
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '6px 16px' }}
                  onClick={handleSimulateAI}
                  disabled={analyzing}
                >
                  {analyzing ? 'AI Đang Quét...' : 'Kích Hoạt AI'}
                </button>
              </div>

              {sandboxOutput && (
                <div className="admin-terminal animate-in" style={{ height: 'auto', maxHeight: '160px', background: '#0A0D14', border: '1px solid #111A24', padding: '12px' }}>
                  <div style={{ color: '#4AF626', fontSize: '11.5px', marginBottom: '4px' }}>[AI Log] Phân tích lỗ hổng cho chuyên đề: "{sandboxTopic}"...</div>
                  <div style={{ color: '#00BFFF', fontSize: '11.5px', margin: '4px 0' }}>{sandboxOutput.week1}</div>
                  <div style={{ color: '#00BFFF', fontSize: '11.5px', margin: '4px 0' }}>{sandboxOutput.week2}</div>
                  <div style={{ color: '#FF007F', fontSize: '11.5px', marginTop: '6px', fontWeight: 'bold' }}>{sandboxOutput.advice}</div>
                </div>
              )}
            </div>
          </div>

          {/* SaaS Core metrics lists */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)' }}>99.98%</span>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px' }}>Độ nhạy AI chẩn đoán</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Nhận diện chính xác lỗ hổng trong 2 giây</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-green)' }}>42,500+</span>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px' }}>Học sinh đang ôn luyện</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Chinh phục mục tiêu đại học 27+ điểm</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent-orange)' }}>98.4%</span>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px' }}>Đạt mục tiêu điểm số</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Vượt trội so với ôn luyện đề truyền thống</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMMON SECTIONS (COMBOS & PRICING) ================= */}
      {/* Combos Details tab section */}
      <div id="combos-section" style={{ padding: '40px 20px', background: 'var(--bg-main)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>CHƯƠNG TRÌNH ĐÀO TẠO TẬP TRUNG CHUẨN THPTQG</h2>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
          Tối ưu hóa sâu sắc cho 3 khối thi trọng điểm nhất nước: A01, B00, và D01.
        </p>

        <div className="combo-selector-bar">
          <button className={`combo-select-tab ${activeCombo === 'a01' ? 'active' : ''}`} onClick={() => setActiveCombo('a01')}>A01 (Toán-Lý-Anh)</button>
          <button className={`combo-select-tab ${activeCombo === 'b00' ? 'active' : ''}`} onClick={() => setActiveCombo('b00')}>B00 (Toán-Hóa-Sinh)</button>
          <button className={`combo-select-tab ${activeCombo === 'd01' ? 'active' : ''}`} onClick={() => setActiveCombo('d01')}>D01 (Toán-Văn-Anh)</button>
        </div>

        <div className="card animate-in" style={{ padding: '28px', maxWidth: '800px', margin: '0 auto', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '6px' }}>{currentCombo.name}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{currentCombo.desc}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {currentCombo.subjects.map((sub, i) => (
              <div key={i} style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>{sub.name}</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '14px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  {sub.topics.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Packages */}
      <div style={{ padding: '40px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>CÁC GÓI THÀNH VIÊN ĐĂNG KÝ</h2>
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Lựa chọn gói đồng hành thích hợp nhất với hành trình chinh phục giảng đường đại học của bạn.
        </p>

        <div className="pricing-grid">
          {/* Free Package */}
          <div className="pricing-card">
            <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>GÓI CƠ BẢN</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Dành cho tự học khảo sát</p>
            <div className="pricing-price">0đ <span>/ tháng</span></div>
            <div className="pricing-features">
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> Làm bài thi thử mẫu</div>
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> Xem 2 video bài giảng đầu</div>
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> Xem slide tóm tắt công thức</div>
            </div>
            <button className="btn-outline" style={{ width: '100%' }} onClick={() => onNavigateToAuth('signup')}>Đăng ký ngay</button>
          </div>

          {/* Premium PRO Package */}
          <div className="pricing-card premium">
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>GÓI PREMIUM PRO</h4>
            <p style={{ fontSize: '11px', color: 'var(--primary-light)', marginTop: '4px' }}>Đồng hành bức phá điểm số 9+</p>
            <div className="pricing-price">599.000đ <span>/ trọn đời</span></div>
            <div className="pricing-features">
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> <strong>Mở khóa toàn bộ</strong> video và đề thi</div>
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> <strong>Trợ lý AI phân tích</strong> và cập nhật lộ trình thích ứng</div>
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> Hỏi đáp không giới hạn với chatbot <strong>EduBot</strong></div>
              <div><HiCheck style={{ color: 'var(--accent-green)', marginRight: 6 }} /> Hỗ trợ trao đổi học tập cùng giáo viên bộ môn</div>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => onNavigateToAuth('signup')}>Nâng cấp Premium Pro</button>
          </div>
        </div>
      </div>
    </div>
  );
}
