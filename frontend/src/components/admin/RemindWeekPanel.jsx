import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../shared/constants";

/**
 * Admin: tìm GV có TKB trong tuần nhưng chưa gửi phiếu tuần; gửi email nhắc (nodemailer).
 */
export default function RemindWeekPanel() {
  const [tuanSo, setTuanSo] = useState("");
  const [namHoc, setNamHoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [selected, setSelected] = useState({});

  const fetchMissing = async () => {
    const t = parseInt(tuanSo, 10);
    if (!t || t < 1) {
      toast.info("Nhập số tuần học (ví dụ: 12).");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/notify/missing-submitters`, {
        params: { tuanSo: t, namHoc: namHoc.trim() || undefined },
      });
      setPayload(res.data);
      const next = {};
      (res.data.teachers || []).forEach((x) => {
        next[x.magv] = true;
      });
      setSelected(next);
      toast.success(
        `Tuần ${res.data.tuanSo} (${res.data.weekStart} → ${res.data.weekEnd}): ${res.data.teachers?.length || 0} GV chưa nộp.`,
      );
    } catch (e) {
      toast.error(e.response?.data?.msg || "Không tải được danh sách.");
      setPayload(null);
      setSelected({});
    } finally {
      setLoading(false);
    }
  };

  const toggle = (magv) => {
    setSelected((prev) => ({ ...prev, [magv]: !prev[magv] }));
  };

  const selectAll = (on) => {
    if (!payload?.teachers) return;
    const next = {};
    payload.teachers.forEach((x) => {
      next[x.magv] = on;
    });
    setSelected(next);
  };

  const sendEmails = async () => {
    const t = parseInt(tuanSo, 10);
    if (!t) {
      toast.info("Nhập tuần và tải danh sách trước.");
      return;
    }
    const chosen = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (chosen.length === 0) {
      toast.info("Chọn ít nhất một giáo viên.");
      return;
    }
    if (
      !window.confirm(
        `Gửi email nhắc nộp phiếu tới ${chosen.length} giáo viên đã chọn?`,
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/notify/remind-week`, {
        tuanSo: t,
        namHoc: payload?.namhoc || namHoc.trim() || undefined,
        danhSachMaGV: chosen,
      });
      toast.success(res.data.msg || "Đã gửi.");
    } catch (e) {
      toast.error(
        e.response?.data?.msg || "Lỗi gửi email (kiểm tra SMTP trong .env).",
      );
    } finally {
      setLoading(false);
    }
  };

  const teachers = payload?.teachers || [];

  return (
    <div className="card border-0 shadow-sm mb-3 border-start border-4 border-info">
      <div className="card-header bg-info bg-opacity-10 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span className="fw-bold">
          <i className="bi bi-envelope-paper me-2"></i>
          Nhắc GV nộp phiếu tuần (email)
        </span>
        <small className="text-muted">
          Cần cấu hình SMTP_HOST trong .env server + nhập Email ở tab Quản lý GV
        </small>
      </div>
      <div className="card-body py-3">
        <div className="row g-2 align-items-end mb-3">
          <div className="col-6 col-md-2">
            <label className="form-label small mb-0">Tuần số</label>
            <input
              type="number"
              min="1"
              className="form-control form-control-sm"
              value={tuanSo}
              onChange={(e) => setTuanSo(e.target.value)}
              placeholder="VD: 8"
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small mb-0">Năm học (tuỳ chọn)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={namHoc}
              onChange={(e) => setNamHoc(e.target.value)}
              placeholder="Mặc định: năm active"
            />
          </div>
          <div className="col-12 col-md-7 d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={loading}
              onClick={fetchMissing}
            >
              <i className="bi bi-search me-1"></i> Tải danh sách chưa nộp
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success"
              disabled={loading || teachers.length === 0}
              onClick={sendEmails}
            >
              <i className="bi bi-send me-1"></i> Gửi email đã chọn
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => selectAll(true)}
              disabled={!teachers.length}
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => selectAll(false)}
              disabled={!teachers.length}
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        {teachers.length > 0 && (
          <div className="table-responsive" style={{ maxHeight: 220 }}>
            <table className="table table-sm table-bordered mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Mã GV</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((x) => (
                  <tr key={x.magv}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!selected[x.magv]}
                        onChange={() => toggle(x.magv)}
                      />
                    </td>
                    <td className="fw-bold">{x.magv}</td>
                    <td>{x.tengv}</td>
                    <td className={x.email ? "" : "text-warning"}>
                      {x.email || "— chưa có —"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payload && teachers.length === 0 && (
          <div className="alert alert-success py-2 mb-0 small">
            Không có giáo viên nào cần nhắc (đã nộp hoặc không có TKB).
          </div>
        )}
      </div>
    </div>
  );
}
