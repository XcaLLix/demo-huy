import React, { useState, useRef, useEffect } from 'react';
import { 
  HiPlay, 
  HiPause, 
  HiVolumeUp, 
  HiVolumeOff, 
  HiPhotograph, 
  HiCog, 
  HiShare, 
  HiClock, 
  HiArrowsExpand 
} from 'react-icons/hi';

export default function HeroVideoPlayer({ videoUrl, courseTitle, instructorName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // Mute / Unmute Toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle Metadata / Time updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Seek
  const handleSeekChange = (e) => {
    if (!videoRef.current || !duration) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle play with spacebar when hovering or focused
      if (e.code === 'Space' && document.activeElement === videoRef.current) {
        e.preventDefault();
        togglePlay();
      }
      // Seek left/right
      if (videoRef.current && document.activeElement === videoRef.current) {
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, duration);
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  // Autohide controls logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Format Time Helper
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`fts-player ${isPlaying ? 'playing' : ''} ${showControls ? 'show-controls' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{
        border: '3px solid #000000',
        boxShadow: '8px 8px 0px #000000',
        borderRadius: '24px',
        overflow: 'hidden'
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
        tabIndex="0"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
      />

      {/* CUSTOM CONTROLS OVERLAY */}
      <div className="fts-player-overlay">
        {/* Top Bar */}
        <div className="fts-player-top">
          <div className="fts-player-top-left">
            <div className="fts-support-avatar fts-player-logo" style={{ fontSize: '12px', width: '32px', height: '32px' }}>
              EP
            </div>
            <div className="fts-player-title-box">
              <h4 className="fts-player-title">{courseTitle || 'Chuyên đề ôn luyện'}</h4>
              <span className="fts-player-subtitle">{instructorName || 'EduPath AI'}</span>
            </div>
          </div>
          <div className="fts-player-top-right">
            <button 
              className="fts-player-top-icon" 
              onClick={toggleMute}
              style={{ background: 'none', border: 'none', padding: 0 }}
              aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted ? <HiVolumeOff /> : <HiVolumeUp />}
            </button>
            <HiPhotograph className="fts-player-top-icon" title="Phụ đề (CC)" />
            <HiCog className="fts-player-top-icon" title="Cài đặt" />
          </div>
        </div>

        {/* Center Play Button */}
        <div className="fts-player-center">
          <button 
            className="fts-player-play-btn" 
            onClick={togglePlay}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <HiPause className="fts-player-play-icon" style={{ marginLeft: 0 }} />
            ) : (
              <HiPlay className="fts-player-play-icon" />
            )}
          </button>
        </div>

        {/* Bottom Bar Controls */}
        <div className="fts-player-bottom">
          <div className="fts-player-timeline-wrapper">
            <span className="fts-player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="fts-player-progress-bar">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progressPercent}
                onChange={handleSeekChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
              <div 
                className="fts-player-progress-fill" 
                style={{ width: `${progressPercent}%` }}
              >
                <div className="fts-player-progress-handle" />
              </div>
            </div>
          </div>

          <div className="fts-player-actions">
            <div className="fts-player-actions-left">
              <HiShare className="fts-player-action-icon" title="Chia sẻ" />
              <HiClock className="fts-player-action-icon" title="Lịch sử xem" />
              <div className="fts-player-mini-thumb" style={{ background: '#3b82f6', width: '32px', height: '18px' }} />
              <span style={{ color: '#EF4444', fontWeight: '900', fontSize: '12px', letterSpacing: '-1px' }}>YouTube</span>
            </div>
            <button 
              className="fts-player-fullscreen-btn" 
              onClick={toggleFullscreen}
              aria-label="Toàn màn hình"
            >
              <HiArrowsExpand />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
