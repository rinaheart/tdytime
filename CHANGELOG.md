# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-04-06

### Added

- **Vite 8 & Rolldown Migration**: Nâng cấp toàn diện hạ tầng build lên Vite 8.0.5, tích hợp **Rolldown** (Rust-based bundler) và **Oxc** để tối ưu hóa tốc độ và độ tin cậy.
- **Immortal Infrastructure**: Triển khai `vercel.json` với chính sách `Cache-Control: public, max-age=31536000, immutable` cho toàn bộ hashed assets, đạt mốc **0.0 KB JS transfer** (Warm Load).

### Changed

- **Build Performance Boost**: Giảm thời gian build từ 7.0s xuống còn **1.6s** (nhanh hơn ~77%) nhờ sức mạnh của Rolldown.
- **Granular Splitting Protocol**: Tái cấu trúc chiến lược chunking (`manualChunks`) để phân tách thông minh thành ~11 chunks, tối ưu hóa song song hóa trên HTTP/2.

## [1.6.0] - 2026-04-03

### Added

- **TypeBadge System**: Ra mắt component `TypeBadge` tập trung (configuration-driven) thay thế toàn bộ logic rẽ nhánh rời rạc, đảm bảo hiển thị Loại học phần (LT/TH) nhất quán và an toàn.
- **Auto-Practice Detection**: Nâng cấp Parser tự động nhận diện tiền tố "TT " (Thực tập) trong tên môn để phân loại chính xác là học phần Thực hành (TH).

### Changed

- **Unified Column Widths**: Tối ưu hóa `WeekTableLayout` với độ rộng cột T2-T7 bằng nhau tuyệt đối (table-fixed). Cột Chủ Nhật tự động thu nhỏ khi không có lịch để tiết kiệm không gian.
- **Session Card Normalization**: Triển khai chiến lược "Strictly 3-Line" cho `WeeklyCard`, ép vùng tên môn chiếm 2 dòng (`min-h-[2.4em]`) giúp các thẻ luôn đồng nhất về chiều cao.
- **Layout Stabilization**: Xử lý triệt để lỗi chồng lấn card trong view Học kỳ bằng cơ chế "Overflow Containment" (min-w-0, w-0, overflow-hidden) tại cấp độ ô bảng.
- **Room Truncation**: Tên phòng quá dài hiện được cắt ngắn thông minh kèm thuộc tính `title` để xem đầy đủ khi hover trên Desktop.

## [1.5.0] - 2026-03-30

### Added

- **Theme Picker Pro**: Ra mắt giao diện menu chọn màu chọn lọc, thay thế cơ chế xoay vòng ngẫu nhiên. Bổ sung 7 bảng màu Accent (Blue, Green, Pink, Violet, Red, Yellow, Grey).
- **Sticky Navigation**: Bảng dữ liệu ở màn hình Học kỳ (Semester) hiện được trang bị tính năng neo cố định tiêu đề bảng (sticky headers) giúp cuộn trang dễ dàng hơn.
- **Responsive Sidebar**: Thanh điều hướng tự động tối ưu và đồng bộ hiển thị hoàn hảo trên các thiết bị di động.

### Changed

- **Architecture Refactoring**: Tách bạch hoàn toàn logic nghiệp vụ (Domain Logic) ra khỏi hệ thống lớp UI gốc (Generic UI).
  - Di dời `SessionCard.tsx` từ `ui/composites/` sang thư mục chuyên gia `views/shared/`.
  - Tách lưới thời gian giảng dạy `PeriodStandardsCard` ra khỏi `AboutCard`, đảm bảo linh hoạt theo Single Responsibility.
- **Semester Alignment**: Chuẩn hóa độ rộng các cột (48px) trên màn hình Học kỳ, đảm bảo đồng bộ lưới (grid alignment) chính xác 100% với màn hình Lịch tuần để tạo ra chuẩn UI SaaS chuyên nghiệp.
- **Tech Stack Upgrade**: Nâng cấp TypeScript 6.0 và bumb up hàng loạt core dependencies như `React 19`, `TailwindCSS v4`, `Zustand v5`, `Vite v6` phiên bản ổn định nhất.

