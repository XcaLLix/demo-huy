import { useState, useEffect } from 'react';
import { HiX, HiCheckCircle, HiLockOpen } from 'react-icons/hi';

export default function CheckoutModal({ course, onClose, onPaymentSuccess, addLog }) {
  const [step, setStep] = useState(1); // 1: QR checkout, 2: Verification processing, 3: Success unlock
  const [seconds, setSeconds] = useState(180); // 3 minutes timeout

  useEffect(() => {
    if (seconds > 0 && step === 1) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds, step]);

  const handleSimulatePayment = () => {
    addLog(`Tiến hành xử lý thanh toán khóa học "${course.title}" qua cổng Payment System...`, 'sys');
    setStep(2);
    setTimeout(() => {
      addLog(`Cổng thanh toán xác nhận: Nhận thành công ${course.price} VNĐ. Khóa học đã được mở khóa!`, 'sys');
      setStep(3);
      onPaymentSuccess(course.id);
    }, 2000);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins}:${rs < 10 ? '0' : ''}${rs}`;
  };

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal animate-in" style={{ maxWidth: '450px' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            border: 'none', background: 'none', color: 'var(--text-secondary)',
            fontSize: '20px', cursor: 'pointer'
          }}
        >
          <HiX />
        </button>

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Thanh toán khóa học
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Bạn đang mua khóa học: <strong>{course.title}</strong>
            </p>

            <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Giá gốc:</span>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>899.000đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                <span>Thành tiền:</span>
                <span style={{ color: 'var(--accent-orange)' }}>{course.price}đ</span>
              </div>
            </div>

            <div className="qr-container">
              <div className="qr-mock">
                {/* Dynamically styled QR code mock in CSS */}
              </div>
              <p style={{ fontSize: '11px', color: '#636E72', fontWeight: 600, marginTop: '8px' }}>
                Quét mã QR để thanh toán nhanh qua Ngân hàng / Ví điện tử
              </p>
            </div>

            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Thời gian giao dịch còn lại: <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>{formatTime(seconds)}</span>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleSimulatePayment}>
                Khớp giao dịch tự động (Mô phỏng Chuyển khoản thành công)
              </button>
              <button className="btn-outline" style={{ width: '100%' }} onClick={onClose}>
                Hủy giao dịch
              </button>
            </div>
          </div>
        )}

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
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Đang xác thực thanh toán...</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Hệ thống đang truy vấn sao kê tài khoản ngân hàng từ Payment System. Vui lòng giữ nguyên màn hình.
            </p>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ fontSize: '64px', color: 'var(--accent-green)', marginBottom: '14px' }}>
              <HiCheckCircle />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Kích hoạt thành công! 🎉
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Cảm ơn em! Khóa học <strong>{course.title}</strong> đã được kích hoạt. Hãy bắt đầu chinh phục kiến thức và nhận lộ trình học tập cá nhân hóa ngay nào!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={onClose}>
                <HiLockOpen /> Vào học ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
