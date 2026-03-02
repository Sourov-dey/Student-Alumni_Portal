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

  // --- 3D Glassmorphism Styles ---
  const cardStyle = {
    width: "100%",
    maxWidth: "480px",
    padding: "40px",
    background: "rgba(255, 255, 255, 0.07)",
    backdropFilter: "blur(20px) saturate(160%)",
    WebkitBackdropFilter: "blur(20px) saturate(160%)",
    borderRadius: "32px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: `
      0 20px 40px rgba(0, 0, 0, 0.3),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1)
    `,
    display: "flex",
    flexDirection: "column",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(0, 0, 0, 0.2)",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: "0.85rem",
    letterSpacing: "0.3px",
    paddingLeft: "4px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, #2563eb, #1e3a8a, #0f172a)", // Deep 3D Space Gradient
        padding: "24px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: "800",
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Join the Network
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.95rem",
              marginTop: "8px",
            }}
          >
            Assam University Alumni-Student Portal
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} noValidate>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.4)";
                  e.target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "rgba(0, 0, 0, 0.2)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>I am a...</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  cursor: "pointer",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  backgroundSize: "18px",
                }}
              >
                <option value="student" style={{ color: "#000" }}>
                  Current Student
                </option>
                <option value="alumni" style={{ color: "#000" }}>
                  Alumni
                </option>
                <option value="admin" style={{ color: "#000" }}>
                  Admin
                </option>
                <option value="faculty" style={{ color: "#000" }}>
                  Faculty
                </option>
                <option value="researcher" style={{ color: "#000" }}>
                  Researcher
                </option>
              </select>
            </div>

            {formData.role === "admin" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Admin Secret Code</label>
                <input
                  type="password"
                  name="adminSecret"
                  value={formData.adminSecret}
                  onChange={handleChange}
                  placeholder="Enter admin secret code"
                  style={{
                    ...inputStyle,
                    borderColor: "rgba(251, 191, 36, 0.4)",
                  }}
                  onFocus={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.1)";
                    e.target.style.borderColor = "rgba(251, 191, 36, 0.6)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(251, 191, 36, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "rgba(0, 0, 0, 0.2)";
                    e.target.style.borderColor = "rgba(251, 191, 36, 0.4)";
                    e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                  }}
                />
                <p
                  style={{
                    color: "rgba(251, 191, 36, 0.8)",
                    fontSize: "0.75rem",
                    marginTop: "6px",
                    paddingLeft: "4px",
                  }}
                >
                  ⚠️ Admin access requires a secret code from the portal administrator.
                </p>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "28px",
              }}
            >
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={(token) => setCaptchaToken(token)}
                theme="dark"
              />
            </div>

            {error && (
              <div
                style={{
                  color: "#fda4af",
                  background: "rgba(159, 18, 57, 0.4)",
                  padding: "12px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  border: "1px solid rgba(251, 113, 133, 0.3)",
                  animation: "shake 0.2s ease-in-out",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                background: loading
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
                color: loading ? "#94a3b8" : "#1e3a8a",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "1rem",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "scale(1.02) translateY(-2px)";
                  e.target.style.boxShadow = "0 15px 30px rgba(0,0,0,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "scale(1) translateY(0)";
                  e.target.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
                }
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Setting up...
                </span>
              ) : (
                "Continue & Send OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Enter 6-digit OTP</label>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.85rem", marginBottom: "12px", textAlign: "center" }}>
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
                style={{
                  ...inputStyle,
                  textAlign: "center",
                  fontSize: "1.5rem",
                  letterSpacing: "4px",
                  fontWeight: "bold"
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  color: "#fda4af",
                  background: "rgba(159, 18, 57, 0.4)",
                  padding: "12px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  border: "1px solid rgba(251, 113, 133, 0.3)",
                  animation: "shake 0.2s ease-in-out",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                background: loading
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
                color: loading ? "#94a3b8" : "#1e3a8a",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "1rem",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "scale(1.02) translateY(-2px)";
                  e.target.style.boxShadow = "0 15px 30px rgba(0,0,0,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "scale(1) translateY(0)";
                  e.target.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
                }
              }}
            >
              {loading ? "Creating Account..." : "Verify & Create Account"}
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
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "0.9rem",
                display: "block",
                width: "100%",
                marginTop: "16px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Back to Sign Up Details
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "0.9rem",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontWeight: "600",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            Sign In
          </Link>
        </div>
      </div>

      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          input::placeholder { color: rgba(255,255,255,0.3); }
        `}
      </style>
    </div>
  );
}
