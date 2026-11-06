# TdyTime — Production Rollback & Disaster Recovery Plan

**Target Release:** `v2026.11.05`  
**Previous Stable Release:** `v2026.09.15`  
**Author:** Staff Software Engineer & Release Manager  

---

## 1. Triggers for Rollback (Điều kiện kích hoạt hoàn nguyên)

Quy trình Rollback sẽ được kích hoạt ngay lập tức nếu xảy ra một trong các sự cố sau sau khi phát hành:
1. **Mất dữ liệu người dùng (P0 Data Loss):** Người dùng bị xóa mất lịch giảng, ghi chú hoặc từ điển viết tắt sau khi Service Worker cập nhật.
2. **Lỗi chặn truy cập (P0 White Screen of Death):** Trình duyệt không thể nạp bundle chính do lỗi syntax, chunk mismatch hoặc lỗi tương thích Service Worker.
3. **Lỗi nghiêm trọng tính toán giờ giảng (P1 Logic Regression):** Tổng số tiết, ca giảng hoặc thống kê hoàn thành sai lệch hàng loạt so với lịch thực tế.

---

## 2. Chiến lược Bảo vệ Dữ liệu Cục bộ (Local Data Isolation)

Ứng dụng **TdyTime** áp dụng kiến trúc **Local-First**, nghĩa là dữ liệu lịch giảng, ghi chú và cài đặt được lưu trữ trực tiếp trên thiết bị của người dùng:
- `localStorage['last_schedule_data']`: Dữ liệu lịch hiện tại.
- `localStorage['tdy_session_notes']`: Ghi chú từng buổi giảng.
- `localStorage['global_abbreviations']`: Danh mục viết tắt.
- `IndexedDB ['tdytime_db']['schedule_v2']`: Lịch sử toàn bộ các file lịch từng import.

**Quan trọng:** Quá trình Rollback mã nguồn web (HTML/JS/CSS) trên hosting CDN **HOÀN TOÀN KHÔNG làm ảnh hưởng đến localStorage hay IndexedDB** của người dùng, vì dữ liệu nằm độc lập ở client.

---

## 3. Quy trình Rollback Chi tiết (Step-by-Step Procedure)

### Bước 1: Rollback CDN / Hosting Assets
1. Nếu triển khai qua Git / Vercel / Cloudflare Pages / GitHub Pages:
   ```bash
   # Re-deploy bản build của tag ổn định trước đó
   git checkout v2026.09.15
   npm run build
   # Deploy thư mục dist/ cũ lên CDN
   ```
2. Nếu dùng hệ thống hosting tự động (Vercel / Netlify):
   - Vào dashboard điều khiển, chọn deployment của commit `v2026.09.15` và bấm **"Instant Rollback"** (thao tác dưới 30 giây).

### Bước 2: Vô hiệu hóa Service Worker lỗi (Nếu Service Worker là nguyên nhân)
1. Tải lên `sw.js` phiên bản tự sát (Self-Destroying Service Worker):
   ```javascript
   self.addEventListener('install', () => {
     self.skipWaiting();
   });
   self.addEventListener('activate', () => {
     self.registration.unregister().then(() => {
       self.clients.matchAll().then((clients) => {
         clients.forEach((client) => client.navigate(client.url));
       });
     });
   });
   ```
2. Thiết lập header HTTP cho `sw.js` trên máy chủ:
   `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`

### Bước 3: Xác minh phục hồi dữ liệu người dùng
1. Mở ứng dụng trên trình duyệt đã cache bản lỗi.
2. Kiểm tra `localStorage['last_schedule_data']` và `tdy_session_notes`.
3. Xác nhận giao diện hiển thị lại bình thường từ IndexedDB lịch sử `schedule_v2`.

---

## 4. Kế hoạch Khôi phục Dữ liệu (Data Recovery Strategy)

1. **Khôi phục từ IndexedDB:** Nếu một phiên bản cập nhật làm hỏng cấu trúc tạm trong `localStorage`, hàm `historyService.getAll()` trong `src/core/schedule/history.service.ts` luôn cho phép người dùng click tải lại file lịch giảng gốc từ danh sách lịch sử tại màn hình Welcome.
2. **Khôi phục từ file xuất JSON:** Tính năng sao lưu cấu hình và xuất file JSON trong `DevToolsView` cho phép nạp lại nguyên trạng toàn bộ lịch và ghi chú bất cứ lúc nào.

---

## 5. Danh mục Sự cố Đã biết (Known Issues Register)

| Mã | Mô tả sự cố | Mức độ | Trạng thái | Giải pháp giảm thiểu |
| :--- | :--- | :---: | :---: | :--- |
| **KI-01** | Trình duyệt cũ không hỗ trợ IndexedDB (Safari < 14 Private Browsing) | Low | Mitigated | Hệ thống tự động fallback về `localStorage` (`last_schedule_data`). |
| **KI-02** | File lịch HTML từ UMS có cấu trúc rỗng (0 tuần) | Low | Handled | Parser ném ngoại lệ rõ ràng `upload.errors.parseWeekNotFound` và hiển thị Toast thông báo đỏ, không làm crash ứng dụng. |
| **KI-03** | Dung lượng file upload vượt quá 2MB | Low | Prevented | `WelcomeView` tự động chặn trước khi nạp vào bộ nhớ để chống tràn RAM trên điện thoại. |
