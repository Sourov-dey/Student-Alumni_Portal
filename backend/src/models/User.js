import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Common
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["student", "alumni", "admin"], default: "student" },
    avatarUrl: String,
    emailVerified: { type: Boolean, default: false },
    profileComplete: { type: Boolean, default: false },

    // Alumni
    graduationYear: Number,
    department: String,
    currentCompany: String,
    position: String,
    contactPhone: String,

    // Student
    currentYear: Number,
    skills: [String],
    resumeUrl: String,

    // Verification
    verified: { type: Boolean, default: false },
    verification: {
      status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      method: { type: String, enum: ['university_email', 'id_card', 'id_required'], default: 'id_required' },
      updatedAt: Date
    },
      password: {
    type: String,
    required: true, // Not required because Google users won't have it
    select: false    // Don't include in queries by default for security
  },
  },
  
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
