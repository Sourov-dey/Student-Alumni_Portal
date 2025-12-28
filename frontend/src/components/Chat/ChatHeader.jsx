// frontend/src/components/chat/ChatHeader.jsx
import React from "react";
import { X, User } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

const ChatHeader = ({ onOpenProfile }) => {
  const { selectedUser, setSelectedUser, onlineUsers } = useChatStore();

  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <div className="chat-header-user">
          {/* Avatar */}
          <div className="chat-header-avatar">
            <img 
              src={selectedUser.avatarUrl || "/avatar.png"} 
              alt={selectedUser.name}
              className="avatar-img"
            />
          </div>

          {/* User info */}
          <div className="chat-header-info">
            <h3 className="chat-header-name">{selectedUser.name}</h3>
            <p className="chat-header-status">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          {/* Profile button */}
          <button 
            className="chat-header-btn profile-btn" 
            onClick={onOpenProfile}
            title="View Profile"
          >
            <User size={20} />
          </button>
          
          {/* Close button */}
          <button 
            className="chat-header-btn close-btn" 
            onClick={() => setSelectedUser(null)}
            title="Close Chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;