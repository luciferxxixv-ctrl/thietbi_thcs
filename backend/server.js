const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./src/config/db");

// --- [MỚI] Import Routes ---
const scheduleRoutes = require("./src/routes/scheduleRoutes");
const suggestionRoutes = require("./src/routes/suggestionRoutes");

const borrowRoutes = require("./src/routes/borrowRoutes");
const authRoutes = require("./src/routes/authRoutes");
const teacherRoutes = require("./src/routes/teacherRoutes");
const planRoutes = require("./src/routes/planRoutes");
const equipmentRoutes = require("./src/routes/equipmentRoutes");
const kehoachRoutes = require("./src/routes/kehoachRoutes");
const weeklyFormRoutes = require("./src/routes/weeklyFormRoutes");
const warehouseRoutes = require("./src/routes/warehouseRoutes");
const notifyRoutes = require("./src/routes/notifyRoutes");
const subjectRoutes = require("./src/routes/subjectRoutes"); // [MỚI]
const ppctRoutes = require("./src/routes/ppctRoutes"); // [MỚI]
const { initSocket } = require("./src/utils/socket"); // [MỚI] Import socket

const app = express();
const http = require("http"); // [MỚI]
const server = http.createServer(app); // [MỚI]

// Khởi tạo Socket.io
initSocket(server);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          cb(new Error("CORS not allowed"));
        }
      : true,
    credentials: true,
  })
);
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("API Quản lý Thiết bị đang chạy...");
});

// Phục vụ file tĩnh cho hình ảnh
app.use("/uploads", express.static("uploads"));

// Middleware bảo vệ API
const { verifyToken } = require('./src/middlewares/authMiddleware');

// --- [MỚI] Sử dụng Routes ---
// Public API
app.use("/api/auth", authRoutes);
app.get("/api/warehouse/qr/:type/:code", require("./src/controllers/warehouseController").generateQR);

// Protected APIs (Bắt buộc phải có Token)
app.use("/api", verifyToken); 

app.use("/api/schedule", scheduleRoutes);
app.use("/api/suggestion", suggestionRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/kehoach", kehoachRoutes);
app.use("/api/weekly-form", weeklyFormRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/notify", notifyRoutes);
app.use("/api/subjects", subjectRoutes); // [MỚI]
app.use("/api/ppct", ppctRoutes); // [MỚI]

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
