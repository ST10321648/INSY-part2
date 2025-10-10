import React, { useEffect, useState } from "react";
import api from "../api/client";

const amountRegex = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const currencyRegex = /^[A-Z]{3}$/;
const recipientRegex = /^[A-Za-z ]{3,50}$/;
const accountNumberRegex = /^[0-9]{8,20}$/;
const swiftRegex = /^[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/;

export default function Payments() {
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    recipient: "",
    provider: "SWIFT",
    account_number: "",
    swift_code: "",
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    const { data } = await api.get("/api/payments");
    setHistory(data);
  };

  useEffect(() => { loadHistory(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!amountRegex.test(form.amount)) return "Amount must be a number with up to 2 decimals.";
    if (!currencyRegex.test(form.currency)) return "Currency must be 3 uppercase letters.";
    if (!recipientRegex.test(form.recipient)) return "Recipient 3–50 letters/spaces.";
    if (form.provider !== "SWIFT") return "Provider must be SWIFT.";
    if (!accountNumberRegex.test(form.account_number)) return "Account number 8–20 digits.";
    if (!swiftRegex.test(form.swift_code)) return "SWIFT/BIC must be 8 or 11 alphanumerics.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    const msg = validate();
    if (msg) { setErr(msg); return; }
    try {
      await api.post("/api/payments", form);
      setOk("Payment recorded.");
      setForm({ ...form, amount: "", recipient: "", account_number: "", swift_code: "" });
      loadHistory();
    } catch (e) {
      setErr(e?.response?.data?.error || "Payment failed");
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "32px auto" }}>
      <h2>New Payment</h2>
      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Amount</label>
            <input name="amount" value={form.amount} onChange={onChange} placeholder="12.34" />
          </div>
          <div>
            <label>Currency</label>
            <input name="currency" value={form.currency} onChange={onChange} placeholder="USD" />
          </div>
          <div>
            <label>Recipient</label>
            <input name="recipient" value={form.recipient} onChange={onChange} placeholder="Alice Smith" />
          </div>
          <div>
            <label>Provider</label>
            <select name="provider" value={form.provider} onChange={onChange}>
              <option value="SWIFT">SWIFT</option>
            </select>
          </div>
          <div>
            <label>Account number</label>
            <input name="account_number" value={form.account_number} onChange={onChange} placeholder="12345678" />
          </div>
          <div>
            <label>SWIFT / BIC</label>
            <input name="swift_code" value={form.swift_code} onChange={onChange} placeholder="ABCDEF12 or ABCDEF12XYZ" />
          </div>
        </div>
        {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
        {ok && <div style={{ color: "green", marginTop: 8 }}>{ok}</div>}
        <button style={{ marginTop: 12 }} type="submit">Pay Now</button>
      </form>

      <h3 style={{ marginTop: 36 }}>History</h3>
      <div>
        {history.length === 0 && <div>No payments yet.</div>}
        {history.map((p) => (
          <div key={p.id} style={{ padding: 8, borderBottom: "1px solid #3333" }}>
            <div><strong>{p.amount} {p.currency}</strong> → {p.recipient}</div>
            <div>Provider: {p.provider} • Account: {p.account_number} • SWIFT: {p.swift_code}</div>
            <small>{new Date(p.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
