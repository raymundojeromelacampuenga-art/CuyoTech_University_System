import { useState, useEffect } from "react";
import {
  CSS,
  I,
  useTheme,
  ThemeToggle,
  PageSkeleton,
  Stat,
  Badge,
  Head,
  CountUp,
  Login,
  Overview,
  Profile,
  Grades,
  Requests,
  NewRequest,
  Submitted,
  Clearance,
  SUBJECTS,
  STEPS,
  INITIAL_REQUESTS,
} from "./StudentPortal.jsx";

/* ---------- SHARED DATA (replace with your API later) ---------- */
const peso = (n) =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const NEXT = {
  Submitted: ["Processing", "Start processing"],
  Processing: ["Ready for release", "Mark ready"],
  "Ready for release": ["Released", "Release"],
};
const mk = (id, name, status, balance, dept, lib) => ({
  id,
  name,
  program: "BS Information Technology",
  section: "BSIT 3A",
  status,
  balance,
  dept,
  lib,
});
const STUDENTS0 = [
  mk(
    "2024-00128",
    "Mika Dela Cruz",
    "Enrolled",
    0,
    { s: "Pending review", n: "Adviser review in progress" },
    { s: "Action required", n: "Return 1 borrowed book" },
  ),
  mk(
    "2024-00131",
    "Paolo Reyes",
    "Enrolled",
    4500,
    { s: "Pending review", n: "" },
    { s: "Cleared", n: "No borrowed books" },
  ),
  mk(
    "2024-00145",
    "Liza Santos",
    "Pending",
    12500,
    { s: "Pending review", n: "" },
    { s: "Cleared", n: "No borrowed books" },
  ),
  mk(
    "2024-00152",
    "Ramon Cruz",
    "Enrolled",
    0,
    { s: "Cleared", n: "Adviser approved" },
    { s: "Cleared", n: "No borrowed books" },
  ),
  mk(
    "2024-00160",
    "Ella Tan",
    "Pending",
    8000,
    { s: "Pending review", n: "" },
    { s: "Cleared", n: "No borrowed books" },
  ),
];
const STAFF = [
  ["REG-001", "Elena Navarro", "Registrar"],
  ["CSH-001", "Ben Aquino", "Cashier"],
  ["DEP-001", "Dr. Carlo Mendoza", "Department"],
  ["ADM-001", "Admin Rivera", "Admin"],
];
const USERS0 = [
  ...STUDENTS0.map((s) => [s.id, s.name, "Student"]),
  ...STAFF,
].map(([id, name, role]) => ({
  id,
  name,
  role,
  status: "Active",
  pw: "password123",
}));
const REQS0 = [
  ...INITIAL_REQUESTS.map((r) => ({
    ...r,
    sid: "2024-00128",
    student: "Mika Dela Cruz",
  })),
  {
    no: "DOC-2026-0147",
    doc: "Transcript of Records",
    date: "04 Oct 2026",
    status: "Submitted",
    purpose: "Job application",
    copies: 1,
    release: "Office pickup",
    sid: "2024-00131",
    student: "Paolo Reyes",
  },
  {
    no: "DOC-2026-0146",
    doc: "Certificate of Registration",
    date: "03 Oct 2026",
    status: "Processing",
    purpose: "Enrollment",
    copies: 1,
    release: "Office pickup",
    sid: "2024-00152",
    student: "Ramon Cruz",
  },
].sort((a, b) => (a.no < b.no ? 1 : -1));
const PAY0 = [
  {
    or: "OR-2026-0002",
    sid: "2024-00152",
    name: "Ramon Cruz",
    amount: 15000,
    method: "GCash",
    date: "Oct 5, 2026",
    purpose: "Tuition",
  },
  {
    or: "OR-2026-0001",
    sid: "2024-00128",
    name: "Mika Dela Cruz",
    amount: 18500,
    method: "Cash",
    date: "Oct 3, 2026",
    purpose: "Tuition",
  },
];
const clearRows = (s) => [
  [
    "Registrar",
    s.status === "Enrolled" ? "Cleared" : "Pending review",
    s.status === "Enrolled"
      ? "Enrollment record verified"
      : "Enrollment awaiting approval",
    "Oct 6, 2026",
  ],
  [
    "Cashier",
    s.balance === 0 ? "Cleared" : "Action required",
    s.balance === 0
      ? "No outstanding balance"
      : `Unpaid balance of ${peso(s.balance)}`,
    "Oct 6, 2026",
  ],
  ["Library", s.lib.s, s.lib.n, "Oct 7, 2026"],
  [
    "Department",
    s.dept.s,
    s.dept.n || "Adviser review in progress",
    "Oct 7, 2026",
  ],
  [
    "Student affairs",
    "Cleared",
    "Student requirements complete",
    "Oct 6, 2026",
  ],
];
const ROLES = {
  Student: [
    ["overview", "Overview", "⌂"],
    ["profile", "My profile", "☺"],
    ["grades", "Grades & subjects", "✎", "Grades"],
    ["requests", "Document requests", "▤", "Requests"],
    ["clearance", "Clearance", "✓"],
  ],
  Registrar: [
    ["dash", "Dashboard", "⌂"],
    ["enroll", "Enrollment", "☺"],
    ["grades", "Grade encoding", "✎", "Grades"],
    ["docs", "Document requests", "▤", "Requests"],
  ],
  Cashier: [
    ["dash", "Dashboard", "⌂"],
    ["pay", "Payments", "₱"],
    ["receipts", "Receipts", "▤"],
  ],
  Department: [
    ["dash", "Dashboard", "⌂"],
    ["clear", "Clearance processing", "✓", "Clearance"],
  ],
  Admin: [
    ["dash", "Dashboard", "⌂"],
    ["users", "User accounts", "☺", "Users"],
    ["log", "Activity log", "▤", "Log"],
  ],
};
const PREFIX = {
  Student: "2024-",
  Registrar: "REG-",
  Cashier: "CSH-",
  Department: "DEP-",
  Admin: "ADM-",
};

