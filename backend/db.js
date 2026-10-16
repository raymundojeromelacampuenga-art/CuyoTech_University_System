require("dotenv").config();
module.exports = require("mysql2/promise").createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: "cuyotech_ssis",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});
