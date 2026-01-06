// frontend/src/components/groupChat/AddMembersModal.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../../store/useGroupStore';
import { useChatStore } from '../../store/useChatStore';
import { X, Search } from 'lucide-react';

export default function AddMembersModal({ group, onClose }) {
  const { addGroupMembers, getGroupMessages, selectedGroup } = useGroupStore();
  const { users, getUsers } = useChatStore();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (users.length === 0) {
      getUsers();
    }
  }, [users, getUsers]);

  // Filter out existing members and apply search
  const availableUsers = users.filter(user => {
    const isAlreadyMember = group.members.some(m => m._id === user._id);
    if (isAlreadyMember) return false;

    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    setLoading(true);
    try {
      console.log("➕ Adding members to group:", group.name);
      console.log("Members to add:", selectedMembers);
      
      await addGroupMembers(group._id, selectedMembers);
      
      // ✅ CRITICAL: Reload messages to show system messages
      if (selectedGroup?._id === group._id) {
        console.log("🔄 Reloading messages to show 'user added' system messages");
        await getGroupMessages(group._id);
      }
      
      alert(`Added ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''} successfully`);
      onClose();
    } catch (error) {
      console.error("❌ Failed to add members:", error);
      alert('Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Members to {group.name}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
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
            {availableUsers.length === 0 ? (
              <p className="no-results">
                {searchQuery ? 'No users found matching your search' : 'All users are already members'}
              </p>
            ) : (
              availableUsers.map((user) => (
                <div
                  key={user._id}
                  className={`member-item ${selectedMembers.includes(user._id) ? 'selected' : ''}`}
                  onClick={() => toggleMember(user._id)}
                >
                  <img
                    src={user.avatarUrl || '/avatar.png'}
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
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || selectedMembers.length === 0}
            >
              {loading ? 'Adding...' : 'Add Members'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}