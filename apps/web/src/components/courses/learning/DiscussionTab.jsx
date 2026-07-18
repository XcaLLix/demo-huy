import React, { useState, useMemo } from 'react';
import { HiClock, HiThumbUp, HiHeart, HiLightBulb } from 'react-icons/hi';

export default function DiscussionTab({
  discussions = [],
  onAddComment,
  currentUser,
  videoTime = 0,
  onSeek
}) {
  const [filterMode, setFilterMode] = useState('ALL');
  const [newComment, setNewComment] = useState('');
  const [attachTimestamp, setAttachTimestamp] = useState(false);
  const [reactions, setReactions] = useState({});
  const [votedReactions, setVotedReactions] = useState(new Set());

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddReaction = (id, type) => {
    const key = `${id}-${type}`;
    if (votedReactions.has(key)) return;
    setReactions(prev => {
      const current = prev[id] || { helpful: 0, love: 0, insight: 0 };
      return {
        ...prev,
        [id]: {
          ...current,
          [type]: current[type] + 1
        }
      };
    });
    setVotedReactions(prev => {
      const copy = new Set(prev);
      copy.add(key);
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const timeAttach = attachTimestamp ? Math.floor(videoTime) : null;
    let textToSend = newComment;
    if (timeAttach !== null) {
      textToSend = `[t=${timeAttach}] ${newComment}`;
    }
    
    onAddComment(textToSend);
    setNewComment('');
    setAttachTimestamp(false);
  };

  const parseTimestamp = (content) => {
    if (!content) return null;
    const match = content.match(/^\[t=(\d+)\]/);
    return match ? Number(match[1]) : null;
  };

  const cleanContent = (content) => {
    if (!content) return '';
    return content.replace(/^\[t=(\d+)\]\s*/, '');
  };

  const filteredDiscussions = useMemo(() => {
    let result = [...discussions];

    if (filterMode === 'CURRENT') {
      result = result.filter(d => {
        const t = d.timestampSeconds !== undefined ? d.timestampSeconds : parseTimestamp(d.content);
        if (t === null) return false;
        return Math.abs(t - videoTime) <= 30;
      });
    } else if (filterMode === 'MINE') {
      result = result.filter(d => d.user_name === currentUser?.fullName || d.user_name === currentUser?.name);
    }

    return result;
  }, [discussions, filterMode, videoTime, currentUser]);

  return (
    <div className="discussion-tab animate-in">
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', width: '100%' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: '#eef2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          border: '1.5px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '13px' }}>
              {currentUser?.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Viết câu hỏi hoặc chia sẻ bình luận của em..."
          style={{
            flex: 1,
            height: '40px',
            borderRadius: '10px',
            border: '1.5px solid rgba(226, 232, 240, 0.9)',
            padding: '0 16px',
            fontSize: '13.5px',
            fontFamily: "'Outfit', sans-serif",
            outline: 'none',
            transition: 'all 0.2s',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1';
            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(226, 232, 240, 0.9)';
            e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.01)';
          }}
          required
        />

        <button 
          type="submit" 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            flexShrink: 0,
            boxShadow: '0 3px 6px rgba(99, 102, 241, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          ↵
        </button>
      </form>

      {/* Hidden filters for layout screenshot matching */}

      <div className="discussion-tab__list">
        {filteredDiscussions.length > 0 ? (
          filteredDiscussions.map((d, idx) => {
            const commentId = d.id || `c-${idx}`;
            const t = d.timestampSeconds !== undefined ? d.timestampSeconds : parseTimestamp(d.content);
            const displayContent = cleanContent(d.content);
            const isTeacher = d.user_role === 'TEACHER' || d.user_role === 'ADMIN' || d.user_name?.includes('Thầy') || d.user_name?.includes('Cô');
            const counts = reactions[commentId] || { helpful: 0, love: 0, insight: 0 };

            return (
              <div key={commentId} className={`discussion-post-card ${isTeacher ? 'discussion-post-card--teacher' : ''}`}>
                <div className="discussion-post-card__header">
                  <div className="discussion-post-card__avatar">
                    {d.user_avatar && d.user_avatar.length > 2 ? (
                      <img src={d.user_avatar} alt={d.user_name} className="discussion-avatar-img" />
                    ) : (
                      d.user_name?.slice(0, 2).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="discussion-post-card__meta">
                    <div className="author-row">
                      <span className="author-name">{d.user_name}</span>
                      {isTeacher && <span className="author-role-badge">Giảng viên</span>}
                      {t !== null && (
                        <button
                          type="button"
                          onClick={() => onSeek && onSeek(t)}
                          className="post-time-badge"
                        >
                          <HiClock style={{ marginRight: 2 }} /> {formatTime(t)}
                        </button>
                      )}
                    </div>
                    <span className="post-date">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </span>
                  </div>
                </div>

                <p className="discussion-post-card__content">{displayContent}</p>

                <div className="discussion-post-card__reactions">
                  <button
                    type="button"
                    onClick={() => handleAddReaction(commentId, 'helpful')}
                    className="reaction-btn"
                  >
                    <HiThumbUp /> Hữu ích ({counts.helpful})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddReaction(commentId, 'love')}
                    className="reaction-btn"
                  >
                    <HiHeart /> Thả tim ({counts.love})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddReaction(commentId, 'insight')}
                    className="reaction-btn"
                  >
                    <HiLightBulb /> Khai sáng ({counts.insight})
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="discussion-tab__empty" style={{ padding: '24px 0', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </div>
        )}
      </div>
    </div>
  );
}
