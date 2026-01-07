// src/config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,                 // ✅ SiteGround host
  user: process.env.DB_USER,                 // ✅ usuario BD SiteGround
  password: process.env.DB_PASSWORD,         // ✅ password BD SiteGround
  database: process.env.DB_NAME,             // ✅ nombre BD SiteGround
  port: Number(process.env.DB_PORT || 3306), // ✅ por si cambia
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z"                              // ✅ UTC (equivalente a +00:00)
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
