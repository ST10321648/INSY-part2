import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import csurf from "csurf";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import { getDb } from "./db.js";
import { applySecurity, authRateLimiter, paymentsRateLimiter, signAccessToken, signRefreshToken, verifyAccess } from "./security.js";
import { registerRules, loginRules, paymentRules } from "./validation.js";

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
  const db = await getDb();
  const { email, password } = req.body;

  const password_hash = await bcrypt.hash(password, 12);
  try {
    await db.run(`INSERT INTO users (email, password_hash, created_at) VALUES (?,?,?)`,
      email, password_hash, Date.now());
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Email already registered" });
    return res.status(500).json({ error: "DB error" });
  }
  res.status(201).json({ message: "Registered" });
});

app.post("/api/auth/login", authRateLimiter, csrfProtection, loginRules, async (req, res) => {
  if (handleValidation(req, res)) return;
  const db = await getDb();
  const { email, password } = req.body;
  const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const now = Date.now();
  if (user.lockout_until && user.lockout_until > now) {
    return res.status(423).json({ error: "Account locked. Try later." });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const attempts = (user.failed_logins || 0) + 1;
    let lockout_until = null;
    if (attempts >= lockoutConfig.maxAttempts) {
      lockout_until = now + lockoutConfig.windowMs;
    }
    await db.run(`UPDATE users SET failed_logins = ?, lockout_until = ? WHERE id = ?`,
      attempts, lockout_until, user.id);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await db.run(`UPDATE users SET failed_logins = 0, lockout_until = NULL WHERE id = ?`, user.id);

  const accessToken = signAccessToken({ uid: user.id, email });
  const refreshToken = signRefreshToken({ uid: user.id, email });
  await db.run(`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)`,
    user.id, refreshToken, Date.now() + 7 * 24 * 3600 * 1000);

  res
    .cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "strict", secure: true, path: "/api/auth/refresh" })
    .json({ accessToken });
});

app.post("/api/auth/refresh", authRateLimiter, csrfProtection, async (req, res) => {
  const db = await getDb();
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "Missing refresh" });

  // Verify against DB presence + expiry
  const row = await db.get(`SELECT * FROM refresh_tokens WHERE token = ?`, token);
  if (!row || row.expires_at < Date.now()) return res.status(401).json({ error: "Expired refresh" });

  // Decode and mint new access token (we trust the stored refresh)
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
  const accessToken = signAccessToken({ uid: payload.uid, email: payload.email });
  res.json({ accessToken });
});

app.post("/api/auth/logout", csrfProtection, async (req, res) => {
  const db = await getDb();
  const token = req.cookies.refreshToken;
  if (token) await db.run(`DELETE FROM refresh_tokens WHERE token = ?`, token);
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" }).json({ message: "Logged out" });
});

// ---- Payments ----
app.get("/api/payments", verifyAccess, paymentsRateLimiter, async (req, res) => {
  const db = await getDb();
  const rows = await db.all(
    `SELECT id, amount_cents, currency, recipient, provider, account_number, swift_code, created_at
     FROM payments WHERE user_id = ? ORDER BY id DESC`,
    req.user.uid
  );
  res.json(rows.map(r => ({
    id: r.id,
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
  const db = await getDb();
  const { amount, currency, recipient, provider, account_number, swift_code } = req.body;

  const amount_cents = Math.round(parseFloat(amount) * 100);
  await db.run(
    `INSERT INTO payments (user_id, amount_cents, currency, recipient, provider, account_number, swift_code, created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    req.user.uid, amount_cents, currency, recipient, provider, account_number, swift_code, Date.now()
  );
  res.status(201).json({ message: "Payment recorded" });
});

// 404 + error
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

export default app;
