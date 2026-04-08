// backend/src/models/Connection.js
import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate connection requests (one pending/accepted per pair)
connectionSchema.index({ from: 1, to: 1 }, { unique: true });

// Efficient lookup for pending requests for an alumni
connectionSchema.index({ to: 1, status: 1 });

// Efficient lookup for accepted connections
connectionSchema.index({ from: 1, status: 1 });

export default mongoose.model("Connection", connectionSchema);
