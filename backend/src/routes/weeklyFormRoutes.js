const express = require("express");
const router = express.Router();
const {
  listForAdmin,
  listForTeacher,
  getDetail,
  approveAll,
  rejectAll,
  updateRows,
  markPrepared,
} = require("../controllers/weeklyFormController");

router.get("/", listForAdmin);
router.get("/me/:maGV", listForTeacher);
router.get("/:id", getDetail);
router.put("/:id/approve", approveAll);
router.put("/:id/reject", rejectAll);
router.put("/:id/rows", updateRows);
router.put("/:id/prepare", markPrepared);

module.exports = router;
