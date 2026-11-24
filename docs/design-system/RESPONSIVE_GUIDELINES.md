# Responsive Design Guidelines — TdyTime

TdyTime được xây dựng với chiến lược **Mobile-First Responsive Adaptation**: thiết kế gốc luôn bắt đầu từ màn hình điện thoại dọc **`390px × 844px`**, sau đó mở rộng dần không gian và chuyển đổi hình thái component khi lên Tablet (`768px+`) và Desktop (`1024px+` / `1440px`).

---

## 1. Chiến lược Điểm ngắt (Breakpoint Strategy)

TdyTime sử dụng hệ thống điểm ngắt chuẩn của Tailwind CSS với vai trò cụ thể cho từng mốc:

| Breakpoint | Kích thước Tối thiểu | Thiết bị Mục tiêu | Thay đổi Bố cục Trọng tâm |
| :--- | :--- | :--- | :--- |
| **Base (Default)** | `0px` (`390px` baseline) | Điện thoại di động dọc | Đệm trang `p-3`, Header `h-12`, điều hướng `BottomNav` 5 tab cố định dưới đáy (`h-16`), lịch tuần dạng thẻ dọc (`WeekCardLayout`), các lưới Bento xếp 1 cột (hoặc 2×2 cho `InsightCard`). |
| **`sm:`** | `640px` | Điện thoại lớn / Phablet ngang | Hiển thị nhãn chữ bên cạnh icon trên các nút công cụ (`hidden sm:inline`), thanh Segmented Tab trong `SettingsView` co về kích thước gọn (`sm:w-auto sm:min-w-[360px]`), hiện cột `#` và `Mã môn` trong bảng `CourseTypeCard`. |
| **`md:`** | `768px` | Máy tính bảng (iPad Mini / Air) | Đệm trang tăng lên `md:p-8`, Header `md:h-14` hiện tên đầy đủ của Giảng viên + Học kỳ, `WeeklyView` và `SemesterView` tự động chuyển mặc định sang chế độ **Bảng Ngang (`horizontal` / `WeekTableLayout`)**, các bảng `GroupProgressCard` và `CoTeachersTable` chuyển từ danh sách thẻ mobile sang `<table>` đầy đủ. |
| **`lg:`** | `1024px` (`1440px` baseline) | Laptop & Màn hình Desktop | Ẩn thanh `BottomNav` (`lg:hidden`), kích hoạt thanh **`Sidebar` cố định bên trái (`lg:flex`)** có thể đóng/mở (`w-20` ↔ `w-48`), lưới `StatisticsView` mở rộng thành 3 cột (`lg:grid-cols-3`) và 4 cột (`lg:grid-cols-4`). |

---

## 2. Các Mẫu Chuyển đổi Component Thích ứng (Adaptive Component Patterns)

Thay vì chỉ thu nhỏ (scale down) giao diện Desktop xuống màn hình điện thoại, TdyTime áp dụng **4 cơ chế biến hình (Morphing Patterns)** để tối ưu hóa trải nghiệm trên từng kích thước màn hình:

### 2.1. Navigation Morphing: `BottomNav` ↔ Collapsible `Sidebar`
- **Mobile & Tablet (`< 1024px`)**:
  - Sử dụng thanh `BottomNav` nằm ngay tầm ngón cái (`h-16 fixed bottom-0`), hiển thị phẳng cả 5 điểm đến chính (`Hôm nay`, `Tuần`, `Học kỳ`, `Thống kê`, `Cài đặt`).
  - Vùng `main` tự động thêm `pb-20` (`80px`) để phần tử cuối cùng không bao giờ bị che khuất.
- **Desktop (`>= 1024px`)**:
  - Ẩn `BottomNav`, hiện nút `Menu` ở góc trái Header và thanh `Sidebar` bên trái (`w-48` khi mở, `w-20` khi thu gọn).
  - Trạng thái đóng/mở của Sidebar được khởi tạo thông minh qua `window.matchMedia('(min-width: 1024px)').matches` trong `ui.store.ts` để tránh hiện tượng giật bố cục (Forced Synchronous Reflow).

