// frontend/src/pages/VerifyId.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

export default function VerifyId() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // Verification status from API
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  // prefill email from navigation state or logged-in user
  const presetEmail =
    (location?.state && location.state.email) || user?.email || "";
  const [email, setEmail] = useState(presetEmail);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Fetch verification status on mount
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    http.get("/api/verify/status")
      .then(res => setVerificationData(res.data))
      .catch(() => setVerificationData(null))
      .finally(() => setLoading(false));
  }, [user]);

  const currentStatus = verificationData?.status || "none";

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); return; }
    if (!ALLOWED.includes(f.type)) {
      setMsg({ type: "error", text: "Only JPG, PNG, or PDF are allowed." });
      e.target.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      setMsg({ type: "error", text: "File must be ≤ 5 MB." });
      e.target.value = "";
      return;
    }
    setMsg({ type: "", text: "" });
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!email.trim()) { setMsg({ type: "error", text: "Please enter your email." }); return; }
    if (!file) { setMsg({ type: "error", text: "Please choose a JPG/PNG/PDF file." }); return; }

    const fd = new FormData();
    fd.append("idcard", file);
    fd.append("note", note || "");
    fd.append("emailUsed", email);

    try {
      setSubmitting(true);
      await http.post("/api/verify/id-card", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg({ type: "success", text: "Verification submitted. You'll be notified after review." });
      // Refresh status
      const res = await http.get("/api/verify/status");
      setVerificationData(res.data);
    } catch (err) {
      const apiMsg = err?.response?.data?.message || err?.message || "Upload failed. Please try again.";
      setMsg({ type: "error", text: apiMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 840, margin: "24px auto", padding: 20, textAlign: "center" }}>
        <p style={{ color: "#6b7280" }}>Loading verification status...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840, margin: "24px auto", padding: 20, background: "#fff", borderRadius: 10, border: "1px solid #e6e8ec" }}>
      <h2 style={{ marginTop: 0 }}>ID Verification</h2>

      {/* ───── Status Banner ───── */}
      <div style={{
        padding: "16px 20px",
        borderRadius: 10,
        marginBottom: 24,
        background: currentStatus === "verified" ? "linear-gradient(135deg, #ecfdf5, #d1fae5)"
          : currentStatus === "pending" ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
            : currentStatus === "rejected" ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
              : "linear-gradient(135deg, #f8fafc, #f1f5f9)",
        border: `1px solid ${currentStatus === "verified" ? "#a7f3d0"
            : currentStatus === "pending" ? "#fde68a"
              : currentStatus === "rejected" ? "#fca5a5"
                : "#e2e8f0"
          }`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>
            {currentStatus === "verified" ? "✅" : currentStatus === "pending" ? "⏳" : currentStatus === "rejected" ? "❌" : "📋"}
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
              {currentStatus === "verified" && "Your ID is Verified"}
              {currentStatus === "pending" && "Verification Pending"}
              {currentStatus === "rejected" && "Verification Rejected"}
              {currentStatus === "none" && "Not Yet Verified"}
            </div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              {currentStatus === "verified" && "Your identity has been confirmed by an admin. You have full access."}
              {currentStatus === "pending" && `Submitted on ${new Date(verificationData.verification.submittedAt).toLocaleDateString()}. An admin will review shortly.`}
              {currentStatus === "rejected" && (
                <>
                  Your submission was rejected{verificationData?.verification?.reviewNote ? `: "${verificationData.verification.reviewNote}"` : "."}
                  {" "}You can re-submit below.
                </>
              )}
              {currentStatus === "none" && "Upload your university ID card below to get verified."}
            </div>
            {verificationData?.verification?.reviewedAt && (currentStatus === "verified" || currentStatus === "rejected") && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Reviewed on {new Date(verificationData.verification.reviewedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── Upload Form (hide if already verified or pending) ───── */}
      {currentStatus !== "verified" && currentStatus !== "pending" && (
        <>
          <p style={{ color: "#4b5563" }}>
            Upload a clear image or PDF of your Assam University ID card. An admin will
            review and approve. You can use a non-university email; this upload links your
            account to your identity.
          </p>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                Upload ID (JPG/PNG/PDF, max 5MB)
              </label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onPick} />
              {file && (
                <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                  Selected: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", resize: "vertical" }}
                placeholder="Anything the reviewer should know?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "#fff",
                border: "none", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600,
              }}
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>

            {msg.text && (
              <div style={{
                marginTop: 12, padding: "10px 12px", borderRadius: 8,
                background: msg.type === "error" ? "#fef2f2" : "#ecfdf5",
                color: msg.type === "error" ? "#991b1b" : "#065f46",
                border: `1px solid ${msg.type === "error" ? "#fee2e2" : "#d1fae5"}`,
              }}>
                {msg.text}
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}
