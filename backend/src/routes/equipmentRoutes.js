const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getAllEquipment,
  addEquipment,
  updateEquipment,
} = require("../controllers/equipmentController");

// Lưu ảnh vào bộ nhớ (RAM) rồi đẩy lên imgbb thay vì lưu xuống ổ đĩa.
// Lý do: server (Render) dùng filesystem tạm thời, ảnh lưu đĩa sẽ mất sau mỗi
// lần deploy. Lưu trên imgbb giúp ảnh tồn tại vĩnh viễn.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 32 * 1024 * 1024 }, // imgbb cho tối đa 32MB
});

// Routes
router.get("/", getAllEquipment);
router.post("/", upload.single("image"), addEquipment);

router.put("/:id", upload.single("image"), updateEquipment);
module.exports = router;
