const { pool } = require("../config/db");
const { getActiveSchoolYear, computeWeekInfo } = require("../utils/weekHelper");
const { emitToAdmins, emitToUser } = require("../utils/socket"); // [MỚI] Import Socket

// Chuyển mã trạng thái phiếu sang nhãn tiếng Việt để hiển thị/thông báo.
const TRANG_THAI_LABEL = {
  ChoDuyet: "Chờ duyệt",
  DaDuyet: "Đã duyệt",
  TuChoi: "Từ chối",
  DangMuon: "Đã giao đồ (đang mượn)",
  DaTra: "Đã trả",
};
const nhanTrangThai = (trangThai) => TRANG_THAI_LABEL[trangThai] || trangThai;

// 1. Tạo Phiếu Mượn (Giáo viên dùng)
const createLoanRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { maGV, maTKB, items } = req.body;

    await client.query("BEGIN");

    // --- 1. Lấy thông tin ngày học & tiết học từ MaTKB ---
    const tkbRes = await client.query(
      "SELECT NgayHoc, TietHoc FROM THOI_KHOA_BIEU WHERE MaTKB = $1",
      [maTKB],
    );
    if (tkbRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ msg: "Không tìm thấy thông tin tiết học." });
    }
    const { ngayhoc, tiethoc } = tkbRes.rows[0];

    // --- 2. Kiểm tra tồn kho ảo của từng thiết bị (dựa trên SoLuongTot) ---
    for (const item of items) {
      const tbRes = await client.query(
        "SELECT TenLoai, TongTonKho, SoLuongTot FROM LOAI_THIET_BI WHERE MaLoaiTB = $1 FOR UPDATE",
        [item.maLoaiTB],
      );
      if (tbRes.rows.length === 0) continue;

      const { tenloai, tongtonkho, soluongtot } = tbRes.rows[0];
      const usableStock = parseInt(soluongtot ?? tongtonkho, 10) || 0;

      const usedRes = await client.query(
        `
                SELECT COALESCE(SUM(ct.SoLuongDK), 0) as used
                FROM CHI_TIET_PHIEU ct
                JOIN PHIEU_MUON pm ON ct.MaPhieu = pm.MaPhieu
                JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
                WHERE ct.MaLoaiTB = $1
                  AND tkb.NgayHoc = $2
                  AND tkb.TietHoc = $3
                  AND pm.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DangMuon')
            `,
        [item.maLoaiTB, ngayhoc, tiethoc],
      );

      const used = parseInt(usedRes.rows[0].used, 10);
      const available = usableStock - used;

      if (item.soLuong > available) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          msg: `Trùng lịch mượn! "${tenloai}" đã được mượn vào tiết này (Còn lại: ${available > 0 ? available : 0}/${usableStock} cái dùng tốt).`,
        });
      }
    }

    const maPhieu = "PM" + Date.now();

    // Lưu vào bảng PHIEU_MUON
    const queryPhieu = `
            INSERT INTO PHIEU_MUON (MaPhieu, MaTKB, NguoiMuon, TrangThai, NgayTao)
            VALUES ($1, $2, $3, 'ChoDuyet', NOW())
            RETURNING MaPhieu
        `;
    await client.query(queryPhieu, [maPhieu, maTKB, maGV]);

    // Lưu vào bảng CHI_TIET_PHIEU
    const queryChiTiet = `
            INSERT INTO CHI_TIET_PHIEU (MaPhieu, MaLoaiTB, SoLuongDK)
            VALUES ($1, $2, $3)
        `;

    for (const item of items) {
      await client.query(queryChiTiet, [maPhieu, item.maLoaiTB, item.soLuong]);
    }

    await client.query("COMMIT");
    
    // [MỚI] Bắn thông báo tới Admin
    emitToAdmins("new_borrow_request", { 
      msg: "Có phiếu mượn lẻ mới từ giáo viên", 
      maPhieu: maPhieu, 
      maGV: maGV 
    });

    res.status(200).json({ msg: "Tạo phiếu thành công!", maPhieu: maPhieu });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi Tạo Phiếu:", err); // Log lỗi ra Terminal để dễ sửa
    res.status(500).json({ msg: "Lỗi hệ thống: Không tạo được phiếu" });
  } finally {
    client.release();
  }
};

