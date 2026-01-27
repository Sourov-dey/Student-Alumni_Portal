
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { devLoginSchema } from "../validators/authSchemas.js";
import { issueJWT, requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import { signup, loginUser,forgotPassword,resetPassword } from "../controllers/authController.js"; 

const router = Router();

// Health check
router.get("/health", (_req, res) => res.json({ ok: true, scope: "auth" }));


router.post("/signup", signup);

router.post("/login", loginUser);  


// Dev login (for testing)
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

// Get current user
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;