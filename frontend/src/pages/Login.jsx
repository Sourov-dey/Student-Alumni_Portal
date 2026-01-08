// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await http.post('/api/auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });

      const { token, user } = response.data;
      if (!token || !user) {
        setError('Login failed. Please try again.');
        return;
      }

      login(token, user);
      navigate('/jobs');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Styles based on your uploaded screenshot
  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e4aba 0%, #102a7a 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '20px'
    },
    card: {
      width: '100%',
      maxWidth: '440px',
      backgroundColor: '#2557d6', // Bright blue from screenshot
      borderRadius: '24px',
      padding: '40px 32px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    headerText: {
      color: '#ffffff',
      fontSize: '28px',
      fontWeight: '700',
      textAlign: 'center',
      margin: '0 0 4px 0'
    },
    subHeaderText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '14px',
      textAlign: 'center',
      marginBottom: '32px'
    },
    label: {
      display: 'block',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '8px',
      marginLeft: '4px'
    },
    inputField: {
      width: '100%',
      padding: '14px 16px',
      marginBottom: '20px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: '#1a41a8', // Darker blue for "inset" look
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', // 3D Inset effect
      color: '#ffffff',
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box'
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      marginTop: '10px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: loading ? '#d1d5db' : '#eef2ff', // Light grayish-white button
      color: '#1e4aba',
      fontSize: '16px',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    },
    footerLink: {
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.8)'
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h1 style={styles.headerText}>Welcome Back</h1>
        <p style={styles.subHeaderText}>Assam University Alumni-Student Portal</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              style={styles.inputField}
              required
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••"
              style={styles.inputField}
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#ff8a8a', 
              fontSize: '13px', 
              marginBottom: '16px', 
              textAlign: 'center',
              fontWeight: '500' 
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={styles.submitBtn}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#ffffff')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#eef2ff')}
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footerLink}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#ffffff', fontWeight: '700', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}