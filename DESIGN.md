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
- **Outline Icons**: Sử dụng hệ icon `Lucide` với `strokeWidth: 1.5` để đạt được vẻ ngoài thanh thoát, chuyên nghiệp và thoáng đãng (Outline style).

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
- **Border Radius**:
  - `sm`: 8px (Buttons nhỏ)
  - `md`: 12px (Cards trung bình)
  - `lg`: 16px (Main cards)
  - `xl`: 24px (Modals/Overlays)
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

*Cập nhật lần cuối: 29/03/2026*
