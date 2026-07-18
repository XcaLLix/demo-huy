import React from 'react';
import { HiSearch, HiPlus, HiPencilAlt, HiDocumentDuplicate, HiTrash } from 'react-icons/hi';

export function ExamsTab({ 
  exams, 
  pagination, 
  filters, 
  setFilters, 
  onPageChange, 
  onCreateClick, 
  onEditClick, 
  onCloneClick, 
  onDeleteClick 
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toolbar */}
      <div className="saas-toolbar">
        <div className="saas-search-input-wrapper">
          <HiSearch className="saas-input-icon" />
          <input
            type="text"
            className="saas-search-input"
            placeholder="Tìm kiếm đề thi..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="saas-select-filter"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="">Tất cả môn học</option>
            <option value="Toán học">Toán học</option>
            <option value="Vật lý">Vật lý</option>
            <option value="Hóa học">Hóa học</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
          </select>

          <select
            className="saas-select-filter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã phát hành</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ duyệt</option>
          </select>

          <button className="saas-btn-primary" onClick={onCreateClick}>
            <HiPlus /> Tạo đề thi
          </button>
        </div>
      </div>

      {/* Grid List */}
      {exams.length === 0 ? (
        <div 
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}
        >
          Không tìm thấy đề thi nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="exam-cards-grid">
          {exams.map((ex) => (
            <div key={ex.id} className="saas-exam-card">
              {/* Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
                    {ex.subject} - Lớp {ex.grade}
                  </span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {ex.title}
                  </h4>
                </div>
                <span className={`saas-badge ${ex.status?.toLowerCase()}`}>
                  {ex.status === 'published' ? 'Đã phát hành' : ex.status === 'draft' ? 'Bản nháp' : 'Chờ duyệt'}
                </span>
              </div>

              {/* Middle Stats */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  padding: '10px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Lượt thi</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{ex.attemptsCount}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Điểm TB</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{ex.averageScore}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Số câu hỏi</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{ex.questionCount}</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '12px',
                  marginTop: 'auto'
                }}
              >
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Thời gian: {ex.duration} phút
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ex.status?.toLowerCase() === 'draft' && (
                    <button
                      onClick={() => onEditClick(ex.id)}
                      style={{
                        padding: '6px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                      title="Sửa đề thi"
                    >
                      <HiPencilAlt />
                    </button>
                  )}
                  <button
                    onClick={() => onCloneClick(ex.id)}
                    style={{
                      padding: '6px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                    title="Nhân bản"
                  >
                    <HiDocumentDuplicate />
                  </button>
                  {ex.status?.toLowerCase() === 'draft' && (
                    <button
                      onClick={() => onDeleteClick(ex.id)}
                      style={{
                        padding: '6px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                      title="Xóa đề thi"
                    >
                      <HiTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {Array.from({ length: pagination.totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onPageChange(idx + 1)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: pagination.page === idx + 1 ? '#6366f1' : '#ffffff',
                color: pagination.page === idx + 1 ? '#ffffff' : '#1e293b',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
