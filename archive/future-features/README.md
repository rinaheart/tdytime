# Kho Lưu Trữ Tính Năng Mở Rộng (Future Features Archive) — TdyTime

Tài liệu này ghi nhận chi tiết các module tính năng phụ trợ đã được tách khỏi nhánh **Core Mobile Offline-First PWA** của **TdyTime** nhằm ưu tiên tuyệt đối cho mục tiêu cốt lõi: **Theo dõi lịch giảng, lịch coi thi và tiến độ giảng dạy trên thiết bị di động với tốc độ tải tức thì 100% không cần Internet**.

Toàn bộ mã nguồn của các tính năng này được bảo toàn nguyên vẹn trong thư mục `/archive/future-features/` để sẵn sàng tích hợp lại hoặc phát triển thành plugin/module mở rộng trong tương lai.

---

## 📂 Cấu trúc Thư mục Lưu trữ

```text
archive/future-features/
├── README.md                                   # Tài liệu kiến trúc & hướng dẫn khôi phục (tệp này)
├── notes/                                      # 1. Module Ghi chú buổi học & Lưu nháp tự động
│   ├── notes.store.ts                          # Zustand persist store lưu ghi chú theo sessionId
│   ├── draft.service.ts                        # Dịch vụ auto-draft debounce 300ms (sessionStorage) + synchronous flush
│   ├── NoteModal.tsx                           # Trình soạn thảo ghi chú có khôi phục nháp & cảnh báo thoát
│   └── auto-draft.test.ts                      # Bộ unit test kiểm định cơ chế lưu nháp đa tab
├── pdf-export/                                 # 2. Module Xuất báo cáo PDF Vector (@react-pdf/renderer)
│   ├── ScheduleReport/
│   │   ├── index.tsx                           # Template báo cáo PDF Lịch Tuần & Học kỳ (vector, đa trang)
│   │   └── styles.ts                           # Hệ thống style in ấn A4 landscape/portrait
│   └── fonts/
│       ├── Roboto-Regular.ttf                  # Font tiếng Việt nhúng vào PDF (141.95 kB)
│       └── Roboto-Bold.ttf                     # Font tiếng Việt in đậm nhúng vào PDF (133.18 kB)
├── csv-export/                                 # 3. Module Xuất bảng tính CSV Desktop
│   └── export-csv.ts                           # Tiện ích xuất CSV kèm UTF-8 BOM tương thích Microsoft Excel
├── devtools/                                   # 4. Module Developer Sandbox & Time-Bending UI
│   └── dev/
│       ├── DevToolsView.tsx                    # Trang công cụ kiểm thử (/dev)
│       ├── components/
│       │   └── CollapsibleSection.tsx          # Panel thu gọn/mở rộng trong DevTools
│       ├── sections/
│       │   ├── ScheduleBuilderForm.tsx         # Bộ sinh dữ liệu lịch giảng giả lập (JSON & UMS HTML)
│       │   └── StateInspector.tsx              # Trình kiểm tra trạng thái Zustand store trực tiếp
│       └── utils/
│           └── snapshotGenerator.ts            # Xuất snapshot trạng thái phục vụ debug
└── thresholds/                                 # 5. Module Ngưỡng Cảnh Báo Thủ Công
    └── ThresholdsCard.tsx                      # Thẻ tùy chỉnh ngưỡng cảnh báo quá tải (mặc định: 450/20/8 tiết)
```

---

## 🎯 Lý do Tách khỏi Core Mobile PWA

1. **Loại bỏ `~1.63 MB` tài nguyên không thiết yếu trên thiết bị di động:**
   - Riêng engine `@react-pdf/renderer` (`1,303.90 kB`), `pako`, `file-saver` (`2.68 kB`), 2 file font `Roboto-*.ttf` (`275.13 kB`) và `DevToolsView` (`42.14 kB`) chiếm tới **>65% tổng dung lượng bản build** nhưng lại là các tính năng chỉ dùng trên máy tính bàn (`hidden md:flex` đối với nút Xuất PDF / Xuất CSV) hoặc chỉ phục vụ lập trình viên (`/dev`).