// 2. Lấy danh sách chờ duyệt (Tổ trưởng dùng)
const getPendingRequests = async (req, res) => {
  try {
    // Lưu ý: Postgres trả về tên cột là chữ thường (maphieu, tengv...)
    const query = `
            SELECT 
                pm.MaPhieu,
                pm.NgayTao,
                gv.TenGV,
                mh.TenMon,
                tkb.NgayHoc,
                tkb.TietHoc,
                lh.MaLop
            FROM PHIEU_MUON pm
            JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            WHERE pm.TrangThai = 'ChoDuyet'
            ORDER BY pm.NgayTao DESC
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi Lấy Danh Sách:", err);
    res.status(500).send("Lỗi lấy danh sách chờ");
  }
};

// 3. Cập nhật trạng thái (Duyệt/Từ chối)
const updateStatus = async (req, res) => {
  try {
    const { maPhieu } = req.params;
    const { trangThai, lydo } = req.body; // 'DaDuyet' hoặc 'TuChoi'

    console.log(`Đang xử lý phiếu: ${maPhieu} -> Trạng thái: ${trangThai}`); // Log để kiểm tra

    const query = `
            UPDATE PHIEU_MUON 
            SET TrangThai = $1, LyDoTuChoi = $3
            WHERE MaPhieu = $2
            RETURNING NguoiMuon
        `;
    const result = await pool.query(query, [trangThai, maPhieu, lydo || null]);

    // [MỚI] Thông báo cho Giáo viên
    if (result.rows.length > 0) {
      const nguoiMuon = result.rows[0].nguoimuon;
      emitToUser(nguoiMuon, "borrow_status_changed", { 
        maPhieu, 
        trangThai,
        msg: `Phiếu mượn ${maPhieu} đã chuyển sang trạng thái: ${nhanTrangThai(trangThai)}`
      });
    }

    res.status(200).json({ msg: "Đã cập nhật trạng thái thành công!" });
  } catch (err) {
    console.error("Lỗi Cập Nhật:", err);
    res.status(500).send("Lỗi cập nhật trạng thái");
  }
};

// [MỚI] Duyệt/Từ chối hàng loạt
const bulkUpdateStatus = async (req, res) => {
  try {
    const { maPhieuList, trangThai, lydo } = req.body;
    if (
      !maPhieuList ||
      !Array.isArray(maPhieuList) ||
      maPhieuList.length === 0
    ) {
      return res.status(400).json({ msg: "Danh sách phiếu rỗng" });
    }

    const query = `
            UPDATE PHIEU_MUON 
            SET TrangThai = $1, LyDoTuChoi = $3
            WHERE MaPhieu = ANY($2)
            RETURNING NguoiMuon, MaPhieu
        `;
    // Chú ý: pg hỗ trợ mảng kiểu ANY($2) nếu tham số là mảng JS
    const result = await pool.query(query, [trangThai, maPhieuList, lydo || null]);

    // [MỚI] Thông báo cho các Giáo viên tương ứng
    result.rows.forEach(row => {
      emitToUser(row.nguoimuon, "borrow_status_changed", { 
        maPhieu: row.maphieu, 
        trangThai,
        msg: `Phiếu mượn ${row.maphieu} đã chuyển sang trạng thái: ${nhanTrangThai(trangThai)}`
      });
    });

    res
      .status(200)
      .json({ msg: `Đã xử lý thành công ${maPhieuList.length} phiếu!` });
  } catch (err) {
    console.error("Lỗi Bulk Cập Nhật:", err);
    res.status(500).send("Lỗi cập nhật hàng loạt");
  }
};

// --- [MỚI] 4. Lấy lịch sử mượn của Giáo viên ---
const getTeacherHistory = async (req, res) => {
  try {
    const { maGV } = req.params; // Lấy mã GV từ đường dẫn

    const query = `
            SELECT 
                pm.MaPhieu,
                pm.NgayTao,
                pm.TrangThai,
                pm.LyDoTuChoi,
                tkb.NgayHoc,
                tkb.TietHoc,
                mh.TenMon,
                lh.MaLop
            FROM PHIEU_MUON pm
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            WHERE pm.NguoiMuon = $1
            ORDER BY pm.NgayTao DESC
        `;
    const result = await pool.query(query, [maGV]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi Lịch sử:", err);
    res.status(500).send("Lỗi lấy lịch sử");
  }
};

// --- [MỚI] 5. Thống kê Top thiết bị mượn nhiều ---
const getTopDevices = async (req, res) => {
  try {
    const query = `
            SELECT 
                ltb.TenLoai, 
                SUM(ct.SoLuongDK) as TongMuon
            FROM CHI_TIET_PHIEU ct
            JOIN LOAI_THIET_BI ltb ON ct.MaLoaiTB = ltb.MaLoaiTB
            JOIN PHIEU_MUON pm ON ct.MaPhieu = pm.MaPhieu
            WHERE pm.TrangThai IN ('DaDuyet', 'DangMuon', 'DaTra')
            GROUP BY ltb.TenLoai
            ORDER BY TongMuon DESC
            LIMIT 5
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi Thống kê thiết bị:", err);
    res.status(500).send("Lỗi thống kê");
  }
};

