// backend/src/routes/groupRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createGroup,
  getUserGroups,
  getPublicGroups,
  getGroupDetails,
  getGroupMessages,
  sendGroupMessage,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const router = express.Router();

// ✅ Apply authentication to ALL group routes
router.use(requireAuth);

// Group CRUD operations
router.post("/", createGroup); // POST /api/groups - Create group
router.get("/my-groups", getUserGroups); // GET /api/groups/my-groups - Get user's groups
router.get("/public", getPublicGroups); // GET /api/groups/public - Get public groups
router.get("/:groupId", getGroupDetails); // GET /api/groups/:groupId - Get group details
router.put("/:groupId", updateGroup); // PUT /api/groups/:groupId - Update group
router.delete("/:groupId", deleteGroup); // DELETE /api/groups/:groupId - Delete group

// Group messages
router.get("/:groupId/messages", getGroupMessages); // GET /api/groups/:groupId/messages
router.post("/:groupId/messages", sendGroupMessage); // POST /api/groups/:groupId/messages

// Group members management
router.post("/:groupId/members", addGroupMembers); // POST /api/groups/:groupId/members
router.delete("/:groupId/members/:memberId", removeGroupMember); // DELETE /api/groups/:groupId/members/:memberId
router.post("/:groupId/leave", leaveGroup); // POST /api/groups/:groupId/leave



export default router;
