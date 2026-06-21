# 🚀 EduPath AI — Hệ Thống Học Tập Sơ Đồ Tư Duy Thông Minh (AI Mindmap Learning System)

## ⚠️ QUY TẮC PHÁT TRIỂN QUAN TRỌNG (CRITICAL DEVELOPMENT RULE)

> [!WARNING]
> **CẤM XÓA DỮ LIỆU KHÓA HỌC TRONG DATABASE (DO NOT WIPE COURSE DATA)**
> * Tuyệt đối **không được tự ý xóa hoặc reset bảng `Course` và `Lesson`** trong Database khi thực hiện các yêu cầu prompt tiếp theo.
> * Tiến trình seeder cơ sở dữ liệu (`prisma/seed.ts` và `prisma/seed_courses.ts`) đã được cấu hình **bảo vệ chống ghi đè**. Nó sẽ tự động bỏ qua (skip) nếu phát hiện DB đã có dữ liệu.
> * Chỉ được chạy seeder ghi đè khi truyền tham số `--force` hoặc `-f` một cách tường minh: `npx tsx prisma/seed.ts --force`.

---

Chào mừng bạn đến với hệ thống **EduPath AI**. Đây là nền tảng hỗ trợ ôn thi THPT Quốc gia thông qua Sơ đồ tư duy thông minh tích hợp AI (AI-Powered Mindmap Learning System). Hệ thống kết hợp trực quan hóa kiến thức bản đồ tư duy với các công cụ lượng giá, phân tích điểm yếu và tối ưu lộ trình ôn tập.

---

## 🌟 Các Tính Năng Nổi Bật Của Sơ Đồ Tư Duy (Mindmap v2)

Hệ thống Sơ đồ tư duy đã được nâng cấp toàn diện từ một công cụ vẽ hình ảnh cơ bản thành một **Hệ thống Quản lý và Lượng giá Năng lực Học tập Học sinh**:

### 1. 📝 Quick Quiz cho từng Node (Luyện tập tức thì)
- **Tạo câu hỏi trắc nghiệm tự động**: Khi học sinh chọn một nút kiến thức bất kỳ trên sơ đồ tư duy, AI sẽ phân tích nội dung nút đó và sinh ngay một bộ **10 câu hỏi trắc nghiệm** (Multiple Choice Questions) có độ bao phủ toàn diện kiến thức của nút đó.
- **Chấm điểm & Phản hồi chi tiết (Instant Feedback)**: Hệ thống chấm điểm ngay lập tức. Với mỗi câu hỏi, học sinh sẽ nhận được giải thích tường tận tại sao đáp án đã chọn đúng/sai, kèm theo kiến thức cốt lõi liên quan để ghi nhớ sâu.
- **Lưu lịch sử luyện tập**: Kết quả thi thử và các lỗi sai sẽ được lưu trực tiếp vào cơ sở dữ liệu để phục vụ việc đánh giá năng lực lâu dài.

### 2. 🎨 Hệ màu đo mức độ thông thạo (Mastery Progress Color Map)
- Các nút trên sơ đồ tư duy không còn mang màu sắc tĩnh, mà sẽ tự động thay đổi dựa trên kết quả ôn tập thực tế của học sinh thông qua các gam màu chuẩn hóa:
  - 🔘 **Màu Xám (Gray)**: Chưa bắt đầu học/chưa làm quiz.
  - 🔴 **Màu Đỏ (Red)**: Hiệu suất thấp, gặp nhiều sai sót nghiêm trọng (cần học lại ngay).
  - 🟠 **Màu Cam (Orange)**: Bắt đầu có tiến bộ nhưng chưa vững.
  - 🟡 **Màu Vàng (Yellow)**: Mức trung bình khá, nắm được kiến thức cơ bản.
  - 🔵 **Màu Xanh Dương (Blue)**: Mức giỏi, làm đúng hầu hết câu hỏi.
  - 🟢 **Màu Xanh Lá (Green)**: Hoàn toàn thông thạo (Mastered), sẵn sàng cho kỳ thi.
- Giúp học sinh nhận biết trực quan phần kiến thức nào mình còn yếu chỉ bằng một cái nhìn lướt qua sơ đồ tư duy.

### 3. 🔍 Sơ đồ tư duy khắc phục điểm yếu (Weakness Remediation Mindmap)
- **Phát hiện hiểu lầm kiến thức (Misconceptions)**: Hệ thống tự động thu thập nhật ký lỗi sai (Mistakes Log) của học sinh từ các bài làm Quiz.
- **Tạo sơ đồ khắc phục**: AI sẽ phân tích sâu các mẫu sai lầm lặp đi lặp lại để tìm ra lỗ hổng gốc rễ, từ đó tạo ra một Sơ đồ tư duy khắc phục điểm yếu chuyên biệt. Sơ đồ này cung cấp các gợi ý ôn tập trực diện và tài liệu khắc phục cho từng phân mục cụ thể.

