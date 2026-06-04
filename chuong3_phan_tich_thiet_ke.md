## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

Chương này đóng vai trò bản lề trong quá trình phát triển hệ thống quản lý thiết bị trường THCS. Từ những khảo sát thực tế và cơ sở lý thuyết đã nghiên cứu, chương này sẽ đi sâu vào việc phân tích chi tiết các yêu cầu của người dùng, từ đó mô hình hóa thành các Use Case, thiết kế kiến trúc tổng thể, xây dựng cơ sở dữ liệu và phác thảo giao diện. Đây là nền tảng vững chắc để tiến hành lập trình và triển khai ở các giai đoạn tiếp theo.

### 3.1. Phân tích yêu cầu hệ thống

Quá trình phân tích yêu cầu được thực hiện thông qua việc khảo sát quy trình quản lý thiết bị hiện tại ở một số trường THCS. Qua đó, hệ thống cần đáp ứng hai nhóm yêu cầu chính là yêu cầu chức năng (các tính năng cụ thể mà phần mềm phải có) và yêu cầu phi chức năng (các tiêu chuẩn về kỹ thuật, bảo mật, hiệu năng).

#### 3.1.1. Yêu cầu chức năng

Yêu cầu chức năng của hệ thống được chia làm hai luồng chính phục vụ cho hai đối tượng người dùng: Ban quản trị (Admin/Thủ kho) và Giáo viên.

**A. Nhóm chức năng dành cho Quản trị viên (Admin / Thủ kho):**
Đóng vai trò là người điều hành hệ thống, kiểm soát tài sản thực tế và phê duyệt các giao dịch, Admin cần các nhóm chức năng sau:
1. **Quản lý Hệ thống và Xác thực:**
   - Đăng nhập an toàn vào hệ thống với phân quyền Admin.
   - Quản lý tài khoản Giáo viên: Thêm mới, cập nhật thông tin cá nhân, phân công bộ môn giảng dạy, cấp lại mật khẩu và khóa tài khoản khi giáo viên nghỉ hưu hoặc chuyển công tác.
2. **Quản lý Danh mục Cơ sở (Master Data):**
   - Quản lý danh mục Năm học: Thêm, sửa, đóng năm học cũ.
   - Quản lý danh mục Môn học, Lớp học, Phòng học.
   - Quản lý Phân phối chương trình (PPCT) và Kế hoạch bài học: Admin có thể import dữ liệu bài học theo chuẩn của Bộ GD&ĐT làm cơ sở cho giáo viên đăng ký thiết bị.
   - Cấu hình thiết bị gợi ý: Liên kết các loại thiết bị cần thiết vào từng tiết học cụ thể trong PPCT.
3. **Quản lý Kho Thiết bị và Mã QR:**
   - Quản lý Loại thiết bị: Thêm mới thiết bị với các thông tin chi tiết (Mã loại, Tên loại, Đơn vị tính, Hình ảnh, Vị trí kho).
   - Kiểm soát số lượng: Theo dõi và cập nhật số lượng tổng, số lượng tốt, số lượng hỏng, số lượng mất.
   - Quản lý Mã QR: Tự động sinh mã QR cho từng loại thiết bị, hỗ trợ xuất file in tem nhãn để dán lên thiết bị vật lý nhằm phục vụ công tác kiểm kê sau này.
4. **Nghiệp vụ Mượn / Trả thiết bị:**
   - Xét duyệt Phiếu Tuần: Xem danh sách các Phiếu đăng ký mượn thiết bị theo tuần của giáo viên. Hệ thống tự động đối chiếu tồn kho khả dụng để đưa ra cảnh báo. Admin có thể "Duyệt toàn bộ", "Duyệt một phần" (sửa lại số lượng cấp phát nếu kho không đủ) hoặc "Từ chối".
   - Nhận trả thiết bị: Khi giáo viên đem trả đồ, thủ kho xác nhận thu hồi. Nếu phát sinh thiết bị hỏng hoặc mất, thủ kho nhập trực tiếp số lượng hao hụt này vào hệ thống tại thời điểm trả.
