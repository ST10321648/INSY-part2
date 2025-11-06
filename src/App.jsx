// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Customer portal
import CustomerLogin from "./pages/CustomerLogin";
import Payments from "./Payments.jsx";

// Employee portal
import LoginPage from "./pages/LoginPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";

// Protect employee dashboard
function PrivateEmployeeRoute({ children }) {
  const token = localStorage.getItem("jwtToken"); // replace with real JWT logic
  return token ? children : <Navigate to="/employee" />;
}

function App() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/customer" element={<CustomerLogin />} />
      <Route path="/customer/payments" element={<Payments />} />

      {/* Employee Routes */}
      <Route path="/employee" element={<LoginPage />} />
      <Route
        path="/employee/dashboard"
        element={
          <PrivateEmployeeRoute>
            <EmployeeDashboard />
          </PrivateEmployeeRoute>
        }
      />

      {/* Default */}
      <Route path="*" element={<Navigate to="/customer" />} />
    </Routes>
  );
}

export default App;
