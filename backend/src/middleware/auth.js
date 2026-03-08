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
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded.userId).select("-__v");

    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // Block suspended users from all API access
    if (user.suspended) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact an administrator.",
        suspended: true,
      });
    }

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
