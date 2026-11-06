# Hướng dẫn sử dụng Dữ liệu Giả lập (Mocks) & Bộ sinh Lịch HTML

Thư mục `tests/mocks/` chứa các file HTML lịch giảng dạy chuẩn UMS đã được đồng bộ về khung thời gian học kỳ hiện tại (**09/2026 – 12/2026**) cùng bộ công cụ sinh nhanh lịch HTML phục vụ kiểm thử thực tế.

## 1. Danh sách các kịch bản (Scenarios — Học kỳ 09/2026 đến 12/2026)

| Tên file | Khoảng thời gian | Mục đích kiểm thử |
| :--- | :--- | :--- |
| `1_schedule_anon_full.html` | `14/09/2026 – 13/12/2026` (10 tuần) | Dữ liệu thực tế đầy đủ đã ẩn danh, tuần hiện tại `02/11/2026 – 08/11/2026` nằm ở Tuần 5 với đầy đủ ca dạy Lý thuyết, Thực hành và Đồng giảng dạy. |
| `5_schedule_test_ultra_minimal.html` | `02/11/2026 – 15/11/2026` (2 tuần) | Kịch bản siêu tối giản (1 nhóm học phần duy nhất `MHCĐO1052-LT.005`), dùng để kiểm tra nhanh tiến độ tuần hiện tại. |
| `scenario-1-base.html` | `02/11/2026 – 08/11/2026` (1 tuần) | Kịch bản chuẩn cơ bản gồm 1 tuần lễ có cả lớp Lý thuyết (`-LT.`) và Thực hành (`-TH.`). |
| `scenario-2-empty.html` | `02/11/2026 – 15/11/2026` (2 tuần) | Kịch bản có 1 tuần trống hoàn toàn để kiểm thử tính năng tự động nhảy qua tuần trống. |

## 2. Bộ sinh nhanh Lịch giảng HTML chuẩn UMS (`generateMockScheduleHTML`)

Để thử khả năng nạp file HTML thực tế qua `parseScheduleHTML`:
- **Trong giao diện DevTools (`/dev` ⟶ Schedule Builder):**
  - Chọn số tuần (`1 tuần`, `3 tuần`, `10 tuần (09–12/2026)`, `15 tuần (Full HK)`).
  - Nhấn **Load HTML** để sinh chuỗi HTML chuẩn UMS và nạp trực tiếp qua `parseScheduleHTML`.
  - Nhấn **Export .HTML** để tải xuống file `.html` chuẩn UMS và thử kéo-thả vào màn hình Upload.
- **Trong Unit Test (`tests/mocks/htmlScheduleBuilder.test.ts`):**
  - Sử dụng `generateMockScheduleHTML(config)` hoặc `serializeScheduleToUMSHTML(data)` từ `src/utils/mockGenerator.ts`.
  - Chạy kiểm thử: `npx vitest run tests/mocks/htmlScheduleBuilder.test.ts`.
