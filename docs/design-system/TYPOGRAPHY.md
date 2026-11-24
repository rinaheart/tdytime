# Typography System — TdyTime

Hệ thống chữ viết của **TdyTime** được thiết kế dựa trên nguyên tắc **"2+1 Font Rule"**: kết hợp vẻ đẹp hình học mạnh mẽ của **`Montserrat`** cho tiêu đề/số liệu với khả năng hiển thị dấu tiếng Việt xuất sắc của **`Be Vietnam Pro`** cho văn bản nội dung.

---

## 1. Font Families & Cơ chế Nạp Không Chặn Render (Async Loading)

Trong `index.html` và `src/styles/global.css`, TdyTime định nghĩa 3 nhóm phông chữ:

1. **Body Font (`--font-body`) — `Be Vietnam Pro`**:
   - **Khai báo**: `'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
   - **Weights được nạp**: `400` (Regular), `700` (Bold) — kết hợp tổng hợp độ đậm mượt mà trên trình duyệt hiện đại.
   - **Vai trò**: Toàn bộ văn bản giao diện mặc định, tên môn học, tên giảng viên, thông báo, hướng dẫn và nội dung cài đặt.
2. **Heading & Numeric Font (`--font-heading`, `--font-num`) — `Montserrat`**:
   - **Khai báo**: `'Montserrat', sans-serif`
   - **Weights được nạp**: `600` (SemiBold), `800` (ExtraBold / Black).
   - **Vai trò**:
     - Tất cả thẻ tiêu đề `h1`, `h2`, `h3`, `h4` và class `.font-heading` (tự động áp dụng `tracking-tight`).
     - Toàn bộ dữ liệu số qua class `.font-num` (khung giờ `07:00 - 09:35`, số tiết, phần trăm tiến độ, ngày tháng, phiên bản) đi kèm `font-variant-numeric: tabular-nums` để các chữ số thẳng hàng dọc tuyệt đối.
3. **Technical / Code Font (`font-mono`)**:
   - **Vai trò**: Ô nhập mã HTML/JSON (`PasteInput`), ô nhập tên viết tắt môn học (`AbbreviationsCard`), mã học phần trên mobile (`CourseTypeCard`), và nhãn phiên bản Service Worker (`SW v2026.11.24`).

> **Quy chuẩn Hiệu năng (Non-Render-Blocking Font Loading)**:
> Trong `index.html`, Google Fonts được nạp bất đồng bộ qua `<link id="google-fonts-css" ... media="print">` và chuyển sang `media="all"` bằng script nội tuyến tuân thủ CSP ngay khi tải xong, kèm thẻ ẩn pre-warm glyph (`Tải`, `Tdy`) để ngăn chặn hiện tượng giật chữ (FOUT/CLS).

---

## 2. Thang đo Chữ viết & Phân cấp (Typographic Scale & Hierarchy)

### 2.1. Tiêu đề Trang & Khu vực (Headings)

| Cấp độ | Tailwind Classes Chuẩn | Kích thước (`px` / `rem`) | Ví dụ Ứng dụng trong Codebase |
| :--- | :--- | :--- | :--- |
| **Hero Countdown** | `text-5xl font-black text-accent-600 font-num` | `48px` (`3rem`) | Số ngày đếm ngược trước học kỳ mới (`EmptyState.tsx`). |
| **Page Title (Standard)** | `text-[22px] md:text-2xl font-semibold tracking-tight` | `22px` → `24px` | Tiêu đề ngày hôm nay (`TodayHeader.tsx`) và Lịch coi thi (`ExamHeader`). |
| **Page Title (Action/Grid)** | `text-xl md:text-2xl font-black tracking-tight` | `20px` → `24px` | Tiêu đề trang `SettingsView`, `WeeklyView` (`uppercase`), `SemesterView` (`uppercase`). |
| **Card / Group Title** | `text-sm md:text-base font-bold` | `14px` → `16px` | Tiêu đề các thẻ lớn trong `SettingsView` (`AbbreviationsCard`, `BackupRestoreCard`) và ngày thi trong `ExamView`. |
| **Section Overline Header** | `text-xs font-black uppercase tracking-wider` (hoặc `tracking-widest`) | `12px` (`0.75rem`) | Tiêu đề phân mục có icon đi kèm (`SessionList`, `NextTeachingSection`, các thẻ biểu đồ trong `StatisticsView`). |

### 2.2. Nội dung Thẻ & Bảng dữ liệu (Body & Data Cells)

| Thành phần | Tailwind Classes Chuẩn | Kích thước | Đặc tả Trình bày |
| :--- | :--- | :--- | :--- |
| **Session Course Name (Today)** | `text-[14px] font-bold leading-snug` | `14px` | Tên môn học trên thẻ `TodayCard` (`SessionCard.tsx`). |
| **Session Course Name (Weekly)** | `text-[12px] font-bold leading-tight line-clamp-2 min-h-[2.4em]` | `12px` | Tên môn học trong ô lịch tuần (`WeeklyCard`), giới hạn tối đa 2 dòng để giữ chiều cao dòng đồng đều. |
| **Session Time Range** | `text-sm font-black font-num` (Today) / `text-[11px] font-bold font-num` (Weekly) | `14px` / `11px` | Luôn dùng `.font-num` để căn chỉnh chữ số giờ/phút. |
| **Table Cell & Secondary Info** | `text-xs font-medium` hoặc `text-xs font-semibold` | `12px` (`0.75rem`) | Phòng học, mã lớp, giảng viên, dữ liệu bảng trong `StatisticsView` và `SettingsView`. |

### 2.3. Nhãn vi mô & Huy hiệu (Micro-Labels & Badges)

| Thành phần | Tailwind Classes Chuẩn | Kích thước | Quy tắc Sử dụng |
| :--- | :--- | :--- | :--- |
| **Standard Badge (`Badge.tsx`)** | `text-[10px] font-bold uppercase tracking-wider` | `10px` | Nhãn trạng thái (`LIVE`, `TRỰC TUYẾN`, `v2026.11.24`). |
| **BottomNav Tab Label** | `text-[11px] tracking-tight truncate` | `11px` | Nhãn 5 tab điều hướng dưới cùng trên di động (`font-bold` khi active, `font-medium` khi inactive). |
| **Compact TypeBadge (`LT`/`TH`)** | `text-[9px] px-1.5 py-0.5 font-bold uppercase` | `9px` | Chỉ dùng cho huy hiệu `LT`/`TH` thu gọn (`compact={true}`) bên trong góc thẻ `SessionCard`. |

---

## 3. Quy tắc Trình bày Số liệu & Chống Tràn Văn bản (Formatting & Truncation Rules)

1. **Bắt buộc `font-num` / `tabular-nums` cho mọi con số động**:
   - Bất kỳ phần tử nào hiển thị thời gian (`07:00`), số lượng tiết (`120`), phần trăm (`85%`), số thứ tự (`01.`) hoặc ngày tháng (`24/11/2026`) đều phải có class `font-num` (hoặc `font-num tabular-nums`).
2. **Bảo vệ Bố cục khỏi Tên Môn học Dài (Truncation & Line-Clamp Escape Hatches)**:
   - Tên môn học đại học ở Việt Nam thường rất dài (ví dụ: *"Thực tập tốt nghiệp ngành Công nghệ thông tin"*).
   - Trong danh sách 1 dòng (`CompletedCard`, `ExamRow` chế độ gọn, bảng `TopSubjectsCard`): bắt buộc bọc trong container có `min-w-0 flex-1` và đặt class `truncate` kèm thuộc tính `title={fullCourseName}` để người dùng có thể xem tên đầy đủ khi chạm/di chuột.
   - Trong thẻ lưới (`WeeklyCard`, `NextTeachingSection`, `ExamRow` chế độ chi tiết): sử dụng `line-clamp-2` để hiển thị tối đa 2 dòng gọn gàng.
3. **Cân bằng Dòng cho Lời chào (`text-balance`)**:
   - Các câu thông điệp hoặc lời chào động theo buổi trong `TodayHeader.tsx` sử dụng `text-balance` để tránh rớt 1 từ đơn lẻ xuống dòng cuối.
