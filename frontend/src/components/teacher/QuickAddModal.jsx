import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE, LOCATIONS } from "../shared/constants";

/**
 * QuickAddModal — Modal thêm nhanh tiết dạy vào ô trống trên Grid
 * Props:
 *   show          — boolean hiển thị
 *   onClose       — callback đóng modal
 *   thu           — thứ (2-7)
 *   tiet          — tiết (1-10)
 *   ngayHoc       — ngày tính sẵn (YYYY-MM-DD)
 *   user          — { maGV, tenGV, ... }
 *   onSuccess     — callback sau khi lưu thành công
 */
export default function QuickAddModal({
  show,
  onClose,
  thu,
  tiet,
  ngayHoc,
  user,
  onSuccess,
}) {
  const [form, setForm] = useState({
    maLop: "7A",
    maMon: "NV7",
    maPPCT: "",
    chuong: "",
    diadiem: "Lớp học",
    thietbi: [],
  });
  const [ppctList, setPpctList] = useState([]);
  const [equipList, setEquipList] = useState([]);
  const [loadingPPCT, setLoadingPPCT] = useState(false);

  // Reset form khi mở modal
  useEffect(() => {
    if (show) {
      setForm({
        maLop: "7A",
        maMon: "NV7",
        maPPCT: "",
        chuong: "",
        diadiem: "Lớp học",
        thietbi: [],
      });
      setPpctList([]);
      // Load danh sách thiết bị
      axios
        .get(`${API_BASE}/api/equipment`)
        .then((res) => setEquipList(res.data || []))
        .catch((err) => console.error(err));
    }
  }, [show]);

  const loadPPCT = async () => {
    if (!form.maMon) return toast.warning("Nhập mã môn trước!");
    setLoadingPPCT(true);
    try {
      const res = await axios.get(`${API_BASE}/api/kehoach/ppct`, {
        params: { maMon: form.maMon },
      });
      setPpctList(res.data || []);
      if (res.data.length === 0) toast.warning("Môn học này không có PPCT!");
    } catch (err) {
      toast.error("Lỗi tải PPCT");
    } finally {
      setLoadingPPCT(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.maLop || !form.maMon || !form.maPPCT)
      return toast.warning("Vui lòng điền đủ thông tin!");
    try {
      const payload = {
        maGV: user.maGV,
        maLop: form.maLop,
        maMon: form.maMon,
        maPPCT: form.maPPCT,
        ngayHoc,
        tietHoc: tiet,
      };
      const res = await axios.post(`${API_BASE}/api/plan/quick-add`, payload);
      toast.success(res.data.msg);
      onClose();
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi thêm TKB");
    }
  };

  if (!show) return null;

  const chosenPPCT = ppctList.find(
    (p) => String(p.mappct) === String(form.maPPCT),
  );

  return (
    <>
      <div className="modal-backdrop show opacity-50"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-primary text-white border-0">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-plus-circle me-2"></i> Thêm Nhanh Lịch Dạy
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              {/* BANNER NGÀY */}
              <div className="alert alert-info text-center py-2 mb-3 fw-bold">
                <i className="bi bi-calendar-event me-1"></i>
                Ngày:{" "}
                {new Date(ngayHoc + "T00:00:00").toLocaleDateString("vi-VN")} —
                Thứ {thu}, Tiết {tiet}
              </div>

              {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
              <div className="row mb-3 bg-light p-3 rounded border">
                <div className="col-md-3">
                  <label className="fw-bold small">Mã Môn</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.maMon}
                    onChange={(e) =>
                      setForm({ ...form, maMon: e.target.value })
                    }
                    placeholder="VD: NV7"
                  />
                </div>
                <div className="col-md-3">
                  <label className="fw-bold small">Lớp Dạy</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.maLop}
                    onChange={(e) =>
                      setForm({ ...form, maLop: e.target.value })
                    }
                    placeholder="VD: 7A"
                  />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <button
                    className="btn btn-outline-primary fw-bold w-100"
                    onClick={loadPPCT}
                    disabled={loadingPPCT}
                  >
                    {loadingPPCT ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-download me-1"></i> Tải Danh
                        Sách Bài Dạy (PPCT)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PHẦN 2: BẢNG CHI TIẾT */}
              <div className="table-responsive border rounded shadow-sm">
                <table className="table table-bordered align-middle m-0">
                  <thead className="table-light text-center small text-uppercase">
                    <tr>
                      <th width="120px">Ngày Dạy</th>
                      <th width="60px">Tiết</th>
                      <th width="100px">Chương</th>
                      <th>Tên Bài Học</th>
                      <th width="180px">Thiết Bị Dạy Học</th>
                      <th width="120px">Địa Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={ngayHoc}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-center fw-bold"
                          value={tiet}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={form.chuong}
                          onChange={(e) =>
                            setForm({ ...form, chuong: e.target.value })
                          }
                          placeholder="Ch.1"
                        />
                      </td>
                      <td>
                        {ppctList.length > 0 ? (
                          <select
                            className="form-select form-select-sm border-success fw-bold"
                            value={form.maPPCT}
                            onChange={(e) =>
                              setForm({ ...form, maPPCT: e.target.value })
                            }
                          >
                            <option value="">-- Chọn bài từ PPCT --</option>
                            {ppctList.map((p) => (
                              <option key={p.mappct} value={p.mappct}>
                                Tiết {p.tietthu}: {p.tenbaihoc}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted small">
                            Bấm "Tải PPCT" ở trên để hiện danh sách bài
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          multiple
                          className="form-select form-select-sm"
                          size={3}
                          value={form.thietbi}
                          onChange={(e) => {
                            const selected = Array.from(e.target.options)
                              .filter((o) => o.selected)
                              .map((o) => o.value);
                            setForm({ ...form, thietbi: selected });
                          }}
                        >
                          {equipList.map((eq) => (
                            <option key={eq.maloaitb} value={eq.maloaitb}>
                              {eq.tenloai}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={form.diadiem}
                          onChange={(e) =>
                            setForm({ ...form, diadiem: e.target.value })
                          }
                        >
                          {LOCATIONS.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* GỢI Ý THIẾT BỊ TỪ PPCT */}
              {chosenPPCT && chosenPPCT.loaiphongyeucau && (
                <div className="alert alert-success mt-3 py-2 mb-0">
                  <i className="bi bi-lightbulb me-1"></i>{" "}
                  <strong>Gợi ý từ PPCT:</strong> Yêu cầu phòng/thiết bị:{" "}
                  <strong>{chosenPPCT.loaiphongyeucau}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer border-0 bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-success fw-bold px-4"
                onClick={handleSubmit}
                disabled={!form.maPPCT}
              >
                <i className="bi bi-check-lg me-1"></i> Lưu Kế Hoạch
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
