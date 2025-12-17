// frontend/src/components/chat/ChatSidebar.jsx
import React, { useEffect, useState } from "react"; 
import { useChatStore } from "../../store/useChatStore"; 
import { useAuth } from "../../context/AuthContext"; 
import SidebarSkeleton from "./SidebarSkeleton"; 
import { Users, MoreVertical, Trash2, X } from "lucide-react"; 

const ChatSidebar = ({ onOpenProfile }) => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    onlineUsers,
    deleteChat,
    hiddenUsers 
  } = useChatStore();
  const { user: authUser } = useAuth();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState(null); // Track which user's menu is open
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Track delete confirmation modal

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Filter out hidden users and apply online filter
  const filteredUsers = users
    .filter((user) => !hiddenUsers?.includes(user._id))
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

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
      // If the deleted user was selected, clear selection
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
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpenFor]);

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div className="sidebar-title">
            <Users className="sidebar-icon" />
            <span className="sidebar-title-text">Contacts</span>
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
        
        <div className="sidebar-filter">
          <label className="filter-label">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="filter-checkbox"
            />
            <span className="filter-text">Show online only</span>
          </label>
          <span className="online-count">
            ({onlineUsers.length > 0 ? onlineUsers.length - 1 : 0} online)
          </span>
        </div>
      </div>

      <div className="sidebar-users">
        {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user._id} className="user-item-wrapper">
              <button
                onClick={() => setSelectedUser(user)}
                className={`user-item ${selectedUser?._id === user._id ? "user-item-active" : ""}`}
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
                <div className="user-dropdown-menu" onClick={(e) => e.stopPropagation()}>
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
            {showOnlineOnly ? "No online users" : "No users found"}
          </div>
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
                Delete chat with <strong>{deleteConfirm.name}</strong>? 
                This will remove them from your chat list.
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