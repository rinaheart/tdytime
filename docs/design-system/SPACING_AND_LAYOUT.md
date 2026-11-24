# Spacing & Layout Architecture — TdyTime

Tài liệu này quy định cấu trúc khung ứng dụng (**App Shell**), độ rộng vùng chứa (**Container Widths**), hệ lưới (**Bento & Schedule Grids**) và thang đo khoảng cách (**Spacing Scale**) của **TdyTime**.

---

## 1. Cấu trúc Khung Ứng dụng (Application Shell Architecture)

TdyTime sử dụng 2 khung bố cục chính tùy theo trạng thái dữ liệu:

### 1.1. `AppLayout` (Khung Ứng dụng Chính khi đã có dữ liệu)
Được định nghĩa tại `src/app/layout/AppLayout.tsx`:
- **Root Container**: `min-h-dvh bg-white dark:bg-slate-950` (sử dụng đơn vị `dvh` — Dynamic Viewport Height để tương thích hoàn hảo với thanh địa chỉ ẩn/hiện trên trình duyệt di động).
- **Fixed Top Header (`header`)**:
  - Chiều cao: `h-12` (`48px`) trên Mobile (`< 768px`), `md:h-14` (`56px`) trên Tablet/Desktop (`>= 768px`).
  - Đệm ngang: `px-3 md:px-6`.
  - Bố cục 2 vùng:
    - **Trái**: Nút thu gọn Sidebar (`hidden lg:flex`) + Tên ứng dụng `TdyTime` (Mobile) hoặc Tên Giảng viên + Học kỳ • Năm học (Desktop `md:inline`).
    - **Phải**: Cụm 4 nút công cụ kích thước chuẩn (`w-11 h-11 md:w-9 md:h-9`): Đổi ngôn ngữ (`Globe`) → Chọn màu chủ đề (`ThemePicker`) → Đổi Sáng/Tối (`Sun`/`Moon`) → Tải file lịch mới (`Upload`).
- **Fixed Desktop Sidebar (`aside`, chỉ hiện ở `lg:flex` >= 1024px)**:
  - Vị trí: `fixed top-12 md:top-14 bottom-0 left-0 z-30`.
  - Chiều rộng thích ứng:
    - Khi mở rộng (`!sidebarCollapsed`): `w-48` (`192px`).
    - Khi thu gọn (`sidebarCollapsed`): `w-20` (`80px`), chỉ hiển thị icon căn giữa trong khối `w-10` kèm tooltip `title`.
- **Fixed Mobile BottomNav (`nav`, chỉ hiện ở `lg:hidden` < 1024px)**:
  - Vị trí: `fixed bottom-0 left-0 right-0 z-40 pb-safe`.
  - Chiều cao: `h-16` (`64px`) chia đều cho **5 tab phẳng** (`flex-1 flex flex-col items-center justify-center`): `Hôm nay`, `Tuần`, `Học kỳ`, `Thống kê`, `Cài đặt`.
- **Main Scrollable Viewport (`main`)**:
  - Bù trừ chiều cao Header: `h-[calc(100dvh-48px)] md:h-[calc(100dvh-56px)] pt-12 md:pt-14`.
  - Bù trừ chiều rộng Sidebar trên Desktop: `lg:pl-20` (khi thu gọn) hoặc `lg:pl-48` (khi mở rộng).
  - Vùng cuộn nội bộ: `h-full overflow-y-auto custom-scrollbar`.
  - Khung giới hạn nội dung tối đa: `max-w-7xl mx-auto p-3 md:p-8 pb-20 lg:pb-8` (đệm dưới `pb-20` = `80px` trên mobile/tablet để nội dung cuối trang không bao giờ bị thanh `BottomNav` `64px` che khuất).

### 1.2. `WelcomeView` (Khung Trang Đích Nhập Dữ liệu)
Được định nghĩa tại `src/views/welcome/WelcomeView.tsx`:
- Giữ nguyên thanh **Header** giống hệt `AppLayout` (`h-12 md:h-14`) để đảm bảo tính liên tục thị giác (Zero Layout Jump khi chuyển giữa trang nhập liệu và trang chính).
- Vùng nội dung căn giữa theo trục dọc với độ rộng tập trung: `max-w-xl mx-auto w-full p-3 md:p-8 pt-[60px] md:pt-[88px]`.

---

## 2. Quy chuẩn Độ rộng Vùng chứa theo Màn hình (View Container Widths)

Bên trong khung `max-w-7xl` (`1280px`) của `AppLayout`, mỗi màn hình chọn một độ rộng tối ưu cho loại dữ liệu của mình:

