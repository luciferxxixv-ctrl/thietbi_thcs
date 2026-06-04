const express = require("express");
const router = express.Router();
const {
  getSchedule,
  getWeeklySchedule,
  deleteSchedule,
  updatePpct,
} = require("../controllers/scheduleController");

// Đường dẫn GET lịch tuần (đặt trước /:maGV để tránh nhầm "weekly" thành mã GV)
router.get("/weekly/:maGV", getWeeklySchedule);

// Giáo viên xoá một tiết khỏi lịch của mình
router.delete("/:matkb", deleteSchedule);

// Cập nhật phân phối chương trình
router.post("/update-ppct", updatePpct);

// Định nghĩa đường dẫn GET /:maGV
router.get("/:maGV", getSchedule);

module.exports = router;
