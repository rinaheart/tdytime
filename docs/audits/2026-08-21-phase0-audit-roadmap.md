# TdyTime Phase 0 Audit Roadmap

> **STATUS: DONE (Tất cả các hạng mục B1-B12, Testing và CI/CD đã được giải quyết ở bản v1.9.4)**
> **Date**: 2026-08-21
> **Auditor**: Maestro AI (Antigravity)

# TdyTime — Audit & Roadmap Report
**Repo:** github.com/rinaheart/tdytime (branch `main`) · **Version:** 1.9.3c · **Ngày audit:** 2026-08-19

> **Phương pháp**: Toàn bộ phát hiện dưới đây dựa trên việc clone thật repo và chạy trực tiếp: `npm install`, `tsc --noEmit`, `eslint . --ext ts,tsx`, `vite build`, `vitest run`, `npm audit`, và một script so khớp key i18n vi/en. Không có phát hiện nào được suy đoán — mọi issue đều trỏ tới file/dòng cụ thể. Những chỗ chưa đủ bằng chứng (ví dụ hành vi runtime trên thiết bị thật, dữ liệu UMS thực tế) được đánh dấu **"Cần verify"**.

---

## 1. Executive Summary

**Trạng thái repo**: Đây là một codebase **trưởng thành, có kỷ luật kỹ thuật cao** — không phải một dự án bừa bộn. TypeScript compile sạch 100% (0 lỗi), build production thành công, 85 unit test đều pass, đã có `ARCHITECTURE.md`/`DESIGN.md`/`CHANGELOG.md` chi tiết, đã cấu hình CSP headers nghiêm ngặt trên Vercel, và kiến trúc PWA offline-first (CacheFirst + manualChunks) rất tinh vi so với một app cá nhân. Đây rõ ràng là công sức nhiều tháng, không phải MVP vội vàng.

Tuy vậy, có một **khoảng cách giữa "tài liệu nói đã xong" và "code thực tế"**: `CHANGELOG.md` v1.9.3 ghi "sửa lỗi Reset Data, dọn dẹp >100 lỗi ESLint", nhưng `npm run lint` **hiện tại vẫn đỏ** (62 error + 26 warning, và script dùng `--max-warnings 0` nên chỉ cần 1 warning là fail CI). Tương tự, file `public/AUDIT_REPORT.md` có sẵn trong repo tự nhận là báo cáo audit trước đó — một số claim trong đó (vd. `history.service.ts` thiếu try/catch) **đã được fix**, nhưng một số khác (ID collision, PWA update loop, TH/LT regex edge case) **vẫn còn nguyên** trong code hiện tại.

### 3–10 vấn đề quan trọng nhất (xem chi tiết ở mục 3, 8, 9)
1. 🔴 **`npm audit` phát hiện 2 lỗ hổng High severity trong `react-router-dom`** (dependency production, không phải dev) — có bản vá (7.18.2), chỉ cần bump version.
2. 🔴 **`npm run lint` đang fail** — 62 error/26 warning thực tế trên `main`, mâu thuẫn với changelog "đã dọn >100 lỗi ESLint". Không có gate nào (không CI) ngăn PR mới thêm lỗi.
3. 🔴 **`JSON.parse(localStorage.getItem('global_abbreviations'))` không có try/catch** (`schedule.store.ts:90`) — nếu key này hỏng, `initFromStorage()` throw ngay khi mở app → màn hình trắng vĩnh viễn cho tới khi user tự xoá localStorage.
4. 🟠 **6 key i18n bị thiếu ở bản tiếng Việt** (`vi.json`), trong đó có đúng 3 message lỗi parser: `error.parseWeekNotFound`, `error.parseTableNotFound`, `error.parseNoWeeks` — nghĩa là khi parser thất bại (tình huống người dùng *cần* hiểu lỗi nhất), người dùng Việt (đối tượng chính của app) sẽ thấy key thô hoặc fallback tiếng Anh.
5. 🟠 **`useTodayData.ts` là hotspot lint nặng nhất** (14 error/20 warning) — dùng `now.getDate()`, `now.getHours()`, `now.getTime()` trực tiếp làm dependency của nhiều `useMemo`, đây chính là view mặc định user thấy đầu tiên mỗi lần mở app.
6. 🟠 **`@react-pdf/renderer` (~1.4MB, chunk lớn nhất trong toàn bộ build) được import tĩnh** ở đầu file `WeekNavigation.tsx` và `SemesterView.tsx` thay vì `import()` động khi user bấm "Xuất PDF" — nghĩa là thư viện PDF luôn được tải kèm khi vào Weekly/Semester view dù không export gì.
7. 🟡 **Pattern `react-hooks/set-state-in-effect`** lặp lại ở ≥9 file (PWAUpdateHandler, NoteModal, Toast, DevToolsView, ScheduleBuilderForm, CourseTypeCard, ThresholdsCard, AbbreviationsCard, SemesterView, AppLayout) — không phải lỗi đơn lẻ mà là một thói quen code lặp khắp nơi.
8. 🟡 **Không có `test` script** trong `package.json` dù `vitest` đã cấu hình đầy đủ và chạy tốt (`test:perf` có nhưng không có `test`/`test:unit`) — dev phải biết gõ `npx vitest run` theo trí nhớ.
9. 🟡 **Không có CI/CD** (`.github/workflows` không tồn tại) — `tsc`, `eslint`, `vitest` đều chỉ chạy local theo ý chí cá nhân, không có gate tự động trước khi merge/deploy.
10. 🟢 **Tài liệu bị lệch với code thực tế (doc drift)**: `ARCHITECTURE.md` liệt kê `scripts/desktop_audit.py` nhưng thư mục `scripts/` không tồn tại trong repo.

