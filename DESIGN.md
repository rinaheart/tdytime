# TdyTime Design & Architecture System

Tài liệu này là **nguồn sự thật duy nhất (Single Source of Truth)** cho ngôn ngữ thiết kế, kiến trúc tính năng và chuẩn kỹ thuật của **TdyTime** (`v2026.11.24`).

---

## 🎯 Nguyên tắc cốt lõi (Core Principles)

1. **Tin cậy & Ngoại tuyến hoàn toàn (100% Offline-First Reliability)**: Mọi dữ liệu lịch giảng dạy, lịch coi thi và thống kê đều vận hành tức thì trên thiết bị (kể cả ở chế độ Máy bay / Airplane Mode).
2. **Tốc độ quét thông tin (Mobile-First Speed)**: Giao diện tối ưu cho màn hình điện thoại (`390px+`), ưu tiên khả năng quét lịch theo ngày/tuần trong < 1 giây.
3. **Tinh gọn có kỷ luật (Lean Architecture)**: Giữ trải nghiệm cốt lõi siêu nhẹ (~712 kB JS, 7 runtime dependencies). Các tính năng phụ trợ nặng (`notes/`, `pdf-export/`, `csv-export/`, `devtools/`, `thresholds/ThresholdsCard.tsx`) được lưu trữ riêng tại `/archive/future-features/`.

---

## 🎨 Hệ thống Màu sắc & Điểm neo Thị giác

### 1. Accent Themes (7 hệ màu chuẩn)
Định nghĩa tập trung tại `src/core/config/constants.ts` (`THEME_IDS`, `THEMES`, `THEME_MIGRATION`):
- `themeBlue` (mặc định), `themeGreen`, `themePink`, `themeViolet`, `themeRed`, `themeYellow`, `themeGrey`.

### 2. Smart Semantic (Adaptive Gradients)
- **Morning (Sáng)**: Tông Xanh dương (`Cyan/Blue`).
- **Afternoon (Chiều)**: Tông Cam/Vàng (`Orange/Amber`).
- **Evening (Tối)**: Tông Tím (`Purple/Indigo`).
- **Trạng thái (Status)**: Success (`Emerald`), Warning (`Amber`), Danger (`Rose/Red`).

### 3. Visual Anchors (Điểm neo thị giác)
- **Gradient Dots**: Chấm màu phân biệt nhanh ca Sáng/Chiều/Tối trên thẻ lịch học.
- **Visual Anchors 2.0 (STT + Dot + Ring)**: Dùng trong danh sách coi thi (`ExamView`) để làm nổi bật ca đang diễn ra hoặc kế tiếp.
- **Pure Stateless `SessionCard`**: Thẻ buổi học thuần trình bày (không chứa modal/store subscription trên từng thẻ) giúp tối ưu tốc độ cuộn và giảm 48% kích thước chunk.
- **Outline Icons**: Bộ icon `lucide-react` thanh thoát, đồng nhất.

---

## 🧭 Bản đồ Tính năng & Bố cục (Feature Architecture)

| Module / Route | Chức năng chính | Thiết kế nổi bật |
| :--- | :--- | :--- |
| **`WelcomeView` (`#/`)** | Nhập lịch HTML/JSON, dán mã HTML, mở lịch sử gần đây | Critical CSS + core shell translations tải đồng bộ 0ms |
| **`TodayView` (`#/today`)** | Theo dõi lịch giảng hôm nay, tiết đang/sắp dạy, tiến độ học kỳ | Mobile-first cards + đếm ngược tiết tiếp theo |
| **`WeeklyView` (`#/weekly`)** | Lịch tuần dạng thẻ (Mobile) & bảng (Desktop), xuất `.ics` Google Calendar | Chuyển đổi layout theo viewport + giữ bộ lọc |
| **`SemesterView` (`#/semester`)** | Tổng hợp học kỳ theo môn, theo nhóm lớp và theo tuần | Căn cột thẳng trục, hỗ trợ tìm kiếm nhanh |
| **`ExamView` (`#/exam`)** | Lịch coi thi, trạng thái sắp tới/đang thi | Fixed-Height Two-Row (`min-h-[52px]`) chống Layout Shift |
| **`StatisticsView` (`#/statistics`)** | Phân tích khối lượng, xu hướng, lớp & giảng đường | **3-Tab Segmented Focus** (`Tổng quan`, `Xu hướng`, `Lớp & Phòng`) Lazy-Mount |
| **`SettingsView` (`#/settings`)** | Quản trị PWA, tùy chỉnh môn học, sao lưu/khôi phục JSON | **3-Tab Segmented Bento Hub** (chi tiết bên dưới) |

