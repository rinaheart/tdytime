# TdyTime Design System Integrity Audit & Standardization Report

Tài liệu này ghi nhận kết quả đối chiếu trực tiếp giữa mã nguồn **TdyTime (`v2026.11.24`)** và hệ thống tài liệu Design System, cùng biên bản thực thi 3 đợt chuẩn hóa (Batch 1 P0, Batch 2 P1, Batch 3 P2) nhằm thiết lập một **Single Source of Truth (SSOT)** đáng tin cậy và có kiểm chứng tự động trên CI.

---

## 1. Tổng hợp 9 Phát hiện từ Đợt Đối chiếu Trực tiếp Codebase

| Mã | Mức ưu tiên | Phát hiện thực tế trong Codebase | Quyết định & Trạng thái Xử lý |
| :--- | :---: | :--- | :--- |
| **F-01** | **P0** | **Định danh `TdyTripZ` xuất hiện trong Design DNA, CSS, Script và i18n**: Tên dự án khác xuất hiện trong `tokens.css`, `global.css`, `PWAUpdateHandler.tsx`, `DESIGN.md`, `docs/design-system/*`, `scripts/check-design-system.mjs` và release notes `vi.json` / `en.json`. | **Đã xử lý triệt để**: Loại bỏ toàn bộ thương hiệu `TdyTripZ` khỏi quy chuẩn hiện hành và nội dung hiển thị; xác lập định danh **Compact Academic Utility** và **TdyTime Radius Scale** (giữ nguyên giá trị `6px`, `8px`, `10px`, `12px`). |
| **F-02** | **P0** | **Lỗi tương phản WCAG AA trên 2/7 Accent Themes**: `Button.tsx` và `WeekTableLayout.tsx` dùng cứng `bg-accent-600 text-white`, khiến `themeYellow` chỉ đạt **2.94:1** và `themeGreen` chỉ đạt **3.77:1** (< ngưỡng 4.5:1 của WCAG AA). | **Đã xử lý triệt để**: Thiết lập bộ token `--accent-action-bg`, `--accent-action-hover`, `--accent-on-action` theo từng theme (`themeGreen` dùng `#047857` đạt **5.48:1**, `themeYellow` dùng `#A16207` đạt **4.69:1**) và tích hợp công thức kiểm tra tương phản WCAG tự động vào CI. |
| **F-03** | **P0** | **Phân tán đầu mối SSOT**: Cả `DESIGN.md`, `docs/design-system/README.md` và `ARCHITECTURE.md` cùng chứa các quy định chồng lấn; bộ 13 tài liệu bị chia nhỏ quá mức. | **Đã xử lý triệt để**: Tinh gọn `DESIGN.md` thành Root Entry Point; gom 13 tài liệu về **7 tài liệu chuẩn** trong `docs/design-system/`; phân quyền rõ kiến trúc kỹ thuật về `ARCHITECTURE.md`. |
| **F-04** | **P1** | **Radius Scale bị định nghĩa trùng lặp 2 lần**: Các giá trị `6px..12px` được viết cứng ở cả `tokens.css` và `@theme` trong `global.css`, đồng thời ghi đè tên utility mặc định của Tailwind. | **Đã xử lý triệt để**: Định nghĩa một lần duy nhất theo chức năng trong `tokens.css` (`--radius-badge: 6px`, `--radius-control: 8px`, `--radius-card: 10px`, `--radius-dialog: 12px`); đấu nối qua `var(--radius-*)` trong `global.css` và áp dụng lên các primitive cốt lõi. |
| **F-05** | **P1** | **Token Debt (Token Font và Shadow khai báo nhưng bỏ không)**: `--font-heading`, `--font-body`, `--font-num` và `--shadow-card`, `--shadow-card-hover`, `--shadow-modal` trong `tokens.css` chưa được tham chiếu trong `global.css` hay component. | **Đã xử lý triệt để**: Đấu nối trực tiếp `var(--font-*)` vào `body`, `h1..h4`, `.font-num` trong `global.css`; đăng ký `--shadow-*` vào `@theme` và sử dụng `shadow-card`, `hover:shadow-card-hover`, `shadow-modal` trong `Card.tsx` và `ConfirmModal.tsx`. |
| **F-06** | **P1** | **Mâu thuẫn trong Smart Semantic Colors**: Header `tokens.css` ghi semantic colors là cố định nhưng bên dưới lại biến đổi màu `morning`, `evening`, `success`, `warning`, `danger` theo theme. | **Đã xử lý triệt để**: Phân tách rõ 3 tầng màu: **A. Accent Colors** (đổi theo theme), **B. Status Colors** (cố định trên mọi theme), **C. Domain Colors** (Sáng/Chiều/Tối cố định trên mọi theme). |
| **F-07** | **P1** | **Quản lý Typography & Tuyên bố Offline-First**: Code thực tế dùng `9px–10px` cho micro-badges (`TypeBadge compact`, `Badge`), và `index.html` nạp Google Fonts bất đồng bộ. | **Đã xử lý triệt để**: Quy định rõ thang cỡ chữ (`>= 12px` cho nội dung đọc, `9px–10px` chỉ dành cho micro-badges viết tắt ngắn) và chuẩn hóa mô tả Offline-First (luồng cốt lõi và precached assets hoạt động 100% offline; tài nguyên ngoài có fallback font hệ thống). |
| **F-08** | **P1** | **Sai lệch giữa Tài liệu Component và Code thực tế**: Báo cáo cũ mô tả `Card` có 5 biến thể và `ARCHITECTURE.md` mô tả `Card` có glass effect; `Badge.tsx` có comment sai về pulsing dot và lỗi `hasDot = dot \|\| !!dotColors` không tắt được dot khi truyền `dot={false}`. | **Đã xử lý triệt để**: Đồng bộ tài liệu khớp 100% với `Card.tsx` (1 surface phẳng + `noPadding`, `interactive`); sửa `Badge.tsx` hỗ trợ `showDot` / `dot={false}` (`showDot ?? dot ?? Boolean(dotColors)`), sửa comment và phân loại 4 nhóm variant. |
| **F-09** | **P2** | **Script kiểm tra chưa sâu và chưa tích hợp vào CI**: `check-design-system.mjs` chưa kiểm tra đủ 11 sắc độ cho từng theme, chưa kiểm tra tương phản WCAG, có cờ `--dry-run` thừa và chưa được gọi trong `.github/workflows/ci.yml`. | **Đã xử lý triệt để**: Viết lại toàn diện `scripts/check-design-system.mjs` (loại bỏ `--dry-run`, kiểm tra từng khối theme, đối chiếu RGB với `constants.ts`, tính toán tương phản WCAG AA `>= 4.5:1`, kiểm tra đấu nối token), thêm `npm run check:design-system` vào `package.json` và tích hợp vào `.github/workflows/ci.yml`. |

