
import User from '../models/User.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Helper functions
const genNumericCode = (len = 6) => {
  const digits = '0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += digits[Math.floor(Math.random() * 10)];
  return s;
};

export const isUniEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim().endsWith('@aus.ac.in');
};

// ✅ FIXED: Signup with Password
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine verification status
    const isUniversityEmail = isUniEmail(emailLower);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: passwordHash,
      role: role.toLowerCase(),
      verified: isUniversityEmail,
      verification: {
        status: isUniversityEmail ? 'verified' : 'pending',
        method: isUniversityEmail ? 'university_email' : 'id_required'
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};

// ✅ 101% FIXED: Login with Password - Allow Google users to set password
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Find user (include password field)
    const user = await User.findOne({ email: emailLower }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ CRITICAL FIX: Check if user has a password
    if (!user.password) {
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      user.password = passwordHash;
      await user.save();
      
      console.log(`✅ Password added for user ${emailLower}`);
    } else {
      // User has a password, verify it
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

