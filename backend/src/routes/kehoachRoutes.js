const express = require("express");
const router = express.Router();
const {
  getKeHoach,
  saveKeHoach,
  getPpct,
} = require("../controllers/kehoachController");

router.get("/", getKeHoach);
router.post("/save", saveKeHoach);
router.get("/ppct", getPpct);

module.exports = router;