### 4. 📊 Phân tích Đề thi & Tạo sơ đồ trọng số (Exam-Based Mindmap)
- **Tải lên và Phân tích đề thi**: Học sinh có thể tải lên đề thi thử THPT Quốc gia (dưới dạng văn bản, PDF hoặc ảnh chụp OCR).
- **Phân tích trọng số**: AI phân tích cấu trúc đề thi, phân loại câu hỏi theo các chủ đề kiến thức và tính toán trọng số phần trăm xuất hiện của từng phần.
- **Tạo sơ đồ ôn thi chiến thuật**: Tạo ra một sơ đồ tư duy thể hiện chính xác tỉ lệ điểm số và độ quan trọng của từng chương mục, giúp học sinh phân bổ thời gian ôn tập khoa học hơn.

### 5. 📥 Nhập liệu đa phương thức (Multi-modal Input)
- **Tạo từ văn bản/chủ đề**: Gõ từ khóa, chủ đề (ví dụ: "Dao động cơ học", "Sóng ánh sáng").
- **Tạo từ tài liệu tải lên**: Hỗ trợ tải file PDF bài giảng, tài liệu tham khảo.
- **Nhận dạng ảnh chụp (OCR)**: Chụp ảnh trang sách, ảnh đề thi để chuyển thành sơ đồ tư duy trong vài giây.
- **Công cụ tùy chỉnh toàn diện**: Hỗ trợ kéo thả node, thu gọn/mở rộng nhánh (Collapse/Expand), Phóng to/Thu nhỏ (Zoom), lưu trữ thư viện cá nhân và tải về file định dạng ảnh/PDF.

---

## 🛠 Kiến trúc Hệ thống & Cơ sở dữ liệu

### 🗄️ Thiết kế Database (Prisma Models)
Hệ thống sử dụng PostgreSQL thông qua Prisma ORM với các bảng cơ sở dữ liệu được thiết kế tối ưu cho học sinh:
- **`MindmapNode`**: Lưu trữ cấu trúc phân cấp, vị trí `x, y` trên Canvas, dữ liệu kiến thức và trạng thái màu sắc tương ứng.
- **`UserProgress`**: Ghi nhận tiến độ học tập, tổng số câu hỏi đã trả lời đúng/sai của từng node để tính toán điểm số Mastery Score.
- **`QuizAttempt` & `QuizAttemptDetail`**: Lưu vết chi tiết từng lượt làm bài Quiz, điểm số đạt được, các lựa chọn của học sinh và thời gian hoàn thành.
- **`MistakesLog`**: Nhật ký lưu lại cụ thể câu hỏi nào học sinh đã làm sai, lý do sai lầm và liên kết trực tiếp với node kiến thức để AI phân tích tạo Sơ đồ điểm yếu.
- **`ExamAnalysis`**: Lưu trữ lịch sử phân tích đề thi thử THPT Quốc gia, bao gồm phân bổ tỉ lệ điểm và cấu trúc đề thi.

### 🔌 APIs Tích Hợp (Backend Route: `/api/ai`)
- `POST /ai/generate-mindmap`: Sinh sơ đồ tư duy ban đầu từ văn bản hoặc file.
- `POST /ai/generate-quiz`: Sinh nhanh bộ 10 câu hỏi trắc nghiệm dựa trên nội dung Node.
- `POST /ai/submit-quiz`: Nộp bài quiz, chấm điểm tự động, cập nhật tiến độ học tập và ghi log lỗi sai.
- `POST /ai/generate-weakness-mindmap`: Sinh sơ đồ tư duy khắc phục điểm yếu từ nhật ký lỗi sai.
- `POST /ai/analyze-exam`: Phân tích đề thi thử tải lên và tạo sơ đồ tư duy trọng số chương trình.

---

## 🔧 Nhật ký thay đổi — EduPath AI

### 2026-06-16

