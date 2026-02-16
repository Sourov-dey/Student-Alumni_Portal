import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/error.js";
import { apiLimiter } from "./src/middleware/ratelimiter.js";

// Import routes
import jobRoutes from "./src/routes/jobRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import applicationRoutes from "./src/routes/applicationRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

import chatRoutes from "./src/routes/chatRoutes.js";
import groupRoutes from "./src/routes/groupRoutes.js";
import verifyRoutes from "./src/routes/verifyRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- Database Connection FIRST ----------
await connectDB();
import User from './src/models/User.js';
// ---------- Parsers (MUST come before routes) ----------
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Security & CORS ----------
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiter for /api (apply BEFORE routes)
app.use("/api", apiLimiter);

// ---------- Create HTTP Server for Socket.IO ----------
const httpServer = createServer(app);

// ---------- Socket.IO Setup ----------
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO user tracking
const userIdToSocketIdMap = {};

export function getReceiverSocketId(receiverId) {
  const socketId = userIdToSocketIdMap[receiverId];
  return socketId || null; // Return socketId for given userId
}

export function getOnlineUsers() {
  return Object.keys(userIdToSocketIdMap); // Return array of online userIds
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (!userId || userId === "undefined" || userId === "null") {
    console.log("❌ Invalid userId, disconnecting socket:", socket.id);
    socket.disconnect();
    return;
  }

  // Map user ID to socket ID
  userIdToSocketIdMap[userId] = socket.id;
  console.log(`🔐 User ${userId} mapped to socket ${socket.id}`);
  console.log("👥 Online users:", getOnlineUsers().length);

  // Broadcast online users to everyone
  io.emit("getOnlineUsers", getOnlineUsers());

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    // Find and remove the user from the map
    const disconnectedUserId = Object.keys(userIdToSocketIdMap).find(
      (uid) => userIdToSocketIdMap[uid] === socket.id
    );

    if (disconnectedUserId) {
      delete userIdToSocketIdMap[disconnectedUserId];
      console.log(`👋 User ${disconnectedUserId} removed from online list`);
      console.log("👥 Online users:", getOnlineUsers().length);

      // Broadcast updated online users
      io.emit("getOnlineUsers", getOnlineUsers());
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

// Export io for use in controllers
export { io };

console.log("✅ Socket.IO initialized successfully");
// ---------- API routes (AFTER all middleware) ----------
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "au-job-portal-api",
    time: new Date().toISOString(),
  });
});

// ✅ Mount ALL routes - Make sure groupRoutes is here
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/notifications", notificationRoutes);
console.log("✅ All API routes mounted successfully");


// 404 + error handler
app.use(notFound);
app.use(errorHandler);

// ---------- Boot server ----------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ API running on PORT:${PORT}`);
});
