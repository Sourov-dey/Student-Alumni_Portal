// frontend/src/components/chat/ChatHeader.jsx
import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuth } from "../../context/AuthContext";
import http from "../../api/http";

const ChatHeader = ({ onOpenProfile }) => {
  const { selectedUser, setSelectedUser, onlineUsers } = useChatStore();
  const { user: authUser } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);

  // Fetch full profile when user expands details (to get email/phone/location)
  useEffect(() => {
    if (!showDetails || !selectedUser?._id) return;
    if (fullProfile && fullProfile._id === selectedUser._id) return;

    const fetchProfile = async () => {
      try {
        const res = await http.get(`/api/users/${selectedUser._id}`);
        setFullProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchProfile();
  }, [showDetails, selectedUser?._id]);

  // Reset when user changes
  useEffect(() => {
    setShowDetails(false);
    setFullProfile(null);
  }, [selectedUser?._id]);

  const isAlumni = selectedUser?.role === "alumni";
  const profile = fullProfile || selectedUser;
  const hasContactInfo = profile?.email || profile?.phone || profile?.location?.city;
  const isLimited = profile?._limited; // If profile came back limited (unconnected)

  return (
    <div className="chat-header-wrapper">
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
            {/* Contact info toggle — only for alumni */}
            {isAlumni && (
              <button
                className={`chat-header-btn contact-toggle-btn ${showDetails ? "active" : ""}`}
                onClick={() => setShowDetails(!showDetails)}
                title={showDetails ? "Hide contact info" : "Show contact info"}
              >
                {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}

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

      {/* Expandable contact info strip */}
      {showDetails && isAlumni && (
        <div className="chat-contact-strip">
          {isLimited ? (
            <div className="chat-contact-item chat-contact-locked">
              <span>Connect to see contact details</span>
            </div>
          ) : hasContactInfo ? (
            <>
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="chat-contact-item chat-contact-link"
                  title="Send email"
                >
                  <Mail size={13} />
                  <span>{profile.email}</span>
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="chat-contact-item chat-contact-link"
                  title="Call"
                >
                  <Phone size={13} />
                  <span>{profile.phone}</span>
                </a>
              )}
              {(profile.location?.city || profile.location?.country) && (
                <div className="chat-contact-item">
                  <MapPin size={13} />
                  <span>
                    {profile.location.city}
                    {profile.location.city && profile.location.country ? ", " : ""}
                    {profile.location.country}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="chat-contact-item chat-contact-empty">
              <span>No contact details shared</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
