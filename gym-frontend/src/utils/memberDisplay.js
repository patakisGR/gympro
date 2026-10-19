export const MEMBERSHIP_TYPES = [
  { value: "monthly",    label: "Μηνιαία",    price: "40€/μήνα",   color: "#3B82F6" },
  { value: "quarterly",  label: "Τριμηνιαία", price: "105€/3μηνο", color: "#8B5CF6" },
  { value: "semiannual", label: "Εξαμηνιαία", price: "190€/6μηνο", color: "#F59E0B" },
  { value: "annual",     label: "Ετήσια",     price: "350€/έτος",  color: "#10B981" },
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

