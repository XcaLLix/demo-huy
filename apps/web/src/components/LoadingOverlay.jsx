import React from 'react';

export default function LoadingOverlay({ message = 'Đang xử lý dữ liệu...' }) {
  const letters = ['E', 'd', 'u', 'P', 'a', 't', 'h'];

  return (
    <div className="edupath-loader-overlay">
      <div className="edupath-loader-container">
        {/* Animated dual spinner */}
        <div className="edupath-spinner-wrapper">
          <div className="edupath-spinner"></div>
          <div className="edupath-spinner-inner"></div>
        </div>

        {/* Animated wave text with multicolor letters */}
        <div className="edupath-wave-text">
          {letters.map((char, index) => (
            <span key={index} className="edupath-wave-letter">
              {char}
            </span>
          ))}
        </div>

        {/* Dynamic status/loading message */}
        {message && (
          <p style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            letterSpacing: '0.2px'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
