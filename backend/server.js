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

import jobRoutes from "./src/routes/jobRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import applicationRoutes from "./src/routes/applicationRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import verificationRoutes from "./src/routes/verificationRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- Parsers (must come before routes) ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database
await connectDB();

// ---------- Security & CORS ----------
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiter for /api
app.use("/api", apiLimiter);

// ---------- Create HTTP Server for Socket.IO ----------
const httpServer = createServer(app);

// ---------- Socket.IO Setup ----------
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Socket.IO user tracking
const userIdToSocketIdMap = {};

export function getReceiverSocketId(receiverId) {
  return userIdToSocketIdMap[receiverId];
}

export function getOnlineUsers() {
  return Object.keys(userIdToSocketIdMap);
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (!userId || userId === "undefined" || userId === "null") {
    console.log("❌ Invalid userId, disconnecting");
    socket.disconnect();
    return;
  }

  userIdToSocketIdMap[userId] = socket.id;
  console.log(`📍 User ${userId} mapped to socket ${socket.id}`);
  console.log("Online users:", getOnlineUsers());

  io.emit("getOnlineUsers", getOnlineUsers());

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (userId && userIdToSocketIdMap[userId] === socket.id) {
      delete userIdToSocketIdMap[userId];
      console.log(`User ${userId} removed from online list`);
      console.log("Online users:", getOnlineUsers());
      io.emit("getOnlineUsers", getOnlineUsers());
    }
  });
});

// Export io for use in controllers
export { io };

// ---------- API routes ----------
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "au-job-portal-api",
    time: new Date().toISOString(),
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/messages", chatRoutes);


// 404 + error handler
app.use(notFound);
app.use(errorHandler);

// ---------- Boot server ----------
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`✅ API running on PORT:${PORT}`);
});
