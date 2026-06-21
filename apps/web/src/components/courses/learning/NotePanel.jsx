import React, { useState, useEffect } from 'react';
import { HiPlus, HiClock, HiTrash, HiSave, HiBookOpen, HiDocumentText, HiBookmark } from 'react-icons/hi';

export default function NotePanel({
  lesson,
  videoTime = 0,
  onSeek
}) {
  const [activeTab, setActiveTab] = useState('timestamped'); // 'timestamped' or 'freeform'
  
  // Timestamped notes state
  const [timestampNotes, setTimestampNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTime, setNoteTime] = useState(0);

  // Free-form notepad state
  const [freeformContent, setFreeformContent] = useState('');
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  const lessonId = lesson?.id || 'default';
  const lessonTitle = lesson?.title || 'Bài học';

  // Load notes
  useEffect(() => {
    // Load timestamped notes
    const tsKey = `lesson_ts_notes_${lessonId}`;
    const savedTs = localStorage.getItem(tsKey);
    if (savedTs) {
      setTimestampNotes(JSON.parse(savedTs));
    } else {
      setTimestampNotes([]);
    }

    // Load freeform content
    const ffKey = `lesson_ff_notes_${lessonId}`;
    const savedFf = localStorage.getItem(ffKey);
    if (savedFf) {
      setFreeformContent(savedFf);
    } else {
      setFreeformContent('');
    }
  }, [lessonId]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCaptureTime = () => {
    setNoteTime(Math.floor(videoTime));
  };

  const handleAddTimestampNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const timeToSave = noteTime > 0 ? noteTime : Math.floor(videoTime);
    const newNote = {
      id: `note-${Date.now()}`,
      timeSeconds: timeToSave,
      text: newNoteText,
      createdAt: new Date().toLocaleDateString('vi-VN')
    };

    const updated = [...timestampNotes, newNote].sort((a, b) => a.timeSeconds - b.timeSeconds);
    setTimestampNotes(updated);
    localStorage.setItem(`lesson_ts_notes_${lessonId}`, JSON.stringify(updated));
    setNewNoteText('');
    setNoteTime(0);
  };

  const handleDeleteNote = (id) => {
    const updated = timestampNotes.filter(n => n.id !== id);
    setTimestampNotes(updated);
    localStorage.setItem(`lesson_ts_notes_${lessonId}`, JSON.stringify(updated));
  };

  const handleSaveFreeform = () => {
    localStorage.setItem(`lesson_ff_notes_${lessonId}`, freeformContent);
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2000);
  };

  return (
    <div className="note-panel animate-in">
      <div className="note-panel-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('timestamped')}
          className={`note-tab-btn ${activeTab === 'timestamped' ? 'active' : ''}`}
        >
          <HiBookmark />
          <span>Ghi chú bài học</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('freeform')}
          className={`note-tab-btn ${activeTab === 'freeform' ? 'active' : ''}`}
        >
          <HiDocumentText />
          <span>Sổ tay tự do</span>
        </button>
      </div>

      <div className="note-panel-content">
        {activeTab === 'timestamped' ? (
          <div className="timestamp-notes-view">
            <form onSubmit={handleAddTimestampNote} className="add-note-form">
              <div className="add-note-input-wrapper">
                <button
                  type="button"
                  onClick={handleCaptureTime}
                  className="capture-time-btn"
                  title="Ghi lại giây hiện tại của video"
                >
                  <HiClock />
                  <span>{formatTime(noteTime > 0 ? noteTime : Math.floor(videoTime))}</span>
                </button>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Nhập ghi chú quan trọng tại đây... (Mốc thời gian sẽ tự động lưu theo video)"
                  className="note-textarea"
                  rows={2}
                  required
                />
              </div>
              <div className="add-note-actions">
                <button type="submit" className="submit-note-btn">
                  <HiPlus /> Lưu ghi chú tại {formatTime(noteTime > 0 ? noteTime : Math.floor(videoTime))}
                </button>
              </div>
            </form>

            <div className="notes-list">
              {timestampNotes.length > 0 ? (
                timestampNotes.map((note) => (
                  <div key={note.id} className="note-card animate-in">
                    <div className="note-card-header">
                      <button
                        type="button"
                        onClick={() => onSeek && onSeek(note.timeSeconds)}
                        className="note-timestamp-seek-btn"
                        title="Xem lại đoạn video này"
                      >
                        <HiClock />
                        <span>{formatTime(note.timeSeconds)}</span>
                      </button>
                      <span className="note-date">{note.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="delete-note-btn"
                        title="Xóa ghi chú"
                      >
                        <HiTrash />
                      </button>
                    </div>
                    <p className="note-text-content">{note.text}</p>
                  </div>
                ))
              ) : (
                <div className="notes-list-empty">
                  <HiBookOpen className="empty-icon" />
                  <p>Chưa có ghi chú nào được lưu cho bài học này.</p>
                  <span>Hãy chụp lại mốc thời gian và viết lưu ý để ôn thi hiệu quả hơn.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="freeform-notes-view">
            <div className="freeform-header">
              <span>Sổ tay lưu trữ ý tưởng, dàn ý hoặc công thức học nhanh.</span>
              <button
                type="button"
                onClick={handleSaveFreeform}
                className="save-notepad-btn"
              >
                <HiSave />
                {isSavedNotify ? 'Đã lưu!' : 'Lưu lại'}
              </button>
            </div>
            <textarea
              value={freeformContent}
              onChange={(e) => setFreeformContent(e.target.value)}
              placeholder="Ghi chép tự do các kiến thức rộng mở, tự luyện thi hoặc nhắc nhở bản thân..."
              className="freeform-editor"
            />
          </div>
        )}
      </div>
    </div>
  );
}
