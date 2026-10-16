require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TEMP_PW = "Temp@2026";
const DOCS = [
  "Transcript of Records",
  "Certificate of Registration",
  "Certification",
];
const RELEASES = ["Office pickup", "Authorized representative"];
const METHODS = ["Cash", "GCash", "Bank transfer"];
const NEXT = {
  Submitted: "Processing",
  Processing: "Ready for release",
  "Ready for release": "Released",
};
const PREFIX = {
  Registrar: "REG-",
  Cashier: "CSH-",
  Department: "DEP-",
  Admin: "ADM-",
};
const pad = (n, w) => String(n).padStart(w, "0");
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error(e);
    bad(res, "Server error. Please try again.", 500);
  });
const log = (uid, action) =>
  db.query("INSERT INTO activity_log (user_id, action) VALUES (?, ?)", [
    uid,
    action,
  ]);

// Verifies the JWT, re-checks the account is still active, and restricts by role.
const auth =
  (...roles) =>
  async (req, res, next) => {
    try {
      const { id } = jwt.verify(
        (req.headers.authorization || "").replace("Bearer ", ""),
        SECRET,
      );
      const [[u]] = await db.query(
        "SELECT id, name, role, status FROM users WHERE id = ?",
        [id],
      );
      if (!u || u.status !== "Active")
        return bad(res, "Your account is not active.", 401);
      req.user = u;
    } catch {
      return bad(res, "Please sign in again.", 401);
    }
    if (roles.length && !roles.includes(req.user.role))
      return bad(res, "You do not have access to this module.", 403);
    next();
  };

/* ---------- shared queries ---------- */
const REQ_SQL = `SELECT r.request_no AS \`no\`, r.doc_type AS doc, DATE_FORMAT(r.created_at, '%d %b %Y') AS date, r.status, r.purpose,
  r.copies, r.release_option AS \`release\`, r.student_id AS sid, u.name AS student
  FROM document_requests r JOIN users u ON u.id = r.student_id`;
const PROFILE_SQL = `SELECT u.id, u.name, s.section, s.year_level AS year, s.enrollment_status AS status,
  COALESCE(s.email,'—') AS email, COALESCE(s.mobile,'—') AS mobile, COALESCE(s.address,'—') AS address,
  COALESCE(s.emergency_name,'—') AS emergency, COALESCE(s.emergency_rel,'—') AS relationship, COALESCE(s.emergency_contact,'—') AS econtact,
  p.name AS program, d.name AS college
  FROM users u JOIN students s ON s.student_id = u.id JOIN programs p ON p.program_id = s.program_id JOIN departments d ON d.dept_id = p.dept_id WHERE u.id = ?`;
const GRADE_SQL = `SELECT c.code, c.title, c.units, g.midterm_grade AS mid, g.final_grade AS fin
  FROM courses c LEFT JOIN grades g ON g.course_code = c.code AND g.student_id = ? ORDER BY c.code`;
const BALANCE_SQL = `SELECT u.id, u.name, s.total_fees - COALESCE(SUM(p.amount), 0) AS balance
  FROM students s JOIN users u ON u.id = s.student_id LEFT JOIN payments p ON p.student_id = s.student_id
  GROUP BY u.id, u.name, s.total_fees ORDER BY u.id`;
const PAY_SQL = `SELECT p.or_no AS receipt, p.student_id AS sid, u.name, p.amount, p.method, p.purpose, DATE_FORMAT(p.paid_at, '%b %e, %Y') AS date
  FROM payments p JOIN users u ON u.id = p.student_id`;