---

## 2. Báo cáo Thực thi 3 Đợt Chuẩn hóa (Implementation Log)

### Đợt 1 — Design System Integrity (P0)
1. **Xóa bỏ định danh ngoại lai & Xác lập `Compact Academic Utility`**:
   - Cập nhật `src/styles/tokens.css`, `src/styles/global.css`, `src/app/PWAUpdateHandler.tsx`, `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`, `DESIGN.md` và bộ tài liệu `docs/design-system/`.
2. **Khắc phục Tương phản Màu sắc WCAG 2.2 AA trên 7 Accent Themes**:
   - Bổ sung `--accent-action-bg`, `--accent-action-hover`, `--accent-on-action` vào `:root` và cả 7 khối `[data-accent="theme..."]` trong `src/styles/tokens.css`.
   - Đăng ký `--color-accent-action`, `--color-accent-action-hover`, `--color-accent-on-action` trong `src/styles/global.css`.
   - Áp dụng trên `Button.tsx`, `ConfirmModal.tsx`, `WeekTableLayout.tsx`, `WeekNavigation.tsx` và `WeekAccordion.tsx`.
3. **Hợp nhất Đầu mối SSOT (7 Tài liệu Cốt lõi)**:
   - Chuyển đổi từ 13 tệp rời rạc sang 7 tài liệu chuẩn trong `docs/design-system/` (`README.md`, `DESIGN_DNA.md`, `DESIGN_TOKENS.md`, `COMPONENT_GUIDELINES.md`, `LAYOUT_AND_RESPONSIVE.md`, `INTERACTION_AND_ACCESSIBILITY.md`, `DESIGN_AUDIT_REPORT.md`).

