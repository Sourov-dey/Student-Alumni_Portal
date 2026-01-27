
import rateLimit from "express-rate-limit";

const isDevelopment = process.env.NODE_ENV !== "production";

// ✅ Global API limiter - RELAXED for development
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 🔥 1000 in dev, 100 in prod
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip rate limiting in development (optional)
  skip: (req) => isDevelopment, // 🔥 COMPLETELY DISABLE in dev
});

// ✅ Specific limiter for auth endpoints - RELAXED for development
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDevelopment ? 100 : 5, // 🔥 100 in dev, 5 in prod
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment, // 🔥 COMPLETELY DISABLE in dev
});

// Specific limiter for requesting email codes
export const requestCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDevelopment ? 50 : 5, // 🔥 50 in dev, 5 in prod
  message: "Too many code requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment, // 🔥 COMPLETELY DISABLE in dev
});