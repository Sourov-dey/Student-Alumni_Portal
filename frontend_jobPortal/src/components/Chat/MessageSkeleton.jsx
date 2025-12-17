// frontend/src/components/chat/MessageSkeleton.jsx
import React from "react";

const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="chat-messages">
      {skeletonMessages.map((_, idx) => (
        <div 
          key={idx} 
          className={`message ${idx % 2 === 0 ? "message-received" : "message-sent"}`}
        >
          <div className="message-avatar">
            <div className="skeleton avatar-skeleton" />
          </div>

          <div className="message-content">
            <div className="skeleton time-skeleton" />
            <div className="skeleton bubble-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;