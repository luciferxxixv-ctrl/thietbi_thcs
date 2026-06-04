import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function History() {
  const [lichSu, setLichSu] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return navigate("/login");
    setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/borrow/history/${user.maGV}`,
        );
        setLichSu(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [user]);

  // Hàm tô màu trạng thái cho đẹp
  const getBadge = (status) => {
    switch (status) {
      case "ChoDuyet":
        return <span className="badge bg-warning text-dark">⏳ Chờ duyệt</span>;
      case "DaDuyet":
        return <span className="badge bg-success">✅ Đã duyệt</span>;
      case "TuChoi":
        return <span className="badge bg-danger">❌ Từ chối</span>;
      case "DaTra":
        return <span className="badge bg-secondary">zzz Đã trả</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">📜 Lịch sử mượn thiết bị</h3>
        <Link to="/" className="btn btn-outline-primary">
          <i className="bi bi-arrow-left"></i> Quay lại Lịch dạy
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Ngày tạo</th>
                <th>Chi tiết bài dạy</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {lichSu.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    Chưa có phiếu mượn nào.
                  </td>
                </tr>
              ) : (
                lichSu.map((item) => (
                  <tr key={item.maphieu}>
                    <td>{new Date(item.ngaytao).toLocaleString("vi-VN")}</td>
                    <td>
                      <div>
                        <strong>{item.tenmon}</strong> - Lớp {item.malop}
                      </div>
                      <small className="text-muted">
                        Dạy ngày:{" "}
                        {new Date(item.ngayhoc).toLocaleDateString("vi-VN")}{" "}
                        (Tiết {item.tiethoc})
                      </small>
                    </td>
                    <td>{getBadge(item.trangthai)}</td>
                    <td className="text-danger small">{item.lydotuchoi}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default History;
