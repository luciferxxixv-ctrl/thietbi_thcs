# BÁO CÁO ĐỒ ÁN
**Đề tài: XÂY DỰNG HỆ THỐNG QUẢN LÝ THIẾT BỊ TRƯỜNG THCS**

---

## LỜI CẢM ƠN
Trước hết, em xin gửi lời cảm ơn chân thành và sâu sắc đến Thầy/Cô [Tên_Giảng_Viên_Hướng_Dẫn] người đã tận tình hướng dẫn, góp ý và hỗ trợ em trong suốt quá trình thực hiện đồ án. Những kiến thức và kinh nghiệm quý báu mà Thầy/Cô chia sẻ đã giúp em định hướng và hoàn thiện sản phẩm một cách hiệu quả hơn.

Em cũng xin cảm ơn khoa [Tên_Khoa] và nhà trường đã tạo điều kiện thuận lợi, cung cấp môi trường học tập và nghiên cứu tốt để em có cơ hội tiếp cận với công nghệ mới và phát triển kỹ năng thực tế thông qua đồ án này.

Cuối cùng, em xin gửi lời cảm ơn đến gia đình, bạn bè và các anh/chị khóa trước đã động viên, hỗ trợ em trong suốt quá trình học tập cũng như khi thực hiện báo cáo.

Mặc dù đã cố gắng hoàn thiện nội dung một cách đầy đủ và khoa học, nhưng do hạn chế về kiến thức và kinh nghiệm thực tiễn, báo cáo không tránh khỏi những thiếu sót. Em rất mong nhận được sự góp ý từ các Thầy/Cô để em có thể rút kinh nghiệm và hoàn thiện bản thân hơn trong tương lai.

---

## LỜI MỞ ĐẦU
Trong bối cảnh công nghệ thông tin ngày càng phát triển mạnh mẽ và được ứng dụng rộng rãi vào mọi lĩnh vực của đời sống xã hội, công tác chuyển đổi số trong giáo dục đang trở thành một xu hướng tất yếu. Việc quản lý cơ sở vật chất, đặc biệt là các thiết bị dạy học tại các trường Trung học Cơ sở (THCS) đòi hỏi tính chính xác, minh bạch và hiệu quả cao nhằm phục vụ tốt nhất cho công tác giảng dạy.

Tuy nhiên, thực tế hiện nay tại nhiều trường học, việc quản lý thiết bị vẫn còn phụ thuộc nhiều vào các phương pháp thủ công như ghi chép sổ sách hoặc quản lý qua file Excel rời rạc. Điều này không chỉ gây mất thời gian, dễ xảy ra sai sót, thất thoát mà còn gây khó khăn trong việc tra cứu, thống kê và theo dõi tình trạng thiết bị. 

Nhằm giải quyết những hạn chế trên, em đã quyết định chọn đề tài **"Xây dựng hệ thống quản lý thiết bị trường THCS"**. Hệ thống được xây dựng dưới dạng một ứng dụng Web (Web Application) hiện đại, sử dụng các công nghệ tiên tiến như ReactJS cho giao diện người dùng và NodeJS cùng hệ quản trị cơ sở dữ liệu PostgreSQL cho phần xử lý nghiệp vụ backend. Mục tiêu của hệ thống là cung cấp một công cụ trực quan, tự động hóa quy trình mượn/trả, theo dõi bảo trì, thanh lý thiết bị và hỗ trợ quản lý kho một cách chuyên nghiệp.

Báo cáo này sẽ trình bày chi tiết toàn bộ quá trình thực hiện dự án: từ việc khảo sát yêu cầu thực tế, phân tích và thiết kế hệ thống, lựa chọn công nghệ, cho đến quá trình xây dựng mã nguồn và kiểm thử. 

