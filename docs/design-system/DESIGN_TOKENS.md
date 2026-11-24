# Design Tokens Specification — TdyTime

Tài liệu này là bảng tham chiếu chính thức cho toàn bộ **Design Tokens** trong dự án **TdyTime**, được định nghĩa tại `src/styles/tokens.css`, đăng ký với Tailwind CSS v4 tại `src/styles/global.css`, và đồng bộ cấu hình tại `src/core/config/constants.ts`.

---

## 1. Kiến trúc Token (Token Architecture)

TdyTime sử dụng kiến trúc Token 2 tầng:
1. **CSS Custom Properties (`src/styles/tokens.css`)**: Lưu trữ các giá trị gốc trong `:root` và ghi đè động thông qua selector `[data-accent="<themeId>"]` trên thẻ `<html>`.
2. **Tailwind v4 `@theme` Mapping (`src/styles/global.css`)**: Ánh xạ các biến CSS thành các utility classes chuẩn của Tailwind (`bg-accent-600`, `text-accent-400`, `rounded-2xl`, v.v.) hỗ trợ đầy đủ modifier độ mờ (ví dụ: `bg-accent-500/20`, `ring-accent-500/15`).

---

## 2. Accent Color Tokens (`--accent-50` → `--accent-950`)

Các token màu nhấn được định nghĩa dưới dạng **3 kênh RGB cách nhau bởi khoảng trắng** (ví dụ: `59 130 246`) trong `tokens.css` và bọc trong `rgb(var(--accent-*))` ở `@theme` để tương thích với cú pháp opacity của Tailwind CSS.

| Token Name | Tailwind Utility (`bg-*`, `text-*`, `border-*`, `ring-*`) | Default Value (`themeBlue` RGB) | Hex Tương đương | Mục đích sử dụng chính |
| :--- | :--- | :--- | :--- | :--- |
| `--accent-50` | `accent-50` | `239 246 255` | `#eff6ff` | Nền nhẹ cho tab đang chọn, badge, hover nút phụ (Light mode). |
| `--accent-100` | `accent-100` | `219 234 254` | `#dbeafe` | Nền badge `LT`, banner ngày hôm nay (`WeekCardLayout`), vòng tròn STT thi. |
| `--accent-200` | `accent-200` | `191 219 254` | `#bfdbfe` | Viền badge `pending`/`theory`, ô Heatmap mức 1 (`1-3 tiết`). |
| `--accent-300` | `accent-300` | `147 197 253` | `#93c5fd` | Thanh biểu đồ Thực hành (`TH`), chữ badge trên nền tối (`dark:text-accent-300`). |
| `--accent-400` | `accent-400` | `96 165 250` | `#60a5fa` | Màu chữ/icon nhấn chính trong Dark Mode (`dark:text-accent-400`), ô Heatmap mức 2. |
| `--accent-500` | `accent-500` | `59 130 246` | `#3b82f6` | Viền thẻ đang `LIVE`, vòng focus (`focus-visible:ring-accent-500`), thanh tiến độ chuẩn. |
| `--accent-600` | `accent-600` | `37 99 235` | `#2563eb` | **Primary Action Color**: Nền nút chính (`bg-accent-600`), chữ nhấn trong Light Mode. |
| `--accent-700` | `accent-700` | `29 78 216` | `#1d4ed8` | Trạng thái hover của nút chính (`hover:bg-accent-700`), chữ trên nền `accent-50`/`100`. |
| `--accent-800` | `accent-800` | `30 64 175` | `#1e40af` | Viền tối trong Dark Mode (`dark:border-accent-800`), ô Heatmap mức cao nhất (`>9 tiết`). |
| `--accent-900` | `accent-900` | `30 58 138` | `#1e3a8a` | Nền nhấn trầm trong Dark Mode (thường dùng với opacity: `dark:bg-accent-900/20` hoặc `/30`). |
| `--accent-950` | `accent-950` | `23 37 84` | `#172554` | Nền hover tinh tế trên thanh công cụ trong Dark Mode (`dark:hover:bg-accent-950/40`). |

---

