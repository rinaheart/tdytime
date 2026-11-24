# TdyTime Design Tokens Specification

Tài liệu này là đặc tả kỹ thuật cho toàn bộ hệ thống **Design Tokens** của **TdyTime (`v2026.11.24`)**, được định nghĩa tại nguồn chuẩn `src/styles/tokens.css` và đấu nối trực tiếp vào Tailwind CSS v4 qua khối `@theme` trong `src/styles/global.css`.

> **Quy tắc Toàn vẹn Token**: Mọi token khai báo trong `src/styles/tokens.css` bắt buộc phải được đấu nối và sử dụng thực tế trong CSS/component. Không duy trì token trùng lặp hoặc token bỏ không (dead tokens).

---

## 1. Kiến trúc Màu sắc 3 Tầng (Three-Tier Color Architecture)

Hệ thống màu của TdyTime được chia thành 3 tầng độc lập nhằm cân bằng giữa khả năng cá nhân hóa (7 chủ đề) và tính ổn định ngữ nghĩa học thuật:

### Tầng A — Accent Colors & WCAG AA Action Contrast Tokens (Thay đổi theo Theme)

Được kích hoạt qua thuộc tính `[data-accent="<themeId>"]` trên thẻ `<html>` và đồng bộ với `THEMES` trong `src/core/config/constants.ts`.

#### 1. Dải 11 sắc độ RGB (`--accent-50` đến `--accent-950`)
Mỗi chủ đề định nghĩa đủ 11 kênh màu RGB không dấu phẩy để Tailwind v4 kết hợp được với toán tử độ mờ (`/20`, `/40`):

| Theme ID | Tên hiển thị | `--accent-50` | `--accent-100` | `--accent-500` | `--accent-600` | `--accent-700` | `--accent-900` | `--accent-950` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`themeBlue`** | Ocean Blue | `239 246 255` | `219 234 254` | `59 130 246` | `37 99 235` | `29 78 216` | `30 58 138` | `23 37 84` |
| **`themeGreen`** | Forest Green | `236 253 245` | `209 250 229` | `16 185 129` | `5 150 105` | `4 120 87` | `6 78 59` | `2 44 34` |
| **`themePink`** | Sakura Pink | `253 242 248` | `252 231 243` | `236 72 153` | `219 39 119` | `190 24 93` | `131 24 67` | `80 7 36` |
| **`themeViolet`** | Lavender Violet | `245 243 255` | `237 233 254` | `139 92 246` | `124 58 237` | `109 40 217` | `76 29 149` | `46 16 101` |
| **`themeRed`** | Crimson Red | `254 242 242` | `254 226 226` | `239 68 68` | `220 38 38` | `185 28 28` | `127 29 29` | `69 10 10` |
| **`themeYellow`** | Honey Yellow | `254 252 232` | `254 249 195` | `234 179 8` | `202 138 4` | `161 98 7` | `113 63 18` | `66 32 6` |
| **`themeGrey`** | Slate Grey | `248 250 252` | `241 245 249` | `100 116 139` | `71 85 105` | `51 65 85` | `15 23 42` | `2 6 23` |

#### 2. Token Tương phản Hành động Chính (`--accent-action-*`) & Vòng Tiêu điểm (`--accent-focus-*`)
Vì sắc độ `accent-600` của `themeGreen` (`#059669`, tỷ lệ `3.77:1`) và `themeYellow` (`#CA8A04`, tỷ lệ `2.94:1`) không đạt ngưỡng tương phản WCAG AA (`4.5:1`) với chữ trắng, đồng thời `accent-500` của `themeYellow` (`#EAB308`, tỷ lệ `2.02:1` với nền trắng / `1.86:1` với `slate-50`) không đạt ngưỡng tương phản phi văn bản WCAG 2.2 SC 1.4.11 (`3.0:1`), TdyTime thiết lập bộ token tương phản chuyên biệt đồng bộ 1:1 với `THEME_PALETTES` trong `src/core/config/constants.ts`:

