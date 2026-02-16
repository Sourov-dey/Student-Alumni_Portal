// src/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    type: {
      type: String,
      enum: ["message", "chat_request", "chat_accept", "system", "verification"],
      required: true,
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { conversationId, messageId }
    message: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// helpful index for unread badge queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
