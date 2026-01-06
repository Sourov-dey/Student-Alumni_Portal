// frontend/src/store/useChatStore.js
import { create } from "zustand";
import http from "../api/http";

const BASE_URL = "http://localhost:5000";

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

// Get pending conversations from localStorage (users clicked but no messages yet)
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
          const res = await http.get(`${BASE_URL}/api/messages/conversations`);
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
            const res = await http.get(
              `${BASE_URL}/api/messages/conversations`
            );

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
      console.log("🔡 Fetching all users...");
      const res = await http.get(`${BASE_URL}/api/messages/users`);
      console.log("✅ Users fetched:", res.data.length);
      set({ users: res.data });
    } catch (error) {
      console.error("❌ Error fetching users:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversationUsers: async () => {
    set({ isConversationUsersLoading: true });
    try {
      console.log("💬 Fetching conversation users...");
      const res = await http.get(`${BASE_URL}/api/messages/conversations`);
      console.log("✅ Conversation users fetched from DB:", res.data.length);

      const pendingConversations = get().pendingConversations;
      console.log(
        "📋 Pending conversations from localStorage:",
        pendingConversations.length
      );

      const dbUserIds = res.data.map((u) => u._id);
      const uniquePending = pendingConversations.filter(
        (u) => !dbUserIds.includes(u._id)
      );

      const allConversations = [...res.data, ...uniquePending];
      console.log("✅ Total conversation users:", allConversations.length);

      set({ conversationUsers: allConversations });
    } catch (error) {
      console.error("❌ Error fetching conversation users:", error);
    } finally {
      set({ isConversationUsersLoading: false });
    }
  },

  // Add user to conversations immediately when clicked
  addToConversations: (user) => {
    console.log("🔵 addToConversations called for:", user.name);

    const { conversationUsers, pendingConversations, hiddenUsers } = get();

    // Check if user is hidden
    if (hiddenUsers.includes(user._id)) {
      console.log("⚠️ User is hidden, removing from hidden list first");
      const newHiddenUsers = hiddenUsers.filter((id) => id !== user._id);
      saveHiddenUsers(newHiddenUsers);
      set({ hiddenUsers: newHiddenUsers });
    }

    // Check if already exists in conversation users
    const existsInConversations = conversationUsers.some(
      (u) => u._id === user._id
    );

    if (existsInConversations) {
      console.log("ℹ️ User already in conversation list");
      return;
    }

    console.log("➕ Adding user to conversation list NOW");

    // Add to conversation users immediately
    const updatedConversations = [...conversationUsers, user];

    // Add to pending conversations in localStorage
    const existsInPending = pendingConversations.some(
      (u) => u._id === user._id
    );
    let updatedPending = pendingConversations;

    if (!existsInPending) {
      updatedPending = [...pendingConversations, user];
      savePendingConversations(updatedPending);
      console.log("💾 Saved to localStorage");
    }

    // Update state
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
      const res = await http.get(`${BASE_URL}/api/messages/${userId}`);
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
        `${BASE_URL}/api/messages/send/${selectedUser._id}`,
        messageData
      );

      console.log("✅ Message sent successfully");

      set({ messages: [...messages, res.data] });

      get().removeFromPending(selectedUser._id);

      console.log("🔄 Reloading conversation users after send...");
      try {
        const conversationRes = await http.get(
          `${BASE_URL}/api/messages/conversations`
        );

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
      await http.delete(`${BASE_URL}/api/messages/conversation/${userId}`);

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
