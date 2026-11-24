# TdyTime Design DNA — Compact Academic Utility

Tài liệu này định nghĩa bản sắc thiết kế cốt lõi (**Design DNA**) và các nguyên tắc thiết kế thị giác của **TdyTime (`v2026.11.24`)**, được đúc kết từ bằng chứng triển khai thực tế trong codebase.

---

## 1. Nguyên tắc Nền tảng của Hệ thống Thiết kế

> **Foundational Rule**: *Design System phải phản ánh chính xác sản phẩm đang vận hành, không phải một hình mẫu lý tưởng được mô tả trong tài liệu. Không duy trì token, component, pattern hoặc quy tắc nếu chúng không có giá trị sử dụng thực tế. Mọi quy chuẩn bắt buộc phải có bằng chứng triển khai hoặc cơ chế kiểm chứng tương ứng.*

---

## 2. Định danh Bản sắc: Compact Academic Utility

TdyTime là một ứng dụng tiện ích học thuật chuyên biệt phục vụ giảng viên và sinh viên theo dõi lịch giảng dạy, lịch coi thi và thống kê tiến độ học kỳ. Bản sắc thiết kế của TdyTime được định danh là **Compact Academic Utility** với 8 đặc trưng cốt lõi:

1. **Information-first (Thông tin là trung tâm)**:
   - Mọi màn hình ưu tiên hiển thị trực diện chuỗi thông tin nghiệp vụ quan trọng nhất: *Tiết học / Khung giờ → Phòng học → Tên học phần → Lớp / Nhóm → Giảng viên*.
2. **Compact but readable (Gọn gàng nhưng dễ đọc)**:
   - Tối ưu mật độ hiển thị trên màn hình di động (`360px–430px`) và màn hình máy tính qua bán kính bo góc vừa phải (`6px–12px`), khoảng đệm hợp lý (`p-3.5` đến `p-5`) và phân cấp cỡ chữ rõ ràng.
3. **Flat and structured surfaces (Bề mặt phẳng có cấu trúc)**:
   - Sử dụng bề mặt thẻ phẳng (`bg-white dark:bg-slate-900`) kết hợp đường viền mảnh `1px` (`border-slate-100 dark:border-slate-800` hoặc `border-slate-200/80`) và bóng đổ nhẹ một tầng (`--shadow-card`). Không lạm dụng hiệu ứng kính mờ (heavy glassmorphism) hay đổ bóng nhiều lớp trên các thẻ dữ liệu lặp lại.
4. **Clear typographic hierarchy (Phân cấp chữ rõ ràng)**:
   - Kết hợp `Be Vietnam Pro` (`--font-body`) cho văn bản học thuật tiếng Việt có dấu phức tạp và `Montserrat` (`--font-heading`, `--font-num` kèm `tabular-nums`) cho tiêu đề và toàn bộ dữ liệu số.
5. **Stable semantic color language (Ngôn ngữ màu ngữ nghĩa ổn định)**:
   - Tách bạch rõ ràng giữa màu cá nhân hóa giao diện (**7 Accent Themes**) với màu trạng thái hệ thống (**Status Colors**: Success, Warning, Danger, Info) và màu nghiệp vụ thời khóa biểu (**Domain Colors**: Sáng, Chiều, Tối, Lý thuyết, Thực hành). Khi người dùng đổi chủ đề giao diện, ý nghĩa màu của các ca học và cảnh báo vẫn giữ nguyên tính ổn định.
6. **Consistent component behavior (Hành vi component nhất quán)**:
   - Các thành phần cơ bản (`Button`, `Card`, `Badge`, `TypeBadge`, `ConfirmModal`, `SessionCard`) có API gọn nhẹ, phản hồi xúc giác đồng nhất và đạt chuẩn tương phản trên mọi chủ đề.
7. **Responsive by task, not merely screen size (Thích ứng theo tác vụ)**:
   - Không chỉ co giãn kích thước theo màn hình mà chuyển đổi cấu trúc trình bày theo ngữ cảnh sử dụng: trên Desktop dùng bảng ma trận 7 ngày (`WeekTableLayout`) để đối chiếu toàn tuần; trên Mobile chuyển sang danh sách thẻ dọc theo ngày/buổi (`WeekCardLayout`) để cuộn nhanh bằng một ngón tay cái.