- **Action Contrast Tokens (WCAG 2.2 AA `>= 4.5:1`)**:
  - `--accent-action-bg` ⟶ Utility Tailwind: `bg-accent-action`, `border-accent-action`
  - `--accent-action-hover` ⟶ Utility Tailwind: `hover:bg-accent-action-hover`
  - `--accent-on-action` ⟶ Utility Tailwind: `text-accent-on-action`
- **Focus Ring Contrast Tokens (WCAG 2.2 SC 1.4.11 `>= 3.0:1` ở cả Light & Dark Mode)**:
  - `--accent-focus-light`: Sắc độ vòng focus ở Light Mode (đạt `>= 4.24:1` so với `slate-50` `#F8FAFC` và `>= 4.60:1` so với `#FFFFFF`).
  - `--accent-focus-dark`: Sắc độ vòng focus ở Dark Mode (đạt `>= 5.98:1` so với `slate-900` `#0F172A` và `>= 6.74:1` so với `slate-950` `#020617`).
  - `--accent-focus`: Tự động trỏ tới `var(--accent-focus-light)` ở chế độ sáng và chuyển sang `var(--accent-focus-dark)` trong `.dark, .dark [data-accent]`.
  - Utility Tailwind: `focus-visible:ring-accent-focus`, `focus:ring-accent-focus`.

