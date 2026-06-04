const { pool } = require("../config/db");
const { sendMail } = require("../services/mailer");
const {
  getActiveSchoolYear,
  weekBoundsFromTuanSo,
} = require("../utils/weekHelper");

async function getSchoolYearRow(client, namHoc) {
  if (namHoc) {
    const r = await client.query(
      `SELECT NamHoc as namhoc, NgayBatDau as ngaybatdau, NgayKetThuc as ngayketthuc
             FROM NAM_HOC WHERE NamHoc = $1 LIMIT 1`,
      [namHoc],
    );
    return r.rows[0] || null;
  }
  return getActiveSchoolYear(client);
}

/** GV có TKB trong khoảng tuần và chưa có phiếu tuần ở trạng thái đang xử lý. */
async function findTeachersMissingWeek(
  client,
  { weekStart, weekEnd, namHoc, tuanSo, onlyMaGVs },
) {
  const params = [weekStart, weekEnd, namHoc, parseInt(tuanSo, 10)];
  let extra = "";
  if (onlyMaGVs && onlyMaGVs.length > 0) {
    params.push(onlyMaGVs);
    extra = ` AND gv.MaGV = ANY($5::varchar[])`;
  }
  const r = await client.query(
    `
        SELECT DISTINCT gv.MaGV AS magv, gv.TenGV AS tengv, gv.Email AS email
        FROM THOI_KHOA_BIEU tkb
        JOIN GIAO_VIEN gv ON tkb.MaGV = gv.MaGV
        WHERE DATE(tkb.NgayHoc) >= $1::date
          AND DATE(tkb.NgayHoc) <= $2::date
          AND NOT EXISTS (
            SELECT 1 FROM PHIEU_TUAN pt
            WHERE pt.MaGV = gv.MaGV
              AND pt.NamHoc = $3
              AND pt.TuanSo = $4
              AND pt.TrangThai IN ('ChoDuyet', 'DaChuanBi', 'DaDuyet', 'DaTra', 'DaDuyetMotPhan')
          )
        ${extra}
        ORDER BY gv.MaGV
        `,
    params,
  );
  return r.rows;
}

async function logEmail(client, row) {
  await client.query(
    `
        INSERT INTO email_log (magv, email, tuanso, namhoc, loai, trangthai, thongbao)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
    [
      row.magv,
      row.email,
      row.tuanso,
      row.namhoc,
      row.loai || "remind_week",
      row.trangthai,
      row.thongbao || null,
    ],
  );
}

const listSubjectsMissing = async (req, res) => {
  try {
    const tuanSo = parseInt(req.query.tuanSo, 10);
    const namHoc = req.query.namHoc || null;
    if (!tuanSo || tuanSo < 1) {
      return res.status(400).json({ msg: "Tham số tuanSo không hợp lệ." });
    }
    const client = await pool.connect();
    try {
      const sy = await getSchoolYearRow(client, namHoc);
      if (!sy) {
        return res
          .status(400)
          .json({
            msg: "Không tìm thấy năm học. Truyền namHoc hoặc bật NAM_HOC active.",
          });
      }
      const { weekStart, weekEnd } = weekBoundsFromTuanSo(tuanSo, sy);
      const teachers = await findTeachersMissingWeek(client, {
        weekStart,
        weekEnd,
        namHoc: sy.namhoc,
        tuanSo,
        onlyMaGVs: null,
      });
      res.status(200).json({
        namhoc: sy.namhoc,
        tuanSo,
        weekStart,
        weekEnd,
        teachers,
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("listSubjectsMissing:", err);
    res.status(500).json({ msg: "Lỗi lấy danh sách GV chưa nộp phiếu." });
  }
};

const remindWeek = async (req, res) => {
  const { tuanSo, namHoc, danhSachMaGV } = req.body || {};
  const ts = parseInt(tuanSo, 10);
  if (!ts || ts < 1) {
    return res.status(400).json({ msg: "Thiếu hoặc sai tuanSo." });
  }
  const onlyMaGVs =
    Array.isArray(danhSachMaGV) && danhSachMaGV.length > 0
      ? danhSachMaGV.map(String)
      : null;

  const client = await pool.connect();
  try {
    const sy = await getSchoolYearRow(client, namHoc || null);
    if (!sy) {
      return res.status(400).json({ msg: "Không tìm thấy năm học." });
    }
    const { weekStart, weekEnd } = weekBoundsFromTuanSo(ts, sy);
    const teachers = await findTeachersMissingWeek(client, {
      weekStart,
      weekEnd,
      namHoc: sy.namhoc,
      tuanSo: ts,
      onlyMaGVs,
    });

    const sent = [];
    const skipped = [];
    const failed = [];

    for (const t of teachers) {
      const to = (t.email || "").trim();
      if (!to) {
        skipped.push({ magv: t.magv, tengv: t.tengv, reason: "Chưa có email" });
        await logEmail(client, {
          magv: t.magv,
          email: null,
          tuanso: ts,
          namhoc: sy.namhoc,
          trangthai: "BoQua",
          thongbao: "Chưa có email",
        });
        continue;
      }
      const subject = `[THCS] Nhắc nộp phiếu mượn thiết bị tuần ${ts} (${sy.namhoc})`;
      const text =
        `Kính gửi ${t.tengv},\n\n` +
        `Hệ thống nhắc: Tuần ${ts} (từ ${weekStart} đến ${weekEnd}), năm học ${sy.namhoc}, ` +
        `Quý Thầy/Cô có lịch lên lớp nhưng chưa gửi phiếu mượn thiết bị dạy học qua ứng dụng.\n\n` +
        `Vui lòng đăng nhập, hoàn tất nháp thiết bị và bấm "Gửi Duyệt Tuần" trước khi dạy.\n\n` +
        `— Ban quản trị`;

      try {
        await sendMail({ to, subject, text });
        sent.push({ magv: t.magv, tengv: t.tengv, email: to });
        await logEmail(client, {
          magv: t.magv,
          email: to,
          tuanso: ts,
          namhoc: sy.namhoc,
          trangthai: "DaGui",
          thongbao: null,
        });
      } catch (e) {
        console.error("sendMail", t.magv, e.message);
        failed.push({
          magv: t.magv,
          tengv: t.tengv,
          email: to,
          error: e.message,
        });
        await logEmail(client, {
          magv: t.magv,
          email: to,
          tuanso: ts,
          namhoc: sy.namhoc,
          trangthai: "Loi",
          thongbao: e.message,
        });
      }
    }

    res.status(200).json({
      msg: `Đã gửi ${sent.length} email, bỏ qua ${skipped.length}, lỗi ${failed.length}.`,
      namhoc: sy.namhoc,
      tuanSo: ts,
      weekStart,
      weekEnd,
      sent,
      skipped,
      failed,
    });
  } catch (err) {
    if (err.code === "SMTP_NOT_CONFIGURED" || err.code === "SMTP_NO_FROM") {
      return res.status(503).json({ msg: err.message });
    }
    console.error("remindWeek:", err);
    res.status(500).json({ msg: "Lỗi gửi nhắc tuần." });
  } finally {
    client.release();
  }
};

const remindTeacher = async (req, res) => {
  const { maGV, tuanSo, namHoc } = req.body || {};
  if (!maGV) return res.status(400).json({ msg: "Thiếu maGV." });
  req.body = { tuanSo, namHoc, danhSachMaGV: [maGV] };
  return remindWeek(req, res);
};

module.exports = { listSubjectsMissing, remindWeek, remindTeacher };
