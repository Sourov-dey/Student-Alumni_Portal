// frontend/src/context/AuthContext.jsx - FIXED VERSION
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import http, { attachToken } from "../api/http";
import { io } from "socket.io-client";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

const AuthContext = createContext(null);

const BASE_URL = "http://localhost:5000";
const TOKEN_KEY = "au_token";
const USER_KEY = "au_user";

export function AuthProvider({ children }) {
  const socketRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  /* =====================================================
     🔥 REMOVED - No longer needed with interceptor
  ===================================================== */
  // The http.js interceptor now handles this automatically
  
  /* =====================================================
     🔄 HYDRATE USER FROM TOKEN (ON REFRESH)
  ===================================================== */
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      // If no token, just finish loading
      if (!token) {
        setLoading(false);
        return;
      }

      // If we already have user data, no need to fetch
      if (user) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔄 Hydrating user from token...");
        const res = await http.get("/api/auth/me");
        if (cancelled) return;

        const me = res.data?.user || res.data;
        console.log("✅ User hydrated:", me.email);
        
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch (err) {
        console.warn("❌ Token invalid, logging out");
        logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token]); // Only depend on token

  /* =====================================================
     🔌 SOCKET.IO CONNECTION (AUTH-SAFE)
  ===================================================== */
  useEffect(() => {
    if (!user?._id || !token) return;

    console.log("🔌 Connecting socket for user:", user._id);

    const socket = io(BASE_URL, {
      auth: { token }, // ✅ AUTH VIA JWT
      query: { userId: user._id },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      useChatStore.getState().setSocket(socket);
      useGroupStore.getState().setSocket(socket);
    });

    socket.on("getOnlineUsers", (userIds) => {
      useChatStore.getState().setOnlineUsers(userIds);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    return () => {
      console.log("🔌 Cleaning up socket");
      socket.disconnect();
      socketRef.current = null;
      useChatStore.getState().setSocket(null);
      useGroupStore.getState().setSocket(null);
    };
  }, [user, token]);

  /* =====================================================
     ✅ LOGIN - FIXED
  ===================================================== */
  const login = (jwtToken, userData) => {
  console.log("🔐 Login called");
  console.log("  Token:", jwtToken ? "✅ Present" : "❌ Missing");
  console.log("  User:", userData?.email);

  // ✅ CRITICAL FIX: Save to localStorage FIRST and WAIT
  try {
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log("✅ Token saved to localStorage");
  } catch (err) {
    console.error("❌ Failed to save to localStorage:", err);
    return; // Abort if storage fails
  }

  // ✅ THEN update state (this triggers socket connection)
  setToken(jwtToken);
  setUser(userData);
  
  console.log("✅ Login complete");
};

  /* =====================================================
     🚪 LOGOUT
  ===================================================== */
  const logout = () => {
    console.log("🚪 Logout called");
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken(null);
    setUser(null);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    console.log("✅ Logout complete");
  };

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