| Màn hình (View) | Container Width Class | Kích thước Tối đa | Lý do Thiết kế (Design Rationale) |
| :--- | :--- | :--- | :--- |
| **`TodayView`** | `max-w-3xl mx-auto` | `768px` | Giữ dòng đọc thẻ buổi học hôm nay vừa tầm mắt trên màn hình lớn, không bị kéo giãn quá ngang. |
| **`ExamView`** | `max-w-3xl mx-auto` | `768px` | Giữ khoảng cách giữa cột STT + Tên môn thi (bên trái) và Giờ thi + Phòng thi (bên phải) dễ dò theo dòng. |
| **`WeeklyView` (Vertical Card Mode)** | `max-w-4xl mx-auto` | `896px` | Chế độ danh sách thẻ theo ngày. |
| **`WeeklyView` (Horizontal Table Mode)** | `max-w-full` (Bảng bên trong `min-w-[1000px]`) | `100%` (tối đa `1280px`) | Tận dụng toàn bộ chiều ngang màn hình Desktop cho ma trận 7 ngày × 3 ca học. |
| **`SemesterView`** | Toàn khung `max-w-7xl` | `1280px` | Hiển thị danh sách tuần co giãn (`WeekAccordion`) chứa bảng lịch tuần bên trong. |
| **`StatisticsView`** | Toàn khung `max-w-7xl` | `1280px` | Phù hợp cho hệ lưới Bento 2 cột (`md:grid-cols-2`), 3 cột (`lg:grid-cols-3`) và 4 cột (`lg:grid-cols-4`). |
| **`SettingsView`** | Toàn khung `max-w-7xl` | `1280px` | Hiển thị các bảng cấu hình môn học và lưới 2 cột Sao lưu / Vùng nguy hiểm (`md:grid-cols-2`). |

---

## 3. Thang đo Khoảng cách & Đệm (Spacing & Padding Scale)

TdyTime tuân thủ hệ lưới cơ sở **4px (`0.25rem`)** với các mức đệm tinh chỉnh (`0.5` = `2px`, `1.5` = `6px`, `2.5` = `10px`, `3.5` = `14px`) để tối ưu hóa diện tích trên màn hình di động:

### 3.1. Khoảng đệm Bề mặt (Container Padding)
- **Page Outer Padding**: `p-3` (`12px`) trên Mobile → `md:p-8` (`32px`) trên Desktop.
- **Standard Card Padding (`Card.tsx`)**: `p-4` (`16px`) trên Mobile → `md:p-5` (`20px`) trên Desktop (hoặc `p-4 md:p-6` cho các thẻ cài đặt lớn).
- **Today SessionCard Padding**: `p-3.5` (`14px`) — cân bằng giữa độ thoáng và mật độ danh sách.
- **Weekly Matrix SessionCard Padding**: `p-2.5` (`10px`) — thu gọn tối đa để vừa khít trong ô bảng 7 cột.

### 3.2. Khoảng cách Giữa các Phần tử (Section & Grid Gaps)
- **Khoảng cách dọc giữa các khối chính**:
  - Trong `StatisticsView`: `space-y-4 md:space-y-5` (`16px` → `20px`) và `gap-4 md:gap-5`.
  - Trong `SettingsView`: `space-y-5` hoặc `space-y-6` (`20px` → `24px`).
  - Trong `SemesterView` (danh sách các tuần): `gap-8` (`32px`) để tách biệt rõ ràng từng tuần trên trục thời gian.
- **Khoảng cách danh sách thẻ buổi học (`SessionList`)**: `space-y-3` (`12px`).
- **Khoảng cách các nút trên thanh công cụ (`WeekNavigation`, `SemesterView` sticky bar)**: `gap-2` (`8px`).

---

## 4. Safe Area & Print Layout Standards

1. **PWA Safe Area Utilities (`src/styles/global.css`)**:
   - Cung cấp các class `.pb-safe`, `.pt-safe`, `.mb-safe`, `.mt-safe` sử dụng `env(safe-area-inset-*, 0)` cho các thiết bị iOS có thanh Home Indicator hoặc Dynamic Island.
   - Thanh `BottomNav` bắt buộc có class `pb-safe`.
2. **Print-Friendly Utilities (`print:*`)**:
   - Khi người dùng in trang lịch (`Ctrl+P`), các thành phần điều hướng (`Header`, `Sidebar`, `BottomNav`, cụm nút lọcใน `SemesterView`) đều có class `print:hidden`, đồng thời vùng `main` tự động gỡ bỏ khoảng đệm trái và giới hạn chiều cao (`print:pl-0 print:h-auto print:overflow-visible`).
