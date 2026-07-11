import { useState, useEffect } from 'react';
import { 
   HiPlus, 
   HiTrash, 
   HiPencil, 
   HiSearch, 
   HiEye, 
   HiRefresh, 
   HiDuplicate, 
   HiX, 
   HiCalendar, 
   HiAcademicCap, 
   HiTag,
   HiBan,
   HiCheckCircle,
   HiChevronLeft,
   HiChevronRight
} from 'react-icons/hi';
import { api } from '../api';
import { toast } from '../utils/toast';

export default function AdminVoucherManager({ currentUser, addLog }) {
  // Lists and loading
  const [vouchers, setVouchers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filters
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal / Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formType, setFormType] = useState('create'); // 'create' | 'edit' | 'duplicate'
  const [selectedId, setSelectedId] = useState(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENT');
  const [discountValue, setDiscountValue] = useState(10);
  const [minimumOrderValue, setMinimumOrderValue] = useState(0);
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(100);
  const [limitPerUser, setLimitPerUser] = useState(1);
  const [applicableType, setApplicableType] = useState('ALL');
  const [applicableCourseIds, setApplicableCourseIds] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isUnlimitedQty, setIsUnlimitedQty] = useState(false);
  const [isUnlimitedTime, setIsUnlimitedTime] = useState(false);

  // Detail Drawer state
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load vouchers and courses
  const loadVouchers = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.getAdminVouchers({
        code: searchCode || undefined,
        name: searchName || undefined,
        status: statusFilter || undefined,
        discountType: typeFilter || undefined,
        page: p,
        limit: 10
      });
      if (res && res.vouchers) {
        setVouchers(res.vouchers);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast(err.message || 'Lỗi tải danh sách mã giảm giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.getCourses({ limit: 1000 });
      if (res && res.courses) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách khóa học cho voucher:', err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadVouchers(page);
  }, [page, statusFilter, typeFilter]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      loadVouchers(1);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchCode, searchName]);

  const handleOpenCreate = () => {
    setFormType('create');
    setSelectedId(null);
    setCode('');
    setName('');
    setDescription('');
    setDiscountType('PERCENT');
    setDiscountValue(20);
    setMinimumOrderValue(0);
    setMaximumDiscount('');
    setTotalQuantity(100);
    setLimitPerUser(1);
    setApplicableType('ALL');
    setApplicableCourseIds([]);
    setIsUnlimitedQty(false);
    setIsUnlimitedTime(false);
    
    const now = new Date();
    const future = new Date();
    future.setMonth(now.getMonth() + 1);
    setStartDate(now.toISOString().substring(0, 16));
    setEndDate(future.toISOString().substring(0, 16));
    
    setShowFormModal(true);
  };

  const handleOpenEdit = (v) => {
    setFormType('edit');
    setSelectedId(v.id);
    setCode(v.code);
    setName(v.name);
    setDescription(v.description || '');
    setDiscountType(v.discountType);
    setDiscountValue(v.discountValue);
    setMinimumOrderValue(v.minimumOrderValue);
    setMaximumDiscount(v.maximumDiscount || '');
    
    const isQtyUnlim = v.totalQuantity === null;
    setIsUnlimitedQty(isQtyUnlim);
    setTotalQuantity(isQtyUnlim ? '' : v.totalQuantity);
    
    setLimitPerUser(v.limitPerUser);
    setApplicableType(v.applicableType);
    setApplicableCourseIds(v.applicableCourseIds || []);
    
    const isTimeUnlim = v.startDate === null && v.endDate === null;
    setIsUnlimitedTime(isTimeUnlim);
    setStartDate(v.startDate ? new Date(v.startDate).toISOString().substring(0, 16) : '');
    setEndDate(v.endDate ? new Date(v.endDate).toISOString().substring(0, 16) : '');
    
    setShowFormModal(true);
  };

  const handleOpenDuplicate = (v) => {
    setFormType('duplicate');
    setSelectedId(v.id);
    setCode(`COPY_${v.code}`);
    setName(`Nhân bản của - ${v.name}`);
    setDescription(v.description || '');
    setDiscountType(v.discountType);
    setDiscountValue(v.discountValue);
    setMinimumOrderValue(v.minimumOrderValue);
    setMaximumDiscount(v.maximumDiscount || '');
    
    const isQtyUnlim = v.totalQuantity === null;
    setIsUnlimitedQty(isQtyUnlim);
    setTotalQuantity(isQtyUnlim ? '' : v.totalQuantity);
    
    setLimitPerUser(v.limitPerUser);
    setApplicableType(v.applicableType);
    setApplicableCourseIds(v.applicableCourseIds || []);
    
    const isTimeUnlim = v.startDate === null && v.endDate === null;
    setIsUnlimitedTime(isTimeUnlim);
    setStartDate(v.startDate ? new Date(v.startDate).toISOString().substring(0, 16) : '');
    setEndDate(v.endDate ? new Date(v.endDate).toISOString().substring(0, 16) : '');
    
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toast('Vui lòng điền mã code và tên voucher!', 'warning');
      return;
    }

    if (!isUnlimitedTime && (!startDate || !endDate)) {
      toast('Vui lòng chọn ngày bắt đầu và ngày kết thúc!', 'warning');
      return;
    }

    if (!isUnlimitedQty && (totalQuantity === '' || Number(totalQuantity) < 1)) {
      toast('Vui lòng chọn tổng lượt phát hành hợp lệ!', 'warning');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || null,
      discountType,
      discountValue: Number(discountValue),
      minimumOrderValue: Number(minimumOrderValue),
      maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
      totalQuantity: isUnlimitedQty ? null : Number(totalQuantity),
      limitPerUser: Number(limitPerUser),
      applicableType,
      applicableCourseIds: applicableType === 'SPECIFIC_COURSES' ? applicableCourseIds.map(Number) : [],
      startDate: isUnlimitedTime ? null : new Date(startDate).toISOString(),
      endDate: isUnlimitedTime ? null : new Date(endDate).toISOString()
    };

    try {
      if (formType === 'create' || formType === 'duplicate') {
        await api.createAdminVoucher(payload);
        toast(`Tạo mã voucher ${payload.code} thành công!`, 'success');
        addLog(`Tạo mới voucher code: ${payload.code}`, 'sys');
      } else {
        await api.updateAdminVoucher(selectedId, payload);
        toast(`Cập nhật mã voucher ${payload.code} thành công!`, 'success');
        addLog(`Cập nhật voucher ID ${selectedId} (${payload.code})`, 'sys');
      }
      setShowFormModal(false);
      loadVouchers(page);
    } catch (err) {
      toast(err.message || 'Lỗi lưu thông tin voucher', 'error');
    }
  };

  const handleDelete = async (id, voucherCode) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn voucher "${voucherCode}"?`)) return;
    try {
      await api.deleteAdminVoucher(id);
      toast('Đã xóa voucher thành công!', 'success');
      addLog(`Xóa voucher code: ${voucherCode}`, 'sys');
      loadVouchers(page);
    } catch (err) {
      toast(err.message || 'Lỗi khi xóa voucher!', 'error');
    }
  };

  const handleToggleStatus = async (v) => {
    const isActivating = v.status !== 'ACTIVE';
    const actionText = isActivating ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có muốn ${actionText} voucher "${v.code}"?`)) return;
    
    try {
      if (isActivating) {
        await api.enableAdminVoucher(v.id);
        toast(`Đã kích hoạt voucher ${v.code}!`, 'success');
        addLog(`Kích hoạt voucher code: ${v.code}`, 'sys');
      } else {
        await api.disableAdminVoucher(v.id);
        toast(`Đã vô hiệu hóa voucher ${v.code}!`, 'success');
        addLog(`Khóa voucher code: ${v.code}`, 'sys');
      }
      loadVouchers(page);
    } catch (err) {
      toast(err.message || 'Thao tác trạng thái thất bại!', 'error');
    }
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setShowDetailDrawer(true);
    try {
      const res = await api.getAdminVoucherById(id);
      if (res && res.success) {
        setDetailData(res.data);
      } else {
        setDetailData(res);
      }
    } catch (err) {
      toast('Không thể tải chi tiết thống kê voucher!', 'error');
      setShowDetailDrawer(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCourseCheckboxChange = (courseId) => {
    if (applicableCourseIds.includes(courseId)) {
      setApplicableCourseIds(applicableCourseIds.filter(id => id !== courseId));
    } else {
      setApplicableCourseIds([...applicableCourseIds, courseId]);
    }
  };

  return (
    <div style={{ padding: '8px 0' }}>
      
      {/* ── TOP ACTION BAR ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', background: '#FFFFFF', border: '3px solid #000000', borderRadius: '12px',
        padding: '20px', boxShadow: '4px 4px 0px #000000'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
            <HiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#555' }} />
            <input
              type="text"
              placeholder="Tìm theo Mã Code..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 36px', border: '2.5px solid #000',
                borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
            <HiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#555' }} />
            <input
              type="text"
              placeholder="Tìm theo Tên..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 36px', border: '2.5px solid #000',
                borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px', border: '2.5px solid #000', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '13px', background: '#fff', cursor: 'pointer'
            }}
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Khóa / Vô hiệu hóa</option>
            <option value="EXPIRED">Hết hạn sử dụng</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '10px', border: '2.5px solid #000', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '13px', background: '#fff', cursor: 'pointer'
            }}
          >
            <option value="">Tất cả Loại giảm</option>
            <option value="PERCENT">Phần trăm (%)</option>
            <option value="FIXED">Số tiền cố định (đ)</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            background: '#FFE259', border: '3px solid #000', borderRadius: '10px',
            padding: '12px 20px', fontSize: '14px', fontWeight: '950', cursor: 'pointer',
            boxShadow: '3px 3px 0px #000', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <HiPlus style={{ strokeWidth: 2, fontSize: '16px' }} /> Tạo Voucher Mới
        </button>
      </div>

      {/* ── MAIN TABLE ── */}
      <div style={{
        background: '#FFFFFF', border: '3px solid #000000', borderRadius: '16px',
        boxShadow: '5px 5px 0px #000000', overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', fontWeight: 'bold' }}>
            <div className="spin" style={{ display: 'inline-block', fontSize: '32px', marginBottom: '8px' }}>⏳</div>
            <div>Đang tải dữ liệu voucher...</div>
          </div>
        ) : vouchers.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#555', fontWeight: 'bold' }}>
            📭 Không tìm thấy mã giảm giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: '#FFFDF9', borderBottom: '3.5px solid #000000' }}>
                  <th style={{ padding: '16px 20px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase' }}>Mã Code</th>
                  <th style={{ padding: '16px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase' }}>Tên Voucher</th>
                  <th style={{ padding: '16px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase' }}>Khuyến mãi</th>
                  <th style={{ padding: '16px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase' }}>Lượt dùng</th>
                  <th style={{ padding: '16px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase' }}>Thời gian áp dụng</th>
                  <th style={{ padding: '16px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase' }}>Trạng thái</th>
                  <th style={{ padding: '16px 20px', fontWeight: '950', fontSize: '13px', textTransform: 'uppercase', textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const now = new Date();
                  const isExpired = v.endDate ? (now > new Date(v.endDate) || v.status === 'EXPIRED') : (v.status === 'EXPIRED');
                  const usagePercent = v.totalQuantity ? Math.min(100, Math.round((v.usedQuantity / v.totalQuantity) * 100)) : 0;
                  
                  return (
                    <tr key={v.id} style={{ borderBottom: '2px solid #000000', hover: { background: '#F9F9F9' } }}>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: '950', fontSize: '14.5px', color: '#7C3AED',
                          background: '#F3E8FF', border: '1.5px solid #000000', padding: '4px 10px', borderRadius: '6px'
                        }}>
                          {v.code}
                        </span>
                      </td>
                      <td style={{ padding: '16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong style={{ fontSize: '13.5px', color: '#000' }}>{v.name}</strong>
                        {v.description && <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#666' }}>{v.description}</p>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <strong style={{ fontSize: '14px', color: '#E67E22' }}>
                          {v.discountType === 'PERCENT' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString()}đ`}
                        </strong>
                        <span style={{ fontSize: '10px', color: '#555', display: 'block', fontWeight: 'bold' }}>
                          {v.applicableType === 'ALL' && 'Toàn hệ thống'}
                          {v.applicableType === 'COURSE' && 'Chỉ khóa học'}
                          {v.applicableType === 'PREMIUM' && 'Chỉ Premium'}
                          {v.applicableType === 'SPECIFIC_COURSES' && `Chỉ ${v.applicableCourseIds.length} khóa học chọn`}
                        </span>
                      </td>
                      <td style={{ padding: '16px', width: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                          <span>{v.usedQuantity} / {v.totalQuantity || '∞'}</span>
                          {v.totalQuantity !== null && <span>{usagePercent}%</span>}
                        </div>
                        {v.totalQuantity !== null && (
                          <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '10px', border: '1px solid #000', overflow: 'hidden' }}>
                            <div style={{ width: `${usagePercent}%`, height: '100%', background: usagePercent >= 90 ? '#EF4444' : '#10B981' }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                        <div>Từ: {v.startDate ? new Date(v.startDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</div>
                        <div>Đến: {v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {isExpired ? (
                          <span style={{ background: '#F3F4F6', color: '#4B5563', border: '1.5px solid #000', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '950' }}>HẾT HẠN</span>
                        ) : v.status === 'ACTIVE' ? (
                          <span style={{ background: '#D1FAE5', color: '#065F46', border: '1.5px solid #000', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '950' }}>HOẠT ĐỘNG</span>
                        ) : (
                          <span style={{ background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #000', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '950' }}>TẠM KHÓA</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleViewDetail(v.id)}
                            style={{
                              border: '1.5px solid #000', background: '#E0F2FE', padding: '6px',
                              borderRadius: '6px', cursor: 'pointer', boxShadow: '1px 1px 0px #000'
                            }}
                            title="Xem chi tiết & Thống kê"
                          >
                            <HiEye style={{ color: '#0369A1' }} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            style={{
                              border: '1.5px solid #000', background: '#FEF3C7', padding: '6px',
                              borderRadius: '6px', cursor: 'pointer', boxShadow: '1px 1px 0px #000'
                            }}
                            title="Sửa"
                          >
                            <HiPencil style={{ color: '#B45309' }} />
                          </button>
                          <button
                            onClick={() => handleOpenDuplicate(v)}
                            style={{
                              border: '1.5px solid #000', background: '#F3E8FF', padding: '6px',
                              borderRadius: '6px', cursor: 'pointer', boxShadow: '1px 1px 0px #000'
                            }}
                            title="Nhân bản"
                          >
                            <HiDuplicate style={{ color: '#6B21A8' }} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(v)}
                            style={{
                              border: '1.5px solid #000', background: v.status === 'ACTIVE' ? '#FEE2E2' : '#D1FAE5', padding: '6px',
                              borderRadius: '6px', cursor: 'pointer', boxShadow: '1px 1px 0px #000'
                            }}
                            title={v.status === 'ACTIVE' ? 'Khóa voucher' : 'Mở khóa voucher'}
                          >
                            {v.status === 'ACTIVE' ? <HiBan style={{ color: '#991B1B' }} /> : <HiCheckCircle style={{ color: '#065F46' }} />}
                          </button>
                          <button
                            onClick={() => handleDelete(v.id, v.code)}
                            disabled={v.usedQuantity > 0}
                            style={{
                              border: '1.5px solid #000', background: '#F9FAFB', padding: '6px',
                              borderRadius: '6px', cursor: 'pointer', boxShadow: '1px 1px 0px #000',
                              opacity: v.usedQuantity > 0 ? 0.35 : 1,
                              cursor: v.usedQuantity > 0 ? 'not-allowed' : 'pointer'
                            }}
                            title={v.usedQuantity > 0 ? 'Không thể xóa voucher đã sử dụng' : 'Xóa'}
                          >
                            <HiTrash style={{ color: '#4B5563' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION BAR ── */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: '#FFFDF9', borderTop: '3px solid #000'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
              Hiển thị trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} voucher)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  background: '#FFFFFF', border: '2px solid #000', borderRadius: '6px',
                  padding: '6px 12px', fontWeight: 'bold', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <HiChevronLeft /> Trước
              </button>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  background: '#FFFFFF', border: '2px solid #000', borderRadius: '6px',
                  padding: '6px 12px', fontWeight: 'bold', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === pagination.totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                Sau <HiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DIALOG: CREATE / EDIT / DUPLICATE FORM ── */}
      {showFormModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3000, padding: '20px'
        }}>
          <div style={{
            background: '#FAF6EE', border: '3.5px solid #000', borderRadius: '16px',
            width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
            padding: '28px', boxShadow: '8px 8px 0px #000', position: 'relative'
          }}>
            <button
              onClick={() => setShowFormModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px', border: '2px solid #000',
                background: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <HiX style={{ fontSize: '18px' }} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: '950', margin: '0 0 20px 0', textTransform: 'uppercase' }}>
              {formType === 'create' && '🆕 Tạo Voucher Mới'}
              {formType === 'edit' && '✏️ Sửa Thông tin Voucher'}
              {formType === 'duplicate' && '👯 Nhân bản Voucher'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Mã Code (viết liền, không dấu) *</label>
                  <input
                    type="text"
                    required
                    disabled={formType === 'edit'}
                    placeholder="Ví dụ: HE2026, CHAO_HE_10"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Tên Voucher *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên hiển thị..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Mô tả ngắn</label>
                <textarea
                  placeholder="Ghi chú chi tiết điều kiện áp dụng..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box', height: '60px', resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Loại giảm giá</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box'
                    }}
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền mặt cố định (VNĐ)</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>
                    {discountType === 'PERCENT' ? 'Tỷ lệ giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Đơn hàng tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={minimumOrderValue}
                    onChange={(e) => setMinimumOrderValue(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>
                    Giảm tối đa (VNĐ) {discountType === 'FIXED' && '(Không áp dụng)'}
                  </label>
                  <input
                    type="number"
                    disabled={discountType === 'FIXED'}
                    placeholder="Bỏ trống nếu không giới hạn"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box',
                      opacity: discountType === 'FIXED' ? 0.5 : 1
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '950', margin: 0 }}>Tổng lượt phát hành *</label>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isUnlimitedQty}
                        onChange={(e) => setIsUnlimitedQty(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      /> Không giới hạn
                    </label>
                  </div>
                  <input
                    type="number"
                    required={!isUnlimitedQty}
                    disabled={isUnlimitedQty}
                    min={1}
                    value={isUnlimitedQty ? '' : totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    placeholder={isUnlimitedQty ? "Không giới hạn số lượt" : "Ví dụ: 100"}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box',
                      background: isUnlimitedQty ? '#E2E8F0' : '#FFF', opacity: isUnlimitedQty ? 0.7 : 1
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Giới hạn mỗi người dùng *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={limitPerUser}
                    onChange={(e) => setLimitPerUser(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '950' }}>Thời gian hiệu lực</span>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isUnlimitedTime}
                      onChange={(e) => setIsUnlimitedTime(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    /> Vô hạn thời gian
                  </label>
                </div>
                
                {!isUnlimitedTime && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', marginBottom: '6px' }}>Ngày bắt đầu *</label>
                      <input
                        type="datetime-local"
                        required={!isUnlimitedTime}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                          fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '800', marginBottom: '6px' }}>Ngày kết thúc *</label>
                      <input
                        type="datetime-local"
                        required={!isUnlimitedTime}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                          fontWeight: 'bold', fontSize: '13px', boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '950', marginBottom: '6px' }}>Đối tượng áp dụng</label>
                <select
                  value={applicableType}
                  onChange={(e) => setApplicableType(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', border: '2px solid #000', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '13px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box'
                  }}
                >
                  <option value="ALL">Toàn hệ thống (Khóa học & Premium)</option>
                  <option value="COURSE">Tất cả Khóa học</option>
                  <option value="PREMIUM">Chỉ gói nâng cấp Premium PRO</option>
                  <option value="SPECIFIC_COURSES">Danh sách khóa học cụ thể</option>
                </select>
              </div>

              {applicableType === 'SPECIFIC_COURSES' && (
                <div style={{
                  background: '#FFFFFF', border: '2px solid #000000', borderRadius: '8px',
                  padding: '12px', maxHeight: '150px', overflowY: 'auto'
                }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '950', marginBottom: '8px', color: '#555' }}>
                    Chọn các khóa học được áp dụng:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {courses.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={applicableCourseIds.includes(c.id)}
                          onChange={() => handleCourseCheckboxChange(c.id)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span>{c.title} ({c.subject})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={{
                    flex: 1, padding: '12px', background: '#FFFFFF', color: '#000000',
                    border: '2.5px solid #000000', borderRadius: '8px', fontWeight: 'bold',
                    cursor: 'pointer', boxShadow: '2px 2px 0px #000000'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5, padding: '12px', background: '#FFE259', color: '#000000',
                    border: '2.5px solid #000000', borderRadius: '8px', fontWeight: '950',
                    cursor: 'pointer', boxShadow: '2px 2px 0px #000000'
                  }}
                >
                  Lưu voucher ➔
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── DRAWER: VOUCHER STATISTICS & HISTORY DETAIL ── */}
      {showDetailDrawer && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '500px',
          background: '#FAF6EE', borderLeft: '4px solid #000000', zIndex: 3000,
          boxShadow: '-10px 0px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
          padding: '24px', boxSizing: 'border-box', fontFamily: "'Outfit', sans-serif"
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3.5px solid #000', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '950', background: '#7C3AED', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                Thông tin chi tiết
              </span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '950' }}>
                Voucher {detailData?.code}
              </h3>
            </div>
            <button
              onClick={() => setShowDetailDrawer(false)}
              style={{
                border: '2px solid #000', background: '#fff', padding: '6px',
                borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <HiX style={{ fontSize: '18px' }} />
            </button>
          </div>

          {detailLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              <div className="spin" style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <div>Đang tải thông tin chi tiết...</div>
            </div>
          ) : detailData ? (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
              
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '10px', padding: '14px', boxShadow: '2px 2px 0px #000' }}>
                  <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Tổng tiền đã giảm</span>
                  <strong style={{ fontSize: '18px', color: '#E67E22', display: 'block', marginTop: '4px' }}>
                    {detailData.totalDiscountAmount?.toLocaleString('vi-VN')}đ
                  </strong>
                </div>

                <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '10px', padding: '14px', boxShadow: '2px 2px 0px #000' }}>
                  <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Người dùng sử dụng</span>
                  <strong style={{ fontSize: '18px', color: '#7C3AED', display: 'block', marginTop: '4px' }}>
                    {detailData.uniqueUsersCount} học sinh
                  </strong>
                </div>
              </div>

              {/* General Config parameters */}
              <div style={{ background: '#fff', border: '2px solid #000', borderRadius: '12px', padding: '16px', boxShadow: '3px 3px 0px #000' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '950', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '6px' }}>Cấu hình điều kiện</h4>
                
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#666', fontWeight: 'bold' }}>Tên hiển thị:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>{detailData.name}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#666', fontWeight: 'bold' }}>Mức ưu đãi:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right', color: '#E67E22' }}>
                        {detailData.discountType === 'PERCENT' ? `${detailData.discountValue}%` : `${detailData.discountValue.toLocaleString()}đ`}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#666', fontWeight: 'bold' }}>Đơn hàng tối thiểu:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>{detailData.minimumOrderValue.toLocaleString()}đ</td>
                    </tr>
                    {detailData.discountType === 'PERCENT' && (
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 0', color: '#666', fontWeight: 'bold' }}>Giảm tối đa:</td>
                        <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>{detailData.maximumDiscount ? `${detailData.maximumDiscount.toLocaleString()}đ` : 'Không giới hạn'}</td>
                      </tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 0', color: '#666', fontWeight: 'bold' }}>Đối tượng:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>
                        {detailData.applicableType === 'ALL' && 'Toàn hệ thống'}
                        {detailData.applicableType === 'COURSE' && 'Chỉ khóa học'}
                        {detailData.applicableType === 'PREMIUM' && 'Chỉ gói Premium'}
                        {detailData.applicableType === 'SPECIFIC_COURSES' && `Chỉ khóa học chỉ định`}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#666', fontWeight: 'bold' }}>Lượt sử dụng mỗi người:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>Tối đa {detailData.limitPerUser} lần</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Usage List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📜 Nhật ký sử dụng ({detailData.usages?.length || 0} lượt)
                </h4>
                
                {detailData.usages?.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '12px', background: '#fff', border: '2px dashed #ccc', borderRadius: '10px' }}>
                    Chưa có học sinh nào sử dụng mã này.
                  </div>
                ) : (
                  <div style={{
                    flex: 1, background: '#fff', border: '2px solid #000', borderRadius: '12px',
                    padding: '8px 12px', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    {detailData.usages.map((u) => (
                      <div key={u.id} style={{ borderBottom: '1.5px solid #F1F5F9', paddingBottom: '8px', fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block' }}>{u.user?.fullName}</strong>
                          <span style={{ color: '#666', fontSize: '10px' }}>{u.user?.email}</span>
                          <span style={{ color: '#999', fontSize: '9px', display: 'block', marginTop: '2px' }}>
                            GD: {u.paymentId || 'Demo'} • {new Date(u.usedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <span style={{ color: '#E67E22', fontWeight: 'bold', fontSize: '12.5px' }}>
                          -{u.discountAmount.toLocaleString()}đ
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>Lỗi hiển thị dữ liệu!</div>
          )}
        </div>
      )}

    </div>
  );
}
