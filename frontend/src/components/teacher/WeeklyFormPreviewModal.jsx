import { useState, useMemo } from "react";
import ConflictInspector from "../shared/ConflictInspector";

/**
 * Modal xem trước phiếu tuần trước khi giáo viên bấm gửi duyệt.
 * Hiển thị bảng dòng-cấp-thiết-bị giống mẫu in:
 *   TT | Ngày mượn | Ngày trả | Tên thiết bị | Tên bài dạy | Tiết KHGD | Số lượng | Lớp | Ghi chú
 *
 * Props:
 *   show       — boolean
 *   rows       — [{ matkb, ngayhoc, ngaytra, tenloai, tenbaihoc, tiethoc, soluong, malop, tenmon, ghichu }]
 *   conflictPlans — danh sách { matkb, items: [{maloaitb, soluong}] } để check xung đột
 *   weekRange  — { from: Date, to: Date } | null
 *   user       — { tenGV, maGV, ... }
 *   submitting — boolean
 *   onClose, onConfirm — callbacks
 */

const fmtDate = (d) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

export default function WeeklyFormPreviewModal({
  show,
  rows = [],
  adjustNotes = {},
  onAdjustNoteChange,
  conflictPlans = [],
  weekRange,
  user,
  submitting = false,
  onClose,
  onConfirm,
}) {
  const [hasConflict, setHasConflict] = useState(false);

  const uniqueMatkbs = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const r of rows) {
      const k = r.matkb;
      if (k == null || seen.has(k)) continue;
      seen.add(k);
      list.push(r);
    }
    return list;
  }, [rows]);

  if (!show) return null;

  const weekRangeText = weekRange
    ? `${fmtDate(weekRange.from)} – ${fmtDate(weekRange.to)}`
    : "Tuần đang chọn";

  const danhSachMon = [
    ...new Set(rows.map((r) => r.tenmon).filter(Boolean)),
  ].join(", ");

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1055 }}
      >
        <div
          className="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-md-down"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header bg-warning bg-opacity-25 border-bottom">
              <div>
                <h5 className="modal-title fw-bold mb-1">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Xem trước phiếu mượn tuần
                </h5>
                <small className="text-muted">
                  GV: <strong>{user?.tenGV || ""}</strong>
                  {danhSachMon && (
                    <>
                      {" "}
                      · Môn: <strong>{danhSachMon}</strong>
                    </>
                  )}
                  &nbsp;· Tuần: <strong>{weekRangeText}</strong>
                  &nbsp;· Tổng dòng: <strong>{rows.length}</strong>
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={submitting}
              ></button>
            </div>

            <div className="modal-body">
              <div className="alert alert-info py-2 small mb-3">
                <i className="bi bi-info-circle me-1"></i>
                Đây là toàn bộ thiết bị bạn sắp gửi cho Admin duyệt. Sau khi
                gửi, bạn không thể chỉnh sửa cho đến khi Admin xử lý xong.
              </div>

              {conflictPlans.length > 0 && (
                <ConflictInspector
                  plans={conflictPlans}
                  onResult={({ hasConflict: hc }) => setHasConflict(hc)}
                />
              )}

              {uniqueMatkbs.length > 0 && onAdjustNoteChange && (
                <div className="card border mb-3">
                  <div className="card-header py-2 small fw-bold">
                    <i className="bi bi-pencil-square me-1"></i>
                    Điều chỉnh / ghi chú theo tiết (tuần này)
                  </div>
                  <div className="card-body py-2">
                    <div className="row g-2">
                      {uniqueMatkbs.map((r) => (
                        <div key={r.matkb} className="col-md-6">
                          <label className="form-label small mb-0 text-muted">
                            Tiết {r.tiethoc} · {fmtDate(r.ngayhoc)} · Lớp{" "}
                            {r.malop}
                          </label>
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            maxLength={2000}
                            value={adjustNotes[r.matkb] ?? ""}
                            onChange={(e) =>
                              onAdjustNoteChange(r.matkb, e.target.value)
                            }
                            disabled={submitting}
                            placeholder="Ghi chú điều chỉnh so với PL 3 / TKB tuần này..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {rows.length === 0 ? (
                <div className="text-center text-muted py-4">
                  Không có dòng thiết bị nào để gửi.
                </div>
              ) : (
                <>
                  {/* PC / tablet: bảng đầy đủ */}
                  <div className="d-none d-md-block table-responsive">
                    <table className="table table-bordered table-sm align-middle">
                      <thead className="table-light text-center">
                        <tr>
                          <th style={{ width: "4%" }}>TT</th>
                          <th style={{ width: "10%" }}>Ngày mượn</th>
                          <th style={{ width: "10%" }}>Ngày trả</th>
                          <th>Tên thiết bị</th>
                          <th style={{ width: "20%" }}>Tên bài dạy</th>
                          <th style={{ width: "8%" }}>Tiết KHGD</th>
                          <th style={{ width: "6%" }}>SL</th>
                          <th style={{ width: "7%" }}>Lớp</th>
                          <th style={{ width: "14%" }}>Điều chỉnh tuần</th>
                          <th style={{ width: "10%" }}>Ghi chú (môn)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr
                            key={`${r.tiethoc}-${r.malop}-${r.tenloai}-${idx}`}
                          >
                            <td className="text-center">{idx + 1}</td>
                            <td className="text-center">
                              {fmtDate(r.ngayhoc)}
                            </td>
                            <td className="text-center">
                              {fmtDate(r.ngaytra || r.ngayhoc)}
                            </td>
                            <td>{r.tenloai}</td>
                            <td>
                              {r.tenbaihoc || (
                                <em className="text-muted">(chưa có)</em>
                              )}
                            </td>
                            <td className="text-center">Tiết {r.tiethoc}</td>
                            <td className="text-center fw-bold">{r.soluong}</td>
                            <td className="text-center">{r.malop}</td>
                            <td className="small text-muted">
                              {adjustNotes[r.matkb] || "—"}
                            </td>
                            <td className="text-muted small">{r.tenmon}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card list dễ đọc hơn so với bảng 9 cột */}
                  <div className="d-md-none history-card-list">
                    {rows.map((r, idx) => (
                      <div
                        key={`${r.tiethoc}-${r.malop}-${r.tenloai}-${idx}`}
                        className="history-card"
                      >
                        <div className="hc-head">
                          <div>
                            <div className="hc-title">
                              {idx + 1}. {r.tenloai}
                            </div>
                            <div className="hc-sub">
                              {r.tenbaihoc || (
                                <em className="text-muted">
                                  (chưa có tên bài)
                                </em>
                              )}
                            </div>
                          </div>
                          <span className="badge bg-primary">
                            SL: {r.soluong}
                          </span>
                        </div>
                        <div className="hc-meta small">
                          <div>
                            <i className="bi bi-calendar-event me-1 text-muted"></i>{" "}
                            Mượn: <strong>{fmtDate(r.ngayhoc)}</strong> · Trả:{" "}
                            <strong>{fmtDate(r.ngaytra || r.ngayhoc)}</strong>
                          </div>
                          <div>
                            <i className="bi bi-clock me-1 text-muted"></i> Tiết{" "}
                            <strong>{r.tiethoc}</strong> · Lớp{" "}
                            <strong>{r.malop}</strong> ·{" "}
                            <span className="text-muted">{r.tenmon}</span>
                          </div>
                          {(adjustNotes[r.matkb] || "").trim() !== "" && (
                            <div className="mt-1 fst-italic text-secondary">
                              Điều chỉnh: {adjustNotes[r.matkb]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                className={`btn ${hasConflict ? "btn-danger" : "btn-success"} fw-bold`}
                onClick={onConfirm}
                disabled={submitting || rows.length === 0 || hasConflict}
                title={
                  hasConflict ? "Cần xử lý xung đột tồn kho trước khi gửi" : ""
                }
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                    Đang gửi...
                  </>
                ) : hasConflict ? (
                  <>
                    <i className="bi bi-shield-x me-2"></i> Có xung đột — không
                    thể gửi
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-check-fill me-2"></i> Xác nhận gửi
                    duyệt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
