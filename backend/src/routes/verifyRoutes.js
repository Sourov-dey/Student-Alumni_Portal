import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { idUpload } from "../config/multer.js";
import { submitIdCard, getMyVerificationStatus, cancelMyVerification } from "../controllers/verificationController.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, scope: "verify" }));

// GET /api/verify/status — authenticated user checks their verification status
router.get("/status", requireAuth, getMyVerificationStatus);

// POST /api/verify/id-card — authenticated user uploads their university ID card
router.post("/id-card", requireAuth, idUpload.single("idcard"), submitIdCard);

// DELETE /api/verify/cancel — user cancels their own pending verification
router.delete("/cancel", requireAuth, cancelMyVerification);

export default router;