8. **Minimal decorative effects (Tối giản hiệu ứng trang trí)**:
   - Chuyển động và hiệu ứng thị giác chỉ phục vụ mục đích phản hồi trạng thái (như thanh tiến độ tiết đang giảng, shimmer khi đang tải, hoặc viền cảnh báo trùng lịch).

---

## 3. Phân tách Nguyên tắc Thiết kế Thị giác & Kiến trúc Sản phẩm

Để tránh pha trộn giữa quy chuẩn giao diện và kiến trúc kỹ thuật, các nguyên tắc của TdyTime được phân định rõ ràng:

### 3.1. Nguyên tắc Thiết kế Thị giác & UX (Thuộc Design System)

| Nguyên tắc | Cấp độ | Quy định & Phạm vi áp dụng |
| :--- | :---: | :--- |
| **1. WCAG 2.2 AA Action Contrast** | **Mandatory** | Mọi nút hành động chính (`Button` primary) và ô tiêu đề ngày hiện tại phải sử dụng token `--accent-action-bg` / `--accent-on-action`, đảm bảo độ tương phản `>= 4.5:1` trên toàn bộ 7 Accent Themes. |
| **2. Single-Elevation Flat Hierarchy** | **Mandatory** | Thẻ nội dung (`Card`, `SessionCard`) chỉ dùng một lớp nền đặc kèm viền `1px` và `--shadow-card`. Chỉ dùng `backdrop-blur-md` cho thanh điều hướng nổi (`AppLayout`) và lớp phủ hộp thoại (`ConfirmModal`). |
| **3. Tabular Numerals for Temporal & Quantitative Data** | **Mandatory** | Toàn bộ khung giờ (`07:00 - 09:30`), số tiết, bộ đếm ngược, phần trăm tiến độ và bảng số liệu phải áp dụng lớp `.font-num` (`font-variant-numeric: tabular-nums`). |
| **4. Safe Destructive Actions** | **Mandatory** | Các thao tác xóa lịch, đặt lại cài đặt hoặc xóa bộ nhớ đệm PWA bắt buộc đi qua bước xác nhận rõ ràng (`ConfirmModal` hoặc nút xác nhận 2 bước có bộ đếm tự hủy). |
| **5. Scoped Progressive Disclosure (Segmented Focus & Bento)** | **Recommended Pattern** | Sử dụng thanh chuyển đổi phân đoạn (`Segmented Tabs`) hoặc lưới Bento cho các màn hình tổng hợp nhiều nhóm thông tin như `StatisticsView` và `SettingsView`. **Không** ép buộc mọi màn hình đơn nhiệm phải chia thành 3 tab. |
| **6. Mobile Scannability & Touch Targets** | **Mandatory** | Các nút điều khiển tương tác chính trên di động phải đảm bảo vùng chạm tối thiểu `44×44px` (`h-11` / `min-h-[44px]`) và `touch-action: manipulation`. |

### 3.2. Nguyên tắc Sản phẩm & Kiến trúc Kỹ thuật (Tham chiếu `ARCHITECTURE.md`)

Các nguyên tắc kỹ thuật sau đây hỗ trợ trải nghiệm người dùng nhưng được quản lý và kiểm chứng trong [`ARCHITECTURE.md`](../../ARCHITECTURE.md):
- **Core Offline-First Functionality**: Toàn bộ luồng nghiệp vụ cốt lõi (đọc lịch HTML/JSON, xem lịch Hôm nay/Tuần/Học kỳ, Lịch coi thi, Thống kê, Sao lưu/Khôi phục) và 100% bundle JS/CSS được precache bởi Service Worker để hoạt động ngoại tuyến hoàn toàn. Các tài nguyên bên ngoài như Google Fonts trong `index.html` được nạp bất đồng bộ (progressive enhancement) và luôn có chuỗi font hệ thống dự phòng (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Enforced Atomic Zustand Selectors**: Ngăn chặn re-render dây chuyền qua `createAtomicStore`.
- **No Barrel Imports on Critical Startup Path**: Giữ entry chunk siêu nhẹ bằng cách import trực tiếp module trong `main.tsx`, `App.tsx`, `router.tsx`, `AppLayout.tsx`.
