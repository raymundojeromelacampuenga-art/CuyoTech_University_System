// Usage: npm run seed   (resets the database and inserts demo data)
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    multipleStatements: true,
  });
  await c.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  const hash = await bcrypt.hash("password123", 10);

  const students = [
    // id, name, status, fees, library, department
    [
      "2024-00128",
      "Mika Dela Cruz",
      "Enrolled",
      18500,
      ["Action required", "Return 1 borrowed book"],
      ["Pending review", "Adviser review in progress"],
    ],
    [
      "2024-00131",
      "Paolo Reyes",
      "Enrolled",
      20000,
      ["Cleared", "No borrowed books"],
      ["Pending review", null],
    ],
    [
      "2024-00145",
      "Liza Santos",
      "Pending",
      12500,
      ["Cleared", "No borrowed books"],
      ["Pending review", null],
    ],
    [
      "2024-00152",
      "Ramon Cruz",
      "Enrolled",
      15000,
      ["Cleared", "No borrowed books"],
      ["Cleared", "Adviser approved"],
    ],
    [
      "2024-00160",
      "Ella Tan",
      "Pending",
      8000,
      ["Cleared", "No borrowed books"],
      ["Pending review", null],
    ],
  ];
  const staff = [
    ["REG-001", "Elena Navarro", "Registrar"],
    ["CSH-001", "Ben Aquino", "Cashier"],
    ["DEP-001", "Dr. Carlo Mendoza", "Department"],
    ["ADM-001", "Admin Rivera", "Admin"],
  ];

  await c.query("INSERT INTO users (id, name, role, password_hash) VALUES ?", [
    [
      ...students.map((s) => [s[0], s[1], "Student", hash]),
      ...staff.map((s) => [s[0], s[1], s[2], hash]),
    ],
  ]);
  await c.query(
    "INSERT INTO departments (name) VALUES ('College of Computer Studies')",
  );
  await c.query(
    "INSERT INTO programs (name, dept_id) VALUES ('BS Information Technology', 1)",
  );
  await c.query(
    "INSERT INTO students (student_id, enrollment_status, total_fees) VALUES ?",
    [students.map((s) => [s[0], s[2], s[3]])],
  );
  await c.query(
    "UPDATE students SET email='mika.delacruz@cuyotech.edu.ph', mobile='0917 842 6128', address='Cuyo, Palawan', emergency_name='Ana Dela Cruz', emergency_rel='Mother', emergency_contact='0918 506 4382' WHERE student_id='2024-00128'",
  );

  const courses = [
    ["IT 311", "Information Assurance and Security"],
    ["IT 312", "Integrative Programming and Technologies"],
    ["IT 313", "Networking 2"],
    ["GE 108", "Ethics"],
    ["IT 314", "Database Administration"],
    ["IT 315", "Web Systems and Technologies"],
    ["GE 109", "Life and Works of Rizal"],
  ];
  const mids = [1.75, 1.5, 2.0, 1.5, 1.75, 1.5, 1.75];
  await c.query("INSERT INTO courses (code, title, units) VALUES ?", [
    courses.map((x) => [x[0], x[1], 3]),
  ]);
  await c.query(
    "INSERT INTO grades (student_id, course_code, midterm_grade) VALUES ?",
    [students.flatMap((s) => courses.map((x, i) => [s[0], x[0], mids[i]]))],
  );

  await c.query(
    "INSERT INTO clearances (student_id, office, status, remarks) VALUES ?",
    [
      students.flatMap((s) => [
        [s[0], "Library", s[4][0], s[4][1]],
        [s[0], "Department", s[5][0], s[5][1]],
        [s[0], "Student affairs", "Cleared", "Student requirements complete"],
      ]),
    ],
  );

  const pay = [
    ["OR-2026-0001", "2024-00128", 18500, "Cash", "2026-10-03 10:00:00"],
    ["OR-2026-0002", "2024-00152", 15000, "GCash", "2026-10-05 14:30:00"],
    ["OR-2026-0003", "2024-00131", 15500, "Cash", "2026-10-06 09:15:00"],
  ];
  await c.query(
    "INSERT INTO payments (or_no, student_id, amount, method, paid_at, received_by) VALUES ?",
    [pay.map((p) => [...p, "CSH-001"])],
  );

  const D = [
    "Transcript of Records",
    "Certificate of Registration",
    "Certification",
  ];
  const reqs = [
    [
      "DOC-2026-0148",
      "2024-00128",
      D[2],
      "Scholarship application",
      "Ready for release",
      "2026-10-05 09:00:00",
    ],
    [
      "DOC-2026-0147",
      "2024-00131",
      D[0],
      "Job application",
      "Submitted",
      "2026-10-04 11:00:00",
    ],
    [
      "DOC-2026-0146",
      "2024-00152",
      D[1],
      "Enrollment",
      "Processing",
      "2026-10-03 13:00:00",
    ],
    [
      "DOC-2026-0143",
      "2024-00128",
      D[0],
      "Job application",
      "Processing",
      "2026-10-02 08:30:00",
    ],
    [
      "DOC-2026-0131",
      "2024-00128",
      D[1],
      "Enrollment",
      "Released",
      "2026-09-25 10:00:00",
    ],
    [
      "DOC-2026-0109",
      "2024-00128",
      D[2],
      "Internship",
      "Released",
      "2026-09-18 10:00:00",
    ],
  ];
  await c.query(
    "INSERT INTO document_requests (request_no, student_id, doc_type, purpose, status, created_at) VALUES ?",
    [reqs],
  );

  console.log(
    "Database ready. Sign in with any of: 2024-00128, REG-001, CSH-001, DEP-001, ADM-001 (password: password123)",
  );
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
