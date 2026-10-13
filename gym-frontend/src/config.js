// Shared by login and authenticated requests. Include /api/v1 in overrides.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000/api/v1"
).replace(/\/+$/, "");
