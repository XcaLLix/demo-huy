import React from 'react';
import { 
  HiClipboardList, 
  HiCheck, 
  HiPencil, 
  HiFire, 
  HiDatabase, 
  HiUpload 
} from 'react-icons/hi';

export function HeaderStats({ stats }) {
  const metrics = stats?.metrics || {
    totalExams: 0,
    publishedExams: 0,
    draftExams: 0,
    pendingExams: 0,
    totalQuestions: 0,
    processingImports: 0
  };

  const cards = [
    {
      title: 'Tổng đề thi',
      value: metrics.totalExams,
      desc: 'Tất cả trạng thái',
      icon: <HiClipboardList />,
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.08)'
    },
    {
      title: 'Đã phát hành',
      value: metrics.publishedExams,
      desc: 'Hiển thị online',
      icon: <HiCheck />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)'
    },
    {
      title: 'Bản nháp',
      value: metrics.draftExams,
      desc: 'Đang soạn thảo',
      icon: <HiPencil />,
      color: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.08)'
    },
    {
      title: 'Chờ duyệt',
      value: metrics.pendingExams,
      desc: 'Đợi phê duyệt',
      icon: <HiFire />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.08)'
    },
    {
      title: 'Ngân hàng',
      value: metrics.totalQuestions,
      desc: 'Câu hỏi đã tạo',
      icon: <HiDatabase />,
      color: '#0ea5e9',
      bgColor: 'rgba(14, 165, 233, 0.08)'
    },
    {
      title: 'AI Parsing',
      value: metrics.processingImports,
      desc: 'Tệp đang phân tích',
      icon: <HiUpload />,
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.08)'
    }
  ];

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{card.title}</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: card.bgColor,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              {card.icon}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
              {card.value}
            </span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{card.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
