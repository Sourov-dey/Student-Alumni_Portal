import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";
import * as adminCtrl from "../controllers/adminController.js";
import {
  getAllUsers as listUsers,
  verifyUser,
  deleteUser,
  getAllJobs,
  deleteJob as removeJob,
  getAnalytics
} from '../controllers/adminController.js';

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true, scope: "admin" }));

router.use(requireAuth, permit('admin'));

router.get('/users', listUsers);          // list all users
router.patch('/users/:id/verify', verifyUser); 
router.delete('/users/:id', deleteUser);

router.get('/jobs', getAllJobs);            // see all jobs
router.delete('/jobs/:id', removeJob);

router.get('/analytics', getAnalytics);   // stats dashboard

export default router;
