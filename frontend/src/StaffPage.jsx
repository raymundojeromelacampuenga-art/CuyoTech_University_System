import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, useFetch } from "./api.js";
import { Stat, Badge, Head, CountUp, Sk, STEPS } from "./StudentPortal.jsx";
import { Data, Table, Chips, Dlg, useAct, useAuth, peso } from "./shared.jsx";

const NEXT = {
  Submitted: ["Processing", "Start processing"],
  Processing: ["Ready for release", "Mark ready"],
  "Ready for release": ["Released", "Release"],
};

/* ================= REGISTRAR ================= */
function DocQueue({ requests, advance, limit }) {
  const [f, setF] = useState("All");
  const rows = requests
    .filter((r) => f === "All" || r.status === f)
    .slice(0, limit || 999);
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
function useAdvance(reload) {
  const act = useAct();
  return async (r) => {
    if (
      await act(
        () => api(`/registrar/requests/${r.no}/advance`, { method: "PATCH" }),
        `${r.no} moved to ${NEXT[r.status][0]}`,
      )
    )
      reload();
  };
}
export function RegDashboard() {
  const st = useFetch("/registrar/students"),
    rq = useFetch("/registrar/requests");
  const nav = useNavigate();
  const advance = useAdvance(rq.reload);
  return (
    <Data q={[st, rq]} view="dash">
      {(students, requests) => {
        const open = requests.filter((r) => r.status !== "Released");
        const enrolled = students.filter((s) => s.status === "Enrolled").length;
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
              <button
                className="btn ghost"
                onClick={() => nav("/registrar/requests")}
              >
                Open all requests
              </button>
            </div>
          </>
        );
      }}
    </Data>
  );
}
export function RegEnrollment() {
  const q = useFetch("/registrar/students");
  const act = useAct();
  const approve = async (s) => {
    if (
      await act(
        () => api(`/registrar/students/${s.id}/approve`, { method: "POST" }),
        `${s.name} is now enrolled`,
      )
    )
      q.reload();
  };
  return (
    <Data q={q}>
      {(students) => (
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
      )}
    </Data>
  );
}
function GradeSheet({ data, onSave }) {
  const [d, setD] = useState(data.grades);
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
    onSave(d);
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
        rows={data.courses.map(([code, title]) => [
          code,
          title,
          inp(code, 0),
          inp(code, 1),
        ])}
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
function GradeBox({ students, sid, setSid }) {
  const q = useFetch(`/registrar/grades/${sid}`);
  const act = useAct();
  return (
    <>
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
      {q.loading ? (
        <div className="card pad">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skrow">
              <Sk w="14%" />
              <Sk w="40%" />
              <Sk w="12%" />
              <Sk w="12%" />
            </div>
          ))}
        </div>
      ) : q.error ? (
        <div className="alert warn">{q.error}</div>
      ) : (
        <GradeSheet
          key={sid}
          data={q.data}
          onSave={(g) =>
            act(
              () =>
                api(`/registrar/grades/${sid}`, {
                  method: "PUT",
                  body: { grades: g },
                }),
              "Grades saved",
            )
          }
        />
      )}
    </>
  );
}
export function RegGrades() {
  const q = useFetch("/registrar/students");
  const [sid, setSid] = useState("");
  return (
    <Data q={q}>
      {(students) => (
        <>
          <Head
            title="Grade encoding"
            sub="Encode midterm and final grades. Students see posted grades right away."
          />
          <GradeBox
            students={students}
            sid={sid || students[0].id}
            setSid={setSid}
          />
        </>
      )}
    </Data>
  );
}
export function RegRequests() {
  const q = useFetch("/registrar/requests");
  const advance = useAdvance(q.reload);
  return (
    <Data q={q}>
      {(rows) => (
        <>
          <Head
            title="Document requests"
            sub="Process TOR, COR and certification requests from students."
          />
          <DocQueue requests={rows} advance={advance} />
        </>
      )}
    </Data>
  );
}

