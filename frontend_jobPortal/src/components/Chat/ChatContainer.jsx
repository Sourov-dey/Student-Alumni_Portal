// frontend/src/components/chat/ChatContainer.jsx
import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuth } from "../../context/AuthContext";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./MessageSkeleton";

// Helper function to format message time
const formatMessageTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const ChatContainer = ({ onOpenProfile }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { user: authUser } = useAuth();
  const messageEndRef = useRef(null);

  useEffect(() => {
    console.log("💬 ChatContainer mounted");
    console.log("👤 Selected user:", selectedUser);
    
    if (!selectedUser?._id) {
      console.log("❌ No selected user ID");
      return;
    }

    console.log("📡 Fetching messages for:", selectedUser._id);
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => {
      console.log("🔌 Unsubscribing from messages");
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Guard: Check if selectedUser exists
  if (!selectedUser) {
    console.log("❌ ChatContainer: No selected user");
    return (
      <div className="chat-no-user">
        <p>No user selected</p>
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="chat-main">
        <ChatHeader onOpenProfile={onOpenProfile} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="chat-main">
      <ChatHeader onOpenProfile={onOpenProfile} />

      <div className="chat-messages">
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.senderId === authUser._id ? "message-sent" : "message-received"}`}
              ref={messageEndRef}
            >
              <div className="message-avatar">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.avatarUrl || "/avatar.png"
                      : selectedUser.avatarUrl || "/avatar.png"
                  }
                  alt="profile pic"
                  className="avatar-img"
                />
              </div>
              <div className="message-content">
                <div className="message-time">
                  {formatMessageTime(message.createdAt)}
                </div>
                <div className="message-bubble">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="message-image"
                    />
                  )}
                  {message.text && <p className="message-text">{message.text}</p>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;