## [1.4.0] - 2026-03-27

### Added

- **Shared UI Architecture**: Tái cấu trúc giao diện Lịch tuần & Học kỳ sử dụng hệ thống Component dùng chung (`WeekTableLayout`, `WeekCardLayout`), đảm bảo sự đồng nhất 100% giữa các góc nhìn.
- **Performance Optimization**: Tối ưu hóa quá trình Render tại tab Học kỳ bằng cách tiền tính toán dữ liệu lọc (Pre-calculated filters) và áp dụng `React.memo`, cho phép mở hàng chục tuần mượt mà.

### Fixed

- **Unique Key Collisions**: Xử lý triệt để lỗi React warning "Unique Key" trong console bằng cách sửa lại `vi.json` (trùng phiên bản v0.5.0) và gán key duy nhất cho các danh sách.
- **Navigation Latency**: Tối ưu hóa logic nhận diện giảng viên (`isMainTeacher`) bằng `useMemo` và `useCallback`, loại bỏ độ trễ 1-2 giây khi chuyển sang tab Thống kê/Cài đặt.

## [1.3.0] - 2026-03-26

### Added

- **Performance Boost (Zero-Dep SVG)**: Loại bỏ hoàn toàn thư viện Recharts giúp giảm **374KB** bundle size.
- **Improved LCP**: Tốc độ tải trang cải thiện vượt bậc, LCP từ 7.0s xuống còn **1.8s** (nhanh hơn ~74%).
- **Heatmap Evolution**: Bản đồ phân bổ giảng dạy phong cách GitHub với lưới ô vuông đồng nhất.
- **Precision Rounding**: Tất cả số liệu phần trăm hiện hiển thị với 1 chữ số thập phân (e.g., `100.0%`, `0.0%`).
- **Shift Donut Chart**: Biểu đồ phân bổ Sáng/Chiều/Tối với dải màu nhạt-đậm mượt mà.

### Changed

- Replaced `recharts` with custom, lightweight SVG chart implementation.
- Updated heatmap day labels to abbreviated format (T2-CN) for better space utilization.
- Center-aligned heatmap for small screens and left-aligned with scroll for overflow.
- Improved remainder-balancing algorithm to ensure chart totals are always exactly `100.0%`.

## [1.2.0] - 2026-03-25

### Added

- **Theme Picker UI**: Thay thế cơ chế xoay vòng theme bằng Menu chọn màu chuyên nghiệp giúp cá nhân hóa không gian làm việc tức thì.
- **Accent Palettes+**: Bổ sung bộ 7 bảng màu cao cấp (Blue, Green, Pink, Violet, Red, Yellow, Grey) với hệ thống CSS token đồng bộ.
- **StatsHeader Evolution**: Tinh chỉnh thanh tiêu đề thống kê, tích hợp khả năng thu gọn/mở rộng và căn lề lưới hoàn hảo.
- **Multilingual Chart Support**: Nâng cấp toàn bộ các biểu đồ SVG với khả năng hỗ trợ đa ngôn ngữ hoàn diện cho nhãn và chú giải.
- **Theme Migration Engine**: Hệ thống ánh xạ thông minh giúp chuyển đổi an toàn từ các ID giao diện cũ sang quy trình đặt tên thống nhất mới.

### Changed

- **StatsHeader Refinement**: Nhất quán bố cục tiêu đề KPI với thông tin giảng viên, đơn giản hóa các chỉ số và thêm nút gạt phản hồi responsive.
- **GitHub-Style Heatmap**: Thiết kế lại biểu đồ phân bổ giảng dạy thành lưới chuyên nghiệp, nhỏ gọn với khả năng căn chỉnh và xử lý tràn thông minh.
- **Optimized Shift Palette**: Cập nhật biểu đồ Donut Sáng/Chiều/Tối với dải màu nhạt-đến-đậm mượt mà dựa trên sắc độ theme.
- **UI Flow Refinement**: Sắp xếp lại thứ tự điều hướng (Hôm nay, Tuần, Học kỳ, Thống kê, Cài đặt) phù hợp hơn với thói quen sử dụng thực tế.