/* ================= CASHIER ================= */
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
          <dd>{p.receipt}</dd>
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
const receiptTable = (list, open) => (
  <Table
    cols={["Receipt", "Student", "Amount", "Method", "Date", ""]}
    empty="No receipts yet."
    rows={list.map((p) => [
      p.receipt,
      p.name,
      peso(p.amount),
      p.method,
      p.date,
      <button className="link" onClick={() => open(p)}>
        View receipt
      </button>,
    ])}
  />
);

export function CashDashboard() {
  const st = useFetch("/cashier/students"),
    pm = useFetch("/cashier/payments");
  const [rc, setRc] = useState(null);
  return (
    <Data q={[st, pm]} view="dash">
      {(students, payments) => (
        <>
          <Head
            title="Cashier dashboard"
            sub="Payments and receipts for the current semester."
          />
          <div className="grid3">
            <Stat i={0} label="Total collected">
              ₱<CountUp to={payments.reduce((a, p) => a + p.amount, 0)} />
            </Stat>
            <Stat i={1} label="Outstanding balances" sub="Across all students">
              ₱<CountUp to={students.reduce((a, s) => a + s.balance, 0)} />
            </Stat>
            <Stat i={2} label="Receipts issued">
              <CountUp to={payments.length} />
            </Stat>
          </div>
          <h3 className="sec">Recent receipts</h3>
          {receiptTable(payments.slice(0, 5), setRc)}
          {rc && <Receipt p={rc} close={() => setRc(null)} />}
        </>
      )}
    </Data>
  );
}
export function CashPayments() {
  const q = useFetch("/cashier/students");
  const act = useAct();
  const [pay, setPay] = useState(null);
  const [rc, setRc] = useState(null);
  const onPay = async (s, amount, method) => {
    const p = await act(
      () =>
        api("/cashier/payments", {
          method: "POST",
          body: { student_id: s.id, amount, method },
        }),
      "Receipt issued",
    );
    if (p) {
      setPay(null);
      setRc(p);
      q.reload();
    }
  };
  return (
    <Data q={q}>
      {(students) => (
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
              <Badge s={s.balance > 0 ? "Unpaid" : "Paid"} />,
              <button
                className="btn green sm"
                disabled={s.balance <= 0}
                onClick={() => setPay(s)}
              >
                Collect
              </button>,
            ])}
          />
          {pay && <PayDlg s={pay} close={() => setPay(null)} onPay={onPay} />}
          {rc && <Receipt p={rc} close={() => setRc(null)} />}
        </>
      )}
    </Data>
  );
}
export function CashReceipts() {
  const q = useFetch("/cashier/payments");
  const [rc, setRc] = useState(null);
  return (
    <Data q={q}>
      {(rows) => (
        <>
          <Head
            title="Receipts"
            sub="All official receipts issued by the cashier."
          />
          {receiptTable(rows, setRc)}
          {rc && <Receipt p={rc} close={() => setRc(null)} />}
        </>
      )}
    </Data>
  );
}

