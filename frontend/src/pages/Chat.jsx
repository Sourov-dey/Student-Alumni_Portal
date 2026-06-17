// frontend/src/pages/Chat.jsx - UPDATED VERSION
import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "../context/AuthContext";
import ChatSidebar from "../components/Chat/ChatSidebar";
import NoChatSelected from "../components/Chat/NoChatSelected";
import ChatContainer from "../components/Chat/ChatContainer";
import ChatProfilePage from "../components/Chat/ChatProfilePage";
import GroupChatInterface from "../components/groupChat/GroupChatInterface";
import { MessageSquare, Users } from "lucide-react";
import "../styles/pages/chat.css";

export default function Chat() {
  const { selectedUser, getConversationUsers } = useChatStore();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("direct"); // 'direct' or 'groups'

  useEffect(() => {
    console.log("💬 Chat page mounted");
    console.log("👤 Auth user:", user);

    // Load conversation users on mount
    if (activeTab === "direct") {
      getConversationUsers();
    }
  }, [user, activeTab]);

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };
  // const handleDebug = async () => {
  //     debugAuthState();
  //     const isValid = await verifyToken();
  //     alert(`Token valid: ${isValid}`);
  //   };
  return (
    <div className="chat-page">
      {/* Tab Navigation */}
      {/* <button 
        onClick={handleDebug}
        style={{
          position: 'fixed',
          top: 80,
          right: 20,
          zIndex: 9999,
          padding: '10px 20px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🔍 Debug Auth
      </button> */}

      <div className="chat-tabs-container">
        <div className="chat-tabs">
          <button
            className={`chat-tab ${activeTab === "direct" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("direct");
              setShowProfile(false);
            }}
          >
            <MessageSquare size={20} />
            <span>Direct Messages</span>
          </button>
          <button
            className={`chat-tab ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("groups");
              setShowProfile(false);
            }}
          >
            <Users size={20} />
            <span>Groups</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="chat-content">
        {activeTab === "direct" ? (
          // Direct Messages (existing functionality)
          <div className="chat-container">
            <div className="chat-wrapper">
              <ChatSidebar onOpenProfile={handleOpenProfile} />

              {showProfile ? (
                <ChatProfilePage onBack={handleCloseProfile} />
              ) : !selectedUser ? (
                <NoChatSelected onOpenProfile={handleOpenProfile} />
              ) : (
                <ChatContainer onOpenProfile={handleOpenProfile} />
              )}
            </div>
          </div>
        ) : (
          // Group Chat (new functionality)
          <GroupChatInterface />
        )}
      </div>
    </div>
  );
}
