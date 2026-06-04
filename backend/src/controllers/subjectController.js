const { pool } = require("../config/db");

const getAllSubjects = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM MON_HOC ORDER BY mamon ASC");
    res.status(200).json(rows);
  } catch (err) {
    console.error("Lỗi get môn học:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi tải môn học" });
  }
};

const addSubject = async (req, res) => {
  try {
    const { mamon, tenmon } = req.body;
    if (!mamon || !tenmon) {
      return res.status(400).json({ msg: "Thiếu mã môn hoặc tên môn" });
    }
    
    // Check trùng
    const check = await pool.query("SELECT mamon FROM MON_HOC WHERE mamon = $1", [mamon]);
    if (check.rows.length > 0) {
      return res.status(400).json({ msg: "Mã môn học này đã tồn tại" });
    }

    await pool.query(
      "INSERT INTO MON_HOC (mamon, tenmon) VALUES ($1, $2)",
      [mamon, tenmon]
    );
    res.status(201).json({ msg: "Thêm môn học thành công" });
  } catch (err) {
    console.error("Lỗi add môn học:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi thêm môn học" });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params; // Lấy mamon cũ
    const { tenmon } = req.body;
    if (!tenmon) {
      return res.status(400).json({ msg: "Tên môn không được để trống" });
    }

    const check = await pool.query("SELECT mamon FROM MON_HOC WHERE mamon = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ msg: "Không tìm thấy môn học" });
    }

    await pool.query(
      "UPDATE MON_HOC SET tenmon = $1 WHERE mamon = $2",
      [tenmon, id]
    );
    res.status(200).json({ msg: "Cập nhật môn học thành công" });
  } catch (err) {
    console.error("Lỗi update môn học:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi cập nhật môn học" });
  }
};

const deleteSubject = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");
    
    // Check ràng buộc khóa ngoại trước khi xóa
    const checkPPCT = await client.query("SELECT mappct FROM PHAN_PHOI_CHUONG_TRINH WHERE mamon = $1 LIMIT 1", [id]);
    if (checkPPCT.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Không thể xóa môn học đã có phân phối chương trình" });
    }

    const checkTKB = await client.query("SELECT matkb FROM THOI_KHOA_BIEU WHERE mamon = $1 LIMIT 1", [id]);
    if (checkTKB.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Không thể xóa môn học đã xếp thời khóa biểu" });
    }

    await client.query("DELETE FROM MON_HOC WHERE mamon = $1", [id]);
    
    await client.query("COMMIT");
    res.status(200).json({ msg: "Xóa môn học thành công" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi delete môn học:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi xóa môn học" });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllSubjects,
  addSubject,
  updateSubject,
  deleteSubject
};
