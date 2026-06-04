// API base URL — lấy từ biến môi trường trên Vercel hoặc rỗng (proxy local)
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// Danh sách thứ trong tuần (grid lịch dạy)
export const DAYS = [2, 3, 4, 5, 6, 7];

// Danh sách địa điểm học
export const LOCATIONS = [
  "Lớp học",
  "Phòng Tin",
  "Bãi tập",
  "Phòng TH Lý",
  "Phòng TH Hóa",
  "Phòng TH Sinh",
];
