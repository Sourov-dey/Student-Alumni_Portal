// src/controllers/jobController.js
import mongoose from 'mongoose';
import Job from '../models/job.js';
import { getPagination } from '../utils/pagination.js';
import { buildJobQuery, buildSort } from '../utils/query.js';
import { getApplicationStats } from '../services/applicationStats.js';

/**
 * GET /api/jobs
 * Public for now; query params supported (search, department, etc.)
 */
export const listJobs = async (req, res, next) => {
  try {
    const filter = buildJobQuery(req.query);
    const sort = buildSort(req.query);
    const { limit, skip, page } = getPagination(req.query);

    const [items, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(limit).select('-__v'),
      Job.countDocuments(filter),
    ]);

    // If user is alumni/admin, include application stats
    if (req.user && (req.user.role === 'alumni' || req.user.role === 'admin')) {
      const jobIds = items.map(job => job._id);
      const applicationStats = await getApplicationStats(jobIds);
      
      // Attach stats to each job
      items.forEach(job => {
        if (applicationStats[job._id.toString()]) {
          job = job.toObject();
          job.applicationStats = applicationStats[job._id.toString()];
        }
      });
    }

    res.json({
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/jobs
 * Create job. If req.user exists, set postedBy; otherwise anonymous.
 * Body: { title, company, location?, department?, type?, description, requirements?[] }
 */
export const createJob = async (req, res, next) => {
  try {
    const payload = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location || 'Remote',
      department: req.body.department,
      type: req.body.type || 'Full-time',
      description: req.body.description,
      requirements: Array.isArray(req.body.requirements) ? req.body.requirements : [],
      postedBy: req.user?._id ?? null,
      isActive: true,
      markedFilled: false,
    };

    const job = await Job.create(payload);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jobs/:id
 */
export const getJobById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid job id' });

    const job = await Job.findById(id).select('-__v');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Include application stats for job owner or admin
    if (req.user && (
      req.user.role === 'admin' || 
      (job.postedBy && job.postedBy.toString() === req.user._id.toString())
    )) {
      const applicationStats = await getApplicationStats(job._id);
      const jobObj = job.toObject();
      jobObj.applicationStats = applicationStats[job._id.toString()] || { totalApplications: 0, statusBreakdown: { submitted: 0, shortlisted: 0, rejected: 0, hired: 0 } };
      return res.json(jobObj);
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/jobs/:id
 * Update a job. Only the poster (postedBy) or admin may update.
 */
export const updateJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid job id' });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Authorization
    const user = req.user;
    if (user) {
      const isOwner = job.postedBy && job.postedBy.toString() === user._id.toString();
      const isAdmin = user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    } else {
      // If no user in request, deny update
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only allow certain fields to be updated
    const updates = {};
    const updatable = ['title', 'company', 'location', 'department', 'type', 'description', 'requirements', 'salaryRange', 'isActive'];
    updatable.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) updates[k] = req.body[k];
    });

    const updated = await Job.findByIdAndUpdate(id, updates, { new: true }).select('-__v');
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/jobs/:id
 * Only poster or admin
 */
export const deleteJob = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid job id' });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = req.user;
    if (user) {
      const isOwner = job.postedBy && job.postedBy.toString() === user._id.toString();
      const isAdmin = user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    } else {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await Job.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/jobs/:id/mark-filled
 * Mark job as filled (or unfilled if body.filled === false)
 * Only poster or admin
 */
export const markFilled = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid job id' });

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const user = req.user;
    if (user) {
      const isOwner = job.postedBy && job.postedBy.toString() === user._id.toString();
      const isAdmin = user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    } else {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Accept explicit boolean, otherwise default to true
    const { filled } = req.body;
    const mark = typeof filled === 'boolean' ? filled : true;

    job.markedFilled = mark;
    job.isActive = !mark;
    job.filledAt = mark ? new Date() : undefined;

    await job.save();

    res.json({ message: mark ? 'Job marked as filled' : 'Job unmarked as filled', job });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jobs/suggest?search=term
 * Returns a short list for typeahead
 */
export const suggestJobs = async (req, res, next) => {
  try {
    const term = (req.query.search || '').trim();
    if (!term) return res.json({ items: [] });

    const items = await Job.find(
      { $text: { $search: term } },
      { score: { $meta: 'textScore' }, title: 1, company: 1 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
};
