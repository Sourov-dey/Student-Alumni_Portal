// backend/src/controllers/chatController.js
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getReceiverSocketId, io } from "../../server.js";

// Get users for sidebar (exclude current user)
export const getUsersForSidebar = async (req, res, next) => {
  try {
    console.log("📋 getUsersForSidebar called");
    console.log("👤 Logged in user:", req.user);

    const loggedInUserId = req.user._id;
    console.log("👤 User ID:", loggedInUserId);

    // Get all users EXCEPT the logged-in user
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("name email avatarUrl role");

    console.log(`✅ Found ${filteredUsers.length} users`);
    console.log("Users:", filteredUsers);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("❌ Error in getUsersForSidebar:", error.message);
    console.error("Stack:", error.stack);
    next(error);
  }
};

// Get messages between two users
export const getMessages = async (req, res, next) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .select("-__v");

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

    if (!text && !image) {
      return res.status(400).json({ error: "Text or image is required" });
    }

    const newMessage = new Message({
      senderId: senderId,
      receiverId: receiverId,
      text: text || "",
      image: image || null,
    });

    await newMessage.save();

    // Send via Socket.IO
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
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

// 🔻 NEW: Delete entire conversation with a user
export const deleteConversation = async (req, res, next) => {
  try {
    const { id: otherUserId } = req.params; // user you’re chatting with
    const userId = req.user._id;            // logged-in user

    const result = await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    });

    console.log(
      `🗑️ Deleted conversation between ${userId} and ${otherUserId}. Deleted: ${result.deletedCount}`
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

// 🔻 NEW: Delete a single message
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Optional: only allow sender to delete their message
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