const getTopTeachers = async (req, res) => {
  try {
    const query = `
            SELECT 
                gv.TenGV, 
                COUNT(DISTINCT pm.MaPhieu) as SoLuotMuon
            FROM PHIEU_MUON pm
            JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
            WHERE pm.TrangThai IN ('DaDuyet', 'DangMuon', 'DaTra')
            GROUP BY gv.TenGV
            ORDER BY SoLuotMuon DESC
            LIMIT 5
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi Thống kê giáo viên:", err);
    res.status(500).send("Lỗi thống kê");
  }
};

const getTopSubjects = async (req, res) => {
  try {
    const query = `
            SELECT 
                mh.TenMon, 
                COUNT(DISTINCT pm.MaPhieu) as SoLuotMuon
            FROM PHIEU_MUON pm
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            WHERE pm.TrangThai IN ('DaDuyet', 'DangMuon', 'DaTra')
            GROUP BY mh.TenMon
            ORDER BY SoLuotMuon DESC
            LIMIT 5
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi Thống kê môn học:", err);
    res.status(500).send("Lỗi thống kê");
  }
};

const getEquipmentStatus = async (req, res) => {
  try {
    const query = `
            SELECT 
                COALESCE(SUM(TongTonKho), 0) as TongThietBi,
                COALESCE(SUM(SoLuongTot), 0) as ThietBiTot,
                COALESCE(SUM(TongTonKho - COALESCE(SoLuongTot, TongTonKho)), 0) as ThietBiHong
            FROM LOAI_THIET_BI
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi Thống kê tình trạng:", err);
    res.status(500).send("Lỗi thống kê");
  }
};

// --- [MỚI] 6. Lấy danh sách nhiệm vụ của Kho (Đã duyệt & Đang mượn) ---
const getWarehouseTasks = async (req, res) => {
  try {
    const query = `
            SELECT 
                pm.MaPhieu, pm.NgayTao, pm.TrangThai,
                gv.TenGV, tkb.NgayHoc, tkb.TietHoc, lh.MaLop, mh.TenMon,
                (
                    SELECT string_agg(ltb.TenLoai || ' (x' || ct.SoLuongDK || ')', ', ')
                    FROM CHI_TIET_PHIEU ct
                    JOIN LOAI_THIET_BI ltb ON ct.MaLoaiTB = ltb.MaLoaiTB
                    WHERE ct.MaPhieu = pm.MaPhieu
                ) as DanhSachThietBi
            FROM PHIEU_MUON pm
            JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            WHERE pm.TrangThai IN ('DaDuyet', 'DangMuon')
            ORDER BY pm.NgayTao DESC, tkb.NgayHoc DESC, tkb.TietHoc DESC
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi Kho:", err);
    res.status(500).send("Lỗi lấy dữ liệu kho");
  }
};

// --- [MỚI] 7. Xử lý Trả đồ ---
const returnEquipment = async (req, res) => {
  try {
    const { maPhieu } = req.params;
    // Ở mức cơ bản, chúng ta cập nhật trạng thái thành Đã Trả
    // (Bạn có thể mở rộng logic cộng/trừ kho vào đây sau)
    const query = `UPDATE PHIEU_MUON SET TrangThai = 'DaTra' WHERE MaPhieu = $1 RETURNING NguoiMuon`;
    const result = await pool.query(query, [maPhieu]);

    if (result.rows.length > 0) {
      emitToUser(result.rows[0].nguoimuon, "borrow_returned", { 
        maPhieu, 
        msg: `Phòng thiết bị đã xác nhận thu hồi thiết bị của phiếu ${maPhieu}.` 
      });
    }

    res.status(200).json({ msg: "Đã nhận trả thiết bị thành công!" });
  } catch (err) {
    console.error("Lỗi Trả đồ:", err);
    res.status(500).send("Lỗi xử lý trả đồ");
  }
};

