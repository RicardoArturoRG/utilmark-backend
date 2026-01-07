// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: "utilmark",  // ← CAMBIADO DE "UTILMARK" a "utilmark"
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00"
});

const getConnection = async () => {
  const conn = await pool.getConnection();
  return conn;
};

export default {
  pool,
  query: (...args) => pool.query(...args),
  getConnection
};