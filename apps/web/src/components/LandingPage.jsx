import { useState, useEffect } from 'react';
import { HiArrowRight, HiCheck, HiStar, HiLightningBolt, HiMenuAlt3, HiX } from 'react-icons/hi';
import FooterSunMascot from './FooterSunMascot';

const SUBJECTS = [
  {
    id: 'toan',
    label: 'Toán Học',
    desc: 'Đại số, Hình học, Giải tích và các dạng bài thi THPTQG',
    count: '120+ đề',
    bg: '#4F46E5',
    emoji: '🦉',
    combos: ['A01', 'B00', 'D01'],
  },
  {
    id: 'ly',
    label: 'Vật Lý',
    desc: 'Dao động, Sóng, Điện từ — bám sát cấu trúc đề thi mới',
    count: '100+ đề',
    bg: '#F97316',
    emoji: '🦊',
    combos: ['A01'],
  },
  {
    id: 'anh',
    label: 'Tiếng Anh',
    desc: 'Ngữ pháp, Đọc hiểu, Từ vựng trọng tâm THPTQG 2026',
    count: '100+ đề',
    bg: '#10B981',
    emoji: '🐸',
    combos: ['A01', 'D01'],
  },
  {
    id: 'hoa',
    label: 'Hóa Học',
    desc: 'Hữu cơ, Vô cơ, Bài toán tính toán hóa học nâng cao',
    count: '90+ đề',
    bg: '#EF4444',
    emoji: '🐙',
    combos: ['B00'],
  },
  {
    id: 'sinh',
    label: 'Sinh Học',
    desc: 'Di truyền, Tiến hóa, Sinh thái — ôn thi khối B chuyên sâu',
    count: '80+ đề',
    bg: '#8B5CF6',
    emoji: '🐢',
    combos: ['B00'],
    isFree: true,
  },
  {
    id: 'van',
    label: 'Ngữ Văn',
    desc: 'Nghị luận, Đọc hiểu, Phân tích tác phẩm văn học 12',
    count: '70+ đề',
    bg: '#F59E0B',
    emoji: '🦋',
    combos: ['D01'],
  },
];

const STATS = [
  { icon: '🏆', value: '5 năm', label: 'hoạt động' },
  { icon: '👨‍🏫', value: '100%', label: 'giáo viên 8.0+ điểm' },
  { icon: '👩‍🎓', value: '42,500+', label: 'học sinh đã đồng hành' },
  { icon: '🎯', value: '90%', label: 'đạt mục tiêu điểm' },
];

const FEATURES = [
  { icon: '🔍', title: 'Chẩn đoán lỗ hổng tức thì', desc: 'AI phân tích kết quả và chỉ ra đúng kiến thức bạn đang yếu sau mỗi bài làm.' },
  { icon: '🗺️', title: 'Lộ trình học cá nhân hóa', desc: 'Không học dàn trải. Bản đồ học tập tự cập nhật theo điểm yếu của bạn mỗi ngày.' },
  { icon: '📝', title: 'Sinh đề sửa sai chuyên biệt', desc: 'AI tạo bộ câu hỏi tập trung đúng dạng bài bạn sai để luyện tập khắc phục ngay.' },
  { icon: '📊', title: 'Theo dõi tiến độ trực quan', desc: 'Biểu đồ điểm số theo tuần, streak học tập, dự đoán điểm THPTQG theo phong độ thực tế.' },
];

const getSpikePath = () => {
  const points = [];
  const numSpikes = 36;
  const cx = 300;
  const cy = 300;
  const rMin = 210;
  const rMax = 238;
  for (let i = 0; i < numSpikes; i++) {
    const angle1 = (i * 2 * Math.PI) / numSpikes;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / numSpikes;
    points.push(`${(cx + rMax * Math.cos(angle1)).toFixed(1)},${(cy + rMax * Math.sin(angle1)).toFixed(1)}`);
    points.push(`${(cx + rMin * Math.cos(angle2)).toFixed(1)},${(cy + rMin * Math.sin(angle2)).toFixed(1)}`);
  }
  return `M ${points.join(' L ')} Z`;
};
const spikePath = getSpikePath();

