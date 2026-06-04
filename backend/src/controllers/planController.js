const { pool } = require("../config/db");

// Đợi dữ liệu TKB từ Admin upload lên
const importTKB = async (req, res) => {
  const client = await pool.connect();
  try {
    const { tkbList } = req.body;
    // tkbList là mảng: [{ thu, tiethoc, malop, mamon, magv }]

    await client.query("BEGIN");

    // Xóa hết TKB tuần hiện tại để import đè
    await client.query("TRUNCATE TABLE TKB_TUAN RESTART IDENTITY");

    const insertQuery = `
            INSERT INTO TKB_TUAN (thu, tiethoc, malop, mamon, magv)
            VALUES ($1, $2, $3, $4, $5)
        `;

    for (const item of tkbList) {
      await client.query(insertQuery, [
        item.thu,
        item.tiethoc,
        item.malop,
        item.mamon,
        item.magv,
      ]);
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({
        msg: `✅ Đã lưu ${tkbList.length} tiết học vào cấu trúc Lịch Mẫu!`,
      });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi import TKB:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi import TKB" });
  } finally {
    client.release();
  }
};

const importPPCT = async (req, res) => {
  const client = await pool.connect();
  try {
    const { ppctList } = req.body;
    // ppctList: [{ mappct, mamon, tietthu, tenbaihoc, loaiphongyeucau }]

    await client.query("BEGIN");

    for (const item of ppctList) {
      // Parse tietthu in case it's a string like "3,4" or "3, 4"
      const tietList = String(item.tietthu).split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t));
      
      for (const tiet of tietList) {
        const check = await client.query(
          "SELECT mappct FROM PHAN_PHOI_CHUONG_TRINH WHERE mamon = $1 AND tietthu = $2",
          [item.mamon, tiet]
        );
        
        let currentMappct;

        if (check.rows.length > 0) {
          currentMappct = check.rows[0].mappct;
          // Update
          await client.query(
            `
              UPDATE PHAN_PHOI_CHUONG_TRINH
              SET tenbaihoc=$1, loaiphongyeucau=$2, tuan=$3
              WHERE mamon=$4 AND tietthu=$5
            `,
            [item.tenbaihoc, item.loaiphongyeucau, item.tuan || null, item.mamon, tiet]
          );
        } else {
          // Insert
          const insertRes = await client.query(
            `
              INSERT INTO PHAN_PHOI_CHUONG_TRINH (mappct, mamon, tietthu, tenbaihoc, loaiphongyeucau, tuan)
              VALUES (COALESCE((SELECT MAX(mappct) FROM PHAN_PHOI_CHUONG_TRINH), 0) + 1, $1, $2, $3, $4, $5) RETURNING mappct
            `,
            [item.mamon, tiet, item.tenbaihoc, item.loaiphongyeucau, item.tuan || null]
          );
          currentMappct = insertRes.rows[0].mappct;
        }

        // Process equipments if provided
        if (item.equipments && item.equipments.length > 0) {
          // Delete old equipments for this lesson
          await client.query("DELETE FROM GOI_Y_THIET_BI WHERE mappct = $1", [currentMappct]);
          
          for (const eq of item.equipments) {
            // Verify if equipment exists in LOAI_THIET_BI to prevent FK errors
            const eqCheck = await client.query("SELECT maloaitb FROM LOAI_THIET_BI WHERE maloaitb = $1", [eq.maloaitb]);
            if (eqCheck.rows.length > 0) {
              await client.query(
                "INSERT INTO GOI_Y_THIET_BI (mappct, maloaitb, soluongdexuat) VALUES ($1, $2, $3)",
                [currentMappct, eq.maloaitb, eq.soluong]
              );
            } else {
              console.warn(`Bỏ qua mã thiết bị không tồn tại: ${eq.maloaitb}`);
            }
          }
        }
      }
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({
        msg: `✅ Đã import thành công ${ppctList.length} bài học PPCT!`,
      });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi import PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi import PPCT: " + err.message });
  } finally {
    client.release();
  }
};

