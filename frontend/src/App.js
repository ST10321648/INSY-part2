import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import { EmployeeAuthProvider, useEmployeeAuth } from "./context/EmployeeAuthProvider";
import Login from "./pages/Login";
import Payments from "./pages/Payments";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";


function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  return token ? children : <Navigate to="/login" replace />;
}

function EmployeePrivateRoute({ children }) {
  const { employeeToken, loading } = useEmployeeAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  return employeeToken ? children : <Navigate to="/employee/login" replace />;
}


export default function App() {
  return (
    <AuthProvider>
      <EmployeeAuthProvider>
        <BrowserRouter>
          <nav style={{ padding: 12, display: "flex", gap: 12 }}>
            {/* Customer portal links */}
            <Link to="/login">customer login</Link>
            <Link to="/payments">customer payments</Link>

            <span style={{ flex: 1 }} />

            {/* Employee portal links */}
            <Link to="/employee/login">employee login</Link>
            <Link to="/employee/dashboard">employee portal</Link>
          </nav>

          <Routes>
            {/* Customer routes */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <Payments />
                </PrivateRoute>
              }
            />

            {/* Employee routes */}
            <Route path="/employee/login" element={<EmployeeLogin />} />
            <Route
              path="/employee/dashboard"
              element={
                <EmployeePrivateRoute>
                  <EmployeeDashboard />
                </EmployeePrivateRoute>
              }
            />

            {/* Default fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </EmployeeAuthProvider>
    </AuthProvider>
  );
}

