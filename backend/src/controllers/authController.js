// src/controllers/authController.js (devLogin)
import VerificationCode from '../models/VerificationCode.js';
import User from '../models/User.js';
import { sendMail } from '../utils/mailer.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const genNumericCode = (len = 6) => {
  const digits = '0123456789';
  let s = '';
  for (let i=0;i<len;i++) s += digits[Math.floor(Math.random()*10)];
  return s;
};

export const isUniEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim().endsWith('@aus.ac.in');
};

export const requestCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const lower = email.toLowerCase().trim();

    // Allow any email, but flag if it's not a university email
    const isUniversityEmail = isUniEmail(lower);

    const recentCutoff = new Date(Date.now() - (Number(process.env.VERIFICATION_CODE_TTL_MIN || 10) * 60 * 1000));
    const recentCount = await VerificationCode.countDocuments({ email: lower, createdAt: { $gte: recentCutoff } });
    if (recentCount >= 5) {
      return res.status(429).json({ message: 'Too many requests; try again later' });
    }

    const rawCode = genNumericCode(Number(process.env.VERIFICATION_CODE_LENGTH || 6));
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(rawCode, salt);

    const ttl = Number(process.env.VERIFICATION_CODE_TTL_MIN || 10);
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    await VerificationCode.create({ email: lower, codeHash, expiresAt });

    // send email
    const subject = 'Assam University — login verification code';
    const text = `Your verification code is: ${rawCode}\nThis code expires in ${ttl} minutes. Do not share this code.`;
    const html = `<p>Your verification code is: <strong style="font-size:20px">${rawCode}</strong></p>
                  <p>This code expires in ${ttl} minutes.</p>`;
    await sendMail({ to: lower, subject, text, html });

    return res.json({ message: 'Verification code sent' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-code
 * Body: { email, code, role, name }
 * If successful: issues JWT and returns { token, user }
 */
export const verifyCode = async (req, res, next) => {
  try {
    const { email, code, role = 'student', name = '' } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const lower = email.toLowerCase().trim();

    // find latest valid code
    const now = new Date();
    const record = await VerificationCode.findOne({ email: lower, expiresAt: { $gt: now } }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ message: 'No valid verification code found or it expired' });

    // check attempts
    if (record.attempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts; request a new code' });
    }

    const ok = await bcrypt.compare(String(code), record.codeHash);
    if (!ok) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      return res.status(400).json({ message: 'Invalid code' });
    }

    // success — delete used codes for email
    await VerificationCode.deleteMany({ email: lower });

    // create or update user
    let user = await User.findOne({ email: lower });
    const isUniversityEmail = isUniEmail(lower);
    
    if (!user) {
      user = await User.create({
        email: lower,
        name: name || lower.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        role: role.toLowerCase(),
        // Auto-verify university emails, require ID upload for others
        verified: isUniversityEmail,
        verification: {
          status: isUniversityEmail ? 'verified' : 'pending',
          method: isUniversityEmail ? 'university_email' : 'id_required'
        }
      });
    } else {
      let changed = false;
      if (role && user.role !== role.toLowerCase()) { user.role = role.toLowerCase(); changed = true; }
      if (name && user.name !== name) { user.name = name; changed = true; }
      
      // Update verification status if needed
      if (isUniversityEmail && !user.verified) {
        user.verified = true;
        user.verification = { status: 'verified', method: 'university_email' };
        changed = true;
      }
      
      if (changed) await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const devLogin = async (req, res, next) => {
  try {
    const { email, role = 'student', name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // optional: enforce university domain
    // if (!email.endsWith('@aus.ac.in')) return res.status(403).json({ message: 'Use university email' });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, role: role.toLowerCase(), name, verified: true });
    } else {
      // update name/role if needed
      let changed = false;
      if (name && user.name !== name) { user.name = name; changed = true; }
      if (role && user.role !== role.toLowerCase()) { user.role = role.toLowerCase(); changed = true; }
      if (changed) await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};
