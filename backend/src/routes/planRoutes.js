const express = require("express");
const router = express.Router();
const {
  generateSchedule,
  shiftSchedule,
  importTKB,
  importPPCT,
  quickAddSchedule,
  importCSV,
  getPpctBySubject,
} = require("../controllers/planController");

router.post("/generate", generateSchedule);
router.post("/shift", shiftSchedule);
router.post("/import-tkb", importTKB);
router.post("/import-ppct", importPPCT);
router.post("/import-csv", importCSV);
router.post("/quick-add", quickAddSchedule);
router.get("/ppct/:mamon", getPpctBySubject);

module.exports = router;
