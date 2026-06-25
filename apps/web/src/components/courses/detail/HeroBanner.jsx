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
      background: 'linear-gradient(135deg, #4F3FCB 0%, #2D2285 100%)',
      borderRadius: '24px',
      border: '3px solid #000000',
      boxShadow: '8px 8px 0px #000000',
      padding: '44px 44px 48px 44px',
      color: '#fff'
    }}>
      {/* Background abstract blurs for depth */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 226, 89, 0.08)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(124, 58, 237, 0.15)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div className="fts-hero-grid" style={{ zIndex: 1, position: 'relative' }}>
        {/* Left column content */}
        <div className="fts-hero-left" style={{ textAlign: 'left' }}>
          
          {/* Badge & Subject Row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {subject && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(6px)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                color: '#FFFFFF',
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
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#FFE259',
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
            fontSize: '34px',
            fontWeight: '950',
            color: '#FFFFFF',
            lineHeight: '1.25',
            marginBottom: '16px',
            textShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
            letterSpacing: '-0.02em',
            maxWidth: '100%'
          }}>
            {title}
          </h1>

          {/* Description */}
          <p className="fts-hero-desc" style={{
            fontSize: '14.5px',
            lineHeight: '1.65',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: '24px',
            fontWeight: '500',
            maxWidth: '640px'
          }}>
            {displayedDesc}
            {isDescLong && (
              <button 
                type="button"
                className="fts-hero-desc-expand-btn"
                onClick={() => setDescExpanded(!descExpanded)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
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
            marginBottom: '28px'
          }}>
            {/* Instructor badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
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
                border: '1.5px solid rgba(255, 255, 255, 0.6)'
              }}>
                {instructor?.name ? instructor.name.split(' ').pop().slice(0, 2).toUpperCase() : 'GV'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                Giảng viên: {instructor?.name || 'EduPath Specialist'}
              </span>
            </div>

            {/* Rating row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '6px 14px',
              borderRadius: '50px',
              border: '1.5px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#FFE259' }}>{Number(rating).toFixed(1)}</span>
              <div style={{ display: 'flex', gap: '1px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <HiStar 
                    key={i} 
                    style={{
                      fontSize: '14px',
                      color: i < Math.round(rating) ? '#FFE259' : 'rgba(255, 255, 255, 0.2)'
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '2px', fontWeight: '700' }}>
                ({reviewsCount} đánh giá)
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            paddingTop: '20px',
            borderTop: '1.5px dashed rgba(255, 255, 255, 0.2)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📚</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase' }}>Bài học</span>
                <span style={{ fontSize: '13.5px', fontWeight: '900' }}>{totalSections} học phần</span>
              </div>
            </div>

            {durationHours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⏱️</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase' }}>Thời lượng</span>
                  <span style={{ fontSize: '13.5px', fontWeight: '900' }}>{durationHours} giờ học</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase' }}>Đầu ra</span>
                <span style={{ fontSize: '13.5px', fontWeight: '900' }}>Cam kết 8+ THPTQG</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right column spacing (reserved for overlapping video player) */}
        <div style={{ pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