async function clearanceFor(sid) {
  const [[s]] = await db.query(
    `SELECT s.enrollment_status AS st, s.total_fees - COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.student_id), 0) AS balance FROM students s WHERE s.student_id = ?`,
    [sid],
  );
  const [rows] = await db.query(
    "SELECT office, status, remarks, DATE_FORMAT(updated_at, '%b %e, %Y') AS d FROM clearances WHERE student_id = ?",
    [sid],
  );
  const m = Object.fromEntries(rows.map((r) => [r.office, r]));
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const bal = Number(s.balance),
    ok = s.st === "Enrolled";
  const row = (o) => [
    o,
    m[o]?.status || "Pending review",
    m[o]?.remarks || "Awaiting review",
    m[o]?.d || today,
  ];
  return [
    [
      "Registrar",
      ok ? "Cleared" : "Pending review",
      ok ? "Enrollment record verified" : "Enrollment awaiting approval",
      today,
    ],
    [
      "Cashier",
      bal <= 0 ? "Cleared" : "Action required",
      bal <= 0
        ? "No outstanding balance"
        : `Unpaid balance of ₱${bal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      today,
    ],
    row("Library"),
    row("Department"),
    row("Student affairs"),
  ];
}

/* ---------- auth ---------- */
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post(
  "/api/auth/login",
  wrap(async (req, res) => {
    const { id = "", password = "" } = req.body;
    const [[u]] = await db.query("SELECT * FROM users WHERE id = ?", [
      String(id).trim(),
    ]);
    if (!u || !(await bcrypt.compare(String(password), u.password_hash)))
      return bad(res, "Incorrect University ID or password.", 401);
    if (u.status !== "Active")
      return bad(
        res,
        "This account is deactivated. Please contact the administrator.",
        403,
      );
    await log(u.id, "Signed in");
    res.json({
      token: jwt.sign({ id: u.id }, SECRET, { expiresIn: "8h" }),
      user: { id: u.id, name: u.name, role: u.role },
    });
  }),
);
app.get("/api/auth/me", auth(), (req, res) => res.json(req.user));

/* ---------- student ---------- */
const S = auth("Student");
app.get(
  "/api/student/profile",
  S,
  wrap(async (req, res) => {
    const [[p]] = await db.query(PROFILE_SQL, [req.user.id]);
    p ? res.json(p) : bad(res, "Student record not found.", 404);
  }),
);
app.get(
  "/api/student/overview",
  S,
  wrap(async (req, res) => {
    const [[profile]] = await db.query(PROFILE_SQL, [req.user.id]);
    if (!profile) return bad(res, "Student record not found.", 404);
    const [requests] = await db.query(
      `${REQ_SQL} WHERE r.student_id = ? ORDER BY r.id DESC`,
      [req.user.id],
    );
    res.json({ profile, requests, clearance: await clearanceFor(req.user.id) });
  }),
);
app.get(
  "/api/student/grades",
  S,
  wrap(async (req, res) => {
    const [rows] = await db.query(GRADE_SQL, [req.user.id]);
    res.json(rows.map((r) => [r.code, r.title, r.units, r.mid, r.fin]));
  }),
);
app.get(
  "/api/student/clearance",
  S,
  wrap(async (req, res) => res.json(await clearanceFor(req.user.id))),
);
app.get(
  "/api/student/requests",
  S,
  wrap(async (req, res) => {
    const [rows] = await db.query(
      `${REQ_SQL} WHERE r.student_id = ? ORDER BY r.id DESC`,
      [req.user.id],
    );
    res.json(rows);
  }),
);
app.post(
  "/api/student/requests",
  S,
  wrap(async (req, res) => {
    const {
      doc,
      purpose = "",
      copies = 1,
      release = "Office pickup",
      notes = "",
    } = req.body;
    if (!DOCS.includes(doc)) return bad(res, "Choose a valid document type.");
    if (!String(purpose).trim())
      return bad(res, "Please tell the Registrar the purpose of this request.");
    const n = Number(copies);
    if (!(n >= 1 && n <= 10))
      return bad(res, "Copies must be between 1 and 10.");
    if (!RELEASES.includes(release)) return bad(res, "Invalid release option.");
    const [[{ next }]] = await db.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(request_no, 10) AS UNSIGNED)), 0) + 1 AS next FROM document_requests",
    );
    const no = `DOC-2026-${pad(next, 4)}`;
    await db.query(
      "INSERT INTO document_requests (request_no, student_id, doc_type, purpose, copies, release_option, notes) VALUES (?,?,?,?,?,?,?)",
      [
        no,
        req.user.id,
        doc,
        String(purpose).trim(),
        n,
        release,
        String(notes).slice(0, 255),
      ],
    );
    await log(req.user.id, `Submitted ${no} (${doc})`);
    const [[row]] = await db.query(`${REQ_SQL} WHERE r.request_no = ?`, [no]);
    res.status(201).json(row);
  }),
);

/* ---------- registrar ---------- */
const R = auth("Registrar");
app.get(
  "/api/registrar/students",
  R,
  wrap(async (req, res) => {
    const [rows] =
      await db.query(`SELECT u.id, u.name, p.name AS program, s.section, s.enrollment_status AS status
    FROM students s JOIN users u ON u.id = s.student_id JOIN programs p ON p.program_id = s.program_id ORDER BY u.id`);
    res.json(rows);
  }),
);
app.post(
  "/api/registrar/students/:id/approve",
  R,
  wrap(async (req, res) => {
    const [r] = await db.query(
      "UPDATE students SET enrollment_status = 'Enrolled' WHERE student_id = ?",
      [req.params.id],
    );
    if (!r.affectedRows) return bad(res, "Student not found.", 404);
    await log(req.user.id, `Approved enrollment of ${req.params.id}`);
    res.json({ ok: true });
  }),
);
app.get(
  "/api/registrar/grades/:sid",
  R,
  wrap(async (req, res) => {
    const [[st]] = await db.query(
      "SELECT id, name FROM users WHERE id = ? AND role = 'Student'",
      [req.params.sid],
    );
    if (!st) return bad(res, "Student not found.", 404);
    const [rows] = await db.query(GRADE_SQL, [req.params.sid]);
    res.json({
      student: st,
      courses: rows.map((r) => [r.code, r.title]),
      grades: Object.fromEntries(rows.map((r) => [r.code, [r.mid, r.fin]])),
    });
  }),
);
app.put(
  "/api/registrar/grades/:sid",
  R,
  wrap(async (req, res) => {
    const [courses] = await db.query("SELECT code FROM courses");
    const valid = new Set(courses.map((c) => c.code));
    const entries = Object.entries(req.body.grades || {}).filter(([code]) =>
      valid.has(code),
    );
    const num = (v) =>
      v === null || v === "" || v === undefined ? null : Number(v);
    for (const [, [m, f]] of entries)
      for (const v of [num(m), num(f)])
        if (v !== null && (isNaN(v) || v < 1 || v > 5))
          return bad(res, "Grades must be between 1.00 and 5.00.");
    for (const [code, [m, f]] of entries)
      await db.query(
        `INSERT INTO grades (student_id, course_code, midterm_grade, final_grade) VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE midterm_grade = VALUES(midterm_grade), final_grade = VALUES(final_grade)`,
        [req.params.sid, code, num(m), num(f)],
      );
    await log(req.user.id, `Encoded grades for ${req.params.sid}`);
    res.json({ ok: true });
  }),
);
app.get(
  "/api/registrar/requests",
  R,
  wrap(async (req, res) => {
    const [rows] = await db.query(`${REQ_SQL} ORDER BY r.id DESC`);
    res.json(rows);
  }),
);
app.patch(
  "/api/registrar/requests/:no/advance",
  R,
  wrap(async (req, res) => {
    const [[r]] = await db.query(
      "SELECT status FROM document_requests WHERE request_no = ?",
      [req.params.no],
    );
    if (!r) return bad(res, "Request not found.", 404);
    const next = NEXT[r.status];
    if (!next) return bad(res, "This request is already released.");
    await db.query(
      "UPDATE document_requests SET status = ? WHERE request_no = ?",
      [next, req.params.no],
    );
    await log(req.user.id, `${req.params.no} moved to ${next}`);
    res.json({ status: next });
  }),
);

/* ---------- cashier ---------- */
const C = auth("Cashier");
app.get(
  "/api/cashier/students",
  C,
  wrap(async (req, res) => {
    const [rows] = await db.query(BALANCE_SQL);
    res.json(rows.map((r) => ({ ...r, balance: Number(r.balance) })));
  }),
);
app.get(
  "/api/cashier/payments",
  C,
  wrap(async (req, res) => {
    const [rows] = await db.query(`${PAY_SQL} ORDER BY p.id DESC`);
    res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
  }),
);
app.post(
  "/api/cashier/payments",
  C,
  wrap(async (req, res) => {
    const { student_id, amount, method } = req.body;
    const amt = Number(amount);
    if (!METHODS.includes(method)) return bad(res, "Choose a payment method.");
    const [rows] = await db.query(BALANCE_SQL);
    const s = rows.find((r) => r.id === student_id);
    if (!s) return bad(res, "Student not found.", 404);
    if (!(amt > 0) || amt > Number(s.balance))
      return bad(
        res,
        `Enter an amount up to ₱${Number(s.balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`,
      );
    const [[{ next }]] = await db.query(
      "SELECT COALESCE(MAX(id), 0) + 1 AS next FROM payments",
    );
    const or = `OR-2026-${pad(next, 4)}`;
    await db.query(
      "INSERT INTO payments (or_no, student_id, amount, method, received_by) VALUES (?,?,?,?,?)",
      [or, student_id, amt, method, req.user.id],
    );
    await log(
      req.user.id,
      `Issued ${or} (₱${amt.toLocaleString("en-PH")}) to ${s.name}`,
    );
    const [[p]] = await db.query(`${PAY_SQL} WHERE p.or_no = ?`, [or]);
    res.status(201).json({ ...p, amount: Number(p.amount) });
  }),
);

/* ---------- department ---------- */
const D = auth("Department");
app.get(
  "/api/department/students",
  D,
  wrap(async (req, res) => {
    const [rows] =
      await db.query(`SELECT u.id, u.name, s.section, COALESCE(c.status, 'Pending review') AS status, COALESCE(c.remarks, '') AS remarks
    FROM students s JOIN users u ON u.id = s.student_id LEFT JOIN clearances c ON c.student_id = s.student_id AND c.office = 'Department' ORDER BY u.id`);
    res.json(rows);
  }),
);
app.put(
  "/api/department/clearance/:sid",
  D,
  wrap(async (req, res) => {
    const { status, remarks = "" } = req.body;
    if (!["Cleared", "Action required"].includes(status))
      return bad(res, "Invalid status.");
    if (status === "Action required" && !String(remarks).trim())
      return bad(res, "Add remarks so the student knows what to do.");
    await db.query(
      `INSERT INTO clearances (student_id, office, status, remarks, updated_by) VALUES (?, 'Department', ?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status), remarks = VALUES(remarks), updated_by = VALUES(updated_by)`,
      [req.params.sid, status, String(remarks).trim(), req.user.id],
    );
    await log(
      req.user.id,
      `Department clearance for ${req.params.sid}: ${status}`,
    );
    res.json({ ok: true });
  }),
);

/* ---------- admin ---------- */
const A = auth("Admin");
app.get(
  "/api/admin/users",
  A,
  wrap(async (req, res) => {
    const [rows] = await db.query(
      "SELECT id, name, role, status FROM users ORDER BY created_at, id",
    );
    res.json(rows);
  }),
);
app.post(
  "/api/admin/users",
  A,
  wrap(async (req, res) => {
    const { name = "", role } = req.body;
    if (!String(name).trim()) return bad(res, "Enter the user's full name.");
    if (!["Student", ...Object.keys(PREFIX)].includes(role))
      return bad(res, "Choose a valid role.");
    const [[{ c }]] = await db.query(
      "SELECT COUNT(*) AS c FROM users WHERE role = ?",
      [role],
    );
    let n = c + (role === "Student" ? 160 : 1),
      id,
      taken;
    do {
      id =
        role === "Student"
          ? `2024-${pad(n, 5)}`
          : `${PREFIX[role]}${pad(n, 3)}`;
      n++;
      [taken] = await db.query("SELECT 1 FROM users WHERE id = ?", [id]);
    } while (taken.length);
    await db.query(
      "INSERT INTO users (id, name, role, password_hash) VALUES (?,?,?,?)",
      [id, String(name).trim(), role, await bcrypt.hash(TEMP_PW, 10)],
    );
    if (role === "Student")
      await db.query("INSERT INTO students (student_id) VALUES (?)", [id]);
    await log(req.user.id, `Created ${role} account ${id}`);
    res.status(201).json({ id, password: TEMP_PW });
  }),
);
app.patch(
  "/api/admin/users/:id/status",
  A,
  wrap(async (req, res) => {
    if (req.params.id === req.user.id)
      return bad(res, "You cannot deactivate your own account.");
    const [[u]] = await db.query("SELECT status FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (!u) return bad(res, "User not found.", 404);
    const status = u.status === "Active" ? "Deactivated" : "Active";
    await db.query("UPDATE users SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    await log(
      req.user.id,
      `${status === "Active" ? "Activated" : "Deactivated"} account ${req.params.id}`,
    );
    res.json({ status });
  }),
);
app.post(
  "/api/admin/users/:id/reset",
  A,
  wrap(async (req, res) => {
    const [r] = await db.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [await bcrypt.hash(TEMP_PW, 10), req.params.id],
    );
    if (!r.affectedRows) return bad(res, "User not found.", 404);
    await log(req.user.id, `Reset password for ${req.params.id}`);
    res.json({ password: TEMP_PW });
  }),
);
app.get(
  "/api/admin/log",
  A,
  wrap(async (req, res) => {
    const [rows] =
      await db.query(`SELECT DATE_FORMAT(l.created_at, '%b %e, %l:%i %p') AS t, COALESCE(u.name, 'System') AS who, l.action AS msg
    FROM activity_log l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 100`);
    res.json(rows);
  }),
);

app.use((req, res) => bad(res, "Route not found.", 404));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`SSIS API running on http://localhost:${PORT}`),
);
