const express = require("express");
const router = express.Router();
// Import đủ 3 hàm
//const { createLoanRequest, getPendingRequests, updateStatus, getTeacherHistory, getTopDevices } = require('../controllers/borrowController');
// ... (code cũ)
const {
  createLoanRequest,
  getPendingRequests,
  updateStatus,
  bulkUpdateStatus,
  submitWeeklyPlan,
  getTeacherHistory,
  getTopDevices,
  getTopTeachers,
  getTopSubjects,
  getEquipmentStatus,
  getWarehouseTasks,
  returnEquipment,
  getAllHistoryForExport,
  getBorrowDetails,
} = require("../controllers/borrowController");

// ... (các route cũ)

// [MỚI] Đường dẫn cho trang Kho

router.post("/", createLoanRequest);
router.post("/submit-week", submitWeeklyPlan); // [MỚI] Auto-Draft
router.get("/pending", getPendingRequests);
router.put("/update/:maPhieu", updateStatus); // Đảm bảo dòng này tồn tại
router.put("/bulk-update", bulkUpdateStatus); // [MỚI] Bulk Update

router.get("/history/:maGV", getTeacherHistory);
router.get("/stats/top-devices", getTopDevices);
router.get("/stats/top-teachers", getTopTeachers);
router.get("/stats/top-subjects", getTopSubjects);
router.get("/stats/equipment-status", getEquipmentStatus);
router.get("/warehouse", getWarehouseTasks);
router.put("/return/:maPhieu", returnEquipment);
router.get("/export/all", getAllHistoryForExport);
router.get("/details/:maPhieu", getBorrowDetails); // API Lấy chi tiết phiếu in

module.exports = router;
