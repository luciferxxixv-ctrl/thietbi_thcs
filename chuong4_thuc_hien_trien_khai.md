## CHƯƠNG 4: THỰC HIỆN VÀ TRIỂN KHAI

Chương này trình bày chi tiết quá trình đưa những thiết kế từ Chương 3 vào thực tế lập trình. Nội dung chương sẽ bao quát từ việc thiết lập môi trường phát triển, tổ chức cấu trúc thư mục mã nguồn, cho đến việc giải thích logic triển khai của các module chức năng cốt lõi (kèm các đoạn mã giả lập) và phương pháp tối ưu hóa trải nghiệm người dùng trên đa nền tảng thiết bị.

### 4.1. Cài đặt môi trường phát triển

Để đảm bảo tính đồng bộ, tốc độ phát triển và chất lượng mã nguồn, hệ thống được xây dựng trên một hệ sinh thái các công cụ hiện đại, tuân thủ các tiêu chuẩn công nghiệp:

**Bảng 4.1. Công cụ và phần mềm sử dụng trong quá trình phát triển**

| Công cụ / Nền tảng | Phiên bản (Version) | Mục đích sử dụng chính |
|---|---|---|
| **Visual Studio Code** | 1.8x | Trình soạn thảo mã nguồn chính. Tích hợp các Extension: *Prettier* (Format code), *ESLint* (Check lỗi JS), *DotENV* (Đọc file môi trường). |
| **Node.js** | 18.x (LTS) | Môi trường thực thi Backend, quản lý luồng bất đồng bộ (Event-driven). |
| **PostgreSQL** | 15.x | Hệ quản trị cơ sở dữ liệu quan hệ, hỗ trợ Transaction mạnh mẽ. |
| **pgAdmin 4** | 7.x | Công cụ UI để thiết kế Table, View và thực thi Query trực tiếp. |
| **Vite** | 5.x | Công cụ Build cho Frontend, cung cấp Hot Module Replacement (HMR) giúp giao diện cập nhật ngay lập tức khi code thay đổi. |
| **Postman** | 10.x | Giả lập Client để bắn các HTTP Request kiểm thử API trước khi ráp vào React. |
| **Git / GitHub** | Mới nhất | Quản lý phiên bản mã nguồn (Version Control), lưu trữ và backup code an toàn. |

### 4.2. Cấu trúc dự án chi tiết

Để dự án có thể mở rộng (Scalable) và dễ dàng bảo trì (Maintainable), toàn bộ mã nguồn được chia tách làm hai không gian làm việc (Workspace) hoàn toàn độc lập, giao tiếp với nhau duy nhất qua API.

#### 4.2.1. Cấu trúc mã nguồn Backend (Node.js)
Backend áp dụng kiến trúc module hóa theo chuẩn **Service-Controller Pattern**. Việc tách biệt Controller (chỉ xử lý Request/Response) và Service (chỉ chứa Logic SQL) giúp code dễ dàng được tái sử dụng và thực hiện Unit Test.

*[Hình ảnh: Ảnh chụp màn hình cây thư mục thư mục `backend/src/` trong VS Code, hiển thị các thư mục config, controllers, routes, services]*
**Hình 4.1. Cấu trúc thư mục dự án Backend (Node.js)**

- **`src/config/`**: Nơi khởi tạo *Connection Pool* tới PostgreSQL. Việc dùng Pool giúp tái sử dụng các kết nối thay vì liên tục mở/đóng kết nối mới gây tràn RAM.
- **`src/routes/`**: Nơi định nghĩa các Endpoints (Ví dụ: `router.post('/login', authCtrl.login)`).
- **`src/controllers/`**: Nhận dữ liệu đầu vào (req.body), gọi Service xử lý và định dạng cấu trúc JSON trả về (res.json).
- **`src/services/`**: "Trái tim" của Backend. Nơi chứa các thuật toán tính toán tồn kho, thực thi các lệnh `BEGIN`, `COMMIT`, `ROLLBACK` của Database.

#### 4.2.2. Cấu trúc mã nguồn Frontend (ReactJS)
Frontend ứng dụng nguyên lý "Component-based", chia nhỏ giao diện thành các mảnh ghép độc lập.

*[Hình ảnh: Ảnh chụp màn hình cây thư mục thư mục `frontend/src/` trong VS Code]*
**Hình 4.2. Cấu trúc thư mục dự án Frontend (ReactJS)**

- **`src/components/`**: Các UI Element tái sử dụng ở nhiều trang (như `Sidebar.jsx`, `Navbar.jsx`, `LoadingSpinner.jsx`, `ModalConfirm.jsx`).
- **`src/pages/`**: Các giao diện cấp cao nhất tương ứng với từng đường dẫn (Route) như `Login.jsx`, `TeacherDashboard.jsx`.
- **`src/utils/`**: Cấu hình `axios` (gọi API) và các hàm tiện ích (`formatDate`, `formatCurrency`).
- **`App.jsx` & `AdminApp.jsx`**: Nơi bọc toàn bộ hệ thống bằng React Router để điều hướng trang mà không cần Load lại trình duyệt.

### 4.3. Triển khai các chức năng chính

#### 4.3.1. Phân vùng Xác thực và Quản lý phiên (Authentication)
Xác thực là lớp bảo mật đầu tiên, đảm bảo chỉ những giáo viên và quản trị viên hợp lệ mới được truy cập dữ liệu nhà trường.

*[Hình ảnh: Ảnh chụp màn hình giao diện trang Đăng nhập hệ thống thực tế trên trình duyệt]*
**Hình 4.3. Màn hình Đăng nhập hệ thống**