// 1. THUẬT TOÁN TỰ ĐỘNG SINH KẾ HOẠCH DẠY HỌC DỰA VÀO TKB_TUAN
const generateSchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const { maGV, maMon, maLop, ngayBatDau } = req.body;
    if (!maGV || !maMon || !maLop || !ngayBatDau) {
      return res
        .status(400)
        .json({
          msg: "Thiếu thông tin: mã GV, môn, lớp hoặc ngày bắt đầu (ngày khai giảng).",
        });
    }

    await client.query("BEGIN");

    // Bước 1: Lấy PPCT
    const ppctQuery = `SELECT * FROM PHAN_PHOI_CHUONG_TRINH WHERE MaMon = $1 ORDER BY TietThu ASC`;
    const ppctResult = await client.query(ppctQuery, [maMon]);
    const dsBaiHoc = ppctResult.rows;

    if (dsBaiHoc.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          msg: "Lỗi: Môn học này chưa có dữ liệu Phân Phối Chương Trình!",
        });
    }

    // Bước 2: Lấy lịch cố định từ TKB_TUAN (lịch mẫu tuần)
    const tkbQuery = `SELECT thu, tiethoc FROM TKB_TUAN WHERE malop = $1 AND mamon = $2 ORDER BY thu, tiethoc`;
    const tkbResult = await client.query(tkbQuery, [maLop, maMon]);
    let dsLichTuan = tkbResult.rows;

    // Nhiều trường chỉ import TKB qua CSV (THOI_KHOA_BIEU) mà không nạp TKB_TUAN → thuật toán cũ luôn thất bại.
    // Fallback: suy ra (thứ, tiết) từ các bản ghi TKB thực tế đã có cùng lớp+môn.
    if (dsLichTuan.length === 0) {
      const fallbackSlots = `
                SELECT DISTINCT
                    (EXTRACT(ISODOW FROM ngayhoc)::integer + 1) AS thu,
                    tiethoc
                FROM THOI_KHOA_BIEU
                WHERE malop = $1 AND mamon = $2
                ORDER BY thu, tiethoc
            `;
      const fbResult = await client.query(fallbackSlots, [maLop, maMon]);
      dsLichTuan = fbResult.rows;
    }

    if (dsLichTuan.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        msg: "Lỗi: Không có khung giờ dạy. Hãy import file TKB tuần (CSV ở Quản lý Kho), hoặc có ít nhất một số tiết trong THOI_KHOA_BIEU cho đúng mã lớp và mã môn (trùng khớp với form).",
      });
    }

    // Bước 3: Xóa các TKB cũ của môn/lớp này từ ngày khai giảng (để tránh lặp đè khi GV bấm nhiều lần)
    await client.query(
      `DELETE FROM THOI_KHOA_BIEU WHERE magv=$1 AND malop=$2 AND mamon=$3 AND ngayhoc >= $4`,
      [maGV, maLop, maMon, ngayBatDau],
    );

    // Bước 4: Thuật toán rải lịch linh hoạt theo TKB tuần
    let currentDate = new Date(ngayBatDau);
    let currentLessonIndex = 0;

    const queryInsertTKB = `
            INSERT INTO THOI_KHOA_BIEU (matkb, magv, malop, mamon, mappct, tiethoc, ngayhoc)
            VALUES (
               COALESCE((SELECT MAX(matkb) FROM THOI_KHOA_BIEU), 0) + 1,
               $1, $2, $3, $4, $5, $6
            )
        `;

    while (currentLessonIndex < dsBaiHoc.length) {
      const jsDay = currentDate.getDay(); // 0(Sun) - 6(Sat)
      const dDay = jsDay === 0 ? 8 : jsDay + 1; // MySQL/Postgres Thứ 2 = 2, Thứ 3 = 3 ... CN = 8

      // Tìm xem ngày này có tiết nào khai báo trong TKB_TUAN không
      const matchingSlots = dsLichTuan.filter(
        (slot) => Number(slot.thu) === dDay,
      );

      for (const slot of matchingSlots) {
        if (currentLessonIndex >= dsBaiHoc.length) break;

        const baiHoc = dsBaiHoc[currentLessonIndex];

        await client.query(queryInsertTKB, [
          maGV,
          maLop,
          maMon,
          baiHoc.mappct,
          slot.tiethoc,
          currentDate.toISOString().split("T")[0],
        ]);

        currentLessonIndex++;
      }

      // Tiến sang ngày mai
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({
        msg: `✅ Đã rải thành công ${dsBaiHoc.length} bài học theo đúng lịch tuần thực tế!`,
      });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi thuật toán sinh lịch:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi sinh lịch tự động" });
  } finally {
    client.release();
  }
};

