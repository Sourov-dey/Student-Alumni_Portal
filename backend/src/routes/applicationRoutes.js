import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import {
  createApplicationSchema,
  idParamSchema,
  updateStatusSchema,
} from "../validators/applicationSchemas.js";
import {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  getMyApplicationForJob,
} from "../controllers/applicationController.js";
import {resumeUpload} from "../config/multer.js"

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, scope: "applications" }));

// Student applies
router.post(
  "/",
  requireAuth,
  permit("student"),
  resumeUpload.single('resume'),
  // validate AFTER multer if your validator reads req.body only
  // If your createApplicationSchema expects form-data fields, keep it simple (or validate inside controller)
  applyToJob
);

// Student views own apps
router.get("/me", requireAuth, permit("student"), getMyApplications);

// Alumni views apps for job
router.get("/job/:jobId", requireAuth, permit("alumni", "admin"), getApplicationsForJob);

// Student views own app for specific job
router.get("/job/:jobId/my-status", requireAuth, permit("student"), getMyApplicationForJob);

// Alumni updates status
router.patch("/:id/status", requireAuth, permit("alumni", "admin"), validate(updateStatusSchema), updateApplicationStatus);

export default router;
