import React, { useEffect, useMemo, useState } from "react";
import http from "../api/http";               // axios instance with baseURL + auth
import { useAuth } from "../context/AuthContext";
import "./AdminVerifications.css";

export default function AdminVerifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState("pending"); // pending | verified | rejected | all
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState(null);    // { url, mime }

  const fetchData = async () => {
    setLoading(true);
    try {
      const url =
        status === "all"
          ? "/api/admin/verifications"
          : `/api/admin/verifications?status=${encodeURIComponent(status)}`;
      const res = await http.get(url);
      setItems(res.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [status]);

  const approve = async (id) => {
    if (!window.confirm("Approve this verification?")) return;
    try {
      await http.post(`/api/admin/verifications/${id}/approve`);
      await fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || "Approve failed");
    }
  };

  const reject = async (id) => {
    const note = window.prompt("Rejection reason (optional):", "");
    try {
      await http.post(`/api/admin/verifications/${id}/reject`, { note });
      await fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || "Reject failed");
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((v) => {
      const u = v.user || {};
      return (
        (u.name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (v.method || "").toLowerCase().includes(term)
      );
    });
  }, [items, q]);

  const canReview = user?.role === "admin";

  /** Get color for AI confidence */
  const getConfidenceColor = (confidence) => {
    if (confidence >= 75) return "#059669";
    if (confidence >= 40) return "#d97706";
    return "#dc2626";
  };

  return (
    <div className="av-wrap">
      <header className="av-header">
        <h2>Verification Review</h2>
        <div className="av-controls">
          <div className="seg">
            {["pending", "verified", "rejected", "all"].map((s) => (
              <button
                key={s}
                className={`seg-btn ${status === s ? "active" : ""}`}
                onClick={() => setStatus(s)}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <input
            className="search"
            placeholder="Search name/email/method"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      <main className="av-main">
        {loading ? (
          <div className="muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No verifications</div>
        ) : (
          <table className="av-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Method</th>
                <th>Status</th>
                <th>AI Verdict</th>
                <th>Submitted</th>
                <th>Doc</th>
                {canReview && <th style={{ width: 160 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const u = v.user || {};
                const doc = v.idDoc || {};
                const ai = v.aiResult || null;
                const submitted =
                  v.submittedAt
                    ? new Date(v.submittedAt).toLocaleString()
                    : "-";
                return (
                  <tr key={v._id}>
                    <td>{u.name || "-"}</td>
                    <td>{u.email || "-"}</td>
                    <td>{u.role || "-"}</td>
                    <td>{v.method}</td>
                    <td>
                      <span className={`pill pill-${v.status}`}>
                        {v.status}
                      </span>
                      {v.reviewedByAI && (
                        <span className="ai-badge" title="Decision made by AI">🤖</span>
                      )}
                    </td>
                    <td>
                      {ai && ai.confidence > 0 ? (
                        <div className="ai-verdict">
                          <span
                            className="ai-conf"
                            style={{ color: getConfidenceColor(ai.confidence) }}
                          >
                            {ai.confidence}%
                          </span>
                          <span className="ai-validity">
                            {ai.isValid ? "✓ Valid" : "✗ Invalid"}
                          </span>
                          {ai.reason && (
                            <div className="ai-reason" title={ai.reason}>
                              {ai.reason.length > 60
                                ? ai.reason.slice(0, 60) + "…"
                                : ai.reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{submitted}</td>
                    <td>
                      {doc.url ? (
                        <button
                          className="link"
                          onClick={() => setPreview({ url: `http://localhost:5000${doc.url}`, mime: doc.mime })}
                        >
                          Preview
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    {canReview && (
                      <td>
                        {v.status === "pending" ? (
                          <div className="actions">
                            <button className="btn approve" onClick={() => approve(v._id)}>
                              Approve
                            </button>
                            <button className="btn reject" onClick={() => reject(v._id)}>
                              Reject
                            </button>
                          </div>
                        ) : v.reviewedByAI ? (
                          <div className="actions">
                            <button
                              className="btn override"
                              title="Override AI decision"
                              onClick={() => {
                                if (v.status === "verified") reject(v._id);
                                else approve(v._id);
                              }}
                            >
                              Override
                            </button>
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>

      {preview && (
        <PreviewModal
          url={preview.url}
          mime={preview.mime}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

/* Preview modal for image/PDF */
function PreviewModal({ url, mime, onClose }) {
  const isImage = (mime || "").startsWith("image/");
  const isPdf = mime === "application/pdf" || (url || "").toLowerCase().endsWith(".pdf");
  return (
    <div className="av-modal-backdrop" onClick={onClose}>
      <div className="av-modal" onClick={(e) => e.stopPropagation()}>
        <div className="av-modal-head">
          <div>Document preview</div>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="av-modal-body">
          {isImage && <img src={url} alt="id card" />}
          {isPdf && (
            <iframe title="doc" src={url} style={{ width: "100%", height: "80vh", border: "none" }} />
          )}
          {!isImage && !isPdf && (
            <div className="muted">Cannot preview this file type. <a href={url} target="_blank" rel="noreferrer">Open</a></div>
          )}
        </div>
      </div>
    </div>
  );
}
