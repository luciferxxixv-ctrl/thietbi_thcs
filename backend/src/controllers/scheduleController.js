const { pool } = require("../config/db"); // Nhập pool thay vì sql

const getSchedule = async (req, res) => {
  try {
    const { maGV } = req.params;
    // PostgreSQL dùng dấu ngoặc kép " cho tên bảng/cột nếu cần,
    // nhưng tốt nhất cứ viết thường hết cho lành.
    const query = `
            SELECT 
                tkb.MaTKB,
                tkb.NgayHoc,
                tkb.TietHoc,
                gv.TenGV,
                lh.MaLop,
                mh.TenMon,
                ppct.TenBaiHoc,
                ppct.LoaiPhongYeuCau
            FROM THOI_KHOA_BIEU tkb
            JOIN GIAO_VIEN gv ON tkb.MaGV = gv.MaGV
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            LEFT JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.MaPPCT = ppct.MaPPCT
            WHERE tkb.MaGV = $1 AND DATE(tkb.NgayHoc) = CURRENT_DATE
            ORDER BY tkb.TietHoc ASC
        `;

    const result = await pool.query(query, [maGV]);

    // PostgreSQL trả dữ liệu trong thuộc tính .rows
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi Server: Không lấy được TKB");
  }
};

const getWeeklySchedule = async (req, res) => {
  try {
    const { maGV } = req.params;
    const offset = parseInt(req.query.weekOffset) || 0;
    const offsetLeft = `${offset} weeks`;
    const offsetRight = `${offset + 1} weeks`;

    // Offset logic: date_trunc('week', CURRENT_DATE) + interval 'offset weeks'
    // Join with GOI_Y_THIET_BI to get suggestions
    const query = `
            SELECT 
                tkb.MaTKB as matkb,
                tkb.NgayHoc as ngayhoc,
                tkb.TietHoc as tiethoc,
                gv.TenGV as tengv,
                lh.MaLop as malop,
                mh.MaMon as mamon,
                tkb.MaPPCT as mappct,
                mh.TenMon as tenmon,
                ppct.TenBaiHoc as tenbaihoc,
                ppct.LoaiPhongYeuCau as loaiphongyeucau,
                EXTRACT(ISODOW FROM tkb.NgayHoc) + 1 AS thu,
                pm.TrangThai as ticketstatus,
                pm.MaPhieu as ticketid,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'maloaitb', gy.MaLoaiTB,
                            'tenloai', ltb.TenLoai,
                            'soluong', gy.SoLuongDeXuat
                        )
                    ) FILTER (WHERE gy.MaLoaiTB IS NOT NULL), 
                    '[]'
                ) as suggestions
            FROM THOI_KHOA_BIEU tkb
            JOIN GIAO_VIEN gv ON tkb.MaGV = gv.MaGV
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            LEFT JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.MaPPCT = ppct.MaPPCT
            LEFT JOIN PHIEU_MUON pm ON tkb.MaTKB = pm.MaTKB AND pm.NguoiMuon = tkb.MaGV
            LEFT JOIN GOI_Y_THIET_BI gy ON ppct.MaPPCT = gy.MaPPCT
            LEFT JOIN LOAI_THIET_BI ltb ON gy.MaLoaiTB = ltb.MaLoaiTB
            WHERE tkb.MaGV = $1 
              AND tkb.NgayHoc >= date_trunc('week', CURRENT_DATE) + $2::interval
              AND tkb.NgayHoc < date_trunc('week', CURRENT_DATE) + $3::interval
            GROUP BY tkb.MaTKB, tkb.NgayHoc, tkb.TietHoc, gv.TenGV, lh.MaLop, mh.MaMon, tkb.MaPPCT, mh.TenMon, ppct.TenBaiHoc, ppct.LoaiPhongYeuCau, pm.TrangThai, pm.MaPhieu
            ORDER BY tkb.NgayHoc ASC, tkb.TietHoc ASC
        `;

    const result = await pool.query(query, [maGV, offsetLeft, offsetRight]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi Server: Không lấy được TKB Tuần");
  }
};

// Giáo viên xoá một tiết trong TKB của chính mình.
// Yêu cầu maGV (truyền qua body hoặc query) để kiểm tra quyền sở hữu.
// Từ chối xoá nếu tiết đó đã có phiếu mượn (đã gửi duyệt / đang mượn / đã trả).
const deleteSchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const matkb = parseInt(req.params.matkb, 10);
    const maGV = (req.body && req.body.maGV) || req.query.maGV;

    if (!matkb || Number.isNaN(matkb)) {
      return res.status(400).json({ msg: "Mã TKB không hợp lệ." });
    }
    if (!maGV) {
      return res.status(400).json({ msg: "Thiếu mã giáo viên." });
    }

    await client.query("BEGIN");

    // 1. Tiết phải tồn tại và thuộc đúng giáo viên đang đăng nhập
    const own = await client.query(
      "SELECT matkb, magv FROM THOI_KHOA_BIEU WHERE matkb = $1",
      [matkb],
    );
    if (own.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy tiết học để xoá." });
    }
    if (own.rows[0].magv !== maGV) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({
          msg: "Bạn không có quyền xoá tiết này (không phải lịch của bạn).",
        });
    }

    // 2. Không xoá nếu đã có phiếu mượn liên kết (đã gửi duyệt / đang mượn / đã trả)
    const phieu = await client.query(
      "SELECT MaPhieu, TrangThai FROM PHIEU_MUON WHERE MaTKB = $1 LIMIT 1",
      [matkb],
    );
    if (phieu.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        msg: `Tiết này đã có phiếu mượn (${phieu.rows[0].maphieu} - ${phieu.rows[0].trangthai}). Không thể xoá.`,
      });
    }

    // 3. Xoá
    await client.query("DELETE FROM THOI_KHOA_BIEU WHERE matkb = $1", [matkb]);

    await client.query("COMMIT");
    res.status(200).json({ msg: "✅ Đã xoá tiết học khỏi lịch." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi xoá TKB:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi xoá tiết học." });
  } finally {
    client.release();
  }
};

const updatePpct = async (req, res) => {
  try {
    const { matkb, mappct } = req.body;
    await pool.query("UPDATE THOI_KHOA_BIEU SET mappct = $1 WHERE matkb = $2", [mappct, matkb]);
    res.status(200).json({msg: "Cập nhật tiến độ thành công"});
  } catch (err) {
    res.status(500).json({msg: "Lỗi Server"});
  }
};

module.exports = { getSchedule, getWeeklySchedule, deleteSchedule, updatePpct };
