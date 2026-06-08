# Tài Liệu Tham Khảo

Dưới đây là danh sách các tài liệu, thư viện và công nghệ đã được tham khảo, áp dụng trong quá trình phân tích, thiết kế và xây dựng **Hệ Thống Quản Lý Thiết Bị Dạy Học THCS**.

## 1. Công nghệ Frontend (Giao diện người dùng)
- **[React Documentation](https://react.dev/):** Tài liệu chính thức của ReactJS, nền tảng cốt lõi được sử dụng để xây dựng giao diện người dùng theo hướng Component.
- **[Vite](https://vitejs.dev/):** Công cụ phát triển và đóng gói Frontend hiện đại, tối ưu tốc độ build.
- **[React Router](https://reactrouter.com/):** Thư viện quản lý điều hướng (Routing) cho ứng dụng Single Page Application (SPA).
- **[Bootstrap 5](https://getbootstrap.com/):** Framework CSS hỗ trợ thiết kế giao diện đáp ứng (responsive layout) một cách nhanh chóng.
- **[Axios](https://axios-http.com/):** Thư viện Promise-based HTTP client hỗ trợ kết nối và trao đổi dữ liệu (gọi API) giữa Frontend và Backend.
- **[HTML5-QRCode](https://github.com/mebjas/html5-qrcode):** Thư viện hỗ trợ tính năng đọc, quét mã QR Code trực tiếp qua camera của thiết bị trên trình duyệt web.
- **[SheetJS (xlsx)](https://docs.sheetjs.com/):** Thư viện xử lý việc đọc (import) và xuất (export) dữ liệu bảng tính Excel.

## 2. Công nghệ Backend (Máy chủ & API)
- **[Node.js](https://nodejs.org/):** Nền tảng thực thi mã JavaScript phía máy chủ, đảm nhiệm xử lý logic nghiệp vụ.
- **[Express.js](https://expressjs.com/):** Framework tối giản dành cho Node.js, hỗ trợ xây dựng các RESTful API.
- **[Socket.io](https://socket.io/):** Thư viện hỗ trợ giao tiếp hai chiều thời gian thực (Real-time), ứng dụng để đẩy thông báo trạng thái phiếu mượn/trả tới người dùng.
- **[JSON Web Token (JWT)](https://jwt.io/):** Chuẩn mở (RFC 7519) định nghĩa phương thức xác thực và truyền tải thông tin an toàn giữa các bên dưới dạng một đối tượng JSON.
- **[Nodemailer](https://nodemailer.com/):** Module của Node.js giúp dễ dàng gửi email (nếu được mở rộng cho tính năng thông báo qua mail).

## 3. Cơ sở dữ liệu (Database)
- **[PostgreSQL](https://www.postgresql.org/):** Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, mã nguồn mở, đảm bảo tính toàn vẹn và độ tin cậy của dữ liệu.
- **[node-postgres (pg)](https://node-postgres.com/):** Thư viện kết nối thuần JavaScript để tương tác giữa Node.js và PostgreSQL.

## 4. Nền tảng triển khai (Hosting & Deployment)
- **[Vercel](https://vercel.com/docs):** Nền tảng tối ưu dùng để triển khai (deploy) ứng dụng React Frontend.
- **[Render / Railway](https://render.com/docs):** Nền tảng đám mây dùng để triển khai Backend Node.js và lưu trữ cơ sở dữ liệu PostgreSQL trực tuyến.
- **[GitHub](https://github.com/):** Dịch vụ lưu trữ mã nguồn và quản lý phiên bản (Version Control) bằng Git.

## 5. Tài liệu nghiệp vụ & Chuyên ngành
- Các văn bản, thông tư hướng dẫn của Bộ Giáo dục và Đào tạo về danh mục thiết bị dạy học tối thiểu dành cho cấp Trung học cơ sở.
- Biểu mẫu, sổ sách quản lý thiết bị, thực hành thí nghiệm truyền thống đang được áp dụng tại các trường THCS (được dùng làm cơ sở số hóa).
