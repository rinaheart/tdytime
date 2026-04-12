# Architecture Overview — TdyTime

TdyTime được thiết kế với triết lý **"Performance as a Feature"**. Kiến trúc tập trung vào trải nghiệm người dùng tức thì, khả năng hoạt động ngoại tuyến mạnh mẽ và tối ưu hóa tài nguyên phần cứng.

---

## 📂 Project Structure

```
tdytime/
├── index.html                          # Entry HTML, critical CSS inline, async font loading
├── package.json                        # Dependencies & scripts
├── vite.config.ts                      # Vite build config, manualChunks, PWA plugin
├── tsconfig.json                       # TypeScript config
├── postcss.config.js                   # PostCSS (Tailwind + Autoprefixer)
├── vercel.json                         # Vercel deploy, immutable cache headers, rewrites
├── vite-env.d.ts                       # Vite client type reference
├── ARCHITECTURE.md                     # This file
├── CHANGELOG.md                        # Version history
├── DESIGN.md                           # Design system & tokens
├── README.md                           # Project overview
│
├── public/
│   ├── favicon.svg                     # App icon (SVG)
│   ├── pwa-192x192.png                 # PWA icon 192px
│   ├── pwa-512x512.png                 # PWA icon 512px
│   ├── robots.txt                      # Crawler rules
│   └── mocks/
│       ├── manifest.json               # Mock PWA manifest for testing
│       ├── scenario-1-base.html        # Mock schedule HTML (base case)
│       └── scenario-2-empty.html       # Mock schedule HTML (empty case)
│
├── scripts/
│   └── desktop_audit.py                # Lighthouse desktop audit script
│
└── src/
    ├── main.tsx                         # React entry point, i18n init, router mount
    ├── types.d.ts                       # Global type augmentations (vite-plugin-pwa)
    │
    ├── app/                             # ── App Shell Layer ──
    │   ├── App.tsx                      # Root component, RouterProvider wrapper
    │   ├── router.tsx                   # Hash-based routing, lazy loading, guards
    │   ├── Monitoring.tsx               # Vercel Analytics & Speed Insights (deferred)
    │   ├── PWAUpdateHandler.tsx         # SW update lifecycle, skip-waiting toast
    │   └── layout/
    │       └── AppLayout.tsx            # Main layout: sidebar nav, bottom tab bar, Outlet
    │
    ├── core/                            # ── Domain Logic Layer ──
    │   ├── constants.ts                 # App version, days, period times (LT/TH), colors, thresholds
    │   ├── hooks/
    │   │   └── useScheduleFilter.ts     # Reusable filter hook (search, class, room, teacher)
    │   ├── schedule/
    │   │   ├── index.ts                 # Public API barrel (re-exports all schedule modules)
    │   │   ├── schedule.types.ts        # Domain types: CourseSession, WeekSchedule, Metrics, etc.
    │   │   ├── parser.ts                # HTML parser: UMS schedule HTML → ScheduleData
    │   │   ├── analyzer.ts              # Metrics calculator: ScheduleData → Metrics
    │   │   ├── schedule.index.ts        # Flat index builder: week/day tree → sorted FlatSession[]
    │   │   ├── schedule.utils.ts        # Date parsing, session filtering, formatting helpers
    │   │   ├── history.service.ts       # LocalStorage history CRUD (10 items, dedup)
    │   │   └── schedule.index.test.ts   # Unit tests for flat index builder
    │   ├── stores/
    │   │   ├── index.ts                 # Store barrel export
    │   │   ├── schedule.store.ts        # Zustand: schedule data, metrics, overrides, abbreviations
    │   │   └── ui.store.ts              # Zustand: theme, language, view mode, thresholds
    │   └── themes/
    │       └── theme.registry.ts        # 7 accent themes definition, migration map, validators
    │
    ├── i18n/                            # ── Internationalization ──
    │   ├── config.ts                    # i18next config (vi/en, localStorage persistence)
    │   └── locales/
    │       ├── vi.json                  # Vietnamese translations (~38KB)
    │       └── en.json                  # English translations (~33KB)
    │
    ├── styles/                          # ── Design Tokens & Global CSS ──
    │   ├── tokens.css                   # CSS custom properties: accent colors per theme, spacing
    │   └── global.css                   # Tailwind directives, base resets, utility classes
    │
    ├── ui/                              # ── Reusable UI Components ──
    │   ├── index.ts                     # UI barrel (primitives + composites)
    │   ├── ui.types.ts                  # UI-only types (ChangeLogEntry)
    │   ├── primitives/
    │   │   ├── index.ts                 # Primitives barrel
    │   │   ├── Button.tsx               # Button component with variants
    │   │   ├── Card.tsx                 # Card container with glass effect
    │   │   ├── Badge.tsx                # Badge with color variants
    │   │   ├── Skeleton.tsx             # Loading skeleton + SessionCardSkeleton
    │   │   └── Toast.tsx                # Toast notification component
    │   └── composites/
    │       ├── index.ts                 # Composites barrel
    │       ├── FilterBar.tsx            # Search + filter dropdowns (class/room/teacher)
    │       ├── EmptyState.tsx           # Empty data illustration + message
    │       ├── TypeBadge.tsx            # LT/TH course type badge
    │       └── ThemePicker.tsx          # Theme selection grid with preview swatches
    │
    ├── utils/                           # ── Shared Utilities ──
    │   ├── mockGenerator.ts             # Generate realistic demo ScheduleData
    │   └── timezone.ts                  # Time range formatting with Intl.DateTimeFormat
    │
    └── views/                           # ── Page Views ──
        ├── welcome/
        │   └── WelcomeView.tsx          # Landing page: file upload, history list, demo mode
        ├── today/
        │   ├── TodayView.tsx            # Today's sessions overview
        │   ├── TodayHeader.tsx          # Date display header
        │   ├── NextTeachingSection.tsx   # "Next class" countdown card
        │   ├── SessionList.tsx          # Session list renderer
        │   ├── useTodayData.ts          # Hook: filter today's sessions from flat index
        │   └── today.types.ts           # Today view-specific types
        ├── weekly/
        │   ├── WeeklyView.tsx           # Weekly schedule with table/card toggle
        │   ├── WeekNavigation.tsx       # Week prev/next navigator with date range
        │   └── useWeeklyData.ts         # Hook: weekly data from store + current week detection
        ├── semester/
        │   ├── SemesterView.tsx         # Full semester accordion view
        │   ├── WeekAccordion.tsx         # Collapsible week panel with day columns
        │   └── useSemesterData.ts       # Hook: semester-level data aggregation
        ├── statistics/
        │   ├── StatisticsView.tsx       # Dashboard with charts and insight cards
        │   ├── cards/
        │   │   ├── index.ts             # Cards barrel
        │   │   ├── StatsHeader.tsx      # Summary header (total hours/sessions/weeks)
        │   │   ├── InsightCard.tsx      # Single metric insight card
        │   │   ├── ProgressCard.tsx     # Progress bar card (completion %)
        │   │   ├── TopSubjectsCard.tsx  # Top subjects by period count
        │   │   ├── TeachingStructureCard.tsx  # LT/TH breakdown card
        │   │   └── CoTeachersTable.tsx  # Co-teacher details table
        │   └── charts/
        │       ├── index.ts             # Charts barrel
        │       ├── DailyBarChart.tsx    # Hours per day of week (bar chart)
        │       ├── WeeklyTrendChart.tsx # Weekly hours trend (line chart)
        │       └── HeatmapChart.tsx     # Week × Day heatmap grid
        ├── settings/
        │   ├── SettingsView.tsx         # Settings page layout
        │   ├── ThresholdsCard.tsx       # Warning/danger threshold sliders
        │   ├── CourseTypeCard.tsx       # LT/TH override editor per course
        │   ├── AbbreviationsCard.tsx    # Course name abbreviation editor
        │   ├── PeriodStandardsCard.tsx  # Period time reference table
        │   ├── DangerZoneCard.tsx       # Reset data / clear cache
        │   └── AboutCard.tsx           # Version info, changelog
        ├── shared/
        │   ├── SessionCard.tsx          # Universal session card (used across views)
        │   ├── WeekTableLayout.tsx      # Table-mode week layout (rows = periods)
        │   └── WeekCardLayout.tsx       # Card-mode week layout (columns = shifts)
        └── dev/
            ├── DevToolsView.tsx         # Developer tools page (DEV-only)
            ├── components/
            │   └── CollapsibleSection.tsx  # Collapsible panel for dev sections
            ├── sections/
            │   ├── ScheduleBuilderForm.tsx # Manual schedule JSON builder
            │   └── StateInspector.tsx      # Zustand store state viewer
            └── utils/
                └── snapshotGenerator.ts    # Store snapshot export utility
```