### ✅ Tính năng: Hệ thống Bản đồ tư duy ôn luyện thông minh (AI-Powered Mindmap System)
- **Tích hợp Quick Quiz (10 câu trắc nghiệm/nút)**: AI tự động sinh câu hỏi theo ngữ cảnh và chấm điểm với lời giải chi tiết cho từng phương án.
- **Node Mastery Color Coding**: Nút đổi màu tự động (Xám, Đỏ, Cam, Vàng, Xanh dương, Xanh lá) phản ánh tiến độ học tập và tỉ lệ làm đúng quiz.
- **Sinh Bản đồ tư duy khắc phục điểm yếu (Weakness Mindmap)**: Tổng hợp lỗi sai trong DB để tạo sơ đồ ôn tập đặc biệt, chỉ ra các "misconceptions" và hướng dẫn khắc phục.
- **Phân tích đề thi thử (Exam Weight Map)**: Tải lên đề thi (PDF, Image, Text) để AI phân tích trọng số đề thi THPT Quốc gia và tạo sơ đồ ôn tập tương ứng.
- **Lưu trữ lịch sử & Đồng bộ hóa DB**: Hoàn thiện tích hợp database PostgreSQL qua Prisma, lưu vết `QuizAttempt`, `MistakesLog`, `UserProgress` đồng bộ tức thời.

### 2026-06-15

### ✅ Tính năng: Nâng cấp Luyện tập nhanh (Mini-Quiz) trong Ngân hàng đề thi
- Hỗ trợ học sinh làm thử câu hỏi mẫu trực tuyến của 9 môn thi THPT Quốc Gia.
- Hệ thống tự động chấm điểm, hiển thị hướng dẫn giải chi tiết ngay khi chọn đáp án trắc nghiệm.
- Hỗ trợ soạn thảo dàn ý bài làm tự luận (môn Ngữ Văn) và xem gợi ý hướng dẫn chấm chi tiết.

### 2026-06-05

### Kết nối khoá học với cơ sở dữ liệu, tạm thời làm chức năng thanh toán pha kè, sửa luôn cái đăng xuất là chưa lưu dữ liệu (này chưa hoàn thiện lắm còn 1 số chưa lưu), Ở dưới là phần dã sửa:

### ✅ Fix: Thanh toán Demo không mở được khóa học

**Nguyên nhân:** `CourseMall.jsx` kiểm tra `currentUser.enrollments[]` để xác định khóa học "Đã sở hữu", nhưng `handlePaymentSuccess` trong `App.jsx` chỉ cập nhật `unlockedCourses` mà bỏ quên `enrollments`.

**File đã sửa:** `apps/web/src/App.jsx` — `handlePaymentSuccess()`

```js
// Sau fix: cập nhật đồng thời cả hai field
setCurrentUser({
  ...currentUser,
  unlockedCourses: [...activeUnlocked, courseId],
  enrollments: [...activeEnrollments, { courseId, paidAt: new Date().toISOString() }]
});
```

---

### ✅ Tính năng: Lưu dữ liệu vào PostgreSQL (không mất sau đăng xuất)

**Vấn đề:** Toàn bộ dữ liệu chỉ lưu trong `localStorage`, khi đăng xuất và đăng nhập lại thì mất (enrollments, hồ sơ cá nhân).

#### Backend — Thêm 2 API mới

**`apps/api/src/controllers/payment.ts`**
- Thêm `createDemoEnrollment()` — tạo bản ghi `Enrollment` thật trong PostgreSQL khi nhấn "Kích hoạt Demo"
- `transactionId` dạng `DEMO_{studentId}_{courseId}_{timestamp}` để tránh trùng

**`apps/api/src/controllers/auth.ts`**
- Sửa `login()` — trả về kèm `enrollments[]` của student để frontend load ngay khi đăng nhập
- Thêm `updateProfile()` — cập nhật `fullName`, `avatarUrl`, `subjectGroup` vào DB

**`apps/api/src/index.ts`**
- Đăng ký route `POST /enrollments/demo`
- Đăng ký route `PATCH /auth/profile`

#### Frontend — Kết nối với API

**`apps/web/src/api.js`**
- Thêm `api.demoEnroll(courseId)` — gọi `POST /enrollments/demo`
- Thêm `api.updateProfile(payload)` — gọi `PATCH /auth/profile`

**`apps/web/src/components/AuthPage.jsx`**
- Sửa `mapBackendUser()` — giữ lại `enrollments[]` và `unlockedCourses[]` từ API response thay vì reset về `[]`

**`apps/web/src/App.jsx`**
- `handleAuthSuccess()` — map `enrollments` từ DB vào `currentUser` khi đăng nhập
- `handlePaymentSuccess()` — gọi `api.demoEnroll()` sau khi cập nhật UI (optimistic update)
- `handleSaveProfile()` — gọi `api.updateProfile()` khi lưu hồ sơ cá nhân
- Tất cả có `try/catch` graceful fallback — nếu API lỗi thì UI vẫn hoạt động bình thường