**Luồng thực thi (Authentication Flow):**
1. Người dùng nhập `username` và `password` tại màn hình React.
2. Form sẽ Validate độ dài (client-side). Nếu hợp lệ, gửi tới `/api/auth/login`.
3. Tại Backend, hàm `bcrypt.compareSync(password, hashInDB)` được kích hoạt để dò khớp mật khẩu mã hóa.
4. Nếu thành công, Backend gọi `jwt.sign()` tạo ra một **JSON Web Token (JWT)** với Payload chứa `magv` và `role`.
5. Frontend nhận Token, lưu vào `localStorage.setItem('accessToken', token)`. Từ đó về sau, người dùng không cần đăng nhập lại trong vòng 24 giờ.

#### 4.3.2. Bảng điều khiển Quản trị (Admin Dashboard)
Đây là màn hình đầu tiên khi Thủ kho hoặc Ban Giám Hiệu đăng nhập. 

*[Hình ảnh: Ảnh chụp màn hình giao diện trang chủ Dashboard của Admin, với các thẻ thống kê tổng quan (số loại thiết bị, số phiếu chờ duyệt, số thiết bị báo hỏng)]*
**Hình 4.4. Màn hình Bảng điều khiển (Dashboard) của Admin**

**Triển khai kỹ thuật:**
- Sử dụng các thẻ (Cards) với CSS Box-shadow để làm nổi bật các số liệu nóng (Ví dụ: Chữ đỏ cho "Số lượng phiếu chờ duyệt").
- Dữ liệu thống kê được Backend tổng hợp thông qua các câu lệnh `COUNT()`, `SUM()` và `GROUP BY` tối ưu, trả về Frontend dưới dạng một cục JSON duy nhất, tránh việc Frontend phải gọi 5-6 API khác nhau làm chậm trang.

#### 4.3.3. Chức năng Lập Phiếu Tuần theo Thời Khóa Biểu (Giáo viên)
Đây là chức năng mang tính đột phá, thay đổi hoàn toàn thói quen mượn thiết bị thủ công của giáo viên.

*[Hình ảnh: Ảnh chụp màn hình giao diện trang Mượn thiết bị của Giáo viên, hiển thị Bảng Thời khóa biểu tuần và Cửa sổ Popup Gợi ý thiết bị khi click vào tiết học]*
**Hình 4.5. Màn hình Thời khóa biểu và Gợi ý thiết bị**

**Luồng nghiệp vụ xử lý:**
1. Khi giáo viên chọn Tuần học, Frontend gửi Request tới API lấy Thời Khóa Biểu của riêng giáo viên đó.
2. React dựng lên một ma trận lưới (`CSS Grid`). Mỗi tiết học là một Component `TimeSlot`.
3. Giáo viên click vào `TimeSlot`, hàm `onClick` mở Modal. Modal này kích hoạt API `GET /api/goiy?mamon=...&tiet=...` để lôi ra danh sách thiết bị chuẩn theo Phân Phối Chương Trình.
4. Giáo viên ấn nút [+] để chọn số lượng. Các thay đổi này được lưu tạm trên RAM (bằng State `cartItems`).
5. Khi ấn **Gửi Phiếu Tuần**, toàn bộ mảng `cartItems` chứa dữ liệu của 3-4 tiết dạy khác nhau được Bulk Insert lên Server. Việc này giúp tiết kiệm 75% số lượng Request mạng.

#### 4.3.4. Chức năng Phê duyệt Phiếu và Khóa Tồn Kho (Admin)
Đây là trái tim của hệ thống Backend, nơi phải đối mặt với bài toán phức tạp nhất: Xung đột dữ liệu khi nhiều người mượn cùng một món đồ (Race Condition).

*[Hình ảnh: Ảnh chụp màn hình giao diện trang Phê duyệt phiếu mượn dạng Split-view. Bên trái là danh sách phiếu, bên phải là danh sách chi tiết các thiết bị mượn của phiếu được chọn]*
**Hình 4.6. Màn hình Phê duyệt phiếu mượn tuần**

**Kỹ thuật Khóa dòng (Pessimistic Locking) trong PostgreSQL:**
Để đảm bảo kho không bao giờ bị trừ âm, luồng Backend được code bọc trong một Transaction cực kỳ nghiêm ngặt.
Đoạn mã mô phỏng luồng duyệt phiếu phía Service:
```javascript
// Bắt đầu một giao dịch độc quyền
await client.query('BEGIN'); 

try {
   // 1. Khóa cứng các thiết bị đang xét (Không cho Request khác can thiệp)
   const dbRes = await client.query(`
      SELECT soluongtot FROM loai_thiet_bi 
      WHERE maloaitb = $1 FOR UPDATE
   `, [maLoaiTb]);

   const tonKhoHienTai = dbRes.rows[0].soluongtot;

   // 2. Tính toán lượng khả dụng (Trừ đi các phiếu Đã Duyệt nhưng chưa Trả)
   // ... (Logic tính số lượng giữ chỗ) ...

   if (tonKhoHienTai - soLuongGiuCho < soLuongYeuCau) {
       throw new Error("Tồn kho không đủ để cấp phát!");
   }

   // 3. Nếu đủ, tiến hành cập nhật trạng thái
   await client.query(`
      UPDATE phieu_muon SET trangthai = 'DaDuyet' WHERE maphieu = $1
   `, [maPhieu]);

   // 4. Lưu vĩnh viễn và mở khóa (Release Lock)
   await client.query('COMMIT');

} catch (error) {
   // Nếu có lỗi (thiếu đồ, hoặc sập mạng), phục hồi nguyên trạng
   await client.query('ROLLBACK');
   throw error;
}
```

#### 4.3.5. Chức năng Quản lý Hao mòn, Trả thiết bị và Sinh Mã QR
Hệ thống không chỉ quản lý việc xuất kho mà còn quản lý trọn đời vòng đời của tài sản (Hỏng hóc, Thất lạc).

