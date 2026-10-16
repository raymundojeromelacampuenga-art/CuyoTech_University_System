import { useState, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";

/* ---------- DATA ---------- */
export const STUDENT = { name: "Mika Dela Cruz", first: "Mika", id: "2024-00128", email: "mika.delacruz@cuyotech.edu.ph" };
export const SUBJECTS = [
  ["IT 311", "Information Assurance and Security", 3, 1.75],
  ["IT 312", "Integrative Programming and Technologies", 3, 1.5],
  ["IT 313", "Networking 2", 3, 2.0],
  ["GE 108", "Ethics", 3, 1.5],
  ["IT 314", "Database Administration", 3, 1.75],
  ["IT 315", "Web Systems and Technologies", 3, 1.5],
  ["GE 109", "Life and Works of Rizal", 3, 1.75],
];
export const CLEARANCE = [
  ["Registrar", "Cleared", "Enrollment record verified", "Oct 6, 2026"],
  ["Cashier", "Cleared", "No outstanding balance", "Oct 6, 2026"],
  ["Library", "Action required", "Return 1 borrowed book", "Oct 7, 2026"],
  ["Department", "Pending review", "Adviser review in progress", "Oct 7, 2026"],
  ["Student affairs", "Cleared", "Student requirements complete", "Oct 6, 2026"],
];
export const INITIAL_REQUESTS = [
  { no: "DOC-2026-0148", doc: "Certification", date: "05 Oct 2026", status: "Ready for release", purpose: "Scholarship application", copies: 1, release: "Office pickup" },
  { no: "DOC-2026-0143", doc: "Transcript of Records", date: "02 Oct 2026", status: "Processing", purpose: "Job application", copies: 2, release: "Office pickup" },
  { no: "DOC-2026-0131", doc: "Certificate of Registration", date: "25 Sep 2026", status: "Released", purpose: "Enrollment", copies: 1, release: "Office pickup" },
  { no: "DOC-2026-0109", doc: "Certification", date: "18 Sep 2026", status: "Released", purpose: "Internship", copies: 1, release: "Office pickup" },
];
export const STEPS = ["Submitted", "Processing", "Ready for release", "Released"];
const NAV = [
  ["overview", "Overview", "⌂"], ["profile", "My profile", "☺"], ["grades", "Grades", "✎"],
  ["requests", "Requests", "▤"], ["clearance", "Clearance", "✓"],
];
const NAV_LABEL = { overview: "Overview", profile: "My profile", grades: "Grades & subjects", requests: "Document requests", clearance: "Clearance" };

/* ---------- SMALL COMPONENTS ---------- */
export function CountUp({ to, suffix = "", decimals = 0 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const tick = (t) => {
      t0 ??= t;
      const p = Math.min((t - t0) / 800, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v.toFixed(decimals)}{suffix}</>;
}
export const Stat = ({ label, children, sub, i = 0 }) => (
  <div className="card stat" style={{ animationDelay: `${i * 70}ms` }}>
    <small>{label}</small><strong>{children}</strong>{sub && <em>{sub}</em>}
  </div>
);
export const Badge = ({ s }) => {
  const c = { "Ready for release": "ok", Cleared: "ok", Released: "mute", Processing: "warn", Submitted: "info", "Action required": "warn", "Pending review": "warn", "In progress": "mute", Completed: "ok", Enrolled: "ok", Pending: "warn", Paid: "ok", Unpaid: "warn", Active: "ok", Deactivated: "warn" }[s] || "mute";
  return <span className={`badge ${c}`}>{s}</span>;
};
export const Head = ({ title, sub, action }) => (
  <div className="head"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>
);

/* ---------- ICONS / THEME / SKELETON ---------- */
const PATHS = {
  cap: <><path d="M22 9 12 4 2 9l10 5 10-5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
};
export const I = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[n]}</svg>
);

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("cuyo-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch { return "light"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("cuyo-theme", theme); } catch {}
  }, [theme]);

  // Circular reveal that grows from the toggle button (View Transitions API, with a fade fallback)
  const toggle = (e) => {
    const next = theme === "dark" ? "light" : "dark";
    const apply = () => { document.documentElement.dataset.theme = next; setTheme(next); };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      const el = document.documentElement;
      el.classList.add("tfade"); apply(); setTimeout(() => el.classList.remove("tfade"), 450); return;
    }
    const b = e.currentTarget.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => flushSync(apply));
    vt.ready.then(() => document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
    ));
  };
  return [theme, toggle];
}

export const ThemeToggle = ({ toggle, theme }) => (
  <button className="theme" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={theme === "dark" ? "Light mode" : "Night mode"}>
    <span className="ti sun"><I n="sun" /></span><span className="ti moon"><I n="moon" /></span>
  </button>
);

