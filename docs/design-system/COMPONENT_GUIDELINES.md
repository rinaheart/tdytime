# Component Guidelines & Specifications — TdyTime

Tài liệu này quy định cấu trúc, biến thể, kích thước, trạng thái và quy tắc sử dụng cho toàn bộ hệ thống Component của **TdyTime**, được chia thành 3 tầng: **UI Primitives** (`src/ui/primitives/`), **UI Composites** (`src/ui/composites/`), và **Domain View Components** (`src/views/`).

---

## 1. Tầng UI Primitives (`src/ui/primitives/`)

### 1.1. `Button` (`src/ui/primitives/Button.tsx`)
Thành phần nút bấm tiêu chuẩn có hỗ trợ `forwardRef`, trạng thái đang tải (`loading`) và biểu tượng (`icon`).

- **Variants (`ButtonVariant`)**:
  - `primary` *(Mặc định)*: `bg-accent-600 hover:bg-accent-700 text-white shadow-sm shadow-accent-500/20` — Dùng cho hành động chính duy nhất trong một khu vực.
  - `secondary`: `bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200` — Dùng cho các hành động phụ trợ (như Đặt lại, Hủy, Cập nhật cache).
  - `ghost`: `hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300` — Dùng cho các nút công cụ không viền.
  - `danger`: `bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400` — Dùng cho các thao tác xóa/cảnh báo.
- **Sizes (`ButtonSize`)**:
  - `sm`: `px-3 py-1.5 text-xs gap-1.5`
  - `md` *(Mặc định)*: `px-4 py-2 text-sm gap-2`
  - `lg`: `px-5 py-2.5 text-base gap-2`
- **Hành vi & Trạng thái Bắt buộc**:
  - Bo góc: `rounded-xl` (`8px`).
  - Hiệu ứng nhấn: `active:scale-[0.97] transition-transform transition-colors duration-200`.
  - Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500`.
  - Disabled / Loading: `disabled:opacity-50 disabled:cursor-not-allowed`. Khi `loading={true}`, thay thế `icon` bằng vòng xoay `w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin`.

### 1.2. `Badge` (`src/ui/primitives/Badge.tsx`)
Huy hiệu trạng thái và phân loại với khả năng tự động hiển thị chấm chuyển sắc (**Adaptive Semantic Gradient Dot**).

- **Cấu trúc cơ sở**:
  `inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-lg`
- **Variants (`BadgeVariant`)**:
  - **Trạng thái phiên**: `live` (Emerald + dot), `pending` (Accent), `completed` (Slate).
  - **Ca học (Tự động bật Gradient Dot)**:
    - `morning`: Cyan/Sky (`bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800`) kèm chấm gradient `--semantic-morning-from` → `to`.
    - `afternoon`: Orange (`bg-orange-50 text-orange-700 border-orange-200...`) kèm chấm gradient `--semantic-afternoon-from` → `to`.
    - `evening`: Indigo (`bg-indigo-50 text-indigo-700 border-indigo-200...`) kèm chấm gradient `--semantic-evening-from` → `to`.
  - **Hình thức học phần**: `theory` (`LT` - Accent), `practice` (`TH` - Orange).
  - **Hệ thống**: `warning` (Amber + dot), `danger` (Red + dot), `info` (Sky), `default` (Slate).

### 1.3. `Card` (`src/ui/primitives/Card.tsx`)
Khung chứa nội dung đơn tầng tiêu chuẩn.

- **Cấu trúc cơ sở**:
  `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm transition-all duration-200`
- **Props & Biến thể**:
  - `noPadding`: Bỏ lớp đệm `p-4 md:p-5` (dùng khi chứa bảng dữ liệu tràn viền).
  - `interactive`: Thêm `hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer`.
  - `title`, `description`, `headerAction`: Tự động dựng phần đầu thẻ chuẩn hóa (`text-sm font-bold text-slate-700 dark:text-slate-200`).

### 1.4. `ConfirmModal` (`src/ui/primitives/ConfirmModal.tsx`)
Hộp thoại xác nhận hành động quan trọng hoặc nguy hiểm, được render qua `createPortal(..., document.body)`.

- **Chuẩn Accessibility (Bắt buộc)**:
  - `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
  - **Focus Management**: Tự động lưu phần tử đang focus trước khi mở, chuyển focus vào nút **Hủy (`cancelBtnRef`)** sau 10ms để tránh bấm nhầm phím Enter gây xóa dữ liệu, khóa vòng lặp phím `Tab` / `Shift+Tab` (Focus Trap) bên trong hộp thoại, đóng khi nhấn `Escape` và khôi phục focus cũ khi đóng.
