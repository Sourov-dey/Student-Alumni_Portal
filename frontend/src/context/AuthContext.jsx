// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import http, { attachToken } from "../api/http";
import { io } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

const AuthContext = createContext(null);

const BASE_URL = "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("au_user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("au_token") || null
  );
  const [loading, setLoading] = useState(false);

  // keep axios auth header in sync with token
  useEffect(() => {
    attachToken(token);
  }, [token]);

  // Socket.IO connection
  useEffect(() => {
    if (user && user._id) {
      console.log("🔌 Initializing socket connection for user:", user._id);

      const socket = io(BASE_URL, {
        query: { userId: user._id },
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
        useChatStore.getState().setSocket(socket);
        useGroupStore.getState().setSocket(socket);
      });

      socket.on("getOnlineUsers", (userIds) => {
        console.log("👥 Online users updated:", userIds.length);
        useChatStore.getState().setOnlineUsers(userIds);
      });

      // CRITICAL: Listen for new messages globally (not just in active chat)
      socket.on("newMessage", async (message) => {
        console.log("📨 Global new message received from:", message.senderId);

        // If message is from someone not in current conversation, reload conversation list
        const { conversationUsers, selectedUser } = useChatStore.getState();

        // Check if message is from current selected user (handled by ChatContainer)
        const isFromCurrentChat = selectedUser?._id === message.senderId;

        if (!isFromCurrentChat) {
          // Check if sender is already in conversation list
          const senderExists = conversationUsers.some(
            (u) => u._id === message.senderId
          );

          if (!senderExists) {
            console.log(
              "🔄 New sender detected, reloading conversation list..."
            );
            // Reload conversation users to include the new sender
            try {
              const res = await http.get(
                `${BASE_URL}/api/messages/conversations`
              );
              useChatStore.setState({ conversationUsers: res.data });
              console.log("✅ Conversation list reloaded with new sender");
            } catch (error) {
              console.error("❌ Error reloading conversations:", error);
            }
          }
        }
      });

      // CRITICAL: Listen for new conversation notifications
      socket.on("newConversation", async (userData) => {
        console.log(
          "🆕 New conversation notification received from:",
          userData.name
        );

        // Always reload conversation users from server when notified
        try {
          const res = await http.get(`${BASE_URL}/api/messages/conversations`);
          useChatStore.setState({ conversationUsers: res.data });
          console.log("✅ Conversation list updated after notification");
        } catch (error) {
          console.error("❌ Error updating conversation list:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
      });

      return () => {
        console.log("🔌 Cleaning up socket connection");
        socket.off("newMessage");
        socket.off("newConversation");
        socket.off("getOnlineUsers");
        socket.disconnect();
        useChatStore.getState().setSocket(null);
        useGroupStore.getState().setSocket(null);
      };
    }
  }, [user]);

  // if we have a token but no user (e.g., after refresh), fetch /me
  useEffect(() => {
    let cancelled = false;

    const hydrateUser = async () => {
      if (!token || user) return;
      setLoading(true);
      try {
        const res = await http.get("/api/auth/me");
        if (cancelled) return;
        const me = res.data?.user || res.data;
        setUser(me);
        localStorage.setItem("au_user", JSON.stringify(me));
      } catch (err) {
        // token invalid -> logout
        console.warn("Auth /me failed, clearing session");
        logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrateUser();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = (jwtToken, userData) => {
    try {
      localStorage.setItem("au_token", jwtToken);
      localStorage.setItem("au_user", JSON.stringify(userData));
    } catch {}
    setToken(jwtToken);
    setUser(userData);
    attachToken(jwtToken);
  };

  const logout = () => {
    try {
      localStorage.removeItem("au_token");
      localStorage.removeItem("au_user");
    } catch {}
    setToken(null);
    setUser(null);
    attachToken(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
