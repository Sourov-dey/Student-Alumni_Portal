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

  // prefill email from navigation state or logged-in user
  const presetEmail =
    (location?.state && location.state.email) || user?.email || "";
  const [email, setEmail] = useState(presetEmail);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Quick status helper for redirect
  const status = useMemo(
    () => user?.verification?.status || user?.verified ? "verified" : "unverified",
    [user]
  );

  useEffect(() => {
    // If already verified, send them to jobs
    if (status === "verified") {
      nav("/jobs", { replace: true });
    }
  }, [status, nav]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
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

    if (!email.trim()) {
      setMsg({ type: "error", text: "Please enter your email." });
      return;
    }
    if (!file) {
      setMsg({ type: "error", text: "Please choose a JPG/PNG/PDF file." });
      return;
    }

    const fd = new FormData();
    fd.append("idcard", file);     // ← backend expects field name 'idcard'
    fd.append("note", note || "");
    fd.append("emailUsed", email);

    try {
      setSubmitting(true);
      await http.post("/api/verify/id-card", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg({
        type: "success",
        text: "Verification submitted. You’ll be notified after review.",
      });

      // Redirect gently after success
      setTimeout(() => nav("/", { replace: true }), 1400);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please try again.";
      setMsg({ type: "error", text: apiMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: "24px auto", padding: 20, background: "#fff", borderRadius: 10, border: "1px solid #e6e8ec" }}>
      <h2 style={{ marginTop: 0 }}>Verify with ID card</h2>
      <p style={{ color: "#4b5563" }}>
        Upload a clear image or PDF of your Assam University ID card. An admin will
        review and approve. You can use a non-university email; this upload links your
        account to your identity.
      </p>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Upload ID (JPG/PNG/PDF, max 5MB)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={onPick}
          />
          {file && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
              Selected: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              resize: "vertical",
            }}
            placeholder="Anything the reviewer should know?"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </button>

        {msg.text && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              background: msg.type === "error" ? "#fef2f2" : "#ecfdf5",
              color: msg.type === "error" ? "#991b1b" : "#065f46",
              border: `1px solid ${msg.type === "error" ? "#fee2e2" : "#d1fae5"}`,
            }}
          >
            {msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
