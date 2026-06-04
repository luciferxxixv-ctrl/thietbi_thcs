const { pool } = require("../config/db");

// Lấy danh sách PPCT theo môn
const getPpctBySubject = async (req, res) => {
  try {
    const { mamon } = req.params;
    const { rows } = await pool.query(
      "SELECT * FROM PHAN_PHOI_CHUONG_TRINH WHERE mamon = $1 ORDER BY tietthu ASC",
      [mamon]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Lỗi get PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi tải PPCT" });
  }
};

// Thêm bài học mới
const addPpct = async (req, res) => {
  try {
    const { mamon, tietthu, tenbaihoc, loaiphongyeucau } = req.body;
    if (!mamon || !tenbaihoc) {
      return res.status(400).json({ msg: "Thiếu thông tin bài học" });
    }

    const query = `
      INSERT INTO PHAN_PHOI_CHUONG_TRINH (mappct, mamon, tietthu, tenbaihoc, loaiphongyeucau) 
      VALUES (COALESCE((SELECT MAX(mappct) FROM PHAN_PHOI_CHUONG_TRINH), 0) + 1, $1, $2, $3, $4) 
      RETURNING mappct
    `;
    const result = await pool.query(query, [mamon, tietthu || null, tenbaihoc, loaiphongyeucau || null]);
    
    res.status(201).json({ msg: "Thêm bài học thành công", mappct: result.rows[0].mappct });
  } catch (err) {
    console.error("Lỗi add PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi thêm bài học" });
  }
};

// Sửa bài học
const updatePpct = async (req, res) => {
  try {
    const { id } = req.params;
    const { tietthu, tenbaihoc, loaiphongyeucau } = req.body;

    const query = `
      UPDATE PHAN_PHOI_CHUONG_TRINH 
      SET tietthu = $1, tenbaihoc = $2, loaiphongyeucau = $3 
      WHERE mappct = $4
    `;
    await pool.query(query, [tietthu || null, tenbaihoc, loaiphongyeucau || null, id]);
    
    res.status(200).json({ msg: "Cập nhật bài học thành công" });
  } catch (err) {
    console.error("Lỗi update PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi cập nhật bài học" });
  }
};

// Xóa bài học
const deletePpct = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query("BEGIN");
    
    // Check ràng buộc
    const checkTKB = await client.query("SELECT matkb FROM THOI_KHOA_BIEU WHERE mappct = $1 LIMIT 1", [id]);
    if (checkTKB.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Không thể xóa bài học đã được xếp thời khóa biểu" });
    }

    // Xóa gợi ý thiết bị trước
    await client.query("DELETE FROM GOI_Y_THIET_BI WHERE mappct = $1", [id]);
    // Xóa PPCT
    await client.query("DELETE FROM PHAN_PHOI_CHUONG_TRINH WHERE mappct = $1", [id]);
    
    await client.query("COMMIT");
    res.status(200).json({ msg: "Xóa bài học thành công" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi delete PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi xóa bài học" });
  } finally {
    client.release();
  }
};

// Lấy thiết bị gợi ý cho 1 bài học
const getEquipmentForPpct = async (req, res) => {
  try {
    const { id } = req.params; // mappct
    const query = `
      SELECT g.id, g.maloaitb, g.soluongdexuat, l.tenloai, l.donvitinh
      FROM GOI_Y_THIET_BI g
      JOIN LOAI_THIET_BI l ON g.maloaitb = l.maloaitb
      WHERE g.mappct = $1
    `;
    const { rows } = await pool.query(query, [id]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Lỗi get equipment PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi tải thiết bị" });
  }
};

// Lưu danh sách thiết bị gợi ý cho 1 bài học
const saveEquipmentForPpct = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // mappct
    const { equipments } = req.body; // [{ maloaitb, soluong }]

    await client.query("BEGIN");

    // Xóa hết cũ
    await client.query("DELETE FROM GOI_Y_THIET_BI WHERE mappct = $1", [id]);

    // Thêm mới
    if (equipments && equipments.length > 0) {
      const insertQuery = "INSERT INTO GOI_Y_THIET_BI (mappct, maloaitb, soluongdexuat) VALUES ($1, $2, $3)";
      for (const eq of equipments) {
        await client.query(insertQuery, [id, eq.maloaitb, eq.soluong]);
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ msg: "Cập nhật thiết bị gợi ý thành công" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi save equipment PPCT:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi lưu thiết bị" });
  } finally {
    client.release();
  }
};

module.exports = {
  getPpctBySubject,
  addPpct,
  updatePpct,
  deletePpct,
  getEquipmentForPpct,
  saveEquipmentForPpct
};