## 3. Adaptive Semantic Gradient Tokens (`--semantic-*`)

Dùng cho các chấm trạng thái (`Badge.tsx`) và nhãn ca học Sáng/Chiều/Tối (`WeekTableLayout.tsx`). Các token này tự động thay đổi giá trị khi `data-accent` thay đổi để tránh trùng màu với chủ đề chính.

| Token Pair | Default Value (`:root`) | Theme Override (Smart Shift) | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `--semantic-morning-from`<br>`--semantic-morning-to` | `#22d3ee` (cyan-400)<br>`#0891b2` (cyan-600) | Khi `themeBlue`:<br>`#22d3ee` → `#0d9488` (teal-600) | Ca Sáng (`S` / `morning`). |
| `--semantic-afternoon-from`<br>`--semantic-afternoon-to` | `#fb923c` (orange-400)<br>`#ea580c` (orange-600) | *(Giữ nguyên trên mọi theme)* | Ca Chiều (`C` / `afternoon`). |
| `--semantic-evening-from`<br>`--semantic-evening-to` | `#818cf8` (indigo-400)<br>`#4f46e5` (indigo-600) | Khi `themeViolet`:<br>`#818cf8` → `#0891b2` (cyan-600) | Ca Tối (`T` / `evening`). |
| `--semantic-success-from`<br>`--semantic-success-to` | `#34d399` (emerald-400)<br>`#059669` (emerald-600) | Khi `themeGreen`:<br>`#a3e635` (lime-400) → `#059669` | Trạng thái Hoàn thành / Trực tuyến (`live` / `success`). |
| `--semantic-warning-from`<br>`--semantic-warning-to` | `#fbbf24` (amber-400)<br>`#d97706` (amber-600) | Khi `themeYellow`:<br>`#fb923c` (orange-400) → `#d97706` | Cảnh báo vượt ngưỡng / Chế độ Offline (`warning`). |
| `--semantic-danger-from`<br>`--semantic-danger-to` | `#f87171` (red-400)<br>`#dc2626` (red-600) | Khi `themeRed`:<br>`#fb7185` (rose-400) → `#9f1239` (rose-800) | Xung đột lịch / Xóa dữ liệu (`danger`). |

---

## 4. Typography Tokens

