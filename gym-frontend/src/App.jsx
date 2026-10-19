import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Members from "./pages/Members";
import Search from "./pages/Search";
import Login from "./pages/Login";
import "./index.css";

import { useNotification } from "./hooks/useNotification";
import { Icons } from "./components/Icons";
import { Notification } from "./components/Notification";

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { notif, showNotif, clearNotif } = useNotification();

  const handleLogin = (uname) => setUsername(uname);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
  };

  if (!username) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <nav className="nav">
        <NavLink to="/" className="nav-brand">
          <Icons.Dumbbell /> GymPro
        </NavLink>
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
        <div className={`nav-links${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)}>
          {[
            ["/", <Icons.Home />, "Αρχική"],
            ["/register", <Icons.Plus />, "Νέα Εγγραφή"],
            ["/members", <Icons.Users />, "Μέλη"],
            ["/search", <Icons.Search />, "Αναζήτηση"],
          ].map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}>
              {icon} <span className="label">{label}</span>
            </NavLink>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 16 }}>
          <span style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>👤 {username}</span>
          <button className="nav-btn" onClick={handleLogout} title="Αποσύνδεση">
            <Icons.Logout /> <span className="label">Έξοδος</span>
          </button>
        </div>
      </nav>

      <Notification notif={notif} onClose={clearNotif} />

      <Routes>
        <Route path="/"         element={<Home showNotif={showNotif} />} />
        <Route path="/register" element={<Register showNotif={showNotif} />} />
        <Route path="/members"  element={<Members showNotif={showNotif} />} />
        <Route path="/search"   element={<Search showNotif={showNotif} />} />
        <Route path="*"         element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
