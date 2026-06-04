const express = require("express");
const router = express.Router();
const {
  getTeachers,
  addTeacher,
  deleteTeacher,
  updateTeacherEmail,
  updateTeacher,
  resetPassword,
} = require("../controllers/teacherController");

router.get("/", getTeachers);
router.post("/", addTeacher);
router.put("/:id/email", updateTeacherEmail);
router.put("/:id", updateTeacher);
router.post("/:id/reset-password", resetPassword);
router.delete("/:id", deleteTeacher);

module.exports = router;
