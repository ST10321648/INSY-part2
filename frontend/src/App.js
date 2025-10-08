import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Payment from './pages/Payment';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/payment">Payment</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </Router>
  );
}

export default App;
