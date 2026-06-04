import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE } from "../shared/constants";

const QR_REGION_ID = "qr-scanner-region";

/**
 * QRScannerModal — Quét QR bằng camera (html5-qrcode).
 * Hỗ trợ 2 chế độ:
 *   - 'inspect' (mặc định) : Chỉ xem thông tin (thiết bị / phiếu)
 *   - 'giao'                : Quét phiếu Đã duyệt → chuyển sang Đang mượn
 *   - 'nhan'                : Quét phiếu Đang mượn → chuyển sang Đã trả (đơn giản, không chi tiết tình trạng)
 *
 * Props:
 *   show, onClose, onResult(payload)
 */
export default function QRScannerModal({ show, onClose, onResult }) {
  const [action, setAction] = useState("inspect");
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const lastPayloadRef = useRef(null);
  const lastTimeRef = useRef(0);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore
    }
    setRunning(false);
  };

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decoded) => {
          // Debounce: cùng payload trong 2s thì bỏ qua
          const now = Date.now();
          if (
            decoded === lastPayloadRef.current &&
            now - lastTimeRef.current < 2000
          )
            return;
          lastPayloadRef.current = decoded;
          lastTimeRef.current = now;

          await handleScanResult(decoded);
        },
        () => {
          /* skip read errors */
        },
      );
      setRunning(true);
    } catch (err) {
      setError(
        "Không truy cập được camera. Hãy cho phép quyền camera trên trình duyệt.",
      );
      console.error(err);
    }
  };

  const handleScanResult = async (qrPayload) => {
    try {
      const res = await axios.post(`${API_BASE}/api/warehouse/scan`, {
        qrPayload,
        action,
      });
      setLastResult(res.data);
      onResult?.(res.data);
      if (
        res.data.kind === "phieu" &&
        (action === "giao" || action === "nhan")
      ) {
        toast.success(res.data.msg || "Thực hiện thành công");
      }
    } catch (err) {
      const msg = err.response?.data?.msg || "Mã QR không hợp lệ";
      setLastResult({ error: msg, raw: qrPayload });
      toast.warn(msg);
    }
  };

  useEffect(() => {
    if (show) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Khi đổi action, đặt lại debounce để cho phép quét lại payload cũ
  useEffect(() => {
    lastPayloadRef.current = null;
    lastTimeRef.current = 0;
  }, [action]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-qr-code-scan me-2"></i>Quét QR thiết bị /
                phiếu mượn
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="btn-group w-100 mb-3" role="group">
                {[
                  {
                    key: "inspect",
                    label: "Xem thông tin",
                    icon: "bi-info-circle",
                    cls: "btn-outline-primary",
                  },
                  {
                    key: "giao",
                    label: "Giao đồ",
                    icon: "bi-arrow-up-right-circle",
                    cls: "btn-outline-warning",
                  },
                  {
                    key: "nhan",
                    label: "Nhận trả nhanh",
                    icon: "bi-arrow-down-left-circle",
                    cls: "btn-outline-success",
                  },
                ].map((b) => (
                  <button
                    key={b.key}
                    className={`btn ${b.cls} ${action === b.key ? "active" : ""}`}
                    onClick={() => setAction(b.key)}
                    type="button"
                  >
                    <i className={`bi ${b.icon} me-1`}></i>
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="row">
                <div className="col-md-7">
                  <div
                    id={QR_REGION_ID}
                    style={{
                      width: "100%",
                      minHeight: 280,
                      background: "#000",
                      borderRadius: 6,
                    }}
                  ></div>
                  {error && (
                    <div className="alert alert-warning small mt-2 mb-0">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {error}
                    </div>
                  )}
                  <div className="d-flex justify-content-between mt-2">
                    {!running ? (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={startScanner}
                      >
                        <i className="bi bi-camera-video me-1"></i>Bật camera
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={stopScanner}
                      >
                        <i className="bi bi-camera-video-off me-1"></i>Tắt
                        camera
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-5">
                  <h6 className="fw-bold border-bottom pb-1 mb-2">
                    <i className="bi bi-receipt me-1"></i>Kết quả
                  </h6>
                  {!lastResult && (
                    <div className="text-muted small bg-light p-3 rounded text-center">
                      Đưa mã QR vào khung hình để bắt đầu.
                    </div>
                  )}

                  {lastResult?.error && (
                    <div className="alert alert-danger py-2 small">
                      <strong>Lỗi:</strong> {lastResult.error}
                      {lastResult.raw && (
                        <div className="text-muted small mt-1">
                          QR: <code>{lastResult.raw}</code>
                        </div>
                      )}
                    </div>
                  )}

                  {lastResult?.kind === "thietbi" && (
                    <div className="card border-primary">
                      <div className="card-body p-3">
                        <h6 className="text-primary fw-bold mb-1">
                          {lastResult.data.tenloai}
                        </h6>
                        <small className="text-muted d-block mb-2">
                          Mã: {lastResult.data.maloaitb}
                        </small>
                        <div className="d-flex flex-wrap gap-1 small">
                          <span className="badge bg-success">
                            Tốt: {lastResult.data.soluongtot}
                          </span>
                          <span className="badge bg-warning text-dark">
                            Hỏng: {lastResult.data.soluonghong}
                          </span>
                          <span className="badge bg-danger">
                            Mất: {lastResult.data.soluongmat}
                          </span>
                          <span className="badge bg-secondary">
                            Tổng: {lastResult.data.tongtonkho}
                          </span>
                        </div>
                        {lastResult.data.vitrikho && (
                          <div className="small mt-2 text-muted">
                            <i className="bi bi-geo-alt me-1"></i>
                            {lastResult.data.vitrikho}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {lastResult?.kind === "phieu" && (
                    <div className="card border-warning">
                      <div className="card-body p-3">
                        <h6 className="text-warning fw-bold mb-1">
                          Phiếu {lastResult.data.maphieu}
                        </h6>
                        <div className="small">
                          <strong>{lastResult.data.tengv}</strong> · Lớp{" "}
                          {lastResult.data.malop} · {lastResult.data.tenmon}
                        </div>
                        <div className="small text-muted mb-2">
                          Tiết {lastResult.data.tiethoc} ·{" "}
                          {new Date(lastResult.data.ngayhoc).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                        <span
                          className={`badge ${
                            lastResult.data.trangthai === "DangMuon"
                              ? "bg-info"
                              : lastResult.data.trangthai === "DaTra"
                                ? "bg-success"
                                : lastResult.data.trangthai === "DaDuyet"
                                  ? "bg-warning text-dark"
                                  : "bg-secondary"
                          }`}
                        >
                          {lastResult.data.trangthai}
                        </span>
                        {lastResult.action && (
                          <div className="alert alert-success py-1 px-2 small mt-2 mb-0">
                            <i className="bi bi-check-circle me-1"></i>
                            {lastResult.msg}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
