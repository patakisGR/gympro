import { useState, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Members from "./pages/Members";
import Search from "./pages/Search";
import "./index.css";

// ─── Notification Context ────────────────────────────────────────
export function useNotification() {
  const [notif, setNotif] = useState(null);
  const timer = useRef(null);

  const showNotif = useCallback((msg, type = "success") => {
    setNotif({ msg, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotif(null), 4500);
  }, []);

  return { notif, showNotif, clearNotif: () => setNotif(null) };
}

// ─── Icons ───────────────────────────────────────────────────────
export const Icons = {
  Dumbbell: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 4v16M18 4v16M6 8h12M6 16h12M3 8h3M3 16h3M18 8h3M18 16h3" />
    </svg>
  ),
  Home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Mail: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
};

// ─── Helpers (shared across pages) ───────────────────────────────
export const MEMBERSHIP_TYPES = [
  { value: "monthly",    label: "Μηνιαία",      price: "40€/μήνα",   color: "#3B82F6" },
  { value: "quarterly",  label: "Τριμηνιαία",   price: "105€/3μηνο", color: "#8B5CF6" },
  { value: "semiannual", label: "Εξαμηνιαία",   price: "190€/6μηνο", color: "#F59E0B" },
  { value: "annual",     label: "Ετήσια",        price: "350€/έτος",  color: "#10B981" },
];
export const GENDER_OPTIONS = [
  { value: "male",   label: "Άνδρας" },
  { value: "female", label: "Γυναίκα" },
  { value: "other",  label: "Άλλο" },
];
export const mlabel = (v) => MEMBERSHIP_TYPES.find(m => m.value === v)?.label || v;
export const mcolor = (v) => MEMBERSHIP_TYPES.find(m => m.value === v)?.color || "#64748B";
export const initials = (f, l) => ((f?.[0] || "") + (l?.[0] || "")).toUpperCase();
export const avColor = (id) => {
  const cs = ["#003F87","#8B5CF6","#F59E0B","#10B981","#EF4444","#06B6D4","#EC4899"];
  let h = 0;
  for (let c of (id || "")) h = (h * 31 + c.charCodeAt(0)) % cs.length;
  return cs[h];
};
export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ─── Notification Component ───────────────────────────────────────
export function Notification({ notif, onClose }) {
  if (!notif) return null;
  return (
    <div className={`notif notif-${notif.type}`}>
      {notif.type === "success" && <Icons.Check />}
      {notif.msg}
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", opacity: .6 }}>
        <Icons.X />
      </button>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────
export default function App() {
  const { notif, showNotif, clearNotif } = useNotification();

  return (
    <BrowserRouter>
      <nav className="nav">
        <NavLink to="/" className="nav-brand">
          <Icons.Dumbbell /> GymPro
        </NavLink>
        <div className="nav-links">
          {[
            ["/", <Icons.Home />, "Αρχική"],
            ["/register", <Icons.Plus />, "Νέα Εγγραφή"],
            ["/members", <Icons.Users />, "Μέλη"],
            ["/search", <Icons.Search />, "Αναζήτηση"],
          ].map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
            >
              {icon} <span className="label">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <Notification notif={notif} onClose={clearNotif} />

      <Routes>
        <Route path="/"         element={<Home showNotif={showNotif} />} />
        <Route path="/register" element={<Register showNotif={showNotif} />} />
        <Route path="/members"  element={<Members showNotif={showNotif} />} />
        <Route path="/search"   element={<Search showNotif={showNotif} />} />
      </Routes>
    </BrowserRouter>
  );
}
