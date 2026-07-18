import React from 'react';
import { 
  HiPlusCircle, 
  HiUpload, 
  HiDatabase, 
  HiCollection 
} from 'react-icons/hi';

export function QuickActions({ onTabChange, onCreateExam }) {
  const actions = [
    {
      title: 'Tạo đề mới',
      desc: 'Thiết lập thủ công hoặc AI',
      icon: <HiPlusCircle />,
      onClick: onCreateExam
    },
    {
      title: 'Import đề thi',
      desc: 'Tải PDF/Word để tách câu',
      icon: <HiUpload />,
      onClick: () => onTabChange('imports')
    },
    {
      title: 'Question Bank',
      desc: 'Quản lý ngân hàng câu hỏi',
      icon: <HiDatabase />,
      onClick: () => onTabChange('questions')
    },
    {
      title: 'Lịch sử Import',
      desc: 'Xem các phiên duyệt AI',
      icon: <HiCollection />,
      onClick: () => onTabChange('imports')
    }
  ];

  return (
    <div className="quick-actions-row">
      {actions.map((act, i) => (
        <div key={i} className="quick-action-card" onClick={act.onClick}>
          <div className="quick-action-icon">
            {act.icon}
          </div>
          <div className="quick-action-info">
            <span className="quick-action-title">{act.title}</span>
            <span className="quick-action-desc">{act.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
