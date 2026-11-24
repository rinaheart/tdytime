# Interaction & Motion DNA — TdyTime

Hệ thống chuyển động và tương tác của **TdyTime** tuân theo nguyên tắc **"Crisp, Purposeful & Zero-Blocking"**: mọi hiệu ứng chuyển động chỉ nhằm mục đích xác nhận thao tác của người dùng hoặc làm mượt sự thay đổi trạng thái bố cục, tuyệt đối không làm chậm tốc độ truy cập thông tin.

---

## 1. Ngân sách Thời gian & Đường cong Chuyển động (Timing & Easing Budgets)

| Loại Chuyển động | Thời lượng (Duration) | Đường cong (Easing) | Class Tailwind / CSS | Thành phần áp dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Tactile Press Feedback** | `< 100ms` (Tức thì) | `ease-out` | `active:scale-[0.97]` hoặc `active:scale-95` | Toàn bộ `Button`, nút điều hướng tuần, nút hành động thẻ. |
| **Micro-Interaction & Hover** | `150ms` – `200ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition-colors duration-150` / `transition-all duration-200` | Đổi màu nền khi hover, bật/tắt tab trong Segmented Control, mở `ThemePicker`. |
| **View & Layout Transition** | `300ms` | `ease-in-out` | `animate-in fade-in duration-300` / `transition-all duration-300` | Chuyển đổi giữa các trang (`TodayView`, `WeeklyView`, v.v.), đóng/mở Sidebar, mở rộng `WeekAccordion`. |
| **Theme Canvas Background** | `400ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | `transition: background-color 0.4s ...` (`body`) | Chuyển đổi mượt mà giữa chế độ Sáng (Light) và Tối (Dark). |
| **Data Visualization Bars** | `500ms` – `700ms` | `ease-out` | `transition-all duration-500` / `duration-700` | Độ dài thanh tiến độ trong `ProgressCard`, `GroupProgressCard`, `TopSubjectsCard`. |

---

## 2. Chuẩn Trạng thái Tương tác (Interactive States Matrix)

Mọi phần tử tương tác trong TdyTime phải định nghĩa đầy đủ 5 trạng thái sau:

1. **Default (Mặc định)**:
   - Phải có `cursor-pointer` rõ ràng và `touch-action: manipulation` (được áp dụng toàn cục trong `global.css` cho `button, [role="button"], [role="tab"], a, label, summary` để loại bỏ độ trễ double-tap 300ms trên thiết bị di động).
2. **Hover (Di chuột - Desktop)**:
   - Nút chính (`primary`): Tăng một bậc độ đậm từ `bg-accent-600` lên `hover:bg-accent-700`.
   - Nút công cụ Header (`Globe`, `ThemePicker`, `DarkMode`, `Upload`): Nền chuyển nhẹ sang màu chủ đề `hover:bg-accent-50 dark:hover:bg-accent-950/40`.
   - Thẻ lịch tuần (`WeeklyCard`): Nổi nhẹ lên `hover:shadow-md hover:-translate-y-[1px] hover:border-slate-300 dark:hover:border-slate-600`.
3. **Focus-Visible (Điều hướng Bàn phím)**:
   - Sử dụng vòng sáng 2px theo màu chủ đề hiện tại:
     `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500`
   - Đối với các nút nằm sát mép khung chứa (như tab `BottomNav` hoặc tiêu đề `WeekAccordion`, `GroupProgressCard`), sử dụng `focus-visible:ring-inset` để vòng focus không bị cắt mất bởi `overflow-hidden`.
   - Đối với các nút xóa nguy hiểm (`Danger`), vòng focus chuyển sang màu đỏ: `focus-visible:ring-red-500`.
4. **Active / Pressed (Khi nhấn giữ)**:
   - Thu nhỏ nhẹ tỷ lệ (`active:scale-[0.97]`, `active:scale-[0.98]` hoặc `active:scale-95`) để tạo phản hồi xúc giác (tactile feedback) trên màn hình cảm ứng.
   - *Ngoại lệ có chủ đích*: Các tab trên thanh `BottomNav` (`AppLayout.tsx`) sử dụng `transition-none` để việc chuyển trang diễn ra tức thì, không có độ trễ hoạt ảnh.
5. **Disabled / Loading (Vô hiệu hóa / Đang xử lý)**:
   - Giảm độ mờ `disabled:opacity-50` (hoặc `disabled:opacity-30` cho nút chuyển tuần đầu/cuối trong `WeekNavigation`) kèm `disabled:cursor-not-allowed`.

---

## 3. Các Mẫu Phản hồi & Hoạt ảnh Đặc thù (Signature Motion Patterns)

### 3.1. Xác nhận 2 bước Nội tuyến (Inline 2-Step Confirmation Timeout)
Để tránh mở hộp thoại popup làm gián đoạn luồng thao tác đối với các hành động xóa/đặt lại nhanh:
- **Lần nhấn 1**: Chuyển trạng thái cục bộ `isConfirming = true`. Nút đổi sang màu đỏ (`bg-red-600 text-white`), hiển thị biểu tượng cảnh báo (`AlertTriangle` với `animate-pulse`) hoặc cụm nút `Xóa? [X] [✓]`.
- **Tự động hoàn tác**: Khởi tạo bộ đếm `setTimeout` (`3000ms` trong `DangerZoneCard`/`ExamHeader`, `4500ms` trong `SettingsView` Clear Cache). Nếu người dùng không nhấn lần 2 trong khoảng thời gian này, nút tự động trở về trạng thái ban đầu.

### 3.2. Smart Session Auto-Reset (Tự động quay về Hôm nay sau 30 phút nghỉ)
Trong `AppLayout.tsx`, hệ thống lắng nghe sự kiện `visibilitychange`:
- Nếu người dùng rời khỏi ứng dụng (ẩn tab hoặc khóa màn hình điện thoại) quá **30 phút** (`30 * 60 * 1000ms`) và đang ở một trang phụ (như `Settings` hay `Statistics`), khi mở lại ứng dụng, hệ thống tự động điều hướng về `/today` để hiển thị ngay ca dạy hiện tại.

### 3.3. Shimmer & Pulse Animations (`src/styles/global.css`)
- **`.shimmer`**: Dải sáng chạy ngang trong `2s infinite linear` dùng cho `Skeleton` khi đang đọc dữ liệu từ `IndexedDB` hoặc nạp lazy chunk.
- **`.conflict-border` (`@keyframes pulse-red`)**: Viền đỏ nhấp nháy `2px solid #ef4444` trong chu kỳ `2s infinite` để cảnh báo các ca học bị trùng giờ.

---

## 4. Tuân thủ `prefers-reduced-motion` (Mandatory Accessibility Rule)

Tại `src/styles/global.css` (dòng 204–213), TdyTime áp dụng quy tắc bảo vệ người dùng nhạy cảm với chuyển động:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```
Khi hệ điều hành bật chế độ Giảm chuyển động, mọi hiệu ứng `animate-in`, `animate-bounce`, `animate-pulse` và `transition-all` đều hoàn tất tức thì trong `0.01ms`.
