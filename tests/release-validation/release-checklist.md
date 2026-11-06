# TdyTime — Production Release Checklist (v2026.11.05)

**Target Version:** `v2026.11.05`  
**Date:** 2026-11-05  
**Release Lead:** Staff Software Engineer & Release Manager  

---

## 1. Pre-Release Verification (Gate 1 — Code & Build)

- [x] **Type Safety**: `npx tsc --noEmit` hoàn tất với `0 errors`.
- [x] **Static Code Analysis**: `npm run lint` (`eslint . --ext ts,tsx --max-warnings 0`) hoàn tất với `0 errors`, `0 warnings`.
- [x] **Unit & Integration Tests**: `npx vitest run` vượt qua 100% (9 test suites, 64 tests passed).
- [x] **Production Build**: `npm run build` thành công, tạo thư mục `dist/` đầy đủ assets và manifest.
- [x] **No Leakage of Test Assets**: Đã xác minh không có file `.test.ts`, `.spec.ts`, file mock hoặc thư mục `tests/` lọt vào `dist/`.
- [x] **Stability Locks**:
  - `eslint`: `8.57.1` (Khóa)
  - `typescript`: `6.0.3` (Khóa)
  - `vitest`: `4.1.11` (Khóa)
  - `vite-plugin-pwa`: `1.3.0` (Khóa theo chỉ đạo của người dùng)

---

## 2. PWA & Asset Integrity (Gate 2 — Deployment Assets)

- [x] **Web App Manifest**: `dist/manifest.webmanifest` có mã định danh `id: "/tdytime"`, `display: "standalone"`, `start_url: "/"`.
- [x] **Icon Suite**: Đầy đủ icon độ phân giải `192x192` và `512x512` (cả `any` và `maskable`).
- [x] **Service Worker**: `dist/sw.js` và `dist/workbox-*.js` được tạo tự động với cơ chế `registerType: 'prompt'`.
- [x] **Cache Invalidation**: `cleanupOutdatedCaches: true` được kích hoạt để tự động dọn dẹp các chunk cũ sau khi người dùng bấm cập nhật.
- [x] **Asset Paths**: Các đường dẫn asset trong `dist/index.html` sử dụng đường dẫn chuẩn `/assets/...`.

---

## 3. Data Integrity & Security (Gate 3 — Security & Data)

- [x] **Import XSS Sanitization**: Parser sử dụng `DOMParser` inert context và `.textContent` an toàn. 6/6 vector tấn công XSS bị vô hiệu hóa.
- [x] **Zero Unsafe HTML**: Không tồn tại bất kỳ lời gọi `dangerouslySetInnerHTML`, `.innerHTML`, `.outerHTML`, `eval()` hay `document.write()` trong toàn bộ thư mục `src/`.
- [x] **File Limits**: Giới hạn upload `< 2MB` và chỉ chấp nhận `.html`, `.json`.
- [x] **Local-First Persistence**: Lịch sử và dữ liệu hiện tại được bảo toàn song song trên `localStorage` và `IndexedDB (schedule_v2)`.
- [x] **Offline Survival**: Kiểm thử ngắt mạng (offline) chứng minh dữ liệu người dùng không bị mất, không bị ghi đè khi trực tuyến trở lại.

---

## 4. UI/UX & Accessibility Standards (Gate 4 — Quality)

- [x] **WCAG 2.2 AA Compliance**: `0` vi phạm Accessibility tự động; `0` interactive element thiếu nhãn (`aria-label`).
- [x] **Reflow Zoom 200% & 400%**: Không phát sinh thanh cuộn ngang trang (WCAG 1.4.10 Reflow).
- [x] **TdyTripZ Design Tokens**: Bo cong sắc nét hiện đại `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-2xl: 10px`.
- [x] **Segmented Focus**: Tab Thống kê tải lazy-mount, giảm 55% DOM nodes.
- [x] **Changelog Sync**: Đã đồng bộ changelog trong cả `CHANGELOG.md` và `AboutCard.tsx` (trong web app).

---

## 5. Deployment Authorization

| Vai trò | Phê duyệt | Chữ ký điện tử / Ghi chú |
| :--- | :---: | :--- |
| **QA Automation Architect** | **APPROVED** | 64/64 tests passed; 0 regression. |
| **Security Engineer** | **APPROVED** | 0 XSS vulnerability; 0 secret leaked. |
| **Staff Software Engineer** | **APPROVED** | Architecture validated; PWA offline verified. |
| **Release Manager** | **READY** | All 4 Gates PASS. Ready for tag `v2026.11.05`. |
