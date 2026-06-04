import { toast } from "react-toastify";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "./components/shared/constants";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      toast(`Xin chào, ${res.data.tenGV}!`);
      if (res.data.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      toast.error("Đăng nhập thất bại! Vui lòng kiểm tra lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card animate-pop-in">
        <div className="text-center mb-3">
          <div className="login-logo mx-auto mb-3">
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <div
            className="text-uppercase fw-bold brand-text"
            style={{ letterSpacing: "1px", fontSize: ".78rem" }}
          >
            UBND PHƯỜNG VÀNG DANH
          </div>
          <h4 className="fw-bold m-0">TRƯỜNG TH&amp;THCS NAM KHÊ</h4>
          <div className="text-muted small mt-1">
            Hệ thống quản lý thiết bị dạy học
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-4">
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">
              TÀI KHOẢN
            </label>
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-person text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">
              MẬT KHẨU
            </label>
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type={showPwd ? "text" : "password"}
                className="form-control border-start-0 border-end-0 ps-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-group-text bg-white border-start-0 touch-btn"
                onClick={() => setShowPwd((s) => !s)}
                tabIndex={-1}
                aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <i
                  className={`bi ${showPwd ? "bi-eye-slash" : "bi-eye"} text-muted`}
                ></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-brand w-100 fw-bold py-3"
            disabled={submitting || !username.trim() || !password}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>{" "}
                Đang đăng nhập...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="text-center text-muted small mt-4">
          © {new Date().getFullYear()} TH&amp;THCS Nam Khê — Phường Vàng Danh
        </div>
      </div>
    </div>
  );
}

export default Login;
