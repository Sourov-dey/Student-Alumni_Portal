// frontend/src/components/groupChat/GroupMessageInput.jsx - FIXED
import React, { useState, useRef } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { Image, Send, X } from "lucide-react";

export default function GroupMessageInput() {
  const { selectedGroup, sendGroupMessage } = useGroupStore();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmedText = text.trim();
    if (!trimmedText && !imagePreview) return;
    if (!selectedGroup) return;
    if (isSending) return; // Prevent double sending

    setIsSending(true);

    try {
      console.log("📤 Sending message to group:", selectedGroup.name);
      
      // Send message to server
      await sendGroupMessage(selectedGroup._id, {
        text: trimmedText,
        image: imagePreview,
      });

      console.log("✅ Message sent successfully");

      // Clear input fields only after successful send
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key (without Shift)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="group-message-input-container">
      {imagePreview && (
        <div className="image-preview">
          <div className="image-preview-wrapper">
            <img src={imagePreview} alt="Preview" className="preview-img" />
            <button
              onClick={removeImage}
              className="remove-image-btn"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`image-btn ${imagePreview ? "image-btn-active" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="send-btn"
          disabled={(!text.trim() && !imagePreview) || isSending}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}