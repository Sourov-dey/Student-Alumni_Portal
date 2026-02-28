// backend/src/routes/userRoutes.js

import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema, updateUserSchema } from "../validators/userSchemas.js";
import { upload } from "../middleware/upload.js";
import {
  getUserById,
  updateUserById,
  uploadAvatar,
  uploadResume,
  listUsers,
  getUsers,                 // for chat (exclude current user)
  getAllUsersForGroups,     // for group creation (include current user)
  searchUsers,              // 🔍 SEARCH USERS
  getAlumniLocations,       // 🗺️ ALUMNI MAP
} from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/* =====================================================
   HEALTH CHECK
===================================================== */
router.get("/health", (_req, res) =>
  res.json({ ok: true, scope: "users" })
);

/* =====================================================
   🔴 SPECIFIC ROUTES FIRST (CRITICAL FIX)
===================================================== */

// 🔍 Search users (used by chat search)
router.get("/search", requireAuth, searchUsers);

// 💬 Get users for chat sidebar (exclude current user)
router.get("/for-chat", requireAuth, getUsers);

// 👥 Get ALL users for group creation (include current user)
router.get("/all", requireAuth, getAllUsersForGroups);

// 📋 List users (admin / pagination / filters)
router.get("/list", requireAuth, listUsers);

// 🗺️ Get alumni with locations (for map) — alumni only
router.get("/alumni-locations", requireAuth, requireRole('alumni'), getAlumniLocations);

/* =====================================================
   🔴 GENERIC ROUTES LAST (VERY IMPORTANT)
===================================================== */

// 👤 Get user by ID
router.get("/:id", requireAuth, getUserById);

// ✏️ Update user
router.patch("/:id", requireAuth, validate(updateUserSchema), updateUserById);

// 🖼 Upload avatar
router.post(
  "/:id/avatar",
  requireAuth,
  validate(idParamSchema),
  upload.single("avatar"),
  uploadAvatar
);

// 📄 Upload resume
router.post(
  "/:id/resume",
  requireAuth,
  validate(idParamSchema),
  upload.single("resume"),
  uploadResume
);

export default router;
