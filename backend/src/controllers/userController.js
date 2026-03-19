// backend/src/controllers/userController.js - WITH ENHANCED DEBUG LOGGING

import User from '../models/User.js';

/**
 * Get users - excludes current user (for chat search)
 */
export const getUsers = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔥 GET USERS FOR CHAT - DETAILED DEBUG');
    console.log('='.repeat(80));

    const currentUserId = req.user?._id || req.user?.id;

    console.log('📋 Request Details:');
    console.log('  - Current User ID:', currentUserId);
    console.log('  - Current User Name:', req.user?.name);
    console.log('  - Current User Email:', req.user?.email);
    console.log('  - User Object:', JSON.stringify(req.user, null, 2));

    // First, get TOTAL count of users in database
    const totalUsers = await User.countDocuments();
    console.log('\n📊 Database Stats:');
    console.log('  - Total users in database:', totalUsers);

    // Get ALL users to see what we have
    const allUsers = await User.find({})
      .select('name email avatarUrl role createdAt')
      .lean();

    console.log('\n👥 ALL Users in Database:');
    allUsers.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.name} (${u.email}) [ID: ${u._id}]`);
    });

    // Build query - EXCLUDE current user
    let query = {};
    if (currentUserId) {
      query = { _id: { $ne: currentUserId } };
      console.log('\n🔍 Query:', JSON.stringify(query));
    } else {
      console.log('\n⚠️  WARNING: No current user ID found!');
    }

    // Fetch users excluding current user
    const users = await User.find(query)
      .select('name email avatarUrl role createdAt')
      .sort({ name: 1 })
      .lean();

    console.log('\n✅ Query Results:');
    console.log('  - Users found (excluding current user):', users.length);

    if (users.length > 0) {
      console.log('\n👥 Users Being Returned:');
      users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.name} (${u.email}) [ID: ${u._id}]`);
      });
    } else {
      console.log('\n❌ NO USERS FOUND!');
      console.log('This means either:');
      console.log('  1. Only 1 user exists in database (the current user)');
      console.log('  2. Database is empty');
      console.log('  3. Query is filtering out all users');
    }

    console.log('\n📤 Sending Response:', users.length, 'users');
    console.log('='.repeat(80) + '\n');

    res.status(200).json(users);

  } catch (error) {
    console.error('\n❌ GET USERS ERROR:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('='.repeat(80) + '\n');

    res.status(500).json({
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get all users including current user (for groups)
 */
export const getAllUsersForGroups = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔥 GET ALL USERS FOR GROUPS');
    console.log('='.repeat(80));

    const currentUserId = req.user?._id || req.user?.id;
    const currentUserName = req.user?.name;

    console.log('Current User:', currentUserName, '(ID:', currentUserId + ')');

    // Get ALL users including current user
    const users = await User.find({})
      .select('name email avatarUrl role createdAt')
      .sort({ name: 1 })
      .lean();

    console.log(`✅ Found ${users.length} total users`);

    if (users.length > 0) {
      console.log('👥 All users:');
      users.forEach((u, i) => {
        const isCurrent = u._id.toString() === currentUserId?.toString();
        console.log(`  ${i + 1}. ${u.name} (${u.email}) ${isCurrent ? '← CURRENT USER' : ''}`);
      });
    } else {
      console.log('⚠️  No users found in database!');
    }

    console.log('='.repeat(80) + '\n');

    res.status(200).json(users);

  } catch (error) {
    console.error('❌ Get All Users Error:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: error.message
    });
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

    console.log('🔍 Search Users:', q);

    // Search by name or email (case-insensitive) - EXCLUDE current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email avatarUrl role createdAt')
      .limit(20)
      .lean();

    console.log(`✅ Found ${users.length} users matching "${q}"`);

    res.status(200).json(users);

  } catch (error) {
    console.error('❌ Search Users Error:', error);
    res.status(500).json({
      message: 'Failed to search users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('name email avatarUrl role createdAt department graduationYear bio skills gender dateOfBirth phone location verified')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
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
    console.error('❌ Get Alumni Locations Error:', error);
    res.status(500).json({
      message: 'Failed to fetch alumni locations',
      error: error.message,
    });
  }
};