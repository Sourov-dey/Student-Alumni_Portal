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
import connectionRoutes from "./src/routes/connectionRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Frontend URL(s)
const ALLOWED_ORIGINS = [
  "https://student-alumni-portal-3.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

// ---------- Database ----------
if (process.env.NODE_ENV !== "test") {
  await connectDB();
}

// ---------- Parsers ----------
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ---------- CORS ----------
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight

// ---------- Static ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Security ----------
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// ---------- Logging ----------
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ---------- Rate Limiter ----------
app.use("/api", apiLimiter);

// ---------- HTTP Server ----------
const httpServer = createServer(app);

// ---------- Socket.IO ----------
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const userIdToSocketIdMap = {};

export function getReceiverSocketId(receiverId) {
  return userIdToSocketIdMap[receiverId] || null;
}

export function getOnlineUsers() {
  return Object.keys(userIdToSocketIdMap);
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (!userId || userId === "undefined" || userId === "null") {
    console.log("❌ Invalid userId, disconnecting socket:", socket.id);
    socket.disconnect();
    return;
  }

  userIdToSocketIdMap[userId] = socket.id;

  console.log(`🔐 User ${userId} mapped to socket ${socket.id}`);
  console.log("👥 Online users:", getOnlineUsers().length);

  io.emit("getOnlineUsers", getOnlineUsers());

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    const disconnectedUserId = Object.keys(userIdToSocketIdMap).find(
      (uid) => userIdToSocketIdMap[uid] === socket.id
    );

    if (disconnectedUserId) {
      delete userIdToSocketIdMap[disconnectedUserId];

      console.log(`👋 User ${disconnectedUserId} removed`);
      console.log("👥 Online users:", getOnlineUsers().length);

      io.emit("getOnlineUsers", getOnlineUsers());
    }
  });

  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

export { io, app, httpServer };

console.log("✅ Socket.IO initialized");

// ---------- API ----------
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "au-job-portal-api",
    time: new Date().toISOString(),
  });
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/connections", connectionRoutes);

console.log("✅ All API routes mounted");

// ---------- Errors ----------
app.use(notFound);
app.use(errorHandler);

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`🚀 API running on PORT ${PORT}`);
  });
}