### Technical debt & khả năng mở rộng
Technical debt ở mức **thấp–trung bình**, tập trung chủ yếu ở 2 điểm nóng: `useTodayData.ts` (logic thời gian phức tạp, nhiều `useMemo` chồng chéo) và `schedule.store.ts` (đã tự nhận trong `public/AUDIT_REPORT.md` là "God Store" — vừa giữ state vừa xử lý parse/sanitize/upload). Codebase vẫn hoàn toàn có thể mở rộng tiếp theo hướng hiện tại (feature-first theo view, barrel export theo domain) — **không cần rewrite**, chỉ cần siết lại quy trình (CI, lint gate) và tách bớt trách nhiệm ở `schedule.store.ts`.

---

## 2. Repository & Architecture Map

```
User → (Upload HTML lịch giảng / paste TSV thi) 
      → UI (Views: Welcome/Today/Weekly/Semester/Exam/Stats/Settings)
      → State (Zustand stores: schedule/exam/notes/ui, persist → localStorage)
      → Domain Layer (core/schedule/*: parser → sanitizer → analyzer → index builder)
      → (Không có backend — 100% client-side, offline-first PWA)
      → External: Service Worker cache (Workbox), Vercel static hosting + Analytics,
                   @react-pdf/renderer (xuất PDF), file-saver (xuất CSV/PDF)
```

Không có backend/database/auth — đây là ETL + report tool chạy hoàn toàn client-side, đúng pattern "offline-first single-purpose tool" đã thấy ở các dự án khác của bạn (LichGiangDay_ReportTool, PTT Report PWA).

| Area | Hiện trạng | Đánh giá | File/Module liên quan |
|---|---|---|---|
| Framework/Build | React 19 + Vite 8 (Rolldown/Oxc) + TS 6 | Rất mới, đi đầu công nghệ; rủi ro là ecosystem/plugin đôi khi chưa ổn định với major mới | `package.json`, `vite.config.ts` |
| State | Zustand, 4 store tách domain | Tốt, nhưng `schedule.store.ts` (407 dòng) đang gánh cả parse + sanitize + upload logic | `src/core/stores/*.ts` |
| Domain/Parser | HTML parser tự viết cho UMS HTMH, không dùng schema validation (Zod...) | Hoạt động tốt theo test, nhưng không có lớp validate đầu vào chính thức | `src/core/schedule/parser.ts` |
| Routing | react-router-dom 7 (Hash Router), lazy-load toàn bộ view | Tốt cho PWA (back button hoạt động), nhưng đang dính CVE (mục 8) | `src/app/router.tsx` |
| PWA/SW | vite-plugin-pwa, CacheFirst cho navigation | Thiết kế cao cấp, có cân nhắc update lifecycle rõ ràng | `vite.config.ts`, `PWAUpdateHandler.tsx` |
| i18n | i18next, vi/en, 593–598 keys | Có lệch key (mục 1.4) | `src/i18n/locales/*.json` |
| Testing | vitest + RTL, 5 test file / 85 test | Coverage rất mỏng so với quy mô ~150 file `.tsx/.ts` | `src/**/*.test.ts(x)` |
| CI/CD | Không có | Thiếu hoàn toàn | — |
| Security headers | CSP, X-Frame-Options, nosniff đầy đủ | Tốt, hiếm thấy ở project cá nhân | `vercel.json` |

**Chưa đủ dữ liệu để kết luận** (cần verify): hành vi thực tế trên thiết bị iOS Safari (PWA install flow đặc thù iOS), tỉ lệ lỗi thực tế của parser với các biến thể HTML UMS khác nhau ngoài 2 mock scenario có sẵn, và độ chính xác timezone khi user ở nước ngoài (repo chỉ có 2 file mock, không có bộ test đa dạng cho parser edge case).

---

## 3. Bug & Issue Backlog

