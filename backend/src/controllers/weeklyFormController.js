const { pool } = require("../config/db");

// Trạng thái hợp lệ trên PHIEU_TUAN và mapping xuống PHIEU_MUON con.
//   ChoDuyet  → GV vừa gửi, admin chưa xử lý
//   DaChuanBi → admin đã gom đủ thiết bị, GV có thể đến nhận (Phase 3)
//   DaDuyet   → admin chốt cuối, phiếu khoá
//   DaDuyetMotPhan → một phần Duyệt + một phần Từ chối/Chuẩn bị
//   TuChoi    → admin từ chối kèm lý do
//   DaTra     → GV đã trả thiết bị (cuối vòng đời)
const TRANG_THAI_PHIEU = [
  "ChoDuyet",
  "DaChuanBi",
  "DaDuyet",
  "DaDuyetMotPhan",
  "TuChoi",
  "DaTra",
];

/**
 * Tính lại trạng thái phiếu tuần dựa trên trạng thái các phiếu con.
 *  - Còn 1 con ChoDuyet bất kỳ        → 'ChoDuyet' (chưa xử lý xong)
 *  - Tất cả con DaDuyet/DangMuon/DaTra → 'DaDuyet'
 *  - Tất cả con TuChoi                → 'TuChoi'
 *  - Tất cả con DaChuanBi (hoặc DaChuanBi + DaDuyet/DangMuon/DaTra)
 *                                     → 'DaChuanBi' (chỉ cần 1 dòng còn ở DaChuanBi là cha cũng DaChuanBi)
 *  - Trộn Duyệt + Từ chối             → 'DaDuyetMotPhan'
 */
function deriveParentStatus(childStatuses) {
  if (childStatuses.length === 0) return "ChoDuyet";
  const approved = ["DaDuyet", "DangMuon", "DaTra"];
  if (childStatuses.some((s) => s === "ChoDuyet")) return "ChoDuyet";
  const allApproved = childStatuses.every((s) => approved.includes(s));
  const allRejected = childStatuses.every((s) => s === "TuChoi");
  if (allApproved) return "DaDuyet";
  if (allRejected) return "TuChoi";
  // DaChuanBi nuốt phần còn lại nếu trộn DaChuanBi với approved (chưa có TuChoi)
  const noReject = childStatuses.every((s) => s !== "TuChoi");
  if (noReject && childStatuses.some((s) => s === "DaChuanBi"))
    return "DaChuanBi";
  return "DaDuyetMotPhan";
}

// 1) Danh sách phiếu tuần cho Admin (có filter)
const listForAdmin = async (req, res) => {
  try {
    const { trangthai, tuan, magv, namhoc } = req.query;
    const conds = [];
    const params = [];

    if (trangthai) {
      params.push(trangthai);
      conds.push(`pt.TrangThai = $${params.length}`);
    }
    if (tuan) {
      params.push(parseInt(tuan, 10));
      conds.push(`pt.TuanSo = $${params.length}`);
    }
    if (magv) {
      params.push(magv);
      conds.push(`pt.MaGV = $${params.length}`);
    }
    if (namhoc) {
      params.push(namhoc);
      conds.push(`pt.NamHoc = $${params.length}`);
    }

    const where = conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";
    const query = `
            SELECT
                pt.MaPhieuTuan as maphieutuan,
                pt.MaGV as magv,
                gv.TenGV as tengv,
                pt.NamHoc as namhoc,
                pt.TuanSo as tuanso,
                pt.ThangSo as thangso,
                pt.NgayBatDauTuan as ngaybatdautuan,
                pt.NgayKetThucTuan as ngayketthuctuan,
                pt.DanhSachMon as danhsachmon,
                pt.TrangThai as trangthai,
                pt.LyDoTuChoi as lydotuchoi,
                pt.NgayTao as ngaytao,
                pt.NgayDuyet as ngayduyet,
                COALESCE(child.so_dong, 0) as sodong,
                COALESCE(child.so_thiet_bi, 0) as sothietbi
            FROM PHIEU_TUAN pt
            JOIN GIAO_VIEN gv ON pt.MaGV = gv.MaGV
            LEFT JOIN (
                SELECT pm.MaPhieuTuan,
                       COUNT(DISTINCT pm.MaPhieu) as so_dong,
                       COALESCE(SUM(ct.SoLuongDK), 0) as so_thiet_bi
                FROM PHIEU_MUON pm
                LEFT JOIN CHI_TIET_PHIEU ct ON ct.MaPhieu = pm.MaPhieu
                WHERE pm.MaPhieuTuan IS NOT NULL
                GROUP BY pm.MaPhieuTuan
            ) child ON child.MaPhieuTuan = pt.MaPhieuTuan
            ${where}
            ORDER BY pt.NgayTao DESC
        `;
    const r = await pool.query(query, params);
    res.status(200).json(r.rows);
  } catch (err) {
    console.error("Lỗi listForAdmin:", err);
    res.status(500).json({ msg: "Lỗi lấy danh sách phiếu tuần." });
  }
};

