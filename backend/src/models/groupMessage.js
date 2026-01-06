// backend/src/models/GroupMessage.js
import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    // Message type for system messages
    messageType: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
    // System message content (e.g., "User X joined the group")
    systemMessage: {
      type: String,
    },
    // Read receipts - array of user IDs who have read this message
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
groupMessageSchema.index({ group: 1, createdAt: -1 });
groupMessageSchema.index({ sender: 1 });

export default mongoose.model("GroupMessage", groupMessageSchema);