| ID | Issue | Evidence/File | Root Cause | Impact | Priority | Necessity | Complexity | Environment |
|---|---|---|---|---|---|---|---|---|
| B1 | `JSON.parse` không try/catch cho `global_abbreviations` | `schedule.store.ts:90` | Thiếu bọc try/catch riêng cho dòng này (dòng bên dưới có bọc nhưng dòng này thì không) | Localstorage hỏng → app trắng màn hình khi khởi động | 🔴 Critical | 5/5 | 1/5 | BOTH |
| B2 | `react-router-dom` dính 9 advisory (2 High trong phạm vi production) | `npm audit`, `package.json` dep | Version pin `^7.13.2`, chưa bump lên 7.18.2 | Rủi ro bảo mật lý thuyết (open redirect, DoS route matching...); mức khai thác thực tế với 1 SPA tĩnh không xác thực là **thấp nhưng không phải 0** | 🔴 Critical | 4/5 | 1/5 | BOTH |
| B3 | `npm run lint` fail trên `main` (62 error/26 warning) | `eslint . --ext ts,tsx` output | Không có CI gate; lỗi tích luỹ qua nhiều lần sửa nhanh | Không chặn bug trực tiếp nhưng làm mất tác dụng của lint (không ai còn tin tưởng lệnh `npm run lint`) | 🟠 High | 4/5 | 2/5 | LOCAL/IDE |
| B4 | Thiếu 6 key dịch trong `vi.json`, đặc biệt 3 message lỗi parser | i18n key-diff script | Thêm key mới ở `en.json` (dev bằng tiếng Anh) nhưng quên đồng bộ `vi.json` | Người dùng Việt thấy lỗi khó hiểu đúng lúc họ cần rõ nhất (khi parse fail) | 🟠 High | 4/5 | 1/5 | WEB |
| B5 | 34 vấn đề lint dồn ở `useTodayData.ts` (dependency `now.getX()` trong `useMemo`) | ESLint `react-hooks/exhaustive-deps`, `react-hooks/use-memo` | Dùng method call (`now.getDate()`) trực tiếp trong mảng dependency thay vì biến đơn giản | Nguy cơ stale closure / re-render thừa ở view mặc định (TodayView) | 🟠 High | 4/5 | 3/5 | LOCAL/IDE |
| B6 | `@react-pdf/renderer` import tĩnh, không lazy theo hành động | `WeekNavigation.tsx:10-11`, `SemesterView.tsx:14-15`, xác nhận bằng `vite build` (`vendor-pdf` 1.43MB) | Chưa chuyển sang `import()` động khi bấm nút "Xuất PDF" | Tăng dung lượng tải cho 2 view rất hay dùng (Weekly, Semester) dù user không export | 🟠 High | 3/5 | 2/5 | BOTH |
| B7 | `react-hooks/set-state-in-effect` lặp ở ≥9 file | ESLint output (PWAUpdateHandler, NoteModal, Toast, DevToolsView, ScheduleBuilderForm, CourseTypeCard, ThresholdsCard, AbbreviationsCard, SemesterView, AppLayout) | setState gọi trực tiếp trong thân effect thay vì trong callback | Rủi ro cascading render, khó chẩn đoán khi app "lag nhẹ không rõ lý do" | 🟡 Refinement | 3/5 | 3/5 | LOCAL/IDE |
| B8 | ID lịch sử dùng `Date.now().toString()` | `history.service.ts:32` | Không dùng `crypto.randomUUID()` | Nếu 2 lần lưu xảy ra cùng 1ms (auto-script/test), key React trùng | 🟢 Future | 2/5 | 1/5 | WEB |
| B9 | PWA update-dismiss logic có thể hỏi lại liên tục khi dev đẩy bản mới dồn dập | `PWAUpdateHandler.tsx` (đã ghi nhận sẵn trong `public/AUDIT_REPORT.md`, xác nhận cấu trúc code hiện tại vẫn giữ nguyên logic đó) | Cờ `needUpdate` không tôn trọng bộ đếm dismiss cũ | Trải nghiệm end-user thực tế: **cần verify** (chỉ xảy ra khi deploy dồn dập, ít gặp với người dùng thường) | 🟡 Refinement | 2/5 | 2/5 | BOTH |
| B10 | Regex nhận diện TH/LT có thể bỏ sót biến thể mã lớp (`...TH1...` không có `-TH.`) | `parser.ts` (đã ghi nhận trong `public/AUDIT_REPORT.md`, chưa thấy regex mới trong code hiện tại) | Regex `COURSE_TYPE_TH_REGEX` cứng theo 1 định dạng | Sai lệch phân loại LT/TH cho một số lớp — đã có `overrides` cho user tự sửa tay nên impact được giảm nhẹ | 🟡 Refinement | 3/5 | 2/5 | BOTH |
| B11 | `scripts/desktop_audit.py` được ghi trong `ARCHITECTURE.md` nhưng không tồn tại trong repo | `ARCHITECTURE.md` vs `find scripts/` | Doc không được cập nhật sau khi xoá/chưa từng commit file | Gây nhầm cho dev mới đọc doc | 🟢 Future | 1/5 | 1/5 | WEB |
| B12 | `public/AUDIT_REPORT.md` + `public/AUDIT_REPORT.test.ts` tồn tại trong `public/` → bị Vite build **copy nguyên vào `dist/`** và bị vitest quét thành file test trùng lặp (`dist/AUDIT_REPORT.test.ts` chạy lại y hệt) | `vitest run` output: cả `dist/AUDIT_REPORT.test.ts` và `public/AUDIT_REPORT.test.ts` đều chạy | `public/` là thư mục static assets, mọi thứ trong đó được deploy y nguyên lên domain production | File audit nội bộ (có thể chứa nhận xét nhạy cảm về chất lượng code) đang **public tại `tdytime.vercel.app/AUDIT_REPORT.md`**; đồng thời test bị chạy trùng 2 lần làm chậm test suite | 🟠 High | 4/5 | 1/5 | WEB |

---

## 4. Feature Refinement

### 4.1 Thông báo lỗi parser (đa ngôn ngữ)
- **Hiện trạng**: 3 key lỗi parser tồn tại ở `en.json` nhưng không có ở `vi.json`.
- **Vấn đề**: i18next sẽ fallback (tuỳ cấu hình) hoặc hiển thị key thô cho user Việt khi parser thất bại.
- **Người dùng bị ảnh hưởng**: Toàn bộ giảng viên dùng UI tiếng Việt (đại đa số) gặp lỗi parse.
- **Đề xuất**: Bổ sung 3 key còn thiếu vào `vi.json`, đồng thời thêm bước CI kiểm tra key parity giữa 2 file locale để tránh lặp lại.
- **Acceptance criteria**: `vi.json` và `en.json` có cùng tập key (script diff trả về rỗng ở cả 2 chiều).
- **Necessity**: 4/5 · **Complexity**: 1/5 · **Environment**: WEB · **Dependency**: thấp.

### 4.2 Xuất PDF (Weekly/Semester)
- **Hiện trạng**: Đã có engine `@react-pdf/renderer`, chất lượng vector tốt (theo CHANGELOG 1.9.2), nhưng nạp eager.
- **Vấn đề**: Người chỉ xem lịch (không export) vẫn tải ~1.4MB thư viện PDF.
- **Đề xuất**: Chuyển `import { pdf } from '@react-pdf/renderer'` và `import { ScheduleReport }` sang `React.lazy`/`import()` động, chỉ resolve khi user bấm nút xuất; hiện loading state trong lúc chunk tải.
- **Acceptance criteria**: Network tab khi mở `/week` hoặc `/semester` không có request tới chunk `vendor-pdf` cho tới khi bấm "Xuất PDF".
- **Necessity**: 3/5 · **Complexity**: 2/5 · **Environment**: BOTH (sửa ở WEB, verify network thực tế nên làm ở LOCAL/IDE) · **Dependency**: thấp.