// 2) Danh sách phiếu tuần cho Giáo viên
const listForTeacher = async (req, res) => {
  try {
    const { maGV } = req.params;
    const r = await pool.query(
      `
            SELECT
                pt.MaPhieuTuan as maphieutuan,
                pt.NamHoc as namhoc,
                pt.TuanSo as tuanso,
                pt.ThangSo as thangso,
                pt.NgayBatDauTuan as ngaybatdautuan,
                pt.NgayKetThucTuan as ngayketthuctuan,
                pt.DanhSachMon as danhsachmon,
                pt.TrangThai as trangthai,
                pt.LyDoTuChoi as lydotuchoi,
                pt.NgayTao as ngaytao,
                pt.NgayDuyet as ngayduyet,
                COALESCE(child.so_dong, 0) as sodong
            FROM PHIEU_TUAN pt
            LEFT JOIN (
                SELECT MaPhieuTuan, COUNT(*) as so_dong
                FROM PHIEU_MUON WHERE MaPhieuTuan IS NOT NULL
                GROUP BY MaPhieuTuan
            ) child ON child.MaPhieuTuan = pt.MaPhieuTuan
            WHERE pt.MaGV = $1
            ORDER BY pt.NgayTao DESC
        `,
      [maGV],
    );
    res.status(200).json(r.rows);
  } catch (err) {
    console.error("Lỗi listForTeacher:", err);
    res.status(500).json({ msg: "Lỗi lấy lịch sử phiếu tuần." });
  }
};

// 3) Chi tiết 1 phiếu tuần (header + danh sách dòng)
const getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const headRes = await pool.query(
      `
            SELECT
                pt.MaPhieuTuan as maphieutuan,
                pt.MaGV as magv,
                gv.TenGV as tengv,
                pt.NamHoc as namhoc,
                pt.TuanSo as tuanso,
                pt.ThangSo as thangso,
                pt.NgayBatDauTuan as ngaybatdautuan,
                pt.NgayKetThucTuan as ngayketthuctuan,
                pt.DanhSachMon as danhsachmon,
                pt.TrangThai as trangthai,
                pt.LyDoTuChoi as lydotuchoi,
                pt.NguoiDuyet as nguoiduyet,
                pt.NgayTao as ngaytao,
                pt.NgayDuyet as ngayduyet
            FROM PHIEU_TUAN pt
            JOIN GIAO_VIEN gv ON pt.MaGV = gv.MaGV
            WHERE pt.MaPhieuTuan = $1
        `,
      [id],
    );

    if (headRes.rows.length === 0) {
      return res.status(404).json({ msg: "Không tìm thấy phiếu tuần." });
    }

    // Mỗi (PhieuMuon × ThietBi) là 1 dòng để hiển thị giống template Excel
    const rowsRes = await pool.query(
      `
            SELECT
                pm.MaPhieu as maphieu,
                pm.TrangThai as trangthaicon,
                pm.LyDoTuChoi as lydocon,
                tkb.NgayHoc as ngayhoc,
                tkb.TietHoc as tiethoc,
                lh.MaLop as malop,
                mh.TenMon as tenmon,
                COALESCE(pm.TenBaiHoc, ppct.TenBaiHoc) as tenbaihoc,
                pm.GhiChuDieuChinh as ghichudieuchinh,
                ct.MaLoaiTB as maloaitb,
                ltb.TenLoai as tenloai,
                ltb.DonViTinh as donvitinh,
                ct.SoLuongDK as soluongdk
            FROM PHIEU_MUON pm
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            LEFT JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.MaPPCT = ppct.MaPPCT
            LEFT JOIN CHI_TIET_PHIEU ct ON ct.MaPhieu = pm.MaPhieu
            LEFT JOIN LOAI_THIET_BI ltb ON ct.MaLoaiTB = ltb.MaLoaiTB
            WHERE pm.MaPhieuTuan = $1
            ORDER BY tkb.NgayHoc, tkb.TietHoc, ltb.TenLoai
        `,
      [id],
    );

    // Ngày trả mặc định = cùng ngày học (in template thường giống nhau)
    const rows = rowsRes.rows.map((r) => ({
      ...r,
      ngaytra: r.ngayhoc,
    }));

    res.status(200).json({ phieu: headRes.rows[0], rows });
  } catch (err) {
    console.error("Lỗi getDetail:", err);
    res.status(500).json({ msg: "Lỗi lấy chi tiết phiếu tuần." });
  }
};

