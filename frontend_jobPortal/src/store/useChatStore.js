// frontend/src/store/useChatStore.js
import { create } from 'zustand';
import http from '../api/http';

const BASE_URL = 'http://localhost:5000';

// Get hidden users from localStorage
const getHiddenUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('hiddenChatUsers') || '[]');
  } catch {
    return [];
  }
};

// Save hidden users to localStorage
const saveHiddenUsers = (users) => {
  localStorage.setItem('hiddenChatUsers', JSON.stringify(users));
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,
  onlineUsers: [],
  hiddenUsers: getHiddenUsers(), // Users hidden from sidebar

  setSocket: (socket) => set({ socket }),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      console.log('📡 Fetching users...');
      const res = await http.get(`${BASE_URL}/api/messages/users`);
      console.log('✅ Users fetched:', res.data);
      set({ users: res.data });
    } catch (error) {
      console.error('❌ Error fetching users:', error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await http.get(`${BASE_URL}/api/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await http.post(
        `${BASE_URL}/api/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, socket } = get();
    if (!selectedUser || !socket) return;

    socket.on('newMessage', (newMessage) => {
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageFromSelectedUser) return;

      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = get().socket;
    if (socket) {
      socket.off('newMessage');
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Delete/Hide chat - hides user from sidebar (client-side only)
  deleteChat: (userId) => {
    const { hiddenUsers, selectedUser } = get();
    const newHiddenUsers = [...hiddenUsers, userId];
    saveHiddenUsers(newHiddenUsers);
    
    set({ hiddenUsers: newHiddenUsers });
    
    // If deleted user was selected, clear selection
    if (selectedUser?._id === userId) {
      set({ selectedUser: null });
    }
    
    console.log('🗑️ Chat hidden for user:', userId);
  },

  // Restore a hidden chat
  restoreChat: (userId) => {
    const { hiddenUsers } = get();
    const newHiddenUsers = hiddenUsers.filter(id => id !== userId);
    saveHiddenUsers(newHiddenUsers);
    
    set({ hiddenUsers: newHiddenUsers });
    console.log('♻️ Chat restored for user:', userId);
  },

  // Clear all hidden users (restore all chats)
  restoreAllChats: () => {
    saveHiddenUsers([]);
    set({ hiddenUsers: [] });
    console.log('♻️ All chats restored');
  },

  // Delete chat with messages (server-side deletion)
  deleteChatWithMessages: async (userId) => {
    try {
      await http.delete(`${BASE_URL}/api/messages/conversation/${userId}`);
      
      const { hiddenUsers, selectedUser } = get();
      const newHiddenUsers = [...hiddenUsers, userId];
      saveHiddenUsers(newHiddenUsers);
      
      set({ 
        hiddenUsers: newHiddenUsers,
        messages: [] // Clear messages if viewing this conversation
      });
      
      if (selectedUser?._id === userId) {
        set({ selectedUser: null });
      }
      
      console.log('🗑️ Chat and messages deleted for user:', userId);
    } catch (error) {
      console.error('❌ Error deleting chat:', error);
      throw error;
    }
  },
}));