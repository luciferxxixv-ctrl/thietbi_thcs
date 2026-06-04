import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_BASE } from "../shared/constants";
import QRScannerModal from "./QRScannerModal";
import DamageReportPanel from "./DamageReportPanel";
import QRPrintSheet from "./QRPrintSheet";

/**
 * WarehousePanel — Tab Kho: Upload TKB/PPCT, CRUD Thiết bị, Giao nhận
 * Props:
 *   dsKho           — mảng phiếu giao nhận
 *   dsThietBi       — mảng thiết bị kho
 *   onUpdateStatus  — callback(maPhieu, hanhDong, loiNhan) cho giao đồ
 *   onNhanTra       — callback(maPhieu) nhận trả
 *   onRefreshAll    — callback reload tất cả dữ liệu
 *   onRefreshEquip  — callback reload thiết bị
 */
export default function WarehousePanel({
  user,
  dsKho,
  dsThietBi,
  onRefreshAll,
  onRefreshEquip,
}) {
  const [newEquipment, setNewEquipment] = useState({
    tenloai: "",
    donvitinh: "Cái",
    tongtonkho: 1,
  });
  const [eqImage, setEqImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);

  // Sub-tab khu vực kho nâng cao
  const [section, setSection] = useState("thietbi"); // thietbi | tinhtrang | qr

  // Modal quét QR
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("tenloai", newEquipment.tenloai);
      formData.append("donvitinh", newEquipment.donvitinh);
      formData.append("tongtonkho", newEquipment.tongtonkho);
      if (eqImage) formData.append("image", eqImage);

      if (editingId) {
        await axios.put(`${API_BASE}/api/equipment/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.info("🔄 Cập nhật thiết bị thành công!");
      } else {
        await axios.post(`${API_BASE}/api/equipment`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("✅ Thêm thiết bị mới thành công!");
      }

      setNewEquipment({ tenloai: "", donvitinh: "Cái", tongtonkho: 1 });
      setEqImage(null);
      setEditingId(null);
      onRefreshEquip();
    } catch (err) {
      toast.error("Lỗi lưu thiết bị");
    }
  };

  const startEdit = (tb) => {
    setEditingId(tb.maloaitb);
    setNewEquipment({
      tenloai: tb.tenloai,
      donvitinh: tb.donvitinh,
      tongtonkho: tb.tongtonkho,
    });
    setEqImage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewEquipment({ tenloai: "", donvitinh: "Cái", tongtonkho: 1 });
    setEqImage(null);
  };

  const handleExportInventory = () => {
    if (!dsThietBi || dsThietBi.length === 0) {
      toast.info("Không có dữ liệu thiết bị để xuất!");
      return;
    }

    try {
      const dataToExport = dsThietBi.map((tb, index) => ({
        "STT": index + 1,
        "Mã Thiết Bị": tb.maloaitb,
        "Tên Thiết Bị": tb.tenloai,
        "Số Lượng Tồn": tb.tongtonkho,
        "Đơn Vị Tính": tb.donvitinh
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Auto-size columns
      const wscols = [
        { wch: 5 }, // STT
        { wch: 15 }, // Mã Thiết Bị
        { wch: 40 }, // Tên Thiết Bị
        { wch: 15 }, // Số Lượng Tồn
        { wch: 15 }  // Đơn Vị Tính
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "TonKho");
      XLSX.writeFile(workbook, "Bao_Cao_Ton_Kho.xlsx");
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      toast.error("Lỗi xuất file Excel!");
      console.error("Export error:", error);
    }
  };

  return (
    <div className="row">
      {/* Sub-Tabs điều hướng */}
      <div className="col-12 mb-3">
        <div className="card shadow-sm">
          <div className="card-body p-2 d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <div className="btn-group" role="group">
              {[
                {
                  key: "thietbi",
                  icon: "bi-box-seam",
                  label: "Danh sách Thiết bị",
                },
                {
                  key: "tinhtrang",
                  icon: "bi-clipboard-data",
                  label: "Tình trạng & Hao mòn",
                },
                { key: "qr", icon: "bi-qr-code", label: "QR Code" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`btn ${section === t.key ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => setSection(t.key)}
                  type="button"
                >
                  <i className={`bi ${t.icon} me-1`}></i>
                  {t.label}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowQRScanner(true)}
              type="button"
            >
              <i className="bi bi-qr-code-scan me-1"></i>Quét QR (Camera)
            </button>
          </div>
        </div>
      </div>

      {section === "tinhtrang" && (
        <div className="col-12">
          <DamageReportPanel user={user} />
        </div>
      )}

      {section === "qr" && (
        <div className="col-12">
          <QRPrintSheet />
        </div>
      )}

      {section !== "thietbi" ? null : (
        <>
          {/* CRUD THIẾT BỊ */}
          <div className="col-12 mb-4">
            <div className="card shadow-sm border-success">
              <div className="card-header bg-success text-white fw-bold d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-box-seam"></i> Quản Lý Danh Mục Thiết Bị Kho
                </div>
                <button
                  className="btn btn-sm btn-light text-success fw-bold"
                  onClick={handleExportInventory}
                  type="button"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Xuất Excel
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-5 mb-3 border-end">
                    <h6 className="fw-bold text-success mb-3">
                      {editingId
                        ? "Sửa Chữa Đồ Thực Hành"
                        : "Thêm Đồ Thực Hành Mới"}
                    </h6>
                    <form onSubmit={handleAddEquipment}>
                      <div className="mb-2">
                        <label className="form-label small fw-bold">
                          Tên đồ dùng
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={newEquipment.tenloai}
                          onChange={(e) =>
                            setNewEquipment({
                              ...newEquipment,
                              tenloai: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="row mb-2">
                        <div className="col-6">
                          <label className="form-label small fw-bold">
                            Số lượng (Cái/Chiếc)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={newEquipment.tongtonkho}
                            onChange={(e) =>
                              setNewEquipment({
                                ...newEquipment,
                                tongtonkho: parseInt(e.target.value),
                              })
                            }
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-bold">
                            Đơn vị
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newEquipment.donvitinh}
                            onChange={(e) =>
                              setNewEquipment({
                                ...newEquipment,
                                donvitinh: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">
                          Tải ảnh lên {editingId && "(Bỏ trống nếu giữ ảnh cũ)"}
                        </label>
                        <input
                          type="file"
                          className="form-control border-success"
                          accept="image/*"
                          onChange={(e) => setEqImage(e.target.files[0])}
                        />
                      </div>
                      <div className="d-flex">
                        <button
                          type="submit"
                          className={`btn ${editingId ? "btn-warning" : "btn-success"} w-100 fw-bold me-2`}
                        >
                          {editingId ? "Cập Nhật Thông Tin" : "Lưu Thông Tin"}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            className="btn btn-secondary w-50 fw-bold"
                            onClick={cancelEdit}
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="col-md-7">
                    <h6 className="fw-bold text-dark mb-3">
                      Danh Sách Trạng Thái Kho
                    </h6>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      <table className="table table-hover m-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Hình ảnh</th>
                            <th>Tên thiết bị</th>
                            <th>Số lượng tồn</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dsThietBi.map((tb) => (
                            <tr key={tb.maloaitb} className="align-middle">
                              <td>
                                {tb.hinhanh ? (
                                  <img
                                    src={`${API_BASE}/uploads/${tb.hinhanh}`}
                                    alt={tb.tenloai}
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      objectFit: "cover",
                                      borderRadius: "5px",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="bg-light text-muted d-flex align-items-center justify-content-center"
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      borderRadius: "5px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    No img
                                  </div>
                                )}
                              </td>
                              <td className="fw-bold text-primary">
                                {tb.tenloai}
                                <br />
                                <small className="text-muted text-nowrap">
                                  Mã: {tb.maloaitb}
                                </small>
                              </td>
                              <td>
                                <span className="badge bg-success fs-6">
                                  {tb.tongtonkho} {tb.donvitinh}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => startEdit(tb)}
                                >
                                  <i className="bi bi-pencil-square"></i> Sửa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {/* Modal Quét QR */}
      <QRScannerModal
        show={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onResult={() => {
          onRefreshAll?.();
        }}
      />
    </div>
  );
}
