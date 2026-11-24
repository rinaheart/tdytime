# Design System Do's & Don'ts — TdyTime

Tài liệu này tổng hợp các quy tắc **Bắt buộc Tuân thủ (Mandatory DO's)** và các hành vi **Nghiêm cấm (Forbidden DON'Ts)** kèm ví dụ mã nguồn thực tế để developer và AI coding agent đối chiếu nhanh khi phát triển tính năng mới.

---

## 1. Màu sắc & Chủ đề (Colors & Theming)

### ✅ DO: Sử dụng Semantic Accent Tokens (`accent-50` .. `accent-950`) và Cặp Light/Dark đầy đủ
Luôn dùng hệ class `bg-accent-*`, `text-accent-*`, `border-accent-*` cho các thành phần mang màu sắc thương hiệu/tương tác chính, và luôn khai báo cặp màu `dark:*` cho mọi bề mặt.

```tsx
// ✅ CHUẨN DNA: Tự động đổi màu theo cả 7 AccentTheme và hỗ trợ Light/Dark Mode
<button
  type="button"
  className="bg-accent-600 hover:bg-accent-700 text-white dark:bg-accent-500 dark:hover:bg-accent-600 rounded-xl px-4 py-2 font-bold shadow-sm shadow-accent-500/20"
>
  Hиện tại
</button>
```

### ❌ DON'T: Hardcode màu `blue-*` cho các thành phần thuộc về Accent Theme hoặc quên `dark:*`
Khi người dùng chuyển sang chủ đề `themePink`, `themeGreen` hoặc `themeRed`, các phần tử hardcode `bg-blue-700` sẽ bị lạc quẻ hoàn toàn khỏi tổng thể giao diện.

```tsx
// ❌ SAI: Hardcode bg-blue-700 khiến nhãn tuần hiện tại vẫn có màu xanh dương khi đang chọn theme Đỏ/Hồng
<span className="px-2 py-0.5 rounded-full bg-blue-700 text-white text-[8px] font-black uppercase">
  Tuần hiện tại
</span>

// ✅ ĐÚNG: Dùng bg-accent-600 hoặc bg-accent-700
<span className="px-2 py-0.5 rounded-full bg-accent-600 text-white text-[8px] font-black uppercase">
  Tuần hiện tại
</span>
```

---

## 2. Chữ viết & Số liệu (Typography & Numerals)

### ✅ DO: Luôn gắn class `font-num` (`Montserrat` + `tabular-nums`) cho mọi dữ liệu số
Mọi khung giờ, ngày tháng, số tiết, phần trăm, số thứ tự và phiên bản phải có `font-num` để các chữ số thẳng cột dọc và mang nét đặc trưng của `Montserrat`.

```tsx
// ✅ CHUẨN DNA: Số liệu sắc nét, thẳng trục dọc trong bảng và thẻ
<div className="flex items-center justify-between text-xs">
  <span className="font-bold text-slate-700 dark:text-slate-200 truncate">Lập trình Web</span>
  <span className="font-num tabular-nums font-black text-accent-700 dark:text-accent-400 shrink-0">
    45 tiết (75%)
  </span>
</div>
```

### ❌ DON'T: Để tên môn học hoặc tên lớp dài tràn khỏi thẻ
Không bao giờ đặt một chuỗi văn bản động trong flex/grid container mà thiếu `min-w-0` và `truncate` (hoặc `line-clamp-2`).

```tsx
// ❌ SAI: Thiếu min-w-0 và truncate sẽ làm vỡ chiều rộng cột trên màn hình 390px
<div className="flex items-center">
  <div><span>{session.courseName}</span></div>
</div>

// ✅ ĐÚNG: Luôn có min-w-0 trên flex child và truncate trên text element
<div className="flex items-center gap-2">
  <div className="flex-1 min-w-0">
    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block" title={session.courseName}>
      {session.courseName}
    </span>
  </div>
</div>
```

---

## 3. Hình khối, Bo góc & Độ sâu (Shapes, Radii & Elevation)

### ✅ DO: Tuân thủ thang bo góc TdyTripZ và nguyên tắc Độ sâu Đơn tầng (Single Elevation)
- Thẻ chính (`Card`, `TodayCard`, `StatsHeader`): `rounded-2xl` (`10px`) + `border border-slate-200 dark:border-slate-800 shadow-sm`.
- Nút bấm, ô nhập liệu (`Button`, `FilterBar`): `rounded-xl` (`8px`).
- Phân tách các mục con bên trong thẻ bằng đường kẻ mảnh `divide-y divide-slate-100 dark:divide-slate-800`.

```tsx
// ✅ CHUẨN DNA: Thẻ đơn tầng, phân cách mục con bằng divide-y mảnh
<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
  <div className="p-4">Mục 1</div>
  <div className="p-4">Mục 2</div>
</div>
```

### ❌ DON'T: Lồng thẻ có viền và bóng đổ chồng chéo ("Cards within Cards") hoặc dùng `border-l-4` dày cộp
Không đặt nhiều lớp thẻ có `shadow-md` và `border` lồng vào nhau gây chật chội trên màn hình điện thoại, và không dùng vạch viền trái dày `border-l-4` trên các thẻ lịch hiện đại.

---

## 4. Kiến trúc Component & Hiệu năng (Component & Performance Guardrails)

### ✅ DO: Giữ `SessionCard` thuần trình bày (Stateless) và dùng Atomic Zustand Selectors
Truy cập Zustand Store qua selector nguyên tử và truyền dữ liệu đã xử lý xuống các thẻ danh sách.

```tsx
// ✅ CHUẨN DNA: Atomic selector giúp tránh re-render thừa
const abbreviations = useScheduleStore((s) => s.abbreviations);
const accentTheme = useUIStore((s) => s.accentTheme);
```

### ❌ DON'T: Gọi `useStore()` không có selector hoặc import qua file Barrel ở đường dẫn khởi động
- **Cấm**: `const { data, metrics } = useScheduleStore();` (gây re-render toàn cây component mỗi khi bất kỳ trường nào trong store thay đổi).
- **Cấm**: Import từ `@/ui` hoặc `@/core/stores` bên trong `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx` (làm phình kích thước entry chunk ban đầu).
- **Cấm**: Gọi `window.innerWidth` trực tiếp ở phạm vi top-level của module hoặc tạo phần tử bấm được bằng `<div onClick={...}>` mà không dùng `<button type="button">`.
