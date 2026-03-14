import axios from "axios";

const api = axios.create({
  baseURL: "https://gympro-production-624d.up.railway.app/api/v1",
  headers: { "Content-Type": "application/json" },
});

// ─── Members ─────────────────────────────────────────────────────
export const getMembers = (params) => api.get("/members/", { params });
export const getMember = (id) => api.get(`/members/${id}`);
export const createMember = (data) => api.post("/members/", data);
export const updateMember = (id, data) => api.patch(`/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/members/${id}`);
export const sendEmail = (id) => api.post(`/members/${id}/send-email`);
export const getStats = () => api.get("/members/stats/summary");

export default api;
