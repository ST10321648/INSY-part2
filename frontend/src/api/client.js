import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "https://localhost:5000",
  withCredentials: true, // send/receive cookies (CSRF)
});

// Simple token/CSRF holders that the AuthProvider will set
let accessToken = null;
let csrfToken = null;

export function setAccessToken(t) { accessToken = t || null; }
export function setCsrfToken(t) { csrfToken = t || null; }

// Attach headers
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (csrfToken) config.headers["csrf-token"] = csrfToken;
  return config;
});

// If a request 401s, try to refresh once, then retry
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = api.post("/api/auth/refresh"); // CSRF header included
        }
        const { data } = await refreshing;
        refreshing = null;
        setAccessToken(data.accessToken);
        return api(original);
      } catch (e) {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
