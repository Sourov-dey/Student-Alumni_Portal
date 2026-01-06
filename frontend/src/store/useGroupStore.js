// frontend/src/store/useGroupStore.js - FINAL FIXED VERSION
import { create } from "zustand";
import http from "../api/http";

const BASE_URL = "http://localhost:5000";

export const useGroupStore = create((set, get) => ({
  groups: [],
  publicGroups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isMessagesLoading: false,
  socket: null,

  // Set socket connection
  setSocket: (socket) => {
    // Clean up old listeners if socket already exists
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.off("groupCreated");
      currentSocket.off("groupUpdated");
      currentSocket.off("newGroupMessage");
      currentSocket.off("groupMembersAdded");
      currentSocket.off("addedToGroup");
      currentSocket.off("groupMemberRemoved");
      currentSocket.off("removedFromGroup");
      currentSocket.off("groupDeleted");
      currentSocket.off("memberLeftGroup");
      currentSocket.off("userLeftGroupSuccess");
    }

    set({ socket });

    if (socket) {
      console.log("🔌 Setting up group chat socket listeners");

      // Listen for new groups
      socket.on("groupCreated", (group) => {
        console.log("🆕 New group created:", group.name);
        const { groups } = get();
        set({ groups: [group, ...groups] });
      });

      // Listen for group updates
      socket.on("groupUpdated", ({ groupId, group }) => {
        console.log("📝 Group updated:", group.name);
        const { groups, selectedGroup } = get();

        const updatedGroups = groups.map((g) =>
          g._id === groupId ? group : g
        );
        set({ groups: updatedGroups });

        if (selectedGroup?._id === groupId) {
          set({ selectedGroup: group });
        }
      });

      // ✅ CRITICAL FIX: Listen for new group messages
      socket.on("newGroupMessage", ({ groupId, message }) => {
        console.log("📨 New group message received:", {
          groupId,
          messageId: message._id,
          text: message.text,
          sender: message.sender.name,
          currentSelectedGroup: get().selectedGroup?._id,
        });

        const { selectedGroup, groupMessages, groups } = get();

        // ✅ Update messages if this group is currently selected
        if (selectedGroup?._id === groupId) {
          console.log("✅ This message is for the currently selected group");

          // Check if message already exists (prevent duplicates)
          const messageExists = groupMessages.some(
            (m) => m._id === message._id
          );

          if (!messageExists) {
            const updatedMessages = [...groupMessages, message];
            set({ groupMessages: updatedMessages });
            console.log(
              "✅ Message added to UI, total messages:",
              updatedMessages.length
            );
          } else {
            console.log("⚠️ Message already exists (duplicate), skipping");
          }
        } else {
          console.log("ℹ️ Message is for a different group");
        }

        // ✅ Update group's last message timestamp in sidebar
        const updatedGroups = groups.map((g) => {
          if (g._id === groupId) {
            return {
              ...g,
              lastMessageAt: message.createdAt,
              lastMessage: message._id,
            };
          }
          return g;
        });

        // Sort by last message time
        updatedGroups.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );

        set({ groups: updatedGroups });
      });

      // Listen for member additions
      socket.on("groupMembersAdded", ({ groupId, group }) => {
        console.log("➕ Members added to group:", groupId);
        console.log("Updated group data:", group);
        const { groups, selectedGroup } = get();

        // Update the group in the groups list
        const updatedGroups = groups.map((g) =>
          g._id === groupId ? group : g
        );
        set({ groups: updatedGroups });

        // ✅ CRITICAL FIX: If this is the currently selected group, update it too
        if (selectedGroup?._id === groupId) {
          console.log(
            "✅ Updating currently selected group with new member count"
          );
          set({ selectedGroup: group });
        }
      });

      // ✅ NEW: Listen for being ADDED to a group (for newly added members)
      socket.on("addedToGroup", ({ group, addedBy, message }) => {
        console.log("\n\n");
        console.log(
          "═══════════════════════════════════════════════════════════"
        );
        console.log("🎉🎉🎉 YOU WERE ADDED TO A GROUP! 🎉🎉🎉");
        console.log(
          "═══════════════════════════════════════════════════════════"
        );
        console.log("Group ID:", group._id);
        console.log("Group Name:", group.name);
        console.log("Added by:", addedBy);
        console.log("Message:", message);
        console.log("Member count:", group.members.length);
        console.log("Members:", group.members.map((m) => m.name).join(", "));
        console.log(
          "═══════════════════════════════════════════════════════════"
        );

        const { groups } = get();
        console.log("Current groups in state:", groups.length);
        groups.forEach((g, i) =>
          console.log(`  ${i + 1}. ${g.name} (${g._id})`)
        );

        // Check if group already exists
        const groupExists = groups.some((g) => g._id === group._id);
        console.log("Does group already exist?", groupExists);

        if (!groupExists) {
          console.log("➕ Adding new group to the TOP of the list");
          const updatedGroups = [group, ...groups];
          set({ groups: updatedGroups });
          console.log("✅ New groups array length:", updatedGroups.length);
          console.log("✅ New group added to sidebar successfully!");
        } else {
          console.log("🔄 Updating existing group");
          const updatedGroups = groups.map((g) =>
            g._id === group._id ? group : g
          );
          set({ groups: updatedGroups });
          console.log("✅ Group updated in sidebar");
        }

        const finalGroups = get().groups;
        console.log("\n📊 FINAL STATE:");
        console.log("Total groups:", finalGroups.length);
        finalGroups.forEach((g, i) =>
          console.log(
            `  ${i + 1}. ${g.name} (${g._id}) - ${g.members.length} members`
          )
        );
        console.log(
          "═══════════════════════════════════════════════════════════\n\n"
        );
      });

      // Listen for member removal
      socket.on("groupMemberRemoved", ({ groupId, memberId, group }) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("➖ MEMBER REMOVED EVENT RECEIVED");
        console.log("Group ID:", groupId);
        console.log("Removed member ID:", memberId);
        console.log("Updated group data:", {
          name: group.name,
          memberCount: group.members.length,
          members: group.members.map((m) => m.name),
        });
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const { groups, selectedGroup, groupMessages } = get();

        // ✅ FIX 1: Update the group in the groups list
        const updatedGroups = groups.map((g) =>
          g._id === groupId ? group : g
        );
        set({ groups: updatedGroups });
        console.log("✅ Groups list updated");

        // ✅ FIX 2: If this is the currently selected group, update it AND reload messages
        if (selectedGroup?._id === groupId) {
          console.log("✅ This is the currently selected group");
          console.log(
            `📝 Member count: ${selectedGroup.members.length} → ${group.members.length}`
          );

          // Update selected group
          set({ selectedGroup: group });
          console.log("✅ Selected group updated with new member count");

          // ✅ FIX 3: Reload messages to show system message
          console.log(
            "🔄 Reloading messages to show 'user removed' system message..."
          );
          get().getGroupMessages(groupId);
        }
      });

      // Listen for being removed from group
      socket.on("removedFromGroup", ({ groupId }) => {
        console.log("❌ Removed from group:", groupId);
        const { groups, selectedGroup } = get();

        const updatedGroups = groups.filter((g) => g._id !== groupId);
        set({ groups: updatedGroups });

        if (selectedGroup?._id === groupId) {
          set({ selectedGroup: null, groupMessages: [] });
        }
      });

      // Listen for group deletion
      socket.on("groupDeleted", ({ groupId }) => {
        console.log("🗑️ Group deleted:", groupId);
        const { groups, selectedGroup } = get();

        const updatedGroups = groups.filter((g) => g._id !== groupId);
        set({ groups: updatedGroups });

        if (selectedGroup?._id === groupId) {
          set({ selectedGroup: null, groupMessages: [] });
        }
      });

      // Listen for member leaving
      socket.on("memberLeftGroup", ({ groupId, userId, userName, group }) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("👋 MEMBER LEFT GROUP EVENT RECEIVED");
        console.log("Group ID:", groupId);
        console.log("User who left:", userName, `(${userId})`);
        console.log("Updated group data:", {
          name: group.name,
          memberCount: group.members.length,
          members: group.members.map((m) => m.name),
        });
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const { groups, selectedGroup } = get();

        // ✅ FIX 1: Update the group in the groups list with new data
        const updatedGroups = groups.map((g) =>
          g._id === groupId ? group : g
        );
        set({ groups: updatedGroups });
        console.log("✅ Groups list updated");

        // ✅ FIX 2: If this is the currently selected group, update it AND reload messages
        if (selectedGroup?._id === groupId) {
          console.log("✅ This is the currently selected group");
          console.log(
            `📝 Member count: ${selectedGroup.members.length} → ${group.members.length}`
          );

          // Update selected group
          set({ selectedGroup: group });
          console.log("✅ Selected group updated with new member count");

          // ✅ FIX 3: Reload messages to show system message
          console.log(
            "🔄 Reloading messages to show 'user left' system message..."
          );
          get().getGroupMessages(groupId);
        }
      });

      // ✅ NEW: Listen for successful leave (for the user who left)
      socket.on("userLeftGroupSuccess", ({ groupId, message }) => {
        console.log("✅ Successfully left group:", groupId);
        console.log("Message:", message);

        const { groups, selectedGroup } = get();

        // Remove the group from the user's list
        const updatedGroups = groups.filter((g) => g._id !== groupId);
        set({ groups: updatedGroups });

        // If they were viewing this group, clear it
        if (selectedGroup?._id === groupId) {
          set({ selectedGroup: null, groupMessages: [] });
        }

        console.log("✅ Group removed from sidebar");
      });

      console.log("✅ All group chat socket listeners registered");
    }
  },

  // Get user's groups
  getUserGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await http.get(`${BASE_URL}/api/groups/my-groups`);
      set({ groups: res.data });
      console.log("✅ Loaded user groups:", res.data.length);
    } catch (error) {
      console.error("❌ Error loading groups:", error);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // Get public groups
  getPublicGroups: async () => {
    try {
      const res = await http.get(`${BASE_URL}/api/groups/public`);
      set({ publicGroups: res.data });
      console.log("✅ Loaded public groups:", res.data.length);
    } catch (error) {
      console.error("❌ Error loading public groups:", error);
    }
  },

  // Create group
  createGroup: async (groupData) => {
    try {
      const res = await http.post(`${BASE_URL}/api/groups`, groupData);
      const { groups } = get();
      set({ groups: [res.data, ...groups] });
      console.log("✅ Group created:", res.data.name);
      return res.data;
    } catch (error) {
      console.error("❌ Error creating group:", error);
      throw error;
    }
  },

  // Get group messages
  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await http.get(`${BASE_URL}/api/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
      console.log("✅ Loaded group messages:", res.data.length);
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send group message - ✅ FIXED: Add optimistic update
  sendGroupMessage: async (groupId, messageData) => {
    const { groupMessages, selectedGroup } = get();

    try {
      console.log("📤 Sending message to server...");

      const res = await http.post(
        `${BASE_URL}/api/groups/${groupId}/messages`,
        messageData
      );

      console.log("✅ Server confirmed message sent:", res.data._id);

      // ✅ CRITICAL: Add message immediately to local state (optimistic update)
      // This ensures the sender sees their own message instantly
      if (selectedGroup?._id === groupId) {
        const messageExists = groupMessages.some((m) => m._id === res.data._id);

        if (!messageExists) {
          set({ groupMessages: [...groupMessages, res.data] });
          console.log("✅ Message added to sender's UI (optimistic update)");
        }
      }

      return res.data;
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  },

  // Add members to group
  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await http.post(`${BASE_URL}/api/groups/${groupId}/members`, {
        memberIds,
      });

      const { groups, selectedGroup } = get();
      const updatedGroups = groups.map((g) =>
        g._id === groupId ? res.data : g
      );

      set({ groups: updatedGroups });

      if (selectedGroup?._id === groupId) {
        set({ selectedGroup: res.data });
      }

      console.log("✅ Members added to group");
      return res.data;
    } catch (error) {
      console.error("❌ Error adding members:", error);
      throw error;
    }
  },

  // Remove member from group
  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await http.delete(
        `${BASE_URL}/api/groups/${groupId}/members/${memberId}`
      );

      const { groups, selectedGroup } = get();
      const updatedGroups = groups.map((g) =>
        g._id === groupId ? res.data : g
      );

      set({ groups: updatedGroups });

      if (selectedGroup?._id === groupId) {
        set({ selectedGroup: res.data });
      }

      console.log("✅ Member removed from group");
      return res.data;
    } catch (error) {
      console.error("❌ Error removing member:", error);
      throw error;
    }
  },

  // Leave group
  leaveGroup: async (groupId) => {
    try {
      await http.post(`${BASE_URL}/api/groups/${groupId}/leave`);

      const { groups, selectedGroup } = get();
      const updatedGroups = groups.filter((g) => g._id !== groupId);

      set({ groups: updatedGroups });

      if (selectedGroup?._id === groupId) {
        set({ selectedGroup: null, groupMessages: [] });
      }

      console.log("✅ Left group successfully");
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      throw error;
    }
  },

  // Update group
  updateGroup: async (groupId, updates) => {
    try {
      const res = await http.put(`${BASE_URL}/api/groups/${groupId}`, updates);

      const { groups, selectedGroup } = get();
      const updatedGroups = groups.map((g) =>
        g._id === groupId ? res.data : g
      );

      set({ groups: updatedGroups });

      if (selectedGroup?._id === groupId) {
        set({ selectedGroup: res.data });
      }

      console.log("✅ Group updated");
      return res.data;
    } catch (error) {
      console.error("❌ Error updating group:", error);
      throw error;
    }
  },

  // Delete group
  deleteGroup: async (groupId) => {
    try {
      await http.delete(`${BASE_URL}/api/groups/${groupId}`);

      const { groups, selectedGroup } = get();
      const updatedGroups = groups.filter((g) => g._id !== groupId);

      set({ groups: updatedGroups });

      if (selectedGroup?._id === groupId) {
        set({ selectedGroup: null, groupMessages: [] });
      }

      console.log("✅ Group deleted");
    } catch (error) {
      console.error("❌ Error deleting group:", error);
      throw error;
    }
  },

  // Set selected group
  setSelectedGroup: (group) => {
    set({ selectedGroup: group, groupMessages: [] });
    if (group) {
      get().getGroupMessages(group._id);
    }
  },

  // Clear selected group
  clearSelectedGroup: () => {
    set({ selectedGroup: null, groupMessages: [] });
  },
}));
