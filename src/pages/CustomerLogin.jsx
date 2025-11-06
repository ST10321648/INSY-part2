// src/pages/CustomerLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css"; // or your App.css if needed

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Regex validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("❌ Invalid email format.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "❌ Password must be at least 8 characters, include one letter and one number."
      );
      return;
    }

    setError("");
    // Navigate to payments page on successful login
    navigate("/customer/payments");
  };

  return (
    <div className="container">
      <h1>Customer Login</h1>
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
