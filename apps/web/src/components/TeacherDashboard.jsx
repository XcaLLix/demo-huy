import { useState } from 'react';
import { HiPlus, HiTrash, HiDocumentAdd, HiDatabase, HiChartPie, HiPlusCircle } from 'react-icons/hi';

export default function TeacherDashboard({
  courses,
  onCreateCourse,
  onDeleteCourse,
  questionBank,
  onAddQuestion,
  addLog
}) {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'questions' or 'stats'
  
  // New Course state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Toán học');
  const [newPrice, setNewPrice] = useState('599.000');
  
  // New Question state
  const [qText, setQText] = useState('');
  const [qSubject, setQSubject] = useState('Toán học');
  const [qTopic, setQTopic] = useState('Khảo sát hàm số');
  const [qDiff, setQDiff] = useState('Trung bình');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCourseObj = {
      id: Date.now(),
      title: newTitle,
      subject: newSubject,
      price: newPrice,
      teacherName: 'Thầy Thế Anh',
      isUnlocked: false,
      lessons: [
        { id: 1001, name: 'Bài 1: Giới thiệu & Khái niệm cơ bản', duration: '15:20' },
        { id: 1002, name: 'Bài 2: Các dạng bài tập cốt lõi', duration: '28:40' }
      ]
    };

    onCreateCourse(newCourseObj);
    setNewTitle('');
    addLog(`Giáo viên khởi tạo khóa học mới: "${newTitle}"`, 'sys');
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!qText.trim() || !optA || !optB || !optC || !optD) {
      alert('Vui lòng điền đầy đủ câu hỏi và 4 đáp án!');
      return;
    }

    const newQ = {
      id: questionBank.length + 1,
      question: qText,
      options: [
        { key: 'A', value: optA },
        { key: 'B', value: optB },
        { key: 'C', value: optC },
        { key: 'D', value: optD }
      ],
      correctAnswer: qCorrect,
      difficulty: qDiff,
      difficultyClass: qDiff === 'Dễ' ? 'diff-easy' : (qDiff === 'Trung bình' ? 'diff-medium' : 'diff-hard'),
      explanation: 'Lời giải chi tiết do giáo viên biên soạn.',
      topic: qTopic,
      subject: qSubject
    };

    onAddQuestion(newQ);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    addLog(`Giáo viên tạo câu hỏi mới trong Ngân hàng đề: "${qText.substring(0, 45)}..."`, 'sys');
    alert('Thêm câu hỏi mới thành công!');
  };

  return (
    <div className="animate-in">
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <button
          className={`demo-role-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📚 Quản lý khóa học
        </button>
        <button
          className={`demo-role-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <HiDatabase /> Ngân hàng câu hỏi
        </button>
        <button
          className={`demo-role-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <HiChartPie /> Thống kê lớp học
        </button>
      </div>

      {activeTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Creator Form */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>TẠO KHÓA HỌC MỚI</h3>
            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600' }}>Tên khóa học:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Luyện đề Toán học THPTQG 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600' }}>Tổ hợp / Môn học:</label>
                <select className="form-control" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600' }}>Giá khóa học (VNĐ):</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: 599.000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <HiPlus /> Khởi tạo khóa học
              </button>
            </form>
          </div>

          {/* Courses List */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>KHÓA HỌC ĐANG PHỤ TRÁCH</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {courses.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)'
                  }}
                >
                  <div>
                    <span className="badge-pill" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '10px' }}>
                      {c.subject}
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{c.title}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Số bài học: {c.lessons.length} • Trạng thái: {c.isUnlocked ? 'Đang mở' : 'Khóa đóng'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onDeleteCourse(c.id);
                      addLog(`Giáo viên xóa khóa học: "${c.title}"`, 'sys');
                    }}
                    style={{
                      padding: '8px', borderRadius: '50%', background: 'none', border: '1px solid var(--border)',
                      color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-red)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <HiTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Question Maker Form */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>THÊM CÂU HỎI MỚI VÀO NGÂN HÀNG</h3>
            <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11px', fontWeight: '600' }}>Nội dung câu hỏi:</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Ví dụ: Đạo hàm của y = sin(x) là..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Môn học:</label>
                  <select className="form-control" value={qSubject} onChange={(e) => setQSubject(e.target.value)}>
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Chương/Chuyên đề:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Sự biến thiên"
                    value={qTopic}
                    onChange={(e) => setQTopic(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Độ khó:</label>
                  <select className="form-control" value={qDiff} onChange={(e) => setQDiff(e.target.value)}>
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Đáp án ĐÚNG:</label>
                  <select className="form-control" value={qCorrect} onChange={(e) => setQCorrect(e.target.value)}>
                    <option value="A">Đáp án A</option>
                    <option value="B">Đáp án B</option>
                    <option value="C">Đáp án C</option>
                    <option value="D">Đáp án D</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Đáp án A:</label>
                  <input type="text" className="form-control" value={optA} onChange={e => setOptA(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Đáp án B:</label>
                  <input type="text" className="form-control" value={optB} onChange={e => setOptB(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Đáp án C:</label>
                  <input type="text" className="form-control" value={optC} onChange={e => setOptC(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: '600' }}>Đáp án D:</label>
                  <input type="text" className="form-control" value={optD} onChange={e => setOptD(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: '10px' }}>
                <HiPlusCircle /> Lưu vào Ngân hàng câu hỏi
              </button>
            </form>
          </div>

          {/* Question List View */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>DANH SÁCH NGÂN HÀNG CÂU HỎI</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', paddingRight: '4px' }}>
              {questionBank.map((q) => (
                <div key={q.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>ID: #{q.id} • {q.subject}</span>
                    <span className={`difficulty-tag ${q.difficultyClass}`}>{q.difficulty}</span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>{q.question}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {q.options.map(o => (
                      <div key={o.key} style={{ fontWeight: q.correctAnswer === o.key ? 'bold' : 'normal', color: q.correctAnswer === o.key ? 'var(--accent-green)' : 'inherit' }}>
                        {o.key}. {o.value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>THỐNG KÊ HIỆU SUẤT KHÓA HỌC</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>8.4</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Điểm kiểm tra trung bình lớp</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-green)' }}>92%</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Tỷ lệ hoàn thành lộ trình tuần</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-orange)' }}>42</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Số học sinh đang theo học</p>
            </div>
          </div>

          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>DANH SÁCH HỌC SINH TÍCH CỰC</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 6px' }}>Họ và tên</th>
                <th style={{ padding: '10px 6px' }}>Lớp</th>
                <th style={{ padding: '10px 6px' }}>Số bài test</th>
                <th style={{ padding: '10px 6px' }}>Điểm trung bình</th>
                <th style={{ padding: '10px 6px' }}>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 6px', fontWeight: 'bold' }}>Nguyễn Minh Anh</td>
                <td style={{ padding: '10px 6px' }}>12 - A01</td>
                <td style={{ padding: '10px 6px' }}>8 bài</td>
                <td style={{ padding: '10px 6px', color: 'var(--accent-green)' }}>8.8</td>
                <td style={{ padding: '10px 6px', color: 'var(--accent-green)' }}>Tốt (Rất chăm chỉ)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 6px', fontWeight: 'bold' }}>Lê Hải Nam</td>
                <td style={{ padding: '10px 6px' }}>12 - A01</td>
                <td style={{ padding: '10px 6px' }}>6 bài</td>
                <td style={{ padding: '10px 6px' }}>7.5</td>
                <td style={{ padding: '10px 6px', color: 'var(--accent-orange)' }}>Bình thường (Đang tiến bộ)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 6px', fontWeight: 'bold' }}>Phạm Khánh Huyền</td>
                <td style={{ padding: '10px 6px' }}>12 - D01</td>
                <td style={{ padding: '10px 6px' }}>9 bài</td>
                <td style={{ padding: '10px 6px', color: 'var(--accent-green)' }}>9.2</td>
                <td style={{ padding: '10px 6px', color: 'var(--accent-green)' }}>Xuất sắc (Đứng đầu lớp)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
