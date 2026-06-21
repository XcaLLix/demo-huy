import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '../utils/toast';
import DOMPurify from 'dompurify';
import {
  HiChat, HiHeart, HiSearch, HiPlus, HiArrowLeft, HiUser, HiTag,
  HiCheckCircle, HiDownload, HiUserGroup, HiStar, HiTrendingUp,
  HiSparkles, HiShieldCheck, HiFlag, HiRefresh
} from 'react-icons/hi';
import { io } from 'socket.io-client';
import { api, API_BASE } from '../api';

function stripImages(text) {
  if (!text) return '';
  return text.replace(/!\[(.*?)\]\((.*?)\)/g, '').trim();
}

function getFirstImageUrl(text) {
  if (!text) return null;
  const regex = /!\[(.*?)\]\((.*?)\)/;
  const match = regex.exec(text);
  return match ? match[2] : null;
}

function renderSanitizedContent(content) {
  if (!content) return null;
  let html = content;
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; max-height:400px; border-radius:8px; border:1px solid var(--border); display:block; margin:10px 0;" />');
  html = html.replace(/\n/g, '<br />');
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

export default function Forum({ currentUser }) {
  // Global View Controls
  const [activeTab, setActiveTab] = useState(() => {
    const hasSavedGroup = localStorage.getItem('forum_active_group');
    return hasSavedGroup ? 'groups' : 'feed';
  }); // feed, groups, drive, leaderboard
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(() => {
    const saved = localStorage.getItem('forum_active_group');
    if (saved) {
      localStorage.removeItem('forum_active_group');
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [groupTab, setGroupTab] = useState('announcements'); // announcements, discussion, chat, members
  
  // API State data
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gamifyProfile, setGamifyProfile] = useState(null);
  const [groupAnnouncements, setGroupAnnouncements] = useState([]);
  const [groupPosts, setGroupPosts] = useState([]);
  const [groupChatMessages, setGroupChatMessages] = useState([]);
  
  // Loading & Filtering controls
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedType, setSelectedType] = useState('All'); // All, GENERAL, QA, RESOURCE
  const [sortType, setSortType] = useState('newest');

  // Modals & Inputs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ postId: null, commentId: null });
  const [reportReason, setReportReason] = useState('');

  // Post Creator form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPostType, setNewPostType] = useState('GENERAL');
  const [newDifficulty, setNewDifficulty] = useState('MEDIUM');
  const [newTagsString, setNewTagsString] = useState('');
  
  // Group Announcement form states
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Resource file attachment states
  const [resourceFile, setResourceFile] = useState(null); // { fileUrl, fileType, fileSize }

  // New Comment / Reply state
  const [commentText, setCommentText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState(null); // Track which comment we are replying to
  const [submitting, setSubmitting] = useState(false);

  // Socket setup
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket Server
    socketRef.current = io(API_BASE);

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected to server from Forum view');
    });

    // Listen to real-time incoming comments on active thread
    socketRef.current.on('comment_received', (newComment) => {
      setComments(prev => {
        // If parentId, append to replies nested node
        if (newComment.parentId) {
          return prev.map(c => {
            if (c.id === newComment.parentId) {
              if (c.replies?.some(r => r.id === newComment.id)) return c;
              return { ...c, replies: [...(c.replies || []), newComment] };
            }
            return c;
          });
        }
        // Check for duplicates
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
    });

    socketRef.current.on('receive_message', (msg) => {
      setGroupChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const mappedMsg = {
          ...msg,
          authorName: msg.role === 'ADMIN' ? 'Quản trị viên' : (msg.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh')
        };
        return [...prev, mappedMsg];
      });
    });

    socketRef.current.on('study_group_created', () => {
      console.log('[Socket] New study group created, refreshing list...');
      fetchStudyGroups();
    });

    // Fetch initial categories
    fetchCategories();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch posts on filters change or tab change
  useEffect(() => {
    if (activeTab === 'feed') {
      fetchPosts();
    } else if (activeTab === 'groups') {
      fetchStudyGroups();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
    fetchGamifyProfile();
  }, [activeTab, selectedCategory, selectedType, selectedTag, sortType]);

  // Monitor room join / leave on post selection
  useEffect(() => {
    if (socketRef.current) {
      if (selectedPost) {
        socketRef.current.emit('join_post', selectedPost.id);
        fetchComments(selectedPost.id);
      } else {
        // Leave room
        setComments([]);
      }
    }
  }, [selectedPost]);

  // Monitor room join / leave on group selection
  useEffect(() => {
    if (socketRef.current && selectedGroup) {
      const room = `group_${selectedGroup.id}`;
      socketRef.current.emit('join_room', room);
      fetchGroupAnnouncements(selectedGroup.id);
      fetchGroupPosts(selectedGroup.id);
      setGroupChatMessages([
        {
          id: 'welcome',
          roomId: room,
          role: 'SYSTEM',
          content: `Chào mừng bạn đến với kênh trò chuyện của nhóm "${selectedGroup.name}". Hãy thảo luận lịch học và ôn thi tại đây!`,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [selectedGroup]);

  // =========================================================================
  // API CLIENT CALLS
  // =========================================================================

  const fetchCategories = async () => {
    try {
      const data = await api.getForumCategories();
      setCategories(data || []);
      if (data && data.length > 0) {
        setNewCategoryId(data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        categoryId: selectedCategory === 'All' ? '' : selectedCategory,
        postType: selectedType === 'All' ? '' : selectedType,
        tag: selectedTag,
        search: searchQuery,
        sort: sortType === 'newest' ? '' : sortType
      };
      const data = await api.getForumPosts(params);
      setPosts(data || []);
    } catch (err) {
      console.error('Lỗi tải bài viết:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupAnnouncements = async (groupId) => {
    try {
      const data = await api.getGroupAnnouncements(groupId);
      setGroupAnnouncements(data || []);
    } catch (err) {
      console.error('Lỗi tải thông báo nhóm:', err);
    }
  };

  const fetchGroupPosts = async (groupId) => {
    try {
      const data = await api.getForumPosts({ studyGroupId: groupId });
      setGroupPosts(data || []);
    } catch (err) {
      console.error('Lỗi tải bài viết nhóm:', err);
    }
  };

  const handleCreateGroupAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.createGroupAnnouncement(selectedGroup.id, newAnnTitle, newAnnContent);
      setNewAnnTitle('');
      setNewAnnContent('');
      fetchGroupAnnouncements(selectedGroup.id);
      toast('Đăng thông báo nhóm thành công!', 'success');
    } catch (err) {
      toast(err.message || 'Lỗi đăng thông báo nhóm!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroupPost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const postPayload = {
        title: newTitle,
        content: newContent,
        categoryId: Number(newCategoryId),
        postType: newPostType,
        difficulty: newPostType === 'QA' ? newDifficulty : undefined,
        tags: newTagsString.split(',').map(t => t.trim()).filter(t => t.length > 0),
        studyGroupId: selectedGroup.id
      };
      await api.createForumPost(postPayload);
      setNewTitle('');
      setNewContent('');
      setNewTagsString('');
      fetchGroupPosts(selectedGroup.id);
      toast('Đăng bài thảo luận vào nhóm thành công!', 'success');
    } catch (err) {
      toast(err.message || 'Lỗi đăng bài viết nhóm!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (socketRef.current && selectedGroup) {
      const room = `group_${selectedGroup.id}`;
      socketRef.current.emit('send_message', {
        roomId: room,
        studentId: currentUser.id,
        role: currentUser.role,
        content: chatInput
      });
      // Append locally for immediate feedback
      const localMsg = {
        id: Date.now(),
        roomId: room,
        studentId: currentUser.id,
        role: currentUser.role,
        content: chatInput,
        authorName: currentUser.fullName || currentUser.name || 'Học sinh',
        createdAt: new Date().toISOString()
      };
      setGroupChatMessages(prev => [...prev, localMsg]);
      setChatInput('');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Bạn có chắc chắn muốn rời nhóm học tập này?')) return;
    try {
      await api.leaveStudyGroup(groupId);
      setSelectedGroup(null);
      fetchStudyGroups();
      toast('Đã rời khỏi nhóm học tập!', 'success');
    } catch (err) {
      toast(err.message || 'Không thể rời nhóm!', 'error');
    }
  };

  const fetchComments = async (postId) => {
    try {
      const data = await api.getForumComments(postId);
      setComments(data || []);
    } catch (err) {
      console.error('Lỗi tải bình luận:', err);
    }
  };

  const fetchStudyGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getStudyGroups();
      setStudyGroups(data || []);
    } catch (err) {
      console.error('Lỗi tải nhóm học tập:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getForumLeaderboard();
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Lỗi tải bảng xếp hạng:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGamifyProfile = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getUserGamificationProfile();
      setGamifyProfile(data);
    } catch (err) {
      console.error('Lỗi tải gamification profile:', err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const parsedTags = newTagsString
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const postPayload = {
        title: newTitle,
        content: newContent,
        categoryId: Number(newCategoryId),
        postType: newPostType,
        difficulty: newPostType === 'QA' ? newDifficulty : undefined,
        tags: parsedTags,
        resourceFile: newPostType === 'RESOURCE' ? resourceFile : undefined
      };

      await api.createForumPost(postPayload);
      
      // Reset form & close modal
      setNewTitle('');
      setNewContent('');
      setNewTagsString('');
      setResourceFile(null);
      setShowCreateModal(false);
      
      // Reload stream
      fetchPosts();
      fetchGamifyProfile();
      toast('Đăng bài thảo luận thành công!', 'success');
    } catch (err) {
      toast(err.message || 'Đăng bài viết thất bại!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleUploadImageForPost = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = await api.uploadFile(file);
      if (data && data.url) {
        setNewContent(prev => prev + (prev ? '\n' : '') + `![ảnh](${data.url})`);
        toast('Tải ảnh lên thành công và đã thêm vào nội dung!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Tải ảnh lên thất bại!', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadImageForComment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const data = await api.uploadFile(file);
      if (data && data.url) {
        setCommentText(prev => prev + (prev ? ' ' : '') + `![ảnh](${data.url})`);
        toast('Tải ảnh lên thành công và đã thêm vào bình luận!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Tải ảnh lên thất bại!', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePasteImage = async (e, setContent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        
        setUploadingImage(true);
        try {
          const data = await api.uploadFile(file);
          if (data && data.url) {
            const markdownImage = `![ảnh](${data.url})`;
            
            const textarea = e.target;
            const start = textarea.selectionStart || 0;
            const end = textarea.selectionEnd || 0;
            const text = textarea.value || '';
            const newText = text.substring(0, start) + markdownImage + text.substring(end);
            
            setContent(newText);
            
            setTimeout(() => {
              textarea.focus();
              const newCursorPos = start + markdownImage.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
            
            toast('Đã dán và tải ảnh lên thành công!', 'success');
          }
        } catch (err) {
          toast(err.message || 'Tải ảnh từ clipboard thất bại!', 'error');
        } finally {
          setUploadingImage(false);
        }
        break;
      }
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await api.createForumComment(selectedPost.id, commentText, replyTargetId);

      if (replyTargetId) {
        setComments(prev => prev.map(c => {
          if (c.id === replyTargetId) {
            if (c.replies?.some(r => r.id === newComment.id)) return c;
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          return c;
        }));
      } else {
        setComments(prev => {
          if (prev.some(c => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
      }

      setCommentText('');
      setReplyTargetId(null);
      fetchGamifyProfile();
    } catch (err) {
      toast(err.message || 'Không thể gửi bình luận!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!currentUser) {
      toast('Vui lòng đăng nhập để bình chọn!', 'warning');
      return;
    }
    try {
      const result = await api.reactForumPost(postId, 'UPVOTE');
      
      // Update local UI state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const userHasLiked = p.likedBy?.includes(currentUser.id);
          const nextLikedBy = userHasLiked
            ? p.likedBy.filter(id => id !== currentUser.id)
            : [...(p.likedBy || []), currentUser.id];
          return {
            ...p,
            likes: result.likes,
            likedBy: nextLikedBy
          };
        }
        return p;
      }));

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => {
          const userHasLiked = prev.likedBy?.includes(currentUser.id);
          const nextLikedBy = userHasLiked
            ? prev.likedBy.filter(id => id !== currentUser.id)
            : [...(prev.likedBy || []), currentUser.id];
          return {
            ...prev,
            likes: result.likes,
            likedBy: nextLikedBy
          };
        });
      }
    } catch (err) {
      toast(err.message || 'Thao tác vote thất bại!', 'error');
    }
  };

  const handleAcceptSolution = async (commentId) => {
    try {
      await api.acceptCommentSolution(commentId);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, isSolution: !c.isSolution };
        }
        return c;
      }));
      toast('Đã cập nhật trạng thái lời giải hay!', 'success');
      fetchGamifyProfile();
    } catch (err) {
      toast(err.message || 'Không thể chọn câu trả lời này!', 'error');
    }
  };

  const handleCreateStudyGroup = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const name = e.target.groupName.value;
    const description = e.target.groupDesc.value;
    const isPrivate = e.target.groupPrivate.checked;

    setSubmitting(true);
    try {
      await api.createStudyGroup({ name, description, isPrivate });
      setShowGroupModal(false);
      fetchStudyGroups();
      toast('Tạo nhóm học tập thành công!', 'success');
    } catch (err) {
      toast(err.message || 'Tạo nhóm thất bại!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinStudyGroup = async (groupId) => {
    try {
      await api.joinStudyGroup(groupId);
      fetchStudyGroups();
      toast('Đã tham gia nhóm học tập thành công!', 'success');
    } catch (err) {
      toast(err.message || 'Không thể tham gia nhóm!', 'error');
    }
  };

  const handleDownloadFile = async (resourceId, fileUrl) => {
    try {
      await api.downloadResource(resourceId);
      // Open file in new tab to download
      window.open(fileUrl, '_blank');
      fetchGamifyProfile();
    } catch (err) {
      console.error(err);
      window.open(fileUrl, '_blank');
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      await api.createForumReport(reportTarget.postId, reportTarget.commentId, reportReason);
      setReportReason('');
      setShowReportModal(false);
      toast('Cảm ơn bạn! Báo cáo đã được gửi tới Ban quản trị kiểm duyệt.', 'success');
    } catch (err) {
      toast(err.message || 'Lỗi gửi báo cáo!', 'error');
    }
  };

  // =========================================================================
  // RENDER SUB-COMPONENTS & VIEW LAYOUTS
  // =========================================================================

  return (
    <div className="forum-container animate-in" style={{ padding: '24px', background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-main)' }}>
      {/* Dynamic Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HiSparkles style={{ color: 'var(--primary)' }} /> Diễn đàn EduPath Community
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Nơi kết nối tri thức, chia sẻ học liệu nâng cao và thi đua giải đề THPTQG
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'feed' && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus /> Đăng câu hỏi mới
            </button>
          )}
          {activeTab === 'groups' && (
            <button id="forum-btn-create-group" className="btn-primary" onClick={() => setShowGroupModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus /> Tạo nhóm học tập
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column (Main Feed & Details) */}
        <div>
          {/* Tabs bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '8px' }}>
            {[
              { id: 'feed', label: 'Bài thảo luận', icon: <HiChat /> },
              { id: 'groups', label: 'Nhóm học tập', icon: <HiUserGroup /> }
            ].map(tab => (
              <button
                key={tab.id}
                id={`forum-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedPost(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {selectedPost ? (
            /* DETAILED VIEW POST */
            <div className="card detailed-post-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <button className="btn-outline" onClick={() => setSelectedPost(null)} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HiArrowLeft /> Quay lại danh sách
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'var(--primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                    {selectedPost.author?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedPost.author?.fullName}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Đăng vào: {new Date(selectedPost.createdAt).toLocaleString()} • 
                      <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', marginLeft: '8px' }}>
                        {selectedPost.category?.name}
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      setReportTarget({ postId: selectedPost.id, commentId: null });
                      setShowReportModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Báo cáo vi phạm"
                  >
                    <HiFlag style={{ fontSize: '18px' }} />
                  </button>
                </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>{selectedPost.title}</h2>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                {renderSanitizedContent(selectedPost.content)}
              </div>

              {/* Resource Download Attachment widget */}
              {selectedPost.resource && (
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                  <div>
                    <h5 style={{ fontWeight: 'bold', fontSize: '13.5px' }}>📎 Tài liệu đính kèm: {selectedPost.title}</h5>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                      Định dạng: {selectedPost.resource.fileType} • Tải xuống: {selectedPost.resource.downloadCount} lượt
                    </p>
                  </div>
                  <button 
                    className="btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => handleDownloadFile(selectedPost.resource.id, selectedPost.resource.fileUrl)}
                  >
                    <HiDownload /> Tải ngay
                  </button>
                </div>
              )}

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
                <button 
                  onClick={() => handleLikePost(selectedPost.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none',
                    color: selectedPost.likedBy?.includes(currentUser?.id) ? 'var(--accent-red)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  <HiHeart style={{ fontSize: '18px' }} /> {selectedPost.likes || 0} Hữu ích
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <HiChat style={{ fontSize: '18px' }} /> {comments.length} Phản hồi
                </span>
              </div>

              {/* Comments Section */}
              <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>Ý kiến thảo luận ({comments.length})</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  {comments.length > 0 ? (
                    comments.map(c => (
                      <div key={c.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ background: 'var(--accent-blue)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>
                              {c.author?.slice(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{c.author}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                {new Date(c.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Checkmark to verify solution */}
                            {c.isSolution && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 'bold' }}>
                                <HiCheckCircle style={{ fontSize: '16px' }} /> Lời giải hay
                              </span>
                            )}
                            
                            {/* Option to mark solution for post author or teacher */}
                            {(currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN' || selectedPost.authorId === currentUser?.id) && (
                              <button 
                                onClick={() => handleAcceptSolution(c.id)}
                                style={{
                                  background: 'none', border: '1px solid var(--border)', borderRadius: '4px',
                                  padding: '2px 8px', fontSize: '11px', cursor: 'pointer',
                                  borderColor: c.isSolution ? 'var(--accent-green)' : 'var(--border)',
                                  color: c.isSolution ? 'var(--accent-green)' : 'var(--text-secondary)'
                                }}
                              >
                                {c.isSolution ? 'Hủy duyệt' : 'Duyệt lời giải'}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setReportTarget({ postId: null, commentId: c.id });
                                setShowReportModal(true);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              title="Báo cáo bình luận"
                            >
                              <HiFlag />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '36px', margin: 0 }}>
                          {renderSanitizedContent(c.content)}
                        </div>

                        {/* Nesting replies handler */}
                        <div style={{ paddingLeft: '36px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {c.replies && c.replies.map(reply => (
                            <div key={reply.id} style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{reply.author}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{new Date(reply.createdAt).toLocaleTimeString()}</span>
                              </div>
                               <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>{renderSanitizedContent(reply.content)}</div>
                            </div>
                          ))}

                          <button 
                            onClick={() => {
                              setReplyTargetId(c.id);
                              setCommentText(`@${c.author} `);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11.5px', alignSelf: 'flex-start', padding: 0 }}
                          >
                            Phản hồi
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có phản hồi nào. Hãy viết giải đáp đầu tiên!</p>
                  )}
                </div>

                {/* Reply form */}
                <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={replyTargetId ? "Viết phản hồi của bạn... (Hỗ trợ Ctrl+V để dán ảnh)" : "Giải pháp hoặc ý kiến thảo luận của bạn... (Hỗ trợ Ctrl+V để dán ảnh)"}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onPaste={(e) => handlePasteImage(e, setCommentText)}
                    style={{ flex: 1 }}
                    required
                  />
                  <label className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '8px 12px', fontSize: '14px', margin: 0, height: '38px', boxSizing: 'border-box' }} title="Tải ảnh lên">
                    {uploadingImage ? '⏳' : '📷'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadImageForComment} 
                      disabled={uploadingImage || submitting} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', height: '38px' }} disabled={submitting}>
                    {submitting ? 'Gửi...' : 'Gửi'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* LISTINGS OR TABS */
            <div>
              {activeTab === 'feed' && (
                <div>
                  {/* Filters Bar */}
                  <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                      <HiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Tìm bài viết..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '32px', width: '100%' }}
                      />
                    </div>

                    <select 
                      className="form-control"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      style={{ minWidth: '130px' }}
                    >
                      <option value="All">Tất cả môn học</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>

                    <select 
                      className="form-control"
                      value={selectedType}
                      onChange={e => setSelectedType(e.target.value)}
                      style={{ minWidth: '130px' }}
                    >
                      <option value="All">Loại chủ đề</option>
                      <option value="GENERAL">Thảo luận chung</option>
                      <option value="QA">Hỏi & Đáp (Q&A)</option>
                      <option value="RESOURCE">Học liệu & Đề thi</option>
                    </select>

                    <select 
                      className="form-control"
                      value={sortType}
                      onChange={e => setSortType(e.target.value)}
                      style={{ minWidth: '130px' }}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="views">Xem nhiều nhất</option>
                      <option value="pinned">Đã ghim lên đầu</option>
                    </select>

                    {(searchQuery || selectedCategory !== 'All' || selectedType !== 'All' || selectedTag) && (
                      <button 
                        className="btn-outline" 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedType('All');
                          setSelectedTag('');
                          setSortType('newest');
                        }}
                        style={{ padding: '8px 16px' }}
                      >
                        Đặt lại
                      </button>
                    )}
                  </div>

                  {/* Popular Tags List */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>🏷️ Tags phổ biến:</span>
                    {['casio', 'daoham', 'toan12', 'tienganh', 'dao-dong', 'este', 'menh-de'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                        className={`forum-tag-pill ${selectedTag === t ? 'active' : ''}`}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>

                  {/* Feed listings */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}><HiRefresh className="animate-spin" style={{ fontSize: '24px' }} /> Đang tải dữ liệu...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {posts.length > 0 ? (
                        posts.map(post => (
                          <div 
                            key={post.id} 
                            className={`forum-post-card ${post.isPinned ? 'pinned' : ''}`} 
                            onClick={() => setSelectedPost(post)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '11px', fontWeight: 'bold' }}>
                                  {post.category?.name}
                                </span>
                                {post.postType === 'QA' && (
                                  <span className="badge-pill" style={{ background: 'rgba(255, 168, 0, 0.15)', color: 'rgb(255, 168, 0)', fontSize: '11px', fontWeight: 'bold' }}>
                                    Q&A ({post.difficulty})
                                  </span>
                                )}
                                {post.postType === 'RESOURCE' && (
                                  <span className="badge-pill" style={{ background: 'rgba(0, 184, 148, 0.15)', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 'bold' }}>
                                    Học liệu
                                  </span>
                                )}
                                {post.isPinned && (
                                  <span className="badge-pill" style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px' }}>Ghim</span>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '16.5px', fontWeight: 'bold', margin: '0 0 2px 0', color: 'var(--text-main)' }}>{post.title}</h3>
                            
                            {getFirstImageUrl(post.content) && (
                              <div className="forum-post-preview-image">
                                <img 
                                  src={getFirstImageUrl(post.content)} 
                                  alt="Preview" 
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {stripImages(post.content) && (
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                                {stripImages(post.content)}
                              </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <HiUser /> {post.author?.fullName}
                              </span>
                              <div style={{ display: 'flex', gap: '14px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: post.likedBy?.includes(currentUser?.id) ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                                  <HiHeart /> {post.likes || 0}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <HiChat /> {post.comments?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          Chưa có câu hỏi thảo luận nào phù hợp bộ lọc!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'groups' && selectedGroup ? (
                /* GROUP WORKSPACE DETAIL VIEW */
                <div className="card detailed-post-card animate-in" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {/* Header info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <button className="btn-outline" onClick={() => setSelectedGroup(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}>
                        <HiArrowLeft /> Danh sách nhóm
                      </button>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>👥 {selectedGroup.name}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{selectedGroup.description}</p>
                      </div>
                    </div>
                    
                    <button 
                      className="btn-outline" 
                      onClick={() => handleLeaveGroup(selectedGroup.id)}
                      style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)', background: 'none', padding: '6px 14px' }}
                    >
                      Rời nhóm
                    </button>
                  </div>

                  {/* Tabs menu */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '8px' }}>
                    {[
                      { id: 'announcements', label: 'Bảng tin thông báo' },
                      { id: 'discussion', label: 'Thảo luận nội bộ' },
                      { id: 'chat', label: 'Hộp chat trực tuyến ⚡' },
                      { id: 'members', label: 'Thành viên (' + (selectedGroup.members?.length || 0) + ')' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        id={`group-tab-${tab.id}`}
                        onClick={() => setGroupTab(tab.id)}
                        style={{
                          padding: '10px 16px',
                          border: 'none',
                          borderBottom: groupTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                          background: 'none',
                          color: groupTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Announcement contents */}
                  {groupTab === 'announcements' && (
                    <div>
                      {/* Only creators/admin can announce */}
                      {(selectedGroup.creatorId === currentUser?.id || currentUser?.role === 'ADMIN' || currentUser?.role === 'TEACHER') && (
                        <form onSubmit={handleCreateGroupAnnouncement} className="card" style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '13.5px', fontWeight: 'bold', marginBottom: '10px' }}>📢 Phát hành thông báo nhóm mới</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Tiêu đề thông báo..." 
                              value={newAnnTitle}
                              onChange={e => setNewAnnTitle(e.target.value)}
                              required
                            />
                            <textarea 
                              className="form-control" 
                              placeholder="Nội dung thông báo chi tiết..." 
                              value={newAnnContent}
                              onChange={e => setNewAnnContent(e.target.value)}
                              style={{ minHeight: '80px' }}
                              required
                            />
                            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '6px 16px' }} disabled={submitting}>
                              {submitting ? 'Đang phát...' : 'Phát thông báo'}
                            </button>
                          </div>
                        </form>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {groupAnnouncements.length > 0 ? (
                          groupAnnouncements.map(ann => (
                            <div key={ann.id} className="card" style={{ padding: '16px', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {ann.author?.fullName?.slice(0, 2).toUpperCase() || 'TR'}
                                  </div>
                                  <span style={{ fontSize: '12.5px', fontWeight: 'bold' }}>{ann.author?.fullName}</span>
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ann.createdAt).toLocaleString()}</span>
                              </div>
                              <h5 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', color: 'var(--text-main)' }}>{ann.title}</h5>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>{ann.content}</p>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Không có thông báo nhóm nào.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Discussion content */}
                  {groupTab === 'discussion' && (
                    <div>
                      {/* Simple group create post form */}
                      <form onSubmit={handleCreateGroupPost} className="card" style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 'bold', marginBottom: '10px' }}>✍️ Tạo bài thảo luận nội bộ</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <select className="form-control" value={newCategoryId} onChange={e => setNewCategoryId(e.target.value)}>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Tiêu đề thảo luận..." 
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            required
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: '600', margin: 0 }}>Nội dung thảo luận:</label>
                            <label className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 10px', fontSize: '11px', margin: 0 }}>
                              📷 {uploadingImage ? 'Đang tải...' : 'Chèn ảnh'}
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleUploadImageForPost} 
                                disabled={uploadingImage} 
                                style={{ display: 'none' }} 
                              />
                            </label>
                          </div>
                          <textarea 
                            className="form-control" 
                            placeholder="Nội dung thảo luận... (Hỗ trợ Ctrl+V để dán ảnh từ clipboard)" 
                            value={newContent}
                            onPaste={(e) => handlePasteImage(e, setNewContent)}
                            onChange={e => setNewContent(e.target.value)}
                            style={{ minHeight: '80px' }}
                            required
                          />
                          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '6px 16px' }} disabled={submitting}>
                            {submitting ? 'Đang đăng...' : 'Đăng thảo luận'}
                          </button>
                        </div>
                      </form>

                      {/* Display internal group posts */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {groupPosts.length > 0 ? (
                          groupPosts.map(post => (
                            <div 
                              key={post.id} 
                              className="forum-post-card" 
                              onClick={() => setSelectedPost(post)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '10px' }}>{post.category?.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                              </div>
                              <h4 style={{ fontWeight: 'bold', fontSize: '15.5px', margin: '0 0 2px 0', color: 'var(--text-main)' }}>{post.title}</h4>
                              
                              {getFirstImageUrl(post.content) && (
                                <div className="forum-post-preview-image">
                                  <img 
                                    src={getFirstImageUrl(post.content)} 
                                    alt="Preview" 
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              {stripImages(post.content) && (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 4px 0', lineHeight: 1.5 }}>{stripImages(post.content)}</p>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <span>Tác giả: {post.author?.fullName}</span>
                                <span>💬 {post.comments?.length || 0} bình luận</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Chưa có chủ đề thảo luận nội bộ nào. Hãy khởi xướng chủ đề đầu tiên!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Chat room */}
                  {groupTab === 'chat' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                      {/* Messages list */}
                      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {groupChatMessages.map((msg, i) => {
                          const isSystem = msg.role === 'SYSTEM';
                          const isMe = msg.studentId === currentUser?.id;

                          if (isSystem) {
                            return (
                              <div key={msg.id || i} style={{ alignSelf: 'center', background: 'var(--border)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '12px', fontSize: '11.5px', textAlign: 'center', maxWidth: '80%' }}>
                                {msg.content}
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 'bold' }}>
                                {isMe ? 'Tôi' : (msg.authorName || 'Học viên')}
                              </span>
                              <div style={{
                                padding: '10px 14px',
                                borderRadius: '12px',
                                background: isMe ? 'var(--primary)' : 'var(--bg-card)',
                                color: isMe ? '#fff' : 'var(--text-primary)',
                                border: isMe ? 'none' : '1px solid var(--border)',
                                fontSize: '13px',
                                wordBreak: 'break-word'
                              }}>
                                {msg.content}
                              </div>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chat input form */}
                      <form onSubmit={handleSendChatMessage} style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Nhập nội dung tin nhắn và ấn Enter..." 
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          style={{ flex: 1, border: 'none', borderRadius: 0, padding: '14px', outline: 'none', background: 'none' }}
                        />
                        <button type="submit" className="btn-primary" style={{ borderRadius: 0, border: 'none', padding: '0 24px' }}>Gửi</button>
                      </form>
                    </div>
                  )}

                  {/* Tab Members */}
                  {groupTab === 'members' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Danh sách thành viên nhóm:</h4>
                      {selectedGroup.members?.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-main)' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.role === 'CREATOR' ? 'var(--primary)' : 'var(--accent-blue)', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {m.user?.fullName?.slice(0, 2).toUpperCase() || 'HV'}
                            </div>
                            <div>
                              <span style={{ fontSize: '13.5px', fontWeight: 'bold' }}>{m.user?.fullName}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>Tham gia: {new Date(m.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <span className="badge-pill" style={{
                            background: m.role === 'CREATOR' ? 'rgba(108,92,231,0.12)' : 'rgba(9,132,227,0.12)',
                            color: m.role === 'CREATOR' ? 'var(--primary)' : 'var(--accent-blue)',
                            fontSize: '11px', fontWeight: 'bold'
                          }}>
                            {m.role === 'CREATOR' ? 'Trưởng nhóm' : 'Thành viên'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'groups' ? (
                /* REGULAR LIST OF GROUPS */
                <div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}><HiRefresh className="animate-spin" style={{ fontSize: '24px' }} /> Đang tải...</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {studyGroups.map(group => (
                        <div key={group.id} className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>👥 {group.name}</h4>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', minHeight: '40px', marginBottom: '14px' }}>{group.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                            <span>Thành viên: {group.memberCount}</span>
                            {group.isMember ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>✓</span>
                                <button 
                                  className="btn-primary" 
                                  onClick={() => setSelectedGroup(group)} 
                                  style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--primary)' }}
                                >
                                  Vào nhóm
                                </button>
                              </div>
                            ) : (
                              <button className="btn-primary" onClick={() => handleJoinStudyGroup(group.id)} style={{ padding: '4px 10px', fontSize: '11px' }}>
                                Tham gia
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

            </div>
          )}
        </div>

        {/* Right Sidebar Column (Gamification Profile Widget & Info) */}
        <div>
          {gamifyProfile && (
            <div className="card gamify-card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--primary-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  ⚡
                </div>
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px' }}>{currentUser?.fullName}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Cấp độ hiện tại: {gamifyProfile.level}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Tiến trình cấp độ</span>
                  <span>{gamifyProfile.xp} XP / {gamifyProfile.nextLevelXP} XP</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${gamifyProfile.progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* Daily Streak widget */}
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Chuỗi hoạt động</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>🔥 {gamifyProfile.streakDays || 0} Ngày liên tục</span>
                </div>
              </div>

              {/* Badges Grid */}
              <div>
                <h5 style={{ fontSize: '12.5px', fontWeight: 'bold', marginBottom: '8px' }}>🎖️ Huy hiệu của bạn ({gamifyProfile.badges?.length || 0})</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {gamifyProfile.badges && gamifyProfile.badges.length > 0 ? (
                    gamifyProfile.badges.map(b => (
                      <span 
                        key={b.id} 
                        className="badge-pill" 
                        style={{ background: 'rgba(255,168,0,0.12)', color: 'rgb(255,168,0)', border: '1px solid rgba(255,168,0,0.3)', fontSize: '11px' }}
                        title={b.description}
                      >
                        🏅 {b.name}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa mở khóa huy hiệu nào. Hãy tham gia tích cực để nhận thưởng!</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Guidance Card */}
          <div className="card" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <h5 style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 Thể lệ tính điểm XP:
            </h5>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0 }}>
              <li>Câu hỏi hữu ích: +5 XP</li>
              <li>Lời giải được chọn: +15 XP</li>
              <li>Đóng góp bình luận: +2 XP</li>
              <li>Tải xuống tài liệu hữu ích: +5 XP</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* Create New Post Modal */}
      {showCreateModal && createPortal(
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
          <div className="modal-card card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold' }}>Tạo bài viết thảo luận mới</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Chủ đề / Môn học:</label>
                <select className="form-control" value={newCategoryId} onChange={e => setNewCategoryId(e.target.value)} style={{ width: '100%' }}>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Dạng bài đăng:</label>
                <select className="form-control" value={newPostType} onChange={e => setNewPostType(e.target.value)} style={{ width: '100%' }}>
                  <option value="GENERAL">Thảo luận chung</option>
                  <option value="QA">Hỏi & Đáp (Q&A)</option>
                  <option value="RESOURCE">Chia sẻ tài liệu / Đề thi</option>
                </select>
              </div>

              {newPostType === 'QA' && (
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Độ khó:</label>
                  <select className="form-control" value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)} style={{ width: '100%' }}>
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              )}

              {newPostType === 'RESOURCE' && (
                <div className="form-group" style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Đính kèm tệp học liệu (Mô phỏng):</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="URL tài liệu (ví dụ: https://edupath.cdn/files/math12.pdf)" 
                    onChange={e => setResourceFile({ fileUrl: e.target.value, fileType: 'PDF', fileSize: 2048000 })}
                    style={{ width: '100%', fontSize: '12px' }}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Tiêu đề câu hỏi / bài thảo luận:</label>
                <input 
                  type="text" className="form-control" placeholder="Ví dụ: Cách bấm máy Casio nghiệm nguyên đạo hàm?"
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%' }} required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>Nội dung chi tiết câu hỏi:</label>
                  <label className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 10px', fontSize: '11px', margin: 0 }}>
                    📷 {uploadingImage ? 'Đang tải...' : 'Chèn ảnh'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadImageForPost} 
                      disabled={uploadingImage} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
                <textarea 
                  className="form-control" placeholder="Nhập nội dung chi tiết bài toán, bạn đã thử cách nào... (Hỗ trợ Ctrl+V để dán ảnh từ clipboard)"
                  value={newContent} onChange={e => setNewContent(e.target.value)} 
                  onPaste={(e) => handlePasteImage(e, setNewContent)}
                  style={{ width: '100%', minHeight: '120px', resize: 'vertical' }} required
                />
              </div>
 
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Thẻ phân loại (ngăn cách bởi dấu phẩy):</label>
                <input 
                  type="text" className="form-control" placeholder="Ví dụ: casio, daoham, toan12"
                  value={newTagsString} onChange={e => setNewTagsString(e.target.value)} style={{ width: '100%' }}
                />
              </div>
 
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>Hủy bỏ</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Đang đăng...' : 'Đăng lên diễn đàn'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Create New Group Modal */}
      {showGroupModal && createPortal(
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
          <div className="modal-card card" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold' }}>Tạo nhóm học tập mới</h3>
              <button onClick={() => setShowGroupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateStudyGroup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Tên nhóm học tập:</label>
                <input type="text" name="groupName" className="form-control" placeholder="Ví dụ: Ôn thi khối A1 chuyên sâu" style={{ width: '100%' }} required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Mô tả mục tiêu nhóm:</label>
                <textarea name="groupDesc" className="form-control" placeholder="Mô tả lịch học, tài liệu trao đổi..." style={{ width: '100%', minHeight: '80px' }} required />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="checkbox" name="groupPrivate" id="groupPrivate" />
                <label htmlFor="groupPrivate" style={{ fontSize: '13px' }}>Đặt nhóm ở chế độ riêng tư (Yêu cầu lời mời)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowGroupModal(false)} disabled={submitting}>Hủy bỏ</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Safety Report Modal */}
      {showReportModal && createPortal(
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}>
          <div className="modal-card card" style={{ maxWidth: '400px', width: '90%', padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Báo cáo nội dung không lành mạnh</h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSendReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12.5px', marginBottom: '6px', display: 'block' }}>Lý do báo cáo:</label>
                <textarea 
                  id="report-reason-input"
                  className="form-control" 
                  placeholder="Vui lòng cung cấp lý do chi tiết (Spam, ngôn từ kích động, xúc phạm giáo viên/học sinh...)" 
                  value={reportReason} 
                  onChange={e => setReportReason(e.target.value)} 
                  style={{ width: '100%', minHeight: '100px' }} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button id="report-cancel-btn" type="button" className="btn-outline" onClick={() => setShowReportModal(false)}>Hủy</button>
                <button id="report-submit-btn" type="submit" className="btn-primary">Gửi báo cáo</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
