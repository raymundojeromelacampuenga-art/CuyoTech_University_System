require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });
  await conn.query(fs.readFileSync("schema.sql", "utf8"));
  console.log("Schema loaded.");
  await conn.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