| Theme ID | `--accent-action-bg` (HEX) | `--accent-action-hover` (HEX) | Action Contrast (vs `#FFF`) | `--accent-focus-light` (vs `slate-50`) | `--accent-focus-dark` (vs `slate-900`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`themeBlue`** | `37 99 235` (`#2563EB`) | `29 78 216` (`#1D4ED8`) | **5.17 : 1** (Hover: 6.70 : 1) ✅ | `37 99 235` (**4.77 : 1**) ✅ | `96 165 250` (**6.78 : 1**) ✅ |
| **`themeGreen`** | `4 120 87` (`#047857` / `700`) | `6 95 70` (`#065F46` / `800`) | **5.48 : 1** (Hover: 7.59 : 1) ✅ | `4 120 87` (**5.05 : 1**) ✅ | `52 211 153` (**8.89 : 1**) ✅ |
| **`themePink`** | `219 39 119` (`#DB2777`) | `190 24 93` (`#BE185D`) | **4.60 : 1** (Hover: 6.34 : 1) ✅ | `219 39 119` (**4.24 : 1**) ✅ | `244 114 182` (**6.12 : 1**) ✅ |
| **`themeViolet`** | `124 58 237` (`#7C3AED`) | `109 40 217` (`#6D28D9`) | **5.70 : 1** (Hover: 7.18 : 1) ✅ | `124 58 237` (**5.26 : 1**) ✅ | `167 139 250` (**6.18 : 1**) ✅ |
| **`themeRed`** | `220 38 38` (`#DC2626`) | `185 28 28` (`#B91C1C`) | **4.83 : 1** (Hover: 6.47 : 1) ✅ | `220 38 38` (**4.46 : 1**) ✅ | `248 113 113` (**5.98 : 1**) ✅ |
| **`themeYellow`** | `161 98 7` (`#A16207` / `700`) | `133 77 9` (`#854D09` / `800`) | **4.69 : 1** (Hover: 6.36 : 1) ✅ | `161 98 7` (**4.32 : 1**) ✅ | `250 204 21` (**11.42 : 1**) ✅ |
| **`themeGrey`** | `71 85 105` (`#475569`) | `51 65 85` (`#334155`) | **7.58 : 1** (Hover: 10.37 : 1) ✅ | `71 85 105` (**6.99 : 1**) ✅ | `148 163 184` (**6.47 : 1**) ✅ |

---

### Tầng B — Status Colors (Cố định & Ổn định trên mọi Theme)

Màu trạng thái hệ thống giữ nguyên giá trị trong `:root` và **không bị biến đổi** khi người dùng chuyển đổi giữa 7 Accent Themes:

| Nhóm trạng thái | CSS Tokens | Giá trị cố định | Ý nghĩa sử dụng |
| :--- | :--- | :--- | :--- |
| **Success / Live** | `--semantic-success-from` / `--semantic-success-to` | `#34d399` → `#059669` (`Emerald`) | Ca học/ca thi đang diễn ra (`live`), sao lưu thành công, PWA đã cập nhật. |
| **Warning** | `--semantic-warning-from` / `--semantic-warning-to` | `#fbbf24` → `#d97706` (`Amber`) | Cảnh báo nhẹ, trạng thái ngoại tuyến, ca thi sắp diễn ra. |
| **Danger** | `--semantic-danger-from` / `--semantic-danger-to` | `#f87171` → `#dc2626` (`Red`) | Xung đột lịch giảng (`.conflict-border`), hành động xóa dữ liệu, lỗi parse tệp. |
| **Info** | `--semantic-info-from` / `--semantic-info-to` | `#38bdf8` → `#0284c7` (`Sky`) | Thông tin hướng dẫn, thông báo hệ thống trung tính. |

---

### Tầng C — Domain Colors (Ngôn ngữ Nghiệp vụ Thời khóa biểu Cố định)

Màu nhận diện ca học trong ngày và loại học phần được giữ ổn định xuyên suốt ứng dụng để tạo phản xạ thị giác nhất quán cho người dùng:

| Khái niệm nghiệp vụ | CSS Tokens / Classes | Sắc độ cố định | Vị trí áp dụng |
| :--- | :--- | :--- | :--- |
| **Ca Sáng (`morning`)** | `--semantic-morning-from` / `to` | `#22d3ee` → `#0891b2` (`Cyan`) | Chấm tròn `Badge` ca sáng, huy hiệu chữ `S` trong `WeekTableLayout`. |
| **Ca Chiều (`afternoon`)** | `--semantic-afternoon-from` / `to` | `#fb923c` → `#ea580c` (`Orange`) | Chấm tròn `Badge` ca chiều, huy hiệu chữ `C` trong `WeekTableLayout`. |
| **Ca Tối (`evening`)** | `--semantic-evening-from` / `to` | `#818cf8` → `#4f46e5` (`Indigo`) | Chấm tròn `Badge` ca tối, huy hiệu chữ `T` trong `WeekTableLayout`. |
| **Lý thuyết (`LT` / `theory`)** | `bg-accent-50 text-accent-700` | Theo `accent` hiện tại | `TypeBadge` cho học phần Lý thuyết (khung 45 phút/tiết). |
| **Thực hành (`TH` / `practice`)** | `bg-orange-50 text-orange-700` | `Orange` | `TypeBadge` cho học phần Thực hành (khung 60 phút/tiết). |

---

## 2. Typography Tokens (Hệ thống Quản lý Chữ)

Khai báo tại `src/styles/tokens.css` và được đấu nối trực tiếp bằng `var(--font-*)` tại `src/styles/global.css`:

| Token | Giá trị trong `tokens.css` | Đấu nối tại `global.css` | Vai trò |
| :--- | :--- | :--- | :--- |
| **`--font-body`** | `'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | `body { font-family: var(--font-body); }` | Văn bản chính, tên học phần tiếng Việt, tên giảng viên, ghi chú. |
| **`--font-heading`** | `'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | `h1, h2, h3, h4, .font-heading { font-family: var(--font-heading); }` | Tiêu đề trang, tiêu đề thẻ thống kê, tên thương hiệu. |
| **`--font-num`** | `'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | `.font-num { font-family: var(--font-num); font-variant-numeric: tabular-nums; }` | Khung giờ (`07:00 - 09:30`), số tiết, ngày tháng, tỷ lệ `%`, đếm ngược. |

### Quy định Thang đo Cỡ chữ (Font Size Governance)
- **Nội dung đọc thường xuyên & Nhãn chức năng (`>= 12px` / `text-xs`, `text-sm`, `text-base`)**: Áp dụng cho toàn bộ tên môn học, tên giảng viên, phòng học, nút bấm, tab điều hướng và bảng dữ liệu.
- **Micro-Badges & Nhãn Ký hiệu Ngắn (`9px–10px` / `text-[9px]`, `text-[10px]`)**: Chỉ được phép sử dụng cho các huy hiệu viết tắt ngắn 2–8 ký tự in hoa (`LT`, `TH`, `LIVE`, `HÔM NAY`, `HIỆN TẠI`) đi kèm `font-bold` / `font-black`, `uppercase` và `tracking-wider`. Tuyệt đối không dùng cỡ chữ `9px–10px` cho câu văn hoặc thông tin người dùng cần đọc dài.

---

## 3. Semantic Radius Tokens (`--tdy-radius-*` ⟶ `@theme inline`)

Để tránh cả hai lỗi: (1) khai báo trùng lặp giá trị pixel ở hai tệp và (2) biến CSS tự tham chiếu (`--radius-badge: var(--radius-badge)` gây chu trình phụ thuộc), `src/styles/tokens.css` định nghĩa nguồn token `--tdy-radius-*`, và `src/styles/global.css` đấu nối qua `@theme inline`:

| Nguồn Token (`tokens.css`) | Giá trị | Đấu nối `@theme inline` (`global.css`) | Semantic Utility | Alias tương thích Tailwind | Mục đích sử dụng chuẩn |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`--tdy-radius-badge`** | `6px` | `--radius-badge: var(--tdy-radius-badge);` | `rounded-badge` | `rounded-sm` | Huy hiệu (`Badge`, `TypeBadge`), tag trạng thái nhỏ. |
| **`--tdy-radius-control`** | `8px` | `--radius-control: var(--tdy-radius-control);` | `rounded-control` | `rounded-md`, `rounded-lg`, `rounded-xl` | Nút bấm (`Button`, nút trong `ConfirmModal`), ô nhập liệu, bộ lọc (`FilterBar`). |
| **`--tdy-radius-card`** | `10px` | `--radius-card: var(--tdy-radius-card);` | `rounded-card` | `rounded-2xl` | Thẻ bề mặt chính (`Card`), thẻ ca học (`SessionCard`), khung bảng lịch tuần, hộp icon. |
| **`--tdy-radius-dialog`** | `12px` | `--radius-dialog: var(--tdy-radius-dialog);` | `rounded-dialog` | `rounded-3xl` | Hộp thoại xác nhận (`ConfirmModal`), modal cài đặt, khung dropzone lớn. |

---

## 4. Elevation & Shadow Tokens (`--tdy-shadow-*` ⟶ `@theme inline`)

Định nghĩa nguồn tại `src/styles/tokens.css` với tiền tố `--tdy-shadow-*`, ánh xạ trong `@theme inline` tại `src/styles/global.css` và được kiểm thử biên dịch thực tế qua PostCSS:

| Nguồn Token (`tokens.css`) | Đấu nối `@theme inline` (`global.css`) | Utility Class | Giá trị CSS | Thành phần sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **`--tdy-shadow-card`** | `--shadow-card: var(--tdy-shadow-card);` | `shadow-card` | `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)` | `Card.tsx` (trạng thái mặc định). |
| **`--tdy-shadow-card-hover`** | `--shadow-card-hover: var(--tdy-shadow-card-hover);` | `hover:shadow-card-hover` | `0 4px 12px rgba(0, 0, 0, 0.08)` | `Card.tsx` (khi `interactive={true}`). |
| **`--tdy-shadow-modal`** | `--shadow-modal: var(--tdy-shadow-modal);` | `shadow-modal` | `0 20px 60px rgba(0, 0, 0, 0.15)` | `ConfirmModal.tsx` (hộp thoại nổi). |
