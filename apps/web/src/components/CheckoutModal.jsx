import { useState, useEffect } from 'react';
import { HiX, HiCheckCircle, HiLockOpen, HiCheck, HiDuplicate, HiRefresh, HiSparkles } from 'react-icons/hi';
import { API_BASE } from '../api';


export default function CheckoutModal({ course, onClose, onPaymentSuccess, addLog }) {
  const [step, setStep] = useState(1); // 1: QR checkout, 2: Verification processing, 3: Success unlock
  const [seconds, setSeconds] = useState(300); // 5 minutes timeout for better user experience
  const [copiedField, setCopiedField] = useState(null); // tracking copy states
  const [isVerifying, setIsVerifying] = useState(false);
  const [pollingError, setPollingError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
  const studentId = currentUser.id || 1;
  const courseId = course.id;
  const transferCode = `EP${studentId}C${courseId}`;

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

  const exactAmount = parsePrice(course.price);

  // Bank accounts config
  const BANK_ID = 'ACB'; // Ngân hàng TMCP Á Châu
  const ACCOUNT_NO = '18657431';
  const ACCOUNT_NAME = 'THUAN VAN TRAN';

  // Live VietQR image endpoint with template compact/qr_only
  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${exactAmount}&addInfo=${transferCode}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  // Polling for automated checkout status update
  useEffect(() => {
    let intervalId;

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
          addLog(`[SePay Webhook] Hệ thống đã ghi nhận khoản thanh toán tự động cho khóa "${course.title}".`, 'sys');
          setStep(3);
          onPaymentSuccess(course.id);
        }
      } catch (err) {
        console.error('Lỗi khi thăm dò trạng thái giao dịch:', err);
      }
    };

    if (step === 1) {
      // Poll every 3 seconds
      intervalId = setInterval(checkPaymentStatus, 3000);
      
      // Check immediately on mount
      checkPaymentStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, courseId]);

  // General countdown timer
  useEffect(() => {
    if (seconds > 0 && step === 1) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds, step]);

  const handleSimulatePayment = () => {
    addLog(`[Demo Mode] Tiến hành mô phỏng thanh toán khóa học "${course.title}"...`, 'sys');
    setStep(2);
    setTimeout(() => {
      addLog(`[Demo Mode] Xác nhận thành công! Đã kích hoạt quyền sở hữu khóa học "${course.title}".`, 'sys');
      setStep(3);
      onPaymentSuccess(course.id);
    }, 1500);
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    setPollingError('');
    addLog(`[SePay] Học sinh yêu cầu kiểm tra sao kê thủ công giao dịch: ${transferCode}`, 'sys');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      setPollingError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
      setIsVerifying(false);
      return;
    }

    try {
      // Wait 1.5 seconds to query the bank database
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const res = await fetch(`${API_BASE}/enrollments/status?courseId=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.data?.isEnrolled) {
        addLog(`[SePay] Chuyển khoản thành công! Đã mở khóa khóa học: "${course.title}"`, 'sys');
        setStep(3);
        onPaymentSuccess(course.id);
      } else {
        addLog(`[SePay] Giao dịch "${transferCode}" chưa xuất hiện trên hệ thống ngân hàng.`, 'sys');
        setPollingError('Chưa nhận được giao dịch. Nếu bạn đã chuyển khoản thành công, vui lòng đợi 1-2 phút rồi nhấn lại.');
      }
    } catch (err) {
      setPollingError('Lỗi kết nối máy chủ khi đối soát ngân hàng.');
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
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1050, padding: '16px'
    }}>
      <div className="checkout-modal animate-in" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
        width: '100%', maxWidth: '480px', position: 'relative', overflow: 'hidden',
        padding: '24px'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            border: 'none', background: 'none', color: 'var(--text-secondary)',
            fontSize: '20px', cursor: 'pointer', zIndex: 10
          }}
        >
          <HiX />
        </button>

        {/* STEP 1: Bank Transfer details & VietQR */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HiSparkles style={{ color: 'var(--accent-orange)', fontSize: '20px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                Thanh toán tự động SePay
              </h3>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
              Bạn đang mua khóa học: <strong style={{ color: 'var(--primary)' }}>{course.title}</strong>
            </p>

            {/* Price section */}
            <div style={{
              background: 'var(--bg-main)', padding: '12px 16px',
              borderRadius: 'var(--radius-md)', marginBottom: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span>Giá niêm yết:</span>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>899.000đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.5px', fontWeight: 'bold' }}>
                <span>Thành tiền:</span>
                <span style={{ color: 'var(--accent-orange)' }}>{exactAmount.toLocaleString()}đ</span>
              </div>
            </div>

            {/* Bank details panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {/* Account Number */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                padding: '8px 12px', borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
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

              {/* Transfer Code */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                padding: '8px 12px', borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div>Nội dung chuyển khoản (Bắt buộc):</div>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-red)', letterSpacing: '1px' }}>{transferCode}</strong>
                </div>
                <button
                  className="btn-outline"
                  onClick={() => handleCopy(transferCode, 'code')}
                  style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedField === 'code' ? <><HiCheck /> Đã lưu</> : <><HiDuplicate /> Sao chép</>}
                </button>
              </div>

              {/* Account Holder */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '12px', color: 'var(--text-secondary)',
                padding: '4px 12px'
              }}>
                <span>Chủ tài khoản:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{ACCOUNT_NAME}</strong>
              </div>
            </div>

            {/* Dynamic VietQR code */}
            <div style={{
              background: '#fff', padding: '16px', borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '14px'
            }}>
              <img 
                src={qrCodeUrl} 
                alt="VietQR Code" 
                style={{ width: '220px', height: '220px', objectFit: 'contain' }}
              />
              <p style={{ fontSize: '11.5px', color: '#636e72', fontWeight: 600, marginTop: '8px', textAlign: 'center', margin: '8px 0 0 0' }}>
                Quét mã QR để tự động điền Số tiền & Nội dung chuyển khoản
              </p>
            </div>

            {/* Timer countdown & Polling Status indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-green"></span>
                <span style={{ fontSize: '11.5px', color: 'var(--accent-green)', fontWeight: 600 }}>
                  Hệ thống đang chờ giao dịch...
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

            {/* Main Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                onClick={handleManualCheck}
                disabled={isVerifying}
              >
                <HiRefresh className={isVerifying ? 'spin' : ''} /> 
                {isVerifying ? 'Đang đối soát ngân hàng...' : 'Tôi đã chuyển khoản (Kiểm tra ngay)'}
              </button>
              
              <button className="btn-outline" style={{ width: '100%' }} onClick={onClose} disabled={isVerifying}>
                Hủy giao dịch
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: Verification processing splash screen */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: '50px', height: '50px',
              border: '4px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 20px auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Đang xác thực thanh toán...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Hệ thống đang truy vấn sao kê tài khoản ngân hàng liên kết từ cổng SePay. Vui lòng giữ nguyên màn hình trong giây lát.
            </p>
          </div>
        )}

        {/* STEP 3: Success unlock screen */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ fontSize: '64px', color: 'var(--accent-green)', marginBottom: '14px' }}>
              <HiCheckCircle />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Kích hoạt thành công! 🎉
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              Cảm ơn em! Khóa học <strong style={{ color: 'var(--primary)' }}>{course.title}</strong> đã được kích hoạt trên hệ thống. Hãy bắt đầu chinh phục kiến thức và nhận lộ trình học tập cá nhân hóa ngay nào!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: 6 }} 
                onClick={onClose}
              >
                <HiLockOpen /> Vào học ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
