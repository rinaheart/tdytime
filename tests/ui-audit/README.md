# Báo Cáo Kiểm Toán & Tối Ưu Hóa — Thẻ Thống Kê (`StatisticsView`)

Tài liệu này lưu trữ toàn bộ minh chứng thiết kế (UI/UX mockups), ảnh chụp màn hình thực tế (Mobile & Desktop, Light & Dark Mode), phương pháp đo kiểm hiệu năng, kết quả kiểm thử đơn vị (Unit Tests) và kiểm toán Responsive/Accessibility cho kiến trúc **Option 1 ("Segmented Focus")** của `StatisticsView`.

---

## 1. Cấu trúc thư mục `/tests/ui-audit/`

- **`mockups/`** *(Giữ nguyên bản gốc)*:
  - `option1-segmented-mobile.jpg`: Mockup Phương án 1 — Segmented Focus (Đã chọn triển khai).
  - `option2-bento-mobile.jpg`: Mockup Phương án 2 — Compact Bento Grid.
  - `option3-accordion-mobile.jpg`: Mockup Phương án 3 — Progressive Disclosure.
- **`screenshots/`** *(Ảnh chụp thực tế từ trình duyệt Chromium)*:
  - `option1-live-mobile-tab1-overview.png`: Tab 1 (`Tổng quan`) trên Mobile (`390×844`, Light Mode).
  - `option1-live-mobile-tab2-trends.png`: Tab 2 (`Xu hướng`) trên Mobile (`390×844`, Light Mode).
  - `option1-live-mobile-tab3-details.png`: Tab 3 (`Lớp & Phòng`) trên Mobile (`390×844`, Light Mode).
  - `option1-live-desktop-tab1-overview.png`: Tab 1 (`Tổng quan`) trên Desktop (`1024×768`, Light Mode).
  - `option1-live-desktop-tab2-trends.png`: Tab 2 (`Xu hướng`) trên Desktop (`1024×768`, Light Mode).
  - `option1-live-desktop-tab3-details.png`: Tab 3 (`Lớp & Phòng`) trên Desktop (`1024×768`, Light Mode).
  - `option1-live-mobile-tab1-dark.png`: Tab 1 (`Tổng quan`) trên Mobile (`390×844`, Dark Mode).
- **`stats-performance.test.ts`**: Bộ kiểm thử Vitest kiểm chứng tính tương đương dữ liệu (10 nhóm kịch bản nghiệp vụ & edge cases) và microbenchmark CPU (Warm-up + 30 lượt độc lập).
- **`browser-audit-report.json`**: Kết quả đo đạc tự động từ Chromium (Initial Render, Tab Switch Latency, Memory, Long Tasks, INP, DOM/SVG Nodes, Responsive 6 viewports & Accessibility).
- **`StatsDesignShowcase.tsx`**: Component prototype tương tác phục vụ đối chiếu thiết kế.

---

## 2. Phương pháp đo (Benchmark Methodology)

1. **Dữ liệu chuẩn (Dataset)**:
   - File `tests/mocks/1_schedule_anon_full.html` (10 tuần học, 89 buổi giảng, 336 tiết, 10 nhóm/lớp học phần).
2. **Đo lường CPU Computation (`stats-performance.test.ts`)**:
   - Tách biệt hoàn toàn thời gian tính toán CPU (`calculateProgressLegacy` vs `calculateProgressFromIndex`) khỏi thời gian render DOM.
   - **Warm-up**: Chạy làm nóng JIT 300 vòng lặp cho mỗi thuật toán trước khi đo.
   - **Lượt đo độc lập**: Chạy 30 batches độc lập × 200 vòng lặp/batch (tổng cộng 6.000 lần gọi mỗi thuật toán), xen kẽ (interleaved) giữa Legacy và Optimized trong từng batch để triệt tiêu nhiễu nhiệt độ CPU / Garbage Collection.
   - **Chỉ số báo cáo**: Median (`p50`) và `p95` cho cả batch (ms) và từng lệnh gọi đơn lẻ (µs).
3. **Đo lường UI Rendering & Runtime (`browser-audit-report.json`)**:
   - Đo trên trình duyệt Chromium thực tế (`playwright-cli`) tại `http://localhost:3000/#/stats`.
   - **Initial Render Time**: Thời gian từ lúc điều hướng sang `#/stats` đến khi `#stats-panel-overview` hiển thị hoàn chỉnh.
   - **Tab Switch Paint Latency (`rAF Proxy` — không phải Web Vitals INP thực tế)**: Warm-up 1 vòng qua 3 tab, sau đó đo 24 lần chuyển tab liên tiếp bằng `performance.now()` từ lúc click đến sau double `requestAnimationFrame` (báo cáo Median, P95, Min, Max). Đây là chỉ số **UI Paint Proxy** trong trình duyệt tự động hóa, không phải Web Vitals `INP` thực tế.
   - **Memory Usage (`performance.memory.usedJSHeapSize`)**: Ghi nhận kích thước V8 JS Heap toàn trang trước và sau 24 lần chuyển tab. Do `usedJSHeapSize` phụ thuộc chu kỳ GC và độ phân giải lượng tử hóa của Chromium, số liệu này dùng để xác nhận không có rò rỉ bộ nhớ tăng dần (unbounded leak), không suy diễn thành mức cấp phát bộ nhớ cô lập của riêng một component.

