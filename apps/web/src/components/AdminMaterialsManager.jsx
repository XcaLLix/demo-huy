import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { api } from '../api';
import { 
  HiCheck, 
  HiTrash, 
  HiEye, 
  HiDownload, 
  HiSearch, 
  HiBookOpen, 
  HiEyeOff,
  HiRefresh
} from 'react-icons/hi';

export default function AdminMaterialsManager({ currentUser, addLog }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // PDF Preview State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  // Reject Dialog State
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminMaterials();
      if (data) {
        setMaterials(data);
      }
    } catch (err) {
      console.error(err);
      toast('Không thể tải danh sách tài liệu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleApprove = async (id, title) => {
    try {
      await api.approveMaterial(id);
      toast('Đã phê duyệt tài liệu thành công!', 'success');
      if (addLog) addLog(`Duyệt tài liệu "${title}" (ID: ${id})`, 'admin');
      loadMaterials();
    } catch (err) {
      toast(err.message || 'Phê duyệt thất bại!', 'error');
    }
  };

  const handleRejectClick = (id) => {
    setRejectId(id);
    setRejectReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast('Vui lòng nhập lý do từ chối!', 'warning');
      return;
    }

    try {
      const material = materials.find(m => m.id === rejectId);
      await api.rejectMaterial(rejectId, rejectReason);
      toast('Đã từ chối tài liệu học tập!', 'success');
      if (addLog) addLog(`Từ chối tài liệu "${material?.title}" (ID: ${rejectId}) vì: ${rejectReason}`, 'admin');
      setRejectId(null);
      loadMaterials();
    } catch (err) {
      toast(err.message || 'Thao tác thất bại!', 'error');
    }
  };

  const handleHide = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ẩn tài liệu "${title}" khỏi thư viện công cộng?`)) return;
    try {
      await api.hideMaterial(id);
      toast('Đã ẩn tài liệu thành công!', 'success');
      if (addLog) addLog(`Ẩn tài liệu "${title}" (ID: ${id})`, 'admin');
      loadMaterials();
    } catch (err) {
      toast(err.message || 'Ẩn thất bại!', 'error');
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '80vh', background: '#FCFBFA' }}>
      
      {/* Top filter and actions bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '15px', 
        background: '#fff', 
        padding: '16px', 
        borderRadius: '16px', 
        border: '3px solid #000', 
        boxShadow: '4px 4px 0px #000' 
      }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <HiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài liệu, giáo viên..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '2px solid #000',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                fontWeight: '600'
              }}
            />
          </div>

          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #000',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              background: '#fff'
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING_REVIEW">⏱ Chờ duyệt</option>
            <option value="APPROVED">✓ Đã duyệt</option>
            <option value="REJECTED">✕ Bị từ chối</option>
            <option value="HIDDEN">👁 Đã ẩn</option>
          </select>
        </div>

        <button 
          onClick={loadMaterials}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#fff',
            border: '3px solid #000',
            boxShadow: '3px 3px 0px #000',
            borderRadius: '8px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <HiRefresh /> Tải lại
        </button>
      </div>

      {/* Materials Table/List */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        border: '3px solid #000', 
        boxShadow: '6px 6px 0px #000', 
        overflow: 'hidden' 
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlignment: 'center', fontWeight: 'bold', color: '#64748b' }}>
            Đang tải dữ liệu tài liệu học tập...
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
            Không tìm thấy tài liệu nào phù hợp.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '3px solid #000' }}>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px' }}>Tài liệu</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px' }}>Giáo viên</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px' }}>Thông tin tệp</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px' }}>Trạng thái</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px' }}>Kiểm toán duyệt</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m, index) => {
                  const size = m.fileSize ? (m.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB';
                  const date = m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString('vi-VN') : '';
                  
                  return (
                    <tr 
                      key={m.id} 
                      style={{ 
                        borderBottom: index === filteredMaterials.length - 1 ? 'none' : '1.5px solid #e2e8f0',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa'
                      }}
                    >
                      {/* Name / Title */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ 
                            padding: '6px 10px', 
                            borderRadius: '8px', 
                            border: '1.5px solid #000', 
                            fontWeight: 'bold', 
                            fontSize: '11px',
                            background: m.fileType === 'pdf' ? '#fee2e2' : '#e0f2fe',
                            color: m.fileType === 'pdf' ? '#ef4444' : '#0284c7'
                          }}>
                            {m.fileType?.toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{m.title}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Môn: {m.subject} • Lớp: {m.grade} • Giá: {m.price > 0 ? m.price.toLocaleString('vi-VN') + ' đ' : 'Miễn phí'}
                            </div>
                            {m.description && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
                                {m.description.substring(0, 100)}{m.description.length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Teacher */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{m.teacherName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{m.teacherEmail}</div>
                      </td>

                      {/* File Stats */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>Dung lượng: {size}</div>
                        {m.pageCount && <div style={{ fontSize: '11px', color: '#64748b' }}>Số trang: {m.pageCount}</div>}
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Tải lên: {date}</div>
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '16px' }}>
                        <span 
                          style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            padding: '4px 10px', 
                            borderRadius: '20px',
                            border: '1.5px solid #000',
                            backgroundColor: 
                              m.status === 'APPROVED' ? '#d1fae5' :
                              m.status === 'PENDING_REVIEW' ? '#fef3c7' :
                              m.status === 'REJECTED' ? '#fee2e2' :
                              m.status === 'HIDDEN' ? '#dbeafe' : '#f1f5f9',
                            color: 
                              m.status === 'APPROVED' ? '#065f46' :
                              m.status === 'PENDING_REVIEW' ? '#b45309' :
                              m.status === 'REJECTED' ? '#991b1b' :
                              m.status === 'HIDDEN' ? '#1e3a8a' : '#475569'
                          }}
                        >
                          {
                            m.status === 'APPROVED' ? '✓ ĐÃ PHÁT HÀNH' :
                            m.status === 'PENDING_REVIEW' ? '⏱ CHỜ DUYỆT' :
                            m.status === 'REJECTED' ? '✕ BỊ TỪ CHỐI' :
                            m.status === 'HIDDEN' ? '👁 ĐÃ ẨN' : '🔒 NHÁP'
                          }
                        </span>
                      </td>

                      {/* Auditing */}
                      <td style={{ padding: '16px', fontSize: '11.5px', color: '#334155' }}>
                        {m.status === 'APPROVED' && m.approvedAt && (
                          <div>
                            <strong>Duyệt:</strong> {new Date(m.approvedAt).toLocaleDateString('vi-VN')}<br/>
                          </div>
                        )}
                        {m.status === 'REJECTED' && (
                          <div style={{ color: '#b91c1c' }}>
                            <strong>Lý do từ chối:</strong> {m.rejectionReason}
                          </div>
                        )}
                        {m.status === 'HIDDEN' && m.hiddenAt && (
                          <div>
                            <strong>Ẩn lúc:</strong> {new Date(m.hiddenAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          
                          {/* File Preview */}
                          {m.fileType === 'pdf' && m.previewUrl ? (
                            <button
                              onClick={() => { setPreviewUrl(m.previewUrl); setPreviewTitle(m.title); }}
                              title="Xem thử file PDF"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '2px solid #000',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <HiEye />
                            </button>
                          ) : (
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Tải xuống tệp tin gốc"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '2px solid #000',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                            >
                              <HiDownload />
                            </a>
                          )}

                          {/* Approve / Restore */}
                          {(m.status === 'PENDING_REVIEW' || m.status === 'REJECTED' || m.status === 'HIDDEN') && (
                            <button
                              onClick={() => handleApprove(m.id, m.title)}
                              title={m.status === 'HIDDEN' ? 'Hiển thị lại' : 'Duyệt tài liệu'}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '2px solid #000',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <HiCheck />
                            </button>
                          )}

                          {/* Reject */}
                          {m.status === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => handleRejectClick(m.id)}
                              title="Từ chối duyệt"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '2px solid #000',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <HiTrash />
                            </button>
                          )}

                          {/* Hide (Approved -> Hidden) */}
                          {m.status === 'APPROVED' && (
                            <button
                              onClick={() => handleHide(m.id, m.title)}
                              title="Ẩn khỏi thư viện"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '2px solid #000',
                                backgroundColor: '#ffedd5',
                                color: '#c2410c',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <HiEyeOff />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Preview Modal Overlay */}
      {previewUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '1000px',
            height: '90%',
            background: '#fff',
            border: '3px solid #000',
            borderRadius: '16px',
            boxShadow: '8px 8px 0px #000',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <header style={{
              padding: '14px 20px',
              borderBottom: '3px solid #000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>📄 Xem trước: {previewTitle}</span>
              <button 
                onClick={() => { setPreviewUrl(null); setPreviewTitle(''); }}
                style={{
                  padding: '6px 12px',
                  background: '#fee2e2',
                  color: '#ef4444',
                  border: '2px solid #000',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </header>
            
            {/* Embedded PDF iframe */}
            <iframe 
              src={previewUrl}
              title="PDF Preview"
              style={{ width: '100%', flex: 1, border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Reject Reason Dialog Modal */}
      {rejectId !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: '#fff',
            border: '3px solid #000',
            borderRadius: '16px',
            boxShadow: '6px 6px 0px #000',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
              ❌ Từ chối phê duyệt tài liệu
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Lý do từ chối (Gửi cho giáo viên):</label>
              <textarea 
                rows="4"
                placeholder="Nhập lý do ví dụ: Tài liệu vi phạm bản quyền, định dạng không căn chỉnh đều..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setRejectId(null)}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#000',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button 
                onClick={handleRejectSubmit}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px #000'
                }}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
