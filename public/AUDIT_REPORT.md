# 📊 Báo cáo Audit & Phát hiện Bug - TdyTime v2

Dựa trên quá trình phân tích chuyên sâu về Logic, Kiến trúc (Architecture) và Hiệu năng (Performance) của dự án TdyTime, dưới đây là các vấn đề đã được phát hiện cùng với mức độ nghiêm trọng và đề xuất khắc phục cụ thể. Báo cáo tập trung vào các lỗi có thể gây sập ứng dụng (Crash), sai lệch dữ liệu và rò rỉ bộ nhớ (Memory leaks/Re-renders).

---

## 🛑 1. Mức độ Nghiêm trọng: Critical (Lỗi nghiêm trọng, Crash App)

### 1.1. Parse JSON thiếu an toàn gây Crash ứng dụng (Storage/Store)
- **Vị trí**: `src/core/stores/schedule.store.ts` và `src/core/schedule/history.service.ts`
- **Nguyên nhân**:
  - Trong `history.service.ts`, hàm `getAll()` và `delete()` đọc dữ liệu trực tiếp từ `localStorage` thông qua `JSON.parse` nhưng không có try/catch (hoặc try/catch bị bao sai scope) xử lý fallback khi chuỗi JSON bị hỏng.
  - Tương tự trong `schedule.store.ts` dòng ~95, đoạn `const parsed = JSON.parse(saved)` được đặt trong block try nhưng xử lý catch lại... bị bỏ lơ, dẫn đến việc nếu localStorage bị can thiệp sai cú pháp, ứng dụng sẽ không thể load và dẫn tới "Trắng màn hình" (White Screen of Death).
- **Đề xuất chỉnh sửa**:
  - Bọc tất cả các câu lệnh `JSON.parse(localStorage.getItem(...))` trong các khối `try...catch` cẩn thận.
  - Xử lý khi lỗi (catch): Tự động xoá (remove) key bị hỏng trong localStorage và trả về mảng rỗng `[]` hoặc null thay vì ném lỗi (throw).

### 1.2. Tính toán ngày giờ bị lệch Timezone Local (Bug Logic)
- **Vị trí**: `src/core/schedule/schedule.index.ts` và `src/core/schedule/schedule.utils.ts`
- **Nguyên nhân**:
  - Khi tạo ngày `new Date(y, m - 1, d)` (ví dụ ở hàm `parseDateFromRange` hoặc lúc build Index), Date Object này được tạo dựa theo **múi giờ hiện tại của thiết bị (Local Timezone)** (UTC+7, UTC-4,...).
  - Tuy nhiên ở `schedule.index.ts`, sau đó lại dùng `startDateTime.setHours(...)` rồi format ra text theo một timezone do user truyền vào `options.timezone` (`Intl.DateTimeFormat(..., { timeZone: tz })`). Việc lấy absolute Timestamp (`getTime()`) từ một Local Date rồi format theo Timezone khác sẽ sinh ra sai lệch giờ học (Có thể lên đến hàng tiếng đồng hồ nếu user dùng App ở nước ngoài nhưng xem lịch Việt Nam).
- **Đề xuất chỉnh sửa**:
  - Không sử dụng `new Date(y, m - 1, d)` kết hợp với `setHours`.
  - Thay vào đó, nếu dữ liệu gốc là của Việt Nam, hãy thống nhất mọi tính toán timestamp theo múi giờ cứng hoặc dùng thư viện (như `date-fns-tz` / Temporal API) để khởi tạo đúng UTC Offset của Việt Nam trước khi convert sang TS.

---

## ⚠️ 2. Mức độ Nghiêm trọng: High (Rủi ro cao về Logic & Performance)

### 2.1. Lỗi React Hooks Dependency gây Stale Data & Cascade Renders
- **Vị trí**: `src/views/today/useTodayData.ts` (và một số component UI khác theo Lint output)
- **Nguyên nhân**:
  - Lỗi cực kỳ nguy hiểm trong `useMemo` và `useEffect`: `useMemo(() => ..., [currentWeek, now.getDate()])` và `[now.getHours()]`.
  - Gắn Dependency là hàm tính toán `now.getDate()` khiến React không theo dõi đúng tham chiếu. Bên cạnh đó, timer set event re-render (sử dụng `setTimeout` để update state `now`) được thiết kế phụ thuộc vào `sessionsIndex`, tạo ra vòng lặp render cực lớn nếu không ngắt (cleanup) triệt để.
  - Lỗi cascade setState (gọi `setState` khi đang render) được phát hiện trong `TodayView` và `StateInspector`.
- **Đề xuất chỉnh sửa**:
  - Pass tham chiếu biến đơn giản vào dependency list, ví dụ `nowTs = now.getTime()` và pass `nowTs`.
  - Sử dụng `useCallback` cho những logic đóng gói bên trong Hook.
  - Không gọi State Setter (như `setToast` hay `setX`) trực tiếp trên thân Function Component. Di chuyển chúng vào `useEffect` hoặc Event Handler.

