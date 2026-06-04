import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

// --- Components ---
import { API_BASE } from "./components/shared/constants";
import WeeklyGrid from "./components/teacher/WeeklyGrid";
import QuickAddModal from "./components/teacher/QuickAddModal";
import SuggestionModal from "./components/teacher/SuggestionModal";
import BorrowModal from "./components/teacher/BorrowModal";
import EquipmentShop from "./components/teacher/EquipmentShop";
import BorrowHistory from "./components/teacher/BorrowHistory";
import WeeklyFormPreviewModal from "./components/teacher/WeeklyFormPreviewModal";
import { initiateSocketConnection, disconnectSocket } from "./utils/socketClient"; // [MỚI]

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // --- State Trang Chủ ---
  const [lichDay, setLichDay] = useState([]);
  const [thongKe, setThongKe] = useState({
    choDuyet: 0,
    daChuanBi: 0,
    dangMuon: 0,
  });

  // --- State Modal Gợi ý ---
  const [showModal, setShowModal] = useState(false);
  const [selectedTiet, setSelectedTiet] = useState(null);
  const [dsGoiY, setDsGoiY] = useState([]);

  // --- State Modal Mượn ---
  const [dsThietBi, setDsThietBi] = useState([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [muonItem, setMuonItem] = useState(null);

  // --- State Lịch sử ---
  const [dsLichSu, setDsLichSu] = useState([]);

  // --- State Quick Add ---
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    thu: 0,
    tiet: 0,
    ngayHoc: "",
  });

  // --- State Draft Plans ---
  const [draftPlans, setDraftPlans] = useState({});

  // --- State Modal Preview phiếu tuần ---
  const [showWeeklyPreview, setShowWeeklyPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewWeekPlans, setPreviewWeekPlans] = useState([]);
  const [previewWeekRange, setPreviewWeekRange] = useState(null);
  const [previewAdjustNotes, setPreviewAdjustNotes] = useState({});
  const [submittingWeek, setSubmittingWeek] = useState(false);

  // ========= EFFECTS =========
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return navigate("/login");
    setUser(storedUser);

    // [MỚI] Khởi tạo Socket cho Giáo viên
    const socket = initiateSocketConnection(storedUser.maGV, storedUser.role || 'teacher');
    
    const handleStatusChanged = (data) => {
      if (data.trangThai === 'DaDuyet') {
        toast.success(`🎉 ${data.msg}`);
      } else {
        toast.error(`❌ ${data.msg}`);
      }
      // Refresh dữ liệu
      if (activeTab === 'home') fetchHomeData(storedUser.maGV, weekOffset);
      if (activeTab === 'history') fetchHistory(storedUser.maGV);
    };

    const handleReturned = (data) => {
      toast.success(`✅ ${data.msg}`);
      if (activeTab === 'history') fetchHistory(storedUser.maGV);
    };

    socket.on("borrow_status_changed", handleStatusChanged);
    socket.on("borrow_returned", handleReturned);

    return () => {
      if (socket) {
        socket.off("borrow_status_changed", handleStatusChanged);
        socket.off("borrow_returned", handleReturned);
      }
    };
  }, [navigate, activeTab, weekOffset]);

  useEffect(() => {
    if (user && activeTab === "home") fetchHomeData(user.maGV, weekOffset);
  }, [activeTab, user, weekOffset]);

  useEffect(() => {
    if (user && activeTab === "history") fetchHistory(user.maGV);
  }, [activeTab, user]);

  // Danh sách thiết bị cần cho tab lịch (modal "thiết bị bổ sung") và tab kho; trước đây chỉ tải khi activeTab === 'kho' nên dropdown nháp kế hoạch luôn rỗng.
  useEffect(() => {
    if (!user) return;
    if (activeTab === "home" || activeTab === "kho")
      fetchEquipment(activeTab === "kho");
  }, [activeTab, user]);

  // ========= DATA FETCHING =========
  const fetchHomeData = async (maGV, offset = weekOffset) => {
    setIsLoading(true);
    try {
      const resLich = await axios.get(
        `${API_BASE}/api/schedule/weekly/${maGV}?weekOffset=${offset}`,
      );
      setLichDay(resLich.data);
      const resStats = await axios.get(
        `${API_BASE}/api/borrow/history/${maGV}`,
      );
      const history = resStats.data;
      setThongKe({
        choDuyet: history.filter((item) => item.trangthai === "ChoDuyet")
          .length,
        daChuanBi: history.filter((item) => item.trangthai === "DaChuanBi")
          .length,
        dangMuon: history.filter(
          (item) =>
            item.trangthai === "DangMuon" || item.trangthai === "DaDuyet",
        ).length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEquipment = async (withLoading = false) => {
    if (withLoading) setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/equipment`);
      setDsThietBi(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      if (withLoading) setIsLoading(false);
    }
  };

  const fetchHistory = async (maGV) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/borrow/history/${maGV}`);
      setDsLichSu(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========= EVENT HANDLERS =========
  const handleLogout = () => {
    localStorage.removeItem("user");
    disconnectSocket(); // [MỚI] Ngắt kết nối socket
    const backdrop = document.querySelector(".offcanvas-backdrop");
    if (backdrop) backdrop.remove();
    document.body.style.overflow = "";
    navigate("/login");
  };

  const handleXemGoiY = async (tiet) => {
    setSelectedTiet(tiet);
    if (draftPlans[tiet.matkb]) {
      setDsGoiY(draftPlans[tiet.matkb].items);
      setShowModal(true);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/suggestion/${tiet.matkb}`);
      setDsGoiY(res.data);
      setShowModal(true);
    } catch (err) {
      toast.error("Lỗi lấy gợi ý");
    }
  };

  const handleSaveDraft = (
    modifiedItems,
    isCancelled,
    tenbaihocEdited,
    ghichuDieuChinh,
  ) => {
    const tenbaihoc = isCancelled
      ? selectedTiet.tenbaihoc
      : typeof tenbaihocEdited === "string" && tenbaihocEdited.trim() !== ""
        ? tenbaihocEdited.trim()
        : (selectedTiet.tenbaihoc ?? "");
    const note = (
      typeof ghichuDieuChinh === "string" ? ghichuDieuChinh : ""
    ).trim();
    setDraftPlans((prev) => ({
      ...prev,
      [selectedTiet.matkb]: {
        items: modifiedItems,
        cancelled: isCancelled,
        tenbaihoc,
        ghichuDieuChinh: note,
      },
    }));
    toast.success("✅ Đã lưu nháp vào Lịch. Đừng quên bấm Gửi Duyệt Cả Tuần!");
    setShowModal(false);
  };

  const handleMopKho = (tb) => {
    setMuonItem(tb);
    setShowBorrowModal(true);
  };

  const submitDirectBorrow = async (matkb, maLoaiTB, soLuong) => {
    if (!matkb) return toast("Vui lòng chọn bài dạy!");
    try {
      const payload = {
        maGV: user.maGV,
        maTKB: matkb,
        items: [{ maLoaiTB, soLuong }],
      };
      const res = await axios.post(`${API_BASE}/api/borrow`, payload);
      if (res.status === 200) {
        toast.success(`✅ Mượn thành công! Mã phiếu: ${res.data.maPhieu}`);
        setShowBorrowModal(false);
        fetchHomeData(user.maGV);
        fetchEquipment();
        setActiveTab("history");
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Lỗi gửi phiếu");
    }
  };

  // Bước 1: Tổng hợp dữ liệu tuần và mở modal preview
  const handleSubmitWeek = () => {
    const weekPlans = lichDay
      .filter((tkb) => !tkb.ticketstatus || tkb.ticketstatus === "BanNhap") // Chỉ gửi những tiết chưa chốt
      .map((tkb) => {
        const draft = draftPlans[tkb.matkb];
        if (draft) {
          if (draft.cancelled) return null;
          return { tkb, items: draft.items, tenbaihoc: draft.tenbaihoc };
        } else {
          return {
            tkb,
            items: tkb.suggestions || [],
            tenbaihoc: tkb.tenbaihoc,
          };
        }
      })
      .filter((plan) => plan !== null && plan.items.length > 0);

    if (weekPlans.length === 0) {
      toast.info(
        "Không có tiết học nào yêu cầu thiết bị trong tuần này hoặc tất cả đã được gửi.",
      );
      return;
    }

    // Phẳng hoá thành các dòng để preview giống template Excel
    const rows = [];
    const initNotes = {};
    weekPlans.forEach((plan) => {
      const d = draftPlans[plan.tkb.matkb];
      initNotes[plan.tkb.matkb] = (d?.ghichuDieuChinh || "").trim();
    });
    setPreviewAdjustNotes(initNotes);

    weekPlans.forEach((plan) => {
      plan.items.forEach((item) => {
        rows.push({
          matkb: plan.tkb.matkb,
          ngayhoc: plan.tkb.ngayhoc,
          ngaytra: plan.tkb.ngayhoc,
          tenloai: item.tenloai || "(Thiết bị chưa rõ tên)",
          tenbaihoc: plan.tenbaihoc || plan.tkb.tenbaihoc || "",
          tiethoc: plan.tkb.tiethoc,
          soluong: item.soluongdexuat || item.soluong || 1,
          malop: plan.tkb.malop,
          tenmon: plan.tkb.tenmon,
          ghichu: "",
        });
      });
    });

    rows.sort((a, b) => {
      const da = new Date(a.ngayhoc).getTime();
      const db = new Date(b.ngayhoc).getTime();
      if (da !== db) return da - db;
      return (a.tiethoc || 0) - (b.tiethoc || 0);
    });

    const datesNum = rows
      .map((r) => new Date(r.ngayhoc).getTime())
      .sort((a, b) => a - b);
    const weekRange =
      datesNum.length > 0
        ? {
            from: new Date(datesNum[0]),
            to: new Date(datesNum[datesNum.length - 1]),
          }
        : null;

    setPreviewRows(rows);
    setPreviewWeekPlans(weekPlans);
    setPreviewWeekRange(weekRange);
    setShowWeeklyPreview(true);
  };

  // Bước 2: Người dùng xác nhận → gọi API thật
  const handleConfirmSubmitWeek = async () => {
    setSubmittingWeek(true);
    try {
      const payload = {
        maGV: user.maGV,
        weekPlans: previewWeekPlans.map((plan) => ({
          matkb: plan.tkb.matkb,
          tenbaihoc: plan.tenbaihoc,
          ghichu_dieuchinh:
            (previewAdjustNotes[plan.tkb.matkb] || "").trim() || null,
          items: plan.items.map((item) => ({
            maloaitb: item.maloaitb,
            soluong: item.soluongdexuat || item.soluong || 1,
          })),
        })),
      };
      const res = await axios.post(
        `${API_BASE}/api/borrow/submit-week`,
        payload,
      );
      toast.success(res.data.msg || "Đã gửi duyệt phiếu tuần!");
      setDraftPlans({});
      setPreviewAdjustNotes({});
      setShowWeeklyPreview(false);

      const maPhieuTuan = res.data?.maPhieuTuan;
      if (maPhieuTuan) {
        toast.info(
          <span>
            Mở phiếu tuần để in / xuất Excel:&nbsp;
            <a
              href={`/print-week/${maPhieuTuan}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fw-bold text-decoration-underline"
            >
              Xem ngay
            </a>
          </span>,
          { autoClose: 6000 },
        );
      }
      fetchHomeData(user.maGV, weekOffset);
      setActiveTab("history");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi gửi phiếu tuần!");
    } finally {
      setSubmittingWeek(false);
    }
  };

  // --- Quick Add ---
  const getDateForCell = (thu) => {
    const d = new Date();
    const day = d.getDay() || 7;
    if (day !== 1) d.setDate(d.getDate() - (day - 1));
    d.setDate(d.getDate() + weekOffset * 7);
    d.setDate(d.getDate() + (thu - 2));
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split("T")[0];
  };

  const handleOpenQuickAdd = (thu, tiet) => {
    setQuickAddData({ thu, tiet, ngayHoc: getDateForCell(thu) });
    setShowQuickAdd(true);
  };

  const handleDeleteTiet = async (tiet) => {
    if (!tiet || !tiet.matkb) return;
    if (tiet.ticketstatus && tiet.ticketstatus !== "BanNhap") {
      toast.warning("Tiết này đã gửi duyệt, không thể xoá.");
      return;
    }
    const ok = window.confirm(
      `Bạn có chắc muốn XOÁ tiết ${tiet.tenmon} - Lớp ${tiet.malop} (Tiết ${tiet.tiethoc}) khỏi lịch dạy?\n\nThao tác này không thể hoàn tác.`,
    );
    if (!ok) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/schedule/${tiet.matkb}`, {
        data: { maGV: user.maGV },
      });
      toast.success(res.data?.msg || "Đã xoá tiết học.");
      setDraftPlans((prev) => {
        if (!prev[tiet.matkb]) return prev;
        const next = { ...prev };
        delete next[tiet.matkb];
        return next;
      });
      fetchHomeData(user.maGV, weekOffset);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Lỗi khi xoá tiết học.");
    }
  };

  // ========= RENDER =========
  if (!user) return null;

  const mainTabs = [
    { key: "home", icon: "bi-house-door", label: "Trang chủ" },
    { key: "history", icon: "bi-clock-history", label: "Lịch sử" },
    { key: "kho", icon: "bi-bag-check", label: "Kho" },
  ];

  return (
    <div className="app-shell">
      {/* HEADER NAVBAR */}
      <nav className="navbar navbar-dark app-navbar px-3 shadow-sm sticky-top">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-sm text-white me-2 touch-btn d-flex align-items-center justify-content-center"
            style={{
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.18)",
            }}
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#teacherSidebar"
            aria-label="Mở menu"
          >
            <i className="bi bi-list fs-4"></i>
          </button>
          <span
            className="navbar-brand mb-0 fw-bold d-flex align-items-center"
            style={{ fontSize: "1.05rem" }}
          >
            <i className="bi bi-mortarboard-fill me-2"></i>
            <span className="d-none d-sm-inline">TH&amp;THCS NAM KHÊ</span>
            <span className="d-inline d-sm-none">NAM KHÊ</span>
          </span>
        </div>
        <div
          className="rounded-circle text-white d-flex justify-content-center align-items-center shadow-sm"
          style={{
            width: "40px",
            height: "40px",
            fontWeight: "bold",
            background:
              "linear-gradient(135deg, var(--accent-500), var(--accent-600))",
          }}
        >
          {user.tenGV.charAt(0)}
        </div>
      </nav>

      {/* SIDEBAR */}
      <div
        className="offcanvas offcanvas-start bg-dark text-white"
        tabIndex="-1"
        id="teacherSidebar"
        style={{ width: "280px" }}
      >
        <div
          className="offcanvas-header border-bottom border-secondary"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-700), var(--brand-900))",
          }}
        >
          <h5 className="offcanvas-title fw-bold">Khu Vực Giáo Viên</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <div
            className="p-3 border-bottom border-secondary d-flex align-items-center"
            style={{ background: "rgba(255,255,255,.04)" }}
          >
            <div
              className="rounded-circle text-white d-flex justify-content-center align-items-center me-3"
              style={{
                width: "50px",
                height: "50px",
                fontSize: "20px",
                fontWeight: "bold",
                background:
                  "linear-gradient(135deg, var(--accent-500), var(--accent-600))",
              }}
            >
              {user.tenGV.charAt(0)}
            </div>
            <div>
              <div className="fw-bold">{user.tenGV}</div>
              <small className="text-light opacity-75">Giáo viên bộ môn</small>
            </div>
          </div>

          <div className="list-group list-group-flush mt-2">
            {[
              {
                key: "home",
                icon: "bi-house-door",
                color: "text-info",
                label: "Trang chủ (Lịch dạy)",
              },
              {
                key: "history",
                icon: "bi-clock-history",
                color: "text-warning",
                label: "Lịch sử mượn",
              },
              {
                key: "kho",
                icon: "bi-bag-check",
                color: "text-danger",
                label: "Kho Thiết Bị",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                data-bs-dismiss="offcanvas"
                onClick={() => setActiveTab(tab.key)}
                className={`list-group-item list-group-item-action bg-transparent text-white border-0 py-3 ${activeTab === tab.key ? "fw-bold" : ""}`}
                style={
                  activeTab === tab.key
                    ? { borderLeft: "4px solid var(--brand-400)" }
                    : {}
                }
              >
                <i className={`bi ${tab.icon} me-3 ${tab.color}`}></i>{" "}
                {tab.label}
              </button>
            ))}

            <div className="border-top border-secondary my-2"></div>

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="list-group-item list-group-item-action bg-transparent text-white border-0 py-3"
              >
                <i className="bi bi-shield-lock me-3 text-danger"></i> Về trang
                Quản Trị
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="list-group-item list-group-item-action bg-transparent text-danger border-0 py-3 text-start w-100"
            >
              <i className="bi bi-box-arrow-right me-3"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="container py-4">
        <div
          className="title-row mb-4 pb-2 border-bottom"
          style={{ borderColor: "var(--border)" }}
        >
          <h4 className="app-page-title">
            <span className="icon-pill">
              <i
                className={
                  activeTab === "home"
                    ? "bi bi-calendar-week-fill"
                    : activeTab === "history"
                      ? "bi bi-clock-history"
                      : "bi bi-bag-check-fill"
                }
              ></i>
            </span>
            <span>
              {activeTab === "home" && "Lịch Dạy Tuần"}
              {activeTab === "history" && "Lịch Sử Mượn Thiết Bị"}
              {activeTab === "kho" && "Kho Thiết Bị"}
            </span>
            {isLoading && (
              <span
                className="spinner-border spinner-border-sm ms-2"
                role="status"
                style={{ color: "var(--brand-600)" }}
              >
                <span className="visually-hidden">Loading...</span>
              </span>
            )}
          </h4>

          {activeTab === "home" && (
            <div className="week-nav d-flex align-items-center gap-2">
              <button
                className="btn btn-brand-outline rounded-circle touch-btn d-flex align-items-center justify-content-center"
                style={{ width: 44, height: 44, padding: 0 }}
                onClick={() => setWeekOffset(weekOffset - 1)}
                aria-label="Tuần trước"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <div
                className="text-center brand-bg-soft px-3 py-2 rounded flex-grow-1"
                style={{ border: "1px solid var(--brand-200)", minWidth: 160 }}
              >
                <div
                  className="fw-bold brand-text"
                  style={{ fontSize: ".95rem" }}
                >
                  Tuần{" "}
                  {weekOffset === 0
                    ? "Hiện tại"
                    : weekOffset > 0
                      ? `+${weekOffset}`
                      : weekOffset}
                </div>
                <div
                  className="small text-muted"
                  style={{ fontSize: ".75rem" }}
                >
                  {(() => {
                    const d1 = new Date(getDateForCell(2));
                    const d2 = new Date(getDateForCell(7));
                    const fmt = (d) =>
                      `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
                    return `${fmt(d1)} - ${fmt(d2)}`;
                  })()}
                </div>
              </div>
              <button
                className="btn btn-brand-outline rounded-circle touch-btn d-flex align-items-center justify-content-center"
                style={{ width: 44, height: 44, padding: 0 }}
                onClick={() => setWeekOffset(weekOffset + 1)}
                aria-label="Tuần sau"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>

        <div className="animate-fade-in position-relative">
          {/* TAB 1: TRANG CHỦ */}
          {activeTab === "home" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-4">
                  <div className="stat-card stat-pending shadow-sm">
                    <div className="stat-icon">
                      <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div>
                      <div className="stat-num">
                        {thongKe.choDuyet < 10
                          ? `0${thongKe.choDuyet}`
                          : thongKe.choDuyet}
                      </div>
                      <div className="stat-label">Phiếu chờ duyệt</div>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div
                    className="stat-card stat-ready shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                      borderColor: "#3b82f6",
                    }}
                  >
                    <div className="stat-icon" style={{ color: "#1d4ed8" }}>
                      <i className="bi bi-box-seam-fill"></i>
                    </div>
                    <div>
                      <div className="stat-num" style={{ color: "#1d4ed8" }}>
                        {thongKe.daChuanBi < 10
                          ? `0${thongKe.daChuanBi}`
                          : thongKe.daChuanBi}
                      </div>
                      <div className="stat-label">Sẵn sàng đến nhận</div>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="stat-card stat-active shadow-sm">
                    <div className="stat-icon">
                      <i className="bi bi-check2-circle"></i>
                    </div>
                    <div>
                      <div className="stat-num">
                        {thongKe.dangMuon < 10
                          ? `0${thongKe.dangMuon}`
                          : thongKe.dangMuon}
                      </div>
                      <div className="stat-label">Đã duyệt / Đang mượn</div>
                    </div>
                  </div>
                </div>
              </div>

              {thongKe.daChuanBi > 0 && (
                <div
                  className="alert alert-primary shadow-sm border-primary d-flex align-items-center mb-4 animate-fade-in"
                  role="alert"
                >
                  <i className="bi bi-box-seam-fill fs-3 text-primary me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1">Thiết bị đã sẵn sàng!</h6>
                    <span>
                      Bạn có <strong>{thongKe.daChuanBi} phiếu</strong> đã được
                      phòng thiết bị chuẩn bị xong. Hãy đến phòng kho để nhận.
                    </span>
                  </div>
                </div>
              )}

              {lichDay.length === 0 ? (
                <p className="text-center text-muted py-5">
                  Chưa có lịch dạy nào được xếp trong tuần này.
                </p>
              ) : (
                <div>
                  {/* Banner Thông báo */}
                  {(() => {
                    const pendingCount = lichDay.filter(
                      (tkb) =>
                        ((!tkb.ticketstatus || tkb.ticketstatus === "BanNhap") &&
                          tkb.suggestions &&
                          tkb.suggestions.length > 0 &&
                          (!draftPlans[tkb.matkb] ||
                            !draftPlans[tkb.matkb].cancelled)) ||
                        ((!tkb.ticketstatus || tkb.ticketstatus === "BanNhap") &&
                          draftPlans[tkb.matkb] &&
                          draftPlans[tkb.matkb].items.length > 0 &&
                          !draftPlans[tkb.matkb].cancelled),
                    ).length;

                    if (pendingCount > 0) {
                      return (
                        <div
                          className="alert alert-warning shadow-sm border-warning d-flex align-items-center mb-4 animate-fade-in"
                          role="alert"
                        >
                          <i className="bi bi-bell-fill fs-3 text-warning me-3"></i>
                          <div>
                            <h6 className="fw-bold mb-1">
                              🔔 Hệ thống nhắc nhở
                            </h6>
                            <span>
                              Bạn có <strong>{pendingCount} bài dạy</strong> yêu
                              cầu thiết bị tuần này. Vui lòng rà soát trên lịch,
                              nháp xong nhớ bấm{" "}
                              <strong>"Gửi Duyệt Tuần"</strong>!
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span className="text-muted small">
                      <i className="bi bi-info-circle me-1"></i> Kế hoạch có thể
                      chỉnh sửa tự do và Lưu Nháp trước khi gửi.
                    </span>
                    <button
                      onClick={handleSubmitWeek}
                      className="btn btn-brand fw-bold touch-btn"
                    >
                      <i className="bi bi-send-check-fill me-2"></i> Gửi Duyệt
                      Tuần{" "}
                      {weekOffset === 0
                        ? "Này"
                        : weekOffset > 0
                          ? `+${weekOffset}`
                          : weekOffset}
                    </button>
                  </div>
                  <WeeklyGrid
                    lichDay={lichDay}
                    draftPlans={draftPlans}
                    weekOffset={weekOffset}
                    onOpenQuickAdd={handleOpenQuickAdd}
                    onXemGoiY={handleXemGoiY}
                    onDeleteTiet={handleDeleteTiet}
                  />
                </div>
              )}
            </>
          )}

          {/* TAB 2: LỊCH SỬ */}
          {activeTab === "history" && (
            <BorrowHistory dsLichSu={dsLichSu} user={user} />
          )}

          {/* TAB 3: KHO */}
          {activeTab === "kho" && (
            <EquipmentShop dsThietBi={dsThietBi} onSelectItem={handleMopKho} />
          )}
        </div>
      </div>

      {/* MODALS */}
      <QuickAddModal
        show={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        thu={quickAddData.thu}
        tiet={quickAddData.tiet}
        ngayHoc={quickAddData.ngayHoc}
        user={user}
        onSuccess={() => fetchHomeData(user.maGV, weekOffset)}
      />

      <SuggestionModal
        show={showModal}
        onClose={() => setShowModal(false)}
        selectedTiet={selectedTiet}
        initialDsGoiY={dsGoiY}
        initialTenbaihoc={
          selectedTiet?.matkb &&
          draftPlans[selectedTiet.matkb]?.tenbaihoc != null
            ? draftPlans[selectedTiet.matkb].tenbaihoc
            : (selectedTiet?.tenbaihoc ?? "")
        }
        initialGhichu={
          selectedTiet?.matkb &&
          draftPlans[selectedTiet.matkb]?.ghichuDieuChinh != null
            ? draftPlans[selectedTiet.matkb].ghichuDieuChinh
            : ""
        }
        onSaveDraft={handleSaveDraft}
        dsThietBi={dsThietBi}
        onRefresh={() => fetchHomeData(user.maGV, weekOffset)}
      />

      <BorrowModal
        show={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        muonItem={muonItem}
        lichDay={lichDay}
        onSubmit={submitDirectBorrow}
      />

      <WeeklyFormPreviewModal
        show={showWeeklyPreview}
        onClose={() => {
          if (submittingWeek) return;
          setShowWeeklyPreview(false);
          setPreviewAdjustNotes({});
        }}
        onConfirm={handleConfirmSubmitWeek}
        user={user}
        rows={previewRows}
        adjustNotes={previewAdjustNotes}
        onAdjustNoteChange={(matkb, value) =>
          setPreviewAdjustNotes((prev) => ({ ...prev, [matkb]: value }))
        }
        conflictPlans={previewWeekPlans.map((plan) => ({
          matkb: plan.tkb.matkb,
          items: plan.items.map((item) => ({
            maloaitb: item.maloaitb,
            soluong: item.soluongdexuat || item.soluong || 1,
          })),
        }))}
        weekRange={previewWeekRange}
        submitting={submittingWeek}
      />

      {/* BOTTOM NAV (mobile only) */}
      <nav className="app-bottom-nav" aria-label="Thanh điều hướng">
        {mainTabs.map((tab) => (
          <button
            key={tab.key}
            className={`nav-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
            aria-label={tab.label}
            aria-current={activeTab === tab.key ? "page" : undefined}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