Em hy vọng hệ thống này sẽ mang lại những giá trị thực tiễn nhất định, góp phần tối ưu hóa công tác quản lý tài sản tại các trường học và là minh chứng cho sự nỗ lực học hỏi, rèn luyện của bản thân trong suốt thời gian qua.

---

## MỤC LỤC
**CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI**
**CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ**
**CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG**
**CHƯƠNG 4: THỰC HIỆN VÀ TRIỂN KHAI**
**CHƯƠNG 5: KIỂM THỬ VÀ ĐÁNH GIÁ**
**KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**

---

## CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI

### 1.1. Bối cảnh và lý do chọn đề tài
Trong thời đại cách mạng công nghiệp 4.0, ứng dụng công nghệ thông tin vào công tác quản lý giáo dục là một trong những nhiệm vụ trọng tâm. Hệ thống thiết bị, đồ dùng dạy học tại các trường Trung học Cơ sở (THCS) rất đa dạng và phong phú, bao gồm các thiết bị thực hành vật lý, hóa học, sinh học, công nghệ thông tin... 

Tại nhiều trường học hiện nay, công tác quản lý các thiết bị này chủ yếu được thực hiện bằng sổ sách giấy tờ hoặc bằng các phần mềm quản lý văn bản đơn giản. Quá trình đăng ký mượn/trả thiết bị của giáo viên đòi hỏi nhiều bước phê duyệt thủ công, làm mất thời gian của cả giáo viên và người quản lý thiết bị. Ngoài ra, việc theo dõi tình trạng hư hỏng, lịch bảo trì, hay việc kiểm kê tài sản cuối năm gặp rất nhiều khó khăn và dễ gây thất thoát.

Xuất phát từ nhu cầu thực tiễn đó, việc xây dựng một hệ thống thông tin chuyên dụng để quản lý thiết bị tại các trường THCS là vô cùng cấp thiết. Hệ thống này không chỉ giúp số hóa toàn bộ quy trình quản lý kho, mượn/trả thiết bị mà còn cung cấp các báo cáo thống kê nhanh chóng và chính xác. Do đó, em đã lựa chọn đề tài **"Xây dựng hệ thống quản lý thiết bị trường THCS"** làm đề tài cho đồ án của mình.

### 1.2. Mục tiêu nghiên cứu
Mục tiêu chính của đề tài là xây dựng một hệ thống Web hỗ trợ quản lý toàn diện các nghiệp vụ liên quan đến thiết bị trường học, tối ưu hóa quy trình làm việc cho các bộ phận liên quan. Cụ thể:
- **Số hóa danh mục thiết bị:** Quản lý chi tiết thông tin thiết bị (tên, mã số, số lượng, tình trạng, vị trí kho, mã QR).
- **Tự động hóa quy trình mượn/trả:** Xây dựng quy trình đăng ký mượn theo Phiếu tuần, xét duyệt và hoàn trả thiết bị trực tuyến.
- **Quản lý bảo trì và thanh lý:** Cung cấp tính năng lập kế hoạch bảo trì, ghi nhận lịch sử hư hỏng, sửa chữa và thanh lý thiết bị cũ.
- **Hệ thống nhắc nhở:** Tích hợp tính năng gửi Email tự động nhắc nhở trả thiết bị hoặc thông báo mượn đồ.
- **Tiện ích mở rộng:** Hỗ trợ tính năng in ấn mã QR để dán lên thiết bị và tra cứu nhanh.

### 1.3. Phạm vi nghiên cứu

**1.3.1. Phạm vi về không gian và đối tượng quản lý**
- Đề tài tập trung xây dựng hệ thống dành riêng cho các trường THCS, nơi có đặc thù về việc sử dụng chung các thiết bị thực hành (Lý, Hóa, Sinh) và thiết bị giảng dạy chung.
- Đối tượng quản lý cốt lõi: Hồ sơ người dùng (Quản trị viên/Thủ kho, Giáo viên), Danh mục tài sản, Lịch sử hao mòn và các Phiếu mượn trả tuần.