*[Hình ảnh: Ảnh chụp màn hình giao diện Quản lý thiết bị của Admin, làm nổi bật cột Mã QR và chức năng tạo tự động, in tem nhãn]*
**Hình 4.7. Màn hình Danh mục Thiết bị & In Mã QR**

- **Quản lý Sinh QR Code:** Khi Admin nhập một Dụng cụ thí nghiệm mới (VD: "Kính hiển vi"), Backend tạo ngẫu nhiên một chuỗi `UUID v4`. Tại phía Frontend, sử dụng thư viện `qrcode.react`, chuỗi này được "vẽ" thành một bức ảnh ma trận vuông ngay trên trình duyệt máy khách (Client-side rendering). Điều này loại bỏ hoàn toàn gánh nặng phải lưu trữ hàng nghìn file ảnh tĩnh `.png` trên máy chủ.
- **Xử lý Hao mòn khi Trả đồ:** 
  Khi giáo viên mang đồ xuống kho trả, nếu có phát sinh thiết bị bị nứt vỡ. Admin chọn nút "Báo hỏng". Hệ thống thực thi quy trình:
  `soluongtot = soluongtot - 1`
  `soluonghong = soluonghong + 1`
  Đồng thời, lệnh `INSERT INTO lich_su_hao_mon` được gọi để ghi vết lại thời gian, tên giáo viên làm hỏng để làm căn cứ bồi thường hoặc bảo trì cuối năm.

### 4.4. Quản lý trạng thái và Đồng bộ giao diện (State Management)

Một ứng dụng Web hiện đại khác biệt với Website cũ ở chỗ nó không "chớp trắng" trang mỗi khi click. Điều này nhờ vào việc React quản lý bộ nhớ đệm (State) tại Client.

- **Quản lý Form (Local State):** Mọi ô Input (Tên, Số lượng) đều được liên kết với `useState()`. Kỹ thuật này gọi là *Controlled Components*. Nhờ đó, ứng dụng có thể hiển thị cảnh báo ngay lúc giáo viên gõ (Ví dụ: Gõ chữ vào ô Số lượng thì lập tức ô viền báo đỏ, nút Submit bị mờ đi).
- **Chia sẻ dữ liệu toàn cục (Context API / Props):** Dữ liệu về `User` (Họ tên, Ảnh đại diện, Quyền hạn) được lưu vào một `AuthContext`. Context này bọc ngoài cùng ứng dụng (Wrap App). Nhờ vậy, Component `Navbar` ở trên cùng và Component `Profile` ở sâu tít bên trong đều có thể lấy tên Giáo viên ra hiển thị mà không cần phải truyền dữ liệu nối dây qua hàng loạt Component trung gian (tránh hiện tượng Props Drilling).

### 4.5. Xử lý Dữ liệu Local và Kiến trúc Giao tiếp API

Hệ thống tuân thủ một chuẩn giao tiếp chung, giúp Client và Server thống nhất tuyệt đối trong cách "nói chuyện".

*[Hình ảnh: Sơ đồ minh họa luồng gọi API, đi qua Axios Interceptor để gắn Bearer Token trước khi tới Server]*
**Hình 4.8. Luồng giao tiếp API thông qua Axios Interceptor**

- **Axios Interceptor - Kẻ gác cổng API:** Thay vì đi Copy-Paste đoạn mã lấy Token chèn vào hàng chục hàm gọi API khác nhau, ứng dụng khai báo một Interceptor tập trung ngay tại file gốc `frontend/src/main.jsx` (dòng 17 - 39). Interceptor này giống như một Trạm BOT thu phí. Mọi Request (POST, GET) từ React trước khi bay lên mạng Internet đều phải đi qua Trạm này, tự động được nhúng Header: `Authorization: "Bearer <token>"`.
- **Xử lý lỗi Token hết hạn (Global Error Handling):** Khi Token quá 24 giờ, Backend sẽ đá văng Request và trả về mã lỗi HTTP 401. Lúc này, Interceptor ở phía Frontend bắt được lỗi 401, nó sẽ tự động chạy lệnh `localStorage.clear()` (xóa sạch dữ liệu) và `window.location.href = '/login'` (đẩy văng người dùng ra ngoài trang Đăng nhập) kèm thông báo "Phiên đăng nhập hết hạn".

**Bảng 4.2. Chuẩn hóa cấu trúc JSON Trả về từ Server**
Mọi API thành công hay thất bại đều trả về theo form mẫu duy nhất dưới đây để React dễ bắt lỗi:
| Khóa (Key) | Kiểu dữ liệu | Ý nghĩa |
|---|---|---|
| `success` | Boolean (true/false) | Cờ hiệu định đoạt API thành công hay thất bại. |
| `message` | String | Lời nhắn để React bật lên Toast Message (VD: "Duyệt thành công"). |
| `data` | Object / Array | Chứa dữ liệu cốt lõi (Danh sách thiết bị, Danh sách phiếu...). |

### 4.6. Thiết kế Giao diện Responsive (Thích ứng đa thiết bị)

Khác với máy tính bàn của Admin, Giáo viên sử dụng hệ thống chủ yếu bằng màn hình cảm ứng dọc của điện thoại di động (Smartphone). Do đó, giao diện phải co giãn thông minh (Responsive Design).

**Bảng 4.3. Phân tích các hiệu ứng trải nghiệm UX/UI (Responsive)**

