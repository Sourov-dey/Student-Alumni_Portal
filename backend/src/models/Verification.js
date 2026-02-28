import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    method: {
      type: String,
      default: "id-card",
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    idDoc: {
      url: { type: String, required: true },
      mime: { type: String },
      originalName: { type: String },
    },
    emailUsed: {
      type: String,
      trim: true,
      lowercase: true,
    },
    note: {
      type: String,
      maxlength: 1000,
    },
    reviewNote: {
      type: String,
      maxlength: 1000,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    // --- AI Verification Fields ---
    aiResult: {
      isValid: { type: Boolean },
      confidence: { type: Number, min: 0, max: 100 },
      reason: { type: String, maxlength: 5000 },
      analyzedAt: { type: Date },
    },
    reviewedByAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

verificationSchema.index({ status: 1, submittedAt: -1 });

export default mongoose.model("Verification", verificationSchema);
