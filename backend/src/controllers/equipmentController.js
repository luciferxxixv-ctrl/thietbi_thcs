const { pool } = require("../config/db");

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// Đẩy ảnh (buffer trong RAM) lên imgbb và trả về URL ảnh đã host.
// Trả về null nếu không có file hoặc upload thất bại (thiết bị vẫn được tạo, chỉ thiếu ảnh).
const uploadToImgbb = async (file) => {
  if (!file || !file.buffer) return null;
  if (!IMGBB_API_KEY) {
    console.warn("Chưa cấu hình IMGBB_API_KEY → bỏ qua việc upload ảnh.");
    return null;
  }

  try {
    const form = new FormData();
    form.append("image", file.buffer.toString("base64"));

    const resp = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      { method: "POST", body: form },
    );
    const json = await resp.json();

    if (json && json.success && json.data) {
      return json.data.display_url || json.data.url;
    }
    console.error("imgbb trả về lỗi:", json);
    return null;
  } catch (err) {
    console.error("Lỗi upload ảnh lên imgbb:", err.message);
    return null;
  }
};

// Hàm lấy tất cả thiết bị
const getAllEquipment = async (req, res) => {
  try {
    const query = `
      SELECT
        ltb.maloaitb, ltb.tenloai, ltb.donvitinh, ltb.tongtonkho, ltb.soluongtot, ltb.hinhanh,
        COALESCE((
          SELECT SUM(ct.SoLuongDK)
          FROM CHI_TIET_PHIEU ct
          JOIN PHIEU_MUON pm ON ct.MaPhieu = pm.MaPhieu
          WHERE ct.MaLoaiTB = ltb.maloaitb AND pm.TrangThai = 'DangMuon'
        ), 0) AS dangmuon
      FROM loai_thiet_bi ltb
      ORDER BY ltb.maloaitb
    `;
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
    const hinhanh = await uploadToImgbb(req.file);

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

    // Khởi tạo soluongtot = tongtonkho: khi mới nhập, toàn bộ thiết bị đều dùng tốt.
    // (Trước đây không set soluongtot → mặc định 0 → thiết bị mới KHÔNG mượn được.)
    const soLuong = parseInt(tongtonkho, 10) || 0;
    const insertQuery = `
            INSERT INTO loai_thiet_bi (maloaitb, tenloai, donvitinh, tongtonkho, soluongtot, hinhanh)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `;
    const result = await pool.query(insertQuery, [
      madong,
      tenloai,
      donvitinh,
      soLuong,
      soLuong,
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

    // Tính lại soluongtot (dùng tốt) = tongtonkho - hong - mat để giữ nhất quán.
    // Tránh tình trạng tongtonkho > 0 nhưng soluongtot = 0 khiến không mượn được.
    let query = `
      UPDATE loai_thiet_bi
      SET tenloai=$1, donvitinh=$2, tongtonkho=$3,
          soluongtot = GREATEST($3::int - COALESCE(soluonghong,0) - COALESCE(soluongmat,0), 0)
      WHERE maloaitb=$4 RETURNING *`;
    let params = [tenloai, donvitinh, tongtonkho, id];

    if (req.file) {
      const hinhanh = await uploadToImgbb(req.file);
      if (hinhanh) {
        query = `
          UPDATE loai_thiet_bi
          SET tenloai=$1, donvitinh=$2, tongtonkho=$3,
              soluongtot = GREATEST($3::int - COALESCE(soluonghong,0) - COALESCE(soluongmat,0), 0),
              hinhanh=$4
          WHERE maloaitb=$5 RETURNING *`;
        params = [tenloai, donvitinh, tongtonkho, hinhanh, id];
      }
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