export const Sk = ({ w = "100%", h = 14, r = 6, style }) => <span className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
export function PageSkeleton({ view }) {
  const rows = (n, a = ["14%", "38%", "14%", "12%"]) => [...Array(n)].map((_, i) => <div key={i} className="skrow">{a.map((w, j) => <Sk key={j} w={w} />)}</div>);
  const stats = <div className="grid3">{[0, 1, 2].map((i) => <div key={i} className="card pad"><Sk w="40%" h={10} /><Sk w="65%" h={26} style={{ marginTop: 14 }} /></div>)}</div>;
  const panels = <div className="grid2">{[0, 1].map((i) => <div key={i} className="card pad"><Sk w="40%" h={16} />{rows(5, ["30%", "45%"])}</div>)}</div>;
  const form = <div className="grid2 wide"><div className="card pad">{[0, 1, 2, 3].map((i) => <Sk key={i} h={42} r={8} style={{ marginBottom: 16 }} />)}</div><div className="card pad"><Sk w="50%" h={16} />{rows(4, ["70%"])}</div></div>;
  return (
    <div aria-busy="true" aria-label="Loading content">
      <div className="head"><div><Sk w={230} h={28} /><Sk w={340} h={12} style={{ marginTop: 12, maxWidth: "80%" }} /></div></div>
      {view === "profile" ? panels : view === "new" || view === "submitted" ? form : <>{stats}{view === "overview" ? panels : <div className="card pad">{rows(6)}</div>}</>}
    </div>
  );
}

/* ---------- VIEWS ---------- */
export function Login({ onSubmit, themeBtn }) {
  const [id, setId] = useState("2024-00128");
  const [pw, setPw] = useState("password123");
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!id.trim() || !pw) return setErr("Enter your University ID and password.");
    setErr(""); setBusy(true);
    try { await onSubmit(id.trim(), pw); } catch (e) { setErr(e.message); setBusy(false); }
  };
  const features = [["book", "Academic records", "Your grades, subjects, and enrollment details"], ["doc", "Document requests", "Track requests from submission to release"], ["shield", "University clearance", "See what is cleared and what needs attention"]];
  return (
    <div className="login">
      <aside>
        <div className="grid-bg" /><div className="orb o1" /><div className="orb o2" />
        <div className="logo"><span className="mark"><I n="cap" s={22} /></span><div><b>CuyoTech University</b><small>Student Services</small></div></div>
        <div className="hero">
          <span className="pill">Student portal</span>
          <h2>Your campus.<br />One connection.</h2>
          <p>Manage your records, follow your requests, and move through the semester with clarity.</p>
          <ul>{features.map(([ic, a, b], i) => (
            <li key={a} style={{ animationDelay: `${250 + i * 120}ms` }}><span className="fi"><I n={ic} /></span><div><b>{a}</b><span>{b}</span></div></li>
          ))}</ul>
        </div>
        <small className="copy">© 2026 CuyoTech University · Student Services Information System</small>
      </aside>
      <main>
        <div className="topbar">{themeBtn}</div>
        <div className="loginbox">
          <div className="mlogo"><span className="mark"><I n="cap" s={20} /></span>CuyoTech University</div>
          <h1>Welcome back</h1><p>Sign in with your university account to continue.</p>
          <label>University ID
            <span className="field"><I n="user" /><input value={id} onChange={(e) => setId(e.target.value)} placeholder="2024-00128" autoComplete="username" /></span>
          </label>
          <label>Password
            <span className="field"><I n="lock" />
              <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoComplete="current-password" />
              <button type="button" className="link" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></span>
          </label>
          <div className="opts">
            <label className="chk"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />Keep me signed in</label>
            <button type="button" className="link">Forgot password?</button>
          </div>
          {err && <div className="alert warn shake" role="alert" key={err}>{err}</div>}
          <button className="btn dark wide" onClick={submit} disabled={busy}>{busy ? <span className="spin" /> : "Sign in"}</button>
          <div className="demo"><small>Demo accounts (password: password123)</small><div className="chips">{[["Student", "2024-00128"], ["Registrar", "REG-001"], ["Cashier", "CSH-001"], ["Department", "DEP-001"], ["Admin", "ADM-001"]].map(([r, i]) => <button key={r} type="button" className="chip" onClick={() => { setId(i); setPw("password123"); setErr(""); }}>{r}</button>)}</div></div>
          <div className="note">Need access? Contact your university office to activate your account.</div>
          <small className="fine">Design preview · Fictional sample accounts</small>
        </div>
      </main>
    </div>
  );
}

