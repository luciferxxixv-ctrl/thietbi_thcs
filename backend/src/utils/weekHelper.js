/**
 * Helper tính toán thông tin tuần học theo năm học.
 *
 * Quy ước:
 *   - Tuần học bắt đầu từ Thứ Hai → Chủ Nhật.
 *   - Tuần 1 = tuần chứa NgayBatDau của năm học.
 *   - tuanSo = floor((monday(date) - monday(start)) / 7) + 1
 *   - thangSo = tháng của Thứ Hai đầu tuần (giúp khớp header "Tuần X tháng Y")
 */

const { pool } = require("../config/db");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function mondayOf(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toIsoDate(date) {
  const d = startOfDay(date);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().split("T")[0];
}

/**
 * Lấy năm học đang active (IsActive=TRUE). Nếu không có row nào thì trả về null.
 * @param {object} executor - pool hoặc client (transaction-aware)
 */
async function getActiveSchoolYear(executor = pool) {
  const r = await executor.query(`
        SELECT NamHoc as namhoc, NgayBatDau as ngaybatdau, NgayKetThuc as ngayketthuc
        FROM NAM_HOC
        WHERE IsActive = TRUE
        ORDER BY NgayBatDau DESC
        LIMIT 1
    `);
  return r.rows[0] || null;
}

/**
 * Tính thông tin tuần (theo năm học) cho một ngày bất kỳ.
 * @param {Date|string} date
 * @param {{namhoc: string, ngaybatdau: Date|string}} schoolYear
 * @returns {{namHoc, tuanSo, thangSo, ngayBatDauTuan, ngayKetThucTuan}}
 */
function computeWeekInfo(date, schoolYear) {
  if (!schoolYear) throw new Error("Thiếu cấu hình năm học (NAM_HOC).");

  const target = mondayOf(date);
  const startMonday = mondayOf(schoolYear.ngaybatdau);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor(
    (target.getTime() - startMonday.getTime()) / msPerWeek,
  );
  const tuanSo = diffWeeks + 1;

  const ngayBatDauTuan = target;
  const ngayKetThucTuan = addDays(target, 6);
  const thangSo = ngayBatDauTuan.getMonth() + 1;

  return {
    namHoc: schoolYear.namhoc,
    tuanSo,
    thangSo,
    ngayBatDauTuan: toIsoDate(ngayBatDauTuan),
    ngayKetThucTuan: toIsoDate(ngayKetThucTuan),
  };
}

/**
 * Khoảng ngày (ISO) của tuần học thứ tuanSo trong năm học (Thứ Hai → CN).
 */
function weekBoundsFromTuanSo(tuanSo, schoolYear) {
  if (!schoolYear) throw new Error("Thiếu cấu hình năm học (NAM_HOC).");
  const n = parseInt(tuanSo, 10);
  if (!n || n < 1) throw new Error("tuanSo không hợp lệ.");
  const startMonday = mondayOf(schoolYear.ngaybatdau);
  const weekStart = addDays(startMonday, (n - 1) * 7);
  const weekEnd = addDays(weekStart, 6);
  return {
    weekStart: toIsoDate(weekStart),
    weekEnd: toIsoDate(weekEnd),
  };
}

module.exports = {
  getActiveSchoolYear,
  computeWeekInfo,
  weekBoundsFromTuanSo,
  mondayOf,
  toIsoDate,
};