5. **Thống kê, Báo cáo và Thông báo:**
   - Xem Bảng điều khiển (Dashboard) trực quan về số lượng tài sản, số lượng phiếu chờ duyệt.
   - Xem lịch sử hao mòn thiết bị (ai làm hỏng, hỏng khi nào).
   - Quản lý tiến trình gửi Email nhắc nhở giáo viên trả thiết bị trễ hạn.

**B. Nhóm chức năng dành cho Giáo viên:**
Giáo viên là người trực tiếp sử dụng thiết bị, ứng dụng cung cấp cho giáo viên sự chủ động tối đa trong việc chuẩn bị giáo cụ:
1. **Xác thực và Xem thông tin:**
   - Đăng nhập vào hệ thống dành riêng cho Giáo viên.
   - Xem danh sách thiết bị khả dụng (số lượng thiết bị đang thực sự rảnh rỗi trong kho).
   - Xem Thời khóa biểu (TKB) tuần của cá nhân.
2. **Nghiệp vụ Mượn Thiết bị theo Tuần:**
   - Thay vì tạo từng phiếu lẻ tẻ, giáo viên dựa vào Thời khóa biểu tuần để đăng ký thiết bị cho nhiều tiết học cùng lúc (tạo Phiếu Tuần).
   - Tại mỗi tiết học trong TKB, hệ thống tự động bung danh sách Thiết bị gợi ý (nếu Admin đã cấu hình trong PPCT), giáo viên chỉ cần 1 cú click để chọn thay vì phải tự tìm kiếm thủ công.
3. **Quản lý Lịch sử cá nhân:**
   - Xem lại các phiếu tuần đã gửi, theo dõi trạng thái (Chờ duyệt, Đã duyệt, Đã trả, Bị từ chối).
   - Nhận thông báo qua Email khi phiếu được duyệt hoặc khi đến hạn trả đồ.

#### 3.1.2. Yêu cầu phi chức năng

Bên cạnh các tính năng nghiệp vụ, hệ thống bắt buộc phải tuân thủ các quy chuẩn kỹ thuật ngặt nghèo để đảm bảo vận hành trong thực tế:
- **Tính toàn vẹn và Đồng thời (Concurrency & Data Integrity):** Do đặc thù trường học, vào sáng thứ Hai thường có rất nhiều giáo viên cùng truy cập để đặt mượn thiết bị cho cả tuần. Hệ thống tuyệt đối không được xảy ra tình trạng "Race Condition" (Ví dụ: Kho chỉ còn 1 kính hiển vi, 2 giáo viên cùng bấm nút mượn và cả 2 đều được duyệt).
- **Hiệu năng và Tốc độ (Performance):** Thời gian tải trang và phản hồi API (Latency) phải dưới 2 giây. Các thao tác tính toán trừ kho phức tạp cần được tối ưu bằng các truy vấn (Queries) trực tiếp trên Database.
- **Bảo mật (Security):** Toàn bộ API đều phải được bảo vệ bởi chuẩn JSON Web Token (JWT). Mật khẩu lưu trong cơ sở dữ liệu phải được băm bằng thuật toán mã hóa một chiều Bcrypt.
- **Tính khả dụng (Usability):** Giao diện phải tương thích với cả máy tính (dành cho Thủ kho) và điện thoại thông minh (dành cho Giáo viên). Các thao tác người dùng đều phải có hiển thị thông báo phản hồi (Toast Message).

#### 3.1.3. Phân tích Actor và Use Case

**A. Các Tác nhân (Actors) tham gia hệ thống**
1. **Admin / Thủ kho:** Người có quyền quản trị cao nhất, kiểm soát trực tiếp phần cứng thiết bị tại kho và dữ liệu trên phần mềm.
2. **Giáo viên:** Người dùng phổ thông, có nhu cầu sử dụng thiết bị phục vụ bài giảng.

**B. Biểu đồ Use Case tổng quát**

*[Hình ảnh: Sơ đồ Use case tổng quát, gồm tác nhân Admin và Giáo viên, với các hình ellipse thể hiện chức năng như Đăng nhập, Mượn thiết bị, Duyệt phiếu, Quản lý kho]*
**Hình 3.1. Sơ đồ Use Case tổng quát của hệ thống**

**C. Đặc tả Use Case chi tiết (Use Case Specification)**