---

## 3. Bảng so sánh kết quả: Legacy vs. Optimized (Segmented Focus)

### 3.1. Hiệu năng tính toán CPU (Post-Warmup, 30 Batches × 200 Iterations)

| Chỉ số | Legacy (Nested Loops $O(W \times 7 \times S)$) | Optimized (`sessionsIndex` $O(N)$) | Cải thiện |
| :--- | :---: | :---: | :---: |
| **Median Batch Time (200 calls)** | `49.86 ms` | **`24.34 ms`** | **Nhanh hơn 2.05x (-51.2%)** |
| **P95 Batch Time (200 calls)** | `82.51 ms` | **`51.96 ms`** | **Nhanh hơn 1.59x (-37.0%)** |
| **Median Single Call Latency** | `249.32 µs` | **`121.71 µs`** | **-127.61 µs / lần gọi** |
| **P95 Single Call Latency** | `412.55 µs` | **`259.80 µs`** | **-152.75 µs / lần gọi** |
| **Độ khớp dữ liệu (50 mốc thời gian + Edge Cases)** | Chuẩn tham chiếu | **Khớp 100%** | **10/10 bài test PASS** |

### 3.2. Hiệu năng DOM, Lazy Mount & Runtime UI

| Chỉ số UI / Runtime | Legacy (Tất cả Card mount cùng lúc) | Optimized — Tab `Tổng quan` | Optimized — Tab `Xu hướng` | Optimized — Tab `Lớp & Phòng` | Đánh giá |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Tổng số phần tử DOM (`<main>`)** | `360 nodes` | **`198 nodes`** (-45.0%) | **`278 nodes`** (-22.8%) | **`272 nodes`** (-24.4%) | Giảm tải cây DOM (sau khi chuyển Heatmap sang tab `Xu hướng`) |
| **Tổng số phần tử SVG (`svg, svg *`)** | `152 nodes` | **`41 nodes`** (-73.0%) | **`114 nodes`** (-25.0%) | **`40 nodes`** (-73.7%) | Thay SVG Donut bằng Stacked Bar |
| **Accordion `GroupProgressCard` (Thu gọn / Mở)** | N/A | `false` (`198` DOM) / `true` (`560` DOM) | Lazy-unmounted khi đóng | Lazy-unmounted khi đóng | Tiết kiệm `362` DOM nodes khi thu gọn |
| **Initial Render Time (`#/stats`)** | ~65 ms | **`40.80 ms`** | — | — | Phản hồi tức thì |
| **Tab Switch Paint Latency (`rAF Proxy` Median / P95)** | N/A | **`28.70 ms` / `60.50 ms`** | **`28.70 ms` / `60.50 ms`** | **`28.70 ms` / `60.50 ms`** | Proxy đo qua `click → 2×rAF` (không phải Web Vitals INP thực tế) |
| **Max Observed Event/Paint Duration (`rAF Proxy`)** | N/A | **`64.00 ms`** | **`64.00 ms`** | **`64.00 ms`** | Phản hồi frame mượt trong kịch bản tự động hóa |
| **JS Heap Snapshot (`usedJSHeapSize` trước / sau 24 lần chuyển tab)** | N/A | **`39.6 MB` → `39.6 MB`** | Ổn định sau GC | Ổn định sau GC | Không ghi nhận tăng trưởng heap bậc thang (không suy diễn `0 KB` cấp phát cô lập) |

---

## 4. Kết quả Kiểm thử Responsive & Accessibility (6 Breakpoints × 3 Tabs)

| Viewport | Horizontal Overflow | Text Clipping | Touch Target Tab (`min-h`) | Touch Target Header Toggle | Touch Target Group Toggle | Nhãn phụ `< 12px` | Kết luận |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`320×568`** (iPhone SE) | `0` (`320px <= 320px`) | `0` | `44px` | `44×44px` | `64px` | `0` | **PASS** |
| **`360×800`** (Android phổ thông) | `0` (`360px <= 360px`) | `0` | `44px` | `44×44px` | `64px` | `0` | **PASS** |
| **`390×844`** (iPhone 14/15) | `0` (`390px <= 390px`) | `0` | `44px` | `44×44px` | `64px` | `0` | **PASS** |
| **`430×932`** (iPhone Pro Max) | `0` (`430px <= 430px`) | `0` | `44px` | `44×44px` | `64px` | `0` | **PASS** |
| **`768×1024`** (iPad Portrait) | `0` (`768px <= 768px`) | `0` | `44px` | `44×44px` | `64px` | `0` | **PASS** |
| **`1024×768`** (Desktop / Landscape) | `0` (`1024px <= 1024px`) | `0` | `44px` | `44×44px` | `64px` | `0` | **PASS** |

