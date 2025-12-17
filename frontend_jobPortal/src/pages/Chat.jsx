// frontend/src/pages/Chat.jsx
import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import NoChatSelected from '../components/chat/NoChatSelected';
import ChatContainer from '../components/chat/ChatContainer';
import ChatProfilePage from '../components/Chat/ChatProfilePage';
import '../styles/pages/chat.css';

export default function Chat() {
  const { selectedUser } = useChatStore();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    console.log('💬 Chat page mounted');
    console.log('👤 Auth user:', user);
    console.log('💬 Selected user:', selectedUser);
  }, [selectedUser, user]);

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  return (
    <div className="chat-page">
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
    </div>
  );
}