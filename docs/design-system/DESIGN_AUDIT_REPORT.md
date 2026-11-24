# TdyTime Design System Integrity Audit & Standardization Report

Tài liệu này ghi nhận kết quả đối chiếu trực tiếp giữa mã nguồn **TdyTime (`v2026.11.24`)** và hệ thống tài liệu Design System, cùng biên bản thực thi 4 đợt chuẩn hóa (Batch 1 P0, Batch 2 P1, Batch 3 P2 và Batch 4 **Design System Runtime Integrity Check**) nhằm thiết lập một **Single Source of Truth (SSOT)** đáng tin cậy và có kiểm chứng tự động ở cả cấp độ mã nguồn, CSS biên dịch thực tế (PostCSS) và runtime trình duyệt.

---

## 1. Tổng hợp Phát hiện & Kết quả Xử lý

| Mã | Mức ưu tiên | Phát hiện thực tế trong Codebase | Quyết định & Trạng thái Xử lý |
| :--- | :---: | :--- | :--- |
| **F-01** | **P0** | **Định danh `TdyTripZ` xuất hiện trong Design DNA, CSS, Script và i18n**: Tên dự án khác xuất hiện trong `tokens.css`, `global.css`, `PWAUpdateHandler.tsx`, `DESIGN.md`, `docs/design-system/*`, `scripts/check-design-system.mjs` và release notes `vi.json` / `en.json`. | **Đã xử lý triệt để**: Loại bỏ toàn bộ thương hiệu `TdyTripZ` khỏi quy chuẩn hiện hành và nội dung hiển thị; xác lập định danh **Compact Academic Utility** và **TdyTime Radius Scale** (giữ nguyên giá trị `6px`, `8px`, `10px`, `12px`). |
| **F-02** | **P0** | **Lỗi tương phản WCAG AA trên 2/7 Accent Themes**: `Button.tsx` và `WeekTableLayout.tsx` dùng cứng `bg-accent-600 text-white`, khiến `themeYellow` chỉ đạt **2.94:1** và `themeGreen` chỉ đạt **3.77:1** (< ngưỡng 4.5:1 của WCAG AA). | **Đã xử lý triệt để**: Thiết lập bộ token `--accent-action-bg`, `--accent-action-hover`, `--accent-on-action` theo từng theme (`themeGreen` dùng `#047857` đạt **5.48:1**, `themeYellow` dùng `#A16207` đạt **4.69:1**) và tích hợp công thức kiểm tra tương phản WCAG 2.2 tự động vào CI. |
| **F-03** | **P0** | **Phân tán đầu mối SSOT**: Cả `DESIGN.md`, `docs/design-system/README.md` và `ARCHITECTURE.md` cùng chứa các quy định chồng lấn; bộ 13 tài liệu bị chia nhỏ quá mức. | **Đã xử lý triệt để**: Tinh gọn `DESIGN.md` thành Root Entry Point; gom 13 tài liệu về **7 tài liệu chuẩn** trong `docs/design-system/`; phân quyền rõ kiến trúc kỹ thuật về `ARCHITECTURE.md`. |
| **F-04** | **P0/P1** | **Radius & Shadow Token Bridge (Trùng lặp hoặc Tự tham chiếu `--radius-badge: var(--radius-badge)`)**: Việc khai báo cùng tên biến trong `:root` và `@theme` tạo ra chu trình tự tham chiếu CSS variable (`--x: var(--x)`). | **Đã xử lý triệt để**: Tách tên token nguồn trong `tokens.css` thành `--tdy-radius-badge/control/card/dialog` và `--tdy-shadow-card/card-hover/modal`, sau đó đấu nối qua `@theme inline` trong `global.css` (`--radius-badge: var(--tdy-radius-badge)`, `--shadow-card: var(--tdy-shadow-card)`), triệt tiêu 100% tự tham chiếu và xác minh trên CSS biên dịch thực tế. |
| **F-05** | **P1** | **Token Debt (Token Font và Shadow khai báo nhưng bỏ không)**: `--font-heading`, `--font-body`, `--font-num` và các token shadow trong `tokens.css` chưa được tham chiếu trong `global.css` hay component. | **Đã xử lý triệt để**: Đấu nối trực tiếp `var(--font-*)` vào `body`, `h1..h4`, `.font-num` trong `global.css`; đăng ký `--shadow-*` qua `@theme inline` và sử dụng `shadow-card`, `hover:shadow-card-hover`, `shadow-modal` trong `Card.tsx` và `ConfirmModal.tsx`. |
| **F-06** | **P1** | **Mâu thuẫn trong Smart Semantic Colors**: Header `tokens.css` ghi semantic colors là cố định nhưng bên dưới lại biến đổi màu `morning`, `evening`, `success`, `warning`, `danger` theo theme. | **Đã xử lý triệt để**: Phân tách rõ 3 tầng màu: **A. Accent Colors** (đổi theo theme), **B. Status Colors** (cố định trên mọi theme), **C. Domain Colors** (Sáng/Chiều/Tối cố định trên mọi theme). |
| **F-07** | **P1** | **Quản lý Typography & Tuyên bố Offline-First**: Code thực tế dùng `9px–10px` cho micro-badges (`TypeBadge compact`, `Badge`), và `index.html` nạp Google Fonts bất đồng bộ. | **Đã xử lý triệt để**: Quy định rõ thang cỡ chữ (`>= 12px` cho nội dung đọc, `9px–10px` chỉ dành cho micro-badges viết tắt ngắn) và chuẩn hóa mô tả Offline-First (luồng cốt lõi và precached assets hoạt động 100% offline; tài nguyên ngoài có fallback font hệ thống). |
| **F-08** | **P1** | **Sai lệch giữa Tài liệu Component và Code thực tế**: Báo cáo cũ mô tả `Card` có 5 biến thể; `Badge.tsx` có lỗi `hasDot = dot \|\| !!dotColors` không tắt được dot khi truyền `dot={false}`; `ConfirmModal.tsx` dùng `rounded-xl`/`rounded-2xl` chưa qua semantic token. | **Đã xử lý triệt để**: Đồng bộ tài liệu khớp 100% với `Card.tsx`; sửa `Badge.tsx` hỗ trợ `showDot` / `dot={false}`; chuẩn hóa `ConfirmModal.tsx` dùng `rounded-control` (`8px`) cho nút và `rounded-card` (`10px`) cho khung icon; bổ sung `min-h`/`min-w` cho `Button.tsx`. |
| **F-09** | **P1/P2** | **Tương phản Focus Ring (`WCAG 2.2 SC 1.4.11 >= 3.0:1`), Nguồn dữ liệu Palette kép & Độ sâu kiểm chứng CI**: `focus-visible:ring-accent-500` trên `themeYellow` (`2.02:1`) và `themeGreen` (`2.54:1`) không đạt ngưỡng `3.0:1` trên nền sáng; script kiểm tra từng giữ bảng `EXPECTED_THEME_500_RGB` riêng và dùng ngưỡng luminance cũ `0.03928`. | **Đã xử lý triệt để**: Bổ sung `--accent-focus-light`, `--accent-focus-dark`, `--accent-focus` (`ring-accent-focus` đạt **4.32:1–11.42:1** trên mọi theme ở cả Light & Dark Mode); hợp nhất 100% dữ liệu bảng màu vào `THEME_PALETTES` tại `src/core/config/constants.ts`; nâng cấp ngưỡng luminance chuẩn WCAG 2.2 (`0.04045`), fail-closed RGB validation và kiểm tra CSS biên dịch qua PostCSS. |

