const express = require("express");
const router = express.Router();
const { login, migratePasswords } = require("../controllers/authController");

router.post("/login", login);
router.post("/migrate-passwords", migratePasswords);

module.exports = router;
