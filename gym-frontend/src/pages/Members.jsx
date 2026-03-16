import { useState, useEffect, useCallback, useMemo } from "react";
import { getMembers, deleteMember, updateMember, sendEmail } from "../api";
import { mlabel, mcolor, initials, avColor, fmtDate, MEMBERSHIP_TYPES, GENDER_OPTIONS, Icons } from "../App";

const MONTHS = [
  { value: "1", label: "Ιανουάριος" }, { value: "2", label: "Φεβρουάριος" },
  { value: "3", label: "Μάρτιος" },    { value: "4", label: "Απρίλιος" },
  { value: "5", label: "Μάιος" },      { value: "6", label: "Ιούνιος" },
  { value: "7", label: "Ιούλιος" },    { value: "8", label: "Αύγουστος" },
  { value: "9", label: "Σεπτέμβριος" },{ value: "10", label: "Οκτώβριος" },
  { value: "11", label: "Νοέμβριος" }, { value: "12", label: "Δεκέμβριος" },
];

export default function Members({ showNotif }) {
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [detailM, setDetailM] = useState(null);
  const [editM, setEditM] = useState(null);
  const [deleteM, setDeleteM] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const { data } = await getMembers(q ? { q } : {});
      setAllMembers(data);
      setMembers(data);
    } catch {
      showNotif("Σφάλμα φόρτωσης μελών", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Φιλτράρισμα frontend-side ──
  const filtered = useMemo(() => {
    let result = allMembers;
    if (filterType) {
      result = result.filter(m => m.membership_type === filterType);
    }
    if (filterMonth) {
      result = result.filter(m => {
        if (!m.registration_date) return false;
        const month = new Date(m.registration_date).getMonth() + 1;
        return month === parseInt(filterMonth);
      });
    }
    return result;
  }, [allMembers, filterType, filterMonth]);

  const activeFilters = (filterType ? 1 : 0) + (filterMonth ? 1 : 0);

  const clearFilters = () => {
    setFilterType("");
    setFilterMonth("");
  };

  const handleDelete = async () => {
    try {
      await deleteMember(deleteM.id);
      setAllMembers(ms => ms.filter(m => m.id !== deleteM.id));
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
        first_name: editM.first_name, last_name: editM.last_name,
        phone: editM.phone, email: editM.email,
        birth_date: editM.birth_date || null, gender: editM.gender || null,
        membership_type: editM.membership_type, notes: editM.notes,
      });
      setAllMembers(ms => ms.map(m => m.id === data.id ? data : m));
      if (detailM?.id === data.id) setDetailM(data);
      setEditM(null); setEditErrors({});
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
        <div className="sec-title">
          👥 Μέλη ({filtered.length}{filtered.length !== allMembers.length ? ` / ${allMembers.length}` : ""})
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn btn-sm ${showFilters ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setShowFilters(s => !s)}
            style={{ position: "relative" }}
          >
            🔽 Φίλτρα
            {activeFilters > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -6,
                background: "#EF4444", color: "#fff",
                borderRadius: "50%", width: 18, height: 18,
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {activeFilters}
              </span>
            )}
          </button>
          <a href="/register" className="btn btn-primary btn-sm">+ Νέα Εγγραφή</a>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {/* ── Search & Filters ── */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
          <div className="search-wrap" style={{ marginBottom: showFilters ? 12 : 0 }}>
            <span className="search-icon"><Icons.Search /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση με όνομα, επώνυμο ή τηλέφωνο..."
              style={{ paddingLeft: 42 }}
            />
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div style={{
              background: "#F8FAFC", borderRadius: 8, padding: "14px 16px",
              border: "1px solid #E2E8F0", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end"
            }}>
              {/* Τύπος Συνδρομής */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 6 }}>
                  Τύπος Συνδρομής
                </label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans',sans-serif", outline: "none", background: "#fff" }}
                >
                  <option value="">Όλες οι συνδρομές</option>
                  {MEMBERSHIP_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Μήνας Εγγραφής */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 6 }}>
                  Μήνας Εγγραφής
                </label>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans',sans-serif", outline: "none", background: "#fff" }}
                >
                  <option value="">Όλοι οι μήνες</option>
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFilters > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                  ✕ Καθαρισμός φίλτρων
                </button>
              )}
            </div>
          )}

          {/* Active filter badges */}
          {activeFilters > 0 && !showFilters && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {filterType && (
                <span style={{ background: `${mcolor(filterType)}15`, color: mcolor(filterType), border: `1px solid ${mcolor(filterType)}40`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  {mlabel(filterType)}
                  <button onClick={() => setFilterType("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 13, lineHeight: 1 }}>✕</button>
                </span>
              )}
              {filterMonth && (
                <span style={{ background: "#E8F0FB", color: "#003F87", border: "1px solid #BFDBFE", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  {MONTHS.find(m => m.value === filterMonth)?.label}
                  <button onClick={() => setFilterMonth("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 13, lineHeight: 1 }}>✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner spinner-dark" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <p style={{ fontSize: 15, fontWeight: 600 }}>Δεν βρέθηκαν μέλη</p>
            {activeFilters > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ marginTop: 12 }}>
                Καθαρισμός φίλτρων
              </button>
            )}
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
                {filtered.map(m => (
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
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${detailM.member_code}&color=003F87`} alt="QR" width={120} height={120} />
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
