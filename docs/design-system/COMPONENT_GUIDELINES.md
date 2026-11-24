# TdyTime Component Guidelines & DO / DON'T Reference

Tài liệu này quy định đặc tả kỹ thuật chuẩn xác theo mã nguồn hiện hành cho toàn bộ các component trong `src/ui/primitives/`, `src/ui/composites/` và `src/views/shared/`, kèm bảng đối chiếu thực hành Đúng (`DO`) / Sai (`DON'T`).

---

## 1. Bảng Quyết định Phân cấp Component (Canonical Hierarchy)

| Component | Đường dẫn | Quy chuẩn triển khai thực tế |
| :--- | :--- | :--- |
| **`Button`** | `src/ui/primitives/Button.tsx` | 4 variants (`primary`, `secondary`, `ghost`, `danger`), 3 sizes (`sm`, `md`, `lg`) có kích thước tối thiểu cho cả nút icon-only, bo góc `rounded-control` (`8px`), vòng focus `focus-visible:ring-accent-focus`. |
| **`Card`** | `src/ui/primitives/Card.tsx` | **1 kiểu surface phẳng có cấu trúc** (`rounded-card shadow-card`), hỗ trợ `noPadding`, `interactive` (`hover:shadow-card-hover`), `title`, `description`, `headerAction`. |
| **`Badge`** | `src/ui/primitives/Badge.tsx` | 12 variants chia làm 4 nhóm chức năng rõ ràng; bo góc `rounded-badge` (`6px`); điều khiển chấm tròn qua `showDot` / `dot`. |
| **`TypeBadge`** | `src/ui/composites/TypeBadge.tsx` | Component nghiệp vụ hiển thị loại học phần (`LT` / `TH` / `?`) kèm icon `lucide-react` và chế độ `compact`. |
| **`Skeleton`** | `src/ui/primitives/Skeleton.tsx` | Khung xương tải dữ liệu mặc định tích hợp `animate-pulse` + `.shimmer` và `SessionCardSkeleton`. |
| **`ConfirmModal`** | `src/ui/primitives/ConfirmModal.tsx` | Hộp thoại xác nhận dùng React Portal, `role="alertdialog"`, bẫy tiêu điểm (focus trap), khung `rounded-dialog` (`12px`) + `shadow-modal`, khung icon `rounded-card` (`10px`) và các nút bấm `rounded-control` (`8px`). |
| **`SessionCard`** | `src/views/shared/SessionCard.tsx` | Component hiển thị buổi học dùng chung cho `TodayView`, `WeeklyView`, `SemesterView` (`TodayCard` & `WeeklyCard`), hoàn toàn phi trạng thái (`React.memo`). |

---

## 2. Đặc tả Kỹ thuật Chi tiết

### 2.1. `Button` (`src/ui/primitives/Button.tsx`)

- **Props Interface**:
  ```tsx
  type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type ButtonSize = 'sm' | 'md' | 'lg';

  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
      variant?: ButtonVariant;
      size?: ButtonSize;
      loading?: boolean;
      icon?: React.ReactNode;
  }
  ```
- **Variants**:
  - `primary`: `bg-accent-action hover:bg-accent-action-hover text-accent-on-action shadow-sm shadow-accent-500/20` (Đảm bảo tương phản WCAG 2.2 AA `>= 4.5:1` trên cả 7 Accent Themes).
  - `secondary`: `bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200`.
  - `ghost`: `hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300`.
  - `danger`: `bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400`.
- **Sizes & Vùng chạm tối thiểu (bao gồm nút compact / icon-only)**:
  - `sm`: `min-h-[32px] min-w-[32px] px-3 py-1.5 text-xs gap-1.5`
  - `md`: `min-h-[36px] min-w-[36px] px-4 py-2 text-sm gap-2` (Mặc định)
  - `lg`: `min-h-[44px] min-w-[44px] px-5 py-2.5 text-base gap-2`
