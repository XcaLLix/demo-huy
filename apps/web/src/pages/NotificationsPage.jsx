import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { toast } from '../utils/toast';
import { 
  HiBell, 
  HiTrash, 
  HiCheck, 
  HiFilter, 
  HiSearch, 
  HiChevronLeft, 
  HiChevronRight,
  HiInbox,
  HiClock
} from 'react-icons/hi';

export default function NotificationsPage({ currentUser, navigateTo }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeType, setActiveType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);

  const categories = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SYSTEM', label: 'Hệ thống ⚙️' },
    { id: 'ACCOUNT', label: 'Tài khoản 🔐' },
    { id: 'COURSE', label: 'Khóa học 📚' },
    { id: 'EXAM', label: 'Đề thi 📝' },
    { id: 'PAYMENT', label: 'Giao dịch 💰' },
    { id: 'AI', label: 'AI Coach 🤖' },
    { id: 'REPORT', label: 'Báo cáo 🛡️' }
  ];

  const types = [
    { id: 'ALL', label: 'Mọi cấp độ' },
    { id: 'INFO', label: 'Thông tin 🔵' },
    { id: 'SUCCESS', label: 'Thành công 🟢' },
    { id: 'WARNING', label: 'Cảnh báo 🟡' },
    { id: 'ERROR', label: 'Quan trọng 🔴' }
  ];

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        ...(activeCategory !== 'ALL' ? { category: activeCategory } : {}),
        ...(activeType !== 'ALL' ? { type: activeType } : {}),
        ...(searchQuery ? { search: searchQuery } : {})
      };
      console.log('[NotificationsPage] Fetching with params:', params);
      const res = await api.getNotifications(params);
      console.log('[NotificationsPage] API response:', res);
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setPagination(res.pagination);
      } else {
        setError('Không thể tải thông báo');
      }
    } catch (err) {
      console.error('[NotificationsPage] Error:', err);
      setError(err.message || 'Lỗi kết nối đến máy chủ!');
      toast(err.message || 'Lỗi tải thông báo!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, activeCategory, activeType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await api.markNotificationAsRead(id);
      if (res?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        toast('Đã đánh dấu đã đọc!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Không thể cập nhật!', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsAsRead();
      if (res?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast('Đã đánh dấu đọc tất cả thông báo thành công!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Thao tác thất bại!', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      const res = await api.deleteNotification(id);
      if (res?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast('Đã xóa thông báo!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Không thể xóa thông báo!', 'error');
    }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc?')) return;
    try {
      const res = await api.deleteAllReadNotifications();
      if (res?.success) {
        setNotifications(prev => prev.filter(n => !n.isRead));
        toast('Đã dọn dẹp các thông báo đã đọc!', 'success');
      }
    } catch (err) {
      toast(err.message || 'Dọn dẹp thất bại!', 'error');
    }
  };

  const getCategoryIcon = (cat, customIcon) => {
    if (customIcon) return customIcon;
    switch (cat) {
      case 'PAYMENT': return '💰';
      case 'COURSE': return '📚';
      case 'EXAM': return '📝';
      case 'ACCOUNT': return '🔐';
      case 'AI': return '🤖';
      case 'REPORT': return '🛡️';
      case 'TEACHER': return '👨‍🏫';
      case 'ADMIN': return '👑';
      default: return '📢';
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'SUCCESS': return '#10B981';
      case 'WARNING': return '#F59E0B';
      case 'ERROR': return '#EF4444';
      default: return '#6c5ce7';
    }
  };

  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Vừa xong';
    }
  };

  return (
    <div className="admin-container" style={{ padding: '32px', background: 'var(--bg-main)', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-flex', padding: '8px', background: '#6c5ce7', borderRadius: '12px', color: '#FFFFFF', border: '2.5px solid #000000', boxShadow: '3px 3px 0px #000000' }}>
              <HiBell style={{ fontSize: '24px' }} />
            </span>
            Trung tâm thông báo
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Xem các cập nhật hệ thống, giao dịch, khóa học và nhắc nhở ôn luyện của bạn.
          </p>
        </div>

        {/* Global actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleMarkAllRead}
            className="admin-back-btn"
            style={{
              background: '#FFFFFF', color: '#1E293B', border: '2.5px solid #000000',
              boxShadow: '3px 3px 0px #000000', fontWeight: '900', fontSize: '13px',
              padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <HiCheck /> Đọc tất cả
          </button>
          <button
            onClick={handleDeleteAllRead}
            className="admin-back-btn"
            style={{
              background: '#FF7675', color: '#FFFFFF', border: '2.5px solid #000000',
              boxShadow: '3px 3px 0px #000000', fontWeight: '900', fontSize: '13px',
              padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <HiTrash /> Dọn thông báo đã đọc
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="admin-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Categories Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HiFilter /> Danh mục:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setPage(1); }}
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    border: '2px solid #000000',
                    background: activeCategory === cat.id ? '#6c5ce7' : '#FFFFFF',
                    color: activeCategory === cat.id ? '#FFFFFF' : '#1E293B',
                    fontWeight: '900', fontSize: '12px', cursor: 'pointer',
                    boxShadow: activeCategory === cat.id ? '2px 2px 0px #000000' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Types and Search Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1.5px solid #F3F4F6', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-main)' }}>Cấp độ:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {types.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveType(t.id); setPage(1); }}
                    style={{
                      padding: '6px 12px', borderRadius: '8px',
                      border: '2px solid #000000',
                      background: activeType === t.id ? '#1E293B' : '#FFFFFF',
                      color: activeType === t.id ? '#FFFFFF' : '#1E293B',
                      fontWeight: '900', fontSize: '12px', cursor: 'pointer',
                      boxShadow: activeType === t.id ? '2px 2px 0px #000000' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div className="admin-search-wrapper" style={{ margin: 0, width: '260px' }}>
                <HiSearch className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung..."
                  className="admin-search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: '#6c5ce7', color: '#FFFFFF', border: '2px solid #000000',
                  boxShadow: '2px 2px 0px #000000', fontWeight: '900', fontSize: '12.5px',
                  padding: '0 16px', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                Tìm
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div className="admin-spinner" />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', background: '#FEF2F2', border: '2.5px solid #EF4444', borderRadius: '16px' }}>
            <span style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#EF4444', margin: '0 0 6px 0' }}>Lỗi tải thông báo</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0', textAlign: 'center', padding: '0 24px' }}>{error}</p>
            <button onClick={fetchNotifications} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: '700', cursor: 'pointer' }}>
              Thử lại
            </button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const icon = getCategoryIcon(n.category, n.icon);
            const statusColor = getCategoryColor(n.type);

            return (
              <div
                key={n.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: n.isRead ? '#FFFFFF' : 'rgba(108, 92, 231, 0.04)',
                  border: '2.5px solid #000000', borderRadius: '16px',
                  padding: '18px 24px', transition: 'all 0.15s ease',
                  boxShadow: n.isRead ? '2px 2px 0px #000000' : '4px 4px 0px #000000',
                  borderLeft: `8px solid ${statusColor}`
                }}
                className="notification-card"
              >
                <div 
                  style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1, cursor: n.link ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (!n.isRead) handleMarkRead(n.id);
                    if (n.link && navigateTo) navigateTo(n.link);
                  }}
                >
                  <span style={{ fontSize: '24px', padding: '8px', background: '#F3F4F6', borderRadius: '12px', border: '1.5px solid #000000' }}>
                    {icon}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '950', color: '#1E293B', margin: 0 }}>
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px' }}>
                          MỚI
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                        <HiClock /> {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#4B5563', marginTop: '6px', lineHeight: '1.5', margin: 0 }}>
                      {n.message}
                    </p>
                    {n.link && (
                      <span style={{ fontSize: '11.5px', color: '#6c5ce7', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                        ➔ Nhấp vào đây để xem chi tiết
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      style={{
                        padding: '6px', background: '#E0F2FE', color: '#0284C7',
                        border: '1.5px solid #000000', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Đánh dấu đã đọc"
                    >
                      <HiCheck style={{ fontSize: '16px' }} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    style={{
                      padding: '6px', background: '#FEE2E2', color: '#EF4444',
                      border: '1.5px solid #000000', borderRadius: '8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Xóa thông báo"
                  >
                    <HiTrash style={{ fontSize: '16px' }} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', background: '#FFFFFF', border: '2.5px solid #000000', borderRadius: '16px', boxShadow: '3px 3px 0px #000000' }}>
            <HiInbox style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Không tìm thấy thông báo nào</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>

      {/* Pagination Row */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '8px 12px', border: '2px solid #000000', borderRadius: '8px',
              background: page === 1 ? '#F3F4F6' : '#FFFFFF', cursor: page === 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '12.5px'
            }}
          >
            <HiChevronLeft /> Trước
          </button>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '8px 12px', border: '2px solid #000000', borderRadius: '8px',
              background: page === pagination.totalPages ? '#F3F4F6' : '#FFFFFF', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '12.5px'
            }}
          >
            Sau <HiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
