import React, { useState, useMemo } from 'react';
import { HiCheckCircle, HiPlay, HiLockClosed, HiChevronDown, HiChevronUp } from 'react-icons/hi';

export default function LessonSidebar({
  curriculum = [],
  currentLessonId,
  onSelectLesson,
  completedLessons = [],
  isOwned,
  courseTitle = 'Khóa học'
}) {
  const [filterMode, setFilterMode] = useState('ALL');
  const [openChapters, setOpenChapters] = useState({ 0: true });

  const toggleChapter = (idx) => {
    setOpenChapters(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const allLessons = useMemo(() => {
    return curriculum.flatMap(chapter => chapter.lessons) || [];
  }, [curriculum]);

  const totalCount = allLessons.length;
  const completedCount = useMemo(() => {
    return allLessons.filter(lesson => 
      completedLessons.includes(Number(lesson.id)) || completedLessons.includes(lesson.id.toString())
    ).length;
  }, [allLessons, completedLessons]);

  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDownloadMaterials = () => {
    window.dispatchEvent(new CustomEvent('edupath-download-materials'));
  };

  return (
    <div className="lesson-sidebar">
      {/* Sidebar header and filters are hidden to match layout screenshot */}
      <div className="lesson-sidebar__chapters-list" style={{ flex: 1, overflowY: 'auto' }}>
        {curriculum.map((chapter, chapIdx) => {
          const isOpen = !!openChapters[chapIdx];
          const filteredLessons = (chapter.lessons || []).filter(l => {
            if (filterMode === 'INCOMPLETE') {
              return !completedLessons.includes(Number(l.id)) && !completedLessons.includes(l.id.toString());
            }
            return true;
          });

          if (filteredLessons.length === 0 && filterMode !== 'ALL') return null;

          const completedInChap = filteredLessons.filter(l => 
            completedLessons.includes(Number(l.id)) || completedLessons.includes(l.id.toString())
          ).length;
          const totalInChap = filteredLessons.length;

          return (
            <div key={chapIdx} className="sidebar-chapter" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div 
                className="sidebar-chapter__header" 
                onClick={() => toggleChapter(chapIdx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: '#faf8f5',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderBottom: isOpen ? '1px solid #f1f5f9' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#000000' }}>
                    {chapIdx + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#000000' }}>
                    {chapter.title || `Phần ${chapIdx}`}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>
                    {completedInChap}/{totalInChap}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>
                    00:00
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                    {isOpen ? <HiChevronUp size={16} /> : <HiChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {isOpen && (
                <div className="sidebar-chapter__lessons animate-in" style={{ background: '#ffffff' }}>
                  {filteredLessons.map((lesson) => {
                    const isCurrent = currentLessonId?.toString() === lesson.id.toString();
                    const isCompleted = completedLessons.includes(Number(lesson.id)) || completedLessons.includes(lesson.id.toString());
                    const isLocked = false; // Always unlocked for testing and seamless navigation

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => !isLocked && onSelectLesson && onSelectLesson(lesson)}
                        className={`sidebar-lesson-row ${isCurrent ? 'sidebar-lesson-row--current' : ''} ${isLocked ? 'sidebar-lesson-row--locked' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px 12px 24px',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          background: isCurrent ? '#f8fafc' : 'transparent',
                          borderBottom: '1px solid #f8fafc',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div className="sidebar-lesson-row__left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span className="sidebar-lesson-row__icon-box" style={{ color: isCurrent ? '#3b82f6' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                            {isLocked ? (
                              <HiLockClosed style={{ color: '#ef4444' }} />
                            ) : isCompleted ? (
                              <HiCheckCircle style={{ color: '#10b981' }} />
                            ) : (
                              <HiPlay size={18} style={{ color: isCurrent ? '#3b82f6' : '#94a3b8' }} />
                            )}
                          </span>
                          <span 
                            className="sidebar-lesson-row__title" 
                            title={lesson.title}
                            style={{
                              fontSize: '12.5px',
                              fontWeight: isCurrent ? '700' : '500',
                              color: isCurrent ? '#2563eb' : '#334155',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'left'
                            }}
                          >
                            {lesson.title}
                          </span>
                        </div>
                        <span 
                          className="sidebar-lesson-row__duration"
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#94a3b8',
                            marginLeft: '12px'
                          }}
                        >
                          00:00
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
