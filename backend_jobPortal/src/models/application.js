import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coverLetter: { type: String, maxlength: 5000 },
    resumeUrl: { type: String, required: true },
    contactNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["submitted", "shortlisted", "rejected", "hired"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// Prevent same student applying multiple times to same job
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