### Fixed

- **UI Grid Alignment**: Hoàn thiện căn lề `border-l` giữa dải KPI và các cột Dashboard cho luồng thị giác liền mạch.
- **Zero-Sum Logic**: Đảm bảo tổng phần trăm biểu đồ đa phân đoạn luôn đạt chính xác 100.0% bằng thuật toán điều chỉnh số dư thông minh.
- **Sidebar UX**: Loại bỏ hiện tượng nhấp nháy và trượt bố cục trong quá trình thu gọn hoặc mở rộng thanh bên.

## [1.1.0] - 2026-03-23

### Added

- **E2E Testing Sandbox:** Introduced a secret `/#/demo` route hidden on the Welcome view (triggered by tapping the version number 5 times).
- **Time Bending Mock Engine:** Added global `mockState` infrastructure in Zustand to safely isolate and run time-accelerated simulation tests.
- **Unified Empty State:** A dedicated "No Schedule" view dynamically merging empty daily spaces with future context.
- **Demo Data Fixtures:** Sample UMS source HTML templates now stored gracefully inside `public/mocks/` for seamless QA automation.

### Changed

- **UI Typography Sync:** Unified metric fonts to ensure identical visual alignment between the Instructor's Avatar icon and the Master Card component per structural guidelines.
- **File System Refactoring:** Consolidated `src/store/` into `src/core/stores/` and `src/components/` into structured atomic `src/ui/` directories to better accommodate composability. 

### Fixed

- **Resume-From-Sleep Syncing:** Implemented robust `visibilitychange` lifecycle triggers in `TodayView` and `StatisticsView` to strictly reset component timers and evaluate schedule phase instantly when devices exit idle/sleep mode.
- **Phase Transition Accuracy:** Fine-tuned `getSessionStatus` loop matching with rigid strict `< endMin` bounds rather than `<=`, ensuring periods correctly classify exactly the moment a lesson crosses end-boundary thresholds.
- **Component Imports:** Addressed missing dynamic imports referencing `SessionCardSkeleton` and `AppLayout` causing Vite routing failures during lazy suspensions.

## [1.0.0] - 2026-02-26

### Added / Changed

- **Official Release v1.0.0**: Hoàn diện hệ thống PWA với tính năng kiểm tra cập nhật chủ động.
- **Improved PWA Experience**: Thêm nút kiểm tra cập nhật trong Cài đặt và thông báo cài đặt ứng dụng.
- **Brand Identity**: Đồng bộ hóa logo SVG trên toàn bộ các màn hình Chào mừng và Cài đặt.
- **UI Optimization**: Tinh chỉnh khoảng cách và kích thước logo giúp giao diện thoáng đãng và hiện đại hơn.

## [0.9.0] - 2026-02-05

### Added / Changed

- **Lightning Fast Performance**: Tối ưu hóa toàn diện giúp ứng dụng tải tức thì (Load Time ~176ms) và đạt điểm hiệu năng tuyệt đối.
- **Smart Bundle Split**: Tách thông minh các thư viện nặng (Biểu đồ) khỏi luồng chính, giúp trải nghiệm mượt mà ngay từ lần chạm đầu tiên.
- **Dynamic Layout Loading**: Cơ chế tải giao diện theo nhu cầu (Lazy Loading) giúp tiết kiệm dữ liệu và tăng tốc độ hiển thị.

## [0.8.2] - 2026-02-04

### Added / Changed

- **Header UI Evolution**: Đưa nút chuyển Dark Mode lên Header với phong cách tối giản (Minimalist icon), giúp thao tác nhanh và là chỉ báo trực quan cho việc cập nhật bản mới.
- **Hard Refresh Signal**: Thay đổi cấu trúc Header để ép trình duyệt di động nhận diện sự thay đổi giao diện, giúp thoát khỏi tình trạng kẹt Cache cũ.

