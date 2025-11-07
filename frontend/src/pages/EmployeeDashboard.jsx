// frontend/src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useEmployeeAuth } from "../context/EmployeeAuthProvider";

export default function EmployeeDashboard() {
  const { logoutEmployee } = useEmployeeAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    setError("");
    setLoading(true);
    try {
      // You can switch to /api/employee/payments/pending if you want only unverified
      const { data } = await api.get("/api/employee/payments");
      setPayments(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const doVerify = async (id) => {
    setError("");
    try {
      await api.post(`/api/employee/payments/${id}/verify`);
      await loadPayments();
    } catch (e) {
      console.error(e);
      setError("Failed to verify payment.");
    }
  };

  const doSubmit = async (id) => {
    setError("");
    try {
      await api.post(`/api/employee/payments/${id}/submit`);
      await loadPayments();
    } catch (e) {
      console.error(e);
      setError("Failed to submit payment to SWIFT.");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Employee Payment Review</h2>
        <button type="button" onClick={logoutEmployee}>
          Logout (Employee)
        </button>
      </div>

      {loading && <div>Loading payments…</div>}
      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      {!loading && payments.length === 0 && <div>No payments found.</div>}

      {!loading && payments.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Customer</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Amount</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Details</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Status</th>
              <th style={{ borderBottom: "1px solid #ccc" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 8 }}>
                  {p.customerEmail || "unknown"}
                  <br />
                  <small>{new Date(p.createdAt).toLocaleString()}</small>
                </td>
                <td style={{ padding: 8 }}>
                  <strong>
                    {p.amount} {p.currency}
                  </strong>
                </td>
                <td style={{ padding: 8 }}>
                  Recipient: {p.recipient}
                  <br />
                  Provider: {p.provider}
                  <br />
                  Account: {p.account_number}
                  <br />
                  SWIFT: {p.swift_code}
                </td>
                <td style={{ padding: 8 }}>
                  {p.verified ? (
                    <div>
                      ✅ Verified
                      {p.verifiedBy && <div>by {p.verifiedBy}</div>}
                      {p.verifiedAt && (
                        <div>
                          <small>{new Date(p.verifiedAt).toLocaleString()}</small>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>⏳ Not verified</div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    {p.submittedToSwift ? (
                      <div>
                        📤 Submitted
                        {p.submittedAt && (
                          <div>
                            <small>{new Date(p.submittedAt).toLocaleString()}</small>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>Not submitted</div>
                    )}
                  </div>
                </td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => doVerify(p.id)}
                      disabled={p.verified}
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => doSubmit(p.id)}
                      disabled={!p.verified || p.submittedToSwift}
                    >
                      Submit to SWIFT
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
