import React, { useState } from "react";
import ReturnDetailModal from "./ReturnDetailModal";

export default function HandoverPanel({
  user,
  dsKho,
  onUpdateStatus,
  onNhanTra,
  onRefreshAll,
  onRefreshEquip,
}) {
  const [returnPhieu, setReturnPhieu] = useState(null);

  const dsChoGiao = dsKho.filter((t) => t.trangthai === "DaDuyet");
  const dsDangMuon = dsKho.filter((t) => t.trangthai === "DangMuon");

  return (
    <div className="row">
      <div className="col-12 mb-4">
        <h5 className="fw-bold text-brand-700 mb-3 border-bottom pb-2">
          <i className="bi bi-truck me-2"></i> Giao / Nhận Thiết Bị
        </h5>
        <p className="text-muted small">
          Thực hiện giao đồ cho giáo viên (sau khi duyệt) và nhận lại đồ sau khi dạy xong.
        </p>
      </div>

      <div className="col-md-6">
        <div className="card shadow-sm border-warning mb-4">
          <div className="card-header bg-warning bg-opacity-25 text-warning-emphasis fw-bold border-warning">
            <i className="bi bi-box-arrow-up-right me-2"></i> Chờ xuất kho bàn giao
            <span className="badge bg-warning text-dark float-end rounded-pill">{dsChoGiao.length}</span>
          </div>
          <div className="card-body p-0">
            <ul className="list-group list-group-flush">
              {dsChoGiao.length === 0 && (
                <li className="list-group-item text-muted py-4 text-center">
                  <i className="bi bi-inbox fs-3 d-block mb-2 text-opacity-50"></i>
                  Không có thiết bị chờ giao.
                </li>
              )}
              {dsChoGiao.map((t) => (
                <li
                  key={t.maphieu}
                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                >
                  <div>
                    <strong className="text-primary">{t.tengv}</strong>{" "}
                    <span className="badge bg-light text-dark border ms-1">Lớp {t.malop}</span>
                    <div className="small text-muted mt-1">
                      Môn: {t.tenmon} &bull; Ngày: {new Date(t.ngayhoc).toLocaleDateString("vi-VN")} &bull; Tiết: {t.tiethoc}
                    </div>
                    <div className="small text-brand-700 fw-bold mt-1">
                      <i className="bi bi-tools"></i> {t.danhsachthietbi || "Không có thiết bị"}
                    </div>
                  </div>
                  <button
                    className="btn btn-warning fw-bold text-dark btn-sm rounded-3 shadow-sm"
                    onClick={() =>
                      onUpdateStatus(
                        t.maphieu,
                        "DangMuon",
                        "Xác nhận đã giao đồ cho giáo viên?",
                      )
                    }
                  >
                    Giao đồ <i className="bi bi-arrow-right"></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="card shadow-sm border-info mb-4">
          <div className="card-header bg-info bg-opacity-25 text-info-emphasis fw-bold border-info">
            <i className="bi bi-arrow-return-left me-2"></i> Đang cho mượn (Chờ trả)
            <span className="badge bg-info text-white float-end rounded-pill">{dsDangMuon.length}</span>
          </div>
          <div className="card-body p-0">
            <ul className="list-group list-group-flush">
              {dsDangMuon.length === 0 && (
                <li className="list-group-item text-muted py-4 text-center">
                  <i className="bi bi-check-circle fs-3 d-block mb-2 text-opacity-50"></i>
                  Tất cả đồ mượn đã được trả.
                </li>
              )}
              {dsDangMuon.map((t) => (
                <li
                  key={t.maphieu}
                  className="list-group-item d-flex justify-content-between align-items-center py-3 bg-light bg-opacity-50"
                >
                  <div>
                    <strong className="text-primary">{t.tengv}</strong>{" "}
                    <span className="badge bg-white text-dark border ms-1">Lớp {t.malop}</span>
                    <div className="small text-muted mt-1">
                      Môn: {t.tenmon} &bull; Ngày: {new Date(t.ngayhoc).toLocaleDateString("vi-VN")} &bull; Tiết: {t.tiethoc}
                    </div>
                    <div className="small text-brand-700 fw-bold mt-1">
                      <i className="bi bi-tools"></i> {t.danhsachthietbi || "Không có thiết bị"}
                    </div>
                  </div>
                  <div className="btn-group shadow-sm rounded-3">
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => onNhanTra(t.maphieu)}
                      title="Nhận trả nhanh (đồ tốt nguyên)"
                    >
                      <i className="bi bi-check-circle"></i> Trả tốt
                    </button>
                    <button
                      className="btn btn-info btn-sm fw-bold text-white"
                      onClick={() => setReturnPhieu(t.maphieu)}
                      title="Nhận trả chi tiết: Tốt / Hỏng / Mất"
                    >
                      <i className="bi bi-clipboard-check"></i> Chi tiết
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal nhận trả chi tiết */}
      <ReturnDetailModal
        show={!!returnPhieu}
        maPhieu={returnPhieu}
        user={user}
        onClose={() => setReturnPhieu(null)}
        onSuccess={() => {
          onRefreshAll?.();
          onRefreshEquip?.();
        }}
      />
    </div>
  );
}