---

## 2. Báo cáo Thực thi 4 Đợt Chuẩn hóa (Implementation Log)

### Đợt 1 — Design System Integrity (P0)
1. **Xóa bỏ định danh ngoại lai & Xác lập `Compact Academic Utility`**:
   - Cập nhật `src/styles/tokens.css`, `src/styles/global.css`, `src/app/PWAUpdateHandler.tsx`, `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`, `DESIGN.md` và bộ tài liệu `docs/design-system/`.
2. **Khắc phục Tương phản Màu sắc WCAG 2.2 AA trên 7 Accent Themes**:
   - Bổ sung `--accent-action-bg`, `--accent-action-hover`, `--accent-on-action` vào `:root` và cả 7 khối `[data-accent="theme..."]` trong `src/styles/tokens.css`.
   - Áp dụng trên `Button.tsx`, `ConfirmModal.tsx`, `WeekTableLayout.tsx`, `WeekNavigation.tsx` và `WeekAccordion.tsx`.
3. **Hợp nhất Đầu mối SSOT (7 Tài liệu Cốt lõi)**:
   - Chuyển đổi từ 13 tệp rời rạc sang 7 tài liệu chuẩn trong `docs/design-system/`.

### Đợt 2 — Design System Simplification (P1)
1. **Xóa bỏ Token Debt & Khai báo Trùng lặp**:
   - Đấu nối `var(--font-body)`, `var(--font-heading)`, `var(--font-num)` trong `global.css`.
   - Đấu nối `shadow-card`, `hover:shadow-card-hover`, `shadow-modal` vào `Card.tsx` và `ConfirmModal.tsx`.
