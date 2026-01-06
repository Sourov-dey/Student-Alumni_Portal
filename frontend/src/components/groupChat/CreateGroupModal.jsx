// frontend/src/components/groupChat/CreateGroupModal.jsx - COMPLETELY FIXED
import React, { useState, useEffect } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useChatStore } from "../../store/useChatStore";
import { X, Users, Search, AlertCircle } from "lucide-react";

export default function CreateGroupModal({ onClose }) {
  const { createGroup } = useGroupStore();
  const { users, getUsers } = useChatStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general",
    isPublic: false,
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === 2 && users.length === 0) {
      getUsers();
    }
  }, [step, users, getUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      // Validate step 1
      if (!formData.name || !formData.name.trim()) {
        setError("Please enter a group name");
        return;
      }
      if (formData.name.trim().length < 3) {
        setError("Group name must be at least 3 characters");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Create group
    setLoading(true);
    try {
      console.log("🔥 Creating group with data:", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        isPublic: formData.isPublic,
        memberIds: selectedMembers,
      });

      const result = await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isPublic: formData.isPublic,
        memberIds: selectedMembers,
      });

      console.log("✅ Group created successfully:", result);
      alert("Group created successfully!");
      onClose();
    } catch (error) {
      console.error("❌ Error creating group:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create group";
      setError(errorMessage);
      alert("Failed to create group: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{step === 1 ? "Create New Group" : "Add Members"}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Step 1: Basic Info */}
              <div className="form-group">
                <label htmlFor="name">Group Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setError("");
                  }}
                  placeholder="Enter group name"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What's this group about?"
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="general">General</option>
                  <option value="department">Department</option>
                  <option value="batch">Batch</option>
                  <option value="club">Club</option>
                  <option value="project">Project</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Add Members */}
              <div className="form-group">
                <label>Add Members (Optional)</label>
                <div className="search-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="members-list">
                {filteredUsers.length === 0 ? (
                  <p className="no-results">
                    {searchQuery ? "No users found" : "Loading users..."}
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`member-item ${
                        selectedMembers.includes(user._id) ? "selected" : ""
                      }`}
                      onClick={() => toggleMember(user._id)}
                    >
                      <img
                        src={user.avatarUrl || "/avatar.png"}
                        alt={user.name}
                        className="member-avatar"
                      />
                      <div className="member-info">
                        <div className="member-name">{user.name}</div>
                        <div className="member-email">{user.email}</div>
                      </div>
                      <div className="member-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user._id)}
                          readOnly
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedMembers.length > 0 && (
                <div className="selected-count">
                  {selectedMembers.length} member
                  {selectedMembers.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </>
          )}

          <div className="modal-footer">
            {step === 2 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (step === 1 && !formData.name.trim())}
            >
              {loading ? "Creating..." : step === 1 ? "Next" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}