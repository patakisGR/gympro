import { useState, useEffect, useCallback } from "react";
import { getMembers, deleteMember, updateMember, sendEmail } from "../api";
import { mlabel, mcolor, initials, avColor, fmtDate, MEMBERSHIP_TYPES, GENDER_OPTIONS, Icons } from "../App";

const EMPTY_EDIT = { first_name: "", last_name: "", phone: "", email: "", birth_date: "", gender: "", membership_type: "monthly", notes: "" };

export default function Members({ showNotif }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailM, setDetailM] = useState(null);
  const [editM, setEditM] = useState(null);
  const [deleteM, setDeleteM] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const { data } = await getMembers(q ? { q } : {});
      setMembers(data);
    } catch {
      showNotif("Σφάλμα φόρτωσης μελών", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async () => {
    try {
      await deleteMember(deleteM.id);
      setMembers(ms => ms.filter(m => m.id !== deleteM.id));
      setDeleteM(null);
      if (detailM?.id === deleteM.id) setDetailM(null);
      showNotif("Το μέλος διαγράφηκε.", "info");
    } catch {
      showNotif("Σφάλμα διαγραφής", "error");
    }
  };

  const handleSaveEdit = async () => {
    const errs = {};
    if (!editM.first_name?.trim()) errs.first_name = "Υποχρεωτικό";
    if (!editM.last_name?.trim()) errs.last_name = "Υποχρεωτικό";
    if (!editM.phone?.trim()) errs.phone = "Υποχρεωτικό";
    if (!editM.email?.trim()) errs.email = "Υποχρεωτικό";
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    setSaving(true);
    try {
      const { data } = await updateMember(editM.id, {
        first_name: editM.first_name,
        last_name: editM.last_name,
        phone: editM.phone,
        email: editM.email,
        birth_date: editM.birth_date || null,
        gender: editM.gender || null,
        membership_type: editM.membership_type,
        notes: editM.notes,
      });
      setMembers(ms => ms.map(m => m.id === data.id ? data : m));
      if (detailM?.id === data.id) setDetailM(data);
      setEditM(null);
      setEditErrors({});
      showNotif("Τα στοιχεία αποθηκεύτηκαν!");
    } catch (err) {
      showNotif(err.response?.data?.detail || "Σφάλμα αποθήκευσης", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async (m) => {
    try {
      await sendEmail(m.id);
      showNotif(`Email αποστέλλεται στο ${m.email}`);
    } catch {
      showNotif("Σφάλμα αποστολής email", "error");
    }
  };

  return (
    <div className="page">
      <div className="sec-header">
        <div className="sec-title">👥 Μέλη ({members.length})</div>
        <a href="/register" className="btn btn-primary btn-sm">+ Νέα Εγγραφή</a>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
          <div className="search-wrap">
            <span className="search-icon"><Icons.Search /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση με όνομα, επώνυμο ή τηλέφωνο..."
              style={{ paddingLeft: 42 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner spinner-dark" /></div>
        ) : members.length === 0 ? (
          <div className="empty">
            <p style={{ fontSize: 15, fontWeight: 600 }}>Δεν βρέθηκαν μέλη</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Μέλος</th><th>Τηλέφωνο</th><th>Email</th>
                  <th>Συνδρομή</th><th>Εγγραφή</th><th>Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar" style={{ background: avColor(m.member_code) }}>
                          {initials(m.first_name, m.last_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{m.first_name} {m.last_name}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{m.member_code}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{m.phone}</td>
                    <td style={{ fontSize: 12, color: "#64748B" }}>{m.email}</td>
                    <td>
                      <span className="badge" style={{ background: `${mcolor(m.membership_type)}15`, color: mcolor(m.membership_type) }}>
                        {mlabel(m.membership_type)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748B" }}>{fmtDate(m.registration_date)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Προβολή" className="btn btn-sm btn-secondary btn-icon" onClick={() => setDetailM(m)}><Icons.Eye /></button>
                        <button title="Επεξεργασία" className="btn btn-sm btn-secondary btn-icon" onClick={() => { setEditM({ ...m }); setEditErrors({}); }}><Icons.Edit /></button>
                        <button title="Email" className="btn btn-sm btn-secondary btn-icon" onClick={() => handleSendEmail(m)}><Icons.Mail /></button>
                        <button title="Διαγραφή" className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteM(m)}><Icons.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detailM && (
        <div className="modal-overlay" onClick={() => setDetailM(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="avatar" style={{ background: avColor(detailM.member_code), width: 44, height: 44, fontSize: 16 }}>
                  {initials(detailM.first_name, detailM.last_name)}
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 18 }}>{detailM.first_name} {detailM.last_name}</h2>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{detailM.member_code}</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setDetailM(null)}><Icons.X /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
                <div>
                  {[
                    ["Τηλέφωνο", detailM.phone],
                    ["Email", detailM.email],
                    ["Ημ. Γέννησης", fmtDate(detailM.birth_date)],
                    ["Φύλο", GENDER_OPTIONS.find(g => g.value === detailM.gender)?.label || "—"],
                    ["Εγγραφή", fmtDate(detailM.registration_date)],
                  ].map(([k, v]) => (
                    <div key={k} className="detail-row">
                      <span className="detail-key">{k}</span>
                      <span className="detail-val">{v || "—"}</span>
                    </div>
                  ))}
                  <div className="detail-row">
                    <span className="detail-key">Συνδρομή</span>
                    <span className="badge" style={{ background: `${mcolor(detailM.membership_type)}15`, color: mcolor(detailM.membership_type) }}>
                      {mlabel(detailM.membership_type)}
                    </span>
                  </div>
                  {detailM.notes && (
                    <div style={{ marginTop: 12, background: "#F8FAFC", borderRadius: 8, padding: 12, fontSize: 13, color: "#64748B" }}>
                      <strong style={{ color: "#0F172A" }}>Σημειώσεις:</strong> {detailM.notes}
                    </div>
                  )}
                </div>
                <div className="qr-box">
                  <img src={`http://localhost:8000/static/qrcodes/${detailM.member_code}.png`} alt="QR" width={120} height={120} />
                  <div style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{detailM.member_code}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => { handleSendEmail(detailM); setDetailM(null); }}><Icons.Mail /> Email</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditM({ ...detailM }); setDetailM(null); setEditErrors({}); }}><Icons.Edit /> Επεξεργασία</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteM(detailM); setDetailM(null); }}><Icons.Trash /> Διαγραφή</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editM && (
        <div className="modal-overlay" onClick={() => setEditM(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 18 }}>✏️ Επεξεργασία Μέλους</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setEditM(null)}><Icons.X /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[["first_name","Όνομα"],["last_name","Επώνυμο"],["phone","Τηλέφωνο"],["email","Email"]].map(([k, lbl]) => (
                  <div key={k} className="field">
                    <label>{lbl} <span className="req">*</span></label>
                    <input className={editErrors[k] ? "error" : ""} value={editM[k] || ""} onChange={e => setEditM(m => ({ ...m, [k]: e.target.value }))} />
                    {editErrors[k] && <span className="err-msg">⚠ {editErrors[k]}</span>}
                  </div>
                ))}
                <div className="field">
                  <label>Ημ. Γέννησης</label>
                  <input type="date" value={editM.birth_date?.split("T")[0] || ""} onChange={e => setEditM(m => ({ ...m, birth_date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Τύπος Συνδρομής</label>
                  <select value={editM.membership_type} onChange={e => setEditM(m => ({ ...m, membership_type: e.target.value }))}>
                    {MEMBERSHIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="field form-full">
                  <label>Σημειώσεις</label>
                  <textarea value={editM.notes || ""} onChange={e => setEditM(m => ({ ...m, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditM(null)}>Ακύρωση</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <div className="spinner" /> : "✓ Αποθήκευση"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteM && (
        <div className="modal-overlay" onClick={() => setDeleteM(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: "center", paddingTop: 32, paddingBottom: 20 }}>
              <div style={{ width: 60, height: 60, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#EF4444" }}>
                <Icons.Trash />
              </div>
              <h3 style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 18, marginBottom: 8 }}>Διαγραφή Μέλους</h3>
              <p style={{ color: "#64748B", fontSize: 14 }}>
                Είστε σίγουροι ότι θέλετε να διαγράψετε το μέλος <strong>{deleteM.first_name} {deleteM.last_name}</strong>; Η ενέργεια δεν μπορεί να αναιρεθεί.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteM(null)}>Ακύρωση</button>
              <button className="btn btn-danger" style={{ background: "#EF4444", color: "#fff" }} onClick={handleDelete}>
                <Icons.Trash /> Διαγραφή
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
