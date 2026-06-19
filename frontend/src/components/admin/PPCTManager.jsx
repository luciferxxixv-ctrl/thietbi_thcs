import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { API_BASE } from "../shared/constants";

const PPCTManager = ({ subject, onBack }) => {
  const [ppctList, setPpctList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ tietthu: "", tenbaihoc: "", loaiphongyeucau: "" });
  const [editingId, setEditingId] = useState(null);

  // Equipment selection state
  const [showEqModal, setShowEqModal] = useState(false);
  const [selectedPpct, setSelectedPpct] = useState(null);
  const [allEquipments, setAllEquipments] = useState([]);
  const [lessonEquipments, setLessonEquipments] = useState([]); // [{ maloaitb, soluong }]
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPpct();
    fetchEquipments();
  }, [subject.mamon]);

  const fetchPpct = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/ppct/subject/${subject.mamon}`);
      setPpctList(res.data);
    } catch (err) {
      toast.error("Lỗi tải PPCT");
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/equipment`);
      setAllEquipments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tenbaihoc) return toast.warning("Nhập tên bài học!");
    
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/ppct/${editingId}`, formData);
        toast.success("Cập nhật bài học thành công!");
      } else {
        await axios.post(`${API_BASE}/api/ppct`, { ...formData, mamon: subject.mamon });
        toast.success("Thêm bài học thành công!");
      }
      setShowModal(false);
      fetchPpct();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi hệ thống");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này? Mọi thiết bị gắn kèm sẽ bị xóa.")) return;
    try {
      await axios.delete(`${API_BASE}/api/ppct/${id}`);
      toast.success("Đã xóa bài học");
      fetchPpct();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi khi xóa");
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ tietthu: "", tenbaihoc: "", loaiphongyeucau: "" });
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditingId(lesson.mappct);
    setFormData({ tietthu: lesson.tietthu || "", tenbaihoc: lesson.tenbaihoc, loaiphongyeucau: lesson.loaiphongyeucau || "" });
    setShowModal(true);
  };

  // --- Equipment Config ---
  const openEquipmentModal = async (lesson) => {
    setSelectedPpct(lesson);
    setLessonEquipments([]);
    setShowEqModal(true);
    try {
      const res = await axios.get(`${API_BASE}/api/ppct/${lesson.mappct}/equipment`);
      const mapped = res.data.map(item => ({ maloaitb: item.maloaitb, soluong: item.soluongdexuat }));
      setLessonEquipments(mapped);
    } catch (err) {
      toast.error("Lỗi lấy danh sách thiết bị hiện tại");
    }
  };

  const handleAddEq = (e) => {
    const maloaitb = e.target.value;
    if (!maloaitb) return;
    if (lessonEquipments.find(q => q.maloaitb === maloaitb)) {
      e.target.value = "";
      return toast.warning("Thiết bị này đã được thêm!");
    }
    setLessonEquipments([...lessonEquipments, { maloaitb, soluong: 1 }]);
    e.target.value = "";
  };

  const updateEqQuantity = (maloaitb, quantity) => {
    const val = parseInt(quantity);
    if (val < 1) return;
    setLessonEquipments(lessonEquipments.map(eq => eq.maloaitb === maloaitb ? { ...eq, soluong: val } : eq));
  };

  const removeEq = (maloaitb) => {
    setLessonEquipments(lessonEquipments.filter(eq => eq.maloaitb !== maloaitb));
  };

  const saveEquipments = async () => {
    try {
      await axios.post(`${API_BASE}/api/ppct/${selectedPpct.mappct}/equipment`, { equipments: lessonEquipments });
      toast.success("Lưu thiết bị gợi ý thành công!");
      setShowEqModal(false);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi lưu thiết bị");
    }
  };

  const handleExportExcel = async () => {
    if (ppctList.length === 0) return toast.warning("Chưa có bài học để xuất!");
    setExporting(true);
    try {
      // Lấy thiết bị gợi ý cho từng bài học (song song)
      const eqResults = await Promise.all(
        ppctList.map((p) =>
          axios
            .get(`${API_BASE}/api/ppct/${p.mappct}/equipment`)
            .then((r) => r.data)
            .catch(() => []),
        ),
      );

      const data = ppctList.map((p, i) => {
        const eqStr = (eqResults[i] || [])
          .map((eq) => `${eq.maloaitb}:${eq.soluongdexuat}`)
          .join(", ");
        return {
          "Mã PPCT": p.mappct,
          "Mã Môn": p.mamon || subject.mamon,
          "Tuần": p.tuan || "",
          "Tiết": p.tietthu || "",
          "Tên Bài Học": p.tenbaihoc || "",
          "Loại Phòng": p.loaiphongyeucau || "",
          "Mã Thiết Bị": eqStr,
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
        { wch: 50 },
        { wch: 28 },
        { wch: 30 },
      ];
      const wb = XLSX.utils.book_new();
      const safeName = String(subject.mamon).replace(/[^a-zA-Z0-9]/g, "_");
      XLSX.utils.book_append_sheet(wb, ws, `PPCT_${safeName}`.substring(0, 31));
      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `KeHoach_${safeName}_${today}.xlsx`);
      toast.success(`Đã xuất ${ppctList.length} bài học ra Excel!`);
    } catch (err) {
      toast.error("Lỗi khi xuất Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 animate-fade-in">
      <div className="card-header bg-white border-0 py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center">
          <button className="btn btn-light btn-sm me-3 shadow-sm rounded-circle" onClick={onBack} title="Quay lại">
            <i className="bi bi-arrow-left"></i>
          </button>
          <h5 className="mb-0 fw-bold">
            Kế Hoạch Môn: <span className="text-primary">{subject.tenmon}</span> <span className="text-muted fs-6">({subject.mamon})</span>
          </h5>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success shadow-sm" onClick={handleExportExcel} disabled={exporting}>
            {exporting ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Đang xuất...</>
            ) : (
              <><i className="bi bi-file-earmark-excel me-2"></i>Xuất Excel</>
            )}
          </button>
          <button className="btn btn-primary shadow-sm" onClick={openAdd}>
            <i className="bi bi-plus-lg me-2"></i>Thêm Bài Học Mới
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4" style={{ width: '80px' }}>Tiết</th>
                <th>Tên Bài Học</th>
                <th>Phòng Yêu Cầu</th>
                <th className="text-end pe-4" style={{ width: '250px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>
              ) : ppctList.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-5 text-muted">Chưa có bài học nào trong PPCT.</td></tr>
              ) : (
                ppctList.map((p) => (
                  <tr key={p.mappct}>
                    <td className="ps-4 fw-bold">{p.tietthu || '-'}</td>
                    <td className="fw-medium text-dark">{p.tenbaihoc}</td>
                    <td>{p.loaiphongyeucau ? <span className="badge bg-light text-dark border">{p.loaiphongyeucau}</span> : '-'}</td>
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-warning text-dark shadow-sm me-2" onClick={() => openEquipmentModal(p)} title="Cấu hình thiết bị mượn">
                        <i className="bi bi-gear-wide-connected me-1"></i> Gắn đồ
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(p)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.mappct)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Lesson */}
      {showModal && createPortal(
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-bold">{editingId ? "Cập nhật Bài Học" : "Thêm Bài Học"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-4">
                      <label className="form-label fw-bold">Tiết Thứ</label>
                      <input type="number" className="form-control" value={formData.tietthu} onChange={(e) => setFormData({...formData, tietthu: e.target.value})} />
                    </div>
                    <div className="col-8">
                      <label className="form-label fw-bold">Phòng (tùy chọn)</label>
                      <input type="text" className="form-control" placeholder="VD: TH Lý-Hóa" value={formData.loaiphongyeucau} onChange={(e) => setFormData({...formData, loaiphongyeucau: e.target.value})} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Tên Bài Học <span className="text-danger">*</span></label>
                    <textarea className="form-control" rows="3" placeholder="Nhập tên bài học..." value={formData.tenbaihoc} onChange={(e) => setFormData({...formData, tenbaihoc: e.target.value})} required></textarea>
                  </div>
                  <div className="text-end">
                    <button type="button" className="btn btn-light me-2" onClick={() => setShowModal(false)}>Hủy</button>
                    <button type="submit" className="btn btn-primary px-4">Lưu Lại</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Equipments Config */}
      {showEqModal && selectedPpct && createPortal(
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 bg-gradient text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #2563eb)" }}>
                <h5 className="modal-title fw-bold d-flex align-items-center">
                  <i className="bi bi-gear-wide-connected me-2"></i> 
                  Cấu hình Thiết Bị - Tiết {selectedPpct.tietthu || '?'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEqModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="alert alert-info border-0 shadow-sm">
                  <strong>Bài học:</strong> {selectedPpct.tenbaihoc}
                  <div className="mt-1 small">Chọn các thiết bị gợi ý cho giáo viên khi mượn tiết học này.</div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <label className="form-label fw-bold text-primary">Thêm thiết bị vào bài học</label>
                    <select className="form-select border-primary" onChange={handleAddEq} defaultValue="">
                      <option value="" disabled>-- Chọn thiết bị từ kho --</option>
                      {allEquipments.map(eq => (
                        <option key={eq.maloaitb} value={eq.maloaitb}>{eq.tenloai} (Còn: {eq.tongtonkho} {eq.donvitinh})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 py-3">
                    <h6 className="mb-0 fw-bold">Thiết bị đã chọn ({lessonEquipments.length})</h6>
                  </div>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      {lessonEquipments.length === 0 ? (
                        <li className="list-group-item py-4 text-center text-muted">Chưa chọn thiết bị nào</li>
                      ) : (
                        lessonEquipments.map(eq => {
                          const eqInfo = allEquipments.find(a => a.maloaitb === eq.maloaitb);
                          return (
                            <li key={eq.maloaitb} className="list-group-item d-flex justify-content-between align-items-center py-3">
                              <div className="d-flex align-items-center gap-3">
                                <div className="bg-light p-2 rounded text-primary">
                                  <i className="bi bi-box-seam fs-5"></i>
                                </div>
                                <div>
                                  <div className="fw-bold">{eqInfo?.tenloai || eq.maloaitb}</div>
                                  <div className="text-muted small">ĐVT: {eqInfo?.donvitinh || '?'}</div>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3">
                                <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                  <span className="input-group-text bg-light text-muted">SL</span>
                                  <input 
                                    type="number" 
                                    className="form-control text-center" 
                                    value={eq.soluong} 
                                    min="1"
                                    onChange={(e) => updateEqQuantity(eq.maloaitb, e.target.value)}
                                  />
                                </div>
                                <button className="btn btn-sm btn-outline-danger border-0" onClick={() => removeEq(eq.maloaitb)} title="Xóa">
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </div>
                            </li>
                          )
                        })
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-3 bg-white">
                <button type="button" className="btn btn-light px-4" onClick={() => setShowEqModal(false)}>Hủy</button>
                <button type="button" className="btn btn-primary px-4 fw-medium shadow-sm" onClick={saveEquipments}>
                  <i className="bi bi-check2-circle me-2"></i> Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PPCTManager;
