import { Link } from "react-router-dom";
// Removed chart.js import

/**
 * ApprovalPanel — Tab Phê duyệt hàng loạt + Biểu đồ thống kê
 * Props:
 *   dsCho         — mảng phiếu chờ duyệt
 *   chartData     — dữ liệu biểu đồ { labels, datasets }
 *   selectedIds   — mảng ID đã chọn
 *   onSelectAll   — callback chọn tất cả
 *   onToggleCheck — callback(id) toggle 1 phiếu
 *   onBulkUpdate  — callback(trangThai, confirmMsg)
 *   onUpdateStatus— callback(maPhieu, hanhDong, loiNhan) cập nhật 1 phiếu
 */
export default function ApprovalPanel({
  dsCho,
  selectedIds,
  onSelectAll,
  onToggleCheck,
  onBulkUpdate,
  onUpdateStatus,
}) {
  return (
    <div className="row">
      <div className="col-12">
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
            <span>📋 Phiếu mượn chờ duyệt</span>
            {selectedIds.length > 0 && (
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-light text-success fw-bold me-1"
                  onClick={() =>
                    onBulkUpdate(
                      "DaDuyet",
                      `Duyệt ${selectedIds.length} phiếu đã chọn?`,
                    )
                  }
                >
                  ✔ Duyệt ({selectedIds.length})
                </button>
                <button
                  className="btn btn-sm btn-light text-danger fw-bold"
                  onClick={() =>
                    onBulkUpdate(
                      "TuChoi",
                      `Từ chối ${selectedIds.length} phiếu đã chọn?`,
                    )
                  }
                >
                  ✘ Từ chối ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover m-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-center" style={{ width: "40px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={
                          dsCho.length > 0 &&
                          selectedIds.length === dsCho.length
                        }
                        onChange={onSelectAll}
                      />
                    </th>
                    <th>Giáo viên</th>
                    <th>Bài dạy</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {dsCho.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        Tuyệt vời! Đã duyệt xong mọi yêu cầu.
                      </td>
                    </tr>
                  ) : (
                    dsCho.map((p) => (
                      <tr
                        key={p.maphieu}
                        className="align-middle"
                        style={{
                          backgroundColor: selectedIds.includes(p.maphieu)
                            ? "#e8f4f8"
                            : "transparent",
                        }}
                      >
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.includes(p.maphieu)}
                            onChange={() => onToggleCheck(p.maphieu)}
                          />
                        </td>
                        <td className="fw-bold text-primary text-nowrap">
                          {p.tengv}
                        </td>
                        <td>
                          <div>
                            {p.tenmon} - Lớp {p.malop}
                          </div>
                          <small className="text-muted">
                            Tiết {p.tiethoc} (
                            {new Date(p.ngayhoc).toLocaleDateString("vi-VN")})
                          </small>
                        </td>
                        <td className="text-nowrap">
                          <button
                            className="btn btn-success btn-sm me-1"
                            onClick={() =>
                              onUpdateStatus(
                                p.maphieu,
                                "DaDuyet",
                                "Duyệt phiếu này?",
                              )
                            }
                          >
                            ✔
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm me-1"
                            onClick={() =>
                              onUpdateStatus(p.maphieu, "TuChoi", "Từ chối?")
                            }
                          >
                            ✘
                          </button>
                          <Link
                            to={`/print/${p.maphieu}`}
                            target="_blank"
                            className="btn btn-sm btn-outline-dark fw-bold"
                          >
                            <i className="bi bi-printer"></i>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
