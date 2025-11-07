// frontend/src/context/EmployeeAuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken } from "../api/client";

const EmployeeAuthCtx = createContext(null);

export function EmployeeAuthProvider({ children }) {
  // load any existing employee token from localStorage
  const [employeeToken, setEmployeeToken] = useState(
    () => localStorage.getItem("employeeAccessToken")
  );
  const [loading, setLoading] = useState(false); // simple for employees

  // keep axios Authorization header in sync with employee token
  useEffect(() => {
    if (employeeToken) {
      setAccessToken(employeeToken);
    }
  }, [employeeToken]);

  const loginEmployee = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/employee/auth/login", { email, password });
      localStorage.setItem("employeeAccessToken", data.accessToken);
      setEmployeeToken(data.accessToken);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logoutEmployee = async () => {
    try {
      await api.post("/api/employee/auth/logout");
    } catch {
      // ignore network errors here – frontend can still forget token
    }
    localStorage.removeItem("employeeAccessToken");
    setEmployeeToken(null);
  };

  const value = { employeeToken, loginEmployee, logoutEmployee, loading };

  return (
    <EmployeeAuthCtx.Provider value={value}>
      {children}
    </EmployeeAuthCtx.Provider>
  );
}

export const useEmployeeAuth = () => useContext(EmployeeAuthCtx);
