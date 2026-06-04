import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../shared/constants";
import { toast } from "react-toastify";

/**
 * SuggestionModal — Soạn / chỉnh sửa kế hoạch thiết bị cho 1 tiết dạy.
 *
 * Props:
 *   show              — boolean
 *   onClose           — callback đóng
 *   selectedTiet      — { matkb, tenmon, malop, tiethoc, ngayhoc, thu, tenbaihoc, ... }
 *   initialDsGoiY     — danh sách thiết bị khởi tạo (gợi ý hoặc draft cũ)
 *   initialTenbaihoc  — tên bài dạy ban đầu
 *   initialGhichu     — ghi chú điều chỉnh tuần (nháp)
 *   onSaveDraft       — (items, isCancelled, tenbaihoc, ghichuDieuChinh) => void
 *   dsThietBi         — toàn bộ thiết bị từ kho [{ maloaitb, tenloai, tongtonkho, donvitinh, ... }]
 */

const DAY_LABELS = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
};

const fmtDateVN = (d) => {
  if (!d) return "";
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

export default function SuggestionModal({
  show,
  onClose,
  selectedTiet,
  initialDsGoiY,
  initialTenbaihoc = "",
  initialGhichu = "",
  onSaveDraft,
  dsThietBi = [],
  onRefresh,
}) {
  const [localItems, setLocalItems] = useState([]);
  const [localTenbaihoc, setLocalTenbaihoc] = useState("");
  const [localGhichu, setLocalGhichu] = useState("");
  const [selectedNewItem, setSelectedNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [search, setSearch] = useState("");
  
  // States cho Hiệu chỉnh PPCT
  const [dsPpct, setDsPpct] = useState([]);
  const [selectedPpct, setSelectedPpct] = useState("");
  const [isUpdatingPpct, setIsUpdatingPpct] = useState(false);

  useEffect(() => {
    if (show) {
      setLocalItems(initialDsGoiY ? [...initialDsGoiY] : []);
      setLocalTenbaihoc(initialTenbaihoc ?? "");
      setLocalGhichu(initialGhichu ?? "");
      setSelectedNewItem("");
      setNewQuantity(1);
      setSearch("");
      
      // Load PPCT
      if (selectedTiet?.mamon) {
        axios.get(`${API_BASE}/api/plan/ppct/${selectedTiet.mamon}`)
          .then(res => setDsPpct(res.data))
          .catch(err => console.error("Lỗi lấy PPCT", err));
      }
      setSelectedPpct(selectedTiet?.mappct || "");
    }
  }, [show, initialDsGoiY, initialTenbaihoc, initialGhichu, selectedTiet]);

  const handleUpdatePpct = async () => {
    if (!selectedPpct || selectedPpct === selectedTiet?.mappct) return;
    setIsUpdatingPpct(true);
    try {
      await axios.post(`${API_BASE}/api/schedule/update-ppct`, {
        matkb: selectedTiet.matkb,
        mappct: selectedPpct
      });
      toast.success("✅ Đã cập nhật tiến độ bài học! Đang tải lại gợi ý...");
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Lỗi khi cập nhật bài học");
    } finally {
      setIsUpdatingPpct(false);
    }
  };

  const totalQty = useMemo(
    () =>
      localItems.reduce(
        (acc, it) => acc + Number(it.soluongdexuat ?? it.soluong ?? 0),
        0,
      ),
    [localItems],
  );

  const filteredEquip = useMemo(() => {
    if (!search.trim()) return dsThietBi;
    const q = search.toLowerCase();
    return dsThietBi.filter((t) => (t.tenloai || "").toLowerCase().includes(q));
  }, [dsThietBi, search]);

  const setItemQty = (idx, qty) => {
    const n = Math.max(1, Number(qty) || 1);
    setLocalItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], soluongdexuat: n };
      return next;
    });
  };
  const stepItemQty = (idx, delta) => {
    setLocalItems((prev) => {
      const cur = Number(prev[idx].soluongdexuat ?? prev[idx].soluong ?? 1);
      const n = Math.max(1, cur + delta);
      const next = [...prev];
      next[idx] = { ...next[idx], soluongdexuat: n };
      return next;
    });
  };
  const handleRemove = (index) =>
    setLocalItems((prev) => prev.filter((_, i) => i !== index));

  const handleAddItem = () => {
    if (!selectedNewItem) return;
    const itemInfo = dsThietBi.find((t) => t.maloaitb === selectedNewItem);
    if (!itemInfo) return;
    const qty = Math.max(1, Number(newQuantity) || 1);

    const existingIndex = localItems.findIndex(
      (i) => i.maloaitb === selectedNewItem,
    );
    if (existingIndex >= 0) {
      const next = [...localItems];
      const cur = Number(
        next[existingIndex].soluongdexuat ?? next[existingIndex].soluong ?? 0,
      );
      next[existingIndex] = {
        ...next[existingIndex],
        soluongdexuat: cur + qty,
      };
      setLocalItems(next);
    } else {
      setLocalItems([
        ...localItems,
        {
          maloaitb: selectedNewItem,
          tenloai: itemInfo.tenloai,
          soluongdexuat: qty,
        },
      ]);
    }
    setSelectedNewItem("");
    setNewQuantity(1);
    setSearch("");
  };

  const handleSave = () =>
    onSaveDraft(localItems, false, localTenbaihoc, localGhichu);
  const handleCancelAll = () => {
    if (
      window.confirm("Bạn chắc chắn muốn bỏ qua mượn thiết bị cho tiết này?")
    ) {
      onSaveDraft([], true, undefined, "");
    }
  };

  if (!show) return null;

  const wasFromSuggestion =
    !!selectedTiet?.suggestions?.length && initialDsGoiY?.length > 0;
  const stockOf = (maloaitb) => {
    const it = dsThietBi.find((t) => t.maloaitb === maloaitb);
    return it?.soluongton ?? it?.tongtonkho ?? null;
  };

  return (
    <>
      <div className="modal-backdrop show opacity-50"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-md-down">
          <div className="modal-content border-0 shadow-lg">
            {/* ===== HEADER ===== */}
            <div className="modal-header border-0 modal-brand-header py-3">
              <div className="flex-grow-1 min-w-0">
                <h5 className="modal-title fw-bold m-0 d-flex align-items-center">
                  <i className="bi bi-pencil-square me-2"></i>
                  <span className="text-truncate">Soạn kế hoạch tiết học</span>
                </h5>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {selectedTiet?.tenmon && (
                    <span className="ctx-pill">
                      <i className="bi bi-bookmark-fill me-1"></i>
                      {selectedTiet.tenmon}
                    </span>
                  )}
                  {selectedTiet?.malop && (
                    <span className="ctx-pill">
                      <i className="bi bi-people-fill me-1"></i>Lớp{" "}
                      {selectedTiet.malop}
                    </span>
                  )}
                  {selectedTiet?.tiethoc && (
                    <span className="ctx-pill">
                      <i className="bi bi-clock-fill me-1"></i>Tiết{" "}
                      {selectedTiet.tiethoc}
                    </span>
                  )}
                  {selectedTiet?.thu && (
                    <span className="ctx-pill">
                      <i className="bi bi-calendar3 me-1"></i>
                      {DAY_LABELS[selectedTiet.thu] ||
                        `Thứ ${selectedTiet.thu}`}
                    </span>
                  )}
                  {selectedTiet?.ngayhoc && (
                    <span className="ctx-pill">
                      <i className="bi bi-calendar-event me-1"></i>
                      {fmtDateVN(selectedTiet.ngayhoc)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white ms-2 align-self-start"
                onClick={onClose}
                aria-label="Đóng"
              ></button>
            </div>

            {/* ===== BODY ===== */}
            <div
              className="modal-body"
              style={{ background: "var(--surface-2)" }}
            >
              {wasFromSuggestion && (
                <div
                  className="alert d-flex align-items-start mb-3 py-2"
                  style={{
                    background: "var(--accent-100)",
                    border: "1px solid var(--accent-200)",
                    color: "#7c2d12",
                  }}
                >
                  <i className="bi bi-lightbulb-fill me-2 fs-5 mt-1 accent-text"></i>
                  <small>
                    Hệ thống đã{" "}
                    <strong>gợi ý sẵn {initialDsGoiY.length} thiết bị</strong>{" "}
                    dựa trên PPCT của bài dạy. Bạn có thể chỉnh số lượng, xoá
                    bớt hoặc thêm thiết bị khác trước khi lưu nháp.
                  </small>
                </div>
              )}

              {/* === BÀI DẠY VÀ HIỆU CHỈNH TIẾN ĐỘ === */}
              <div className="section-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="section-title m-0">
                    <i className="bi bi-journal-text"></i> Tên bài dạy (Thực tế giảng dạy)
                  </div>
                </div>
                
                {/* Phần thay đổi PPCT */}
                <div className="mb-3 p-3 bg-light rounded border">
                  <label className="form-label small fw-bold text-primary mb-2">
                    <i className="bi bi-sliders me-1"></i> Hiệu chỉnh tiến độ (Ghi đè PPCT)
                  </label>
                  <div className="d-flex gap-2">
                    <select 
                      className="form-select form-select-sm" 
                      value={selectedPpct}
                      onChange={e => setSelectedPpct(e.target.value)}
                    >
                      <option value="">-- Chọn bài học PPCT --</option>
                      {dsPpct.map(p => (
                        <option key={p.mappct} value={p.mappct}>Tiết {p.tietthu}: {p.tenbaihoc}</option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-sm btn-primary text-nowrap"
                      onClick={handleUpdatePpct}
                      disabled={!selectedPpct || selectedPpct === selectedTiet?.mappct || isUpdatingPpct}
                    >
                      {isUpdatingPpct ? "Đang lưu..." : "Đổi Bài"}
                    </button>
                  </div>
                  <div className="form-text mt-1" style={{fontSize: "0.75rem"}}>
                    Đổi bài học để lấy lại danh sách thiết bị gợi ý phù hợp (sẽ tải lại modal).
                  </div>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Bài 12 - Cấu tạo nguyên tử"
                  value={localTenbaihoc}
                  onChange={(e) => setLocalTenbaihoc(e.target.value)}
                  maxLength={500}
                />
                <div className="form-text d-flex justify-content-between mt-1">
                  <span>Tên bài hiển thị trên lưới lịch sau khi lưu nháp.</span>
                  <span>{(localTenbaihoc || "").length}/500</span>
                </div>
              </div>

              <div className="section-card">
                <div className="section-title">
                  <i className="bi bi-chat-left-text"></i> Điều chỉnh / ghi chú
                  (tuần này)
                </div>
                <textarea
                  className="form-control"
                  rows={2}
                  maxLength={2000}
                  placeholder="Ghi chú cho admin khi gửi phiếu tuần (không bắt buộc)..."
                  value={localGhichu}
                  onChange={(e) => setLocalGhichu(e.target.value)}
                />
              </div>

              {/* === THÊM THIẾT BỊ === */}
              <div className="section-card">
                <div className="section-title">
                  <i className="bi bi-plus-circle"></i> Thêm thiết bị
                </div>

                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small text-muted mb-1">
                      Tìm nhanh thiết bị
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Gõ tên thiết bị để lọc..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {search && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setSearch("")}
                          aria-label="Xoá tìm kiếm"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-sm-7">
                    <label className="form-label small text-muted mb-1">
                      Chọn thiết bị
                    </label>
                    <select
                      className="form-select"
                      value={selectedNewItem}
                      onChange={(e) => setSelectedNewItem(e.target.value)}
                    >
                      <option value="">
                        {filteredEquip.length === 0
                          ? "(Không có thiết bị phù hợp)"
                          : "-- Chọn thiết bị --"}
                      </option>
                      {filteredEquip.map((t) => {
                        const stock = t.soluongton ?? t.tongtonkho ?? 0;
                        return (
                          <option
                            key={t.maloaitb}
                            value={t.maloaitb}
                            disabled={stock <= 0}
                          >
                            {t.tenloai} {t.donvitinh ? `· ${t.donvitinh}` : ""}{" "}
                            (Còn {stock})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="col-7 col-sm-3">
                    <label className="form-label small text-muted mb-1">
                      Số lượng
                    </label>
                    <div
                      className="qty-stepper w-100"
                      style={{ display: "flex" }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuantity((q) => Math.max(1, Number(q) - 1))
                        }
                        aria-label="Giảm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuantity((q) => Math.max(1, Number(q) + 1))
                        }
                        aria-label="Tăng"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="col-5 col-sm-2 d-flex align-items-end">
                    <button
                      className="btn btn-brand w-100 fw-bold touch-btn"
                      onClick={handleAddItem}
                      disabled={!selectedNewItem}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Thêm
                    </button>
                  </div>
                </div>
              </div>

              {/* === DANH SÁCH MƯỢN === */}
              <div className="d-flex justify-content-between align-items-center mb-2 mt-1 px-1">
                <div className="fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-list-check brand-text"></i>
                  Danh sách mượn
                  <span
                    className="badge rounded-pill"
                    style={{ background: "var(--brand-600)" }}
                  >
                    {localItems.length}
                  </span>
                </div>
                {totalQty > 0 && (
                  <small className="text-muted">
                    Tổng số lượng:{" "}
                    <strong className="brand-text">{totalQty}</strong>
                  </small>
                )}
              </div>

              {localItems.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox es-icon"></i>
                  <div className="fw-semibold text-dark">
                    Chưa có thiết bị nào
                  </div>
                  <div className="small">
                    Hãy chọn thiết bị ở phần trên rồi bấm "Thêm" để đưa vào danh
                    sách.
                  </div>
                </div>
              ) : (
                <>
                  {/* PC: bảng */}
                  <div className="d-none d-md-block bg-white shadow-sm rounded border">
                    <table className="table align-middle text-center m-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-start ps-3">Tên thiết bị</th>
                          <th style={{ width: 170 }}>Số lượng</th>
                          <th style={{ width: 70 }}>Xoá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {localItems.map((tb, i) => {
                          const qty = Number(
                            tb.soluongdexuat ?? tb.soluong ?? 1,
                          );
                          const stock = stockOf(tb.maloaitb);
                          const overStock = stock !== null && qty > stock;
                          return (
                            <tr key={`${tb.maloaitb}-${i}`}>
                              <td className="text-start ps-3">
                                <div className="fw-semibold brand-text">
                                  {tb.tenloai}
                                </div>
                                {stock !== null && (
                                  <small
                                    className={
                                      overStock ? "text-danger" : "text-muted"
                                    }
                                  >
                                    {overStock ? (
                                      <>
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        Vượt tồn kho ({stock})
                                      </>
                                    ) : (
                                      <>Tồn kho: {stock}</>
                                    )}
                                  </small>
                                )}
                              </td>
                              <td>
                                <div className="d-inline-block">
                                  <div className="qty-stepper">
                                    <button
                                      type="button"
                                      onClick={() => stepItemQty(i, -1)}
                                      aria-label="Giảm"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={qty}
                                      onChange={(e) =>
                                        setItemQty(i, e.target.value)
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => stepItemQty(i, +1)}
                                      aria-label="Tăng"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="ir-remove"
                                  onClick={() => handleRemove(i)}
                                  aria-label="Xoá"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card list */}
                  <div className="d-md-none">
                    {localItems.map((tb, i) => {
                      const qty = Number(tb.soluongdexuat ?? tb.soluong ?? 1);
                      const stock = stockOf(tb.maloaitb);
                      const overStock = stock !== null && qty > stock;
                      return (
                        <div key={`${tb.maloaitb}-${i}`} className="item-row">
                          <div className="ir-name">
                            <div className="nm text-truncate">{tb.tenloai}</div>
                            <div
                              className={`sub ${overStock ? "text-danger" : ""}`}
                            >
                              {stock !== null ? (
                                overStock ? (
                                  <>
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    Vượt tồn kho ({stock})
                                  </>
                                ) : (
                                  <>Tồn kho: {stock}</>
                                )
                              ) : (
                                <>&nbsp;</>
                              )}
                            </div>
                          </div>
                          <div className="qty-stepper">
                            <button
                              type="button"
                              onClick={() => stepItemQty(i, -1)}
                              aria-label="Giảm"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={(e) => setItemQty(i, e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => stepItemQty(i, +1)}
                              aria-label="Tăng"
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="ir-remove"
                            onClick={() => handleRemove(i)}
                            aria-label="Xoá"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ===== FOOTER ===== */}
            <div className="modal-footer border-top bg-white p-2 p-sm-3">
              <div className="d-flex flex-column-reverse flex-sm-row gap-2 w-100 align-items-stretch">
                <button
                  className="btn btn-outline-danger fw-bold touch-btn"
                  onClick={handleCancelAll}
                >
                  <i className="bi bi-x-circle me-1"></i> Bỏ qua tiết này
                </button>
                <div className="d-flex gap-2 ms-sm-auto">
                  <button
                    className="btn btn-secondary touch-btn flex-grow-1 flex-sm-grow-0"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                  <button
                    className="btn btn-brand fw-bold px-3 px-sm-4 touch-btn flex-grow-1 flex-sm-grow-0"
                    onClick={handleSave}
                  >
                    <i className="bi bi-save me-1"></i> Lưu Nháp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