### 4.3 DevTools route trong production
- **Hiện trạng**: `/dev` bị chặn bởi `DevGuard` nhưng bất kỳ ai tự set `localStorage.setItem('devtools_enabled','true')` trong console đều vào được, thấy state inspector + schedule builder.
- **Vấn đề**: Không rò rỉ dữ liệu nhạy cảm (không có secret/API key), nhưng lộ công cụ nội bộ, tăng bề mặt tấn công về logic (user có thể tự bơm dữ liệu giả vào store).
- **Đề xuất**: Cân nhắc build-time exclude (`import.meta.env.PROD` guard cứng thay vì chỉ dựa localStorage) nếu route này không cần dùng để debug production thực tế; nếu vẫn cần, giữ nguyên nhưng ghi rõ trong docs đây là "known/intentional backdoor".
- **Necessity**: 2/5 · **Complexity**: 2/5 · **Environment**: BOTH · **Dependency**: thấp.

*(Phân biệt: 4.1 và 4.4 dưới đây là **bug thực sự**; 4.2 là **refinement hiệu năng** trên feature đã hoàn thiện; 4.3 là **refinement bảo mật/UX** — không phải feature mới.)*

### 4.4 `global_abbreviations` khởi tạo an toàn
- Xem chi tiết ở B1 (mục 3) — về bản chất đây vừa là bug vừa là refinement kiến trúc (thiếu 1 helper `safeJSONParse()` dùng chung).
- **Đề xuất mở rộng**: Viết 1 hàm `safeJSONParse<T>(key: string, fallback: T): T` dùng chung cho toàn bộ codebase (hiện có ít nhất 5 chỗ gọi `JSON.parse(localStorage...)` rải rác, một số có try/catch một số không) để tránh lặp lại lỗi tương tự trong tương lai.
- **Necessity**: 4/5 · **Complexity**: 2/5 · **Environment**: LOCAL/IDE · **Dependency**: thấp.

---

## 5. UX/UI & Accessibility Audit

Đây là phần **cần verify nhiều nhất** vì đánh giá UX/UI đầy đủ đòi hỏi chạy app thật trên trình duyệt/thiết bị (không thể kết luận chắc chắn chỉ từ đọc JSX). Dựa trên các bằng chứng có thể lấy từ code tĩnh:

| Hạng mục | Quan sát từ code | Đánh giá |
|---|---|---|
| Loading state | `LoadingFallback` dùng `SessionCardSkeleton` cho mọi route lazy | Tốt, nhất quán |
| Error state | `RouteError` có UI riêng, kèm gợi ý tắt Google Translate (dấu hiệu đã từng gặp bug thật) | Tốt, thực tế |
| Empty state | Có component `EmptyState.tsx` riêng trong `ui/composites` | Cần verify: có được dùng nhất quán ở mọi view (Weekly/Semester/Stats khi rỗng) hay chỉ ở Welcome |
| Dark mode / accent themes | 7 theme accent + dark mode qua `theme.registry.ts` | Điểm mạnh, đã ghi trong README |
| Responsive | Không thể kết luận tĩnh — cần verify bằng DevTools responsive mode | **Cần verify** |
| Keyboard nav / accessibility (ARIA) | **Cần verify** — chưa grep đủ sâu để kết luận; nên chạy Lighthouse a11y audit (đã có sẵn `test:perf` dùng `lhci`, có thể mở rộng sang a11y category) | **Cần verify** |
| Form validation | Store `schedule.store.ts` có validate nội dung upload (`error.noData`, `error.invalidStructure`) trước khi parse | Tốt |
| Toast/feedback | Có component `Toast.tsx` riêng, nhưng dính lỗi `set-state-in-effect` (B7) | Cần refactor nhẹ, không phải bug UX rõ ràng |

**Khuyến nghị**: Chạy `npm run test:perf` (đã cấu hình `lhci autorun`) trên môi trường LOCAL để lấy điểm Accessibility/Performance/Best Practices thực tế thay vì suy đoán — công cụ này **đã có sẵn trong repo nhưng chưa thấy được chạy/lưu kết quả** (không có report output nào trong repo).

---

## 6. Technical Debt & Architecture

| Vấn đề | Vị trí | Phân loại |
|---|---|---|
| `schedule.store.ts` (407 dòng) gánh cả state + parse + sanitize + upload logic ("God Store") | `src/core/stores/schedule.store.ts` | Refactor soon |
| `useTodayData.ts` nhiều `useMemo` chồng chéo phụ thuộc `Date` instance thay vì timestamp nguyên thuỷ | `src/views/today/useTodayData.ts` | Fix now (vì đây là view mặc định, risk cao nhất) |
| `any` rải rác ở boundary quan trọng: store, parser types, dev snapshot generator | `schedule.store.ts`, `schedule.types.ts`, `schedule.index.ts`, `snapshotGenerator.ts` (4 chỗ), `CourseTypeCard.tsx`, `SettingsView.tsx`, `TodayHeader.tsx`, `ExamView.tsx` | Refactor soon |
| Thiếu lớp validate schema chính thức (Zod...) cho dữ liệu parse từ HTML/JSON import | `core/schedule/parser.ts` | Refactor when scaling (rủi ro tăng nếu mở nhiều nguồn UMS khác nhau) |
| `public/AUDIT_REPORT.md` + `.test.ts` nằm sai chỗ (nên ở `docs/` hoặc root, không nằm trong `public/`) | `public/` | Fix now (đơn giản, tránh rò rỉ + tránh test trùng) |
| Không có `test`/`test:unit` script dù vitest hoạt động tốt | `package.json` | Fix now (1 dòng) |
| Không CI/CD | repo root | Refactor soon |

---

## 7. Testing Strategy