2. **Ổn định Hệ màu Status & Domain**:
   - Giữ cố định các biến `--semantic-morning-*`, `--semantic-afternoon-*`, `--semantic-evening-*`, `--semantic-success-*`, `--semantic-warning-*`, `--semantic-danger-*`, `--semantic-info-*` giữa mọi chủ đề.
3. **Chuẩn hóa `Badge.tsx` & Tài liệu Component**:
   - Sửa lỗi logic `hasDot = showDot ?? dot ?? Boolean(dotColors)` cho phép tắt chấm tròn mặc định bằng `showDot={false}` hoặc `dot={false}`.

### Đợt 3 — Enforcement & CI Integration (P2)
1. **Tích hợp vào `package.json`, Vitest & GitHub Actions CI**:
   - Bổ sung script `"check:design-system": "node scripts/check-design-system.mjs"` vào `package.json`.
   - Tích hợp bước `Check Design System integrity` vào `.github/workflows/ci.yml`.
   - Mở rộng bộ kiểm thử Vitest tại `src/core/themes/designSystem.test.ts`.

### Đợt 4 — Design System Runtime Integrity Check & Semantic Contrast Hardening
1. **Khắc phục Cầu nối `@theme inline` cho Radius & Shadow (Triệt tiêu Self-Referencing CSS Variables)**:
   - Đổi tên biến nguồn trong `:root` của `src/styles/tokens.css` thành `--tdy-radius-badge` (`6px`), `--tdy-radius-control` (`8px`), `--tdy-radius-card` (`10px`), `--tdy-radius-dialog` (`12px`), `--tdy-shadow-card`, `--tdy-shadow-card-hover`, `--tdy-shadow-modal`.
   - Sử dụng `@theme inline` trong `src/styles/global.css` để ánh xạ `--radius-badge: var(--tdy-radius-badge)` và `--shadow-card: var(--tdy-shadow-card)`, đảm bảo Tailwind v4 sinh ra các utility `.rounded-badge/control/card/dialog` và `.shadow-card/card-hover/modal` sạch, không có bất kỳ biến tự tham chiếu `--x: var(--x)` nào.
2. **Chuẩn hóa Tương phản Vòng Tiêu điểm (`--accent-focus-light/dark` — WCAG 2.2 SC 1.4.11 >= 3.0:1) & Tương phản Màu Ngữ nghĩa Cố định (`BackupRestoreCard.tsx`)**:
   - Định nghĩa `--accent-focus-light`, `--accent-focus-dark` và `--accent-focus` trên cả 7 chủ đề trong `src/styles/tokens.css` cùng quy tắc `.dark, .dark [data-accent] { --accent-focus: var(--accent-focus-dark); }`.
   - Đăng ký `--color-accent-focus: rgb(var(--accent-focus));` trong `src/styles/global.css` và chuyển các phần tử theo màu chủ đề sang `focus-visible:ring-accent-focus` / `focus:ring-accent-focus`.
   - Khắc phục lỗi tương phản màu cảnh báo cố định trên nút xác nhận khôi phục trong `BackupRestoreCard.tsx` (chuyển từ `bg-amber-600 text-white` `3.19:1` và `focus-visible:ring-amber-500` `2.15:1` sang **`bg-amber-700 hover:bg-amber-800 text-white rounded-control`** đạt **`5.02:1`** với chữ trắng và **`focus-visible:ring-amber-700`** đạt **`4.80:1`** trên `slate-50`, **`3.56:1`** trên `slate-900`, **`4.02:1`** trên `slate-950`), đồng thời nâng cấp các huy hiệu màu cố định có `text-white` trong `PWAUpdateHandler.tsx`, `WelcomeView.tsx` và `SESSION_ACCENT_COLORS`.
