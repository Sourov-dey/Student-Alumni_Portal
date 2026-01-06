// backend/src/models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    avatar: {
      type: String,
      default: null,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Group settings
    isPublic: {
      type: Boolean,
      default: false, // Private by default
    },
    allowMemberInvite: {
      type: Boolean,
      default: false, // Only admin can add members by default
    },
    // For filtering/categorization
    category: {
      type: String,
      enum: ["general", "department", "batch", "club", "project", "other"],
      default: "general",
    },
    // Metadata
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
groupSchema.index({ admin: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ isPublic: 1 });
groupSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Group", groupSchema);
