# Project Design DNA — TdyTime (`v2026.11.24`)

Tài liệu này đúc kết **Design DNA (Bộ gen thiết kế cốt lõi)** của dự án **TdyTime**, được trích xuất trực tiếp từ quá trình kiểm toán toàn diện mã nguồn (`src/`). Mọi quyết định về thị giác, bố cục và tương tác trong sản phẩm đều xoay quanh bản sắc này.

---

## 1. Visual Identity & Design Philosophy

### 1.1. Định hướng Thị giác Tổng thể (Overall Visual Direction)
TdyTime mang ngôn ngữ thiết kế **"TdyTripZ Compact Flat Architecture"** — một biến thể hiện đại của phong cách **Bento Utility Dashboard** kết hợp với **Neo-Brutalist Swiss Typography** được tinh chỉnh riêng cho môi trường học thuật Việt Nam:
- **Phẳng và Sắc nét (Flat & Crisp 1px Hairline Surfaces)**: Không sử dụng hiệu ứng kính mờ nặng nề (heavy glassmorphism) trên các thẻ dữ liệu lặp lại. Mọi bề mặt thẻ (`Card`, `SessionCard`, `StatsHeader`) đều dùng nền đặc (`bg-white` / `dark:bg-slate-900`) kết hợp viền mảnh 1px (`border-slate-100` hoặc `border-slate-200`, `dark:border-slate-800`) và đổ bóng cực nhẹ (`shadow-sm`).
- **Tương phản Điển hình (High-Contrast Typographic Hierarchy)**: Sử dụng độ đậm chữ cực đại (`font-black` / `800` của `Montserrat`) cho các con số, mã phòng, khung giờ và nhãn phân mục (`uppercase tracking-wider`), đối lập rõ nét với phần tên môn học và thông tin phụ bằng `Be Vietnam Pro`.
- **Phân cấp Mật độ Thông minh (Adaptive Information Density)**:
  - **Chế độ Quét nhanh (`TodayView`, `ExamView`)**: Mật độ thoáng, tập trung vào trạng thái thời gian thực (`LIVE`, `UPCOMING`, `COMPLETED`) và đếm ngược buổi dạy kế tiếp.
  - **Chế độ Tra cứu Ma trận (`WeeklyView`, `SemesterView`)**: Mật độ cao, thu gọn khoảng cách đệm (`p-2.5`), gộp dòng thông minh và dùng bảng 2 chiều có cột cố định (`sticky left-0`).
  - **Chế độ Phân tích & Quản trị (`StatisticsView`, `SettingsView`)**: Tổ chức theo mô hình **3-Tab Segmented Bento Hub**, chỉ nạp (lazy-mount) nhóm thông tin người dùng đang chọn để tránh quá tải thị giác trên màn hình dọc.

### 1.2. Cá tính Thị giác & Biểu đạt Thương hiệu (Visual Personality & Brand Expression)
- **Đáng tin cậy & Tức thì (Reliable & Instantaneous)**: Giao diện phản ánh triết lý **100% Offline-First**. Không có trạng thái chờ mạng mơ hồ; mọi thao tác lọc, chuyển tuần, đổi chủ đề đều phản hồi dưới 100ms.
- **Thân thiện với Giảng viên Việt Nam (Vietnamese Academic Native)**: Tối ưu hóa cho các thuật ngữ học thuật đặc thù: Lý thuyết (`LT` - 45 phút/tiết), Thực hành (`TH` - 60 phút/tiết), Ca Sáng/Chiều/Tối (`S`/`C`/`T`), Mã học phần, Nhóm lớp và Giảng viên dạy cùng.
- **Cá nhân hóa Cao nhưng Có Kỷ luật (Disciplined Personalization)**: Cho phép người dùng chọn 1 trong **7 chủ đề màu nhấn (`AccentTheme`)** và **2 chế độ Sáng/Tối**, nhưng hệ thống tự động điều chỉnh màu ngữ nghĩa (Smart Semantic Shift) để không bao giờ xảy ra xung đột độ tương phản.

