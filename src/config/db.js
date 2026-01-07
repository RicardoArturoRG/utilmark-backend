// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de conexión (opcional pero recomendado)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL conectado correctamente");
    conn.release();
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
  }
})();

export default pool;
