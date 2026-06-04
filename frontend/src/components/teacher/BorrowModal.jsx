import { API_BASE } from "../shared/constants";

/**
 * BorrowModal — Modal mượn trực tiếp từ Kho Đồ
 * Props:
 *   show          — boolean
 *   onClose       — callback đóng
 *   muonItem      — thiết bị đang mượn { maloaitb, tenloai, tongtonkho }
 *   lichDay       — mảng lịch dạy (để chọn bài gắn)
 *   onSubmit      — callback(matkb, maLoaiTB, soLuong)
 */
import { useState, useEffect } from "react";

export default function BorrowModal({
  show,
  onClose,
  muonItem,
  lichDay,
  onSubmit,
}) {
  const [matkb, setMatkb] = useState("");
  const [soLuong, setSoLuong] = useState(1);

  useEffect(() => {
    if (show && lichDay.length > 0) {
      setMatkb(lichDay[0].matkb);
      setSoLuong(1);
    }
  }, [show, lichDay]);

  if (!show || !muonItem) return null;

  const handleSubmit = () => {
    onSubmit(matkb, muonItem.maloaitb, soLuong);
  };

  return (
    <>
      <div className="modal-backdrop show opacity-50"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-danger text-white border-0">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-cart-check me-2"></i> Mượn:{" "}
                {muonItem.tenloai}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body bg-light">
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark">
                  Gắn thiết bị này cho bài dạy nào?
                </label>
                <select
                  className="form-select"
                  value={matkb}
                  onChange={(e) => setMatkb(parseInt(e.target.value))}
                >
                  {lichDay.length === 0 ? (
                    <option value="">Bạn không có bài dạy nào sắp tới!</option>
                  ) : null}
                  {lichDay.map((t) => (
                    <option key={t.matkb} value={t.matkb}>
                      Tiết {t.tiethoc} - Lớp {t.malop} ({t.tenbaihoc}) - Dạy
                      ngày {new Date(t.ngayhoc).toLocaleDateString("vi-VN")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark">
                  Số lượng yêu cầu (Tồn: {muonItem.tongtonkho})
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={soLuong}
                  min="1"
                  max={muonItem.tongtonkho}
                  onChange={(e) => setSoLuong(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="modal-footer border-0 bg-light">
              <button className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button
                className="btn btn-danger fw-bold px-4"
                onClick={handleSubmit}
                disabled={!matkb}
              >
                Xác Nhận Mượn
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
