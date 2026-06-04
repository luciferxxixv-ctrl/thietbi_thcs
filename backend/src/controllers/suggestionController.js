const { pool } = require("../config/db");

// API: Lấy danh sách gợi ý thiết bị theo Mã Thời Khóa Biểu
const getSuggestions = async (req, res) => {
  try {
    const { maTKB } = req.params; // Lấy ID từ đường dẫn (URL)

    if (!maTKB) {
      return res.status(400).json({ msg: "Thiếu mã thời khóa biểu!" });
    }

    const query = `
            SELECT 
                gy.ID,
                ltb.MaLoaiTB,
                ltb.TenLoai,
                ltb.DonViTinh,
                ltb.TongTonKho,
                gy.SoLuongDeXuat
            FROM THOI_KHOA_BIEU tkb
            JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.MaPPCT = ppct.MaPPCT
            JOIN GOI_Y_THIET_BI gy ON ppct.MaPPCT = gy.MaPPCT
            JOIN LOAI_THIET_BI ltb ON gy.MaLoaiTB = ltb.MaLoaiTB
            WHERE tkb.MaTKB = $1
        `;

    const result = await pool.query(query, [maTKB]);

    // Trả về danh sách thiết bị cần thiết
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi Server khi lấy gợi ý");
  }
};

module.exports = { getSuggestions };
