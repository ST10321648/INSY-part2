// backend/server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// temporary in-memory array to store payments
let payments = [];

// health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1234') {
    res.json({ message: 'Login successful!' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// save a payment
app.post('/api/payment', (req, res) => {
  const { amount, currency, swiftCode } = req.body;
  const newPayment = {
    id: payments.length + 1,
    amount,
    currency,
    swiftCode,
    timestamp: new Date()
  };
  payments.push(newPayment);
  res.json({ message: 'Payment recorded successfully!', payment: newPayment });
});

// return all payments
app.get('/api/payments', (req, res) => {
  res.json(payments);
});

// start server
app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));
