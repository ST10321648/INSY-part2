// Import express
const express = require('express');

// Create the app
const app = express();

// Choose a port
const PORT = 5000;

// Basic test route
app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
