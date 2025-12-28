// frontend/src/components/chat/ChatProfilePage.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Camera, Mail, User, ArrowLeft } from "lucide-react";
import http from "../../api/http";
import "./ChatProfilePage.css";

const ChatProfilePage = ({ onBack }) => {
  const { user, setUser } = useAuth();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      
      setIsUpdating(true);
      try {
        const res = await http.put("/api/messages/updateprofile", { 
          avatarUrl: base64Image 
        });
        
        // Update user in context and localStorage
        const updatedUser = { ...user, avatarUrl: base64Image };
        setUser(updatedUser);
        localStorage.setItem("au_user", JSON.stringify(updatedUser));
        
        alert("Profile photo updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile photo");
      } finally {
        setIsUpdating(false);
      }
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  return (
    <div className="chat-profile-page">
      {/* Back Button */}
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Back to Chat</span>
      </button>

      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Your profile information</p>
        </div>

        {/* Avatar Upload Section */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img
              src={selectedImg || user?.avatarUrl || "/avatar.png"}
              alt="Profile"
              className="profile-avatar"
            />
            <label
              htmlFor="avatar-upload"
              className={`avatar-upload-btn ${isUpdating ? "uploading" : ""}`}
            >
              <Camera size={20} />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdating}
              />
            </label>
          </div>
          <p className="avatar-hint">
            {isUpdating ? "Uploading..." : "Click the camera icon to update your photo"}
          </p>
        </div>

        {/* User Info Section */}
        <div className="info-section">
          <div className="info-group">
            <div className="info-label">
              <User size={16} />
              <span>Full Name</span>
            </div>
            <p className="info-value">{user?.name || "N/A"}</p>
          </div>

          <div className="info-group">
            <div className="info-label">
              <Mail size={16} />
              <span>Email Address</span>
            </div>
            <p className="info-value">{user?.email || "N/A"}</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="account-section">
          <h2 className="account-title">Account Information</h2>
          <div className="account-info">
            <div className="account-row">
              <span className="account-label">Member Since</span>
              <span className="account-value">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Role</span>
              <span className="account-value role-badge">{user?.role || "N/A"}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Account Status</span>
              <span className="account-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatProfilePage;