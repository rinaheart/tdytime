# PWA Lifecycle & Cache Invalidation Guide — TdyTime

> **Tài liệu Kỹ thuật Vòng đời Service Worker, Quản lý Bộ nhớ đệm & An toàn Dữ liệu**  
> **Phiên bản áp dụng:** `v2026.11.05`  
> **Thư viện cốt lõi:** `vite-plugin-pwa@^2.0.0` & `workbox-window@^7.4.1`  
> **Trạng thái cấu hình:** Khóa ổn định kiến trúc PWA (`registerType: 'prompt'`)

---

## 1. Tổng quan Kiến trúc PWA của TdyTime

TdyTime là ứng dụng Progressive Web App (PWA) theo mô hình **Offline-First / Local-First**. Ứng dụng ưu tiên nạp tức thì từ bộ nhớ đệm (Cache Storage) và lưu trữ toàn bộ dữ liệu lịch giảng, ghi chú độc lập tại trình duyệt của người dùng thông qua **`IndexedDB`** và **`localStorage`**.

Hệ thống PWA được xây dựng dựa trên:
- **`vite-plugin-pwa@^2.0.0`** (cấu hình trong `vite.config.ts`): Tự động sinh `manifest.webmanifest`, biên dịch Service Worker (`sw.js`) và tiêm danh mục nạp trước (precache manifest) với mã băm nội dung byte-level.
- **`workbox-window@^7.4.1`** (kết hợp với `src/app/PWAUpdateHandler.tsx`): Quản lý vòng đời cập nhật tại tầng giao diện React, phát hiện Service Worker mới và kích hoạt cập nhật có kiểm soát qua tín hiệu `postMessage({ type: 'SKIP_WAITING' })`.

---

## 2. Phân biệt 5 Tầng Lưu trữ Trình duyệt (Storage Tiers Differentiation)

Nhằm tránh nhầm lẫn giữa dữ liệu ứng dụng và tài nguyên giao diện, TdyTime phân tách rõ ràng 5 tầng lưu trữ:

| Tầng lưu trữ | Công nghệ / Cơ chế | Tên / Định danh thực tế | Dữ liệu lưu trữ | Phạm vi ảnh hưởng khi cập nhật PWA |
| :--- | :--- | :--- | :--- | :--- |
| **1. Workbox Precache** | Cache Storage API | `workbox-precache-v2-${scope}-${hash}` | Các asset tĩnh cốt lõi (`index.html`, JS chunks, CSS, icon SVG, PNG) | Được Workbox tự động quản lý và dọn dẹp theo mã băm (`revision`) |
| **2. Runtime Cache Storage** | Cache Storage API (Workbox Runtime) | `html-shell-cache`<br>`static-assets`<br>`google-fonts-cache`<br>`gstatic-fonts-cache` | HTML navigation, assets phụ trợ, Google Web Fonts | Quản lý theo chính sách `CacheFirst` kèm `ExpirationPlugin` (`maxAgeSeconds`, `maxEntries`) |
| **3. Browser HTTP Cache** | HTTP Disk / Memory Cache | Được kiểm soát bởi HTTP Headers từ máy chủ CDN / Web Server (`Cache-Control`, `ETag`) | Các phản hồi mạng HTTP thô | Nằm dưới sự kiểm soát của trình duyệt, độc lập với Service Worker |
| **4. IndexedDB** | Web Database API (Native wrapper `src/core/utils/idb.ts`) | **Database:** `TdyTimeDB`<br>**Store:** `keyval`<br>**Key:** `timetable_history_v1` | Danh sách lịch sử tối đa 10 tệp lịch UMS từng import (`HistoryItem[]`) | **TUYỆT ĐỐI KHÔNG BỊ ẢNH HƯỞNG** bởi Service Worker hay Cache Storage |
| **5. LocalStorage** | Web Storage API (Key-Value) | `last_schedule_data`<br>`tdy_session_notes`<br>`global_abbreviations`<br>`tdytime_theme`, v.v. | Dữ liệu lịch đang xem, ghi chú buổi học (Zustand persist), từ điển viết tắt, theme UI | **TUYỆT ĐỐI KHÔNG BỊ ẢNH HƯỞNG** bởi Service Worker hay Cache Storage |

---

## 3. Phạm vi Chính xác của `cleanupOutdatedCaches: true`

Trong `vite.config.ts`, tùy chọn `cleanupOutdatedCaches: true` được thiết lập trong khối cấu hình `workbox`:

```typescript
// vite.config.ts
VitePWA({
    registerType: 'prompt',
    workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: '/index.html',
        // ...
    }
})
```

### 3.1 Cơ chế hoạt động thực tế
1. Khi Service Worker mới nhận sự kiện `activate`, plugin `cleanupOutdatedCaches` của Workbox sẽ được kích hoạt.
2. Plugin quét **CHỈ các cache thuộc về precache manifest** (có tiền tố phù hợp với cấu hình Workbox precache, ví dụ `workbox-precache-v2-...`).
3. Nó đối chiếu các URL và mã băm revision trong cache đó với danh sách `__SW_MANIFEST` của phiên bản mới.
4. Mọi URL hoặc chunk cũ của bản build trước không còn nằm trong manifest mới sẽ bị gọi `cache.delete(url)` để giải phóng dung lượng.

### 3.2 Giới hạn và những gì `cleanupOutdatedCaches` KHÔNG thực hiện:
- **KHÔNG xóa các Runtime Caches:** Các cache như `html-shell-cache`, `static-assets`, `google-fonts-cache`, `gstatic-fonts-cache` không nằm trong precache manifest nên **không** bị `cleanupOutdatedCaches` xóa. Chúng được kiểm soát riêng bởi `ExpirationPlugin` (dựa trên thời gian sống `maxAgeSeconds` hoặc số lượng bản ghi `maxEntries`).
- **KHÔNG xóa Browser HTTP Cache:** Bộ nhớ đệm HTTP của trình duyệt tuân theo header HTTP từ server, Service Worker không thể xóa trực tiếp HTTP cache tầng dưới.
- **KHÔNG can thiệp vào IndexedDB hay LocalStorage:** Toàn bộ lịch giảng và ghi chú người dùng nằm ở tầng dữ liệu cục bộ riêng biệt, hoàn toàn an toàn trước tiến trình này.

---

## 4. Vòng đời Cập nhật Service Worker & Hành vi Đa Tab (Multi-Tab Update Behavior)

### 4.1 Chi tiết các trạng thái trong vòng đời (Lifecycle States)

1. **Installing (Cài đặt):**
   - Khi có bản build mới được triển khai lên máy chủ, trình duyệt phát hiện tệp `dist/sw.js` trên mạng khác byte so với bản đang chạy (hoặc kích hoạt bởi `registration.update()` khi bấm "Kiểm tra cập nhật").
   - Worker mới được tải về và chạy sự kiện `install`. Các tệp trong `__SW_MANIFEST` được tải ngầm vào cache precache mới.
2. **Waiting (Chờ kích hoạt):**
   - Do `skipWaiting: false` và `registerType: 'prompt'`, worker mới sau khi cài đặt xong **KHÔNG tự ý thay thế** worker hiện tại mà chuyển sang trạng thái `waiting`.
   - Worker cũ (`active`) tiếp tục kiểm soát phiên làm việc nhằm đảm bảo trải nghiệm giảng dạy không bị gián đoạn.
   - `workbox-window` thông báo trạng thái `needRefresh = true` tới component `PWAUpdateHandler.tsx`.
   - Giao diện hiển thị Toast thông báo: **"Có bản cập nhật mới — [Cập nhật ngay]"**.
3. **Activating (Kích hoạt):**
   - Khi người dùng bấm **"Cập nhật ngay"**, hàm `updateServiceWorker(true)` được thực thi:
     ```typescript
     // Gửi thông điệp SKIP_WAITING tới service worker đang ở trạng thái waiting
     waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
     ```
   - Worker đang chờ lập tức gọi `self.skipWaiting()` và chuyển sang trạng thái `activating`.
   - Tại sự kiện `activate`, `cleanupOutdatedCaches` tiến hành thanh lọc các chunk precache cũ.
4. **Activated & Controller Change (Điều khiển & Tải lại):**
   - Worker mới trở thành active worker.
   - Do `clientsClaim: false`, worker mới không chiếm quyền kiểm soát ngay lập tức của các client đang mở cho đến khi có sự kiện reload hoặc chuyển trang mới.
   - Đồng thời, listener `navigator.serviceWorker.addEventListener('controllerchange', ...)` do `virtual:pwa-register` thiết lập sẽ phát hiện controller đã thay đổi và kích hoạt lệnh `window.location.reload()`.

---

### 4.2 Kịch bản Kiểm thử Đa Tab Thực tế (Multi-Tab Verification Results)

Kịch bản kiểm thử tự động (xem `tests/release-validation/multi-tab-sw-update.test.ts`):
- **Tab A:** Mở `/today` (Đang xem lịch, kích hoạt bấm nút *"Cập nhật ngay"*).
- **Tab B:** Mở `/today` (Đang mở `NoteModal` soạn thảo ghi chú).
- **Tab C:** Mở `/statistics` (Đang xem thống kê tiến độ).

#### Kết quả Xác minh Kỹ thuật:
1. **Tab nào reload?**  
   Cả **Tab A, Tab B và Tab C** đều nhận được sự kiện trình duyệt `controllerchange` từ `navigator.serviceWorker` và đều thực hiện `window.location.reload()`.
2. **Có reload lặp hay không?**  
   **HOÀN TOÀN KHÔNG**. Sau khi reload, worker mới đã là controller chính thức. Trạng thái `registration.waiting` trở thành `null`, do đó không có sự kiện `waiting` nào được kích hoạt lại.
3. **Dữ liệu đã lưu có bị mất không?**  
   **KHÔNG BỊ MẤT**. Toàn bộ lịch giảng trong `localStorage['last_schedule_data']`, lịch sử trong `IndexedDB` (`TdyTimeDB`), và ghi chú đã lưu trong `localStorage['tdy_session_notes']` được khôi phục 100% khi ứng dụng khởi chạy lại sau reload (`initFromStorage()`).
4. **Có mất bản nháp ghi chú chưa lưu không? (Draft Loss Risk)**  
   **CÓ NGUY CƠ MẤT BẢN NHÁP**.  
   - Trong `NoteModal.tsx`, văn bản đang gõ được lưu trong React component state (`const [content, setContent] = useState('')`).
   - Khi Tab A bấm cập nhật, Tab B nhận lệnh reload đột ngột. Cây component React bị unmount, toàn bộ state `content` chưa bấm *"Lưu"* sẽ bị giải phóng khỏi bộ nhớ RAM.
   - Ghi chú cũ trước đó vẫn còn nguyên, nhưng các ký tự vừa gõ thêm sẽ bị mất.
5. **Có Race Condition giữa Save và Reload không?**  
   **KHÔNG CÓ RACE CONDITION KHI ĐÃ BẤM LƯU**.  
   - Store `useNotesStore` sử dụng middleware Zustand `persist`.
   - Khi người dùng click *"Lưu"*, hàm `setNote(sessionId, content)` ghi đồng bộ (synchronously) vào `window.localStorage.setItem('tdy_session_notes', ...)` ngay trong cùng tick xử lý sự kiện.
   - Vì thế, nếu người dùng đã kịp bấm *"Lưu"*, dữ liệu được đảm bảo an toàn tuyệt đối trước khi bất kỳ lệnh reload nào có thể chạy.

---

### 4.3 Đề xuất Giải pháp Xử lý Bản nháp (Least-Intrusive Proposals)

Nhằm triệt tiêu nguy cơ mất bản nháp khi có cập nhật đa tab mà không làm thay đổi luồng nghiệp vụ hiện tại:
1. **Lưu nháp tự động có Debounce (Khuyến nghị số 1):**  
   Lưu nội dung đang soạn thảo vào `sessionStorage` dưới khóa `tdy_draft_note_${sessionId}` sau mỗi 300ms ngừng gõ. Khi mở lại `NoteModal`, tự động phục hồi bản nháp nếu có.
2. **Cảnh báo trước khi tải lại (Pre-update dirty warning):**  
   Nếu phát hiện `NoteModal` đang mở và có `isDirty === true`, hiển thị thông báo yêu cầu người dùng xác nhận hoặc bấm *"Lưu"* trước khi tiến hành cập nhật.
3. **Tự động flush bản nháp khi nhận tín hiệu reload:**  
   Bắt sự kiện trước khi trang reload để tự động gọi `setNote(sessionId, content)` nếu modal đang mở.

---

## 5. Quy trình Khắc phục Sự cố Stale Cache theo 4 Cấp độ An toàn

Nếu ứng dụng gặp hiện tượng bộ nhớ đệm cũ (giao diện không cập nhật, tải chunk lỗi 404 sau đợt phát hành mới), hãy tuân thủ nghiêm ngặt 4 cấp độ sau:

```
[Level 1: An toàn tuyệt đối] -> [Level 2: Khắc phục trình duyệt] -> [Level 3: Xử lý kỹ thuật DevTools] -> [Level 4: Biện pháp cuối cùng (CẢNH BÁO MẤT DỮ LIỆU)]
```

---

### Level 1 — User-safe (Khuyến nghị chuẩn cho người dùng)
*Phù hợp cho: Giảng viên và người dùng thông thường. An toàn tuyệt đối, không mất bất kỳ dữ liệu nào.*

1. Mở ứng dụng TdyTime trên trình duyệt hoặc PWA.
2. Điều hướng đến tab **Cài đặt (Settings)** (biểu tượng bánh răng).
3. Tại nhóm **Thông tin ứng dụng (About)**, bấm nút **"Kiểm tra cập nhật"**.
4. Ứng dụng sẽ gọi `registration.update()` để kiểm tra phiên bản mới nhất từ máy chủ.
5. Khi Toast thông báo bản mới xuất hiện ở góc trên bên phải, **kiểm tra và lưu các ghi chú đang soạn dở** rồi bấm **"Cập nhật ngay"**.
6. Toàn bộ lịch (`IndexedDB`) và ghi chú (`localStorage`) được bảo toàn 100%.

---

### Level 2 — Browser troubleshooting (Xử lý sự cố trình duyệt cơ bản)
*Phù hợp cho: Khi Level 1 chưa nạp được mã nguồn mới do HTTP cache của trình duyệt.*

1. **Thực hiện Hard Reload (Tải lại cưỡng bức):**
   - **Windows / Linux:** Nhấn tổ hợp phím **`Ctrl + F5`** hoặc **`Ctrl + Shift + R`**.
   - **macOS (Chrome / Edge / Safari):** Nhấn tổ hợp phím **`Cmd + Shift + R`**.
2. **Đóng toàn bộ tab:** Đóng tất cả các tab TdyTime đang mở trong trình duyệt, sau đó mở lại một tab mới để đảm bảo Service Worker cũ giải phóng hoàn toàn và nhường quyền cho worker mới.
3. *Đánh giá an toàn:* Toàn bộ dữ liệu trong `IndexedDB` (`TdyTimeDB`) và `localStorage` tiếp tục được bảo toàn 100%.

---

### Level 3 — Technical recovery (Xử lý kỹ thuật có chọn lọc)
*Phù hợp cho: Kỹ thuật viên hoặc nhà phát triển gặp kẹt cache nhị phân trong DevTools mà không muốn mất dữ liệu người dùng.*

1. Mở trình duyệt trên máy tính, nhấn phím **`F12`** (hoặc click chuột phải chọn *Inspect / Kiểm tra*).
2. Chuyển sang tab **Application** (Ứng dụng).
3. Tại khung cây điều hướng bên trái:
   - Mục **Service Workers**: Nhấn vào nút **`Unregister`** bên cạnh Service Worker của TdyTime.
   - Mục **Cache Storage**: Mở rộng danh sách cache, nhấn chuột phải vào từng cache sau và chọn **Delete**:
     - `workbox-precache-v2-...`
     - `html-shell-cache`
     - `static-assets`
4. **KHÔNG** bấm nút *"Clear site data"* tại bước này.
5. Nhấn **`F5`** để tải lại trang. Trình duyệt sẽ tải bộ mã nguồn mới tinh từ server và đăng ký lại Service Worker.
6. *Đánh giá an toàn:* Lịch UMS và ghi chú trong `IndexedDB` & `localStorage` vẫn còn nguyên vẹn.

---

### Level 4 — Last resort (Biện pháp cưỡng bức cuối cùng — NGUY CƠ MẤT DỮ LIỆU)

> ⚠️ **CẢNH BÁO NGUY HIỂM VỀ MẤT DỮ LIỆU CỤC BỘ:**  
> Các thao tác ở Cấp độ 4 sẽ **XÓA SẠCH VĨNH VIỄN** toàn bộ lịch giảng đã import trong `IndexedDB` (`TdyTimeDB`) và toàn bộ ghi chú buổi học trong `localStorage` (`tdy_session_notes`, `last_schedule_data`).  
> 
> **ĐIỀU KIỆN AN TOÀN BẮT BUỘC TRƯỚC KHI THỰC HIỆN:**  
> 1. Người dùng phải còn lưu giữ tệp gốc HTML Thời khóa biểu UMS (hoặc file JSON sao lưu) trên máy tính/điện thoại để có thể import lại.  
> 2. Người dùng nên vào màn hình **Học kỳ (Semester)** ⟶ Bấm nút **Xuất CSV** để lưu trữ bảng phân công giảng dạy ra file Excel.  
> 3. Tuyệt đối **KHÔNG** thực hiện Level 4 nếu không có file gốc hoặc chưa ghi chép lại các ghi chú quan trọng.

#### Thao tác trên Desktop (Chrome / Edge / Firefox):
1. Mở DevTools (`F12`) ⟶ Tab **Application** ⟶ Mục **Storage**.
2. Nhấn nút **Clear site data**.

#### Thao tác trên Android (Google Chrome Mobile):
1. Mở Chrome trên điện thoại ⟶ Bấm menu **3 chấm** ⟶ **Cài đặt (Settings)**.
2. Chọn **Cài đặt trang web (Site settings)** ⟶ **Dữ liệu được lưu trữ (Data stored)**.
3. Tìm tên miền TdyTime ⟶ Bấm **Xóa dữ liệu (Clear data)**.  
   *(Thao tác này xóa toàn bộ IndexedDB và localStorage của trang web trên Android).*

#### Thao tác trên iOS (Safari / PWA Standalone):
1. Thoát hẳn ứng dụng TdyTime (vuốt từ cạnh dưới màn hình lên và gạt app ra khỏi bộ nhớ đa nhiệm).
2. Mở ứng dụng **Cài đặt (Settings)** của iPhone/iPad ⟶ Chọn **Safari**.
3. Cuộn xuống chọn **Nâng cao (Advanced)** ⟶ **Dữ liệu trang web (Website Data)**.
4. Tìm tên miền TdyTime và chọn **Xóa (Delete)**.  
   *(Dữ liệu LocalStorage/IndexedDB của Safari cho tên miền này sẽ bị xóa hoàn toàn).*

---

## 6. Tính năng Sao lưu & Khôi phục Toàn diện (Full Backup & Atomic Restore)

Dựa trên kết quả triển khai và kiểm thử thực tế (xem `tests/release-validation/full-backup-restore.test.ts`, `full-backup-report.json`, và `full-restore-report.json`):

Ứng dụng hiện cung cấp thẻ **Sao lưu & Khôi phục dữ liệu** (`src/views/settings/BackupRestoreCard.tsx`) ngay trên màn hình Cài đặt, giải quyết triệt để rủi ro mất dữ liệu trước khi xóa cache hoặc cài đặt lại thiết bị:

| Hạng mục Dữ liệu | Khả năng Xuất dữ liệu (Export) | Khả năng Nhập lại (Import / Restore) | Tính toàn vẹn Unicode tiếng Việt | Trạng thái Thực tế |
| :--- | :--- | :--- | :---: | :--- |
| **Toàn bộ Dữ liệu Người dùng (Unified Backup)** | **Xuất 1-Click ra tệp `.json` duy nhất** (`tdytime-backup-YYYY-MM-DD.json`) đóng gói toàn bộ 5 nhóm dữ liệu: Lịch hiện tại, Lịch sử timetable, Ghi chú, Từ điển viết tắt, Cài đặt giao diện | **Khôi phục Nguyên tử (Atomic Restore)** kèm modal đối soát tóm tắt nội dung file sao lưu và cơ chế tự động Rollback nếu có lỗi | **100% PASS** | 🟢 **ĐÃ TRIỂN KHAI HOÀN CHỈNH (PASS)** |
| **Lịch đang hoạt động (Active Schedule)** | - **Xuất JSON:** Tích hợp trong Full Backup<br>- **Xuất CSV:** Chuẩn UTF-8 BOM cho Excel<br>- **Xuất PDF:** Font Roboto tiếng Việt | Kéo thả/chọn file `.json` hoặc file `.html` UMS tại WelcomeView hoặc qua nút Khôi phục trong Settings | **100% PASS** | 🟢 **PASS** |
| **Lịch sử Lịch giảng (Timetable History)** | Tự động đóng gói toàn bộ danh sách lịch sử từ `IndexedDB` (`TdyTimeDB`) vào file backup | Khôi phục nguyên vẹn vào `IndexedDB` (`TdyTimeDB`) khi restore | **100% PASS** | 🟢 **PASS** |
| **Ghi chú Buổi học (`tdy_session_notes`)** | Tự động đóng gói toàn bộ ghi chú từ `localStorage` vào file backup | Khôi phục nguyên vẹn vào `localStorage` và đồng bộ store Zustand | **100% PASS** | 🟢 **PASS** |
| **Từ điển Viết tắt (`global_abbreviations`)** | Tự động đóng gói toàn bộ danh mục viết tắt vào file backup | Khôi phục nguyên vẹn vào `localStorage` và đồng bộ store | **100% PASS** | 🟢 **PASS** |

---

## 7. Ma trận Bảo toàn Dữ liệu (Data Preservation Verification Matrix)

Bảng đối chiếu tác động của từng hành động kỹ thuật lên các tầng dữ liệu:

| Thao tác thực hiện | App Shell Precache | Runtime Cache (`html-shell`, `static-assets`) | Lịch sử Lịch giảng (`IndexedDB: TdyTimeDB`) | Lịch hiện tại & Từ điển (`localStorage`) | Ghi chú ĐÃ LƯU (`tdy_session_notes`) | Bản nháp ĐANG GÕ (`sessionStorage Draft`) | Đánh giá An toàn |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1. Cập nhật SW qua UI Toast** | Cũ xóa, Mới nạp | Giữ nguyên / Nạp mới khi cần | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** *(Tự động flush vào sessionStorage)* | 🟢 **User-safe Tuyệt đối** |
| **2. Reload / Hard Reload (Ctrl+F5)** | Giữ nguyên | Giữ nguyên | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** *(Khôi phục khi mở lại modal)* | 🟢 **User-safe** |
| **3. Unregister Service Worker** | Giữ nguyên (chờ xóa) | Giữ nguyên | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | 🟡 **An toàn dữ liệu** (cần nạp lại mạng) |
| **4. Xóa riêng Cache Storage** | Bị xóa (tải lại từ mạng) | Bị xóa (tải lại từ mạng) | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | **BẢO TOÀN 100%** | 🟡 **An toàn dữ liệu** (yêu cầu DevTools) |
| **5. Clear Site Data / Reset trình duyệt** | Bị xóa | Bị xóa | ❌ **BỊ XÓA** *(Có thể khôi phục bằng file Backup)* | ❌ **BỊ XÓA** *(Có thể khôi phục bằng file Backup)* | ❌ **BỊ XÓA** *(Có thể khôi phục bằng file Backup)* | ❌ **BỊ XÓA** | 🔴 **Nguy cơ cao** (Bắt buộc bấm Sao lưu dữ liệu trước khi thực hiện) |

---

## 8. Bảng Trạng thái Xác minh Kỹ thuật (Verification Status Table)

| Hạng mục kiểm tra | Phương pháp xác minh | Trạng thái | Bằng chứng / File mã nguồn |
| :--- | :--- | :---: | :--- |
| Khóa phiên bản `vite-plugin-pwa@^2.0.0` | Đối chiếu file cấu hình | **PASS** | `package.json` định nghĩa `"vite-plugin-pwa": "^2.0.0"` |
| Cập nhật Service Worker đa tab | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/multi-tab-sw-update.test.ts` (Scenario 1 & 2) |
| Tránh lặp vô hạn reload | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/multi-tab-sw-update.test.ts` (Scenario 1) |
| Bảo vệ bản nháp tự động (Auto-Draft) | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/auto-draft.test.ts` (7/7 tests passed); `src/core/notes/draft.service.ts` |
| Synchronous Flush nháp trước khi reload | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/auto-draft.test.ts` (Test 7); `src/app/PWAUpdateHandler.tsx` |
| Tính năng Xuất sao lưu tổng hợp 1-Click | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/full-backup-restore.test.ts` (Test 1); `src/views/settings/BackupRestoreCard.tsx` |
| Tính năng Khôi phục Nguyên tử có Rollback | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/full-backup-restore.test.ts` (Test 4 & 5); `src/core/backup/backup.service.ts` |
| Tương thích ngược với file ScheduleData cũ | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/full-backup-restore.test.ts` (Test 3) |
| Từ chối tệp rỗng và JSON sai cấu trúc | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/full-backup-restore.test.ts` (Test 2) |
| Xuất CSV có UTF-8 BOM chuẩn Excel | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/backup-restore.test.ts` (Test 3) |
| Lưu trữ và phục hồi ghi chú Unicode | Kiểm thử tự động Vitest | **PASS** | `tests/release-validation/backup-restore.test.ts` (Test 5) |
| Thao tác xóa dữ liệu trên thiết bị di động thực tế | Hướng dẫn vận hành hệ điều hành | **Operational Guidance** | Phụ thuộc vào giao diện từng phiên bản Android/iOS cụ thể |
| Cử chỉ vuốt tắt app đa nhiệm trên iOS | Hướng dẫn vận hành người dùng | **Operational Guidance** | Thao tác cử chỉ phần cứng iOS; không thể chạy tự động trong môi trường container CI |
