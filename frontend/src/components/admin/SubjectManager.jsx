import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../shared/constants";
import PPCTManager from "./PPCTManager";

const SubjectManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ mamon: "", tenmon: "" });
  const [editingId, setEditingId] = useState(null);
  
  const [selectedSubject, setSelectedSubject] = useState(null); // Để mở PPCTManager

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/subjects`);
      setSubjects(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh sách môn học");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mamon || !formData.tenmon) return toast.warning("Vui lòng nhập đủ thông tin!");
    
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/subjects/${editingId}`, { tenmon: formData.tenmon });
        toast.success("Cập nhật thành công!");
      } else {
        await axios.post(`${API_BASE}/api/subjects`, formData);
        toast.success("Thêm môn học thành công!");
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi hệ thống");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) return;
    try {
      await axios.delete(`${API_BASE}/api/subjects/${id}`);
      toast.success("Đã xóa môn học");
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi khi xóa");
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ mamon: "", tenmon: "" });
    setShowModal(true);
  };

  const openEdit = (sub) => {
    setEditingId(sub.mamon);
    setFormData({ mamon: sub.mamon, tenmon: sub.tenmon });
    setShowModal(true);
  };

  if (selectedSubject) {
    return <PPCTManager subject={selectedSubject} onBack={() => setSelectedSubject(null)} />;
  }

  return (
    <div className="card shadow-sm border-0 animate-fade-in">
      <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">Quản lý Môn học</h5>
        <button className="btn btn-primary shadow-sm" onClick={openAdd}>
          <i className="bi bi-plus-lg me-2"></i>Thêm Môn Học Mới
        </button>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Mã Môn</th>
                <th>Tên Môn</th>
                <th className="text-end pe-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    Chưa có môn học nào.
                  </td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.mamon}>
                    <td className="ps-4 fw-bold">{s.mamon}</td>
                    <td>{s.tenmon}</td>
                    <td className="text-end pe-4">
                      <button 
                        className="btn btn-sm btn-info text-white shadow-sm me-2" 
                        onClick={() => setSelectedSubject(s)}
                        title="Quản lý Phân phối chương trình"
                      >
                        <i className="bi bi-journal-text me-1"></i> PPCT & Thiết bị
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(s)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.mamon)}>
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

      {showModal && createPortal(
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-bold">{editingId ? "Cập nhật Môn Học" : "Thêm Môn Học"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mã Môn <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="VD: VAN, TOAN" 
                      value={formData.mamon} 
                      onChange={(e) => setFormData({...formData, mamon: e.target.value.toUpperCase()})}
                      disabled={!!editingId}
                      required 
                    />
                    {!editingId && <small className="text-muted">Viết liền không dấu, in hoa. Trùng khớp với mã trong file TKB import.</small>}
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Tên Môn <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="VD: Ngữ Văn" 
                      value={formData.tenmon} 
                      onChange={(e) => setFormData({...formData, tenmon: e.target.value})}
                      required 
                    />
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
    </div>
  );
};

export default SubjectManager;
