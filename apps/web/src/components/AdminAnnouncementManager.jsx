import { useState, useEffect, useRef } from 'react';
import { toast } from '../utils/toast';
import { 
  HiPlus, HiSearch, HiPencil, HiTrash, HiDuplicate, 
  HiEye, HiEyeOff, HiUpload, HiCalendar, HiTag, HiOutlineDocumentText,
  HiChevronLeft, HiChevronRight
} from 'react-icons/hi';
import { api } from '../api';
import DOMPurify from 'dompurify';

// Custom Rich Text Editor component
function RichTextEditor({ value, onChange, placeholder = 'Nhập nội dung thông báo...' }) {
  const [editorContent, setEditorContent] = useState(value || '');

  useEffect(() => {
    if (value !== editorContent) {
      setEditorContent(value || '');
    }
  }, [value]);

  const handleEditorInput = (e) => {
    const html = e.currentTarget.innerHTML;
    setEditorContent(html);
    onChange(html);
  };

  const execCommand = (command, arg = '') => {
    document.execCommand(command, false, arg);
    const editor = document.getElementById('neobrutalist-rt-editor');
    if (editor) {
      onChange(editor.innerHTML);
    }
  };

  const btnStyle = {
    padding: '4px 8px',
    background: '#FFF',
    border: '1.5px solid #2D3229',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '800',
    boxShadow: '1px 1px 0px #2D3229',
    transition: 'all 0.1s'
  };

  return (
    <div style={{ border: '2px solid #2D3229', borderRadius: '8px', overflow: 'hidden', background: '#FFF', boxShadow: '2px 2px 0px #2D3229' }}>
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        padding: '8px', 
        background: '#F0EDEB', 
        borderBottom: '2px solid #2D3229',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button type="button" onClick={() => execCommand('bold')} style={btnStyle} title="Chữ đậm"><b>B</b></button>
        <button type="button" onClick={() => execCommand('italic')} style={btnStyle} title="Chữ nghiêng"><i>I</i></button>
        <button type="button" onClick={() => execCommand('underline')} style={btnStyle} title="Gạch chân"><u>U</u></button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} style={btnStyle} title="Danh sách tròn">• List</button>
        <button type="button" onClick={() => {
          const url = prompt('Nhập địa chỉ URL của Link:');
          if (url) execCommand('createLink', url);
        }} style={btnStyle} title="Chèn Link">🔗 Link</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFF', padding: '2px 4px', border: '1.5px solid #2D3229', borderRadius: '4px' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>MÀU:</label>
          <input 
            type="color" 
            onChange={(e) => execCommand('foreColor', e.target.value)} 
            style={{ width: '22px', height: '18px', padding: 0, border: 'none', cursor: 'pointer', background: 'none' }} 
            title="Màu chữ" 
          />
        </div>
        <button type="button" onClick={() => execCommand('removeFormat')} style={{ ...btnStyle, background: '#FEE2E2', color: '#991B1B' }} title="Xóa định dạng">Xóa định dạng</button>
      </div>
      <div
        id="neobrutalist-rt-editor"
        contentEditable
        onInput={handleEditorInput}
        dangerouslySetInnerHTML={{ __html: editorContent }}
        placeholder={placeholder}
        style={{
          minHeight: '160px',
          padding: '12px',
          outline: 'none',
          backgroundColor: '#FFF',
          fontFamily: 'inherit',
          fontSize: '13px',
          lineHeight: '1.5'
        }}
      />
    </div>
  );
}

