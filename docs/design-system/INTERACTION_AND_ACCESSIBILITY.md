# TdyTime Interaction, Motion & Accessibility Guidelines

Tài liệu này hợp nhất các quy chuẩn về **Trạng thái Tương tác, Chuyển động (Motion) và Trợ năng (WCAG 2.2 Level AA Accessibility)** của **TdyTime (`v2026.11.24`)**.

---

## 1. Trạng thái Tương tác & Phản hồi Xúc giác (Interaction States)

Mọi phần tử tương tác trong TdyTime phải cung cấp phản hồi thị giác rõ ràng ở cả 4 trạng thái:

| Trạng thái | Quy chuẩn Kỹ thuật | Ví dụ Class Tailwind |
| :--- | :--- | :--- |
| **Hover** | Đổi sắc độ nền (`hover:bg-accent-action-hover`, `hover:bg-slate-100`) hoặc nâng nhẹ bóng đổ thẻ (`hover:shadow-card-hover`). | `hover:bg-accent-action-hover`, `hover:border-slate-300` |
| **Active / Press** | Thu nhỏ nhẹ tức thì để tạo cảm giác bấm vật lý trên màn hình cảm ứng + `touch-action: manipulation`. | `active:scale-[0.97]`, `active:scale-[0.98]`, `active:scale-95` |
| **Focus-Visible** | Hiển thị vòng sáng tiêu điểm `2px` theo màu chủ đề khi điều hướng bằng bàn phím (`Tab`). | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500` |
| **Disabled / Loading** | Giảm độ mờ xuống `50%`, khóa con trỏ chuột và hiển thị vòng xoay `animate-spin` nếu đang xử lý. | `disabled:opacity-50 disabled:cursor-not-allowed` |

---

## 2. Cơ chế Bảo vệ Thao tác Nhạy cảm (Safe Destructive Actions)

Không sử dụng `window.alert` hay `window.confirm` của trình duyệt. Mọi thao tác xóa hoặc ghi đè dữ liệu phải tuân thủ một trong hai mô hình:

1. **Hộp thoại Xác nhận (`ConfirmModal.tsx`)**:
   - Áp dụng khi xóa toàn bộ dữ liệu lịch, đặt lại cài đặt gốc, hoặc ghi đè dữ liệu từ tệp sao lưu (`BackupRestoreCard`).
   - Tự động chuyển tiêu điểm (focus) vào nút **Hủy (`cancelBtnRef`)** khi mở để tránh bấm nhầm phím `Enter`.
2. **Xác nhận 2 bước tại chỗ (Inline 2-Step Confirmation)**:
   - Áp dụng cho nút **Xóa bộ nhớ đệm PWA (`Clear Cache`)** trong `SettingsView.tsx`.
   - Bấm lần 1 chuyển nút sang trạng thái cảnh báo *"Bấm lần nữa để xác nhận"*; tự động hủy về trạng thái ban đầu sau `4000ms` nếu người dùng không bấm lần 2.

---

## 3. Ngân sách Chuyển động & Hiệu ứng (Motion Budget)

Chuyển động trong TdyTime tuân thủ nguyên tắc **nhanh, có mục đích và không lặp vô hạn gây mất tập trung** (tuân thủ WCAG 2.2.2 Pause, Stop, Hide):

- **Micro-interactions (`150ms–200ms`)**: Chuyển màu nền, viền và thu phóng nhẹ khi chạm nút (`duration-150`, `duration-200`).
- **Mở Accordion / Modal (`200ms–300ms`)**: Sử dụng `animate-in fade-in zoom-in-95 duration-200` cho `ConfirmModal` và `WeekAccordion`.
- **Chuyển đổi Giao diện Sáng/Tối (`400ms`)**: `transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)` trên `body`.
- **Hiệu ứng Trạng thái Có điều kiện**:
  - `.shimmer` (`2s infinite linear`): Chỉ hiển thị trên `Skeleton` trong lúc đang tải dữ liệu.
  - `.conflict-border` (`pulse-red 2s infinite`): Chỉ kích hoạt khi phát hiện 2 buổi học bị trùng tiết trên cùng khung giờ.
- **Tôn trọng `prefers-reduced-motion` (`src/styles/global.css`)**:
  - Khi hệ điều hành bật chế độ giảm chuyển động, toàn bộ `animation-duration` và `transition-duration` tự động hạ xuống `0.01ms !important`.

---

## 4. Chuẩn Trợ năng WCAG 2.2 Level AA & Điều hướng Bàn phím

### 4.1. Kiểm chứng Độ Tương phản Màu sắc trên cả 7 Accent Themes
- **Văn bản thứ cấp (Secondary Text)**: Sử dụng `text-slate-600 dark:text-slate-400` (hoặc `text-slate-500 dark:text-slate-400` trên nền trắng/đen chuẩn), đạt độ tương phản `> 4.5:1`.
- **Nút hành động chính & Ô ngày hiện tại (`--accent-action-bg` vs `--accent-on-action`)**:
  - Đã được chuẩn hóa riêng cho từng theme trong `src/styles/tokens.css` (sử dụng sắc độ `700` cho `themeGreen` `#047857` đạt **5.48:1** và `themeYellow` `#A16207` đạt **4.69:1**, sắc độ `600` cho 5 theme còn lại đạt từ **4.60:1 đến 7.58:1**).
  - Được kiểm tra tự động bằng công thức độ chói tương đối (relative luminance) trong `scripts/check-design-system.mjs`.

### 4.2. Mẫu Điều hướng Bàn phím WAI-ARIA
1. **Segmented Tabs (`StatisticsView.tsx` & `SettingsView.tsx`)**:
   - Container có `role="tablist"`; từng tab có `role="tab"`, `aria-selected`, `aria-controls` (chỉ gắn khi `tabpanel` tương ứng đã được mount để đảm bảo **Zero Dangling ARIA IDREFs**) và `tabIndex={isActive ? 0 : -1}`.
   - Hỗ trợ phím mũi tên `ArrowLeft`, `ArrowRight`, `Home`, `End` để chuyển tab và tự động `.focus()` vào tab mới.
2. **Hộp thoại (`ConfirmModal.tsx`)**:
   - Có `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
   - Bẫy phím `Tab` / `Shift + Tab` bên trong hộp thoại, đóng bằng phím `Escape` và khôi phục tiêu điểm về phần tử kích hoạt (`previousFocusRef`) sau khi đóng.
3. **Thẻ Tương tác (`WelcomeView.tsx` HistoryCard & Scrollable Regions)**:
   - Mọi thẻ `<div>` có sự kiện `onClick` đều được trang bị `role="button"`, `tabIndex={0}` và `onKeyDown` xử lý phím `Enter` / `Space`.
   - Các vùng bảng/biểu đồ cuộn ngang (`HeatmapChart`, `CoTeachersTable`) có `tabIndex={0}`, `role="region"` và `aria-label` mô tả rõ ràng.