**Bảng 3.1. Đặc tả Use Case Đăng ký mượn đồ theo tuần (UC-09)**

| Đặc tính | Mô tả chi tiết |
|---|---|
| **Tên Use Case** | Đăng ký mượn thiết bị theo TKB tuần. |
| **Actor** | Giáo viên. |
| **Mục đích** | Cho phép giáo viên chọn các thiết bị cần mượn cho nhiều tiết học khác nhau trong tuần chỉ trong 1 lần thao tác. |
| **Tiền điều kiện** | Giáo viên đã đăng nhập và hệ thống đã có dữ liệu Thời khóa biểu tuần của giáo viên đó. |
| **Luồng sự kiện chính** | 1. Giáo viên chọn chức năng "Lập phiếu mượn tuần".<br>2. Hệ thống hiển thị bảng Thời khóa biểu các tiết dạy của giáo viên trong tuần.<br>3. Giáo viên click vào một tiết học cụ thể.<br>4. Hệ thống popup danh sách "Thiết bị gợi ý" (dựa theo PPCT).<br>5. Giáo viên chọn số lượng cho các thiết bị cần mượn.<br>6. Lặp lại bước 3-5 cho các tiết học khác.<br>7. Giáo viên nhấn nút "Gửi Phiếu Tuần".<br>8. Hệ thống lưu dữ liệu vào bảng `phieu_tuan` và `phieu_muon` (trạng thái: Chờ duyệt) và thông báo thành công. |
| **Luồng ngoại lệ** | Ở bước 7, nếu hệ thống phát hiện kết nối gián đoạn hoặc lỗi truy vấn, thông báo "Lỗi hệ thống, vui lòng thử lại" và không lưu dữ liệu. |

**Bảng 3.2. Đặc tả Use Case Phê duyệt phiếu mượn tuần (UC-04)**

| Đặc tính | Mô tả chi tiết |
|---|---|
| **Tên Use Case** | Phê duyệt phiếu mượn tuần. |
| **Actor** | Admin / Thủ kho. |
| **Mục đích** | Kiểm duyệt yêu cầu của giáo viên, phân bổ thiết bị hợp lý dựa trên tồn kho thực tế. |
| **Tiền điều kiện** | Có ít nhất 1 Phiếu tuần đang ở trạng thái "Chờ duyệt". |
| **Luồng sự kiện chính** | 1. Admin vào trang "Duyệt Phiếu Tuần".<br>2. Chọn một phiếu của giáo viên cụ thể để xem chi tiết các thiết bị yêu cầu.<br>3. Hệ thống hiển thị đối chiếu giữa "Số lượng yêu cầu" và "Số lượng tốt (có sẵn)".<br>4. Admin nhấn "Duyệt".<br>5. Hệ thống khóa dòng dữ liệu (Transaction), trừ đi số lượng khả dụng, cập nhật trạng thái phiếu thành "Đã duyệt" và thông báo thành công. |
| **Luồng phụ / Ngoại lệ** | Ở bước 3, nếu "Số lượng tốt" không đủ, Admin có thể tự chỉnh sửa "Số lượng duyệt" xuống thấp hơn yêu cầu và bấm "Duyệt một phần". Nếu Admin thấy phiếu vô lý, bấm "Từ chối" kèm lý do. |

### 3.2. Thiết kế kiến trúc hệ thống

#### 3.2.1. Kiến trúc tổng thể
Hệ thống được thiết kế theo kiến trúc **Client-Server** hiện đại với mô hình phân tán rõ ràng, đảm bảo tính rời rạc (Loose Coupling). Giao tiếp giữa Client và Server diễn ra thông qua chuẩn **RESTful API** với định dạng dữ liệu JSON.

*[Hình ảnh: Sơ đồ kiến trúc Client-Server, bao gồm Frontend (React), Backend (Express/Node.js) nhận request qua API, và Database (PostgreSQL) lưu trữ dữ liệu]*
**Hình 3.2. Sơ đồ kiến trúc hệ thống tổng thể**