### Đợt 2 — Design System Simplification (P1)
1. **Xóa bỏ Token Debt & Khai báo Trùng lặp**:
   - Hợp nhất nguồn khai báo bo góc về 4 token chức năng trong `tokens.css` (`--radius-badge`, `--radius-control`, `--radius-card`, `--radius-dialog`) và tham chiếu qua `var(--radius-*)` trong `global.css`.
   - Đấu nối `var(--font-body)`, `var(--font-heading)`, `var(--font-num)` trong `global.css`.
   - Đấu nối `shadow-card`, `hover:shadow-card-hover`, `shadow-modal` vào `Card.tsx` và `ConfirmModal.tsx`.
2. **Ổn định Hệ màu Status & Domain**:
   - Giữ cố định các biến `--semantic-morning-*`, `--semantic-afternoon-*`, `--semantic-evening-*`, `--semantic-success-*`, `--semantic-warning-*`, `--semantic-danger-*`, `--semantic-info-*` giữa mọi chủ đề.
3. **Chuẩn hóa `Badge.tsx` & Tài liệu Component**:
   - Sửa lỗi logic `hasDot = showDot ?? dot ?? Boolean(dotColors)` cho phép tắt chấm tròn mặc định bằng `showDot={false}` hoặc `dot={false}`.

### Đợt 3 — Enforcement & CI Integration (P2)
1. **Nâng cấp `scripts/check-design-system.mjs`**:
   - Kiểm tra 11 sắc độ + 3 action tokens bên trong từng khối theme (`7 themes × 14 tokens`).
   - Đối chiếu giá trị RGB trong `tokens.css` với mã màu HEX preview trong `src/core/config/constants.ts`.
   - Tính toán trực tiếp tỷ lệ tương phản WCAG 2.2 AA (`>= 4.5:1`) cho cả 7 chủ đề.
   - Kiểm tra sự đấu nối thực tế của font, radius, shadow tokens và component guardrails.
2. **Tích hợp vào `package.json`, Vitest & GitHub Actions CI**:
   - Bổ sung script `"check:design-system": "node scripts/check-design-system.mjs"` vào `package.json`.
   - Tích hợp bước `Check Design System integrity` vào `.github/workflows/ci.yml`.
   - Mở rộng bộ kiểm thử Vitest tại `src/core/themes/designSystem.test.ts`.

---

## 3. Checklist Tuân thủ Bắt buộc (Compliance Checklist)

Mọi thay đổi giao diện trong tương lai phải vượt qua các chốt chặn sau:

- [ ] **1. Bản sắc & Thuật ngữ**: Sử dụng đúng định danh **Compact Academic Utility** và các token chức năng của TdyTime; không đưa tên dự án khác vào code, tài liệu hoặc chuỗi đa ngôn ngữ.
- [ ] **2. Tương phản Hành động Chính (WCAG 2.2 AA >= 4.5:1)**: Sử dụng `bg-accent-action hover:bg-accent-action-hover text-accent-on-action` cho nút chính và các bề mặt màu nhấn có chữ trắng.
- [ ] **3. Không tạo Dead Tokens hoặc Khai báo Trùng lặp**: Mọi CSS variable thêm vào `tokens.css` phải được tham chiếu bằng `var(--...)` trong `global.css` hoặc component.
- [ ] **4. Ổn định Ngữ nghĩa Màu**: Không ghi đè màu Status (`success`, `warning`, `danger`, `info`) và Domain (`morning`, `afternoon`, `evening`) bên trong các khối `[data-accent]`.
- [ ] **5. Tabular Numerals (`font-num`)**: Áp dụng `.font-num` cho toàn bộ khung giờ, số tiết, ngày tháng, đếm ngược và số liệu thống kê.
- [ ] **6. Tài liệu Phản ánh Đúng Code Thực tế**: Cập nhật `COMPONENT_GUIDELINES.md` và `DESIGN_TOKENS.md` ngay khi thay đổi props hoặc token của component.
- [ ] **7. Vượt qua Cổng Kiểm chứng Tự động**: Chạy thành công `npm run check:design-system`, `node scripts/check-i18n-parity.mjs`, `npm test` và `npm run lint`.
