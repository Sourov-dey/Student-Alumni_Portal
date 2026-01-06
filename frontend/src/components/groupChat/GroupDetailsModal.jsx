// frontend/src/components/groupChat/GroupDetailsModal.jsx - FIXED
import React, { useState } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuth } from "../../context/AuthContext";
import { X, Users, Crown, UserMinus, Edit2, Trash2 } from "lucide-react";

export default function GroupDetailsModal({ group, onClose, onAddMembers }) {
  const { updateGroup, removeGroupMember, leaveGroup, deleteGroup } =
    useGroupStore();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: group.name,
    description: group.description || "",
  });
  const [loading, setLoading] = useState(false);

  const isAdmin = group.admin._id === user._id;

  // ✅ Log current group data
  console.log("📋 Group Details Modal - Current group:", {
    name: group.name,
    memberCount: group.members.length,
    members: group.members.map(m => m.name)
  });

  const handleSaveEdit = async () => {
    if (!editData.name.trim()) {
      alert("Group name is required");
      return;
    }

    setLoading(true);
    try {
      await updateGroup(group._id, editData);
      setIsEditing(false);
      alert("Group updated successfully");
    } catch (error) {
      alert("Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (window.confirm(`Remove ${memberName} from the group?`)) {
      try {
        console.log("➖ Removing member:", memberName);
        await removeGroupMember(group._id, memberId);
        
        // ✅ CRITICAL: Reload messages to show system message
        const { selectedGroup, getGroupMessages } = useGroupStore.getState();
        if (selectedGroup?._id === group._id) {
          console.log("🔄 Reloading messages to show 'user removed' system message");
          await getGroupMessages(group._id);
        }
        
        alert("Member removed successfully");
      } catch (error) {
        console.error("❌ Failed to remove member:", error);
        alert("Failed to remove member");
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        console.log("👋 Leaving group:", group.name);
        await leaveGroup(group._id);
        console.log("✅ Successfully left group");
        onClose();
        
        // Note: The socket listener will handle removing the group from sidebar
        // and clearing the selected group
      } catch (error) {
        console.error("❌ Failed to leave group:", error);
        alert(error.response?.data?.message || "Failed to leave group");
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm("Delete this group? This action cannot be undone.")) {
      try {
        await deleteGroup(group._id);
        onClose();
      } catch (error) {
        alert("Failed to delete group");
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content group-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Group Details</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Group Info */}
          <div className="group-details-section">
            <div className="group-details-avatar">
              {group.avatar ? (
                <img src={group.avatar} alt={group.name} />
              ) : (
                <div className="group-avatar-placeholder-large">
                  <Users size={48} />
                </div>
              )}
            </div>

            {isEditing ? (
              <>
                <div className="form-group">
                  <label>Group Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    maxLength={500}
                    rows={3}
                  />
                </div>
                <div className="edit-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveEdit}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="group-details-name">
                  <h3>{group.name}</h3>
                  {isAdmin && (
                    <button
                      className="btn-icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
                {group.description && (
                  <p className="group-details-description">
                    {group.description}
                  </p>
                )}
                <div className="group-details-meta">
                  {/* ✅ This will update when group prop changes */}
                  <span className="meta-item">
                    <Users size={16} />
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </span>
                  <span className="meta-item">Category: {group.category}</span>
                  {group.isPublic && <span className="meta-badge">Public</span>}
                </div>
              </>
            )}
          </div>

          {/* Members List */}
          <div className="group-members-section">
            <div className="section-header">
              {/* ✅ This will update when group prop changes */}
              <h3>Members ({group.members.length})</h3>
              {isAdmin && (
                <button className="btn btn-sm" onClick={onAddMembers}>
                  Add Members
                </button>
              )}
            </div>

            <div className="members-list">
              {group.members.map((member) => {
                const isMemberAdmin = member._id === group.admin._id;
                const isCurrentUser = member._id === user._id;

                return (
                  <div key={member._id} className="member-item">
                    <img
                      src={member.avatarUrl || "/avatar.png"}
                      alt={member.name}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <div className="member-name">
                        {member.name}
                        {isCurrentUser && (
                          <span className="you-badge">You</span>
                        )}
                      </div>
                      <div className="member-email">{member.email}</div>
                    </div>
                    {isMemberAdmin ? (
                      <div className="member-badge admin-badge">
                        <Crown size={14} />
                        <span>Admin</span>
                      </div>
                    ) : (
                      isAdmin &&
                      !isCurrentUser && (
                        <button
                          className="btn-icon-danger"
                          onClick={() =>
                            handleRemoveMember(member._id, member.name)
                          }
                          title="Remove member"
                        >
                          <UserMinus size={16} />
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="group-danger-zone">
            <h3>Danger Zone</h3>
            {isAdmin ? (
              <button className="btn btn-danger" onClick={handleDeleteGroup}>
                <Trash2 size={16} />
                Delete Group
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleLeaveGroup}>
                Leave Group
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}