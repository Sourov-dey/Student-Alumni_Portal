// src/models/VerificationCode.js
import mongoose from 'mongoose';

const VerificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true }, // hashed verification code
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 }, // for brute-force protection
});

VerificationCodeSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('VerificationCode', VerificationCodeSchema);
