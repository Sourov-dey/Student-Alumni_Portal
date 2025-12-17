// src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// Global API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Specific limiter for requesting email codes
export const requestCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 code requests per 10 minutes
  message: "Too many code requests, please try again later.",
});
