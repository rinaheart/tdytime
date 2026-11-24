# TdyTime Design System & Guidelines (SSOT)

Tài liệu này là cổng truy cập trung tâm cho toàn bộ hệ thống **Design DNA, Design Tokens, Component Standards và Compliance Mechanisms** của dự án **TdyTime (`v2026.11.24`)**.

Mục tiêu của hệ thống này là bảo toàn nguyên vẹn bản sắc thiết kế đã được định hình trong codebase (**TdyTripZ Compact Flat Architecture**), đồng thời chuẩn hóa các điểm lệch lạc và thiết lập rào chắn tự động (Automated Guardrails) cho mọi nhà phát triển và AI Agent trong tương lai.

---

## 📚 Cấu trúc Tài liệu (Documentation Map)

| Tài liệu | Mục đích & Nội dung cốt lõi |
| :--- | :--- |
| **[`DESIGN_DNA.md`](./DESIGN_DNA.md)** | **Bộ gen thiết kế cốt lõi**: Triết lý thị giác, ngôn ngữ hình khối TdyTripZ, mật độ thông tin, hệ neo thị giác (Visual Anchors) và kiến trúc hiệu năng giao diện. |
| **[`DESIGN_PRINCIPLES.md`](./DESIGN_PRINCIPLES.md)** | **Nguyên tắc thiết kế & Kiến trúc**: 7 trụ cột chi phối mọi quyết định UI/UX từ Offline-First, Mobile-First Speed (<1s scan) đến Zero-Render-Blocking. |
| **[`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md)** | **Hệ thống Design Tokens**: Toàn bộ CSS Custom Properties (`--accent-*`, `--semantic-*`, `--radius-*`, `--shadow-*`), Tailwind v4 `@theme` mapping và quy chuẩn Z-Index. |
| **[`COLOR_SYSTEM.md`](./COLOR_SYSTEM.md)** | **Hệ thống Màu sắc**: 7 chủ đề màu nhấn (`AccentTheme`), Smart Adaptive Semantic Gradients (chống xung đột màu ca học/trạng thái) và kiến trúc Dual-Theme (Light/Dark). |
| **[`TYPOGRAPHY.md`](./TYPOGRAPHY.md)** | **Hệ thống Chữ viết**: Sự kết hợp giữa `Be Vietnam Pro` (nội dung tiếng Việt), `Montserrat` (tiêu đề & số liệu `tabular-nums`) và thang đo kích thước/độ đậm. |
| **[`SPACING_AND_LAYOUT.md`](./SPACING_AND_LAYOUT.md)** | **Bố cục & Khoảng cách**: App Shell, hệ lưới Bento, quy tắc đệm (Padding/Gap), Safe Area PWA và hệ thống đường viền 1px. |
| **[`COMPONENT_GUIDELINES.md`](./COMPONENT_GUIDELINES.md)** | **Quy chuẩn Component**: Đặc tả kỹ thuật cho Primitives (`Button`, `Badge`, `Card`, `ConfirmModal`, `Skeleton`, `Toast`), Composites (`FilterBar`, `EmptyState`, `ThemePicker`, `TypeBadge`) và Views (`SessionCard`, `ExamRow`). |
| **[`INTERACTION_AND_MOTION.md`](./INTERACTION_AND_MOTION.md)** | **Tương tác & Chuyển động**: Ngân sách độ trễ (<100ms feedback, 200ms–300ms transition), micro-interactions (`active:scale-[0.97]`), xác nhận 2 bước và `prefers-reduced-motion`. |
| **[`RESPONSIVE_GUIDELINES.md`](./RESPONSIVE_GUIDELINES.md)** | **Thiết kế Đáp ứng**: Chiến lược Mobile-First (`390px` baseline), chuyển đổi bố cục tự động (BottomNav ↔ Sidebar, Card ↔ Table, 3-Tab Segmented Focus). |
| **[`ACCESSIBILITY.md`](./ACCESSIBILITY.md)** | **Khả năng Tiếp cận (A11y)**: Chuẩn WCAG AA, vùng chạm tối thiểu `44×44px` trên di động, điều hướng bàn phím WAI-ARIA (`tablist`, `alertdialog`, Focus Trap). |
| **[`DO_AND_DONT.md`](./DO_AND_DONT.md)** | **Quy tắc Thực hành (Mandatory vs. Forbidden)**: Các mẫu code chuẩn (`DO`) và các lỗi vi phạm DNA nghiêm trọng (`DON'T`) kèm ví dụ trực quan. |
| **[`DESIGN_AUDIT_REPORT.md`](./DESIGN_AUDIT_REPORT.md)** | **Báo cáo Kiểm toán & Chuẩn hóa**: Kết quả kiểm toán toàn diện codebase, danh sách các điểm bất nhất đã phát hiện, kế hoạch chuẩn hóa, báo cáo thực thi và Checklist tuân thủ. |

---

## 🛠️ Cơ chế Kiểm soát Tự động (Automated Compliance)

Hệ thống thiết kế không chỉ nằm trên giấy mà được thực thi trực tiếp trong quy trình kiểm thử và build:

1. **Automated Design System Audit Script**:
   ```bash
   node scripts/check-design-system.mjs --dry-run
   ```
   Kiểm tra tính đồng bộ của Design Tokens giữa `src/styles/tokens.css`, `src/styles/global.css` và `src/core/config/constants.ts`, đồng thời quét các lỗi vi phạm kiến trúc (như thiếu `@custom-variant dark` hoặc lệch bảng màu chủ đề).

2. **Unit Tests cho Design System & Theme Registry**:
   ```bash
   npx --yes tsx --test src/core/themes/designSystem.test.ts
   ```
   Đảm bảo toàn bộ 7 `AccentTheme`, bảng ánh xạ `THEME_MIGRATION`, và quy chuẩn thời gian tiết học (`LT`/`TH`) luôn toàn vẹn.

3. **i18n Parity Check**:
   ```bash
   node scripts/check-i18n-parity.mjs
   ```
   Đảm bảo 100% chuỗi giao diện tiếng Việt (`vi.json`) và tiếng Anh (`en.json`) đồng bộ.

---

## 📌 Quy trình Dành cho Developer & AI Agent

Trước khi thêm mới hoặc chỉnh sửa bất kỳ màn hình/component nào trong **TdyTime**:
1. Đọc [`DESIGN_DNA.md`](./DESIGN_DNA.md) và [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) để nắm vững hệ màu `accent-*` và thang bo góc `TdyTripZ`.
2. Tái sử dụng tối đa các primitive trong `src/ui/primitives/` và composite trong `src/ui/composites/`.
3. Kiểm tra đối chiếu với [`DO_AND_DONT.md`](./DO_AND_DONT.md) và Checklist trong [`DESIGN_AUDIT_REPORT.md`](./DESIGN_AUDIT_REPORT.md).
