import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import * as XLSX from "xlsx";
// Removed ChartJS imports from AdminApp, since they are now in StatisticsPanel.jsx

// --- Components ---
import { API_BASE } from "./components/shared/constants";
import ApprovalPanel from "./components/admin/ApprovalPanel";
import WarehousePanel from "./components/admin/WarehousePanel";
import TeacherManager from "./components/admin/TeacherManager";
import ScheduleTool from "./components/admin/ScheduleTool";
import WeeklyFormPanel from "./components/admin/WeeklyFormPanel";
import HandoverPanel from "./components/admin/HandoverPanel";
import StatisticsPanel from "./components/admin/StatisticsPanel";
import SubjectManager from "./components/admin/SubjectManager"; // [MỚI]
import { initiateSocketConnection, disconnectSocket, getSocket } from "./utils/socketClient"; // [MỚI]

function AdminApp() {
  const [dsCho, setDsCho] = useState([]);
  const [dsKho, setDsKho] = useState([]);
  const [dsGiaoVien, setDsGiaoVien] = useState([]);
  const [dsThietBi, setDsThietBi] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("phieuTuan");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleMenuNavigate = (path) => {
    const backdrop = document.querySelector(".offcanvas-backdrop");
    if (backdrop) backdrop.remove();
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    navigate(path);
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return navigate("/login");
    setUser(storedUser);
    
    // [MỚI] Khởi tạo Socket
    const socket = initiateSocketConnection(storedUser.maGV, storedUser.role || 'admin');
    
    const handleNewRequest = (data) => {
      toast.info(`🔔 ${data.msg}`);
      fetchAllData(); // Refresh data
    };
    
    socket.on("new_borrow_request", handleNewRequest);

    fetchAllData();
    fetchTeachers();
    fetchEquipment();

    return () => {
      if (socket) {
        socket.off("new_borrow_request", handleNewRequest);
      }
    };
  }, [navigate]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [resPending, resWarehouse] = await Promise.all([
        axios.get(`${API_BASE}/api/borrow/pending`),
        axios.get(`${API_BASE}/api/borrow/warehouse`),
      ]);
      setDsCho(resPending.data);
      setDsKho(resWarehouse.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/teachers`);
      setDsGiaoVien(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/equipment`);
      setDsThietBi(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(dsCho.map((p) => p.maphieu));
    else setSelectedIds([]);
  };

  const handleToggleCheck = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkUpdate = async (trangThaiMoi, confirmMsg) => {
    if (selectedIds.length === 0)
      return toast.info("Vui lòng chọn ít nhất 1 phiếu!");
    if (!window.confirm(confirmMsg)) return;
    let lydo = null;
    if (trangThaiMoi === "TuChoi") {
      lydo = prompt("Nhập lý do từ chối chung (không bắt buộc):");
      if (lydo === null) return;
    }
    try {
      const res = await axios.put(`${API_BASE}/api/borrow/bulk-update`, {
        maPhieuList: selectedIds,
        trangThai: trangThaiMoi,
        lydo,
      });
      toast.success(res.data.msg);
      setSelectedIds([]);
      fetchAllData();
    } catch (error) {
      toast.error("Lỗi cập nhật hàng loạt");
    }
  };

  const handleUpdateStatus = async (maPhieu, hanhDong, loiNhan) => {
    if (!confirm(loiNhan)) return;
    let lydo = null;
    if (hanhDong === "TuChoi") {
      lydo = prompt("Nhập lý do từ chối (không bắt buộc):");
      if (lydo === null) return;
    }
    try {
      const res = await axios.put(`${API_BASE}/api/borrow/update/${maPhieu}`, {
        trangThai: hanhDong,
        lydo,
      });
      toast.success(res.data.msg || "Cập nhật thành công!");
      fetchAllData();
    } catch (err) {
      toast.error("Lỗi xử lý!");
    }
  };

  const handleNhanTra = async (maPhieu) => {
    if (!confirm("Xác nhận đã nhận lại đủ đồ và tốt?")) return;
    try {
      const res = await axios.put(`${API_BASE}/api/borrow/return/${maPhieu}`);
      toast.success(res.data.msg || "Nhận trả thành công!");
      fetchAllData();
    } catch (err) {
      toast.error("Lỗi nhận trả");
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/borrow/export/all`);
      const dataToExport = res.data.map((item, index) => ({
        STT: index + 1,
        "Mã Phiếu": item.maphieu,
        "Giáo Viên": item.tengv,
        Lớp: item.malop,
        Môn: item.tenmon,
        Tiết: item.tiethoc,
        Ngày: new Date(item.ngayhoc).toLocaleDateString("vi-VN"),
        "Trạng Thái": item.trangthai,
        "Ngày ĐK": new Date(item.ngaytao).toLocaleString("vi-VN"),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SoTheoDoi");
      XLSX.writeFile(workbook, "So_Theo_Doi.xlsx");
    } catch (error) {
      toast.error("Lỗi xuất file!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    disconnectSocket(); // [MỚI] Ngắt kết nối socket
    navigate("/login");
  };

  if (!user) return null;

  const tabs = [
    {
      key: "phieuTuan",
      icon: "bi-calendar-week",
      label: "Phiếu Tuần",
    },
    {
      key: "duyet",
      icon: "bi-ui-checks",
      label: "Phê Duyệt Lẻ",
    },
    {
      key: "thongke",
      icon: "bi-bar-chart-fill",
      label: "Thống Kê",
    },
    {
      key: "giaonhan",
      icon: "bi-truck",
      label: "Giao / Nhận Đồ",
      badge: dsKho.filter((t) => t.trangthai === "DaDuyet").length,
    },
    {
      key: "kho",
      icon: "bi-box-seam",
      label: "Quản lý Kho",
    },
    {
      key: "gv",
      icon: "bi-people-fill",
      label: "Quản lý Giáo Viên",
    },
    {
      key: "subjects", // [MỚI]
      icon: "bi-journal-bookmark-fill", // [MỚI]
      label: "Môn Học & Kế Hoạch", // [MỚI]
    },
    {
      key: "plan",
      icon: "bi-calendar-range",
      label: "Công Cụ Lịch Dạy",
    },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "phieuTuan":
        return { icon: "bi-calendar-week text-warning", text: "Phê Duyệt Phiếu Tuần" };
      case "duyet":
        return { icon: "bi-ui-checks text-primary", text: "Phê Duyệt Lẻ" };
      case "thongke":
        return { icon: "bi-bar-chart-fill text-danger", text: "Thống Kê Tổng Quan" };
      case "giaonhan":
        return { icon: "bi-truck text-warning", text: "Giao / Nhận Thiết Bị" };
      case "kho":
        return { icon: "bi-box-seam text-success", text: "Quản lý Kho Thiết Bị" };
      case "gv":
        return { icon: "bi-people-fill text-secondary", text: "Quản lý Giáo Viên" };
      case "subjects": // [MỚI]
        return { icon: "bi-journal-bookmark-fill text-primary", text: "Quản Lý Môn Học & Kế Hoạch" }; // [MỚI]
      case "plan":
        return { icon: "bi-calendar-range text-info", text: "Công Cụ Lịch Dạy" };
      default:
        return { icon: "bi-gear", text: "Quản Trị Hệ Thống" };
    }
  };

  const pageTitle = getPageTitle();

  const renderSidebarContent = () => (
    <>
      <div className="sidebar-brand">
        <i className="bi bi-shield-lock-fill text-brand-400"></i>
        <span>Admin Panel</span>
      </div>

      <div className="sidebar-menu">
        <div className="admin-user-card mb-4 mt-2">
          <div className="admin-user-avatar">
            {user.tenGV.charAt(0)}
          </div>
          <div className="text-truncate">
            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{user.tenGV}</div>
            <div className="text-white text-opacity-50" style={{ fontSize: '0.8rem' }}></div>
          </div>
        </div>

        <div className="text-uppercase text-white text-opacity-50 fw-bold mb-2 ps-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
          Menu Chính
        </div>

        {tabs.map((tab) => (
          <button
            key={tab.key}
            data-bs-dismiss="offcanvas"
            onClick={() => setActiveTab(tab.key)}
            className={`menu-item ${activeTab === tab.key ? "active" : ""}`}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span className="flex-grow-1 text-truncate">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="badge bg-danger rounded-pill px-2">{tab.badge}</span>
            )}
          </button>
        ))}

        <div className="text-uppercase text-white text-opacity-50 fw-bold mb-2 mt-4 ps-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
          Công Cụ
        </div>

        <button
          data-bs-dismiss="offcanvas"
          onClick={() => handleMenuNavigate("/")}
          className="menu-item"
        >
          <i className="bi bi-person-video3 text-info"></i>
          <span>Về Giáo Viên</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="menu-item"
        >
          <i className="bi bi-file-earmark-excel text-success"></i>
          <span>Xuất Sổ (Excel)</span>
        </button>

        <div className="mt-auto pt-3">
          <button
            onClick={handleLogout}
            className="menu-item danger-item text-danger"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="admin-layout">
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar desktop-sidebar">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Offcanvas */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="adminMobileSidebar"
        style={{ width: "280px", background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)", color: "white" }}
      >
        <div className="offcanvas-header border-bottom border-light border-opacity-10 py-3">
          <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill text-brand-400"></i>
            Admin Panel
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body p-0 d-flex flex-column">
          {renderSidebarContent()}
        </div>
      </div>

      <main className="admin-main">
        {/* Header */}
        <header className="admin-header shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-light mobile-toggle border-0 p-2 shadow-sm rounded-3 d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#adminMobileSidebar"
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
              <i className={pageTitle.icon}></i>
              <span className="d-none d-sm-inline">{pageTitle.text}</span>
            </h4>
            {isLoading && (
              <div className="spinner-border spinner-border-sm text-brand-600 ms-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-3">
             <div className="text-end d-none d-md-block">
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{user.tenGV}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Quản trị viên</div>
             </div>
             <div className="admin-user-avatar shadow-sm" style={{ cursor: 'pointer' }} onClick={() => handleMenuNavigate("/")} title="Về trang giáo viên">
                {user.tenGV.charAt(0)}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          <div className="animate-fade-in mx-auto" style={{ maxWidth: '1200px' }}>
            {activeTab === "phieuTuan" && <WeeklyFormPanel user={user} />}

            {activeTab === "duyet" && (
              <ApprovalPanel
                dsCho={dsCho}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onToggleCheck={handleToggleCheck}
                onBulkUpdate={handleBulkUpdate}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {activeTab === "thongke" && <StatisticsPanel />}

            {activeTab === "giaonhan" && (
              <HandoverPanel
                user={user}
                dsKho={dsKho}
                onUpdateStatus={handleUpdateStatus}
                onNhanTra={handleNhanTra}
                onRefreshAll={fetchAllData}
                onRefreshEquip={fetchEquipment}
              />
            )}

            {activeTab === "kho" && (
              <WarehousePanel
                user={user}
                dsKho={dsKho}
                dsThietBi={dsThietBi}
                onRefreshAll={fetchAllData}
                onRefreshEquip={fetchEquipment}
              />
            )}

            {activeTab === "gv" && (
              <TeacherManager dsGiaoVien={dsGiaoVien} onRefresh={fetchTeachers} />
            )}

            {activeTab === "subjects" && <SubjectManager />} {/* [MỚI] */}

            {activeTab === "plan" && <ScheduleTool />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminApp;
