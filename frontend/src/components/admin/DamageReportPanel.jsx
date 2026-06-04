import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_BASE } from "../shared/constants";

/**
 * DamageReportPanel — Báo cáo tình trạng thiết bị + lịch sử hao mòn.
 * Cho phép admin:
 *   - Xem tổng quan tốt/hỏng/mất của từng thiết bị
 *   - Sửa nhanh kết quả kiểm kê (cập nhật condition + ghi chú)
 *   - Xem lịch sử hao mòn (filter theo thiết bị)
 *
 * Props: user (admin)
 */
export default function DamageReportPanel({ user }) {
  const [list, setList] = useState([]);
  const [history, setHistory] = useState([]);
  const [filterTb, setFilterTb] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [resSum, resHis] = await Promise.all([
        axios.get(`${API_BASE}/api/warehouse/condition-summary`),
        axios.get(`${API_BASE}/api/warehouse/damage-history/${filterTb}`),
      ]);
      setList(resSum.data || []);
      setHistory(resHis.data || []);
    } catch {
      toast.error("Lỗi tải dữ liệu tình trạng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(); /* eslint-disable-next-line */
  }, [filterTb]);

  const startEdit = (tb) => {
    setEditing({
      maloaitb: tb.maloaitb,
      tenloai: tb.tenloai,
      soluongtot: tb.soluongtot,
      soluonghong: tb.soluonghong,
      soluongmat: tb.soluongmat,
      vitri: tb.vitrikho || "",
      ghichu: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await axios.put(
        `${API_BASE}/api/warehouse/equipment/${editing.maloaitb}/condition`,
        {
          soluongtot: editing.soluongtot,
          soluonghong: editing.soluonghong,
          soluongmat: editing.soluongmat,
          vitri: editing.vitri || null,
          ghichu: editing.ghichu,
          nguoiThucHien: user?.maGV,
        },
      );
      toast.success("Đã cập nhật tình trạng thiết bị");
      setEditing(null);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi cập nhật");
    }
  };

  const labelEvent = (k) =>
    ({
      Hong: { label: "Báo hỏng", cls: "bg-warning text-dark" },
      Mat: { label: "Báo mất", cls: "bg-danger" },
      KiemKeHong: { label: "Kiểm kê (hỏng)", cls: "bg-warning text-dark" },
      KiemKeMat: { label: "Kiểm kê (mất)", cls: "bg-danger" },
    })[k] || { label: k, cls: "bg-secondary" };

  const totalGood = list.reduce(
    (s, t) => s + (parseInt(t.soluongtot, 10) || 0),
    0,
  );
  const totalBroken = list.reduce(
    (s, t) => s + (parseInt(t.soluonghong, 10) || 0),
    0,
  );
  const totalLost = list.reduce(
    (s, t) => s + (parseInt(t.soluongmat, 10) || 0),
    0,
  );

  const handleExportDamageReport = () => {
    if (!list || list.length === 0) {
      toast.info("Không có dữ liệu thiết bị!");
      return;
    }
    // Lọc ra những thiết bị có hỏng hoặc mất
    const damageList = list.filter(
      (tb) => parseInt(tb.soluonghong, 10) > 0 || parseInt(tb.soluongmat, 10) > 0
    );
    if (damageList.length === 0) {
      toast.info("Tất cả thiết bị đều đang trong tình trạng Tốt, không có báo cáo hỏng/mất!");
      return;
    }
    try {
      const dataToExport = damageList.map((tb, index) => ({
        "STT": index + 1,
        "Mã Thiết Bị": tb.maloaitb,
        "Tên Thiết Bị": tb.tenloai,
        "Số Lượng Tốt": tb.soluongtot,
        "Số Lượng Hỏng": tb.soluonghong,
        "Số Lượng Mất": tb.soluongmat,
        "Vị Trí": tb.vitrikho || "Chưa xác định"
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = [
        { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
      ];
      worksheet['!cols'] = wscols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "BaoHongMat");
      XLSX.writeFile(workbook, "Bao_Cao_Thiet_Bi_Hong_Mat.xlsx");
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      toast.error("Lỗi xuất file Excel!");
      console.error(error);
    }
  };

  return (
    <div>
      {/* Top stats */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-success shadow-sm">
            <div className="card-body py-3 text-center">
              <div className="text-muted small">Tổng đồ TỐT</div>
              <h3 className="text-success fw-bold mb-0">{totalGood}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-warning shadow-sm">
            <div className="card-body py-3 text-center">
              <div className="text-muted small">Tổng đồ HỎNG</div>
              <h3 className="text-warning fw-bold mb-0">{totalBroken}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-danger shadow-sm">
            <div className="card-body py-3 text-center">
              <div className="text-muted small">Tổng đồ MẤT</div>
              <h3 className="text-danger fw-bold mb-0">{totalLost}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-danger"></div>
        </div>
      ) : (
        <div className="row">
          {/* LEFT: condition table */}
          <div className="col-lg-7 mb-3">
            <div className="card shadow-sm border-warning">
              <div className="card-header bg-warning bg-opacity-25 fw-bold d-flex justify-content-between align-items-center">
                <span><i className="bi bi-clipboard-data me-2"></i>Tình trạng kho hiện tại</span>
                <button className="btn btn-sm btn-warning text-dark fw-bold" onClick={handleExportDamageReport} type="button">
                  <i className="bi bi-file-earmark-excel me-1"></i> Báo Cáo Hỏng
                </button>
              </div>
              <div className="card-body p-0">
                <div
                  className="table-responsive"
                  style={{ maxHeight: 480, overflowY: "auto" }}
                >
                  <table className="table table-hover m-0 align-middle">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Thiết bị</th>
                        <th className="text-center">Tốt</th>
                        <th className="text-center">Hỏng</th>
                        <th className="text-center">Mất</th>
                        <th className="text-center">Đang mượn</th>
                        <th>Vị trí</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((tb) => (
                        <tr
                          key={tb.maloaitb}
                          className={
                            parseInt(tb.soluonghong, 10) > 0
                              ? "table-warning"
                              : ""
                          }
                        >
                          <td>
                            <div className="fw-bold">{tb.tenloai}</div>
                            <small className="text-muted">
                              Mã: {tb.maloaitb}
                            </small>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success">
                              {tb.soluongtot}
                            </span>
                          </td>
                          <td className="text-center">
                            {tb.soluonghong > 0 ? (
                              <span className="badge bg-warning text-dark">
                                {tb.soluonghong}
                              </span>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td className="text-center">
                            {tb.soluongmat > 0 ? (
                              <span className="badge bg-danger">
                                {tb.soluongmat}
                              </span>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${tb.dangmuon > 0 ? "bg-info" : "bg-light text-muted"}`}
                            >
                              {tb.dangmuon}
                            </span>
                          </td>
                          <td>
                            <small>
                              {tb.vitrikho || <em className="text-muted">—</em>}
                            </small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => startEdit(tb)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {list.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-muted py-4"
                          >
                            Chưa có thiết bị
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: history */}
          <div className="col-lg-5 mb-3">
            <div className="card shadow-sm border-secondary">
              <div className="card-header bg-secondary bg-opacity-10 fw-bold d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-clock-history me-2"></i>Lịch sử hao mòn /
                  mất
                </span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={filterTb}
                  onChange={(e) => setFilterTb(e.target.value)}
                >
                  <option value="all">Toàn bộ thiết bị</option>
                  {list.map((t) => (
                    <option key={t.maloaitb} value={t.maloaitb}>
                      {t.tenloai}
                    </option>
                  ))}
                </select>
              </div>
              <div className="card-body p-0">
                <ul
                  className="list-group list-group-flush"
                  style={{ maxHeight: 480, overflowY: "auto" }}
                >
                  {history.length === 0 && (
                    <li className="list-group-item text-muted text-center py-4">
                      Chưa có sự kiện nào
                    </li>
                  )}
                  {history.map((h) => {
                    const ev = labelEvent(h.loaisukien);
                    return (
                      <li key={h.id} className="list-group-item py-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <span className={`badge ${ev.cls} me-2`}>
                              {ev.label}
                            </span>
                            <strong>{h.tenloai}</strong> ×{h.soluong}
                            {h.maphieu && (
                              <small className="text-muted ms-2">
                                Phiếu: {h.maphieu}
                              </small>
                            )}
                          </div>
                          <small className="text-muted">
                            {new Date(h.ngaytao).toLocaleString("vi-VN")}
                          </small>
                        </div>
                        {h.ghichu && (
                          <div className="small text-muted mt-1">
                            "{h.ghichu}"
                          </div>
                        )}
                        {h.tengv && (
                          <div className="small text-muted mt-1">
                            Bởi: {h.tengv}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa kiểm kê */}
      {editing && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1050 }}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header bg-warning bg-opacity-25">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-pencil-square me-2"></i>Cập nhật kiểm
                    kê: {editing.tenloai}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditing(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label small fw-bold text-success">
                        Số lượng Tốt
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control border-success"
                        value={editing.soluongtot}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            soluongtot: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold text-warning">
                        Số lượng Hỏng
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control border-warning"
                        value={editing.soluonghong}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            soluonghong: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold text-danger">
                        Số lượng Mất
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control border-danger"
                        value={editing.soluongmat}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            soluongmat: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-bold">
                      Vị trí kho
                    </label>
                    <input
                      className="form-control"
                      placeholder="Ví dụ: Tủ A2 - Phòng TH Lý"
                      value={editing.vitri}
                      onChange={(e) =>
                        setEditing({ ...editing, vitri: e.target.value })
                      }
                    />
                  </div>
                  <div className="mt-2">
                    <label className="form-label small fw-bold">
                      Ghi chú kiểm kê
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={editing.ghichu}
                      onChange={(e) =>
                        setEditing({ ...editing, ghichu: e.target.value })
                      }
                    />
                  </div>
                  <div className="alert alert-info py-2 mt-3 small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Tổng tồn kho mới = Tốt + Hỏng ={" "}
                    <strong>
                      {(editing.soluongtot || 0) + (editing.soluonghong || 0)}
                    </strong>
                    . Số đã mất sẽ trừ vào tổng số đã từng nhập.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditing(null)}
                  >
                    Hủy
                  </button>
                  <button
                    className="btn btn-warning fw-bold text-dark"
                    onClick={handleSaveEdit}
                  >
                    <i className="bi bi-check2 me-1"></i>Lưu kiểm kê
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
