// backend/security.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export function applySecurity(app) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "img-src": ["'self'", "data:"],
          "connect-src": ["'self'"],
          "frame-ancestors": ["'none'"],
          "upgrade-insecure-requests": []
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300
    })
  );
}

export function requireHTTPS(req, res, next) {
  if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
  return res.redirect(301, "https://" + req.headers.host + req.originalUrl);
}