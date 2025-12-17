import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: 'text' },
    company: { type: String, required: true, index: true },
    location: { type: String, default: 'Remote', index: true },
    department: { type: String, index: true },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'],
      default: 'Full-time'
    },
    description: { type:
       String, required: true },
    requirements: { type: [String], default: [] },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    markedFilled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// text search across title, description, and company
jobSchema.index({ title: 'text', description: 'text', company: 'text' });

export default mongoose.model('Job', jobSchema);
