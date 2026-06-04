import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const PrintInvoice = () => {
  const { maPhieu } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/borrow/details/${maPhieu}`,
        );
        setData(res.data);
        // Chờ 0.5s để React render DOM rồi bật popup in (hoạt động tốt với Chrome/Edge)
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    fetchData();
  }, [maPhieu]);

  if (error)
    return (
      <div className="text-center mt-5 text-danger fs-4">
        Lỗi: Lấy dữ liệu thất bại hoặc Phiếu mượn không tồn tại!
      </div>
    );
  if (!data)
    return (
      <div className="text-center mt-5 fs-4">
        Đang chuẩn bị trang in... xin vui lòng chờ.
      </div>
    );

  const { phieu, items } = data;

  return (
    <div
      className="container shadow-sm border"
      style={{
        margin: "20px auto",
        maxWidth: "210mm",
        backgroundColor: "#fff",
        padding: "20mm",
        fontFamily: '"Times New Roman", Times, serif',
        color: "#000",
      }}
    >
      <style>
        {`
          @media print {
            body { background-color: white !important; margin: 0; padding: 0; }
            .container { box-shadow: none !important; border: none !important; margin: 0 !important; }
            .no-print { display: none !important; }
            @page { margin: 15mm; size: A4; }
          }
          body { background-color: #f0f2f5; }
        `}
      </style>

      {/* Nút điều hướng (ẩn khi in) */}
      <div className="text-end mb-4 no-print border-bottom pb-3">
        <button
          className="btn btn-secondary me-2 fw-bold"
          onClick={() => window.close()}
        >
          Đóng Trang Này
        </button>
        <button
          className="btn btn-primary fw-bold"
          onClick={() => window.print()}
        >
          <i className="bi bi-printer me-2"></i> In Phiếu Lại
        </button>
      </div>

      {/* Header Quốc hiệu */}
      <div
        className="d-flex justify-content-between mb-4 align-items-start"
        style={{ fontSize: "13pt" }}
      >
        <div className="text-center">
          <div className="fw-bold text-uppercase">TRƯỜNG THCS NAM KHÊ</div>
          <div
            className="fw-bold text-decoration-underline"
            style={{ textUnderlineOffset: "4px" }}
          >
            BỘ PHẬN THIẾT BỊ
          </div>
        </div>
        <div className="text-center">
          <div className="fw-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div
            className="fw-bold text-decoration-underline"
            style={{ textUnderlineOffset: "4px" }}
          >
            Độc lập - Tự do - Hạnh phúc
          </div>
        </div>
      </div>

      <div className="text-center mb-4 mt-5">
        <h3 className="fw-bold" style={{ fontSize: "18pt" }}>
          PHIẾU MƯỢN THIẾT BỊ DẠY HỌC
        </h3>
        <p className="fst-italic m-0" style={{ fontSize: "12pt" }}>
          Mã phiếu: {phieu.maphieu}
        </p>
        <p className="fst-italic m-0" style={{ fontSize: "12pt" }}>
          Trạng thái:{" "}
          <span className="fw-bold">
            {phieu.trangthai === "DaDuyet" ||
            phieu.trangthai === "DangMuon" ||
            phieu.trangthai === "DaTra"
              ? "Đã được duyệt"
              : "Chưa được phê duyệt"}
          </span>
        </p>
      </div>

      <div className="mb-4" style={{ lineHeight: "1.8", fontSize: "14pt" }}>
        <p className="mb-1">
          Họ và tên giáo viên mượn: <strong>{phieu.tengv}</strong>
        </p>
        <p className="mb-1">
          Tham gia giảng dạy môn: <strong>{phieu.tenmon}</strong>{" "}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tại lớp:{" "}
          <strong>{phieu.malop}</strong>
        </p>
        <p className="mb-1">
          Sử dụng trong Tiết <strong>{phieu.tiethoc}</strong> ngày{" "}
          <strong>{new Date(phieu.ngayhoc).toLocaleDateString("vi-VN")}</strong>
        </p>
        <p className="mb-1">
          Tên bài dạy:{" "}
          <strong>{phieu.tenbaihoc || "(Không có trong PPCT)"}</strong>
        </p>
      </div>

      <p className="fw-bold mt-4" style={{ fontSize: "14pt" }}>
        Chi tiết thiết bị xuất kho:
      </p>
      <table
        className="table table-bordered border-dark text-center align-middle mb-4"
        style={{ fontSize: "13pt" }}
      >
        <thead className="table-light">
          <tr>
            <th style={{ width: "8%" }}>STT</th>
            <th style={{ width: "55%" }}>Tên thiết bị / Đồ dùng</th>
            <th style={{ width: "15%" }}>ĐVT</th>
            <th style={{ width: "10%" }}>SL</th>
            <th style={{ width: "12%" }}>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td className="text-start px-3">{item.tenloai}</td>
              <td>{item.donvitinh}</td>
              <td className="fw-bold">{item.soluongdk}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row mt-5 text-center" style={{ fontSize: "13pt" }}>
        <div className="col-6">
          <p className="fw-bold mb-5">Cán bộ phụ trách Thư viện / Thiết bị</p>
          <p className="fst-italic" style={{ marginTop: "100px" }}>
            (Ký và ghi rõ họ tên)
          </p>
        </div>
        <div className="col-6">
          <p className="fst-italic mb-1">
            Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{" "}
            {new Date().getFullYear()}
          </p>
          <p className="fw-bold mb-5">Giáo viên nhận bàn giao</p>
          <p className="fst-italic" style={{ marginTop: "100px" }}>
            (Ký và ghi rõ họ tên)
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;