- **Kích thước & Hình khối**: `max-w-[320px] rounded-3xl p-6 z-[110]`, hai nút hành động xếp dọc (`w-full h-11 rounded-2xl font-bold text-sm`).

### 1.5. `Skeleton` & `SessionCardSkeleton` (`src/ui/primitives/Skeleton.tsx`)
Khung xương giữ chỗ trong lúc nạp dữ liệu hoặc chuyển route (`Suspense fallback`).

- Sử dụng hiệu ứng `.shimmer` định nghĩa trong `global.css`, luôn kèm `aria-hidden="true"`.

### 1.6. `Toast` (`src/ui/primitives/Toast.tsx`)
Thông báo phản hồi nhanh ở góc dưới bên phải (`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50`).

- Tự động ẩn sau `3000ms`, có `role="status" aria-live="polite"`, hỗ trợ trạng thái `success` (icon `CheckCircle2` màu `text-emerald-400`), `error` (`text-red-400`) và `info`.

---

## 2. Tầng UI Composites (`src/ui/composites/`)

### 2.1. `FilterBar` (`src/ui/composites/FilterBar.tsx`)
Thanh công cụ tìm kiếm và lọc đa chiều cho `WeeklyView` và `SemesterView`.

- **Cấu trúc**:
  - Ô tìm kiếm văn bản (`Search` icon bên trái, `h-10 rounded-xl text-xs`).
  - Lưới 3 dropdown `<select>` (`Lớp học`, `Phòng học`, `Giảng viên`): trên mobile chia `grid-cols-2 sm:grid-cols-4`, trên desktop dàn ngang `md:flex`.
  - Nút **Xóa bộ lọc (`X`)**: Chỉ xuất hiện khi có ít nhất 1 bộ lọc đang kích hoạt (`hasActive`), nền đỏ nhạt `bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 h-10 min-w-[40px] rounded-xl`.

### 2.2. `EmptyState` (`src/ui/composites/EmptyState.tsx`)
Trạng thái trống theo ngữ cảnh thời gian thực của học kỳ.

- **4 Biến thể Ngữ cảnh (`EmptyStateType`)**:
  1. `BEFORE_SEMESTER`: Hiển thị đồng hồ đếm ngược số ngày tới ngày khai giảng (`text-5xl font-black text-accent-600 font-num`).
  2. `AFTER_SEMESTER`: Biểu tượng `PartyPopper` kèm nút chuyển nhanh sang trang **Xem thống kê (`/stats`)**.
  3. `NO_DATA`: Biểu tượng `Zap` kèm nút dẫn về trang **Nhập dữ liệu (`/`)**.
  4. `NO_SESSIONS`: Biểu tượng `Coffee` thông báo hôm nay được nghỉ hoặc tuần hiện tại không có lịch giảng.

### 2.3. `ThemePicker` (`src/ui/composites/ThemePicker.tsx`)
Menu popover chọn 1 trong 7 chủ đề màu nhấn trên thanh Header.

- Nút kích hoạt: `w-11 h-11 md:w-9 md:h-9 rounded-xl` với `aria-expanded` và `aria-haspopup="true"`.
- Popover (`w-64 rounded-2xl z-50`): Hiển thị danh sách 7 chủ đề, mỗi dòng (`min-h-[40px]`) gồm tên chủ đề bên trái và thanh 4 ô màu preview (`w-[60px] h-3.5`) bên phải. Tự động đóng và trả lại focus khi nhấn `Escape` hoặc click ra ngoài.

### 2.4. `TypeBadge` (`src/ui/composites/TypeBadge.tsx`)
Huy hiệu chuyên dụng cho loại học phần:
- `LT` (Lý thuyết): Variant `theory` + Icon `FileText`.
- `TH` (Thực hành): Variant `practice` + Icon `FlaskConical`.
- `?` (Chưa xác định): Variant `default` + Icon `HelpCircle`.
- Hỗ trợ chế độ `compact={true}` (`text-[9px] px-1.5 py-0.5`, icon `10px`) để gắn vừa vặn vào góc dưới bên phải của `SessionCard`.

