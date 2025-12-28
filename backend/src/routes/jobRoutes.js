import { Router } from "express";
import {
  listJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  markFilled,
  suggestJobs,
} from "../controllers/jobController.js";
import { validate } from "../middleware/validate.js";
import {
  createJobSchema,
  updateJobSchema,
  idParamSchema,
  listJobsQuerySchema,
} from "../validators/jobSchemas.js";
import { requireAuth } from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";

const router = Router();

// Public reads
router.get("/", validate(listJobsQuerySchema), listJobs);
router.get("/search/suggest", suggestJobs);
router.get("/:id", validate(idParamSchema), getJobById);

// Protected writes
router.post("/", requireAuth, permit("alumni", "admin"), validate(createJobSchema), createJob);
router.patch("/:id", requireAuth, permit("alumni", "admin"), validate(updateJobSchema), updateJob);
router.delete("/:id", requireAuth, permit("alumni", "admin"), validate(idParamSchema), deleteJob);
router.patch("/:id/mark-filled", requireAuth, permit("alumni", "admin"), validate(idParamSchema), markFilled);

export default router;