- **Tầng Giao diện (Client - Frontend):** Được xây dựng bằng ReactJS dưới dạng Single Page Application (SPA). Tầng này chịu trách nhiệm hiển thị thông tin, bắt lỗi nhập liệu sơ bộ (Client-side Validation), quản lý trạng thái giao diện (State Management) và lưu trữ JWT Token cục bộ.
- **Tầng Xử lý nghiệp vụ (Server - Backend):** Xây dựng bằng Node.js và Express.js. Tầng này được tổ chức theo chuẩn MVC (nhưng chỉ có Model và Controller), bao gồm các Middlewares để xác thực Token, các Controllers để tiếp nhận Request, và các Services chứa logic thuật toán cấp phát thiết bị.
- **Tầng Lưu trữ (Database):** Hệ quản trị CSDL PostgreSQL, chịu trách nhiệm lưu trữ dữ liệu vĩnh viễn, kiểm soát ràng buộc toàn vẹn (Foreign Keys, Constraints) và thực thi các giao dịch an toàn (Transactions).

#### 3.2.2. Thiết kế cơ chế xử lý đồng thời (Xử lý Transaction)
Để giải quyết bài toán nhiều người mượn cùng lúc (Race Condition) đã đề cập ở yêu cầu phi chức năng, hệ thống áp dụng cơ chế khóa dòng ở mức Cơ sở dữ liệu (Row-level Locking) với chiến lược **Pessimistic Locking**.

**Thuật toán khi Admin duyệt phiếu:**
1. Backend bắt đầu một `BEGIN TRANSACTION`.
2. Lấy danh sách các loại thiết bị có trong phiếu, thực thi lệnh `SELECT * FROM loai_thiet_bi WHERE maloaitb IN (...) FOR UPDATE`. Lệnh `FOR UPDATE` sẽ khóa các dòng thiết bị này lại. Bất kỳ Request duyệt phiếu nào khác cố gắng truy cập các thiết bị này đều phải xếp hàng đợi.
3. Backend tính toán "Số lượng thiết bị đang bị giữ chỗ bởi các phiếu đã duyệt khác nhưng chưa trả". 
4. So sánh: `Số lượng yêu cầu <= (Số lượng Tốt - Số lượng đang bị giữ chỗ)`.
5. Nếu **THỎA MÃN**: Đổi trạng thái phiếu sang `DaDuyet` và thực hiện lệnh `COMMIT` để lưu dữ liệu và mở khóa các dòng.
6. Nếu **KHÔNG THỎA MÃN**: Lập tức hủy giao dịch bằng lệnh `ROLLBACK`, mở khóa dòng và trả về lỗi cho Admin.

### 3.3. Thiết kế cơ sở dữ liệu

Thiết kế cơ sở dữ liệu (Database Schema) quyết định đến sự linh hoạt và khả năng mở rộng của phần mềm. Việc thiết kế tuân theo các Dạng chuẩn hóa (Normalization) để tránh dư thừa và mâu thuẫn dữ liệu.

#### 3.3.1. Mô hình Quan hệ Thực thể (ERD)

*[Hình ảnh: Sơ đồ ERD chứa các bảng: giao_vien, loai_thiet_bi, phieu_tuan, phieu_muon, chi_tiet_phieu, lich_su_hao_mon với các đường nối thể hiện khóa chính và khóa ngoại]*
**Hình 3.3. Sơ đồ Mô hình Quan hệ Thực thể (ERD)**

Mối quan hệ giữa các thực thể cốt lõi như sau:
- `giao_vien` và `phieu_tuan`: Quan hệ 1 - N (Một giáo viên tạo nhiều phiếu tuần).
- `phieu_tuan` và `phieu_muon`: Quan hệ 1 - N (Một phiếu tuần bao gồm nhiều phiếu mượn tương ứng với nhiều tiết học).
- `phieu_muon` và `loai_thiet_bi`: Quan hệ N - N. Được giải quyết bằng bảng trung gian `chi_tiet_phieu` (Lưu số lượng thiết bị chi tiết).
- `loai_thiet_bi` và `lich_su_hao_mon`: Quan hệ 1 - N (Một thiết bị có nhiều lần hỏng/mất).

#### 3.3.2. Thiết kế cấu trúc các bảng vật lý (Physical Tables)
Dưới đây là đặc tả cấu trúc của một số bảng quan trọng nhất trong hệ thống (Hệ thống tổng cộng có khoảng 16 bảng).

