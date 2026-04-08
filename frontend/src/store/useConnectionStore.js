// frontend/src/store/useConnectionStore.js
import { create } from "zustand";
import http from "../api/http";

export const useConnectionStore = create((set, get) => ({
  connections: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  statusCache: {}, // alumniId -> status

  // ── Fetch accepted connections ──
  fetchConnections: async () => {
    try {
      const res = await http.get("/api/connections");
      set({ connections: res.data });
    } catch (error) {
      console.error("❌ Error fetching connections:", error);
    }
  },

  // ── Fetch pending incoming requests (for alumni) ──
  fetchPendingRequests: async () => {
    try {
      const res = await http.get("/api/connections/pending");
      set({ pendingRequests: res.data });
    } catch (error) {
      console.error("❌ Error fetching pending requests:", error);
    }
  },

  // ── Fetch sent requests (for student) ──
  fetchSentRequests: async () => {
    try {
      const res = await http.get("/api/connections/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error("❌ Error fetching sent requests:", error);
    }
  },

  // ── Send connection request ──
  sendRequest: async (alumniId) => {
    try {
      const res = await http.post(`/api/connections/request/${alumniId}`);
      // Update statusCache
      set((state) => ({
        statusCache: { ...state.statusCache, [alumniId]: "pending" },
      }));
      return res.data;
    } catch (error) {
      console.error("❌ Error sending connection request:", error);
      throw error;
    }
  },

  // ── Respond to connection request (alumni) ──
  respondToRequest: async (connectionId, action) => {
    try {
      const res = await http.patch(`/api/connections/${connectionId}/respond`, {
        action,
      });
      // Remove from pending
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (r) => r._id !== connectionId
        ),
      }));
      return res.data;
    } catch (error) {
      console.error("❌ Error responding to connection:", error);
      throw error;
    }
  },

  // ── Check status with a single user ──
  checkStatus: async (userId) => {
    try {
      const res = await http.get(`/api/connections/status/${userId}`);
      set((state) => ({
        statusCache: { ...state.statusCache, [userId]: res.data.status },
      }));
      return res.data;
    } catch (error) {
      console.error("❌ Error checking connection status:", error);
      return { status: "none" };
    }
  },

  // ── Bulk check status for map ──
  checkBulkStatus: async (alumniIds) => {
    if (!alumniIds || alumniIds.length === 0) return;
    try {
      const res = await http.get(
        `/api/connections/check-bulk?ids=${alumniIds.join(",")}`
      );
      set((state) => ({
        statusCache: { ...state.statusCache, ...res.data },
      }));
    } catch (error) {
      console.error("❌ Error checking bulk connection status:", error);
    }
  },

  // ── Remove a connection ──
  removeConnection: async (connectionId) => {
    try {
      await http.delete(`/api/connections/${connectionId}`);
      set((state) => ({
        connections: state.connections.filter(
          (c) => c.connectionId !== connectionId
        ),
      }));
    } catch (error) {
      console.error("❌ Error removing connection:", error);
      throw error;
    }
  },

  // ── Get cached status for a user ──
  getStatus: (userId) => {
    return get().statusCache[userId] || "none";
  },

  // ── Clear cache ──
  clearCache: () => set({ statusCache: {} }),
}));