---

## 2. Hệ thống Điểm neo Thị giác (Visual Anchors DNA)

Một đặc trưng không thể trộn lẫn trong DNA của TdyTime là việc sử dụng các **Điểm neo Thị giác (Visual Anchors)** nhỏ gọn nhưng giàu ngữ nghĩa để dẫn dắt mắt người dùng trong < 1 giây:

### 2.1. Adaptive Semantic Gradient Dots (Chấm chuyển sắc ngữ nghĩa)
- Trong `Badge.tsx` và cột trái của `WeekTableLayout.tsx`, thời gian trong ngày và trạng thái không chỉ hiển thị bằng màu đơn sắc mà bằng **dải chuyển sắc (Linear Gradient)** được tính toán theo chủ đề:
  - **Ca Sáng (`morning`)**: `var(--semantic-morning-from)` → `var(--semantic-morning-to)` (Cyan/Teal).
  - **Ca Chiều (`afternoon`)**: `var(--semantic-afternoon-from)` → `var(--semantic-afternoon-to)` (Orange/Amber).
  - **Ca Tối (`evening`)**: `var(--semantic-evening-from)` → `var(--semantic-evening-to)` (Indigo/Cyan).
  - **Đang diễn ra (`live`)**: Emerald gradient (`rgb(16 185 129)` → `rgb(5 150 105)`).

### 2.2. Visual Anchors 2.0 (STT + Ring + Dot trong `ExamView`)
- Trong danh sách coi thi (`ExamView.tsx`), mỗi dòng có chiều cao cố định 2 tầng (`min-h-[52px]`) để chống dịch chuyển bố cục (Zero CLS).
- Cột số thứ tự (`STT_COL_CLASS`: `w-7 h-7`) đóng vai trò là điểm neo trạng thái:
  - **Ca thi đã qua / bình thường**: Hiển thị số thứ tự dạng chữ `01.`, `02.` (`font-black text-slate-500 font-num`).
  - **Ca thi sắp tới kế tiếp (`isNext`)**: Chuyển thành vòng tròn nền `bg-accent-100 dark:bg-accent-950/40 text-accent-700 ring-1 ring-accent-200`.
  - **Ca thi đang diễn ra (`isOngoing`)**: Vòng tròn `bg-accent-500 text-white animate-pulse ring-2 ring-accent-500 ring-offset-2` kèm chấm nhỏ ở góc trên bên phải (`-top-0.5 -right-0.5 w-2 h-2 rounded-full`).

### 2.3. Section Header Play Indicator (Mũi tên tiêu đề phân mục)
- Tại `SessionList.tsx`, `NextTeachingSection.tsx` và `ExamView.tsx`, các tiêu đề phân mục danh sách đều bắt đầu bằng icon `<Play size={12} fill="currentColor" />` kết hợp chữ in hoa `text-xs font-black uppercase tracking-wider`.
- Khi phân mục đang có hoạt động (`!isTodayFinished` hoặc `showHighlight`), cả icon `<Play />` và tiêu đề đều mang màu `text-accent-600 dark:text-accent-400`; khi đã hoàn tất toàn bộ trong ngày, chúng chuyển sang màu trung tính `text-slate-500` / `text-slate-700`.

### 2.4. Active Focus Ring & Border Highlight
- Các thẻ có tính chất tiêu điểm (như buổi học đang `LIVE` trong `SessionCard`, tuần hiện tại trong `WeeklyView`/`WeekAccordion`, thẻ `ProgressCard` trong `StatisticsView`, hoặc `NextTeachingSection` khi hết ca dạy hôm nay) luôn được đánh dấu bằng công thức:
  - Viền đậm màu nhấn: `border-accent-500` hoặc `border-2 border-accent-600 dark:border-accent-500`.
  - Vòng sáng bao ngoài nhẹ: `ring-1 ring-accent-500/20` hoặc `ring-2 ring-accent-500/20`.
  - Đổ bóng màu nhấn: `shadow-lg shadow-accent-500/10` hoặc `shadow-sm`.