2. **Tối ưu hóa tốc độ Render thẻ bài giảng (`SessionCard.tsx`):**
   - Trước khi tách, mỗi thẻ `SessionCard` (có thể xuất hiện 50–200 thẻ trong 1 học kỳ) phải khởi tạo một `useState(false)` và đăng ký một subscription vào `useNotesStore((s) => Boolean(s.notes[session.id]))`, kèm theo 1 nút bấm `<button>` + `<StickyNote>` SVG trên từng thẻ.
   - Sau khi tách module Ghi chú, `SessionCard` trở thành **100% Pure Stateless Component**, giảm ~150–400 DOM/SVG nodes trên mỗi khung nhìn lịch tuần/học kỳ và triệt tiêu hoàn toàn chi phí quản lý hook/subscription trên từng thẻ.
3. **100% Precache Offline-First nguyên tử:**
   - Khi tổng dung lượng toàn bộ ứng dụng giảm từ `2.56 MB` xuống chỉ còn `~750 kB`, Service Worker (`public/sw.js`) có thể lưu đệm (precache + warm-cache) **100% toàn bộ các màn hình của ứng dụng** ngay từ lần mở đầu tiên mà không còn bất kỳ chunk nào phải phụ thuộc vào mạng khi người dùng mở lần đầu ở chế độ Offline.

---

## 🛠️ Hướng dẫn Khôi phục Từng Module trong Tương lai

### 1. Khôi phục Module Ghi chú buổi học (`notes/`)
1. Di chuyển tệp về vị trí cũ:
   - `archive/future-features/notes/notes.store.ts` ⟶ `src/core/stores/notes.store.ts`
   - `archive/future-features/notes/draft.service.ts` ⟶ `src/core/notes/draft.service.ts`
   - `archive/future-features/notes/NoteModal.tsx` ⟶ `src/ui/composites/NoteModal.tsx`
   - `archive/future-features/notes/auto-draft.test.ts` ⟶ `tests/release-validation/auto-draft.test.ts`
2. Export `useNotesStore` trong `src/core/stores/index.ts` và `NoteModal` trong `src/ui/composites/index.ts`.
3. Gắn lại nút `<StickyNote>` và `<NoteModal>` vào `src/views/shared/SessionCard.tsx`.
4. Nếu muốn đồng bộ nháp trước khi cập nhật SW, gọi `draftService.flushAll()` trong `handleUpdate` của `src/app/PWAUpdateHandler.tsx`.

### 2. Khôi phục Module Xuất báo cáo PDF (`pdf-export/`)
1. Cài đặt lại dependencies:
   ```bash
   npm install @react-pdf/renderer pako file-saver
   npm install -D @types/file-saver
   ```
2. Di chuyển tệp về vị trí cũ:
   - `archive/future-features/pdf-export/ScheduleReport` ⟶ `src/views/shared/ScheduleReport`
   - `archive/future-features/pdf-export/fonts` ⟶ `src/assets/fonts`
3. Trong `vite.config.ts`, đảm bảo điều kiện `!id.includes('@react-pdf')` trong `manualChunks` của `vendor-react` và thêm `'react-pdf.browser-'`, `'ScheduleReport-'`, `'Roboto-'` vào `TIER_C_ON_DEMAND_PREFIXES`.
4. Khôi phục hàm `handleExportPDF` trong `src/views/weekly/WeekNavigation.tsx` và `src/views/semester/SemesterView.tsx`.

### 3. Khôi phục Module Xuất CSV (`csv-export/`)
1. Di chuyển `archive/future-features/csv-export/export-csv.ts` ⟶ `src/utils/export-csv.ts`.
2. Sử dụng hàm tải Blob thuần Native Browser (như trong `src/core/backup/backup.service.ts`) thay vì `file-saver` để tránh phát sinh thêm dependency.
3. Gắn lại nút `handleExportCSV` vào thanh công cụ của `src/views/semester/SemesterView.tsx`.

### 4. Khôi phục Module Developer Sandbox (`devtools/`)
1. Di chuyển `archive/future-features/devtools/dev` ⟶ `src/views/dev`.
2. Khai báo lazy route `/dev` trong `src/app/router.tsx`:
   ```tsx
   const DevToolsView = lazy(() => import('../views/dev/DevToolsView'));
   ```
3. (Tùy chọn) Bật lại cử chỉ chạm 5 lần vào số phiên bản tại `WelcomeView.tsx` để điều hướng tới `/#/dev`.

### 5. Khôi phục Module Ngưỡng Cảnh Báo Thủ Công (`thresholds/`)
1. Di chuyển `archive/future-features/thresholds/ThresholdsCard.tsx` ⟶ `src/views/settings/ThresholdsCard.tsx`.
2. Import và hiển thị `<ThresholdsCard />` trong Tab 1 (`courses`) hoặc Tab 2 (`data`) của `src/views/settings/SettingsView.tsx`.