| Token Name | CSS Utility / Selector | Font Family Value | Đặc tả kỹ thuật |
| :--- | :--- | :--- | :--- |
| `--font-heading` | `h1, h2, h3, h4, .font-heading` | `'Montserrat', sans-serif` | Kèm `@apply tracking-tight;`, weights `600`, `700`, `800` (`font-black`). |
| `--font-body` | `body`, `.font-sans` | `'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | Tối ưu dấu tiếng Việt, weights `400`, `500`, `600`, `700`. |
| `--font-num` | `.font-num` | `'Montserrat', sans-serif` | Bắt buộc kèm `font-variant-numeric: tabular-nums;`. |
| *(Monospace)* | `.font-mono` | Hệ thống monospace chuẩn | Dùng cho mã JSON dán vào, phiên bản SW (`SW v2026.11.24`), input viết tắt. |

---

## 5. Border Radius Tokens (TdyTripZ Architectural Scale)

| Token Name | Tailwind Utility | Giá trị | Thành phần áp dụng |
| :--- | :--- | :--- | :--- |
| `--radius-sm` | `rounded-sm` | `6px` | Nhãn nhỏ, tag mã môn trên mobile. |
| `--radius-md` | `rounded-md` | `8px` | `WeeklyCard` (`SessionCard` variant weekly), khung bảng `ExamView`, nút đóng Toast. |
| `--radius-lg` | `rounded-lg` | `8px` | `Badge.tsx`, nút tab trong `StatisticsView`, thẻ ca học trong `PeriodStandardsCard`. |
| `--radius-xl` | `rounded-xl` | `8px` | `Button.tsx`, `FilterBar` inputs/selects, nút icon trên Header/Sidebar, `Toast.tsx`. |
| `--radius-2xl` | `rounded-2xl` | `10px` | `Card.tsx`, `TodayCard`, `CompletedCard`, `WeekAccordion`, `StatsHeader`, `EmptyState`. |
| `--radius-3xl` | `rounded-3xl` | `12px` | `ConfirmModal.tsx`. |

---

## 6. Elevation & Shadow Tokens

| Token / Utility | Giá trị CSS | Mục đích sử dụng |
| :--- | :--- | :--- |
| `--shadow-card` / `shadow-sm` | `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)` | Độ nổi tiêu chuẩn cho 100% thẻ (`Card`, `SessionCard`, `Header`). |
| `--shadow-card-hover` / `hover:shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.08)` | Trạng thái di chuột lên thẻ có tương tác (`interactive` Card, `WeeklyCard`, `HistoryCard`). |
| `shadow-lg shadow-accent-500/20` | Colored Accent Glow | Nút hành động chính (`primary` Button), thẻ tiêu điểm (`ProgressCard`, `WeekTableLayout` tuần hiện tại). |
| `--shadow-modal` / `shadow-2xl` | `0 20px 60px rgba(0, 0, 0, 0.15)` | Hộp thoại (`ConfirmModal`, Settings Modal, PWA Banner/Toast). |
| `shadow-[0_-4px_12px_rgba(0,0,0,0.04)]` | Bottom Bar Upward Shadow | Thanh điều hướng dưới cùng trên di động (`BottomNav` trong `AppLayout.tsx`). |
| `shadow-[2px_0_8px_rgba(0,0,0,0.03)]` | Sticky Column Right Shadow | Cột cố định bên trái (`S`/`C`/`T`) khi cuộn ngang bảng lịch tuần (`WeekTableLayout.tsx`). |

---

## 7. Z-Index Scale (Thang phân lớp Không gian)

| Lớp (Layer) | Tailwind Class | Thành phần Giao diện |
| :--- | :--- | :--- |
| **Layer 0 (Base)** | `z-0`, `z-10` | Nội dung trang, đường kẻ trục thời gian (`SemesterView` timeline `before:z-0`), thẻ `WeekAccordion` (`z-10`), ô ngày hôm nay trong bảng tuần (`z-10`). |
| **Layer 1 (Sticky Table Headers/Cols)** | `z-10`, `z-20` | Tiêu đề bảng cố định (`thead sticky top-0 z-10`), cột ca học cố định bên trái (`sticky left-0 z-20` trong `WeekTableLayout`). |
| **Layer 2 (Sticky Bars & Sidebar)** | `z-30` | Thanh điều hướng bên trên Desktop (`aside z-30` trong `AppLayout`), thanh công cụ dính đầu trang học kỳ (`sticky top-0 z-30` trong `SemesterView`). |
| **Layer 3 (App Shell Navigation)** | `z-40` | Thanh Header cố định trên cùng (`header fixed top-0 z-40`) và thanh BottomNav trên di động (`nav fixed bottom-0 z-40`). |
| **Layer 4 (Popovers & Floating Toasts)** | `z-50` | Menu chọn chủ đề màu (`ThemePicker` popover `z-50`), thông báo `Toast.tsx` (`fixed bottom-20 md:bottom-6 z-50`). |
| **Layer 5 (Contextual Banners)** | `z-[100]` | Banner nhắc cài đặt PWA (`PWAUpdateHandler` `z-[100]`), Toast cuộn tuần trong `SemesterView` (`z-[100]`). |
| **Layer 6 (System Alerts & Confirmations)** | `z-[110]` | Hộp thoại `ConfirmModal.tsx` (`z-[110]`), thông báo cập nhật Service Worker (`PWAUpdateHandler` `z-[110]`). |
| **Layer 7 (Full-Screen Modals)** | `z-[120]` | Modal Quy chuẩn tiết học / Changelog (`SettingsView` `z-[120]`), Modal Khôi phục sao lưu (`BackupRestoreCard` `z-[120]`), Hướng dẫn cài iOS (`z-[120]`). |
| **Layer 8 (Initial Boot Loader)** | `z-index: 9999` | Màn hình nạp ban đầu trong `index.html` (`.initial-loader-wrapper`). |
