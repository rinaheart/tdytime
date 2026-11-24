# TdyTime Layout & Responsive Guidelines

Tài liệu này hợp nhất các quy chuẩn về **Bố cục (Layout), Khoảng cách (Spacing) và Chiến lược Đáp ứng theo Tác vụ (Task-Driven Responsive Design)** của **TdyTime (`v2026.11.24`)**.

---

## 1. Cấu trúc Khung Ứng dụng (Application Shell — `AppLayout.tsx`)

TdyTime sử dụng cấu trúc khung đơn nhất (`src/app/layout/AppLayout.tsx`) thích ứng tự động giữa Desktop và Mobile quanh điểm gãy `md` (`768px`):

| Thành phần | Mobile (`< 768px`) | Desktop (`md: >= 768px`) |
| :--- | :--- | :--- |
| **Top Header** | `fixed top-0 h-12 z-40` — Hiển thị Logo, Tên giảng viên, Học kỳ, `LanguagePicker`, `ThemePicker`, nút Đổi giao diện Sáng/Tối. | `fixed top-0 h-14 z-40` — Tích hợp thêm thanh điều hướng ngang 5 tab chính (`Hôm nay`, `Tuần`, `Học kỳ`, `Lịch thi`, `Thống kê`) + nút `Cài đặt`. |
| **Main Viewport** | `max-w-7xl mx-auto px-3.5 pt-16 pb-20` (Chừa khoảng trống an toàn cho thanh điều hướng đáy). | `max-w-7xl mx-auto px-6 pt-20 pb-8`. |
| **Bottom Navigation** | `fixed bottom-0 h-14 z-40 pb-safe` — Thanh 5 tab nổi trong vùng ngón tay cái (Thumb Zone) kèm chỉ báo `w-5 h-0.5 bg-accent-600`. | Ẩn hoàn toàn (`md:hidden`). |

---

## 2. Thích ứng theo Tác vụ (Responsive by Task)

Nguyên tắc đáp ứng của TdyTime không chỉ là thu nhỏ phần tử khi màn hình hẹp lại, mà là **chuyển đổi mô hình hiển thị theo tác vụ của người dùng trên thiết bị đó**:

### 2.1. Lịch Tuần & Học Kỳ (`WeekTableLayout` ↔ `WeekCardLayout`)
- **Tác vụ Desktop (Đối chiếu toàn cảnh 7 ngày)**:
  - Mặc định hiển thị `WeekTableLayout` (`src/views/shared/WeekTableLayout.tsx`) — Bảng ma trận 7 cột (Thứ Hai → Chủ Nhật) × 3 hàng ca học (`S` / `C` / `T`).
  - Cột Chủ Nhật tự động thu gọn về `80px` nếu không có tiết giảng để nhường diện tích cho 6 ngày trong tuần.
  - Cột ngày hôm nay được đánh dấu nổi bật bằng `bg-accent-action text-accent-on-action`.
- **Tác vụ Mobile (Cuộn đọc nhanh bằng một tay)**:
  - Mặc định chuyển sang `WeekCardLayout` (`src/views/shared/WeekCardLayout.tsx`) — Danh sách thẻ xếp dọc theo từng ngày có lịch, giúp đọc trọn vẹn tên môn học và phòng học mà không phải cuộn ngang.
  - Người dùng vẫn có thể chủ động chuyển đổi qua lại giữa 2 chế độ (`Dọc` / `Ngang`) bằng nút chuyển đổi trên `WeekNavigation`.

### 2.2. Bảng Tùy chỉnh Môn học trong Cài đặt (`CourseTypeCard.tsx` & `AbbreviationsCard.tsx`)
- **Trên Desktop (`sm: >= 640px`)**: Hiển thị đầy đủ các cột `STT`, `Tên học phần`, `Mã nhóm`, `Lớp`, `Nhóm`, `Hình thức (LT/TH)`.
- **Trên Mobile (`< 640px`)**: Ẩn các cột phụ (`hidden sm:table-cell`) và gộp thông tin `Mã nhóm • Lớp • Nhóm` thành một dòng metadata gọn gàng ngay bên dưới tên môn học, loại bỏ hoàn toàn hiện tượng tràn bảng ngang.

