const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getAllEquipment,
  addEquipment,
  updateEquipment,
} = require("../controllers/equipmentController");

// Cấu hình Multer để upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Routes
router.get("/", getAllEquipment);
router.post("/", upload.single("image"), addEquipment);

router.put("/:id", upload.single("image"), updateEquipment);
module.exports = router;
