import { HiCheck, HiDesktopComputer, HiLightningBolt, HiLockClosed } from 'react-icons/hi';

const steps = [
  { icon: <HiCheck />, label: 'Đánh giá đầu vào', status: 'Hoàn thành', className: 'completed' },
  { icon: <HiDesktopComputer />, label: 'Nền tảng', status: '4/6 chủ đề', className: 'in-progress' },
  { icon: <HiLightningBolt />, label: 'Tăng tốc', status: '2/6 chủ đề', className: 'current' },
  { icon: <HiLockClosed />, label: 'Về đích', status: 'Chưa mở', className: 'locked' },
];

export default function LearningPath() {
  return (
    <div className="card learning-path animate-in">
      <div className="card-header">
        <h3>LỘ TRÌNH HỌC TẬP CỦA BẠN</h3>
        <a href="#" className="link">Xem chi tiết</a>
      </div>

      <div className="path-info-row">
        <div className="path-info">
          <p className="path-goal">Mục tiêu: <strong>Đạt 27+ điểm THPTQG</strong></p>
          <p className="path-combo">Tổ hợp: A01 (Toán – Lý – Anh)</p>
        </div>
        <div className="path-days" style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 12, color: '#636E72' }}>Thời gian còn lại</p>
          <span className="days-number">180</span>
          <span className="days-label"> ngày</span>
        </div>
      </div>

      <div className="path-steps">
        {steps.map((step, i) => (
          <div className="path-step" key={i}>
            <div className={`step-circle ${step.className}`}>
              {step.icon}
            </div>
            <div className="step-label">
              <div className="step-name">{step.label}</div>
              <div className={`step-status ${step.className === 'completed' ? 'completed' : ''}`}>
                {step.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
