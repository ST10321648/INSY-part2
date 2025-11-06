import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/payments')
      .then(res => setPayments(res.data))
      .catch(err => console.error('Error fetching payments', err));
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2>Payment History</h2>
      {payments.length === 0 ? (
        <p>No payments found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc' }}>Amount</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Currency</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>SWIFT</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.amount}</td>
                <td>{p.currency}</td>
                <td>{p.swiftCode}</td>
                <td>{new Date(p.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PaymentHistory;
