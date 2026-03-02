// frontend/src/pages/VerifyId.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";
import "./verifyId.css";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function ScoreBar({ value }) {
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="verify-score-bar">
      <div
        className="verify-score-fill"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

export default function VerifyId() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const fileRef = useRef();

  // Verification status from API
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form
  const presetEmail =
    (location?.state && location.state.email) || user?.email || "";
  const [email, setEmail] = useState(presetEmail);
  const [form, setForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    role: user?.role || "Student",
  });
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Drag-and-drop
  const [dragOver, setDragOver] = useState(false);

  // Inline result (shown immediately after AI returns)
  const [inlineResult, setInlineResult] = useState(null);

  // ─── Fetch verification status on mount ───
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    http
      .get("/api/verify/status")
      .then((res) => setVerificationData(res.data))
      .catch(() => setVerificationData(null))
      .finally(() => setLoading(false));
  }, [user]);

  const currentStatus = verificationData?.status || "none";
  const aiResult = verificationData?.verification?.aiResult || null;
  const reviewedByAI = verificationData?.verification?.reviewedByAI || false;

  // ─── File handling ───
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setMsg({ type: "error", text: "Only JPG, PNG, WEBP, or PDF files are allowed." });
      return;
    }
    if (f.size > MAX_BYTES) {
      setMsg({ type: "error", text: "File must be ≤ 5 MB." });
      return;
    }
    setMsg({ type: "", text: "" });
    setFile(f);
    if (f.type === "application/pdf") {
      setImagePreview("pdf");
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(f);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ─── Submit ───
  const submit = async (e) => {
    if (e) e.preventDefault();
    setMsg({ type: "", text: "" });
    setInlineResult(null);

    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Please enter your name." });
      return;
    }
    if (!file) {
      setMsg({ type: "error", text: "Please upload your ID card image or PDF." });
      return;
    }

    const fd = new FormData();
    fd.append("idcard", file);
    fd.append("emailUsed", email);
    fd.append("note", "");

    try {
      setSubmitting(true);
      const submitRes = await http.post("/api/verify/id-card", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const respMsg = submitRes.data?.message || "Verification submitted.";
      const respStatus = submitRes.data?.verification?.status;
      const respAiResult = submitRes.data?.verification?.aiResult || null;

      if (respStatus === "verified") {
        setMsg({ type: "success", text: respMsg });
      } else if (respStatus === "rejected") {
        setMsg({ type: "error", text: respMsg });
      } else {
        setMsg({ type: "success", text: respMsg });
      }

      // Show inline result if AI returned scores
      if (respAiResult) {
        setInlineResult(respAiResult);
      }

      // Refresh status
      const res = await http.get("/api/verify/status");
      setVerificationData(res.data);
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please try again.";
      setMsg({ type: "error", text: apiMsg });
      try {
        const res = await http.get("/api/verify/status");
        setVerificationData(res.data);
      } catch (_) {
        /* ignore */
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Cancel ───
  const cancelVerification = async () => {
    if (
      !window.confirm(
        "Cancel your verification? You can then submit a new one."
      )
    )
      return;
    try {
      setCancelling(true);
      await http.delete("/api/verify/cancel");
      setMsg({
        type: "success",
        text: "Verification cancelled. You can now submit a new one.",
      });
      setInlineResult(null);
      setFile(null);
      setImagePreview(null);
      const res = await http.get("/api/verify/status");
      setVerificationData(res.data);
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Cancel failed.",
      });
    } finally {
      setCancelling(false);
    }
  };

  // ─── Reset inline result ───
  const resetInline = () => {
    setInlineResult(null);
    setFile(null);
    setImagePreview(null);
  };

  // ─── Helpers ───
  const confidenceClass = (conf) =>
    conf >= 70 ? "high" : conf >= 40 ? "mid" : "low";

  const scoreColor = (v) =>
    v >= 70 ? "var(--v-success)" : v >= 40 ? "var(--v-warn)" : "var(--v-danger)";

  // ─── Determine which result to show ───
  const displayResult = inlineResult || aiResult;
  const showResultPanel =
    displayResult &&
    (displayResult.confidence > 0 || inlineResult) &&
    (currentStatus === "verified" || currentStatus === "rejected" || inlineResult);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="verify-page">
        <div className="verify-grid-bg" />
        <div className="verify-content">
          <div className="verify-header">
            <div className="verify-header-badge">
              <span className="verify-badge-dot" />
              ID Verification System
            </div>
            <h1>
              Verify Your <span>Identity</span>
            </h1>
          </div>
          <div className="verify-card verify-loading-card">
            <div className="verify-scanner">
              <span className="verify-scanner-icon">🔍</span>
            </div>
            <div className="verify-loading-text">LOADING</div>
            <div className="verify-loading-sub">
              Fetching verification status…
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <div className="verify-content">
        {/* ───── Header ───── */}
        <div className="verify-header">
          <div className="verify-header-badge">
            <span className="verify-badge-dot" />
            ID Verification System
          </div>
          <h1>
            Verify Your <span>Identity</span>
          </h1>
          <p className="verify-subtitle">
            AI-powered • Institutional ID • Real-time Analysis
          </p>
        </div>

        {/* ───── Status Banner ───── */}
        <div
          className={`verify-status-banner status-${currentStatus}`}
        >
          <div className="verify-status-row">
            <span className="verify-status-icon">
              {currentStatus === "verified"
                ? "✅"
                : currentStatus === "pending"
                  ? "⏳"
                  : currentStatus === "rejected"
                    ? "❌"
                    : "📋"}
            </span>
            <div style={{ flex: 1 }}>
              <div className="verify-status-title">
                {currentStatus === "verified" && "Your ID is Verified"}
                {currentStatus === "pending" && "Verification Pending"}
                {currentStatus === "rejected" && "Verification Rejected"}
                {currentStatus === "none" && "Not Yet Verified"}
              </div>
              <div className="verify-status-desc">
                {currentStatus === "verified" && (
                  <>
                    Your identity has been confirmed
                    {reviewedByAI ? " by AI" : " by an admin"}. You have full
                    access.
                  </>
                )}
                {currentStatus === "pending" && (
                  <>
                    Submitted on{" "}
                    {new Date(
                      verificationData.verification.submittedAt
                    ).toLocaleDateString()}
                    . AI is analyzing your document or an admin will review
                    shortly.
                    <button
                      className="verify-cancel-btn"
                      onClick={cancelVerification}
                      disabled={cancelling}
                    >
                      {cancelling ? "Cancelling…" : "Cancel & Re-submit"}
                    </button>
                  </>
                )}
                {currentStatus === "rejected" && (
                  <>
                    Your submission was rejected
                    {verificationData?.verification?.reviewNote
                      ? `: "${verificationData.verification.reviewNote}"`
                      : "."}
                    <button
                      className="verify-cancel-btn"
                      onClick={cancelVerification}
                      disabled={cancelling}
                    >
                      {cancelling ? "Clearing…" : "Clear & Re-submit"}
                    </button>
                  </>
                )}
                {currentStatus === "none" &&
                  "Upload your university ID card below to get verified."}
              </div>

              {/* AI confidence badge in status banner */}
              {aiResult && aiResult.confidence > 0 && !inlineResult && (
                <div className="verify-ai-badge">
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--v-text)" }}>
                      AI Analysis{" "}
                    </span>
                    <span
                      className={`verify-ai-badge-conf ${confidenceClass(aiResult.confidence)}`}
                    >
                      {aiResult.confidence}% confidence
                    </span>
                    {aiResult.reason && (
                      <div className="verify-ai-badge-reason">
                        {aiResult.reason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {verificationData?.verification?.reviewedAt &&
                (currentStatus === "verified" ||
                  currentStatus === "rejected") && (
                  <div className="verify-reviewed-date">
                    Reviewed on{" "}
                    {new Date(
                      verificationData.verification.reviewedAt
                    ).toLocaleDateString()}
                    {reviewedByAI && " (by AI)"}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* ───── Message Box ───── */}
        {msg.text && (
          <div
            className={
              msg.type === "error" ? "verify-error-box" : "verify-success-box"
            }
          >
            {msg.type === "error" ? "⚠" : "✓"} {msg.text}
          </div>
        )}

        {/* ───── Submitting State ───── */}
        {submitting && (
          <div className="verify-card verify-loading-card">
            <div className="verify-scanner">
              <span className="verify-scanner-icon">🔍</span>
            </div>
            <div className="verify-loading-text">ANALYZING DOCUMENT</div>
            <div className="verify-loading-sub">
              Extracting text · Scoring · Validating
            </div>
          </div>
        )}

        {/* ───── Result Panel (inline after submission OR from saved data) ───── */}
        {showResultPanel && !submitting && (
          <div className="verify-card">
            <div className="verify-card-title">Verification Result</div>

            <div className="verify-result-header">
              <div
                className={`verify-verdict-badge ${displayResult.isValid
                  ? "valid"
                  : displayResult.confidence > 0
                    ? "invalid"
                    : "pending-verdict"
                  }`}
              >
                <span className="verify-verdict-icon">
                  {displayResult.isValid ? "✓" : "✕"}
                </span>
                {displayResult.isValid ? "VERIFIED" : "NOT VERIFIED"}
              </div>
              <div className="verify-confidence-block">
                <div
                  className={`verify-confidence-num ${confidenceClass(displayResult.confidence)}`}
                >
                  {displayResult.confidence}
                  <span style={{ fontSize: 18 }}>%</span>
                </div>
                <div className="verify-confidence-label">Confidence</div>
              </div>
            </div>

            {/* Category scores */}
            {displayResult.scores && (
              <div className="verify-scores-grid">
                {[
                  ["Document Type", displayResult.scores.documentType, "30%"],
                  ["Institution", displayResult.scores.institution, "25%"],
                  [
                    "Personal Details",
                    displayResult.scores.personalDetails,
                    "30%",
                  ],
                  ["Image Quality", displayResult.scores.quality, "15%"],
                ].map(([name, val, weight]) => (
                  <div className="verify-score-item" key={name}>
                    <div className="verify-score-row">
                      <span className="verify-score-name">
                        {name}{" "}
                        <span style={{ opacity: 0.5 }}>·{weight}</span>
                      </span>
                      <span
                        className="verify-score-val"
                        style={{ color: scoreColor(val) }}
                      >
                        {val}
                      </span>
                    </div>
                    <ScoreBar value={val} />
                  </div>
                ))}
              </div>
            )}

            {/* Detail rows */}
            <div className="verify-detail-row">
              <span className="verify-detail-label">Name Submitted</span>
              <span className="verify-detail-val">
                {form.name || user?.name || "—"}
              </span>
            </div>
            {displayResult.nameMatch !== undefined && (
              <div className="verify-detail-row">
                <span className="verify-detail-label">Name Match</span>
                <span
                  className={`verify-tag ${displayResult.nameMatch ? "match" : "no-match"}`}
                >
                  {displayResult.nameMatch ? "✓ Match" : "✕ No Match"}
                </span>
              </div>
            )}
            <div className="verify-detail-row">
              <span className="verify-detail-label">Department</span>
              <span className="verify-detail-val">
                {form.department || user?.department || "—"}
              </span>
            </div>
            <div className="verify-detail-row">
              <span className="verify-detail-label">Role</span>
              <span className="verify-detail-val">
                {form.role || user?.role || "—"}
              </span>
            </div>

            {/* Reason */}
            {displayResult.reason && (
              <div className="verify-reason-box">
                <div className="verify-reason-label">Analysis</div>
                {displayResult.reason}
              </div>
            )}

            {/* Extracted text */}
            {displayResult.extractedText && (
              <div>
                <div
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    color: "var(--v-muted)",
                    marginTop: 16,
                    marginBottom: 6,
                  }}
                >
                  Extracted Text
                </div>
                <div className="verify-extracted-text">
                  {displayResult.extractedText}
                </div>
              </div>
            )}

            {inlineResult && (
              <button className="verify-reset-btn" onClick={resetInline}>
                ↩ Dismiss Results
              </button>
            )}
          </div>
        )}

        {/* ───── Upload Form (hide if verified, pending, or submitting) ───── */}
        {currentStatus !== "verified" &&
          currentStatus !== "pending" &&
          !submitting && (
            <>
              <div className="verify-card">
                <div className="verify-card-title">Personal Information</div>
                <div className="verify-form-grid">
                  <div className="verify-form-group full">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="As shown on your ID"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="verify-form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={form.department}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          department: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="verify-form-group">
                    <label>Role</label>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, role: e.target.value }))
                      }
                    >
                      <option>Student</option>
                      <option>Alumni</option>
                      <option>Faculty</option>
                      <option>Staff</option>
                      <option>Researcher</option>
                    </select>
                  </div>
                  <div className="verify-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="verify-card">
                <div className="verify-card-title">Upload ID Document</div>
                <div
                  className={`verify-upload-zone ${dragOver ? "drag-over" : ""} ${imagePreview ? "has-image" : ""}`}
                  onClick={() => !imagePreview && fileRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <>
                      {imagePreview === "pdf" ? (
                        <div className="verify-pdf-preview">
                          <div className="verify-pdf-icon">📄</div>
                          <div className="verify-pdf-name">{file?.name}</div>
                        </div>
                      ) : (
                        <img
                          src={imagePreview}
                          className="verify-preview-img"
                          alt="ID Preview"
                        />
                      )}
                      <div className="verify-preview-overlay">
                        <button
                          className="verify-change-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileRef.current.click();
                          }}
                        >
                          Change File
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="verify-upload-icon">🪪</div>
                      <div className="verify-upload-text">
                        Drag & drop your ID card here, or{" "}
                        <strong onClick={() => fileRef.current.click()}>
                          browse files
                        </strong>
                        <br />
                        JPG, PNG, WEBP, PDF supported · Max 5 MB
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              <button
                className="verify-submit-btn"
                onClick={submit}
                disabled={!file || !form.name.trim()}
              >
                {!form.name.trim()
                  ? "Enter your name to continue"
                  : !file
                    ? "Upload ID to continue"
                    : "Verify Identity →"}
              </button>
            </>
          )}
      </div>
    </div>
  );
}
