import { useState } from 'react';
import { HiChat, HiHeart, HiSearch, HiPlus, HiArrowLeft, HiUser, HiTag } from 'react-icons/hi';

export default function Forum({ forumPosts, onAddPost, onLikePost, onAddComment, currentUser }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new post
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('Toán học');

  // Comment input state
  const [commentText, setCommentText] = useState('');

  const subjects = ['All', 'Toán học', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Sinh học', 'Khác'];

  // Filter posts
  const filteredPosts = forumPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || post.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      subject: newSubject,
      author: currentUser?.name || 'Ẩn danh',
      authorAvatar: currentUser?.avatar || 'AD',
      date: 'Vừa xong',
      likes: 0,
      likedBy: [],
      comments: []
    };

    onAddPost(newPost);
    setNewTitle('');
    setNewContent('');
    setShowCreateModal(false);
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      author: currentUser?.name || 'Học sinh',
      avatar: currentUser?.avatar || 'HS',
      content: commentText,
      date: 'Vừa xong'
    };

    onAddComment(selectedPost.id, newComment);
    
    // Update local detailed view state
    setSelectedPost(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
    setCommentText('');
  };

  return (
    <div className="forum-container animate-in">
      {selectedPost ? (
        /* Detailed Post View */
        <div className="card detailed-post-card">
          <button className="btn-outline" onClick={() => setSelectedPost(null)} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiArrowLeft /> Quay lại diễn đàn
          </button>
          
          <div className="post-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="user-avatar" style={{ background: 'var(--primary)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {selectedPost.authorAvatar || 'U'}
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedPost.author}</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Đăng lúc {selectedPost.date} • <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '10px' }}>{selectedPost.subject}</span></p>
            </div>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-main)' }}>{selectedPost.title}</h2>
          <div style={{ fontSize: '14.5px', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-line', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            {selectedPost.content}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => {
                onLikePost(selectedPost.id);
                setSelectedPost(prev => ({
                  ...prev,
                  likes: prev.likedBy?.includes(currentUser?.email || 'guest') ? prev.likes - 1 : prev.likes + 1,
                  likedBy: prev.likedBy?.includes(currentUser?.email || 'guest') 
                    ? prev.likedBy.filter(email => email !== (currentUser?.email || 'guest'))
                    : [...(prev.likedBy || []), currentUser?.email || 'guest']
                }));
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', 
                color: selectedPost.likedBy?.includes(currentUser?.email || 'guest') ? 'var(--accent-red)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '14px', fontWeight: '500'
              }}
            >
              <HiHeart style={{ fontSize: '18px' }} /> {selectedPost.likes} Lượt thích
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <HiChat style={{ fontSize: '18px' }} /> {selectedPost.comments?.length || 0} Bình luận
            </span>
          </div>

          {/* Comments section */}
          <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>Ý kiến thảo luận ({selectedPost.comments?.length || 0})</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {selectedPost.comments && selectedPost.comments.length > 0 ? (
                selectedPost.comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', lastChild: { border: 'none' } }}>
                    <div className="user-avatar" style={{ background: 'var(--accent-blue)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {c.avatar || 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{c.author}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.date}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!</p>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Viết phản hồi hoặc lời giải của bạn..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Gửi bình luận</button>
            </form>
          </div>
        </div>
      ) : (
        /* Posts Directory View */
        <div>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>Diễn đàn thảo luận EduPath</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nơi giao lưu, giải đáp bài tập THPTQG và chia sẻ tài liệu hữu ích</p>
            </div>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus /> Đăng bài viết mới
            </button>
          </div>

          {/* Search and Filters row */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <div className="search-bar" style={{ position: 'relative', width: '100%' }}>
              <HiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm chủ đề, câu hỏi, bài viết thảo luận..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', width: '100%' }}
              />
            </div>

            {/* Subject Filters */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {subjects.map(subj => (
                <button
                  key={subj}
                  className={`badge-pill ${selectedSubject === subj ? 'active' : ''}`}
                  onClick={() => setSelectedSubject(subj)}
                  style={{
                    border: '1px solid var(--border)',
                    background: selectedSubject === subj ? 'var(--primary)' : 'var(--bg-main)',
                    color: selectedSubject === subj ? '#fff' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {subj === 'All' ? 'Tất cả chủ đề' : subj}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <div 
                  key={post.id} 
                  className="card post-card" 
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s',
                    hover: { transform: 'translateY(-2px)' }
                  }}
                  onClick={() => setSelectedPost(post)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '11px', fontWeight: '600' }}>
                      {post.subject}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.date}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>{post.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '14px', lineHeight: '1.5' }}>
                    {post.content}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="user-avatar" style={{ background: 'var(--accent-green)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                        {post.authorAvatar || 'U'}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>{post.author}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: post.likedBy?.includes(currentUser?.email || 'guest') ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        <HiHeart /> {post.likes}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <HiChat /> {post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Không tìm thấy câu hỏi hoặc bài thảo luận nào phù hợp.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create New Post Modal */}
      {showCreateModal && (
        <div className="modal-backdrop animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
          <div className="modal-card card" style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold' }}>Tạo bài viết thảo luận mới</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Chủ đề / Môn học:</label>
                <select 
                  className="form-control"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Khác">Chủ đề khác</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Tiêu đề câu hỏi / bài thảo luận:</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ví dụ: Giúp em giải bài toán đạo hàm bậc 3 cực trị này với ạ!"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Nội dung chi tiết câu hỏi:</label>
                <textarea 
                  className="form-control"
                  placeholder="Nhập nội dung câu hỏi, công thức hoặc các bước bạn đã giải được để mọi người cùng thảo luận..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  style={{ width: '100%', minHeight: '150px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-primary">Đăng lên diễn đàn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
