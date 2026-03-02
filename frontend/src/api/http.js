// frontend/src/api/http.js - FIXED VERSION
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ✅ REQUEST INTERCEPTOR - Dynamically adds token to EVERY request
http.interceptors.request.use(
  (config) => {
    // Read token from localStorage on EVERY request
    const token = localStorage.getItem("au_token");
    console.log("📡 HTTP Request Interceptor:");
    console.log("  URL:", config.url);
    console.log("  Token:", token ? "✅ Found" : "❌ Missing");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("  ✅ Authorization header added");
    } else {
      console.warn("  ⚠️ No token found in localStorage!");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR - Handle 401 errors globally
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("🔴 401 Unauthorized - Token may be invalid or missing");
      console.error("  Request URL:", error.config?.url);
      console.error("  Headers:", error.config?.headers);
      // Optional: Auto-logout on 401
      // localStorage.removeItem("au_token");
      // localStorage.removeItem("au_user");
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Keep this function for manual token updates (if needed)
export const attachToken = (newToken) => {
  if (newToken) {
    localStorage.setItem("au_token", newToken);
    http.defaults.headers.common.Authorization = `Bearer ${newToken}`;
  } else {
    localStorage.removeItem("au_token");
    delete http.defaults.headers.common.Authorization;
  }
};

export default http;