- **Focus Ring**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900` (tự động chuyển giữa `--accent-focus-light` và `--accent-focus-dark` để đạt tương phản phi văn bản WCAG 2.2 SC 1.4.11 `>= 3.0:1`).

---

### 2.2. `Card` (`src/ui/primitives/Card.tsx`)

- **Props Interface**:
  ```tsx
  interface CardProps {
      children: React.ReactNode;
      className?: string;
      title?: string;
      description?: string;
      headerAction?: React.ReactNode;
      noPadding?: boolean;
      interactive?: boolean;
  }
  ```
- **Đặc tả Surface**:
  - Lớp cơ sở: `bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-card shadow-card transition-all duration-200`.
  - Khi `interactive={true}`: Bổ sung `hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer`.
  - Khi `noPadding={true}`: Loại bỏ `p-4 md:p-5` ở khung ngoài (nhưng vẫn giữ `px-4 pt-4 md:px-5 md:pt-5` cho thanh tiêu đề nếu có `title`), chuyên dùng cho bảng dữ liệu tràn viền.

---

### 2.3. `Badge` (`src/ui/primitives/Badge.tsx`) & `TypeBadge` (`src/ui/composites/TypeBadge.tsx`)

#### Phân loại 4 nhóm `BadgeVariant` theo mục đích nghiệp vụ
Để tránh sử dụng lẫn lộn variant, `Badge` được phân chia thành 4 nhóm chức năng:

| Nhóm chức năng | Variants | Chấm tròn mặc định (`SEMANTIC_DOTS`) | Mục đích sử dụng |
| :--- | :--- | :---: | :--- |
| **1. Session Status** | `live`, `pending`, `completed` | Có ở `live` (`--semantic-success-*`) | Trạng thái thời gian thực của tiết học/ca thi (Đang diễn ra, Sắp tới, Đã xong). |
| **2. Academic Shift (Domain)** | `morning`, `afternoon`, `evening` | Có ở cả 3 (`--semantic-morning/afternoon/evening-*`) | Nhãn phân biệt buổi Sáng (Cyan), Chiều (Orange), Tối (Indigo). |
| **3. Course Modality (Domain)** | `theory`, `practice` | Không | Được gọi tự động bởi `TypeBadge` cho môn Lý thuyết (`LT`) và Thực hành (`TH`). |
| **4. System Status** | `warning`, `danger`, `info`, `default` | Có ở `warning`, `danger` | Thông báo trạng thái hệ thống, cảnh báo hoặc nhãn trung tính. |

#### Quy tắc điều khiển chấm tròn (`showDot` / `dot`)
- Công thức: `const hasDot = showDot ?? dot ?? Boolean(dotColors);`
- Mặc định: Các variant có trong `SEMANTIC_DOTS` (`morning`, `afternoon`, `evening`, `live`, `warning`, `danger`) tự động hiển thị chấm tròn gradient tĩnh `6×6px` (`h-1.5 w-1.5`).
- Chủ động tắt chấm tròn: Truyền `showDot={false}` (hoặc `dot={false}`) để ẩn chấm tròn ngay cả trên các variant có semantic dot.
- Chủ động bật chấm tròn: Truyền `showDot={true}` (hoặc `dot={true}`) để hiển thị chấm tròn `currentColor` trên các variant không có semantic dot.

---

### 2.4. `SessionCard` (`src/views/shared/SessionCard.tsx`)

- **Kiến trúc Pure Stateless**:
  - `SessionCard` điều phối giữa `WeeklyCard` (`variant === 'weekly'`) và `TodayCard` (`variant === 'today'`), cả hai đều được bọc `React.memo`.
  - **Không** chứa `useState`, không mở modal con, không tự đăng ký subscription vào Zustand store để giữ tốc độ render 60fps trên bảng lịch 15–20 tuần.
- **Typography & Cỡ chữ trong `SessionCard`**:
  - `TodayCard`: Khung giờ và tiết học dùng `.font-num`; tên học phần `text-base md:text-lg font-bold`.
  - `WeeklyCard`: Tối ưu cho ô bảng ma trận 7 cột với tên học phần `text-xs font-bold` (`12px`), khung giờ `.font-num text-[11px]`, và `TypeBadge compact` (`9px`).

---

## 3. Cẩm nang Thực hành Đúng / Sai (DO & DON'T)

### 3.1. Màu Hành động Chính & Độ Tương phản (Action Contrast)

- **✅ DO**: Sử dụng `bg-accent-action hover:bg-accent-action-hover text-accent-on-action` khi đặt chữ sáng màu trên nền màu nhấn chính (như nút `Button` primary, huy hiệu tuần hiện tại, ô ngày hôm nay trong `WeekTableLayout`).
  ```tsx
  <button className="bg-accent-action hover:bg-accent-action-hover text-accent-on-action rounded-control px-4 py-2">
    Hiện tại
  </button>
  ```
- **❌ DON'T**: Không dùng cứng `bg-accent-600 text-white` hoặc `bg-blue-700 text-white` cho nút chính vì ở chủ đề `themeYellow` (`2.94:1`) và `themeGreen` (`3.77:1`), `accent-600` không đạt chuẩn tương phản WCAG AA với chữ trắng.

### 3.2. Sử dụng Token Typography, Radius & Shadow

- **✅ DO**: Sử dụng biến CSS đã khai báo trong `tokens.css` (`var(--font-body)`, `var(--font-heading)`, `var(--font-num)`) và các lớp semantic (`rounded-badge`, `rounded-control`, `rounded-card`, `rounded-dialog`, `shadow-card`, `shadow-modal`).
- **❌ DON'T**: Không khai báo lại chuỗi `font-family: 'Montserrat', sans-serif` hoặc giá trị pixel `--radius-sm: 6px` trùng lặp ở nhiều tệp CSS.

### 3.3. Dữ liệu Số & Thời gian

- **✅ DO**: Luôn gắn lớp `font-num` cho mọi chuỗi hiển thị giờ, tiết học, ngày tháng, đếm ngược và số liệu thống kê.
  ```tsx
  <span className="font-num font-bold text-xs">{session.timeRange}</span>
  ```
- **❌ DON'T**: Không để số liệu thời gian hiển thị bằng font tỉ lệ thông thường (proportional numerals) gây lệch cột dọc trên bảng lịch.
