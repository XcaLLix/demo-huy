import { useState, useEffect } from 'react';
import { HiX, HiCheckCircle, HiLockOpen, HiCheck, HiDuplicate, HiRefresh, HiSparkles, HiTrash, HiChevronLeft, HiCreditCard } from 'react-icons/hi';
import { API_BASE, api } from '../api';
import { toast } from '../utils/toast';

export default function CheckoutModal({ courses = [], onClose, onPaymentSuccess, onRemoveCourse, addLog }) {
  const [step, setStep] = useState(1); // 1: Cart view, 2: QR checkout, 3: Verification processing, 4: Success unlock
  const [seconds, setSeconds] = useState(300); // 5 minutes timeout
  const [copiedField, setCopiedField] = useState(null); // tracking copy states
  const [isVerifying, setIsVerifying] = useState(false);
  const [pollingError, setPollingError] = useState('');

  // Promo Code states
  const [promoCode, setPromoCode] = useState('');
  const [discountVal, setDiscountVal] = useState(0);
  const [promoStatus, setPromoStatus] = useState(''); // 'success' | 'invalid' | ''
  const [promoError, setPromoError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
  const studentId = currentUser.id || 1;
  const transferCode = courses.length > 0 ? `EP${studentId}C${courses[0].id}` : `EP${studentId}CRT`;

  // Helper function to parse course price to actual VND
  const parsePrice = (priceVal) => {
    if (typeof priceVal === 'number') {
      if (priceVal < 10000) return priceVal * 1000;
      return priceVal;
    }
    if (typeof priceVal === 'string') {
      const cleaned = Number(priceVal.replace(/\D/g, ''));
      if (cleaned < 10000) return cleaned * 1000;
      return cleaned;
    }
    return 0;
  };

  const originalAmount = courses.reduce((sum, c) => sum + parsePrice(c.priceSale ?? c.price ?? c.priceOriginal), 0);
  const discountAmount = discountVal;
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  // Bank accounts config
  const BANK_ID = 'ACB'; // Ngân hàng TMCP Á Châu
  const ACCOUNT_NO = '18657431';
  const ACCOUNT_NAME = 'THUAN VAN TRAN';

  // Live VietQR image endpoint using finalAmount (discounted)
  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${finalAmount}&addInfo=${transferCode}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  // Polling for automated checkout status update
  useEffect(() => {
    let intervalId;
    if (courses.length === 0) return;
    const courseId = courses[0].id; // query status for the primary cart course

    const checkPaymentStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/enrollments/status?courseId=${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success && data.data?.isEnrolled) {
          addLog(`[SePay Webhook] Hệ thống đã ghi nhận khoản thanh toán tự động cho giỏ hàng.`, 'sys');
          setStep(4);
          onPaymentSuccess(courses.map(c => c.id));
        }
      } catch (err) {
        console.error('Lỗi khi thăm dò trạng thái giao dịch:', err);
      }
    };

    if (step === 2) {
      // Poll every 3 seconds
      intervalId = setInterval(checkPaymentStatus, 3000);
      
      // Check immediately on mount
      checkPaymentStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, courses]);

  // General countdown timer
  useEffect(() => {
    if (seconds > 0 && step === 2) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds, step]);

  const handleApplyPromoCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await api.validateVoucher({
        code,
        type: 'COURSE',
        courseId: courses[0]?.id,
        originalPrice: originalAmount
      });
      setDiscountVal(res.discountAmount);
      setPromoStatus('success');
      setPromoError('');
    } catch (err) {
      setDiscountVal(0);
      setPromoStatus('invalid');
      setPromoError(err.message || 'Mã giảm giá không hợp lệ!');
    }
  };

  const handleProceedToCheckout = async () => {
    if (promoCode && promoStatus === 'success') {
      try {
        await api.reserveVoucher({
          code: promoCode.trim().toUpperCase(),
          type: 'COURSE',
          courseId: courses[0]?.id
        });
      } catch (err) {
        console.error('[Voucher Reserve Error] Failed to reserve voucher:', err);
      }
    }
    setStep(2);
  };

  const handleFreeCheckout = () => {
    const titleSummary = courses.map(c => `"${c.title}"`).join(', ');
    addLog(`[Voucher] Áp dụng mã giảm giá ${promoCode.trim().toUpperCase()} kích hoạt khóa học ${titleSummary}...`, 'sys');
    setStep(3);
    setTimeout(() => {
      addLog(`[Voucher] Kích hoạt thành công! Đã mở khóa nhóm khóa học: ${titleSummary}`, 'sys');
      onPaymentSuccess(courses.map(c => c.id), promoCode.trim().toUpperCase());
      setStep(4);
    }, 1200);
  };

  const handleSimulatePayment = () => {
    const titleSummary = courses.map(c => `"${c.title}"`).join(', ');
    addLog(`[Demo Mode] Tiến hành mô phỏng thanh toán nhóm khóa học ${titleSummary}...`, 'sys');
    setStep(3);
    setTimeout(() => {
      addLog(`[Demo Mode] Xác nhận thành công! Đã kích hoạt quyền sở hữu nhóm khóa học.`, 'sys');
      onPaymentSuccess(courses.map(c => c.id), promoCode.trim().toUpperCase());
      setStep(4);
    }, 1500);
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    setPollingError('');
    addLog(`[SePay] Học sinh yêu cầu kiểm tra sao kê thủ công giao dịch: ${transferCode}`, 'sys');
    
    const token = localStorage.getItem('access_token');
    const courseId = courses[0]?.id;

    if (!token || !courseId) {
      setPollingError('Vui lòng đăng nhập để thực hiện giao dịch!');
      setIsVerifying(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const res = await fetch(`${API_BASE}/enrollments/status?courseId=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.data?.isEnrolled) {
        addLog(`[SePay] Chuyển khoản thành công! Đã mở khóa nhóm khóa học.`, 'sys');
        setStep(4);
        onPaymentSuccess(courses.map(c => c.id));
      } else {
        addLog(`[SePay] Giao dịch "${transferCode}" chưa xuất hiện.`, 'sys');
        setPollingError('Hệ thống chưa nhận được giao dịch chuyển khoản của em. Vui lòng đợi từ 1-2 phút sau khi chuyển khoản thành công và kiểm tra lại.');
      }
    } catch (err) {
      console.error(err);
      setPollingError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền mạng của em.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const rs = seconds % 60;
    return `${mins}:${rs < 10 ? '0' : ''}${rs}`;
  };

  if (courses.length === 0) return null;

  return (
    <div className="checkout-fullscreen-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-main, #FAF6EE)', display: 'flex', flexDirection: 'column',
      zIndex: 2000, overflowY: 'auto', fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      
      {/* ── HEADER ── */}
      <header style={{
        padding: '20px 40px',
        borderBottom: '3px solid #000',
        background: '#FAF6EE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: '#7C3AED', color: '#fff', fontSize: '18px', fontWeight: '900',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2.5px solid #000000', boxShadow: '2px 2px 0px #000000'
          }}>
            E
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '950', color: '#000000', margin: 0 }}>EduPath AI</h1>
            <p style={{ fontSize: '10px', color: '#555', margin: 0, fontWeight: 'bold' }}>Thanh toán đơn hàng</p>
          </div>
        </div>

        {step < 4 && (
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '2.5px solid #000',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '3px 3px 0px #000',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '3px 3px 0px #000';
            }}
          >
            <HiChevronLeft style={{ fontSize: '18px' }} /> Quay lại học tập
          </button>
        )}
      </header>

      {/* ── MAIN BODY ── */}
      <main style={{ flex: 1, padding: '40px', boxSizing: 'border-box', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        
        {/* STEP 1: Cart view */}
        {step === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'start' }}>
            
            {/* Cột trái: Danh sách khóa học */}
            <div style={{ flex: '1 1 650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: '#fff', border: '3px solid #000', borderRadius: '16px',
                padding: '28px', boxShadow: '5px 5px 0px #000'
              }}>
                <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛒</span> Giỏ hàng của em ({courses.length} sản phẩm)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {courses.map((c) => {
                    const price = parsePrice(c.priceSale ?? c.price ?? c.priceOriginal);
                    return (
                      <div 
                        key={c.id} 
                        style={{
                          background: '#FFFDF9',
                          border: '2px solid #000',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          position: 'relative',
                          boxShadow: '2px 2px 0px #000'
                        }}
                      >
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '18px', fontWeight: 'bold', border: '2px solid #000', flexShrink: 0
                        }}>
                          {c.subject?.slice(0, 1) || '📚'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#000' }}>
                            {c.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#555', fontWeight: '700' }}>
                            Môn: {c.subject} • Giáo viên: {c.teacherName || c.instructor?.name || 'Cố vấn EduPath'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '950', color: '#000' }}>
                            {price.toLocaleString('vi-VN')}đ
                          </span>
                          <button
                            onClick={() => onRemoveCourse(c.id)}
                            style={{
                              border: '2px solid #000',
                              background: '#FFEAA7',
                              borderRadius: '8px',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '1.5px 1.5px 0px #000',
                              transition: 'all 0.1s'
                            }}
                            title="Xóa khỏi giỏ hàng"
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#ff7675'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFEAA7'; }}
                          >
                            <HiTrash style={{ fontSize: '16px', color: '#000' }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cột phải: Tính tiền & Thanh toán */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Promo Code */}
              <div style={{
                background: '#fff', border: '3px solid #000', borderRadius: '16px',
                padding: '24px', boxShadow: '5px 5px 0px #000'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#000', margin: '0 0 12px 0' }}>
                  🎟️ Mã giảm giá / Ưu đãi
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã ưu đãi..."
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{ flex: 1, padding: '10px', border: '2px solid #000', borderRadius: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    style={{
                      background: '#7C3AED', color: '#fff', border: '2px solid #000',
                      borderRadius: '8px', padding: '0 16px', fontWeight: '900', cursor: 'pointer',
                      boxShadow: '2px 2px 0px #000'
                    }}
                  >
                    Áp dụng
                  </button>
                </div>
                {promoStatus === 'success' && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                    ✓ Áp dụng thành công! Đã giảm {discountVal.toLocaleString('vi-VN')}đ vào tổng đơn hàng.
                  </p>
                )}
                {promoStatus === 'invalid' && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--accent-red)', fontWeight: 'bold' }}>
                    ✗ {promoError || 'Mã giảm giá không đúng hoặc hết hạn.'}
                  </p>
                )}
              </div>

              {/* Hóa đơn tính tiền */}
              <div style={{
                background: '#fff', border: '3px solid #000', borderRadius: '16px',
                padding: '24px', boxShadow: '5px 5px 0px #000'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '950', color: '#000', margin: '0 0 16px 0', borderBottom: '2.5px solid #000', paddingBottom: '8px' }}>
                  Chi tiết hóa đơn
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555', fontWeight: '700' }}>
                    <span>Tạm tính:</span>
                    <span>{originalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--accent-red)', fontWeight: 'bold' }}>
                      <span>Giảm giá:</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div style={{ height: '1.5px', background: '#000', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '950', color: '#000' }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#E67E22' }}>{finalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={finalAmount === 0 ? handleFreeCheckout : handleProceedToCheckout}
                  style={{
                    width: '100%', padding: '14px', background: '#FFE259',
                    color: '#000', border: '3.5px solid #000', borderRadius: '12px',
                    fontSize: '15px', fontWeight: '950', cursor: 'pointer',
                    boxShadow: '4px 4px 0px #000', transition: 'all 0.15s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px #000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #000';
                  }}
                >
                  {finalAmount === 0 ? 'NHẬN KHÓA HỌC MIỄN PHÍ ➔' : 'TIẾN HÀNH THANH TOÁN ➔'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: Bank Transfer & VietQR */}
        {step === 2 && (
          <div style={{
            background: '#fff', border: '3px solid #000', borderRadius: '16px',
            padding: '40px', boxShadow: '6px 6px 0px #000', display: 'flex', flexWrap: 'wrap', gap: '40px'
          }}>
            
            {/* Cột trái: Mock card & Thông tin tài khoản */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000', margin: 0 }}>
                💳 Chuyển khoản ngân hàng qua cổng SePay
              </h2>
              <p style={{ fontSize: '13.5px', color: '#555', margin: 0, fontWeight: '700', lineHeight: 1.5 }}>
                Em vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản bên dưới. Giao dịch sẽ được kiểm tra và kích hoạt hoàn toàn tự động sau 15 - 30 giây.
              </p>

              {/* Debit Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '20px',
                padding: '24px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                border: '3px solid #000'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '950', letterSpacing: '1px', color: '#FFE259' }}>
                    🏦 ACB BANK
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px' }}>
                    PREMIUM MEMBER
                  </span>
                </div>

                <div style={{
                  width: '38px', height: '28px',
                  background: 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  border: '1.5px solid #000'
                }} />

                <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px', fontFamily: 'monospace', marginBottom: '16px' }}>
                  {ACCOUNT_NO}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '2px' }}>Chủ tài khoản</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{ACCOUNT_NAME}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '2px' }}>Số tiền thanh toán</div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#FFE259' }}>{finalAmount.toLocaleString()}đ</div>
                  </div>
                </div>
              </div>

              {/* Copy details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Account No */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#FFFDF9', border: '2px solid #000', borderRadius: '12px',
                  padding: '12px 18px', boxShadow: '2px 2px 0px #000'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#555', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Số tài khoản:</span>
                    <strong style={{ fontSize: '16px', color: '#000' }}>{ACCOUNT_NO}</strong>
                  </div>
                  <button
                    onClick={() => handleCopy(ACCOUNT_NO, 'no')}
                    style={{
                      background: '#FFF', border: '2px solid #000', borderRadius: '8px',
                      padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                      boxShadow: '1.5px 1.5px 0px #000'
                    }}
                  >
                    {copiedField === 'no' ? <><HiCheck /> Đã sao chép</> : <><HiDuplicate /> Sao chép</>}
                  </button>
                </div>

                {/* Transfer Message */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#FFFDF9', border: '2px solid #000', borderRadius: '12px',
                  padding: '12px 18px', boxShadow: '2px 2px 0px #000'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#555', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Nội dung chuyển khoản (Bắt buộc):</span>
                    <strong style={{ fontSize: '17px', color: 'var(--accent-red)', letterSpacing: '1px' }}>{transferCode}</strong>
                  </div>
                  <button
                    onClick={() => handleCopy(transferCode, 'code')}
                    style={{
                      background: '#FFF', border: '2px solid #000', borderRadius: '8px',
                      padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                      boxShadow: '1.5px 1.5px 0px #000'
                    }}
                  >
                    {copiedField === 'code' ? <><HiCheck /> Đã sao chép</> : <><HiDuplicate /> Sao chép</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Cột phải: VietQR Code */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                background: '#fff', border: '3px solid #000', borderRadius: '16px',
                padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '4px 4px 0px #000', width: '100%', maxWidth: '340px'
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="VietQR Code" 
                  style={{ width: '220px', height: '220px', objectFit: 'contain' }}
                />
                <p style={{ fontSize: '12px', color: '#555', fontWeight: 'bold', marginTop: '12px', textAlign: 'center', margin: '12px 0 0 0' }}>
                  Quét mã QR bằng ứng dụng Ngân hàng (Mobile Banking) để điền tự động thông tin chuyển khoản.
                </p>
              </div>

              {/* Waiting status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '340px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pulse-green"></span>
                  <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                    Đang quét sao kê ngân hàng...
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#555', fontWeight: 'bold' }}>
                  Đếm ngược: <span style={{ color: 'var(--accent-red)' }}>{formatTime(seconds)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px' }}>
                <button 
                  onClick={handleManualCheck}
                  disabled={isVerifying}
                  style={{
                    width: '100%', padding: '12px', background: '#7C3AED', color: '#fff',
                    border: '2.5px solid #000', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px',
                    boxShadow: '3px 3px 0px #000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <HiRefresh className={isVerifying ? 'spin' : ''} /> 
                  {isVerifying ? 'Đang xác thực giao dịch...' : 'Xác thực tôi đã chuyển khoản'}
                </button>
                <button 
                  onClick={() => setStep(1)} 
                  disabled={isVerifying}
                  style={{
                    width: '100%', padding: '10px', background: '#FFF', color: '#000',
                    border: '2.5px solid #000', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px',
                    boxShadow: '3px 3px 0px #000', cursor: 'pointer'
                  }}
                >
                  Quay lại chỉnh sửa Giỏ hàng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Verification Splash */}
        {step === 3 && (
          <div style={{
            background: '#fff', border: '3px solid #000', borderRadius: '16px',
            padding: '60px', boxShadow: '5px 5px 0px #000', textAlign: 'center',
            maxWidth: '600px', margin: '40px auto'
          }}>
            <div style={{
              width: '56px', height: '56px',
              border: '5px solid #E2E8F0',
              borderTopColor: '#7C3AED',
              borderRadius: '50%',
              margin: '0 auto 24px auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h3 style={{ fontSize: '20px', fontWeight: '950', marginBottom: '12px', color: '#000' }}>
              ĐANG ĐỐI SOÁT GIAO DỊCH TỪ SEPAY...
            </h3>
            <p style={{ fontSize: '13.5px', color: '#555', lineHeight: '1.6', margin: 0, fontWeight: '700' }}>
              Hệ thống đang kiểm tra tự động sao kê tài khoản ngân hàng liên kết. Vui lòng giữ kết nối trong vài giây, EduPath AI sẽ mở khóa toàn bộ khóa học ngay sau khi nhận được tiền.
            </p>
          </div>
        )}

        {/* STEP 4: Success unlock screen */}
        {step === 4 && (
          <div style={{
            background: '#fff', border: '3px solid #000', borderRadius: '16px',
            padding: '50px 30px', boxShadow: '6px 6px 0px #000', textAlign: 'center',
            maxWidth: '650px', margin: '40px auto'
          }}>
            <div style={{ fontSize: '80px', color: 'var(--accent-green)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <HiCheckCircle />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '12px', color: '#000' }}>
              MỞ KHÓA THÀNH CÔNG! 🎉
            </h3>
            <div style={{
              background: '#F0FDF4', border: '2px solid #22c55e', borderRadius: '12px',
              padding: '16px', marginBottom: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <strong style={{ fontSize: '14px', color: '#15803d' }}>📚 Danh sách các khóa học đã mở khóa:</strong>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#15803d', fontWeight: 'bold' }}>
                {courses.map(c => (
                  <li key={c.id}>{c.title}</li>
                ))}
              </ul>
            </div>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '28px', lineHeight: '1.6', fontWeight: '700' }}>
              Cảm ơn em đã tham gia học tập cùng EduPath AI! Hệ thống đã ghi nhận quyền sở hữu của em đối với các khóa học trên. Bắt đầu lộ trình học tập cá nhân hóa ngay nào!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={onClose}
                style={{
                  padding: '14px 36px', background: '#7C3AED', color: '#fff',
                  border: '3px solid #000', borderRadius: '12px', fontSize: '15px', fontWeight: '950',
                  boxShadow: '4px 4px 0px #000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.1s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px #000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '4px 4px 0px #000';
                }}
              >
                <HiLockOpen style={{ fontSize: '18px' }} /> Vào học ngay thôi!
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
