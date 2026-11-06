# TdyTime — Release Validation, Data Integrity & Post-Release Monitoring (Prompt 6)

**Phiên bản phát hành:** `v2026.11.05`  
**Ngày hoàn thành kiểm toán:** 2026-11-05  
**Hội đồng kiểm duyệt:** Staff Software Engineer, Release Manager, Security Engineer & QA Automation Architect  
**Trạng thái quyết định:** **APPROVED FOR PRODUCTION (PHÊ DUYỆT PHÁT HÀNH)**  

---

## 1. Tổng quan Mục tiêu & Phạm vi

Báo cáo này tổng hợp kết quả thẩm định cuối cùng của **Prompt 6** nhằm đảm bảo phiên bản `v2026.11.05` có thể phát hành an toàn, bảo toàn dữ liệu người dùng tuyệt đối và có phương án giám sát/hoàn nguyên đầy đủ.

Tất cả các tài liệu, báo cáo JSON và kịch bản tự động được lưu trữ tập trung tại thư mục này (`tests/release-validation/`).

---

## 2. Danh mục Báo cáo & Deliverables

| STT | Tập tin | Định dạng | Nội dung chi tiết | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| 1 | **`release-report.json`** | JSON | Kết quả phê duyệt tổng thể của hội đồng thẩm định | **PASS** |
| 2 | **`data-integrity-report.json`** | JSON | Thử nghiệm 5 kịch bản nạp file, khử trùng lặp và stress-test | **PASS** |
| 3 | **`import-security-report.json`** | JSON | Thử nghiệm 6 vector tấn công XSS và quét mã nguồn | **PASS** |
| 4 | **`pwa-lifecycle-report.json`** | JSON | Thẩm định Service Worker, Workbox cache và Web App Manifest | **PASS** |
| 5 | **`performance-report.json`** | JSON | Phân tích số liệu Web Vitals Lab và phân tách Lab vs RUM | **PASS** |
| 6 | **`regression-test-report.json`** | JSON | Kết quả 9 test suites (64 tests) và cấu hình CI/CD | **PASS** |
| 7 | **`release-checklist.md`** | Markdown | Bảng kiểm 4 cổng chất lượng (Code, PWA, Security, UX) | **COMPLETE** |
| 8 | **`rollback-plan.md`** | Markdown | Kế hoạch hoàn nguyên và khôi phục dữ liệu khi có sự cố | **READY** |
| 9 | **`README.md`** | Markdown | Báo cáo tổng kết điều hành và hướng dẫn triển khai | **FINAL** |

---

## 3. Tóm tắt Kết quả 7 Giai đoạn Thẩm định

### Phase 1 — Deployment Validation
- Thư mục đóng gói `dist/` được tạo đầy đủ: `index.html`, `manifest.webmanifest`, `sw.js`, `workbox-*.js`, và các asset bundle.
- **Không có bất kỳ tệp test nào lọt vào bundle**: 0 file `.test.ts`, `.spec.ts` hay file mock xuất hiện trong `dist/`.
- Đường dẫn asset sạch: Sử dụng chuẩn `/assets/...` không phụ thuộc thư mục nội bộ máy phát triển.

### Phase 2 — Data Integrity & Edge Cases
- **Nhập file UMS chuẩn (`1_schedule_anon_full.html`):** Parse thành công 10 tuần, đầy đủ ca sáng, chiều, tối và giảng viên.
- **Khử trùng lặp (Idempotency):** Nhập lại cùng một file không gây nhân đôi số tiết hay làm sai lệch tiến độ.
- **Xử lý file hỏng / rỗng:** Hệ thống từ chối an toàn với mã lỗi rõ ràng (`upload.errors.parseWeekNotFound`), không gây crash app.
- **Tải tệp lớn (Stress test):** Nạp dữ liệu giả lập gấp 5 lần (40 tuần) hoàn thành trong `~24ms`, bộ nhớ ổn định.

### Phase 3 — Import Security & XSS Sanitization
- Thử nghiệm 6 vector tấn công chèn mã độc vào file HTML:
  - `<script>alert('xss')</script>`
  - `<img src=x onerror=alert(1)>`
  - `<svg onload=alert(1)>`
  - `<a href="javascript:alert(1)">`
  - `<iframe src="...">`
  - `<input onfocus=alert(1) autofocus>`
- **Kết quả:** `100% PASS`. Nhờ cơ chế `DOMParser` phân tích trong ngữ cảnh DOM trơ (inert) kết hợp trích xuất `.textContent`, toàn bộ thẻ độc hại bị bóc tách thành chuỗi văn bản thuần túy, không một đoạn script hay event handler nào được thực thi.
- **Mã nguồn ứng dụng:** Quét toàn bộ `src/` ghi nhận **0** trường hợp sử dụng `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval()`, hay `document.write()`.

### Phase 4 — PWA Update & Recovery
- Giữ nguyên phiên bản ổn định **`vite-plugin-pwa@^1.3.0`** theo chỉ đạo.
- Chiến lược cập nhật: `registerType: 'prompt'` với toast thông báo `PWAUpdateHandler.tsx`, bảo vệ người dùng không bị tải lại trang bất ngờ khi đang giảng dạy hoặc ghi chú.
- Dọn dẹp cache cũ: `cleanupOutdatedCaches: true` tự động giải phóng bộ nhớ khi kích hoạt phiên bản mới.

### Phase 5 — Performance Monitoring (Lab vs RUM)
- **Chỉ số Lab Synthetic (Chromium Headless):**
  - TTFB: `5.4 ms`
  - FCP: `856 ms`
  - First Paint: `20 ms`
  - JS Heap Memory: `31.57 MB`
  - Initial Bundle Gzip (không tính lazy PDF): `~487 KB`
- **Minh bạch về RUM (Real User Monitoring):** Ứng dụng **không triển khai mã theo dõi telemetry/analytics** để bảo vệ 100% quyền riêng tư của giảng viên. Do đó báo cáo phân định rõ: các số liệu là kết quả đo trong phòng thí nghiệm (Lab Benchmark), không tự nhận là RUM.

### Phase 6 — Automated Regression & CI Pipeline
- **TypeScript:** Strict mode, 0 errors (`npx tsc --noEmit`).
- **ESLint:** 0 errors, 0 warnings (`eslint . --report-unused-disable-directives --max-warnings 0`).
- **Vitest:** 9 test suites, 64 tests passed 100% (`npx vitest run`).
- **CI Workflow:** Tích hợp trong `.github/workflows/ci.yml` đảm bảo mọi commit lỗi sẽ chặn pipeline tự động.

### Phase 7 — Release & Rollback Plan
- Bảng kiểm phát hành đã ký duyệt đầy đủ tại `release-checklist.md`.
- Kế hoạch hoàn nguyên và bảo toàn dữ liệu ngoại tuyến đã sẵn sàng tại `rollback-plan.md`.

---

## 4. Đồng bộ Changelog
1. **File tài liệu:** Đã ghi nhận chi tiết vào `CHANGELOG.md` dưới mục `[2026.11.05]`.
2. **Trong ứng dụng (Web App):** Đã cập nhật mục Changelog trong `src/i18n/locales/vi.json` và `en.json`, hiển thị trực quan tại tab Cài đặt ⟶ Thông tin ứng dụng (`AboutCard.tsx`).
