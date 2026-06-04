const { Pool } = require("pg");
require("dotenv").config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

const connectDB = async () => {
  try {
    await pool.connect();
    console.log("✅ Đã kết nối thành công với PostgreSQL!");
  } catch (err) {
    console.error("❌ Lỗi kết nối Database:", err.message);
  }
};

module.exports = { pool, connectDB };
