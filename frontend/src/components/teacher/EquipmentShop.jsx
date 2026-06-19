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
      {dsThietBi.map((tb) => (
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
              <small className="text-muted d-block mb-3">
                Tồn kho:{" "}
                <strong
                  className={tb.tongtonkho > 0 ? "text-success" : "text-danger"}
                >
                  {tb.tongtonkho}
                </strong>{" "}
                {tb.donvitinh}
              </small>
              <div className="mt-auto">
                <button
                  className="btn btn-outline-primary btn-sm w-100 fw-bold"
                  disabled={tb.tongtonkho <= 0}
                  onClick={() => onSelectItem(tb)}
                >
                  <i className="bi bi-cart-plus"></i> Chọn Mượn
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