## [0.8.1] - 2026-02-04

### Added / Changed

- **PWA Self-Healing**: Cơ chế ép buộc làm mới Cache để xử lý triệt để lỗi lời chào bị kẹt trên thiết bị di động.
- **Timezone Reactive**: Tối ưu hóa việc nhận diện múi giờ hệ thống giúp lời chào nhảy đúng Sáng/Chiều/Tối tức thì.

## [0.8.0] - 2026-02-04

### Added / Changed

- **Smart Countdown**: Hệ thống đếm ngược học kỳ mới trực quan với số đếm 2 chữ số và tiêu đề đổi màu theo tiến độ thời gian.
- **Today View Optimized**: Đồng nhất thiết kế thẻ bài giảng LIVE/Pending và thu gọn danh sách đã hoàn thành một cách tinh tế.
- **Multi-Teacher Footer**: Tự động hiển thị tên GV trên dải màu Footer Strip khi tắt bộ lọc, hỗ trợ theo dõi lịch dạy đa giảng viên.
- **Minimalist UI Refinement**: Rút gọn định dạng ngày tuần với ký tự mũi tên (→) và tối ưu hóa không gian hiển thị (pb-7/pb-10).
- **Scroll & Layout Fix**: Loại bỏ các thanh chỉ báo cuộn không hoạt động và xử lý triệt để lỗi cuộn dư thừa trên tab Hôm nay.

## [0.7.0] - 2026-02-03

### Added / Changed

- **PageSpeed 90+**: Tối ưu hóa hiệu năng đạt chuẩn Core Web Vitals (LCP < 2.5s).
- **Accessibility Verified**: Đạt chuẩn tương phản màu sắc (WCAG AA) và hỗ trợ điều hướng ARIA toàn diện.
- **Smart Cache**: Cơ chế lưu trữ đệm thông minh giúp ứng dụng tải tức thì.
- **PWA Pro**: Nâng cấp biểu tượng maskable và hiệu chuẩn manifest cho trải nghiệm App native.

## [0.6.0] - 2026-02-02

### Added / Changed

- **Premium Refinement**: Tinh chỉnh toàn bộ tab Cài đặt và Thống kê để đạt độ nén thông tin và thẩm mỹ cao nhất.
- **Auto-Logic**: Tích hợp khả năng tự động bóc tách loại hình giảng dạy và rút gọn tên môn học thông minh trên toàn ứng dụng.
- **Stability Pro**: Xử lý triệt để các lỗi điều hướng và nâng cao độ ổn định nền tảng (v0.6.0).

## [0.5.1] - 2026-02-02

### Added / Changed

- **Data-Centric Today**: Thiết kế lại hoàn toàn thẻ Hôm nay với triết lý dữ liệu là trung tâm, phù hợp giảng viên và người dùng lớn tuổi.
- **Session Status System**: Hệ thống trạng thái buổi giảng 3 cấp (Chưa đến giờ / Đang giảng dạy / Hoàn thành) với phân biệt thị giác rõ ràng.
- **Semester Intelligence**: Logic nhận diện ranh giới học kỳ thông minh với 4 trạng thái empty states chuyên biệt.
- **Mobile-First Cards**: Layout 3 cột tối ưu cho mobile (Thời gian | Thông tin | Phòng) với độ ưu tiên hiển thị chuẩn hóa.

## [0.5.0] - 2026-02-01

### Added / Changed

- **System Refactor**: Kiểm kê (Audit) và tái cấu trúc toàn diện mã nguồn, nâng cao sự ổn định và an toàn logic 100%.
- **Performance Core**: Tối ưu hóa hiệu suất render với công nghệ Memoization, loại bỏ hoàn toàn các điểm nghẽn tính toán.
- **Clean Utilities**: Chuẩn hóa bộ công cụ xử lý ngày tháng (ScheduleUtils), giảm thiểu 30% mã lặp và tăng độ tin cậy.