**Bảng 3.3. Bảng Người dùng (giao_vien)**
Lưu trữ thông tin tài khoản và phân quyền.
| Tên cột | Kiểu dữ liệu | Khóa | Ràng buộc / Mô tả |
|---|---|---|---|
| magv | Varchar(20) | PK | Mã định danh giáo viên. |
| tengv | Varchar(100) | | Họ và tên giáo viên. |
| bomon | Varchar(20) | FK | Tham chiếu đến bảng `mon_hoc`. |
| taikhoan | Varchar(50) | Unique | Tên đăng nhập. |
| matkhau | Varchar(100)| | Mật khẩu đã mã hóa (Bcrypt). |
| email | Varchar(255) | | Email nhận thông báo. |

**Bảng 3.4. Bảng Loại thiết bị (loai_thiet_bi)**
Quản lý thông tin và số lượng chi tiết của từng loại thiết bị.
| Tên cột | Kiểu dữ liệu | Khóa | Ràng buộc / Mô tả |
|---|---|---|---|
| maloaitb | Varchar(20) | PK | Mã loại thiết bị (VD: KNV-01). |
| tenloai | Varchar(100) | | Tên gọi thiết bị. |
| donvitinh | Varchar(20) | | Đơn vị (cái, chiếc, bộ). |
| tongtonkho| Integer | | Tổng số lượng nhà trường mua về. |
| soluongtot| Integer | | Số lượng hiện tại đang hoạt động tốt. |
| soluonghong| Integer | | Số lượng đang hỏng hóc. |
| soluongmat| Integer | | Số lượng đã bị thất lạc. |
| maqr | Varchar(80) | Unique | Mã định danh sinh mã QR tự động. |
| vitrikho | Varchar(120) | | Tọa độ lưu trữ vật lý trong kho. |

**Bảng 3.5. Bảng Phiếu mượn tuần (phieu_tuan)**
Bao quát thông tin đăng ký mượn cho toàn bộ các tiết trong 1 tuần.
| Tên cột | Kiểu dữ liệu | Khóa | Ràng buộc / Mô tả |
|---|---|---|---|
| maphieutuan | Varchar(50) | PK | Mã phiếu tự sinh (VD: T35-2025-GV01). |
| magv | Varchar(50) | FK | Tham chiếu `giao_vien(magv)`. |
| namhoc | Varchar(20) | FK | Tham chiếu `nam_hoc(namhoc)`. |
| tuanso | Integer | | Định danh tuần thứ mấy trong năm. |
| trangthai | Varchar(30) | | Giá trị: ChoDuyet, DaDuyet, DaTra... |
| ngaytao | Timestamp | | Thời gian tạo phiếu. |

**Bảng 3.6. Bảng Chi tiết phiếu (chi_tiet_phieu)**
Bảng trung gian, ghi nhận sự cấp phát thiết bị và thao tác thu hồi.
| Tên cột | Kiểu dữ liệu | Khóa | Ràng buộc / Mô tả |
|---|---|---|---|
| id | Integer | PK | Auto increment. |
| maphieu | Varchar(20) | FK | Tham chiếu đến tiết học cụ thể (`phieu_muon`). |
| maloaitb | Varchar(20) | FK | Tham chiếu thiết bị mượn (`loai_thiet_bi`). |
| soluongdk | Integer | | Số lượng giáo viên yêu cầu. |
| soluongtra| Integer | | Số lượng thực tế giáo viên mang lên trả. |
| soluonghong| Integer | | Số lượng thiết bị hỏng khi sử dụng (nhập khi trả). |
| soluongmat| Integer | | Số lượng thiết bị mất (nhập khi trả). |

**Bảng 3.7. Bảng Lịch sử hao mòn (lich_su_hao_mon)**
Lưu vết (Log) các hoạt động làm suy giảm số lượng thiết bị.
| Tên cột | Kiểu dữ liệu | Khóa | Ràng buộc / Mô tả |
|---|---|---|---|
| id | Integer | PK | Auto increment. |
| maloaitb | Varchar(50) | FK | Thiết bị bị ảnh hưởng. |
| maphieu | Varchar(50) | FK | Tham chiếu phiếu mượn gây ra lỗi (nếu có). |
| loaisukien| Varchar(20) | | Giá trị: HongMotPhan, MatMotPhan... |
| soluong | Integer | | Số lượng thiết bị hao hụt. |
| nguoithuchien|Varchar(50) | | Tên Admin thao tác ghi log. |
| ngaytao | Timestamp | | Thời gian xảy ra hao mòn. |

