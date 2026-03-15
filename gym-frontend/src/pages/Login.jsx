import { useState } from "react";
import axios from "axios";

const API = "https://gympro-production-624d.up.railway.app";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);

      const { data } = await axios.post(`${API}/api/v1/auth/login`, form);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", data.username);
      onLogin(data.username);
    } catch (err) {
      setError(err.response?.data?.detail || "Σφάλμα σύνδεσης");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F0F4FA",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Noto Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: "#003F87", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M6 4v16M18 4v16M6 8h12M6 16h12M3 8h3M3 16h3M18 8h3M18 16h3" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 28, fontWeight: 800, color: "#003F87", margin: 0 }}>
            GymPro
          </h1>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 6 }}>
            Σύστημα Διαχείρισης Μελών
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 12, padding: "32px 28px",
          boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,63,135,.08)",
        }}>
          <h2 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 24 }}>
            Σύνδεση
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid #E2E8F0", borderRadius: 8,
                  fontSize: 14, fontFamily: "'Noto Sans',sans-serif",
                  outline: "none", color: "#0F172A",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid #E2E8F0", borderRadius: 8,
                  fontSize: 14, fontFamily: "'Noto Sans',sans-serif",
                  outline: "none", color: "#0F172A",
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 13, color: "#991B1B", marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading ? "#94A3B8" : "#003F87",
                color: "#fff", border: "none", borderRadius: 8,
                fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Noto Sans',sans-serif",
                transition: "background .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                  Σύνδεση...
                </>
              ) : "Σύνδεση"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 20 }}>
          © GymPro · Σύστημα Διαχείρισης Μελών
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
