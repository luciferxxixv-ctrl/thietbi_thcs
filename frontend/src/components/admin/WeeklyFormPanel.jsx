import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../shared/constants";
import { exportWeeklyFormToXlsx } from "../../utils/weeklyFormExport";
import RemindWeekPanel from "./RemindWeekPanel";

const fmtDate = (d) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

const STATUS_META = {
  ChoDuyet: { label: "Chờ duyệt", cls: "bg-warning text-dark" },
  DaChuanBi: { label: "Đã chuẩn bị", cls: "bg-primary" },
  DaDuyet: { label: "Đã duyệt", cls: "bg-success" },
  DaDuyetMotPhan: { label: "Duyệt 1 phần", cls: "bg-info text-dark" },
  TuChoi: { label: "Từ chối", cls: "bg-danger" },
  DaTra: { label: "Đã trả", cls: "bg-secondary" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, cls: "bg-secondary" };
  return <span className={`badge ${m.cls} px-2 py-1`}>{m.label}</span>;
}

export default function WeeklyFormPanel({ user: adminUser }) {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({
    trangthai: "ChoDuyet",
    tuan: "",
    magv: "",
  });
  const [loading, setLoading] = useState(false);

  // Detail state
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rowOverrides, setRowOverrides] = useState({}); // { maphieu: { trangthai, lydo } }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.trangthai) params.trangthai = filter.trangthai;
      if (filter.tuan) params.tuan = filter.tuan;
      if (filter.magv) params.magv = filter.magv;
      const res = await axios.get(`${API_BASE}/api/weekly-form`, { params });
      setList(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải danh sách phiếu tuần");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (id) => {
    setDetailId(id);
    setDetail(null);
    setRowOverrides({});
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/weekly-form/${id}`);
      setDetail(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải chi tiết phiếu tuần");
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (actionLoading) return;
    setDetailId(null);
    setDetail(null);
    setRowOverrides({});
  };

  const handleApproveAll = async () => {
    if (
      !window.confirm(
        `Duyệt cả phiếu tuần ${detail.phieu.tuanso} của ${detail.phieu.tengv}?`,
      )
    )
      return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/weekly-form/${detailId}/approve`,
        {
          nguoiDuyet: adminUser?.maGV || null,
        },
      );
      toast.success(res.data.msg || "Đã duyệt cả phiếu.");
      closeDetail();
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi duyệt phiếu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPrepared = async () => {
    if (
      !window.confirm(
        `Xác nhận đã chuẩn bị xong thiết bị cho phiếu tuần ${detail.phieu.tuanso} - ${detail.phieu.tengv}?\n\nGV sẽ thấy thông báo "Sẵn sàng đến nhận thiết bị".`,
      )
    )
      return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/weekly-form/${detailId}/prepare`,
        {
          nguoiCB: adminUser?.maGV || null,
        },
      );
      toast.success(res.data.msg || "Đã đánh dấu chuẩn bị.");
      await openDetail(detailId);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi đánh dấu chuẩn bị");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAll = async () => {
    const lydo = window.prompt("Nhập lý do từ chối (không bắt buộc):");
    if (lydo === null) return; // user cancelled
    if (!window.confirm("Xác nhận từ chối cả phiếu tuần này?")) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/weekly-form/${detailId}/reject`,
        {
          lydo: lydo || null,
          nguoiDuyet: adminUser?.maGV || null,
        },
      );
      toast.success(res.data.msg || "Đã từ chối phiếu tuần.");
      closeDetail();
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi từ chối phiếu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyRowChanges = async () => {
    const updates = Object.entries(rowOverrides)
      .filter(([_, v]) => v && v.trangthai)
      .map(([maPhieu, v]) => ({
        maPhieu,
        trangthai: v.trangthai,
        lydo: v.lydo || null,
      }));
    if (updates.length === 0) {
      toast.info("Bạn chưa thay đổi dòng nào.");
      return;
    }
    if (!window.confirm(`Áp dụng thay đổi cho ${updates.length} dòng?`)) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/weekly-form/${detailId}/rows`,
        {
          updates,
          nguoiDuyet: adminUser?.maGV || null,
        },
      );
      toast.success(res.data.msg || "Đã cập nhật.");
      // Tải lại detail để cập nhật trạng thái
      await openDetail(detailId);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi cập nhật dòng");
    } finally {
      setActionLoading(false);
    }
  };

  const setRowStatus = (maPhieu, trangthai) => {
    setRowOverrides((prev) => ({
      ...prev,
      [maPhieu]: { ...(prev[maPhieu] || {}), trangthai },
    }));
  };

  const setRowLydo = (maPhieu, lydo) => {
    setRowOverrides((prev) => ({
      ...prev,
      [maPhieu]: { ...(prev[maPhieu] || {}), lydo },
    }));
  };

  // Group rows by maphieu (1 PHIEU_MUON = 1 tiết, có thể có nhiều thiết bị)
  const groupedRows = (() => {
    if (!detail?.rows) return [];
    const map = new Map();
    for (const r of detail.rows) {
      if (!map.has(r.maphieu)) map.set(r.maphieu, { phieuInfo: r, items: [] });
      map.get(r.maphieu).items.push(r);
    }
    return [...map.values()];
  })();

  const overrideCount = Object.values(rowOverrides).filter(
    (v) => v && v.trangthai,
  ).length;

  return (
    <div>
      <RemindWeekPanel />

      {/* FILTER */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small mb-1">Trạng thái</label>
              <select
                className="form-select form-select-sm"
                value={filter.trangthai}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, trangthai: e.target.value }))
                }
              >
                <option value="">-- Tất cả --</option>
                <option value="ChoDuyet">Chờ duyệt</option>
                <option value="DaChuanBi">Đã chuẩn bị</option>
                <option value="DaDuyet">Đã duyệt</option>
                <option value="DaDuyetMotPhan">Duyệt 1 phần</option>
                <option value="TuChoi">Từ chối</option>
                <option value="DaTra">Đã trả</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small mb-1">Tuần</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="VD: 1"
                value={filter.tuan}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, tuan: e.target.value }))
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small mb-1">Mã GV</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="VD: GV_NHUNG"
                value={filter.magv}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, magv: e.target.value }))
                }
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-sm btn-primary w-100"
                onClick={fetchList}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Lọc / Tải lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-danger text-white fw-bold">
          📅 Phiếu Tuần — {list.length} phiếu
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead className="table-light">
                <tr>
                  <th>Giáo viên</th>
                  <th className="text-center">Tuần</th>
                  <th>Khoảng thời gian</th>
                  <th>Môn học</th>
                  <th className="text-center">Số tiết</th>
                  <th className="text-center">Tổng TB</th>
                  <th className="text-center">Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!loading && list.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      Không có phiếu tuần.
                    </td>
                  </tr>
                )}
                {!loading &&
                  list.map((p) => (
                    <tr key={p.maphieutuan} className="align-middle">
                      <td className="fw-bold text-primary">{p.tengv}</td>
                      <td className="text-center">
                        <div>Tuần {p.tuanso}</div>
                        <small className="text-muted">Tháng {p.thangso}</small>
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
                      </td>
                      <td className="small">
                        {new Date(p.ngaytao).toLocaleString("vi-VN")}
                      </td>
                      <td className="text-center text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openDetail(p.maphieutuan)}
                        >
                          <i className="bi bi-eye"></i> Xem
                        </button>
                        <a
                          className="btn btn-sm btn-outline-dark"
                          href={`/print-week/${p.maphieutuan}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bi bi-printer"></i>
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailId && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1050 }}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ zIndex: 1055 }}
          >
            <div
              className="modal-dialog modal-xl modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header bg-light">
                  <div>
                    <h5 className="modal-title fw-bold mb-1">
                      <i className="bi bi-clipboard-data me-2"></i>
                      Phiếu tuần {detail?.phieu?.tuanso} —{" "}
                      {detail?.phieu?.tengv}
                    </h5>
                    {detail && (
                      <small className="text-muted">
                        Năm học {detail.phieu.namhoc} · Tháng{" "}
                        {detail.phieu.thangso} ·
                        {fmtDate(detail.phieu.ngaybatdautuan)} –{" "}
                        {fmtDate(detail.phieu.ngayketthuctuan)} · Môn:{" "}
                        {detail.phieu.danhsachmon} ·
                        <StatusBadge status={detail.phieu.trangthai} />
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeDetail}
                    disabled={actionLoading}
                  ></button>
                </div>

                <div className="modal-body">
                  {detailLoading && (
                    <div className="text-center text-muted py-4">
                      Đang tải...
                    </div>
                  )}
                  {detail &&
                    detail.phieu.trangthai === "TuChoi" &&
                    detail.phieu.lydotuchoi && (
                      <div className="alert alert-danger small">
                        Lý do từ chối: {detail.phieu.lydotuchoi}
                      </div>
                    )}

                  {detail && (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm align-middle">
                        <thead className="table-light text-center">
                          <tr>
                            <th style={{ width: "4%" }}>TT</th>
                            <th style={{ width: "9%" }}>Ngày dạy</th>
                            <th>Tên thiết bị</th>
                            <th style={{ width: "18%" }}>Tên bài dạy</th>
                            <th style={{ width: "12%" }}>Điều chỉnh GV</th>
                            <th style={{ width: "7%" }}>Tiết</th>
                            <th style={{ width: "6%" }}>SL</th>
                            <th style={{ width: "6%" }}>Lớp</th>
                            <th style={{ width: "8%" }}>Môn</th>
                            <th style={{ width: "12%" }}>Trạng thái</th>
                            <th style={{ width: "14%" }}>Hành động dòng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.rows.map((r, idx) => {
                            const overridden =
                              rowOverrides[r.maphieu]?.trangthai;
                            const effective = overridden || r.trangthaicon;
                            return (
                              <tr key={`${r.maphieu}-${r.maloaitb}-${idx}`}>
                                <td className="text-center">{idx + 1}</td>
                                <td className="text-center">
                                  {fmtDate(r.ngayhoc)}
                                </td>
                                <td>{r.tenloai}</td>
                                <td>
                                  {r.tenbaihoc || (
                                    <em className="text-muted">(chưa có)</em>
                                  )}
                                </td>
                                <td className="small text-break">
                                  {r.ghichudieuchinh || "—"}
                                </td>
                                <td className="text-center">{r.tiethoc}</td>
                                <td className="text-center fw-bold">
                                  {r.soluongdk}
                                </td>
                                <td className="text-center">{r.malop}</td>
                                <td className="text-center small">
                                  {r.tenmon}
                                </td>
                                <td className="text-center">
                                  <StatusBadge status={effective} />
                                  {overridden && (
                                    <div className="small text-warning">
                                      (sẽ đổi)
                                    </div>
                                  )}
                                  {r.lydotuchoicon && (
                                    <div className="small text-danger">
                                      {r.lydotuchoicon}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={overridden || ""}
                                    onChange={(e) =>
                                      setRowStatus(r.maphieu, e.target.value)
                                    }
                                    disabled={
                                      actionLoading ||
                                      detail.phieu.trangthai === "TuChoi"
                                    }
                                  >
                                    <option value="">-- Giữ nguyên --</option>
                                    <option value="DaChuanBi">
                                      Đã chuẩn bị
                                    </option>
                                    <option value="DaDuyet">Duyệt</option>
                                    <option value="TuChoi">Từ chối</option>
                                    <option value="ChoDuyet">Trả về Chờ</option>
                                  </select>
                                  {overridden === "TuChoi" && (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm mt-1"
                                      placeholder="Lý do (tùy chọn)"
                                      value={
                                        rowOverrides[r.maphieu]?.lydo || ""
                                      }
                                      onChange={(e) =>
                                        setRowLydo(r.maphieu, e.target.value)
                                      }
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {detail.rows.length === 0 && (
                            <tr>
                              <td
                                colSpan="11"
                                className="text-center text-muted py-3"
                              >
                                Không có dòng nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <div className="small text-muted">
                        Có <strong>{groupedRows.length}</strong> tiết /{" "}
                        <strong>{detail.rows.length}</strong> dòng thiết bị.
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer d-flex justify-content-between">
                  <div>
                    <button
                      className="btn btn-outline-success me-2"
                      onClick={() => detail && exportWeeklyFormToXlsx(detail)}
                      disabled={!detail}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i> Tải
                      Excel
                    </button>
                    <a
                      className="btn btn-outline-dark"
                      href={`/print-week/${detailId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="bi bi-printer me-1"></i> In
                    </a>
                  </div>
                  <div>
                    <button
                      className="btn btn-info text-white me-2"
                      onClick={handleApplyRowChanges}
                      disabled={actionLoading || overrideCount === 0}
                    >
                      <i className="bi bi-list-check me-1"></i>
                      Áp dụng {overrideCount > 0
                        ? `(${overrideCount})`
                        : ""}{" "}
                      dòng
                    </button>
                    <button
                      className="btn btn-primary me-2"
                      onClick={handleMarkPrepared}
                      disabled={
                        actionLoading ||
                        !detail ||
                        ["DaChuanBi", "DaDuyet", "TuChoi", "DaTra"].includes(
                          detail.phieu.trangthai,
                        )
                      }
                      title="Đánh dấu admin đã gom đủ thiết bị, GV có thể đến nhận"
                    >
                      <i className="bi bi-box-seam me-1"></i> Đã chuẩn bị
                    </button>
                    <button
                      className="btn btn-success me-2"
                      onClick={handleApproveAll}
                      disabled={
                        actionLoading ||
                        !detail ||
                        detail.phieu.trangthai === "DaDuyet"
                      }
                    >
                      <i className="bi bi-check2-circle me-1"></i> Duyệt cả
                      phiếu
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleRejectAll}
                      disabled={
                        actionLoading ||
                        !detail ||
                        detail.phieu.trangthai === "TuChoi"
                      }
                    >
                      <i className="bi bi-x-circle me-1"></i> Từ chối cả phiếu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
