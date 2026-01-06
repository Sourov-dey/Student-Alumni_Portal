// frontend/src/components/chat/ChatSidebar.jsx
import React, { useEffect, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuth } from "../../context/AuthContext";
import SidebarSkeleton from "./SidebarSkeleton";
import { Users, MoreVertical, Trash2, X, Search } from "lucide-react";

const ChatSidebar = ({ onOpenProfile }) => {
  const {
    getUsers,
    users,
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

  const { user: authUser } = useAuth();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Load conversation users on mount
  useEffect(() => {
    console.log("🔄 ChatSidebar mounted, loading conversation users...");
    getConversationUsers();
  }, []);

  // Debug: Log conversation users whenever they change
  useEffect(() => {
    console.log("📊 Conversation users updated:", conversationUsers.length);
    console.log(
      "👥 Users in sidebar:",
      conversationUsers.map((u) => u.name)
    );
  }, [conversationUsers]);

  // Filter conversation users (exclude hidden)
  const filteredConversationUsers = conversationUsers.filter(
    (user) => !hiddenUsers?.includes(user._id)
  );

  console.log(
    "🔍 Filtered conversation users:",
    filteredConversationUsers.length
  );

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    console.log("🔍 Searching for:", searchQuery);

    // Get all users if not already loaded
    if (users.length === 0) {
      await getUsers();
    }

    // Filter users based on search query
    const query = searchQuery.toLowerCase().trim();
    const results = users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });

    console.log("✅ Search results:", results.length);
    setSearchResults(results);
  };

  // CRITICAL: Handle selecting a user from search results
  const handleSelectSearchResult = (user) => {
    console.log("🎯 User clicked from search:", user.name, "ID:", user._id);

    // STEP 1: Add to conversations FIRST (this updates the sidebar)
    addToConversations(user);

    // STEP 2: Set as selected user (this opens the chat)
    setSelectedUser(user);

    // STEP 3: Close search UI
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    console.log("✅ User selection complete");
  };

  const handleMenuToggle = (e, userId) => {
    e.stopPropagation();
    setMenuOpenFor(menuOpenFor === userId ? null : userId);
  };

  const handleDeleteClick = (e, user) => {
    e.stopPropagation();
    setMenuOpenFor(null);
    setDeleteConfirm(user);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteChat(deleteConfirm._id);
      if (selectedUser?._id === deleteConfirm._id) {
        setSelectedUser(null);
      }
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenFor(null);
    if (menuOpenFor) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpenFor]);

  // Handle search on Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && showSearch && searchQuery.trim()) {
        e.preventDefault();
        handleSearch();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showSearch, searchQuery]);

  if (isConversationUsersLoading) {
    console.log("⏳ Loading conversation users...");
    return <SidebarSkeleton />;
  }

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div className="sidebar-title">
            <Users className="sidebar-icon" />
            <span className="sidebar-title-text">Messages</span>
          </div>

          {/* Profile Button */}
          <button
            className="sidebar-profile-btn"
            onClick={onOpenProfile}
            title="My Profile"
          >
            <img
              src={authUser?.avatarUrl || "/avatar.png"}
              alt="My Profile"
              className="sidebar-profile-img"
            />
          </button>
        </div>

        {/* Search Button */}
        <div className="sidebar-search-section">
          <button
            className="search-toggle-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={12} />
            <span>Search Users</span>
          </button>
        </div>

        {/* Search Input (shown when search is active) */}
        {showSearch && (
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button className="search-btn" onClick={handleSearch}>
              <Search size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-users">
        {/* Show search results if searching */}
        {showSearch && searchResults.length > 0 ? (
          <>
            <div className="search-results-header">
              <span>Search Results ({searchResults.length})</span>
            </div>
            {searchResults.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelectSearchResult(user)}
                className="user-item"
              >
                <div className="user-avatar-wrapper">
                  <img
                    src={user.avatarUrl || "/avatar.png"}
                    alt={user.name}
                    className="user-avatar"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="online-indicator" />
                  )}
                </div>

                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </button>
            ))}
          </>
        ) : showSearch && searchQuery ? (
          <div className="no-users">No users found</div>
        ) : (
          /* Show conversation users (people you've chatted with or clicked on) */
          <>
            {filteredConversationUsers.length > 0 ? (
              filteredConversationUsers.map((user) => (
                <div key={user._id} className="user-item-wrapper">
                  <button
                    onClick={() => {
                      console.log("📱 Conversation user clicked:", user.name);
                      setSelectedUser(user);
                    }}
                    className={`user-item ${
                      selectedUser?._id === user._id ? "user-item-active" : ""
                    }`}
                  >
                    <div className="user-avatar-wrapper">
                      <img
                        src={user.avatarUrl || "/avatar.png"}
                        alt={user.name}
                        className="user-avatar"
                      />
                      {onlineUsers.includes(user._id) && (
                        <span className="online-indicator" />
                      )}
                    </div>

                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-status">
                        {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                      </div>
                    </div>
                  </button>

                  {/* More Options Button */}
                  <button
                    className="user-menu-btn"
                    onClick={(e) => handleMenuToggle(e, user._id)}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpenFor === user._id && (
                    <div
                      className="user-dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="dropdown-item delete-item"
                        onClick={(e) => handleDeleteClick(e, user)}
                      >
                        <Trash2 size={16} />
                        <span>Delete Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-users">
                <p>No conversations yet</p>
                <p className="no-users-hint">
                  Use the search button above to find users and start chatting
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cancelDelete}>
              <X size={20} />
            </button>
            <div className="delete-modal-content">
              <div className="delete-modal-icon">
                <Trash2 size={32} />
              </div>
              <h3>Delete Chat?</h3>
              <p>
                Delete chat with <strong>{deleteConfirm.name}</strong>? This
                will remove them from your chat list.
              </p>
              <div className="delete-modal-actions">
                <button className="btn-cancel" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="btn-delete" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;
