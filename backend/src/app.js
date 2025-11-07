import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import csurf from "csurf";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import { employeeLoginRules } from "./validation.js"; // we’ll add this in a second
// ...

import { applySecurity, authRateLimiter, paymentsRateLimiter, signAccessToken, signRefreshToken, verifyAccess } from "./security.js";
import { registerRules, loginRules, paymentRules } from "./validation.js";
import { User, RefreshToken, Payment, Employee } from "./db.js";


export const app = express();

// --- Core middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined"));

const allowed = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow server-to-server / curl
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true
}));

applySecurity(app);

/// before
 // const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: "strict", secure: true } });

 // after
 const isTest = process.env.NODE_ENV === "test";
 const csrfProtection = csurf({
   cookie: { httpOnly: true, sameSite: "strict", secure: !isTest }
 });


// Helpers
const lockoutConfig = {
  maxAttempts: parseInt(process.env.LOCKOUT_MAX_ATTEMPTS || "5", 10),
  windowMs: parseInt(process.env.LOCKOUT_WINDOW_MINUTES || "15", 10) * 60 * 1000
};
function requireEmployee(req, res, next) {
  const user = req.user;
  if (!user || (user.type !== "employee" && user.role !== "employee" && user.role !== "admin")) {
    return res.status(403).json({ error: "Employee access only" });
  }
  next();
}


function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return null;
}

// Health
app.get("/", (_req, res) => res.send("Payments backend is running."));

// CSRF token fetch
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ---- Auth ----
app.post("/api/auth/register", authRateLimiter, csrfProtection, registerRules, async (req, res) => {
  if (handleValidation(req, res)) return;
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await User.create({
      email,
      password_hash,
      created_at: new Date(),
      failed_logins: 0,
      lockout_until: null
    });

    return res.status(201).json({ message: "Registered" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "DB error" });
  }
});


app.post("/api/auth/login", authRateLimiter, csrfProtection, loginRules, async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const now = Date.now();

  if (user.lockout_until && user.lockout_until.getTime() > now) {
    return res.status(423).json({ error: "Account locked. Try later." });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const attempts = (user.failed_logins || 0) + 1;
    let lockout_until = null;

    if (attempts >= lockoutConfig.maxAttempts) {
      lockout_until = new Date(now + lockoutConfig.windowMs);
    }

    user.failed_logins = attempts;
    user.lockout_until = lockout_until;
    await user.save();

    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Reset failed logins on success
  user.failed_logins = 0;
  user.lockout_until = null;
  await user.save();

  const uid = user._id.toString();

  const accessToken = signAccessToken({ uid, email, type: "customer", role: "customer" });
  const refreshToken = signRefreshToken({ uid, email, type: "customer", role: "customer" });


  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000)
  });

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/api/auth/refresh"
    })
    .json({ accessToken });
});

app.post("/api/employee/auth/login", authRateLimiter, csrfProtection, employeeLoginRules, async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email, password } = req.body;
  const emp = await Employee.findOne({ email });

  if (!emp) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, emp.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const uid = emp._id.toString();
  const accessToken = signAccessToken({
    uid,
    email: emp.email,
    type: "employee",
    role: emp.role
  });



  // NOTE: no refresh cookie for employees – shorter sessions are safer
  res.json({ accessToken });
});


app.post("/api/auth/refresh", authRateLimiter, csrfProtection, async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "Missing refresh" });

  const row = await RefreshToken.findOne({ token }).lean();
  if (!row || row.expires_at.getTime() < Date.now()) {
    return res.status(401).json({ error: "Expired refresh" });
  }

  // Decode and mint new access token (we trust the stored refresh)
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
  const accessToken = signAccessToken({ uid: payload.uid, email: payload.email });
  res.json({ accessToken });
});


app.post("/api/auth/logout", csrfProtection, async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await RefreshToken.deleteOne({ token });
  }
  res
    .clearCookie("refreshToken", { path: "/api/auth/refresh" })
    .json({ message: "Logged out" });
});

