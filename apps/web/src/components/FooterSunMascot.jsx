import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

const getSpikePath = () => {
  const points = [];
  const numSpikes = 36;
  const cx = 31.75;
  const cy = 31.75;
  const rMin = 25.5;
  const rMax = 31.2;
  for (let i = 0; i < numSpikes; i++) {
    const angle1 = (i * 2 * Math.PI) / numSpikes - Math.PI / 2;
    const angle2 = ((i + 0.5) * 2 * Math.PI) / numSpikes - Math.PI / 2;
    points.push(`${(cx + rMax * Math.cos(angle1)).toFixed(2)} ${(cy + rMax * Math.sin(angle1)).toFixed(2)}`);
    points.push(`${(cx + rMin * Math.cos(angle2)).toFixed(2)} ${(cy + rMin * Math.sin(angle2)).toFixed(2)}`);
  }
  return `M ${points.join(' L ')} Z`;
};
const spikePath = getSpikePath();

export default function FooterSunMascot({ 
  dinoText = 'Mệt thì nghỉ một chút, còn khỏe thì chiến tiếp cùng EduPath nha bạn.', 
  currentDinoMessage = 'Mệt thì nghỉ một chút, còn khỏe thì chiến tiếp cùng EduPath nha bạn.',
  isSmiling = false
}) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isMouthOpenAuto, setIsMouthOpenAuto] = useState(false);
  const showSmile = isSmiling || isCardHovered || isHovered || isMouthOpenAuto;
  const containerRef = useRef(null);
  const mascotRef = useRef(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const springConfig = { damping: 20, stiffness: 180, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const faceX = useTransform(smoothX, [-600, 600], [-2.5, 2.5]);
  const faceY = useTransform(smoothY, [-600, 600], [-2, 2]);
  const rotate = useTransform(smoothX, [-500, 500], [-5, 5]);

  useEffect(() => {
    if (!mounted) return;

    const handleGlobalMouseMove = (e) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mounted]);

  useEffect(() => {
    const handleHeroSmile = (e) => {
      setIsCardHovered(e.detail);
    };
    window.addEventListener('hero-smile', handleHeroSmile);
    return () => window.removeEventListener('hero-smile', handleHeroSmile);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Talk periodically: toggle open/close 6 times every 7.5 seconds
    const runTalking = () => {
      let count = 0;
      const talkInterval = setInterval(() => {
        setIsMouthOpenAuto(prev => !prev);
        count++;
        if (count >= 6) {
          clearInterval(talkInterval);
          setIsMouthOpenAuto(false);
        }
      }, 350);
    };

    // Trigger talk immediately after 2 seconds
    const initialDelay = setTimeout(runTalking, 2000);
    
    // Regular interval
    const mainTimer = setInterval(runTalking, 7500);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(mainTimer);
    };
  }, [mounted]);

  if (!mounted) return <div style={{ height: '320px' }} />; 

  return (
    <div 
      style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      ref={containerRef}
    >
      <div className="lp-mascot-sun-wrap" style={{ pointerEvents: 'auto' }}>
        {/* Speech Bubble */}
        <div className="lp-sun-speech-bubble">
          {dinoText}
          <div className="lp-sun-speech-bubble-arrow" />
        </div>

        {/* Sun mascot */}
        <motion.div
          ref={mascotRef}
          style={{ rotate, originY: "100%", width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <svg viewBox="0 0 63 63" fill="none" className="lp-cute-sun" style={{ overflow: 'visible' }}>
            {/* Symmetrical Sun Rays Path */}
            <path transform="translate(0 3)" d={spikePath} fill="#F3A20F" />
            

            
            {/* Original Inner Face circle */}
            <path transform="translate(0 3)" d="M31.7666 7.90735C18.6034 7.90737 7.93262 18.5781 7.93262 31.7413C7.93264 44.9045 18.6034 55.5753 31.7666 55.5753C44.9298 55.5753 55.6006 44.9045 55.6006 31.7413C55.6006 18.5781 44.9298 7.90735 31.7666 7.90735Z" fill="#F3A20F" stroke="#1d3c29" strokeWidth="0.8" />
            
            {/* Original Animated Face Container */}
            <motion.g style={{ x: faceX, y: faceY }}>
              <g transform="translate(27, 20) scale(0.6)">
                {/* Left Eye */}
                <circle cx="13.7" cy="2" r="1.9" fill="#1d3c29" />
                
                {/* Right Eye (Winks on Hover) */}
                {isHovered ? (
                  <path d="M0 2 Q 2 4 4 2" stroke="#1d3c29" strokeWidth="0.8" strokeLinecap="round" fill="none" transform="translate(0, 0.5)" />
                ) : (
                  <circle cx="2" cy="2" r="1.9" fill="#1d3c29" />
                )}
                
                {/* Mouth */}
                {showSmile ? (
                  <g>
                    {/* Mouth Interior (Pink/red tongue area) */}
                    <path 
                      d="M 4.36 9.0 C 6.0 9.5 13.0 8.5 14.74 8.0 C 14.0 13.5 11.5 15.5 8.99 15.5 C 6.5 15.5 4.8 13.5 4.36 9.0 Z" 
                      fill="#FF7B90" 
                      stroke="#1d3c29" 
                      strokeWidth="1.0" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* Teeth (White upper band) */}
                    <path 
                      d="M 4.36 9.0 C 6.0 9.5 13.0 8.5 14.74 8.0 C 14.0 11.0 11.0 11.5 8.99 11.5 C 7.0 11.5 4.8 11.0 4.36 9.0 Z" 
                      fill="#FFFFFF" 
                      stroke="#1d3c29" 
                      strokeWidth="1.0" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </g>
                ) : (
                  <path d="M4.36526 10.0526C5.48807 11.3236 7.37792 12.4373 8.99134 12.3823C10.3455 12.3362 11.3858 12.1855 12.582 11.4026C13.4381 10.8424 13.9967 10.0329 14.7406 8.66282" fill="none" stroke="#1d3c29" strokeWidth="0.8" strokeLinecap="round" />
                )}
              </g>
            </motion.g>
          </svg>
        </motion.div>

      </div>
    </div>
  );
}