export default function LandingPage({ onNavigateToAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="lp-root">

      {/* ── NAVBAR ── */}
      <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav__inner">
          <div className="lp-nav__logo">
            <div className="lp-logo-box">E</div>
            <span>EduPath <em>AI</em></span>
          </div>

          <div className="lp-nav__links">
            <a href="#subjects">Môn học</a>
            <a href="#features">Tính năng</a>
            <a href="#stats">Về chúng tôi</a>
            <a href="#pricing">Học phí</a>
          </div>

          <div className="lp-nav__cta">
            <button className="lp-btn lp-btn--ghost" onClick={() => onNavigateToAuth('login')}>Đăng nhập</button>
            <button className="lp-btn lp-btn--accent" onClick={() => onNavigateToAuth('signup')}>Đăng ký miễn phí</button>
          </div>

          <button className="lp-nav__hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            <a href="#subjects" onClick={() => setMobileMenuOpen(false)}>Môn học</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)}>Về chúng tôi</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Học phí</a>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="lp-btn lp-btn--ghost" style={{ flex: 1 }} onClick={() => { onNavigateToAuth('login'); setMobileMenuOpen(false); }}>Đăng nhập</button>
              <button className="lp-btn lp-btn--accent" style={{ flex: 1 }} onClick={() => { onNavigateToAuth('signup'); setMobileMenuOpen(false); }}>Đăng ký</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero__left">
          <div className="lp-hero__title-row">
            <h2 className="lp-hero__title-main">Nền tảng</h2>
            <span className="lp-hero__title-badge">EduPath AI</span>
          </div>

          <div className="lp-hero__highlight-box">
            Luyện thi THPTQG
            <span className="lp-hero__cursor">|</span>
          </div>

          <p className="lp-hero__sub">
            Đầy đủ tài liệu, bài luyện, phương pháp và từ vựng giúp bạn chinh phục kỳ thi THPTQG dễ dàng hơn mỗi ngày.
          </p>

          <div className="lp-hero__follow-pill">
            <span className="lp-hero__follow-text">Follow us on</span>
            <button className="lp-hero__social-btn lp-hero__social-btn--fb" title="Facebook">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg>
            </button>
            <button className="lp-hero__social-btn lp-hero__social-btn--tt" title="TikTok">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.07c8.89,0,17.44,1,25.74,2.9V273.7a81.24,81.24,0,1,0-45.74,75.68V209.91c0-43.1,34.9-78,78-78a77.34,77.34,0,0,1,47,15.82V0h81.38a206.52,206.52,0,0,0,76.57,69.57v81.38a211,211,0,0,1-76.57-21Z"></path></svg>
            </button>
          </div>

          <div className="lp-hero__actions">
            <button className="lp-hero__btn-white" onClick={() => onNavigateToAuth('signup')}>
              Bài viết của EduPath
              <HiArrowRight />
            </button>
            <button className="lp-hero__btn-explore" onClick={() => document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' })}>
              <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
              Khám phá tài liệu miễn phí
            </button>
          </div>
        </div>

        <div className="lp-hero__right">
          <FooterSunMascot />
        </div>
      </section>

      {/* Wavy divider */}
      <div className="lp-wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff"/>
        </svg>
      </div>

      {/* ── SUBJECT CARDS ── */}
      <section id="subjects" className="lp-subjects">
        <div className="lp-container">
          <div className="lp-section-header lp-section-header--light">
            <span className="lp-eyebrow lp-eyebrow--dark">Danh mục môn học</span>
            <h2>Chinh phục từng môn theo từng khối thi</h2>
            <p>Giáo trình được thiết kế riêng biệt cho A01, B00 và D01 — bám sát cấu trúc đề thi THPTQG mới nhất.</p>
          </div>

          <div className="lp-cards-row">
            {SUBJECTS.map((s) => (
              <div key={s.id} className="lp-subject-card" style={{ '--card-bg': s.bg }}>
                {s.isFree && <span className="lp-card-free-badge">FREE</span>}
                <div className="lp-card-emoji">{s.emoji}</div>
                <div className="lp-card-info">
                  <h3>{s.label}</h3>
                  <p>{s.desc}</p>
                </div>
                <div className="lp-card-footer">
                  <span className="lp-card-count">{s.count}</span>
                  <div className="lp-card-combos">
                    {s.combos.map(c => <span key={c} className="lp-card-combo-tag">{c}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => onNavigateToAuth('signup')}>
              Xem toàn bộ tài liệu <HiArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="lp-stats-section">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-item">
                <span className="lp-stat-icon">{s.icon}</span>
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="lp-stats-tagline">
            <p>Giúp bạn đạt được mục tiêu hiệu quả qua ứng dụng công nghệ và nghiên cứu khoa học vào giảng dạy</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-features-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-eyebrow">Tại sao chọn EduPath AI?</span>
            <h2>Học thông minh hơn, không chỉ học nhiều hơn</h2>
          </div>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-pricing-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-eyebrow">Học phí minh bạch</span>
            <h2>Bắt đầu miễn phí, nâng cấp khi sẵn sàng</h2>
          </div>

          <div className="lp-pricing-row">
            <div className="lp-price-card">
              <div className="lp-price-tier">GÓI CƠ BẢN</div>
              <div className="lp-price-amount">0đ<span>/mãi mãi</span></div>
              <ul className="lp-price-features">
                <li><HiCheck /> Làm 5 đề thi thử mẫu</li>
                <li><HiCheck /> Xem 2 bài giảng đầu mỗi khóa</li>
                <li><HiCheck /> Tải slide tóm tắt công thức</li>
              </ul>
              <button className="lp-btn lp-btn--outline lp-btn--full" onClick={() => onNavigateToAuth('signup')}>
                Đăng ký miễn phí
              </button>
            </div>

            <div className="lp-price-card lp-price-card--featured">
              <div className="lp-price-badge">Bán chạy nhất ⚡</div>
              <div className="lp-price-tier">PREMIUM PRO</div>
              <div className="lp-price-amount">599.000đ<span>/trọn đời</span></div>
              <ul className="lp-price-features">
                <li><HiCheck /> <strong>Mở khóa toàn bộ</strong> video & đề thi</li>
                <li><HiCheck /> <strong>AI phân tích</strong> lỗ hổng tức thì</li>
                <li><HiCheck /> Lộ trình <strong>cá nhân hóa</strong> tự động</li>
                <li><HiCheck /> <strong>EduBot AI</strong> hỏi đáp không giới hạn</li>
                <li><HiCheck /> Hỗ trợ trực tiếp <strong>giáo viên bộ môn</strong></li>
              </ul>
              <button className="lp-btn lp-btn--accent lp-btn--full" onClick={() => onNavigateToAuth('signup')}>
                Nâng cấp Premium Pro <HiLightningBolt />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner">
        <div className="lp-container lp-cta-inner">
          <div className="lp-cta-mascot">🎓</div>
          <div>
            <h2>Sẵn sàng chinh phục THPTQG?</h2>
            <p>Tham gia cùng 42,500+ học sinh đang học mỗi ngày với EduPath AI.</p>
          </div>
          <button className="lp-btn lp-btn--white lp-btn--lg" onClick={() => onNavigateToAuth('signup')}>
            Bắt đầu ngay hôm nay <HiArrowRight />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div className="lp-logo-box" style={{ width: 36, height: 36, fontSize: 18 }}>E</div>
                <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>EduPath AI</span>
              </div>
              <p>Nền tảng luyện thi THPTQG thích ứng AI — học thông minh, đạt điểm cao.</p>
            </div>
            <div className="lp-footer__col">
              <h4>Môn học</h4>
              <a href="#">Toán Học</a>
              <a href="#">Vật Lý</a>
              <a href="#">Tiếng Anh</a>
              <a href="#">Hóa Học</a>
            </div>
            <div className="lp-footer__col">
              <h4>Sản phẩm</h4>
              <a href="#features">Tính năng</a>
              <a href="#pricing">Học phí</a>
              <a href="#stats">Về chúng tôi</a>
            </div>
            <div className="lp-footer__col">
              <h4>Hỗ trợ</h4>
              <a href="#">Trung tâm trợ giúp</a>
              <a href="#">Liên hệ</a>
              <a href="#">Chính sách bảo mật</a>
            </div>
          </div>
          <div className="lp-footer__bottom">
            <span>© 2026 EduPath AI. Bản quyền thuộc về EduPath.</span>
            <span>Nhóm SWP391 NHOM1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
