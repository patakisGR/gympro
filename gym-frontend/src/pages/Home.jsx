import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getMembers } from "../api";
import { MEMBERSHIP_TYPES, mlabel, mcolor, initials, avColor, fmtDate } from "../App";

export default function Home({ showNotif }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getMembers({ limit: 5 })])
      .then(([s, m]) => {
        setStats(s.data);
        setRecent(m.data);
      })
      .catch(() => showNotif("Σφάλμα σύνδεσης με το backend", "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="hero">
        <h1>Καλώς ήρθατε στο GymPro</h1>
        <p>Σύστημα Διαχείρισης Μελών · Εγγραφές · Συνδρομές · QR Είσοδος</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner spinner-dark" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card" style={{ borderColor: "#003F87" }}>
              <div className="stat-val" style={{ color: "#003F87" }}>{stats?.total_members ?? 0}</div>
              <div className="stat-label">Συνολικά Μέλη</div>
            </div>
            <div className="stat-card" style={{ borderColor: "#10B981" }}>
              <div className="stat-val" style={{ color: "#10B981" }}>{stats?.new_this_month ?? 0}</div>
              <div className="stat-label">Νέες Εγγραφές Μήνα</div>
            </div>
            {MEMBERSHIP_TYPES.map(t => (
              <div key={t.value} className="stat-card" style={{ borderColor: t.color }}>
                <div className="stat-val" style={{ color: t.color }}>{stats?.by_membership_type?.[t.value] ?? 0}</div>
                <div className="stat-label">{t.label}</div>
              </div>
            ))}
          </div>

          <div className="home-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <h3 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 15, marginBottom: 14, color: "#003F87" }}>
                ⚡ Γρήγορες Ενέργειες
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => navigate("/register")} style={{ justifyContent: "flex-start" }}>
                  + Νέα Εγγραφή Μέλους
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/members")} style={{ justifyContent: "flex-start" }}>
                  👥 Διαχείριση Μελών
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/search")} style={{ justifyContent: "flex-start" }}>
                  🔍 Αναζήτηση Μέλους
                </button>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 15, marginBottom: 14, color: "#003F87" }}>
                📋 Πρόσφατες Εγγραφές
              </h3>
              {recent.length === 0 && (
                <p style={{ fontSize: 13, color: "#64748B" }}>Δεν υπάρχουν μέλη ακόμα.</p>
              )}
              {recent.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div className="avatar" style={{ background: avColor(m.member_code), width: 32, height: 32, fontSize: 12 }}>
                    {initials(m.first_name, m.last_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{fmtDate(m.registration_date)}</div>
                  </div>
                  <span className="badge" style={{ background: `${mcolor(m.membership_type)}18`, color: mcolor(m.membership_type) }}>
                    {mlabel(m.membership_type)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