**1.3.2. Phạm vi về chức năng nghiệp vụ**
- **Số hóa quy trình mượn/trả:** Giáo viên lên kế hoạch đăng ký mượn thiết bị trước theo tuần, tự động đối chiếu với thời khóa biểu và kiểm tra tình trạng tồn kho theo thời gian thực.
- **Quản lý kho bãi & Hao mòn:** Hỗ trợ quản trị viên nhập danh mục mới, theo dõi số lượng tốt/hỏng/mất và quét mã QR. 
- *Giới hạn đề tài:* Hệ thống tập trung chuyên sâu vào nghiệp vụ cơ sở vật chất giảng dạy. Không đi sâu vào quản lý thu chi tài chính của trường, nhân sự hay điểm số học sinh.

**1.3.3. Phạm vi về ứng dụng và nền tảng công nghệ**
- **Mô hình ứng dụng:** Web Application đa nền tảng. Giao diện Responsive để phù hợp với cả màn hình máy tính (Thủ kho) và màn hình điện thoại (Giáo viên).
- **Kiến trúc hệ thống:** Client - Server qua chuẩn RESTful API. 
  - Frontend: ReactJS kết hợp Vite.
  - Backend: Node.js với framework Express.js.
  - Cơ sở dữ liệu: PostgreSQL.

### 1.4. Đối tượng sử dụng ứng dụng
Hệ thống hướng tới 2 nhóm đối tượng người dùng chính:
1. **Quản trị viên (Admin / Thủ kho):** Quản lý bao quát hệ thống, quản lý danh mục tài sản, tài khoản giáo viên, xét duyệt các phiếu đăng ký mượn đồ, thực hiện giao/nhận thiết bị thực tế, và xem báo cáo thống kê.
2. **Giáo viên:** Tra cứu danh mục, xem tình trạng khả dụng, lập kế hoạch tạo phiếu mượn thiết bị theo tuần và theo dõi tiến độ phê duyệt.

### 1.5. Phương pháp nghiên cứu
**1.5.1. Phương pháp nghiên cứu lý thuyết**
- Thu thập tài liệu, quy định về công tác quản lý tài sản, thiết bị dạy học trong trường phổ thông.
- Tìm hiểu cơ sở lý thuyết về phân tích thiết kế hệ thống, các công nghệ ReactJS, NodeJS, PostgreSQL.

**1.5.2. Phương pháp nghiên cứu thực nghiệm**
- Khảo sát thực tế quy trình mượn trả tại trường học.
- Áp dụng công nghệ lập trình Web hiện đại để trực tiếp triển khai hệ thống.

**1.5.3. Phương pháp kiểm tra và đánh giá**
- Thực hiện kiểm thử phần mềm (Unit Test, Integration Test, UI Test) để đảm bảo độ chính xác của các thuật toán xử lý hàng đợi, trừ kho thiết bị.
- Triển khai thử nghiệm hệ thống để đánh giá tính khả dụng và hiệu năng.

### 1.6. Ý nghĩa khoa học và thực tiễn
**1.6.1. Ý nghĩa khoa học**
- Minh chứng cho việc ứng dụng kiến thức nền tảng về thiết kế hệ thống thông tin vào một bài toán thực tiễn.
- Kết hợp hiệu quả các công nghệ Web hiện đại để xây dựng ứng dụng kiến trúc Client-Server.

**1.6.2. Ý nghĩa thực tiễn**
- **Đối với nhà trường:** Nâng cao tính chuyên nghiệp, minh bạch trong quản lý tài sản, tránh thất thoát vật tư.
- **Đối với cán bộ quản lý:** Giảm khối lượng công việc ghi sổ, tra cứu thông tin nhanh chóng.
- **Đối với giáo viên:** Chủ động tìm kiếm và lên kế hoạch mượn trả thiết bị.

