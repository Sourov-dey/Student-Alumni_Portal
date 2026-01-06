// frontend/src/components/groupChat/GroupSidebar.jsx - FIXED
import React, { useState, useEffect } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  LogOut,
  Trash2,
} from "lucide-react";

export default function GroupSidebar({ onCreateGroup }) {
  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    leaveGroup,
    deleteGroup,
    isGroupsLoading,
  } = useGroupStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  // ✅ Log when groups change (for debugging)
  useEffect(() => {
    console.log("🔄 Groups updated in sidebar:", groups.length);
    groups.forEach((g) => {
      console.log(`  - ${g.name}: ${g.members.length} members`);
    });
  }, [groups]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = (group) => {
    console.log(
      "👆 Clicked group:",
      group.name,
      `(${group.members.length} members)`
    );
    setSelectedGroup(group);
    setMenuOpenFor(null);
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (window.confirm(`Leave group "${groupName}"?`)) {
      try {
        console.log("👋 Leaving group:", groupName);
        await leaveGroup(groupId);
        console.log("✅ Leave group request sent");

        // Note: The socket listener will handle UI updates
        alert("Left group successfully");
      } catch (error) {
        console.error("❌ Failed to leave group:", error);
        alert("Failed to leave group");
      }
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (
      window.confirm(
        `Delete group "${groupName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteGroup(groupId);
        alert("Group deleted successfully");
      } catch (error) {
        alert("Failed to delete group");
      }
    }
  };

  const toggleMenu = (e, groupId) => {
    e.stopPropagation();
    setMenuOpenFor(menuOpenFor === groupId ? null : groupId);
  };

  const isAdmin = (group) => {
    return group.admin._id === user._id;
  };

  if (isGroupsLoading) {
    return (
      <aside className="group-sidebar">
        <div className="group-sidebar-loading">Loading groups...</div>
      </aside>
    );
  }

  return (
    <aside className="group-sidebar">
      {/* Header */}
      <div className="group-sidebar-header">
        <div className="group-sidebar-title">
          <Users className="group-icon" />
          <span>Groups</span>
        </div>
        <button
          className="btn-create-group"
          onClick={onCreateGroup}
          title="Create Group"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Groups List */}
      <div className="group-list">
        {filteredGroups.length === 0 ? (
          <div className="no-groups">
            <p>No groups found</p>
            <button className="btn-create-first" onClick={onCreateGroup}>
              Create your first group
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group._id} className="group-item-wrapper">
              <div
                className={`group-item ${
                  selectedGroup?._id === group._id ? "active" : ""
                }`}
                onClick={() => handleGroupClick(group)}
              >
                <div className="group-avatar">
                  {group.avatar ? (
                    <img src={group.avatar} alt={group.name} />
                  ) : (
                    <div className="group-avatar-placeholder">
                      <Users size={24} />
                    </div>
                  )}
                </div>
                <div className="group-info">
                  <div className="group-name">{group.name}</div>
                  {/* ✅ CRITICAL: This will update when groups array changes */}
                  <div className="group-members">
                    {group.members.length} member
                    {group.members.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Menu Button */}
              <button
                className="group-menu-btn"
                onClick={(e) => toggleMenu(e, group._id)}
              >
                <MoreVertical size={18} />
              </button>

              {/* Dropdown Menu */}
              {menuOpenFor === group._id && (
                <div className="group-dropdown-menu">
                  {isAdmin(group) ? (
                    <button
                      className="dropdown-item delete-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group._id, group.name);
                        setMenuOpenFor(null);
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Delete Group</span>
                    </button>
                  ) : (
                    <button
                      className="dropdown-item leave-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(group._id, group.name);
                        setMenuOpenFor(null);
                      }}
                    >
                      <LogOut size={16} />
                      <span>Leave Group</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
