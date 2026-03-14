import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMember } from "../api";
import { MEMBERSHIP_TYPES, GENDER_OPTIONS } from "../App";

const EMPTY = {
  first_name: "", last_name: "", phone: "", email: "",
  birth_date: "", gender: "", membership_type: "monthly", notes: "",
};

function validate(f) {
  const e = {};
  if (!f.first_name.trim()) e.first_name = "Υποχρεωτικό πεδίο";
  if (!f.last_name.trim()) e.last_name = "Υποχρεωτικό πεδίο";
  if (!f.phone.trim()) e.phone = "Υποχρεωτικό πεδίο";
  else if (!/^(\+30|0030|0)?[267]\d{9}$/.test(f.phone.replace(/\s|-/g, "")))
    e.phone = "Μη έγκυρος αριθμός τηλεφώνου";
  if (!f.email.trim()) e.email = "Υποχρεωτικό πεδίο";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Μη έγκυρο email";
  return e;
}

export default function Register({ showNotif }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const sf = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.birth_date) delete payload.birth_date;
      if (!payload.gender) delete payload.gender;
      if (!payload.notes) delete payload.notes;

      const { data } = await createMember(payload);
      setSuccess(data);
      setForm({ ...EMPTY });
      setErrors({});
      showNotif(`Το μέλος ${data.first_name} ${data.last_name} εγγράφηκε επιτυχώς! 🎉`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Σφάλμα κατά την εγγραφή";
      showNotif(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", padding: "40px 32px" }}>
          <div style={{ width: 72, height: 72, background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#10B981" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 22, marginBottom: 8, color: "#003F87" }}>
            Εγγραφή Επιτυχής!
          </h2>
          <p style={{ color: "#64748B", marginBottom: 20, fontSize: 15 }}>
            Το μέλος <strong>{success.first_name} {success.last_name}</strong> εγγράφηκε με κωδικό:
          </p>
          <div style={{ background: "#F0F4FA", borderRadius: 8, padding: "10px 20px", fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#003F87", marginBottom: 20 }}>
            {success.member_code}
          </div>

          {/* QR Code */}
          <div style={{ marginBottom: 24 }}>
            <div className="qr-box" style={{ display: "inline-flex" }}>
              <img
                src={`http://localhost:8000/static/qrcodes/${success.member_code}.png`}
                alt="QR Code"
                width={140} height={140}
              />
              <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>{success.member_code}</div>
            </div>
            <p style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>
              {success.welcome_email_sent === "Y"
                ? "✅ Email καλωσορίσματος εστάλη στο " + success.email
                : "📧 Αποστολή email σε εξέλιξη..."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => setSuccess(null)}>
              + Νέα Εγγραφή
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/members")}>
              👥 Προβολή Μελών
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="sec-header">
        <div className="sec-title">+ Νέα Εγγραφή Μέλους</div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Όνομα <span className="req">*</span></label>
            <input className={errors.first_name ? "error" : ""} value={form.first_name} onChange={e => sf("first_name", e.target.value)} placeholder="π.χ. Νίκος" />
            {errors.first_name && <span className="err-msg">⚠ {errors.first_name}</span>}
          </div>

          <div className="field">
            <label>Επώνυμο <span className="req">*</span></label>
            <input className={errors.last_name ? "error" : ""} value={form.last_name} onChange={e => sf("last_name", e.target.value)} placeholder="π.χ. Παπαδόπουλος" />
            {errors.last_name && <span className="err-msg">⚠ {errors.last_name}</span>}
          </div>

          <div className="field">
            <label>Τηλέφωνο <span className="req">*</span></label>
            <input className={errors.phone ? "error" : ""} value={form.phone} onChange={e => sf("phone", e.target.value)} placeholder="π.χ. 6971234567" type="tel" />
            {errors.phone && <span className="err-msg">⚠ {errors.phone}</span>}
          </div>

          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input className={errors.email ? "error" : ""} value={form.email} onChange={e => sf("email", e.target.value)} placeholder="π.χ. nikos@email.gr" type="email" />
            {errors.email && <span className="err-msg">⚠ {errors.email}</span>}
          </div>

          <div className="field">
            <label>Ημερομηνία Γέννησης</label>
            <input type="date" value={form.birth_date} onChange={e => sf("birth_date", e.target.value)} max={new Date().toISOString().split("T")[0]} />
          </div>

          <div className="field">
            <label>Ημερομηνία Εγγραφής</label>
            <input value={new Date().toLocaleDateString("el-GR")} readOnly style={{ background: "#F8FAFC", color: "#64748B" }} />
          </div>

          <div className="field form-full">
            <label>Φύλο</label>
            <div className="radio-group">
              {GENDER_OPTIONS.map(g => (
                <label key={g.value} className={`radio-pill${form.gender === g.value ? " selected" : ""}`} onClick={() => sf("gender", g.value)}>
                  <input type="radio" name="gender" value={g.value} readOnly />
                  {g.label}
                </label>
              ))}
            </div>
          </div>

          <div className="field form-full">
            <label>Τύπος Συνδρομής</label>
            <div className="radio-group">
              {MEMBERSHIP_TYPES.map(t => (
                <label
                  key={t.value}
                  className={`radio-pill${form.membership_type === t.value ? " selected" : ""}`}
                  style={form.membership_type === t.value ? { borderColor: t.color, background: `${t.color}10`, color: t.color } : {}}
                  onClick={() => sf("membership_type", t.value)}
                >
                  <input type="radio" name="membership" value={t.value} readOnly />
                  {t.label} <span style={{ opacity: .65, fontSize: 11 }}>({t.price})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field form-full">
            <label>Σημειώσεις</label>
            <textarea value={form.notes} onChange={e => sf("notes", e.target.value)} placeholder="Προαιρετικές σημειώσεις..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end", borderTop: "1px solid #E2E8F0", paddingTop: 20 }}>
          <button className="btn btn-secondary" onClick={() => { setForm({ ...EMPTY }); setErrors({}); }}>
            🔄 Καθαρισμός
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ minWidth: 160 }}>
            {submitting ? <div className="spinner" /> : "✓ Αποθήκευση"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#64748B" }}>
        ℹ️ Τα πεδία με * είναι υποχρεωτικά. Μετά την εγγραφή θα δημιουργηθεί αυτόματα QR Code και θα σταλεί email καλωσορίσματος.
      </div>
    </div>
  );
}
