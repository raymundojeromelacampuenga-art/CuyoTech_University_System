require("dotenv").config();

module.exports = require("mysql2/promise").createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "cuyotech_ssis",
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});