---

## 3. TdyTripZ Compact Radius Scale (DNA Hình khối)

Khác với cấu hình mặc định của Tailwind CSS (vốn có `rounded-2xl = 16px` và `rounded-3xl = 24px`), TdyTime định nghĩa lại hoàn toàn thang đo bo góc trong `@theme` (`src/styles/global.css`) và `:root` (`src/styles/tokens.css`) theo chuẩn **TdyTripZ Compact Flat Architecture**:

| Tailwind Class | Token CSS | Giá trị Thực tế | Vai trò trong Giao diện |
| :--- | :--- | :--- | :--- |
| `rounded-[2px]` | *(Inline)* | `2px` | Ô vuông ma trận Heatmap (`HeatmapChart`). |
| `rounded-sm` | `--radius-sm` | **`6px`** | Badges nhỏ, tags phụ. |
| `rounded-md` | `--radius-md` | **`8px`** | Thẻ lịch tuần (`WeeklyCard`), bảng lịch thi (`ExamView`), nút trong thanh Segmented. |
| `rounded-lg` | `--radius-lg` | **`8px`** | Badge chuẩn (`Badge.tsx`), hộp quy chuẩn tiết học (`PeriodStandardsCard`). |
| `rounded-xl` | `--radius-xl` | **`8px`** | Buttons (`Button.tsx`), Inputs, Selects (`FilterBar`), Toast, Icon badges. |
| `rounded-2xl` | `--radius-2xl` | **`10px`** | Toàn bộ thẻ chính (`Card.tsx`, `TodayCard`, `StatsHeader`, `WeekAccordion`, `EmptyState`). |
| `rounded-3xl` | `--radius-3xl` | **`12px`** | Hộp thoại xác nhận (`ConfirmModal.tsx`). |
| `rounded-full` | *(Built-in)* | `9999px` | Nút tròn, Avatar chữ cái đầu, thanh tiến độ (Progress bar), chấm trạng thái. |

> **Insight quan trọng**: Nhờ việc ánh xạ `--radius-md`, `--radius-lg`, `--radius-xl` về cùng mức **`8px`** và `--radius-2xl` về **`10px`**, toàn bộ giao diện đạt được độ phẳng, gọn gàng, cứng cáp như một công cụ chuyên nghiệp, tiết kiệm diện tích hiển thị trên màn hình điện thoại 390px mà không bị cảm giác "bong bóng" (bubbly/toy-like) của các giao diện bo tròn 16px–24px thông thường.

---

## 4. Kiến trúc Hiệu năng Gắn liền với Giao diện (Performance-Driven UI DNA)

Trong TdyTime, thiết kế giao diện không tách rời khỏi kiến trúc kỹ thuật:
1. **Stateless Pure `SessionCard`**: Thẻ buổi học được thiết kế thuần trình bày (stateless), không tự đăng ký store hay chứa modal ẩn bên trong, giúp danh sách hàng trăm buổi học trong `SemesterView` cuộn mượt ở 60fps.
2. **Custom Lightweight SVG Charts**: Thay vì nạp thư viện biểu đồ nặng hàng trăm KB (như Recharts hay Chart.js), `DailyBarChart`, `WeeklyTrendChart` và `HeatmapChart` được vẽ bằng SVG/DOM thuần với `viewBox="0 0 320 168"`, đường nét đứt `strokeDasharray="4 4"` và màu `var(--color-accent-600)`.
3. **Viewport Virtualization (`LazyRender`)**: Các danh sách dài (`SemesterView`, `ExamView`) sử dụng `IntersectionObserver` với `rootMargin="1000px"` để chỉ dựng DOM cho các tuần/ngày nằm gần vùng nhìn thấy.
