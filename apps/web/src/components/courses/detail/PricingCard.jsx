import React, { useState } from 'react';
import { 
  HiShoppingCart, 
  HiCheck, 
  HiCode, 
  HiQuestionMarkCircle, 
  HiDocumentText,
  HiPlay
} from 'react-icons/hi';

const getSubjectStyle = (subj) => {
  const s = (subj || '').toLowerCase();
  if (s.includes('toán')) {
    return {
      bgGrad: 'linear-gradient(135deg, #EEF2FF 0%, #D2DEFF 100%)',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      text: '#1E1B4B',
      accent: '#4F46E5',
      accentBg: '#E0E7FF'
    };
  }
  if (s.includes('lý') || s.includes('vật lý') || s.includes('địa lý')) {
    return {
      bgGrad: 'linear-gradient(135deg, #ECFDF5 0%, #C6F6D5 100%)',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#064E3B',
      accent: '#059669',
      accentBg: '#D1FAE5'
    };
  }
  if (s.includes('anh') || s.includes('tiếng anh')) {
    return {
      bgGrad: 'linear-gradient(135deg, #FFF7ED 0%, #FFE4C4 100%)',
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#7C2D12',
      accent: '#EA580C',
      accentBg: '#FFEDD5'
    };
  }
  if (s.includes('hóa')) {
    return {
      bgGrad: 'linear-gradient(135deg, #FDF2F8 0%, #FBCFE8 100%)',
      bg: '#FDF2F8',
      border: '#FBCFE8',
      text: '#9D174D',
      accent: '#EC4899',
      accentBg: '#FCE7F3'
    };
  }
  if (s.includes('sinh')) {
    return {
      bgGrad: 'linear-gradient(135deg, #FAF5FF 0%, #E8D2FF 100%)',
      bg: '#FAF5FF',
      border: '#E9D5FF',
      text: '#581C87',
      accent: '#7C3AED',
      accentBg: '#F3E8FF'
    };
  }
  if (s.includes('văn') || s.includes('ngữ văn') || s.includes('sử') || s.includes('lịch sử') || s.includes('gdcd')) {
    return {
      bgGrad: 'linear-gradient(135deg, #F0F9FF 0%, #C4E8FD 100%)',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      text: '#075985',
      accent: '#0284C7',
      accentBg: '#E0F2FE'
    };
  }
  // Default style (purple)
  return {
    bgGrad: 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)',
    bg: '#ffffff',
    border: '#E5E7EB',
    text: '#1F2937',
    accent: '#4B5563',
    accentBg: '#F3F4F6'
  };
};