## [0.4.0] - 2026-01-31

### Added / Changed

- **Smart Filtering**: Hệ thống bộ lọc thông minh tự động ẩn để tối ưu không gian, đi kèm chỉ báo hoạt động trực quan.
- **Privacy Mode**: Tính năng bảo mật linh hoạt tại trang Thống kê giúp che giấu thông tin chi tiết khi cần thiết.
- **Mobile Horizontal Scrolling**: Chuẩn hóa trải nghiệm cuộn ngang cho bảng lịch trình tuần trên di động.
- **Visual Unification**: Đồng bộ hóa giao diện toàn ứng dụng.

## [0.3.0] - 2026-01-31

### Added / Changed

- **Premium Minimal Language**: Triết lý thiết kế tinh giản, sang trọng với hiệu ứng Glassmorphism và layout tập trung tối đa vào dữ liệu.
- **Semester Timeline**: Trải nghiệm dòng thời gian học kỳ hoàn toàn mới, tự động điều hướng thông minh và tối ưu không gian hiển thị.
- **Insights Card**: Hệ thống thẻ phân tích thế hệ mới, biến dữ liệu thô thành những nhận định trực quan, sống động.
- **Visual Performance**: Tối ưu hóa các hiệu ứng chuyển cảnh mượt động, tạo cảm giác như ứng dụng Native cao cấp.

## [0.2.0] - 2026-01-29

### Added / Changed
- **Welcome Center**: Không gian khởi đầu được thiết kế lại theo tiêu chuẩn App chuyên nghiệp với bộ nhận diện TdyTime duy mỹ.
- **Conflict Intelligence**: Trí tuệ phân tích tự động phát hiện xung đột thời gian và không gian, đảm bảo lịch trình chuẩn xác 100%.
- **Smart History**: Khả năng ghi nhớ và truy cập tức thì các lịch trình gần đây, loại bỏ hoàn toàn thao tác nạp lại dữ liệu.
- **Interface Polish**: Tinh chỉnh các thành phần giao diện nhỏ (Tabs, Toasts, Badges) đạt độ hoàn thiện đồng nhất.

## [0.1.0] - 2026-01-27

### Added / Changed
- **Mobile Prowess**: Tái định nghĩa trải nghiệm di động với hệ thống Tab Bar và cử chỉ Swipe (vuốt) tự nhiên để điều hướng tuần.
- **Identity Refresh**: Cập nhật hệ thống Icon và Splash screen theo tiêu chuẩn PWA hiện đại.
- **Dashboard Insights**: Nâng cấp biểu đồ phân bổ và thẻ tóm tắt giúp GV nắm bắt lịch dạy trong 3 giây.

## [0.015] - 2026-01-26

### Added / Changed
- **Executive Dashboard**: Thiết kế lại toàn bộ màn hình Thống kê theo phong cách quản trị tinh gọn.
- **Color-Coded Alerts**: Hệ thống cảnh báo trực quan bằng màu sắc giúp nhận diện các điểm nóng và tuần quá tải tức thì.

## [0.012] - 2026-01-22

### Added / Changed
- **The Blue Revolution**: Chuẩn hóa bảng màu Blue/Teal chuyên nghiệp, loại bỏ hoàn toàn các lỗi thiết kế cũ.
- **Skeleton Shimmer**: Ứng dụng hiệu ứng tải dữ liệu hiện đại, đảm bảo trải nghiệm không bao giờ bị ngắt quãng.

## [0.011] - 2026-01-15

### Added / Changed
- **Analytics Launch**: Ra mắt hệ thống phân tích mật độ giảng dạy đầu tiên với biểu đồ Heatmap trực quan.
- **Parser Engine**: Nâng cấp bộ máy xử lý dữ liệu từ hệ thống UMS đạt độ chính xác cao.

## [0.0.10] - 2026-01-10

### Added / Changed
- **Genesis**: Khởi tạo kiến trúc nền tảng, tập trung vào khả năng bóc tách lịch giảng thô sang định dạng kỹ thuật số.
