# Design Principles — TdyTime

Bộ 7 nguyên tắc thiết kế dưới đây đóng vai trò là **Hiến pháp Thiết kế (Design Constitution)** của dự án TdyTime. Khi có bất kỳ sự đánh đổi nào giữa tính thẩm mỹ và công năng, thứ tự ưu tiên sẽ tuân theo đúng thứ tự từ 1 đến 7 dưới đây.

---

## 1. 100% Offline-First & Zero Network Dependency
- **Nguyên tắc**: Mọi màn hình, biểu đồ, bộ lọc và thao tác tùy chỉnh phải hoạt động tức thì ngay cả khi thiết bị ở chế độ Máy bay (Airplane Mode).
- **Biểu hiện trên UI**:
  - Không bao giờ khóa giao diện bằng màn hình chờ mạng.
  - Trạng thái mạng trong `SettingsView` được thông báo rõ ràng qua `Badge` (`Trực tuyến` hoặc `Ngoại tuyến (100% Offline Ready)`).
  - Các hành động quản trị hệ thống như **Xóa bộ nhớ đệm (Clear Cache)** phải bảo toàn 100% dữ liệu lịch giảng dạy trong `localStorage`/`IndexedDB`.

## 2. Mobile-First Speed (< 1-Second Information Scan)
- **Nguyên tắc**: Giảng viên thường mở ứng dụng trên điện thoại ngay trước giờ lên lớp hoặc khi đang di chuyển giữa các giảng đường. Họ phải tìm thấy **Phòng học**, **Khung giờ** và **Lớp học** trong vòng chưa đầy 1 giây.
- **Biểu hiện trên UI**:
  - Khung giờ (`07:00 - 09:35`) và Phòng học (`P.A201`) luôn được đặt ở vị trí ưu tiên cao nhất, sử dụng phông chữ `Montserrat` (`font-num`) đậm nét.
  - Các buổi học đã kết thúc trong ngày (`COMPLETED`) tự động được thu gọn xuống khu vực danh sách phụ có độ mờ giảm nhẹ (`opacity-75`, nền `bg-slate-50/80`), nhường toàn bộ không gian chính cho các buổi đang dạy (`LIVE`) hoặc sắp dạy (`PENDING`).

## 3. Single-Elevation Flat Hierarchy (Độ sâu Đơn tầng)
- **Nguyên tắc**: Tránh lồng ghép nhiều thẻ có viền và đổ bóng chồng chéo lên nhau ("Cards within Cards").
- **Biểu hiện trên UI**:
  - Mỗi màn hình chỉ có **1 cấp độ nổi (Single Elevation)** cho các thẻ chính (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm`).
  - Các nhóm dữ liệu bên trong một thẻ lớn (như 4 chỉ số `InsightCard` trong `StatisticsView`, hoặc danh sách tiết học trong `WeekCardLayout`) được phân tách bằng đường kẻ mảnh 1px (`divide-y divide-slate-100 dark:divide-slate-800`) hoặc nền xen kẽ (`bg-slate-50`), tuyệt đối không tạo thêm thẻ có bóng đổ bên trong thẻ cha.

## 4. Adaptive Semantic Harmony (Hài hòa Ngữ nghĩa Thích ứng)
- **Nguyên tắc**: Khi người dùng đổi màu chủ đề (`AccentTheme`), các màu ngữ nghĩa cố định (Ca Sáng/Chiều/Tối, Thành công, Cảnh báo, Nguy hiểm) không được phép chìm vào màu chủ đề.
- **Biểu hiện trên UI**:
  - Sử dụng cơ chế **Smart Semantic Shift** trong `tokens.css`: Ví dụ khi chọn chủ đề `themeBlue`, màu Ca Sáng tự động dịch chuyển sang dải `Cyan -> Teal`; khi chọn `themeRed`, màu Nguy hiểm (`danger`) tự động dịch sang `Rose -> Maroon`.
  - Không bao giờ truyền đạt trạng thái quan trọng chỉ bằng màu sắc đơn thuần: luôn đi kèm nhãn chữ (`Live`, `LT`, `TH`, `Đang thi`), số thứ tự hoặc biểu tượng rõ ràng.

## 5. Segmented Focus Over Infinite Scroll (Tập trung Phân đoạn)
- **Nguyên tắc**: Trên màn hình di động nhỏ, việc xếp chồng hàng chục bảng biểu và biểu đồ trên một trang cuộn dài vô tận gây mỏi mắt và tốn bộ nhớ DOM.
- **Biểu hiện trên UI**:
  - Áp dụng mô hình **3-Tab Segmented Focus** cho các trang phức tạp:
    - `StatisticsView`: `Tổng quan` | `Xu hướng` | `Lớp & Phòng`.
    - `SettingsView`: `Dữ liệu & PWA` | `Môn học` | `Thông tin`.
  - Các tab không hiển thị được tháo khỏi DOM (lazy-mounted), giúp thời gian phản hồi khi chuyển trang luôn ở mức tức thì.

## 6. Safe Destructive Actions (An toàn cho Thao tác Xóa/Đặt lại)
- **Nguyên tắc**: Dữ liệu lịch giảng và tên viết tắt môn học là tài sản cá nhân của người dùng. Mọi thao tác xóa hoặc ghi đè dữ liệu đều phải có cơ chế phòng ngừa bấm nhầm nhưng không gây phiền nhiễu.
- **Biểu hiện trên UI**:
  - **Inline 2-Step Confirmation**: Dùng cho các nút xóa nhanh như xóa mục lịch sử (`HistoryCard`), xóa bộ nhớ đệm (`SettingsView`), đặt lại dữ liệu (`DangerZoneCard`), hoặc nút xóa lịch thi (`ExamHeader`). Lần bấm đầu chuyển nút sang trạng thái cảnh báo đỏ (`Xác nhận?`), tự động hủy sau 3–4.5 giây nếu không bấm lần hai.
  - **Accessible Modal Confirmation (`ConfirmModal`)**: Dùng cho các quyết định quan trọng cần giải thích rõ hậu quả (như khôi phục bản sao lưu JSON hoặc xác nhận xóa toàn bộ lịch coi thi).

## 7. Zero Visual Clutter & Anti-Slop Discipline
- **Nguyên tắc**: Mọi điểm ảnh trên màn hình phải phục vụ trực tiếp cho nghiệp vụ quản lý lịch giảng dạy và coi thi.
- **Biểu hiện trên UI**:
  - Không có các nút trang trí vô dụng (như chuông thông báo giả, ô tìm kiếm không hoạt động).
  - Không dùng tiền tố giả lập trình (`//`, `>_`) hay watermark chữ mờ phía sau nội dung.
  - Mọi nút bấm, công tắc, bộ lọc đều kết nối trực tiếp vào Zustand Store và phản ánh kết quả ngay lập tức.