app.post("/api/employee/auth/logout", csrfProtection, (req, res) => {
  // Frontend will simply discard the employee access token
  res.json({ message: "Employee logged out" });
});



// ---- Payments ----
app.get("/api/payments", verifyAccess, paymentsRateLimiter, async (req, res) => {
  const userId = req.user.uid;

  const rows = await Payment.find({ user: userId })
    .sort({ created_at: -1 })
    .lean();

  res.json(rows.map(r => ({
    id: r._id.toString(),
    amount: (r.amount_cents / 100).toFixed(2),
    currency: r.currency,
    recipient: r.recipient,
    provider: r.provider,
    account_number: r.account_number.replace(/\d(?=\d{4})/g, "•"), // mask except last 4
    swift_code: r.swift_code,
    createdAt: r.created_at
  })));
});


app.post("/api/payments", verifyAccess, paymentsRateLimiter, csrfProtection, paymentRules, async (req, res) => {
  if (handleValidation(req, res)) return;

  const { amount, currency, recipient, provider, account_number, swift_code } = req.body;
  const amount_cents = Math.round(parseFloat(amount) * 100);

  await Payment.create({
    user: req.user.uid,
    amount_cents,
    currency,
    recipient,
    provider,
    account_number,
    swift_code,
    created_at: new Date()
  });

  res.status(201).json({ message: "Payment recorded" });
});

app.get("/api/employee/payments", verifyAccess, requireEmployee, async (req, res) => {
  const payments = await Payment.find({})
    .populate("user", "email")
    .populate("verified_by", "email name")
    .sort({ created_at: -1 })
    .lean();

  res.json(
    payments.map(p => ({
      id: p._id.toString(),
      customerEmail: p.user?.email || "unknown",
      amount: (p.amount_cents / 100).toFixed(2),
      currency: p.currency,
      recipient: p.recipient,
      provider: p.provider,
      account_number: p.account_number, // employee can see full details
      swift_code: p.swift_code,
      createdAt: p.created_at,
      verified: p.verified,
      verifiedBy: p.verified_by ? p.verified_by.email : null,
      verifiedAt: p.verified_at,
      submittedToSwift: p.submitted_to_swift,
      submittedAt: p.submitted_at
    }))
  );
});

app.get("/api/employee/payments/pending", verifyAccess, requireEmployee, async (req, res) => {
  const payments = await Payment.find({ verified: false })
    .populate("user", "email")
    .sort({ created_at: 1 })
    .lean();

  res.json(
    payments.map(p => ({
      id: p._id.toString(),
      customerEmail: p.user?.email || "unknown",
      amount: (p.amount_cents / 100).toFixed(2),
      currency: p.currency,
      recipient: p.recipient,
      provider: p.provider,
      account_number: p.account_number,
      swift_code: p.swift_code,
      createdAt: p.created_at
    }))
  );
});

app.post("/api/employee/payments/:id/verify", verifyAccess, requireEmployee, csrfProtection, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid payment id" });
  }

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (payment.verified) {
    return res.status(400).json({ error: "Payment already verified" });
  }

  payment.verified = true;
  payment.verified_by = req.user.uid;
  payment.verified_at = new Date();

  await payment.save();

  res.json({ message: "Payment verified" });
});

app.post("/api/employee/payments/:id/submit", verifyAccess, requireEmployee, csrfProtection, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid payment id" });
  }

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (!payment.verified) {
    return res.status(400).json({ error: "Payment must be verified first" });
  }

  if (payment.submitted_to_swift) {
    return res.status(400).json({ error: "Payment already submitted" });
  }

  payment.submitted_to_swift = true;
  payment.submitted_at = new Date();

  await payment.save();

  res.json({ message: "Payment submitted to SWIFT (simulated)" });
});




// 404 + error
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

export default app;
