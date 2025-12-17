// backend/src/routes/chatRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  updateProfile,
  deleteConversation,
  deleteMessage
} from '../controllers/chatController.js';

const router = express.Router();

// Get all users for sidebar
router.get('/users', requireAuth, getUsersForSidebar);

// Get messages with a specific user
router.get('/:id', requireAuth, getMessages);

// Send a message to a user
router.post('/send/:id', requireAuth, sendMessage);

// Update profile (avatar)
router.put('/updateprofile', requireAuth, updateProfile);

// Delete entire conversation with a user
router.delete('/conversation/:id', requireAuth, deleteConversation);

// Delete a single message
router.delete('/message/:messageId', requireAuth, deleteMessage);

export default router;