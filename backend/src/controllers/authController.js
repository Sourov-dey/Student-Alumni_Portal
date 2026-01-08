// backend/src/controllers/authController.js - COMPLETE WORKING VERSION
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ===== HELPER FUNCTIONS =====
export const isUniEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim().endsWith('@aus.ac.in');
};

// ===== SIGNUP FUNCTION =====
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 SIGNUP REQUEST RECEIVED');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Validation
    if (!name || !name.trim()) {
      console.log('❌ Name validation failed');
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      console.log('❌ Email validation failed');
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || password.length < 6) {
      console.log('❌ Password validation failed');
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      console.log('❌ Email already registered:', emailLower);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine verification status
    const isUniversityEmail = isUniEmail(emailLower);
    console.log('🎓 Is university email:', isUniversityEmail);

    // Create user
    console.log('👤 Creating user...');
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

    console.log('✅ User created successfully:', user.email);

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ Signup complete, sending response');
    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ SIGNUP ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    next(error);
  }
};

// ===== LOGIN FUNCTION =====
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 LOGIN REQUEST RECEIVED');
    console.log('Email:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Validation
    if (!email || !password) {
      console.log('❌ Email or password missing');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Find user (include password field)
    console.log('🔍 Looking up user...');
    const user = await User.findOne({ email: emailLower }).select('+password');
    if (!user) {
      console.log('❌ User not found:', emailLower);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.email);

    // Check if user has a password
    if (!user.password) {
      console.log('ℹ️ User has no password (Google account), setting password...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      user.password = passwordHash;
      await user.save();
      
      console.log('✅ Password set for user:', emailLower);
    } else {
      // Verify password
      console.log('🔐 Verifying password...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for:', emailLower);
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      console.log('✅ Password verified');
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

    console.log('✅ Login successful, sending response');
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ LOGIN ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    next(error);
  }
};

// Export all functions
export default {
  signup,
  loginUser,
  isUniEmail
};