import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    adminSecret: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // New States for step 2 details
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ReCAPTCHA keys
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  // --- Logic (Unchanged) ---
  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const UNI_DOMAIN = "aus.ac.in";
  const isUniEmail = (addr) =>
    addr && addr.toLowerCase().endsWith(`@${UNI_DOMAIN}`);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!formData.email || !isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Please enter a password");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!captchaToken) {
      setError("Please verify that you are a human");
      return false;
    }
    return true;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError("");

    try {
      const res = await http.post("/api/auth/send-otp", {
        email: formData.email.toLowerCase().trim(),
        captchaToken,
      });
      setStep(2);
      setError("");
      // In dev mode (no SMTP), auto-fill OTP from response
      if (res.data.devOtp) {
        setOtp(res.data.devOtp);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to send OTP. Please try again."
      );
      // Reset captcha on failure so they can try again
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP sent to your email");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        otp,
      };
      if (formData.role === "admin") {
        payload.adminSecret = formData.adminSecret;
      }
      const response = await http.post("/api/auth/signup", payload);

      const { token, user } = response.data;
      if (!token || !user) {
        setError("Registration failed. Please try again.");
        return;
      }
      login(token, user);
      if (!isUniEmail(formData.email) && !user.verified) {
        navigate("/verify-id");
      } else {
        navigate("/jobs");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-header">
          <h1 className="auth-title">Join the Network</h1>
          <p className="auth-subtitle">
            Assam University Alumni-Student Portal
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">I am a...</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
              >
                <option value="student">Current Student</option>
                <option value="alumni">Alumni</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === "admin" && (
              <div className="form-group">
                <label className="form-label">Admin Secret Code</label>
                <input
                  type="password"
                  name="adminSecret"
                  value={formData.adminSecret}
                  onChange={handleChange}
                  placeholder="Enter admin secret code"
                  className="form-input"
                  style={{ borderColor: 'var(--warning)', boxShadow: '0 0 0 1px var(--warning-bg)' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem' }}>
                  ⚠️ Admin access requires a secret code from the portal administrator.
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Confirm</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Setting up...
                </>
              ) : (
                "Continue & Send OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', fontSize: '1rem' }}>Enter 6-digit OTP</label>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem", textAlign: "center" }}>
                We sent a verification code to <strong>{formData.email}</strong>
              </p>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError("");
                }}
                placeholder="123456"
                className="form-input"
                style={{
                  textAlign: "center",
                  fontSize: "1.5rem",
                  letterSpacing: "0.5rem",
                  fontWeight: "bold",
                  padding: "1rem"
                }}
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                "Verify & Create Account"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setCaptchaToken("");
                if (recaptchaRef.current) recaptchaRef.current.reset();
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                display: "block",
                width: "100%",
                marginTop: "1rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Back to Sign Up Details
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
