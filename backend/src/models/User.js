// backend/models/User.js - FIXED USER MODEL

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // ✅ CRITICAL: Hide password by default in queries
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['student', 'alumni', 'admin'],
      default: 'student'
    },
    verified: {
      type: Boolean,
      default: false
    },
    avatarUrl: {
      type: String,
      default: '/avatar.png'
    },
    // Additional fields as needed
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    department: {
      type: String,
      trim: true
    },
    graduationYear: {
      type: Number
    },
    phone: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    skills: [{
      type: String,
      trim: true
    }],
    // ── Student portfolio fields ──
    technicalSkills: [{ type: String, trim: true }],
    nonTechnicalSkills: [{ type: String, trim: true }],
    projects: [{
      title: { type: String, trim: true, required: true },
      description: { type: String, trim: true },
      link: { type: String, trim: true },
    }],
    certifications: [{
      title: { type: String, trim: true, required: true },
      issuer: { type: String, trim: true },
      year: { type: Number },
    }],
    interests: [{ type: String, trim: true }],
    location: {
      city: { type: String, trim: true },
      country: { type: String, trim: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    suspended: {
      type: Boolean,
      default: false
    },
    suspendedAt: {
      type: Date
    },
    suspendedReason: {
      type: String,
      maxlength: 500
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpire: {
      type: Date
    }

  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// ========== INDEXES FOR PERFORMANCE ==========

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ========== INSTANCE METHODS ==========

// Method to compare passwords (can be used as alternative)
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.default.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatarUrl: this.avatarUrl,
    gender: this.gender,
    dateOfBirth: this.dateOfBirth,
    phone: this.phone,
    department: this.department,
    graduationYear: this.graduationYear,
    bio: this.bio,
    skills: this.skills,
    technicalSkills: this.technicalSkills,
    nonTechnicalSkills: this.nonTechnicalSkills,
    projects: this.projects,
    certifications: this.certifications,
    interests: this.interests,
    location: this.location,
    verified: this.verified,
    suspended: this.suspended,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ========== MIDDLEWARE ==========

// Pre-save hook to hash password (alternative to controller hashing)
// Only use this if you want automatic hashing on save
// Comment out if you're hashing in the controller
/*
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    this.password = await bcrypt.default.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
*/

// ========== EXPORT MODEL ==========
const User = mongoose.model('User', userSchema);

export default User;