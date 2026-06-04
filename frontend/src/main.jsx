import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import App from "./App.jsx";
import AdminApp from "./AdminApp.jsx";
import History from "./History.jsx"; // [MỚI] Import trang History
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Login from "./Login.jsx"; // Nếu bạn muốn dùng icon
import PrintInvoice from "./PrintInvoice.jsx";
import PrintWeeklyForm from "./PrintWeeklyForm.jsx";
import "./index.css"; // [MỚI] Thêm CSS tuỳ chỉnh giao diện

// --- [MỚI] Cấu hình Axios để tự động nhét Token vào Header ---
axios.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu API trả về lỗi 401 (Unauthorized / Hết hạn token)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
      // Dùng window.location để force thoát về màn hình login
      if (window.location.pathname !== '/login') {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- ProtectedRoute để bảo vệ các trang yêu cầu đăng nhập ---
const ProtectedRoute = ({ children, requireAdmin }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

// --- PublicRoute để chuyển hướng người đã đăng nhập khỏi trang Login ---
const PublicRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  }
  return children;
};

//import WarehouseApp from './WarehouseApp.jsx'; // [MỚI]

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminApp /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/plan" element={<Navigate to="/" replace />} />
        <Route path="/print/:maPhieu" element={<ProtectedRoute><PrintInvoice /></ProtectedRoute>} />
        <Route path="/print-week/:maPhieuTuan" element={<ProtectedRoute><PrintWeeklyForm /></ProtectedRoute>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  </React.StrictMode>,
);