// Custom Neo-Brutalist Date Time Picker component
function NeoDateTimePicker({ label, value, onChange, required }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Parse initial value
  const dateVal = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(dateVal.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(dateVal.getFullYear());
  const [selectedDay, setSelectedDay] = useState(dateVal.getDate());
  const [selectedHour, setSelectedHour] = useState(dateVal.getHours());
  const [selectedMinute, setSelectedMinute] = useState(dateVal.getMinutes());

  // Close dropdown on click outside
  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Update selected values if parent value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
        setSelectedDay(d.getDate());
        setSelectedHour(d.getHours());
        setSelectedMinute(d.getMinutes());
      }
    }
  }, [value]);

  // Generate days of the month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Mon: 0, Sun: 6
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const prevMonthDays = getDaysInMonth(currentMonth - 1 < 0 ? 11 : currentMonth - 1, currentMonth - 1 < 0 ? currentYear - 1 : currentYear);

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    triggerChange(day, selectedHour, selectedMinute);
  };

  const handleHourSelect = (e) => {
    const hr = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
    setSelectedHour(hr);
    triggerChange(selectedDay, hr, selectedMinute);
  };

  const handleMinuteSelect = (e) => {
    const min = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
    setSelectedMinute(min);
    triggerChange(selectedDay, selectedHour, min);
  };

  const triggerChange = (day, hr, min) => {
    const newDate = new Date(currentYear, currentMonth, day, hr, min);
    const offset = newDate.getTimezoneOffset();
    const localDate = new Date(newDate.getTime() - offset * 60 * 1000);
    const isoString = localDate.toISOString().substring(0, 16);
    onChange(isoString);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthsVietnamese = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const formatDisplay = () => {
    if (!value) return 'Chọn ngày giờ...';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Chọn ngày giờ...';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          border: '1.5px solid #2D3229',
          borderRadius: '8px',
          background: '#FFF',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '1.5px 1.5px 0px #2D3229',
          userSelect: 'none'
        }}
      >
        <span>{formatDisplay()}</span>
        <HiCalendar style={{ fontSize: '18px', color: '#2D3229' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '105%',
          left: 0,
          zIndex: 9999,
          background: '#FFF',
          border: '2px solid #2D3229',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px #2D3229',
          padding: '16px',
          width: '320px',
          fontFamily: 'inherit'
        }}>
          {/* Header Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button type="button" onClick={handlePrevMonth} style={navBtnStyle}>
              <HiChevronLeft />
            </button>
            <strong style={{ fontSize: '13.5px', fontWeight: '900', color: '#2D3229' }}>
              {monthsVietnamese[currentMonth]} - {currentYear}
            </strong>
            <button type="button" onClick={handleNextMonth} style={navBtnStyle}>
              <HiChevronRight />
            </button>
          </div>

          {/* Weekday Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <span key={d} style={{ fontSize: '11px', fontWeight: '800', color: '#888' }}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '12px' }}>
            {Array.from({ length: firstDay }).map((_, i) => {
              const dayNum = prevMonthDays - firstDay + i + 1;
              return (
                <span key={`prev-${i}`} style={{ fontSize: '11.5px', color: '#CCC', padding: '6px 0', fontWeight: '700' }}>
                  {dayNum}
                </span>
              );
            })}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleDaySelect(day)}
                  style={{
                    border: 'none',
                    background: isSelected ? '#1C2B17' : 'transparent',
                    color: isSelected ? '#FFF' : '#2D3229',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    padding: '6px 0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.1s'
                  }}
                  onMouseEnter={e => { if(!isSelected) e.currentTarget.style.backgroundColor = '#F0EDEB'; }}
                  onMouseLeave={e => { if(!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1.5px dashed #2D3229',
            paddingTop: '12px',
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#2D3229' }}>⏰ GIỜ:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="number" 
                min="0" 
                max="23"
                value={String(selectedHour).padStart(2, '0')}
                onChange={handleHourSelect}
                style={timeInputStyle}
              />
              <span style={{ fontWeight: 'bold' }}>:</span>
              <input 
                type="number" 
                min="0" 
                max="59"
                value={String(selectedMinute).padStart(2, '0')}
                onChange={handleMinuteSelect}
                style={timeInputStyle}
              />
            </div>
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: '#1C2B17',
                color: '#FFF',
                border: '1.5px solid #2D3229',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '1.5px 1.5px 0px #2D3229'
              }}
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  border: '1.5px solid #2D3229',
  background: '#FFF',
  borderRadius: '4px',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '1px 1px 0px #2D3229'
};

const timeInputStyle = {
  width: '42px',
  height: '28px',
  textAlign: 'center',
  border: '1.5px solid #2D3229',
  borderRadius: '4px',
  fontSize: '12.5px',
  fontWeight: '800',
  outline: 'none',
  padding: 0
};



// Custom Neo-Brutalist Image Cropper Modal component (Aspect Ratio 16:9)
function NeoImageCropper({ imageSrc, onCrop, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imgElement, setImgElement] = useState(null);
  const [fitDimensions, setFitDimensions] = useState({ w: 0, h: 0 });
  
  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      let finalSrc = imageSrc;

      // Apply crossOrigin and cache buster only for remote HTTP URLs
      if (imageSrc.startsWith('http')) {
        img.crossOrigin = 'anonymous';
        // Append cache buster to prevent browser cache CORS issues
        finalSrc = imageSrc + (imageSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
      }

      img.src = finalSrc;
      img.onload = () => {
        setImgElement(img);
        
        // Calculate fit cover dimensions for 400x225 crop box
        const boxW = 400;
        const boxH = 225;
        const imgRatio = img.width / img.height;
        const boxRatio = boxW / boxH;

        let w, h;
        if (imgRatio > boxRatio) {
          h = boxH;
          w = boxH * imgRatio;
        } else {
          w = boxW;
          h = boxW / imgRatio;
        }
        setFitDimensions({ w, h });
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      };
      
      img.onerror = () => {
        console.warn('[Cropper] Image failed to load with CORS. Retrying without CORS...');
        const retryImg = new Image();
        retryImg.src = imageSrc;
        retryImg.onload = () => {
          setImgElement(retryImg);
          const boxW = 400;
          const boxH = 225;
          const imgRatio = retryImg.width / retryImg.height;
          const boxRatio = boxW / boxH;

          let w, h;
          if (imgRatio > boxRatio) {
            h = boxH;
            w = boxH * imgRatio;
          } else {
            w = boxW;
            h = boxW / imgRatio;
          }
          setFitDimensions({ w, h });
          setZoom(1);
          setOffsetX(0);
          setOffsetY(0);
        };
      };
    }
  }, [imageSrc]);

  const handleSave = () => {
    if (!imgElement) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');

      // Fill white background
      ctx.fillStyle = '#FFF';
      ctx.fillRect(0, 0, 800, 450);

      const scale = 800 / 400; // ratio of canvas to crop box (800 / 400 = 2)
      const cx = 800 / 2;
      const cy = 450 / 2;

      ctx.save();
      ctx.translate(cx + offsetX * scale, cy + offsetY * scale);
      ctx.scale(zoom, zoom);
      ctx.drawImage(imgElement, -fitDimensions.w * scale / 2, -fitDimensions.h * scale / 2, fitDimensions.w * scale, fitDimensions.h * scale);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) {
          toast('Không thể xuất dữ liệu ảnh cắt!', 'error');
          return;
        }
        onCrop(blob);
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('[Cropper Canvas Error]', err);
      toast(`Lỗi cắt ảnh: ${err.message || err}. Hệ thống sẽ sử dụng ảnh gốc!`, 'warning');
      onClose();
    }
  };

  // Dragging event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offsetX, y: e.touches[0].clientY - offsetY });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };

  return (
    <div style={cropperOverlayStyle}>
      <div style={cropperModalStyle}>
        <header style={cropperHeaderStyle}>
          <strong style={{ fontSize: '13.5px', fontWeight: '900' }}>✂️ Cắt Ảnh Banner (Tỉ lệ 16:9)</strong>
          <button type="button" onClick={onClose} style={cropperCloseBtnStyle}>×</button>
        </header>

        <div style={cropperBodyStyle}>
          {/* Main Cropping Container */}
          <div 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{
              position: 'relative',
              width: '460px',
              height: '320px',
              border: '2.5px solid #2D3229',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#E2E8F0',
              boxShadow: '3px 3px 0px #2D3229',
              margin: '0 auto 20px auto',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {/* The Image Element */}
            {imgElement && (
              <img
                src={imageSrc}
                alt="To Crop"
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${fitDimensions.w}px`,
                  height: `${fitDimensions.h}px`,
                  transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                  transformOrigin: 'center',
                  pointerEvents: 'none',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  userSelect: 'none'
                }}
              />
            )}

            {/* Dark overlays for outer areas */}
            {/* Top dark area */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '47.5px', backgroundColor: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />
            {/* Bottom dark area */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '47.5px', backgroundColor: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />
            {/* Left dark area */}
            <div style={{ position: 'absolute', top: '47.5px', bottom: '47.5px', left: 0, width: '30px', backgroundColor: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />
            {/* Right dark area */}
            <div style={{ position: 'absolute', top: '47.5px', bottom: '47.5px', right: 0, width: '30px', backgroundColor: 'rgba(0,0,0,0.65)', pointerEvents: 'none' }} />

            {/* Clear Crop Box Frame */}
            <div style={{
              position: 'absolute',
              top: '47.5px',
              left: '30px',
              width: '400px',
              height: '225px',
              border: '2px solid #FFF',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              boxShadow: '0 0 8px rgba(0,0,0,0.3)'
            }}>
              {/* Dotted Grid lines (Rule of Thirds) */}
              <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTop: '1.2px dashed rgba(255,255,255,0.75)' }} />
              <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTop: '1.2px dashed rgba(255,255,255,0.75)' }} />
              <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, borderLeft: '1.2px dashed rgba(255,255,255,0.75)' }} />
              <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, borderLeft: '1.2px dashed rgba(255,255,255,0.75)' }} />

              {/* L-shaped corners */}
              {/* Top Left */}
              <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '16px', height: '16px', borderTop: '3px solid #FFF', borderLeft: '3px solid #FFF' }} />
              {/* Top Right */}
              <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderTop: '3px solid #FFF', borderRight: '3px solid #FFF' }} />
              {/* Bottom Left */}
              <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '16px', height: '16px', borderBottom: '3px solid #FFF', borderLeft: '3px solid #FFF' }} />
              {/* Bottom Right */}
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderBottom: '3px solid #FFF', borderRight: '3px solid #FFF' }} />
            </div>

            {/* Instruction tooltip in corner */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              🖱️ Nhấp và kéo ảnh để căn chỉnh vùng cắt
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={controlLabelStyle}>🔍 Phóng to (Zoom):</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                style={{ flex: 1, cursor: 'pointer' }}
              />
              <span style={{ minWidth: '36px', fontWeight: '800', fontSize: '12px' }}>{zoom.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        <footer style={cropperFooterStyle}>
          <button type="button" onClick={onClose} style={cropperCancelBtnStyle}>Hủy</button>
          <button type="button" onClick={handleSave} style={cropperSaveBtnStyle}>Cắt & Lưu Ảnh ✂️</button>
        </footer>
      </div>
    </div>
  );
}

const cropperOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '20px'
};

const cropperModalStyle = {
  width: '100%',
  maxWidth: '520px',
  background: '#FCFBFA',
  border: '3px solid #2D3229',
  borderRadius: '12px',
  boxShadow: '5px 5px 0px #2D3229',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const cropperHeaderStyle = {
  padding: '12px 18px',
  borderBottom: '2px solid #2D3229',
  background: '#F0EDEB',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#2D3229'
};

const cropperCloseBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '22px',
  fontWeight: 'bold',
  cursor: 'pointer',
  padding: 0
};

const cropperBodyStyle = {
  padding: '20px'
};

const cropperFooterStyle = {
  padding: '10px 18px',
  borderTop: '2px solid #2D3229',
  background: '#F0EDEB',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px'
};

const cropperCancelBtnStyle = {
  padding: '5px 12px',
  background: '#FFF',
  border: '1.5px solid #2D3229',
  borderRadius: '6px',
  fontSize: '12.5px',
  fontWeight: '800',
  cursor: 'pointer',
  boxShadow: '1px 1px 0px #2D3229'
};

const cropperSaveBtnStyle = {
  padding: '5px 12px',
  background: '#1C2B17',
  color: '#FFF',
  border: '1.5px solid #000',
  borderRadius: '6px',
  fontSize: '12.5px',
  fontWeight: '800',
  cursor: 'pointer',
  boxShadow: '1px 1px 0px #2D3229'
};

const controlLabelStyle = {
  width: '130px',
  fontSize: '12px',
  fontWeight: '800',
  color: '#2D3229'
};


export default function AdminAnnouncementManager({ currentUser, addLog }) {
  const [announcements, setAnnouncements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState('priority');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create', 'edit', 'duplicate'
  const [selectedId, setSelectedId] = useState(null);

  // Image Cropper States
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    type: 'EVENT',
    content: '',
    bannerUrl: '',
    voucherCode: '',
    showCopyButton: true,
    buttonText: '',
    buttonUrl: '',
    buttonTarget: '_blank',
    targetRoles: ['EVERYONE'],
    targetPages: ['All Pages'],
    allowHide: true,
    hideDurationHours: 24,
    priority: 0,
    animation: 'fade',
    status: 'DRAFT',
    startAt: '',
    endAt: ''
  });

  const loadAnnouncements = async (p = page) => {
    setLoading(true);
    try {
      const filters = {};
      if (search.trim()) filters.title = search.trim();
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      if (typeFilter !== 'ALL') filters.type = typeFilter;

      const res = await api.getAdminAnnouncements({
        ...filters,
        page: p,
        limit
      });

      if (res && res.announcements) {
        // Apply frontend sorting as well to ensure correctness
        let sorted = [...res.announcements];
        sorted.sort((a, b) => {
          let valA = a[sortField];
          let valB = b[sortField];

          if (sortField === 'startAt' || sortField === 'endAt' || sortField === 'updatedAt') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
          }

          if (sortOrder === 'asc') {
            return valA > valB ? 1 : -1;
          } else {
            return valA < valB ? 1 : -1;
          }
        });

        setAnnouncements(sorted);
        setTotal(res.pagination?.total || 0);
        setPage(res.pagination?.page || 1);
      }
    } catch (err) {
      console.error(err);
      toast('Không thể tải danh sách thông báo popup!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(page);
  }, [statusFilter, typeFilter, sortField, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnnouncements(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle file select to open cropper
  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast('Định dạng tệp không hợp lệ! Vui lòng chọn ảnh PNG, JPG, JPEG hoặc WEBP.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropperSrc(event.target.result); // Base64 Data URL
      setShowCropper(true);
    };
    reader.onerror = () => {
      toast('Lỗi đọc tệp tin hình ảnh!', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Perform upload after cropping is complete
  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);
    if (!croppedBlob) {
      toast('Lỗi: Dữ liệu ảnh cắt bị trống!', 'error');
      return;
    }

    const oldUrl = form.bannerUrl;

    try {
      toast('Đang tải ảnh đã cắt lên...', 'info');
      const croppedFile = new File([croppedBlob], 'banner_cropped.jpg', { type: 'image/jpeg' });
      const res = await api.uploadFile(croppedFile);
      if (res && res.url) {
        setForm(prev => ({ ...prev, bannerUrl: res.url }));
        toast('Cắt và tải ảnh banner lên thành công!', 'success');

        // Automatically clean up old uploaded image from server
        if (oldUrl && (oldUrl.includes('/uploads/') || oldUrl.includes('localhost:4000'))) {
          try {
            await api.deleteUploadedFile(oldUrl);
            console.log('[Cropper] Cleaned up old file:', oldUrl);
          } catch (delErr) {
            console.warn('[Cropper] Failed to delete old file:', delErr);
          }
        }
      } else {
        toast('Lỗi: Máy chủ tải lên không trả về URL ảnh!', 'error');
      }
    } catch (err) {
      toast(`Lỗi tải ảnh lên: ${err.message || err}`, 'error');
    }
  };

  // Toggle role checkboxes
  const handleRoleToggle = (role) => {
    let roles = [...form.targetRoles];
    if (role === 'EVERYONE') {
      if (roles.includes('EVERYONE')) {
        roles = ['GUEST'];
      } else {
        roles = ['EVERYONE'];
      }
    } else {
      roles = roles.filter(r => r !== 'EVERYONE');
      if (roles.includes(role)) {
        roles = roles.filter(r => r !== role);
      } else {
        roles.push(role);
      }
      if (roles.length === 0) {
        roles = ['EVERYONE'];
      }
    }
    setForm(prev => ({ ...prev, targetRoles: roles }));
  };

  // Toggle page checkboxes
  const handlePageToggle = (pageName) => {
    let pages = [...form.targetPages];
    if (pageName === 'All Pages') {
      if (pages.includes('All Pages')) {
        pages = ['Home'];
      } else {
        pages = ['All Pages'];
      }
    } else {
      pages = pages.filter(p => p !== 'All Pages');
      if (pages.includes(pageName)) {
        pages = pages.filter(p => p !== pageName);
      } else {
        pages.push(pageName);
      }
      if (pages.length === 0) {
        pages = ['All Pages'];
      }
    }
    setForm(prev => ({ ...prev, targetPages: pages }));
  };

  // Helper: lấy giờ địa phương đúng cho input datetime-local
  const localDT = (date = new Date()) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
  const defaultEndAt = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return localDT(d);
  };

  // Open creation modal
  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedId(null);
    setForm({
      title: '',
      type: 'EVENT',
      content: '',
      bannerUrl: '',
      voucherCode: '',
      showCopyButton: true,
      buttonText: '',
      buttonUrl: '',
      buttonTarget: '_blank',
      targetRoles: ['EVERYONE'],
      targetPages: ['All Pages'],
      allowHide: true,
      hideDurationHours: 24,
      priority: 0,
      animation: 'fade',
      status: 'DRAFT',
      startAt: localDT(),
      endAt: defaultEndAt()
    });
    setShowModal(true);
  };

  // Open edit modal
  const handleOpenEdit = async (ann) => {
    setFormMode('edit');
    setSelectedId(ann.id);
    setForm({
      title: ann.title,
      type: ann.type,
      content: ann.content,
      bannerUrl: ann.bannerUrl || '',
      voucherCode: ann.voucherCode || '',
      showCopyButton: ann.showCopyButton,
      buttonText: ann.buttonText || '',
      buttonUrl: ann.buttonUrl || '',
      buttonTarget: ann.buttonTarget || '_blank',
      targetRoles: ann.targetRoles || ['EVERYONE'],
      targetPages: ann.targetPages || ['All Pages'],
      allowHide: ann.allowHide,
      hideDurationHours: ann.hideDurationHours,
      priority: ann.priority,
      animation: ann.animation,
      status: ann.status,
      startAt: new Date(ann.startAt).toISOString().substring(0, 16),
      endAt: new Date(ann.endAt).toISOString().substring(0, 16)
    });
    setShowModal(true);
  };

  // Open duplicate modal
  const handleOpenDuplicate = (ann) => {
    setFormMode('duplicate');
    setSelectedId(null);
    setForm({
      title: `${ann.title} (Bản sao)`,
      type: ann.type,
      content: ann.content,
      bannerUrl: ann.bannerUrl || '',
      voucherCode: ann.voucherCode || '',
      showCopyButton: ann.showCopyButton,
      buttonText: ann.buttonText || '',
      buttonUrl: ann.buttonUrl || '',
      buttonTarget: ann.buttonTarget || '_blank',
      targetRoles: ann.targetRoles || ['EVERYONE'],
      targetPages: ann.targetPages || ['All Pages'],
      allowHide: ann.allowHide,
      hideDurationHours: ann.hideDurationHours,
      priority: ann.priority,
      animation: ann.animation,
      status: 'DRAFT', // Duplicate starts as draft
      startAt: localDT(),
      endAt: defaultEndAt()
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Vui lòng nhập tiêu đề thông báo!', 'error');
      return;
    }
    if (!form.content.trim() || form.content.trim() === '<br>') {
      toast('Vui lòng nhập nội dung thông báo!', 'error');
      return;
    }

    try {
      const payload = {
        ...form,
        priority: Number(form.priority),
        hideDurationHours: Number(form.hideDurationHours),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString()
      };

      if (formMode === 'create' || formMode === 'duplicate') {
        const res = await api.createAdminAnnouncement(payload);
        if (res) {
          toast('Tạo mới thông báo popup thành công!', 'success');
          if (addLog) addLog(`Tạo thông báo popup: "${payload.title}"`, 'sys');
        }
      } else {
        const res = await api.updateAdminAnnouncement(selectedId, payload);
        if (res) {
          toast('Cập nhật thông báo popup thành công!', 'success');
          if (addLog) addLog(`Cập nhật thông báo popup ID ${selectedId}: "${payload.title}"`, 'sys');
        }
      }

      setShowModal(false);
      loadAnnouncements(page);
    } catch (err) {
      toast(err.message || 'Lỗi lưu thông tin popup!', 'error');
    }
  };

  // Handle Delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thông báo popup "${title}" không?`)) {
      return;
    }
    try {
      await api.deleteAdminAnnouncement(id);
      toast('Đã xóa thông báo popup thành công!', 'success');
      if (addLog) addLog(`Xóa thông báo popup: "${title}"`, 'sys');
      loadAnnouncements(page);
    } catch (err) {
      toast(err.message || 'Lỗi xóa thông báo!', 'error');
    }
  };

  // Handle Toggle Status (Active / Paused)
  const handleToggleStatus = async (ann) => {
    const newStatus = ann.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.updateAdminAnnouncementStatus(ann.id, newStatus);
      toast(`Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'tạm dừng'} thông báo popup thành công!`, 'success');
      if (addLog) addLog(`Đổi trạng thái thông báo popup "${ann.title}" sang ${newStatus}`, 'sys');
      loadAnnouncements(page);
    } catch (err) {
      toast(err.message || 'Lỗi đổi trạng thái!', 'error');
    }
  };

  // Helpers for labels
  const getTypeLabel = (type) => {
    const map = {
      EVENT: 'Sự kiện',
      VOUCHER: 'Mã giảm giá',
      PROMOTION: 'Khuyến mãi',
      MAINTENANCE: 'Bảo trì',
      NEWS: 'Tin tức'
    };
    return map[type] || type;
  };

  const getTypeColor = (type) => {
    const map = {
      EVENT: '#DBEAFE',
      VOUCHER: '#FEE2E2',
      PROMOTION: '#FEF3C7',
      MAINTENANCE: '#F3F4F6',
      NEWS: '#E0E7FF'
    };
    return map[type] || '#FFFFFF';
  };

  const getStatusLabel = (status) => {
    const map = {
      DRAFT: 'Bản nháp',
      SCHEDULED: 'Lên lịch',
      ACTIVE: 'Hoạt động',
      PAUSED: 'Tạm ngưng',
      EXPIRED: 'Hết hạn'
    };
    return map[status] || status;
  };

  const getStatusClass = (status) => {
    const map = {
      DRAFT: 'pending',
      SCHEDULED: 'contacted',
      ACTIVE: 'success',
      PAUSED: 'pending',
      EXPIRED: 'pending'
    };
    return map[status] || 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="admin-card" style={{ border: '2.5px solid #2D3229', boxShadow: '4px 4px 0px #2D3229' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '950', color: '#1C2B17', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📢 QUẢN LÝ ANNOUNCEMENT POPUP (GLOBAL CAMPAIGN POPUP)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
              Cấu hình các chiến dịch thông báo nổi bật cho các trang và phân quyền người dùng tương ứng.
            </p>
          </div>
          
          <button 
            onClick={handleOpenCreate} 
            className="admin-back-btn"
            style={{ width: 'auto', background: '#1C2B17', color: '#FFFFFF', borderColor: '#000', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <HiPlus style={{ strokeWidth: 2 }} /> Tạo Popup Mới
          </button>
        </div>

        {/* Filters Section */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <HiSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#7A7A7A', fontSize: '16px' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề thông báo..."
              className="admin-form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ flex: '0 0 160px' }}>
            <select
              className="admin-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '100%', height: '40px', minWidth: '150px' }}
            >
              <option value="ALL">Tất cả loại</option>
              <option value="EVENT">Sự kiện</option>
              <option value="VOUCHER">Mã giảm giá</option>
              <option value="PROMOTION">Khuyến mãi</option>
              <option value="MAINTENANCE">Bảo trì</option>
              <option value="NEWS">Tin tức</option>
            </select>
          </div>

          <div style={{ flex: '0 0 160px' }}>
            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', height: '40px', minWidth: '150px' }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="SCHEDULED">Lên lịch</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="PAUSED">Tạm ngưng</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
          </div>

          <div style={{ flex: '0 0 200px' }}>
            <select
              className="admin-filter-select"
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field);
                setSortOrder(order);
              }}
              style={{ width: '100%', height: '40px', minWidth: '180px' }}
            >
              <option value="priority-desc">Độ ưu tiên cao nhất</option>
              <option value="priority-asc">Độ ưu tiên thấp nhất</option>
              <option value="startAt-desc">Bắt đầu muộn nhất</option>
              <option value="startAt-asc">Bắt đầu sớm nhất</option>
              <option value="updatedAt-desc">Mới cập nhật</option>
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="leads-table-container" style={{ border: '2px solid #2D3229', boxShadow: '2px 2px 0px #2D3229' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="stats-spinner" style={{ margin: '0 auto 16px auto' }} />
              <p style={{ fontWeight: 'bold' }}>Đang tải danh sách popup...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: 'bold' }}>
              Không tìm thấy thông báo popup nào phù hợp. 🔍
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Banner</th>
                  <th>Tiêu đề</th>
                  <th style={{ width: '110px' }}>Loại</th>
                  <th style={{ width: '110px' }}>Trạng thái</th>
                  <th style={{ width: '80px' }}>Ưu tiên</th>
                  <th>Thời gian chạy</th>
                  <th style={{ width: '110px' }}>Cập nhật lúc</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann.id}>
                    <td>
                      {ann.bannerUrl ? (
                        <img 
                          src={ann.bannerUrl} 
                          alt="Banner" 
                          style={{ width: '60px', height: '35px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #2D3229' }} 
                        />
                      ) : (
                        <div style={{ width: '60px', height: '35px', background: '#E8ECF1', borderRadius: '4px', border: '1px dashed #2D3229', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748B', fontWeight: '800' }}>
                          Trống
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: '900', fontSize: '13.5px', color: '#0E100D' }}>{ann.title}</div>
                      <div style={{ fontSize: '11px', color: '#7A7A7A', marginTop: '2px', fontWeight: '700' }}>
                        Trang: {ann.targetPages.join(', ')} • Quyền: {ann.targetRoles.join(', ')}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1.5px solid #2D3229',
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: getTypeColor(ann.type)
                      }}>
                        {getTypeLabel(ann.type)}
                      </span>
                    </td>
                    <td>
                      <span className={`lead-status-badge ${getStatusClass(ann.status)}`}>
                        {getStatusLabel(ann.status)}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', textAlign: 'center' }}>{ann.priority}</td>
                    <td style={{ fontSize: '11.5px', color: '#333', fontWeight: '700' }}>
                      <div>Từ: {new Date(ann.startAt).toLocaleString('vi-VN')}</div>
                      <div style={{ marginTop: '2px' }}>Đến: {new Date(ann.endAt).toLocaleString('vi-VN')}</div>
                    </td>
                    <td style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>
                      {new Date(ann.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {ann.status !== 'EXPIRED' && (
                          <button
                            onClick={() => handleToggleStatus(ann)}
                            className="admin-table-btn"
                            style={{ 
                              background: ann.status === 'ACTIVE' ? '#FFFBEB' : '#D1FAE5',
                              borderColor: '#2D3229',
                              color: ann.status === 'ACTIVE' ? '#D97706' : '#065F46'
                            }}
                            title={ann.status === 'ACTIVE' ? 'Tạm dừng hiển thị' : 'Kích hoạt hiển thị'}
                          >
                            {ann.status === 'ACTIVE' ? <HiEyeOff /> : <HiEye />}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(ann)}
                          className="admin-table-btn"
                          style={{ background: '#DBEAFE', color: '#2563EB' }}
                          title="Sửa"
                        >
                          <HiPencil />
                        </button>
                        <button
                          onClick={() => handleOpenDuplicate(ann)}
                          className="admin-table-btn"
                          style={{ background: '#F3E8FF', color: '#7C3AED' }}
                          title="Nhân bản"
                        >
                          <HiDuplicate />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id, ann.title)}
                          className="admin-table-btn"
                          style={{ background: '#FEE2E2', color: '#EF4444' }}
                          title="Xóa"
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {total > limit && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            <button
              disabled={page === 1}
              onClick={() => { setPage(page - 1); loadAnnouncements(page - 1); }}
              className="admin-back-btn"
              style={{ width: 'auto', margin: 0, padding: '6px 12px', fontSize: '12px', boxShadow: page === 1 ? 'none' : '2px 2px 0px #000' }}
            >
              ◀ Trang trước
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontWeight: '900', fontSize: '13px' }}>
              {page} / {Math.ceil(total / limit)}
            </span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => { setPage(page + 1); loadAnnouncements(page + 1); }}
              className="admin-back-btn"
              style={{ width: 'auto', margin: 0, padding: '6px 12px', fontSize: '12px', boxShadow: page >= Math.ceil(total / limit) ? 'none' : '2px 2px 0px #000' }}
            >
              Trang sau ▶
            </button>
          </div>
        )}
      </div>

      {/* CRUD Form Modal */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '1300px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formMode === 'create' && '🆕 Tạo Mới Thông Báo Popup'}
                {formMode === 'edit' && '✏️ Chỉnh Sửa Thông Báo Popup'}
                {formMode === 'duplicate' && '👯 Nhân Bản Thông Báo Popup'}
              </span>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* LEFT: Form Fields + Footer */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <div className="admin-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Tiêu đề & Loại */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Tiêu đề thông báo *</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      required 
                      placeholder="VD: Khai xuân đón lộc - Giảm ngay 30% khóa học!"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Loại thông báo *</label>
                    <select 
                      className="admin-form-input" 
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="EVENT">EVENT (Sự kiện)</option>
                      <option value="VOUCHER">VOUCHER (Mã giảm giá)</option>
                      <option value="PROMOTION">PROMOTION (Khuyến mãi)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Bảo trì)</option>
                      <option value="NEWS">NEWS (Tin tức)</option>
                    </select>
                  </div>
                </div>

                {/* Banner Upload & Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px', alignItems: 'start' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Hình ảnh Banner (Ảnh ngang, tỉ lệ 16:9)</label>
                    <div style={{ 
                      border: '2px dashed #2D3229', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      textAlign: 'center', 
                      background: '#FCFBFA',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <HiUpload style={{ fontSize: '24px', color: '#64748B', marginBottom: '8px' }} />
                      <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', margin: 0 }}>
                        Nhấn để tải lên ảnh (PNG, JPG, JPEG, WEBP)
                      </p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleBannerSelect}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                      />
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <input 
                        type="text" 
                        className="admin-form-input" 
                        placeholder="Hoặc nhập trực tiếp URL hình ảnh..."
                        value={form.bannerUrl}
                        onChange={e => setForm({ ...form, bannerUrl: e.target.value })}
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Xem trước ảnh Banner</label>
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '16 / 9', 
                      border: '2px solid #2D3229', 
                      borderRadius: '8px', 
                      background: '#FFF', 
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '1.5px 1.5px 0px #2D3229',
                      position: 'relative'
                    }}>
                      {form.bannerUrl ? (
                        <>
                          <img 
                            src={form.bannerUrl} 
                            alt="Banner Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCropperSrc(form.bannerUrl);
                              setShowCropper(true);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              right: '6px',
                              background: '#FFF',
                              border: '1.5px solid #2D3229',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              boxShadow: '1px 1px 0px #2D3229',
                              zIndex: 5
                            }}
                          >
                            ✏️ Chỉnh sửa
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#7A7A7A', fontWeight: '700', fontStyle: 'italic' }}>
                          Chưa có ảnh banner được chọn
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nội dung Rich Text Editor */}
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label>Nội dung thông báo (Rich Text) *</label>
                  <RichTextEditor 
                    value={form.content} 
                    onChange={html => setForm({ ...form, content: html })}
                  />
                </div>

                {/* Voucher Info */}
                <div style={{ border: '2px solid #2D3229', borderRadius: '12px', padding: '16px', background: '#FFFDF5', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label style={{ color: '#854D0E' }}>Mã giảm giá liên kết (Voucher Code - Tùy chọn)</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="VD: WELCOME30 (Mã này phải tồn tại trên hệ thống Voucher)"
                      value={form.voucherCode}
                      onChange={e => setForm({ ...form, voucherCode: e.target.value.toUpperCase().trim() })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0, justifyContent: 'center' }}>
                    <label style={{ color: '#854D0E' }}>Nút sao chép mã</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '40px' }}>
                      <input 
                        type="checkbox" 
                        id="showCopyButton" 
                        checked={form.showCopyButton}
                        onChange={e => setForm({ ...form, showCopyButton: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="showCopyButton" style={{ fontSize: '13px', fontWeight: '700', textTransform: 'none', cursor: 'pointer' }}>
                        Hiển thị nút "Copy"
                      </label>
                    </div>
                  </div>
                </div>

                {/* Button Action */}
                <div style={{ border: '2px solid #2D3229', borderRadius: '12px', padding: '16px', background: '#F8FAFC', display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '16px' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Nhãn nút bấm (Button Text)</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="VD: Xem chi tiết, Đăng ký ngay..."
                      value={form.buttonText}
                      onChange={e => setForm({ ...form, buttonText: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Đường dẫn liên kết (Button URL)</label>
                    <input 
                      type="text" 
                      className="admin-form-input" 
                      placeholder="VD: https://edupath.vn/courses/10"
                      value={form.buttonUrl}
                      onChange={e => setForm({ ...form, buttonUrl: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Chế độ mở trang</label>
                    <select 
                      className="admin-form-input"
                      value={form.buttonTarget}
                      onChange={e => setForm({ ...form, buttonTarget: e.target.value })}
                    >
                      <option value="_blank">Mở tab mới (_blank)</option>
                      <option value="_self">Tab hiện tại (_self)</option>
                    </select>
                  </div>
                </div>

                {/* Đối tượng & Trang hiển thị */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Target Roles */}
                  <div style={{ border: '2px solid #2D3229', borderRadius: '12px', padding: '14px', background: '#FCFBFA' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1.5px dashed #2D3229', paddingBottom: '4px' }}>
                      👥 ĐỐI TƯỢNG HIỂN THỊ (ROLES)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={form.targetRoles.includes('EVERYONE')}
                          onChange={() => handleRoleToggle('EVERYONE')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Hiển thị cho tất cả (Everyone)
                      </label>
                      {['GUEST', 'STUDENT', 'TEACHER', 'ADMIN'].map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', paddingLeft: '8px' }}>
                          <input 
                            type="checkbox" 
                            checked={form.targetRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          {role === 'GUEST' && 'Khách chưa đăng nhập (GUEST)'}
                          {role === 'STUDENT' && 'Học sinh (STUDENT)'}
                          {role === 'TEACHER' && 'Giáo viên (TEACHER)'}
                          {role === 'ADMIN' && 'Quản trị viên (ADMIN)'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Target Pages */}
                  <div style={{ border: '2px solid #2D3229', borderRadius: '12px', padding: '14px', background: '#FCFBFA' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1.5px dashed #2D3229', paddingBottom: '4px' }}>
                      📖 TRANG HIỂN THỊ (PAGES)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={form.targetPages.includes('All Pages')}
                          onChange={() => handlePageToggle('All Pages')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Hiển thị toàn bộ trang (All Pages)
                      </label>
                      {['Home', 'Courses', 'Practice', 'Exam', 'AI Coach', 'Profile', 'Dashboard'].map(page => (
                        <label key={page} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', paddingLeft: '8px' }}>
                          <input 
                            type="checkbox" 
                            checked={form.targetPages.includes(page)}
                            onChange={() => handlePageToggle(page)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Trang {page}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date range & Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <NeoDateTimePicker
                      label="Thời gian bắt đầu *"
                      value={form.startAt}
                      onChange={val => setForm({ ...form, startAt: val })}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <NeoDateTimePicker
                      label="Thời gian kết thúc *"
                      value={form.endAt}
                      onChange={val => setForm({ ...form, endAt: val })}
                      required
                    />
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Độ ưu tiên hiển thị (Priority)</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value })}
                      placeholder="VD: 100"
                    />
                  </div>
                </div>

                {/* Hide settings & Animation & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                  {/* Allow Hide Duration */}
                  <div style={{ border: '2px solid #2D3229', borderRadius: '8px', padding: '10px 14px', background: '#FCFBFA', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        id="allowHide" 
                        checked={form.allowHide}
                        onChange={e => setForm({ ...form, allowHide: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="allowHide" style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer', margin: 0 }}>
                        Cho phép ẩn
                      </label>
                    </div>

                    {form.allowHide && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                        <select 
                          className="admin-form-input"
                          value={form.hideDurationHours}
                          onChange={e => setForm({ ...form, hideDurationHours: Number(e.target.value) })}
                          style={{ padding: '4px 8px', height: '32px' }}
                        >
                          <option value={24}>Ẩn trong 24 giờ</option>
                          <option value={48}>Ẩn trong 48 giờ</option>
                          <option value={72}>Ẩn trong 72 giờ</option>
                          <option value={168}>Ẩn trong 1 tuần (168 giờ)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Hiệu ứng xuất hiện</label>
                    <select 
                      className="admin-form-input"
                      value={form.animation}
                      onChange={e => setForm({ ...form, animation: e.target.value })}
                    >
                      <option value="fade">Hiệu ứng Fade (Mờ dần)</option>
                      <option value="zoom">Hiệu ứng Zoom (Phóng to)</option>
                      <option value="slide">Hiệu ứng Slide (Trượt từ trên)</option>
                      <option value="bounce">Hiệu ứng Bounce (Nhún nảy)</option>
                    </select>
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label>Trạng thái phát hành</label>
                    <select 
                      className="admin-form-input"
                      value={form.status}
                      disabled={formMode === 'edit' && form.status === 'EXPIRED'}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="DRAFT">DRAFT (Bản nháp)</option>
                      <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                      <option value="PAUSED">PAUSED (Tạm dừng)</option>
                    </select>
                  </div>
                </div>

              </div> {/* end admin-modal-body */}

              <footer className="admin-modal-footer" style={{ borderTop: '2px solid #2D3229', background: '#F0EDEB', flexShrink: 0, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="admin-back-btn" 
                  style={{ background: '#FFF', boxShadow: 'none', width: 'auto', margin: 0 }}
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="admin-back-btn"
                  style={{ background: '#1C2B17', color: '#FFFFFF', borderColor: '#000', width: 'auto', margin: 0 }}
                >
                  {formMode === 'create' && 'Lưu & Kích hoạt 🚀'}
                  {formMode === 'edit' && 'Cập nhật thay đổi 💾'}
                  {formMode === 'duplicate' && 'Tạo bản sao mới 👯'}
                </button>
              </footer>
              </div> {/* end left column */}

              {/* RIGHT: Live Preview Panel */}
              <div style={{
                width: '390px',
                flexShrink: 0,
                borderLeft: '2px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Preview Header */}
                <div style={{
                  padding: '12px 18px',
                  background: '#1C2B17',
                  borderBottom: '2px solid #2D3229',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#4ade80', display: 'inline-block',
                      boxShadow: '0 0 8px #4ade80'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '2px', textTransform: 'uppercase' }}>
                      Xem trước
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: '0.5px' }}>Live Preview</span>
                </div>

                {/* Preview Body - dot-grid canvas */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '20px 16px',
                  display: 'flex', flexDirection: 'column', gap: '0',
                  background: '#F1F5F9',
                  backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
                  backgroundSize: '18px 18px'
                }}>

                  {/* The popup card - mirrors AnnouncementPopup */}
                  <div style={{
                    width: '100%',
                    backgroundColor: '#FCFBFA',
                    border: '2.5px solid #2D3229',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.13), 5px 5px 0px #2D3229',
                    overflow: 'hidden',
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    position: 'relative'
                  }}>
                    {/* Close button (decorative) */}
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: '#FFF', border: '2px solid #2D3229',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 10, boxShadow: '2px 2px 0px #2D3229',
                      fontSize: '16px', color: '#2D3229', fontWeight: 'bold', lineHeight: 1,
                      userSelect: 'none'
                    }}>×</div>

                    {/* Banner */}
                    {form.bannerUrl && (
                      <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderBottom: '2.5px solid #2D3229' }}>
                        <img
                          src={form.bannerUrl}
                          alt="banner preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Body */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Type badge */}
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '5px',
                        border: '1.5px solid #2D3229', fontSize: '9.5px', fontWeight: '900',
                        backgroundColor: getTypeColor(form.type), alignSelf: 'flex-start'
                      }}>
                        {getTypeLabel(form.type)}
                      </span>

                      {/* Title */}
                      <div style={{ fontSize: '15px', fontWeight: '950', color: '#1C2B17', lineHeight: '1.3' }}>
                        {form.title
                          ? form.title
                          : <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontWeight: '700' }}>Chưa có tiêu đề...</span>
                        }
                      </div>

                      {/* Content */}
                      {form.content && form.content.replace(/<[^>]*>/g, '').trim() !== '' && (
                        <div
                          className="announcement-rich-content"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.content) }}
                          style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.6', fontWeight: '600' }}
                        />
                      )}

                      {/* Voucher */}
                      {form.voucherCode && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: '#FFFDF0', border: '2px dashed #D97706',
                          borderRadius: '10px', padding: '10px 12px', gap: '8px'
                        }}>
                          <div>
                            <span style={{ fontSize: '9px', color: '#B45309', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>
                              Mã giảm giá độc quyền:
                            </span>
                            <strong style={{ fontSize: '13px', color: '#D97706', fontFamily: 'monospace', letterSpacing: '1px' }}>
                              {form.voucherCode}
                            </strong>
                          </div>
                          {form.showCopyButton && (
                            <div style={{
                              background: '#FFF', border: '1.5px solid #2D3229', borderRadius: '6px',
                              padding: '4px 8px', fontSize: '10px', fontWeight: '800',
                              boxShadow: '1.5px 1.5px 0px #2D3229', display: 'flex', alignItems: 'center', gap: '3px'
                            }}>
                              📋 Sao chép
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      {form.buttonUrl && form.buttonText && (
                        <div style={{
                          padding: '9px', background: '#FFE259', color: '#2D3229',
                          border: '2px solid #2D3229', borderRadius: '8px',
                          fontSize: '12px', fontWeight: '900', textAlign: 'center',
                          boxShadow: '2.5px 2.5px 0px #2D3229'
                        }}>
                          {form.buttonText}
                        </div>
                      )}
                    </div>

                    {/* Popup Footer */}
                    <div style={{
                      borderTop: '2px solid #E2E8F0', padding: '10px 16px',
                      background: '#F8FAFC', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center', gap: '8px'
                    }}>
                      {form.allowHide ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#475569', fontWeight: '700', cursor: 'default' }}>
                          <input type="checkbox" disabled style={{ width: '12px', height: '12px' }} />
                          Không hiện lại trong {form.hideDurationHours}h
                        </label>
                      ) : <div />}
                      <div style={{
                        padding: '5px 12px', background: '#FFF', border: '1.5px solid #2D3229',
                        borderRadius: '6px', fontSize: '10.5px', fontWeight: '800',
                        boxShadow: '1.5px 1.5px 0px #2D3229'
                      }}>Đóng</div>
                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {showCropper && (
        <NeoImageCropper
          imageSrc={cropperSrc}
          onCrop={handleCropComplete}
          onClose={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}
