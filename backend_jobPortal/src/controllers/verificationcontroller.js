// src/controllers/verificationController.js
import crypto from 'crypto';
import Verification from '../models/Verification.js';
import User from '../models/User.js';

export const submitIdCard = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // TODO: store to S3/disk; here mock a URL
    const checksum = crypto.createHash('md5').update(req.file.buffer).digest('hex');
    const url = `/uploads/idcards/${req.user._id}-${Date.now()}`;

    // Don't allow upload if already verified through university email
    const user = await User.findById(req.user._id);
    if (user.verification?.method === 'university_email' && user.verification?.status === 'verified') {
      return res.status(400).json({ message: 'Already verified through university email' });
    }

    const doc = await Verification.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        method: 'id_card',
        status: 'pending',
        idDoc: { url, mime: req.file.mimetype, size: req.file.size, checksum },
        submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update user verification status
    await User.findByIdAndUpdate(req.user._id, {
      verification: {
        status: 'pending',
        method: 'id_card',
        updatedAt: new Date()
      }
    });

    res.status(201).json({ message: 'Verification submitted', verification: doc });
  } catch (e) { next(e); }
};

export const getMyVerification = async (req, res, next) => {
  try {
    const v = await Verification.findOne({ user: req.user._id });
    res.json(v || null);
  } catch (e) { next(e); }
};

// --- Admin ---
export const listVerifications = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const items = await Verification.find({ status }).populate('user', 'name email role verification');
    res.json(items);
  } catch (e) { next(e); }
};

export const approveVerification = async (req, res, next) => {
  try {
    const v = await Verification.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Not found' });
    v.status = 'verified';
    v.verifiedAt = new Date();
    v.reviewer = req.user._id;
    await v.save();
    await User.findByIdAndUpdate(v.user, { 'verification.status': 'verified', 'verification.method': v.method });
    res.json({ message: 'Verified', verification: v });
  } catch (e) { next(e); }
};

export const rejectVerification = async (req, res, next) => {
  try {
    const v = await Verification.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Not found' });
    v.status = 'rejected';
    v.note = req.body?.note || '';
    v.reviewer = req.user._id;
    await v.save();
    await User.findByIdAndUpdate(v.user, { 'verification.status': 'rejected', 'verification.method': v.method });
    res.json({ message: 'Rejected', verification: v });
  } catch (e) { next(e); }
};
