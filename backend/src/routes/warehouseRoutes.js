const express = require("express");
const router = express.Router();
const {
  checkConflict,
  returnEquipmentDetailed,
  getReturnFormData,
  getConditionSummary,
  getDamageHistory,
  generateQR,
  scanQRAction,
  adjustEquipmentCondition,
} = require("../controllers/warehouseController");

// Cảnh báo xung đột (gọi trước khi gửi phiếu / nháp)
router.post("/check-conflict", checkConflict);

// Nhận trả chi tiết
router.get("/borrow-detail/:maPhieu", getReturnFormData);
router.put("/return-detail/:maPhieu", returnEquipmentDetailed);

// Tình trạng & lịch sử
router.get("/condition-summary", getConditionSummary);
router.get("/damage-history", getDamageHistory);
router.get("/damage-history/:maLoaiTB", getDamageHistory);
router.put("/equipment/:id/condition", adjustEquipmentCondition);

// QR
router.get("/qr/:type/:code", generateQR);
router.post("/scan", scanQRAction);

module.exports = router;
