import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./constants";

/**
 * ConflictInspector — gọi API /api/warehouse/check-conflict để kiểm tra xung đột
 * tồn kho cho danh sách kế hoạch trước khi gửi duyệt.
 *
 * Props:
 *   plans       — [{ matkb, items: [{ maloaitb, soluong }] }, ...]
 *   excludeMaPhieuTuan? — bỏ qua phiếu tuần đang chỉnh sửa (tránh self-conflict)
 *   onResult?   — callback({ hasConflict, conflicts })
 *   compact?    — chế độ gọn (chỉ banner, không liệt kê)
 *   autoCheck?  — tự động chạy khi mount (default true)
 */
export default function ConflictInspector({
  plans = [],
  excludeMaPhieuTuan = null,
  onResult,
  compact = false,
  autoCheck = true,
}) {
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(null);

  const runCheck = async () => {
    if (!plans || plans.length === 0) {
      setConflicts([]);
      setChecked(true);
      onResult?.({ hasConflict: false, conflicts: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/api/warehouse/check-conflict`, {
        plans,
        excludeMaPhieuTuan,
      });
      const data = res.data || {};
      const list = data.conflicts || [];
      setConflicts(list);
      setChecked(true);
      onResult?.({ hasConflict: list.length > 0, conflicts: list });
    } catch (err) {
      setError(err.response?.data?.msg || "Không kiểm tra được xung đột");
      setChecked(true);
      onResult?.({ hasConflict: false, conflicts: [], error: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoCheck) runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(plans), excludeMaPhieuTuan, autoCheck]);

  if (loading) {
    return (
      <div className="alert alert-secondary py-2 d-flex align-items-center mb-3">
        <span className="spinner-border spinner-border-sm me-2"></span>
        Đang kiểm tra xung đột tồn kho…
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning py-2 mb-3">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button
          className="btn btn-sm btn-outline-warning ms-2"
          onClick={runCheck}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!checked) return null;

  if (conflicts.length === 0) {
    return (
      <div className="alert alert-success py-2 mb-3 d-flex align-items-center">
        <i className="bi bi-shield-check fs-5 me-2"></i>
        <div>
          <strong>Không có xung đột.</strong> Toàn bộ thiết bị trong danh sách
          đều còn đủ trong kho ở các tiết tương ứng.
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="alert alert-danger py-2 mb-3 d-flex align-items-center">
        <i className="bi bi-exclamation-octagon fs-5 me-2"></i>
        <div>
          <strong>Có {conflicts.length} xung đột tồn kho!</strong> Vui lòng giảm
          số lượng hoặc chọn tiết khác.
        </div>
      </div>
    );
  }

  return (
    <div className="alert alert-danger mb-3">
      <div className="d-flex align-items-start">
        <i className="bi bi-exclamation-octagon fs-3 me-3"></i>
        <div className="flex-grow-1">
          <h6 className="fw-bold mb-2">
            Phát hiện {conflicts.length} vấn đề thiết bị / tiết
          </h6>
          <small className="d-block mb-2 text-dark">
            {conflicts.some((c) => c.lyDo === "het_kho")
              ? "Một số thiết bị hiện không còn cái nào dùng tốt trong kho (tồn dùng tốt = 0). Vui lòng liên hệ Admin bổ sung số lượng, hoặc chọn thiết bị khác."
              : "Một số thiết bị đã bị giáo viên khác giữ chỗ ở cùng tiết. Bạn cần giảm số lượng, chọn thiết bị thay thế, hoặc đổi ngày dạy trước khi gửi duyệt."}
          </small>
          <div className="table-responsive">
            <table className="table table-sm table-bordered bg-white mb-0">
              <thead className="table-danger">
                <tr>
                  <th>Ngày</th>
                  <th>Tiết</th>
                  <th>Lớp / Môn</th>
                  <th>Thiết bị</th>
                  <th className="text-center">Yêu cầu</th>
                  <th className="text-center">Còn lại</th>
                  <th>Lý do</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((c, idx) => {
                  const ngay = new Date(c.ngayhoc).toLocaleDateString("vi-VN");
                  let lyDoText;
                  if (c.lyDo === "het_kho")
                    lyDoText = "Kho hết hàng dùng tốt (tồn 0)";
                  else if (c.lyDo === "khong_du")
                    lyDoText = "Yêu cầu vượt số lượng có trong kho";
                  else
                    lyDoText = c.nguoidagiu
                      ? `Đã giữ bởi: ${c.nguoidagiu}`
                      : "Đã có người giữ chỗ";
                  return (
                    <tr key={idx}>
                      <td>{ngay}</td>
                      <td className="text-center">{c.tiethoc}</td>
                      <td>
                        <span className="text-primary fw-semibold">
                          {c.malop}
                        </span>{" "}
                        · <span className="text-muted small">{c.tenmon}</span>
                      </td>
                      <td className="fw-bold">{c.tenloai}</td>
                      <td className="text-center text-danger fw-bold">
                        {c.yeucau}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${c.conlai > 0 ? "bg-warning text-dark" : "bg-secondary"}`}
                        >
                          {c.conlai}/{c.soluongtot}
                        </span>
                      </td>
                      <td
                        className={`small ${c.lyDo === "het_kho" ? "text-danger fw-semibold" : "text-muted"}`}
                      >
                        {lyDoText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