export function Overview({ go, requests, clearance = CLEARANCE, profile = {} }) {
  const cleared = clearance.filter((c) => c[1] === "Cleared").length;
  return (<>
    <Head title={`Good morning, ${(profile.name || STUDENT.name).split(" ")[0]}`} sub="Here is where things stand for your first semester." />
    <div className="grid3">
      <Stat i={0} label="Enrollment">{profile.status || "Enrolled"}</Stat>
      <Stat i={1} label="Current subjects"><CountUp to={7} /> subjects</Stat>
      <Stat i={2} label="Clearance"><CountUp to={cleared} /> of 5 cleared</Stat>
    </div>
    <div className="grid2">
      <section className="card pad">
        <h3>Your semester</h3><Badge s={profile.status || "Enrolled"} />
        <dl><dt>Program</dt><dd>{profile.program || "—"}</dd><dt>Year & section</dt><dd>{profile.year} · {profile.section}</dd><dt>Total units</dt><dd>21 units</dd></dl>
        <button className="btn ghost" onClick={() => go("grades")}>View grades & subjects</button>
      </section>
      <section className="card pad">
        <h3>Next steps</h3>
        {(() => {
          const ready = requests.find((r) => r.status === "Ready for release");
          const todo = clearance.find((c) => c[1] === "Action required");
          return <>
            {ready && <button className="next" onClick={() => go("requests")}><b>Your {ready.doc.toLowerCase()} is ready</b><span>Request {ready.no} · Registrar office</span></button>}
            {todo && <button className="next warn" onClick={() => go("clearance")}><b>{todo[0]} clearance needs attention</b><span>{todo[2]}</span></button>}
            {!ready && !todo && <p>You're all caught up. Nothing needs your attention right now.</p>}
          </>;
        })()}
      </section>
    </div>
    <h3 className="sec">Recent requests</h3>
    <RequestTable rows={requests.slice(0, 2)} />
  </>);
}

export function Profile({ p }) {
  const A = [["Student number", p.id], ["Program", p.program], ["College", p.college], ["Year and section", `${p.year} · ${p.section}`], ["Enrollment status", p.status], ["Academic year", "2026–2027"]];
  const B = [["University email", p.email], ["Mobile number", p.mobile], ["Home address", p.address], ["Emergency contact", p.emergency], ["Relationship", p.relationship], ["Contact number", p.econtact]];
  const List = ({ rows }) => <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
  return (<>
    <Head title="My profile" sub="Your student record and contact information in one place." />
    <div className="grid2">
      <section className="card pad"><h3>Student information</h3>
        <div className="who"><span className="av big">{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span><div><b>{p.name}</b><small>{p.status} student · {p.year}</small></div></div><List rows={A} /></section>
      <section className="card pad"><h3>Contact information</h3><List rows={B} /></section>
    </div>
    <div className="note">Keep your record up to date. For corrections, contact the registrar and provide the required supporting documents.</div>
  </>);
}

export function Grades({ subjects = SUBJECTS }) {
  const [sort, setSort] = useState({ k: 0, dir: 1 });
  const [q, setQ] = useState("");
  const rows = useMemo(() => subjects.filter((r) => (r[0] + r[1]).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir), [sort, q, subjects]);
  const th = (k, t) => <th onClick={() => setSort({ k, dir: sort.k === k ? -sort.dir : 1 })} className="sortable">{t}{sort.k === k ? (sort.dir > 0 ? " ▲" : " ▼") : ""}</th>;
  return (<>
    <Head title="Grades & subjects" sub="Track your subjects and posted grades for the current semester." />
    <div className="grid3">
      <Stat i={0} label="Enrollment status">Enrolled</Stat>
      <Stat i={1} label="Enrolled units"><CountUp to={21} /> units</Stat>
      <Stat i={2} label="Previous semester GWA"><CountUp to={1.75} decimals={2} /></Stat>
    </div>
    <div className="bar"><h3>First semester · AY 2026–2027</h3>
      <input className="search" placeholder="Search subject…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="card tablewrap"><table>
      <thead><tr>{th(0, "Code")}{th(1, "Subject")}{th(2, "Units")}{th(3, "Midterm")}<th>Final</th><th>Status</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
        <td><span className={`grade ${r[3] != null && r[3] <= 1.5 ? "top" : ""}`}>{r[3] == null ? "—" : r[3].toFixed(2)}</span></td><td>{r[4] == null ? "—" : <span className={`grade ${r[4] <= 1.5 ? "top" : ""}`}>{r[4].toFixed(2)}</span>}</td><td><Badge s={r[4] == null ? "In progress" : "Completed"} /></td></tr>)}
        {!rows.length && <tr><td colSpan="6" className="empty">No subjects match “{q}”.</td></tr>}</tbody>
    </table></div>
    <div className="note">Grades are updated as they are posted. A dash means the grade has not been posted yet.</div>
  </>);
}

