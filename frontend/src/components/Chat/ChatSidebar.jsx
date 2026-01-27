// frontend/src/components/chat/ChatSidebar.jsx
import React, { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuth } from "../../context/AuthContext";
import SidebarSkeleton from "./SidebarSkeleton";
import { Users, MoreVertical, Trash2, X, Search } from "lucide-react";
import http from "../../api/http";


const ChatSidebar = ({ onOpenProfile }) => {
  const {
    selectedUser,
    setSelectedUser,
    onlineUsers,
    deleteChat,
    hiddenUsers,
    getConversationUsers,
    conversationUsers,
    isConversationUsersLoading,
    addToConversations,
  } = useChatStore();

  const { user: authUser, token } = useAuth();

  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  /* =====================================================
     LOAD CONVERSATION USERS
  ===================================================== */
  useEffect(() => {
    getConversationUsers();
  }, []);

  /* =====================================================
     🔍 BACKEND SEARCH (THE REAL FIX)
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
      console.log("🔍 Calling backend search:", searchQuery);

      const res = await http.get(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        { signal: controller.signal }
      );

      console.log("✅ Search success:", res.data);
      setSearchResults(res.data);
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
    addToConversations(user);
    setSelectedUser(user);

    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
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

            {searchResults.map((user) => (
              <button
                key={user._id}
                className="user-item"
                onClick={() => handleSelectSearchResult(user)}
              >
                <img
                  src={user.avatarUrl || "/avatar.png"}
                  alt={user.name}
                  className="user-avatar"
                />
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </button>
            ))}
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
