import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { idUpload } from "../config/multer.js";
import { submitIdCard } from "../controllers/verificationController.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, scope: "verify" }));

// POST /api/verify/id-card — authenticated user uploads their university ID card
router.post("/id-card", requireAuth, idUpload.single("idcard"), submitIdCard);

export default router;