export function RequestTable({ rows, onOpen }) {
  return (<div className="card tablewrap"><table>
    <thead><tr><th>Request</th><th>Document</th><th>Submitted</th><th>Status</th>{onOpen && <th></th>}</tr></thead>
    <tbody>{rows.map((r) => <tr key={r.no} className={onOpen ? "click" : ""} onClick={() => onOpen?.(r)}>
      <td data-l="Request">{r.no}</td><td data-l="Document">{r.doc}</td><td data-l="Submitted">{r.date}</td><td data-l="Status"><Badge s={r.status} /></td>
      {onOpen && <td><button className="link">View details</button></td>}</tr>)}</tbody>
  </table></div>);
}

export function Requests({ requests, go }) {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(null);
  const rows = requests.filter((r) => filter === "All" || r.status === filter);
  const n = (f) => requests.filter(f).length;
  return (<>
    <Head title="Document requests" sub="Request school documents and follow their status."
      action={<button className="btn green" onClick={() => go("new")}>New request →</button>} />
    <div className="grid3">
      <Stat i={0} label="Active requests" sub="Submitted, processing or ready"><CountUp to={n((r) => r.status !== "Released")} /></Stat>
      <Stat i={1} label="Ready for release" sub="Collect at the registrar"><CountUp to={n((r) => r.status === "Ready for release")} /></Stat>
      <Stat i={2} label="Released" sub="Completed requests"><CountUp to={n((r) => r.status === "Released")} /></Stat>
    </div>
    <div className="bar"><h3>Request history</h3>
      <div className="chips">{["All", ...STEPS].map((s) => <button key={s} className={`chip ${filter === s ? "on" : ""}`} onClick={() => setFilter(s)}>{s}</button>)}</div></div>
    {rows.length ? <RequestTable rows={rows} onOpen={setOpen} /> : <div className="card pad empty">No requests with this status.</div>}
    <div className="note">Ready for release? Bring your student ID and request number to the registrar.</div>
    {open && <Modal r={open} close={() => setOpen(null)} />}
  </>);
}

export function Modal({ r, close }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [close]);
  const step = STEPS.indexOf(r.status);
  return (<div className="overlay" onClick={close}><div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
    <button className="x" onClick={close} aria-label="Close">×</button>
    <h3>{r.no} · {r.doc}</h3>
    <ol className="steps">{STEPS.map((s, i) => <li key={s} className={i <= step ? "done" : ""}><i>{i < step ? "✓" : i + 1}</i><span>{s}</span></li>)}</ol>
    <dl><dt>Purpose</dt><dd>{r.purpose}</dd><dt>Copies</dt><dd>{r.copies}</dd><dt>Release</dt><dd>{r.release}</dd><dt>Submitted</dt><dd>{r.date}</dd></dl>
  </div></div>);
}

