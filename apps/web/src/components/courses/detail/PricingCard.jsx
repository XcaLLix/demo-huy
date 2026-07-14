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
      text: '#1E1B4B',
      accent: '#4F46E5'
    };
  }
  if (s.includes('lý') || s.includes('vật lý') || s.includes('địa lý')) {
    return {
      text: '#064E3B',
      accent: '#059669'
    };
  }
  if (s.includes('anh') || s.includes('tiếng anh')) {
    return {
      text: '#7C2D12',
      accent: '#EA580C'
    };
  }
  if (s.includes('hóa')) {
    return {
      text: '#9D174D',
      accent: '#EC4899'
    };
  }
  if (s.includes('sinh')) {
    return {
      text: '#581C87',
      accent: '#7C3AED'
    };
  }
  if (s.includes('văn') || s.includes('ngữ văn') || s.includes('sử') || s.includes('lịch sử') || s.includes('gdcd')) {
    return {
      text: '#075985',
      accent: '#0284C7'
    };
  }
  // Default style (purple)
  return {
    text: '#3B2EA6',
    accent: '#4F3FCB'
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
    <div className="fts-pricing animate-in">
      {/* Price block */}
      <div className="fts-pricing-price-row">
        <span className="fts-pricing-sale">
          {formatPrice(priceSale)}
        </span>
        {price > priceSale && (
          <>
            <span className="fts-pricing-original">
              {formatPrice(price)}
            </span>
            <span className="fts-pricing-discount-badge">
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
          backgroundColor: isBtnHovered ? styles.text : styles.accent,
          borderColor: styles.text,
          borderWidth: '2.5px',
          borderStyle: 'solid',
          color: '#ffffff',
          transition: 'all 0.2s ease',
          transform: isBtnHovered ? 'scale(1.03)' : 'scale(1)',
          boxShadow: isBtnHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {isOwned ? (
          <HiPlay style={{ fontSize: '18px', color: '#ffffff' }} />
        ) : (
          <HiShoppingCart style={{ fontSize: '18px', color: '#ffffff' }} />
        )}
        <span>{isOwned ? 'Vào học ngay' : 'Thêm giỏ hàng'}</span>
      </button>

      <hr className="fts-pricing-divider" />

      {/* Includes checklist */}
      <div className="fts-pricing-includes">
        <h4 className="fts-pricing-includes-title">Khoá học này bao gồm</h4>
        <ul className="fts-pricing-checklist">
          <li className="fts-pricing-checklist-item">
            <HiCheck className="fts-pricing-check-icon" style={{ color: styles.accent }} />
            <span className="fts-pricing-check-label">Lộ trình chất lượng cam kết đầu ra</span>
          </li>
          <li className="fts-pricing-checklist-item">
            <HiCode className="fts-pricing-check-icon" style={{ color: styles.accent }} />
            <span className="fts-pricing-check-label">Học phần chi tiết, có bài tập để luyện tập hàng ngày</span>
          </li>
          <li className="fts-pricing-checklist-item">
            <HiQuestionMarkCircle className="fts-pricing-check-icon" style={{ color: styles.accent }} />
            <span className="fts-pricing-check-label">Có nhóm hỏi đáp thắc mắc 24/7</span>
          </li>
          <li className="fts-pricing-checklist-item">
            <HiDocumentText className="fts-pricing-check-icon" style={{ color: styles.accent }} />
            <span className="fts-pricing-check-label">Tài liệu tổng hợp đầy đủ</span>
          </li>
        </ul>
      </div>

      {/* Preview note */}
      <p className="fts-pricing-preview-note">
        Bạn đang xem preview của khóa học này. Để truy cập đầy đủ nội dung, vui lòng đăng ký khóa học.
      </p>
    </div>
  );
}
