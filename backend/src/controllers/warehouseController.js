const { pool } = require("../config/db");
const QRCode = require("qrcode");

// =====================================================
// 1) CẢNH BÁO XUNG ĐỘT (CONFLICT DETECTION)
// =====================================================
//
// Body: { plans: [{ matkb, items: [{ maloaitb, soluong }] }, ...], excludeMaPhieuTuan? }
// Trả về: { conflicts: [...], hasConflict: bool }
const checkConflict = async (req, res) => {
  try {
    const { plans = [], excludeMaPhieuTuan = null } = req.body;
    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(200).json({ hasConflict: false, conflicts: [] });
    }

    const matkbList = plans.map((p) => p.matkb).filter(Boolean);
    if (matkbList.length === 0) {
      return res.status(200).json({ hasConflict: false, conflicts: [] });
    }

    const tkbInfoRes = await pool.query(
      `
            SELECT tkb.MaTKB as matkb, tkb.NgayHoc as ngayhoc, tkb.TietHoc as tiethoc,
                   mh.TenMon as tenmon, lh.MaLop as malop
            FROM THOI_KHOA_BIEU tkb
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            WHERE tkb.MaTKB = ANY($1)
        `,
      [matkbList],
    );
    const tkbMap = new Map(tkbInfoRes.rows.map((r) => [String(r.matkb), r]));

    const conflicts = [];

    for (const plan of plans) {
      const tkbInfo = tkbMap.get(String(plan.matkb));
      if (!tkbInfo || !plan.items || plan.items.length === 0) continue;
      const { ngayhoc, tiethoc, tenmon, malop } = tkbInfo;

      for (const item of plan.items) {
        if (!item.maloaitb || !item.soluong) continue;

        const tbRes = await pool.query(
          `SELECT TenLoai, TongTonKho, SoLuongTot, SoLuongHong, SoLuongMat
                     FROM LOAI_THIET_BI WHERE MaLoaiTB = $1`,
          [item.maloaitb],
        );
        if (tbRes.rows.length === 0) continue;
        const { tenloai, tongtonkho, soluongtot } = tbRes.rows[0];
        const usableStock = Math.max(parseInt(soluongtot, 10) || 0, 0);

        // Tính lượng đã giữ chỗ trong cùng tiết, loại trừ phiếu tuần đang chỉnh sửa
        const usedQuery = `
                    SELECT COALESCE(SUM(ct.SoLuongDK), 0) as used,
                           STRING_AGG(DISTINCT gv.TenGV, ', ') as nguoidagiu
                    FROM CHI_TIET_PHIEU ct
                    JOIN PHIEU_MUON pm ON ct.MaPhieu = pm.MaPhieu
                    JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
                    JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
                    WHERE ct.MaLoaiTB = $1
                      AND tkb.NgayHoc = $2 AND tkb.TietHoc = $3
                      AND pm.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DangMuon')
                      AND ($4::varchar IS NULL OR pm.MaPhieuTuan IS NULL OR pm.MaPhieuTuan <> $4)
                `;
        const usedRes = await pool.query(usedQuery, [
          item.maloaitb,
          ngayhoc,
          tiethoc,
          excludeMaPhieuTuan,
        ]);

        const used = parseInt(usedRes.rows[0].used, 10) || 0;
        const available = usableStock - used;

        if (item.soluong > available) {
          conflicts.push({
            matkb: plan.matkb,
            ngayhoc,
            tiethoc,
            tenmon,
            malop,
            maloaitb: item.maloaitb,
            tenloai,
            yeucau: item.soluong,
            conlai: Math.max(available, 0),
            tongtonkho: parseInt(tongtonkho, 10) || 0,
            soluongtot: usableStock,
            nguoidagiu: usedRes.rows[0].nguoidagiu || "",
          });
        }
      }
    }

    res.status(200).json({ hasConflict: conflicts.length > 0, conflicts });
  } catch (err) {
    console.error("Lỗi checkConflict:", err);
    res.status(500).json({ msg: "Lỗi kiểm tra xung đột" });
  }
};