| Thành phần Giao diện | Hiển thị trên Máy tính bàn (Desktop - 1024px+) | Hiển thị trên Điện thoại (Mobile - dưới 768px) |
|---|---|---|
| **Thanh Menu (Navigation)** | Nằm cố định bên trái (Sidebar) hoặc trải dài bên trên (Navbar). | Tự động biến mất, thay bằng nút Hamburger (3 dấu gạch ngang), bấm vào mới trượt ra. |
| **Thẻ Thống Kê (Dashboard)** | Xếp thành 4 thẻ nằm ngang trên cùng 1 hàng. | Xếp chồng lên nhau (Column), kéo dài giao diện xuống dưới để cuộn. |
| **Bảng Thời Khóa Biểu** | Lưới (Grid) to bản, hiển thị đầy đủ Thứ 2 đến Thứ 7. | Tích hợp thuộc tính CSS `overflow-x: auto;`. Chữ không bị thu nhỏ (tránh mỏi mắt), người dùng chỉ cần vuốt tay sang ngang để xem các Thứ còn lại. |
| **Nút bấm (Buttons)** | Kích thước chuẩn. Hỗ trợ hiệu ứng đổi màu khi rê chuột (Hover). | Tăng Padding to hơn một chút để ngón tay chạm chính xác không bị ấn nhầm. Bỏ hiệu ứng Hover. |
| **Cửa sổ thông báo (Popup)** | Modal nằm chính giữa màn hình. | Modal sẽ đẩy từ dưới sát mép điện thoại lên (Bottom Sheet) để ngón tay cái dễ dàng chạm nút "Xác nhận". |

Nhờ áp dụng linh hoạt CSS Flexbox, CSS Grid và các câu lệnh `@media queries`, hệ thống mang lại trải nghiệm êm ái tương tự như một ứng dụng Native App cài từ AppStore mà không bắt buộc người dùng phải tải về điện thoại.

### 4.7. Triển khai và chuẩn hóa dữ liệu đầu vào (PPCT & Thời khóa biểu)

Một trong những thách thức thực tế khi triển khai hệ thống tại trường THCS là **dữ liệu nguồn không đồng nhất**: Phân phối chương trình (PPCT) thường được Bộ GD&ĐT và giáo viên bộ môn ban hành dưới dạng **file PDF hoặc bảng Word**, trong khi Thời khóa biểu (TKB) của nhà trường thường nằm trong **file Excel dạng ma trận** (hàng = Thứ/Tiết, cột = Lớp). Ngược lại, cơ sở dữ liệu quan hệ và các thuật toán nghiệp vụ của hệ thống yêu cầu dữ liệu ở dạng **bảng phẳng (Flat Table)** — mỗi dòng tương ứng một bản ghi có thể truy vấn trực tiếp.

Do đó, quy trình triển khai dữ liệu được thiết kế thành **hai giai đoạn**: (1) Chuẩn hóa thủ công/công cụ bảng tính ở phía nhà trường; (2) Import tự động qua module **Công cụ Lịch dạy** (`ScheduleTool`) trên giao diện Admin, sử dụng thư viện **SheetJS (`xlsx`)** ở Frontend và các API `/api/plan/import-ppct`, `/api/plan/import-csv` ở Backend.

#### 4.7.1. Bối cảnh dữ liệu nguồn tại trường THCS

| Loại dữ liệu | Định dạng gốc thường gặp | Vấn đề khi đưa thẳng vào CSDL | Định dạng chuẩn hệ thống yêu cầu |
|---|---|---|---|
| **PPCT** | PDF/Word in sẵn theo mẫu Bộ; bảng nhiều cột (Tuần, Tiết, Tên bài, Ghi chú...) | PDF là tài liệu tĩnh, không có cấu trúc cột; máy tính khó đọc tự động nếu không dùng OCR chuyên dụng | File **Excel (.xlsx)** hoặc **CSV** với cột cố định |
| **TKB tuần** | Excel ma trận toàn trường (Phòng GD xuất) | Một ô chứa đồng thời Môn + GV; khó JOIN với bảng `giao_vien`, `mon_hoc` | File **CSV phẳng**: mỗi dòng = 1 tiết dạy cụ thể |
| **Thiết bị gợi ý** | Ghi chú rời trong PPCT hoặc kinh nghiệm GV | Không có mã định danh thiết bị | Cột **Mã Thiết Bị** tham chiếu bảng `loai_thiet_bi` |

**Lưu ý thiết kế:** Hệ thống **không tích hợp bộ đọc PDF trực tiếp** (tránh phụ thuộc OCR, sai lệch bảng phức tạp). Thay vào đó, em xây dựng **mẫu dữ liệu chuẩn** (lưu tại thư mục `du_lieu/`, ví dụ `Mau_PPCT_CoTuan.csv`, `Mau_TKB_CoTuan.csv`) và quy trình chuyển đổi có thể kiểm tra bằng mắt trước khi import — phù hợp điều kiện triển khai thực tế tại trường.

#### 4.7.2. Quy trình chuyển PPCT từ PDF sang Excel (.xlsx)

PPCT tại trường thường là bản scan hoặc file PDF do tổ bộ môn gửi (ví dụ: PPCT môn Toán 6 của giáo viên Đỗ Thị Hoàng Khanh). Quy trình chuẩn hóa gồm các bước sau:

**Bước 1 — Thu thập và đối chiếu:** Admin/tổ trưởng tải file PDF gốc, mở song song với mẫu Excel hệ thống (`Mau_PPCT.xlsx` hoặc `Mau_PPCT_CoTuan.csv`).

**Bước 2 — Trích xuất nội dung:** Sao chép từng dòng bài học từ PDF sang Excel. Với PDF dạng bảng, có thể:
- Copy trực tiếp vào Excel rồi tách cột bằng *Text to Columns*;
- Hoặc nhập tay từng dòng (phương án an toàn nhất, tránh lệch cột khi PDF bị lỗi font).

