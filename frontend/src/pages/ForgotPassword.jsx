import { useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http';
import '../styles/auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await http.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      setStatus('success');
      setMessage(
        res.data.message ||
          'If the email exists, a reset link has been sent.'
      );
    } catch {
      setStatus('error');
      setMessage('Unable to send reset link. Please try again.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">
          We’ll send you a link to reset your password
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Enter your email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
          />

          {status === 'success' && (
            <div className="success-message">{message}</div>
          )}

          {status === 'error' && (
            <div className="error-message">{message}</div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
