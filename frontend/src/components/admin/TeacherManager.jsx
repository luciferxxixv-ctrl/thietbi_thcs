import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_BASE } from "../shared/constants";

export default function TeacherManager({ dsGiaoVien, onRefresh }) {
  const [newTeacher, setNewTeacher] = useState({
    maGV: "",
    tenGV: "",
    taiKhoan: "",
    matKhau: "123456",
    email: "",
  });
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setNewTeacher({ maGV: "", tenGV: "", taiKhoan: "", matKhau: "123456", email: "" });
    setEditingId(null);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/teachers/${editingId}`, newTeacher);
        toast.success("Đã cập nhật thông tin giáo viên!");
      } else {
        await axios.post(`${API_BASE}/api/teachers`, newTeacher);
        toast.success("Đã thêm giáo viên thành công!");
      }
      resetForm();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi lưu thông tin giáo viên");
    }
  };

  const handleEditClick = (gv) => {
    setEditingId(gv.magv);
    setNewTeacher({
      maGV: gv.magv,
      tenGV: gv.tengv,
      taiKhoan: gv.taikhoan,
      matKhau: "", // Không hiển thị mk cũ
      email: gv.email || "",
    });
  };

  const handleResetPass = async (maGV) => {
    if (!confirm("Bạn có chắc chắn muốn khôi phục mật khẩu giáo viên này về '123456'?")) return;
    try {
      const res = await axios.post(`${API_BASE}/api/teachers/${maGV}/reset-password`);
      toast.success(res.data.msg);
    } catch (err) {
      toast.error("Lỗi khi khôi phục mật khẩu");
    }
  };

  const handleDeleteTeacher = async (maGV) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giáo viên này?")) return;
    try {
      await axios.delete(`${API_BASE}/api/teachers/${maGV}`);
      toast("Đã xóa!");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi xóa");
    }
  };

  const handleExportTeachers = () => {
    if (!dsGiaoVien || dsGiaoVien.length === 0) {
      toast.info("Không có dữ liệu giáo viên để xuất!");
      return;
    }
    try {
      const dataToExport = dsGiaoVien.map((gv, index) => ({
        "STT": index + 1,
        "Mã Giáo Viên": gv.magv,
        "Họ và Tên": gv.tengv,
        "Tài Khoản": gv.taikhoan,
        "Email": gv.email || ""
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }
      ];
      worksheet['!cols'] = wscols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "GiaoVien");
      XLSX.writeFile(workbook, "Danh_Sach_Giao_Vien.xlsx");
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      toast.error("Lỗi xuất file Excel!");
      console.error(error);
    }
  };

  return (
    <div className="row">
      <div className="col-md-4">
        <div className="card shadow-sm mb-4 border-secondary">
          <div className="card-header bg-secondary text-white fw-bold">
            <i className={editingId ? "bi bi-pencil-square" : "bi bi-person-plus"}></i> 
            {editingId ? " Cập Nhật Giáo Viên" : " Thêm Giáo Viên Mới"}
          </div>
          <div className="card-body">
            <form onSubmit={handleAddOrUpdate}>
              <div className="mb-2">
                <label className="form-label small fw-bold">Mã GV</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTeacher.maGV}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, maGV: e.target.value.toUpperCase() })
                  }
                  disabled={!!editingId}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-bold">Họ và Tên</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTeacher.tenGV}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, tenGV: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-bold">Tài khoản</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTeacher.taiKhoan}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, taiKhoan: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small fw-bold">
                  Email (nhắc phiếu tuần)
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={newTeacher.email}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, email: e.target.value })
                  }
                  placeholder="tùy chọn"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">
                  {editingId ? "Mật khẩu (Để trống nếu không đổi)" : "Mật khẩu (Mặc định: 123456)"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={newTeacher.matKhau}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, matKhau: e.target.value })
                  }
                  disabled={!!editingId}
                />
              </div>
              <div className="d-flex gap-2">
                {editingId && (
                  <button type="button" className="btn btn-light fw-bold" onClick={resetForm}>
                    Hủy
                  </button>
                )}
                <button type="submit" className="btn btn-primary flex-grow-1 fw-bold">
                  {editingId ? "Cập Nhật" : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="col-md-8">
        <div className="card shadow-sm">
          <div className="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
            <span>📋 Danh sách Giáo viên hệ thống</span>
            <button className="btn btn-sm btn-success" onClick={handleExportTeachers} type="button">
              <i className="bi bi-file-earmark-excel me-1"></i> Xuất Excel
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover m-0">
                <thead className="table-light">
                  <tr>
                    <th>Mã GV</th>
                    <th>Họ và Tên</th>
                    <th>Tài khoản</th>
                    <th>Email</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {dsGiaoVien.map((gv) => (
                    <tr key={gv.magv}>
                      <td className="fw-bold">{gv.magv}</td>
                      <td>{gv.tengv}</td>
                      <td>
                        <code>{gv.taikhoan}</code>
                      </td>
                      <td>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          defaultValue={gv.email || ""}
                          key={`${gv.magv}-${gv.email || ""}`}
                          onBlur={async (e) => {
                            const v = e.target.value.trim();
                            if (v === (gv.email || "")) return;
                            try {
                              await axios.put(
                                `${API_BASE}/api/teachers/${gv.magv}/email`,
                                { email: v },
                              );
                              toast.success("Đã lưu email");
                              onRefresh();
                            } catch (err) {
                              toast.error(
                                err.response?.data?.msg || "Lỗi lưu email",
                              );
                            }
                          }}
                          placeholder="nhập email rồi click ra ngoài"
                        />
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditClick(gv)}
                            title="Sửa thông tin"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning text-dark"
                            onClick={() => handleResetPass(gv.magv)}
                            title="Khôi phục mật khẩu về 123456"
                          >
                            <i className="bi bi-key"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteTeacher(gv.magv)}
                            title="Xóa giáo viên"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
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
  );
}