/* ---------- SMALL UI HELPERS ---------- */
const Table = ({ cols, rows, empty = "Nothing to show." }) => (
  <div className="card tablewrap">
    <table>
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th key={i}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} data-l={cols[j] || undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={cols.length} className="empty">
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
const Chips = ({ opts, v, set }) => (
  <div className="chips">
    {opts.map((o) => (
      <button
        key={o}
        className={`chip ${v === o ? "on" : ""}`}
        onClick={() => set(o)}
      >
        {o}
      </button>
    ))}
  </div>
);
function Dlg({ title, close, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [close]);
  return (
    <div className="overlay" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="x" onClick={close} aria-label="Close">
          ×
        </button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ---------- REGISTRAR ---------- */
function DocQueue({ requests, advance, limit }) {
  const [f, setF] = useState("All");
  const rows = requests
    .filter((r) => f === "All" || r.status === f)
    .slice(0, limit || 99);
  return (
    <>
      {!limit && (
        <div className="bar">
          <h3>All requests</h3>
          <Chips opts={["All", ...STEPS]} v={f} set={setF} />
        </div>
      )}
      <Table
        cols={["Request", "Student", "Document", "Submitted", "Status", ""]}
        empty="No requests in this status."
        rows={rows.map((r) => [
          r.no,
          r.student,
          r.doc,
          r.date,
          <Badge s={r.status} />,
          NEXT[r.status] ? (
            <button className="btn green sm" onClick={() => advance(r)}>
              {NEXT[r.status][1]}
            </button>
          ) : (
            <span className="fine">Completed</span>
          ),
        ])}
      />
    </>
  );
}
function GradeSheet({ s, data, onSave }) {
  const [d, setD] = useState(data);
  const [err, setErr] = useState("");
  const set = (c, i, v) =>
    setD({
      ...d,
      [c]: Object.assign([...d[c]], { [i]: v === "" ? null : Number(v) }),
    });
  const save = () => {
    if (
      Object.values(d)
        .flat()
        .some((v) => v !== null && (isNaN(v) || v < 1 || v > 5))
    )
      return setErr("Grades must be between 1.00 and 5.00.");
    setErr("");
    onSave(s, d);
  };
  const inp = (c, i) => (
    <input
      className="gin"
      type="number"
      step="0.25"
      min="1"
      max="5"
      value={d[c][i] ?? ""}
      onChange={(e) => set(c, i, e.target.value)}
    />
  );
  return (
    <>
      <Table
        cols={["Code", "Subject", "Midterm", "Final"]}
        rows={SUBJECTS.map((r) => [r[0], r[1], inp(r[0], 0), inp(r[0], 1)])}
      />
      {err && (
        <div className="alert warn" role="alert">
          {err}
        </div>
      )}
      <div className="row actions" style={{ marginTop: 14 }}>
        <button className="btn green" onClick={save}>
          Save grades
        </button>
      </div>
    </>
  );
}
function Registrar({
  view,
  go,
  students,
  requests,
  grades,
  advance,
  approve,
  saveGrades,
}) {
  const [sid, setSid] = useState(students[0].id);
  const open = requests.filter((r) => r.status !== "Released");
  const enrolled = students.filter((s) => s.status === "Enrolled").length;
  if (view === "dash")
    return (
      <>
        <Head
          title="Registrar dashboard"
          sub="Enrollment, grades and document requests at a glance."
        />
        <div className="grid3">
          <Stat i={0} label="Enrolled students">
            <CountUp to={enrolled} />
          </Stat>
          <Stat i={1} label="Pending enrollments" sub="Awaiting approval">
            <CountUp to={students.length - enrolled} />
          </Stat>
          <Stat i={2} label="Open document requests" sub="Not yet released">
            <CountUp to={open.length} />
          </Stat>
        </div>
        <h3 className="sec">Requests needing action</h3>
        <DocQueue requests={open} advance={advance} limit={5} />
        <div className="row actions" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={() => go("docs")}>
            Open all requests
          </button>
        </div>
      </>
    );
  if (view === "enroll")
    return (
      <>
        <Head
          title="Enrollment"
          sub="Review and approve student enrollment records."
        />
        <Table
          cols={["Student no.", "Name", "Program", "Section", "Status", ""]}
          rows={students.map((s) => [
            s.id,
            s.name,
            s.program,
            s.section,
            <Badge s={s.status} />,
            s.status === "Pending" ? (
              <button className="btn green sm" onClick={() => approve(s)}>
                Approve enrollment
              </button>
            ) : (
              <span className="fine">Verified</span>
            ),
          ])}
        />
      </>
    );
  if (view === "grades") {
    const s = students.find((x) => x.id === sid);
    return (
      <>
        <Head
          title="Grade encoding"
          sub="Encode midterm and final grades. Students see posted grades right away."
        />
        <label className="sel">
          <small>Student</small>
          <select value={sid} onChange={(e) => setSid(e.target.value)}>
            {students.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · {x.id}
              </option>
            ))}
          </select>
        </label>
        <GradeSheet key={sid} s={s} data={grades[sid]} onSave={saveGrades} />
      </>
    );
  }
  return (
    <>
      <Head
        title="Document requests"
        sub="Process TOR, COR and certification requests from students."
      />
      <DocQueue requests={requests} advance={advance} />
    </>
  );
}

/* ---------- CASHIER ---------- */
function PayDlg({ s, close, onPay }) {
  const [amt, setAmt] = useState(s.balance);
  const [m, setM] = useState("Cash");
  const [err, setErr] = useState("");
  const submit = () =>
    amt > 0 && amt <= s.balance
      ? onPay(s, Number(amt), m)
      : setErr(`Enter an amount up to ${peso(s.balance)}.`);
  return (
    <Dlg title={`Collect payment · ${s.name}`} close={close}>
      <div className="form">
        <p className="fine" style={{ marginBottom: 12 }}>
          Outstanding balance: <b>{peso(s.balance)}</b>
        </p>
        <label>
          Amount (₱)
          <input
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
          />
        </label>
        <label>
          Payment method
          <select value={m} onChange={(e) => setM(e.target.value)}>
            <option>Cash</option>
            <option>GCash</option>
            <option>Bank transfer</option>
          </select>
        </label>
        {err && (
          <div className="alert warn" role="alert">
            {err}
          </div>
        )}
        <div className="row actions">
          <button className="btn green" onClick={submit}>
            Issue receipt
          </button>
          <button className="btn ghost" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </Dlg>
  );
}
function Receipt({ p, close }) {
  return (
    <Dlg title="Official receipt" close={close}>
      <div className="receipt">
        <div className="rh">
          <b>CuyoTech University</b>
          <small>Cashier's Office</small>
        </div>
        <dl>
          <dt>Receipt no.</dt>
          <dd>{p.or}</dd>
          <dt>Date</dt>
          <dd>{p.date}</dd>
          <dt>Student</dt>
          <dd>{p.name}</dd>
          <dt>Student no.</dt>
          <dd>{p.sid}</dd>
          <dt>Purpose</dt>
          <dd>{p.purpose}</dd>
          <dt>Method</dt>
          <dd>{p.method}</dd>
          <dt>Amount paid</dt>
          <dd className="amt">{peso(p.amount)}</dd>
        </dl>
        <small>Sample receipt for design purposes only.</small>
      </div>
      <button className="btn ghost" onClick={() => window.print()}>
        Print receipt
      </button>
    </Dlg>
  );
}
function Cashier({ view, students, payments, onPay }) {
  const [pay, setPay] = useState(null);
  const [rc, setRc] = useState(null);
  const total = payments.reduce((a, p) => a + p.amount, 0),
    owed = students.reduce((a, s) => a + s.balance, 0);
  const rcTable = (list) => (
    <Table
      cols={["Receipt", "Student", "Amount", "Method", "Date", ""]}
      empty="No receipts yet."
      rows={list.map((p) => [
        p.or,
        p.name,
        peso(p.amount),
        p.method,
        p.date,
        <button className="link" onClick={() => setRc(p)}>
          View receipt
        </button>,
      ])}
    />
  );
  return (
    <>
      {view === "dash" && (
        <>
          <Head
            title="Cashier dashboard"
            sub="Payments and receipts for the current semester."
          />
          <div className="grid3">
            <Stat i={0} label="Total collected">
              ₱<CountUp to={total} />
            </Stat>
            <Stat i={1} label="Outstanding balances" sub="Across all students">
              ₱<CountUp to={owed} />
            </Stat>
            <Stat i={2} label="Receipts issued">
              <CountUp to={payments.length} />
            </Stat>
          </div>
          <h3 className="sec">Recent receipts</h3>
          {rcTable(payments.slice(0, 5))}
        </>
      )}
      {view === "pay" && (
        <>
          <Head
            title="Payments"
            sub="Collect payments and issue official receipts."
          />
          <Table
            cols={["Student no.", "Name", "Balance", "Status", ""]}
            rows={students.map((s) => [
              s.id,
              s.name,
              peso(s.balance),
              <Badge s={s.balance ? "Unpaid" : "Paid"} />,
              <button
                className="btn green sm"
                disabled={!s.balance}
                onClick={() => setPay(s)}
              >
                Collect
              </button>,
            ])}
          />
        </>
      )}
      {view === "receipts" && (
        <>
          <Head
            title="Receipts"
            sub="All official receipts issued by the cashier."
          />
          {rcTable(payments)}
        </>
      )}
      {pay && (
        <PayDlg
          s={pay}
          close={() => setPay(null)}
          onPay={(s, a, m) => {
            const p = onPay(s, a, m);
            setPay(null);
            setRc(p);
          }}
        />
      )}
      {rc && <Receipt p={rc} close={() => setRc(null)} />}
    </>
  );
}

/* ---------- DEPARTMENT ---------- */
function Dept({ view, students, onDecide }) {
  const [f, setF] = useState("All");
  const [flag, setFlag] = useState(null);
  const [note, setNote] = useState("");
  const n = (x) => students.filter((s) => s.dept.s === x).length;
  const shown =
    view === "dash"
      ? students.filter((s) => s.dept.s === "Pending review").slice(0, 5)
      : students.filter((s) => f === "All" || s.dept.s === f);
  return (
    <>
      <Head
        title={
          view === "dash" ? "Department dashboard" : "Clearance processing"
        }
        sub="Review students and approve department clearance."
      />
      {view === "dash" && (
        <div className="grid3">
          <Stat i={0} label="Pending review">
            <CountUp to={n("Pending review")} />
          </Stat>
          <Stat i={1} label="Cleared">
            <CountUp to={n("Cleared")} />
          </Stat>
          <Stat i={2} label="Action required">
            <CountUp to={n("Action required")} />
          </Stat>
        </div>
      )}
      {view !== "dash" && (
        <div className="bar">
          <h3>Students</h3>
          <Chips
            opts={["All", "Pending review", "Cleared", "Action required"]}
            v={f}
            set={setF}
          />
        </div>
      )}
      <Table
        cols={["Student no.", "Name", "Status", "Remarks", ""]}
        empty="No students in this status."
        rows={shown.map((s) => [
          s.id,
          s.name,
          <Badge s={s.dept.s} />,
          s.dept.n || "—",
          s.dept.s === "Cleared" ? (
            <span className="fine">Approved</span>
          ) : (
            <div className="row actions">
              <button
                className="btn green sm"
                onClick={() => onDecide(s, "Cleared", "Adviser approved")}
              >
                Approve
              </button>
              <button
                className="btn ghost sm"
                onClick={() => {
                  setFlag(s);
                  setNote("");
                }}
              >
                Require action
              </button>
            </div>
          ),
        ])}
      />
      {flag && (
        <Dlg
          title={`Require action · ${flag.name}`}
          close={() => setFlag(null)}
        >
          <div className="form">
            <label>
              Remarks for the student
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Submit your adviser form"
              />
            </label>
            <div className="row actions">
              <button
                className="btn green"
                disabled={!note.trim()}
                onClick={() => {
                  onDecide(flag, "Action required", note.trim());
                  setFlag(null);
                }}
              >
                Send to student
              </button>
              <button className="btn ghost" onClick={() => setFlag(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Dlg>
      )}
    </>
  );
}

/* ---------- ADMIN ---------- */
function Admin({ view, me, users, log, toggle, reset, add }) {
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [dlg, setDlg] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [made, setMade] = useState(null);
  const shown = users.filter(
    (u) =>
      (f === "All" || u.role === f) &&
      (u.name + u.id).toLowerCase().includes(q.toLowerCase()),
  );
  const logT = (l) => (
    <Table
      cols={["Time", "User", "Activity"]}
      rows={l.map((e) => [e.t, e.who, e.msg])}
      empty="No activity yet. Actions in other modules will appear here."
    />
  );
  const close = () => {
    setDlg(false);
    setMade(null);
    setName("");
  };
  return (
    <>
      {view === "dash" && (
        <>
          <Head title="Admin dashboard" sub="Accounts and system activity." />
          <div className="grid3">
            <Stat i={0} label="Total accounts">
              <CountUp to={users.length} />
            </Stat>
            <Stat i={1} label="Active">
              <CountUp to={users.filter((u) => u.status === "Active").length} />
            </Stat>
            <Stat i={2} label="Deactivated">
              <CountUp to={users.filter((u) => u.status !== "Active").length} />
            </Stat>
          </div>
          <h3 className="sec">Recent activity</h3>
          {logT(log.slice(0, 6))}
        </>
      )}
      {view === "users" && (
        <>
          <Head
            title="User accounts"
            sub="Create, deactivate and reset accounts."
            action={
              <button className="btn green" onClick={() => setDlg(true)}>
                Add user +
              </button>
            }
          />
          <div className="bar">
            <Chips opts={["All", ...Object.keys(PREFIX)]} v={f} set={setF} />
            <input
              className="search"
              placeholder="Search name or ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Table
            cols={["User ID", "Name", "Role", "Status", ""]}
            empty="No users found."
            rows={shown.map((u) => [
              u.id,
              u.name,
              u.role,
              <Badge s={u.status} />,
              <div className="row actions">
                <button className="btn ghost sm" onClick={() => reset(u)}>
                  Reset password
                </button>
                <button
                  className="btn ghost sm"
                  disabled={u.id === me}
                  onClick={() => toggle(u)}
                >
                  {u.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </div>,
            ])}
          />
        </>
      )}
      {view === "log" && (
        <>
          <Head
            title="Activity log"
            sub="Actions taken across all modules in this session."
          />
          {logT(log)}
        </>
      )}
      {dlg && (
        <Dlg title={made ? "Account created" : "Add user"} close={close}>
          {made ? (
            <>
              <div className="receipt">
                <dl>
                  <dt>User ID</dt>
                  <dd>{made.id}</dd>
                  <dt>Temp password</dt>
                  <dd>{made.pw}</dd>
                </dl>
              </div>
              <button className="btn green" onClick={close}>
                Done
              </button>
            </>
          ) : (
            <div className="form">
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                />
              </label>
              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {Object.keys(PREFIX).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="row actions">
                <button
                  className="btn green"
                  disabled={!name.trim()}
                  onClick={() => setMade(add(name.trim(), role))}
                >
                  Create account
                </button>
                <button className="btn ghost" onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Dlg>
      )}
    </>
  );
}

/* ---------- APP SHELL ---------- */
export default function SSIS() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("overview");
  const [students, setStudents] = useState(STUDENTS0);
  const [users, setUsers] = useState(USERS0);
  const [requests, setRequests] = useState(REQS0);
  const [payments, setPayments] = useState(PAY0);
  const [grades, setGrades] = useState(() =>
    Object.fromEntries(
      STUDENTS0.map((s) => [
        s.id,
        Object.fromEntries(SUBJECTS.map((r) => [r[0], [r[3], null]])),
      ]),
    ),
  );
  const [log, setLog] = useState([]);
  const [last, setLast] = useState(null);
  const [toast, setToast] = useState("");
  const [theme, toggleTheme] = useTheme();
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const logit = (msg, who = user?.name) =>
    setLog((l) =>
      [
        {
          t: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          who,
          msg,
        },
        ...l,
      ].slice(0, 40),
    );
  const go = (v) => {
    setLoading(true);
    setView(v);
    setTick((t) => t + 1);
    window.scrollTo({ top: 0 });
  };
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, [tick, user]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const login = (u) => {
    setUser(u);
    setView(ROLES[u.role][0][0]);
    setLoading(true);
    setTick((t) => t + 1);
    logit("Signed in", u.name);
  };
  const patchStudent = (id, fn) =>
    setStudents((a) => a.map((s) => (s.id === id ? fn(s) : s)));
  const act = {
    advance: (r) => {
      const [st] = NEXT[r.status];
      setRequests((a) =>
        a.map((x) => (x.no === r.no ? { ...x, status: st } : x)),
      );
      logit(`${r.no} (${r.doc}) moved to ${st}`);
      setToast(`${r.no} → ${st}`);
    },
    approve: (s) => {
      patchStudent(s.id, (x) => ({ ...x, status: "Enrolled" }));
      logit(`Approved enrollment of ${s.name}`);
      setToast(`${s.name} is now enrolled`);
    },
    saveGrades: (s, d) => {
      setGrades((g) => ({ ...g, [s.id]: d }));
      logit(`Encoded grades for ${s.name}`);
      setToast("Grades saved");
    },
    pay: (s, amount, method) => {
      const p = {
        or: `OR-2026-${String(payments.length + 1).padStart(4, "0")}`,
        sid: s.id,
        name: s.name,
        amount,
        method,
        purpose: "Tuition",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setPayments((a) => [p, ...a]);
      patchStudent(s.id, (x) => ({ ...x, balance: x.balance - amount }));
      logit(`Issued ${p.or} (${peso(amount)}) to ${s.name}`);
      setToast(`Receipt ${p.or} issued`);
      return p;
    },
    decide: (s, status, n) => {
      patchStudent(s.id, (x) => ({ ...x, dept: { s: status, n } }));
      logit(`Department clearance for ${s.name}: ${status}`);
      setToast(`${s.name}: ${status}`);
    },
    toggle: (u) => {
      const st = u.status === "Active" ? "Deactivated" : "Active";
      setUsers((a) => a.map((x) => (x.id === u.id ? { ...x, status: st } : x)));
      logit(`${st === "Active" ? "Activated" : "Deactivated"} account ${u.id}`);
      setToast(`${u.name} ${st.toLowerCase()}`);
    },
    reset: (u) => {
      setUsers((a) =>
        a.map((x) => (x.id === u.id ? { ...x, pw: "Temp@2026" } : x)),
      );
      logit(`Reset password for ${u.id}`);
      setToast(`Password reset to Temp@2026`);
    },
    add: (name, role) => {
      const n = users.filter((u) => u.role === role).length;
      const id =
        PREFIX[role] +
        String(role === "Student" ? 160 + n : n + 1).padStart(
          role === "Student" ? 5 : 3,
          "0",
        );
      setUsers((a) => [
        ...a,
        { id, name, role, status: "Active", pw: "Temp@2026" },
      ]);
      if (role === "Student") {
        setStudents((a) => [
          ...a,
          mk(
            id,
            name,
            "Pending",
            0,
            { s: "Pending review", n: "" },
            { s: "Cleared", n: "No borrowed books" },
          ),
        ]);
        setGrades((g) => ({
          ...g,
          [id]: Object.fromEntries(SUBJECTS.map((r) => [r[0], [r[3], null]])),
        }));
      }
      logit(`Created ${role} account ${id}`);
      return { id, pw: "Temp@2026" };
    },
  };
  const addRequest = (f) => {
    const n = Math.max(...requests.map((r) => +r.no.slice(-4))) + 1;
    const r = {
      no: `DOC-2026-${String(n).padStart(4, "0")}`,
      doc: f.doc,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Submitted",
      purpose: f.purpose,
      copies: f.copies,
      release: f.release,
      sid: user.id,
      student: user.name,
    };
    setRequests((a) => [r, ...a]);
    setLast(r);
    logit(`Submitted ${r.no} (${r.doc})`);
    setToast(`Request ${r.no} submitted`);
    go("submitted");
  };

  const nav = user ? ROLES[user.role] : [];
  const active = view === "new" || view === "submitted" ? "requests" : view;
  const label = (nav.find((n) => n[0] === active) || [])[1];
  const me = students.find((s) => s.id === user?.id) || students[0];
  const mine = requests.filter((r) => r.sid === user?.id);
  const subjects = SUBJECTS.map((r) => {
    const g = grades[user?.id]?.[r[0]] || [r[3], null];
    return [r[0], r[1], r[2], g[0], g[1]];
  });
  const tbtn = <ThemeToggle theme={theme} toggle={toggleTheme} />;

  const screen = () => {
    switch (user.role) {
      case "Student":
        return {
          overview: (
            <Overview go={go} requests={mine} clearance={clearRows(me)} />
          ),
          profile: <Profile />,
          grades: <Grades subjects={subjects} />,
          requests: <Requests requests={mine} go={go} />,
          new: <NewRequest onSubmit={addRequest} go={go} />,
          submitted: last && <Submitted r={last} go={go} />,
          clearance: <Clearance data={clearRows(me)} />,
        }[view];
      case "Registrar":
        return (
          <Registrar
            view={view}
            go={go}
            students={students}
            requests={requests}
            grades={grades}
            {...act}
          />
        );
      case "Cashier":
        return (
          <Cashier
            view={view}
            students={students}
            payments={payments}
            onPay={act.pay}
          />
        );
      case "Department":
        return <Dept view={view} students={students} onDecide={act.decide} />;
      default:
        return (
          <Admin view={view} me={user.id} users={users} log={log} {...act} />
        );
    }
  };

  return (
    <>
      <style>
        {CSS}
        {CSS2}
      </style>
      {!user ? (
        <Login users={users} onLogin={login} themeBtn={tbtn} />
      ) : (
        <div className="app">
          <aside className="side">
            <div className="brand">
              <b>CuyoTech</b>
              <small>University</small>
            </div>
            <div className="role">
              <b>{user.role}</b>
              <small>{user.name}</small>
            </div>
            <nav>
              {nav.map(([k, l]) => (
                <button
                  key={k}
                  className={active === k ? "on" : ""}
                  onClick={() => go(k)}
                >
                  <i />
                  {l}
                </button>
              ))}
            </nav>
            <div className="foot">
              <b>First semester</b>
              <small>Academic year 2026–2027</small>
              <button onClick={() => setUser(null)}>Sign out</button>
            </div>
          </aside>
          <div className="body">
            <header>
              <span className="crumb">
                {user.role} portal / {label}
              </span>
              <div className="hr">
                {tbtn}
                <span className="who">
                  <span className="av">
                    {user.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <b>{user.name}</b>
                </span>
              </div>
            </header>
            <main key={loading ? "sk" + view : view} className="page">
              {loading ? <PageSkeleton view={view} /> : screen()}
            </main>
          </div>
          <nav className="tabs">
            {nav.map(([k, l, ic, short]) => (
              <button
                key={k}
                className={active === k ? "on" : ""}
                onClick={() => go(k)}
              >
                <span>{ic}</span>
                {short || l}
              </button>
            ))}
            <button onClick={() => setUser(null)}>
              <span>⎋</span>Sign out
            </button>
          </nav>
          {toast && <div className="toast">✓ {toast}</div>}
        </div>
      )}
    </>
  );
}

const CSS2 = `
.btn.sm{padding:6px 12px;font-size:12px;border-radius:7px}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.gin{width:90px!important;padding:7px 9px!important}.sel{display:block;max-width:340px;margin-bottom:16px;font-size:12px;font-weight:700}.sel select{margin-top:6px}
.modal{max-height:90vh;overflow:auto}.modal .form label{display:block;font-size:13px;font-weight:600;margin-bottom:14px}.modal .form label input,.modal .form label select{margin-top:6px;font-weight:400}
.receipt{border:1px dashed var(--line);border-radius:10px;padding:16px;margin:14px 0}.rh{text-align:center}.rh b{display:block;font-size:16px}.amt{font-size:18px;color:var(--g9)}
.demo{margin-top:16px}.demo small{margin-bottom:8px;font-size:11px}
.row.actions{flex-wrap:wrap;gap:8px}.tablewrap .row.actions{flex-direction:row}
@media print{body *{visibility:hidden}.receipt,.receipt *{visibility:visible}.receipt{position:fixed;inset:24px;border:0}}
@media(max-width:900px){.tabs button{min-width:0}}
`;
