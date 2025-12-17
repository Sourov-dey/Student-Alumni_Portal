// src/controllers/adminController.js

import User from "../models/User.js";
import Job from "../models/job.js";
import Application from "../models/Application.js";

/**
 * GET /api/admin/users
 * List all users with optional filters (role/status)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select("-password");
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/verify
 * Mark a user as verified
 */
export const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { verified: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User verified successfully", user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Suspend a user (prevent login/posting)
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { suspended: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User suspended", user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/jobs
 * Get all job postings
 */
export const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name email role")
      .lean();

    res.json(jobs);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/jobs/:id
 * Remove a job posting (spam/inappropriate)
 */
export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics
 * Returns basic portal statistics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const [users, jobs, applications] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);

    res.json({
      totalUsers: users,
      totalJobs: jobs,
      totalApplications: applications,
    });
  } catch (err) {
    next(err);
  }
};