// --- [MỚI] 8. Lấy toàn bộ lịch sử để xuất Excel ---
const getAllHistoryForExport = async (req, res) => {
  try {
    const query = `
            SELECT 
                pm.MaPhieu,
                gv.TenGV,
                lh.MaLop,
                mh.TenMon,
                tkb.NgayHoc,
                tkb.TietHoc,
                pm.TrangThai,
                pm.NgayTao
            FROM PHIEU_MUON pm
            JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            ORDER BY pm.NgayTao DESC
        `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy dữ liệu Export:", err);
    res.status(500).send("Lỗi Server");
  }
};

// --- [MỚI] 9. Lấy chi tiết Phiếu để In Xuất ---
const getBorrowDetails = async (req, res) => {
  try {
    const { maPhieu } = req.params;

    // 1. Lấy thông tin chung của phiếu mượn
    const queryPhieu = `
            SELECT 
                pm.MaPhieu, pm.NgayTao, pm.TrangThai,
                gv.TenGV, tkb.NgayHoc, tkb.TietHoc,
                lh.MaLop, mh.TenMon, COALESCE(pm.TenBaiHoc, ppct.TenBaiHoc) AS TenBaiHoc,
                pm.GhiChuDieuChinh AS GhiChuDieuChinh
            FROM PHIEU_MUON pm
            JOIN GIAO_VIEN gv ON pm.NguoiMuon = gv.MaGV
            JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
            JOIN LOP_HOC lh ON tkb.MaLop = lh.MaLop
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            LEFT JOIN PHAN_PHOI_CHUONG_TRINH ppct ON tkb.MaPPCT = ppct.MaPPCT
            WHERE pm.MaPhieu = $1
        `;
    const resultPhieu = await pool.query(queryPhieu, [maPhieu]);

    if (resultPhieu.rows.length === 0) {
      return res.status(404).json({ msg: "Không tìm thấy phiếu" });
    }

    const phieu = resultPhieu.rows[0];

    // 2. Lấy danh sách thiết bị trong phiếu
    const queryChiTiet = `
            SELECT 
                ltb.TenLoai, ct.SoLuongDK, ltb.DonViTinh
            FROM CHI_TIET_PHIEU ct
            JOIN LOAI_THIET_BI ltb ON ct.MaLoaiTB = ltb.MaLoaiTB
            WHERE ct.MaPhieu = $1
        `;
    const resultChiTiet = await pool.query(queryChiTiet, [maPhieu]);

    res.status(200).json({
      phieu: phieu,
      items: resultChiTiet.rows,
    });
  } catch (err) {
    console.error("Lỗi Lấy Chi Tiết Phiếu In:", err);
    res.status(500).send("Lỗi Server");
  }
};

// ⚠️ CẬP NHẬT LẠI MODULE.EXPORTS (Đủ 9 hàm)