### Thiết kế trang Cài đặt (`SettingsView` — 3-Tab Segmented Bento Hub)
1. **Tab 1 — `Dữ liệu & PWA` (Mở mặc định)**:
   - Thẻ **Bộ nhớ đệm PWA & Đồng bộ Offline**: hiển thị trạng thái Online/Offline thực tế, phiên bản SW, nút **Cập nhật/Đồng bộ** (`checkPWAUpdate`), nút **Xóa bộ nhớ đệm (Clear Cache)** xác nhận 2 bước (gửi `CLEAR_CACHE` tới Service Worker để làm sạch Cache Storage mà **giữ nguyên 100% lịch giảng dạy**), và nút Cài đặt PWA.
   - Thẻ **Sao lưu & Khôi phục dữ liệu** (`BackupRestoreCard`): xuất/nhập JSON thuần trình duyệt (`URL.createObjectURL`) kèm cơ chế atomic rollback.
   - **Vùng nguy hiểm** (`DangerZoneCard`).
2. **Tab 2 — `Môn học`**:
   - Tách thành **2 bảng độc lập** xếp dọc để dễ đọc trên điện thoại:
     - **`AbbreviationsCard` (Viết tắt tên môn)**: 3 cột tinh gọn (`#`, `Tên gốc`, `Viết tắt`) theo danh sách môn học duy nhất, hỗ trợ `Gợi ý viết tắt`.
     - **`CourseTypeCard` (Tùy chỉnh hình thức LT/TH)**: chọn `LT` (45 phút) / `TH` (60 phút) theo từng mã nhóm lớp. Trên mobile (`< 640px`), ẩn cột phụ và gộp `Mã nhóm`, `Lớp`, `Nhóm` thành dòng phụ ngay dưới tên môn để loại bỏ cuộn ngang.
3. **Tab 3 — `Thông tin`**:
   - Mở **Quy chuẩn thời gian tiết giảng** (`PeriodStandardsCard`) và **Changelog** (`AboutCard`) trong **Accessible Modal** theo yêu cầu (hỗ trợ phím `Escape`).

---

## 🔡 Typography, Spacing & TdyTripZ Radii

- **Heading / Numbers**: `Montserrat` — sắc nét cho số tiết, khung giờ, tỷ lệ thống kê.
- **Body**: `Be Vietnam Pro` — tối ưu hiển thị tiếng Việt dài.
- **Border Radius (TdyTripZ Compact Flat Architecture)**:
  - `sm` (`6px`): badges, tags, nút phụ.
  - `md` / `lg` / `xl` (`8px`): inputs, segmented controls, nút chính.
  - `2xl` (`10px`): main cards.
  - `3xl` (`12px`): modals, dialogs, overlays.
- **Motion**: `200ms` standard / `300ms` layout transition (`ease-in-out`), phản hồi tương tác < 100ms.

---

## 🏗️ Kiến trúc State, Cấu hình & Observability

1. **Enforced Atomic Zustand Stores (`src/core/stores/createAtomicStore.ts`)**:
   - Toàn bộ store cốt lõi (`useScheduleStore`, `useUIStore`, `useExamStore`, `useAnalyticsStore`) bắt buộc truy cập qua selector nguyên tử (hoặc `.use.<field>()`) nhằm loại bỏ re-render thừa.
2. **Centralized Configuration (`src/core/config/constants.ts`)**:
   - Tập trung toàn bộ `API_ENDPOINTS`, `STORAGE_KEYS`, `PWA_CONFIG`, `PWA_BUILD_CONFIG`, `THEME_IDS`/`THEMES`, `PERIOD_TIMES`/`PERIOD_TIMES_TH`, `DEFAULT_THRESHOLDS` vào 1 file TypeScript thuần (an toàn cho cả Node.js `vite.config.ts` và browser bundle với tree-shaking).
3. **Structured Scoped Logger (`src/core/utils/logger.ts`)**:
   - Dùng `createLogger(scope)` ở các ranh giới hệ thống (`Bootstrap`, `PWA`, `Backup`, `History`, `Router`, `i18n`); tự động ẩn trường nhạy cảm (`[REDACTED]`), lược bỏ dữ liệu nhị phân/base64 (`[INLINE_DATA_STRIPPED]`), cắt gọn chuỗi dài và ẩn log `debug` trên production.