### 1.7. Cấu trúc báo cáo
Báo cáo được chia thành 5 chương chính:
- **Chương 1:** Tổng quan về đề tài.
- **Chương 2:** Cơ sở lý thuyết và công nghệ.
- **Chương 3:** Phân tích và thiết kế hệ thống.
- **Chương 4:** Thực hiện và triển khai.
- **Chương 5:** Kiểm thử và đánh giá.
- **Kết luận và hướng phát triển.**

---

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ

### 2.1. Tổng quan về Quản lý thiết bị dạy học
Thiết bị dạy học (hay đồ dùng dạy học) là tập hợp các công cụ vật lý được sử dụng trong quá trình giảng dạy nhằm giúp học sinh tiếp thu kiến thức trực quan.
Quá trình tin học hóa nghiệp vụ quản lý thiết bị giúp:
- **Tối ưu hóa thời gian:** Giáo viên đăng ký trực tuyến mọi lúc mọi nơi.
- **Minh bạch thông tin:** Mọi giao dịch (phiếu mượn, nhật ký hỏng hóc) đều được lưu trữ vĩnh viễn trên cơ sở dữ liệu.
- **Hỗ trợ ra quyết định:** Nhờ báo cáo và biểu đồ, nhà trường nắm được thực trạng tài sản để lên kế hoạch sửa chữa/mua sắm.

### 2.2. Kiến trúc hệ thống Client - Server
Client-Server (Máy khách - Máy chủ) là mô hình mạng máy tính phân tán. 
- **Client (Frontend - ReactJS):** Hiển thị giao diện người dùng, gửi yêu cầu thông qua API.
- **Server (Backend - NodeJS):** Xử lý logic nghiệp vụ (kiểm tra tồn kho, trừ kho, khóa phiếu) và trả về dữ liệu JSON.

### 2.3. Các công nghệ phát triển Frontend (Phía Máy Khách)
- **Thư viện ReactJS:** Xây dựng giao diện dựa trên Component, sử dụng Virtual DOM để tối ưu hóa việc hiển thị các danh sách dữ liệu lớn.
- **Công cụ Build Vite:** Giúp thời gian khởi động Dev Server nhanh chóng và Hot Module Replacement (HMR) tức thời.
- **Bootstrap 5 & CSS Variables:** Xây dựng giao diện bảng điều khiển (Dashboard) đáp ứng (Responsive) tốt trên thiết bị di động.

### 2.4. Các công nghệ phát triển Backend (Phía Máy Chủ)
- **Môi trường Node.js & Express.js:** Xử lý bất đồng bộ (Non-blocking I/O) giúp hệ thống phản hồi nhanh khi có hàng loạt giáo viên cùng truy cập.
- **Bảo mật JWT & Bcrypt:** Sử dụng JSON Web Token để quản lý phiên đăng nhập an toàn, và Bcrypt để mã hóa băm (hash) mật khẩu.
- **Hệ quản trị CSDL PostgreSQL:** Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ, hỗ trợ khóa cấp dòng (Row-level locking) thông qua `SELECT ... FOR UPDATE` để chống lỗi truy cập đồng thời (Race Condition).

### 2.5. Phân tích các ứng dụng tương tự
Trên thị trường hiện nay có một số giải pháp quản lý tài sản như phần mềm **QLTH.vn** hay **MISA QLTS**. 
- **Ưu điểm của phần mềm có sẵn:** Tính năng vô cùng đa dạng, bao gồm cả kế toán, tính khấu hao tài sản cố định phức tạp.
- **Nhược điểm:** Chi phí triển khai hàng năm khá cao. Giao diện thường phức tạp đối với những giáo viên lớn tuổi do chứa nhiều tính năng nghiệp vụ tài chính không cần thiết cho khối bộ phận giảng dạy.
- **Giải pháp của đồ án:** Xây dựng một hệ thống tinh gọn, tập trung hoàn toàn vào luồng Mượn/Trả thực tế của Giáo viên tại trường THCS, tích hợp Gợi ý theo Phân phối chương trình (PPCT) và mã QR, mang lại trải nghiệm tối giản, dễ dàng và đặc thù hóa cao.

