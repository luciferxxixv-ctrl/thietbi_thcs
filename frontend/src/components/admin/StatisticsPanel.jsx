import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../shared/constants";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsPanel() {
  const [deviceStats, setDeviceStats] = useState({ labels: [], datasets: [] });
  const [teacherStats, setTeacherStats] = useState({ labels: [], datasets: [] });
  const [subjectStats, setSubjectStats] = useState({ labels: [], datasets: [] });
  const [equipStatus, setEquipStatus] = useState({
    tongthietbi: 0,
    thietbitot: 0,
    thietbihong: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const [resDevices, resTeachers, resSubjects, resStatus] = await Promise.all([
        axios.get(`${API_BASE}/api/borrow/stats/top-devices`),
        axios.get(`${API_BASE}/api/borrow/stats/top-teachers`),
        axios.get(`${API_BASE}/api/borrow/stats/top-subjects`),
        axios.get(`${API_BASE}/api/borrow/stats/equipment-status`),
      ]);

      setDeviceStats({
        labels: resDevices.data.map((item) => item.tenloai),
        datasets: [
          {
            label: "Số lượt mượn",
            data: resDevices.data.map((item) => item.tongmuon),
            backgroundColor: "rgba(13, 148, 136, 0.7)", // teal
            borderColor: "rgba(13, 148, 136, 1)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      });

      setTeacherStats({
        labels: resTeachers.data.map((item) => item.tengv),
        datasets: [
          {
            label: "Số phiếu mượn",
            data: resTeachers.data.map((item) => item.soluotmuon),
            backgroundColor: "rgba(245, 158, 11, 0.7)", // amber
            borderColor: "rgba(245, 158, 11, 1)",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      });

      setSubjectStats({
        labels: resSubjects.data.map((item) => item.tenmon),
        datasets: [
          {
            data: resSubjects.data.map((item) => item.soluotmuon),
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(244, 63, 94, 0.7)",
              "rgba(139, 92, 246, 0.7)",
              "rgba(249, 115, 22, 0.7)",
            ],
            borderWidth: 1,
          },
        ],
      });

      setEquipStatus(resStatus.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu thống kê", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-brand-600" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const statusChartData = {
    labels: ["Thiết bị tốt", "Hư hỏng / Mất"],
    datasets: [
      {
        data: [equipStatus.thietbitot, equipStatus.thietbihong],
        backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(239, 68, 68, 0.8)"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="container-fluid p-0">
      <h5 className="fw-bold text-brand-700 mb-4 border-bottom pb-2">
        <i className="bi bi-bar-chart-fill me-2"></i> Tổng Quan & Thống Kê
      </h5>

      {/* Overview Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-primary text-white h-100">
            <div className="card-body d-flex align-items-center">
              <div className="fs-1 me-3 opacity-50"><i className="bi bi-boxes"></i></div>
              <div>
                <div className="text-uppercase fw-bold" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Tổng Thiết Bị Kho</div>
                <div className="fs-2 fw-bold">{equipStatus.tongthietbi}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-success text-white h-100">
            <div className="card-body d-flex align-items-center">
              <div className="fs-1 me-3 opacity-50"><i className="bi bi-check-circle"></i></div>
              <div>
                <div className="text-uppercase fw-bold" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Tình Trạng Tốt</div>
                <div className="fs-2 fw-bold">{equipStatus.thietbitot}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 bg-danger text-white h-100">
            <div className="card-body d-flex align-items-center">
              <div className="fs-1 me-3 opacity-50"><i className="bi bi-exclamation-triangle"></i></div>
              <div>
                <div className="text-uppercase fw-bold" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Hư Hỏng / Cần Bảo Trì</div>
                <div className="fs-2 fw-bold">{equipStatus.thietbihong}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Top Teachers */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold text-dark border-bottom-0 pt-3">
              <i className="bi bi-person-hearts text-warning me-2"></i> Giáo viên tích cực mượn đồ
            </div>
            <div className="card-body">
              {teacherStats.labels.length > 0 ? (
                <Bar 
                  options={{ responsive: true, plugins: { legend: { display: false } } }} 
                  data={teacherStats} 
                />
              ) : (
                <p className="text-center text-muted my-5">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Devices */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold text-dark border-bottom-0 pt-3">
              <i className="bi bi-tools text-info me-2"></i> Thiết bị được sử dụng nhiều nhất
            </div>
            <div className="card-body">
              {deviceStats.labels.length > 0 ? (
                <Bar 
                  options={{ responsive: true, plugins: { legend: { display: false } } }} 
                  data={deviceStats} 
                />
              ) : (
                <p className="text-center text-muted my-5">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Subjects (Pie Chart) */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold text-dark border-bottom-0 pt-3">
              <i className="bi bi-book text-primary me-2"></i> Tỉ lệ mượn theo Môn Học
            </div>
            <div className="card-body d-flex justify-content-center">
              <div style={{ width: "300px" }}>
                {subjectStats.labels.length > 0 ? (
                  <Doughnut data={subjectStats} />
                ) : (
                  <p className="text-center text-muted my-5">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Status (Pie Chart) */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold text-dark border-bottom-0 pt-3">
              <i className="bi bi-pie-chart text-success me-2"></i> Tỉ lệ tình trạng Kho
            </div>
            <div className="card-body d-flex justify-content-center">
              <div style={{ width: "300px" }}>
                {equipStatus.tongthietbi > 0 ? (
                  <Pie data={statusChartData} />
                ) : (
                  <p className="text-center text-muted my-5">Kho trống</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