**Hiện trạng**: 5 file test / 85 test case, tất cả pass. Coverage tập trung vào: flat index builder (`schedule.index.test.ts`), badge component (`TypeBadge.test.tsx`), và 1 benchmark hiệu năng (`exam.utils.perf.test.ts`). **Không có test nào cho `parser.ts`** (module rủi ro cao nhất — parse HTML thật từ UMS, nhiều edge case) và **không có test cho `schedule.store.ts`** (nơi vừa tìm thấy bug B1).

Test case nên viết đầu tiên (ưu tiên theo risk):
1. `parser.ts` — parse với 2 file mock có sẵn (`scenario-1-base.html`, `scenario-2-empty.html`) **đã tồn tại trong `public/mocks/` nhưng dường như chưa có test nào import chúng** — đây là "low-hanging fruit" vì fixture đã có sẵn, chỉ cần viết test.
2. `schedule.store.ts:initFromStorage` — test case localStorage chứa JSON hỏng (tái hiện chính xác bug B1).
3. `history.service.ts` — test dedup logic + trường hợp lưu liên tiếp trong cùng 1ms (tái hiện B8).
4. `useTodayData.ts` — test snapshot theo các mốc thời gian giả lập (dùng `vi.setSystemTime`) để bắt lỗi B5 trước khi refactor dependency array.
5. E2E tối thiểu 1 flow "happy path" (upload mock HTML → xem Today → xem Weekly → export PDF) — hiện chưa có bất kỳ E2E nào (không thấy Playwright/Cypress trong devDependencies).

---

## 8. Security & Performance

### Security
| Vấn đề | Mức độ | Xử lý |
|---|---|---|
| `react-router-dom` dính 9 CVE (2 High), có bản vá | Trung bình (impact lý thuyết cao nhưng SPA tĩnh không auth nên khai thác thực tế hạn chế) | `npm install react-router-dom@7.18.2 react-router@latest` rồi chạy lại `npm audit` |
| `vite` 8.0.0–8.0.15 dính CVE Windows-only (dev server) | Thấp cho production (chỉ ảnh hưởng máy dev chạy Windows lúc `vite dev`) | Bump `vite` lên bản vá khi có, không urgent cho deploy |
| `public/AUDIT_REPORT.md` bị deploy public (B12) | Thấp-Trung bình (rò rỉ thông tin nội bộ về điểm yếu code, có thể là gợi ý cho actor xấu) | Di chuyển ra khỏi `public/`, hoặc thêm vào `.vercelignore`/loại khỏi build |
| CSP/security headers | Tốt | Không cần hành động |
| DevTools route (mục 4.3) | Thấp | Cân nhắc, không urgent |
| Không dùng `dangerouslySetInnerHTML`/`eval` | Tốt | Không cần hành động |

### Performance
| Vấn đề | Bằng chứng | Xử lý |
|---|---|---|
| `vendor-pdf` là chunk lớn nhất (1.43MB) nạp eager ở 2 view phổ biến | `vite build` output + static import trong `WeekNavigation.tsx`/`SemesterView.tsx` | Lazy-load theo hành động (mục 4.2) |
| `useTodayData.ts` nhiều `useMemo` phụ thuộc method-call | ESLint | Có thể gây re-render thừa — **cần benchmark thực tế** (React DevTools Profiler) trước khi khẳng định mức độ ảnh hưởng, hiện chỉ là hypothesis có cơ sở từ lint |
| PWA CacheFirst cho navigation | `ARCHITECTURE.md`, `vite.config.ts` | Đã tối ưu tốt, không cần hành động |
| `test:perf` (Lighthouse CI) có sẵn nhưng chưa thấy kết quả lưu lại trong repo | `package.json` script tồn tại, không có report artifact | Chạy định kỳ và lưu baseline để theo dõi regression |

---

## 9. Web vs Local/IDE Matrix

| Task | WEB | LOCAL/IDE | Cần Windows? | Lý do | Cách verify |
|---|---:|---:|---:|---|---|
| Sửa B1 (bọc try/catch `global_abbreviations`) | ✅ | ✅ | Không | Thay đổi logic thuần TS, review code đủ | Đọc diff + (tốt hơn) chạy `vitest` với test case localStorage hỏng |
| Bump `react-router-dom`/`vite` (B2) | ❌ | ✅ | Không | Cần chạy `npm install` + `npm audit` + build thật để chắc không breaking change | `npm audit` trả về 0 high, `npm run build` pass |
| Sửa 62 lỗi ESLint (B3, B5, B7) | ⚠️ (đọc/sửa từng file được) | ✅ | Không | Cần chạy `eslint` lặp lại nhiều lần để xác nhận hết lỗi, review nhanh hơn trong IDE có inline lint | `npx eslint . --ext ts,tsx --max-warnings 0` trả về exit code 0 |
| Bổ sung 6 key i18n (B4) | ✅ | ✅ | Không | Chỉ là sửa JSON, không cần build | So khớp key bằng script (đã dùng trong audit này), hoặc mở app đổi ngôn ngữ và trigger lỗi parser |
| Lazy-load PDF renderer (B6/4.2) | ✅ (sửa code) | ✅ (bắt buộc để verify) | Không | Sửa import statement làm ở WEB được, nhưng **phải build + xem Network tab thật** để xác nhận chunk không tải eager | `npm run build` rồi `npm run preview`, mở DevTools Network, filter theo `vendor-pdf` |
| Di chuyển `AUDIT_REPORT.md` ra khỏi `public/` (B12) | ✅ | ✅ | Không | Thao tác file đơn giản | `npm run build` xong kiểm tra `dist/` không còn file này |
| Thêm `test`/`test:unit` script (mục 6) | ✅ | ✅ | Không | Sửa 1 dòng `package.json` | Chạy `npm test` thành công |
| Viết test cho `parser.ts` (mục 7) | ⚠️ | ✅ | Không | Viết được ở WEB nhưng chạy/verify coverage cần môi trường node thật | `npx vitest run --coverage` |
| Chạy Lighthouse CI (`test:perf`) | ❌ | ✅ | Không | Cần server thật + Chrome headless | Xem report `lhci` sinh ra |
| Kiểm tra hành vi PWA install trên iOS Safari | ❌ | ✅ (cần thiết bị/simulator thật) | Không (nhưng cần macOS cho Simulator, hoặc thiết bị iOS thật) | Không thể giả lập iOS PWA install flow từ web sandbox | Test thủ công trên thiết bị |
| Thiết lập CI/CD (mục 6) | ❌ | ✅ | Không | Cần push `.github/workflows`, cần quyền repo | PR mới tự động chạy tsc/eslint/vitest |

