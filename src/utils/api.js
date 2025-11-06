// src/utils/api.js
const API_BASE_URL = "http://localhost:5000/api"; // update when backend is ready

// Employee login
export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/employee/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json(); // should contain { token, employeeInfo }
    return data;
  } catch (err) {
    throw err;
  }
}

// Get transactions
export async function getTransactions(token) {
  const response = await fetch(`${API_BASE_URL}/employee/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch transactions");
  return response.json();
}

// Verify a transaction
export async function verifyTransaction(id, token) {
  const response = await fetch(`${API_BASE_URL}/employee/transactions/${id}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to verify transaction");
  return response.json();
}

// Submit verified transactions to SWIFT
export async function submitSWIFT(ids, token) {
  const response = await fetch(`${API_BASE_URL}/employee/submit-swift`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error("Failed to submit to SWIFT");
  return response.json();
}

