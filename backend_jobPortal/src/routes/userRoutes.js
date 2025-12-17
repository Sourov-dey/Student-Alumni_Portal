import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { idParamSchema, updateUserSchema } from "../validators/userSchemas.js";
import { upload } from "../middleware/upload.js";
import {
  getUserById,
  updateUserById,
  uploadAvatar,
  uploadResume,
} from "../controllers/userController.js";
import { listUsers } from '../controllers/userController.js';

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, scope: "users" }));

router.get("/:id", validate(idParamSchema), getUserById);
router.patch("/:id", validate(updateUserSchema), updateUserById);
router.get('/', listUsers);
router.post("/:id/avatar", validate(idParamSchema), upload.single("avatar"), uploadAvatar);
router.post("/:id/resume", validate(idParamSchema), upload.single("resume"), uploadResume);

export default router;