---

## 5. Các vấn đề đã phát hiện & xử lý trong quá trình kiểm toán

1. **Chưa áp dụng `data.overrides` (LT/TH) vào `buildScheduleIndex` và `calculateMetrics`**:
   - *Nguyên nhân*: Khi người dùng đổi loại học phần (LT ↔ TH) trong Cài đặt, `schedule.store.ts` gọi lại `buildScheduleIndex` và `calculateMetrics` nhưng hai hàm này vẫn đọc `s.type` gốc thay vì `data.overrides?.[s.courseCode] || s.type`. Do giờ kết thúc tiết LT (VD: tiết 3 kết thúc `09:35`) khác tiết TH (tiết 3 kết thúc `10:00`), tiến độ trong ngày có thể lệch nếu môn học được override.
   - *Cách xử lý*: Cập nhật `buildScheduleIndex`, `calculateMetrics`, và `stats.utils.ts` ưu tiên đọc `data.overrides?.[s.courseCode] || s.type`.
2. **Rơi buổi học có `timeSlot` bất thường trong `buildScheduleIndex`**:
   - *Nguyên nhân*: `buildScheduleIndex` trước đây dùng `if (!periodStart || !periodEnd) return;` làm rơi buổi học nếu `timeSlot` bị lỗi định dạng, trong khi Legacy vẫn cộng `periodCount` vào tổng số tiết học kỳ.
   - *Cách xử lý*: Giữ buổi học trong `sessionsIndex` với cờ `hasValidEndTime: false` và xử lý đồng nhất với Legacy ở cả quá khứ, hiện tại và tương lai.
3. **Nhãn phòng học rỗng (`""`) trong thẻ `Giảng đường chính`**:
   - *Nguyên nhân*: Một số buổi thực hành trên UMS ghi phòng học là dấu chấm `.`, sau khi `sanitizeScheduleData` xóa dấu chấm đầu chuỗi thì `s.room` thành chuỗi rỗng `""`, hiển thị dòng trống trong danh sách Top phòng học.
   - *Cách xử lý*: Chuẩn hóa `const roomName = s.room?.trim() || CHUA_RO;` trong `analyzer.ts` và bổ sung fallback hiển thị `Chưa rõ` trong `StatisticsView.tsx`.
4. **Cỡ chữ nhãn phụ nhỏ hơn `12px` & Vùng chạm nút thu gọn `< 44px`**:
   - *Cách xử lý*: Nâng toàn bộ nhãn phụ trong `StatisticsView`, `StatsHeader`, `ProgressCard`, `GroupProgressCard`, `InsightCard`, `TeachingStructureCard`, `HeatmapChart`, `WeeklyTrendChart`, `DailyBarChart`, `TopSubjectsCard`, `CoTeachersTable` lên tối thiểu `text-xs` (`12px`); gộp 4 `InsightCard` thành nhóm chỉ số phẳng (`grid-cols-2 lg:grid-cols-4`); chuẩn hóa nút thu gọn và thanh Segmented Control đạt chuẩn `>= 44×44px` kèm điều hướng bàn phím (`ArrowLeft`, `ArrowRight`, `Home`, `End`).

---

## 6. Các vấn đề còn tồn tại & Theo dõi P3 (Known Limitations)

- **Long Tasks khi import/parse dữ liệu lịch lần đầu (P3 — Đã ghi nhận, chưa bắt buộc tối ưu)**:
  - Khi nạp file HTML thời khóa biểu UMS đầy đủ (`1_schedule_anon_full.html`, ~156 KB, 10 tuần) và khởi tạo IndexedDB/Zustand store lần đầu, `PerformanceObserver('longtask')` ghi nhận **6 Long Tasks** (tổng thời gian chặn luồng chính khoảng `~380–450 ms`, đơn lẻ từ `54 ms` đến `118 ms` do `DOMParser.parseFromString` + `sanitizeScheduleData` + `buildScheduleIndex` + `calculateMetrics` chạy đồng bộ).
  - Trong quá trình chuyển đổi giữa 3 tab của `StatisticsView` (`Tổng quan` ↔ `Xu hướng` ↔ `Lớp & Phòng`), số lượng Long Tasks phát sinh thêm là **`0`**.
