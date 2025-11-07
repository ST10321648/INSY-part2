// frontend/src/pages/EmployeeLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthProvider";

export default function EmployeeLogin() {
  const nav = useNavigate();
  const { loginEmployee } = useEmployeeAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doEmployeeLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await loginEmployee(email, password);
      nav("/employee/dashboard");
    } catch (error) {
      console.error(error);
      setErr("Employee login failed – check email/password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Employee Portal Login</h2>
      <form>
        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="verifier@bank.com"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            placeholder="EmpPassw0rd!"
            style={{ width: "100%" }}
          />
        </div>

        {err && (
          <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={doEmployeeLogin}
            disabled={busy}
            type="button"
          >
            Login as Employee
          </button>
        </div>
      </form>
    </div>
  );
}