---

## 3. Tầng Domain View Components (`src/views/`)

### 3.1. `SessionCard` (`src/views/shared/SessionCard.tsx`)
Thành phần trung tâm hiển thị một ca giảng dạy. Là một **Pure Stateless Component** (`React.memo`) với 3 hình thái trình bày:

1. **`TodayCard` (`variant="today"`, trạng thái `LIVE` hoặc `PENDING`)**:
   - Khung thẻ `p-3.5 rounded-2xl`. Khi `isLive={true}`, bật viền `border-accent-500 ring-1 ring-accent-500/20` và gắn `<Badge variant="live" dot={true}>Live</Badge>` ở góc phải.
   - Tầng 1: Khung giờ `startTime - endTime` (`text-sm font-black font-num`).
   - Tầng 2: Tên môn học (ưu tiên tên viết tắt nếu có, `text-[14px] font-bold`).
   - Tầng 3 (ngăn cách bởi `border-t border-slate-100 dark:border-slate-800`): `Phòng học • Mã lớp (Nhóm)` bên trái và `<TypeBadge compact />` bên phải.
2. **`CompletedCard` (`variant="today"`, trạng thái `COMPLETED`)**:
   - Thu gọn thành thẻ nhỏ `p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 opacity-75` với icon `Clock`.
   - *(Lưu ý: Trong `SessionList.tsx`, các buổi đã hoàn thành còn được gom chung vào một khung danh sách tổng hợp gọn gàng ở cuối ngày).*
3. **`WeeklyCard` (`variant="weekly"`)**:
   - Tối ưu cho ô bảng ma trận tuần: `p-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-[1px]`.
   - Dòng 1: Giờ học bên trái (`text-[11px] font-num`) — Mã phòng bên phải (`font-black truncate`).
   - Dòng 2: Tên môn học (`text-[12px] font-bold line-clamp-2 min-h-[2.4em]`).
   - Dòng 3: Tên lớp/nhóm bên trái — `<TypeBadge compact />` bên phải.
   - Dòng 4 (Tùy chọn khi `showTeacher={true}`): Dải chân thẻ `bg-accent-50 dark:bg-accent-900/40` hiển thị tên giảng viên.

### 3.2. `WeekTableLayout` vs. `WeekCardLayout` (`src/views/shared/`)
Hai chế độ hiển thị lịch tuần bổ trợ cho nhau:
- **`WeekTableLayout` (Chế độ Bảng Ngang - Mặc định trên Desktop `>= 768px`)**:
  - Bảng `min-w-[1000px] table-fixed`. Cột đầu tiên (`w-12 sticky left-0 z-20`) hiển thị 3 huy hiệu tròn chuyển sắc `S` (Sáng), `C` (Chiều), `T` (Tối).
  - 7 cột tiếp theo ứng với Thứ Hai → Chủ Nhật. Nếu Chủ Nhật không có lịch dạy, cột Chủ Nhật tự động thu hẹp về `80px` để nhường diện tích cho 6 ngày trong tuần.
  - Cột của **Ngày hôm nay (`isToday`)** được tô nổi bật phần tiêu đề bằng `bg-accent-600 text-white ring-2 ring-accent-400` và nền cột `bg-accent-50/40 dark:bg-accent-900/10`.
- **`WeekCardLayout` (Chế độ Thẻ Dọc - Mặc định trên Mobile `< 768px`)**:
  - Chỉ hiển thị những ngày có tiết dạy trong tuần, mỗi ngày là một khối `rounded-2xl` có banner tiêu đề thứ/ngày ở trên và danh sách các ca học phân cách bằng nền xen kẽ (zebra striping) ở dưới.

### 3.3. Segmented Tab Control (`StatisticsView` & `SettingsView`)
Mẫu điều hướng phân đoạn 3 tab chuẩn WAI-ARIA:
- Container: `role="tablist"`, nền `bg-slate-200/75 dark:bg-slate-800/90 p-1 rounded-xl grid grid-cols-3 gap-1 border border-slate-200/80 dark:border-slate-800`.
- Tab Button: `role="tab"`, `min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5`.
- Trạng thái đang chọn (`aria-selected="true"`): `bg-white dark:bg-slate-900 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/80`.
- Hỗ trợ đầy đủ phím mũi tên `ArrowLeft`, `ArrowRight`, `Home`, `End`.