// 5. Nộp kế hoạch mượn thiết bị nguyên Tuần
//    - Tạo 1 row PHIEU_TUAN gom tất cả PHIEU_MUON của GV trong tuần đó
//    - Mỗi PHIEU_MUON con sẽ có MaPhieuTuan trỏ về header
//    - Chặn nếu (MaGV, NamHoc, TuanSo) đã có phiếu tuần ở trạng thái active
const submitWeeklyPlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const { maGV, weekPlans } = req.body;
    if (!maGV || !Array.isArray(weekPlans) || weekPlans.length === 0) {
      return res
        .status(400)
        .json({ msg: "Thiếu mã giáo viên hoặc danh sách tiết học." });
    }

    await client.query("BEGIN");

    // --- 1. Lấy thông tin tất cả MaTKB trước (ngày học, môn học) ---
    const matkbList = weekPlans.map((p) => p.matkb).filter(Boolean);
    if (matkbList.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "Danh sách tiết học rỗng." });
    }

    const tkbInfoRes = await client.query(
      `
            SELECT tkb.MaTKB as matkb, tkb.NgayHoc as ngayhoc, tkb.TietHoc as tiethoc,
                   mh.MaMon as mamon, mh.TenMon as tenmon
            FROM THOI_KHOA_BIEU tkb
            JOIN MON_HOC mh ON tkb.MaMon = mh.MaMon
            WHERE tkb.MaTKB = ANY($1)
        `,
      [matkbList],
    );
    const tkbMap = new Map(tkbInfoRes.rows.map((r) => [String(r.matkb), r]));
    if (tkbMap.size === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ msg: "Không tìm thấy thông tin tiết học hợp lệ." });
    }

    // --- 2. Xác định tuần học từ ngày sớm nhất ---
    const earliestDate = [...tkbMap.values()]
      .map((r) => new Date(r.ngayhoc))
      .sort((a, b) => a - b)[0];

    const schoolYear = await getActiveSchoolYear(client);
    if (!schoolYear) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .json({ msg: "Chưa cấu hình năm học. Liên hệ quản trị viên." });
    }
    const weekInfo = computeWeekInfo(earliestDate, schoolYear);

    // --- 3. Chặn trùng tuần ---
    const dupRes = await client.query(
      `
            SELECT MaPhieuTuan, TrangThai FROM PHIEU_TUAN
            WHERE MaGV = $1 AND NamHoc = $2 AND TuanSo = $3
              AND TrangThai IN ('ChoDuyet', 'DaDuyet', 'DaTra', 'DaDuyetMotPhan')
            LIMIT 1
        `,
      [maGV, weekInfo.namHoc, weekInfo.tuanSo],
    );
    if (dupRes.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        msg: `Tuần ${weekInfo.tuanSo} (${weekInfo.namHoc}) đã có phiếu ${dupRes.rows[0].trangthai}. Vui lòng chờ Admin xử lý hoặc liên hệ Admin nếu cần bổ sung.`,
      });
    }

    // --- 4. Conflict-check tồn kho từng item theo tiết ---
    for (const plan of weekPlans) {
      if (!plan.items || plan.items.length === 0) continue;
      const tkbInfo = tkbMap.get(String(plan.matkb));
      if (!tkbInfo) continue;
      const { ngayhoc, tiethoc } = tkbInfo;

      for (const item of plan.items) {
        const tbRes = await client.query(
          "SELECT TenLoai, TongTonKho, SoLuongTot FROM LOAI_THIET_BI WHERE MaLoaiTB = $1 FOR UPDATE",
          [item.maloaitb],
        );
        if (tbRes.rows.length === 0) continue;
        const { tenloai, tongtonkho, soluongtot } = tbRes.rows[0];
        const usableStock = parseInt(soluongtot ?? tongtonkho, 10) || 0;

        const usedRes = await client.query(
          `
                    SELECT COALESCE(SUM(ct.SoLuongDK), 0) as used
                    FROM CHI_TIET_PHIEU ct
                    JOIN PHIEU_MUON pm ON ct.MaPhieu = pm.MaPhieu
                    JOIN THOI_KHOA_BIEU tkb ON pm.MaTKB = tkb.MaTKB
                    WHERE ct.MaLoaiTB = $1 AND tkb.NgayHoc = $2 AND tkb.TietHoc = $3
                      AND pm.TrangThai IN ('ChoDuyet', 'DaDuyet', 'DangMuon')
                `,
          [item.maloaitb, ngayhoc, tiethoc],
        );

        const used = parseInt(usedRes.rows[0].used, 10);
        const available = usableStock - used;
        if (item.soluong > available) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            msg: `Trùng tiết: "${tenloai}" ngày ${new Date(ngayhoc).toLocaleDateString("vi-VN")} tiết ${tiethoc} chỉ còn ${available > 0 ? available : 0}/${usableStock} dùng tốt. Kế hoạch đã bị hủy.`,
          });
        }
      }
    }

    // --- 5. Tổng hợp danh sách môn (denormalize để hiển thị header) ---
    const validPlans = weekPlans.filter(
      (p) => p.items && p.items.length > 0 && tkbMap.has(String(p.matkb)),
    );
    if (validPlans.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ msg: "Không có tiết học nào có thiết bị để gửi." });
    }
    const danhSachMon = [
      ...new Set(validPlans.map((p) => tkbMap.get(String(p.matkb)).tenmon)),
    ].join(", ");

    // --- 6. Tạo PHIEU_TUAN ---
    const maPhieuTuan = "PT" + Date.now() + Math.floor(Math.random() * 1000);
    await client.query(
      `
            INSERT INTO PHIEU_TUAN
                (MaPhieuTuan, MaGV, NamHoc, TuanSo, ThangSo, NgayBatDauTuan, NgayKetThucTuan,
                 DanhSachMon, TrangThai, NgayTao)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ChoDuyet', NOW())
        `,
      [
        maPhieuTuan,
        maGV,
        weekInfo.namHoc,
        weekInfo.tuanSo,
        weekInfo.thangSo,
        weekInfo.ngayBatDauTuan,
        weekInfo.ngayKetThucTuan,
        danhSachMon,
      ],
    );

    // --- 7. Tạo PHIEU_MUON con + CHI_TIET_PHIEU ---
      let soPhieuCon = 0;
      for (const plan of validPlans) {
        // Xóa nháp cũ nếu có (xóa chi tiết trước để tránh lỗi FK)
        const checkDraftRes = await client.query(
          "SELECT MaPhieu FROM PHIEU_MUON WHERE MaTKB = $1 AND NguoiMuon = $2 AND TrangThai = $3",
          [plan.matkb, maGV, "BanNhap"]
        );
        if (checkDraftRes.rows.length > 0) {
          const draftIds = checkDraftRes.rows.map((r) => r.maphieu);
          await client.query("DELETE FROM CHI_TIET_PHIEU WHERE MaPhieu = ANY($1)", [draftIds]);
          await client.query("DELETE FROM PHIEU_MUON WHERE MaPhieu = ANY($1)", [draftIds]);
        }

      // Nếu đã có phiếu khác (cũ chưa gắn MaPhieuTuan) ở trạng thái không phải nháp/từ chối
      // → bỏ qua tiết này để tránh trùng
      const checkExist = await client.query(
        `
                SELECT MaPhieu FROM PHIEU_MUON
                WHERE MaTKB = $1 AND NguoiMuon = $2
                  AND TrangThai NOT IN ('BanNhap', 'TuChoi')
            `,
        [plan.matkb, maGV],
      );
      if (checkExist.rows.length > 0) continue;

      const maPhieu = "PM" + Date.now() + Math.floor(Math.random() * 1000);
      const tenBaiLuu =
        (plan.tenbaihoc && String(plan.tenbaihoc).trim()) || null;
      const ghiChiuLuu =
        (plan.ghichu_dieuchinh && String(plan.ghichu_dieuchinh).trim()) ||
        (plan.ghichuDieuChinh && String(plan.ghichuDieuChinh).trim()) ||
        null;
      await client.query(
        `
                INSERT INTO PHIEU_MUON (MaPhieu, MaTKB, NguoiMuon, TrangThai, NgayTao, MaPhieuTuan, TenBaiHoc, GhiChuDieuChinh)
                VALUES ($1, $2, $3, 'ChoDuyet', NOW(), $4, $5, $6)
            `,
        [maPhieu, plan.matkb, maGV, maPhieuTuan, tenBaiLuu, ghiChiuLuu],
      );

      for (const item of plan.items) {
        await client.query(
          `
                    INSERT INTO CHI_TIET_PHIEU (MaPhieu, MaLoaiTB, SoLuongDK)
                    VALUES ($1, $2, $3)
                `,
          [maPhieu, item.maloaitb, item.soluong],
        );
      }
      soPhieuCon++;
    }

    if (soPhieuCon === 0) {
      // Không tạo được phiếu con nào → rollback luôn phiếu tuần
      await client.query("ROLLBACK");
      return res.status(409).json({
        msg: "Tất cả các tiết đã có phiếu mượn. Không có phiếu mới được tạo.",
      });
    }

    await client.query("COMMIT");
    
    // [MỚI] Bắn thông báo tới Admin
    emitToAdmins("new_borrow_request", { 
      msg: `Có phiếu mượn TUẦN mới (Tuần ${weekInfo.tuanSo}) từ giáo viên`, 
      maPhieuTuan: maPhieuTuan, 
      maGV: maGV 
    });

    res.status(200).json({
      msg: `Đã gửi duyệt phiếu tuần ${weekInfo.tuanSo} (Tháng ${weekInfo.thangSo}, Năm học ${weekInfo.namHoc}). Tổng ${soPhieuCon} tiết.`,
      maPhieuTuan,
      tuanSo: weekInfo.tuanSo,
      thangSo: weekInfo.thangSo,
      namHoc: weekInfo.namHoc,
    });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Lỗi Submit Week:", err);
      res.status(500).json({ msg: "Lỗi hệ thống khi gửi phiếu tuần: " + err.message });
    } finally {
    client.release();
  }
};

module.exports = {
  submitWeeklyPlan,
  createLoanRequest,
  getPendingRequests,
  updateStatus,
  bulkUpdateStatus,
  getTeacherHistory,
  getTopDevices,
  getTopTeachers,
  getTopSubjects,
  getEquipmentStatus,
  getWarehouseTasks,
  returnEquipment,
  getAllHistoryForExport,
  getBorrowDetails,
};
