import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(email, password);
      nav("/payments");
    } catch (e) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await register(email, password);   // auto logs in (per our AuthProvider)
      nav("/payments");
    } catch (e) {
      const msg = e?.response?.data?.errors?.[0]?.msg || e?.response?.data?.error;
      setErr(msg || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Account</h2>
      <form>
        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            type="password"
            required
            placeholder="Passw0rd!"
            style={{ width: "100%" }}
          />
          <small>8+ chars, at least 1 letter and 1 number.</small>
        </div>

        {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={doLogin} disabled={busy} type="button">Login</button>
          <button onClick={doRegister} disabled={busy} type="button">Register</button>
        </div>
      </form>
    </div>
  );
}
