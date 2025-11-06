// frontend/src/pages/EmployeeLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function EmployeeLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/employee/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setMessage('Login successful');
      navigate('/employee');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 420, margin: 'auto' }}>
      <h2>Employee Login</h2>
      <form onSubmit={submit}>
        <div>
          <label>Username</label><br/>
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Password</label><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Login</button>
        </div>
      </form>
      <p>{message}</p>
    </div>
  );
}
