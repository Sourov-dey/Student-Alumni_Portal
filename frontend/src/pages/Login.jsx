
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';


export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

      // Log the user in
      login(token, user);

      // Navigate to appropriate page
      navigate('/jobs');
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 480, 
      padding: 20, 
      margin: '80px auto',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 8, color: '#1f2937' }}>
        Welcome Back
      </h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 24, fontSize: '0.9em' }}>
        Sign in to your account
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            autoComplete="email"
            autoFocus
            required
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: 6, 
              border: '1px solid #d1d5db',
              fontSize: '0.95em',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 6, 
            fontWeight: 500, 
            color: '#374151',
            fontSize: '0.9em'
          }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: 6, 
              border: '1px solid #d1d5db',
              fontSize: '0.95em',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            color: '#dc2626', 
            background: '#fef2f2',
            padding: '12px',
            borderRadius: 6,
            marginBottom: 16, 
            fontSize: '0.9em',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 6,
            background: loading ? '#9ca3af' : '#2563eb',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '1em',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = '#1d4ed8')}
          onMouseLeave={(e) => !loading && (e.target.style.background = '#2563eb')}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Signup Link */}
      <div style={{ 
        marginTop: 24, 
        textAlign: 'center', 
        color: '#6b7280',
        fontSize: '0.9em'
      }}>
        Don't have an account?{' '}
        <Link 
          to="/signup" 
          style={{ 
            color: '#2563eb', 
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}