### 2.2. Schedule Matrix Morphing: `WeekCardLayout` ↔ `WeekTableLayout`
- **Trên Mobile (`< 768px`)**:
  - Một bảng 7 cột × 3 hàng không thể đọc nổi trên chiều ngang 390px nếu không cuộn ngang liên tục. Do đó, `WeeklyView` và `SemesterView` khởi tạo `viewMode = 'vertical'`, sử dụng `WeekCardLayout` để gom các tiết học theo từng ngày có lịch dạy thành các thẻ xếp dọc dễ cuộn bằng một tay.
- **Trên Desktop (`>= 768px`)**:
  - Khởi tạo `viewMode = 'horizontal'`, sử dụng `WeekTableLayout` để hiển thị toàn cảnh ma trận cả tuần.
  - Người dùng vẫn có nút chuyển đổi chủ động (`Columns` / `LayoutTemplate`) trên thanh công cụ để đổi qua lại giữa 2 chế độ bất cứ lúc nào trên cả Mobile và Desktop.

### 2.3. Data Table Morphing: Stacked Card Rows ↔ Multi-Column Tables
Đối với các bảng nhiều cột thông tin, TdyTime không ép người dùng cuộn ngang trên điện thoại:
- **`CourseTypeCard` (`src/views/settings/CourseTypeCard.tsx`)**:
  - Trên Desktop (`>= 768px`): Hiển thị đầy đủ 7 cột (`#`, `Mã môn`, `Tên học phần`, `Lớp`, `Nhóm`, `LT`, `TH`).
  - Trên Mobile (`< 640px`): Ẩn các cột phụ (`#`, `Mã môn`, `Lớp`, `Nhóm`) bằng `hidden sm:table-cell` / `hidden md:table-cell`, sau đó **gộp `Mã môn`, `Lớp` và `Nhóm` thành một dòng metadata phụ (`md:hidden`) nằm ngay bên dưới tên học phần**. Nhờ vậy, bảng trên màn hình 390px chỉ còn đúng 3 cột (`Tên học phần + Metadata`, `LT`, `TH`), vừa khít 100% chiều ngang mà không cần cuộn ngang.
- **`GroupProgressCard` & `CoTeachersTable` (`src/views/statistics/cards/`)**:
  - Render 2 cấu trúc DOM chuyên biệt: `div.md:hidden` (danh sách thẻ xếp dọc tối ưu cho di động) và `div.hidden.md:block > table` (bảng dữ liệu đa cột cho màn hình lớn).

### 2.4. Scrollbar Adaptation: Hidden vs. Explicitly Visible on Mobile
Trong `src/styles/global.css`:
- **`.custom-scrollbar`**: Hiển thị thanh cuộn mảnh `5px` trên Desktop nhưng tự động ẩn (`display: none`) trên màn hình `< 768px` để tiết kiệm diện tích.
- **`.scrollbar-mobile-visible`**: Dành riêng cho các biểu đồ rộng bắt buộc phải cuộn ngang trên di động (như ma trận 20 tuần của `HeatmapChart.tsx`). Class này ép hiển thị thanh cuộn ngang `height: 5px` có rãnh nền rõ ràng trên cả màn hình `< 768px`, giúp người dùng nhận biết ngay lập tức rằng biểu đồ có thể vuốt ngang (`touch-pan-x`).

---

## 3. Quy tắc Kích thước Vùng chạm Cảm ứng (Touch Target Requirements)

- **Chuẩn Vùng chạm Tối thiểu trên Di động (`< 768px`)**: **`44px × 44px`** (`w-11 h-11` hoặc `min-h-[44px]`).
  - Toàn bộ nút icon trên Header (`Globe`, `ThemePicker`, `DarkMode`, `Upload`, `Trash2` trong `ExamHeader`) đều sử dụng `w-11 h-11 md:w-9 md:h-9` (đạt đúng `44×44px` trên di động và thu gọn về `36×36px` trên Desktop khi dùng chuột).
  - Các nút điều hướng tuần (`WeekNavigation`, `SemesterView`), nút tab trong Segmented Control (`StatisticsView`, `SettingsView`), và các nút hành động trong `BackupRestoreCard` đều duy trì `h-11` hoặc `min-h-[44px]`.
- **Giới hạn Diện tích Cố định trên Di động (Sticky Surface Budget)**:
  - Trên màn hình điện thoại `844px` chiều cao: Header (`48px`) + BottomNav (`64px`) chiếm tổng cộng `112px` (~13.2% chiều cao màn hình), để dành hơn **86% diện tích màn hình** cho nội dung lịch học.
