// frontend/src/components/chat/SidebarSkeleton.jsx
import React from "react";
import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Users className="sidebar-icon" />
          <span className="sidebar-title-text">Contacts</span>
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="sidebar-users">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="user-item">
            {/* Avatar skeleton */}
            <div className="user-avatar-wrapper">
              <div className="skeleton user-avatar-skeleton" />
            </div>

            {/* User info skeleton */}
            <div className="user-info">
              <div className="skeleton name-skeleton" />
              <div className="skeleton status-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;