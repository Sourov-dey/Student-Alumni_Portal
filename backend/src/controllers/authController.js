import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendOtpEmail } from '../utils/emailService.js';

// Verify reCAPTCHA token using Google's API
const verifyCaptcha = async (token) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error);
    return false;
  }
};

/* ============================
   SEND OTP
   ============================ */
export const sendOtp = async (req, res) => {
  try {
    const { email, captchaToken } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!captchaToken) {
      return res.status(400).json({ message: 'reCAPTCHA token is required' });
    }

    // Verify captcha
    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(403).json({ message: 'Failed reCAPTCHA verification' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    // Save/Update OTP in DB (upsert based on email)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp: hashedOtp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send email
    const emailSent = await sendOtpEmail(normalizedEmail, otpCode);

    if (emailSent) {
      const responseData = { message: 'OTP sent successfully' };
      // In development mode without SMTP, include OTP in response for testing
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        responseData.devOtp = otpCode;
        responseData.message = 'OTP generated (dev mode — check response or console)';
      }
      res.status(200).json(responseData);
    } else {
      res.status(500).json({ message: 'Failed to send OTP email. Please try again later.' });
    }
  } catch (error) {
    console.error('❌ sendOtp error:', error);
    res.status(500).json({ message: 'Server error during OTP generation' });
  }
};


/* ============================
   SIGNUP
   ============================ */
export const signup = async (req, res) => {
  try {
    const { name, email, password, role, adminSecret, otp } = req.body;

    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({ message: 'All fields and OTP are required' });
    }

    // Admin secret gate — only allow admin role with correct secret
    if (role === 'admin') {
      const ADMIN_SECRET = process.env.ADMIN_SECRET || '90210';
      if (!adminSecret || adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({ message: 'Invalid admin secret code' });
      }
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Email already registered' });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP after successful use
    await Otp.deleteOne({ email: normalizedEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    // ✅ FIXED: Use "id" to match middleware
    const token = jwt.sign(
      { id: user._id },  // ← Changed from userId
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

/* ============================
   LOGIN
   ============================ */
export const loginUser = async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    if (!captchaToken) {
      return res.status(400).json({ message: 'reCAPTCHA token is required' });
    }

    // Verify captcha
    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(403).json({ message: 'Failed reCAPTCHA verification' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select('+password');

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: 'Invalid email or password' });
    }

    // ✅ FIXED: Use "id" to match middleware
    const token = jwt.sign(
      { id: user._id },  // ← Changed from userId
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/* ============================
   FORGOT PASSWORD
   ============================ */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(200).json({
        message: 'If the email exists, a reset link has been sent',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    console.log('🔗 Password reset link:', resetUrl);

    res.status(200).json({
      message: 'Password reset link sent to email',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ============================
   RESET PASSWORD (AUTO LOGIN)
   ============================ */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // ✅ FIXED: Use "id" to match middleware
    const jwtToken = jwt.sign(
      { id: user._id },  // ← Changed from userId
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Password reset successful',
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ============================
   GET CURRENT USER
   ============================ */
export const getMe = async (req, res) => {
  try {
    // ✅ Use req.user._id (middleware already found the user)
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ getMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};