export default function PricingCard({ course, isOwned, onEnroll }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const {
    price = 0,
    priceSale = 0,
    subject
  } = course;

  // Format currency helper
  const formatPrice = (val) => {
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  // Calculate discount percentage
  const discountPercent = price > 0 && priceSale < price
    ? Math.round(((price - priceSale) / price) * 100)
    : 0;

  const handleAction = () => {
    if (isOwned) {
      onEnroll('learn');
    } else {
      onEnroll('cart');
    }
  };

  const styles = getSubjectStyle(subject);

  return (
    <div className="fts-pricing animate-in" style={{
      border: '3px solid #000000',
      boxShadow: '8px 8px 0px #000000',
      borderRadius: '24px',
      background: styles.bgGrad,
      color: styles.text,
      padding: '28px',
      boxSizing: 'border-box'
    }}>
      {/* Price block */}
      <div className="fts-pricing-price-row">
        <span className="fts-pricing-sale" style={{ color: styles.text, fontWeight: '950' }}>
          {formatPrice(priceSale)}
        </span>
        {price > priceSale && (
          <>
            <span className="fts-pricing-original" style={{ color: styles.text, opacity: 0.6, fontWeight: 'bold' }}>
              {formatPrice(price)}
            </span>
            <span className="fts-pricing-discount-badge" style={{
              backgroundColor: styles.accentBg,
              color: styles.text,
              border: '2px solid #000000',
              fontWeight: '900',
              boxShadow: '1.5px 1.5px 0px #000000'
            }}>
              Giảm {discountPercent}%
            </span>
          </>
        )}
      </div>

      {/* CTA Button */}
      <button 
        type="button" 
        className="fts-pricing-cta"
        onClick={handleAction}
        onMouseEnter={() => setIsBtnHovered(true)}
        onMouseLeave={() => setIsBtnHovered(false)}
        style={{
          backgroundColor: isBtnHovered ? '#000000' : styles.accent,
          borderColor: '#000000',
          borderWidth: '3px',
          borderStyle: 'solid',
          color: '#ffffff',
          transition: 'all 0.15s ease',
          transform: isBtnHovered ? 'translate(2px, 2px)' : 'none',
          boxShadow: isBtnHovered ? '2px 2px 0px #000000' : '5px 5px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          borderRadius: '12px',
          fontWeight: '950',
          fontSize: '15px',
          height: '52px',
          width: '100%'
        }}
      >
        {isOwned ? (
          <HiPlay style={{ fontSize: '18px', color: '#ffffff' }} />
        ) : (
          <HiShoppingCart style={{ fontSize: '18px', color: '#ffffff' }} />
        )}
        <span>{isOwned ? 'Vào học ngay' : 'Thêm giỏ hàng'}</span>
      </button>

      <hr className="fts-pricing-divider" style={{ borderColor: '#000000', borderWidth: '1.5px', opacity: 0.15, margin: '20px 0' }} />

      {/* Includes checklist */}
      <div className="fts-pricing-includes">
        <h4 className="fts-pricing-includes-title" style={{ color: styles.text, fontWeight: '900', fontSize: '14.5px', marginBottom: '14px' }}>
          Khoá học này bao gồm
        </h4>
        <ul className="fts-pricing-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0, listStyle: 'none' }}>
          <li className="fts-pricing-checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiCheck className="fts-pricing-check-icon" style={{ color: styles.text, fontSize: '18px', flexShrink: 0 }} />
            <span className="fts-pricing-check-label" style={{ color: styles.text, fontSize: '13.5px', fontWeight: 'bold' }}>
              Lộ trình chất lượng cam kết đầu ra
            </span>
          </li>
          <li className="fts-pricing-checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiCheck className="fts-pricing-check-icon" style={{ color: styles.text, fontSize: '18px', flexShrink: 0 }} />
            <span className="fts-pricing-check-label" style={{ color: styles.text, fontSize: '13.5px', fontWeight: 'bold' }}>
              Học phần chi tiết, có bài tập hàng ngày
            </span>
          </li>
          <li className="fts-pricing-checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiCheck className="fts-pricing-check-icon" style={{ color: styles.text, fontSize: '18px', flexShrink: 0 }} />
            <span className="fts-pricing-check-label" style={{ color: styles.text, fontSize: '13.5px', fontWeight: 'bold' }}>
              Có nhóm hỏi đáp thắc mắc 24/7
            </span>
          </li>
          <li className="fts-pricing-checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiCheck className="fts-pricing-check-icon" style={{ color: styles.text, fontSize: '18px', flexShrink: 0 }} />
            <span className="fts-pricing-check-label" style={{ color: styles.text, fontSize: '13.5px', fontWeight: 'bold' }}>
              Tài liệu tổng hợp đầy đủ
            </span>
          </li>
        </ul>
      </div>

      {/* Preview note */}
      <p className="fts-pricing-preview-note" style={{ color: styles.text, opacity: 0.7, fontSize: '11px', marginTop: '16px', textAlign: 'center', fontWeight: 'bold' }}>
        Bạn đang xem preview của khóa học này. Để truy cập đầy đủ nội dung, vui lòng đăng ký khóa học.
      </p>
    </div>
  );
}
