// src/controllers/adminController.js

import User from "../models/User.js";
import Job from "../models/job.js";
import Application from "../models/application.js";
import Message from "../models/Message.js";
import GroupMessage from "../models/groupMessage.js";
import Group from "../models/group.js";
import Verification from "../models/Verification.js";
import Notification from "../models/Notification.js";
import Otp from "../models/Otp.js";

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
 * Toggle suspend/unsuspend a user (prevent login/posting when suspended)
 * Optionally accepts { reason: "..." } in body
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot suspend an admin" });
    }

    // Toggle: if already suspended → unsuspend, else → suspend
    const newSuspended = !user.suspended;

    user.suspended = newSuspended;
    if (newSuspended) {
      user.suspendedAt = new Date();
      user.suspendedReason = req.body.reason || "";
    } else {
      user.suspendedAt = undefined;
      user.suspendedReason = undefined;
    }
    await user.save();

    // Create notification for the user
    await Notification.create({
      user: id,
      type: "system",
      message: newSuspended
        ? "Your account has been suspended by an administrator."
        : "Your account has been reactivated. You can now log in and use the portal.",
      payload: { action: newSuspended ? "suspended" : "unsuspended" },
    });

    console.log(`${newSuspended ? "⛔" : "✅"} User ${id} ${newSuspended ? "suspended" : "unsuspended"} by admin ${req.user._id}`);

    res.json({
      message: newSuspended ? "User suspended" : "User unsuspended",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user and clean up all related data
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete an admin account" });
    }

    console.log(`🗑️ Deleting user ${id} (${user.email}) and all related data...`);

    // Cascade delete all related data
    const cleanup = await Promise.allSettled([
      // Delete jobs posted by this user
      Job.deleteMany({ postedBy: id }),
      // Delete applications by this user
      Application.deleteMany({ student: id }),
      // Delete DM messages sent or received by this user
      Message.deleteMany({ $or: [{ senderId: id }, { receiverId: id }] }),
      // Delete group messages sent by this user
      GroupMessage.deleteMany({ sender: id }),
      // Remove user from all group member lists
      Group.updateMany({ members: id }, { $pull: { members: id } }),
      // Delete verifications
      Verification.deleteMany({ user: id }),
      // Delete notifications
      Notification.deleteMany({ user: id }),
      // Delete OTPs
      Otp.deleteMany({ email: user.email }),
    ]);

    // Log any cleanup failures (non-critical)
    cleanup.forEach((result, i) => {
      if (result.status === "rejected") {
        console.warn(`  ⚠ Cleanup step ${i} failed:`, result.reason?.message);
      }
    });

    // Finally delete the user
    await User.findByIdAndDelete(id);

    console.log(`✅ User ${id} and related data deleted successfully`);

    res.json({ message: "User and all related data deleted successfully" });
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
