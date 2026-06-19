import { Link } from "react-router-dom";
import { API_BASE } from "../shared/constants";

/**
 * EquipmentShop — Tab Kho Đồ (Card Grid) cho Giáo viên
 * Props:
 *   dsThietBi    — mảng thiết bị [{ maloaitb, tenloai, tongtonkho, donvitinh, hinhanh }]
 *   onSelectItem — callback(tb) khi bấm "Chọn Mượn"
 */
export default function EquipmentShop({ dsThietBi, onSelectItem }) {
  return (
    <div className="row g-3">
      {dsThietBi.map((tb) => {
        const dangMuon = Number(tb.dangmuon) || 0;
        // "Còn lại" dựa trên số lượng DÙNG TỐT (soluongtot) trừ đi số đang cho mượn,
        // để khớp đúng với logic cho mượn (không hiển thị mượn được khi thực tế không mượn được).
        const dungTot = Number(tb.soluongtot ?? tb.tongtonkho ?? 0);
        const conLai = Math.max(0, dungTot - dangMuon);
        return (
        <div key={tb.maloaitb} className="col-6 col-md-4 col-lg-3">
          <div className="card h-100 shadow-sm border-0">
            {tb.hinhanh ? (
              <img
                src={
                  tb.hinhanh.startsWith("http")
                    ? tb.hinhanh
                    : `${API_BASE}/uploads/${tb.hinhanh}`
                }
                className="card-img-top"
                alt={tb.tenloai}
                style={{ height: "150px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="card-img-top bg-light d-flex align-items-center justify-content-center text-muted"
                style={{ height: "150px" }}
              >
                <i className="bi bi-image fs-1"></i>
              </div>
            )}
            <div className="card-body p-3 d-flex flex-column">
              <h6 className="card-title fw-bold text-dark mb-1">
                {tb.tenloai}
              </h6>
              <small className="text-muted d-block mb-1">
                Còn lại:{" "}
                <strong className={conLai > 0 ? "text-success" : "text-danger"}>
                  {conLai}
                </strong>
                <span className="text-muted">/{tb.tongtonkho}</span>{" "}
                {tb.donvitinh || "Cái"}
              </small>
              {dangMuon > 0 && (
                <small className="d-block mb-3 text-info">
                  <i className="bi bi-arrow-up-right-circle"></i> Đang cho mượn:{" "}
                  <strong>{dangMuon}</strong>
                </small>
              )}
              <div className="mt-auto">
                <button
                  className="btn btn-outline-primary btn-sm w-100 fw-bold"
                  disabled={conLai <= 0}
                  onClick={() => onSelectItem(tb)}
                >
                  <i className="bi bi-cart-plus"></i> Chọn Mượn
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
