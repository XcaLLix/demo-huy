import React from 'react';
import { 
  HiClock, 
  HiUsers, 
  HiClipboardList, 
  HiChevronRight,
  HiStar,
  HiOutlineAcademicCap
} from 'react-icons/hi';
import { FaHeadphones, FaPencilAlt } from 'react-icons/fa';

function formatAttempts(n) {
  if (!n) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function MockExamCard({ exam, onSelect, onStart }) {
  const sid = exam.subject_id;
  
  // Custom theme classes mapped to subject_id
  let themeClass = 'toan';
  let accentColor = '#d8681a';
  if (sid === 2) {
    themeClass = 'anh';
    accentColor = '#bc4273';
  } else if (sid === 3) {
    themeClass = 'ly';
    accentColor = '#ab3a30';
  } else if (sid === 4) {
    themeClass = 'hoa';
    accentColor = '#6849a9';
  }

  const sourceLabel = exam.source || 'Thi thử';
  const subjectName =
    exam.exam_subjects?.name ||
    (sid === 1 ? 'Toán học' : sid === 2 ? 'Tiếng Anh' : sid === 3 ? 'Vật lý' : 'Hóa học');

  const attempts = exam.attempts_count || Math.floor(Math.random() * 3000 + 1000);
  
  // Create big test number text like 'TEST 1', 'TEST 2' based on exam code or year or ID
  const testNumber = exam.exam_code ? `TEST ${exam.exam_code}` : (exam.year ? `TEST ${exam.year}` : `TEST ${exam.id}`);

  return (
    <div className={`new-exam-card animate-in new-exam-card--${themeClass}`}>
      <div className="new-exam-card-pattern" />
      
      {/* Top Meta info */}
      <div className="new-exam-card-header">
        <span className="new-exam-card-meta-text">
          {subjectName.toLowerCase()} | {sourceLabel.toLowerCase()} {exam.year ? `| ${exam.year}` : ''}
        </span>
        <FaHeadphones className="new-exam-card-headphone-icon" />
      </div>

      {/* Body: Title & Stats */}
      <div className="new-exam-card-middle">
        <h2 className="new-exam-card-big-title">{testNumber}</h2>
        
        {/* Subtitle / stats */}
        <div className="new-exam-card-stats">
          <span className="new-exam-card-stat-item">
            <HiStar className="new-exam-card-stat-icon" /> {formatAttempts(attempts)} lượt làm
          </span>
          <span className="new-exam-card-stat-divider">|</span>
          <span className="new-exam-card-stat-item">
            <HiClock className="new-exam-card-stat-icon" /> {exam.duration_minutes || 50} phút
          </span>
        </div>
        
        <p className="new-exam-card-title-description" title={exam.title}>
          {exam.title}
        </p>
      </div>

      {/* Bottom buttons */}
      <div className="new-exam-card-actions">
        <button 
          className="new-exam-card-btn" 
          onClick={() => onSelect(exam.id)}
          style={{ '--btn-accent': accentColor }}
        >
          <span className="new-exam-card-btn-icon-wrapper">
            <FaPencilAlt className="new-exam-card-btn-icon" />
          </span>
          <span className="new-exam-card-btn-label">Luyện tập</span>
          <HiChevronRight className="new-exam-card-btn-chevron" />
        </button>

        <button 
          className="new-exam-card-btn" 
          onClick={() => onStart(exam.id)}
          style={{ '--btn-accent': accentColor }}
        >
          <span className="new-exam-card-btn-icon-wrapper">
            <HiClock className="new-exam-card-btn-icon" />
          </span>
          <span className="new-exam-card-btn-label">Thi thật</span>
          <HiChevronRight className="new-exam-card-btn-chevron" />
        </button>
      </div>
    </div>
  );
}