---

## 🚀 PWA & Service Worker (Offline-First)

TdyTime áp dụng chiến lược **Offline-First** thực thụ giúp ứng dụng hoạt động như một App Native.

### 1. Chiến lược CacheFirst cho Navigation
- **Cơ chế:** Thay vì sử dụng `NetworkFirst` (gây trễ khi chờ mạng), TdyTime sử dụng `CacheFirst` cho yêu cầu điều hướng (`index.html`).
- **Lợi ích:** Mở app gần như tức thì (~100ms) từ lần thứ 2 trở đi. Shell của ứng dụng luôn sẵn sàng trong Service Worker cache.
- **Dự phòng (Fallback):** Nếu không có trong cache (lần đầu), nó sẽ được tải từ mạng và tự động lưu vào precache.

### 2. Vòng đời cập nhật (Update Lifecycle)
- **Background Check:** Service Worker tự động kiểm tra phiên bản mới trong nền khi người dùng mở app.
- **SkipWaiting (User-controlled):** TdyTime **không** tự động reload trang khi có bản mới để tránh làm mất dữ liệu người dùng.
- **PWA Update Handler:** Một thông báo (Toast) sẽ hiện ra khi có bản mới. Chỉ khi người dùng nhấn "Cập nhật", Service Worker mới kích hoạt `SKIP_WAITING` và chuyển sang phiên bản mới.

