// frontend/src/pages/ConnectionRequests.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConnectionStore } from "../store/useConnectionStore";
import toast from "react-hot-toast";
import {
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Mail,
  GraduationCap,
  Briefcase,
  Lightbulb,
  Check,
  X,
  Link2,
  Link2Off,
  Clock,
  Loader2,
} from "lucide-react";
import "../styles/pages/connectionRequests.css";

export default function ConnectionRequests() {
  const { user } = useAuth();
  const {
    connections,
    pendingRequests,
    sentRequests,
    fetchConnections,
    fetchPendingRequests,
    fetchSentRequests,
    respondToRequest,
    removeConnection,
  } = useConnectionStore();

  const [activeTab, setActiveTab] = useState("pending");
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    fetchConnections();
    if (user?.role === "alumni") {
      fetchPendingRequests();
    }
    if (user?.role === "student" || user?.role === "admin") {
      fetchSentRequests();
    }
  }, []);

  const handleRespond = async (connectionId, action) => {
    setRespondingTo(connectionId);
    try {
      await respondToRequest(connectionId, action);
      toast.success(
        action === "accept"
          ? "Connection accepted! They can now message you."
          : "Connection request declined."
      );
      fetchConnections();
    } catch (err) {
      toast.error("Failed to respond to request");
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!confirm("Remove this connection? They won't be able to message you."))
      return;
    try {
      await removeConnection(connectionId);
      toast.success("Connection removed");
      fetchConnections();
    } catch (err) {
      toast.error("Failed to remove connection");
    }
  };

  if (!user) {
    return (
      <div className="connections-page">
        <div className="connections-empty">
          <UserPlus size={48} />
          <h2>Sign in to view connections</h2>
        </div>
      </div>
    );
  }

  const isAlumni = user.role === "alumni";
  const isStudent = user.role === "student" || user.role === "admin";

  return (
    <div className="connections-page">
      {/* Header */}
      <div className="connections-header">
        <div className="connections-header-content">
          <h1>
            <Users size={28} /> My Network
          </h1>
          <p>Manage your connections and requests</p>
        </div>

        {/* Stats */}
        <div className="connections-stats">
          <div className="stat-card">
            <UserCheck size={20} />
            <div>
              <span className="stat-number">{connections.length}</span>
              <span className="stat-label">Connections</span>
            </div>
          </div>
          {isAlumni && (
            <div className="stat-card stat-pending">
              <Clock size={20} />
              <div>
                <span className="stat-number">{pendingRequests.length}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
          )}
          {isStudent && (
            <div className="stat-card stat-sent">
              <UserPlus size={20} />
              <div>
                <span className="stat-number">{sentRequests.length}</span>
                <span className="stat-label">Sent</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="connections-tabs">
        {isAlumni && (
          <button
            className={`conn-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <Clock size={16} />
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="tab-badge">{pendingRequests.length}</span>
            )}
          </button>
        )}
        <button
          className={`conn-tab ${activeTab === "connections" ? "active" : ""}`}
          onClick={() => setActiveTab("connections")}
        >
          <UserCheck size={16} />
          Connections
        </button>
        {isStudent && (
          <button
            className={`conn-tab ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            <UserPlus size={16} />
            Sent Requests
          </button>
        )}
      </div>

      {/* Content */}
      <div className="connections-content">
        {/* ── Pending Requests (Alumni) ── */}
        {activeTab === "pending" && isAlumni && (
          <div className="connections-list">
            {pendingRequests.length === 0 ? (
              <div className="connections-empty">
                <Clock size={48} />
                <h3>No pending requests</h3>
                <p>When students send you connection requests, they'll appear here.</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req._id} className="connection-card pending-card">
                  <div className="connection-card-avatar">
                    <img
                      src={
                        req.from?.avatarUrl && req.from.avatarUrl !== "/avatar.png"
                          ? `http://localhost:5000${req.from.avatarUrl}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              req.from?.name || "?"
                            )}&size=60&background=6366f1&color=fff&bold=true`
                      }
                      alt={req.from?.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          req.from?.name || "?"
                        )}&size=60&background=6366f1&color=fff&bold=true`;
                      }}
                    />
                    <span className="role-dot student-dot" title="Student" />
                  </div>

                  <div className="connection-card-info">
                    <h4>{req.from?.name}</h4>
                    {req.from?.department && (
                      <span className="connection-detail">
                        <GraduationCap size={13} /> {req.from.department}
                      </span>
                    )}
                    {req.from?.email && (
                      <span className="connection-detail">
                        <Mail size={13} /> {req.from.email}
                      </span>
                    )}
                    {req.from?.interests?.length > 0 && (
                      <div className="connection-tags">
                        {req.from.interests.slice(0, 3).map((interest, i) => (
                          <span key={i} className="conn-tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="connection-time">
                      <Clock size={12} />{" "}
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="connection-card-actions">
                    <button
                      className="conn-btn conn-accept"
                      onClick={() => handleRespond(req._id, "accept")}
                      disabled={respondingTo === req._id}
                    >
                      {respondingTo === req._id ? (
                        <Loader2 size={16} className="spinning" />
                      ) : (
                        <Check size={16} />
                      )}
                      Accept
                    </button>
                    <button
                      className="conn-btn conn-reject"
                      onClick={() => handleRespond(req._id, "reject")}
                      disabled={respondingTo === req._id}
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Accepted Connections ── */}
        {activeTab === "connections" && (
          <div className="connections-list">
            {connections.length === 0 ? (
              <div className="connections-empty">
                <Link2Off size={48} />
                <h3>No connections yet</h3>
                <p>
                  {isStudent
                    ? "Find alumni on the map and send connection requests!"
                    : "When you accept student requests, they'll appear here."}
                </p>
              </div>
            ) : (
              connections.map((conn) => (
                <div key={conn.connectionId} className="connection-card connected-card">
                  <div className="connection-card-avatar">
                    <img
                      src={
                        conn.user?.avatarUrl &&
                        conn.user.avatarUrl !== "/avatar.png"
                          ? `http://localhost:5000${conn.user.avatarUrl}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              conn.user?.name || "?"
                            )}&size=60&background=22c55e&color=fff&bold=true`
                      }
                      alt={conn.user?.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          conn.user?.name || "?"
                        )}&size=60&background=22c55e&color=fff&bold=true`;
                      }}
                    />
                    <span
                      className={`role-dot ${conn.user?.role}-dot`}
                      title={conn.user?.role}
                    />
                  </div>

                  <div className="connection-card-info">
                    <h4>
                      {conn.user?.name}
                      <span className="connected-badge">
                        <Link2 size={12} /> Connected
                      </span>
                    </h4>
                    {conn.user?.department && (
                      <span className="connection-detail">
                        <GraduationCap size={13} /> {conn.user.department}
                        {conn.user.graduationYear
                          ? ` · ${conn.user.graduationYear}`
                          : ""}
                      </span>
                    )}
                    {conn.user?.email && (
                      <span className="connection-detail">
                        <Mail size={13} /> {conn.user.email}
                      </span>
                    )}
                    <span className="connection-time">
                      Connected since{" "}
                      {new Date(conn.connectedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="connection-card-actions">
                    <button
                      className="conn-btn conn-remove"
                      onClick={() => handleRemoveConnection(conn.connectionId)}
                    >
                      <UserX size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Sent Requests (Student) ── */}
        {activeTab === "sent" && isStudent && (
          <div className="connections-list">
            {sentRequests.length === 0 ? (
              <div className="connections-empty">
                <UserPlus size={48} />
                <h3>No requests sent</h3>
                <p>Find alumni on the map and send connection requests!</p>
              </div>
            ) : (
              sentRequests.map((req) => (
                <div
                  key={req._id}
                  className={`connection-card sent-card sent-${req.status}`}
                >
                  <div className="connection-card-avatar">
                    <img
                      src={
                        req.to?.avatarUrl && req.to.avatarUrl !== "/avatar.png"
                          ? `http://localhost:5000${req.to.avatarUrl}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              req.to?.name || "?"
                            )}&size=60&background=a78bfa&color=fff&bold=true`
                      }
                      alt={req.to?.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          req.to?.name || "?"
                        )}&size=60&background=a78bfa&color=fff&bold=true`;
                      }}
                    />
                  </div>

                  <div className="connection-card-info">
                    <h4>{req.to?.name}</h4>
                    {req.to?.department && (
                      <span className="connection-detail">
                        <GraduationCap size={13} /> {req.to.department}
                        {req.to.graduationYear
                          ? ` · ${req.to.graduationYear}`
                          : ""}
                      </span>
                    )}
                    <span className="connection-time">
                      Sent{" "}
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="connection-card-actions">
                    <span
                      className={`status-badge status-${req.status}`}
                    >
                      {req.status === "pending" && (
                        <>
                          <Clock size={14} /> Pending
                        </>
                      )}
                      {req.status === "accepted" && (
                        <>
                          <Check size={14} /> Accepted
                        </>
                      )}
                      {req.status === "rejected" && (
                        <>
                          <X size={14} /> Declined
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
