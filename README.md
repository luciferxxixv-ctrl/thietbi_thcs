# Hệ Thống Quản Lý Thiết Bị Dạy Học THCS

Đây là hệ thống quản lý mượn, trả và thống kê thiết bị dạy học dành cho trường Trung học Cơ sở (THCS). Hệ thống giúp số hóa và tự động hóa quy trình quản lý kho thiết bị, hỗ trợ giáo viên đăng ký mượn đồ dùng thực hành một cách tiện lợi và chính xác nhất.

## 🌟 Các tính năng nổi bật

- **Quản lý người dùng đa quyền:** Phân chia rõ ràng giữa Quản trị viên (Admin - nhân viên thiết bị) và Giáo viên.
- **Tích hợp Thời khóa biểu (TKB) & Phân phối chương trình (PPCT):** Hệ thống có khả năng tự động gợi ý các thiết bị cần mượn cho các tiết học trong tuần dựa vào PPCT và TKB của từng giáo viên.
- **Quản lý mượn/trả bằng mã QR:** 
  - Tạo và in tem mã QR cho từng thiết bị trực tiếp trên hệ thống.
  - Quét mã QR bằng Camera điện thoại hoặc máy tính để duyệt phiếu mượn, giao đồ và nhận đồ trả lại một cách nhanh chóng.
- **Cảnh báo xung đột thiết bị:** Tự động thông báo nếu nhiều giáo viên cùng mượn một thiết bị vượt quá số lượng tồn kho trong cùng một tiết học.
- **Quản lý hao mòn & Lịch sử:** Theo dõi sát sao tình trạng thiết bị (tốt, hỏng, mất) sau mỗi lần sử dụng.
- **Xuất/Nhập dữ liệu Excel:** Hỗ trợ nhập TKB, PPCT, danh sách giáo viên từ file Excel (.csv) và xuất báo cáo tồn kho.
- **Thông báo thời gian thực:** Nhận thông báo (Real-time) khi có phiếu mượn mới hoặc khi phiếu mượn được duyệt/từ chối.

## 🛠️ Công nghệ sử dụng

- **Frontend:** ReactJS (Vite), React Router, Bootstrap 5, Axios, HTML5-QRCode, Socket.io-client.
- **Backend:** Node.js, Express, Socket.io (Real-time), JWT (Xác thực).
- **Cơ sở dữ liệu:** PostgreSQL.

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ (Local)

Để chạy dự án này trên máy cá nhân, bạn cần cài đặt sẵn **Node.js** và hệ quản trị cơ sở dữ liệu **PostgreSQL**.

### Bước 1: Tải mã nguồn về máy
```bash
git clone https://github.com/luciferxxixv-ctrl/thietbi_thcs.git
cd thietbi_thcs
```

### Bước 2: Khởi tạo Cơ sở dữ liệu (Database)
1. Mở công cụ quản lý PostgreSQL (như pgAdmin hoặc DBeaver).
2. Tạo một database mới, ví dụ: `thietbi_thcs`.
3. Import cấu trúc và dữ liệu mẫu từ file `thietbi_thcs.sql` nằm ở thư mục gốc của dự án vào database vừa tạo.

### Bước 3: Cấu hình và chạy Backend
1. Mở terminal, di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Tạo một file `.env` ở trong thư mục `backend` và điền cấu hình cơ sở dữ liệu của bạn:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/thietbi_thcs
   JWT_SECRET=mot_chuoi_bi_mat_bat_ky_cho_jwt
   FRONTEND_URL=http://localhost:5173
   ```
   *(Nhớ thay `<username>` và `<password>` bằng thông tin đăng nhập PostgreSQL của bạn).*
4. Khởi động server backend:
   ```bash
   npm run dev
   ```

### Bước 4: Cấu hình và chạy Frontend
1. Mở một terminal khác, di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. (Tùy chọn) Tạo file `.env` trong thư mục `frontend` nếu backend của bạn chạy ở port khác:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Khởi động ứng dụng React:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt và truy cập `http://localhost:5173`.

## 📌 Hướng dẫn sử dụng cơ bản

- **Tài khoản mặc định:** Sau khi import database, bạn có thể đăng nhập bằng các tài khoản giáo viên/admin đã có sẵn trong bảng `GIAO_VIEN`, mật khẩu mặc định cho các tài khoản thường là `123456`.
- **Vai trò Giáo viên:** Có thể xem TKB, lịch giảng dạy, thêm phiếu mượn (được gợi ý sẵn thiết bị theo PPCT), và theo dõi tình trạng mượn trả của mình.
- **Vai trò Admin:** Vào trang `/admin` để duyệt phiếu, quản lý thiết bị, nhập dữ liệu (Excel), in tem QR và quản lý tình trạng hao mòn.

## 📝 Giấy phép
Dự án được phát triển phục vụ cho mục đích quản lý nội bộ và học tập.