---

## 📦 Chiến lược Bundle & Caching

Quy trình Build của TdyTime được tối ưu hóa để tận dụng tối đa HTTP/2 và cơ chế bộ nhớ đệm của trình duyệt.

### 1. Phân mảnh Bundle (Granular Splitting)
Sử dụng `vite.config.ts` với `manualChunks` để chia nhỏ mã nguồn thành các module độc lập:
- **`vendor-react`**: Chứa React Core (React, ReactDOM, Scheduler). File này ít thay đổi, giúp lưu cache lâu dài.
- **`vendor-i18n`**: Cô lập các file ngôn ngữ và thư viện dịch thuật.
- **`vendor-router`**: Chứa logic định tuyến.
- **`vendor-monitoring`**: Các thư viện giám sát (Analytics) được tách riêng để có thể trì hoãn tải.

### 2. Module Preloading
Vite tự động inject `<link rel="modulepreload">` cho các chunk thiết yếu. Điều này giúp trình duyệt bắt đầu tải các module phụ ngay khi đang parse module chính, loại bỏ hiện tượng waterfall (tải tuần tự).

### 3. Immortal Assets (Vercel)
Cấu hình `vercel.json` áp dụng chính sách `Cache-Control: immutable` cho các file assets có hash trong tên. Một khi đã tải, trình duyệt sẽ không bao giờ yêu cầu lại file đó cho đến khi có phiên bản mới với hash mới.

---

## ⚡ Tối ưu hóa đường dẫn tới hạn (Critical Path)

### 1. Critical CSS Inline
Các CSS nền tảng (Box-sizing, Font-family, Dark-mode shell) được nhúng trực tiếp (inline) vào `index.html`. Điều này giúp khung xương của app hiển thị ngay khi HTML vừa tải xong, trước khi file CSS lớn (`index.css`) được nạp.

### 2. Async Font Loading
Google Fonts được tải thông qua pattern `preload` + `onload`. 
- **Trước:** Trình duyệt dừng render để tải font (Render-blocking).
- **Sau:** App hiển thị bằng font hệ thống trước, sau đó hoán đổi (swap) sang Google Fonts khi quá trình tải hoàn tất, giúp FCP nhanh hơn 30-50%.

### 3. Deferred Monitoring Scripts
Các script nặng như `@vercel/analytics` và `@vercel/speed-insights` được trì hoãn tải thông qua `requestIdleCallback`. Chúng chỉ được thực thi khi trình duyệt ở trạng thái rảnh rỗi, đảm bảo không tranh chấp tài nguyên với luồng render chính của người dùng.
