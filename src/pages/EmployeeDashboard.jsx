// src/pages/EmployeeDashboard.jsx
import { useState, useEffect } from "react";
import { formatCurrency } from "../utils/formatcurrency";
import { validateAmount, validateName } from "../utils/whitelist";
import { getTransactions, verifyTransaction, submitSWIFT } from "../utils/api";
import "../styles/form.css"; // optional, for styling

export default function EmployeeDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Get JWT token from localStorage
  const token = localStorage.getItem("jwtToken");

  // Fetch transactions from backend
  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await getTransactions(token);
        setTransactions(data);
      } catch (err) {
        setError("❌ Failed to fetch transactions from backend.");
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [token]);

  // Verify/unverify transaction
  const handleVerify = async (id) => {
    try {
      await verifyTransaction(id, token);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id ? { ...tx, verified: !tx.verified } : tx
        )
      );
    } catch (err) {
      alert("❌ Failed to verify transaction.");
    }
  };

  // Add transaction (client-side only)
  const handleAddTransaction = (e) => {
    e.preventDefault();

    if (!validateName(recipient)) {
      setError("❌ Recipient name can only contain letters and spaces.");
      return;
    }
    if (!validateAmount(amount)) {
      setError(
        "❌ Amount must be a valid number (e.g., 1200.50) in ZAR format."
      );
      return;
    }

    setError("");
    const newTx = {
      id: transactions.length + 1,
      recipient: recipient.trim(),
      amount: parseFloat(amount),
      verified: false,
    };

    setTransactions([...transactions, newTx]);
    setRecipient("");
    setAmount("");
  };

  // Submit verified transactions to SWIFT
  const handleSubmitSWIFT = async () => {
    try {
      const verifiedIds = transactions
        .filter((tx) => tx.verified)
        .map((tx) => tx.id);

      if (verifiedIds.length === 0) {
        alert("❌ No verified transactions to submit.");
        return;
      }

      await submitSWIFT(verifiedIds, token);
      alert("✅ Verified transactions submitted to SWIFT.");
    } catch (err) {
      alert("❌ Failed to submit to SWIFT.");
    }
  };

  if (loading) return <p>Loading transactions...</p>;

  return (
    <div className="container">
      <h1>Employee Dashboard</h1>

      {/* Add Transaction Form */}
      <form onSubmit={handleAddTransaction} className="transaction-form">
        <input
          type="text"
          placeholder="Recipient Name"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Amount (ZAR)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="submit-btn">
          Add Transaction
        </button>
      </form>

      {/* Transactions Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Recipient</th>
            <th>Amount (ZAR)</th>
            <th>Verified</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.recipient}</td>
              <td>{formatCurrency(tx.amount)}</td>
              <td>{tx.verified ? "✅" : "❌"}</td>
              <td>
                <button onClick={() => handleVerify(tx.id)}>
                  {tx.verified ? "Unverify" : "Verify"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Submit to SWIFT Button */}
      <button className="submit-btn" onClick={handleSubmitSWIFT}>
        Submit to SWIFT
      </button>
    </div>
  );
}
