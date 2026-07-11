import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HiSearch, HiTranslate, HiClock, HiVolumeUp, HiSparkles } from 'react-icons/hi';

export default function TranscriptTab({
  transcript = [],
  videoTime = 0,
  onSeek,
  onAskAI
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [languageMode, setLanguageMode] = useState('VI'); // VI, EN, DUAL
  const [autoScroll, setAutoScroll] = useState(true);
  const activeLineRef = useRef(null);
  const containerRef = useRef(null);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find active line index
  const activeIndex = useMemo(() => {
    if (!transcript || transcript.length === 0) return -1;
    // Find the last segment whose time is less than or equal to the current time
    let activeIdx = -1;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].timeSeconds <= videoTime) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }, [transcript, videoTime]);

  // Auto scroll to active line
  useEffect(() => {
    if (autoScroll && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeIndex, autoScroll]);

  // Filter transcript lines based on query
  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const query = searchQuery.toLowerCase();
    return transcript.filter(line => 
      line.text.toLowerCase().includes(query) || 
      (line.text_en && line.text_en.toLowerCase().includes(query))
    );
  }, [transcript, searchQuery]);

  // Highlight matched search text
  const highlightText = (text, query) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    return (
      <>
        {before}
        <span className="transcript-highlight">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className="transcript-tab animate-in">
      <div className="transcript-tab__header">
        <div className="transcript-search-bar">
          <HiSearch className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ khóa trong bài giảng..."
            className="transcript-search-input"
          />
        </div>
        
        <div className="transcript-controls">
          <div className="language-selector-group">
            <button
              type="button"
              onClick={() => setLanguageMode('VI')}
              className={`lang-btn ${languageMode === 'VI' ? 'lang-btn--active' : ''}`}
              title="Tiếng Việt"
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLanguageMode('EN')}
              className={`lang-btn ${languageMode === 'EN' ? 'lang-btn--active' : ''}`}
              title="Tiếng Anh"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguageMode('DUAL')}
              className={`lang-btn ${languageMode === 'DUAL' ? 'lang-btn--active' : ''}`}
              title="Song ngữ"
            >
              Song Ngữ
            </button>
          </div>

          <label className="autoscroll-checkbox-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="autoscroll-checkbox"
            />
            <span>Tự cuộn</span>
          </label>
        </div>
      </div>

      <div className="transcript-tab__content" ref={containerRef}>
        {filteredTranscript.length > 0 ? (
          filteredTranscript.map((line, idx) => {
            const originalIndex = transcript.indexOf(line);
            const isActive = originalIndex === activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek && onSeek(line.timeSeconds)}
                className={`transcript-line-card ${isActive ? 'transcript-line-card--active' : ''}`}
              >
                <div className="transcript-line-time">
                  <HiClock className="time-icon" />
                  <span>{formatTime(line.timeSeconds)}</span>
                  {onAskAI && (
                    <button
                      type="button"
                      className="btn-ask-ai-transcript"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAI(line.text);
                      }}
                      title="Yêu cầu AI giải thích câu này"
                    >
                      <HiSparkles /> Hỏi AI
                    </button>
                  )}
                </div>
                
                <div className="transcript-line-text-container">
                  {(languageMode === 'VI' || languageMode === 'DUAL') && (
                    <p className="transcript-text-vi">
                      {highlightText(line.text, searchQuery)}
                    </p>
                  )}
                  {(languageMode === 'EN' || languageMode === 'DUAL') && line.text_en && (
                    <p className="transcript-text-en">
                      {highlightText(line.text_en, searchQuery)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="transcript-tab__empty">
            Không tìm thấy đoạn nội dung nào khớp với từ khóa tìm kiếm.
          </div>
        )}
      </div>
    </div>
  );
}
