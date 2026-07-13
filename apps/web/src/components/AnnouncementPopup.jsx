import { useState, useEffect } from 'react';
import { HiX, HiDuplicate, HiCheck } from 'react-icons/hi';
import DOMPurify from 'dompurify';
import { toast } from '../utils/toast';

export default function AnnouncementPopup({ announcement, onClose }) {
  const [copied, setCopied] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (announcement) {
      // Small timeout to trigger entry animation transition
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  if (!announcement) return null;

  const handleCopyVoucher = () => {
    if (!announcement.voucherCode) return;
    navigator.clipboard.writeText(announcement.voucherCode);
    setCopied(true);
    toast('Đã sao chép mã giảm giá thành công!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePopup = () => {
    if (dontShowAgain && announcement.allowHide) {
      const hideDurationMs = announcement.hideDurationHours * 60 * 60 * 1000;
      const hideUntil = Date.now() + hideDurationMs;
      localStorage.setItem(`announcement_${announcement.id}_hide_until`, String(hideUntil));
    }
    
    // Trigger fade-out / closing animation state
    setIsVisible(false);
    
    // Call parent onClose after transition finishes
    setTimeout(() => {
      onClose();
    }, 250);
  };

  const {
    id,
    title,
    type,
    content,
    bannerUrl,
    voucherCode,
    showCopyButton,
    buttonText,
    buttonUrl,
    buttonTarget,
    allowHide,
    hideDurationHours,
    animation = 'fade'
  } = announcement;

  // Safe Sanitized HTML
  const sanitizedContent = DOMPurify.sanitize(content);

  // Animation Styles
  const getAnimationStyles = () => {
    if (!isVisible) {
      const map = {
        fade: { opacity: 0, transform: 'scale(0.95)' },
        zoom: { opacity: 0, transform: 'scale(0.5)' },
        slide: { opacity: 0, transform: 'translateY(-100px)' },
        bounce: { opacity: 0, transform: 'scale(0.7) translateY(50px)' }
      };
      return map[animation] || { opacity: 0 };
    } else {
      if (animation === 'bounce') {
        return {
          opacity: 1,
          transform: 'scale(1) translateY(0)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
      }
      return {
        opacity: 1,
        transform: 'scale(1) translateY(0)',
        transition: 'all 0.25s ease-out'
      };
    }
  };

  // Badge styles
  const getTypeColor = (t) => {
    const map = {
      EVENT: '#DBEAFE',
      VOUCHER: '#FEE2E2',
      PROMOTION: '#FEF3C7',
      MAINTENANCE: '#F3F4F6',
      NEWS: '#E0E7FF'
    };
    return map[t] || '#FFFFFF';
  };

  const getTypeLabel = (t) => {
    const map = {
      EVENT: 'SỰ KIỆN',
      VOUCHER: 'MÃ GIẢM GIÁ',
      PROMOTION: 'KHUYẾN MÃI',
      MAINTENANCE: 'BẢO TRÌ',
      NEWS: 'TIN TỨC'
    };
    return map[t] || t;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Outer Click closes the popup */}
      <div 
        style={{ position: 'absolute', inset: 0 }} 
        onClick={handleClosePopup}
      />

      {/* Modal Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#FCFBFA',
        border: '3.5px solid #2D3229',
        borderRadius: '16px',
        boxShadow: '8px 8px 0px #2D3229',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...getAnimationStyles()
      }}>
        
        {/* Absolute Close X Button */}
        <button 
          onClick={handleClosePopup}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '2px solid #2D3229',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '2px 2px 0px #2D3229',
            transition: 'all 0.1s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-1px, -1px)';
            e.currentTarget.style.boxShadow = '3px 3px 0px #2D3229';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '2px 2px 0px #2D3229';
          }}
        >
          <HiX style={{ fontSize: '18px', color: '#2D3229' }} />
        </button>

        {/* Banner Image */}
        {bannerUrl && (
          <div style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderBottom: '3.5px solid #2D3229' }}>
            <img 
              src={bannerUrl} 
              alt={title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
          
          {/* Header Row: Badge & Type */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1.5px solid #2D3229',
              fontSize: '10.5px',
              fontWeight: '900',
              backgroundColor: getTypeColor(type)
            }}>
              {getTypeLabel(type)}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '20px',
            fontWeight: '950',
            color: '#1C2B17',
            margin: 0,
            lineHeight: '1.3'
          }}>
            {title}
          </h2>

          {/* HTML Description Content */}
          <div 
            className="announcement-rich-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            style={{
              fontSize: '13.5px',
              color: '#334155',
              lineHeight: '1.6',
              fontWeight: '600'
            }}
          />

          {/* Voucher Box */}
          {voucherCode && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFDF0',
              border: '2px dashed #D97706',
              borderRadius: '12px',
              padding: '12px 16px',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#B45309', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>
                  Mã giảm giá độc quyền:
                </span>
                <strong style={{ fontSize: '16px', color: '#D97706', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {voucherCode}
                </strong>
              </div>
              {showCopyButton && (
                <button
                  onClick={handleCopyVoucher}
                  style={{
                    background: '#FFF',
                    border: '2px solid #2D3229',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0px #2D3229',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-1px, -1px)';
                    e.currentTarget.style.boxShadow = '3px 3px 0px #2D3229';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '2px 2px 0px #2D3229';
                  }}
                >
                  {copied ? <><HiCheck /> Đã sao chép</> : <><HiDuplicate /> Sao chép</>}
                </button>
              )}
            </div>
          )}

          {/* Action Button */}
          {buttonUrl && buttonText && (
            <a
              href={buttonUrl}
              target={buttonTarget}
              rel="noopener noreferrer"
              onClick={handleClosePopup}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                background: '#FFE259',
                color: '#2D3229',
                border: '2.5px solid #2D3229',
                borderRadius: '10px',
                fontSize: '14.5px',
                fontWeight: '900',
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '3.5px 3.5px 0px #2D3229',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-1.5px, -1.5px)';
                e.currentTarget.style.boxShadow = '5px 5px 0px #2D3229';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '3.5px 3.5px 0px #2D3229';
              }}
            >
              {buttonText}
            </a>
          )}
        </div>

        {/* Footer controls: Hide Checkbox & Close button */}
        <div style={{
          borderTop: '2px solid #E2E8F0',
          padding: '16px 24px',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {allowHide ? (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#475569',
              fontWeight: '700',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input 
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Không hiển thị lại trong {hideDurationHours} giờ
            </label>
          ) : <div />}

          <button
            onClick={handleClosePopup}
            style={{
              padding: '8px 18px',
              background: '#FFF',
              border: '2px solid #2D3229',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '2.5px 2.5px 0px #2D3229',
              transition: 'all 0.1s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-1px, -1px)';
              e.currentTarget.style.boxShadow = '3.5px 3.5px 0px #2D3229';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '2.5px 2.5px 0px #2D3229';
            }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