### 2.2. Xung đột logic ID khi lưu vào History
- **Vị trí**: `src/core/schedule/history.service.ts`
- **Nguyên nhân**:
  - Khi lưu lịch vào lịch sử, ID được khởi tạo bằng `Date.now().toString()`.
  - Việc deduplicate được thực hiện bằng cách check Teacher + Semester + Year.
  - Tuy nhiên, nếu một người tải lên 2 file giống hệt nhau liên tiếp (trong cùng 1 giây - qua auto script), `Date.now()` có thể trùng nhau, dẫn tới key `id` trùng.
  - Nếu file mới được update liên tục, việc xoá `duplicateIndex` bằng `history.splice` sẽ làm thay đổi Array gốc (Mutating), kết hợp với React state có thể gây lỗi React (Vì Array bị mutate chứ không phải cloned).
- **Đề xuất chỉnh sửa**:
  - Sử dụng `crypto.randomUUID()` thay vì `Date.now().toString()` để gen ID độc nhất.
  - Sử dụng cách xử lý Immutable: `const newHistory = history.filter(item => item.id !== oldId)` thay vì `splice`.

---

## 🟠 3. Mức độ Nghiêm trọng: Medium (Kiến trúc & UX/Edge Cases)

### 3.1. Phân loại Học phần (TH/LT) chưa xử lý được Edge Case triệt để
- **Vị trí**: `src/core/schedule/parser.ts` (hàm `processSlotRow` và `sanitizeScheduleData`)
- **Nguyên nhân**:
  - Logic xác định loại học phần Thực hành (TH): `COURSE_TYPE_TH_REGEX.test(groupCode) || courseName.startsWith('TT ')`.
  - Có rủi ro khi `groupCode` không có `-TH.` nhưng thực tế lại là môn thực hành (do UMS đôi khi viết mã là `...TH1...` hoặc không có dấu chấm).
  - Không có cơ chế nhận diện từ khoá "Thực hành" lồng trong tên `courseName` (chỉ xét tiền tố `TT ` - Thực tập).
- **Đề xuất chỉnh sửa**:
  - Viết Regex mạnh hơn: `/-TH|\b(Thực hành|TH)\b/i`.
  - Thêm một tuỳ chọn cấu hình Fallback để người dùng có thể chủ động mapping/override lại một môn học cụ thể là LT hay TH nếu Tool nhận dạng sai. (Có vẻ đã có `overrides` store nhưng parser cần tích hợp thông minh hơn).

### 3.2. PWA Update Notification Loop
- **Vị trí**: `src/app/PWAUpdateHandler.tsx`
- **Nguyên nhân**:
  - Logic check update lưu trữ mốc thời gian dismiss `tdytime_install_prompt_dismissed`. Nếu người dùng ấn X, ngày đó được lưu lại. Nhưng thuật toán kiểm tra lại check "timePassed < DISMISS_DURATION".
  - Khi Service Worker tự tải về Cache mới, biến cờ `needUpdate` bị kích hoạt lại bất chấp bộ đếm Dismiss, tạo ra cảm giác bị hỏi liên tục khi DEV đẩy code liên tục.
- **Đề xuất chỉnh sửa**:
  - Đồng bộ logic Ignore/Dismiss cho cả Prompt Cài Đặt (Install) và Prompt Update Version.
  - Sử dụng `sessionStorage` kết hợp để không hỏi lại update trong cùng một phiên làm việc (Session) sau khi đã bị từ chối 1 lần.

---

## 🟢 4. Nhận xét Kiến trúc tổng thể (Architecture Review)

### Điểm Sáng (Pros)
1. **Zustand & Flat Sessions Index**: Đây là một thiết kế rất tuyệt vời (O(1) query). Việc dàn phẳng ScheduleData từ mảng lồng nhau sang dạng Flat List theo `startTs` giúp UI render siêu mượt.
2. **Offline-First PWA**: Việc cô lập Service Worker (`vite-plugin-pwa`) với chiến lược `CacheFirst` và `manualChunks` tách biệt React/i18n là một chiến lược rất hiện đại, giúp giảm tải payload và mang lại cảm giác App native.

### Điểm Cần Cải Thiện (Cons)
1. **Thiếu Lớp Bảo Vệ API (Validation Layer)**: Dữ liệu parse từ HTML hoặc JSON Upload chưa được check schemas cẩn thận (Ví dụ dùng `Zod`). Điều này rất nguy hiểm nếu định dạng file JSON lịch sử bị can thiệp.
2. **Thư mục Store quá cồng kềnh**: File `schedule.store.ts` đang đóng vai trò "God Store" - chứa cả state, logic parse, logic sanitize, xử lý upload. Nên tách logic upload, logic parser ra các Service Classes độc lập, Store chỉ nên giữ pure state setters.

---
> *Report Generated on: [CURRENT_TIMESTAMP]*
> *Auditor: TdyTime Auto-Audit System*