---

## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Phân tích yêu cầu hệ thống

**3.1.1. Yêu cầu chức năng**
- **Nhóm Admin / Thủ kho:**
  - Xác thực người dùng, cấp quyền, tạo tài khoản giáo viên.
  - Quản lý kho thiết bị bằng Mã QR, vị trí lưu trữ, và cập nhật số lượng (tốt, hỏng, mất).
  - Quản lý danh mục cơ sở: Môn học, Lớp học, Năm học, Kế hoạch dạy học, và PPCT.
  - Xét duyệt Phiếu mượn tuần: Xem trước phiếu mượn, chọn duyệt toàn bộ, duyệt một phần, hoặc từ chối.
  - Nhận trả thiết bị: Ghi nhận sự cố hao mòn thực tế.
  - Thống kê, xuất file Excel, và hệ thống gửi Email nhắc nhở.
- **Nhóm Giáo viên:**
  - Tra cứu TKB cá nhân và số lượng thiết bị khả dụng.
  - Đăng ký phiếu mượn theo Tuần thông qua cửa sổ Gợi ý thiết bị từ PPCT.
  - Theo dõi trạng thái của Phiếu tuần đã gửi.

**3.1.2. Yêu cầu phi chức năng**
- **Tính toàn vẹn dữ liệu (Concurrency):** Hệ thống phải loại bỏ lỗi "Race Condition" trong các khung giờ cao điểm (sáng thứ Hai) bằng các giao dịch cơ sở dữ liệu.
- **Bảo mật:** Authentication bằng JWT, mật khẩu hash bằng Bcrypt.
- **Trải nghiệm người dùng:** Giao diện tối giản, hiển thị dạng Toast Message cho các thao tác thành công/lỗi.

**3.1.3. Phân tích Actor và Use Case**
- **Tác nhân (Actor):** Quản trị viên (Admin) và Giáo viên.
- **Use Case chính (Đăng ký mượn theo tuần):** Giáo viên vào trang Mượn, xem TKB tuần. Nhấn vào 1 tiết để mở Popup Gợi ý thiết bị. Chỉnh sửa và gửi đi. Server tạo `phieu_tuan` kèm các `phieu_muon` con.
- **Use Case chính (Phê duyệt phiếu):** Thủ kho xem phiếu chờ duyệt. Đối chiếu số lượng. Bấm Duyệt. Server khóa dòng, trừ số lượng khả dụng.

### 3.2. Thiết kế kiến trúc hệ thống
Hệ thống thiết kế theo kiến trúc Client-Server thông qua REST API:
- **Tầng Client (ReactJS):** Gửi các HTTP Requests (GET, POST, PUT, DELETE). State Management được tối ưu để lưu JWT Token.
- **Tầng Server (Node.js):**
  - **Controllers:** Nhận dữ liệu.
  - **Services:** Xử lý nghiệp vụ cấp phát thiết bị.
  - **Middlewares:** Bảo mật và kiểm tra quyền.
- **Tầng Data (PostgreSQL):** Xử lý lưu trữ bền vững.

### 3.3. Thiết kế Cơ sở dữ liệu

**Mô hình quan hệ (Các bảng cốt lõi):**
1. **`giao_vien`:** `magv` (PK), `tengv`, `bomon`, `matkhau`, `email`.
2. **`loai_thiet_bi`:** `maloaitb` (PK), `tenloai`, `soluongtot`, `soluonghong`, `soluongmat`, `maqr`.
3. **`phieu_tuan`:** `maphieutuan` (PK), `magv`, `namhoc`, `tuanso`, `trangthai`. Quản lý chung cả tuần.
4. **`phieu_muon`:** `maphieu` (PK), `maphieutuan`, `matkb`, `nguoimuon`, `tinhtrangphieu`.
5. **`chi_tiet_phieu`:** Liên kết N-N. Ghi nhận `soluongdk`, `soluongtra`, `soluonghong`.
6. **`lich_su_hao_mon`:** Lưu vết quá trình mất mát, hư hỏng.
7. **Bảng TKB & PPCT:** `thoi_khoa_bieu`, `phan_phoi_chuong_trinh`, `goi_y_thiet_bi`.

