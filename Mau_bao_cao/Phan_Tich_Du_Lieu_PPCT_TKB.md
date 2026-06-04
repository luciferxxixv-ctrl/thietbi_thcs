# Phân tích Dữ liệu: Hệ thống Đọc và Xử lý File PPCT và Thời khóa biểu (TKB)

Trong quá trình xây dựng hệ thống quản lý thiết bị trường học, một trong những thách thức lớn nhất là việc đồng bộ tự động dữ liệu từ các tệp tin Phân phối chương trình (PPCT) và Thời khóa biểu (TKB) do nhà trường cung cấp. Việc này đòi hỏi hệ thống phải có khả năng đọc, chuẩn hóa, và khớp nối dữ liệu thông minh.

## 1. Mẫu File Dữ liệu Đầu vào

### a. Mẫu File Phân phối chương trình (PPCT)
Dữ liệu PPCT thường được cung cấp dưới dạng bảng tính (Excel/CSV) với các trường thông tin cơ bản được chuẩn hóa thành JSON trước khi gửi xuống Backend:
- `mamon`: Mã môn học (VD: TOAN, VATLY).
- `tietthu`: Tiết thứ mấy trong chương trình. Có thể là một số (VD: "1") hoặc chuỗi (VD: "3,4" đối với các bài học kéo dài nhiều tiết).
- `tenbaihoc`: Tên chi tiết của bài học.
- `loaiphongyeucau`: Loại phòng thực hành nếu cần.
- `tuan`: Tuần học dự kiến.
- `equipments`: Danh sách mã thiết bị và số lượng đề xuất cho bài học này.

### b. Mẫu File Thời khóa biểu (TKB)
Dữ liệu TKB của trường thường là file CSV trích xuất từ các phần mềm xếp thời khóa biểu chuyên dụng. Đặc thù của file này là:
- `ngay`: Ngày dạy (VD: 05/09/2024).
- `maGV`: Thông thường đây không phải là mã định danh hệ thống mà là **Tên viết tắt của Giáo viên** (VD: "Đ.Lý", "M.Huệ", "Nhung", "bhuong").
- `lop`: Lớp học (VD: 9A1).
- `maMon`: Mã môn hoặc tên môn viết tắt.
- `tiet`: Tiết học trong buổi (VD: 1, 2, 3...).
- `buoi`: Buổi Sáng hoặc Chiều (Ảnh hưởng đến việc tính thứ tự tiết thực tế trong ngày).

## 2. Thuật toán và Logic Xử lý Dữ liệu

### a. Thuật toán Xử lý và Lưu trữ PPCT (`importPPCT`)
Khi tiếp nhận dữ liệu PPCT, hệ thống thực hiện các bước:
1. **Xử lý chuỗi tiết học**: Nhiều bài học chiếm 2-3 tiết liên tiếp, hệ thống sẽ tách chuỗi (split by comma) và lưu thành nhiều bản ghi độc lập nhưng có chung thông tin bài học.
2. **Upsert (Cập nhật hoặc Thêm mới)**: Hệ thống kiểm tra tổ hợp `(mamon, tietthu)`:
   - Nếu đã tồn tại: Cập nhật `tenbaihoc`, `loaiphongyeucau`, `tuan`.
   - Nếu chưa tồn tại: Tạo mới `mappct` bằng cách tự tăng (Auto Increment).
3. **Đồng bộ Gợi ý Thiết bị**: Xóa các gợi ý cũ của bài học và chèn danh sách thiết bị mới, đồng thời kiểm tra tính hợp lệ của `maloaitb` (Khóa ngoại).

### b. Thuật toán Xử lý Thời Khóa Biểu và Khớp nối Thông minh (`importCSV`)
Đây là phần cốt lõi và phức tạp nhất của hệ thống, bao gồm các quy trình:

**Quy trình 1: Chuẩn hóa và Mapping Tên Giáo viên (Fuzzy Matching)**
Do file TKB sử dụng tên viết tắt hoặc tài khoản đăng nhập thay vì Mã GV chuẩn, hệ thống xây dựng một thuật toán đối sánh thông minh:
- Bỏ toàn bộ dấu tiếng Việt, đưa về chữ thường.
- Cố gắng khớp chính xác với `magv` hoặc `taikhoan`.
- Khớp chính xác với tên đầy đủ trong DB.
- Nếu tên có chứa dấu chấm (VD: "Đ.Lý"), thuật toán sẽ tách mảng `["Đ", "Lý"]`, sau đó tìm kiếm các giáo viên có tên cuối cùng là "Lý" và phần Họ/Tên đệm bắt đầu bằng chữ "Đ".

**Quy trình 2: Xử lý Thời gian và Tiết học**
- Chuyển đổi định dạng ngày chéo (DD/MM/YYYY) sang chuẩn ISO (YYYY-MM-DD), xử lý bù trừ Timezone để tránh lệch ngày.
- Bỏ qua các buổi không chính khóa (VD: Buổi 2) và các môn ngoại khóa (SHL, CHAOCO).
- Xác định "Tiết thực tế" trong ngày: Nếu học vào buổi chiều, số tiết sẽ được cộng thêm 5 (VD: Tiết 1 chiều -> Tiết 6 trong hệ thống).

**Quy trình 3: Khớp nối PPCT và Tự động sinh Phiếu mượn**
- Nhóm toàn bộ tiết học theo tổ hợp `(MaGV, Lop, MaMon, Tuan)`.
- Sắp xếp các tiết học theo thứ tự Ngày và Tiết để đảm bảo tiến trình thời gian.
- **Tính toán Offset**: Tìm bài học đầu tiên trong PPCT khớp với "Tuần" hiện tại. Nếu không có thông tin tuần, hệ thống truy vấn DB để lấy `tietthu` lớn nhất mà lớp đó đã học để làm điểm bắt đầu (offset).
- **Gắn Mã PPCT**: Lần lượt gán `mappct` cho từng tiết học TKB tương ứng.
- **Tạo Phiếu mượn Tự động**: Nếu bài học PPCT đó có danh sách `GOI_Y_THIET_BI`, hệ thống sẽ lập tức tạo ra một `PHIEU_MUON` ở trạng thái nháp (BanNhap) và tự động điền các `CHI_TIET_PHIEU`, giúp giáo viên tiết kiệm tối đa thời gian.

## 3. Code Triển khai Cốt lõi (Node.js)

Dưới đây là trích đoạn mã nguồn thực tế thể hiện thuật toán Mapping tên Giáo viên và Khớp nối PPCT:

### Thuật toán Chuẩn hóa và Fuzzy Matching Tên Giáo viên
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

    // 1. Khớp mã GV hoặc Tài khoản đăng nhập
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

### Thuật toán Tính toán Offset và Khớp nối PPCT vào TKB
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
Mô hình xử lý đồng bộ này giúp giảm thiểu 90% công sức nhập liệu thủ công của giáo viên, đồng thời hạn chế tối đa sai sót trong việc đối chiếu tiến độ giảng dạy và lên kế hoạch mượn thiết bị.
