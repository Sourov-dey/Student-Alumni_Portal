// backend/src/controllers/groupController.js - COMPLETE FILE WITH ALL FUNCTIONS

import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../../server.js";

// Create a new group
export const createGroup = async (req, res, next) => {
  try {
    console.log("🔥 Create group request received");
    console.log("Request body:", req.body);
    console.log("User:", req.user);

    const { name, description, memberIds, isPublic, category } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      console.log("❌ Group name is missing");
      return res.status(400).json({ message: "Group name is required" });
    }

    const members = [adminId];

    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach((id) => {
        const idString = id.toString();
        const adminIdString = adminId.toString();

        if (
          idString !== adminIdString &&
          !members.some((m) => m.toString() === idString)
        ) {
          members.push(id);
        }
      });
    }

    console.log("👥 Members to add:", members);

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || "",
      admin: adminId,
      members,
      isPublic: isPublic || false,
      category: category || "general",
    });

    console.log("✅ Group created:", group._id);

    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role");

    console.log("✅ Group populated");

    try {
      await GroupMessage.create({
        group: group._id,
        sender: adminId,
        messageType: "system",
        systemMessage: `${req.user.name} created the group`,
      });
      console.log("✅ System message created");
    } catch (msgError) {
      console.log("⚠️ Failed to create system message:", msgError.message);
    }

    try {
      members.forEach((memberId) => {
        const memberIdString = memberId.toString();
        io.to(memberIdString).emit("groupCreated", populatedGroup);
      });
      console.log("✅ Socket events emitted");
    } catch (socketError) {
      console.log("⚠️ Failed to emit socket events:", socketError.message);
    }

    console.log(
      `✅ Group "${group.name}" created successfully by ${req.user.name}`
    );
    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("❌ Error creating group:", error);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      message: "Failed to create group",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get user's groups
export const getUserGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      members: userId,
    })
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    console.log(`✅ Found ${groups.length} groups for user ${req.user.name}`);
    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch groups", error: error.message });
  }
};

// Get public groups (for discovery)
export const getPublicGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      isPublic: true,
      members: { $ne: userId },
    })
      .populate("admin", "name email avatarUrl role")
      .select("name description avatar admin members category createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${groups.length} public groups`);
    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ Error fetching public groups:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch public groups", error: error.message });
  }
};

// Get group details
export const getGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === userId.toString()
    );
    if (!isMember && !group.isPublic) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("❌ Error fetching group details:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch group details", error: error.message });
  }
};

// Get group messages
export const getGroupMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "name email avatarUrl role")
      .sort({ createdAt: 1 })
      .limit(500);

    console.log(`✅ Found ${messages.length} messages for group ${groupId}`);
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error fetching group messages:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: error.message });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📨 NEW GROUP MESSAGE REQUEST");
    console.log("Group ID:", groupId);
    console.log("Sender:", req.user.name, `(${senderId})`);
    console.log("Message:", text || "[image]");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!text && !image) {
      return res.status(400).json({ message: "Message content required" });
    }

    const group = await Group.findById(groupId).populate("members", "_id");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await GroupMessage.create({
      group: groupId,
      sender: senderId,
      text: text || "",
      image: image || null,
      messageType: "user",
    });

    group.lastMessage = message._id;
    group.lastMessageAt = message.createdAt;
    await group.save();

    const populatedMessage = await GroupMessage.findById(message._id).populate(
      "sender",
      "name email avatarUrl role"
    );

    console.log("✅ Message created:", message._id);
    console.log("👥 Broadcasting to", group.members.length, "members");

    group.members.forEach((member) => {
      const memberId = member._id.toString();
      const socketId = getReceiverSocketId(memberId);

      if (socketId) {
        console.log(`📤 Emitting to member ${memberId} (socket: ${socketId})`);
        io.to(socketId).emit("newGroupMessage", {
          groupId: groupId,
          message: populatedMessage,
        });
      } else {
        console.log(`⚠️ Member ${memberId} is offline (no socket)`);
      }
    });

    console.log(`✅ Message broadcast complete for group ${group.name}`);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("❌ Error sending group message:", error);
    res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
};

