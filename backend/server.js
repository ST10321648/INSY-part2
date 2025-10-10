// backend/server.js
import fs from "fs";
import path from "path";
import https from "https";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { applySecurity, requireHTTPS } from "./security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Parse JSON & allow CORS
app.use(express.json());
app.use(cors());

// For HTTPS behind proxies (Azure/Netlify)
app.set("trust proxy", 1);

// Security headers + rate limiting
applySecurity(app);

// Redirect HTTP → HTTPS
app.use(requireHTTPS);

// Test route
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ---- Server start ----
if (process.env.NODE_ENV !== "production") {
  // Local HTTPS using mkcert certs
  const key = fs.readFileSync(path.join(__dirname, "localhost-key.pem"));
  const cert = fs.readFileSync(path.join(__dirname, "localhost.pem"));

  https.createServer({ key, cert }, app).listen(8443, () => {
    console.log("✅ Dev HTTPS API running at https://localhost:8443");
  });
} else {
  // Production (Azure) uses platform HTTPS
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log('✅ API listening on port ${port}');
  });
}