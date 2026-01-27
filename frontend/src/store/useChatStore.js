// frontend/src/store/useChatStore.js - FIXED VERSION
import { create } from "zustand";
import http from "../api/http";

// Get hidden users from localStorage
const getHiddenUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("hiddenChatUsers") || "[]");
  } catch {
    return [];
  }
};

// Save hidden users to localStorage
const saveHiddenUsers = (users) => {
  localStorage.setItem("hiddenChatUsers", JSON.stringify(users));
};

// Get pending conversations from localStorage
const getPendingConversations = () => {
  try {
    return JSON.parse(localStorage.getItem("pendingConversations") || "[]");
  } catch {
    return [];
  }
};

// Save pending conversations to localStorage
const savePendingConversations = (users) => {
  localStorage.setItem("pendingConversations", JSON.stringify(users));
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  conversationUsers: [],
  pendingConversations: getPendingConversations(),
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isConversationUsersLoading: false,
  socket: null,
  onlineUsers: [],
  hiddenUsers: getHiddenUsers(),

  setSocket: (socket) => {
    set({ socket });

    if (socket) {
      socket.on("newConversation", async (userData) => {
        console.log("🆕 New conversation notification received:", userData);

        try {
          const res = await http.get("/api/messages/conversations");
          console.log("🔄 Reloaded conversation users after notification");

          const pendingConversations = get().pendingConversations;
          const dbUserIds = res.data.map((u) => u._id);
          const uniquePending = pendingConversations.filter(
            (u) => !dbUserIds.includes(u._id)
          );

          set({ conversationUsers: [...res.data, ...uniquePending] });
        } catch (error) {
          console.error("❌ Error reloading conversations:", error);
        }
      });

      socket.on("newMessage", async (newMessage) => {
        console.log("📨 New message received via socket:", newMessage);

        const { conversationUsers, selectedUser } = get();
        const isFromCurrentChat = selectedUser?._id === newMessage.senderId;

        if (!isFromCurrentChat) {
          try {
            const res = await http.get("/api/messages/conversations");

            const pendingConversations = get().pendingConversations;
            const dbUserIds = res.data.map((u) => u._id);
            const uniquePending = pendingConversations.filter(
              (u) => !dbUserIds.includes(u._id)
            );

            set({ conversationUsers: [...res.data, ...uniquePending] });
            console.log("🔄 Conversation list updated due to new message");
          } catch (error) {
            console.error("❌ Error updating conversation list:", error);
          }
        }
      });
    }
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      console.log("🔥 Fetching users for chat search from /api/users/for-chat");

      const res = await http.get("/api/users/for-chat");

      console.log(`✅ Fetched ${res.data.length} users for search`);
      console.log(
        "👥 Users:",
        res.data.map((u) => `${u.name} (${u.email})`).join(", ")
      );

      if (!res.data || !Array.isArray(res.data)) {
        console.error("❌ Invalid response from server:", res.data);
        set({ users: [], isUsersLoading: false });
        return;
      }

      set({ users: res.data, isUsersLoading: false });
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // ✅ ADDED: More helpful error message
      if (error.response?.status === 401) {
        console.error("🔴 AUTHENTICATION ERROR: Token may be invalid or missing");
        console.error("🔍 Check localStorage for 'au_token'");
      }
      
      set({ isUsersLoading: false, users: [] });
    }
  },

  getConversationUsers: async () => {
  set({ isConversationUsersLoading: true });
  try {
    console.log("💬 Fetching conversation users...");
    
    // 🔍 DEBUG: Check token before request
    const token = localStorage.getItem("au_token");
    console.log("  Token in localStorage:", token ? "✅ Present" : "❌ Missing");
    
    const res = await http.get("/api/messages/conversations");
    console.log("✅ Conversation users fetched from DB:", res.data.length);

    const pendingConversations = get().pendingConversations;
    console.log("📋 Pending conversations from localStorage:", pendingConversations.length);

    const dbUserIds = res.data.map((u) => u._id);
    const uniquePending = pendingConversations.filter(
      (u) => !dbUserIds.includes(u._id)
    );

    const allConversations = [...res.data, ...uniquePending];
    console.log("✅ Total conversation users:", allConversations.length);

    set({ conversationUsers: allConversations });
  } catch (error) {
    console.error("❌ Error fetching conversation users:", error);
    
    // ✅ ENHANCED ERROR LOGGING
    if (error.response?.status === 401) {
      console.error("🔴 AUTHENTICATION ERROR: Token may be invalid or missing");
      console.error("📍 Check these things:");
      console.error("  1. localStorage has 'au_token'?", !!localStorage.getItem("au_token"));
      console.error("  2. Token value:", localStorage.getItem("au_token")?.substring(0, 20) + "...");
      console.error("  3. Request headers:", error.config?.headers);
    }
  } finally {
    set({ isConversationUsersLoading: false });
  }
},

  addToConversations: (user) => {
    console.log("🔵 addToConversations called for:", user.name);

    const { conversationUsers, pendingConversations, hiddenUsers } = get();

    if (hiddenUsers.includes(user._id)) {
      console.log("⚠️ User is hidden, removing from hidden list first");
      const newHiddenUsers = hiddenUsers.filter((id) => id !== user._id);
      saveHiddenUsers(newHiddenUsers);
      set({ hiddenUsers: newHiddenUsers });
    }

    const existsInConversations = conversationUsers.some(
      (u) => u._id === user._id
    );

    if (existsInConversations) {
      console.log("ℹ️ User already in conversation list");
      return;
    }

    console.log("➕ Adding user to conversation list NOW");

    const updatedConversations = [...conversationUsers, user];

    const existsInPending = pendingConversations.some(
      (u) => u._id === user._id
    );
    let updatedPending = pendingConversations;

    if (!existsInPending) {
      updatedPending = [...pendingConversations, user];
      savePendingConversations(updatedPending);
      console.log("💾 Saved to localStorage");
    }

    set({
      conversationUsers: updatedConversations,
      pendingConversations: updatedPending,
    });

    console.log(
      "✅ User added successfully. Total conversations:",
      updatedConversations.length
    );
  },

  removeFromPending: (userId) => {
    const { pendingConversations } = get();
    const updated = pendingConversations.filter((u) => u._id !== userId);
    savePendingConversations(updated);
    set({ pendingConversations: updated });
    console.log("🗑️ Removed from pending:", userId);
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await http.get(`/api/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      console.log("📤 Sending message to:", selectedUser._id);

      const res = await http.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      console.log("✅ Message sent successfully");

      set({ messages: [...messages, res.data] });

      get().removeFromPending(selectedUser._id);

      console.log("🔄 Reloading conversation users after send...");
      try {
        const conversationRes = await http.get("/api/messages/conversations");

        const pendingConversations = get().pendingConversations;
        const dbUserIds = conversationRes.data.map((u) => u._id);
        const uniquePending = pendingConversations.filter(
          (u) => !dbUserIds.includes(u._id)
        );

        set({ conversationUsers: [...conversationRes.data, ...uniquePending] });
        console.log("✅ Conversation users reloaded");
      } catch (error) {
        console.error("❌ Error reloading conversation users:", error);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, socket } = get();
    if (!selectedUser || !socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageFromSelectedUser) return;
      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = get().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => {
    console.log("👤 setSelectedUser called:", selectedUser?.name || "null");
    set({ selectedUser });
  },

  deleteChat: (userId) => {
    const {
      hiddenUsers,
      selectedUser,
      conversationUsers,
      pendingConversations,
    } = get();
    const newHiddenUsers = [...hiddenUsers, userId];
    saveHiddenUsers(newHiddenUsers);

    const updatedConversationUsers = conversationUsers.filter(
      (u) => u._id !== userId
    );
    const updatedPending = pendingConversations.filter((u) => u._id !== userId);
    savePendingConversations(updatedPending);

    set({
      hiddenUsers: newHiddenUsers,
      conversationUsers: updatedConversationUsers,
      pendingConversations: updatedPending,
    });

    if (selectedUser?._id === userId) {
      set({ selectedUser: null, messages: [] });
    }

    console.log("🗑️ Chat hidden for user:", userId);
  },

  restoreChat: (userId) => {
    const { hiddenUsers } = get();
    const newHiddenUsers = hiddenUsers.filter((id) => id !== userId);
    saveHiddenUsers(newHiddenUsers);
    set({ hiddenUsers: newHiddenUsers });
    console.log("♻️ Chat restored for user:", userId);
  },

  restoreAllChats: () => {
    saveHiddenUsers([]);
    set({ hiddenUsers: [] });
    console.log("♻️ All chats restored");
  },

  deleteChatWithMessages: async (userId) => {
    try {
      await http.delete(`/api/messages/conversation/${userId}`);

      const {
        hiddenUsers,
        selectedUser,
        conversationUsers,
        pendingConversations,
      } = get();
      const newHiddenUsers = [...hiddenUsers, userId];
      saveHiddenUsers(newHiddenUsers);

      const updatedConversationUsers = conversationUsers.filter(
        (u) => u._id !== userId
      );
      const updatedPending = pendingConversations.filter(
        (u) => u._id !== userId
      );
      savePendingConversations(updatedPending);

      set({
        hiddenUsers: newHiddenUsers,
        conversationUsers: updatedConversationUsers,
        pendingConversations: updatedPending,
        messages: [],
      });

      if (selectedUser?._id === userId) {
        set({ selectedUser: null });
      }

      console.log("🗑️ Chat and messages deleted");
    } catch (error) {
      console.error("❌ Error deleting chat:", error);
      throw error;
    }
  },
}));