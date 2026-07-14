import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiArrowsExpand, HiOutlineClock, HiClock } from 'react-icons/hi';
import { FiMinimize } from 'react-icons/fi';
import UpNextOverlay from './UpNextOverlay';

const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  let videoId = '';
  if (url.includes('youtube.com/watch')) {
    const params = new URLSearchParams(url.split('?')[1]);
    videoId = params.get('v');
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : url;
};

const VideoPlayer = forwardRef(({ videoUrl, title, onEnded, onTimeUpdate, lessonId, nextLessonName, chapters = [] }, ref) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpNext, setShowUpNext] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Expose video element to parent
  useImperativeHandle(ref, () => videoRef.current);

  const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('/embed/'));

  // Load last position
  useEffect(() => {
    if (isYouTube) {
      setLoading(false);
      return;
    }
    if (!videoRef.current || !lessonId) return;
    const key = `lesson_pos_${lessonId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      videoRef.current.currentTime = Number(saved);
    }
    setLoading(true);
    setShowUpNext(false);
  }, [videoUrl, lessonId, isYouTube]);

  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime;
    setCurrentTime(time);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
    if (lessonId) {
      localStorage.setItem(`lesson_pos_${lessonId}`, Math.floor(time).toString());
    }
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
    setLoading(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (nextLessonName) {
      setShowUpNext(true);
    } else if (onEnded) {
      onEnded();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(prev => {
          const next = Math.min(1, prev + 0.1);
          if (videoRef.current) videoRef.current.volume = next;
          return next;
        });
        setIsMuted(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(prev => {
          const next = Math.max(0, prev - 0.1);
          if (videoRef.current) videoRef.current.volume = next;
          return next;
        });
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheaterMode();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
  };

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const playerEl = videoRef.current?.parentElement;
    if (!playerEl) return;

    if (!document.fullscreenElement) {
      playerEl.requestFullscreen().catch(err => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheaterMode = () => {
    const nextMode = !isTheaterMode;
    setIsTheaterMode(nextMode);
    window.dispatchEvent(new CustomEvent('edupath-theater-mode', { detail: { isTheaterMode: nextMode } }));
  };

  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (err) {
      console.warn('PiP failed:', err);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getBufferedPct = () => {
    if (!videoRef.current || duration === 0) return 0;
    const buffered = videoRef.current.buffered;
    if (buffered.length === 0) return 0;
    return (buffered.end(buffered.length - 1) / duration) * 100;
  };

  const handleTimelineChange = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  return (
    <div
      className={`custom-player ${isTheaterMode ? 'custom-player--theater' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{
        position: 'relative',
        width: '100%',
        background: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        aspectRatio: '16/9'
      }}
    >
      {loading && (
        <div className="custom-player__loading">
          <div className="custom-player__spinner">
            <HiClock className="custom-player__loading-spinner" />
            <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginTop: '10px' }}>Đang chuẩn bị bài giảng...</span>
          </div>
        </div>
      )}

      {showUpNext && (
        <UpNextOverlay
          nextLessonName={nextLessonName}
          onCountdownFinished={() => {
            setShowUpNext(false);
            if (onEnded) onEnded();
          }}
          onCancel={() => setShowUpNext(false)}
        />
      )}

      {isYouTube ? (
        <iframe
          src={getYouTubeEmbedUrl(videoUrl)}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: '100%', height: '100%', borderRadius: '16px' }}
        />
      ) : (
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={() => setLoading(false)}
          onEnded={handleVideoEnded}
          onClick={togglePlay}
          style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
        />
      )}

      {showControls && !showUpNext && !isYouTube && (
        <div className="custom-player__controls animate-in">
          <div className="custom-player__timeline-wrapper">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleTimelineChange}
              className="custom-player__timeline"
              style={{
                background: `linear-gradient(to right, var(--emerald-primary) 0%, var(--emerald-primary) ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255, 255, 255, 0.2) ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, rgba(255, 255, 255, 0.2) ${getBufferedPct()}%, rgba(255, 255, 255, 0.08) ${getBufferedPct()}%, rgba(255, 255, 255, 0.08) 100%)`
              }}
            />
            {chapters.map((ch, idx) => {
              const pct = (ch.timeSeconds / duration) * 100;
              return (
                <div
                  key={idx}
                  className="custom-player__chapter-marker"
                  style={{ left: `${pct}%` }}
                  title={ch.title}
                />
              );
            })}
          </div>

          <div className="custom-player__buttons-row">
            <button type="button" onClick={togglePlay} className="custom-player__btn">
              {isPlaying ? <HiPause /> : <HiPlay />}
            </button>

            <span className="custom-player__time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="custom-player__volume-group">
              <button type="button" onClick={toggleMute} className="custom-player__btn">
                {isMuted ? <HiVolumeOff /> : <HiVolumeUp />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="custom-player__volume-slider"
              />
            </div>

            <div style={{ flex: 1 }} />

            <div className="custom-player__speed-container">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="custom-player__btn custom-player__speed-btn"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="custom-player__speed-menu">
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSpeedChange(rate)}
                      className={`speed-option ${playbackRate === rate ? 'speed-option--active' : ''}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={togglePip} className="custom-player__btn" title="Picture in Picture">
              <FiMinimize />
            </button>

            <button type="button" onClick={toggleTheaterMode} className="custom-player__btn" title="Chế độ Rạp phim">
              <HiOutlineClock />
            </button>

            <button type="button" onClick={toggleFullscreen} className="custom-player__btn" title="Toàn màn hình">
              <HiArrowsExpand />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;
