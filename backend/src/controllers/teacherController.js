const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

// Lấy danh sách toàn bộ giáo viên
const getTeachers = async (req, res) => {
  try {
    const query = `SELECT MaGV, TenGV, TaiKhoan, Email FROM GIAO_VIEN ORDER BY MaGV ASC`;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách GV:", err);
    res.status(500).send("Lỗi Server");
  }
};

// Thêm giáo viên mới
const addTeacher = async (req, res) => {
  try {
    const { maGV, tenGV, taiKhoan, matKhau, email } = req.body;

    const plainPass = matKhau || "123456";
    const hashedPass = await bcrypt.hash(plainPass, 10);
    const em = email && String(email).trim() ? String(email).trim() : null;

    const query = `
            INSERT INTO GIAO_VIEN (MaGV, TenGV, TaiKhoan, MatKhau, Email) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
    const result = await pool.query(query, [maGV, tenGV, taiKhoan, hashedPass, em]);

    res
      .status(201)
      .json({ msg: "Thêm giáo viên thành công!", data: result.rows[0] });
  } catch (err) {
    console.error("Lỗi thêm GV:", err);
    res
      .status(500)
      .json({ msg: "Lỗi: Mã GV hoặc Tài khoản có thể đã tồn tại!" });
  }
};

// Xóa giáo viên
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM GIAO_VIEN WHERE MaGV = $1`, [id]);
    res.status(200).json({ msg: "Đã xóa giáo viên!" });
  } catch (err) {
    console.error("Lỗi xóa GV:", err);
    res
      .status(500)
      .json({ msg: "Không thể xóa GV này vì họ đã có lịch sử mượn đồ!" });
  }
};

const updateTeacherEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body || {};
    const v =
      email != null && String(email).trim() !== ""
        ? String(email).trim()
        : null;
    await pool.query(`UPDATE GIAO_VIEN SET Email = $1 WHERE MaGV = $2`, [
      v,
      id,
    ]);
    res.status(200).json({ msg: "Đã cập nhật email." });
  } catch (err) {
    console.error("updateTeacherEmail:", err);
    res.status(500).json({ msg: "Lỗi cập nhật email." });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenGV, taiKhoan, email } = req.body;
    const em = email && String(email).trim() ? String(email).trim() : null;

    const query = `
      UPDATE GIAO_VIEN 
      SET TenGV = $1, TaiKhoan = $2, Email = $3 
      WHERE MaGV = $4
    `;
    await pool.query(query, [tenGV, taiKhoan, em, id]);
    res.status(200).json({ msg: "Cập nhật thông tin giáo viên thành công!" });
  } catch (err) {
    console.error("Lỗi cập nhật GV:", err);
    res.status(500).json({ msg: "Lỗi cập nhật. Tài khoản có thể đã trùng với người khác!" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const hashedPass = await bcrypt.hash("123456", 10);
    await pool.query(`UPDATE GIAO_VIEN SET MatKhau = $1 WHERE MaGV = $2`, [hashedPass, id]);
    res.status(200).json({ msg: "Đã khôi phục mật khẩu về mặc định (123456)!" });
  } catch (err) {
    console.error("Lỗi reset password:", err);
    res.status(500).json({ msg: "Lỗi hệ thống khi khôi phục mật khẩu." });
  }
};

module.exports = { getTeachers, addTeacher, deleteTeacher, updateTeacherEmail, updateTeacher, resetPassword };