---

## 10. Roadmap từ gần → xa

### Phase 0 — Immediate / Blocking
**Objective**: Loại bỏ rủi ro crash/bảo mật có thể xảy ra bất cứ lúc nào.
- Tasks: B1 (safe JSON.parse), B2 (bump react-router-dom), B12 (gỡ AUDIT_REPORT khỏi public/), B4 (bổ sung 6 key i18n).
- Thứ tự: B1 → B12 → B4 → B2 (B2 để cuối vì cần verify build sau khi bump).
- Dependencies: Không phụ thuộc lẫn nhau, có thể làm song song.
- Environment: BOTH.
- Expected outcome: App không còn nguy cơ trắng màn hình do localStorage hỏng; không lộ audit report; user Việt thấy đúng thông báo lỗi; hết CVE High trong production deps.
- Complexity: 1–2/5 mỗi task. Necessity: 4–5/5.
- Definition of Done: `npm audit` 0 high trong production deps; `dist/` không chứa `AUDIT_REPORT.*`; i18n key-diff script trả về rỗng cả 2 chiều; test tái hiện B1 pass.

### Phase 1 — Short Term
**Objective**: Đưa `npm run lint` về xanh thật, dọn hotspot `useTodayData.ts`.
- Tasks: B3 (fix 62 lỗi ESLint theo nhóm rule), B5 (refactor dependency array trong `useTodayData.ts` dùng `nowTs = now.getTime()`), thêm `test`/`test:unit` script.
- Thứ tự: Sửa theo rule dễ trước (`no-unused-vars`, `no-explicit-any`) → rồi tới `set-state-in-effect` (B7) → cuối cùng `useTodayData.ts` (phức tạp nhất, cần test bao quanh trước khi refactor).
- Dependencies: Nên viết test cho `useTodayData.ts` (mục 7, hạng mục 4) *trước khi* refactor để tránh regression.
- Environment: LOCAL/IDE.
- Expected outcome: `npm run lint` exit code 0; `TodayView` (view mặc định) hết rủi ro stale-closure.
- Complexity: 3/5. Necessity: 4/5.
- Definition of Done: CI (nếu đã có ở Phase 2) hoặc chạy tay `npm run lint` pass với `--max-warnings 0`.

### Phase 2 — Medium Term
**Objective**: Refinement hiệu năng, testing, và siết quy trình.
- Tasks: B6/4.2 (lazy-load PDF renderer), viết test cho `parser.ts` dùng mock có sẵn, viết test cho `schedule.store.ts`/`history.service.ts`, thiết lập CI cơ bản (GitHub Actions: tsc + eslint + vitest trên mỗi PR), chạy và lưu baseline Lighthouse.
- Thứ tự: CI trước (để các bước sau tự động được kiểm chứng) → test → lazy-load PDF (đo bằng Lighthouse baseline vừa có).
- Dependencies: CI cần quyền GitHub Actions của repo.
- Environment: LOCAL/IDE (CI setup) + EXTERNAL (GitHub Actions runner).
- Expected outcome: Mọi PR tương lai tự động được kiểm tra; bundle Weekly/Semester nhẹ hơn đáng kể khi không export PDF.
- Complexity: 3/5. Necessity: 3/5.
- Definition of Done: File `.github/workflows/ci.yml` chạy xanh; Lighthouse Performance score được ghi lại làm baseline.

### Phase 3 — Long Term
**Objective**: Giảm nợ kiến trúc, tăng độ tin cậy dữ liệu.
- Tasks: Tách `schedule.store.ts` thành store thuần (state) + service riêng cho parse/sanitize/upload; thêm lớp validate schema (Zod) cho dữ liệu import (HTML parse output + JSON lịch sử) trước khi ghi vào store.
- Dependencies: Nên có test coverage tốt hơn (Phase 2) trước khi refactor lớn để tránh regression.
- Environment: LOCAL/IDE.
- Expected outcome: Store dễ test/maintain hơn; dữ liệu localStorage bị can thiệp/hỏng được phát hiện sớm bằng schema thay vì crash runtime.
- Complexity: 4/5. Necessity: 3/5.
- Definition of Done: `schedule.store.ts` giảm còn <200 dòng logic thuần state; có schema validate chạy trước mọi `set()` chứa data từ nguồn ngoài.

### Phase 4 — Future / Exploration
**Objective**: Ý tưởng có giá trị, chưa cấp thiết.
- Đồng bộ dữ liệu backend (đã ghi sẵn trong README "Sắp tới") — cần POC kiến trúc trước (serverless function? Supabase? Cloudflare D1?) vì hiện tại toàn bộ app không có backend nào.
- E2E test tối thiểu 1 flow bằng Playwright.
- Mở rộng regex nhận diện TH/LT (B10) — nên gộp cùng lúc với việc thu thập thêm mẫu HTML UMS thực tế đa dạng hơn 2 mock hiện có.
- a11y audit đầy đủ (mục 5) bằng Lighthouse category `accessibility`.

---

## 11. Master Priority Backlog