### 3.4. Thiết kế giao diện người dùng
- **Phân vùng Admin:** Giao diện Sidebar chứa bảng điều khiển. Bảng Data Table hỗ trợ Lọc và Phân trang. Giao diện phê duyệt thiết kế theo dạng Split-View (Chia đôi màn hình).
- **Phân vùng Giáo viên:** Giao diện Responsive Navbar. Giao diện mượn thiết kế dạng Bảng thời khóa biểu lưới, click vào ô để chọn thiết bị thay vì điền Form thủ công mệt mỏi.

---

## CHƯƠNG 4: THỰC HIỆN VÀ TRIỂN KHAI

### 4.1. Cài đặt môi trường phát triển
- Trình soạn thảo Visual Studio Code với các Extension chuẩn hóa code.
- Node.js bản LTS cho môi trường Backend.
- ReactJS + Vite cho môi trường Frontend.
- PostgreSQL + pgAdmin4 cho việc thiết kế CSDL.

### 4.2. Cấu trúc dự án chi tiết
- **Backend:** Tổ chức theo thư mục `src/config/`, `src/routes/`, `src/controllers/`, `src/services/`, `src/middlewares/` đảm bảo tính dễ đọc và tách biệt logic nghiệp vụ khỏi tầng Routing.
- **Frontend:** Tổ chức theo thư mục `src/components/` (các UI dùng chung), `src/utils/` (xử lý gọi API Fetch), và các file Root như `App.jsx`, `AdminApp.jsx`. Quản lý CSS bằng Variables trong `index.css`.

### 4.3. Triển khai các chức năng chính
- **Màn hình Đăng nhập:** Hệ thống xử lý API `/login`. Token nhận về lưu trữ ở trình duyệt.
- **Màn hình TKB và Mượn tuần:** Frontend Fetch dữ liệu TKB của giáo viên và PPCT, trộn dữ liệu để render lên lưới. Nút "Thêm vào giỏ" tích hợp trực tiếp trên từng tiết dạy.
- **Màn hình In QR:** Giao diện admin hỗ trợ tích hợp thư viện tạo mã QR, tự động generate ảnh QR và định dạng sẵn trang in ấn.

### 4.4. Logic xử lý cốt lõi (Xử lý giao dịch và hao mòn)
Khi Admin nhấn duyệt `phieu_tuan`, hệ thống áp dụng Transaction:
1. Tính tổng số yêu cầu `soluongdk` của mã thiết bị đó.
2. Khóa dòng bảng `loai_thiet_bi` với lệnh `FOR UPDATE`.
3. So sánh với `soluongtot` và các lượng đã duyệt chưa trả.
4. Nếu đủ: Đổi trạng thái, `COMMIT` lưu kết quả. Nếu thiếu: Hủy toàn bộ tiến trình `ROLLBACK`.
Điều này khác hoàn toàn với mô hình NoSQL hay File JSON cục bộ, giúp hệ thống hoạt động ổn định trên môi trường mạng nhiều người dùng.

### 4.5. Triển khai và chuẩn hóa dữ liệu đầu vào (PPCT & TKB)

Dữ liệu tại trường THCS thường ở dạng **PDF/Word (PPCT)** và **Excel ma trận (TKB)**, trong khi hệ thống cần **bảng phẳng** để truy vấn CSDL. Quy trình triển khai gồm hai giai đoạn: chuẩn hóa thủ công theo mẫu (`du_lieu/Mau_PPCT_CoTuan.csv`, `Mau_TKB_CoTuan.csv`), rồi import qua module Admin **ScheduleTool**.

