// backend/src/routes/connectionRoutes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  sendConnectionRequest,
  respondToConnection,
  getMyConnections,
  getPendingRequests,
  getSentRequests,
  getConnectionStatus,
  removeConnection,
  checkBulkConnectionStatus,
} from "../controllers/connectionController.js";

const router = Router();

// ── Specific routes first ──

// Check connection status for multiple alumni at once (for map)
router.get("/check-bulk", requireAuth, checkBulkConnectionStatus);

// Get all accepted connections
router.get("/", requireAuth, getMyConnections);

// Get pending incoming requests (alumni)
router.get("/pending", requireAuth, getPendingRequests);

// Get sent requests (student)
router.get("/sent", requireAuth, getSentRequests);

// Check connection status with a specific user
router.get("/status/:userId", requireAuth, getConnectionStatus);

// Send a connection request to an alumni
router.post("/request/:alumniId", requireAuth, sendConnectionRequest);

// Accept or reject a connection request
router.patch("/:connectionId/respond", requireAuth, respondToConnection);

// Remove a connection
router.delete("/:connectionId", requireAuth, removeConnection);

export default router;