| Rank | ID | Task | Category | Necessity /5 | Impact /5 | Complexity /5 | Risk /5 | Environment | Dependency | Phase |
|---:|---|---|---|---:|---:|---:|---:|---|---|---|
| 1 | B1 | Bọc try/catch cho `JSON.parse(global_abbreviations)` | Bug fix | 5 | 5 | 1 | 1 | BOTH | Thấp | 0 |
| 2 | B12 | Gỡ `AUDIT_REPORT.md/.test.ts` khỏi `public/` | Security/Hygiene | 4 | 3 | 1 | 1 | WEB | Thấp | 0 |
| 3 | B4 | Bổ sung 6 key i18n còn thiếu ở `vi.json` | Bug fix | 4 | 4 | 1 | 1 | WEB | Thấp | 0 |
| 4 | B2 | Bump `react-router-dom` lên 7.18.2, `npm audit` lại | Security | 4 | 3 | 1 | 2 | LOCAL/IDE | Thấp | 0 |
| 5 | — | Thêm `test`/`test:unit` script vào `package.json` | DX | 3 | 2 | 1 | 0 | WEB | Thấp | 1 |
| 6 | B3 | Dọn 62 lỗi ESLint (theo nhóm rule) | Code quality | 4 | 3 | 2 | 1 | LOCAL/IDE | Trung bình | 1 |
| 7 | B5 | Refactor dependency array `useTodayData.ts` | Refactor | 4 | 4 | 3 | 2 | LOCAL/IDE | Trung bình (cần test trước) | 1 |
| 8 | B7 | Sửa pattern `set-state-in-effect` (9 file) | Refactor | 3 | 3 | 3 | 2 | LOCAL/IDE | Trung bình | 1 |
| 9 | — | Thiết lập CI cơ bản (tsc+eslint+vitest) | DX/Process | 3 | 4 | 3 | 1 | LOCAL/IDE + EXTERNAL | Thấp | 2 |
| 10 | B6 | Lazy-load `@react-pdf/renderer` theo hành động export | Performance | 3 | 3 | 2 | 1 | BOTH | Thấp | 2 |
| 11 | — | Viết test cho `parser.ts` bằng 2 mock có sẵn | Testing | 4 | 4 | 2 | 1 | LOCAL/IDE | Thấp | 2 |
| 12 | — | Viết test cho `schedule.store.ts`/`history.service.ts` | Testing | 3 | 3 | 2 | 1 | LOCAL/IDE | Thấp | 2 |
| 13 | — | Chạy & lưu baseline Lighthouse (`test:perf`) | Performance | 2 | 3 | 1 | 0 | LOCAL/IDE | Thấp | 2 |
| 14 | B10 | Cải thiện regex nhận diện TH/LT | Refinement | 3 | 3 | 2 | 1 | BOTH | Thấp | 3 |
| 15 | B8 | Đổi ID history sang `crypto.randomUUID()` | Refinement | 2 | 1 | 1 | 0 | WEB | Thấp | 3 |
| 16 | — | Tách `schedule.store.ts` (God Store) thành store + service | Architecture | 3 | 4 | 4 | 3 | LOCAL/IDE | Cao (cần test coverage trước) | 3 |
| 17 | — | Thêm schema validation (Zod) cho data import | Architecture | 3 | 4 | 4 | 2 | LOCAL/IDE | Trung bình | 3 |
| 18 | B9 | Ổn định logic dismiss update PWA | Refinement | 2 | 2 | 2 | 1 | BOTH | Thấp | 3 |
| 19 | B11 | Cập nhật `ARCHITECTURE.md` (xoá ref `scripts/desktop_audit.py`) | Docs | 1 | 1 | 1 | 0 | WEB | Thấp | 4 |
| 20 | — | Đồng bộ dữ liệu backend (POC) | Exploration | 2 | 5 | 5 | 3 | EXTERNAL | Cao | 4 |
| 21 | — | E2E test (Playwright) | Testing | 2 | 3 | 4 | 1 | LOCAL/IDE | Trung bình | 4 |
| 22 | — | a11y audit đầy đủ (Lighthouse category) | UX | 2 | 3 | 2 | 0 | LOCAL/IDE | Thấp | 4 |

---

## 12. Recommended Execution Order

**1 → Bọc try/catch cho `global_abbreviations` (B1)**
Làm gì: Thêm try/catch riêng quanh dòng `JSON.parse` ở `schedule.store.ts:90`, hoặc gộp vào 1 hàm `safeJSONParse` dùng chung.
Vì sao trước: Rủi ro crash toàn app khi mở lên — nghiêm trọng nhất, sửa nhanh nhất (1 dòng).
Môi trường: BOTH (sửa ở WEB được, verify tốt hơn ở LOCAL với vitest).
Hoàn thành khi: Test giả lập localStorage hỏng không còn làm app crash.
Phụ thuộc: Không.

**2 → Gỡ `AUDIT_REPORT.md/.test.ts` khỏi `public/` (B12)**
Làm gì: Di chuyển 2 file này ra `docs/` (không bị Vite copy vào `dist/`), cập nhật `.gitignore`/build config nếu cần.
Vì sao trước: Đang bị deploy public ngay lúc này, xử lý càng sớm càng tốt.
Môi trường: WEB.
Hoàn thành khi: `dist/` sau build không còn 2 file này.
Phụ thuộc: Không.

**3 → Bổ sung 6 key i18n thiếu (B4)**
Làm gì: Thêm `schedule.weeklyTitle`, `schedule.weekFrom`, `schedule.weekTo`, `error.parseWeekNotFound`, `error.parseTableNotFound`, `error.parseNoWeeks`, và `nav.completed` vào `en.json` — vào file `vi.json`/`en.json` tương ứng.
Vì sao trước: Đơn giản, tác động trực tiếp tới trải nghiệm lỗi của người dùng chính (Việt).
Môi trường: WEB.
Hoàn thành khi: Script diff key trả về rỗng.
Phụ thuộc: Không.

