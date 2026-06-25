import React, { useState } from 'react';
import { HiStar, HiBookOpen } from 'react-icons/hi';

export default function HeroBanner({ course, reviewsCount = 0 }) {
  const [descExpanded, setDescExpanded] = useState(false);

  const {
    title,
    description = '',
    instructor = {},
    rating = 5.0,
    curriculum = [],
    subject,
    badge,
    level,
    durationHours = 12
  } = course;

  // Description collapse/expand logic
  const isDescLong = description.length > 250;
  const displayedDesc = isDescLong && !descExpanded 
    ? `${description.slice(0, 250)}...` 
    : description;

  const totalSections = curriculum.length;

  return (
    <div className="fts-hero animate-in" style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #F3F1FF 0%, #E3DCFF 100%)',
      borderRadius: '24px',
      border: '3px solid #000000',
      boxShadow: '8px 8px 0px #000000',
      padding: '24px 36px 28px 36px',
      color: '#1A1A2E',
      minHeight: 'auto'
    }}>
      {/* Background blurs for a friendly glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 226, 89, 0.15)',
        filter: 'blur(45px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(244, 63, 94, 0.08)',
        filter: 'blur(55px)',
        pointerEvents: 'none'
      }} />

      <div className="fts-hero-grid" style={{ zIndex: 1, position: 'relative', gridTemplateColumns: '1fr' }}>
        {/* Left column content - now spanning full width */}
        <div className="fts-hero-left" style={{ textAlign: 'left' }}>
          
          {/* Badge & Subject Row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {subject && (
              <span style={{
                background: 'rgba(79, 63, 203, 0.08)',
                border: '1.5px solid rgba(79, 63, 203, 0.3)',
                color: '#4F3FCB',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {subject}
              </span>
            )}
            
            {badge && (
              <span style={{
                background: 'linear-gradient(90deg, #FFE259, #FFA751)',
                color: '#000000',
                border: '1.5px solid #000000',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '950',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '2px 2px 0px #000000'
              }}>
                ⭐ {badge}
              </span>
            )}

            {level && (
              <span style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: '1.5px solid rgba(0, 0, 0, 0.1)',
                color: '#4F3FCB',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {level}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="fts-hero-title" style={{
            fontSize: '30px',
            fontWeight: '950',
            color: '#1A1A2E',
            lineHeight: '1.25',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            maxWidth: '100%'
          }}>
            {title}
          </h1>

          {/* Description */}
          <p className="fts-hero-desc" style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#374151',
            marginBottom: '16px',
            fontWeight: '500',
            maxWidth: '100%'
          }}>
            {displayedDesc}
            {isDescLong && (
              <button 
                type="button"
                className="fts-hero-desc-expand-btn"
                onClick={() => setDescExpanded(!descExpanded)}
                style={{
                  background: 'rgba(79, 63, 203, 0.08)',
                  border: '1.5px solid rgba(79, 63, 203, 0.2)',
                  color: '#4F3FCB',
                  fontWeight: '800',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  marginLeft: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                {descExpanded ? 'Rút gọn' : 'Xem thêm'}
              </button>
            )}
          </p>

          {/* Author & Rating Group */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            {/* Instructor badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(79, 63, 203, 0.06)',
              border: '1.5px solid rgba(79, 63, 203, 0.15)',
              padding: '6px 14px',
              borderRadius: '50px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                color: '#fff',
                fontSize: '11px',
                border: '1.5px solid #fff'
              }}>
                {instructor?.name ? instructor.name.split(' ').pop().slice(0, 2).toUpperCase() : 'GV'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1A1A2E' }}>
                Giảng viên: <span style={{ color: '#4F3FCB' }}>{instructor?.name || 'EduPath Specialist'}</span>
              </span>
            </div>

            {/* Rating row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.03)',
              padding: '6px 14px',
              borderRadius: '50px',
              border: '1.5px solid rgba(0, 0, 0, 0.08)'
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#D97706' }}>{Number(rating).toFixed(1)}</span>
              <div style={{ display: 'flex', gap: '1px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <HiStar 
                    key={i} 
                    style={{
                      fontSize: '14px',
                      color: i < Math.round(rating) ? '#FBBF24' : 'rgba(0, 0, 0, 0.15)'
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '2px', fontWeight: '700' }}>
                ({reviewsCount} đánh giá)
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            paddingTop: '16px',
            borderTop: '1.5px dashed rgba(79, 63, 203, 0.25)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📚</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Bài học</span>
                <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#1A1A2E' }}>{totalSections} học phần</span>
              </div>
            </div>

            {durationHours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⏱️</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Thời lượng</span>
                  <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#1A1A2E' }}>{durationHours} giờ học</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Đầu ra</span>
                <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#1A1A2E' }}>Cam kết 8+ THPTQG</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
