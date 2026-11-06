# TdyTime Design System

Tài liệu này là nguồn sự thật (Source of Truth) cho ngôn ngữ thiết kế của dự án TdyTime.

---

## 🎯 Nguyên tắc cốt lõi (Core Principles)

1. **Tin cậy (Reliability)**: Giao diện vững chãi, bố cục rõ ràng, tạo niềm tin cho Giảng viên.
2. **Tốc độ (Speed)**: Tối ưu hóa khả năng quét (scanning) thông tin lịch trình nhanh nhất.
3. **Tối giản (Minimalism)**: Loại bỏ các yếu tố rườm rà, tập trung 100% vào dữ liệu giảng dạy.

---

## 🎨 Hệ thống Màu sắc (Color System)

TdyTime sử dụng hệ thống **Accent Themes** linh hoạt.

- **Classic Series**: Hệ màu nguyên bản, năng động (Tổng cộng 7 hệ màu).
  - `themeBlue`, `themeGreen`, `themePink`, `themeViolet`, `themeRed`, `themeYellow`, `themeGrey`.

### 2. Smart Semantic (Adaptive Gradients)

TdyTime v2 sử dụng hệ màu **Ngữ nghĩa thích ứng**, tự động điều chỉnh sắc thái dựa trên Theme được chọn để đảm bảo tính tương phản tối đa. Tất cả màu Semantic được hiển thị dưới dạng dải màu **Linear Gradient**.

- **Morning**: Tông Xanh (Cyan/Blue) - Sự bắt đầu tươi mới.
- **Afternoon**: Tông Cam/Vàng (Orange/Amber) - Năng lượng buổi chiều.
- **Evening**: Tông Tím/Indigo (Purple/Indigo) - Sự điềm tĩnh buổi tối.
- **Status**:
  - Success: Xanh lá (Emerald/Green).
  - Warning: Vàng (Amber/Yellow).
  - Danger: Đỏ (Red/Rose).

### 3. Visual Anchors (Điểm neo thị giác)

Để tối giản hóa giao diện mà vẫn đảm bảo tốc độ quét thông tin cho Giảng viên:

- **Gradient Dots**: Mỗi Badge/Nhãn buổi học đi kèm một chấm tròn mang dải màu Gradient tương ứng. Dù màu sắc nền có trùng lặp, chấm tròn này luôn là điểm neo nhận diện cố định.
- **Visual Anchors 2.0 (STT + Ring)**: Trong các giao diện danh sách (ExamView), điểm neo được nâng cấp thành bộ ba `Chỉ số (STT) + Chấm tròn (Dot) + Vòng bao quanh (Ring)` cho các mục đang diễn ra hoặc kế tiếp, tăng cường độ tương phản và sự tập trung.
- **Notes Indicator (Badge + Dot)**: Để nhận diện các buổi học có ghi chú mà không làm rối bố cục, một Badge nhỏ (`text-[10px]`) hoặc Chấm chỉ báo sẽ xuất hiện trên `SessionCard`. Điều này giúp Giảng viên biết nhanh buổi nào cần lưu ý trước khi mở Modal chi tiết.
- **Outline Icons**: Sử dụng hệ icon `Lucide` với `strokeWidth: 1.5` để đạt được vẻ ngoài thanh thoát, chuyên nghiệp và thoáng đãng (Outline style).

---

## 📐 Cấu trúc hàng chuẩn (Standardized Row Architecture)

Để loại bỏ hiện tượng giật cục bố cục (Layout Shift) và đảm bảo sự thẳng hàng tuyệt đối:

1. **Fixed-Height Two-Row**: Các hàng thông tin quan trọng (như `ExamRow`) sử dụng cấu trúc 2 hàng cố định (`min-h-[52px]`):
   - **Hàng 1**: Tên môn học (Line-clamp 2) + Thời gian (Căn lề phải).
   - **Hàng 2**: Chi tiết phụ (Phòng, Vai trò, Hình thức) + Vị trí (Căn lề phải).
2. **Alignment Tokens**: Sử dụng các token căn lề chung (`TIME_COL_CLASS`, `RIGHT_COL_CLASS`) để đảm bảo các cột dữ liệu số luôn đứng thẳng theo trục dọc trên toàn bộ danh sách.

---

## 🔡 Typography

- **Heading/Numbers**: `Montserrat` - Đảm bảo các con số (tiết học, giờ giấc) hiển thị sắc nét, hiện đại.
- **Body**: `Be Vietnam Pro` - Tối ưu cho việc đọc văn bản tiếng Việt dài.
- **Scale**:
  - `text-xs`: 0.75rem (Nhãn phụ)
  - `text-sm`: 0.875rem (Nội dung chính)
  - `text-base`: 1rem (Tiêu đề nhỏ)
  - `text-xl`: 1.25rem (Tiêu đề Card)
  - `text-2xl`: 1.5rem (Tiêu đề trang)

---

## 📐 Khoảng cách & Bo góc (Spacing & Radii)

- **Base Unit**: `4px` (Tailwind standard)
- **Border Radius (Đồng bộ theo chuẩn TdyTripZ — Compact Flat Architecture)**:
  - `sm` (`--radius-sm`): `6px` (Buttons nhỏ, badges, tags)
  - `md` (`--radius-md`): `8px` (Inputs, segmented buttons, thành phần nội bộ)
  - `lg` (`--radius-lg`): `8px` (Sub-cards, khối tương tác)
  - `xl` (`--radius-xl`): `8px` (Buttons chính, khối điều hướng)
  - `2xl` (`--radius-2xl`): `10px` (Main cards — độ bo cong chuẩn cho toàn bộ Card chính)
  - `3xl` (`--radius-3xl`): `12px` (Modals / Bottom Sheets / Overlays)
- **Shadows**:
  - Sử dụng shadow nhẹ để tạo chiều sâu mà không gây rối (Soft elevation).

---

## 🔄 Motion & Interaction

- **Duration**: `200ms` (Standard), `300ms` (Layout change)
- **Easing**: `ease-in-out`
- **Interactions**:
  - Hover: Độ bóng tăng nhẹ, scale 101% cho các Card quan trọng.
  - Active: Phản hồi tức thì bằng màu accent mạnh hơn.

---

## ⚡ Triết lý Hiệu năng (Performance Philosophy)

Thiết kế của TdyTime không chỉ là về thẩm mỹ mà còn là về tốc độ.

1.  **Critical Path First**: Ưu tiên hiển thị nội dung quan trọng nhất ngay lập tức bằng cách nhúng trực tiếp Critical CSS vào HTML.
2.  **Zero-Jank Loading**: Sử dụng Skeleton Shimmer và App Shell để loại bỏ hiện tượng giật cục bố cục (Layout Shift) trong quá trình tải dữ liệu.
3.  **Adaptive Resource Loading**:
    - Các thành phần nặng (như Biểu đồ, Analytics) chỉ được tải khi trình duyệt rảnh rỗi.
    - Phân mảnh Bundle thông minh để tận dụng bộ nhớ đệm trình duyệt tối đa.
4.  **Instant Feedback**: Mọi tương tác của người dùng phải có phản hồi thị giác trong vòng dưới 100ms.

---

*Cập nhật lần cuối: 06/05/2026 (v1.9.2)*
