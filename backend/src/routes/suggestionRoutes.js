const express = require("express");
const router = express.Router();
const { getSuggestions } = require("../controllers/suggestionController");

// Đường dẫn sẽ là: /api/suggestion/:maTKB
// Ví dụ: /api/suggestion/1 (Lấy gợi ý cho Tiết có ID là 1)
router.get("/:maTKB", getSuggestions);

module.exports = router;
