const { pool } = require("../config/db");
const path = require("path");
const fs = require("fs");

// [Đảm bảo thư mục uploads tồn tại]
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Hàm lấy tất cả thiết bị
const getAllEquipment = async (req, res) => {
  try {
    const query =
      "SELECT maloaitb, tenloai, donvitinh, tongtonkho, hinhanh FROM loai_thiet_bi ORDER BY maloaitb";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi server khi lấy danh sách thiết bị" });
  }
};

// Hàm thêm mới thiết bị
const addEquipment = async (req, res) => {
  try {
    const { tenloai, donvitinh, tongtonkho } = req.body;
    const hinhanh = req.file ? req.file.filename : null;

    // Sinh mã thiết bị tự động (VD: TB001)
    const countQuery = "SELECT COUNT(*) FROM loai_thiet_bi";
    const countRes = await pool.query(countQuery);
    let nextNumber = parseInt(countRes.rows[0].count) + 1;
    let madong = `TB${nextNumber.toString().padStart(3, "0")}`;

    // Ensure the generated ID doesn't already exist (in case of deletes)
    let idExists = true;
    while (idExists) {
      const check = await pool.query(
        "SELECT 1 FROM loai_thiet_bi WHERE maloaitb = $1",
        [madong],
      );
      if (check.rowCount > 0) {
        nextNumber++;
        madong = `TB${nextNumber.toString().padStart(3, "0")}`;
      } else {
        idExists = false;
      }
    }

    const insertQuery = `
            INSERT INTO loai_thiet_bi (maloaitb, tenloai, donvitinh, tongtonkho, hinhanh)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
    const result = await pool.query(insertQuery, [
      madong,
      tenloai,
      donvitinh,
      tongtonkho,
      hinhanh,
    ]);

    res
      .status(201)
      .json({ msg: "Thêm thiết bị thành công", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi khi thêm thiết bị mới" });
  }
};

const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenloai, donvitinh, tongtonkho } = req.body;

    let query =
      "UPDATE loai_thiet_bi SET tenloai=$1, donvitinh=$2, tongtonkho=$3 WHERE maloaitb=$4 RETURNING *";
    let params = [tenloai, donvitinh, tongtonkho, id];

    if (req.file) {
      query =
        "UPDATE loai_thiet_bi SET tenloai=$1, donvitinh=$2, tongtonkho=$3, hinhanh=$4 WHERE maloaitb=$5 RETURNING *";
      params = [tenloai, donvitinh, tongtonkho, req.file.filename, id];
    }

    const result = await pool.query(query, params);
    res.json({ msg: "Cập nhật thành công", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi cập nhật thiết bị" });
  }
};

module.exports = {
  updateEquipment,
  getAllEquipment,
  addEquipment,
};
