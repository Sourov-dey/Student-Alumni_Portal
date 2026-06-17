import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/emailService.js';

// Ensure JWT_SECRET is set in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set in production!');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

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
      return res.status(400).json({ message: "Email is required" });
    }

    if (!captchaToken) {
      return res.status(400).json({ message: "reCAPTCHA token is required" });
    }

    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(403).json({ message: "Failed reCAPTCHA verification" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Prevent OTP spam (1 request per 60 sec)
    const existingOtp = await Otp.findOne({ email: normalizedEmail });

    if (existingOtp && Date.now() - existingOtp.createdAt < 60000) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting another OTP",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otp: hashedOtp,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const emailSent = await sendOtpEmail(normalizedEmail, otpCode);

    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send OTP email. Please try again." });
    }

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("❌ sendOtp error:", error);
    res.status(500).json({ message: "Server error during OTP generation" });
  }
};


/* ============================
   SIGNUP
   ============================ */
export const signup = async (req, res) => {
  try {
    const { name, email, password, role, adminSecret, otp } = req.body;

    if (!name || !email || !password || !role || !otp) {
      return res.status(400).json({ message: "All fields and OTP are required" });
    }

    const sanitizedPassword = password.trim();
    const normalizedEmail = email.toLowerCase().trim();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(sanitizedPassword)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character",
      });
    }

    // Admin access check
    if (role === "admin") {
      const ADMIN_SECRET = process.env.ADMIN_SECRET || "90210";
      if (!adminSecret || adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({ message: "Invalid admin secret code" });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    // OTP expiry check (10 minutes)
    const OTP_EXPIRY = 10 * 60 * 1000;

    if (Date.now() - otpRecord.createdAt > OTP_EXPIRY) {
      await Otp.deleteOne({ email: normalizedEmail });

      return res.status(400).json({
        message: "OTP expired. Please request a new one.",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // delete OTP after success
    await Otp.deleteOne({ email: normalizedEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sanitizedPassword, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
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
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
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

    // Block suspended users from logging in
    if (user.suspended) {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact an administrator.',
        suspended: true,
      });
    }

    // ✅ FIXED: Use "id" to match middleware
    const token = jwt.sign(
      { id: user._id },  // ← Changed from userId
      JWT_SECRET,
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

    // Always return 200 so we don't reveal if the email exists
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
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    console.log('🔗 Sending password reset link to:', user.email);

    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);

    if (!emailSent) {
      // If email fails, clear the token so user can retry cleanly
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: 'Failed to send reset email. Please try again later.',
      });
    }

    res.status(200).json({
      message: 'If the email exists, a reset link has been sent',
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

    if (!password) {
      return res.status(400).json({
        message: 'Password is required',
      });
    }

    const sanitizedPassword = password.trim();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(sanitizedPassword)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character",
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
    user.password = await bcrypt.hash(sanitizedPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // ✅ FIXED: Use "id" to match middleware
    const jwtToken = jwt.sign(
      { id: user._id },  // ← Changed from userId
      JWT_SECRET,
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