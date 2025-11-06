// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePassword } from "../utils/whitelist";
import { login } from "../utils/api";
import "../styles/form.css"; // optional, for styling

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validateEmail(email)) {
      setError("❌ Invalid email format.");
      return;
    }
    if (!validatePassword(password)) {
      setError(
        "❌ Password must be at least 8 characters, include 1 letter and 1 number."
      );
      return;
    }
    // MOCK: allow login for testing
  localStorage.setItem("jwtToken", "mock-token"); // pretend we got a JWT
  setError("");
  navigate("/employee/dashboard");

    setError("");

    try {
      // Call backend login
      const { token } = await login(email, password);

      // Store JWT token in localStorage
      localStorage.setItem("jwtToken", token);

      alert("✅ Login Successful");

      // Navigate to employee dashboard
      navigate("/employee");
    } catch (err) {
      setError("❌ Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="container">
      <h1>Employee Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit-btn">
          Login
        </button>
      </form>
    </div>
  );
}
