import { useState } from "react";
import "./App.css";

function Payments() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  // Regex validation functions
  const validateAmount = (amount) => /^\d+(\.\d{1,2})?$/.test(amount); // number with up to 2 decimals
  const validateCurrency = (currency) => /^[A-Z]{3}$/.test(currency); // e.g., USD, EUR
  const validateRecipient = (recipient) => /^[A-Za-z\s]{3,50}$/.test(recipient); // letters + spaces, 3-50 chars

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateAmount(amount)) {
      setError("❌ Invalid amount. Must be a number with up to 2 decimal places.");
      return;
    }
    if (!validateCurrency(currency)) {
      setError("❌ Invalid currency. Use 3-letter code (e.g., USD).");
      return;
    }
    if (!validateRecipient(recipient)) {
      setError("❌ Invalid recipient. Only letters and spaces (3-50 characters).");
      return;
    }

    setError("");
    setConfirmation({ amount, currency, recipient });
  };

  if (confirmation) {
    return (
      <div className="container">
        <h1>Payment Confirmation ✅</h1>
        <p><strong>Amount:</strong> {confirmation.amount} {confirmation.currency}</p>
        <p><strong>Recipient:</strong> {confirmation.recipient}</p>
        <button onClick={() => setConfirmation(null)}>Make Another Payment</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>International Payment</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Currency (e.g., USD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          required
        />
        <input
          type="text"
          placeholder="Recipient Name"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit-btn">Submit Payment</button>
      </form>
    </div>
  );
}

export default Payments;
