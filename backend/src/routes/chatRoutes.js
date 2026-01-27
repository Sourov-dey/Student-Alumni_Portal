// backend/src/routes/chatRoutes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getUsersForSidebar,
  getConversationUsers,
  getMessages,
  sendMessage,
  updateProfile,
  deleteConversation,
  deleteMessage,
} from "../controllers/ChatController.js";

const router = express.Router();

// Get all users (for search functionality)
router.get("/users", requireAuth, getUsersForSidebar);

// NEW: Get only users you've had conversations with
router.get("/conversations", requireAuth, getConversationUsers);

// Get messages with a specific user
router.get("/:id", requireAuth, getMessages);

// Send a message to a user
router.post("/send/:id", requireAuth, sendMessage);

// Update profile (avatar)
router.put("/updateprofile", requireAuth, updateProfile);

// Delete entire conversation with a user
router.delete("/conversation/:id", requireAuth, deleteConversation);

// Delete a single message
router.delete("/message/:messageId", requireAuth, deleteMessage);

export default router;
