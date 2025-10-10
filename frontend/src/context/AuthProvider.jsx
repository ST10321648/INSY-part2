import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken, setCsrfToken } from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));

  // keep axios in sync
  useEffect(() => { setAccessToken(token); }, [token]);

  // fetch CSRF token & store
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/csrf-token");
        setCsrfToken(data.csrfToken);
      } catch (e) {
        console.error("Failed to load CSRF", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    setToken(data.accessToken);
    return true;
  };

  const register = async (email, password) => {
    await api.post("/api/auth/register", { email, password });
    // optionally auto-login after register
    return login(email, password);
  };

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    localStorage.removeItem("accessToken");
    setToken(null);
  };

  const value = { loading, token, login, register, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
