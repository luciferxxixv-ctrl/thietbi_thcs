import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE } from "./components/shared/constants";
import { exportWeeklyFormToXlsx } from "./utils/weeklyFormExport";

const SCHOOL_PROVINCE = "UBND PHƯỜNG VÀNG DANH";
const SCHOOL_NAME = "TRƯỜNG TH&THCS NAM KHÊ";
const TOWN = "Vàng Danh";

const fmtDate = (d) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

const trangThaiLabel = (s) =>
  ({
    ChoDuyet: "Chờ duyệt",
    DaDuyet: "Đã duyệt",
    DaDuyetMotPhan: "Đã duyệt một phần",
    TuChoi: "Bị từ chối",
    DaTra: "Đã trả",
  })[s] ||
  s ||
  "";

export default function PrintWeeklyForm() {
  const { maPhieuTuan } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [autoPrintDone, setAutoPrintDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/weekly-form/${maPhieuTuan}`,
        );
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelled)
          setError(
            err.response?.data?.msg || "Không lấy được dữ liệu phiếu tuần.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [maPhieuTuan]);

  // Tự bật hộp thoại in lần đầu (chỉ 1 lần)
  useEffect(() => {
    if (data && !autoPrintDone) {
      const t = setTimeout(() => window.print(), 600);
      setAutoPrintDone(true);
      return () => clearTimeout(t);
    }
  }, [data, autoPrintDone]);

  if (error) {
    return (
      <div className="text-center mt-5 text-danger fs-4">Lỗi: {error}</div>
    );
  }
  if (!data) {
    return <div className="text-center mt-5 fs-4">Đang tải phiếu tuần...</div>;
  }

  const { phieu, rows } = data;
  const today = new Date();

  return (
    <div
      className="weekly-print-container shadow-sm border"
      style={{
        margin: "20px auto",
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#fff",
        padding: "15mm 18mm",
        fontFamily: '"Times New Roman", Times, serif',
        color: "#000",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        body { background-color: #f0f2f5; }

        .weekly-print-container { font-size: 12pt; line-height: 1.35; }
        .weekly-print-container .gov-header { font-size: 12pt; }
        .weekly-print-container .gov-header .school { font-weight: bold; text-transform: uppercase; }
        .weekly-print-container .gov-header .underline-short {
          font-weight: bold;
          display: inline-block;
          border-bottom: 1.2px solid #000;
          padding: 0 10px 1px;
        }
        .weekly-print-container .title { font-size: 17pt; font-weight: bold; letter-spacing: 0.3px; }
        .weekly-print-container .subtitle { font-size: 13pt; font-weight: bold; font-style: italic; }
        .weekly-print-container .meta-line { font-size: 11pt; }
        .weekly-print-container .note { font-size: 10.5pt; font-style: italic; }

        .weekly-print-container table.tbl-week {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5pt;
          table-layout: fixed;
        }
        .weekly-print-container table.tbl-week th,
        .weekly-print-container table.tbl-week td {
          border: 1px solid #000;
          padding: 3px 4px;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .weekly-print-container table.tbl-week thead th {
          text-align: center;
          background-color: #ececec;
          font-weight: bold;
        }
        .weekly-print-container table.tbl-week td.center { text-align: center; }
        .weekly-print-container table.tbl-week tbody tr { page-break-inside: avoid; }

        .weekly-print-container .sign-block { font-size: 12pt; }

        @media print {
          html, body { background-color: white !important; margin: 0; padding: 0; }
          .weekly-print-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 14mm 14mm 14mm 16mm; }
          /* Lặp lại tiêu đề bảng ở mỗi trang khi nhiều dòng */
          table.tbl-week thead { display: table-header-group; }
          table.tbl-week tfoot { display: table-footer-group; }
        }
      `}</style>

      {/* Toolbar (ẩn khi in) */}
      <div className="d-flex justify-content-between align-items-center mb-3 no-print">
        <div>
          <span
            className={`badge px-3 py-2 ${
              phieu.trangthai === "DaDuyet"
                ? "bg-success"
                : phieu.trangthai === "TuChoi"
                  ? "bg-danger"
                  : phieu.trangthai === "DaDuyetMotPhan"
                    ? "bg-info text-dark"
                    : phieu.trangthai === "DaTra"
                      ? "bg-secondary"
                      : "bg-warning text-dark"
            }`}
          >
            {trangThaiLabel(phieu.trangthai)}
          </span>
          {phieu.trangthai === "TuChoi" && phieu.lydotuchoi && (
            <span className="ms-2 text-danger small">
              Lý do: {phieu.lydotuchoi}
            </span>
          )}
        </div>
        <div>
          <button
            className="btn btn-outline-success me-2"
            onClick={() => exportWeeklyFormToXlsx(data)}
          >
            <i className="bi bi-file-earmark-excel me-1"></i> Tải Excel
          </button>
          <button
            className="btn btn-primary me-2"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-1"></i> In phiếu
          </button>
          <button className="btn btn-secondary" onClick={() => window.close()}>
            Đóng
          </button>
        </div>
      </div>

      {/* Header công văn: trái = trường, phải = quốc hiệu */}
      <div className="d-flex justify-content-between gov-header mb-2">
        <div className="text-center" style={{ flex: "0 0 48%" }}>
          <div className="school">{SCHOOL_PROVINCE}</div>
          <div className="school">
            <span className="underline-short">{SCHOOL_NAME}</span>
          </div>
        </div>
        <div className="text-center" style={{ flex: "0 0 48%" }}>
          <div className="fw-bold text-uppercase">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div>
            <span className="underline-short">Độc lập - Tự do - Hạnh phúc</span>
          </div>
        </div>
      </div>

      {/* Tiêu đề chính */}
      <div className="text-center mt-4 mb-2">
        <div className="title">PHIẾU MƯỢN THIẾT BỊ DẠY HỌC</div>
        <div className="subtitle mt-1">
          MÔN: {phieu.danhsachmon || "..."} &nbsp;-&nbsp; TUẦN {phieu.tuanso}{" "}
          THÁNG {phieu.thangso}
        </div>
        <div className="subtitle">NĂM HỌC {phieu.namhoc}</div>
      </div>

      {/* Thông tin phiếu */}
      <div className="meta-line mb-1 mt-3">
        <div>
          Họ và tên giáo viên: <strong>{phieu.tengv || ""}</strong>
        </div>
        <div>
          Mã phiếu: <strong>{phieu.maphieutuan || maPhieuTuan}</strong>
        </div>
      </div>

      <div className="note mb-2">
        * Đối với các thiết bị dùng nhiều lần trong tuần, ghi nguồn học liệu vào
        cột Ghi chú.
      </div>

      {/* Bảng nội dung */}
      <table className="tbl-week mb-3">
        <colgroup>
          <col style={{ width: "4.5%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "21%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "6%" }} />
          <col style={{ width: "6.5%" }} />
          <col style={{ width: "11%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>TT</th>
            <th>Ngày mượn</th>
            <th>Ngày trả</th>
            <th>Tên thiết bị</th>
            <th>Tên bài dạy</th>
            <th>Tiết KHGD</th>
            <th>Số lượng</th>
            <th>Lớp</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="9" className="center fst-italic">
                Không có dòng nào
              </td>
            </tr>
          )}
          {rows.map((r, idx) => (
            <tr key={`${r.maphieu}-${r.maloaitb}-${idx}`}>
              <td className="center">{idx + 1}</td>
              <td className="center">{fmtDate(r.ngayhoc)}</td>
              <td className="center">{fmtDate(r.ngaytra || r.ngayhoc)}</td>
              <td>{r.tenloai}</td>
              <td>{r.tenbaihoc || ""}</td>
              <td className="center">Tiết {r.tiethoc}</td>
              <td className="center fw-bold">{r.soluongdk}</td>
              <td className="center">{r.malop}</td>
              <td className="center small">
                {r.ghichudieuchinh && (
                  <div className="text-start">{r.ghichudieuchinh}</div>
                )}
                {r.tenmon && <div className="text-muted">{r.tenmon}</div>}
                {!r.ghichudieuchinh && !r.tenmon && "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Khu ký tên */}
      <div className="d-flex justify-content-between sign-block mt-4">
        <div className="text-center" style={{ flex: "0 0 48%" }}>
          <div className="fw-bold mb-1">DUYỆT CỦA NHÀ TRƯỜNG</div>
          <div className="fst-italic">(Ký, ghi rõ họ tên)</div>
          <div style={{ height: "70px" }}></div>
        </div>
        <div className="text-center" style={{ flex: "0 0 48%" }}>
          <div className="fst-italic mb-1">
            {TOWN}, ngày {today.getDate()} tháng {today.getMonth() + 1} năm{" "}
            {today.getFullYear()}
          </div>
          <div className="fw-bold mb-1">NGƯỜI ĐĂNG KÝ</div>
          <div className="fst-italic">(Ký, ghi rõ họ tên)</div>
          <div style={{ height: "50px" }}></div>
          <div className="fw-bold">{phieu.tengv}</div>
        </div>
      </div>
    </div>
  );
}
