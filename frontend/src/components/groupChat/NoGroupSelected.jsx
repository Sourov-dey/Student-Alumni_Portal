// frontend/src/components/groupChat/NoGroupSelected.jsx
import React from "react";
import { Users, Plus } from "lucide-react";

export default function NoGroupSelected({ onCreateGroup }) {
  return (
    <div className="no-group-selected">
      <div className="no-group-content">
        <div className="no-group-icon">
          <Users size={64} />
        </div>
        <h2>Welcome to Group Chat!</h2>
        <p>
          Select a group from the sidebar or create a new one to start chatting
        </p>
        <button className="btn-create-group-cta" onClick={onCreateGroup}>
          <Plus size={20} />
          Create New Group
        </button>
      </div>
    </div>
  );
}