### 3.4. Thiết kế giao diện người dùng

Thiết kế Giao diện người dùng (User Interface - UI) và Trải nghiệm người dùng (User Experience - UX) là yếu tố sống còn để đảm bảo hệ thống có thể được đón nhận bởi các giáo viên - những người vốn đã quen với cách làm việc truyền thống.

#### 3.4.1. Thiết kế UX (Trải nghiệm người dùng)
- **Tối giản hóa luồng thao tác:** Thay vì bắt giáo viên nhập "Tên thiết bị, Số lượng, Tiết mượn, Lớp dạy, Ngày dạy" vào một Form khô khan dài dòng (rất dễ gõ sai), hệ thống thiết kế luồng chọn thông qua **TKB**. Giáo viên chỉ cần click vào ô Tiết học trên ma trận TKB, hệ thống sẽ tự động gán Ngày, Tiết, Lớp vào phiếu. Sau đó, tính năng "Gợi ý thiết bị từ PPCT" tự động hiện danh sách các thiết bị thường dùng cho bài học đó để giáo viên click chọn số lượng. Các thao tác rườm rà được giảm từ 10 bước xuống chỉ còn 3 bước click chuột.
- **Tương tác phản hồi tức thời (Feedback):** Sử dụng các hiệu ứng Hover vào các nút bấm, sử dụng Toast Notifications (thông báo nhỏ góc màn hình màu xanh/đỏ) thay cho các Alert Box mặc định của trình duyệt để tạo cảm giác thân thiện.

#### 3.4.2. Thiết kế giao diện mô phỏng (Wireframe/Mockup)

*[Hình ảnh: Bản vẽ Wireframe đen trắng hoặc bản mockup giao diện trang Đăng nhập hệ thống, bao gồm Logo, form nhập username/password và nút Submit]*
**Hình 3.4. Bản vẽ thiết kế màn hình Đăng nhập**

*[Hình ảnh: Bản vẽ giao diện Dashboard dành cho Admin, hiển thị Sidebar bên trái và các khối biểu đồ, thẻ thống kê tổng quan bên phải]*
**Hình 3.5. Bản vẽ thiết kế màn hình Dashboard Quản trị**

Ứng dụng sử dụng phong cách thiết kế Material Design pha trộn với Glassmorphism nhẹ nhàng để mang lại cảm giác hiện đại.

- **Layout dành cho Admin (Bố cục Sidebar):**
  - Sử dụng thanh Menu cố định bên trái (Sidebar) để chứa các Module quản lý (Dashboard, Thiết bị, Phê duyệt, Danh mục).
  - Phần không gian rộng lớn bên phải dành cho các Bảng dữ liệu (Data Table) chứa nhiều cột.
  - Các màn hình phức tạp như **Phê duyệt Phiếu Tuần** được thiết kế dạng **Split-View** (chia đôi màn hình dọc): Bên trái là danh sách thẻ giáo viên đang chờ duyệt, bấm vào thẻ nào thì nửa màn hình bên phải sẽ load danh sách thiết bị tương ứng của giáo viên đó, giúp thủ kho không phải mở đi mở lại nhiều trang.
  
- **Layout dành cho Giáo viên (Bố cục Navbar):**
  - Sử dụng thanh điều hướng phía trên cùng (Top Navbar) tương tự như các website mua sắm. Việc này giúp tiết kiệm không gian màn hình, ưu tiên hiển thị toàn bộ **Bảng Thời Khóa Biểu Tuần** ra chính giữa.
  - Hỗ trợ Responsive cực tốt: Khi xem trên điện thoại, Bảng TKB tự động thu hẹp thành danh sách cuộn dọc, các menu sẽ gom vào nút Hamburger (3 gạch) để giúp giáo viên dễ dàng thao tác bằng một tay.
