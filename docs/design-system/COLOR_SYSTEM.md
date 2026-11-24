# Color System — TdyTime

Hệ thống màu sắc của **TdyTime** được thiết kế theo mô hình **Dual-Theme (Light / Dark) + 7 Dynamic Accent Themes + Adaptive Semantic Gradients**, đảm bảo độ tương phản chuẩn WCAG AA trên mọi tổ hợp màu.

---

## 1. Quy tắc Phân bổ Màu sắc 60-30-10

1. **60% Bề mặt Nền Trung tính (Neutral Canvas & Structural Surfaces)**:
   - Sử dụng hệ màu **Slate** lạnh và sạch (`slate-50` đến `slate-950`).
   - Giúp mắt giảng viên không bị mỏi khi tra cứu bảng thời khóa biểu dày đặc nhiều giờ liền.
2. **30% Cấu trúc & Văn bản (Typography, Borders & Muted Surfaces)**:
   - Chữ chính (`slate-800` / `dark:slate-100`), chữ phụ (`slate-600` / `dark:slate-400`), đường viền phân cách (`slate-100`, `slate-200` / `dark:slate-800`).
3. **10% Ngân sách Màu nhấn & Ngữ nghĩa (Accent & Semantic Budget)**:
   - Dành riêng cho nút hành động chính (`bg-accent-600`), tab đang hoạt động (`text-accent-600`), thẻ buổi học đang diễn ra (`border-accent-500`), và các nhãn ca học/trạng thái (`Badge`, `TypeBadge`).

---

## 2. Bảng màu Nền & Bề mặt (Dual-Theme Surface Matrix)

> **Quy tắc bắt buộc (Mandatory Rule)**: Mọi class màu nền, màu chữ và màu viền trong component đều phải đi theo cặp **Light / Dark** tương ứng. Tuyệt đối không dùng CSS `!important` để đảo ngược màu toàn cục.

| Vai trò Bề mặt (Surface Role) | Light Mode Class | Dark Mode Class | Ghi chú sử dụng |
| :--- | :--- | :--- | :--- |
| **App Root / Body Canvas** | `bg-slate-50` hoặc `bg-white` | `dark:bg-slate-950` | Nền tổng thể của ứng dụng (`#f8fafc` / `#020617`). |
| **Primary Card / Header / Sidebar** | `bg-white` | `dark:bg-slate-900` | Bề mặt chính của mọi thẻ (`Card`, `SessionCard`, `AppLayout` Header/Sidebar/BottomNav). |
| **Secondary / Muted Surface** | `bg-slate-50` hoặc `bg-slate-50/80` | `dark:bg-slate-800/50` hoặc `dark:bg-slate-900/60` | Khu vực buổi học đã hoàn thành, tiêu đề bảng (`thead`), ô nhập liệu (`FilterBar`). |
| **Interactive Hover Surface** | `hover:bg-slate-50` hoặc `hover:bg-slate-100` | `dark:hover:bg-slate-800` | Hiệu ứng di chuột trên các dòng bảng, nút phụ, mục điều hướng. |
| **Accent Tinted Surface** | `bg-accent-50` hoặc `bg-accent-50/40` | `dark:bg-accent-900/20` hoặc `dark:bg-accent-900/30` | Mục Sidebar đang chọn, cột ngày hôm nay trong `WeekTableLayout`, nền icon nhấn. |
| **Modal Backdrop Overlay** | `bg-slate-900/60 backdrop-blur-xs` | `dark:bg-black/80 backdrop-blur-md` | Lớp phủ làm mờ nền phía sau các hộp thoại Modal. |

---

## 3. Phân cấp Màu Văn bản & Đường viền (Text & Border Hierarchy)

### 3.1. Văn bản (Text Hierarchy)
| Cấp độ (Level) | Light Mode | Dark Mode | Tỷ lệ tương phản & Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Primary Heading & Data** | `text-slate-900` hoặc `text-slate-800` | `dark:text-white` hoặc `dark:text-slate-100` | Tiêu đề trang (`h1`), tên môn học trên thẻ, khung giờ bắt đầu. |
| **Secondary Body & Labels** | `text-slate-700` hoặc `text-slate-600` | `dark:text-slate-300` hoặc `dark:text-slate-400` | Tên lớp, giảng viên, mô tả cài đặt, nhãn cột bảng. |
| **Muted / Metadata / Disabled** | `text-slate-500` hoặc `text-slate-400` | `dark:text-slate-400` hoặc `dark:text-slate-500` | Dấu phân cách (`•`, `-`), số thứ tự dòng, phiên bản SW, trạng thái vô hiệu hóa. |
| **Accent Highlight Text** | `text-accent-600` hoặc `text-accent-700` | `dark:text-accent-400` | Khung giờ buổi đang `LIVE`, số liệu thống kê chính, liên kết hành động. |

