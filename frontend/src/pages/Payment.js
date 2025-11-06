import React, { useState } from 'react';
import axios from 'axios';

function Payment() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [cardNumber, setCardNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !cardNumber || !swiftCode) {
      setMessage('Please fill in all fields');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/payment', {
        amount,
        currency,
        cardNumber,
        swiftCode
      });
      setMessage(res.data.message);
      setAmount('');
      setCurrency('USD');
      setCardNumber('');
      setSwiftCode('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Payment failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2 style={{ textAlign: 'center' }}>Make a Payment</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Amount:</label>
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{ width: '100%', padding: '8px', borderRadius: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Currency:</label>
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '5px' }}
          >
            <option value="USD">USD</option>
            <option value="ZAR">ZAR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Card Number:</label>
          <input 
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Enter card number"
            style={{ width: '100%', padding: '8px', borderRadius: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>SWIFT Code:</label>
          <input 
            type="text"
            value={swiftCode}
            onChange={(e) => setSwiftCode(e.target.value)}
            placeholder="Enter SWIFT code"
            style={{ width: '100%', padding: '8px', borderRadius: '5px' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Pay Now
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '15px', textAlign: 'center', color: message.includes('successful') ? 'green' : 'red' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Payment;
