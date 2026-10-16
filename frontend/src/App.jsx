import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { CSS, useTheme, ThemeToggle, Login } from "./StudentPortal.jsx";
import { api, getToken, TOKEN_KEY } from "./api.js";
import { AuthCtx, ToastCtx, useAuth, Protected, HOME, NAV } from "./shared.jsx";
import * as S from "./StudentPages.jsx";
import * as T from "./StaffPages.jsx";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());
  useEffect(() => {
    if (getToken())
      api("/auth/me")
        .then(setUser)
        .catch(() => localStorage.removeItem(TOKEN_KEY))
        .finally(() => setReady(true));
  }, []);
  const login = async (id, password) => {
    const d = await api("/auth/login", {
      method: "POST",
      body: { id, password },
    });
    localStorage.setItem(TOKEN_KEY, d.token);
    setUser(d.user);
    return d.user;
  };
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };
  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {ready ? children : null}
    </AuthCtx.Provider>
  );
}

function LoginPage({ tbtn }) {
  const { user, login } = useAuth();
  const nav = useNavigate();
  if (user) return <Navigate to={HOME[user.role]} replace />;
  return (
    <Login
      themeBtn={tbtn}
      onSubmit={async (id, pw) => {
        const u = await login(id, pw);
        nav(HOME[u.role], { replace: true });
      }}
    />
  );
}

function Layout({ tbtn }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const nav = NAV[user.role];
  const label = (nav.find((n) => pathname.startsWith(n[0])) || [])[1];
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
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
          {nav.map(([to, l]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i />
              {l}
            </NavLink>
          ))}
        </nav>
        <div className="foot">
          <b>First semester</b>
          <small>Academic year 2026–2027</small>
          <button onClick={logout}>Sign out</button>
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
              <span className="av">{initials}</span>
              <b>{user.name}</b>
            </span>
          </div>
        </header>
        <main key={pathname} className="page">
          <Outlet />
        </main>
      </div>
      <nav className="tabs">
        {nav.map(([to, l, ic, short]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span>{ic}</span>
            {short || l}
          </NavLink>
        ))}
        <button onClick={logout}>
          <span>⎋</span>Sign out
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const tbtn = <ThemeToggle theme={theme} toggle={toggleTheme} />;
  const guard = (role) => (
    <Protected role={role}>
      <Layout tbtn={tbtn} />
    </Protected>
  );
  return (
    <BrowserRouter>
      <style>
        {CSS}
        {CSS2}
      </style>
      <ToastCtx.Provider value={(msg, err) => setToast({ msg, err })}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage tbtn={tbtn} />} />
            <Route path="/student" element={guard("Student")}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<S.StudentOverview />} />
              <Route path="profile" element={<S.StudentProfile />} />
              <Route path="grades" element={<S.StudentGrades />} />
              <Route path="requests" element={<S.StudentRequests />} />
              <Route path="requests/new" element={<S.StudentNewRequest />} />
              <Route
                path="requests/submitted"
                element={<S.StudentSubmitted />}
              />
              <Route path="clearance" element={<S.StudentClearance />} />
            </Route>
            <Route path="/registrar" element={guard("Registrar")}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<T.RegDashboard />} />
              <Route path="enrollment" element={<T.RegEnrollment />} />
              <Route path="grades" element={<T.RegGrades />} />
              <Route path="requests" element={<T.RegRequests />} />
            </Route>
            <Route path="/cashier" element={guard("Cashier")}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<T.CashDashboard />} />
              <Route path="payments" element={<T.CashPayments />} />
              <Route path="receipts" element={<T.CashReceipts />} />
            </Route>
            <Route path="/department" element={guard("Department")}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<T.DeptDashboard />} />
              <Route path="clearance" element={<T.DeptClearance />} />
            </Route>
            <Route path="/admin" element={guard("Admin")}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<T.AdminDashboard />} />
              <Route path="users" element={<T.AdminUsers />} />
              <Route path="log" element={<T.AdminLog />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          {toast && (
            <div className={`toast ${toast.err ? "err" : ""}`}>
              {toast.err ? "!" : "✓"} {toast.msg}
            </div>
          )}
        </AuthProvider>
      </ToastCtx.Provider>
    </BrowserRouter>
  );
}

const CSS2 = `
.btn.sm{padding:6px 12px;font-size:12px;border-radius:7px}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.gin{width:90px!important;padding:7px 9px!important}.sel{display:block;max-width:340px;margin-bottom:16px;font-size:12px;font-weight:700}.sel select{margin-top:6px}
.modal{max-height:90vh;overflow:auto}.modal .form label{display:block;font-size:13px;font-weight:600;margin-bottom:14px}.modal .form label input,.modal .form label select{margin-top:6px;font-weight:400}
.receipt{border:1px dashed var(--line);border-radius:10px;padding:16px;margin:14px 0}.rh{text-align:center}.rh b{display:block;font-size:16px}.amt{font-size:18px;color:var(--g9)}
.demo{margin-top:16px}.demo small{margin-bottom:8px;font-size:11px}
.row.actions{flex-wrap:wrap;gap:8px}.tablewrap .row.actions{flex-direction:row}
.toast.err{background:#b3261e;color:#fff}
.side nav a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:var(--ink);font-size:13px;font-weight:600;text-decoration:none;transition:.2s}
.side nav a i{width:6px;height:6px;border-radius:50%;background:var(--mut)}.side nav a:hover{background:var(--g1);transform:translateX(3px)}
.side nav a.active{background:var(--g3)}.side nav a.active i{background:var(--g9)}
.tabs a{flex:1;text-align:center;font-size:10px;font-weight:700;padding:6px 2px;border-radius:8px;color:var(--mut);text-decoration:none;transition:.2s}
.tabs a span{display:block;font-size:17px}.tabs a.active{background:var(--g3);color:var(--ink)}
@media print{body *{visibility:hidden}.receipt,.receipt *{visibility:visible}.receipt{position:fixed;inset:24px;border:0}}
`;
