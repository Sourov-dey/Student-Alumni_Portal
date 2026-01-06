// frontend/src/components/groupChat/GroupChatContainer.jsx - FIXED
import React, { useEffect, useRef } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuth } from "../../context/AuthContext";
import GroupMessageInput from "./GroupMessageInput";
import { Users, Settings, UserPlus } from "lucide-react";

const formatMessageTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function GroupChatContainer({ onShowDetails, onAddMembers }) {
  const { selectedGroup, groupMessages, getGroupMessages, isMessagesLoading } =
    useGroupStore();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedGroup) {
      console.log("📬 Loading messages for group:", selectedGroup.name);
      console.log("👥 Current member count:", selectedGroup.members.length);
      getGroupMessages(selectedGroup._id);
    }
  }, [selectedGroup, getGroupMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  // ✅ Log when selectedGroup changes (for debugging)
  useEffect(() => {
    if (selectedGroup) {
      console.log("🔄 Selected group updated:", {
        name: selectedGroup.name,
        memberCount: selectedGroup.members.length,
        members: selectedGroup.members.map(m => m.name)
      });
    }
  }, [selectedGroup]);

  if (!selectedGroup) return null;

  const isAdmin = selectedGroup.admin._id === user._id;

  return (
    <div className="group-chat-container">
      {/* Header - ✅ This will re-render when selectedGroup.members changes */}
      <div className="group-chat-header">
        <div className="group-chat-header-info">
          <div className="group-header-avatar">
            {selectedGroup.avatar ? (
              <img src={selectedGroup.avatar} alt={selectedGroup.name} />
            ) : (
              <div className="group-avatar-placeholder">
                <Users size={24} />
              </div>
            )}
          </div>
          <div className="group-header-text">
            <h3 className="group-header-name">{selectedGroup.name}</h3>
            {/* ✅ CRITICAL: This will update automatically when selectedGroup changes */}
            <p className="group-header-members">
              {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="group-chat-header-actions">
          {isAdmin && (
            <button
              className="group-header-btn"
              onClick={onAddMembers}
              title="Add Members"
            >
              <UserPlus size={20} />
            </button>
          )}
          <button
            className="group-header-btn"
            onClick={onShowDetails}
            title="Group Details"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="group-messages">
        {isMessagesLoading ? (
          <div className="group-messages-loading">Loading messages...</div>
        ) : groupMessages.length === 0 ? (
          <div className="no-group-messages">
            <Users size={48} />
            <p>No messages yet</p>
            <p className="text-muted">Be the first to send a message!</p>
          </div>
        ) : (
          groupMessages.map((message) => {
            const isOwnMessage = message.sender._id === user._id;
            const isSystem = message.messageType === "system";

            if (isSystem) {
              return (
                <div key={message._id} className="system-message">
                  <span>{message.systemMessage}</span>
                </div>
              );
            }

            return (
              <div
                key={message._id}
                className={`group-message ${isOwnMessage ? "own-message" : ""}`}
              >
                {!isOwnMessage && (
                  <div className="message-avatar">
                    <img
                      src={message.sender.avatarUrl || "/avatar.png"}
                      alt={message.sender.name}
                    />
                  </div>
                )}

                <div className="message-content">
                  {!isOwnMessage && (
                    <div className="message-sender-name">
                      {message.sender.name}
                    </div>
                  )}
                  <div className="message-bubble">
                    {message.image && (
                      <img
                        src={message.image}
                        alt="attachment"
                        className="message-image"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
                  </div>
                  <div className="message-time">
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <GroupMessageInput />
    </div>
  );
}