### 2.3. Lịch Coi Thi (`ExamView.tsx`)
- Hỗ trợ chuyển đổi giữa chế độ **Thẻ (Card View)** và **Bảng 2 Cột (Flexbox Two-Row Table View)** với chiều cao hàng tối thiểu `min-h-[52px]` và cột Giờ/Phòng cố định `w-[60px] font-num` căn phải, đảm bảo không xảy ra dịch chuyển bố cục (CLS = 0) trên màn hình hẹp `320px–390px`.

---

## 3. Phạm vi Áp dụng các Pattern Bố cục Đặc thù (Scoped Layout Patterns)

Để giữ giao diện tinh gọn và tự nhiên, các pattern bố cục nâng cao chỉ được sử dụng đúng nơi có nhu cầu thực tế:

1. **Segmented Focus (Thanh chuyển đổi 3 Tab)**:
   - **Phạm vi áp dụng**: Chỉ áp dụng cho các màn hình tổng hợp đa chiều có nguy cơ gây quá tải DOM/cuộn dài là `StatisticsView` (`Tổng quan`, `Xu hướng`, `Lớp & Phòng`) và `SettingsView` (`Dữ liệu & PWA`, `Môn học`, `Thông tin`).
   - **Không bắt buộc toàn cục**: Các màn hình tác vụ trực tiếp như `TodayView`, `WeeklyView`, `SemesterView`, `ExamView` giữ nguyên cấu trúc một luồng thẳng đứng trực quan.
2. **Bento Metric Grid**:
   - **Phạm vi áp dụng**: Sử dụng cho cụm 4 chỉ số tổng quan trong `StatisticsView` (`grid-cols-2 lg:grid-cols-4`) và lưới thẻ cài đặt trong `SettingsView`. Không dùng để mô tả toàn bộ ứng dụng.
3. **Horizontal Scroll Containers (`.scrollbar-mobile-visible`)**:
   - Chỉ sử dụng cho biểu đồ nhiệt học kỳ 15–20 tuần (`HeatmapChart.tsx`) kèm căn lề trái trên di động (`justify-start sm:justify-center`) để không bị cắt mất các tuần đầu tiên.

---

## 4. Hệ thống Khoảng cách, Z-Index & Safe Area

### 4.1. Thang Khoảng cách Chuẩn (4px Grid)
- **Khoảng cách trong thẻ (`Card` padding)**: `p-4 md:p-5` (`16px` trên mobile, `20px` trên desktop).
- **Khoảng cách giữa các thẻ trong danh sách**: `gap-3` (`12px`) hoặc `gap-4` (`16px`).
- **Khoảng cách giữa các khối section lớn**: `space-y-4 md:space-y-6`.

### 4.2. Phân tầng Độ cao (Z-Index Scale)
- `z-10`: Ô ngày hôm nay và chỉ báo dọc trong bảng lịch (`WeekTableLayout`, `WeekAccordion`).
- `z-20`: Cột cố định bên trái (`sticky left-0`) của bảng lịch tuần.
- `z-40`: Thanh Header cố định phía trên và thanh Bottom Tab Bar cố định phía dưới (`AppLayout`).
- `z-50`: Menu thả xuống (`ThemePicker`, `LanguagePicker`).
- `z-[100]` – `z-[110]`: Thông báo `Toast`, banner cập nhật PWA và hộp thoại `ConfirmModal`.

### 4.3. Tiện ích Vùng An toàn PWA (`src/styles/global.css`)
- `.pt-safe`, `.pb-safe`, `.mt-safe`, `.mb-safe`: Bù trừ phần khuyết màn hình (notch / Dynamic Island) và thanh Home Indicator khi cài đặt làm ứng dụng PWA độc lập trên iOS/Android.
