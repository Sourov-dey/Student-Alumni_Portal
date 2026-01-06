// frontend/src/components/groupChat/GroupChatInterface.jsx
import React, { useEffect, useState } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuth } from "../../context/AuthContext";
import GroupSidebar from "./GroupSidebar";
import GroupChatContainer from "./GroupChatContainer";
import NoGroupSelected from "./NoGroupSelected";
import GroupDetailsModal from "./GroupDetailsModal";
import CreateGroupModal from "./CreateGroupModal";
import AddMembersModal from "./AddMembersModal";
import "../../styles/groupChat.css";

export default function GroupChatInterface() {
  const { selectedGroup, getUserGroups } = useGroupStore();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  useEffect(() => {
    console.log("🔄 GroupChatInterface mounted");
    getUserGroups();
  }, [getUserGroups]);

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleShowDetails = () => {
    setShowDetailsModal(true);
  };

  const handleAddMembers = () => {
    setShowAddMembersModal(true);
  };

  return (
    <div className="group-chat-interface">
      <div className="group-chat-wrapper">
        <GroupSidebar onCreateGroup={handleCreateGroup} />

        {!selectedGroup ? (
          <NoGroupSelected onCreateGroup={handleCreateGroup} />
        ) : (
          <GroupChatContainer
            onShowDetails={handleShowDetails}
            onAddMembers={handleAddMembers}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}

      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setShowDetailsModal(false)}
          onAddMembers={() => {
            setShowDetailsModal(false);
            setShowAddMembersModal(true);
          }}
        />
      )}

      {showAddMembersModal && selectedGroup && (
        <AddMembersModal
          group={selectedGroup}
          onClose={() => setShowAddMembersModal(false)}
        />
      )}
    </div>
  );
}
