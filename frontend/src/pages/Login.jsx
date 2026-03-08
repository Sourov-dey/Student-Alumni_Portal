import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!captchaToken) {
      setError("Please verify that you are a human");
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for:', email);

      const response = await http.post('/api/auth/login', {
        email: email,
        password: password,
        captchaToken: captchaToken
      });

      console.log('✅ Login response received:', response.data);

      const { token, user } = response.data;

      // Validate response data
      if (!token) {
        console.error('❌ No token received from server');
        setError('Login failed: Invalid server response');
        return;
      }

      if (!user || !user._id) {
        console.error('❌ No user data received from server');
        setError('Login failed: Invalid user data');
        return;
      }

      console.log('✅ Login successful for user:', user.email);

      // Store credentials and navigate
      login(token, user);
      navigate('/jobs');
    } catch (err) {
      console.error('❌ Login error:', err);

      // Handle different error scenarios
      if (err.response) {
        // Server responded with an error
        const status = err.response.status;
        const message = err.response.data?.message;

        if (status === 401) {
          setError('Invalid email or password');
        } else if (status === 403) {
          setError(message || 'Your account has been suspended. Please contact an administrator.');
        } else if (status === 404) {
          setError('Account not found. Please sign up first.');
        } else if (status === 400) {
          setError(message || 'Invalid login credentials');
        } else if (status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(message || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        // Request made but no response
        setError('Network error. Please check your connection.');
      } else {
        // Something else happened
        setError('An unexpected error occurred. Please try again.');
      }

      // Reset captcha on failure
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle" style={{ color: "black" }}>
            Assam University Alumni-Student Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className="form-input"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="form-input"
              autoComplete="current-password"
              disabled={loading}
              required
            />
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
                Processing...
              </>
            ) : (
              'Sign In'
            )}
          </button>
          <div className="auth-footer">
            <Link to="/forgot-password" style={{ color: "#000000" }}>
              Forgot your password?
            </Link>
          </div>
        </form>

        <div className="auth-footer"
          style={{ color: "#000000" }}
        >
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