// 4) Duyệt cả phiếu (cascade xuống PHIEU_MUON con)
const approveAll = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { nguoiDuyet } = req.body || {};

    await client.query("BEGIN");

    const head = await client.query(
      "SELECT MaPhieuTuan FROM PHIEU_TUAN WHERE MaPhieuTuan = $1",
      [id],
    );
    if (head.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy phiếu tuần." });
    }

    await client.query(
      `
            UPDATE PHIEU_MUON
            SET TrangThai = 'DaDuyet', LyDoTuChoi = NULL
            WHERE MaPhieuTuan = $1 AND TrangThai NOT IN ('DangMuon', 'DaTra')
        `,
      [id],
    );

    await client.query(
      `
            UPDATE PHIEU_TUAN
            SET TrangThai = 'DaDuyet',
                LyDoTuChoi = NULL,
                NguoiDuyet = $2,
                NgayDuyet = NOW()
            WHERE MaPhieuTuan = $1
        `,
      [id, nguoiDuyet || null],
    );

    await client.query("COMMIT");
    res.status(200).json({ msg: "Đã duyệt cả phiếu tuần thành công!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi approveAll:", err);
    res.status(500).json({ msg: "Lỗi duyệt phiếu tuần." });
  } finally {
    client.release();
  }
};

// 5) Từ chối cả phiếu (cần lý do)
const rejectAll = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { lydo, nguoiDuyet } = req.body || {};
    if (!lydo || !lydo.trim()) {
      return res.status(400).json({ msg: "Vui lòng nhập lý do từ chối." });
    }

    await client.query("BEGIN");

    const head = await client.query(
      "SELECT MaPhieuTuan FROM PHIEU_TUAN WHERE MaPhieuTuan = $1",
      [id],
    );
    if (head.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy phiếu tuần." });
    }

    await client.query(
      `
            UPDATE PHIEU_MUON
            SET TrangThai = 'TuChoi', LyDoTuChoi = $2
            WHERE MaPhieuTuan = $1 AND TrangThai NOT IN ('DangMuon', 'DaTra')
        `,
      [id, lydo],
    );

    await client.query(
      `
            UPDATE PHIEU_TUAN
            SET TrangThai = 'TuChoi',
                LyDoTuChoi = $2,
                NguoiDuyet = $3,
                NgayDuyet = NOW()
            WHERE MaPhieuTuan = $1
        `,
      [id, lydo, nguoiDuyet || null],
    );

    await client.query("COMMIT");
    res.status(200).json({ msg: "Đã từ chối cả phiếu tuần." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi rejectAll:", err);
    res.status(500).json({ msg: "Lỗi từ chối phiếu tuần." });
  } finally {
    client.release();
  }
};

