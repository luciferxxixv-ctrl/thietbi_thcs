import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../shared/constants";

/**
 * QRPrintSheet — Trang in tem QR cho thiết bị.
 * Mỗi thẻ QR: tên thiết bị + mã + QR ảnh (gọi API /api/warehouse/qr/tb/...)
 *
 * Dùng độc lập (route /print-qr) hoặc embedded (showSelectorOnly=false).
 */
export default function QRPrintSheet() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/equipment`);
        setList(res.data || []);
        const sel = {};
        (res.data || []).forEach((t) => {
          sel[t.maloaitb] = true;
        });
        setSelected(sel);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleAll = (val) => {
    const sel = {};
    list.forEach((t) => {
      sel[t.maloaitb] = val;
    });
    setSelected(sel);
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const visibleList = list.filter((t) => selected[t.maloaitb]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="qr-print-sheet">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .qr-print-sheet { padding: 0 !important; }
          .qr-card { break-inside: avoid; }
        }
        .qr-card {
          border: 2px dashed #adb5bd;
          padding: 12px;
          text-align: center;
          background: white;
        }
      `}</style>

      <div className="no-print mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-1">
            <i className="bi bi-qr-code me-2"></i>In tem QR thiết bị
          </h5>
          <small className="text-muted">
            Chọn thiết bị cần in tem dán lên đồ vật. Khổ giấy A4 sẽ in được ~12
            tem.
          </small>
        </div>
        <div>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => toggleAll(true)}
          >
            <i className="bi bi-check-all me-1"></i>Chọn hết
          </button>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() => toggleAll(false)}
          >
            <i className="bi bi-x-lg me-1"></i>Bỏ chọn
          </button>
          <button className="btn btn-primary fw-bold" onClick={handlePrint}>
            <i className="bi bi-printer-fill me-1"></i>In ({visibleList.length})
          </button>
        </div>
      </div>

      {!printMode && (
        <div className="no-print mb-3 row g-2">
          {list.map((tb) => (
            <div className="col-md-3 col-sm-4 col-6" key={tb.maloaitb}>
              <label
                className="card p-2 d-flex flex-row align-items-center"
                style={{ cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={!!selected[tb.maloaitb]}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      [tb.maloaitb]: e.target.checked,
                    }))
                  }
                />
                <div className="small text-truncate">
                  <strong>{tb.maloaitb}</strong> · {tb.tenloai}
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="row g-3">
        {visibleList.map((tb) => (
          <div className="col-md-3 col-sm-4 col-6" key={tb.maloaitb}>
            <div className="qr-card">
              <div
                className="fw-bold text-primary mb-1"
                style={{ fontSize: 14 }}
              >
                {tb.tenloai}
              </div>
              <img
                src={`${API_BASE}/api/warehouse/qr/tb/${tb.maloaitb}?size=220`}
                alt={`QR ${tb.tenloai}`}
                style={{ width: "100%", maxWidth: 180 }}
              />
              <div className="mt-1 small text-muted">
                <strong>{tb.maloaitb}</strong>
              </div>
              <div className="small text-muted">THCS NAM KHÊ</div>
            </div>
          </div>
        ))}
      </div>

      {visibleList.length === 0 && (
        <div className="alert alert-warning text-center">
          Vui lòng chọn ít nhất 1 thiết bị để in.
        </div>
      )}
    </div>
  );
}