**4 → Bump `react-router-dom`, chạy lại `npm audit` (B2)**
Làm gì: `npm install react-router-dom@latest react-router@latest`, build lại, test lại toàn bộ flow điều hướng (hash router).
Vì sao sau bước 1–3: Cần thời gian verify build/breaking change, rủi ro kỹ thuật cao hơn 3 bước trên dù độ ưu tiên tương đương.
Môi trường: LOCAL/IDE.
Hoàn thành khi: `npm audit` không còn High trong production deps; `npm run build` + test thủ công điều hướng qua 6 view chính đều ổn.
Phụ thuộc: Không, nhưng nên làm sau khi ổn định 1-3 để dễ tách bạch nguyên nhân nếu có lỗi phát sinh.

**5 → Thêm `test` script + dọn lint (B3, B7 một phần)**
Làm gì: Thêm `"test": "vitest run"` vào `package.json`; sửa lint theo nhóm rule dễ trước (`no-unused-vars`, `no-explicit-any`), rồi `set-state-in-effect`.
Vì sao sau: Cần môi trường ổn định (không đang bump dependency) để tránh nhiễu lỗi.
Môi trường: LOCAL/IDE.
Hoàn thành khi: `npm run lint` exit 0.
Phụ thuộc: Bước 4 (đỡ nhiễu do thay đổi dependency).

**6 → Viết test bao quanh `useTodayData.ts`, rồi refactor dependency array (B5)**
Làm gì: Viết test với `vi.setSystemTime` trước, sau đó đổi `now.getX()` trong dependency array thành biến `nowTs`.
Vì sao sau: Đây là view mặc định, cần lưới an toàn (test) trước khi động vào logic thời gian.
Môi trường: LOCAL/IDE.
Hoàn thành khi: Test pass ở nhiều mốc thời gian giả lập; lint hết cảnh báo `exhaustive-deps` cho file này.
Phụ thuộc: Bước 5.

**7 → Thiết lập CI cơ bản**
Làm gì: Thêm `.github/workflows/ci.yml` chạy `tsc --noEmit && eslint . && vitest run` trên mỗi PR.
Vì sao sau: Cần lint/test đã xanh (bước 5-6) để CI không đỏ ngay từ đầu.
Môi trường: LOCAL/IDE + EXTERNAL (GitHub Actions).
Hoàn thành khi: PR test chạy CI xanh.
Phụ thuộc: Bước 5, 6.

**8 → Lazy-load PDF renderer + viết test `parser.ts`**
Làm gì: Đổi sang `import()` động cho `@react-pdf/renderer`; viết test dùng 2 mock HTML có sẵn.
Vì sao sau: Không blocking, nhưng nên làm khi đã có CI để tự động xác nhận không phá build.
Môi trường: BOTH.
Hoàn thành khi: Network tab xác nhận lazy-load; test `parser.ts` pass trong CI.
Phụ thuộc: Bước 7.

*(Các bước xa hơn — tách "God Store", schema validation, backend sync — theo roadmap Phase 3-4 ở mục 10, thực hiện sau khi nền tảng CI + test đã vững.)*

---

## 13. Quick Win vs Deep Work

### Quick Wins (Impact cao, Complexity thấp)
- B1 — Bọc try/catch `global_abbreviations` (5 phút sửa).
- B12 — Di chuyển `AUDIT_REPORT.*` ra khỏi `public/`.
- B4 — Bổ sung 6 key i18n thiếu.
- Thêm `"test": "vitest run"` vào `package.json`.
- B8 — Đổi `Date.now().toString()` → `crypto.randomUUID()` cho history ID.
- B11 — Cập nhật `ARCHITECTURE.md` khớp với repo thực tế.

### Deep Work (Complexity cao, có dependency, cần LOCAL/IDE hoặc POC)
- Tách `schedule.store.ts` khỏi vai trò "God Store" (ảnh hưởng kiến trúc toàn domain schedule).
- Thêm schema validation (Zod) cho toàn bộ luồng import dữ liệu.
- Refactor `useTodayData.ts` (cần lưới test trước, ảnh hưởng view mặc định).
- Thiết lập CI/CD đầy đủ + Lighthouse baseline theo dõi dài hạn.
- POC đồng bộ dữ liệu backend (roadmap "Sắp tới" trong README) — hiện chưa có bất kỳ hạ tầng backend nào, đây là thay đổi kiến trúc lớn nhất trong toàn bộ roadmap.

---

## Ghi chú về `public/AUDIT_REPORT.md` sẵn có trong repo
Repo đã có sẵn 1 báo cáo audit trước đó (không rõ tác giả — có thể do 1 lần chạy AI audit khác). So chiếu với code hiện tại:
- **Đã fix**: claim về `history.service.ts` thiếu try/catch → **sai với code hiện tại**, file này đã được bọc try/catch đầy đủ ở cả 4 hàm.
- **Vẫn còn đúng**: ID collision (`Date.now().toString()`), PWA update dismiss logic, TH/LT regex edge case — 3 claim này vẫn khớp với code hiện tại tại thời điểm audit này (đã đưa vào backlog B8, B9, B10 với mức ưu tiên thấp hơn vì impact hạn chế/hiếm gặp).
- Báo cáo cũ **không đề cập** tới B1 (dòng `global_abbreviations` cụ thể), B2 (CVE dependency), B4 (i18n key), B6 (PDF lazy-load), B12 (file audit bị deploy public) — đây là các phát hiện mới từ lần audit này.

Khuyến nghị: nên coi báo cáo cũ là **lịch sử tham khảo**, không phải nguồn sự thật hiện tại — vì bản thân nó minh chứng rằng code đã thay đổi kể từ khi nó được viết.
