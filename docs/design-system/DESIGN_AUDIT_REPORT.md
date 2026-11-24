# Comprehensive Design Audit, Standardization Plan & Implementation Report — TdyTime

Tài liệu này ghi lại toàn bộ kết quả kiểm toán thiết kế (Phase 1 & 2), danh sách các điểm thiếu nhất quán đã phát hiện (Inconsistency Audit), kế hoạch chuẩn hóa theo mức độ ưu tiên (Standardization Plan), báo cáo các thay đổi thực tế đã triển khai trong codebase (Implementation Report) và Checklist kiểm soát tuân thủ (Compliance Checklist).

---

## 1. Phạm vi Kiểm toán Codebase (Audit Coverage Inventory)

Cuộc kiểm toán đã rà soát **100% các tệp liên quan đến giao diện, cấu hình và kiến trúc** trong repository:

- **Global Styles & Tokens**: `index.html`, `src/styles/tokens.css`, `src/styles/global.css`.
- **Configuration & Theme Engine**: `src/core/config/constants.ts`, `src/core/themes/theme.registry.ts`, `src/core/stores/ui.store.ts`.
- **App Shell & Routing**: `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/app/PWAUpdateHandler.tsx`, `src/app/layout/AppLayout.tsx`.
- **UI Primitives (`src/ui/primitives/`)**: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `ConfirmModal.tsx`, `Skeleton.tsx`, `Toast.tsx`.
- **UI Composites (`src/ui/composites/`)**: `EmptyState.tsx`, `FilterBar.tsx`, `ThemePicker.tsx`, `TypeBadge.tsx`, `LazyRender.tsx`.
- **All 7 Feature Views (`src/views/`)**:
  1. `welcome/WelcomeView.tsx` (`HistoryCard`, `PasteInput`, Upload Zone).
  2. `today/TodayView.tsx`, `TodayHeader.tsx`, `SessionList.tsx`, `NextTeachingSection.tsx`.
  3. `weekly/WeeklyView.tsx`, `WeekNavigation.tsx`.
  4. `semester/SemesterView.tsx`, `WeekAccordion.tsx`.
  5. `exam/ExamView.tsx` (`ExamHeader`, `ExamRow`, `CompletedExamRow`).
  6. `statistics/StatisticsView.tsx`, 7 cards (`StatsHeader`, `ProgressCard`, `GroupProgressCard`, `InsightCard`, `TeachingStructureCard`, `TopSubjectsCard`, `CoTeachersTable`) & 3 charts (`HeatmapChart`, `WeeklyTrendChart`, `DailyBarChart`).
  7. `settings/SettingsView.tsx` & 6 sub-cards (`AbbreviationsCard`, `CourseTypeCard`, `BackupRestoreCard`, `DangerZoneCard`, `PeriodStandardsCard`, `AboutCard`).
  8. `shared/SessionCard.tsx`, `WeekCardLayout.tsx`, `WeekTableLayout.tsx`.

---

## 2. Báo cáo Phát hiện Điểm Thiếu Nhất Quán (Inconsistency Audit)

Quá trình phân tích đã phân loại rõ **Sự khác biệt có chủ đích (Intentional Variations)** và **Các sai lệch do thiếu quy chuẩn / di sản mã cũ (Unintentional Inconsistencies / Defects)**:

### 2.1. Sự khác biệt có chủ đích (Được giữ nguyên & chuẩn hóa vào DNA)
1. **Biến thể bo góc của `SessionCard`**:
   - Ở `TodayView` (`TodayCard`), thẻ dùng `rounded-2xl` (`10px`) và `p-3.5` để tạo cảm giác thoáng đãng khi chỉ có vài buổi học trong ngày.
   - Ở `WeeklyView` (`WeeklyCard`), thẻ dùng `rounded-md` (`8px`) và `p-2.5` để tối ưu diện tích bên trong ô lưới 7 cột của `WeekTableLayout`.
2. **Nút Coi thi thích ứng theo độ gần thời gian (`TodayHeader.tsx`)**:
   - Khi kỳ thi còn xa (`distant`): Hiển thị nút tròn nhỏ gọn `w-10 h-10 rounded-full` chỉ có icon.
   - Khi kỳ thi sắp diễn ra trong 7 ngày (`upcoming`) hoặc ngay hôm nay (`today`): Mở rộng thành nút pill có chữ `Coi thi` / `Đang thi` kèm số lượng buổi thi.
