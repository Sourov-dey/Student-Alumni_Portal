
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { devLoginSchema } from "../validators/authSchemas.js";
import { issueJWT, requireAuth } from "../middleware/auth.js";
import { authLimiter, requestCodeLimiter } from "../middleware/ratelimiter.js";
import User from "../models/User.js";
import { signup, loginUser, forgotPassword, resetPassword, sendOtp } from "../controllers/authController.js";

const router = Router();

/**
 * @swagger
 * /auth/health:
 *   get:
 *     summary: Health check for the auth service
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Auth service is healthy
 */
router.get("/health", (_req, res) => res.json({ ok: true, scope: "auth" }));

router.post("/send-otp", requestCodeLimiter, sendOtp);
router.post("/signup", authLimiter, signup);

router.post("/login", authLimiter, loginUser);


// Dev login (for testing) — ONLY available outside of production
if (process.env.NODE_ENV !== "production") {
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
            verified: true,
            profileComplete: false,
          });
        } else {
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
}

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;