**PPCT (PDF → Excel):** Admin trích xuất từ PDF sang file `.xlsx` với các cột: Mã Môn, Tuần, Tiết (hỗ trợ tiết ghép `"5,6"`), Tên Bài Học, Mã Thiết Bị. Frontend dùng thư viện SheetJS đọc file, gửi JSON lên API `/api/plan/import-ppct`. Backend UPSERT bảng `phan_phoi_chuong_trinh` và `goi_y_thiet_bi`.

**TKB (ma trận → CSV phẳng):** Unpivot từng ô (Thứ/Tiết/Lớp/Môn/GV) thành dòng riêng với cột `Ngay, tuan, MaGV, lop, mamon, tiet, buoi`. API `/api/plan/import-csv` khớp tên GV viết tắt → mã (`findTeacher`), tính offset PPCT theo tuần, ghi `thoi_khoa_bieu` và tự sinh phiếu mượn nháp nếu có gợi ý thiết bị.

*(Chi tiết đầy đủ: mục 4.7 trong file `chuong4_thuc_hien_trien_khai.md`.)*

### 4.6. Xử lý dữ liệu API và giao tiếp Client–Server

Dữ liệu trao đổi thông qua API dưới dạng JSON. Tại Frontend, Axios Interceptor tự động đính kèm JWT vào Header, bắt lỗi HTTP 401/403 để điều hướng về trang đăng nhập.

### 4.7. Thiết kế giao diện responsive

Giao diện ứng dụng sử dụng CSS Grid và Flexbox, cho phép phần "Thời khóa biểu" và "Danh sách thẻ phiếu mượn" tự động cuộn ngang (overflow-x) hoặc chuyển thành dạng cột đứng trên điện thoại di động, đem lại trải nghiệm hoàn hảo mà không cần cài đặt App từ Store.

---

## CHƯƠNG 5: KIỂM THỬ VÀ ĐÁNH GIÁ

### 5.1. Chiến lược kiểm thử
Chiến lược kiểm thử được thiết kế nhằm đảm bảo tính toàn vẹn của dữ liệu và trải nghiệm mượt mà của người dùng. Hệ thống tập trung vào 3 yếu tố cốt lõi: 
- Tính năng xử lý mượn trả không bị trùng lặp.
- Các API được phân quyền chính xác.
- Giao diện không xảy ra lỗi (Crash UI) khi nhận dữ liệu rác.

### 5.2. Công cụ và môi trường kiểm thử
- **Postman:** Công cụ giả lập Request để kiểm thử trực tiếp các API Backend, test luồng Auth (JWT).
- **Trình duyệt Google Chrome (DevTools):** Kiểm tra lỗi Network, kiểm tra giao diện Responsive (Mobile Viewport) và hiệu năng Render của React.

### 5.3. Các mức kiểm thử
- **Kiểm thử đơn vị (Unit Testing):** Test độc lập các hàm tiện ích (`utils`) như hàm tính toán số lượng thiết bị khả dụng, hàm fomat ngày giờ TKB.
- **Kiểm thử tích hợp (Integration Testing):** Kiểm tra sự liên kết giữa Controller và Service. Đặc biệt là quy trình: Tạo phiếu -> Duyệt phiếu -> Trả phiếu (có khai báo hỏng/mất) -> Kiểm tra `lich_su_hao_mon` đã sinh ra bản ghi đúng chưa.
- **Kiểm thử giao diện (UI Testing):** Nhập các chuỗi đặc biệt vào Form, kiểm tra giới hạn cuộn màn hình, kiểm tra các Popup/Toast có hiện đúng thông báo lỗi từ Server không.

### 5.4. Kiểm thử thực tế (Test Cases)

