const express = require("express");
const router = express.Router();
const {
  listSubjectsMissing,
  remindWeek,
  remindTeacher,
} = require("../controllers/notifyController");

router.get("/missing-submitters", listSubjectsMissing);
router.post("/remind-week", remindWeek);
router.post("/remind-teacher", remindTeacher);

module.exports = router;