**Bước 3 — Ánh xạ sang cột chuẩn:** Mỗi dòng PPCT sau chuẩn hóa phải có cấu trúc:

**Bảng 4.4. Cấu trúc cột file PPCT chuẩn**

| Tên cột | Bắt buộc | Ví dụ | Ghi chú |
|---|---|---|---|
| Mã PPCT | Không | `PPCT_Toan6` | Nhóm theo môn/giáo viên; có thể bỏ trống, hệ thống tự sinh |
| Mã Môn | Có | `TOAN`, `VAN7` | Phải trùng mã trong bảng `mon_hoc` |
| Tuần | Không | `Tuần 35` | Dùng để khớp tiến độ khi import TKB theo tuần |
| Tiết | Có | `133` hoặc `"5,6"` | Một bài 2 tiết ghép ghi `"5,6"` — Backend tách và tạo 2 bản ghi |
| Tên Bài Học | Có | `Bài 1. Tập hợp` | Lưu vào `phan_phoi_chuong_trinh.tenbaihoc` |
| Loại Phòng | Không | `Phòng Tin học` | Ghi chú yêu cầu phòng/thiết bị đặc thù |
| Mã Thiết Bị | Không | `MAY_CHIEU` hoặc `TB_01:2, TB_02` | `Mã:SL` nếu nhiều thiết bị; mặc định SL = 1 |

**Ví dụ thực tế** (trích từ dữ liệu thử nghiệm `du_lieu/Mau_PPCT_CoTuan.csv`):

```
Mã PPCT,Mã Môn,Tuần,Tiết,Tên Bài Học,Loại Phòng,Mã Thiết Bị
PPCT_VAN7,VAN7,Tuần 35,139,Trả bài kiểm tra cuối kì II (tiết 1),Phòng học,MAY_CHIEU
```

**Bước 4 — Xử lý các trường hợp đặc biệt:**
- **Tiết ghép:** Trong file nguồn `ppct_toan6_khanh.csv`, cột Tiết ghi `"5,6"` cho một bài dạy 2 tiết. Khi import, Backend tách chuỗi theo dấu phẩy và INSERT/UPDATE từng tiết riêng.
- **Thiết bị gợi ý:** Cột `Mã Thiết Bị` được Frontend parse thành mảng `{ maloaitb, soluong }`, lưu vào bảng `goi_y_thiet_bi` nếu mã tồn tại trong kho.

**Bước 5 — Upload vào hệ thống:** Admin vào **Quản lý Kho → Công cụ Lịch dạy → Import PPCT**, chọn file `.xlsx`. Luồng xử lý:

```
PDF gốc (trường)
    ↓  [Chuẩn hóa thủ công trên Excel]
File Mau_PPCT.xlsx / .csv
    ↓  [SheetJS đọc sheet đầu tiên]
Frontend map cột → mảng ppctList (JSON)
    ↓  POST /api/plan/import-ppct
Backend: UPSERT PHAN_PHOI_CHUONG_TRINH + GOI_Y_THIET_BI
    ↓
PostgreSQL lưu trữ vĩnh viễn
```

#### 4.7.3. Quy trình chuyển Thời khóa biểu từ dạng ma trận sang dạng phẳng (Flat CSV)

TKB do Phòng GD hoặc phần mềm sổ điểm xuất ra thường có dạng **ma trận 2 chiều**:

- **Trục dọc:** Thứ (2→7), buổi Sáng/Chiều, tiết 1→5 (hoặc 1→10).
- **Trục ngang:** Mỗi lớp (6A1, 6A2...) gồm **2 cột con**: Tên môn | Tên/viết tắt giáo viên.
- **Một ô** có thể chứa: `Toán` + `Khanh`, hoặc để trống, hoặc `Chào cờ`/`SHL`.

Cấu trúc này tiện cho con người đọc nhưng **không phù hợp** với CSDL quan hệ. Hệ thống yêu cầu **bảng phẳng (Unpivot / Normalize)**, trong đó **mỗi dòng = một tiết dạy duy nhất**:

**Bảng 4.5. Cấu trúc cột file TKB phẳng (Flat CSV)**

| Tên cột | Bắt buộc | Ví dụ | Ý nghĩa |
|---|---|---|---|
| Ngay | Có | `25/05/2026` | Ngày dạy thực tế (DD/MM/YYYY) |
| tuan | Không | `35` | Số tuần — dùng khớp offset PPCT |
| MaGV | Có | `mhue`, `kien`, `Đ.Lý` | Tên viết tắt, tài khoản, hoặc mã GV |
| lop | Có | `7A1` | Mã lớp |
| mamon | Có | `VAN7`, `TOAN` | Mã môn (đã chuẩn hóa IN HOA) |
| tiet | Có | `1`, `2` | Tiết trong buổi (1–5 sáng, 1–3 chiều) |
| buoi | Không | `Sáng`, `Chiều (Buổi 1)` | Dùng quy đổi tiết thực (chiều +5) |

**Ví dụ chuyển đổi:**

*Trước (ma trận — minh họa):*

| Thứ | Thời gian | 7A1 (Môn) | 7A1 (GV) | 7A2 (Môn) | 7A2 (GV) |
|---|---|---|---|---|---|
| 2 | Sáng tiết 1 | Văn | M.Huệ | Toán | Đ.Lý |
| 2 | Sáng tiết 2 | Văn | M.Huệ | Toán | Đ.Lý |

*Sau (phẳng — `Mau_TKB_CoTuan.csv`):*

```
Ngay,tuan,MaGV,lop,mamon,tiet,buoi
25/05/2026,35,mhue,7A1,VAN7,1,Sáng
25/05/2026,35,mhue,7A1,VAN7,2,Sáng
25/05/2026,35,dly,7A2,TOAN,1,Sáng
25/05/2026,35,dly,7A2,TOAN,2,Sáng
```