// 2. THUẬT TOÁN DỊCH LỊCH (XỬ LÝ SỰ CỐ NGHỈ BÃO/LỄ)
const shiftSchedule = async (req, res) => {
  try {
    const { maGV, maLop, maMon, tuNgay, soNgayNghi } = req.body;

    // Cập nhật Database: Cộng thêm 'soNgayNghi' vào 'NgayHoc' cho tất cả các bài từ 'tuNgay' trở về sau
    const query = `
            UPDATE THOI_KHOA_BIEU
            SET NgayHoc = NgayHoc + $1 * INTERVAL '1 day'
            WHERE MaGV = $2 AND MaLop = $3 AND MaMon = $4 AND NgayHoc >= $5
        `;

    await pool.query(query, [soNgayNghi, maGV, maLop, maMon, tuNgay]);
    res
      .status(200)
      .json({
        msg: `✅ Đã lùi lịch xuống ${soNgayNghi} ngày thành công cho lớp ${maLop}!`,
      });
  } catch (err) {
    console.error("Lỗi dịch lịch:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi dịch lịch" });
  }
};
// 3. THÊM NHANH TKB TỪ MÀN HÌNH CHÍNH (QUICK ADD)
const quickAddSchedule = async (req, res) => {
  try {
    const { maGV, maLop, maMon, maPPCT, ngayHoc, tietHoc } = req.body;

    const insertQuery = `
            INSERT INTO THOI_KHOA_BIEU (matkb, magv, malop, mamon, mappct, ngayhoc, tiethoc)
            VALUES (
               COALESCE((SELECT MAX(matkb) FROM THOI_KHOA_BIEU), 0) + 1,
               $1, $2, $3, $4, $5, $6
            ) RETURNING matkb
        `;

    const result = await pool.query(insertQuery, [
      maGV,
      maLop,
      maMon,
      maPPCT,
      ngayHoc,
      tietHoc,
    ]);
    res
      .status(200)
      .json({
        msg: `✅ Đã chèn tiết dạy thành công! TKB: ${result.rows[0].matkb}`,
      });
  } catch (err) {
    console.error("Lỗi thêm nhanh TKB:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi chèn tiết học mới" });
  }
};

