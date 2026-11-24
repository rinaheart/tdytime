# Accessibility (A11y) Standards — TdyTime

Khả năng tiếp cận (Accessibility) trong **TdyTime** là một yêu cầu kỹ thuật bắt buộc (Hard Gate). Giao diện không chỉ phục vụ thao tác chạm/chuột mà còn phải hoạt động hoàn hảo với bàn phím, trình đọc màn hình (Screen Readers) và cây khả năng tiếp cận (Accessibility Tree) của trình duyệt.

---

## 1. Semantic HTML & Native Controls (Mandatory Rules)

1. **Tuyệt đối không dùng `<div onClick>` cho các nút bấm**:
   - Mọi phần tử kích hoạt hành động (chuyển tab, đóng/mở accordion, chọn loại môn học LT/TH, đổi chủ đề, xóa dữ liệu) bắt buộc phải dùng thẻ `<button type="button">` gốc.
   - Liên kết dẫn ra trang ngoài (`Email`, `GitHub`, `Web` trong `SettingsView`) phải dùng thẻ `<a href="..." target="_blank" rel="noopener noreferrer">`.
2. **Định danh Vùng trang (Landmark Regions)**:
   - Mỗi trang phải có cấu trúc Landmark rõ ràng: `<header>`, `<aside aria-label="Thanh điều hướng bên">`, `<nav aria-label="Điều hướng chính">`, `<nav aria-label="Điều hướng di động">`, `<main>`, và các khu vực dữ liệu hoặc bảng cuộn ngang có `role="region" aria-label="..."`.
3. **Biểu mẫu & Ô nhập liệu (Forms & Inputs)**:
   - Mọi thẻ `<input>` và `<select>` phải được gắn kết với `<label htmlFor="...">` (như vùng kéo thả file `#file-input` trong `WelcomeView`) hoặc có thuộc tính `aria-label` mô tả cụ thể ngữ cảnh (ví dụ trong `AbbreviationsCard`: `aria-label="Viết tắt: Lập trình hướng đối tượng"`).

---

## 2. Quy chuẩn Nhãn cho Nút Chỉ có Biểu tượng (Icon-Only Buttons)

Mọi nút chỉ hiển thị icon (không có chữ hiển thị trên mobile hoặc trên toàn bộ viewport) bắt buộc phải có **đồng thời** hai thuộc tính:
- `aria-label="..."` (dành cho Screen Reader và Playwright Accessibility Snapshot).
- `title="..."` (dành cho người dùng chuột trên Desktop).

**Danh sách các nút Icon-Only chuẩn hóa trong hệ thống**:
- Nút đóng/mở Sidebar (`AppLayout`): `aria-label` động theo trạng thái `sidebarCollapsed` + `aria-expanded={!sidebarCollapsed}`.
- Nút đổi ngôn ngữ (`Globe`), chọn màu chủ đề (`ThemePicker`), đổi Sáng/Tối (`Sun`/`Moon`), tải file mới (`Upload`).
- Nút chuyển tuần trước/sau (`Previous Week` / `Next Week` trong `WeekNavigation`) và nút xóa bộ lọc (`X` trong `FilterBar`).
- Nút chọn `LT` / `TH` trong bảng `CourseTypeCard`: `aria-label="Chọn Lý thuyết (LT) cho <Tên môn> (<Mã môn>)"` kèm `aria-pressed={isLT}`.

---

## 3. Các Mẫu Tương tác Bàn phím & WAI-ARIA (Keyboard & ARIA Patterns)

### 3.1. WAI-ARIA Tabs (`StatisticsView` & `SettingsView`)
Các thanh chuyển tab 3 phân đoạn tuân thủ đầy đủ chuẩn **WAI-ARIA Authoring Practices cho Tabs**:
- Khung chứa có `role="tablist"` và `aria-label`.
- Từng nút tab có `role="tab"`, `id="...-tab-<id>"`, `aria-selected={isSelected}`, `aria-controls="...-panel-<id>"`, và **Roving `tabIndex`** (`tabIndex={isSelected ? 0 : -1}`).
- Hỗ trợ điều hướng bằng các phím:
  - `ArrowRight` / `ArrowLeft`: Chuyển sang tab kế tiếp / liền trước (quay vòng tròn) và tự động `.focus()` vào tab mới.
  - `Home` / `End`: Nhảy về tab đầu tiên / cuối cùng.
- Khung nội dung tab có `role="tabpanel"`, `id="...-panel-<id>"`, `aria-labelledby="...-tab-<id>"`.

### 3.2. Accessible Dialogs & Focus Trap (`ConfirmModal`, `ThemePicker`, Settings Modals)
- **`ConfirmModal.tsx`**:
  - Sử dụng `role="alertdialog" aria-modal="true" aria-labelledby="..." aria-describedby="..."`.
  - Khi mở: Lưu `document.activeElement` vào `previousFocusRef`, tự động đưa focus vào nút **Hủy (`cancelBtnRef`)** để đảm bảo an toàn.
  - Khi nhấn `Tab` / `Shift+Tab`: Giữ chặt focus bên trong hộp thoại (Focus Trap).
  - Khi nhấn `Escape` hoặc đóng hộp thoại: Hủy thao tác và trả lại focus về đúng nút đã kích hoạt hộp thoại trước đó.
- **`ThemePicker.tsx`**:
  - Nút kích hoạt có `aria-expanded={isOpen}` và `aria-haspopup="true"`.
  - Từng nút chủ đề màu trong danh sách có `aria-pressed={accentTheme === theme.id}`.
  - Nhấn `Escape` hoặc chọn xong chủ đề sẽ đóng Popover và trả focus về `triggerRef`.

### 3.3. Accordions & Disclosure Panels (`WeekAccordion`, `GroupProgressCard`)
- Nút tiêu đề có `aria-expanded={isExpanded}` và `aria-controls={isExpanded ? panelId : undefined}`.
- Trong `ExamView.tsx`, phần buổi thi đã hoàn thành sử dụng thẻ `<details>` và `<summary>` gốc của HTML5 để hỗ trợ đóng/mở tự nhiên mà không tốn chi phí JavaScript.

### 3.4. Live Regions & Screen Reader Announcements
- **Toasts & PWA Status**: Sử dụng `role="status" aria-live="polite"` để trình đọc màn hình thông báo nội dung mà không ngắt lời người dùng.
- **Visual-Only Indicators (`ExamRow`)**: Khi ca thi đang diễn ra chỉ được biểu thị bằng vòng tròn nhấp nháy và chấm màu trên màn hình, hệ thống chèn thêm `<span className="sr-only">Trạng thái: Đang thi</span>` hoặc `<span className="sr-only">Trạng thái: Sắp diễn ra</span>` để người dùng khiếm thị nhận biết chính xác.
- **Scrollable Data Regions**: Các bảng dữ liệu có thanh cuộn (`AbbreviationsCard`, `CourseTypeCard`, `GroupProgressCard`, `CoTeachersTable`, `HeatmapChart`) đều được gán `tabIndex={0} role="region" aria-label="..."` để người dùng chỉ dùng bàn phím có thể `Tab` vào vùng bảng và dùng phím mũi tên để cuộn ngang/dọc.