// Add members to group - CRITICAL FIX
export const addGroupMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    console.log("\n\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("➕ ADD MEMBERS REQUEST - DETAILED LOGGING");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Group ID:", groupId);
    console.log("Admin:", req.user.name, `(${userId})`);
    console.log("Member IDs to add:", memberIds);
    console.log("═══════════════════════════════════════════════════════════");

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Member IDs required" });
    }

    const group = await Group.findById(groupId).populate("members", "_id name");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.admin.toString() === userId.toString();
    const canInvite =
      group.allowMemberInvite &&
      group.members.some((m) => m._id.toString() === userId.toString());

    if (!isAdmin && !canInvite) {
      return res.status(403).json({ message: "Permission denied" });
    }

    console.log("✅ Permission granted");
    console.log("📊 Current member count:", group.members.length);
    console.log(
      "📋 Current members:",
      group.members.map((m) => `${m.name} (${m._id})`)
    );

    // Identify new members
    const newMembers = [];
    memberIds.forEach((id) => {
      const exists = group.members.some(
        (m) => m._id.toString() === id.toString()
      );
      if (!exists) {
        group.members.push(id);
        newMembers.push(id);
        console.log(`   ➕ Adding new member: ${id}`);
      } else {
        console.log(`   ⚠️ Member ${id} already exists, skipping`);
      }
    });

    console.log("📊 New members to add:", newMembers.length);

    if (newMembers.length === 0) {
      console.log("⚠️ No new members to add");
      return res.status(400).json({ message: "All users are already members" });
    }

    await group.save();
    console.log("✅ Group saved with new members");

    // Create system messages
    const users = await User.find({ _id: { $in: newMembers } });
    console.log(
      "👥 Fetched user details:",
      users.map((u) => `${u.name} (${u._id})`)
    );

    for (const user of users) {
      const systemMsg = await GroupMessage.create({
        group: groupId,
        sender: userId,
        messageType: "system",
        systemMessage: `${user.name} was added to the group`,
      });
      console.log(`   ✅ System message created: "${systemMsg.systemMessage}"`);
    }

    // Populate updated group
    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role");

    console.log("✅ Updated group populated");
    console.log("📊 New member count:", updatedGroup.members.length);

    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("📡 STEP 1: NOTIFY EXISTING MEMBERS");
    console.log("═══════════════════════════════════════════════════════════");

    // Notify existing members (those who were already in the group)
    const existingMembers = updatedGroup.members.filter(
      (m) => !newMembers.some((newId) => newId.toString() === m._id.toString())
    );

    console.log("👥 Existing members to notify:", existingMembers.length);
    existingMembers.forEach((member, index) => {
      const memberIdStr = member._id.toString();
      const socketId = getReceiverSocketId(memberIdStr);

      console.log(
        `\n${index + 1}. Existing Member: ${member.name} (${memberIdStr})`
      );
      console.log(`   🔍 Looking up socket for user ID: ${memberIdStr}`);
      console.log(`   📱 Socket ID found: ${socketId || "NONE"}`);

      if (socketId) {
        console.log(`   ✅ Member is ONLINE`);
        console.log(
          `   📤 Emitting 'groupMembersAdded' to socket: ${socketId}`
        );

        io.to(socketId).emit("groupMembersAdded", {
          groupId,
          group: updatedGroup,
        });

        console.log(`   ✅ Event emitted successfully`);
      } else {
        console.log(`   ⚠️ Member is OFFLINE - cannot emit`);
      }
    });

    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("📡 STEP 2: NOTIFY NEWLY ADDED MEMBERS");
    console.log("═══════════════════════════════════════════════════════════");

    console.log("👥 New members to notify:", newMembers.length);

    for (let i = 0; i < newMembers.length; i++) {
      const newMemberId = newMembers[i].toString();
      const newMember = users.find((u) => u._id.toString() === newMemberId);

      console.log(`\n${i + 1}. NEW Member: ${newMember.name} (${newMemberId})`);
      console.log(`   🔍 Looking up socket for user ID: ${newMemberId}`);

      const socketId = getReceiverSocketId(newMemberId);
      console.log(`   📱 Socket ID found: ${socketId || "NONE"}`);

      if (socketId) {
        console.log(`   ✅ NEW Member is ONLINE`);
        console.log(`   📤 Emitting 'addedToGroup' to socket: ${socketId}`);
        console.log(`   📦 Event data:`, {
          groupId: updatedGroup._id,
          groupName: updatedGroup.name,
          addedBy: req.user.name,
          memberCount: updatedGroup.members.length,
        });

        io.to(socketId).emit("addedToGroup", {
          group: updatedGroup,
          addedBy: req.user.name,
          message: `You were added to "${updatedGroup.name}" by ${req.user.name}`,
        });

        console.log(`   ✅ 'addedToGroup' event emitted successfully`);
      } else {
        console.log(`   ⚠️ NEW Member is OFFLINE - cannot emit`);
        console.log(`   ℹ️ They will see the group when they next log in`);
      }
    }

    console.log(
      "\n═══════════════════════════════════════════════════════════"
    );
    console.log("📊 BROADCAST SUMMARY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`✅ Group: ${updatedGroup.name}`);
    console.log(`✅ Total members now: ${updatedGroup.members.length}`);
    console.log(`✅ New members added: ${newMembers.length}`);
    console.log(`✅ Existing members: ${existingMembers.length}`);
    console.log(
      "═══════════════════════════════════════════════════════════\n\n"
    );

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("\n❌❌❌ ERROR IN addGroupMembers ❌❌❌");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);
    console.error("❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n");

    res.status(500).json({
      message: "Failed to add members",
      error: error.message,
    });
  }
};

