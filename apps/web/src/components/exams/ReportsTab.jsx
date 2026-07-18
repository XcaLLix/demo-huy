import React, { useState } from 'react';
import { HiCheck, HiX } from 'react-icons/hi';

export function ReportsTab({ reports, onResolve }) {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="saas-table-container">
        <table className="saas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mã câu hỏi</th>
              <th>Người báo cáo</th>
              <th>Lý do báo cáo lỗi</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  Không có báo cáo lỗi nào liên quan tới câu hỏi của bạn.
                </td>
              </tr>
            ) : (
              reports.map(rep => (
                <tr key={rep.id}>
                  <td>#{rep.id}</td>
                  <td>#{rep.questionId}</td>
                  <td>{rep.reporter?.fullName || 'Giáo viên khác'}</td>
                  <td style={{ fontWeight: 600 }}>{rep.reason}</td>
                  <td>
                    <span className={`saas-badge ${rep.status?.toLowerCase() === 'pending' ? 'pending' : 'published'}`}>
                      {rep.status === 'PENDING' ? 'Đang chờ' : rep.status === 'RESOLVED' ? 'Đã khắc phục' : 'Bác bỏ'}
                    </span>
                  </td>
                  <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {rep.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onResolve(rep.id, 'RESOLVED')}
                          style={{
                            padding: '6px',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            color: '#10b981'
                          }}
                          title="Đồng ý sửa đổi câu hỏi"
                        >
                          <HiCheck />
                        </button>
                        <button
                          onClick={() => onResolve(rep.id, 'DISMISSED')}
                          style={{
                            padding: '6px',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            color: '#ef4444'
                          }}
                          title="Bác bỏ báo cáo"
                        >
                          <HiX />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
