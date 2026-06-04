/**
 * Xuất phiếu tuần ra file Excel (.xlsx) khớp mẫu in.
 * Dùng SheetJS Community Edition (`xlsx`) — không cần cài thêm package.
 *
 * Hạn chế: SheetJS Community không hỗ trợ tô màu/font chữ. Layout vẫn đúng
 *   (merge cells, độ rộng cột, alignment, wrap text). Khi mở bằng Excel/WPS
 *   người dùng có thể chỉnh thêm font Times New Roman + viền nếu cần.
 */
import * as XLSX from "xlsx";

const SCHOOL_PROVINCE = "UBND PHƯỜNG VÀNG DANH";
const SCHOOL_NAME = "TRƯỜNG TH&THCS NAM KHÊ";
const TOWN = "Vàng Danh";

const fmtDateVN = (d) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

/**
 * @param {object} data
 *   data.phieu — header: { tengv, tuanso, thangso, namhoc, danhsachmon }
 *   data.rows  — chi tiết: [{ ngayhoc, ngaytra, tenloai, tenbaihoc, tiethoc, soluongdk, malop, tenmon, ghichu? }]
 */
export function exportWeeklyFormToXlsx(data) {
  const { phieu, rows } = data || {};
  if (!phieu) return;

  const today = new Date();
  const headerLine = `MÔN: ${phieu.danhsachmon || "..."} - TUẦN ${phieu.tuanso} THÁNG ${phieu.thangso}`;
  const yearLine = `NĂM HỌC ${phieu.namhoc}`;

  // Bố cục theo AOA — 9 cột, merge các dòng tiêu đề
  const aoa = [
    [SCHOOL_PROVINCE, "", "", "", "", "", "", "", ""],
    [SCHOOL_NAME, "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "PHIẾU MƯỢN THIẾT BỊ DẠY HỌC", "", "", "", "", ""],
    ["", "", "", headerLine, "", "", "", "", ""],
    ["", "", "", yearLine, "", "", "", "", ""],
    [
      "* Ô đó không ghi ngày mượn/trả; ghi nguồn học liệu vào cột ghi chú.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "TT",
      "Ngày mượn",
      "Ngày trả",
      "Tên thiết bị",
      "Tên bài dạy",
      "Tiết KHGD",
      "Số lượng",
      "Lớp",
      "Ghi chú",
    ],
  ];

  rows.forEach((r, idx) => {
    aoa.push([
      idx + 1,
      fmtDateVN(r.ngayhoc),
      fmtDateVN(r.ngaytra || r.ngayhoc),
      r.tenloai || "",
      r.tenbaihoc || "",
      `Tiết ${r.tiethoc}`,
      r.soluongdk || r.soluong || 1,
      r.malop || "",
      [r.ghichudieuchinh, r.tenmon]
        .filter((x) => x && String(x).trim())
        .join(" | ") || "",
    ]);
  });

  // 1 dòng trống trước phần ký
  aoa.push(Array(9).fill(""));
  aoa.push([
    "",
    "",
    "",
    "",
    `${TOWN}, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`,
    "",
    "",
    "",
    "",
  ]);
  aoa.push(["", "", "", "", "NGƯỜI ĐĂNG KÝ", "", "", "", ""]);
  aoa.push(["", "", "", "", "(Ký, ghi rõ họ tên)", "", "", "", ""]);
  aoa.push(["", "", "", "", "", "", "", "", ""]);
  aoa.push(["", "", "", "", phieu.tengv || "", "", "", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Độ rộng cột (px ước lượng)
  ws["!cols"] = [
    { wch: 5 }, // TT
    { wch: 12 }, // Ngày mượn
    { wch: 12 }, // Ngày trả
    { wch: 24 }, // Tên thiết bị
    { wch: 28 }, // Tên bài dạy
    { wch: 10 }, // Tiết KHGD
    { wch: 9 }, // Số lượng
    { wch: 8 }, // Lớp
    { wch: 16 }, // Ghi chú
  ];

  // Merge các dòng tiêu đề + dòng ký
  ws["!merges"] = [
    // Header trường (3 dòng đầu, gộp 9 cột)
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    // Tiêu đề chính (3 dòng giữa)
    { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } },
    // Ghi chú italic
    { s: { r: 6, c: 0 }, e: { r: 6, c: 8 } },
    // Dòng ký tên
    { s: { r: aoa.length - 5, c: 4 }, e: { r: aoa.length - 5, c: 8 } },
    { s: { r: aoa.length - 4, c: 4 }, e: { r: aoa.length - 4, c: 8 } },
    { s: { r: aoa.length - 3, c: 4 }, e: { r: aoa.length - 3, c: 8 } },
    { s: { r: aoa.length - 1, c: 4 }, e: { r: aoa.length - 1, c: 8 } },
  ];

  // Wrap text cho cột tên thiết bị / tên bài dạy
  Object.keys(ws).forEach((key) => {
    if (key.startsWith("!")) return;
    const cell = ws[key];
    if (typeof cell.v === "string" && cell.v.length > 20) {
      cell.s = { alignment: { wrapText: true, vertical: "center" } };
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PMTBDH");

  const safeName = (phieu.tengv || "GV").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Phieu_Tuan_${phieu.tuanso}_T${phieu.thangso}_${safeName}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