| Kịch bản kiểm thử (Test Case) | Kết quả mong đợi | Đánh giá |
|-----------------------------|------------------|----------|
| Đăng nhập sai tài khoản | Báo lỗi "Tài khoản hoặc mật khẩu không đúng", không cho vào hệ thống. | Pass |
| Giáo viên A mượn 3 máy chiếu, kho chỉ có 2 | Giao diện cảnh báo "Số lượng khả dụng không đủ", Admin có thể "Duyệt một phần" hoặc Từ chối. | Pass |
| Hai admin cùng duyệt 1 phiếu tuần cùng 1 giây | Cơ chế Transaction khóa tiến trình sau lại, báo lỗi conflict. Hệ thống chỉ xử lý thành công 1 người. | Pass |
| Khi trả thiết bị, ghi nhận 1 cái bị hỏng | `soluongtot` giảm 1, `soluonghong` tăng 1. Bảng `lich_su_hao_mon` có 1 dòng ghi log lỗi. | Pass |
| Giáo viên xem lịch sử mượn trên Điện thoại di động | Bảng hiển thị tự động cuộn ngang hoặc biến thành các thẻ rút gọn, chữ không bị vỡ. | Pass |

### 5.5. Phân tích kết quả kiểm thử
Qua quá trình test thử nghiệm, hệ thống đã vượt qua hầu hết các kịch bản quan trọng. 
- API Backend hoạt động ổn định, thời gian phản hồi (Latency) khi tạo Phiếu mượn tuần với rất nhiều môn học mất chưa tới 500ms.
- Cơ chế chống Race Condition hoạt động chính xác 100%, khóa bảo vệ được tồn kho.
- Giao diện trên điện thoại hiển thị mượt mà.

### 5.6. Đánh giá tổng quan
Hệ thống cơ bản đã hoàn thiện các tính năng cốt lõi đề ra trong đặc tả yêu cầu, hoạt động ổn định và sẵn sàng đưa vào vận hành thử nghiệm tại trường học.

---

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

**1. Những kết quả đạt được**
Đồ án đã xây dựng thành công một Hệ thống Quản lý Thiết bị THCS hoàn chỉnh trên nền tảng Web. Hệ thống đã giải quyết được trọn vẹn bài toán số hóa quy trình quản lý thiết bị:
- Giao diện thân thiện, luồng mượn trả theo Thời khóa biểu tuần thông minh tích hợp Gợi ý theo PPCT.
- Hệ thống quản lý Kho mạnh mẽ hỗ trợ in Mã QR, theo dõi chặt chẽ lịch sử hao mòn và phân quyền người dùng rõ ràng.
- Đảm bảo an toàn thông tin, bảo mật API, không xảy ra thất thoát về mặt logic cơ sở dữ liệu.

**2. Hạn chế còn tồn tại**
- Do hạn chế về thời gian, hệ thống nhắc nhở qua Email tự động (Cron Job) vẫn chưa được tùy biến mạnh mẽ (chỉ gửi log nhắc nhở tĩnh).
- Chưa có ứng dụng Mobile App (Android/iOS) Native mà mới chỉ dựa vào Web Responsive, do đó chưa tận dụng được tính năng Push Notification (thông báo nổi) trên điện thoại một cách tối đa.

**3. Hướng phát triển tương lai**
- Mở rộng xây dựng ứng dụng di động Native bằng Flutter hoặc React Native để giáo viên có thể nhận thông báo Push Notification khi phiếu mượn được duyệt hoặc bị hủy.
- Áp dụng trí tuệ nhân tạo (AI) để học thói quen mượn thiết bị của giáo viên, từ đó đưa ra Gợi ý thiết bị tự động tốt hơn mà không cần phụ thuộc 100% vào cấu hình PPCT cứng.
- Triển khai tính năng kết xuất số liệu hàng năm tự động để liên thông với phần mềm kế toán của Phòng Giáo Dục.
