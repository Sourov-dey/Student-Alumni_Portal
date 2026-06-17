// backend/src/controllers/userController.js - WITH ENHANCED DEBUG LOGGING

import User from '../models/User.js';

/**
 * Get users - excludes current user (for chat search)
 */
export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user?._id || req.user?.id;

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n' + '='.repeat(80));
      console.log('🔥 GET USERS FOR CHAT');
      console.log('  - Current User ID:', currentUserId);
    }

    // Build query - EXCLUDE current user
    const query = currentUserId ? { _id: { $ne: currentUserId } } : {};

    // Fetch users excluding current user
    const users = await User.find(query)
      .select('name email avatarUrl role createdAt')
      .sort({ name: 1 })
      .lean();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`  - Users found (excluding current user): ${users.length}`);
    }

    res.status(200).json(users);

  } catch (error) {
    console.error('❌ GET USERS ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/**
 * Get all users including current user (for groups)
 */
export const getAllUsersForGroups = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔥 GET ALL USERS FOR GROUPS');
    }

    // Get ALL users including current user
    const users = await User.find({})
      .select('name email avatarUrl role createdAt')
      .sort({ name: 1 })
      .lean();

    res.status(200).json(users);

  } catch (error) {
    console.error('❌ Get All Users Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user?._id || req.user?.id;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Escape regex special chars to prevent ReDoS
    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Search by name or email (case-insensitive) - EXCLUDE current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: escapedQ, $options: 'i' } },
        { email: { $regex: escapedQ, $options: 'i' } }
      ]
    })
      .select('name email avatarUrl role createdAt')
      .limit(20)
      .lean();

    res.status(200).json(users);

  } catch (error) {
    console.error('❌ Search Users Error:', error.message);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

/**
 * Get user by ID
 * If requester is a student viewing an alumni, check connection status.
 * Unconnected → limited profile. Connected or admin → full profile.
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('name email avatarUrl role createdAt department graduationYear bio skills technicalSkills nonTechnicalSkills projects certifications interests gender dateOfBirth phone location verified')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If requester is a student and target is an alumni, check connection
    if (req.user.role === 'student' && user.role === 'alumni' && req.user._id.toString() !== id) {
      const Connection = (await import('../models/Connection.js')).default;
      const connection = await Connection.findOne({
        $or: [
          { from: req.user._id, to: id, status: 'accepted' },
          { from: id, to: req.user._id, status: 'accepted' },
        ],
      });

      if (!connection) {
        // Return limited profile
        return res.status(200).json({
          _id: user._id,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          department: user.department,
          graduationYear: user.graduationYear,
          location: user.location ? { city: user.location.city, country: user.location.country } : undefined,
          verified: user.verified,
          _limited: true, // flag for frontend
        });
      }
    }

    res.status(200).json(user);

  } catch (error) {
    console.error('❌ Get User By ID Error:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/** PATCH /api/users/:id */
export const updateUserById = async (req, res, next) => {
  try {
    // Auth check: only the user themselves or an admin can update the profile
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Field whitelist — prevent privilege escalation via mass-assignment
    const ALLOWED_FIELDS = [
      'name', 'bio', 'gender', 'dateOfBirth', 'phone', 'department',
      'graduationYear', 'currentCompany', 'position', 'currentYear',
      'skills', 'technicalSkills', 'nonTechnicalSkills', 'projects',
      'certifications', 'interests', 'location', 'profileComplete', 'avatarUrl',
    ];
    const sanitizedBody = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sanitizedBody[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.params.id, sanitizedBody, {
      new: true,
      runValidators: true,
    }).select("-password -__v");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/** POST /api/users/:id/avatar (field: avatar) */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Avatar file missing" });
    const url = `/${req.file.path.replace(/\\/g, "/")}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatarUrl: url },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Avatar uploaded", avatarUrl: url, user });
  } catch (err) {
    next(err);
  }
};

/** POST /api/users/:id/resume (field: resume, PDF only) */
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Resume file missing (PDF)" });
    const url = `/${req.file.path.replace(/\\/g, "/")}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { resumeUrl: url },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Resume uploaded", resumeUrl: url, user });
  } catch (err) {
    next(err);
  }
};

// List users with optional role filter (paginated)
export const listUsers = async (req, res, next) => {
  try {
    const role = req.query.role;
    const filter = {};
    if (role) filter.role = role;

    const items = await User.find(filter)
      .select('name email department role avatarUrl createdAt')
      .limit(200);

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all alumni who have shared their location
 */
export const getAlumniLocations = async (req, res) => {
  try {
    const alumni = await User.find({
      role: 'alumni',
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true },
    })
      .select('name avatarUrl department graduationYear location email phone bio skills')
      .lean();

    res.status(200).json(alumni);
  } catch (error) {
    console.error('❌ Get Alumni Locations Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch alumni locations' });
  }
};