3. **Nút trên thanh `BottomNav` tắt hiệu ứng `transition` (`transition-none`)**:
   - Chủ đích giúp phản hồi chuyển tab chính trên di động diễn ra tức thì (0ms visual lag).

### 2.2. Các điểm thiếu nhất quán & lỗi vi phạm Design DNA đã phát hiện

| Mã lỗi | Mức độ | Vị trí Tệp | Mô tả Chi tiết Điểm Thiếu Nhất Quán | Nguyên nhân |
| :--- | :--- | :--- | :--- | :--- |
| **INC-01** | **High** | `src/core/config/constants.ts` (dòng 176) | Trong `THEME_MIGRATION`, khóa `'themeViolet'` bị ánh xạ sai sang `'themeGrey'` (`themeViolet: 'themeGrey'`), dù `'themeViolet'` là một chủ đề hợp lệ trong `THEME_IDS`. | Sót lại từ đợt refactor tên chủ đề trước đây. |
| **INC-02** | **High** | `src/styles/global.css` vs `src/styles/tokens.css` | `tokens.css` định nghĩa đầy đủ 11 sắc độ từ `--accent-50` đến `--accent-950`, nhưng khối `@theme` trong `global.css` chỉ đăng ký từ `--color-accent-50` đến `--color-accent-900`, **bỏ sót `--color-accent-950`**. Trong khi đó, `AppLayout.tsx`, `WelcomeView.tsx`, `ThemePicker.tsx`, `ExamView.tsx`, `WeekNavigation.tsx`, `SemesterView.tsx`, `CourseTypeCard.tsx` đều đang sử dụng class `dark:bg-accent-950/40` hoặc `bg-accent-950/50`. | Quên khai báo `--color-accent-950: rgb(var(--accent-950));` trong `@theme` của Tailwind v4 khiến các class `*-accent-950` không nhận biến CSS động! |
| **INC-03** | **High** | `src/ui/primitives/Badge.tsx` vs `DESIGN.md` / `tokens.css` | Trong `DESIGN.md` và `tokens.css`, ca **Morning (Sáng)** được định nghĩa là tông **Cyan/Blue** (`#22d3ee` → `#0891b2`), và chấm gradient của `Badge` variant `morning` cũng dùng `--semantic-morning-from` (Cyan). Tuy nhiên, màu nền và chữ của `VARIANT_CLASSES.morning` trong `Badge.tsx` lại bị gán nhầm thành `bg-amber-50 text-amber-700 border-amber-200` (màu Vàng Hổ phách của Warning), gây xung đột thị giác giữa chấm tròn màu Xanh Cyan và nền thẻ màu Vàng Amber. | Nhầm lẫn giữa màu mặt trời buổi sáng (Amber) và quy ước Smart Semantic (Morning = Cyan/Sky, Afternoon = Orange/Amber). |
| **INC-04** | **Medium** | `src/views/weekly/WeekNavigation.tsx` (dòng 62) & `src/views/semester/WeekAccordion.tsx` (dòng 144) | Huy hiệu **"Tuần hiện tại" (`currentWeek`)** bị hardcode class `bg-blue-700 text-white` thay vì dùng token màu chủ đề `bg-accent-600` (hoặc `bg-accent-700`), trong khi ở `WeekCardLayout.tsx` (dòng 41) huy hiệu `Today` lại dùng đúng `bg-accent-600`. Khi người dùng chọn chủ đề Hồng/Xanh lá/Đỏ, huy hiệu này vẫn giữ màu xanh dương cố định. | Hardcode màu Tailwind trực tiếp thay vì dùng semantic token `accent-*`. |
| **INC-05** | **Medium** | `src/views/shared/WeekTableLayout.tsx` (dòng 67) | Ô tiêu đề của ngày hôm nay (`isToday`) trong bảng lịch tuần sử dụng bóng đổ hardcode màu xanh dương `shadow-[0_0_15px_rgba(37,99,235,0.3)]` thay vì dùng biến màu nhấn `shadow-md shadow-accent-500/30`. | Hardcode giá trị RGB của `blue-600` (`37, 99, 235`). |
| **INC-06** | **Medium** | `src/ui/primitives/Skeleton.tsx` vs `src/styles/global.css` | `Skeleton.tsx` sử dụng class `animate-shimmer` (không được định nghĩa trong `@theme` của Tailwind v4), trong khi `global.css` định nghĩa class tiện ích là `.shimmer` với `@keyframes shimmer`. | Lệch tên class giữa file CSS toàn cục và component primitive. |
| **INC-07** | **Low** | `src/views/welcome/WelcomeView.tsx` (dòng 53) | `HistoryCard` sử dụng `<div onClick={() => onLoad(item)}>` không có `role="button"`, `tabIndex={0}` hay xử lý bàn phím `Enter`/`Space`, làm giảm khả năng tiếp cận qua bàn phím trên màn hình chào mừng. | Thiếu thuộc tính hỗ trợ điều hướng bàn phím cho thẻ phức hợp chứa nút xóa bên trong. |
| **INC-08** | **Low** | `src/core/config/constants.ts` (dòng 185–202) | Các hằng số di sản `SESSION_COLORS`, `SESSION_ACCENT_COLORS`, `COURSE_TYPE_COLORS` trong `constants.ts` không còn được bất kỳ component nào import (do đã chuyển sang `SessionCard`, `Badge`, `TypeBadge` và `tokens.css`), hoặc chứa định nghĩa cũ (`border-l-4`) trái với kiến trúc phẳng hiện tại. | Mã di sản từ phiên bản v1 chưa được đánh dấu `@deprecated` hoặc đồng bộ. |

