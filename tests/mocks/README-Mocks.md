# Lịch Giảng Assets

Lưu trữ lịch giảng gốc và các phiên bản đã ẩn danh/tối giản để phát triển parser.

## Danh Sách File

| Tên File | Dung Lượng | Tính Chất | Mô Tả & Mục Đích |
| :--- | :---: | :---: | :--- |
| **`pdtduy-lich-giang-hk2-20252026--20260526-1415.html`** | ~157 KB | Gốc | Lịch gốc, còn thông tin cá nhân. **Cấm public.** |
| **`1_schedule_anon_full.html`** | ~156 KB | Ẩn danh | Giữ nguyên cấu trúc/giao diện web gốc. Test parser tích hợp. |
| **`2_schedule_anon_clean.html`** | ~138 KB | Ẩn danh | Xóa giao diện thừa (header, sidebar, footer). Giữ nguyên bảng lịch. |
| **`3_schedule_anon_ultra_clean.html`** | ~54 KB | Ẩn danh | Xóa thuộc tính popover Bootstrap (data-toggle...). Giữ data chính. |
| **`4_schedule_test_minimal.html`** | ~30 KB | Tối giản | Chỉ giữ lịch 3 nhóm chọn (`MHCĐO1052-LT.005`, `.002`, `MHCĐO1092.001`). |
| **`5_schedule_test_ultra_minimal.html`** | ~4.3 KB | Siêu tối giản | Chỉ giữ 1 nhóm ít giờ nhất (`MHCĐO1052-LT.005`). Style 1 dòng CSS. |

## Quy Tắc Ẩn Danh Hóa

* **Giảng viên:** Đổi thành `Giảng Viên A`, `B`, `C` nhất quán.
* **Mã lớp học phần:** Giữ nguyên để khớp logic parser thực tế.
* **Token / URL:** Thay thế bằng `MOCK_CSRF_TOKEN_2026` và `https://example.com/giangvien/`.
