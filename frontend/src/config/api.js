// Centralized API Base URL configuration
// When hosted, set VITE_API_URL in your hosting dashboard (e.g. https://your-backend.onrender.com)
// If undefined, it automatically defaults to http://localhost:5000 in local dev
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "")
).replace(/\/+$/, "");

export const getApiUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export default API_URL;