---

## 3. Kế hoạch Chuẩn hóa & Báo cáo Thực thi (Standardization Plan & Implementation Report)

Mọi thay đổi trong Phase 6 được thực hiện theo nguyên tắc **Surgical & Non-Destructive Refinement** (chỉnh sửa chính xác, không phá vỡ bất kỳ logic hay bài kiểm thử hiện có nào):

### 3.1. Các Hạng mục Đã Triển khai trong Codebase (Completed Implementations)

1. **[FIX INC-02] Đăng ký `--color-accent-950` vào `@theme` trong `src/styles/global.css` & sửa hiệu ứng `.shimmer`**:
   - Bổ sung `--color-accent-950: rgb(var(--accent-950));` vào khối `@theme` trong `src/styles/global.css`. Nhờ đó, toàn bộ các trạng thái hover và nền tối tinh tế (`dark:hover:bg-accent-950/40`, `dark:bg-accent-950/50`) trên khắp 7 màn hình hoạt động chuẩn xác với cả 7 chủ đề màu.
2. **[FIX INC-01] Chuẩn hóa `THEME_MIGRATION` trong `src/core/config/constants.ts`**:
   - Cập nhật `themeViolet: 'themeViolet'` và đánh dấu `@deprecated` rõ ràng cho các hằng số màu cũ không còn dùng trong v2 để tránh nhầm lẫn cho developer sau này.
3. **[FIX INC-03] Đồng bộ màu `morning` và `warning` trong `src/ui/primitives/Badge.tsx`**:
   - Chuyển `VARIANT_CLASSES.morning` sang hệ màu Cyan/Sky (`bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800`) để khớp hoàn toàn với chấm gradient `--semantic-morning-from` (`#22d3ee`) và `DESIGN.md`.
   - Chuyển `VARIANT_CLASSES.warning` sang hệ màu Amber (`bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800`) để khớp với chấm gradient `--semantic-warning-from` (`#fbbf24`) và phân biệt rõ với `danger` (Red).
4. **[FIX INC-04 & INC-05] Loại bỏ màu `blue` hardcode trong `WeekNavigation.tsx`, `WeekAccordion.tsx` và `WeekTableLayout.tsx`**:
   - Thay thế `bg-blue-700` bằng `bg-accent-600 dark:bg-accent-500` trên huy hiệu "Tuần hiện tại" trong `WeekNavigation.tsx` và `WeekAccordion.tsx`.
   - Thay thế `shadow-[0_0_15px_rgba(37,99,235,0.3)]` bằng `shadow-md shadow-accent-500/25` trên cột ngày hôm nay trong `WeekTableLayout.tsx`.
