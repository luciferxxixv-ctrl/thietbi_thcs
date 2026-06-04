import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE } from "../shared/constants";

/**
 * BorrowHistory — Lịch sử mượn của giáo viên.
 * Có 2 chế độ:
 *   - "Theo phiếu tuần"  → gọi /api/weekly-form/me/:maGV (mặc định)
 *   - "Theo từng phiếu"  → giữ data cũ truyền qua prop dsLichSu
 *
 * Props:
 *   dsLichSu — mảng phiếu mượn lẻ (chế độ cũ)
 *   user     — { maGV } (cần để fetch phiếu tuần)
 */

const fmtDate = (d) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

const STATUS_META = {
  ChoDuyet: { label: "Chờ duyệt", cls: "bg-warning text-dark" },
  DaChuanBi: { label: "Sẵn sàng đến nhận", cls: "bg-primary" },
  DaDuyet: { label: "Đã duyệt", cls: "bg-success" },
  DaDuyetMotPhan: { label: "Duyệt 1 phần", cls: "bg-info text-dark" },
  TuChoi: { label: "Bị từ chối", cls: "bg-danger" },
  DaTra: { label: "Đã trả", cls: "bg-secondary" },
  DangMuon: { label: "Đang mượn kho", cls: "bg-info text-dark" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: "bg-secondary" };
  return <span className={`badge ${m.cls} px-3 py-2`}>{m.label}</span>;
}

