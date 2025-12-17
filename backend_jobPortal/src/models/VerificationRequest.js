import mongoose from 'mongoose';

const VerificationRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emailUsed: { type: String, required: true },      // the non-university email they used
  fileUrl: { type: String, required: true },        // path to uploaded file
  note: { type: String },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('VerificationRequest', VerificationRequestSchema);
