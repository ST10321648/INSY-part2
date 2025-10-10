import "dotenv/config";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import app from "./app.js";

const PORT = parseInt(process.env.PORT || "5000", 10);

// In tests, never start a real listener
if (process.env.NODE_ENV === "test") {
  // Exporting app is enough for Supertest
  console.log("Test mode: server not listening.");
} else {
  const keyPath = process.env.TLS_KEY;
  const certPath = process.env.TLS_CERT;

  if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const key = fs.readFileSync(path.resolve(keyPath));
    const cert = fs.readFileSync(path.resolve(certPath));
    https.createServer({ key, cert }, app).listen(PORT, () => {
      console.log(`HTTPS API listening on https://localhost:${PORT}`);
    });
  } else {
    console.warn("TLS certs not found – falling back to HTTP (dev only). Generate mkcerts to enable HTTPS.");
    http.createServer(app).listen(PORT, () => {
      console.log(`HTTP API listening on http://localhost:${PORT}`);
    });
  }
}