**Các bước chuẩn hóa thực hiện tại trường:**

1. **Unpivot ma trận:** Duyệt từng ô môn học (bỏ qua `Chào cờ`, `SHL`, ô trống). Với mỗi ô hợp lệ, tạo một dòng CSV gồm: Thứ → quy sang **Ngày cụ thể** theo tuần đang import; Tiết + Buổi → cột `tiet`, `buoi`; Lớp → `lop`; Môn → chuyển tên tiếng Việt sang **mã** (`Văn` → `VAN`, `Toán` → `TOAN`...); GV → cột `MaGV`.
2. **Chuẩn hóa mã môn:** File gốc `tkb_thcs_converted.csv` dùng tên tiếng Việt (`Văn`, `C.nghệ`); file chuẩn `tkb_final_format.csv` dùng mã IN HOA (`VAN`, `C.NGHE`) khớp bảng `mon_hoc`.
3. **Chuẩn hóa giáo viên:** File TKB thường ghi tên viết tắt (`Nhung`, `Đ.Lý`, `M.Huệ`) hoặc tài khoản (`mhue`, `kien`). Backend có thuật toán `findTeacher()` khớp đa cấp (xem mục 4.7.5).
4. **Lọc buổi phụ:** Bỏ các dòng `Buổi 2`, `SHL`, `CHAOCO` — chỉ giữ buổi chính khóa.

Ngoài luồng CSV phẳng, hệ thống còn hỗ trợ **import TKB mẫu tuần dạng ma trận Excel** qua API `/api/plan/import-tkb`: Frontend quét hàng có chữ "Thứ", đọc cặp cột (Môn | GV) theo từng lớp, sinh mảng `{ thu, tiethoc, malop, mamon, magv }` lưu vào bảng `tkb_tuan` (lịch khung cố định, không theo ngày cụ thể). Luồng này phục vụ thuật toán **sinh lịch tự động** (`generateSchedule`); luồng CSV phẳng phục vụ **TKB thực tế theo tuần** mà giáo viên dùng để mượn thiết bị.

#### 4.7.4. Kiến trúc lưu trữ dữ liệu sau import

Sau khi dữ liệu được chuẩn hóa và import, hệ thống phân tán vào các bảng có quan hệ:

```
phan_phoi_chuong_trinh (PPCT)
    ├── goi_y_thiet_bi (mappct → maloaitb, soluongdexuat)
    │
thoi_khoa_bieu (TKB thực tế theo ngày)
    ├── mappct (FK → PPCT, khớp tự động khi import CSV)
    ├── magv, malop, mamon, ngayhoc, tiethoc
    │
    └── phieu_muon (tự sinh bản nháp nếu có gợi ý thiết bị)

tkb_tuan (Lịch mẫu tuần — ma trận, không có ngày)
tien_do_giang_day (malop + mamon → tiet_ppct_hien_tai)
```

**Bảng 4.6. Vai trò từng bảng dữ liệu**

| Bảng | Nguồn import | Mục đích sử dụng |
|---|---|---|
| `phan_phoi_chuong_trinh` | File PPCT (.xlsx) | Danh mục bài học theo tiết; căn cứ gợi ý thiết bị |
| `goi_y_thiet_bi` | Cột Mã Thiết Bị trong PPCT | Popup gợi ý khi GV lập phiếu mượn |
| `thoi_khoa_bieu` | File TKB phẳng (.csv) | Hiển thị lưới tuần cho GV; liên kết phiếu mượn |
| `tkb_tuan` | File TKB ma trận (.xlsx) | Khung giờ cố định; thuật toán rải PPCT theo tuần |
| `tien_do_giang_day` | Tự cập nhật sau import CSV | Nhớ tiến độ PPCT hiện tại của từng lớp-môn |

#### 4.7.5. Thuật toán đọc dữ liệu và xử lý tại Backend

Module `planController.js` triển khai bốn thuật toán chính liên quan đến dữ liệu PPCT/TKB:

**A. Thuật toán Import PPCT (`importPPCT`)**

1. Nhận mảng `ppctList` từ Frontend (JSON).
2. Với mỗi bản ghi, **tách cột Tiết** nếu có dạng `"3,4"` → danh sách số nguyên.
3. Với từng tiết: tra cứu `(mamon, tietthu)` trong `PHAN_PHOI_CHUONG_TRINH`.
   - **Đã tồn tại:** `UPDATE` tên bài, loại phòng, tuần.
   - **Chưa có:** `INSERT` với `mappct` tự tăng.
4. Nếu có `equipments[]`: xóa gợi ý cũ → INSERT vào `GOI_Y_THIET_BI` (chỉ mã thiết bị tồn tại trong kho).
5. Toàn bộ bọc trong `BEGIN` / `COMMIT`; lỗi thì `ROLLBACK`.

**B. Thuật toán Import TKB phẳng (`importCSV`) — cốt lõi nhất**

Gồm 6 bước xử lý:

| Bước | Mô tả | Chi tiết kỹ thuật |
|---|---|---|
| 0 | Nạp danh mục tra cứu | Load toàn bộ `giao_vien` (magv, tengv, taikhoan) và `mon_hoc` |
| 1 | Lọc & chuẩn hóa dòng | Bỏ Buổi 2, SHL, CHAOCO; chuẩn hóa mã môn IN HOA; parse ngày DD/MM/YYYY |
| 2 | Khớp tên giáo viên | Hàm `findTeacher()`: thử lần lượt khớp magv → taikhoan → tên đầy đủ → tên gọi → viết tắt có dấu chấm (`Đ.Lý`) → substring |
| 3 | Xác định phạm vi tuần | Tính `minDate`, `maxDate` từ các dòng hợp lệ |
| 4 | Xóa TKB cũ trong tuần | `DELETE FROM thoi_khoa_bieu WHERE ngayhoc BETWEEN min AND max AND chưa có phiếu mượn` |
| 5 | Nhóm & khớp PPCT | Nhóm theo `(magv, lop, mamon, tuan)`; sắp xếp theo ngày+tiết; tính **offset PPCT** |
| 6 | Insert & sinh phiếu nháp | Ghi `thoi_khoa_bieu`; nếu có `mappct` và gợi ý thiết bị → tạo `phieu_muon` trạng thái `BanNhap` |

