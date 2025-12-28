// src/routes/authRoutes.js
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { devLoginSchema } from "../validators/authSchemas.js";
import { issueJWT, requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import { googleSignIn } from "../controllers/oauthController.js";
import { requestCode, verifyCode } from "../controllers/authController.js";
import { requestCodeLimiter } from "../middleware/ratelimiter.js";

const router = Router();

// Health check for the auth subsystem
router.get("/health", (_req, res) => res.json({ ok: true, scope: "auth" }));

// Google sign-in
router.post("/google", googleSignIn);

// Request & verify code (university email flow)
// Apply rate limiter to the "request code" endpoint
router.post("/request-code", requestCodeLimiter, requestCode);
router.post("/verify-code", verifyCode);

// Dev login (temporary for local testing)
router.post(
  "/dev-login",
  validate(devLoginSchema),
  async (req, res, next) => {
    try {
      const { email, role = "student", name } = req.body;

      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        user = await User.create({
          email: email.toLowerCase(),
          role,
          name: name || email.split("@")[0],
          emailVerified: true,
          profileComplete: false,
        });
      } else {
        // Always override role in dev mode
        user.role = role;
        if (name) user.name = name;
        await user.save();
      }

      const token = issueJWT(user);
      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// Support both GET and POST for /me so Postman or other clients can call either
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
router.post("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
