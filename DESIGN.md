# TdyTime Design & Architecture Entry Point

Tài liệu này là **cổng điều hướng gốc (Root Entry Point)** cho nhà phát triển và AI coding agents làm việc trên **TdyTime** (`v2026.11.24`).

Để đảm bảo không trùng lặp quy chuẩn giữa các tài liệu, hệ thống tài liệu của TdyTime được phân quyền thành **2 nguồn chuẩn (Canonical Sources)** độc lập và kiểm chứng trực tiếp bằng CI:

1. **Canonical Design System Index (`docs/design-system/README.md`)**: Nguồn chuẩn duy nhất (SSOT) cho **Design DNA (`Compact Academic Utility`)**, Design Tokens, Component Specifications, Layout/Responsive và Accessibility.
2. **Technical Architecture (`ARCHITECTURE.md`)**: Nguồn chuẩn duy nhất cho kiến trúc kỹ thuật, Offline-First Service Worker, Enforced Atomic Zustand Stores, Bundle Splitting và Performance Guardrails.

---

## 🎯 Định danh Thiết kế: Compact Academic Utility

TdyTime mang bản sắc **Compact Academic Utility** — giao diện công cụ lịch giảng dạy và coi thi học thuật mật độ cao, tối ưu tốc độ quét thông tin:

- **Information-first**: Ưu tiên hiển thị tức thì *Tiết học → Thời gian → Phòng học → Môn học → Giảng viên*.
- **Compact but readable**: Bán kính bo góc theo chức năng (`--radius-badge: 6px`, `--radius-control: 8px`, `--radius-card: 10px`, `--radius-dialog: 12px`). Nội dung đọc thường xuyên `>= 12px`; micro-badges ngắn (`LT`, `TH`, `LIVE`) dùng `9px–10px` in hoa.
- **Flat and structured surfaces**: Bề mặt phẳng một lớp (`Card`), phân tách bằng viền mảnh `1px` và bóng đổ tinh tế (`--shadow-card`).
- **Clear typographic hierarchy**: `Be Vietnam Pro` (`--font-body`) cho văn bản tiếng Việt + `Montserrat` (`--font-heading`, `--font-num` kèm `tabular-nums`) cho tiêu đề và toàn bộ con số thời gian/thống kê.
- **Three-Tier Color Architecture**:
  - **A. Accent Colors (7 Themes)**: Cá nhân hóa giao diện kèm bộ token tương phản hành động chính (`--accent-action-bg`, `--accent-action-hover`, `--accent-on-action`) đạt chuẩn **WCAG 2.2 AA (`>= 4.5:1`)** trên cả 7 chủ đề.
  - **B. Status Colors (Fixed)**: `Success`, `Warning`, `Danger`, `Info` giữ nguyên sắc độ ngữ nghĩa trên mọi theme.
  - **C. Domain Colors (Fixed)**: Ca học `Morning` (Cyan), `Afternoon` (Orange), `Evening` (Indigo) và loại học phần `LT`/`TH` giữ nguyên ngôn ngữ nghiệp vụ trên mọi theme.

> **Nguyên tắc nền tảng**: *Design System phải phản ánh chính xác sản phẩm đang vận hành, không phải một hình mẫu lý tưởng được mô tả trong tài liệu. Không duy trì token, component, pattern hoặc quy tắc nếu chúng không có giá trị sử dụng thực tế. Mọi quy chuẩn bắt buộc phải có bằng chứng triển khai hoặc cơ chế kiểm chứng tương ứng.*

---

## 📚 Bản đồ Tài liệu Chuẩn (`docs/design-system/`)

| Tài liệu | Vai trò trong SSOT |
| :--- | :--- |
| **[`docs/design-system/README.md`](./docs/design-system/README.md)** | **Canonical Design System Index** — Cổng điều hướng chính thức của Design System. |
| **[`docs/design-system/DESIGN_DNA.md`](./docs/design-system/DESIGN_DNA.md)** | Bản sắc **Compact Academic Utility** và các nguyên tắc thiết kế thị giác bắt buộc. |
| **[`docs/design-system/DESIGN_TOKENS.md`](./docs/design-system/DESIGN_TOKENS.md)** | Giá trị thiết kế chuẩn: 3 tầng màu sắc, WCAG AA action tokens, typography, semantic radii, shadows. |
| **[`docs/design-system/COMPONENT_GUIDELINES.md`](./docs/design-system/COMPONENT_GUIDELINES.md)** | Đặc tả chính xác theo code cho `Button`, `Card`, `Badge`, `TypeBadge`, `Skeleton`, `ConfirmModal`, `SessionCard` & DO/DON'T. |
| **[`docs/design-system/LAYOUT_AND_RESPONSIVE.md`](./docs/design-system/LAYOUT_AND_RESPONSIVE.md)** | Cấu trúc App Shell, thích ứng theo tác vụ (`WeekTableLayout` ↔ `WeekCardLayout`), và phạm vi áp dụng Bento / 3-Tab. |
| **[`docs/design-system/INTERACTION_AND_ACCESSIBILITY.md`](./docs/design-system/INTERACTION_AND_ACCESSIBILITY.md)** | Trạng thái tương tác, motion budget, xác nhận 2 bước, điều hướng bàn phím và kiểm chứng WCAG 2.2 AA. |
| **[`docs/design-system/DESIGN_AUDIT_REPORT.md`](./docs/design-system/DESIGN_AUDIT_REPORT.md)** | Báo cáo kiểm toán tính toàn vẹn, lịch sử chuẩn hóa 3 đợt (P0/P1/P2) và Checklist tuân thủ. |
| **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** | Kiến trúc kỹ thuật: Offline-First PWA, Atomic Zustand Stores, No-Barrel Startup Guardrails. |

---

## 🛡️ Kiểm chứng Tự động (CI Quality Gate)

Mọi thay đổi đối với token, component hoặc tài liệu phải vượt qua bộ kiểm tra toàn vẹn được tích hợp trong GitHub Actions (`.github/workflows/ci.yml`):

```bash
npm run check:design-system
npm test -- src/core/themes/designSystem.test.ts
```

*Cập nhật lần cuối: 24/11/2026 (`v2026.11.24`)*