// =====================================================
// 2) NHẬN TRẢ CHI TIẾT (TỐT / HỎNG / MẤT)
// =====================================================
//
// PUT /api/warehouse/return-detail/:maPhieu
// Body: {
//   nguoiNhan, ghiChu,
//   items: [{ maloaitb, soluongtra, soluonghong, soluongmat, ghichu }]
// }
const returnEquipmentDetailed = async (req, res) => {
  const client = await pool.connect();
  try {
    const { maPhieu } = req.params;
    const { items = [], nguoiNhan = null, ghiChu = "" } = req.body;

    await client.query("BEGIN");

    // 1. Lấy chi tiết phiếu hiện tại
    const phieuRes = await client.query(
      "SELECT MaPhieu, TrangThai FROM PHIEU_MUON WHERE MaPhieu = $1",
      [maPhieu],
    );
    if (phieuRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy phiếu" });
    }
    if (!["DaDuyet", "DangMuon"].includes(phieuRes.rows[0].trangthai)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        msg: `Phiếu đang ở trạng thái "${phieuRes.rows[0].trangthai}", không thể nhận trả.`,
      });
    }

    const ctRes = await client.query(
      `SELECT ct.MaLoaiTB, ct.SoLuongDK, ltb.TenLoai
             FROM CHI_TIET_PHIEU ct
             JOIN LOAI_THIET_BI ltb ON ct.MaLoaiTB = ltb.MaLoaiTB
             WHERE ct.MaPhieu = $1`,
      [maPhieu],
    );
    const dkMap = new Map(ctRes.rows.map((r) => [r.maloaitb, r]));

    let totalHong = 0,
      totalMat = 0;

    // 2. Cập nhật từng dòng chi tiết + log lịch sử + cộng/trừ kho
    for (const it of items) {
      const dk = dkMap.get(it.maloaitb);
      if (!dk) continue;

      const dkSL = parseInt(dk.soluongdk, 10);
      const tra = parseInt(it.soluongtra, 10) || 0;
      const hong = parseInt(it.soluonghong, 10) || 0;
      const mat = parseInt(it.soluongmat, 10) || 0;

      if (tra + hong + mat !== dkSL) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          msg: `Tổng "${dk.tenloai}" (${tra + hong + mat}) phải bằng số mượn (${dkSL}).`,
        });
      }

      await client.query(
        `UPDATE CHI_TIET_PHIEU
                 SET SoLuongTra = $1, SoLuongHong = $2, SoLuongMat = $3, GhiChuTra = $4
                 WHERE MaPhieu = $5 AND MaLoaiTB = $6`,
        [tra, hong, mat, it.ghichu || null, maPhieu, it.maloaitb],
      );

      // Hỏng → SoLuongTot giảm, SoLuongHong tăng
      if (hong > 0) {
        await client.query(
          `UPDATE LOAI_THIET_BI
                     SET SoLuongTot  = GREATEST(SoLuongTot - $1, 0),
                         SoLuongHong = SoLuongHong + $1
                     WHERE MaLoaiTB = $2`,
          [hong, it.maloaitb],
        );
        await client.query(
          `INSERT INTO LICH_SU_HAO_MON (MaLoaiTB, MaPhieu, LoaiSuKien, SoLuong, NguoiThucHien, GhiChu)
                     VALUES ($1, $2, 'Hong', $3, $4, $5)`,
          [it.maloaitb, maPhieu, hong, nguoiNhan, it.ghichu || null],
        );
      }

      // Mất → SoLuongTot giảm, SoLuongMat tăng, TongTonKho giảm
      if (mat > 0) {
        await client.query(
          `UPDATE LOAI_THIET_BI
                     SET SoLuongTot   = GREATEST(SoLuongTot - $1, 0),
                         SoLuongMat   = SoLuongMat + $1,
                         TongTonKho   = GREATEST(TongTonKho - $1, 0)
                     WHERE MaLoaiTB = $2`,
          [mat, it.maloaitb],
        );
        await client.query(
          `INSERT INTO LICH_SU_HAO_MON (MaLoaiTB, MaPhieu, LoaiSuKien, SoLuong, NguoiThucHien, GhiChu)
                     VALUES ($1, $2, 'Mat', $3, $4, $5)`,
          [it.maloaitb, maPhieu, mat, nguoiNhan, it.ghichu || null],
        );
      }

      totalHong += hong;
      totalMat += mat;
    }

    // 3. Cập nhật phiếu mượn
    let tinhTrang = "BinhThuong";
    if (totalHong > 0 && totalMat > 0) tinhTrang = "HongVaMat";
    else if (totalHong > 0) tinhTrang = "HongMotPhan";
    else if (totalMat > 0) tinhTrang = "MatMotPhan";

    await client.query(
      `UPDATE PHIEU_MUON
             SET TrangThai = 'DaTra',
                 TinhTrangPhieu = $1,
                 NgayTra = NOW(),
                 GhiChuTra = $2
             WHERE MaPhieu = $3`,
      [tinhTrang, ghiChu || null, maPhieu],
    );

    await client.query("COMMIT");
    res.status(200).json({
      msg:
        `Đã nhận trả phiếu ${maPhieu}.` +
        (totalHong > 0 ? ` ${totalHong} đồ hỏng.` : "") +
        (totalMat > 0 ? ` ${totalMat} đồ mất.` : ""),
      tinhTrang,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi return-detail:", err);
    res.status(500).json({ msg: "Lỗi nhận trả thiết bị" });
  } finally {
    client.release();
  }
};

