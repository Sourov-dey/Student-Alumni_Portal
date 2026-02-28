// src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const issueJWT = (user) => {
  const payload = { id: user._id.toString(), role: user.role };
  // 7-day token; adjust as needed
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const requireAuth = async (req, res, next) => {
  try {
    // 🔍 ADD DEBUG LOGGING
    console.log('\n🔐 === AUTH MIDDLEWARE ===');
    console.log('Headers:', req.headers);
    console.log('Authorization:', req.headers.authorization);

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    console.log('Token extracted:', token ? '✅ Present' : '❌ Missing');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);

    const user = await User.findById(decoded.id || decoded.userId).select("-__v");

    if (!user) {
      console.log('❌ User not found for ID:', decoded.id || decoded.userId);
      return res.status(401).json({ message: "Invalid user" });
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/**
 * Role-based access control middleware.
 * Usage: requireRole('alumni') or requireRole('alumni', 'admin')
 * Must be used AFTER requireAuth.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};
