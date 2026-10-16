import { createContext, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { PageSkeleton } from "./StudentPortal.jsx";

export const AuthCtx = createContext(null);
export const ToastCtx = createContext(() => {});
export const useAuth = () => useContext(AuthCtx);
export const useToast = () => useContext(ToastCtx);

export const peso = (n) =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
export const HOME = {
  Student: "/student/overview",
  Registrar: "/registrar/dashboard",
  Cashier: "/cashier/dashboard",
  Department: "/department/dashboard",
  Admin: "/admin/dashboard",
};
// [path, label, icon, short label for the mobile tab bar]
export const NAV = {
  Student: [
    ["/student/overview", "Overview", "⌂"],
    ["/student/profile", "My profile", "☺"],
    ["/student/grades", "Grades & subjects", "✎", "Grades"],
    ["/student/requests", "Document requests", "▤", "Requests"],
    ["/student/clearance", "Clearance", "✓"],
  ],
  Registrar: [
    ["/registrar/dashboard", "Dashboard", "⌂"],
    ["/registrar/enrollment", "Enrollment", "☺"],
    ["/registrar/grades", "Grade encoding", "✎", "Grades"],
    ["/registrar/requests", "Document requests", "▤", "Requests"],
  ],
  Cashier: [
    ["/cashier/dashboard", "Dashboard", "⌂"],
    ["/cashier/payments", "Payments", "₱"],
    ["/cashier/receipts", "Receipts", "▤"],
  ],
  Department: [
    ["/department/dashboard", "Dashboard", "⌂"],
    ["/department/clearance", "Clearance processing", "✓", "Clearance"],
  ],
  Admin: [
    ["/admin/dashboard", "Dashboard", "⌂"],
    ["/admin/users", "User accounts", "☺", "Users"],
    ["/admin/log", "Activity log", "▤", "Log"],
  ],
};

// Only lets the matching role in; everyone else is sent to their own home page.
export function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return children;
}

// Runs an API call, shows a toast, and returns the result (or null on error).
export function useAct() {
  const toast = useToast();
  return async (fn, ok) => {
    try {
      const r = await fn();
      if (ok) toast(ok);
      return r ?? true;
    } catch (e) {
      toast(e.message, true);
      return null;
    }
  };
}

// Shows the skeleton while loading, an error card with Retry, then renders children(...data).
export function Data({ q, view = "table", children }) {
  const qs = [].concat(q);
  const err = qs.find((x) => x.error);
  if (qs.some((x) => x.loading)) return <PageSkeleton view={view} />;
  if (err)
    return (
      <div className="alert warn" role="alert">
        <div>
          <b>Could not load this page</b>
          <br />
          {err.error}
        </div>
        <button
          className="btn ghost sm"
          onClick={() => qs.forEach((x) => x.retry())}
        >
          Retry
        </button>
      </div>
    );
  return children(...qs.map((x) => x.data));
}

export const Table = ({ cols, rows, empty = "Nothing to show." }) => (
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
export const Chips = ({ opts, v, set }) => (
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
export function Dlg({ title, close, children }) {
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