// =====================================================
// 3) THỐNG KÊ & LỊCH SỬ HAO MÒN
// =====================================================
//
// GET /api/warehouse/condition-summary
// Trả về danh sách thiết bị + tổng tốt/hỏng/mất
const getConditionSummary = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT
                ltb.MaLoaiTB, ltb.TenLoai, ltb.DonViTinh, ltb.HinhAnh,
                ltb.TongTonKho, ltb.SoLuongTot, ltb.SoLuongHong, ltb.SoLuongMat,
                ltb.MaQR, ltb.ViTriKho,
                COALESCE((
                    SELECT SUM(ct.SoLuongDK)
                    FROM CHI_TIET_PHIEU ct
                    JOIN PHIEU_MUON pm ON ct.MaPhieu = pm.MaPhieu
                    WHERE ct.MaLoaiTB = ltb.MaLoaiTB
                      AND pm.TrangThai = 'DangMuon'
                ), 0) AS dangmuon
            FROM LOAI_THIET_BI ltb
            ORDER BY ltb.SoLuongHong DESC, ltb.SoLuongMat DESC, ltb.TenLoai
        `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi conditionSummary:", err);
    res.status(500).json({ msg: "Lỗi lấy báo cáo tình trạng" });
  }
};

// GET /api/warehouse/damage-history/:maLoaiTB?
const getDamageHistory = async (req, res) => {
  try {
    const { maLoaiTB } = req.params;
    const params = [];
    let where = "";
    if (maLoaiTB && maLoaiTB !== "all") {
      params.push(maLoaiTB);
      where = "WHERE ls.MaLoaiTB = $1";
    }
    const result = await pool.query(
      `
            SELECT
                ls.Id, ls.MaLoaiTB, ltb.TenLoai,
                ls.MaPhieu, ls.LoaiSuKien, ls.SoLuong,
                ls.NguoiThucHien, ls.GhiChu, ls.NgayTao,
                gv.TenGV
            FROM LICH_SU_HAO_MON ls
            JOIN LOAI_THIET_BI ltb ON ls.MaLoaiTB = ltb.MaLoaiTB
            LEFT JOIN GIAO_VIEN gv ON ls.NguoiThucHien = gv.MaGV
            ${where}
            ORDER BY ls.NgayTao DESC
            LIMIT 200
        `,
      params,
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi damageHistory:", err);
    res.status(500).json({ msg: "Lỗi lấy lịch sử hao mòn" });
  }
};

// GET /api/warehouse/borrow-detail/:maPhieu
// Lấy chi tiết phiếu để hiện form Nhận trả
const getReturnFormData = async (req, res) => {
  try {
    const { maPhieu } = req.params;
    const phieuRes = await pool.query(
      `
            SELECT pm.MaPhieu, pm.TrangThai, pm.NgayTao, pm.TinhTrangPhieu, pm.NgayTra,
                   gv.TenGV, gv.MaGV,
                   tkb.NgayHoc, tkb.TietHoc, lh.MaLop, mh.TenMon
            FROM PHIEU_MUON pm
            JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            WHERE pm.MaPhieu = $1
        `,
      [maPhieu],
    );

    if (phieuRes.rows.length === 0) {
      return res.status(404).json({ msg: "Không tìm thấy phiếu" });
    }

    const itemsRes = await pool.query(
      `
            SELECT ct.MaLoaiTB, ltb.TenLoai, ltb.DonViTinh, ltb.HinhAnh, ltb.MaQR,
                   ct.SoLuongDK, ct.SoLuongTra, ct.SoLuongHong, ct.SoLuongMat, ct.GhiChuTra
            FROM CHI_TIET_PHIEU ct
            JOIN LOAI_THIET_BI ltb ON ct.MaLoaiTB = ltb.MaLoaiTB
            WHERE ct.MaPhieu = $1
        `,
      [maPhieu],
    );

    res.status(200).json({ phieu: phieuRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error("Lỗi getReturnFormData:", err);
    res.status(500).json({ msg: "Lỗi lấy chi tiết phiếu" });
  }
};

// =====================================================
// 4) QR CODE
// =====================================================
//
// GET /api/warehouse/qr/:type/:code  (type = 'tb' | 'phieu')
// Trả về PNG QR code (image/png) chứa payload "TBQR-xxx" hoặc "PMQR-xxx"
const generateQR = async (req, res) => {
  try {
    const { type, code } = req.params;
    const { size = 300 } = req.query;

    let payload = code;
    if (type === "tb")
      payload = code.startsWith("TBQR-") ? code : `TBQR-${code}`;
    else if (type === "phieu") payload = `PMQR-${code}`;

    const buffer = await QRCode.toBuffer(payload, {
      type: "png",
      width: parseInt(size, 10),
      margin: 1,
      errorCorrectionLevel: "M",
    });
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (err) {
    console.error("Lỗi generateQR:", err);
    res.status(500).json({ msg: "Lỗi sinh QR" });
  }
};

// POST /api/warehouse/scan
// Body: { qrPayload, action } — action: 'inspect' | 'giao' | 'nhan'
//   - inspect: chỉ trả về thông tin (thiết bị hoặc phiếu)
//   - giao   : chuyển phiếu DaDuyet → DangMuon
//   - nhan   : chuyển phiếu DangMuon → DaTra (KHÔNG chi tiết tình trạng, dùng cho trường hợp đơn giản)
const scanQRAction = async (req, res) => {
  try {
    const { qrPayload, action = "inspect" } = req.body;
    if (!qrPayload) return res.status(400).json({ msg: "Thiếu QR payload" });

    // Thiết bị
    if (qrPayload.startsWith("TBQR-")) {
      const r = await pool.query(
        `SELECT MaLoaiTB, TenLoai, DonViTinh, TongTonKho,
                        SoLuongTot, SoLuongHong, SoLuongMat, HinhAnh, ViTriKho
                 FROM LOAI_THIET_BI WHERE MaQR = $1`,
        [qrPayload],
      );
      if (r.rows.length === 0)
        return res.status(404).json({ msg: "Không tìm thấy thiết bị" });
      return res.status(200).json({ kind: "thietbi", data: r.rows[0] });
    }

    // Phiếu mượn
    if (qrPayload.startsWith("PMQR-")) {
      const maPhieu = qrPayload.replace("PMQR-", "");
      const r = await pool.query(
        `
                SELECT pm.MaPhieu, pm.TrangThai, pm.NgayTao,
                       gv.TenGV, tkb.NgayHoc, tkb.TietHoc, lh.MaLop, mh.TenMon
                FROM PHIEU_MUON pm
                JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
                JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
                JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
                JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
                WHERE pm.MaPhieu = $1
            `,
        [maPhieu],
      );
      if (r.rows.length === 0)
        return res.status(404).json({ msg: "Không tìm thấy phiếu" });

      const phieu = r.rows[0];

      if (action === "giao") {
        if (phieu.trangthai !== "DaDuyet") {
          return res
            .status(400)
            .json({
              msg: `Phiếu đang ở "${phieu.trangthai}", không thể giao.`,
            });
        }
        await pool.query(
          `UPDATE PHIEU_MUON SET TrangThai = 'DangMuon' WHERE MaPhieu = $1`,
          [maPhieu],
        );
        phieu.trangthai = "DangMuon";
        return res
          .status(200)
          .json({
            kind: "phieu",
            action: "giao",
            data: phieu,
            msg: "Đã giao đồ.",
          });
      }

      if (action === "nhan") {
        if (phieu.trangthai !== "DangMuon") {
          return res
            .status(400)
            .json({
              msg: `Phiếu đang ở "${phieu.trangthai}", không thể nhận.`,
            });
        }
        await pool.query(
          `
                    UPDATE PHIEU_MUON SET TrangThai = 'DaTra', NgayTra = NOW() WHERE MaPhieu = $1
                `,
          [maPhieu],
        );
        phieu.trangthai = "DaTra";
        return res
          .status(200)
          .json({
            kind: "phieu",
            action: "nhan",
            data: phieu,
            msg: "Đã nhận lại.",
          });
      }

      return res.status(200).json({ kind: "phieu", data: phieu });
    }

    res.status(400).json({ msg: "QR không hợp lệ" });
  } catch (err) {
    console.error("Lỗi scanQRAction:", err);
    res.status(500).json({ msg: "Lỗi xử lý quét QR" });
  }
};

// PUT /api/warehouse/equipment/:id/condition
// Body: { soluongtot, soluonghong, soluongmat, vitri, ghichu, nguoiThucHien }
// Cho phép admin tự điều chỉnh tình trạng (kiểm kê thủ công).
const adjustEquipmentCondition = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      soluongtot,
      soluonghong,
      soluongmat,
      vitri = null,
      ghichu = "",
      nguoiThucHien = null,
    } = req.body;

    await client.query("BEGIN");

    const cur = await client.query(
      `SELECT TenLoai, TongTonKho, SoLuongTot, SoLuongHong, SoLuongMat
             FROM LOAI_THIET_BI WHERE MaLoaiTB = $1`,
      [id],
    );
    if (cur.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ msg: "Không tìm thấy thiết bị" });
    }
    const old = cur.rows[0];

    const tot = parseInt(soluongtot, 10) || 0;
    const hong = parseInt(soluonghong, 10) || 0;
    const mat = parseInt(soluongmat, 10) || 0;
    const tongMoi = tot + hong;

    await client.query(
      `UPDATE LOAI_THIET_BI
             SET SoLuongTot = $1, SoLuongHong = $2, SoLuongMat = $3,
                 ViTriKho = COALESCE($4, ViTriKho),
                 TongTonKho = $5
             WHERE MaLoaiTB = $6`,
      [tot, hong, mat, vitri, tongMoi, id],
    );

    const deltaHong = hong - (parseInt(old.soluonghong, 10) || 0);
    const deltaMat = mat - (parseInt(old.soluongmat, 10) || 0);

    if (deltaHong !== 0) {
      await client.query(
        `INSERT INTO LICH_SU_HAO_MON (MaLoaiTB, LoaiSuKien, SoLuong, NguoiThucHien, GhiChu)
                 VALUES ($1, 'KiemKeHong', $2, $3, $4)`,
        [
          id,
          Math.abs(deltaHong),
          nguoiThucHien,
          `(${deltaHong > 0 ? "+" : ""}${deltaHong}) ${ghichu}`,
        ],
      );
    }
    if (deltaMat !== 0) {
      await client.query(
        `INSERT INTO LICH_SU_HAO_MON (MaLoaiTB, LoaiSuKien, SoLuong, NguoiThucHien, GhiChu)
                 VALUES ($1, 'KiemKeMat', $2, $3, $4)`,
        [
          id,
          Math.abs(deltaMat),
          nguoiThucHien,
          `(${deltaMat > 0 ? "+" : ""}${deltaMat}) ${ghichu}`,
        ],
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ msg: "Đã cập nhật tình trạng thiết bị" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi adjustCondition:", err);
    res.status(500).json({ msg: "Lỗi cập nhật tình trạng" });
  } finally {
    client.release();
  }
};

module.exports = {
  checkConflict,
  returnEquipmentDetailed,
  getReturnFormData,
  getConditionSummary,
  getDamageHistory,
  generateQR,
  scanQRAction,
  adjustEquipmentCondition,
};