// 4. IMPORT TKB TỪ CSV PHẲNG (Flat Data) + TỰ ĐỘNG KHỚP NỐI PPCT
// CSV dùng TÊN GIÁO VIÊN (viết tắt) thay vì mã GV
const importCSV = async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: csvRows } = req.body;
    // csvRows: [{ ngay, maGV (thực chất là tên GV), lop, maMon, tiet, buoi }]

    if (!csvRows || csvRows.length === 0) {
      return res.status(400).json({ msg: "Dữ liệu CSV trống!" });
    }

    // --- Bước 0: Load TOÀN BỘ giáo viên từ DB để tra cứu tên → mã ---
    // Lấy thêm taikhoan vì nhiều file TKB của trường ghi cột "MaGV" theo
    // tài khoản đăng nhập (vd: "bhuong" cho cô Bùi Thị Hương) — không phải magv thật.
    const teacherRes = await client.query(
      "SELECT magv, tengv, taikhoan FROM GIAO_VIEN",
    );
    const teachers = teacherRes.rows;

    // Hàm bỏ dấu tiếng Việt để so sánh cross-encoding
    const removeDiacritics = (str) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    };

    // Hàm chuẩn hóa tên (bỏ dấu, bỏ chấm thừa, khoảng trắng, toLowerCase)
    const normalize = (str) => {
      return removeDiacritics((str || "").trim())
        .replace(/\.\./g, ".") // Sửa lỗi "L..Anh" → "L.Anh"
        .replace(/\s+/g, " ") // Gộp khoảng trắng
        .toLowerCase();
    };

    // Hàm tra cứu tên GV viết tắt → MaGV
    // Logic: "Nhung" khớp "Nguyễn Thị Nhung", "Đ.Lý" khớp "Đặng Thị Lý"
    const findTeacher = (csvName) => {
      const name = normalize(csvName);
      if (!name) return null;

      const rawLower = csvName.trim().toLowerCase();

      // 0. Thử khớp trực tiếp với MaGV (nếu CSV dùng mã thay vì tên)
      let found = teachers.find((t) => t.magv.toLowerCase() === rawLower);
      if (found) return found.magv;

      // 0b. Thử khớp với tài khoản đăng nhập (nhiều file TKB ghi "bhuong",
      // "lhuong"... chính là taikhoan của GV — duy nhất và không ambiguous).
      found = teachers.find(
        (t) => (t.taikhoan || "").toLowerCase() === rawLower,
      );
      if (found) return found.magv;

      // 1. Thử khớp chính xác tên đầy đủ
      found = teachers.find((t) => normalize(t.tengv) === name);
      if (found) return found.magv;

      // 2. Thử khớp từ cuối cùng của TenGV (tên gọi)
      // VD: "Nhung" khớp "Nguyễn Thị Nhung"
      found = teachers.find((t) => {
        const parts = normalize(t.tengv).split(" ");
        return parts[parts.length - 1] === name;
      });
      if (found) return found.magv;

      // 3. Thử khớp tên viết tắt có dấu chấm
      // VD: "Đ.Lý" → tách thành ["Đ", "Lý"]
      //     Khớp GV có tên cuối "Lý" VÀ họ bắt đầu bằng "Đ"
      // VD: "M.Huệ" → tách thành ["M", "Huệ"]
      //     Khớp GV có tên cuối "Huệ" VÀ (họ hoặc tên lót) bắt đầu bằng "M"
      // VD: "B.Hương" → ["B", "Hương"]
      if (name.includes(".")) {
        const dotParts = name.split(".").filter((p) => p.length > 0);
        if (dotParts.length >= 2) {
          const initials = dotParts.slice(0, -1).map((p) => normalize(p)); // Các chữ viết tắt phía trước
          const lastName = normalize(dotParts[dotParts.length - 1]); // Tên gọi (cuối cùng)

          found = teachers.find((t) => {
            const fullParts = normalize(t.tengv).split(" ");
            const tenGoi = fullParts[fullParts.length - 1];
            if (tenGoi !== lastName) return false;

            // Kiểm tra initials khớp với các phần còn lại của tên
            const otherParts = fullParts.slice(0, -1); // Họ + tên lót
            return initials.every((initial) =>
              otherParts.some((part) => part.startsWith(initial)),
            );
          });
          if (found) return found.magv;
        }
      }

      // 4. Thử khớp substring (tên chứa trong TenGV)
      found = teachers.find((t) => normalize(t.tengv).includes(name));
      if (found) return found.magv;

      return null; // Không tìm thấy
    };

    // Lấy danh sách Môn Học từ DB để đối chiếu
    const monResult = await client.query("SELECT mamon FROM MON_HOC");
    const validSubjects = new Set(
      monResult.rows.map((r) => r.mamon.toUpperCase()),
    );

    // --- Bước 1: Lọc chỉ Buổi 1 (chính khóa), bỏ Buổi 2 & SHL ---
    // Và chuyển đổi tên GV → MaGV
    const validRows = [];
    const unmatchedNames = new Set();
    const skippedSubjects = new Set();

    for (const r of csvRows) {
      if (!r.maGV || !r.lop || !r.maMon || !r.ngay) continue;
      const buoi = (r.buoi || "").toLowerCase();
      if (buoi.includes("buổi 2")) continue;

      // Xử lý loại bỏ ngoặc kép bị dính do lỗi parse CSV
      let mon = (r.maMon || "").trim().toUpperCase();
      if (mon.startsWith('"') && mon.endsWith('"')) {
        mon = mon.substring(1, mon.length - 1).trim();
      }
      if (mon.startsWith('"')) mon = mon.substring(1).trim();

      if (mon === "SHL" || mon === "CHAOCO") continue;

      // Bỏ qua nếu môn học không tồn tại trong DB (ví dụ: BDDTMON...)
      if (!validSubjects.has(mon)) {
        skippedSubjects.add(mon);
        continue;
      }

      // Tra cứu tên GV → MaGV
      const maGV = findTeacher(r.maGV);
      if (!maGV) {
        unmatchedNames.add(r.maGV.trim());
        continue; // Bỏ qua dòng này
      }

      validRows.push({ ...r, resolvedMaGV: maGV, maMon: mon });
    }

    if (validRows.length === 0) {
      const nameList = [...unmatchedNames].join(", ");
      return res.status(400).json({
        msg: `Không có dòng dữ liệu hợp lệ! ${unmatchedNames.size > 0 ? `Không tìm thấy GV: ${nameList}` : ""}`,
      });
    }

    // --- Bước 2: Xác định phạm vi ngày của tuần import ---
    const dates = validRows
      .map((r) => {
        if (!r.ngay) return null;
        // Xử lý định dạng ngày DD/MM/YYYY
        const parts = r.ngay.includes("/") ? r.ngay.split("/") : null;
        if (parts && parts.length === 3) {
          // Đảm bảo định dạng là YYYY-MM-DD
          return new Date(
            `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`,
          );
        }
        // Fallback cho các định dạng khác
        const d = new Date(r.ngay);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter((d) => d !== null);

    if (dates.length === 0) {
      return res
        .status(400)
        .json({
          msg: "Lỗi: Không thể parse định dạng ngày trong file CSV. Vui lòng dùng định dạng DD/MM/YYYY hoặc YYYY-MM-DD.",
        });
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    // Fix lỗi timezone khi gọi toISOString()
    const minStr = new Date(
      minDate.getTime() - minDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];
    const maxStr = new Date(
      maxDate.getTime() - maxDate.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .split("T")[0];

    await client.query("BEGIN");

    // --- Bước 3: Xóa TKB cũ trong phạm vi tuần này (chỉ xóa những bản ghi chưa có phiếu mượn) ---
    await client.query(
      `
            DELETE FROM THOI_KHOA_BIEU 
            WHERE ngayhoc >= $1 AND ngayhoc <= $2 
              AND matkb NOT IN (SELECT matkb FROM PHIEU_MUON)
        `,
      [minStr, maxStr],
    );

    // --- Bước 4: Nhóm theo (GV, Lop, Mon) để tính offset PPCT ---
    const groups = {};
    for (const r of validRows) {
      let dateStr = r.ngay;
      if (r.ngay && r.ngay.includes("/")) {
        const parts = r.ngay.split("/");
        if (parts.length === 3) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      } else if (r.ngay) {
        const d = new Date(r.ngay);
        if (!isNaN(d.getTime())) {
          // Fix lỗi timezone
          dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
        }
      }

      const key = `${r.resolvedMaGV}|${r.lop}|${r.maMon}|${r.tuan || ''}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...r, dateStr, tiet: parseInt(r.tiet) });
    }

    let inserted = 0;
    let matched = 0;

    for (const [key, slots] of Object.entries(groups)) {
      const [maGV, maLop, maMon, tuanKey] = key.split("|");

      // Sắp xếp theo ngày + tiết để đúng thứ tự
      slots.sort((a, b) => {
        const dateDiff = new Date(a.dateStr) - new Date(b.dateStr);
        return dateDiff !== 0 ? dateDiff : a.tiet - b.tiet;
      });

      // Lấy danh sách PPCT của môn này (sắp xếp theo tiết thứ)
      const ppctRes = await client.query(
        `
                SELECT mappct, tietthu, tenbaihoc, tuan 
                FROM PHAN_PHOI_CHUONG_TRINH 
                WHERE mamon = $1 
                ORDER BY tietthu ASC
            `,
        [maMon],
      );
      const ppctList = ppctRes.rows;

      let offset = 0;
      if (tuanKey) {
        const weekStr = String(tuanKey).trim();
        // Tìm bài học đầu tiên khớp với Tuần này
        const firstLessonIndex = ppctList.findIndex(p => 
          p.tuan && (
            p.tuan.includes(`Tuần ${weekStr}`) || 
            p.tuan.includes(` ${weekStr},`) || 
            p.tuan.endsWith(` ${weekStr}`) || 
            p.tuan === weekStr
          )
        );
        if (firstLessonIndex !== -1) {
          offset = firstLessonIndex;
        } else {
          // Fallback nếu không tìm thấy bài nào có chữ Tuần tương ứng
          const countRes = await client.query(
            `SELECT MAX(ppct.tietthu) as max_tiet FROM THOI_KHOA_BIEU tkb JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.mappct = ppct.mappct WHERE tkb.malop = $1 AND tkb.mamon = $2 AND tkb.ngayhoc < $3`,
            [maLop, maMon, minStr]
          );
          offset = parseInt(countRes.rows[0].max_tiet) || 0;
        }
      } else {
        // Cách cũ (đếm bù trừ) nếu CSV không có cột tuần
        const countRes = await client.query(
          `SELECT MAX(ppct.tietthu) as max_tiet FROM THOI_KHOA_BIEU tkb JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.mappct = ppct.mappct WHERE tkb.malop = $1 AND tkb.mamon = $2 AND tkb.ngayhoc < $3`,
          [maLop, maMon, minStr]
        );
        offset = parseInt(countRes.rows[0].max_tiet) || 0;
      }

      // --- Bước 5: Insert từng slot vào THOI_KHOA_BIEU ---
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const ppctIndex = offset + i;

        let mappct = null;
        if (ppctIndex < ppctList.length) {
          mappct = ppctList[ppctIndex].mappct;
          matched++;
        }

        // Xác định buổi → tính tiết thực (Chiều Buổi 1: tiết 1-3 → tiết 6-8)
        const buoiLower = (slot.buoi || "").toLowerCase();
        let tietThuc = slot.tiet;
        if (buoiLower.includes("chiều")) {
          tietThuc = slot.tiet + 5;
        }

        // Kiểm tra trùng lặp
        const existing = await client.query(
          `
                    SELECT matkb FROM THOI_KHOA_BIEU 
                    WHERE magv=$1 AND malop=$2 AND mamon=$3 AND ngayhoc=$4 AND tiethoc=$5
                `,
          [maGV, maLop, maMon, slot.dateStr, tietThuc],
        );

        if (existing.rows.length > 0) {
          if (mappct) {
            await client.query(
              `UPDATE THOI_KHOA_BIEU SET mappct=$1 WHERE matkb=$2`,
              [mappct, existing.rows[0].matkb],
            );
          }
        } else {
          const resultTkb = await client.query(
            `
                        INSERT INTO THOI_KHOA_BIEU (matkb, magv, malop, mamon, mappct, ngayhoc, tiethoc)
                        VALUES (
                            COALESCE((SELECT MAX(matkb) FROM THOI_KHOA_BIEU), 0) + 1,
                            $1, $2, $3, $4, $5, $6
                        ) RETURNING matkb
                    `,
            [maGV, maLop, maMon, mappct, slot.dateStr, tietThuc],
          );
          inserted++;
          const newMaTKB = resultTkb.rows[0].matkb;

          // --- AUTO GEN PHIEU_MUON (DRAFT) ---
          if (mappct) {
            const gyRes = await client.query(
               "SELECT maloaitb, soluongdexuat FROM GOI_Y_THIET_BI WHERE mappct = $1", [mappct]
            );
            if (gyRes.rows.length > 0) {
               const maPhieu = "PM" + Date.now() + Math.floor(Math.random() * 1000) + i;
               await client.query(
                 "INSERT INTO PHIEU_MUON (MaPhieu, MaTKB, NguoiMuon, TrangThai, NgayTao) VALUES ($1, $2, $3, 'BanNhap', NOW())",
                 [maPhieu, newMaTKB, maGV]
               );
               for (const gy of gyRes.rows) {
                 await client.query(
                   "INSERT INTO CHI_TIET_PHIEU (MaPhieu, MaLoaiTB, SoLuongDK) VALUES ($1, $2, $3)",
                   [maPhieu, gy.maloaitb, gy.soluongdexuat]
                 );
               }
            }
          }
        }
      }

      // Cập nhật bảng tien_do_giang_day
      const maxOffsetThisWeek = offset + slots.length;
      await client.query(`
        INSERT INTO tien_do_giang_day (malop, mamon, tiet_ppct_hien_tai, ngay_cap_nhat)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (malop, mamon)
        DO UPDATE SET tiet_ppct_hien_tai = GREATEST(tien_do_giang_day.tiet_ppct_hien_tai, EXCLUDED.tiet_ppct_hien_tai), ngay_cap_nhat = NOW()
      `, [maLop, maMon, maxOffsetThisWeek]);
    }

    await client.query("COMMIT");

    // Báo cáo kết quả (bao gồm tên GV không khớp nếu có)
    let msg = `✅ Đã import ${inserted} tiết học từ CSV (${matched} tiết khớp PPCT tự động). Tuần: ${minStr} → ${maxStr}`;
    if (unmatchedNames.size > 0) {
      msg += ` ⚠️ Bỏ qua ${unmatchedNames.size} tên GV không tìm thấy: ${[...unmatchedNames].join(", ")}`;
    }

    res.status(200).json({
      msg,
      stats: {
        inserted,
        matched,
        total: validRows.length,
        groups: Object.keys(groups).length,
        skippedNames: [...unmatchedNames],
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi import CSV:", err);
    let detailMsg = err.message;
    if (err.detail) detailMsg += ` (${err.detail})`;
    res.status(500).json({ msg: "Lỗi hệ thống khi import CSV: " + detailMsg });
  } finally {
    client.release();
  }
};

const getPpctBySubject = async (req, res) => {
  try {
    const { mamon } = req.params;
    const result = await pool.query(
      "SELECT mappct, tietthu, tenbaihoc FROM PHAN_PHOI_CHUONG_TRINH WHERE mamon = $1 ORDER BY tietthu ASC",
      [mamon]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({msg: "Lỗi lấy PPCT"});
  }
};

module.exports = {
  importTKB,
  importPPCT,
  generateSchedule,
  shiftSchedule,
  quickAddSchedule,
  importCSV,
  getPpctBySubject,
};
