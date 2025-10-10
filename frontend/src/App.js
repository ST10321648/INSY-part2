import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import Login from "./pages/Login";
import Payments from "./pages/Payments";

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav style={{ padding: 12, display: "flex", gap: 12 }}>
          <Link to="/login">login</Link>
          <Link to="/payments">payments</Link>
        </nav>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <Payments />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
