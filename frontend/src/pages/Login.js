// frontend/src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();
  console.log("Logging in with:", username, password); // <- see what is sent
  try {
    const res = await axios.post('http://localhost:5000/api/login', {
      username,
      password
    });
    console.log("Response:", res.data);
    setMessage(res.data.message);
  } catch (err) {
    console.error(err.response?.data);
    setMessage(err.response?.data?.message || 'Login failed');
  }
};


  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
        />
        <br />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <br />
        <button type="submit">Login</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Login;