### 3.2. Đường viền & Phân cách (Borders & Dividers)
| Loại đường viền | Light Mode | Dark Mode | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Subtle Hairline Divider** | `border-slate-100` / `divide-slate-100` | `dark:border-slate-800` / `dark:divide-slate-800` | Đường kẻ ngăn cách bên trong thẻ, giữa các dòng trong bảng, viền dưới Header. |
| **Standard Container Border** | `border-slate-200` hoặc `border-slate-200/80` | `dark:border-slate-800` hoặc `dark:border-slate-700` | Viền ngoài của thẻ dữ liệu, ô input, select dropdown, bảng lịch tuần. |
| **Active / Live Focus Border** | `border-accent-500` hoặc `border-accent-600` | `dark:border-accent-400` hoặc `dark:border-accent-500` | Thẻ buổi học đang `LIVE`, tuần hiện tại, thẻ `ProgressCard`. |

---

## 4. Bảy Chủ đề Màu nhấn (7 Registered Accent Themes)

Được định nghĩa tại `src/core/config/constants.ts` (`THEME_IDS`, `THEMES`) và `src/styles/tokens.css`. Thuộc tính `data-accent` được gắn trực tiếp lên `document.documentElement` (`<html>`).

| Theme ID | Tên hiển thị (`vi` / `en`) | Màu đại diện (`--accent-500` / `--accent-600`) | Preview Swatches (`ThemePicker`) | Smart Semantic Override |
| :--- | :--- | :--- | :--- | :--- |
| **`themeBlue`** *(Default)* | Xanh đại dương / Ocean Blue | `#3b82f6` / `#2563eb` | `bg-blue-100`, `300`, `500`, `700` | Dịch `morning` sang Cyan/Teal (`#22d3ee` → `#0d9488`) |
| **`themeGreen`** | Xanh rừng già / Forest Green | `#10b981` / `#059669` | `bg-emerald-100`, `300`, `500`, `700` | Dịch `success` sang Lime/Emerald (`#a3e635` → `#059669`) |
| **`themePink`** | Hồng anh đào / Sakura Pink | `#ec4899` / `#db2777` | `bg-pink-100`, `300`, `500`, `700` | Giữ mặc định (không xung đột) |
| **`themeViolet`** | Tím oải hương / Lavender Violet | `#8b5cf6` / `#7c3aed` | `bg-violet-100`, `300`, `500`, `700` | Dịch `evening` sang Indigo/Cyan (`#818cf8` → `#0891b2`) |
| **`themeRed`** | Đỏ thẫm / Crimson Red | `#ef4444` / `#dc2626` | `bg-red-100`, `300`, `500`, `700` | Dịch `danger` sang Rose/Maroon (`#fb7185` → `#9f1239`) |
| **`themeYellow`** | Vàng mật ong / Honey Yellow | `#eab308` / `#ca8a04` | `bg-yellow-100`, `300`, `500`, `700` | Dịch `warning` sang Orange/Amber (`#fb923c` → `#d97706`) |
| **`themeGrey`** | Xám đá phiến / Slate Grey | `#64748b` / `#475569` | `bg-slate-200`, `400`, `600`, `800` | Giữ mặc định |

---

## 5. Màu Ngữ nghĩa Cố định (Semantic & Domain Colors)

### 5.1. Phân loại Học phần (`LT` vs `TH`)
- **Lý thuyết (`LT` / `theory`)**: Sử dụng màu chủ đề `bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800` (đi kèm icon `FileText`).
- **Thực hành (`TH` / `practice`)**:
  - Trên `Badge` / `TypeBadge`: Sử dụng tông Cam/Hổ phách nổi bật (`bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800` hoặc `amber` trong `GroupProgressCard`) đi kèm icon `FlaskConical` để phân biệt tức thì với Lý thuyết trên thẻ lịch nhỏ.

### 5.2. Trạng thái Hệ thống & Cảnh báo
- **Live / Online / Completed (`emerald`)**:
  - Light: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - Dark: `dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800`
- **Warning / Cache Clear / Backup Notice (`amber`)**:
  - Light: `bg-amber-50/80 text-amber-700 border-amber-200/60`
  - Dark: `dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50`
- **Danger / Destructive / Conflict (`red`)**:
  - Light: `bg-red-50 text-red-600 border-red-200` (hover/confirm: `bg-red-600 text-white`)
  - Dark: `dark:bg-red-900/20 dark:text-red-400 dark:border-red-800`
- **Info / Version Badge (`sky`)**:
  - Light: `bg-sky-50 text-sky-700 border-sky-200`
  - Dark: `dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800`
