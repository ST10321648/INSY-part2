import React, { useState } from 'react';

function Payment() {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // For now, just simulate a payment
    if (!amount || !cardNumber) {
      setMessage('Please fill in all fields');
      return;
    }

    setMessage(`Payment of $${amount} successful!`);
  };

  return (
    <div>
      <h2>Make a Payment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Amount:</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="Enter amount"
          />
        </div>
        <div>
          <label>Card Number:</label>
          <input 
            type="text" 
            value={cardNumber} 
            onChange={(e) => setCardNumber(e.target.value)} 
            placeholder="Enter card number"
          />
        </div>
        <button type="submit">Pay</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Payment;
