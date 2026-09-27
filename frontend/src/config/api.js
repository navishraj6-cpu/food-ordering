// Centralized API Base URL configuration
// 1. Explicit VITE_API_URL environment variable if set
// 2. In local development (localhost / 127.0.0.1): defaults to local backend http://localhost:5000
// 3. In hosted production: defaults to deployed backend https://food-ordering-backend-gules.vercel.app
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://food-ordering-backend-gules.vercel.app")
).replace(/\/+$/, "");

export const getApiUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export const getImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  return img.startsWith("/") ? img : `/${img}`;
};

export default API_URL;
