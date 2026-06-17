import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { getPasswordStrength } from '../utils/passwordStrength';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    setStatus('loading');

    try {
      const res = await http.post(
        `/api/auth/reset-password/${token}`,
        { password }
      );

      // 🔐 Auto-login after reset
      if (res.data.token && res.data.user) {
        login(res.data.token, res.data.user);
        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/jobs');
        }
        return;
      }

      setStatus('success');
      setMessage('Password updated. Redirecting to login…');

      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus('error');
      setMessage(
        err?.response?.data?.message || 'Invalid or expired reset link'
      );
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="password"
            placeholder="New password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {password && (
            <div
              style={{
                fontSize: '0.85rem',
                color: strength.color,
                marginBottom: '8px',
              }}
            >
              Strength: {strength.label}
            </div>
          )}

          <input
            type="password"
            placeholder="Confirm new password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {status === 'error' && (
            <div className="error-message">{message}</div>
          )}
          {status === 'success' && (
            <div className="success-message">{message}</div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Updating…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
