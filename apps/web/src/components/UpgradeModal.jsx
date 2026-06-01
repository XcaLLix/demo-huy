import { useState, useEffect } from 'react';
import { HiX, HiCheckCircle, HiStar, HiCheck, HiDuplicate, HiRefresh, HiSparkles, HiArrowRight, HiShieldCheck } from 'react-icons/hi';
import { API_BASE } from '../api';


export default function UpgradeModal({ onClose, onUpgradeSuccess, addLog }) {
  const [selectedPlan, setSelectedPlan] = useState(3); // Default to yearly plan (planId: 3)
  const [step, setStep] = useState(1); // 1: Choose Plan, 2: Transfer QR payment, 3: Success unlock
  const [seconds, setSeconds] = useState(300); // 5 minutes timeout
  const [copiedField, setCopiedField] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pollingError, setPollingError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
  const studentId = currentUser.id || 1;
  const transferCode = `UP${studentId}P${selectedPlan}`;

  const BANK_ID = 'ACB';
  const ACCOUNT_NO = '18657431';
  const ACCOUNT_NAME = 'THUAN VAN TRAN';

  // Pricing plans definition
  const plans = [
    {
      id: 1,
      name: 'PRO Monthly',
      duration: '1 Tháng',
      price: 199000,
      originalPrice: '299.000đ',
      discount: 'Tiết kiệm 33%',
      description: 'Phù hợp để trải nghiệm thử các công nghệ học tập của EduPath.',
      features: [
        'Lộ trình học tập AI thích ứng tự động',
        'Trợ lý ảo EduBot (100 câu hỏi/ngày)',
        'Thư viện 100+ tài liệu chuyên đề',
        'Xem video bài học chất lượng HD'
      ]
    },
    {
      id: 2,
      name: 'PRO 6-Month',
      duration: '6 Tháng',
      price: 499000,
      originalPrice: '1.199.000đ',
      discount: 'Tiết kiệm 58%',
      description: 'Lựa chọn phổ biến cho các bạn học sinh giai đoạn tăng tốc thi cử.',
      features: [
        'Toàn bộ tính năng của gói tháng',
        'Trợ lý ảo EduBot (KHÔNG GIỚI HẠN)',
        'Mở khóa toàn bộ ngân hàng 10,000+ câu hỏi',
        'Phân tích biểu đồ và dự đoán điểm thi THPTQG'
      ]
    },
    {
      id: 3,
      name: 'PRO Yearly',
      duration: '1 Năm (2026)',
      price: 799000,
      originalPrice: '2.399.000đ',
      discount: 'Tiết kiệm 66% · HOT',
      description: 'Cam kết bứt phá điểm số tối đa. Bạn đồng hành trọn vẹn của thủ khoa.',
      features: [
        'Toàn bộ quyền lợi gói 6 tháng',
        'Tư vấn trực tiếp 24/7 với Đội ngũ Giáo viên',
        'Tài liệu ôn thi độc quyền biên soạn từ Thủ khoa',
        'Cam kết hỗ trợ đầu ra mục tiêu 27+ điểm'
      ]
    }
  ];

  const activePlan = plans.find(p => p.id === selectedPlan) || plans[2];
  const exactAmount = activePlan.price;

  // Live VietQR image endpoint
  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${exactAmount}&addInfo=${transferCode}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  // Polling database status
  useEffect(() => {
    let intervalId;

    const checkProStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/users/pro-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success && data.data?.isPro) {
          addLog(`[SePay Webhook] Tài khoản "${currentUser.fullName}" đã nâng cấp thành công thành học viên PRO!`, 'sys');
          setStep(3);
          onUpgradeSuccess();
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra trạng thái PRO của user:', err);
      }
    };

    if (step === 2) {
      // Poll every 3 seconds
      intervalId = setInterval(checkProStatus, 3000);
      
      // Call immediately on transition to payment step
      checkProStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, selectedPlan]);

  // Countdown timer for active QR
  useEffect(() => {
    if (seconds > 0 && step === 2) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds, step]);

  const handleSelectPlan = () => {
    setStep(2);
    setSeconds(300); // Reset timer to 5 minutes
    addLog(`Học sinh chọn gói nâng cấp: ${activePlan.name} (Số tiền: ${activePlan.price.toLocaleString()} VNĐ)`, 'sys');
  };

  const handleSimulateUpgrade = () => {
    addLog(`[Demo Mode] Đang mô phỏng nâng cấp tài khoản PRO...`, 'sys');
    setStep(2); // Set loading state first for dramatic effect
    setTimeout(() => {
      addLog(`[Demo Mode] Xác nhận thành công! Tài khoản "${currentUser.fullName}" đã được nâng cấp lên Học viên PRO.`, 'sys');
      setStep(3);
      onUpgradeSuccess();
    }, 1500);
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    setPollingError('');
    addLog(`[SePay] Đối soát giao dịch nâng cấp: ${transferCode}`, 'sys');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      setPollingError('Vui lòng đăng nhập lại!');
      setIsVerifying(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const res = await fetch(`${API_BASE}/users/pro-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.data?.isPro) {
        addLog(`[SePay] Xác thực thành công! Bạn đã sở hữu tài khoản PRO.`, 'sys');
        setStep(3);
        onUpgradeSuccess();
      } else {
        addLog(`[SePay] Chưa nhận được giao dịch nâng cấp: ${transferCode}`, 'sys');
        setPollingError('Chưa phát hiện giao dịch nâng cấp trên sao kê ngân hàng. Bạn vui lòng đợi 1-2 phút rồi thử lại.');
      }
    } catch (err) {
      setPollingError('Có lỗi xảy ra khi truy vấn dữ liệu từ cổng thanh toán.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins}:${rs < 10 ? '0' : ''}${rs}`;
  };

  return (
    <div className="checkout-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 12, 38, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1050, padding: '16px', overflowY: 'auto'
    }}>
      <div className="checkout-modal animate-in" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        width: '100%', maxWidth: step === 1 ? '960px' : '480px', 
        position: 'relative', overflow: 'hidden', padding: '28px',
        transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            border: 'none', background: 'none', color: 'var(--text-secondary)',
            fontSize: '22px', cursor: 'pointer', zIndex: 10,
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <HiX />
        </button>

        {/* STEP 1: Plan Selector */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #FFE259, #FFA751)',
                color: '#fff', padding: '6px 14px', borderRadius: '20px',
                fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                boxShadow: '0 4px 15px rgba(255, 167, 81, 0.3)'
              }}>
                <HiStar /> EduPath Premium Upgrade
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '12px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Nâng Cấp Tài Khoản PRO Học Tập Thông Minh
              </h2>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Bứt phá điểm 9+ trong kỳ thi THPT Quốc Gia với trợ lý AI không giới hạn, lộ trình học thích ứng liên tục và đội ngũ thủ khoa đồng hành.
              </p>
            </div>

            {/* Plans Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px', marginBottom: '28px'
            }}>
              {plans.map(plan => {
                const isSelected = selectedPlan === plan.id;
                const isRecommended = plan.id === 3;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      border: isSelected ? '2.5px solid #FFA751' : '1px solid var(--border)',
                      borderRadius: '16px', padding: '24px', background: 'var(--bg-main)',
                      cursor: 'pointer', position: 'relative', display: 'flex',
                      flexDirection: 'column', justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 10px 30px rgba(255, 167, 81, 0.15)' : 'none',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {isRecommended && (
                      <span style={{
                        position: 'absolute', top: '-12px', right: '16px',
                        background: 'linear-gradient(135deg, #FFA751, #FF5E62)',
                        color: '#fff', fontSize: '10px', fontWeight: 'bold',
                        padding: '4px 10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(255, 94, 98, 0.2)'
                      }}>
                        KHUYÊN DÙNG
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', color: isSelected ? 'var(--primary)' : 'var(--text-primary)', margin: 0 }}>
                          {plan.name}
                        </h3>
                        <span className="badge-pill" style={{
                          background: isSelected ? 'var(--primary-bg)' : 'rgba(0,0,0,0.06)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '10px', fontWeight: 'bold'
                        }}>
                          {plan.discount}
                        </span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>{plan.description}</p>
                      
                      {/* Price Section */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-orange)' }}>
                          {plan.price.toLocaleString()}đ
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {plan.originalPrice}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/ {plan.duration}</span>
                      </div>

                      {/* Features list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                            <HiCheckCircle style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '2px' }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <button
                        style={{
                          width: '100%', padding: '10px', borderRadius: '10px',
                          border: 'none', background: isSelected ? 'linear-gradient(135deg, #FFA751, #FF5E62)' : 'var(--bg-card)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                          boxShadow: isSelected ? '0 6px 18px rgba(255, 94, 98, 0.25)' : 'none',
                          border: isSelected ? 'none' : '1px solid var(--border)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isSelected ? 'Đã chọn gói này' : 'Chọn gói này'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom info & Checkout Action */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--border)', paddingTop: '20px', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                <HiShieldCheck style={{ color: 'var(--accent-green)', fontSize: '20px' }} />
                <span>Bảo mật 100% · Xác thực thanh toán tự động thời gian thực qua SePay</span>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-outline" onClick={onClose} style={{ padding: '10px 24px' }}>
                  Hủy bỏ
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSelectPlan}
                  style={{
                    padding: '10px 32px', display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #6C5CE7, #FD79A8)', border: 'none',
                    fontWeight: 'bold', boxShadow: '0 6px 20px rgba(108, 92, 227, 0.3)'
                  }}
                >
                  Tiến hành thanh toán <HiArrowRight />
                </button>
              </div>
            </div>


          </div>
        )}

        {/* STEP 2: VietQR and Bank Transfer details with timer */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HiSparkles style={{ color: '#FFA751', fontSize: '20px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                Quét mã nâng cấp PRO
              </h3>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
              Bạn đang nâng cấp gói: <strong style={{ color: 'var(--primary)' }}>{activePlan.name} ({activePlan.duration})</strong>
            </p>

            {/* Price badge */}
            <div style={{
              background: 'var(--bg-main)', padding: '12px 16px',
              borderRadius: '12px', marginBottom: '16px',
              border: '1px solid var(--border)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Số tiền cần thanh toán:</span>
              <strong style={{ fontSize: '17px', color: 'var(--accent-orange)' }}>{exactAmount.toLocaleString()}đ</strong>
            </div>

            {/* Bank Transfer Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {/* STK */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                padding: '8px 12px', borderRadius: '12px'
              }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <div>Số tài khoản ({BANK_ID}):</div>
                  <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>{ACCOUNT_NO}</strong>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => handleCopy(ACCOUNT_NO, 'no')}
                  style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedField === 'no' ? <><HiCheck /> Đã lưu</> : <><HiDuplicate /> Sao chép</>}
                </button>
              </div>

              {/* Transfer Content */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                padding: '8px 12px', borderRadius: '12px'
              }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  <div>Nội dung chuyển khoản (Chính xác):</div>
                  <strong style={{ fontSize: '15.5px', color: 'var(--accent-red)', letterSpacing: '1px' }}>{transferCode}</strong>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => handleCopy(transferCode, 'code')}
                  style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedField === 'code' ? <><HiCheck /> Đã lưu</> : <><HiDuplicate /> Sao chép</>}
                </button>
              </div>

              {/* Owner */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 12px'
              }}>
                <span>Chủ tài khoản:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{ACCOUNT_NAME}</strong>
              </div>
            </div>

            {/* Dynamic QR Code display */}
            <div style={{
              background: '#fff', padding: '16px', borderRadius: '16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', border: '1px solid var(--border)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)', marginBottom: '14px'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="VietQR Upgrade Code" 
                style={{ width: '220px', height: '220px', objectFit: 'contain' }}
              />
              <p style={{ fontSize: '11px', color: '#636e72', fontWeight: 600, marginTop: '8px', textAlign: 'center', margin: '8px 0 0 0' }}>
                Quét mã bằng App Ngân hàng để tự động điền Số tiền & Nội dung
              </p>
            </div>

            {/* Waiting status & Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-green"></span>
                <span style={{ fontSize: '11.5px', color: 'var(--accent-green)', fontWeight: 600 }}>
                  Đang đối soát giao dịch tự động...
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Thời gian còn lại: <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{formatTime(seconds)}</span>
              </div>
            </div>

            {pollingError && (
              <p style={{ color: 'var(--accent-red)', fontSize: '12px', fontWeight: 500, margin: '0 0 12px 0', textAlign: 'center' }}>
                ⚠️ {pollingError}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onClick={handleManualCheck}
                disabled={isVerifying}
              >
                <HiRefresh className={isVerifying ? 'spin' : ''} /> 
                {isVerifying ? 'Đang xác thực giao dịch...' : 'Tôi đã chuyển khoản (Kiểm tra sao kê)'}
              </button>
              
              <button className="btn-outline" style={{ width: '100%' }} onClick={() => setStep(1)} disabled={isVerifying}>
                Quay lại chọn Gói khác
              </button>
            </div>



          </div>
        )}

        {/* STEP 3: Upgrade success screen */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{
              fontSize: '70px', color: '#FFA751', marginBottom: '16px',
              filter: 'drop-shadow(0 4px 10px rgba(255, 167, 81, 0.3))',
              animation: 'bounce 2s infinite'
            }}>
              <HiCheckCircle />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Nâng cấp Học viên PRO thành công! ⭐
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              Chúc mừng em! Tài khoản của em đã được nâng cấp lên **Học viên PRO**. 
              Bây giờ toàn bộ các đặc quyền cao cấp bao gồm Lộ trình thích ứng cá nhân hóa nâng cao và Trợ lý ảo EduBot không giới hạn đã chính thức được mở khóa trọn vẹn!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #FFA751, #FF5E62)', border: 'none',
                  boxShadow: '0 6px 20px rgba(255, 94, 98, 0.3)', fontWeight: 'bold'
                }} 
                onClick={onClose}
              >
                Trải nghiệm đặc quyền PRO ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
