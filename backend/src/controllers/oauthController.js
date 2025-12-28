// src/controllers/oauthController.js
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleSignIn(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'idToken required' });

    // verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload(); // contains email, name, picture, hd (hosted domain)
    const email = payload.email;
    const name = payload.name || '';
    const picture = payload.picture || '';
    const hostedDomain = payload.hd || null; // only present for G Suite accounts

    // optional: restrict to university domain
    if (process.env.GOOGLE_ALLOWED_DOMAIN) {
      const allowed = process.env.GOOGLE_ALLOWED_DOMAIN;
      if (!email.endsWith(`@${allowed}`) && hostedDomain !== allowed) {
        return res.status(403).json({ message: 'Email domain not allowed' });
      }
    }

    // find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // create student by default? We should infer role: allow first-time users to pick role later.
      user = await User.create({
        email,
        name,
        avatarUrl: picture,
        role: 'student', // default - optionally set null and require profile completion
        verified: true,
        // do NOT set sensitive fields
      });
    } else {
      // update profile picture / name if changed
      let changed = false;
      if (user.avatarUrl !== picture) { user.avatarUrl = picture; changed = true; }
      if (user.name !== name) { user.name = name; changed = true; }
      if (!user.verified) { user.verified = true; changed = true; }
      if (changed) await user.save();
    }

    // generate your JWT (same policy as dev-login)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user });
  } catch (err) {
    console.error('googleSignIn error', err);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
}