**C. Thuật toán tính Offset PPCT (khớp TKB với bài học)**

Đây là bài toán quan trọng: TKB chỉ cho biết *khi nào dạy*, PPCT cho biết *dạy bài gì*. Hệ thống cần suy ra bài học tương ứng:

- **Nếu CSV có cột `tuan`:** Tìm trong PPCT bài đầu tiên có trường `tuan` chứa `"Tuần 35"`. Chỉ số bài đó là `offset`.
- **Nếu không có tuần:** Đếm tiết PPCT lớn nhất đã dạy trước `minDate` (`MAX(tietthu)` từ TKB cũ) làm offset.
- Với mỗi slot trong tuần (đã sắp xếp): `ppctIndex = offset + i` → lấy `mappct = ppctList[ppctIndex]`.

**Quy đổi tiết chiều:** Nếu `buoi` chứa "Chiều", `tietThuc = tiet + 5` (tiết chiều buổi 1 map sang tiết 6–8 trong CSDL).

**D. Thuật toán sinh lịch tự động (`generateSchedule`)**

Dùng khi trường mới setup, chưa có TKB thực tế theo ngày:
1. Lấy toàn bộ PPCT của môn, sắp theo `tietthu`.
2. Lấy khung giờ từ `tkb_tuan` (hoặc fallback từ `thoi_khoa_bieu` đã có).
3. Duyệt từng ngày kể từ `ngayBatDau`: nếu thứ khớp khung giờ → gán bài học tiếp theo vào `thoi_khoa_bieu`.
4. Dừng khi hết danh sách PPCT.

**E. Thuật toán dịch lịch (`shiftSchedule`)**

Khi nghỉ bão/lễ: `UPDATE thoi_khoa_bieu SET ngayhoc = ngayhoc + N ngày` cho các bài từ `tuNgay` trở đi — giữ nguyên thứ tự PPCT, chỉ dời thời gian.

#### 4.7.6. Phân tích chi tiết mã nguồn xử lý thuật toán PPCT và TKB

Dưới đây là trích đoạn mã nguồn thực tế thể hiện thuật toán Mapping tên Giáo viên và Khớp nối PPCT được cài đặt bằng Node.js tại Backend:

**A. Thuật toán Chuẩn hóa và Fuzzy Matching Tên Giáo viên**
Để xử lý việc tên giáo viên trên file TKB thường bị viết tắt, thuật toán dưới đây sẽ chuẩn hóa và tìm kiếm theo nhiều mức độ ưu tiên:
```javascript
const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

const normalize = (str) => {
    return removeDiacritics((str || "").trim()).replace(/\.\./g, ".").replace(/\s+/g, " ").toLowerCase();
};

const findTeacher = (csvName, teachers) => {
    const name = normalize(csvName);
    const rawLower = csvName.trim().toLowerCase();

    // 1. Khớp mã GV hoặc Tài khoản đăng nhập (Chính xác cao nhất)
    let found = teachers.find(t => t.magv.toLowerCase() === rawLower || (t.taikhoan || "").toLowerCase() === rawLower);
    if (found) return found.magv;

    // 2. Khớp Tên đầy đủ hoặc Tên gọi (từ cuối cùng)
    found = teachers.find(t => {
        const parts = normalize(t.tengv).split(" ");
        return normalize(t.tengv) === name || parts[parts.length - 1] === name;
    });
    if (found) return found.magv;

    // 3. Khớp tên viết tắt có dấu chấm (VD: "Đ.Lý" -> Đặng Thị Lý)
    if (name.includes(".")) {
        const dotParts = name.split(".").filter(p => p.length > 0);
        if (dotParts.length >= 2) {
            const initials = dotParts.slice(0, -1).map(p => normalize(p));
            const lastName = normalize(dotParts[dotParts.length - 1]);

            found = teachers.find(t => {
                const fullParts = normalize(t.tengv).split(" ");
                if (fullParts[fullParts.length - 1] !== lastName) return false;
                const otherParts = fullParts.slice(0, -1);
                return initials.every(initial => otherParts.some(part => part.startsWith(initial)));
            });
            if (found) return found.magv;
        }
    }
    return null;
};
```

