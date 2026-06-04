import { useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_BASE } from "../shared/constants";

const parseEquipments = (str) => {
  if (!str) return [];
  const parts = String(str).split(',');
  const equipments = [];
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    if (p.includes(':')) {
      const [maloai, sl] = p.split(':');
      equipments.push({ maloaitb: maloai.trim(), soluong: parseInt(sl.trim()) || 1 });
    } else {
      equipments.push({ maloaitb: p.trim(), soluong: 1 });
    }
  }
  return equipments;
};

export default function ScheduleTool() {
  const [isImportingPPCT, setIsImportingPPCT] = useState(false);
  const [isImportingCSV, setIsImportingCSV] = useState(false);

  const ppctInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const handleImportPPCT = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImportingPPCT(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const ppctList = jsonData
        .map((row) => ({
          mappct: row["Mã PPCT"] || row["mappct"],
          mamon: row["Mã Môn"] || row["mamon"],
          tietthu: row["Tiết"] || row["tietthu"],
          tenbaihoc: row["Tên Bài Học"] || row["tenbaihoc"],
          loaiphongyeucau: row["Loại Phòng"] || row["loaiphongyeucau"] || null,
          tuan: row["Tuần"] || row["tuan"] || null,
          equipments: parseEquipments(row["Mã Thiết Bị"] || row["mathietbi"]),
        }))
        .filter((item) => item.mamon && item.tietthu && item.tenbaihoc);

      if (ppctList.length === 0) {
        toast.error(
          "Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại tên cột (Mã Môn, Tiết, Tên Bài Học).",
        );
        return;
      }

      const res = await axios.post(`${API_BASE}/api/plan/import-ppct`, {
        ppctList,
      });
      toast.success(res.data.msg);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi import PPCT");
    } finally {
      setIsImportingPPCT(false);
      if (ppctInputRef.current) ppctInputRef.current.value = null;
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Vui lòng chọn file định dạng .csv");
      e.target.value = "";
      return;
    }

    setIsImportingCSV(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").filter((l) => l.trim());

        if (lines.length < 2) {
          toast.error("File CSV trống hoặc chỉ có header!");
          setIsImportingCSV(false);
          return;
        }

        // Parse header
        const header = lines[0].split(",").map((h) =>
          h
            .replace(/^\uFEFF/, "")
            .trim()
            .toLowerCase(),
        );

        // Tìm index của các cột
        const getColIndex = (names) =>
          header.findIndex((h) => names.includes(h));
        const idxNgay = getColIndex(["ngày", "ngay"]);
        const idxTuan = getColIndex(["tuần", "tuan"]);
        const idxGV = getColIndex(["giáo viên", "tên gv", "magv", "gv"]);
        const idxLop = getColIndex(["lớp", "lop"]);
        const idxMon = getColIndex(["môn", "mã môn", "mamon", "mon"]);
        const idxTiet = getColIndex(["tiết", "tiet"]);
        const idxBuoi = getColIndex(["buổi", "buoi"]);

        if (
          idxNgay === -1 ||
          idxGV === -1 ||
          idxLop === -1 ||
          idxMon === -1 ||
          idxTiet === -1
        ) {
          toast.error(
            "Không tìm thấy đủ các cột bắt buộc (Ngày, Giáo Viên, Lớp, Môn, Tiết).",
          );
          setIsImportingCSV(false);
          return;
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = [];
          let current = "";
          let inQuotes = false;
          for (const ch of lines[i]) {
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === "," && !inQuotes) {
              parts.push(current.trim());
              current = "";
            } else {
              current += ch;
            }
          }
          parts.push(current.trim());

          if (
            parts.length > Math.max(idxNgay, idxGV, idxLop, idxMon, idxTiet)
          ) {
            rows.push({
              ngay: parts[idxNgay],
              tuan: idxTuan !== -1 ? parts[idxTuan] : null,
              maGV: parts[idxGV],
              lop: parts[idxLop],
              maMon: parts[idxMon],
              tiet: parts[idxTiet],
              buoi: idxBuoi !== -1 ? parts[idxBuoi] : "Sáng",
            });
          }
        }

        const validRows = rows.filter(
          (item) =>
            item.ngay && item.maGV && item.lop && item.maMon && item.tiet,
        );

        if (validRows.length === 0) {
          toast.error("Không có dòng dữ liệu hợp lệ nào!");
          setIsImportingCSV(false);
          return;
        }

        const res = await axios.post(`${API_BASE}/api/plan/import-csv`, {
          rows: validRows,
        });
        toast.success(res.data.msg);
        if (
          res.data.stats &&
          res.data.stats.skippedNames &&
          res.data.stats.skippedNames.length > 0
        ) {
          toast.warning(
            `Bỏ qua các GV không tìm thấy: ${res.data.stats.skippedNames.join(", ")}`,
            { autoClose: false },
          );
        }
      } catch (err) {
        toast.error(err.response?.data?.msg || "Lỗi import TKB");
      } finally {
        setIsImportingCSV(false);
        if (csvInputRef.current) csvInputRef.current.value = null;
      }
    };
    reader.onerror = () => {
      toast.error("Lỗi đọc file CSV");
      setIsImportingCSV(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm border-success mb-4">
            <div className="card-header bg-success text-white fw-bold">
              <i className="bi bi-file-earmark-spreadsheet"></i> Import Phân
              Phối Chương Trình (PPCT)
            </div>
            <div className="card-body">
              <p className="small text-muted mb-3">
                Tải lên file Excel (.xlsx) chứa PPCT. Các cột bắt buộc:{" "}
                <strong>Mã Môn, Tiết, Tên Bài Học</strong>.<br/>
                Cột tùy chọn: <strong>Mã Thiết Bị</strong> (phân cách bằng dấu phẩy, VD: TB_01:2, TB_02).
              </p>
              <input
                type="file"
                className="form-control mb-3"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportPPCT}
                ref={ppctInputRef}
                disabled={isImportingPPCT}
              />
              {isImportingPPCT && (
                <div className="text-success small">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang xử lý dữ liệu...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border-primary mb-4">
            <div className="card-header bg-primary text-white fw-bold">
              <i className="bi bi-calendar-check"></i> Import Lịch Dạy (TKB) từ
              CSV
            </div>
            <div className="card-body">
              <p className="small text-muted mb-3">
                Tải lên file TKB thực tế định dạng <strong>.csv</strong>. Các
                cột bắt buộc:{" "}
                <strong>Ngày, Tuần, Giáo Viên, Lớp, Môn, Tiết, Buổi</strong>. Hệ thống
                sẽ tự động khớp nối với PPCT.
              </p>
              <input
                type="file"
                className="form-control mb-3"
                accept=".csv"
                onChange={handleImportCSV}
                ref={csvInputRef}
                disabled={isImportingCSV}
              />
              {isImportingCSV && (
                <div className="text-primary small">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang xử lý dữ liệu...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
