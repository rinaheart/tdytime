# TdyTime Design System — Canonical Index (SSOT)

Chào mừng đến với **Canonical Design System Index** của **TdyTime (`v2026.11.24`)**.
Thư mục `docs/design-system/` là **Nguồn sự thật duy nhất (Single Source of Truth — SSOT)** cho toàn bộ quy chuẩn thị giác, hệ thống token, đặc tả component, bố cục đáp ứng và tiêu chuẩn trợ năng của dự án.

> **Phân tách trách nhiệm tài liệu**:
> - [`DESIGN.md`](../../DESIGN.md): Điểm vào tóm tắt (Root Entry Point) cho developer và AI agents.
> - **`docs/design-system/` (Thư mục này)**: Nguồn chuẩn chính thức cho **Visual Design System**.
> - [`ARCHITECTURE.md`](../../ARCHITECTURE.md): Nguồn chuẩn chính thức cho **Kiến trúc kỹ thuật, PWA, State Management và Performance Guardrails**.

---

## 🗂️ Cấu trúc 7 Tài liệu Cốt lõi

| STT | Tài liệu | Nội dung cốt lõi |
| :---: | :--- | :--- |
| **1** | **[`README.md`](./README.md)** | **Canonical Design System Index**: Cổng điều hướng trung tâm, quy trình làm việc và lệnh kiểm chứng CI. |
| **2** | **[`DESIGN_DNA.md`](./DESIGN_DNA.md)** | **Bản sắc & Nguyên tắc Thiết kế**: Định danh **Compact Academic Utility**, 8 đặc trưng cốt lõi và các nguyên tắc thị giác bắt buộc (tách biệt khỏi nguyên tắc kiến trúc kỹ thuật). |
| **3** | **[`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md)** | **Hệ thống Design Tokens**: Phân tách 3 tầng màu (Accent, Status, Domain), token tương phản hành động `--accent-action-*`, biến Font chữ, Semantic Radius (`badge`, `control`, `card`, `dialog`) và Shadow tokens. |
| **4** | **[`COMPONENT_GUIDELINES.md`](./COMPONENT_GUIDELINES.md)** | **Quy chuẩn Component & DO/DON'T**: Đặc tả khớp 100% với code thực tế cho `Button`, `Card`, `Badge`, `TypeBadge`, `Skeleton`, `ConfirmModal`, `SessionCard` kèm bảng đối chiếu Đúng/Sai. |
| **5** | **[`LAYOUT_AND_RESPONSIVE.md`](./LAYOUT_AND_RESPONSIVE.md)** | **Bố cục & Đáp ứng theo Tác vụ**: Cấu trúc App Shell, nguyên tắc thích ứng theo tác vụ (`WeekTableLayout` ↔ `WeekCardLayout`), và phạm vi sử dụng hợp lý của Bento Grid / 3-Tab Segmented Focus. |
| **6** | **[`INTERACTION_AND_ACCESSIBILITY.md`](./INTERACTION_AND_ACCESSIBILITY.md)** | **Tương tác, Chuyển động & Trợ năng**: Trạng thái tương tác, xác nhận 2 bước, ngân sách chuyển động, điều hướng bàn phím WAI-ARIA và kiểm chứng độ tương phản WCAG 2.2 AA trên 7 themes. |
| **7** | **[`DESIGN_AUDIT_REPORT.md`](./DESIGN_AUDIT_REPORT.md)** | **Báo cáo Kiểm toán & Lịch sử Chuẩn hóa**: Phân tích 9 phát hiện từ đợt đối chiếu trực tiếp codebase, kết quả thực thi 3 đợt chuẩn hóa (P0/P1/P2) và Checklist tuân thủ. |

---

## 🛠️ Cơ chế Kiểm soát Tự động (Automated Enforcement)

Design System của TdyTime không chỉ là tài liệu tĩnh mà được thực thi tự động trong pipeline CI (`.github/workflows/ci.yml`):

1. **Kiểm tra Toàn vẹn Hệ thống Thiết kế (`npm run check:design-system`)**:
   - Xác minh sự tồn tại của 7 tài liệu chuẩn và đảm bảo không còn định danh thương hiệu dự án ngoại lai trong quy chuẩn hiện hành.
   - Phân tích cú pháp từng khối `[data-accent="theme..."]` trong `src/styles/tokens.css`, đảm bảo cả 7 chủ đề đều định nghĩa đủ 11 sắc độ `--accent-50..950` và bộ 3 token hành động `--accent-action-bg`, `--accent-action-hover`, `--accent-on-action`.
   - Đối chiếu giá trị mã màu RGB trong `src/styles/tokens.css` khớp chính xác với bảng mã màu HEX preview trong `src/core/config/constants.ts`.
   - Tính toán trực tiếp tỷ lệ tương phản **WCAG 2.2 AA (`>= 4.5:1`)** của `--accent-action-bg` và `--accent-action-hover` trên nền chữ `--accent-on-action` cho toàn bộ 7 chủ đề.
   - Đảm bảo các biến màu Status và Domain không bị ghi đè tùy tiện bên trong các khối theme.
   - Kiểm tra các token Typography (`--font-body`, `--font-heading`, `--font-num`), Semantic Radius (`--radius-badge`, `--radius-control`, `--radius-card`, `--radius-dialog`) và Shadow (`--shadow-card`, `--shadow-card-hover`, `--shadow-modal`) được đấu nối thực tế vào `src/styles/global.css`.
2. **Kiểm thử Đơn vị (`npm test -- src/core/themes/designSystem.test.ts`)**:
   - Kiểm thử registry 7 themes, migration map, bảng tương phản WCAG AA, thời gian tiết học `LT`/`TH` và hành vi bật/tắt chấm tròn ngữ nghĩa (`showDot={false}` / `dot={false}`) của `Badge`.
