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
    if (!token) return res.status(401).json({ message: "Missing Bearer token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(401).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
