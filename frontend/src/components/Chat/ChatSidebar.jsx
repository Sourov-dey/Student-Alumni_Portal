// frontend/src/components/chat/ChatSidebar.jsx
import React, { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useConnectionStore } from "../../store/useConnectionStore";
import { useAuth } from "../../context/AuthContext";
import SidebarSkeleton from "./SidebarSkeleton";
import { Users, X, Search, UserPlus } from "lucide-react";
import http from "../../api/http";
import toast from "react-hot-toast";


const ChatSidebar = ({ onOpenProfile }) => {
  const {
    selectedUser,
    setSelectedUser,
    onlineUsers,
    hiddenUsers,
    getConversationUsers,
    conversationUsers,
    isConversationUsersLoading,
    addToConversations,
  } = useChatStore();

  const { checkStatus, getStatus, sendRequest } = useConnectionStore();
  const { user: authUser } = useAuth();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [connectingTo, setConnectingTo] = useState(null);

  const isStudent = authUser?.role === "student";

  /* =====================================================
     LOAD CONVERSATION USERS
  ===================================================== */
  useEffect(() => {
    getConversationUsers();
  }, []);

  /* =====================================================
     🔍 BACKEND SEARCH
  ===================================================== */
  useEffect(() => {
    if (!showSearch || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();

    const searchUsers = async () => {
      try {
        setSearchLoading(true);

        const res = await http.get(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );

        setSearchResults(res.data);

        // Check connection status for alumni results (for students)
        if (isStudent) {
          const alumniIds = res.data
            .filter((u) => u.role === "alumni")
            .map((u) => u._id);
          for (const id of alumniIds) {
            checkStatus(id);
          }
        }
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("❌ Search failed:", err);
          setSearchResults([]);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    const delay = setTimeout(searchUsers, 300);
    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [searchQuery, showSearch]);

  /* =====================================================
     HANDLERS
  ===================================================== */
  const handleSelectSearchResult = (user) => {
    // If student trying to chat with an alumni, check connection
    if (isStudent && user.role === "alumni") {
      const status = getStatus(user._id);
      if (status !== "accepted") {
        toast.error("Connect with this alumni first. Send a request from the Map or click the + icon.");
        return;
      }
    }

    addToConversations(user);
    setSelectedUser(user);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleConnectFromChat = async (alumniId) => {
    setConnectingTo(alumniId);
    try {
      await sendRequest(alumniId);
      toast.success("Connection request sent!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send request";
      toast.error(msg);
    } finally {
      setConnectingTo(null);
    }
  };

  const filteredConversationUsers = conversationUsers.filter(
    (u) => !hiddenUsers?.includes(u._id)
  );

  if (isConversationUsersLoading) {
    return <SidebarSkeleton />;
  }

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div className="sidebar-title">
            <Users className="sidebar-icon" />
            <span>Messages</span>
          </div>

          <button
            className="sidebar-profile-btn"
            onClick={onOpenProfile}
          >
            <img
              src={authUser?.avatarUrl || "/avatar.png"}
              alt="Profile"
            />
          </button>
        </div>

        <button
          className="search-toggle-btn"
          onClick={() => {
            setShowSearch(!showSearch);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <Search size={14} />
          <span>Search Users</span>
        </button>

        {showSearch && (
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button onClick={() => setShowSearch(false)}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-users">
        {showSearch ? (
          <>
            {searchLoading && <p className="muted">Searching...</p>}

            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <div className="no-users">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            )}

            {searchResults.map((user) => {
              const isAlumniTarget = isStudent && user.role === "alumni";
              const connStatus = isAlumniTarget ? getStatus(user._id) : "accepted";
              const isConnected = connStatus === "accepted";
              const isPending = connStatus === "pending";

              return (
                <button
                  key={user._id}
                  className={`user-item ${isAlumniTarget && !isConnected ? "user-item-locked" : ""}`}
                  onClick={() => handleSelectSearchResult(user)}
                  title={isAlumniTarget && !isConnected ? "Connect with this alumni first" : ""}
                >
                  <img
                    src={user.avatarUrl || "/avatar.png"}
                    alt={user.name}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">
                      {user.name}
                      {isAlumniTarget && isConnected && (
                        <span className="chat-conn-badge connected">✓</span>
                      )}
                    </div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  {isAlumniTarget && !isConnected && (
                    <div className="chat-conn-action" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <span className="chat-conn-badge pending">Pending</span>
                      ) : (
                        <button
                          className="chat-connect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnectFromChat(user._id);
                          }}
                          disabled={connectingTo === user._id}
                          title="Send connection request"
                        >
                          <UserPlus size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </>
        ) : (
          <>
            {filteredConversationUsers.length === 0 ? (
              <div className="no-users">
                <p>No conversations yet</p>
                <p className="no-users-hint">
                  Use search to start chatting
                </p>
              </div>
            ) : (
              filteredConversationUsers.map((user) => (
                <button
                  key={user._id}
                  className={`user-item ${
                    selectedUser?._id === user._id ? "active" : ""
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <img
                    src={user.avatarUrl || "/avatar.png"}
                    alt={user.name}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-status">
                      {onlineUsers.includes(user._id)
                        ? "Online"
                        : "Offline"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