**B. Thuật toán Tính toán Offset và Khớp nối PPCT vào TKB**
Hệ thống tự động nối tiết dạy thực tế với bài học tương ứng trong PPCT, đồng thời tạo luôn Phiếu mượn thiết bị nháp nếu bài học đó có thiết bị gợi ý.
```javascript
// Tính toán Offset bài học dựa vào Tuần hoặc Dữ liệu lịch sử
let offset = 0;
if (tuanKey) {
    const firstLessonIndex = ppctList.findIndex(p => p.tuan && p.tuan.includes(weekStr));
    if (firstLessonIndex !== -1) offset = firstLessonIndex;
    else offset = await getHistoricalMaxTiet(maLop, maMon); // Hàm phụ truy vấn DB
} else {
    offset = await getHistoricalMaxTiet(maLop, maMon);
}

// Khớp nối TKB và sinh phiếu mượn tự động
for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const ppctIndex = offset + i;
    const mappct = (ppctIndex < ppctList.length) ? ppctList[ppctIndex].mappct : null;
    
    // Tính tiết thực dựa trên buổi học
    let tietThuc = slot.tiet + (slot.buoi.toLowerCase().includes("chiều") ? 5 : 0);

    const resultTkb = await pool.query(
        "INSERT INTO THOI_KHOA_BIEU (magv, malop, mamon, mappct, ngayhoc, tiethoc) VALUES ($1, $2, $3, $4, $5, $6) RETURNING matkb",
        [maGV, maLop, maMon, mappct, slot.dateStr, tietThuc]
    );

    // Tự động sinh Phiếu Mượn Nháp nếu bài học có thiết bị gợi ý
    if (mappct) {
        const gyRes = await pool.query("SELECT maloaitb, soluongdexuat FROM GOI_Y_THIET_BI WHERE mappct = $1", [mappct]);
        if (gyRes.rows.length > 0) {
            const maPhieu = "PM" + Date.now();
            await pool.query("INSERT INTO PHIEU_MUON (MaPhieu, MaTKB, NguoiMuon, TrangThai) VALUES ($1, $2, $3, 'BanNhap')", [maPhieu, resultTkb.rows[0].matkb, maGV]);
            for (const gy of gyRes.rows) {
                await pool.query("INSERT INTO CHI_TIET_PHIEU (MaPhieu, MaLoaiTB, SoLuongDK) VALUES ($1, $2, $3)", [maPhieu, gy.maloaitb, gy.soluongdexuat]);
            }
        }
    }
}
```

#### 4.7.7. Thuật toán đọc dữ liệu tại Frontend

Component `ScheduleTool.jsx` xử lý hai luồng đọc file:

**Import PPCT (Excel):**
```javascript
// Đọc file nhị phân → SheetJS parse sheet đầu tiên
const workbook = XLSX.read(data);
const jsonData = XLSX.utils.sheet_to_json(worksheet);

// Map linh hoạt tên cột (tiếng Việt hoặc snake_case)
const ppctList = jsonData.map(row => ({
  mamon: row["Mã Môn"] || row["mamon"],
  tietthu: row["Tiết"] || row["tietthu"],
  tenbaihoc: row["Tên Bài Học"] || row["tenbaihoc"],
  equipments: parseEquipments(row["Mã Thiết Bị"])  // "TB_01:2, TB_02"
}));
```

**Import TKB (CSV):**
- Đọc text UTF-8, tự parse CSV có hỗ trợ **dấu ngoặc kép** (tránh vỡ cột khi tên môn có dấu phẩy).
- Header không phân biệt hoa thường; chấp nhận alias (`Ngày`/`ngay`, `Giáo viên`/`MaGV`/`gv`...).
- Gửi mảng `rows` lên `/api/plan/import-csv`.

#### 4.7.8. Luồng dữ liệu end-to-end (từ PDF trường đến Gợi ý thiết bị)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ PPCT PDF/Word   │────▶│ Excel chuẩn      │────▶│ PHAN_PHOI_CHUONG_   │
│ (tài liệu gốc)  │     │ (Mau_PPCT.xlsx)  │     │ TRINH + GOI_Y_TB    │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                            │
┌─────────────────┐     ┌──────────────────┐                │ mappct
│ TKB ma trận     │────▶│ CSV phẳng        │────▶ THOI_KHOA_BIEU ◀──────┘
│ (Excel trường)  │     │ (Mau_TKB.csv)    │      (ngày + tiết + lớp)
└─────────────────┘     └──────────────────┘                │
                                                            ▼
                                              ┌─────────────────────────┐
                                              │ Giáo viên click tiết TKB │
                                              │ → Popup gợi ý thiết bị   │
                                              │ → Lập phiếu mượn tuần    │
                                              └─────────────────────────┘
```

**Bảng 4.7. Kết quả import và thông báo hệ thống**

| Tình huống | Phản hồi hệ thống |
|---|---|
| Import PPCT thành công | `"✅ Đã import thành công N bài học PPCT!"` |
| Import TKB thành công | Báo số tiết insert, số tiết khớp PPCT, khoảng ngày tuần |
| Tên GV không khớp | Cảnh báo danh sách tên bị bỏ qua; các dòng khác vẫn import |
| Mã môn không tồn tại | Bỏ qua dòng; ghi log môn bị skip |
| Mã thiết bị không có trong kho | Bỏ qua gợi ý đó; PPCT vẫn lưu bình thường |

#### 4.7.9. Đánh giá và hướng cải tiến

Quy trình hiện tại **cân bằng giữa tính thực tiễn và độ tin cậy**: bước chuyển PDF → Excel và ma trận → CSV do con người kiểm soát, tránh sai sót OCR; bước import và khớp PPCT/TKB do máy xử lý, giảm 90% công nhập liệu lặp lại mỗi tuần.

Hướng phát triển có thể bổ sung:
- Script Python/Node tự **unpivot** file TKB ma trận Excel → CSV phẳng (giảm bước thủ công).
- Tích hợp **tabula-py** hoặc công cụ trích xuất bảng PDF cho PPCT có cấu trúc cố định.
- Giao diện **preview** trước khi commit import, cho Admin sửa trực tiếp dòng lỗi khớp GV.

*[Hình ảnh: Ảnh chụp màn hình module Import PPCT và Import TKB trong trang Quản lý Kho — ScheduleTool]*
**Hình 4.9. Giao diện Import dữ liệu PPCT và TKB**

*[Hình ảnh: So sánh 2 cột — bên trái TKB ma trận Excel gốc, bên phải file CSV phẳng sau chuẩn hóa]*
**Hình 4.10. Minh họa chuyển đổi TKB từ ma trận sang dạng phẳng**