4. **Offline-First Analytics (`src/core/hooks/useAnalytics.ts`, `analytics.store.ts`)**:
   - Thu thập nhẹ chỉ số Core Web Vitals (`FCP`, `LCP`, `CLS`, `TBT`) và tương tác người dùng cục bộ, hỗ trợ gửi hàng đợi qua `sendBeacon` khi có cấu hình endpoint.

---

## ⚡ Triết lý Hiệu năng & PWA Zero-Dependency

- **Cooperative Bootstrap (`src/main.tsx` & `src/core/utils/scheduler.ts`)**: Chia nhỏ chuỗi khởi động bằng `yieldToMain()` + `React.startTransition` để giữ Total Blocking Time (TBT) thấp.
- **Zero-Dependency Service Worker (`public/sw.js` & `tdyTimePwaPlugin` trong `vite.config.ts`)**:
  - **Tier A Precache**: Toàn bộ entry & bootstrap chunks được precache nguyên tử khi cài SW.
  - **Tier B Warm Cache**: Các view/chunk nội bộ được lưu đệm nền cho chế độ ngoại tuyến 100%.
  - **Deterministic Build-Hash `CACHE_NAME`**: Tự động gắn mã hash của bản build vào `CACHE_NAME` trong `dist/sw.js` và giữ lại cache `N-1` để tránh `ChunkLoadError`.
  - **Anti-White-Screen Guard**: Chặn SW lưu nhầm phản hồi `text/html` (SPA fallback) vào cache cho `/assets/*`, kết hợp `vite:preloadError` tự phục hồi và màn hình khôi phục dự phòng trong `src/main.tsx`.
- **CI Performance Budget (`.github/workflows/audit.yml`, `lighthouserc.json`)**:
  - Bắt buộc `categories:performance >= 0.95` và `total-blocking-time <= 150ms`, tự động xuất báo cáo Markdown sau mỗi đợt deploy.

---

## 📚 Bộ Tài liệu Quy chuẩn Thiết kế Chi tiết (`docs/design-system/`)

Toàn bộ đặc tả chi tiết về **Design DNA, Design Tokens, Typography, Color System, Component Standards, Accessibility và Báo cáo Kiểm toán** được lưu trữ tại [`docs/design-system/README.md`](./docs/design-system/README.md):

- [`DESIGN_DNA.md`](./docs/design-system/DESIGN_DNA.md) — Bản sắc thị giác & kiến trúc TdyTripZ Compact Flat.
- [`DESIGN_PRINCIPLES.md`](./docs/design-system/DESIGN_PRINCIPLES.md) — 7 nguyên tắc thiết kế cốt lõi.
- [`DESIGN_TOKENS.md`](./docs/design-system/DESIGN_TOKENS.md) — Hệ thống CSS Custom Properties & Tailwind v4 `@theme` tokens.
- [`COLOR_SYSTEM.md`](./docs/design-system/COLOR_SYSTEM.md) — 7 Accent Themes, Smart Semantic Gradients & Dual-Theme matrix.
- [`TYPOGRAPHY.md`](./docs/design-system/TYPOGRAPHY.md) — Quy chuẩn `Be Vietnam Pro` + `Montserrat` (`font-num tabular-nums`).
- [`SPACING_AND_LAYOUT.md`](./docs/design-system/SPACING_AND_LAYOUT.md) — App Shell, Bento Grid & Safe Area.
- [`COMPONENT_GUIDELINES.md`](./docs/design-system/COMPONENT_GUIDELINES.md) — Đặc tả kỹ thuật cho Primitives, Composites & Views.
- [`INTERACTION_AND_MOTION.md`](./docs/design-system/INTERACTION_AND_MOTION.md) — Ngân sách chuyển động, 2-step confirmation & Reduced Motion.
- [`RESPONSIVE_GUIDELINES.md`](./docs/design-system/RESPONSIVE_GUIDELINES.md) — Chiến lược Mobile-First (`390px`) & Component Morphing.
- [`ACCESSIBILITY.md`](./docs/design-system/ACCESSIBILITY.md) — Chuẩn WCAG AA, WAI-ARIA Tabs/Dialogs & Focus Management.
- [`DO_AND_DONT.md`](./docs/design-system/DO_AND_DONT.md) — Quy tắc bắt buộc và các lỗi cần tránh.
- [`DESIGN_AUDIT_REPORT.md`](./docs/design-system/DESIGN_AUDIT_REPORT.md) — Báo cáo kiểm toán toàn diện, kế hoạch chuẩn hóa & Checklist tuân thủ.

Kiểm tra tuân thủ tự động:
```bash
node scripts/check-design-system.mjs --dry-run
```

---

*Cập nhật lần cuối: 24/11/2026 (`v2026.11.24`)*