export function NewRequest({ onSubmit, go }) {
  const [f, setF] = useState({ doc: "Transcript of Records", purpose: "", copies: 1, release: "Office pickup", notes: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = () => {
    if (!f.purpose.trim()) return setErr("Please tell the Registrar the purpose of this request.");
    if (f.copies < 1 || f.copies > 10) return setErr("Copies must be between 1 and 10.");
    onSubmit(f);
  };
  return (<>
    <Head title="New document request" sub="Choose your document and tell the Registrar what you need." />
    <div className="grid2 wide">
      <section className="card pad form"><h3>Request details</h3>
        <label>Document type<select value={f.doc} onChange={set("doc")}><option>Transcript of Records</option><option>Certificate of Registration</option><option>Certification</option></select></label>
        <label>Purpose<input value={f.purpose} onChange={set("purpose")} placeholder="e.g. Scholarship application" /></label>
        <div className="row"><label>Number of copies<input type="number" min="1" max="10" value={f.copies} onChange={set("copies")} /></label>
          <label>Release option<select value={f.release} onChange={set("release")}><option>Office pickup</option><option>Authorized representative</option></select></label></div>
        <label>Notes (optional)<input value={f.notes} onChange={set("notes")} placeholder="Include all completed semesters" /></label>
        {err && <div className="alert warn" role="alert">{err}</div>}
        <div className="row actions"><button className="btn green" onClick={submit}>Submit request</button><button className="btn ghost" onClick={() => go("requests")}>Cancel</button></div>
      </section>
      <aside className="card pad"><h3>Before you submit</h3><b className="mini">Available documents</b>
        <p>Transcript of Records<br />Certificate of Registration<br />Certifications</p>
        <b className="mini">What happens next</b><p>The Registrar reviews your request, confirms any requirements, and updates its status in the portal.</p>
        <div className="note flat"><b>Keep your request number.</b> Use it when following up with the Registrar.</div></aside>
    </div>
  </>);
}

export function Submitted({ r, go }) {
  return (<>
    <Head title="Request submitted" sub="The registrar will review your request. Check Document requests for updates." />
    <div className="alert ok big"><span className="tick">✓</span><div><b>Request {r.no} has been submitted</b><br />Keep this request number. It appears in your document history.</div></div>
    <section className="card pad"><div className="split"><h3>Request {r.no}</h3><Badge s="Submitted" /></div>
      <dl><dt>Student</dt><dd>{r.student || STUDENT.name}</dd><dt>Document</dt><dd>{r.doc}</dd><dt>Purpose</dt><dd>{r.purpose}</dd><dt>Copies</dt><dd>{r.copies}</dd><dt>Release option</dt><dd>{r.release}</dd></dl>
      <p className="fine">Track the registrar review and collection instructions in Document requests.</p></section>
    <div className="row actions"><button className="btn green" onClick={() => go("requests")}>View document history →</button><button className="btn ghost" onClick={() => go("overview")}>Return to overview</button></div>
  </>);
}

export function Clearance({ data = CLEARANCE }) {
  const cleared = data.filter((c) => c[1] === "Cleared").length;
  const [done, setDone] = useState(false);
  const pct = ((cleared + (done ? 1 : 0)) / 5) * 100;
  const rows = data.map((r) => (r[0] === "Library" && done ? [r[0], "Cleared", "Book return recorded", "Today"] : r));
  return (<>
    <Head title="Clearance" sub="Check each office's clearance status and complete any outstanding requirements." />
    <div className="progress card pad"><div className="split"><b>Overall progress</b><b><CountUp to={pct} suffix="%" /></b></div>
      <div className="track"><div style={{ width: pct + "%" }} /></div></div>
    {(() => { const a = data.find((r) => r[1] === "Action required"); return a && <div className="alert warn"><div><b>{a[0]} requirement needs your attention</b><br />{a[2]}</div></div>; })()}
    <div className="card tablewrap"><table>
      <thead><tr><th>Office</th><th>Status</th><th>Requirement or update</th><th>Last updated</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r[0]}><td data-l="Office">{r[0]}</td><td data-l="Status"><Badge s={r[1]} /></td><td data-l="Update">{r[2]}</td><td data-l="Updated">{r[3]}</td></tr>)}</tbody>
    </table></div>
    <div className="note">Clearance is complete when all offices have approved your record.</div>
  </>);
}