// Remove member - keeping your existing working version
export const removeGroupMember = async (req, res, next) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).populate("members", "_id name");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.admin.toString() === userId.toString();
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    if (memberId === group.admin.toString()) {
      return res.status(400).json({ message: "Cannot remove group admin" });
    }

    const removedUser = await User.findById(memberId);
    if (!removedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    group.members = group.members.filter((m) => m._id.toString() !== memberId);
    await group.save();

    const systemMsg = await GroupMessage.create({
      group: groupId,
      sender: userId,
      messageType: "system",
      systemMessage: `${removedUser.name} was removed from the group`,
    });

    const populatedSystemMsg = await GroupMessage.findById(
      systemMsg._id
    ).populate("sender", "name email avatarUrl role");

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role");

    updatedGroup.members.forEach((member) => {
      const memberIdStr = member._id.toString();
      const socketId = getReceiverSocketId(memberIdStr);

      if (socketId) {
        io.to(socketId).emit("groupMemberRemoved", {
          groupId,
          memberId,
          group: updatedGroup,
        });

        io.to(socketId).emit("newGroupMessage", {
          groupId,
          message: populatedSystemMsg,
        });
      }
    });

    const removedMemberSocketId = getReceiverSocketId(memberId);
    if (removedMemberSocketId) {
      io.to(removedMemberSocketId).emit("removedFromGroup", { groupId });
    }

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("❌ Error removing group member:", error);
    res
      .status(500)
      .json({ message: "Failed to remove member", error: error.message });
  }
};

// Leave group - keeping your existing working version
export const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).populate("members", "_id name");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Admin must transfer ownership before leaving",
      });
    }

    const isMember = group.members.some(
      (m) => m._id.toString() === userId.toString()
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ message: "You are not a member of this group" });
    }

    group.members = group.members.filter(
      (m) => m._id.toString() !== userId.toString()
    );
    await group.save();

    const systemMsg = await GroupMessage.create({
      group: groupId,
      sender: userId,
      messageType: "system",
      systemMessage: `${req.user.name} left the group`,
    });

    const populatedSystemMsg = await GroupMessage.findById(
      systemMsg._id
    ).populate("sender", "name email avatarUrl role");

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role");

    updatedGroup.members.forEach((member) => {
      const memberIdStr = member._id.toString();
      const socketId = getReceiverSocketId(memberIdStr);

      if (socketId) {
        io.to(socketId).emit("memberLeftGroup", {
          groupId,
          userId: userId.toString(),
          userName: req.user.name,
          group: updatedGroup,
        });

        io.to(socketId).emit("newGroupMessage", {
          groupId,
          message: populatedSystemMsg,
        });
      }
    });

    const leavingUserSocketId = getReceiverSocketId(userId.toString());
    if (leavingUserSocketId) {
      io.to(leavingUserSocketId).emit("userLeftGroupSuccess", {
        groupId,
        message: "You have left the group successfully",
      });
    }

    res.status(200).json({
      message: "Left group successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("❌ Error leaving group:", error);
    res
      .status(500)
      .json({ message: "Failed to leave group", error: error.message });
  }
};

// Update group
export const updateGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar, isPublic, allowMemberInvite, category } =
      req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can update group" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;
    if (isPublic !== undefined) group.isPublic = isPublic;
    if (allowMemberInvite !== undefined)
      group.allowMemberInvite = allowMemberInvite;
    if (category) group.category = category;

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "name email avatarUrl role")
      .populate("members", "name email avatarUrl role");

    updatedGroup.members.forEach((memberId) => {
      io.to(memberId._id.toString()).emit("groupUpdated", {
        groupId,
        group: updatedGroup,
      });
    });

    console.log(`✅ Group updated: ${group.name}`);
    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("❌ Error updating group:", error);
    res
      .status(500)
      .json({ message: "Failed to update group", error: error.message });
  }
};

// Delete group
export const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await GroupMessage.deleteMany({ group: groupId });
    await group.deleteOne();

    group.members.forEach((memberId) => {
      io.to(memberId.toString()).emit("groupDeleted", { groupId });
    });

    console.log(`✅ Group deleted: ${group.name}`);
    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting group:", error);
    res
      .status(500)
      .json({ message: "Failed to delete group", error: error.message });
  }
};
