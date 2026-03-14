import { useState } from "react";
import { getMembers } from "../api";
import { mlabel, mcolor, initials, avColor, fmtDate, Icons } from "../App";

export default function Search({ showNotif }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const { data } = await getMembers({ q });
      setResults(data);
      setSearched(true);
    } catch {
      showNotif("Σφάλμα αναζήτησης", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="sec-title" style={{ marginBottom: 20 }}>🔍 Αναζήτηση Μέλους</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="search-wrap">
          <span className="search-icon"><Icons.Search /></span>
          <input
            autoFocus
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Πληκτρολογήστε όνομα, επώνυμο, τηλέφωνο, email ή κωδικό μέλους..."
            style={{ paddingLeft: 42, fontSize: 15 }}
          />
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner spinner-dark" /></div>}

      {!loading && searched && (
        <div>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
            {results.length} αποτέλεσμα{results.length !== 1 ? "τα" : ""}
          </div>
          {results.length === 0 ? (
            <div className="card"><div className="empty"><p style={{ fontSize: 15, fontWeight: 600 }}>Δεν βρέθηκαν αποτελέσματα για "{query}"</p></div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {results.map(m => (
                <div key={m.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div className="avatar" style={{ background: avColor(m.member_code), width: 44, height: 44, fontSize: 16 }}>
                      {initials(m.first_name, m.last_name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>{m.member_code}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B", marginBottom: 3 }}>📞 {m.phone}</div>
                  <div style={{ fontSize: 13, color: "#64748B", marginBottom: 10 }}>✉ {m.email}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="badge" style={{ background: `${mcolor(m.membership_type)}15`, color: mcolor(m.membership_type) }}>
                      {mlabel(m.membership_type)}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{fmtDate(m.registration_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && !loading && (
        <div className="card">
          <div className="empty">
            <p style={{ fontSize: 15, fontWeight: 600 }}>Πληκτρολογήστε για αναζήτηση</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Αναζήτηση με όνομα, επώνυμο, τηλέφωνο, email ή κωδικό</p>
          </div>
        </div>
      )}
    </div>
  );
}
