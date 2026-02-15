import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";

import {
  getAllUsers as listUsers,
  verifyUser,
  suspendUser,
  deleteUser,
  getAllJobs,
  deleteJob as removeJob,
  getAnalytics,
} from "../controllers/adminController.js";

import {
  listVerifications,
  approveVerification,
  rejectVerification,
} from "../controllers/verificationController.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, scope: "admin" }));

router.use(requireAuth, permit("admin"));

router.get("/users", listUsers); // list all users
router.patch("/users/:id/verify", verifyUser);
router.patch("/users/:id/suspend", suspendUser);
router.delete("/users/:id", deleteUser);

router.get("/jobs", getAllJobs); // see all jobs
router.delete("/jobs/:id", removeJob);

router.get("/analytics", getAnalytics); // stats dashboard

// Verification review routes
router.get("/verifications", listVerifications);
router.post("/verifications/:id/approve", approveVerification);
router.post("/verifications/:id/reject", rejectVerification);

export default router;