3. **Hợp nhất Nguồn Dữ liệu Bảng màu (`THEME_PALETTES` trong `src/core/config/constants.ts`) & Đối chiếu `:root` Fallback**:
   - Thiết lập `THEME_PALETTES` tại `src/core/config/constants.ts` (và re-export qua `src/core/themes/theme.registry.ts`) chứa đầy đủ 16 token RGB cho mỗi chủ đề (`50..950`, `actionBg`, `actionHover`, `onAction`, `focusLight`, `focusDark`).
   - Cập nhật `scripts/check-design-system.mjs` đối chiếu 1:1 cả khối `:root` fallback (khớp 16/16 token với `THEME_PALETTES.themeBlue`) lẫn cả 7 khối `[data-accent="theme..."]`.
4. **Bộ Quét Tương phản Đa dòng 3 Tầng, Bảng 22 Họ Màu Tailwind (`TAILWIND_COLOR_RGB`) & Manifest Đối chiếu 2 Chiều (`SEMANTIC_COLOR_EXCEPTIONS`)**:
   - Tích hợp đầy đủ **22 họ màu chính thức của Tailwind CSS** (`slate`, `gray`, `zinc`, `neutral`, `stone`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose` × 11 sắc độ `50..950`, chuẩn hóa `yellow-800` = `133 77 14` / `#854D0E`) kèm cơ chế **fail-closed** báo lỗi ngay nếu gặp bất kỳ tên màu hoặc sắc độ lạ nào.
   - Phân tích theo ngữ cảnh `className="..."`, `className={...}` đa dòng (hỗ trợ cả chuỗi tĩnh ngoài `${...}` kết hợp với từng nhánh toán tử 3 ngôi bên trong) và object literal `{ bg, text }` đa dòng; tự động tính toán pha trộn kênh alpha (`/0..100`) trên các bề mặt Sáng/Tối cho cả trạng thái nền gốc, `hover:bg-*`, `dark:bg-*`, vòng tiêu điểm sáng (`focus-visible:ring-*`) và vòng tiêu điểm tối độc lập (`dark:focus-visible:ring-*`).
   - Thiết lập danh mục chuẩn **`SEMANTIC_COLOR_EXCEPTIONS`** (30 mục: 24 cặp nền+chữ trắng bao gồm cả `hover:`/`dark:` và 6 vòng focus màu cố định) với cơ chế đối chiếu 2 chiều nghiêm ngặt (báo lỗi nếu thiếu mục trong manifest hoặc phát sinh ngoại lệ chưa đăng ký) cùng bộ **negative test fixtures** trong `src/core/themes/designSystem.test.ts`.
   - Xác minh chính xác selector và khai báo trong CSS biên dịch qua PostCSS + `@tailwindcss/postcss` (bao gồm `.hover\:shadow-card-hover:hover`, `.focus-visible\:ring-accent-focus:focus-visible`, `.focus\:ring-accent-focus:focus`) và cấu hình `SKIP_DESIGN_SYSTEM_CHECK=1` ở bước `Build` trong `.github/workflows/ci.yml`.

---

## 3. Phân tầng Cơ chế Kiểm chứng: Tự động trên CI vs Thủ công trong IDE

Hệ thống kiểm chứng phân biệt minh bạch giữa các chốt chặn tự động trên GitHub Actions CI và bước kiểm tra trực quan thủ công trong môi trường phát triển:

| Tầng Kiểm chứng | Trạng thái Tự động hóa | Công cụ Thực thi | Phạm vi Kiểm chứng Thực tế |
| :--- | :---: | :--- | :--- |
| **1. Kiểm tra Tĩnh, Tương phản 3 Tầng & Biên dịch PostCSS** | **Tự động 100% trên CI** (`.github/workflows/ci.yml` & `npm run build`) | `npm run check:design-system` (`scripts/check-design-system.mjs`) | Đối chiếu 1:1 `THEME_PALETTES` ↔ `:root` fallback + 7 themes × 16 tokens; kiểm tra tương phản WCAG 2.2 cho Text (`>= 4.5:1`), Non-Text Focus (`>= 3.0:1`) và Semantic Exceptions trên toàn bộ `src/`; kiểm tra chống biến tự tham chiếu `--x: var(--x)`; biên dịch CSS thực tế qua PostCSS + `@tailwindcss/postcss` và kiểm tra chính xác từng selector. |
| **2. Kiểm thử Đơn vị & Component (Vitest)** | **Tự động 100% trên CI** (`.github/workflows/ci.yml`) | `npm test` (`src/core/themes/designSystem.test.ts`, `src/ui/primitives/Badge.test.tsx`) | Kiểm thử logic `THEME_PALETTES`, `:root` parity, tương phản ngoại lệ ngữ nghĩa (`BackupRestoreCard` Amber 700, `SESSION_ACCENT_COLORS`), selector CSS biên dịch từ `@tailwindcss/postcss`, và hành vi DOM/props của các UI primitives. |
| **3. Kiểm chứng Computed Styles trên Headless Chromium** | **Kiểm chứng Thủ công trong IDE** *(Không chạy tự động trong `ci.yml`)* | Headless Chromium (`playwright-cli` `getComputedStyle()`) | Kiểm tra đối chiếu thủ công `getComputedStyle()` trên DOM thực tế (`http://localhost:3000`) trong quá trình audit để xác nhận `border-radius`, `box-shadow` và biến màu theo theme. *(Lưu ý: Lighthouse CI trong `audit.yml` đánh giá hiệu năng/trợ năng trang deploy, không thay thế kiểm thử `getComputedStyle()` từng selector).* |

---

## 4. Checklist Tuân thủ Bắt buộc (Compliance Checklist)

Mọi thay đổi giao diện trong tương lai phải vượt qua các chốt chặn sau:

- [ ] **1. Bản sắc & Thuật ngữ**: Sử dụng đúng định danh **Compact Academic Utility** và các token chức năng của TdyTime; không đưa tên dự án khác vào code, tài liệu hoặc chuỗi đa ngôn ngữ.
- [ ] **2. Tương phản Hành động Chính (WCAG 2.2 AA >= 4.5:1) & Vòng Focus (WCAG 2.2 SC 1.4.11 >= 3.0:1)**: Sử dụng `bg-accent-action hover:bg-accent-action-hover text-accent-on-action` cho nút chính và `focus-visible:ring-accent-focus` cho vòng tiêu điểm bàn phím.
- [ ] **3. Không tạo Dead Tokens, Khai báo Trùng lặp hoặc Biến Tự tham chiếu**: Mọi token nguồn trong `tokens.css` (như `--tdy-radius-*`, `--tdy-shadow-*`) phải được đấu nối qua `@theme inline` trong `global.css` mà không tạo chu trình `--x: var(--x)`.
- [ ] **4. Đồng bộ Nguồn Dữ liệu Bảng màu (`THEME_PALETTES`)**: Mọi thay đổi mã màu chủ đề phải được cập nhật đồng bộ giữa `THEME_PALETTES` trong `src/core/config/constants.ts` và `src/styles/tokens.css`.
- [ ] **5. Ổn định Ngữ nghĩa Màu**: Không ghi đè màu Status (`success`, `warning`, `danger`, `info`) và Domain (`morning`, `afternoon`, `evening`) bên trong các khối `[data-accent]`.
- [ ] **6. Tabular Numerals (`font-num`)**: Áp dụng `.font-num` cho toàn bộ khung giờ, số tiết, ngày tháng, đếm ngược và số liệu thống kê.
- [ ] **7. Vượt qua Cổng Kiểm chứng Tự động**: Chạy thành công `npm run check:design-system`, `node scripts/check-i18n-parity.mjs`, `npm test` và `npm run lint`.