// 6) Cập nhật từng dòng (PHIEU_MUON con) trong phiếu tuần
//    body = { updates: [{ maPhieu, trangthai, lydo? }], nguoiDuyet? }
const updateRows = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { updates, nguoiDuyet } = req.body || {};
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ msg: "Danh sách cập nhật rỗng." });
    }

    await client.query("BEGIN");

    const head = await client.query(
      "SELECT MaPhieuTuan FROM PHIEU_TUAN WHERE MaPhieuTuan = $1",
      [id],
    );
    if (head.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy phiếu tuần." });
    }

    for (const u of updates) {
      if (!u.maPhieu || !u.trangthai) continue;
      if (!["DaDuyet", "DaChuanBi", "TuChoi", "ChoDuyet"].includes(u.trangthai))
        continue;
      if (u.trangthai === "TuChoi" && (!u.lydo || !u.lydo.trim())) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ msg: `Phiếu ${u.maPhieu}: phải có lý do từ chối.` });
      }

      await client.query(
        `
                UPDATE PHIEU_MUON
                SET TrangThai = $1, LyDoTuChoi = $2
                WHERE MaPhieu = $3 AND MaPhieuTuan = $4
                  AND TrangThai NOT IN ('DangMuon', 'DaTra')
            `,
        [u.trangthai, u.trangthai === "TuChoi" ? u.lydo : null, u.maPhieu, id],
      );
    }

    // Tính lại trạng thái phiếu cha
    const childRes = await client.query(
      "SELECT TrangThai FROM PHIEU_MUON WHERE MaPhieuTuan = $1",
      [id],
    );
    const parentStatus = deriveParentStatus(
      childRes.rows.map((r) => r.trangthai),
    );

    // Tổng hợp lý do (nếu có) cho parent khi TuChoi/DaDuyetMotPhan
    let lyDoParent = null;
    if (parentStatus === "TuChoi") {
      const r = await client.query(
        `
                SELECT DISTINCT LyDoTuChoi as lydo FROM PHIEU_MUON
                WHERE MaPhieuTuan = $1 AND LyDoTuChoi IS NOT NULL
            `,
        [id],
      );
      lyDoParent = r.rows.map((x) => x.lydo).join(" | ") || null;
    }

    // Tính sẵn timestamp ở JS để tránh tham chiếu $1 hai chỗ với kiểu khác nhau
    // (Postgres báo "inconsistent types deduced" nếu $1 vừa gán vào varchar vừa so sánh với text literal).
    const setNgayDuyet = ["DaDuyet", "TuChoi", "DaDuyetMotPhan"].includes(
      parentStatus,
    );
    await client.query(
      `
            UPDATE PHIEU_TUAN
            SET TrangThai = $1::varchar,
                LyDoTuChoi = $2,
                NguoiDuyet = COALESCE($3, NguoiDuyet),
                NgayDuyet = ${setNgayDuyet ? "NOW()" : "NgayDuyet"}
            WHERE MaPhieuTuan = $4
        `,
      [parentStatus, lyDoParent, nguoiDuyet || null, id],
    );

    await client.query("COMMIT");
    res.status(200).json({
      msg: "Đã cập nhật từng dòng. Trạng thái phiếu tuần: " + parentStatus,
      trangThai: parentStatus,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi updateRows:", err);
    res.status(500).json({ msg: "Lỗi cập nhật từng dòng." });
  } finally {
    client.release();
  }
};

// 7) Đánh dấu phiếu tuần "đã chuẩn bị thiết bị" (Phase 3)
//    Chuyển trạng thái cha + các con CHƯA bị TuChoi/DangMuon/DaTra sang 'DaChuanBi'.
//    Không khoá phiếu — admin vẫn có thể duyệt cuối hoặc từ chối sau bước này.
const markPrepared = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { nguoiCB } = req.body || {};

    await client.query("BEGIN");

    const head = await client.query(
      "SELECT MaPhieuTuan, TrangThai FROM PHIEU_TUAN WHERE MaPhieuTuan = $1",
      [id],
    );
    if (head.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy phiếu tuần." });
    }
    if (["TuChoi", "DaTra"].includes(head.rows[0].trangthai)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        msg: `Phiếu tuần đang ở trạng thái '${head.rows[0].trangthai}', không thể đánh dấu chuẩn bị.`,
      });
    }

    // Cập nhật các phiếu con: chỉ động vào những dòng còn ChoDuyet (chưa quyết định gì)
    await client.query(
      `
            UPDATE PHIEU_MUON
            SET TrangThai = 'DaChuanBi'
            WHERE MaPhieuTuan = $1 AND TrangThai = 'ChoDuyet'
        `,
      [id],
    );

    await client.query(
      `
            UPDATE PHIEU_TUAN
            SET TrangThai     = 'DaChuanBi',
                NgayChuanBi   = NOW(),
                NguoiChuanBi  = COALESCE($2, NguoiChuanBi)
            WHERE MaPhieuTuan = $1
        `,
      [id, nguoiCB || null],
    );

    await client.query("COMMIT");
    res
      .status(200)
      .json({ msg: "✅ Đã đánh dấu phiếu tuần là Đã chuẩn bị thiết bị." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi markPrepared:", err);
    res.status(500).json({ msg: "Lỗi đánh dấu chuẩn bị phiếu tuần." });
  } finally {
    client.release();
  }
};

module.exports = {
  listForAdmin,
  listForTeacher,
  getDetail,
  approveAll,
  rejectAll,
  updateRows,
  markPrepared,
  TRANG_THAI_PHIEU,
};