/* ---------- STYLES ---------- */
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
:root{--g9:#145a4f;--g6:#2a8060;--g3:#8dbd96;--g1:#e6f0e8;--ink:#0f2a26;--mut:#5b6e6a;--bg:#f4f6f5;--card:#fff;--line:#c9d3d0;--line2:#e4eae8;--warnbg:#fff3d6;--warn:#8a5a00;--brand:#145a4f;--dark:#0f2a26;--mutebg:#eef1f0;--infobg:#e0ecf8;--infoc:#1d4e89;--sk1:#e8eeec;--sk2:#f6f9f8;color-scheme:light}
[data-theme=dark]{--g9:#7fd1a8;--g6:#2f9a73;--g3:#1f4d40;--g1:#16302a;--ink:#e8f2ef;--mut:#93a8a3;--bg:#0b1312;--card:#111d1b;--line:#26403a;--line2:#1b2e2a;--warnbg:#3a2e10;--warn:#f0c15a;--brand:#145a4f;--dark:#2f9a73;--mutebg:#1b2c29;--infobg:#17304a;--infoc:#8fc2f5;--sk1:#182826;--sk2:#233835;color-scheme:dark}
html,body,#root{margin:0;padding:0;max-width:none;width:100%;text-align:left;border:0;min-height:0}body{display:block;min-width:0}
h1,h2,h3,h4{color:var(--ink);font-family:inherit;letter-spacing:normal}.login aside h2{color:#fff}.login aside h2,.loginbox h1,.head h1{letter-spacing:-.02em}
::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}::view-transition-old(root){z-index:1}::view-transition-new(root){z-index:2}
.tfade,.tfade *{transition:background-color .4s,color .4s,border-color .4s!important}
*{box-sizing:border-box}body{margin:0;font-family:Manrope,system-ui,sans-serif;color:var(--ink);background:var(--bg)}
button{font:inherit;cursor:pointer}h1,h2,h3,p,dl,dd{margin:0}small{color:var(--mut);display:block}
.app{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
.side{background:var(--card);border-right:1px solid var(--line);padding:20px 16px;display:flex;flex-direction:column;gap:16px;position:sticky;top:0;height:100vh}
.brand b{color:var(--g9);font-size:17px}.role{background:var(--bg);padding:10px 12px;border-radius:8px}.role small,.foot small{font-size:11px}
nav button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;padding:10px 12px;border-radius:8px;color:var(--ink);font-size:13px;font-weight:600;transition:.2s}
nav button i{width:6px;height:6px;border-radius:50%;background:var(--mut)}nav button:hover{background:var(--g1);transform:translateX(3px)}
nav button.on{background:var(--g3)}nav button.on i{background:var(--g9)}
.foot{margin-top:auto;font-size:13px}.foot button{margin-top:12px;background:none;border:0;color:var(--mut);padding:0}.foot button:hover{color:var(--g9)}
header{display:flex;justify-content:space-between;align-items:center;background:var(--card);padding:14px 32px;border-bottom:1px solid var(--line);font-size:12px;color:var(--mut)}
.who{display:flex;gap:10px;align-items:center;color:var(--ink);font-size:13px}.who b{display:block}
.av{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:var(--brand);color:#fff;font-size:11px;font-weight:700}.av.big{width:44px;height:44px;font-size:14px}
.page{padding:32px;max-width:1100px;animation:in .45s cubic-bezier(.2,.8,.2,1)}
@keyframes in{from{opacity:0;transform:translateY(14px)}}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:22px}.head h1{font-size:28px}.head p{color:var(--mut);font-size:13px;margin-top:4px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}.grid2.wide{grid-template-columns:1.6fr 1fr}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px}.pad{padding:20px}
.stat{padding:16px 18px;animation:in .5s both;transition:.25s}.stat:hover{transform:translateY(-4px);box-shadow:0 10px 24px #145a4f1f;border-color:var(--g3)}
.stat small{font-size:12px}.stat strong{font-size:24px;display:block;margin-top:6px}.stat em{font-size:11px;color:var(--mut);font-style:normal}
h3{font-size:15px;margin-bottom:10px}.sec{margin:8px 0 12px}
dl{display:grid;grid-template-columns:140px 1fr;gap:10px;font-size:13px;margin:14px 0}dl div{display:contents}dt{color:var(--mut)}dd{font-weight:700}
.btn{border-radius:8px;padding:10px 18px;font-weight:700;font-size:13px;border:1px solid transparent;transition:.2s}.btn:hover{transform:translateY(-2px)}.btn:active{transform:scale(.97)}
.btn.dark{background:var(--dark);color:#fff}.btn.green{background:var(--g6);color:#fff}.btn.ghost{background:var(--card);border-color:var(--line);color:var(--ink)}.btn.wide{width:100%;display:flex;justify-content:center}
.btn.green:hover{box-shadow:0 6px 16px #2a806055}
.badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px}.badge.ok{background:var(--g3)}.badge.warn{background:var(--warnbg);color:var(--warn)}.badge.info{background:var(--infobg);color:var(--infoc)}.badge.mute{background:var(--mutebg);color:var(--mut)}
.note{background:var(--g3);padding:14px 18px;border-radius:8px;font-size:13px;margin:16px 0}.note.flat{background:var(--bg)}
.alert{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 18px;border-radius:8px;font-size:13px;margin:12px 0}.alert.warn{background:var(--warnbg);color:var(--warn)}.alert.ok{background:var(--g3);justify-content:flex-start}
.alert.big{margin-bottom:16px}.tick{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--brand);color:#fff;animation:pop .5s .2s both}@keyframes pop{from{transform:scale(0)}60%{transform:scale(1.25)}}
.tablewrap{overflow-x:auto;margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-size:11px;color:var(--mut);padding:12px 16px;background:var(--bg);white-space:nowrap}th.sortable{cursor:pointer}th.sortable:hover{color:var(--g9)}
td{padding:13px 16px;border-top:1px solid var(--line2)}tr.click{cursor:pointer;transition:.15s}tr.click:hover{background:var(--g1)}.empty{text-align:center;color:var(--mut);padding:24px}
.grade{font-weight:700}.grade.top{color:var(--g6)}
.link{background:none;border:0;color:var(--g9);font-weight:700;font-size:12px;text-decoration:underline;padding:0}
.bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:6px 0 12px}.bar h3{margin:0}
.search,input,select{color:var(--ink);font:inherit;font-size:13px;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);transition:.2s}.search{width:220px}
input:focus,select:focus{outline:0;border-color:var(--g6);box-shadow:0 0 0 3px #2a806033}
.chips{display:flex;gap:6px;flex-wrap:wrap}.chip{border:1px solid var(--line);background:var(--card);border-radius:99px;padding:6px 12px;font-size:12px;font-weight:600;transition:.2s}.chip:hover{border-color:var(--g6)}.chip.on{background:var(--brand);color:#fff;border-color:var(--brand)}
.next{display:block;width:100%;text-align:left;background:var(--bg);border:1px solid transparent;border-radius:8px;padding:12px 14px;margin-bottom:10px;transition:.2s}.next:hover{border-color:var(--g6);transform:translateX(4px)}
.next b,.next span{display:block;font-size:13px}.next span{font-size:12px;color:var(--mut);margin-top:2px}.next.warn b{color:var(--warn)}
.form label{display:block;font-size:13px;font-weight:600;margin-bottom:14px}.form label input,.form label select{margin-top:6px;font-weight:400}
.row{display:flex;gap:14px}.row>*{flex:1}.row.actions>*{flex:none}.mini{font-size:12px}.card p{font-size:13px;color:var(--mut);line-height:1.6;margin:6px 0 14px}.split{display:flex;justify-content:space-between;align-items:center}.fine{font-size:11px;color:var(--mut)}
.who .who{margin-bottom:0}.card .who{margin:12px 0}
.track{height:10px;background:var(--g1);border-radius:99px;margin-top:12px;overflow:hidden}.track div{height:100%;background:linear-gradient(90deg,var(--g6),var(--g3));border-radius:99px;transition:width 1s cubic-bezier(.2,.8,.2,1)}
.overlay{position:fixed;inset:0;background:#0f2a2688;display:grid;place-items:center;padding:16px;z-index:50;animation:fade .2s}@keyframes fade{from{opacity:0}}
.modal{background:var(--card);border-radius:14px;padding:26px;width:100%;max-width:480px;position:relative;animation:in .3s}.x{position:absolute;top:10px;right:14px;border:0;background:none;font-size:24px;color:var(--mut)}
.steps{list-style:none;display:flex;justify-content:space-between;padding:0;margin:18px 0}.steps li{flex:1;text-align:center;font-size:10px;color:var(--mut);position:relative}
.steps li i{display:grid;place-items:center;width:26px;height:26px;margin:0 auto 6px;border-radius:50%;background:var(--bg);border:1px solid var(--line);font-style:normal;font-weight:700;position:relative;z-index:1;transition:.4s}
.steps li.done i{background:var(--g6);color:#fff;border-color:var(--g6)}.steps li.done{color:var(--ink);font-weight:700}
.steps li:not(:first-child)::before{content:"";position:absolute;top:12px;right:50%;width:100%;height:2px;background:var(--line)}.steps li.done:not(:first-child)::before{background:var(--g6)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:12px 20px;border-radius:99px;font-size:13px;animation:in .3s;z-index:60}
.spin{width:16px;height:16px;border:2px solid #fff5;border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
.tabs{display:none}
/* login */
.login{display:grid;grid-template-columns:1.05fr 1fr;min-height:100vh;background:var(--card)}
.login aside{position:relative;overflow:hidden;background:linear-gradient(160deg,#0e4239,#145a4f 55%,#1b6b5c);color:#fff;padding:36px 56px;display:flex;flex-direction:column;justify-content:space-between;gap:32px}
.login aside>*{position:relative;z-index:1}
.login aside>.grid-bg,.login aside>.orb{position:absolute;z-index:0}
.grid-bg{inset:0;background-image:linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:radial-gradient(circle at 30% 40%,#000,transparent 75%);mask-image:radial-gradient(circle at 30% 40%,#000,transparent 75%)}
.orb{border-radius:50%;filter:blur(60px);opacity:.45;animation:float 12s ease-in-out infinite}
.o1{width:340px;height:340px;background:#3fbf8f;top:-80px;right:-80px}.o2{width:300px;height:300px;background:#8dbd96;bottom:-100px;left:-60px;animation-delay:-6s}
@keyframes float{50%{transform:translate(30px,40px) scale(1.12)}}
.logo{display:flex;align-items:center;gap:12px}.logo b{font-size:16px;display:block}.logo small{color:#ffffffb3;font-size:11px}
.mark{display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#ffffff1f;border:1px solid #ffffff33}
.hero{max-width:470px}.pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:99px;background:#ffffff1c;border:1px solid #ffffff2e}
.login aside h2{font-size:42px;line-height:1.12;font-weight:800;letter-spacing:-.02em;margin:18px 0 14px}
.hero>p{color:#ffffffcc;font-size:15px;line-height:1.6;margin:0 0 28px}
.login ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.login li{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:12px;background:#ffffff12;border:1px solid #ffffff1f;animation:in .6s both;transition:.25s}
.login li:hover{background:#ffffff22;transform:translateX(6px)}
.fi{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#ffffff1f;flex:none}
.login li b{font-size:14px;display:block}.login li div span{display:block;font-size:12.5px;color:#ffffffb8;margin-top:2px}
.login aside .copy{color:#ffffff99;font-size:11px}
.login main{display:flex;flex-direction:column;padding:20px 28px;background:var(--card)}.topbar{display:flex;justify-content:flex-end}
.loginbox{width:100%;max-width:380px;margin:auto;padding-bottom:40px;animation:in .6s}
.loginbox h1{font-size:28px;font-weight:800;letter-spacing:-.02em}.loginbox>p{font-size:13.5px;color:var(--mut);margin:6px 0 26px}
.loginbox label{display:block;font-size:12.5px;font-weight:700;margin-bottom:16px}
.field{position:relative;display:block;margin-top:7px}
.field>svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--mut);pointer-events:none}
.field input{padding:12px 14px 12px 40px;font-size:14px;border-radius:10px}
.field .link{position:absolute;right:12px;top:50%;transform:translateY(-50%);text-decoration:none}
.opts{display:flex;justify-content:space-between;align-items:center;margin:-2px 0 18px}
.loginbox .chk{display:flex;align-items:center;gap:8px;margin:0;font-weight:600;color:var(--mut)}
input[type=checkbox]{width:16px;height:16px;padding:0;accent-color:var(--g6)}
.loginbox .btn.wide{padding:13px;font-size:14px;border-radius:10px;min-height:46px}
.loginbox .note{background:var(--bg);border:1px solid var(--line);margin:20px 0 12px;font-size:12.5px;color:var(--mut)}
.mlogo{display:none;align-items:center;gap:10px;margin-bottom:28px;color:var(--g9);font-weight:800}.mlogo .mark{background:var(--brand);color:#fff;border:0}
.shake{animation:shake .4s}@keyframes shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
/* theme toggle + skeleton */
.hr{display:flex;align-items:center;gap:16px}
.theme{position:relative;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--ink);display:grid;place-items:center;padding:0;transition:.25s}
.theme:hover{border-color:var(--g6);transform:rotate(15deg) scale(1.08);box-shadow:0 0 0 4px #2a806022}
.ti{position:absolute;display:grid;transition:transform .7s cubic-bezier(.34,1.56,.64,1),opacity .4s}
.ti.sun{color:#e0a100}.ti.moon{transform:rotate(-120deg) scale(0);opacity:0;color:var(--g9)}
[data-theme=dark] .ti.sun{transform:rotate(120deg) scale(0);opacity:0}[data-theme=dark] .ti.moon{transform:none;opacity:1}
.sk{display:block;background:linear-gradient(90deg,var(--sk1) 25%,var(--sk2) 50%,var(--sk1) 75%);background-size:200% 100%;animation:shimmer 1.3s linear infinite}
@keyframes shimmer{to{background-position:-200% 0}}
.skrow{display:flex;gap:4%;padding:14px 0;border-top:1px solid var(--line2)}.skrow:first-of-type{border-top:0}
/* responsive */
@media(max-width:900px){.grid2.wide{grid-template-columns:1fr}.side{display:none}.app{display:block;padding-bottom:70px}
.tabs{display:flex;position:fixed;bottom:0;left:0;right:0;background:var(--card);border-top:1px solid var(--line);padding:6px;z-index:40}
.tabs button{flex:1;border:0;background:none;font-size:10px;font-weight:700;padding:6px 2px;border-radius:8px;color:var(--mut);transition:.2s}.tabs button span{display:block;font-size:17px}.tabs button.on{background:var(--g3);color:var(--ink)}
header{padding:12px 16px}.page{padding:20px 16px}.who b{display:none}.head h1{font-size:23px}}
@media(max-width:680px){.grid3,.grid2{grid-template-columns:1fr}.login{grid-template-columns:1fr}.login aside{display:none}dl{grid-template-columns:110px 1fr}.row{flex-direction:column}.row.actions{flex-direction:row}.search{width:100%}
.head{flex-direction:column}.alert{flex-direction:column;align-items:flex-start}
.tablewrap table,.tablewrap tbody,.tablewrap tr,.tablewrap td{display:block}.tablewrap thead{display:none}.tablewrap tr{padding:12px 14px;border-top:1px solid var(--line2)}.tablewrap td{border:0;padding:4px 0;display:flex;justify-content:space-between;gap:12px}
.tablewrap td[data-l]::before{content:attr(data-l);color:var(--mut);font-size:11px}}
@media(max-width:1000px){.login aside{padding:32px 36px}.login aside h2{font-size:34px}}
@media(max-width:680px){.mlogo{display:flex}.login main{padding:16px 20px}.loginbox{margin:8px auto}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;