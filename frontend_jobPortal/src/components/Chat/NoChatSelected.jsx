// frontend/src/components/chat/NoChatSelected.jsx
import React from "react";
import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="no-chat-selected">
      <div className="no-chat-content">
        {/* Icon Display */}
        <div className="no-chat-icon-wrapper">
          <div className="no-chat-icon">
            <MessageSquare className="icon" />
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="no-chat-title">Welcome to Chat!</h2>
        <p className="no-chat-subtitle">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;