/* ================= DEPARTMENT ================= */
function DeptView({ dashboard }) {
  const q = useFetch("/department/students");
  const act = useAct();
  const [f, setF] = useState("All");
  const [flag, setFlag] = useState(null);
  const [note, setNote] = useState("");
  const decide = async (s, status, remarks) => {
    if (
      await act(
        () =>
          api(`/department/clearance/${s.id}`, {
            method: "PUT",
            body: { status, remarks },
          }),
        `${s.name}: ${status}`,
      )
    )
      q.reload();
  };
  return (
    <Data q={q} view={dashboard ? "dash" : "table"}>
      {(students) => {
        const n = (x) => students.filter((s) => s.status === x).length;
        const shown = dashboard
          ? students.filter((s) => s.status === "Pending review").slice(0, 5)
          : students.filter((s) => f === "All" || s.status === f);
        return (
          <>
            <Head
              title={
                dashboard ? "Department dashboard" : "Clearance processing"
              }
              sub="Review students and approve department clearance."
            />
            {dashboard && (
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
            {!dashboard && (
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
                <Badge s={s.status} />,
                s.remarks || "—",
                s.status === "Cleared" ? (
                  <span className="fine">Approved</span>
                ) : (
                  <div className="row actions">
                    <button
                      className="btn green sm"
                      onClick={() => decide(s, "Cleared", "Adviser approved")}
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
                        decide(flag, "Action required", note.trim());
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
      }}
    </Data>
  );
}
export const DeptDashboard = () => <DeptView dashboard />;
export const DeptClearance = () => <DeptView />;

/* ================= ADMIN ================= */
const logTable = (l) => (
  <Table
    cols={["Time", "User", "Activity"]}
    rows={l.map((e) => [e.t, e.who, e.msg])}
    empty="No activity yet."
  />
);
export function AdminDashboard() {
  const u = useFetch("/admin/users"),
    l = useFetch("/admin/log");
  return (
    <Data q={[u, l]} view="dash">
      {(users, log) => (
        <>
          <Head title="Admin dashboard" sub="Accounts and system activity." />
          <div className="grid3">
            <Stat i={0} label="Total accounts">
              <CountUp to={users.length} />
            </Stat>
            <Stat i={1} label="Active">
              <CountUp to={users.filter((x) => x.status === "Active").length} />
            </Stat>
            <Stat i={2} label="Deactivated">
              <CountUp to={users.filter((x) => x.status !== "Active").length} />
            </Stat>
          </div>
          <h3 className="sec">Recent activity</h3>
          {logTable(log.slice(0, 6))}
        </>
      )}
    </Data>
  );
}
export function AdminLog() {
  const q = useFetch("/admin/log");
  return (
    <Data q={q}>
      {(rows) => (
        <>
          <Head title="Activity log" sub="Recent actions across all modules." />
          {logTable(rows)}
        </>
      )}
    </Data>
  );
}
export function AdminUsers() {
  const q = useFetch("/admin/users");
  const act = useAct();
  const { user: me } = useAuth();
  const [f, setF] = useState("All");
  const [s, setS] = useState("");
  const [dlg, setDlg] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [made, setMade] = useState(null);
  const ROLES = ["Student", "Registrar", "Cashier", "Department", "Admin"];
  const close = () => {
    setDlg(false);
    setMade(null);
    setName("");
  };
  const toggle = async (u) => {
    if (
      await act(
        () => api(`/admin/users/${u.id}/status`, { method: "PATCH" }),
        `${u.name} updated`,
      )
    )
      q.reload();
  };
  const reset = (u) =>
    act(
      () => api(`/admin/users/${u.id}/reset`, { method: "POST" }),
      `Password for ${u.name} reset to Temp@2026`,
    );
  const create = async () => {
    const r = await act(() =>
      api("/admin/users", {
        method: "POST",
        body: { name: name.trim(), role },
      }),
    );
    if (r) {
      setMade(r);
      q.reload();
    }
  };
  return (
    <Data q={q}>
      {(users) => {
        const shown = users.filter(
          (u) =>
            (f === "All" || u.role === f) &&
            (u.name + u.id).toLowerCase().includes(s.toLowerCase()),
        );
        return (
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
              <Chips opts={["All", ...ROLES]} v={f} set={setF} />
              <input
                className="search"
                placeholder="Search name or ID…"
                value={s}
                onChange={(e) => setS(e.target.value)}
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
                    disabled={u.id === me.id}
                    onClick={() => toggle(u)}
                  >
                    {u.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </div>,
              ])}
            />
            {dlg && (
              <Dlg title={made ? "Account created" : "Add user"} close={close}>
                {made ? (
                  <>
                    <div className="receipt">
                      <dl>
                        <dt>User ID</dt>
                        <dd>{made.id}</dd>
                        <dt>Temp password</dt>
                        <dd>{made.password}</dd>
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
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <div className="row actions">
                      <button
                        className="btn green"
                        disabled={!name.trim()}
                        onClick={create}
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
      }}
    </Data>
  );
}
