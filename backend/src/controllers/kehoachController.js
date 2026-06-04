const { pool } = require("../config/db");

// Lấy danh sách kế hoạch đã lưu của GV
exports.getKeHoach = async (req, res) => {
  try {
    const { maGV, maMon, maLop } = req.query;
    const query = `
            SELECT * FROM ke_hoach_day_hoc 
            WHERE magv = $1 AND mamon = $2 AND malop = $3 
            ORDER BY id ASC
        `;
    const { rows } = await pool.query(query, [maGV, maMon, maLop]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Lỗi getKeHoach:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi tải kế hoạch" });
  }
};

// Lưu kế hoạch (PL 3 năm) — chỉ ghi vào bảng KẾ HOẠCH và đồng bộ GỢI Ý THIẾT BỊ.
// QUAN TRỌNG (Phase 0): KHÔNG động đến THOI_KHOA_BIEU.
//   Trước đây saveKeHoach DELETE/INSERT vào TKB → ghi đè dữ liệu admin import từ CSV.
//   Tách rõ vai trò:  ke_hoach_day_hoc = ý định cả năm,  THOI_KHOA_BIEU = lịch thực tế (admin/engine quản lý).
exports.saveKeHoach = async (req, res) => {
  const client = await pool.connect();
  try {
    const { maGV, maMon, maLop, planList } = req.body;

    await client.query("BEGIN");

    // 1. Reset PL 3 cũ của (GV, môn, lớp) này — không động đến TKB
    await client.query(
      `DELETE FROM ke_hoach_day_hoc WHERE magv=$1 AND mamon=$2 AND malop=$3`,
      [maGV, maMon, maLop],
    );

    const insertQuery = `
            INSERT INTO ke_hoach_day_hoc (magv, mamon, malop, tuan, chuong, tietppct, tenbaihoc, thietbi, diadiem, mappct, dieuchinh)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

    for (const item of planList) {
      let currentMappct = item.mappct;
      // Nếu không có mappct → đẩy bài mới vào PPCT gốc để tham chiếu được
      if (!currentMappct) {
        const qPpct = `INSERT INTO PHAN_PHOI_CHUONG_TRINH (mappct, mamon, tietthu, tenbaihoc, loaiphongyeucau) 
                               VALUES (COALESCE((SELECT MAX(mappct) FROM PHAN_PHOI_CHUONG_TRINH), 0) + 1, $1, $2, $3, $4) RETURNING mappct`;
        const rPpct = await client.query(qPpct, [
          maMon,
          item.tietppct || 0,
          item.tenbaihoc,
          item.diadiem,
        ]);
        currentMappct = rPpct.rows[0].mappct;
      }

      // Đồng bộ gợi ý thiết bị nếu GV chọn thủ công cho bài này
      const thietbiArr = Array.isArray(item.thietbi) ? item.thietbi : [];
      if (thietbiArr.length > 0) {
        await client.query("DELETE FROM goi_y_thiet_bi WHERE mappct=$1", [
          currentMappct,
        ]);
        for (const ml of thietbiArr) {
          const checkTb = await client.query(
            "SELECT maloaitb FROM LOAI_THIET_BI WHERE maloaitb=$1",
            [ml],
          );
          if (checkTb.rows.length > 0) {
            try {
              await client.query(
                "INSERT INTO goi_y_thiet_bi (mappct, maloaitb, soluongdexuat) VALUES ($1, $2, 1)",
                [currentMappct, ml],
              );
            } catch (err) {
              // Bỏ qua trùng khoá
            }
          }
        }
      }

      const thietbiStr = JSON.stringify(thietbiArr);
      await client.query(insertQuery, [
        maGV,
        maMon,
        maLop,
        item.tuan || null,
        item.chuong || "",
        item.tietppct || null,
        item.tenbaihoc || "",
        thietbiStr,
        item.diadiem || "",
        currentMappct,
        item.dieuchinh || "",
      ]);
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({
        msg: "✅ Đã lưu PL 3 (kế hoạch năm). TKB tuần KHÔNG bị thay đổi.",
      });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi saveKeHoach:", err);

    let errorMsg = "Lỗi hệ thống khi lưu kế hoạch";
    if (err.constraint === "fk_tkb_lop" || err.constraint === "kh_malop_fkey") {
      errorMsg = `Tên lớp không tồn tại trong hệ thống. Vui lòng kiểm tra lại ô "Lớp Dạy" (VD: 7A, 9B).`;
    } else if (
      err.constraint === "fk_tkb_mon" ||
      err.constraint === "kh_mamon_fkey"
    ) {
      errorMsg = `Mã môn không tồn tại. Vui lòng kiểm tra ô "Mã Môn" (VD: NV7, TOAN, LY).`;
    }

    res.status(500).json({ msg: errorMsg, error: err.message });
  } finally {
    client.release();
  }
};

// Lấy template PPCT gốc
exports.getPpct = async (req, res) => {
  try {
    const { maMon } = req.query;
    const query = `SELECT * FROM phan_phoi_chuong_trinh WHERE mamon = $1 ORDER BY tietthu ASC`;
    const { rows } = await pool.query(query, [maMon]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Lỗi getPpct:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi tải PPCT" });
  }
};
