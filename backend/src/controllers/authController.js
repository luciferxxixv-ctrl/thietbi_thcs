const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_thietbi_thcs"; // Đặt secret key ở đây hoặc trong .env

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user trong bảng GIAO_VIEN (Admin cũng đã có trong bảng này)
    const query = `SELECT * FROM GIAO_VIEN WHERE TaiKhoan = $1`;
    const result = await pool.query(query, [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // So sánh mật khẩu bằng bcrypt
      const isMatch = await bcrypt.compare(password, user.matkhau);
      
      if (isMatch) {
        // Phân quyền: nếu magv là ADMIN thì role là admin, còn lại là teacher
        const role = user.magv === "ADMIN" ? "admin" : "teacher";

        // Tạo JWT token
        const token = jwt.sign(
          { maGV: user.magv, role: role },
          JWT_SECRET,
          { expiresIn: "7d" } // Token có hạn 7 ngày
        );

        // Trả về thông tin và token
        res.status(200).json({
          token,
          maGV: user.magv, // Postgres trả về chữ thường nếu không alias, cẩn thận! Ở đây user.magv thường đã đúng.
          tenGV: user.tengv,
          role: role,
        });
      } else {
        res.status(401).json({ msg: "Sai tài khoản hoặc mật khẩu!" });
      }
    } else {
      res.status(401).json({ msg: "Sai tài khoản hoặc mật khẩu!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi Server" });
  }
};

const migratePasswords = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT magv, matkhau FROM giao_vien");
    let updated = 0;
    for (const row of rows) {
      if (!row.matkhau || row.matkhau.startsWith("$2")) continue;
      const hashed = await bcrypt.hash(row.matkhau, 10);
      await pool.query("UPDATE giao_vien SET matkhau = $1 WHERE magv = $2", [hashed, row.magv]);
      updated++;
    }
    res.json({ msg: `Đã hash ${updated}/${rows.length} mật khẩu plaintext.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Lỗi migrate passwords" });
  }
};

module.exports = { login, migratePasswords };