export default function BorrowHistory({ dsLichSu, user }) {
  const [mode, setMode] = useState("week"); // 'week' | 'detail'
  const [weekList, setWeekList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "week" || !user?.maGV) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/api/weekly-form/me/${user.maGV}`,
        );
        if (!cancelled) setWeekList(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, user?.maGV]);

  return (
    <div className="card border-0 shadow-sm">
      {/* Mode toggle */}
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <strong>Lịch sử mượn của bạn</strong>
        <div className="btn-group btn-group-sm" role="group">
          <button
            className={`btn ${mode === "week" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setMode("week")}
          >
            <i className="bi bi-calendar-week me-1"></i> Theo phiếu tuần
          </button>
          <button
            className={`btn ${mode === "detail" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setMode("detail")}
          >
            <i className="bi bi-list-ul me-1"></i> Theo từng phiếu
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        {/* === MODE: PHIẾU TUẦN === */}
        {mode === "week" && (
          <>
            {/* PC / tablet: bảng */}
            <div className="d-none d-md-block table-responsive">
              <table className="table table-hover m-0">
                <thead className="table-light">
                  <tr>
                    <th>Tuần</th>
                    <th>Khoảng thời gian</th>
                    <th>Môn</th>
                    <th className="text-center">Tiết</th>
                    <th className="text-center">TB</th>
                    <th className="text-center">Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        Đang tải...
                      </td>
                    </tr>
                  )}
                  {!loading && weekList.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        Chưa có phiếu tuần nào. Hãy lên kế hoạch tuần và bấm
                        "Gửi Duyệt Tuần".
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    weekList.map((p) => (
                      <tr key={p.maphieutuan} className="align-middle">
                        <td>
                          <strong>Tuần {p.tuanso}</strong>
                          <div className="small text-muted">
                            Tháng {p.thangso} · {p.namhoc}
                          </div>
                        </td>
                        <td className="small">
                          {fmtDate(p.ngaybatdautuan)} –{" "}
                          {fmtDate(p.ngayketthuctuan)}
                        </td>
                        <td className="small">{p.danhsachmon}</td>
                        <td className="text-center">{p.sotiet}</td>
                        <td className="text-center">{p.tongthietbi}</td>
                        <td className="text-center">
                          <StatusBadge status={p.trangthai} />
                          {p.lydotuchoi && (
                            <div className="text-danger small mt-1">
                              Lý do: {p.lydotuchoi}
                            </div>
                          )}
                        </td>
                        <td className="small">
                          {new Date(p.ngaytao).toLocaleString("vi-VN")}
                        </td>
                        <td className="text-center">
                          <a
                            href={`/print-week/${p.maphieutuan}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-dark fw-bold"
                          >
                            <i className="bi bi-printer"></i> In / Xem
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="d-md-none p-3">
              {loading && (
                <div className="text-center text-muted py-4">Đang tải...</div>
              )}
              {!loading && weekList.length === 0 && (
                <div className="text-center text-muted py-5">
                  Chưa có phiếu tuần nào.
                  <br />
                  <span className="small">
                    Hãy lên kế hoạch tuần và bấm "Gửi Duyệt Tuần".
                  </span>
                </div>
              )}
              {!loading && weekList.length > 0 && (
                <div className="history-card-list">
                  {weekList.map((p) => (
                    <div key={p.maphieutuan} className="history-card">
                      <div className="hc-head">
                        <div>
                          <div className="hc-title">
                            Tuần {p.tuanso} · Tháng {p.thangso}
                          </div>
                          <div className="hc-sub">
                            {fmtDate(p.ngaybatdautuan)} –{" "}
                            {fmtDate(p.ngayketthuctuan)}
                          </div>
                        </div>
                        <StatusBadge status={p.trangthai} />
                      </div>
                      <div className="hc-meta">
                        <div>
                          <span className="text-muted">Môn:</span>{" "}
                          <strong>{p.danhsachmon || "—"}</strong>
                        </div>
                        <div>
                          <span className="text-muted">Tiết:</span>{" "}
                          <strong>{p.sotiet}</strong> &nbsp;·&nbsp;{" "}
                          <span className="text-muted">Thiết bị:</span>{" "}
                          <strong>{p.tongthietbi}</strong>
                        </div>
                        <div className="text-muted small mt-1">
                          Tạo: {new Date(p.ngaytao).toLocaleString("vi-VN")}
                        </div>
                        {p.lydotuchoi && (
                          <div className="text-danger small mt-1">
                            <i className="bi bi-x-circle me-1"></i>Lý do:{" "}
                            {p.lydotuchoi}
                          </div>
                        )}
                      </div>
                      <div className="hc-actions">
                        <a
                          href={`/print-week/${p.maphieutuan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-brand-outline btn-sm fw-bold flex-grow-1 touch-btn d-flex align-items-center justify-content-center"
                        >
                          <i className="bi bi-printer me-1"></i> In / Xem phiếu
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* === MODE: TỪNG PHIẾU === */}
        {mode === "detail" && (
          <>
            {/* PC / tablet: bảng */}
            <div className="d-none d-md-block table-responsive">
              <table className="table table-hover m-0">
                <thead className="table-light">
                  <tr>
                    <th>Ngày tạo</th>
                    <th>Chi tiết bài dạy</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {!dsLichSu || dsLichSu.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        Chưa có phiếu mượn nào.
                      </td>
                    </tr>
                  ) : (
                    dsLichSu.map((p) => (
                      <tr key={p.maphieu} className="align-middle">
                        <td className="text-nowrap">
                          {new Date(p.ngaytao).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          <strong className="brand-text">
                            {p.tenmon} (Lớp {p.malop})
                          </strong>
                          <br />
                          <small className="text-muted">
                            Tiết {p.tiethoc} - Dạy ngày: {fmtDate(p.ngayhoc)}
                          </small>
                        </td>
                        <td>
                          <StatusBadge status={p.trangthai} />
                          {p.trangthai === "TuChoi" && p.lydotuchoi && (
                            <div className="text-danger small mt-1 fw-bold">
                              Lý do: {p.lydotuchoi}
                            </div>
                          )}
                        </td>
                        <td className="text-center">
                          <Link
                            to={`/print/${p.maphieu}`}
                            target="_blank"
                            className="btn btn-sm btn-outline-dark fw-bold"
                          >
                            <i className="bi bi-printer"></i> In
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="d-md-none p-3">
              {!dsLichSu || dsLichSu.length === 0 ? (
                <div className="text-center text-muted py-5">
                  Chưa có phiếu mượn nào.
                </div>
              ) : (
                <div className="history-card-list">
                  {dsLichSu.map((p) => (
                    <div key={p.maphieu} className="history-card">
                      <div className="hc-head">
                        <div>
                          <div className="hc-title">
                            {p.tenmon}{" "}
                            <span className="text-muted">· Lớp {p.malop}</span>
                          </div>
                          <div className="hc-sub">
                            Tiết {p.tiethoc} · Dạy ngày {fmtDate(p.ngayhoc)}
                          </div>
                        </div>
                        <StatusBadge status={p.trangthai} />
                      </div>
                      <div className="hc-meta">
                        <div className="text-muted small">
                          Tạo: {new Date(p.ngaytao).toLocaleString("vi-VN")}
                        </div>
                        {p.trangthai === "TuChoi" && p.lydotuchoi && (
                          <div className="text-danger small mt-1 fw-bold">
                            <i className="bi bi-x-circle me-1"></i>Lý do:{" "}
                            {p.lydotuchoi}
                          </div>
                        )}
                      </div>
                      <div className="hc-actions">
                        <Link
                          to={`/print/${p.maphieu}`}
                          target="_blank"
                          className="btn btn-brand-outline btn-sm fw-bold flex-grow-1 touch-btn d-flex align-items-center justify-content-center"
                        >
                          <i className="bi bi-printer me-1"></i> In phiếu
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
