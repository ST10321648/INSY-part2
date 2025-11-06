import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Payment from './pages/Payment';
import PaymentHistory from './pages/PaymentHistory';

function App() {
  return (
    <Router>
      <nav style={{ padding: '10px', backgroundColor: '#f4f4f4' }}>
        <Link to="/" style={{ marginRight: '15px' }}>Login</Link>
        <Link to="/payment" style={{ marginRight: '15px' }}>Make Payment</Link>
        <Link to="/history">Payment History</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/history" element={<PaymentHistory />} />
      </Routes>
    </Router>
  );
}

export default App;

