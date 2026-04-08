// backend/src/controllers/chatController.js
import Message from "../models/Message.js";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import { getReceiverSocketId, io } from "../../server.js";

// Get all users for search (exclude current user)
export const getUsersForSidebar = async (req, res, next) => {
  try {
    console.log("📋 getUsersForSidebar called");
    const loggedInUserId = req.user._id;

    // Get all users EXCEPT the logged-in user
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("name email avatarUrl role");

    console.log(`✅ Found ${filteredUsers.length} users for search`);
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("❌ Error in getUsersForSidebar:", error.message);
    next(error);
  }
};

// Get only users you've had conversations with
export const getConversationUsers = async (req, res, next) => {
  try {
    console.log("💬 getConversationUsers called for user:", req.user._id);
    const loggedInUserId = req.user._id;

    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    }).select("senderId receiverId");

    console.log(`📊 Found ${messages.length} total messages for user`);

    // Extract unique user IDs (excluding current user)
    const userIds = new Set();
    messages.forEach((msg) => {
      const senderIdStr = msg.senderId.toString();
      const receiverIdStr = msg.receiverId.toString();
      const loggedInUserIdStr = loggedInUserId.toString();

      if (senderIdStr !== loggedInUserIdStr) {
        userIds.add(senderIdStr);
      }
      if (receiverIdStr !== loggedInUserIdStr) {
        userIds.add(receiverIdStr);
      }
    });

    console.log(`👥 Found ${userIds.size} unique conversation partners`);

    // Fetch user details for all conversation partners
    const conversationUsers = await User.find({
      _id: { $in: Array.from(userIds) },
    }).select("name email avatarUrl role");

    console.log(`✅ Returning ${conversationUsers.length} conversation users`);
    res.status(200).json(conversationUsers);
  } catch (error) {
    console.error("❌ Error in getConversationUsers:", error.message);
    next(error);
  }
};

// Get messages between two users
export const getMessages = async (req, res, next) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log(`📬 Fetching messages between ${senderId} and ${receiverId}`);

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .select("-__v");

    console.log(`✅ Found ${messages.length} messages`);
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in getMessages:", error.message);
    next(error);
  }
};

// Send a message
export const sendMessage = async (req, res, next) => {
  try {
    const { id: receiverId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    console.log(`📤 Sending message from ${senderId} to ${receiverId}`);

    if (!text && !image) {
      return res.status(400).json({ error: "Text or image is required" });
    }

    // ── Connection guard: students/admins must be connected to alumni ──
    const receiver = await User.findById(receiverId).select("role");
    if (receiver && receiver.role === "alumni") {
      if (req.user.role === "student" || req.user.role === "admin") {
        const connection = await Connection.findOne({
          $or: [
            { from: senderId, to: receiverId, status: "accepted" },
            { from: receiverId, to: senderId, status: "accepted" },
          ],
        });
        if (!connection) {
          return res.status(403).json({
            error: "You must be connected with this alumni to send messages. Send a connection request first.",
            requiresConnection: true,
          });
        }
      }
    }

    // Create and save the message
    const newMessage = new Message({
      senderId: senderId,
      receiverId: receiverId,
      text: text || "",
      image: image || null,
    });

    await newMessage.save();
    console.log(`✅ Message saved to database:`, newMessage._id);

    // Get sender details to send to receiver
    const senderDetails = await User.findById(senderId).select(
      "name email avatarUrl role"
    );
    console.log(`👤 Sender details:`, senderDetails.name);

    // Send to receiver via Socket.IO if they're online
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      console.log(`🔌 Receiver is ONLINE, socket ID: ${receiverSocketId}`);

      // Send the new message
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log(`📨 Sent newMessage event to receiver`);

      // Notify receiver about new conversation (so sender appears in their sidebar)
      io.to(receiverSocketId).emit("newConversation", {
        _id: senderDetails._id,
        name: senderDetails.name,
        email: senderDetails.email,
        avatarUrl: senderDetails.avatarUrl,
        role: senderDetails.role,
      });
      console.log(`🆕 Sent newConversation event to receiver`);
    } else {
      console.log(
        `⚠️ Receiver ${receiverId} is OFFLINE - they'll see message on login`
      );
    }

    // IMPORTANT: Return success - the frontend will reload conversation list
    res.status(201).json(newMessage);
    console.log(`✅ Message send complete`);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error.message);
    next(error);
  }
};

// Update profile (for chat profile updates)
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar URL is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: avatarUrl },
      { new: true }
    ).select("-__v");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    next(error);
  }
};

// Delete entire conversation with a user
export const deleteConversation = async (req, res, next) => {
  try {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    const result = await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    });

    console.log(
      `🗑️ Deleted conversation between ${userId} and ${otherUserId}. Deleted: ${result.deletedCount} messages`
    );

    return res.status(200).json({
      message: "Conversation deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error in deleteConversation:", error.message);
    next(error);
  }
};

// Delete a single message
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only allow sender to delete their message
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this message" });
    }

    await message.deleteOne();

    console.log(`🗑️ Message ${messageId} deleted by user ${userId}`);

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("❌ Error in deleteMessage:", error.message);
    next(error);
  }
};
