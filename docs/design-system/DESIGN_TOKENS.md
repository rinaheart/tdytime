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

#### 2. Token Tương phản Hành động Chính (`--accent-action-*`)
Vì sắc độ `accent-600` của `themeGreen` (`#059669`, tỷ lệ `3.77:1`) và `themeYellow` (`#CA8A04`, tỷ lệ `2.94:1`) không đạt ngưỡng tương phản WCAG AA (`4.5:1`) khi kết hợp với chữ trắng, TdyTime thiết lập bộ 3 token hành động chuyên biệt:

- `--accent-action-bg` ⟶ Utility Tailwind: `bg-accent-action`, `border-accent-action`
- `--accent-action-hover` ⟶ Utility Tailwind: `hover:bg-accent-action-hover`
- `--accent-on-action` ⟶ Utility Tailwind: `text-accent-on-action`

| Theme ID | `--accent-action-bg` (HEX) | `--accent-action-hover` (HEX) | `--accent-on-action` | Tỷ lệ tương phản WCAG 2.2 AA |
| :--- | :---: | :---: | :---: | :---: |
| **`themeBlue`** | `37 99 235` (`#2563EB`) | `29 78 216` (`#1D4ED8`) | `255 255 255` (`#FFFFFF`) | **5.17 : 1** (Hover: 6.70 : 1) ✅ |
| **`themeGreen`** | `4 120 87` (`#047857` / `700`) | `6 95 70` (`#065F46` / `800`) | `255 255 255` (`#FFFFFF`) | **5.48 : 1** (Hover: 7.59 : 1) ✅ |
| **`themePink`** | `219 39 119` (`#DB2777`) | `190 24 93` (`#BE185D`) | `255 255 255` (`#FFFFFF`) | **4.60 : 1** (Hover: 6.34 : 1) ✅ |
| **`themeViolet`** | `124 58 237` (`#7C3AED`) | `109 40 217` (`#6D28D9`) | `255 255 255` (`#FFFFFF`) | **5.70 : 1** (Hover: 7.18 : 1) ✅ |
| **`themeRed`** | `220 38 38` (`#DC2626`) | `185 28 28` (`#B91C1C`) | `255 255 255` (`#FFFFFF`) | **4.83 : 1** (Hover: 6.47 : 1) ✅ |
| **`themeYellow`** | `161 98 7` (`#A16207` / `700`) | `133 77 9` (`#854D09` / `800`) | `255 255 255` (`#FFFFFF`) | **4.69 : 1** (Hover: 6.36 : 1) ✅ |
| **`themeGrey`** | `71 85 105` (`#475569`) | `51 65 85` (`#334155`) | `255 255 255` (`#FFFFFF`) | **7.58 : 1** (Hover: 10.37 : 1) ✅ |

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

## 3. Semantic Radius Tokens (Thang Bo góc theo Chức năng)

Để tránh việc khai báo trùng lặp giá trị pixel ở hai tệp, `src/styles/tokens.css` là nơi duy nhất định nghĩa 4 token bo góc theo chức năng, và `src/styles/global.css` ánh xạ chúng vào `@theme`:

| Semantic Token (`tokens.css`) | Giá trị | Semantic Utility (`@theme`) | Alias tương thích Tailwind (`@theme`) | Mục đích sử dụng chuẩn |
| :--- | :---: | :--- | :--- | :--- |
| **`--radius-badge`** | `6px` | `rounded-badge` | `rounded-sm` | Huy hiệu (`Badge`, `TypeBadge`), tag trạng thái nhỏ. |
| **`--radius-control`** | `8px` | `rounded-control` | `rounded-md`, `rounded-lg`, `rounded-xl` | Nút bấm (`Button`), ô nhập liệu, bộ lọc (`FilterBar`), nút chuyển tab. |
| **`--radius-card`** | `10px` | `rounded-card` | `rounded-2xl` | Thẻ bề mặt chính (`Card`), thẻ ca học (`SessionCard`), khung bảng lịch tuần. |
| **`--radius-dialog`** | `12px` | `rounded-dialog` | `rounded-3xl` | Hộp thoại xác nhận (`ConfirmModal`), modal cài đặt, khung dropzone lớn. |

> **Lộ trình sử dụng**: Các primitive cốt lõi (`Badge`, `Button`, `Card`, `ConfirmModal`) đã sử dụng trực tiếp semantic utilities (`rounded-badge`, `rounded-control`, `rounded-card`, `rounded-dialog`). Các view hiện hữu tiếp tục được hỗ trợ tương thích qua alias `rounded-sm`..`rounded-3xl` và khuyến khích dùng semantic utilities khi viết mới.

---

## 4. Elevation & Shadow Tokens

Định nghĩa tại `src/styles/tokens.css`, đăng ký trong `@theme` tại `src/styles/global.css` và được sử dụng trực tiếp trong `Card.tsx` và `ConfirmModal.tsx`:

| Token (`tokens.css` & `@theme`) | Utility Class | Giá trị CSS | Thành phần sử dụng |
| :--- | :--- | :--- | :--- |
| **`--shadow-card`** | `shadow-card` | `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)` | `Card.tsx` (trạng thái mặc định). |
| **`--shadow-card-hover`** | `hover:shadow-card-hover` | `0 4px 12px rgba(0, 0, 0, 0.08)` | `Card.tsx` (khi `interactive={true}`). |
| **`--shadow-modal`** | `shadow-modal` | `0 20px 60px rgba(0, 0, 0, 0.15)` | `ConfirmModal.tsx` (hộp thoại nổi). |
