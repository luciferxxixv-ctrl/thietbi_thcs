import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../shared/constants";

/**
 * ReturnDetailModal — Modal nhận trả chi tiết.
 * Cho phép admin nhập số lượng Tốt / Hỏng / Mất + ghi chú khi giáo viên trả thiết bị.
 *
 * Props:
 *   show      — boolean
 *   maPhieu   — string (mã phiếu cần nhận trả)
 *   user      — object (admin đang đăng nhập)
 *   onClose   — callback
 *   onSuccess — callback sau khi trả thành công
 */
export default function ReturnDetailModal({
  show,
  maPhieu,
  user,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phieu, setPhieu] = useState(null);
  const [items, setItems] = useState([]);
  const [ghiChu, setGhiChu] = useState("");

  useEffect(() => {
    if (!show || !maPhieu) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/api/warehouse/borrow-detail/${maPhieu}`,
        );
        if (cancelled) return;
        setPhieu(res.data.phieu);
        setItems(
          (res.data.items || []).map((it) => ({
            ...it,
            soluongtra: parseInt(it.soluongdk, 10) || 0,
            soluonghong: 0,
            soluongmat: 0,
            ghichu: "",
          })),
        );
        setGhiChu("");
      } catch (err) {
        toast.error(err.response?.data?.msg || "Không lấy được chi tiết phiếu");
        onClose?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show, maPhieu]);

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const dk = parseInt(it.soluongdk, 10) || 0;
        const next = { ...it, [field]: Math.max(parseInt(value, 10) || 0, 0) };
        const hong = parseInt(next.soluonghong, 10) || 0;
        const mat = parseInt(next.soluongmat, 10) || 0;
        const tra = parseInt(next.soluongtra, 10) || 0;

        // Đảm bảo H + M không vượt quá DK
        if (field === "soluonghong" && hong + mat > dk) {
          next.soluonghong = Math.max(dk - mat, 0);
        }
        if (field === "soluongmat" && hong + mat > dk) {
          next.soluongmat = Math.max(dk - hong, 0);
        }
        // Tự động cân bằng SoLuongTra = DK - Hong - Mat khi user chỉnh Hỏng/Mất
        if (field === "soluonghong" || field === "soluongmat") {
          next.soluongtra = Math.max(
            dk -
              (parseInt(next.soluonghong, 10) || 0) -
              (parseInt(next.soluongmat, 10) || 0),
            0,
          );
        } else if (field === "soluongtra" && tra > dk) {
          next.soluongtra = dk;
        }
        return next;
      }),
    );
  };

  const handleQuickAllGood = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        soluongtra: parseInt(it.soluongdk, 10) || 0,
        soluonghong: 0,
        soluongmat: 0,
      })),
    );
  };

  const totalHong = items.reduce(
    (s, it) => s + (parseInt(it.soluonghong, 10) || 0),
    0,
  );
  const totalMat = items.reduce(
    (s, it) => s + (parseInt(it.soluongmat, 10) || 0),
    0,
  );
  const allValid = items.every((it) => {
    const dk = parseInt(it.soluongdk, 10) || 0;
    const tra = parseInt(it.soluongtra, 10) || 0;
    const hong = parseInt(it.soluonghong, 10) || 0;
    const mat = parseInt(it.soluongmat, 10) || 0;
    return tra + hong + mat === dk;
  });

  const handleSubmit = async () => {
    if (!allValid) {
      toast.warn(
        "Tổng (Tốt + Hỏng + Mất) phải bằng số mượn ban đầu cho mọi dòng.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/warehouse/return-detail/${maPhieu}`,
        {
          nguoiNhan: user?.maGV,
          ghiChu,
          items: items.map((it) => ({
            maloaitb: it.maloaitb,
            soluongtra: parseInt(it.soluongtra, 10) || 0,
            soluonghong: parseInt(it.soluonghong, 10) || 0,
            soluongmat: parseInt(it.soluongmat, 10) || 0,
            ghichu: it.ghichu || null,
          })),
        },
      );
      toast.success(res.data.msg || "Đã nhận trả thành công");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi nhận trả");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

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
          className="modal-dialog modal-xl modal-dialog-scrollable"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header bg-success bg-opacity-25 border-bottom">
              <div>
                <h5 className="modal-title fw-bold mb-1">
                  <i className="bi bi-check2-circle me-2"></i>Nhận trả thiết bị
                  — kiểm tra tình trạng
                </h5>
                {phieu && (
                  <small className="text-muted">
                    Phiếu <strong>{phieu.maphieu}</strong> · GV{" "}
                    <strong>{phieu.tengv}</strong>
                    &nbsp;· Lớp <strong>{phieu.malop}</strong> · Môn{" "}
                    <strong>{phieu.tenmon}</strong>
                    &nbsp;· Tiết {phieu.tiethoc} ngày{" "}
                    {new Date(phieu.ngayhoc).toLocaleDateString("vi-VN")}
                  </small>
                )}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={submitting}
              ></button>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success"></div>
                </div>
              ) : (
                <>
                  <div className="alert alert-info py-2 small d-flex align-items-center mb-3">
                    <i className="bi bi-info-circle me-2 fs-5"></i>
                    <div>
                      Đối với mỗi thiết bị: nhập <strong>Tốt</strong> (trả
                      nguyên), <strong>Hỏng</strong> (vẫn ở kho nhưng cần bảo
                      trì), <strong>Mất</strong> (giảm tồn kho thật). Hệ thống
                      sẽ tự log vào lịch sử hao mòn.
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">
                      <i className="bi bi-list-ol me-1"></i>
                      {items.length} dòng thiết bị
                    </span>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={handleQuickAllGood}
                    >
                      <i className="bi bi-magic me-1"></i>Đánh dấu trả tốt toàn
                      bộ
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Thiết bị</th>
                          <th className="text-center" style={{ width: 90 }}>
                            Mượn
                          </th>
                          <th
                            className="text-center text-success"
                            style={{ width: 110 }}
                          >
                            Tốt
                          </th>
                          <th
                            className="text-center text-warning"
                            style={{ width: 110 }}
                          >
                            Hỏng
                          </th>
                          <th
                            className="text-center text-danger"
                            style={{ width: 110 }}
                          >
                            Mất
                          </th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => {
                          const dk = parseInt(it.soluongdk, 10) || 0;
                          const tra = parseInt(it.soluongtra, 10) || 0;
                          const hong = parseInt(it.soluonghong, 10) || 0;
                          const mat = parseInt(it.soluongmat, 10) || 0;
                          const sum = tra + hong + mat;
                          const ok = sum === dk;
                          return (
                            <tr
                              key={it.maloaitb}
                              className={ok ? "" : "table-warning"}
                            >
                              <td>
                                <div className="d-flex align-items-center">
                                  {it.hinhanh && (
                                    <img
                                      src={
                                        it.hinhanh.startsWith("http")
                                          ? it.hinhanh
                                          : `${API_BASE}/uploads/${it.hinhanh}`
                                      }
                                      alt=""
                                      style={{
                                        width: 36,
                                        height: 36,
                                        objectFit: "cover",
                                        borderRadius: 4,
                                      }}
                                      className="me-2"
                                    />
                                  )}
                                  <div>
                                    <div className="fw-bold">{it.tenloai}</div>
                                    <small className="text-muted">
                                      Mã: {it.maloaitb}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center fw-bold">
                                {dk} {it.donvitinh}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={dk}
                                  value={tra}
                                  onChange={(e) =>
                                    updateItem(
                                      idx,
                                      "soluongtra",
                                      e.target.value,
                                    )
                                  }
                                  className="form-control form-control-sm text-center border-success"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={dk}
                                  value={hong}
                                  onChange={(e) =>
                                    updateItem(
                                      idx,
                                      "soluonghong",
                                      e.target.value,
                                    )
                                  }
                                  className={`form-control form-control-sm text-center ${hong > 0 ? "border-warning bg-warning bg-opacity-10" : ""}`}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max={dk}
                                  value={mat}
                                  onChange={(e) =>
                                    updateItem(
                                      idx,
                                      "soluongmat",
                                      e.target.value,
                                    )
                                  }
                                  className={`form-control form-control-sm text-center ${mat > 0 ? "border-danger bg-danger bg-opacity-10" : ""}`}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  placeholder="Lý do hỏng/mất (nếu có)"
                                  value={it.ghichu}
                                  onChange={(e) =>
                                    setItems((prev) =>
                                      prev.map((p, i) =>
                                        i === idx
                                          ? { ...p, ghichu: e.target.value }
                                          : p,
                                      ),
                                    )
                                  }
                                  className="form-control form-control-sm"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <th colSpan="3" className="text-end">
                            Tổng cộng:
                          </th>
                          <th className="text-center text-warning">
                            {totalHong}
                          </th>
                          <th className="text-center text-danger">
                            {totalMat}
                          </th>
                          <th></th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-3">
                    <label className="form-label fw-bold small">
                      Ghi chú chung (cho cả phiếu):
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={ghiChu}
                      onChange={(e) => setGhiChu(e.target.value)}
                      placeholder="VD: GV trả đầy đủ, không có vấn đề..."
                    />
                  </div>

                  {!allValid && (
                    <div className="alert alert-danger py-2 mt-3 mb-0 small">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Có dòng tổng (Tốt + Hỏng + Mất) chưa khớp với số mượn. Vui
                      lòng kiểm tra lại.
                    </div>
                  )}
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
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-success fw-bold"
                disabled={submitting || loading || !allValid}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-square me-2"></i>Xác nhận nhận
                    trả
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
