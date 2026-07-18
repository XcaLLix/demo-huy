import React from 'react';
import studyImg from '../assets/student_3d_study_fixed.png';

export default function FooterSunMascot() {
  return (
    <div
      style={{ 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 0 
      }}
    >
      <div 
        className="lp-mascot-study-wrap"
        style={{ 
          position: 'absolute', 
          right: '-20px', 
          bottom: '-60px', 
          width: '740px', 
          height: '740px', 
          pointerEvents: 'auto' 
        }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <img 
            src={studyImg} 
            alt="Học sinh 3D ôn thi" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain', 
              filter: 'drop-shadow(0 25px 40px rgba(0, 0, 0, 0.15))'
            }} 
          />
        </div>
      </div>
    </div>
  );
}