5. **[FIX INC-06] Đồng bộ hiệu ứng Shimmer trên `src/ui/primitives/Skeleton.tsx`**:
   - Kết nối chuẩn xác hiệu ứng shimmer để khung tải `Skeleton` hiển thị chuyển động mượt mà ở cả Light và Dark mode.
6. **[FIX INC-07] Bổ sung Khả năng Tiếp cận Bàn phím cho `HistoryCard` trong `src/views/welcome/WelcomeView.tsx`**:
   - Bổ sung `role="button"`, `tabIndex={0}`, `onKeyDown` (kích hoạt khi nhấn `Enter` hoặc `Space`) và `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500` cho `HistoryCard`.
7. **[ENFORCEMENT] Thiết lập Công cụ Kiểm toán Tự động & Unit Tests**:
   - Tạo script `scripts/check-design-system.mjs` (hỗ trợ cờ `--dry-run`) để tự động kiểm tra tính toàn vẹn của Design Tokens, `@custom-variant dark`, bộ 7 `AccentTheme`, và quét các lỗi hardcode hoặc thiếu tài liệu.
   - Tạo bộ Unit Test `src/core/themes/designSystem.test.ts` kiểm chứng toàn bộ hợp đồng `THEME_IDS`, `THEMES`, `THEME_MIGRATION`, `getTheme`, `isValidTheme`, và `getPeriodTimes` (`LT`/`TH`).
   - Cập nhật tài liệu gốc `/DESIGN.md` để liên kết trực tiếp tới bộ tài liệu chi tiết tại `/docs/design-system/`.

---

## 4. Checklist Tuân thủ Bắt buộc (Mandatory UI Compliance Checklist)

Mọi Pull Request hoặc thay đổi giao diện do Developer hay AI Agent thực hiện trong tương lai **bắt buộc** phải vượt qua 10 mục kiểm tra sau trước khi hoàn tất:

- [ ] **1. Token-First Colors**: Không sử dụng màu tĩnh (`blue-*`, `indigo-*`) cho các thành phần mang tính nhấn/chủ đề; luôn dùng `accent-50` .. `accent-950`.
- [ ] **2. Complete Light/Dark Pairing**: Mọi class nền (`bg-white`), chữ (`text-slate-800`) và viền (`border-slate-200`) đều có cặp `dark:*` tương ứng (`dark:bg-slate-900`, `dark:text-slate-100`, `dark:border-slate-800`).
- [ ] **3. TdyTripZ Compact Radii**: Sử dụng `rounded-2xl` (`10px`) cho thẻ chính, `rounded-xl` (`8px`) cho nút bấm/ô nhập liệu, `rounded-lg` (`8px`) cho Badge, `rounded-3xl` (`12px`) cho Modal.
- [ ] **4. Tabular Numerals (`font-num`)**: Mọi con số (giờ học, số tiết, phần trăm, ngày tháng, STT) đều gắn class `font-num` (hoặc `font-num tabular-nums`).
- [ ] **5. Text Overflow Protection**: Các vùng chứa tên môn học, tên lớp, tên giảng viên hoặc phòng học trong flex/grid đều có `min-w-0` và `truncate` (hoặc `line-clamp-2`).
- [ ] **6. Touch Target & Focus Ring**: Mọi nút bấm trên mobile đạt kích thước tối thiểu `44×44px` (`h-11` / `min-h-[44px]` / `w-11 h-11`) và có `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500`.
- [ ] **7. Semantic HTML & ARIA**: Sử dụng `<button type="button">` cho mọi thao tác bấm; cung cấp `aria-label` và `title` cho mọi nút chỉ có icon.
- [ ] **8. Single-Elevation Architecture**: Không lồng thẻ có bóng đổ và viền dày bên trong một thẻ khác; phân tách nội dung con bằng đường kẻ mảnh `divide-y divide-slate-100 dark:divide-slate-800`.
- [ ] **9. Performance & Store Guardrails**: Chỉ dùng Atomic Selectors `useStore((s) => s.field)` với Zustand; không import qua barrel files trong `main.tsx`, `App.tsx`, `router.tsx`, `AppLayout.tsx`.
- [ ] **10. Automated Verification Passed**: Chạy thành công `node scripts/check-design-system.mjs --dry-run`, `node scripts/check-i18n-parity.mjs`, unit tests và build không có lỗi.
