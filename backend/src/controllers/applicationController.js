import mongoose from 'mongoose';
import Application from "../models/application.js";
import Job from "../models/job.js";
import path from 'path';

/** POST /api/applications -> student applies (multipart) */
export const applyToJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter, contactNumber } = req.body;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    if (!contactNumber || !String(contactNumber).trim()) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    const job = await Job.findById(jobId);
    if (!job || job.isActive === false) {
      return res.status(400).json({ message: "Invalid or inactive job" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Build resume URL from uploaded file if present
    let resumeUrl = null;
    if (req.file) {
      // served via server.js: app.use("/uploads", express.static(...))
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }

    // fallback to user's stored resume
    if (!resumeUrl && req.user.resumeUrl) {
      resumeUrl = req.user.resumeUrl;
    }
    if (!resumeUrl) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const app = await Application.create({
      job: job._id,
      student: req.user._id,
      coverLetter: coverLetter || '',
      resumeUrl,
      contactNumber: String(contactNumber).trim(),
    });

    res.status(201).json(app);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "Already applied to this job" });
    }
    next(err);
  }
};

/** GET /api/applications/me -> student's applications */
export const getMyApplications = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: "Not authenticated" });

    const apps = await Application.find({ student: req.user._id })
      .populate("job", "title company location type department markedFilled")
      .sort({ createdAt: -1 });

    res.json({ total: apps.length, items: apps });
  } catch (err) {
    next(err);
  }
};

/** GET /api/applications/job/:jobId -> list applications for a job (alumni/admin) */
export const getApplicationsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = req.user;
    if (!user || !user._id) return res.status(401).json({ message: 'Not authenticated' });

    const isAlumni = user.role === 'alumni';
    const isAdmin = user.role === 'admin';

    if (!isAlumni && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const applications = await Application.find({ job: job._id })
      .populate('student', 'name email department currentYear skills technicalSkills nonTechnicalSkills projects certifications interests bio phone graduationYear avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ total: applications.length, items: applications });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/applications/:id/status -> alumni/admin updates status */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const app = await Application.findById(req.params.id).populate("job");
    if (!app) return res.status(404).json({ message: "Application not found" });

    if (!req.user || !req.user._id) return res.status(401).json({ message: "Not authenticated" });

    const isAlumni = req.user.role === 'alumni';
    const isAdmin = req.user.role === 'admin';

    if (!isAlumni && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status } = req.body;
    if (typeof status !== 'string' || !status.trim()) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    app.status = status;
    await app.save();

    res.json(app);
  } catch (err) {
    next(err);
  }
};
