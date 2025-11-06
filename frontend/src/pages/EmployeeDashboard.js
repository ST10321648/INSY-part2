// frontend/src/pages/EmployeeDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function EmployeeDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:5000/api/employee/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(res.data || []);
      } catch (err) {
        setMessage('Failed to load transactions. Are you logged in?');
      }
    }
    load();
  }, []);

  async function handleVerify(id) {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://127.0.0.1:5000/api/employee/transactions/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || 'Verified');
      setTransactions(t => t.filter(x => x.id !== id));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verify failed');
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Employee Dashboard</h2>
      <p>{message}</p>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Amount</th><th>Currency</th><th>SWIFT</th><th>Action</th></tr>
        </thead>
        <tbody>
          {transactions.length === 0 && <tr><td colSpan="6">No transactions</td></tr>}
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.customer_name}</td>
              <td>{tx.amount}</td>
              <td>{tx.currency}</td>
              <td>{tx.swift}</td>
              <td><button onClick={() => handleVerify(tx.id)}>Verify</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
